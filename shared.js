/**
 * shared.js — helpers used by every page in the overlay kit
 * ==========================================================
 * Load it with <script src="shared.js"></script> before a page's own script.
 * It creates one global object, window.AWYM, with:
 *
 *   AWYM.params / AWYM.param()   read settings from the page address (?name=…)
 *   AWYM.fontURL / AWYM.loadFont load Google Fonts on demand
 *   AWYM.applyTheme()            set theme values (colors, fonts, …) as CSS variables
 *   AWYM.showName / themeValue   read theme values back
 *   AWYM.glow()                  glow strength (Theme Panel "Glow"), also CSS var --glow-k
 *   AWYM.send / AWYM.listen      talk to the other pages (docks ⇄ overlays)
 *   AWYM.liveTheme / onTheme /   the live theme set from the Theme Panel dock
 *     setLiveTheme
 *   AWYM.buzzer / tinfoil / tick sound effects made in code (no audio files)
 *   AWYM.collapsible()           fold/unfold dock sections by clicking their headers
 *   AWYM.cleanHTML()             keep only safe formatting (Content Panel text)
 *   AWYM.sizeImages()            let photos in formatted text know their shape
 *   AWYM.clearScreen()           panic button: hide every graphic on every overlay
 *   AWYM.onClear(fn)             run fn when the screen is cleared
 *   AWYM.dock(name)              mark a page as a control dock (adds the 🚨 Clear button
 *                                to its header and lets a restore reload it)
 *
 * You don't need to edit this file: colors and fonts live in theme.css.
 *
 * ---------------------------------------------------------------------------
 * HOW THE PAGES TALK TO EACH OTHER
 * ---------------------------------------------------------------------------
 * All pages share one BroadcastChannel named "awym-control". It only works
 * between pages opened the same way (in OBS: typed file:/// addresses, not
 * "Local file"). Every message is a plain object. Docks address an overlay
 * with `to`; overlays answer with `from`.
 *
 *   to: "clock"       (shot-clock.html)    ← control-panel.html
 *       cmd: start | pause | toggle | reset | buzz
 *            set {seconds, autostart} · add {seconds} · label {label}
 *            sound {on} · foil {on}
 *   from: "clock"     → every 300 ms: {remaining, total, running, expired, label, sound, foil}
 *
 *   to: "lower"       (lower-third.html)   ← control-panel.html     id: "1"…"4" or "*"
 *       cmd: show | hide | toggle | update | ping   (+ data: {name, role, handle, number})
 *   from: "lower"     → {id, visible} · {id, cmd:"hello"} when it loads
 *
 *   to: "frame"       (frame.html)         ← control-panel.html     id: "1"…"4" or "*"
 *       cmd: spotlight {on} | ping       (frames also read `to:"lower"` name updates)
 *   from: "frame"     → {id, spot} · {id, cmd:"hello"}
 *
 *   to: "background"  (background.html)    ← control-panel.html "Background title"
 *       cmd: update {data:{title, tagline, position}} | reset | ping
 *   from: "background"→ {cmd:"hello"|"state", title, tagline, position, original}
 *
 *   to: "screen"      (screen.html)        ← control-panel.html "Stream screens"
 *       type: "starting" | "brb" | … | "*"
 *       cmd: update {data:{title, message, lines, next, minutes, at}} | restart
 *   from: "screen"    → {type, cmd:"hello"} when it loads
 *
 *   to: "stats"       (stats-card.html)    ← stats-desk.html
 *       cmd: show {card, options} | update {card, options} | hide
 *            ticker {games, on, options} | ping
 *   from: "stats"     → {visible, ticker, type} · {cmd:"hello"}
 *
 *   to: "content"     (content.html)       ← content-panel.html
 *       cmd: show {data:{header, html}, options} | update {data, options} | hide | ping
 *            (html is cleaned with AWYM.cleanHTML on both ends; options in content.html)
 *   from: "content"   → {visible} · {cmd:"hello"} when it loads
 *
 *   to: "theme"       (every page that loads this file) ← theme-dock.html
 *       cmd: set {json} | reset | ping
 *   from: "theme-client" → {cmd:"hello"|"here", id, page, embedded, has}
 *
 *   to: "all"         (every overlay and dock) ← the 🚨 Clear button in any dock
 *       cmd: clear   → lower thirds, stats card + ticker, on-screen text, debate
 *                      graphics hide; spotlights go off; sound effects stop
 *   to: "docks"       cmd: reload  → every dock reloads (after Backup → Restore)
 *
 *   to: "debate"      (debate.html)        ← show-runner.html
 *       cmd: score {data} | hideScore | winner {name, sub} | receipt {data} | record {data}
 *            hideReceipt | segment {data} | replay {on} | hide | ping
 *   from: "debate"    → {score, receipt, replay} (what's showing) · {cmd:"hello"}
 *
 *   to: "sfx"         (sfx.html, an invisible audio source) ← show-runner.html
 *       cmd: play {id, volume} | load {id, data} | stop | ping
 *   from: "sfx"       → {cmd:"here"|"hello"|"missing", id}
 *
 *   to: "fx"          (frame-fx.html, one per camera frame) ← show-runner.html, hotkeys.html
 *       id: "1".."4" | "*" | "floor" (whoever has the spotlight, or every frame if nobody does)
 *       cmd: play {effect: fire|ice|zap|smoke|sparks|shake, dur: seconds, 0 = until stopped}
 *            stop {effect?} | ping
 *            tune {tune: {fire|ice|zap|smoke|sparks: {amount, size, speed, bright}, shake: {strength, length},
 *                         talk: {spread, fade, rate, bright, halo}}}  (multipliers, 1 = as designed; any id)
 *   from: "fx"        → {id, playing:[effects]} whenever that changes
 *   to: "frame"       cmd: shake {ms} (from frame-fx.html) · talk {on, lvl 0–1} (speaking light,
 *                     from show-runner.html's Talk time) · from: "frame" also carries {shape}
 *   to: "debate"      also: talk {data} (talk-time card, sent again to update) | hideTalk
 *   to: "avatar"      (avatar.html, faces instead of a live camera) ← show-runner.html, hotkeys.html
 *       id: "1".."4" | "*"   cmd: face {n (1-based) | name} | on {on} | toggle | next | prev | ping
 *   from: "avatar"    → {id, on, face, faces:[names]}
 *
 * A "hello" lets a dock re-send whatever was on screen, so an overlay that
 * reloads (or that OBS restarts) comes back exactly as it was.
 */
