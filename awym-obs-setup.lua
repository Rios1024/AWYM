--[[
  OBS AUTOMATIC SETUP for the overlay kit
  ---------------------------------------
  How to use (one time):
    1. In OBS: Tools → Scripts → click "+" → pick THIS file (awym-obs-setup.lua)
       from the overlay folder. (Keep the folder where it is; OBS uses it.)
    2. On the right, choose how many people are on the show and what to add.
    3. Click "Build my scenes".
  It creates the scenes and every overlay (with the right addresses, sizes and
  positions). Scenes that already exist are left alone, so it's safe to click
  again.

  HOTKEYS: keep this script in the list. It also adds the kit's actions to
  OBS → Settings → Hotkeys ("AWYM: Next segment", "AWYM: Clear screen",
  "AWYM: Sound: Air horn", …) so a keyboard or stream-deck key can trigger
  them. Remove the script and those hotkeys go away (the scenes stay).

  If Main Show already exists, the script can still add any overlays it's
  missing (new ones from kit updates) without touching anything else.

  The five control docks still need adding by hand (OBS doesn't let scripts do
  that). Their addresses are shown in the script panel, ready to copy.
]]

obs = obslua

--- Options chosen in the script panel (filled in by script_update).
local cfg = { people = 2, frames = true, screens = true, halftime = true, clock = true, stats = true, content = true,
              runner = true, update = true, status = "",
              guest_room = "", guest_pass = "", guest_seats = "" }

--- The kit's hotkey actions: { id, name in OBS Settings → Hotkeys, suggested key }.
-- Same ids as hotkeys.js (keep them in step). Suggested keys are used with
-- Ctrl + Alt + Shift, and are only filled in the first time (never over your own).
local HOTKEYS = {
  { "next", "Next segment", "N" }, { "prev", "Previous segment", "P" }, { "clear", "Clear screen", "X" },
  { "clock-toggle", "Shot clock start/pause", "S" }, { "clock-reset", "Shot clock reset", "R" },
  { "clock-buzz", "Shot clock buzzer", "Z" }, { "clock-foil", "Tin Foil alert", "T" }, { "clock-hide", "Shot clock show/hide", "K" },
  { "score-a", "Side A +1", "Q" }, { "score-b", "Side B +1", "W" }, { "score-show", "Show/hide scoreboard", "E" }, { "winner", "Declare winner", "Y" },
  { "snd-airhorn", "Sound: Air horn", "F1" }, { "snd-buzzer", "Sound: Buzzer", "F2" }, { "snd-ding", "Sound: Correct", "F3" },
  { "snd-wrong", "Sound: Wrong", "F4" }, { "snd-rimshot", "Sound: Rimshot", "F5" }, { "snd-drumroll", "Sound: Drumroll", "F6" },
  { "snd-ooh", "Sound: Crowd ooh", "F7" }, { "snd-applause", "Sound: Applause", "F8" }, { "snd-chaching", "Sound: Cha-ching", "F9" },
  { "snd-sadtrombone", "Sound: Sad trombone", "F10" }, { "snd-scratch", "Sound: Record scratch", "F11" }, { "snd-swoosh", "Sound: Swoosh", "F12" },
  { "snd-whistle", "Sound: Whistle", "6" }, { "snd-gong", "Sound: Gong", "7" }, { "snd-boing", "Sound: Boing", "8" },
  { "snd-micdrop", "Sound: Mic drop", "9" }, { "snd-tinfoil", "Sound: Tin Foil sound", "0" },
  { "lt-1", "Lower third 1 show/hide", "1" }, { "lt-2", "Lower third 2 show/hide", "2" }, { "lt-3", "Lower third 3 show/hide", "3" },
  { "lt-4", "Lower third 4 show/hide", "4" }, { "lt-hide", "Hide all lower thirds", "5" },
  { "save-clip", "Save clip", "C" }, { "replay", "Instant replay", "V" }, { "mark", "Mark moment", "M" },
  { "hide-stats", "Hide stats card", "G" }, { "hide-text", "Hide on-screen text", "H" },
  { "fx-fire", "Frame effect: Fire", "F" }, { "fx-ice", "Frame effect: Ice", "I" }, { "fx-zap", "Frame effect: Lightning", "L" },
  { "fx-smoke", "Frame effect: Smoke", "O" }, { "fx-sparks", "Frame effect: Sparks", "A" }, { "fx-shake", "Frame effect: Shake", "B" },
  { "fx-stop", "Stop frame effects", "U" },
  { "mute-1", "Mute seat 1 on/off", "BRACKETLEFT" }, { "mute-2", "Mute seat 2 on/off", "BRACKETRIGHT" },
  { "mute-3", "Mute seat 3 on/off", "SEMICOLON" }, { "mute-4", "Mute seat 4 on/off", "APOSTROPHE" },
  { "unmute-all", "Unmute everyone", "BACKSLASH" }
}
local hotkey_ids = {}     -- action id → OBS hotkey id
local presses = 0
--- Every source this script creates is named "AWYM …" so it's easy to find and won't clash.
local PREFIX = "AWYM "

---------------------------------------------------------------- addresses
--- The overlay folder (where this script lives), with forward slashes and a trailing "/".
-- @return string  e.g. "C:/Users/You/Documents/awym-obs/"
local function folder()
  local p = script_path() or ""
  p = p:gsub("\\", "/")
  if p:sub(-1) ~= "/" then p = p .. "/" end
  return p
end

