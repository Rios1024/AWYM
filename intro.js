/**
 * intro.js: the show intro, shared by intro.html (the OBS source) and
 * intro-editor.html (the Intro Editor dock).
 * ==========================================================================
 * You don't need to edit this file: everything is set in the Intro Editor.
 *
 * Needs, loaded first: lib/anime.umd.min.js (window.anime, v4) and shared.js.
 * Styles: intro.css.
 *
 * It creates one global object, window.AWYM_INTRO, with:
 *
 *   AWYM_INTRO.DEFAULTS        every setting and its starting value
 *   AWYM_INTRO.load()          the saved settings (browser storage), cleaned up
 *   AWYM_INTRO.save(st)        save them (returns false if storage is full)
 *   AWYM_INTRO.clean(obj)      keep only known settings of the right type
 *   AWYM_INTRO.loadFont(name)  load a Google Font; resolves true / false (not found)
 *   AWYM_INTRO.applyNames(st, plates)  the name plates' names and roles from the Guests page:
 *                              plates = { tl, tr, ll, lr: {name, role} } (blank name = no plate)
 *   AWYM_INTRO.mount(el)       turn a 1920 × 1080 element into the intro; returns
 *                              { set(st, {replay}), play(fromStart), pause(), seek(ms),
 *                                seekHold(), hide(on), state(), scrubbing(on),
 *                                on("update" | "complete" | "built", fn) }
 *
 * Settings are kept in localStorage under "awym-intro-v1" (shared by every
 * page opened from this folder in OBS, so the dock and the source agree).
 * Blank fonts mean "use the theme" (--font-display / -heading / -body).
 *
 * The timeline, in order: the two corner panels slam together (shake +
 * flash) → center stamps one after another (VS, ROUND 1, a logo…) → the two
 * speech bubbles → the stamp and bubbles fly out → the title lands letter by
 * letter (confetti, sound bars, tagline, episode badge, name plates) → hold →
 * optional wipe to black. "Speed" scales every step; "Hold on title" doesn't.
 */