(function () {
  const AWYM = (window.AWYM = {});

  /* URL parameters, e.g. lower-third.html?name=Big%20Mike */
  AWYM.params = new URLSearchParams(location.search);
  /**
   * Read one setting from the page address.
   * @param {string} key        e.g. "name" for ?name=Big%20Mike
   * @param {string} [fallback] returned when the setting is missing or empty
   * @returns {string}
   */
  AWYM.param = (key, fallback = "") => {
    const v = AWYM.params.get(key);
    return v === null || v === "" ? fallback : v;
  };

  /* Load a Google Font by family name. Body fonts ask for several weights;
     if a font doesn't have them, fall back to its regular weight. */
  const loadedFonts = {};
  /**
   * Google Fonts stylesheet address for a font family.
   * @param {string}  family   exact Google Fonts name, e.g. "Barlow Condensed"
   * @param {boolean} weights  ask for weights 400–700 (body text) instead of just regular
   * @returns {string}
   */
  AWYM.fontURL = (family, weights) =>
    "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(family).replace(/%20/g, "+") +
    (weights ? ":wght@400;500;600;700" : "") + "&display=swap";
  /**
   * Load a Google Font once (later calls for the same font do nothing).
   * If the font has no extra weights, it retries with just the regular weight.
   * @param {string}  family
   * @param {boolean} weights
   */
  AWYM.loadFont = (family, weights) => {
    const id = family + (weights ? "|w" : "");
    if (loadedFonts[id]) return;
    loadedFonts[id] = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = AWYM.fontURL(family, weights);
    if (weights) link.onerror = () => { link.remove(); AWYM.loadFont(family, false); };
    document.head.appendChild(link);
  };

  /* ---------- themes ----------
     theme.css is the base. On top of it, a page can get:
       - a preview theme in its address (?theme=…), used by the editor previews, or
       - the live theme set from the Theme Panel dock in OBS (remembered between sessions). */
  const appliedVars = new Set();
  /**
   * Apply theme values as CSS variables on <html>, overriding theme.css.
   * Unknown keys and unsafe values are ignored.
   * @param {Object|null} t  keys (all optional):
   *   colors:  primary, secondary, accent, dark, light, clock-digit, warning  ("#RRGGBB")
   *   fonts:   font-display, font-heading, font-body  (Google Font family names)
   *   text:    show-name ("" hides it), scene, badge-icon
   *   background: bg-anim, bg-speed, bg-intensity, bg-court, title-size
   *   effects: glow  (percent, "0"–"200", 100 = normal)
   * @param {boolean} [clean]  first remove everything a previous call applied
   */
  AWYM.applyTheme = (t, clean) => {
    const root = document.documentElement.style;
    if (clean) { appliedVars.forEach((k) => root.removeProperty("--" + k)); appliedVars.clear(); }
    if (!t) { syncGlow(); return; }
    const set = (k, v) => { root.setProperty("--" + k, v); appliedVars.add(k); };
    for (const [k, v] of Object.entries(t)) {
      if (/^font-(display|heading|body)$/.test(k) && typeof v === "string" && /^[A-Za-z0-9 ]{2,60}$/.test(v)) {
        const fallback = k === "font-body" ? '"Arial Narrow", Arial, sans-serif' : "Impact, sans-serif";
        set(k, `"${v}", ${fallback}`);
        AWYM.loadFont(v, k === "font-body");
      } else if ((k === "scene" || k === "badge-icon") && /^[a-z0-9-]{1,30}$/.test(String(v))) {
        set(k, JSON.stringify(String(v)));
      } else if (k === "show-name" && typeof v === "string") {
        set("show-name", JSON.stringify(v.trim()));          // "" = no show name
      } else if (/^(bg-(anim|speed|intensity|court)|title-size|glow)$/.test(k) && /^[a-z0-9.,-]{0,80}$/i.test(String(v))) {
        set(k, JSON.stringify(String(v)));                    // background animation settings
      } else if (/^#[0-9a-f]{3,8}$/i.test(v)) {
        set(k, v);
      }
    }
    syncGlow();
  };
  const themeParam = AWYM.params.get("theme");
  if (themeParam) { try { AWYM.applyTheme(JSON.parse(themeParam)); } catch (e) { /* ignore a bad preview theme */ } }

  /* Show name, read from theme.css */
  /**
   * The show name from the theme ("" if it was deliberately left blank).
   * @returns {string}
   */
  AWYM.showName = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--show-name").trim();
    if (raw === '""' || raw === "''") return "";              // deliberately left blank
    return raw.replace(/^["']|["']$/g, "") || "Argue with Yo Momma!";
  };
  /* a theme setting as text: the Theme Panel's live value, else theme.css, else the fallback */
  /**
   * Any theme setting as plain text (quotes removed).
   * @param {string} key       CSS variable name without "--", e.g. "bg-speed"
   * @param {string} [fallback]
   * @returns {string}
   */
  AWYM.themeValue = (key, fallback = "") => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--" + key).trim();
    return raw ? raw.replace(/^["']|["']$/g, "") : fallback;
  };

  /* ---------- glow strength ----------
     The Theme Panel's "Glow" slider saves `glow` (percent). Pages can't do maths
     with a quoted theme value, so it's also kept as a plain number in the CSS
     variable --glow-k (0 = no glow, 1 = normal, 2 = double). Use it like:
       filter: drop-shadow(0 0 calc(6px * var(--glow-k, 1)) var(--primary));
     Canvas drawings call AWYM.glow() for the same number. */
  /** Glow strength as a multiplier: 0 (off) to 2 (double), 1 = normal. @returns {number} */
  AWYM.glow = () => {
    const n = Number(AWYM.themeValue("glow", "100"));
    return isFinite(n) ? Math.max(0, Math.min(2, n / 100)) : 1;
  };
  function syncGlow() { if (AWYM.themeValue) document.documentElement.style.setProperty("--glow-k", String(AWYM.glow())); }
  syncGlow();

  /* Messaging between the control panel and the overlays.
     Works when they run in the same browser (e.g. OBS dock + OBS sources). */
  let channel = null;
  try { channel = new BroadcastChannel("awym-control"); } catch (e) { /* unsupported */ }
  /** Send a message to every other page (see HOW THE PAGES TALK above). @param {Object} msg */
  AWYM.send = (msg) => { if (channel) channel.postMessage(msg); };
  /** Run fn(message) for every message from other pages. @param {function(Object)} fn */
  AWYM.listen = (fn) => { if (channel) channel.addEventListener("message", (e) => fn(e.data || {})); };

  /* ---------- live theme (Theme Panel dock) ---------- */
  /* The live theme is a JSON string of theme values (see applyTheme). It's kept
     in browser storage so overlays come back with it after a reload or an OBS
     restart, and updated live through "theme" messages. Pages that must show
     theme.css as-is (the Theme Editor) set window.AWYM_NO_LIVE_THEME = true first. */
  const LIVE_KEY = "awym-live-theme-v1";
  const stores = () => { const out = []; try { out.push(localStorage); } catch (e) {} try { out.push(sessionStorage); } catch (e) {} return out; };
  const readLive = () => { for (const st of stores()) { try { const v = st.getItem(LIVE_KEY); if (v) return v; } catch (e) {} } return null; };
  const writeLive = (v) => stores().forEach((st) => { try { v ? st.setItem(LIVE_KEY, v) : st.removeItem(LIVE_KEY); } catch (e) {} });
  const themeCallbacks = [];
  /**
   * Run fn when the Theme Panel changes the live theme.
   * @param {function(Object|null, Object|null)} fn  (new theme or null, previous theme or null)
   */
  AWYM.onTheme = (fn) => themeCallbacks.push(fn);   // fn(newTheme or null, previousTheme or null)
  AWYM.liveTheme = null;
  if (!themeParam && !window.AWYM_NO_LIVE_THEME) {
    const stored = readLive();
    if (stored) { try { AWYM.applyTheme(JSON.parse(stored)); AWYM.liveTheme = stored; } catch (e) {} }
    const clientId = Math.random().toString(36).slice(2);
    const page = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
    const say = (cmd) => AWYM.send({ from: "theme-client", cmd, id: clientId, page, embedded: window.self !== window.top, has: AWYM.liveTheme });
    const changed = (json) => {
      const prev = AWYM.liveTheme ? JSON.parse(AWYM.liveTheme) : null;
      AWYM.liveTheme = json; writeLive(json);
      AWYM.applyTheme(json ? JSON.parse(json) : null, true);
      themeCallbacks.forEach((fn) => { try { fn(json ? JSON.parse(json) : null, prev); } catch (e) {} });
    };
    AWYM.listen((m) => {
      if (m.to !== "theme") return;
      if (m.cmd === "ping") say("here");
      else if (m.cmd === "set" && typeof m.json === "string" && m.json !== AWYM.liveTheme) changed(m.json);
      else if (m.cmd === "reset" && AWYM.liveTheme) changed(null);
    });
    // used by the Theme Panel: change the theme here and on every overlay (null = back to theme.css)
    /**
     * Change the live theme on this page and every overlay (used by the Theme Panel).
     * @param {string|null} json  theme values as a JSON string, or null to go back to theme.css
     */
    AWYM.setLiveTheme = (json) => {
      if (json === AWYM.liveTheme) return;
      changed(json);
      AWYM.send({ to: "theme", cmd: json ? "set" : "reset", json });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => say("hello"));
    else setTimeout(() => say("hello"), 0);
  }

  /* Arena buzzer, generated in code so no sound file is needed.
     In OBS, tick "Control audio via OBS" on the browser source to hear it. */
  let audioCtx = null;
  /**
   * Arena buzzer: three detuned oscillators through a low-pass filter.
   * @param {number} [duration] seconds
   * @param {number} [volume]   0–1
   */
  AWYM.buzzer = (duration = 1.3, volume = 0.35) => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const now = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(volume, now + 0.03);
      master.gain.setValueAtTime(volume, now + duration - 0.12);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2400;
      filter.connect(master);
      master.connect(audioCtx.destination);
      [[196, "sawtooth", 0.6], [247, "square", 0.25], [98, "sawtooth", 0.4]].forEach(([f, type, g]) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = f;
        gain.gain.value = g;
        osc.connect(gain).connect(filter);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    } catch (e) { /* audio not available */ }
  };

  /* Spooky theremin warble for the Tin Foil alert (about 2.5 seconds) */
  /** Tin Foil alert: a sine "theremin" sliding up and down with vibrato. @param {number} [volume] */
  AWYM.tinfoil = (volume = 0.22) => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const now = audioCtx.currentTime, dur = 2.6;
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      const lfo = audioCtx.createOscillator(), lfoGain = audioCtx.createGain();
      osc.type = "sine";
      // slow, eerie slide: up, down, up again
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.7);
      osc.frequency.exponentialRampToValueAtTime(620, now + 1.4);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 2.2);
      lfo.frequency.value = 6.5; lfoGain.gain.value = 22;          // vibrato
      lfo.connect(lfoGain).connect(osc.frequency);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.25);
      gain.gain.setValueAtTime(volume, now + dur - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now); lfo.start(now); osc.stop(now + dur + 0.05); lfo.stop(now + dur + 0.05);
    } catch (e) {}
  };

  /* Short "tick" for the last seconds */
  /** Short square-wave tick, used for the shot clock's last five seconds. @param {number} [volume] */
  AWYM.tick = (volume = 0.12) => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.value = 1320;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  };

  /* ---------------------------------------------------------------------------
   * Collapsible dock sections (Control Panel, Stats Desk)
   * ---------------------------------------------------------------------------
   * Every <section> whose first child is an <h2> becomes foldable: click the
   * header (anywhere except a button or box inside it) or press Enter/Space on
   * it. A ▾ arrow is drawn before the header's first <span class="ttl">, or
   * before the header itself if there isn't one. Folded sections are
   * remembered in localStorage under `storeKey`, by the section's
   * data-fold name (or its id, or its position).
   */
  /* ---------------------------------------------------------------------------
   * Safe formatted text (Content Panel → content.html)
   * ---------------------------------------------------------------------------
   * Keeps only the formatting the Content Panel offers and drops everything
   * else (scripts, event handlers, outside styles, links, frames…), so text
   * pasted from a web page can't do anything on the overlay. Used by both the
   * Content Panel (on paste, before saving and sending) and content.html (on
   * every message it receives). The list of what's kept is in rich-text.css.
   */
  const RT_TAGS = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", INS: "u", UL: "ul", OL: "ol", LI: "li",
    P: "p", DIV: "div", BR: "br", H1: "h2", H2: "h2", H3: "h2", H4: "h2", IMG: "img", SPAN: "span", FONT: "span",
    BLOCKQUOTE: "div", SECTION: "div", ARTICLE: "div", HEADER: "div", FOOTER: "div" };
  const RT_DROP = /^(SCRIPT|STYLE|IFRAME|FRAME|OBJECT|EMBED|LINK|META|TITLE|HEAD|SVG|MATH|NOSCRIPT|TEMPLATE|INPUT|BUTTON|SELECT|TEXTAREA|FORM|VIDEO|AUDIO|CANVAS)$/i;
  const RT_IMG = /^(data:image\/(png|jpe?g|gif|webp|bmp|avif);base64,|https?:\/\/|file:\/\/\/)/i;
  /**
   * Clean formatted text down to the Content Panel's safe set.
   * @param {string} html
   * @returns {string} safe HTML (see rich-text.css for what's kept)
   */
  AWYM.cleanHTML = (html) => {
    const doc = new DOMParser().parseFromString("<div>" + String(html || "") + "</div>", "text/html");
    const src = doc.body.firstElementChild || doc.body;
    const out = document.createElement("div");
    const walk = (from, to) => {
      for (const n of Array.from(from.childNodes)) {
        if (n.nodeType === 3) { to.appendChild(document.createTextNode(n.data)); continue; }
        if (n.nodeType !== 1) continue;
        const tag = n.tagName.toUpperCase();
        if (RT_DROP.test(tag)) continue;
        const name = RT_TAGS[tag];
        if (!name) { walk(n, to); continue; }                 // unknown tag: keep its text only
        if (name === "img") {
          const url = (n.getAttribute("src") || "").trim();
          if (!RT_IMG.test(url)) continue;
          const img = document.createElement("img");
          img.setAttribute("src", url);
          const size = n.getAttribute("data-size");
          img.setAttribute("data-size", /^(s|m|l|full)$/.test(size) ? size : "m");
          img.setAttribute("alt", (n.getAttribute("alt") || "").slice(0, 120));
          to.appendChild(img);
          continue;
        }
        if (name === "br") { to.appendChild(document.createElement("br")); continue; }
        let el;
        if (name === "span") {
          // keep only our theme-color classes; bold/italic/underline written as styles become tags
          const classes = String(n.getAttribute("class") || "").split(/\s+/);
          const cls = classes.find((c) => /^c-(primary|accent|normal)$/.test(c));
          // text size: the editor's <font size="1–7"> or a saved span.z1–z7 (3 = normal, dropped)
          const fsize = tag === "FONT" ? String(n.getAttribute("size") || "") : ((classes.find((c) => /^z[1-7]$/.test(c)) || "").slice(1));
          const st = n.style || {};
          let inner = to;
          const wrap = (t) => { const e = document.createElement(t); inner.appendChild(e); inner = e; };
          if (/^[124567]$/.test(fsize)) { wrap("span"); inner.className = "z" + fsize; }
          if (cls) { wrap("span"); inner.className = cls; }
          if (/bold|[6-9]00/.test(st.fontWeight || "")) wrap("b");
          if (/italic/.test(st.fontStyle || "")) wrap("i");
          if (/underline/.test(st.textDecoration || st.textDecorationLine || "")) wrap("u");
          walk(n, inner);
          continue;
        }
        el = document.createElement(name);
        if (/^(p|div|h2|li)$/.test(name)) {
          const al = (n.style && n.style.textAlign) || n.getAttribute("align") || "";
          if (/^(left|center|right)$/.test(al)) el.style.textAlign = al;
        }
        walk(n, el);
        to.appendChild(el);
      }
    };
    walk(src, out);
    return out.innerHTML;
  };

  /**
   * Tell each photo in `root` its shape (CSS variable --ar = width ÷ height), so
   * rich-text.css can keep tall photos from getting too tall. Calls onLoad after
   * each photo that wasn't loaded yet finishes loading.
   * @param {Element} root
   * @param {function} [onLoad]
   */
  AWYM.sizeImages = (root, onLoad) => {
    root.querySelectorAll("img").forEach((img) => {
      const set = () => { if (img.naturalWidth && img.naturalHeight) img.style.setProperty("--ar", (img.naturalWidth / img.naturalHeight).toFixed(4)); };
      if (img.complete && img.naturalWidth) set();
      else img.addEventListener("load", () => { set(); if (onLoad) onLoad(); }, { once: true });
    });
  };

  /** Make dock sections fold away when their header is clicked. @param {string} storeKey */
  AWYM.collapsible = (storeKey) => {
    let folded = {};
    try { folded = JSON.parse(localStorage.getItem(storeKey)) || {}; } catch (e) {}
    const save = () => { try { localStorage.setItem(storeKey, JSON.stringify(folded)); } catch (e) {} };
    if (!document.getElementById("awym-fold-css")) {
      const css = document.createElement("style");
      css.id = "awym-fold-css";
      css.textContent = `
        section > h2.fold { cursor: pointer; user-select: none; }
        section > h2.fold:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; border-radius: 4px; }
        section > h2.fold .ttl, section > h2.fold.bare { display: inline-flex; align-items: center; min-width: 0; }
        section > h2.fold .ttl::before, section > h2.fold.bare::before {
          content: "▾"; flex: none; display: inline-block; width: 1em; margin-right: 4px; font-size: .85em; opacity: .7; transition: transform .15s; }
        section.folded > h2.fold .ttl::before, section.folded > h2.fold.bare::before { transform: rotate(-90deg); }
        section.folded > h2.fold { margin-bottom: 0; }
        section.folded > :not(h2) { display: none !important; }`;
      document.head.appendChild(css);
    }
    const all = [];
    document.querySelectorAll("section").forEach((sec, i) => {
      const h = sec.firstElementChild;
      if (!h || h.tagName !== "H2") return;
      const id = sec.dataset.fold || sec.id || "s" + i;
      h.classList.add("fold");
      if (!h.querySelector(".ttl")) h.classList.add("bare");
      h.tabIndex = 0; h.setAttribute("role", "button");
      const set = (on) => {
        sec.classList.toggle("folded", on); h.setAttribute("aria-expanded", String(!on));
        if (on) folded[id] = 1; else delete folded[id];
      };
      set(!!folded[id]);
      h.title = h.title || "Click to fold or unfold this section";
      h.addEventListener("click", (e) => {
        if (e.target.closest("button, input, select, textarea, a, label") && e.target !== h) return;
        set(!sec.classList.contains("folded")); save();
      });
      h.addEventListener("keydown", (e) => {
        if (e.target !== h || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault(); set(!sec.classList.contains("folded")); save();
      });
      all.push(set);
    });
    /* returned helper: fold (true) or unfold (false) every section at once */
    return (on) => { all.forEach((set) => set(on)); save(); };
  };

  /* ---------------------------------------------------------------------------
   * Panic button and dock helpers
   * ---------------------------------------------------------------------------
   * AWYM.clearScreen() sends {to:"all", cmd:"clear"}. Every overlay hides its
   * graphics (the background, cameras and shot clock stay), and every dock
   * updates its buttons. Pages react with AWYM.onClear(fn), which also runs
   * when this page itself pressed the button.
   */
  const clearFns = [];
  /** Run fn whenever any dock presses 🚨 Clear. @param {function} fn */
  AWYM.onClear = (fn) => clearFns.push(fn);
  const runClear = () => clearFns.forEach((fn) => { try { fn(); } catch (e) {} });
  /** Panic button: hide every graphic on every overlay right now. */
  AWYM.clearScreen = () => { AWYM.send({ to: "all", cmd: "clear" }); runClear(); };
  AWYM.listen((m) => { if (m.to === "all" && m.cmd === "clear") runClear(); });

  /**
   * Mark this page as a control dock: puts a 🚨 Clear button in its <header>
   * (before the fold-all button) and lets Backup → Restore reload it.
   * @param {string} name  short name, e.g. "control"
   */
  AWYM.dock = (name) => {
    AWYM.dockName = name;
    AWYM.listen((m) => { if (m.to === "docks" && m.cmd === "reload") setTimeout(() => location.reload(), 300); });
    const tools = document.querySelector("header .tools") || document.querySelector("header");
    if (!tools || document.getElementById("panicBtn")) return;
    const b = document.createElement("button");
    b.id = "panicBtn"; b.type = "button"; b.className = "panic";
    b.title = "Clear the screen: hide every lower third, card, text and debate graphic at once";
    b.textContent = "🚨 Clear";
    b.onclick = () => { AWYM.clearScreen(); b.classList.add("done"); b.textContent = "✓ Cleared"; setTimeout(() => { b.classList.remove("done"); b.textContent = "🚨 Clear"; }, 1500); };
    const fold = document.getElementById("foldAll");
    if (fold && fold.parentNode === tools) tools.insertBefore(b, fold); else tools.appendChild(b);
    if (!document.getElementById("awym-panic-css")) {
      const css = document.createElement("style"); css.id = "awym-panic-css";
      css.textContent = `header .panic { background: var(--warning); color: #fff; border: 0; border-radius: 8px; padding: 3px 8px;
        font: inherit; font-weight: 800; font-size: 13px; letter-spacing: .5px; text-transform: uppercase; cursor: pointer; white-space: nowrap; }
        header .panic:hover { filter: brightness(1.1); } header .panic.done { background: #3DDC84; color: #0b0b0b; }
        @media (max-width: 400px) { header .conn span { display: none; } }   /* narrow dock: the light alone says it */`;
      document.head.appendChild(css);
    }
  };
})();