-- percent-encode everything except safe characters (keeps / and the drive colon)
--- Percent-encode text for a web address (spaces → %20, "é" → %C3%A9).
-- @param s     string to encode
-- @param keep  extra characters to leave as-is (e.g. "/:" for paths)
-- @return string
local function enc(s, keep)
  keep = keep or ""
  return (s:gsub("[^%w%-%._~" .. keep .. "]", function(c) return string.format("%%%02X", string.byte(c)) end))
end

--- The overlay folder as a file:/// address (e.g. file:///C:/Users/Your%20Name/Documents/awym-obs/).
local function base_url()
  local p = enc(folder(), "/:")
  if p:sub(1, 1) ~= "/" then p = "/" .. p end      -- C:/... → /C:/...
  return "file://" .. p
end

-- url("screen.html", { {"type","brb"}, {"minutes","5"} })  (ordered pairs keep addresses tidy)
--- Full address for one of the kit's pages.
-- @param file    page name, e.g. "screen.html"
-- @param params  ordered list of {name, value} pairs; empty values are skipped
-- @return string
local function url(file, params)
  local u = base_url() .. file
  if params and #params > 0 then
    local parts = {}
    for _, kv in ipairs(params) do
      if kv[2] ~= nil and kv[2] ~= "" then parts[#parts + 1] = kv[1] .. "=" .. enc(tostring(kv[2])) end
    end
    if #parts > 0 then u = u .. "?" .. table.concat(parts, "&") end
  end
  return u
end

---------------------------------------------------------------- OBS helpers
--- OBS's base canvas size (falls back to 1920×1080 if it can't be read).
-- @return width, height
local function canvas()
  local w, h = 1920, 1080
  local ok = pcall(function()
    local ovi = obs.obs_video_info()
    if obs.obs_get_video_info(ovi) and ovi.base_width > 0 and ovi.base_height > 0 then
      w, h = ovi.base_width, ovi.base_height
    end
  end)
  return w, h
end

--- Write a line to the script log (Tools → Scripts → Script Log).
local function log(msg) obs.script_log(obs.LOG_INFO, msg) end

-- returns a browser source (new, or the existing one with that name); caller releases it
--- Create a Browser source, or reuse the existing one with the same name.
-- The caller must release the returned source with obs_source_release.
-- @param name     name without the "AWYM " prefix
-- @param address  file:/// address (Local file is turned off so the docks can reach it)
-- @param w, h     the page's design size in pixels
-- @param opts     { audio = true } routes sound through OBS; { restart = true } reloads the
--                 page whenever its scene becomes active (restarts countdowns)
-- @return obs_source_t or nil
local function browser(name, address, w, h, opts)
  opts = opts or {}
  local existing = obs.obs_get_source_by_name(PREFIX .. name)
  if existing ~= nil then return existing end
  local s = obs.obs_data_create()
  obs.obs_data_set_string(s, "url", address)
  obs.obs_data_set_bool(s, "is_local_file", false)
  obs.obs_data_set_int(s, "width", w)
  obs.obs_data_set_int(s, "height", h)
  if opts.audio then obs.obs_data_set_bool(s, "reroute_audio", true) end
  if opts.restart then obs.obs_data_set_bool(s, "restart_when_active", true) end
  local src = obs.obs_source_create("browser_source", PREFIX .. name, s, nil)
  obs.obs_data_release(s)
  return src
end

--- Create the hidden Media Source the Show Runner plays instant replays in (or reuse it).
-- The Show Runner fills in the clip file when you press Instant replay.
-- @return obs_source_t or nil (caller releases)
local function replay_source(name)
  local existing = obs.obs_get_source_by_name(PREFIX .. name)
  if existing ~= nil then return existing end
  local s = obs.obs_data_create()
  obs.obs_data_set_bool(s, "is_local_file", true)
  obs.obs_data_set_string(s, "local_file", "")
  obs.obs_data_set_bool(s, "looping", false)
  obs.obs_data_set_bool(s, "restart_on_activate", true)
  obs.obs_data_set_bool(s, "close_when_inactive", true)
  obs.obs_data_set_bool(s, "clear_on_media_end", true)
  local src = obs.obs_source_create("ffmpeg_source", PREFIX .. name, s, nil)
  obs.obs_data_release(s)
  return src
end

-- add a source to a scene, fitted inside the box (x, y, bw, bh) in canvas pixels
--- Add a source to a scene, scaled to fit inside a box (keeps its shape).
-- New items go to the top of the Sources list, so add the bottom layer first.
-- @param x, y, bw, bh  box in canvas pixels · @param locked  lock it in place
-- @return obs_sceneitem_t or nil
local function place(scene, src, x, y, bw, bh, locked)
  local item = obs.obs_scene_add(scene, src)
  if item == nil then return nil end
  local pos = obs.vec2(); pos.x = x; pos.y = y
  obs.obs_sceneitem_set_pos(item, pos)
  obs.obs_sceneitem_set_bounds_type(item, obs.OBS_BOUNDS_SCALE_INNER)
  local b = obs.vec2(); b.x = bw; b.y = bh
  obs.obs_sceneitem_set_bounds(item, b)
  if locked then obs.obs_sceneitem_set_locked(item, true) end
  return item
end

-- create a scene unless one with that name already exists
--- Create a scene, unless one with that name already exists (then nothing is touched).
-- The caller must release the returned scene with obs_scene_release.
-- @return obs_scene_t or nil
local function new_scene(name)
  local existing = obs.obs_get_source_by_name(name)
  if existing ~= nil then
    obs.obs_source_release(existing)
    return nil
  end
  return obs.obs_scene_create(name)
end

