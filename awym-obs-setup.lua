--[[
  OBS AUTOMATIC SETUP for the overlay kit
  ---------------------------------------
  How to use (one time):
    1. In OBS: Tools → Scripts → click "+" → pick THIS file (awym-obs-setup.lua)
       from the overlay folder. (Keep the folder where it is; OBS uses it.)
    2. On the right, choose how many people are on the show and what to add.
    3. Click "Build my scenes".
  It creates the scenes and every overlay (with the right addresses, sizes and
  positions): Main Show in the layout you pick, a "Show: …" scene for every
  layout (1–4 people, 2–5 + moderator), the stream screens, and Show Overlays.
  Each person's camera, avatar, frame and frame effects are a colored group
  ("Seat 1"…). Scenes that already exist are left alone, so it's safe to click
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
local cfg = { people = 2, layout = "2", layouts = true, cameras = true, frames = true, screens = true, halftime = true,
              clock = true, stats = true, content = true, runner = true, update = true, status = "",
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
  { "fx-smoke", "Frame effect: Smoke", "O" }, { "fx-sparks", "Frame effect: Sparks", "A" },
  { "fx-shake", "Frame effect: Shake", "B" },
  { "fx-stop", "Stop frame effects", "U" },
  -- the verdicts (the keys left over: punctuation, and Insert / Home / End / Page Up for stream decks)
  { "fx-trash", "Verdict: Trash take", "COMMA" },
  { "fx-facts", "Verdict: 100% Facts", "PERIOD" },
  { "fx-cooking", "Verdict: Cooking", "SLASH" },
  { "fx-cap", "Verdict: Cap", "MINUS" },
  { "fx-bricked", "Verdict: Bricked", "EQUAL" },
  { "fx-airball", "Verdict: Air ball", "QUOTELEFT" },
  { "fx-technical", "Verdict: Technical foul", "INSERT" },
  { "fx-posterized", "Verdict: Posterized", "HOME" },
  { "fx-onfire", "Verdict: On fire", "PAGEUP" },
  { "fx-clown", "Verdict: Clown take", "END" },
  { "mute-1", "Mute seat 1 on/off", "BRACKETLEFT" }, { "mute-2", "Mute seat 2 on/off", "BRACKETRIGHT" },
  { "mute-3", "Mute seat 3 on/off", "SEMICOLON" }, { "mute-4", "Mute seat 4 on/off", "APOSTROPHE" },
  { "unmute-all", "Unmute everyone", "BACKSLASH" },
  -- seat 1's faces (avatars/avatars.js; the names here are just labels): F13–F22 are for stream decks
  { "face-1", "Seat 1 face 1 (Smile)", "F13" },
  { "face-2", "Seat 1 face 2 (Skeptical)", "F14" },
  { "face-3", "Seat 1 face 3 (Shocked)", "F15" },
  { "face-4", "Seat 1 face 4 (Thinking)", "F16" },
  { "face-5", "Seat 1 face 5 (Happy)", "F17" },
  { "face-6", "Seat 1 face 6 (Cringe)", "F18" },
  { "face-7", "Seat 1 face 7 (Unimpressed)", "F19" },
  { "face-8", "Seat 1 face 8 (Starstruck)", "F20" },
  { "face-9", "Seat 1 face 9 (Facepalm)", "F21" },
  { "face-10", "Seat 1 face 10 (Smug)", "F22" },
  { "avatar-toggle", "Seat 1: face / live camera", "D" }, { "face-next", "Seat 1: next face", "J" }
}
local hotkey_ids = {}     -- action id → OBS hotkey id
local presses = 0
--- Sources used to be called "AWYM …"; now they have plain names ("Frame 1", "Shot Clock").
-- Build my scenes renames the old ones (see migrate_names). The backup writer keeps its
-- name: it's never in a scene, and the Show Runner looks for it by that name.
local OLD_PREFIX = "AWYM "
local WRITER_NAME = "AWYM Backup Writer"

--- Show layouts, on the 1920×1080 design canvas. Each seat: { x, y, frame width } (the frame is
-- 600×660, so its height is width × 1.1). With a moderator, seat 1 is the moderator, smaller.
local LAYOUTS = {
  { key = "1",  name = "1 Person",       tag = "1P",  seats = { { 650, 190, 620 } } },
  { key = "2",  name = "2 People",       tag = "2P",  seats = { { 370, 210, 520 }, { 1030, 210, 520 } } },
  { key = "3",  name = "3 People",       tag = "3P",  seats = { { 220, 230, 440 }, { 740, 230, 440 }, { 1260, 230, 440 } } },
  { key = "4",  name = "4 People",       tag = "4P",  seats = { { 70, 245, 400 }, { 530, 245, 400 }, { 990, 245, 400 }, { 1450, 245, 400 } } },
  { key = "2m", name = "2 + Moderator",  tag = "2+M", mod = true,
    seats = { { 810, 330, 300 }, { 170, 200, 500 }, { 1250, 200, 500 } } },
  { key = "3m", name = "3 + Moderator",  tag = "3+M", mod = true,
    seats = { { 60, 390, 280 }, { 420, 250, 440 }, { 910, 250, 440 }, { 1400, 250, 440 } } },
  { key = "4m", name = "4 + Moderator",  tag = "4+M", mod = true,
    seats = { { 50, 400, 260 }, { 350, 265, 360 }, { 740, 265, 360 }, { 1130, 265, 360 }, { 1520, 265, 360 } } },
  { key = "5m", name = "5 + Moderator",  tag = "5+M", mod = true,
    seats = { { 60, 397, 260 }, { 580, 190, 300 }, { 930, 190, 300 }, { 1280, 190, 300 }, { 755, 540, 300 }, { 1105, 540, 300 } } },
}
local function layout_by_key(k) for _, L in ipairs(LAYOUTS) do if L.key == k then return L end end return LAYOUTS[2] end

--- Colors in OBS's Sources list (what right-click → Set Color → Custom stores). See-through, like
-- OBS's own preset colors, so the names stay readable in light and dark themes.
local COLORS = {
  seat = { "rgba(255,68,68,38%)", "rgba(68,138,255,38%)", "rgba(60,200,100,38%)",
           "rgba(255,196,40,38%)", "rgba(170,90,255,38%)", "rgba(40,200,200,38%)" },   -- one per seat
  background = "rgba(130,130,140,22%)", names = "rgba(255,140,40,30%)",
  graphics = "rgba(90,120,255,25%)", tools = "rgba(160,160,170,25%)", overlays = "rgba(90,120,255,25%)",
}
local OVERLAYS = "Show Overlays"     -- a scene with the graphics and tools, shown inside every show scene

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
-- @param name     source name (if another kind of source already has it, " (overlay)" is added)
-- @param address  file:/// address (Local file is turned off so the docks can reach it)
-- @param w, h     the page's design size in pixels
-- @param opts     { audio = true } routes sound through OBS; { restart = true } reloads the
--                 page whenever its scene becomes active (restarts countdowns)
-- @return obs_source_t or nil
local function browser(name, address, w, h, opts)
  opts = opts or {}
  local existing = obs.obs_get_source_by_name(name)
  if existing ~= nil then
    -- reuse it if it's ours (a Browser source showing the same page); a different source
    -- that happens to have this name is left alone, and ours gets "(overlay)" added
    local file = address:match("([%w%-]+%.html)") or address:match("^https?://([^/?]+)")
    local mine = obs.obs_source_get_unversioned_id(existing) == "browser_source"
    if mine and file then
      local st = obs.obs_source_get_settings(existing)
      mine = (obs.obs_data_get_string(st, "url") or ""):find(file, 1, true) ~= nil
      obs.obs_data_release(st)
    end
    if mine then return existing end
    obs.obs_source_release(existing)
    name = name .. " (overlay)"
    existing = obs.obs_get_source_by_name(name)
    if existing ~= nil then return existing end
  end
  local s = obs.obs_data_create()
  obs.obs_data_set_string(s, "url", address)
  obs.obs_data_set_bool(s, "is_local_file", false)
  obs.obs_data_set_int(s, "width", w)
  obs.obs_data_set_int(s, "height", h)
  if opts.audio then obs.obs_data_set_bool(s, "reroute_audio", true) end
  if opts.restart then obs.obs_data_set_bool(s, "restart_when_active", true) end
  local src = obs.obs_source_create("browser_source", name, s, nil)
  obs.obs_data_release(s)
  return src
end

--- Create the hidden Media Source the Show Runner plays instant replays in (or reuse it).
-- The Show Runner fills in the clip file when you press Instant replay.
-- @return obs_source_t or nil (caller releases)
local function replay_source(name)
  local existing = obs.obs_get_source_by_name(name)
  if existing ~= nil then return existing end
  local s = obs.obs_data_create()
  obs.obs_data_set_bool(s, "is_local_file", true)
  obs.obs_data_set_string(s, "local_file", "")
  obs.obs_data_set_bool(s, "looping", false)
  obs.obs_data_set_bool(s, "restart_on_activate", true)
  obs.obs_data_set_bool(s, "close_when_inactive", true)
  obs.obs_data_set_bool(s, "clear_on_media_end", true)
  local src = obs.obs_source_create("ffmpeg_source", name, s, nil)
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

--- Give a scene item (or group) a color in the Sources list, like right-click → Set Color.
-- @param hex  a Qt style-sheet color: "#rrggbb" or "rgba(r,g,b,a%)"
local function set_color(item, hex)
  if item == nil or hex == nil or obs.obs_sceneitem_get_private_settings == nil then return end
  local d = obs.obs_sceneitem_get_private_settings(item)
  if d == nil then return end
  obs.obs_data_set_int(d, "color-preset", 1)        -- 1 = a custom color, stored in "color"
  obs.obs_data_set_string(d, "color", hex)
  obs.obs_data_release(d)
end

--- A source name nobody has used yet: name, then "name 2", "name 3"…
local function unused_name(name)
  local try, n = name, 1
  while true do
    local s = obs.obs_get_source_by_name(try)
    if s == nil then return try end
    obs.obs_source_release(s)
    n = n + 1; try = name .. " " .. n
  end
end

--- Put scene items (bottom layer first) into a new group, all in one color. The group goes
-- where they were (they must be the newest items in the scene). Without groups (very old
-- OBS) they're just colored.
-- @return the group's scene item, or nil
local function make_group(scene, name, items, color)
  local list = {}
  for _, it in ipairs(items) do if it ~= nil then list[#list + 1] = it end end
  if #list == 0 then return nil end
  for _, it in ipairs(list) do set_color(it, color) end
  if obs.obs_scene_add_group == nil or obs.obs_sceneitem_group_add_item == nil then return nil end
  local g = obs.obs_scene_add_group(scene, unused_name(name))
  if g == nil then return nil end
  for _, it in ipairs(list) do obs.obs_sceneitem_group_add_item(g, it) end
  if obs.obs_sceneitem_set_order_position ~= nil then
    for i, it in ipairs(list) do obs.obs_sceneitem_set_order_position(it, i - 1) end   -- 0 = bottom
  end
  set_color(g, color)
  return g
end

--- A scene item showing the source with this name, searched through groups and scenes shown
-- inside the scene too. @return obs_sceneitem_t or nil (not a reference)
local function find_item(scene, name, depth)
  depth = depth or 0
  if scene == nil or depth > 4 then return nil end
  local hit = obs.obs_scene_find_source(scene, name)
  if hit ~= nil then return hit end
  local items = obs.obs_scene_enum_items(scene)
  if items == nil then return nil end
  for _, it in ipairs(items) do
    local inner = nil
    if obs.obs_sceneitem_is_group(it) then inner = obs.obs_sceneitem_group_get_scene(it)
    else inner = obs.obs_scene_from_source(obs.obs_sceneitem_get_source(it)) end
    if inner ~= nil then hit = find_item(inner, name, depth + 1); if hit ~= nil then break end end
  end
  obs.sceneitem_list_release(items)
  return hit
end

--- Older kits named every source "AWYM …". Give them their plain names ("AWYM Camera Frame 2"
-- → "Frame 2", "AWYM Shot Clock" → "Shot Clock"), unless that name is already taken.
-- @return how many were renamed
local function migrate_names()
  if obs.obs_enum_sources == nil or obs.obs_source_set_name == nil then return 0 end
  local list = obs.obs_enum_sources()
  if list == nil then return 0 end
  local renamed = 0
  for _, src in ipairs(list) do
    local name = obs.obs_source_get_name(src) or ""
    if name:sub(1, #OLD_PREFIX) == OLD_PREFIX and name ~= WRITER_NAME then
      local new = name:sub(#OLD_PREFIX + 1):gsub("^Camera Frame (%d+)$", "Frame %1")
      local taken = obs.obs_get_source_by_name(new)
      if taken == nil then obs.obs_source_set_name(src, new); renamed = renamed + 1
      else obs.obs_source_release(taken) end
    end
  end
  obs.source_list_release(list)
  return renamed
end

--- The kind of Video Capture Device this computer has (Windows, Mac, Linux), or nil.
local function camera_kind()
  for _, k in ipairs({ "dshow_input", "macos-avcapture", "av_capture_input", "v4l2_input" }) do
    local ok, flags = pcall(obs.obs_get_source_output_flags, k)
    if ok and flags ~= nil and flags ~= 0 then return k end
  end
  return nil
end

---------------------------------------------------------------- remote guests
-- VDO.Ninja links, built exactly like guests.html builds them (keep in step):
--   OBS address  https://vdo.ninja/?room=R&view=RseatN&solo[&password=P]

--- Room name as guests.html cleans it (lowercase letters and digits only).
local function guest_room()
  return (cfg.guest_room or ""):lower():gsub("[^a-z0-9]", ""):sub(1, 30)
end

--- Seats (People slots 1–6) that are remote guests, from text like "2, 3".
-- @return table of numbers
local function guest_seats()
  local out, seen = {}, {}
  for d in (cfg.guest_seats or ""):gmatch("%d") do
    local n = tonumber(d)
    if n >= 1 and n <= 6 and not seen[n] then seen[n] = true; out[#out + 1] = n end
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

--- Seat n's camera: a Video Capture Device called "Camera n" with no device picked yet (double-click
-- it in OBS to pick one), cut to a circle by the 16:9 circle mask. An existing source called
-- "Camera n" (your own) is used as it is. Caller releases it.
local function camera_source(n)
  local name = "Camera " .. n
  local existing = obs.obs_get_source_by_name(name)
  if existing ~= nil then return existing end
  local kind = camera_kind()
  if kind == nil then return nil end
  local s = obs.obs_data_create()
  local src = obs.obs_source_create(kind, name, s, nil)
  obs.obs_data_release(s)
  if src == nil then return nil end
  add_filter(src, "mask_filter", "Circle cutout", function(st)
    obs.obs_data_set_string(st, "type", "mask_alpha_filter.effect")
    obs.obs_data_set_string(st, "image_path", folder() .. "masks/circle-16x9.png")
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

--- Line an avatar layer up with its camera frame: exactly the frame's box (same page size,
-- 600×660), so its face fills the camera circle under the ring.
local function avatar_line_up(av, fr)
  local p, cur = obs.vec2(), obs.vec2()
  obs.obs_sceneitem_get_pos(fr, p); obs.obs_sceneitem_get_pos(av, cur)
  if differs(cur.x, p.x) or differs(cur.y, p.y) then obs.obs_sceneitem_set_pos(av, p) end
  local rot = obs.obs_sceneitem_get_rot(fr)
  if differs(obs.obs_sceneitem_get_rot(av), rot) then obs.obs_sceneitem_set_rot(av, rot) end
  local align = obs.obs_sceneitem_get_alignment(fr)
  if obs.obs_sceneitem_get_alignment(av) ~= align then obs.obs_sceneitem_set_alignment(av, align) end
  local bw, bh, has_bounds = item_box(fr)
  if bw > 0 and bh > 0 then
    if obs.obs_sceneitem_get_bounds_type(av) ~= obs.OBS_BOUNDS_SCALE_INNER then obs.obs_sceneitem_set_bounds_type(av, obs.OBS_BOUNDS_SCALE_INNER) end
    local balign = has_bounds and obs.obs_sceneitem_get_bounds_alignment(fr) or 0
    if obs.obs_sceneitem_get_bounds_alignment(av) ~= balign then obs.obs_sceneitem_set_bounds_alignment(av, balign) end
    local cb = obs.vec2(); obs.obs_sceneitem_get_bounds(av, cb)
    if differs(cb.x, bw) or differs(cb.y, bh) then local v = obs.vec2(); v.x = bw; v.y = bh; obs.obs_sceneitem_set_bounds(av, v) end
  end
  local vis = obs.obs_sceneitem_visible(fr)
  if obs.obs_sceneitem_visible(av) ~= vis then obs.obs_sceneitem_set_visible(av, vis) end
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
      if file == "frame" or file == "frame-fx" or file == "avatar" then
        local seat = tonumber((query or ""):match("[?&]?id=(%d+)") or "1")
        hit = { file == "frame" and "frame" or file == "avatar" and "avatar" or "fx", seat }
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
          local box = found[key] or { scene = sc, frame = {}, fx = {}, av = {} }
          found[key] = box
          if kind == "frame" then box.frame[seat] = box.frame[seat] or it
          elseif kind == "avatar" then box.av[seat] = box.av[seat] or {}; table.insert(box.av[seat], it)
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
        for seat, list in pairs(box.av) do
          local fr = box.frame[seat]
          if fr ~= nil then for _, av in ipairs(list) do avatar_line_up(av, fr) end end
        end
      end
    end
  end
  obs.source_list_release(scenes)
end

--- The avatar layer for seat n (faces instead of the live camera; or the existing one). Caller releases it.
local function avatar_source(n)
  return browser("Avatar " .. n, url("avatar.html", { { "id", tostring(n) } }), 600, 660)
end

--- The effects layer source for seat n (or the existing one). Caller releases it.
local function fx_source(n)
  return browser("Frame FX " .. n, url("frame-fx.html", { { "id", tostring(n) } }), 1000, 1100)
end

--- The camera frame for seat n (or the existing one). Caller releases it.
local function frame_source(n)
  return browser("Frame " .. n, url("frame.html", { { "id", tostring(n) } }), 600, 660)
end

---------------------------------------------------------------- the build
--- Build everything: Starting Soon, Main Show, a scene for every layout (1–4 people,
-- 2–5 + moderator), Be Right Back, Technical Difficulties, Halftime, Thanks for Watching,
-- and "Show Overlays" (graphics and tools, shown inside every show scene). Sources get
-- plain names and are grouped and colored in the Sources list:
--   Seat N / Moderator  camera (or remote guest), avatar, frame, frame effects
--   Names               the lower thirds
--   Show Overlays       Graphics (shot clock, on-screen text, stats, debate) and
--                       Show Tools (instant replay, sound effects, hotkey relay)
-- The 1920×1080 layout is scaled to the canvas. Existing scenes are skipped (an existing
-- Main Show can get the overlays it's missing). Every reference taken is released.
-- @return string  summary shown in the script panel
local function build()
  local W, H = canvas()
  local f = math.min(W / 1920, H / 1080)            -- scale the 1920×1080 layout to the canvas
  local made, skipped, notes = {}, {}, {}
  local main_source = nil
  local show_scenes = {}                             -- new show scenes: get Show Overlays on top at the end

  local renamed = migrate_names()
  if renamed > 0 then notes[#notes + 1] = "Renamed " .. renamed .. " sources (dropped \"AWYM\")." end

  local function full(scene, name, address, opts, locked)
    local src = browser(name, address, 1920, 1080, opts)
    if src == nil then return nil end
    local item = place(scene, src, 0, 0, W, H, locked)
    obs.obs_source_release(src)
    return item
  end
  local function add(scene, src, x, y, w, h)          -- place in design px, release the source
    if src == nil then return nil end
    local item = place(scene, src, x * f, y * f, w * f, h * f)
    obs.obs_source_release(src)
    return item
  end

  -- the Show Runner's sources: instant replay (hidden until used), debate graphics, sound effects
  local function replay(scene)
    local src = replay_source("Instant Replay")
    if src == nil then return nil end
    local item = place(scene, src, 0, 0, W, H)
    if item ~= nil then obs.obs_sceneitem_set_visible(item, false) end
    obs.obs_source_release(src)
    return item
  end
  local function sounds(scene) return add(scene, browser("Sound Effects", url("sfx.html"), 100, 100, { audio = true }), 0, 0, 100, 100) end
  local function relay(scene) return add(scene, browser("Hotkeys", url("hotkeys.html"), 16, 16), 0, 0, 16, 16) end
  local function clock(scene)
    return add(scene, browser("Shot Clock", url("shot-clock.html", { { "time", "3:00" }, { "label", "Shot Clock" } }), 640, 320, { audio = true }),
      1920 - 360 - 40, 40, 360, 180)
  end

  -- Overlays every show scene should have, bottom layer first: { name, adds it, "tools" | "graphics" }
  local extras = {}
  if cfg.runner then extras[#extras + 1] = { "Instant Replay", replay, "tools" } end
  if cfg.runner then extras[#extras + 1] = { "Sound Effects", sounds, "tools" } end
  extras[#extras + 1] = { "Hotkeys", relay, "tools" }       -- the hotkey relay (invisible), see "hotkeys" below
  if cfg.clock then extras[#extras + 1] = { "Shot Clock", clock, "graphics" } end
  if cfg.content then extras[#extras + 1] = { "On-Screen Text", function(sc) return full(sc, "On-Screen Text", url("content.html")) end, "graphics" } end
  if cfg.stats then extras[#extras + 1] = { "Stats Overlay", function(sc) return full(sc, "Stats Overlay", url("stats-card.html")) end, "graphics" } end
  if cfg.runner then extras[#extras + 1] = { "Debate Overlay", function(sc) return full(sc, "Debate Overlay", url("debate.html")) end, "graphics" } end

  local remote = {}
  if guest_room() ~= "" then for _, n in ipairs(guest_seats()) do remote[n] = true end end

  --- Fill a new show scene with a layout: background, a group per seat, the names.
  -- suffix tells its groups apart from other scenes' (group names are unique in OBS).
  local function fill_show(sc, L, suffix)
    set_color(full(sc, "Background", url("background.html"), nil, true), COLORS.background)
    for i, seat in ipairs(L.seats) do
      local x, y, w = seat[1], seat[2], seat[3]
      local h = w * 660 / 600
      local items = {}
      if remote[i] then           -- remote guest: square crop + circle cutout, 93% of the frame
        items[#items + 1] = add(sc, guest_source(i), x + w * 0.035, y + w * 0.035, w * 0.93, w * 0.93)
      elseif cfg.cameras then     -- camera: 16:9, the circle (93% of the frame) centred on the ring
        local ch = w * 0.93; local cw = ch * 16 / 9
        items[#items + 1] = add(sc, camera_source(i), x + w / 2 - cw / 2, y + w / 2 - ch / 2, cw, ch)
      end
      if cfg.frames then
        items[#items + 1] = add(sc, avatar_source(i), x, y, w, h)
        items[#items + 1] = add(sc, frame_source(i), x, y, w, h)
        items[#items + 1] = add(sc, fx_source(i), x - w / 3, y - w / 3, w * FX_GROW, h * FX_GROW)
      end
      local label = (L.mod and i == 1) and "Moderator" or ("Seat " .. i)
      make_group(sc, label .. suffix, items, COLORS.seat[i])
    end
    local names = {}
    for i = 1, #L.seats do
      local side = (i % 2 == 0) and "right" or ""
      names[#names + 1] = full(sc, "Lower Third " .. i, url("lower-third.html", { { "id", tostring(i) }, { "side", side }, { "hidden", "1" } }))
    end
    make_group(sc, "Names" .. suffix, names, COLORS.names)
    show_scenes[#show_scenes + 1] = obs.obs_scene_get_source(sc)
  end

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

  local keep = {}                                    -- new scenes, released at the end
  local main = new_scene("Main Show")
  if main == nil then
    -- Main Show is already there: optionally add just the overlays it's missing
    local added = {}
    if cfg.update then
      local msrc = obs.obs_get_source_by_name("Main Show")
      if msrc ~= nil then
        local msc = obs.obs_scene_from_source(msrc)
        if msc ~= nil then
          local has_overlays = find_item(msc, OVERLAYS) ~= nil
          for _, e in ipairs(extras) do
            if not has_overlays and find_item(msc, e[1]) == nil then e[2](msc); added[#added + 1] = e[1] end
          end
          local boxes = frame_items(msc)
          -- remote guests: under their camera frame (wherever you moved it), just above the background
          if guest_room() ~= "" then
            for _, seat in ipairs(guest_seats()) do
              if find_item(msc, "Guest Seat " .. seat) == nil then
                local src = guest_source(seat)
                if src ~= nil then
                  local x, y, size = 0, 0, 372 * f
                  local fr = nil
                  for _, box in pairs(boxes) do if box.frame[seat] ~= nil and box.scene == msc then fr = box.frame[seat] end end
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
          -- avatar layers: one per camera frame, right under it
          for _, box in pairs(boxes) do
            for seat, fr in pairs(box.frame) do
              if box.av[seat] == nil then
                local src = avatar_source(seat)
                if src ~= nil then
                  local item = obs.obs_scene_add(box.scene, src)
                  if item ~= nil then
                    avatar_line_up(item, fr)
                    if obs.obs_sceneitem_get_order_position ~= nil and obs.obs_sceneitem_set_order_position ~= nil then
                      obs.obs_sceneitem_set_order_position(item, obs.obs_sceneitem_get_order_position(fr))
                    end
                    added[#added + 1] = "Avatar " .. seat
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
    fill_show(main, layout_by_key(cfg.layout), "")
    main_source = obs.obs_scene_get_source(main)
    made[#made + 1] = "Main Show (" .. layout_by_key(cfg.layout).name .. ")"
    keep[#keep + 1] = main
  end

  -- a scene for every layout, to switch between during the show
  if cfg.layouts then
    for _, L in ipairs(LAYOUTS) do
      local name = "Show: " .. L.name
      local sc = new_scene(name)
      if sc == nil then skipped[#skipped + 1] = name
      else fill_show(sc, L, " (" .. L.tag .. ")"); made[#made + 1] = name; keep[#keep + 1] = sc end
    end
  end

  if cfg.screens then
    screen_scene("Be Right Back", "Be Right Back Screen", { { "type", "brb" }, { "minutes", "5" } }, true)
    screen_scene("Technical Difficulties", "Technical Difficulties Screen", { { "type", "technical" } }, false)
    if cfg.halftime then
      screen_scene("Halftime", "Halftime Screen", { { "type", "halftime" }, { "minutes", "10" } }, true)
    end
    screen_scene("Thanks for Watching", "Thanks for Watching Screen", { { "type", "ending" } }, false)
  end

  -- Show Overlays: made once (last, so it sits at the end of the Scenes list), then shown
  -- on top of every new show scene
  if #show_scenes > 0 then
    local ov = obs.obs_get_source_by_name(OVERLAYS)
    if ov == nil then
      local osc = obs.obs_scene_create(OVERLAYS)
      if osc ~= nil then
        local tools, graphics = {}, {}
        for _, e in ipairs(extras) do if e[3] == "tools" then tools[#tools + 1] = e[2](osc) end end
        make_group(osc, "Show Tools", tools, COLORS.tools)
        for _, e in ipairs(extras) do if e[3] == "graphics" then graphics[#graphics + 1] = e[2](osc) end end
        make_group(osc, "Graphics", graphics, COLORS.graphics)
        made[#made + 1] = OVERLAYS
        ov = obs.obs_scene_get_source(osc)
        for _, ssrc in ipairs(show_scenes) do
          local item = place(obs.obs_scene_from_source(ssrc), ov, 0, 0, W, H, true)
          set_color(item, COLORS.overlays)
        end
        obs.obs_scene_release(osc)
      end
    else
      for _, ssrc in ipairs(show_scenes) do
        local item = place(obs.obs_scene_from_source(ssrc), ov, 0, 0, W, H, true)
        set_color(item, COLORS.overlays)
      end
      obs.obs_source_release(ov)
    end
    if cfg.cameras and camera_kind() ~= nil then
      notes[#notes + 1] = "Cameras: double-click \"Camera 1\" (and the others) in the Sources list and pick the device."
    end
  end

  if main_source ~= nil then obs.obs_frontend_set_current_scene(main_source) end
  for _, sc in ipairs(keep) do obs.obs_scene_release(sc) end

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
<p><b>Scenes:</b> Main Show uses the layout you pick; "Also make a scene for every layout" adds
Show: 1 Person … Show: 5 + Moderator (the moderator, seat 1, a bit smaller). Each person's camera,
avatar, frame and effects are grouped as <b>Seat N</b>, each group its own color.</p>
<p>Keep this folder where it is. If you move it, delete the kit's sources and build again.</p>]]
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
  local lp = obs.obs_properties_add_list(p, "layout", "Main Show layout", obs.OBS_COMBO_TYPE_LIST, obs.OBS_COMBO_FORMAT_STRING)
  for _, L in ipairs(LAYOUTS) do obs.obs_property_list_add_string(lp, L.name, L.key) end
  obs.obs_properties_add_bool(p, "layouts", "Also make a scene for every layout (Show: 1 Person … Show: 5 + Moderator)")
  obs.obs_properties_add_bool(p, "cameras", "Add a camera (Video Capture Device) for each person, cut to a circle")
  obs.obs_properties_add_bool(p, "frames", "Add a camera frame for each person (with avatar and frame effects layers)")
  obs.obs_properties_add_bool(p, "clock", "Add the shot clock")
  obs.obs_properties_add_bool(p, "stats", "Add the NBA stats overlay")
  obs.obs_properties_add_bool(p, "content", "Add the on-screen text overlay (Content Panel)")
  obs.obs_properties_add_bool(p, "runner", "Add the Show Runner overlays (debate graphics, sound effects, instant replay)")
  obs.obs_properties_add_bool(p, "update", "If Main Show already exists, add the overlays it's missing")
  obs.obs_properties_add_text(p, "guest_room", "Remote guests: room name (from guests.html)", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "guest_pass", "Remote guests: room password", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(p, "guest_seats", "Remote guests: seats 1–6, e.g. 2,3", obs.OBS_TEXT_DEFAULT)
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
  -- the layout picker replaced "People on the show": start from that number if it was set
  local people = obs.obs_data_get_int(settings, "people")
  obs.obs_data_set_default_string(settings, "layout", tostring(math.max(1, math.min(4, people > 0 and people or 2))))
  obs.obs_data_set_default_bool(settings, "layouts", true)
  obs.obs_data_set_default_bool(settings, "cameras", true)
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
  cfg.layout = obs.obs_data_get_string(settings, "layout")
  if cfg.layout == "" then cfg.layout = tostring(math.max(1, math.min(4, cfg.people))) end
  cfg.layouts = obs.obs_data_get_bool(settings, "layouts")
  cfg.cameras = obs.obs_data_get_bool(settings, "cameras")
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
-- A pressed hotkey points the "Hotkeys" browser source (in Show Overlays → Show Tools) at
-- hotkeys.html#<action>~<time>~<n>. OBS reloads it, and that page tells the
-- overlays and docks what to do (see hotkeys.html).

--- Carry out one action by pointing the relay source at it (adds the relay to the
-- current scene first if it's missing).
local function fire(action)
  presses = presses + 1
  local src = nil
  for _, n in ipairs({ "Hotkeys", "Hotkeys (overlay)", OLD_PREFIX .. "Hotkeys" }) do   -- (the last: not rebuilt since the rename)
    local s0 = obs.obs_get_source_by_name(n)
    if s0 ~= nil then
      if obs.obs_source_get_unversioned_id(s0) == "browser_source" then src = s0; break end
      obs.obs_source_release(s0)
    end
  end
  local address = url("hotkeys.html") .. "#" .. action .. "~" .. os.time() .. "~" .. presses
  if src == nil then
    -- no relay yet: make it (already pointing at this press) and put it in the current scene
    local s = obs.obs_data_create()
    obs.obs_data_set_string(s, "url", address)
    obs.obs_data_set_bool(s, "is_local_file", false)
    obs.obs_data_set_int(s, "width", 16); obs.obs_data_set_int(s, "height", 16)
    src = obs.obs_source_create("browser_source", unused_name("Hotkeys"), s, nil)
    obs.obs_data_release(s)
    local cur, placed = obs.obs_frontend_get_current_scene(), false
    if cur ~= nil then
      local sc = obs.obs_scene_from_source(cur)
      if sc ~= nil then placed = place(sc, src, 0, 0, 16, 16) ~= nil end
      obs.obs_source_release(cur)
    end
    if placed then log("Added the hotkey relay (Hotkeys) to the current scene.")
    else log("Hotkeys need the Hotkeys source: click Build my scenes in Tools → Scripts.") end
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
  writer = obs.obs_get_source_by_name(WRITER_NAME)
  if writer == nil then
    local s = obs.obs_data_create()
    writer = obs.obs_source_create("color_source_v3", WRITER_NAME, s, nil)
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