(function () {
  const KEY = "awym-intro-v1";

  /** Every setting with its default. The types here are also the check for saved / pasted settings. */
  const DEFAULTS = {
    episode: "EPISODE 01", line1: "ARGUE WITH", line2: "YO MOMMA",
    tagline: "Two generations. One table. Zero agreement.",
    leftQuote: "Actually, I read that…", rightQuote: "Because I said so.",
    speed: 1, hold: 2.5, stagger: 70,
    energy: 60, shake: 22, letterStyle: "Drop",
    cornerColors: "pick", hueA: 218, hueB: 8, sat: 82, depth: 50,
    titleSize: 250, particles: 80, bars: 28, grain: 12,
    bubbles: true, outro: true, loop: false, sound: false, autoNext: true,
    stamps: [{ type: "word", text: "VS" }], centerSize: 300,
    plates: true, plateTheme: false,
    tlName: "YOUR NAME", tlRole: "HOST", tlHandle: "", tlNum: "",
    trName: "MOMMA", trRole: "CO-HOST", trHandle: "", trNum: "",
    llName: "GUEST ONE", llRole: "GUEST", llHandle: "", llNum: "",
    lrName: "GUEST TWO", lrRole: "GUEST", lrHandle: "", lrNum: "",
    fontDisplay: "", fontHeavy: "", fontBody: "", fontLabel: ""
  };
  const LIMITS = { speed: [.5, 2], hold: [.5, 6], stagger: [20, 200], energy: [0, 100], shake: [0, 60], hueA: [0, 360], hueB: [0, 360],
    sat: [20, 100], depth: [0, 100], titleSize: [140, 320], particles: [0, 200], bars: [0, 48], grain: [0, 40], centerSize: [120, 440] };
  const CHOICES = { letterStyle: ["Drop", "Slam", "Spin", "Rise"], cornerColors: ["pick", "theme"] };
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const FONT_OK = /^[A-Za-z0-9 ]{0,40}$/;

  /** Keep only known settings of the right type and range; anything else falls back to the default. */
  function clean(obj) {
    const st = clone(DEFAULTS);
    if (!obj || typeof obj !== "object") return st;
    Object.keys(DEFAULTS).forEach((k) => {
      const v = obj[k];
      if (v === undefined || typeof v !== typeof DEFAULTS[k]) return;
      if (k === "stamps") {
        if (Array.isArray(v) && v.length <= 4 && v.every((x) => x && ((x.type === "word" && typeof x.text === "string") ||
            (x.type === "image" && typeof x.src === "string" && /^data:image\//.test(x.src))))) {
          st.stamps = v.map((x) => x.type === "word" ? { type: "word", text: x.text.slice(0, 24) } : { type: "image", src: x.src, name: String(x.name || "").slice(0, 40) });
        }
        return;
      }
      if (/^font/.test(k)) { if (FONT_OK.test(v)) st[k] = v.trim(); return; }
      if (LIMITS[k]) { if (isFinite(v)) st[k] = Math.min(LIMITS[k][1], Math.max(LIMITS[k][0], v)); return; }
      if (CHOICES[k]) { if (CHOICES[k].includes(v)) st[k] = v; return; }
      st[k] = typeof v === "string" ? v.slice(0, /Num$/.test(k) ? 2 : 80) : v;
    });
    return st;
  }
  /** Saved settings, or the defaults. */
  function load() {
    try { return clean(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { return clone(DEFAULTS); }
  }
  /** Save settings; false if browser storage is full (big uploaded stamp pictures). */
  function save(st) {
    try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; }
  }

  /* ---------- fonts ---------- */
  const fontState = {};
  /** Load a Google Font by family name (tries bold + italic weights, then plain). Resolves true, or false if Google doesn't have it. */
  function loadFont(name) {
    if (!name) return Promise.resolve(true);
    if (fontState[name]) return fontState[name];
    const fam = encodeURIComponent(name).replace(/%20/g, "+");
    const tries = [fam + ":ital,wght@0,400;0,700;0,800;1,700;1,800", fam + ":wght@400;700", fam];
    fontState[name] = new Promise((res) => {
      (function next(i) {
        if (i >= tries.length) { res(false); return; }
        const l = document.createElement("link"); l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=" + tries[i] + "&display=swap";
        l.onload = () => res(true);
        l.onerror = () => { l.remove(); next(i + 1); };
        document.head.appendChild(l);
      })(0);
    }).then((ok) => {
      if (!ok || !document.fonts) return ok;
      return Promise.all([document.fonts.load('400 80px "' + name + '"'), document.fonts.load('700 80px "' + name + '"')]).then(() => true, () => true);
    });
    return fontState[name];
  }
  const FONT_VARS = { fontDisplay: ["--sf-display", "Impact, sans-serif"], fontHeavy: ["--sf-heading", "Impact, sans-serif"],
    fontBody: ["--sf-body", "'Arial Narrow', Arial, sans-serif"], fontLabel: ["--sf-label", "Impact, sans-serif"] };

  /** "#F26B1D" → [hue 0–360, saturation 0–100]; null if it isn't a hex color. */
  function hexHS(hex) {
    const m = String(hex || "").trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    let h = m[1]; if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
    let hue = 0;
    if (d) hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    return [Math.round((hue * 60 + 360) % 360), Math.round(Math.min(1, s) * 100)];
  }

  /* ---------- sound effects (made in code, no audio files) ---------- */
  let ac = null, master = null, noise = null;
  function ensureAudio() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ac = new AC(); master = ac.createGain(); master.gain.value = .7; master.connect(ac.destination);
        noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === "suspended") ac.resume();
    } catch (e) { ac = null; }
  }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function tone(type, f0, f1, dur, peak, filt) {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, .006, peak, dur); let node = o;
    if (filt) { const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filt; o.connect(f); node = f; }
    node.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function hiss(type, freq, freq2, dur, peak) {
    const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = type; f.Q.value = 1.2;
    f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    env(g, t, dur * .45, peak, dur * .55);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .05);
  }
  const SFX = {
    whoosh: () => hiss("bandpass", 300, 2600, .45, .35),
    thud: () => { tone("sine", 150, 38, .45, .9); hiss("lowpass", 900, 200, .2, .45); },
    stamp: () => { tone("square", 190, 90, .22, .28, 1800); hiss("highpass", 2500, 4000, .09, .25); },
    popHi: () => tone("sine", 520, 1050, .12, .45),
    popLo: () => tone("sine", 360, 720, .14, .45),
    out: () => hiss("bandpass", 2400, 400, .35, .22),
    chord: () => { [261.6, 329.6, 392, 523.3].forEach((f) => tone("sawtooth", f, f * 1.003, 1.1, .07, 2200)); tone("sine", 130, 50, .4, .6); },
    iris: () => hiss("lowpass", 1800, 120, .7, .3)
  };

  /* ---------- the stage ---------- */
  const PLATE = '<div class="pnum"></div><div class="pmask"><div class="ppanel"><div class="pname"></div><div class="pmeta"><span class="prole"></span><span class="phandle"></span></div></div></div>';
  const TEMPLATE = `
    <div class="shaker">
      <div class="panel l"></div><div class="panel r"></div><div class="seam"></div>
      <div class="plate l top" data-k="tl">${PLATE}</div><div class="plate r top" data-k="tr">${PLATE}</div>
      <div class="chip-row"><div class="chip"></div></div>
      <div class="bubble l"><span class="q"></span></div><div class="bubble r"><span class="q"></span></div>
      <div class="vs-wrap"><div class="ring"></div><div class="ring"></div><div class="stamps"></div></div>
      <div class="title"><div class="line1"></div><div class="line2"></div><div class="tag-tilt"><div class="tag-band"></div></div></div>
      <div class="bars-row"><div class="bars"></div></div>
      <div class="plate l" data-k="ll">${PLATE}</div><div class="plate r" data-k="lr">${PLATE}</div>
      <div class="burst"></div>
    </div>
    <div class="flash"></div>
    <div class="iris-wrap"><div class="iris"></div></div>
    <div class="vignette"></div>
    <div class="grain"></div>`;
  const BALL = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ball" cx="50" cy="50" r="46"/><path class="bseam" d="M50 4v92M4 50h92M18 18c18 16 18 48 0 64M82 18c-18 16-18 48 0 64"/></svg>';

  /**
   * Turn a 1920 × 1080 element into the intro.
   * @param {HTMLElement} root
   * @returns {Object} the player (see the top of this file)
   */
  function mount(root) {
    const A = window.anime;
    const q = (s) => root.querySelector(s);
    const qa = (s) => Array.from(root.querySelectorAll(s));
    root.classList.add("awi");
    root.innerHTML = TEMPLATE;
    const shaker = q(".shaker"), panelL = q(".panel.l"), panelR = q(".panel.r"), seam = q(".seam"), flash = q(".flash");
    const chip = q(".chip"), bubL = q(".bubble.l"), bubR = q(".bubble.r"), stampsBox = q(".stamps"), rings = qa(".ring");
    const line1 = q(".line1"), line2 = q(".line2"), band = q(".tag-band"), barsBox = q(".bars"), burst = q(".burst"), iris = q(".iris");
    const PLATES = ["tl", "tr", "ll", "lr"].map((k) => ({ k, el: q(`.plate[data-k="${k}"]`), dir: k[1] === "l" ? -1 : 1, top: k[0] === "t" }));

    let st = clone(DEFAULTS), tl = null, barsAnim = null, holdAt = 0, playing = false, scrub = false;
    const handlers = { update: [], complete: [], built: [] };
    const emit = (name) => handlers[name].forEach((fn) => { try { fn(api); } catch (e) {} });

    /* colors, grain and fonts: CSS variables on the stage, no rebuild needed */
    function applyLook() {
      let hA = st.hueA, hB = st.hueB, sA = st.sat, sB = st.sat;
      if (st.cornerColors === "theme") {
        const tv = (k) => (window.AWYM && AWYM.themeValue) ? AWYM.themeValue(k) : getComputedStyle(document.documentElement).getPropertyValue("--" + k).trim();
        const p = hexHS(tv("primary")), s2 = hexHS(tv("secondary"));
        if (p) { hA = p[0]; sA = Math.max(30, p[1]); }
        if (s2) { hB = s2[0]; sB = Math.max(30, s2[1]); }
      }
      const set = (k, v) => root.style.setProperty(k, v);
      set("--hA", hA); set("--hB", hB); set("--sat", st.sat + "%"); set("--sA", sA + "%"); set("--sB", sB + "%");
      set("--lp", (62 - st.depth * .45).toFixed(1) + "%");
      set("--grain", (st.grain / 100).toFixed(2));
      root.classList.toggle("theme-plates", !!st.plateTheme);
      const waits = Object.entries(FONT_VARS).map(([k, [v, fallback]]) => {
        if (!st[k]) { root.style.removeProperty(v); return Promise.resolve(true); }
        root.style.setProperty(v, `"${st[k]}", ${fallback}`);
        return loadFont(st[k]);
      });
      return Promise.all(waits);
    }

    /* ---------- the words, stamps, confetti and bars ---------- */
    function fillPlate(P) {
      const g = (s) => String(st[P.k + s] || "").trim();
      P.el.querySelector(".pname").textContent = g("Name");
      P.el.querySelector(".prole").textContent = g("Role");
      let h = g("Handle");
      if (h && h[0] !== "@" && !h.includes("/") && !h.includes(".")) h = "@" + h;
      P.el.querySelector(".phandle").textContent = h;
      const n = g("Num").slice(0, 2), b = P.el.querySelector(".pnum");
      if (n) { b.textContent = n; b.style.fontSize = n.length > 1 ? "80px" : "92px"; } else b.innerHTML = BALL;
      P.el.hidden = !st.plates || !g("Name");
    }
    function renderText() {
      PLATES.forEach(fillPlate);
      bubL.querySelector(".q").textContent = st.leftQuote;
      bubR.querySelector(".q").textContent = st.rightQuote;
      bubL.hidden = bubR.hidden = !st.bubbles;
      chip.textContent = st.episode;
      chip.parentNode.hidden = !st.episode.trim();

      stampsBox.textContent = "";
      st.stamps.forEach((s) => {
        if (s.type === "word" && !s.text.trim()) return;
        const d = document.createElement("div");
        d.className = "stamp " + (s.type === "image" ? "img" : "word");
        if (s.type === "image") {
          const im = document.createElement("img"); im.src = s.src; im.alt = "";
          im.style.height = Math.round(st.centerSize * 1.4) + "px"; d.appendChild(im);
        } else d.textContent = s.text.trim();
        stampsBox.appendChild(d);
      });

      line1.textContent = "";
      Array.from(st.line1.trim()).forEach((c) => {
        const s = document.createElement("span");
        s.className = c === " " ? "sp" : "ch"; if (c !== " ") s.textContent = c;
        line1.appendChild(s);
      });
      line2.textContent = "";
      st.line2.trim().split(/\s+/).filter(Boolean).forEach((w) => {
        const wd = document.createElement("span"); wd.className = "word";
        Array.from(w).forEach((c) => {
          const s = document.createElement("span"); s.className = "ch"; s.textContent = c;
          s._dy = -A.random(520, 820); s._r = A.random(-34, 34); s._spin = A.random(-280, -140);
          wd.appendChild(s);
        });
        line2.appendChild(wd);
      });
      band.textContent = "";
      st.tagline.trim().split(/\s+/).filter(Boolean).forEach((w) => { const s = document.createElement("span"); s.className = "w"; s.textContent = w; band.appendChild(s); });
      band.parentNode.hidden = !st.tagline.trim();

      burst.textContent = "";
      for (let i = 0; i < st.particles; i++) {
        const p = document.createElement("div");
        p.className = "p " + (Math.random() < .5 ? "c" : "s") + " k" + (i % 4);
        p._vx = A.random(-950, 950); p._up = -A.random(140, 560); p._fall = A.random(260, 720); p._rot = A.random(-720, 720);
        burst.appendChild(p);
      }
    }
    /** Shrink text that would run past maxW (design pixels). */
    function fit(el, base, maxW) {
      el.style.fontSize = base + "px";
      const w = Math.max(el.scrollWidth, el.offsetWidth);
      if (w > maxW) el.style.fontSize = (base * maxW / w).toFixed(1) + "px";
    }
    /** Sound bars, narrowed to fit between the bottom name plates. */
    function renderBars() {
      barsBox.textContent = "";
      const n = st.bars; if (!n) return;
      let avail = 1500;
      if (st.plates) {
        const side = Math.max(...PLATES.filter((P) => !P.top && !P.el.hidden).map((P) => P.el.offsetWidth), 0);
        if (side) avail = Math.max(120, 1920 - 2 * (96 + side + 44));
      }
      const unit = Math.min(24, avail / n), w = Math.max(3, unit * .58), gap = Math.max(2, unit - w);
      barsBox.style.gap = gap.toFixed(1) + "px";
      for (let i = 0; i < n; i++) {
        const b = document.createElement("div"); b.className = "bar";
        b.style.width = w.toFixed(1) + "px"; b.style.borderRadius = (w / 2).toFixed(1) + "px";
        barsBox.appendChild(b);
      }
    }

    /* ---------- the timeline ---------- */
    function build() {
      if (tl) { tl.pause(); tl.revert(); }
      if (barsAnim) { barsAnim.pause(); barsAnim.revert(); }
      playing = false;
      renderText();
      PLATES.forEach((P) => fit(P.el.querySelector(".pname"), 56, 480));
      renderBars();
      fit(line1, 78, 1600);
      fit(line2, st.titleSize, 1720);
      fit(band, 46, 1500);
      qa(".stamp.word").forEach((el) => fit(el, st.centerSize, 1560));

      const k = 1 / st.speed, T = (x) => x * k;
      const E = st.energy / 100, S = st.shake;
      const period = (1.1 - E * .8).toFixed(2);
      const elastic = E < .05 ? "outQuart" : `outElastic(1, ${period})`;
      const settle = E < .05 ? "outQuart" : `outElastic(1, ${Math.min(1.3, +period + .3).toFixed(2)})`;

      tl = A.createTimeline({
        autoplay: false,
        defaults: { ease: "outExpo" },
        onUpdate: () => emit("update"),
        onComplete: () => { playing = false; if (barsAnim) barsAnim.pause(); emit("update"); emit("complete"); }
      });
      const cue = (fn, at) => tl.call(() => { if (st.sound && playing && !scrub && ac) fn(); }, at);
      const shake = (amp, at) => {
        if (amp <= 0) return;
        tl.add(shaker, {
          translateX: [{ to: amp, duration: T(40) }, { to: -amp * .8, duration: T(50) }, { to: amp * .5, duration: T(55) }, { to: -amp * .25, duration: T(60) }, { to: 0, duration: T(80) }],
          translateY: [{ to: -amp * .6, duration: T(40) }, { to: amp * .5, duration: T(50) }, { to: -amp * .3, duration: T(55) }, { to: amp * .1, duration: T(60) }, { to: 0, duration: T(80) }],
          ease: "inOutSine"
        }, at);
      };

      /* 1. the corners slam together */
      const ov = 30 + 160 * E;
      tl.add(panelL, { translateX: [{ from: -2300, to: ov, duration: T(460), ease: "inCubic" }, { to: 0, duration: T(750), ease: settle }] }, 0);
      tl.add(panelR, { translateX: [{ from: 2300, to: -ov, duration: T(460), ease: "inCubic" }, { to: 0, duration: T(750), ease: settle }] }, 0);
      cue(SFX.whoosh, 0);
      cue(SFX.thud, T(450));
      tl.add(flash, { opacity: [{ from: 0, to: .6, duration: T(30) }, { to: 0, duration: T(340) }], ease: "outQuad" }, T(450));
      shake(S, T(455));
      tl.add(seam, { opacity: [0, 1], duration: T(260), ease: "outQuad" }, T(520));

      /* 2. center stamps, one after another */
      const stampEls = Array.from(stampsBox.children);
      let at = T(650), lastStamp = null, lastAt = T(650);
      stampEls.forEach((el, i) => {
        if (lastStamp) tl.add(lastStamp, { scale: [1, 0], opacity: { from: 1, to: 0, duration: T(160), delay: T(80), ease: "linear" }, duration: T(240), ease: "inBack" }, at - T(110));
        const rot = i % 2 ? 5 : -6;
        tl.add(el, { scale: [3.4, 1], rotate: [rot * 4.6, rot], duration: T(850), ease: elastic, opacity: { from: 0, to: 1, duration: T(100), ease: "linear" } }, at);
        tl.add(rings, { scale: [.3, 2.8], opacity: [{ from: 0, to: .9, duration: T(40) }, { to: 0, duration: T(720) }], duration: T(800), delay: A.stagger(T(120)) }, at + T(50));
        cue(SFX.stamp, at + T(30));
        shake(S * .4, at + T(70));
        lastStamp = el; lastAt = at; at += T(1000);
      });

      /* 3. the argument */
      const b1 = lastAt + T(500);
      let outAt;
      if (st.bubbles) {
        tl.add(bubL, { scale: [0, 1], rotate: [-14, -3], duration: T(800), ease: elastic, opacity: { from: 0, to: 1, duration: T(80), ease: "linear" } }, b1);
        cue(SFX.popHi, b1);
        tl.add(bubR, { scale: [0, 1], rotate: [14, 2], duration: T(800), ease: elastic, opacity: { from: 0, to: 1, duration: T(80), ease: "linear" } }, b1 + T(600));
        cue(SFX.popLo, b1 + T(600));
        if (lastStamp) tl.add(lastStamp, { scale: [{ to: 1.16, duration: T(90) }, { to: 1, duration: T(280) }], ease: "outQuad" }, b1 + T(610));
        outAt = b1 + T(1450);
      } else {
        outAt = lastAt + T(950);
      }
      const outs = lastStamp ? [lastStamp] : [];
      if (st.bubbles) outs.push(bubL, bubR);
      if (outs.length) {
        tl.add(outs, { scale: 0, opacity: { to: 0, duration: T(200), delay: T(140), ease: "linear" }, duration: T(380), ease: "inBack", delay: A.stagger(T(50)) }, outAt);
        cue(SFX.out, outAt);
      }

      /* 4. the title */
      const c1 = qa(".line1 .ch"), c2 = qa(".line2 .ch");
      if (c1.length) tl.add(c1, { translateY: [70, 0], opacity: [0, 1], duration: T(600), delay: A.stagger(T(Math.max(12, st.stagger * .45))) }, outAt + T(220));
      const start2 = outAt + T(420);
      let L = start2 + T(260);
      if (c2.length) {
        const props = {
          Slam: { scale: [2.8, 1] },
          Spin: { scale: [0, 1], rotate: { from: (el) => el._spin, to: 0 } },
          Rise: { translateY: [300, 0], scaleY: [1.5, 1] },
          Drop: { translateY: { from: (el) => el._dy, to: 0 }, rotate: { from: (el) => el._r, to: 0 } }
        }[st.letterStyle] || {};
        tl.add(c2, Object.assign({ duration: T(1100), ease: elastic, delay: A.stagger(T(st.stagger)),
          opacity: { from: 0, to: 1, duration: T(140), ease: "linear" } }, props), start2);
        L = start2 + (c2.length - 1) * T(st.stagger) + T(260);
      }

      /* 5. landing: confetti, bars, tagline, badge, name plates */
      cue(SFX.chord, L);
      shake(S * .55, L);
      const parts = qa(".burst .p");
      if (parts.length) tl.add(parts, {
        translateX: { from: 0, to: (el) => el._vx },
        translateY: [{ from: 0, to: (el) => el._up, duration: T(650), ease: "outQuad" }, { to: (el) => el._fall, duration: T(1250), ease: "inQuad" }],
        rotate: { from: 0, to: (el) => el._rot },
        opacity: [{ from: 0, to: 1, duration: T(40) }, { to: 1, duration: T(1150) }, { to: 0, duration: T(700) }],
        duration: T(1900), ease: "outCubic"
      }, L);
      const bars = qa(".bars .bar");
      if (bars.length) tl.add(barsBox, { opacity: [0, 1], translateY: [50, 0], duration: T(700) }, L);
      const words = qa(".tag-band .w");
      let end = L + T(900);
      if (words.length) {
        tl.add(band, { scaleX: [0, 1], duration: T(520) }, L + T(80));
        tl.add(words, { translateY: [40, 0], opacity: [0, 1], duration: T(550), delay: A.stagger(T(60)) }, L + T(200));
        end = Math.max(end, L + T(200) + (words.length - 1) * T(60) + T(550));
      }
      if (st.episode.trim()) tl.add(chip, { translateY: [-70, 0], opacity: [0, 1], duration: T(800), ease: elastic }, L + T(350));
      let pi = 0;
      if (st.plates) PLATES.forEach((P) => {
        if (P.el.hidden) return;
        const pa = L + T(450 + pi * 160), d = P.dir; pi++;
        tl.add(P.el.querySelector(".pnum"), { scale: [0, 1], rotate: [d * 120, 0], duration: T(650), ease: elastic }, pa);
        tl.add(P.el.querySelector(".ppanel"), { translateX: [(d * 101) + "%", "0%"], duration: T(600), ease: "outQuart" }, pa + T(150));
        tl.add([P.el.querySelector(".pname"), P.el.querySelector(".pmeta")], { translateX: [d * 40, 0], opacity: [0, 1], duration: T(500), ease: "outQuart", delay: A.stagger(T(110)) }, pa + T(330));
        cue(d > 0 ? SFX.popLo : SFX.popHi, pa);
        end = Math.max(end, pa + T(330 + 110 + 500));
      });
      holdAt = end;

      /* 6. hold, then the wipe */
      const endHold = holdAt + st.hold * 1000;
      if (st.outro) {
        tl.add(iris, { scale: [0, 1], duration: T(750), ease: "inOutQuart" }, endHold);
        cue(SFX.iris, endHold);
      } else {
        tl.add({ v: 0 }, { v: 1, duration: 1 }, endHold);       // keeps the hold on screen to the end
      }

      /* the sound bars bounce on their own loop */
      barsAnim = null;
      if (bars.length) {
        A.set(bars, { scaleY: .2 });
        const kf = [];
        for (let i = 0; i < 6; i++) kf.push({ to: () => A.random(12, 100) / 100, duration: () => A.random(140, 320) * k });
        barsAnim = A.animate(bars, { scaleY: kf, ease: "inOutSine", loop: true, alternate: true, autoplay: false });
      }
      emit("built");
    }

    /* ---------- the player ---------- */
    const api = {
      /** Apply settings and rebuild. {replay:true} plays from the start, otherwise it shows the title frame. */
      set(next, opts = {}) {
        st = clean(next);
        const fontsIn = applyLook();
        build();
        if (opts.replay) api.play(true); else if (opts.at != null) api.seek(opts.at); else api.seekHold();
        // fonts that weren't loaded yet change text widths: fit again once they are (unless it's playing)
        fontsIn.then(() => { if (!playing && tl) { const t = tl.currentTime; build(); api.seek(t); } });
        return fontsIn;
      },
      /** Colors / grain / plate colors only (no rebuild): for live slider drags. */
      look(next) { st = clean(next); applyLook(); },
      play(fromStart) {
        if (!tl) return;
        if (st.sound) ensureAudio();
        root.classList.remove("cleared");
        playing = true;
        if (fromStart || tl.completed || tl.currentTime >= tl.duration) tl.restart(); else tl.play();
        if (barsAnim) barsAnim.play();
        emit("update");
      },
      pause() { playing = false; if (tl) tl.pause(); if (barsAnim) barsAnim.pause(); emit("update"); },
      seek(ms) { if (!tl) return; tl.seek(Math.max(0, Math.min(tl.duration, ms))); if (barsAnim) barsAnim.seek((ms * .7) % 2000); emit("update"); },
      seekHold() { api.seek(holdAt); },
      /** Panic button: hide the intro until it's played again. */
      hide(on) { if (on) api.pause(); root.classList.toggle("cleared", !!on); },
      scrubbing(on) { scrub = !!on; },
      ensureAudio,
      state() { return { playing, time: tl ? tl.currentTime : 0, duration: tl ? tl.duration : 0, holdAt, settings: st }; },
      on(name, fn) { if (handlers[name]) handlers[name].push(fn); return api; }
    };
    if (window.AWYM && AWYM.onTheme) AWYM.onTheme(() => { applyLook(); });
    return api;
  }

  /** Put people's names on the four name plates: plates = { tl, tr, ll, lr: {name, role} } (a blank
      name = no plate). Other plate fields (handle, number) are left as they are. Returns new settings. */
  function applyNames(st, plates) {
    const next = clone(st || DEFAULTS);
    if (plates && typeof plates === "object") ["tl", "tr", "ll", "lr"].forEach((k) => {
      const p = plates[k]; if (!p || typeof p !== "object") return;
      if (typeof p.name === "string") next[k + "Name"] = p.name;
      if (typeof p.role === "string") next[k + "Role"] = p.role;
    });
    return clean(next);
  }
  window.AWYM_INTRO = { KEY, DEFAULTS, clean, load, save, loadFont, mount, hexHS, applyNames };
})();