---------------------------------------------------------------- remote guests
-- VDO.Ninja links, built exactly like guests.html builds them (keep in step):
--   OBS address  https://vdo.ninja/?room=R&view=RseatN&solo[&password=P]

--- Room name as guests.html cleans it (lowercase letters and digits only).
local function guest_room()
  return (cfg.guest_room or ""):lower():gsub("[^a-z0-9]", ""):sub(1, 30)
end

--- Seats (People slots 1–4) that are remote guests, from text like "2, 3".
-- @return table of numbers
local function guest_seats()
  local out, seen = {}, {}
  for d in (cfg.guest_seats or ""):gmatch("%d") do
    local n = tonumber(d)
    if n >= 1 and n <= 4 and not seen[n] then seen[n] = true; out[#out + 1] = n end
  end
  table.sort(out)
  return out
end

--- The OBS address that shows one remote guest seat.
local function guest_view_url(n)
  local r = guest_room()
  local u = "https://vdo.ninja/?room=" .. r .. "&view=" .. r .. "seat" .. n .. "&solo"
  if cfg.guest_pass ~= nil and cfg.guest_pass ~= "" then u = u .. "&password=" .. enc(cfg.guest_pass) end
  return u
end

--- A filter on a source (made only if the source doesn't already have one by that name).
local function add_filter(src, kind, name, settings_fn)
  local existing = obs.obs_source_get_filter_by_name(src, name)
  if existing ~= nil then obs.obs_source_release(existing); return end
  local s = obs.obs_data_create()
  settings_fn(s)
  local flt = obs.obs_source_create_private(kind, name, s)
  obs.obs_data_release(s)
  if flt ~= nil then obs.obs_source_filter_add(src, flt); obs.obs_source_release(flt) end
end

--- One remote guest's Browser source (1280×720, its own audio), cropped square and
-- cut out with the circle mask, ready to sit behind a camera frame. Caller releases it.
local function guest_source(n)
  local src = browser("Guest Seat " .. n, guest_view_url(n), 1280, 720, { audio = true })
  if src == nil then return nil end
  add_filter(src, "crop_filter", "Square crop", function(s)
    obs.obs_data_set_bool(s, "relative", true)
    obs.obs_data_set_int(s, "left", 280); obs.obs_data_set_int(s, "right", 280)
    obs.obs_data_set_int(s, "top", 0); obs.obs_data_set_int(s, "bottom", 0)
  end)
  add_filter(src, "mask_filter", "Circle cutout", function(s)
    obs.obs_data_set_string(s, "type", "mask_alpha_filter.effect")
    obs.obs_data_set_string(s, "image_path", folder() .. "masks/circle-1x1.png")
  end)
  return src
end

---------------------------------------------------------------- frame effects layers
-- Each "AWYM Frame FX N" (frame-fx.html: fire, ice, lightning…) sits on top of
-- "AWYM Camera Frame N" in the same scene, 5/3 of the frame's size: the page is the
-- 600×660 frame with room around it for flames. A timer keeps it lined up with its
-- frame (position, size, rotation, shown/hidden), so the frame can be moved freely.
local FX_GROW = 5 / 3

--- Where a scene item's position point sits in its box (OBS alignment flags) → 0, 0.5 or 1.
local function align_frac(a)
  local ax, ay = 0.5, 0.5
  if a % 2 == 1 then ax = 0 elseif math.floor(a / 2) % 2 == 1 then ax = 1 end
  if math.floor(a / 4) % 2 == 1 then ay = 0 elseif math.floor(a / 8) % 2 == 1 then ay = 1 end
  return ax, ay
end

--- The size of a scene item's box on the canvas (its bounds, or its scaled size).
local function item_box(item)
  if obs.obs_sceneitem_get_bounds_type(item) ~= obs.OBS_BOUNDS_NONE then
    local b = obs.vec2(); obs.obs_sceneitem_get_bounds(item, b); return b.x, b.y, true
  end
  local sc = obs.vec2(); obs.obs_sceneitem_get_scale(item, sc)
  local src = obs.obs_sceneitem_get_source(item)
  return obs.obs_source_get_width(src) * math.abs(sc.x), obs.obs_source_get_height(src) * math.abs(sc.y), false
end

local function differs(a, b) return math.abs(a - b) > 0.05 end

--- Line one effects layer up with its camera frame (only touches what changed).
local function fx_line_up(fx, fr)
  local bw, bh, has_bounds = item_box(fr)
  if bw <= 0 or bh <= 0 then return end
  local p = obs.vec2(); obs.obs_sceneitem_get_pos(fr, p)
  local rot = obs.obs_sceneitem_get_rot(fr)
  local align = obs.obs_sceneitem_get_alignment(fr)
  local ax, ay = align_frac(align)
  -- the effects box is the frame box grown by 200/600 each side and 200/660 on top
  local dx, dy = bw * (2 * ax / 3 - 1 / 3), bh * (2 * ay / 3 - 10 / 33)
  local r = math.rad(rot)
  local tx, ty = p.x + dx * math.cos(r) - dy * math.sin(r), p.y + dx * math.sin(r) + dy * math.cos(r)

  local cur = obs.vec2(); obs.obs_sceneitem_get_pos(fx, cur)
  if differs(cur.x, tx) or differs(cur.y, ty) then local v = obs.vec2(); v.x = tx; v.y = ty; obs.obs_sceneitem_set_pos(fx, v) end
  if differs(obs.obs_sceneitem_get_rot(fx), rot) then obs.obs_sceneitem_set_rot(fx, rot) end
  if obs.obs_sceneitem_get_alignment(fx) ~= align then obs.obs_sceneitem_set_alignment(fx, align) end
  if obs.obs_sceneitem_get_bounds_type(fx) ~= obs.OBS_BOUNDS_SCALE_INNER then obs.obs_sceneitem_set_bounds_type(fx, obs.OBS_BOUNDS_SCALE_INNER) end
  local balign = has_bounds and obs.obs_sceneitem_get_bounds_alignment(fr) or 0
  if obs.obs_sceneitem_get_bounds_alignment(fx) ~= balign then obs.obs_sceneitem_set_bounds_alignment(fx, balign) end
  local cb = obs.vec2(); obs.obs_sceneitem_get_bounds(fx, cb)
  if differs(cb.x, bw * FX_GROW) or differs(cb.y, bh * FX_GROW) then
    local v = obs.vec2(); v.x = bw * FX_GROW; v.y = bh * FX_GROW; obs.obs_sceneitem_set_bounds(fx, v)
  end
  local vis = obs.obs_sceneitem_visible(fr)
  if obs.obs_sceneitem_visible(fx) ~= vis then obs.obs_sceneitem_set_visible(fx, vis) end
end

--- Which seat a scene item is a camera frame or an effects layer for, from its
-- Browser source address (frame.html?id=2 / frame-fx.html?id=2), whatever the
-- source is called. Cached by source name; the cache is emptied every few seconds.
-- @return "frame" | "fx" | nil, seat number
local url_cache, url_cache_age = {}, 0
local function frame_kind(item)
  local src = obs.obs_sceneitem_get_source(item)
  if src == nil then return nil end
  local name = obs.obs_source_get_name(src)
  local hit = url_cache[name]
  if hit == nil then
    hit = false
    if obs.obs_source_get_unversioned_id(src) == "browser_source" then
      local st = obs.obs_source_get_settings(src)
      local u = obs.obs_data_get_string(st, "url") or ""
      obs.obs_data_release(st)
      local file, query = u:match("([%w%-]+)%.html%??([^#]*)")
      if file == "frame" or file == "frame-fx" then
        local seat = tonumber((query or ""):match("[?&]?id=(%d+)") or "1")
        hit = { file == "frame" and "frame" or "fx", seat }
      end
    end
    url_cache[name] = hit
  end
  if not hit then return nil end
  return hit[1], hit[2]
end

--- Every camera frame and effects layer in a scene, inside groups too, sorted by the
-- scene or group they sit in: { [scene or group name] = { scene = obs_scene_t,
--   frame = { [seat] = item }, fx = { [seat] = { items } } } }
local function frame_items(scene)
  local found = {}
  local function walk(sc)
    local items = obs.obs_scene_enum_items(sc)
    if items == nil then return end
    local key = obs.obs_source_get_name(obs.obs_scene_get_source(sc))
    for _, it in ipairs(items) do
      if obs.obs_sceneitem_is_group(it) then
        local g = obs.obs_sceneitem_group_get_scene(it)
        if g ~= nil then walk(g) end
      else
        local kind, seat = frame_kind(it)
        if kind ~= nil then
          local box = found[key] or { scene = sc, frame = {}, fx = {} }
          found[key] = box
          if kind == "frame" then box.frame[seat] = box.frame[seat] or it
          else box.fx[seat] = box.fx[seat] or {}; table.insert(box.fx[seat], it) end
        end
      end
    end
    obs.sceneitem_list_release(items)
  end
  walk(scene)
  return found
end

--- Timer: keep every scene's effects layers lined up with their frames
-- (an effects layer follows the frame with the same id in the same scene or group).
local function fx_follow()
  url_cache_age = url_cache_age + 1
  if url_cache_age >= 20 then url_cache, url_cache_age = {}, 0 end   -- notice renamed / re-pointed sources
  local scenes = obs.obs_frontend_get_scenes()
  if scenes == nil then return end
  for _, s in ipairs(scenes) do
    local sc = obs.obs_scene_from_source(s)
    if sc ~= nil then
      for _, box in pairs(frame_items(sc)) do
        for seat, list in pairs(box.fx) do
          local fr = box.frame[seat]
          if fr ~= nil then for _, fx in ipairs(list) do fx_line_up(fx, fr) end end
        end
      end
    end
  end
  obs.source_list_release(scenes)
end

--- The effects layer source for seat n (or the existing one). Caller releases it.
local function fx_source(n)
  return browser("Frame FX " .. n, url("frame-fx.html", { { "id", tostring(n) } }), 1000, 1100)
end

---------------------------------------------------------------- the build
--- Build everything: Starting Soon, Main Show (background, frames, lower thirds,
-- shot clock, instant replay, on-screen text, stats, debate graphics, sound effects),
-- Be Right Back, Technical Difficulties, Halftime and
-- Thanks for Watching. The 1920×1080 layout is scaled to the canvas. Existing
-- scenes are skipped. Every reference taken is released.
-- @return string  summary shown in the script panel
local function build()
  local W, H = canvas()
  local f = math.min(W / 1920, H / 1080)            -- scale the 1920×1080 layout to the canvas
  local made, skipped, notes = {}, {}, {}
  local main_source = nil

  local function full(scene, name, address, opts, locked)
    local src = browser(name, address, 1920, 1080, opts)
    if src ~= nil then place(scene, src, 0, 0, W, H, locked); obs.obs_source_release(src) end
  end

  -- the Show Runner's sources: instant replay (hidden until used), debate graphics, sound effects
  local function replay(scene)
    local src = replay_source("Instant Replay")
    if src ~= nil then
      local item = place(scene, src, 0, 0, W, H)
      if item ~= nil then obs.obs_sceneitem_set_visible(item, false) end
      obs.obs_source_release(src)
    end
  end
  local function sounds(scene)
    local src = browser("Sound Effects", url("sfx.html"), 100, 100, { audio = true })
    if src ~= nil then place(scene, src, 0, 0, 100 * f, 100 * f); obs.obs_source_release(src) end
  end

  -- Overlays Main Show should have (bottom layer first), for adding to an existing Main Show.
  -- Each: { source name, function that adds it }
  local extras = {}
  if cfg.runner then extras[#extras + 1] = { "Instant Replay", replay } end
  if cfg.content then extras[#extras + 1] = { "On-Screen Text", function(sc) full(sc, "On-Screen Text", url("content.html")) end } end
  if cfg.stats then extras[#extras + 1] = { "Stats Overlay", function(sc) full(sc, "Stats Overlay", url("stats-card.html")) end } end
  if cfg.runner then
    extras[#extras + 1] = { "Debate Overlay", function(sc) full(sc, "Debate Overlay", url("debate.html")) end }
    extras[#extras + 1] = { "Sound Effects", sounds }
  end
  -- the hotkey relay (invisible): hotkeys.html, see "hotkeys" below
  extras[#extras + 1] = { "Hotkeys", function(sc)
    local src = browser("Hotkeys", url("hotkeys.html"), 16, 16)
    if src ~= nil then place(sc, src, 0, 0, 16 * f, 16 * f); obs.obs_source_release(src) end
  end }

  local function screen_scene(scene_name, src_name, params, restart)
    local sc = new_scene(scene_name)
    if sc == nil then skipped[#skipped + 1] = scene_name; return end
    full(sc, src_name, url("screen.html", params), { restart = restart })
    made[#made + 1] = scene_name
    obs.obs_scene_release(sc)
  end

  -- Scenes are created in show order, so they appear in that order in the Scenes list.
  if cfg.screens then
    screen_scene("Starting Soon", "Starting Soon Screen", { { "type", "starting" }, { "minutes", "5" } }, true)
  end

  -- Main Show: added bottom layer first, so the Sources list ends up in the right order
  local main = new_scene("Main Show")
  if main == nil then
    -- Main Show is already there: optionally add just the overlays it's missing
    local added = {}
    if cfg.update then
      local msrc = obs.obs_get_source_by_name("Main Show")
      if msrc ~= nil then
        local msc = obs.obs_scene_from_source(msrc)
        if msc ~= nil then
          for _, e in ipairs(extras) do
            if obs.obs_scene_find_source(msc, PREFIX .. e[1]) == nil then e[2](msc); added[#added + 1] = e[1] end
          end
          -- remote guests: under their camera frame (wherever you moved it), just above the background
          if guest_room() ~= "" then
            for _, seat in ipairs(guest_seats()) do
              if obs.obs_scene_find_source(msc, PREFIX .. "Guest Seat " .. seat) == nil then
                local src = guest_source(seat)
                if src ~= nil then
                  local x, y, size = 0, 0, 372 * f
                  local fr = obs.obs_scene_find_source(msc, PREFIX .. "Camera Frame " .. seat)
                  if fr ~= nil then
                    local p, b = obs.vec2(), obs.vec2()
                    obs.obs_sceneitem_get_pos(fr, p); obs.obs_sceneitem_get_bounds(fr, b)
                    local fwid = (b.x > 0) and b.x or 400 * f
                    x, y, size = p.x + fwid * 0.035, p.y + fwid * 0.035, fwid * 0.93
                  end
                  local item = place(msc, src, x, y, size, size)
                  if item ~= nil then
                    obs.obs_sceneitem_set_order(item, obs.OBS_ORDER_MOVE_BOTTOM)
                    obs.obs_sceneitem_set_order(item, obs.OBS_ORDER_MOVE_UP)
                  end
                  obs.obs_source_release(src)
                  added[#added + 1] = "Guest Seat " .. seat
                end
              end
            end
          end
          -- frame effects: one per camera frame (found by its address, also inside a group),
          -- added in the same scene or group right above the frame; the timer lines it up
          local boxes = frame_items(msc)
          local frames_found = 0
          for _, box in pairs(boxes) do
            for seat, fr in pairs(box.frame) do
              frames_found = frames_found + 1
              if box.fx[seat] == nil then
                local src = fx_source(seat)
                if src ~= nil then
                  local item = obs.obs_scene_add(box.scene, src)
                  if item ~= nil then
                    fx_line_up(item, fr)
                    if obs.obs_sceneitem_get_order_position ~= nil and obs.obs_sceneitem_set_order_position ~= nil then
                      obs.obs_sceneitem_set_order_position(item, obs.obs_sceneitem_get_order_position(fr) + 1)
                    end
                    added[#added + 1] = "Frame FX " .. seat
                  end
                  obs.obs_source_release(src)
                end
              end
            end
          end
          -- an effects layer whose frame isn't next to it (left behind when the frame was grouped): remove it
          for _, box in pairs(boxes) do
            for seat, list in pairs(box.fx) do
              if box.frame[seat] == nil then
                local elsewhere = false   -- that seat's frame is in another group / the scene itself
                for _, other in pairs(boxes) do if other.frame[seat] ~= nil then elsewhere = true end end
                if elsewhere then
                  for _, it in ipairs(list) do obs.obs_sceneitem_remove(it) end
                end
              end
            end
          end
          if frames_found == 0 then notes[#notes + 1] = "No camera frames (frame.html) in Main Show, so no frame effects were added." end
        end
        obs.obs_source_release(msrc)
      end
    end
    if #added > 0 then made[#made + 1] = "Main Show (added " .. table.concat(added, ", ") .. ")"
    else skipped[#skipped + 1] = "Main Show" end
  else
    full(main, "Background", url("background.html"), nil, true)

    local n = math.max(1, math.min(4, cfg.people))
    local fw, fh, gap = 400, 440, 60
    local x0 = (1920 - (n * fw + (n - 1) * gap)) / 2
    -- remote guests go under their camera frames (camera spot = frame + 3.5%, 93% wide)
    if guest_room() ~= "" then
      for _, seat in ipairs(guest_seats()) do
        if seat <= n then
          local src = guest_source(seat)
          if src ~= nil then
            local fx = x0 + (seat - 1) * (fw + gap)
            place(main, src, (fx + fw * 0.035) * f, (200 + fw * 0.035) * f, fw * 0.93 * f, fw * 0.93 * f)
            obs.obs_source_release(src)
          end
        end
      end
    end
    if cfg.frames then
      for i = 1, n do
        local src = browser("Camera Frame " .. i, url("frame.html", { { "id", tostring(i) } }), 600, 660)
        if src ~= nil then
          place(main, src, (x0 + (i - 1) * (fw + gap)) * f, 200 * f, fw * f, fh * f)
          obs.obs_source_release(src)
        end
      end
      -- an effects layer over each frame (5/3 its size, centred on the ring; it then follows the frame)
      for i = 1, n do
        local src = fx_source(i)
        if src ~= nil then
          place(main, src, (x0 + (i - 1) * (fw + gap) - fw / 3) * f, (200 - fw / 3) * f, fw * FX_GROW * f, fh * FX_GROW * f)
          obs.obs_source_release(src)
        end
      end
    end

    for i = 1, n do
      local side = (i % 2 == 0) and "right" or ""
      full(main, "Lower Third " .. i, url("lower-third.html", { { "id", tostring(i) }, { "side", side }, { "hidden", "1" } }))
    end

    if cfg.clock then
      local src = browser("Shot Clock", url("shot-clock.html", { { "time", "3:00" }, { "label", "Shot Clock" } }), 640, 320, { audio = true })
      if src ~= nil then place(main, src, (1920 - 360 - 40) * f, 40 * f, 360 * f, 180 * f); obs.obs_source_release(src) end
    end

    for _, e in ipairs(extras) do e[2](main) end   -- instant replay, on-screen text, stats, debate, sounds

    main_source = obs.obs_scene_get_source(main)
    made[#made + 1] = "Main Show"
  end

  if cfg.screens then
    screen_scene("Be Right Back", "Be Right Back Screen", { { "type", "brb" }, { "minutes", "5" } }, true)
    screen_scene("Technical Difficulties", "Technical Difficulties Screen", { { "type", "technical" } }, false)
    if cfg.halftime then
      screen_scene("Halftime", "Halftime Screen", { { "type", "halftime" }, { "minutes", "10" } }, true)
    end
    screen_scene("Thanks for Watching", "Thanks for Watching Screen", { { "type", "ending" } }, false)
  end

  if main_source ~= nil then obs.obs_frontend_set_current_scene(main_source) end
  if main ~= nil then obs.obs_scene_release(main) end

  local msg = ""
  if #made > 0 then msg = "Done! Created: " .. table.concat(made, ", ") .. "." end
  if #skipped > 0 then
    msg = msg .. (msg ~= "" and " " or "") .. "Already there, left alone: " .. table.concat(skipped, ", ") .. "."
  end
  if msg == "" then msg = "Nothing to do." end
  if #notes > 0 then msg = msg .. " " .. table.concat(notes, " ") end
  log(msg .. " (Folder: " .. folder() .. ")")
  return msg
end

---------------------------------------------------------------- script panel
-- ---------------------------------------------------------------------------
-- OBS script interface: OBS calls these functions itself.
--   script_description()   text at the top of the script panel
--   script_properties()    the controls in the panel
--   script_defaults(s)     default values for those controls
--   script_update(s)       called whenever a control changes
--   script_load(s)         called when the script is added / OBS starts
-- ---------------------------------------------------------------------------

function script_description()
  return [[<h3>Overlay kit: automatic setup</h3>
<p>Builds your scenes and adds every overlay with the right address, size and position.
Choose your options below, then click <b>Build my scenes</b>.</p>
<p>Scenes that already exist are left alone, so it's safe to click again.
If Main Show already exists, ticking "Add missing overlays" puts in just the new ones.
Afterwards, add the five docks by hand (addresses below):
<b>Docks → Custom Browser Docks…</b>, one row each, then Apply.</p>
<p><b>Hotkeys:</b> keep this script loaded. It adds "AWYM: …" actions to <b>Settings → Hotkeys</b>
(next segment, clear screen, shot clock, scores, sounds, names, clips) for your keyboard or stream deck.</p>
<p>Keep this folder where it is. If you move it, delete the AWYM sources and build again.</p>]]
end

--- "Build my scenes" button: run build() safely and show the result in the panel.
-- @return true so OBS redraws the panel (to show the new status text)
local function on_build(props, prop)
  local ok, result = pcall(build)
  cfg.status = ok and result or ("Something went wrong: " .. tostring(result))
  if not ok then obs.script_log(obs.LOG_WARNING, cfg.status) end
  local st = obs.obs_properties_get(props, "status")
  if st ~= nil then obs.obs_property_set_description(st, cfg.status) end
  return true
end

function script_properties()
  local p = obs.obs_properties_create()
  obs.obs_properties_add_int_slider(p, "people", "People on the show (lower thirds)", 1, 4, 1)
  obs.obs_properties_add_bool(p, "frames", "Add a camera frame for each person")
  obs.obs_properties_add_bool(p, "clock", "Add the shot clock")
  obs.obs_properties_add_bool(p, "stats", "Add the NBA stats overlay")
  obs.obs_properties_add_bool(p, "content", "Add the on-screen text overlay (Content Panel)")
  obs.obs_properties_add_bool(p, "runner", "Add the Show Runner overlays (debate graphics, sound effects, instant replay)")
  obs.obs_properties_add_bool(p, "update", "If Main Show already exists, add the overlays it's missing")
  obs.obs_properties_add_text(p, "guest_room", "Remote guests: room name (from guests.html)", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "guest_pass", "Remote guests: room password", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "guest_seats", "Remote guests: seats, e.g. 2,3", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_bool(p, "prekeys", "Hotkeys: fill in the suggested keys (Ctrl+Alt+Shift+…) the first time")
  obs.obs_properties_add_bool(p, "screens", "Add the stream screen scenes (Starting Soon, Be Right Back, …)")
  obs.obs_properties_add_bool(p, "halftime", "Include a Halftime scene")
  obs.obs_properties_add_button(p, "build", "Build my scenes", on_build)
  obs.obs_properties_add_text(p, "status", cfg.status ~= "" and cfg.status or "Ready.", obs.OBS_TEXT_INFO or obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "dock_control", "Control Panel dock URL (copy)", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "dock_stats", "Stats Desk dock URL (copy)", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "dock_theme", "Theme Panel dock URL (copy)", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "dock_content", "Content Panel dock URL (copy)", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "dock_runner", "Show Runner dock URL (copy)", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "dock_guests", "Remote guests page / optional dock (copy)", obs.OBS_TEXT_DEFAULT)
  return p
end

function script_defaults(settings)
  obs.obs_data_set_default_int(settings, "people", 2)
  obs.obs_data_set_default_bool(settings, "frames", true)
  obs.obs_data_set_default_bool(settings, "clock", true)
  obs.obs_data_set_default_bool(settings, "stats", true)
  obs.obs_data_set_default_bool(settings, "content", true)
  obs.obs_data_set_default_bool(settings, "runner", true)
  obs.obs_data_set_default_bool(settings, "update", true)
  obs.obs_data_set_default_bool(settings, "prekeys", true)
  obs.obs_data_set_default_bool(settings, "screens", true)
  obs.obs_data_set_default_bool(settings, "halftime", true)
end

function script_update(settings)
  cfg.people = obs.obs_data_get_int(settings, "people")
  cfg.frames = obs.obs_data_get_bool(settings, "frames")
  cfg.clock = obs.obs_data_get_bool(settings, "clock")
  cfg.stats = obs.obs_data_get_bool(settings, "stats")
  cfg.content = obs.obs_data_get_bool(settings, "content")
  cfg.runner = obs.obs_data_get_bool(settings, "runner")
  cfg.update = obs.obs_data_get_bool(settings, "update")
  cfg.guest_room = obs.obs_data_get_string(settings, "guest_room")
  cfg.guest_pass = obs.obs_data_get_string(settings, "guest_pass")
  cfg.guest_seats = obs.obs_data_get_string(settings, "guest_seats")
  cfg.screens = obs.obs_data_get_bool(settings, "screens")
  cfg.halftime = obs.obs_data_get_bool(settings, "halftime")
  -- always show the current addresses for the docks (they follow the folder)
  obs.obs_data_set_string(settings, "dock_control", url("control-panel.html"))
  obs.obs_data_set_string(settings, "dock_stats", url("stats-desk.html"))
  obs.obs_data_set_string(settings, "dock_theme", url("theme-dock.html"))
  obs.obs_data_set_string(settings, "dock_content", url("content-panel.html"))
  obs.obs_data_set_string(settings, "dock_runner", url("show-runner.html"))
  obs.obs_data_set_string(settings, "dock_guests", url("guests.html"))
end

---------------------------------------------------------------- hotkeys
-- A pressed hotkey points the "AWYM Hotkeys" browser source at
-- hotkeys.html#<action>~<time>~<n>. OBS reloads it, and that page tells the
-- overlays and docks what to do (see hotkeys.html).

--- Carry out one action by pointing the relay source at it (adds the relay to the
-- current scene first if it's missing).
local function fire(action)
  presses = presses + 1
  local src = obs.obs_get_source_by_name(PREFIX .. "Hotkeys")
  local address = url("hotkeys.html") .. "#" .. action .. "~" .. os.time() .. "~" .. presses
  if src == nil then
    -- no relay yet: make it (already pointing at this press) and put it in the current scene
    local s = obs.obs_data_create()
    obs.obs_data_set_string(s, "url", address)
    obs.obs_data_set_bool(s, "is_local_file", false)
    obs.obs_data_set_int(s, "width", 16); obs.obs_data_set_int(s, "height", 16)
    src = obs.obs_source_create("browser_source", PREFIX .. "Hotkeys", s, nil)
    obs.obs_data_release(s)
    local cur, placed = obs.obs_frontend_get_current_scene(), false
    if cur ~= nil then
      local sc = obs.obs_scene_from_source(cur)
      if sc ~= nil then placed = place(sc, src, 0, 0, 16, 16) ~= nil end
      obs.obs_source_release(cur)
    end
    if placed then log("Added the hotkey relay (AWYM Hotkeys) to the current scene.")
    else log("Hotkeys need the AWYM Hotkeys source: click Build my scenes in Tools → Scripts.") end
  else
    local s = obs.obs_data_create()
    obs.obs_data_set_string(s, "url", address)
    obs.obs_source_update(src, s)
    obs.obs_data_release(s)
  end
  if src ~= nil then obs.obs_source_release(src) end
end

--- Suggested binding (Ctrl + Alt + Shift + key) as the array obs_hotkey_load expects.
local function suggested(key)
  local arr = obs.obs_data_array_create()
  local d = obs.obs_data_create_from_json('{"key":"OBS_KEY_' .. key .. '","control":true,"alt":true,"shift":true}')
  obs.obs_data_array_push_back(arr, d)
  obs.obs_data_release(d)
  return arr
end

--- Register every action as an OBS hotkey and bring back its keys (or the suggested
-- ones, the very first time).
local function register_hotkeys(settings)
  local pre = obs.obs_data_get_bool(settings, "prekeys")
  for _, h in ipairs(HOTKEYS) do
    local action, name, key = h[1], h[2], h[3]
    local id = obs.obs_hotkey_register_frontend("awym_" .. action, "AWYM: " .. name, function(pressed)
      if pressed then fire(action) end
    end)
    hotkey_ids[action] = id
    -- a hotkey gets its suggested key only the first time the script ever sees it
    -- (so new actions from kit updates get keys too, and your own changes are never touched)
    local saved = obs.obs_data_get_array(settings, "hk_" .. action)
    local seen = obs.obs_data_get_bool(settings, "hk_seen_" .. action) or saved ~= nil
    local arr = saved
    if not seen and pre then
      if saved ~= nil then obs.obs_data_array_release(saved) end
      arr = suggested(key)
    end
    if arr ~= nil then obs.obs_hotkey_load(id, arr); obs.obs_data_array_release(arr) end
    obs.obs_data_set_bool(settings, "hk_seen_" .. action, true)
  end
end

---------------------------------------------------------------- backups
-- OBS docks can't download files, so the Show Runner's "Save backup file" hands the
-- backup to this script instead, through OBS's WebSocket server:
--   1. the dock sets {backup_json, backup_name, nonce} on the hidden input "AWYM Backup Writer"
--   2. this script (checking that input twice a second) writes the file into
--      the kit's backups folder, then replaces backup_json with {saved_path, saved_nonce}
--      (so the scene collection doesn't keep a copy of the backup)
--   3. the dock reads saved_path back and shows where the file went.
local writer = nil   -- the hidden input (we keep a reference so it stays alive)

--- Write one backup the dock sent, then tell the dock where it went.
local function write_backup()
  if writer == nil then return end
  local s = obs.obs_source_get_settings(writer)
  local json = obs.obs_data_get_string(s, "backup_json")
  local name = obs.obs_data_get_string(s, "backup_name"):gsub("[^%w%-%_%.]", "")
  local nonce = obs.obs_data_get_string(s, "nonce")
  obs.obs_data_release(s)
  if json == "" then return end
  if name == "" or not name:match("%.json$") then name = "awym-backup.json" end
  local path, f = folder() .. "backups/" .. name, nil
  f = io.open(path, "wb")
  if f == nil then path = folder() .. name; f = io.open(path, "wb") end   -- no backups folder: use the kit folder
  local result = path
  if f == nil then result = "ERROR: couldn't write " .. path
  else f:write(json); f:close(); log("Backup saved: " .. path) end
  local out = obs.obs_data_create()
  obs.obs_data_set_string(out, "backup_json", "")
  local shown = result
  if package.config:sub(1, 1) == "\\" then shown = shown:gsub("/", "\\") end   -- Windows-style path to show
  obs.obs_data_set_string(out, "saved_path", shown)
  obs.obs_data_set_string(out, "saved_nonce", nonce)
  obs.obs_source_update(writer, out)
  obs.obs_data_release(out)
end

--- Twice a second: has the dock handed over a backup?
local function check_writer()
  if writer == nil then return end
  local s = obs.obs_source_get_settings(writer)
  local waiting = obs.obs_data_get_string(s, "backup_json") ~= ""
  obs.obs_data_release(s)
  if waiting then write_backup() end
end

--- Make (or find) the hidden "AWYM Backup Writer" input and listen to it.
local function start_backup_writer()
  if writer ~= nil then return end
  writer = obs.obs_get_source_by_name(PREFIX .. "Backup Writer")
  if writer == nil then
    local s = obs.obs_data_create()
    writer = obs.obs_source_create("color_source_v3", PREFIX .. "Backup Writer", s, nil)
    obs.obs_data_release(s)
  end
  if writer ~= nil then obs.timer_add(check_writer, 500) end
end

function script_load(settings)
  log("Overlay kit setup script loaded from " .. folder())
  register_hotkeys(settings)
  start_backup_writer()
  obs.timer_add(fx_follow, 250)      -- frame effects layers follow their camera frames
end

--- OBS is saving: keep each hotkey's keys with the script's settings.
function script_save(settings)
  for action, id in pairs(hotkey_ids) do
    local arr = obs.obs_hotkey_save(id)
    obs.obs_data_set_array(settings, "hk_" .. action, arr)
    obs.obs_data_array_release(arr)
  end
end

function script_unload()
  for _, id in pairs(hotkey_ids) do obs.obs_hotkey_unregister(id) end
  hotkey_ids = {}
  obs.timer_remove(fx_follow)
  if writer ~= nil then
    obs.timer_remove(check_writer)
    obs.obs_source_release(writer); writer = nil
  end
end
