/**
 * backgrounds.js — the animated background scenes used by background.html
 * ========================================================================
 * Every scene is original artwork drawn in code with your theme colors. They
 * are inspired by genres, never official logos, characters or game art.
 *
 * Sets: window.AWYM_SCENES          { key: scene }   (key is what ?scene= uses)
 *       window.AWYM_SCENE_HELPERS   { rgba, mix, seeded }
 * Used by: background.html (draws them), background-gallery.html, theme-editor.html,
 *          theme-dock.html and screen-maker.html (list them by name and group).
 *
 * A scene object:
 *   name   shown in pickers, e.g. "Fight Night"
 *   group  "Shows" | "Style" | "Abstract" (how pickers group them)
 *   desc   one-line description for pickers
 *   title  title style on the background: "block" | "neon" | "pixel"
 *   persistent  (optional) true = don't clear the canvas between frames (trails)
 *   build(env) → { draw(ctx, t, dt) }   (the court scene is HTML/SVG instead: build returns null)
 *
 * env, given to build():
 *   env.C      theme colors {primary, secondary, accent, dark, light, digit} as "#RRGGBB"
 *   env.amt    intensity: 0.6 low · 1 medium · 1.6 high (multiply opacities by it)
 *   env.glow   glow strength from the Theme Panel: 0 off · 1 normal · 2 double
 *              (multiply glow/halo opacities by it; read it in draw() so it updates live)
 *   env.speed  speed multiplier (already applied to t and dt)
 *   env.rnd()  seeded random number 0–1, so a scene looks the same every load
 *   env.layer(fn)  draw something once into an off-screen canvas (for static parts)
 *
 * draw(ctx, t, dt) is called every frame. Coordinates are always 1920 × 1080
 * (background.html scales to the real size). t = seconds since start, dt =
 * seconds since the last frame, both already multiplied by the speed.
 *
 * To add a scene: copy an existing one, give it a new key below, and it shows
 * up in every picker automatically.
 */
(function () {
  const W = 1920, H = 1080, TAU = Math.PI * 2;

  /* ---------- small helpers ---------- */
  /** "#RRGGBB" → [r, g, b] */
  const hexToRgb = (h) => { const n = parseInt(String(h).replace("#", ""), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  /** "#RRGGBB" + opacity (clamped 0–1) → "rgba(r,g,b,a)" */
  const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
  /** Blend two "#RRGGBB" colors; t = 0 gives a, 1 gives b. */
  const mix = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  /** Repeatable random numbers (Park–Miller): seeded(42)() → 0–1, same sequence every time. */
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  /** Linear interpolation between a and b. */
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Path for a four-point sparkle centred on (x, y) with radius r (caller fills it). */
  function star4(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.closePath();
  }
  /** Path for a rounded rectangle (caller fills or strokes it). */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // card suits, drawn as paths so they look the same on every computer
  /**
   * Fill a playing-card suit drawn from paths (looks the same on every computer).
   * @param {string} kind "spade" | "heart" | "diamond" | "club"
   * @param {number} s    size in pixels (about the suit's height)
   */
  function suit(ctx, kind, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100); ctx.beginPath();
    if (kind === "heart" || kind === "spade") {
      if (kind === "spade") ctx.scale(1, -1);
      ctx.moveTo(0, 40); ctx.bezierCurveTo(-60, -5, -45, -55, 0, -22); ctx.bezierCurveTo(45, -55, 60, -5, 0, 40);
      if (kind === "spade") { ctx.moveTo(0, 0); ctx.lineTo(-14, -52); ctx.lineTo(14, -52); ctx.closePath(); }
    } else if (kind === "diamond") {
      ctx.moveTo(0, -48); ctx.lineTo(34, 0); ctx.lineTo(0, 48); ctx.lineTo(-34, 0); ctx.closePath();
    } else {
      ctx.arc(0, -22, 19, 0, TAU); ctx.moveTo(22, 6); ctx.arc(-19, 6, 19, 0, TAU); ctx.moveTo(41, 6); ctx.arc(19, 6, 19, 0, TAU);
      ctx.moveTo(0, 0); ctx.lineTo(-14, 46); ctx.lineTo(14, 46); ctx.closePath();
    }
    ctx.fill(); ctx.restore();
  }
  const SUITS = ["spade", "heart", "diamond", "club"];

  // rising embers / sparks, used by a few scenes
  /**
   * A reusable particle system of rising embers/sparks.
   * @param {number} n    how many particles
   * @param {function} rnd  random source (env.rnd)
   * @param {{vmin:number, vmax:number, rmax:number}} opt  rise speed range (px/s) and max radius
   * @returns {function(ctx, dt, color, amt, streak)} draw function; streak=true draws short streaks
   */
  function makeEmbers(n, rnd, opt) {
    const list = Array.from({ length: n }, () => spawn(true));
    function spawn(any) {
      return { x: rnd() * W, y: any ? rnd() * H : H + 20, vy: lerp(opt.vmin, opt.vmax, rnd()), vx: (rnd() - .5) * 30,
               life: 0, max: lerp(3, 8, rnd()), r: lerp(1.5, opt.rmax, rnd()), w: rnd() * TAU };
    }
    return function draw(ctx, dt, color, amt, streak) {
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        e.life += dt; e.y -= e.vy * dt; e.w += dt * 2; e.x += (e.vx + Math.sin(e.w) * 20) * dt;
        if (e.y < -30 || e.life > e.max) { list[i] = spawn(false); continue; }
        const fade = Math.min(1, e.life / .6) * Math.max(0, 1 - e.life / e.max);
        ctx.fillStyle = rgba(color, fade * .8 * amt);
        if (streak) { ctx.fillRect(e.x, e.y, e.r * .8, e.r * 6); }
        else { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill(); }
      }
    };
  }

  /* ---------- the scenes (keys are the ?scene= names) ---------- */
  const S = {};

  /* =====================================================================
     SHOWS
     ===================================================================== */

  S.court = { name: "Basketball Court", group: "Shows", desc: "Hardwood court with arena lighting", title: "block", dom: true, build() { return null; } };

  /* ---------- Fight Night (fighting games, e.g. Tekken shows) ---------- */
  S.fighter = {
    name: "Fight Night", group: "Shows", desc: "Versus-screen split, speed lines, sparks — fighting games", title: "block",
    build(env) {
      const { C, rnd } = env;
      const bg = env.layer((c) => {
        c.fillStyle = C.dark; c.fillRect(0, 0, W, H);
        let g = c.createLinearGradient(0, 0, 1000, 0); g.addColorStop(0, rgba(C.primary, .55)); g.addColorStop(1, rgba(C.primary, .05));
        c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(1100, 0); c.lineTo(820, H); c.lineTo(0, H); c.fill();
        g = c.createLinearGradient(W, 0, 900, 0); g.addColorStop(0, rgba(C.accent, .45)); g.addColorStop(1, rgba(C.accent, .04));
        c.fillStyle = g; c.beginPath(); c.moveTo(1100, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(820, H); c.fill();
        // halftone along the split
        for (let y = 0; y < H; y += 22) for (let x = -200; x < 200; x += 22) {
          const sx = lerp(1100, 820, y / H) + x, r = Math.max(0, 5 - Math.abs(x) / 40);
          if (r > .3) { c.fillStyle = rgba(C.light, .08); c.beginPath(); c.arc(sx, y, r, 0, TAU); c.fill(); }
        }
        const v = c.createRadialGradient(960, 540, 300, 960, 540, 1100); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.6)");
        c.fillStyle = v; c.fillRect(0, 0, W, H);
      });
      const lines = Array.from({ length: 80 }, () => ({ a: rnd() * TAU, w: lerp(.004, .014, rnd()), seed: rnd() * 10, f: lerp(1, 3, rnd()) }));
      const embers = makeEmbers(70, rnd, { vmin: 60, vmax: 160, rmax: 2.6 });
      let bolt = null, nextBolt = 2;
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          // speed lines radiating from the center
          for (const l of lines) {
            const a = .03 + .07 * Math.max(0, Math.sin(t * l.f + l.seed));
            ctx.fillStyle = rgba(C.light, a * env.amt);
            const ang = l.a + t * .01;
            ctx.beginPath(); ctx.moveTo(960 + Math.cos(ang) * 260, 540 + Math.sin(ang) * 260);
            ctx.lineTo(960 + Math.cos(ang - l.w) * 1500, 540 + Math.sin(ang - l.w) * 1500);
            ctx.lineTo(960 + Math.cos(ang + l.w) * 1500, 540 + Math.sin(ang + l.w) * 1500); ctx.fill();
          }
          // glowing split line, with an occasional crackle
          ctx.strokeStyle = rgba(C.light, .35 * env.amt); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(1100, 0); ctx.lineTo(820, H); ctx.stroke();
          ctx.strokeStyle = rgba(C.light, .7 * env.amt); ctx.lineWidth = 3; ctx.stroke();
          nextBolt -= dt;
          if (nextBolt < 0) { nextBolt = lerp(3, 7, rnd()); bolt = { life: 0, pts: Array.from({ length: 14 }, (_, i) => [lerp(1100, 820, i / 13) + (rnd() - .5) * 70, i / 13 * H]) }; }
          if (bolt) {
            bolt.life += dt; const k = 1 - bolt.life / .35;
            if (k <= 0) bolt = null; else {
              ctx.strokeStyle = rgba(C.digit, k * .8 * env.amt); ctx.lineWidth = 4; ctx.beginPath();
              bolt.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
            }
          }
          embers(ctx, dt, mix(C.primary, C.digit, .5), env.amt, true);
        }
      };
    }
  };

  /* ---------- Retro Arcade (8-bit look, scrolling pixel landscape) ---------- */
  S.retro = {
    name: "Retro Arcade", group: "Shows", desc: "8-bit night sky, scrolling pixel hills, CRT scanlines", title: "pixel",
    build(env) {
      const { C, rnd } = env;
      const lw = 320, lh = 180, low = document.createElement("canvas"); low.width = lw; low.height = lh;
      const c = low.getContext("2d");
      const stars = Array.from({ length: 70 }, () => ({ x: Math.floor(rnd() * lw), y: Math.floor(rnd() * 100), p: rnd() * TAU, big: rnd() < .15 }));
      const ridge = (n, min, max, step) => { const a = []; let h = (min + max) / 2; for (let i = 0; i < n; i++) { if (i % step === 0) h = Math.max(min, Math.min(max, h + Math.round((rnd() - .5) * 14))); a.push(h); } return a; };
      const far = ridge(640, 50, 95, 8), near = ridge(640, 25, 55, 5);
      const clouds = Array.from({ length: 5 }, () => ({ x: rnd() * lw, y: 15 + rnd() * 50, w: 14 + Math.floor(rnd() * 20), v: 2 + rnd() * 3 }));
      const crt = env.layer((x) => {
        x.fillStyle = "rgba(0,0,0,.22)"; for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 2);
        const v = x.createRadialGradient(960, 540, 400, 960, 540, 1150); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.7)");
        x.fillStyle = v; x.fillRect(0, 0, W, H);
      });
      const bands = [C.dark, mix(C.dark, C.secondary, .5), C.secondary, mix(C.secondary, C.primary, .25), mix(C.secondary, C.primary, .45)];
      return {
        draw(ctx, t) {
          bands.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 22, lw, 22); });
          c.fillStyle = bands[4]; c.fillRect(0, 110, lw, 70);
          for (const s of stars) {
            const on = Math.sin(t * 2 + s.p) > -.3;
            if (!on) continue;
            c.fillStyle = rgba(C.light, .8); c.fillRect(s.x, s.y, 1, 1);
            if (s.big && Math.sin(t * 3 + s.p) > .6) { c.fillRect(s.x - 1, s.y, 3, 1); c.fillRect(s.x, s.y - 1, 1, 3); }
          }
          c.fillStyle = C.light; c.beginPath(); c.arc(250, 34, 12, 0, TAU); c.fill();
          c.fillStyle = bands[1]; c.beginPath(); c.arc(256, 30, 10, 0, TAU); c.fill();
          for (const cl of clouds) {
            const x = Math.floor(((cl.x + t * cl.v) % (lw + 40)) - 40);
            c.fillStyle = rgba(C.light, .25); c.fillRect(x, cl.y, cl.w, 4); c.fillRect(x + 4, cl.y - 3, cl.w - 8, 3);
          }
          const fo = Math.floor(t * 4), no = Math.floor(t * 12);
          c.fillStyle = mix(C.secondary, C.dark, .35);
          for (let x = 0; x < lw; x++) { const h = far[(x + fo) % far.length]; c.fillRect(x, lh - 20 - h, 1, h); }
          c.fillStyle = mix(C.dark, C.secondary, .25);
          for (let x = 0; x < lw; x++) { const h = near[(x + no) % near.length]; c.fillRect(x, lh - 20 - h, 1, h); }
          c.fillStyle = C.primary;
          for (let x = 0; x < lw; x++) { const h = near[(x + no) % near.length]; c.fillRect(x, lh - 20 - h, 1, 1); }
          const go = Math.floor(t * 30) % 16;
          for (let x = -16; x < lw; x += 16) { c.fillStyle = C.dark; c.fillRect(x + go, lh - 20, 8, 20); c.fillStyle = mix(C.dark, C.primary, .35); c.fillRect(x + go + 8, lh - 20, 8, 20); }
          c.fillStyle = C.accent; c.fillRect(0, lh - 20, lw, 1);
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.min(1, .55 + .3 * env.amt);
          ctx.drawImage(low, 0, 0, W, H);
          ctx.globalAlpha = 1;
          ctx.drawImage(crt, 0, 0, W, H);
        }
      };
    }
  };

  /* ---------- Crystal Realm (fantasy RPGs, e.g. Final Fantasy shows) ---------- */
  S.fantasy = {
    name: "Crystal Realm", group: "Shows", desc: "Starry sky, floating crystals, a slowly turning magic circle — fantasy RPGs", title: "block",
    build(env) {
      const { C, rnd } = env;
      const bg = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.dark); g.addColorStop(.55, C.secondary); g.addColorStop(1, mix(C.secondary, C.primary, .25));
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 6; i++) {
          const x = rnd() * W, y = rnd() * H * .7, r = lerp(200, 450, rnd());
          const n = c.createRadialGradient(x, y, 0, x, y, r); n.addColorStop(0, rgba(i % 2 ? C.accent : C.primary, .12)); n.addColorStop(1, rgba(C.primary, 0));
          c.fillStyle = n; c.fillRect(0, 0, W, H);
        }
        for (let i = 0; i < 260; i++) { c.fillStyle = rgba(C.light, rnd() * .7); c.fillRect(rnd() * W, rnd() * H * .8, 2, 2); }
      });
      const sparkles = Array.from({ length: 36 }, () => ({ x: rnd() * W, y: rnd() * H * .85, p: rnd() * TAU, s: lerp(6, 16, rnd()) }));
      const crystals = [[260, 420, 120], [620, 300, 80], [1330, 330, 90], [1680, 450, 130], [960, 250, 60]].map(([x, y, h], i) => ({ x, y, h, p: i * 1.3 }));
      function crystal(ctx, x, y, h, tilt) {
        const w = h * .38;
        ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, h * 1.4); glow.addColorStop(0, rgba(C.primary, Math.min(1, .28 * env.amt * env.glow))); glow.addColorStop(1, rgba(C.primary, 0));
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, h * 1.4, 0, TAU); ctx.fill();
        const g = ctx.createLinearGradient(-w, -h, w, h); g.addColorStop(0, rgba(C.light, .75)); g.addColorStop(.5, rgba(C.primary, .6)); g.addColorStop(1, rgba(C.accent, .5));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(w, -h * .25); ctx.lineTo(0, h); ctx.lineTo(-w, -h * .25); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(C.light, .55); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.moveTo(-w, -h * .25); ctx.lineTo(0, -h * .05); ctx.lineTo(w, -h * .25); ctx.stroke();
        ctx.restore();
      }
      return {
        draw(ctx, t) {
          ctx.drawImage(bg, 0, 0, W, H);
          // magic circle lying on the ground
          ctx.save(); ctx.translate(960, 820); ctx.scale(1, .34);
          ctx.strokeStyle = rgba(C.accent, .35 * env.amt); ctx.lineWidth = 4;
          [300, 262, 170].forEach((r) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); });
          ctx.save(); ctx.rotate(t * .06);
          for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, r1 = 268, r2 = i % 6 ? 284 : 296; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); ctx.stroke(); }
          for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 216, Math.sin(a) * 216, 16, 0, TAU); ctx.stroke(); }
          ctx.restore();
          ctx.save(); ctx.rotate(-t * .09); ctx.strokeStyle = rgba(C.primary, .4 * env.amt);
          for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = k * Math.PI / 3 + i / 3 * TAU - Math.PI / 2; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * 170, Math.sin(a) * 170); } ctx.closePath(); ctx.stroke(); }
          ctx.restore(); ctx.restore();
          for (const s of sparkles) { const a = Math.max(0, Math.sin(t * 1.3 + s.p)); ctx.fillStyle = rgba(C.light, a * .7 * env.amt); star4(ctx, s.x, s.y, s.s * a); ctx.fill(); }
          crystals.forEach((cr) => crystal(ctx, cr.x, cr.y + Math.sin(t * .6 + cr.p) * 20, cr.h, Math.sin(t * .3 + cr.p) * .08));
        }
      };
    }
  };

  /* ---------- The Climb (roguelike deckbuilders, e.g. Slay the Spire shows) ---------- */
  S.spire = {
    name: "The Climb", group: "Shows", desc: "A dark spire with a glowing path climbing its map — roguelike deckbuilders", title: "block",
    build(env) {
      const { C, rnd } = env;
      const nodes = []; for (let i = 0; i < 10; i++) nodes.push([960 + (i % 2 ? 1 : -1) * lerp(110, 220, rnd()) * (i === 0 || i === 9 ? 0 : 1), lerp(1010, 150, i / 9)]);
      const bg = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.dark); g.addColorStop(.5, mix(C.dark, C.secondary, .7)); g.addColorStop(1, C.dark);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        // the spire
        c.fillStyle = mix(C.dark, C.secondary, .45); c.beginPath(); c.moveTo(760, H);
        for (let y = H; y >= 120; y -= 60) { const w = lerp(200, 18, (H - y) / (H - 120)); c.lineTo(960 - w - (rnd() * 14), y); }
        c.lineTo(960, 40);
        for (let y = 120; y <= H; y += 60) { const w = lerp(200, 18, (H - y) / (H - 120)); c.lineTo(960 + w + (rnd() * 14), y); }
        c.closePath(); c.fill(); c.strokeStyle = rgba(C.primary, .38); c.lineWidth = 3; c.stroke();
        for (let i = 0; i < 14; i++) { const y = lerp(980, 200, i / 13), w = lerp(150, 20, (H - y) / (H - 120)); c.fillStyle = rgba(C.digit, .1 + rnd() * .12); c.fillRect(960 + (rnd() - .5) * w * 1.4, y, 6, 16); }
        // map path
        c.setLineDash([4, 14]); c.lineWidth = 4; c.strokeStyle = rgba(C.light, .22);
        c.beginPath(); nodes.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.setLineDash([]);
        nodes.forEach(([x, y], i) => { c.strokeStyle = rgba(C.light, .35); c.lineWidth = 4; c.beginPath(); c.arc(x, y, i === 9 ? 30 : 18, 0, TAU); c.stroke(); });
      });
      const fog = Array.from({ length: 7 }, () => ({ x: rnd() * W, y: lerp(300, 1000, rnd()), w: lerp(500, 900, rnd()), v: lerp(10, 30, rnd()) * (rnd() < .5 ? -1 : 1) }));
      const embers = makeEmbers(45, rnd, { vmin: 25, vmax: 70, rmax: 2.8 });
      const segLen = nodes.slice(1).map(([x, y], i) => Math.hypot(x - nodes[i][0], y - nodes[i][1]));
      const total = segLen.reduce((a, b) => a + b, 0);
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          // the glowing marker climbs the path, then starts over
          let d = (t * 60) % (total + 300), i = 0;
          while (i < segLen.length && d > segLen[i]) { d -= segLen[i]; i++; }
          const p = i >= segLen.length ? nodes[9] : [lerp(nodes[i][0], nodes[i + 1][0], d / segLen[i]), lerp(nodes[i][1], nodes[i + 1][1], d / segLen[i])];
          for (let k = 0; k <= Math.min(i, 9); k++) { ctx.fillStyle = rgba(C.primary, .35 * env.amt); ctx.beginPath(); ctx.arc(nodes[k][0], nodes[k][1], k === 9 ? 26 : 14, 0, TAU); ctx.fill(); }
          const glow = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 70); glow.addColorStop(0, rgba(C.digit, Math.min(1, .7 * env.amt * env.glow))); glow.addColorStop(1, rgba(C.digit, 0));
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p[0], p[1], 70, 0, TAU); ctx.fill();
          // torches at the base
          [[640, 960], [1280, 960]].forEach(([x, y], k) => {
            const f = .7 + .3 * Math.sin(t * 9 + k) * Math.sin(t * 13 + k * 2);
            const g = ctx.createRadialGradient(x, y, 0, x, y, 240 * f); g.addColorStop(0, rgba(C.primary, Math.min(1, .35 * env.amt * f * env.glow))); g.addColorStop(1, rgba(C.primary, 0));
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 240, 0, TAU); ctx.fill();
          });
          for (const f of fog) {
            f.x += f.v * dt; if (f.x > W + f.w) f.x = -f.w; if (f.x < -f.w) f.x = W + f.w;
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.w / 2); g.addColorStop(0, rgba(C.light, .05 * env.amt)); g.addColorStop(1, rgba(C.light, 0));
            ctx.fillStyle = g; ctx.fillRect(f.x - f.w / 2, f.y - f.w / 2, f.w, f.w);
          }
          embers(ctx, dt, C.primary, env.amt);
        }
      };
    }
  };

  /* ---------- Tabletop Quest (D&D and tabletop RPG shows) ---------- */
  S.tabletop = {
    name: "Tabletop Quest", group: "Shows", desc: "Candlelit dungeon map, drifting d20s, glowing runes — tabletop RPGs", title: "block",
    build(env) {
      const { C, rnd } = env;
      const parch = mix(C.light, C.digit, .25);
      const bg = env.layer((c) => {
        c.fillStyle = mix(C.dark, C.secondary, .3); c.fillRect(0, 0, W, H);
        for (let i = 0; i < 40; i++) { c.fillStyle = rgba(C.dark, .25); c.fillRect(0, i * 27 + rnd() * 6, W, 2); }   // wood grain
        // parchment map
        c.save(); c.translate(960, 560); c.rotate(-.04);
        c.fillStyle = rgba(parch, .16); roundRect(c, -760, -420, 1520, 840, 24); c.fill();
        c.strokeStyle = rgba(parch, .25); c.lineWidth = 3; c.stroke();
        c.strokeStyle = rgba(parch, .07); c.lineWidth = 1.5;
        for (let x = -740; x <= 740; x += 40) { c.beginPath(); c.moveTo(x, -400); c.lineTo(x, 400); c.stroke(); }
        for (let y = -400; y <= 400; y += 40) { c.beginPath(); c.moveTo(-740, y); c.lineTo(740, y); c.stroke(); }
        // rooms and corridors
        c.strokeStyle = rgba(parch, .35); c.lineWidth = 6; c.fillStyle = rgba(parch, .06);
        const rooms = [[-680, -340, 280, 200], [-280, -360, 240, 160], [140, -300, 320, 240], [-600, 40, 240, 280], [-200, 0, 360, 240], [300, 60, 200, 160], [440, -360, 220, 160], [80, 260, 280, 120]];
        rooms.forEach(([x, y, w, h]) => { c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h); });
        c.lineWidth = 18; c.strokeStyle = rgba(parch, .1);
        [[-400, -240, -280, -240], [-40, -280, 140, -280], [300, -60, 300, 60], [-360, 160, -200, 160], [160, 120, 300, 120], [-480, -140, -480, 40]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
        // compass rose
        c.translate(640, 300); c.fillStyle = rgba(parch, .25);
        for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, -70); c.lineTo(12, 0); c.lineTo(-12, 0); c.fill(); }
        c.restore();
        const v = c.createRadialGradient(960, 540, 250, 960, 540, 1150); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.75)");
        c.fillStyle = v; c.fillRect(0, 0, W, H);
      });
      const dice = Array.from({ length: 4 }, (_, i) => ({ x: [260, 760, 1250, 1700][i], y: [300, 860, 260, 780][i], s: lerp(55, 85, rnd()), r: rnd() * TAU, vr: (rnd() - .5) * .3, p: rnd() * TAU }));
      function d20(ctx, x, y, s, rot) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        const pts = Array.from({ length: 6 }, (_, i) => [Math.cos(i / 6 * TAU - Math.PI / 2) * s, Math.sin(i / 6 * TAU - Math.PI / 2) * s]);
        ctx.fillStyle = rgba(C.primary, .16 * env.amt); ctx.strokeStyle = rgba(C.light, .3 * env.amt); ctx.lineWidth = 3;
        ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.fill(); ctx.stroke();
        const tri = [[0, -s * .55], [s * .48, s * .3], [-s * .48, s * .3]];
        ctx.beginPath(); tri.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.stroke();
        // facet lines from each corner of the front triangle out to the rim
        [[0, [5, 0, 1]], [1, [1, 2, 3]], [2, [3, 4, 5]]].forEach(([ti, hs]) => hs.forEach((pi) => {
          ctx.beginPath(); ctx.moveTo(tri[ti][0], tri[ti][1]); ctx.lineTo(pts[pi][0], pts[pi][1]); ctx.stroke();
        }));
        ctx.fillStyle = rgba(C.light, .4 * env.amt); ctx.font = `700 ${Math.round(s * .38)}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("20", 0, s * .05);
        ctx.restore();
      }
      const runes = Array.from({ length: 10 }, () => ({ x: rnd() * W, y: rnd() * H, p: rnd() * TAU, s: lerp(14, 26, rnd()), k: Math.floor(rnd() * 4) }));
      const embers = makeEmbers(30, rnd, { vmin: 20, vmax: 50, rmax: 2.2 });
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          // candle glow in the corners, flickering
          [[180, 980], [1740, 980], [1760, 120]].forEach(([x, y], k) => {
            const f = .75 + .25 * Math.sin(t * 7 + k * 3) * Math.sin(t * 11.3 + k);
            const g = ctx.createRadialGradient(x, y, 0, x, y, 520 * f); g.addColorStop(0, rgba(C.digit, Math.min(1, .32 * env.amt * f * env.glow))); g.addColorStop(1, rgba(C.digit, 0));
            ctx.fillStyle = g; ctx.fillRect(x - 520, y - 520, 1040, 1040);
          });
          for (const r of runes) {
            const a = Math.max(0, Math.sin(t * .8 + r.p)); ctx.strokeStyle = rgba(C.accent, a * .45 * env.amt); ctx.lineWidth = 3;
            ctx.save(); ctx.translate(r.x, r.y); ctx.beginPath();
            if (r.k === 0) { ctx.moveTo(0, -r.s); ctx.lineTo(0, r.s); ctx.moveTo(0, -r.s * .3); ctx.lineTo(r.s * .6, -r.s); }
            else if (r.k === 1) { ctx.moveTo(-r.s * .6, r.s); ctx.lineTo(0, -r.s); ctx.lineTo(r.s * .6, r.s); }
            else if (r.k === 2) { ctx.arc(0, 0, r.s * .7, 0, TAU); ctx.moveTo(-r.s, 0); ctx.lineTo(r.s, 0); }
            else { ctx.moveTo(-r.s * .6, -r.s); ctx.lineTo(r.s * .6, r.s); ctx.moveTo(r.s * .6, -r.s); ctx.lineTo(-r.s * .6, r.s); }
            ctx.stroke(); ctx.restore();
          }
          dice.forEach((d) => { d.r += d.vr * dt; d20(ctx, d.x, d.y + Math.sin(t * .7 + d.p) * 18, d.s, d.r); });
          embers(ctx, dt, C.digit, env.amt * .8);
        }
      };
    }
  };

  /* ---------- Game Night (board games) ---------- */
  S.boardgame = {
    name: "Game Night", group: "Shows", desc: "Hex-tile table with a light wave, drifting dice and pawns — board games", title: "block",
    build(env) {
      const { C, rnd } = env;
      const R = 64, hw = R * Math.sqrt(3), hexes = [];
      for (let row = -1; row * R * 1.5 < H + R; row++) for (let col = -1; col * hw < W + hw; col++) {
        const x = col * hw + (row % 2 ? hw / 2 : 0), y = row * R * 1.5;
        hexes.push({ x, y, fill: rnd() < .18 ? [C.primary, C.accent, C.digit, C.light][Math.floor(rnd() * 4)] : null });
      }
      const hexPath = (c, x, y, r) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); };
      const bg = env.layer((c) => {
        const g = c.createRadialGradient(960, 540, 100, 960, 540, 1100); g.addColorStop(0, C.secondary); g.addColorStop(1, C.dark);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        hexes.forEach((h) => { hexPath(c, h.x, h.y, R - 3); if (h.fill) { c.fillStyle = rgba(h.fill, .09); c.fill(); } c.strokeStyle = rgba(C.light, .07); c.lineWidth = 2; c.stroke(); });
      });
      const dice = Array.from({ length: 3 }, () => ({ x: rnd() * W, y: rnd() * H, vx: (rnd() - .5) * 30, vy: (rnd() - .5) * 20, r: rnd() * TAU, vr: (rnd() - .5) * .4, n: 1 + Math.floor(rnd() * 6) }));
      const pawns = Array.from({ length: 4 }, (_, i) => ({ x: [330, 820, 1150, 1610][i], y: [760, 300, 820, 380][i], c: [C.primary, C.accent, C.digit, C.light][i], p: rnd() * TAU }));
      const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          const cx = 960 + Math.cos(t * .15) * 500, cy = 540 + Math.sin(t * .11) * 260;
          for (const h of hexes) {
            const d = Math.hypot(h.x - cx, h.y - cy), a = Math.pow(Math.max(0, Math.sin(d * .008 - t * 1.1)), 6);
            if (a > .02) { hexPath(ctx, h.x, h.y, R - 3); ctx.fillStyle = rgba(C.accent, a * .14 * env.amt); ctx.fill(); }
          }
          pawns.forEach((p) => {
            const y = p.y + Math.sin(t * .8 + p.p) * 8;
            ctx.fillStyle = rgba(p.c, .22 * env.amt);
            ctx.beginPath(); ctx.arc(p.x, y - 52, 20, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x - 12, y - 36); ctx.lineTo(p.x + 12, y - 36); ctx.lineTo(p.x + 30, y + 10); ctx.lineTo(p.x - 30, y + 10); ctx.closePath(); ctx.fill();
            roundRect(ctx, p.x - 38, y + 6, 76, 16, 6); ctx.fill();
          });
          dice.forEach((d) => {
            d.x += d.vx * dt; d.y += d.vy * dt; d.r += d.vr * dt;
            if (d.x < -100) d.x = W + 100; if (d.x > W + 100) d.x = -100; if (d.y < -100) d.y = H + 100; if (d.y > H + 100) d.y = -100;
            ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.r);
            ctx.fillStyle = rgba(C.light, .14 * env.amt); ctx.strokeStyle = rgba(C.light, .3 * env.amt); ctx.lineWidth = 3;
            roundRect(ctx, -46, -46, 92, 92, 16); ctx.fill(); ctx.stroke();
            ctx.fillStyle = rgba(C.light, .4 * env.amt);
            PIPS[d.n].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a * 24, b * 24, 8, 0, TAU); ctx.fill(); });
            ctx.restore();
          });
        }
      };
    }
  };

  /* ---------- Card Table (card games, TCGs, poker) ---------- */
  S.cards = {
    name: "Card Table", group: "Shows", desc: "Felt table, faint suit pattern, cards drifting by — card games", title: "block",
    build(env) {
      const { C, rnd } = env;
      const bg = env.layer((c) => {
        const g = c.createRadialGradient(960, 540, 80, 960, 540, 1150); g.addColorStop(0, mix(C.secondary, C.light, .08)); g.addColorStop(.7, C.secondary); g.addColorStop(1, C.dark);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 9000; i++) { c.fillStyle = rgba(rnd() < .5 ? C.light : "#000000", .035); c.fillRect(rnd() * W, rnd() * H, 2, 2); }
        c.fillStyle = rgba(C.light, .035);
        for (let y = 60, r = 0; y < H + 100; y += 150, r++) for (let x = (r % 2) * 90; x < W + 100; x += 180) suit(c, SUITS[(r + Math.floor(x / 180)) % 4], x, y, 36);
        c.strokeStyle = rgba(C.digit, .18); c.lineWidth = 4; c.beginPath(); c.ellipse(960, 560, 820, 420, 0, 0, TAU); c.stroke();
      });
      const mkCard = (any) => ({ x: any ? rnd() * W : -200, y: lerp(120, 960, rnd()), vx: lerp(20, 45, rnd()), r: (rnd() - .5) * .8, vr: (rnd() - .5) * .15,
                                  face: rnd() < .6, s: SUITS[Math.floor(rnd() * 4)], p: rnd() * TAU });
      const cards = Array.from({ length: 6 }, () => mkCard(true));
      const drifts = Array.from({ length: 14 }, () => ({ x: rnd() * W, y: rnd() * H, v: lerp(10, 25, rnd()), s: SUITS[Math.floor(rnd() * 4)], z: lerp(18, 34, rnd()) }));
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          for (const d of drifts) { d.y -= d.v * dt; if (d.y < -50) { d.y = H + 50; d.x = rnd() * W; } ctx.fillStyle = rgba(C.light, .09 * env.amt); suit(ctx, d.s, d.x, d.y, d.z); }
          cards.forEach((cd, i) => {
            cd.x += cd.vx * dt; cd.r += cd.vr * dt;
            if (cd.x > W + 220) cards[i] = mkCard(false);
            const y = cd.y + Math.sin(t * .5 + cd.p) * 14;
            ctx.save(); ctx.translate(cd.x, y); ctx.rotate(cd.r); ctx.globalAlpha = Math.min(1, .22 * env.amt);
            ctx.fillStyle = cd.face ? C.light : C.primary; roundRect(ctx, -80, -112, 160, 224, 14); ctx.fill();
            if (cd.face) {
              ctx.fillStyle = cd.s === "heart" || cd.s === "diamond" ? C.accent : C.dark;
              suit(ctx, cd.s, 0, 0, 70); suit(ctx, cd.s, -54, -82, 22); suit(ctx, cd.s, 54, 82, 22);
            } else {
              ctx.strokeStyle = C.light; ctx.lineWidth = 2; roundRect(ctx, -66, -98, 132, 196, 8); ctx.stroke();
              for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(-66, k * 24); ctx.lineTo(0, k * 24 - 60); ctx.lineTo(66, k * 24); ctx.stroke(); }
            }
            ctx.restore();
          });
        }
      };
    }
  };

  /* ---------- Studio (music shows) ---------- */
  S.music = {
    name: "Studio", group: "Shows", desc: "Equalizer bars and flowing sound waves — music", title: "neon",
    build(env) {
      const { C, rnd } = env;
      const bg = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.dark); g.addColorStop(1, mix(C.dark, C.secondary, .8));
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        const s = c.createRadialGradient(960, 0, 0, 960, 0, 900); s.addColorStop(0, rgba(C.primary, .22)); s.addColorStop(1, rgba(C.primary, 0));
        c.fillStyle = s; c.fillRect(0, 0, W, H);
        c.strokeStyle = rgba(C.light, .05); c.lineWidth = 2;
        for (let y = 100; y < H; y += 100) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      });
      const N = 64, seeds = Array.from({ length: N }, () => [rnd() * TAU, lerp(1.2, 3.4, rnd()), lerp(.6, 1.6, rnd())]);
      const notes = Array.from({ length: 8 }, () => ({ x: rnd() * W, y: rnd() * H, v: lerp(12, 28, rnd()), p: rnd() * TAU }));
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          const bw = W / N;
          for (let i = 0; i < N; i++) {
            const [p, f1, f2] = seeds[i];
            const v = (.5 + .5 * Math.sin(t * f1 + p)) * (.55 + .45 * Math.sin(t * f2 + i * .2));
            const h = 30 + v * 360 * (0.6 + 0.4 * Math.sin(i / N * Math.PI));
            const g = ctx.createLinearGradient(0, H, 0, H - h); g.addColorStop(0, rgba(C.accent, .5 * env.amt)); g.addColorStop(1, rgba(C.primary, .15 * env.amt));
            ctx.fillStyle = g; roundRect(ctx, i * bw + 4, H - h, bw - 8, h + 10, 6); ctx.fill();
          }
          [[C.primary, .45, 70, .004, 1.2], [C.accent, .35, 50, .006, -1.6], [C.light, .18, 90, .0025, .8]].forEach(([col, a, amp, f, s]) => {
            ctx.strokeStyle = rgba(col, a * env.amt); ctx.lineWidth = 4; ctx.beginPath();
            for (let x = 0; x <= W; x += 12) { const y = 500 + Math.sin(x * f + t * s) * amp * Math.sin(x * .0012 + t * .3) + Math.sin(x * f * 2.3 - t) * amp * .3; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
            ctx.stroke();
          });
          for (const n of notes) {
            n.y -= n.v * dt; if (n.y < -60) { n.y = H + 60; n.x = rnd() * W; }
            const x = n.x + Math.sin(t + n.p) * 30;
            ctx.fillStyle = rgba(C.light, .12 * env.amt); ctx.strokeStyle = rgba(C.light, .12 * env.amt); ctx.lineWidth = 5;
            ctx.beginPath(); ctx.ellipse(x, n.y, 16, 12, -.4, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x + 14, n.y - 4); ctx.lineTo(x + 14, n.y - 64); ctx.lineTo(x + 38, n.y - 52); ctx.stroke();
          }
        }
      };
    }
  };

  /* ---------- Block Party (hip-hop) ---------- */
  S.hiphop = {
    name: "Block Party", group: "Shows", desc: "Night skyline, spinning vinyl, bass pulses — hip-hop", title: "block",
    build(env) {
      const { C, rnd } = env;
      const buildings = [], windows = [];
      for (let x = -20; x < W + 40;) {
        const w = lerp(90, 200, rnd()), h = lerp(170, 470, rnd()); buildings.push([x, H - h, w, h]);
        for (let wy = H - h + 26; wy < H - 30; wy += 34) for (let wx = x + 16; wx < x + w - 24; wx += 30) windows.push({ x: wx, y: wy, on: rnd() < .3 });
        x += w + lerp(4, 18, rnd());
      }
      const bg = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.dark); g.addColorStop(1, mix(C.secondary, C.primary, .15));
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let y = 0; y < 520; y += 26) for (let x = 0; x < 900; x += 26) {
          const r = Math.max(0, 7 - Math.hypot(x, y) / 110);
          if (r > .4) { c.fillStyle = rgba(C.light, .06); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
        }
        c.fillStyle = mix(C.dark, "#000000", .35);
        buildings.forEach(([x, y, w, h]) => c.fillRect(x, y, w, h));
        c.fillStyle = rgba(C.primary, .25); c.fillRect(0, H - 6, W, 6);
      });
      let flick = 0;
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          flick += dt; if (flick > .4) { flick = 0; const w = windows[Math.floor(rnd() * windows.length)]; if (w) w.on = !w.on; }
          ctx.fillStyle = rgba(C.digit, .45 * env.amt);
          for (const w of windows) if (w.on) ctx.fillRect(w.x, w.y, 12, 16);
          // bass pulses (about 96 BPM)
          const beat = (t * 1.6) % 1;
          for (let k = 0; k < 3; k++) {
            const p = (beat + k / 3) % 1;
            ctx.strokeStyle = rgba(C.accent, (1 - p) * .35 * env.amt); ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(360, 420, 80 + p * 420, 0, TAU); ctx.stroke();
          }
          // spinning vinyl
          const vx = 1540, vy = 400, R = 270;
          ctx.save(); ctx.translate(vx, vy); ctx.globalAlpha = Math.min(1, .55 * env.amt + .2);
          ctx.fillStyle = "#0b0b0d"; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 2;
          for (let r = 100; r < R - 8; r += 9) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }
          ctx.rotate(t * 1.4);
          ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 6, -.35, .1); ctx.fill();
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 6, Math.PI - .35, Math.PI + .1); ctx.fill();
          ctx.fillStyle = C.primary; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.fill();
          ctx.fillStyle = C.accent; ctx.fillRect(-90, -14, 180, 28);
          ctx.fillStyle = C.dark; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
          ctx.restore();
        }
      };
    }
  };

  /* ---------- Sakura (anime) ---------- */
  S.anime = {
    name: "Sakura", group: "Shows", desc: "Turning sunburst, halftone, falling cherry-blossom petals — anime", title: "block",
    build(env) {
      const { C, rnd } = env;
      const bg = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.secondary); g.addColorStop(.6, mix(C.secondary, C.primary, .4)); g.addColorStop(1, mix(C.primary, C.light, .3));
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 24) for (let x = 0; x < W; x += 24) {
          const r = Math.max(0, 6 - Math.hypot(W - x, H - y) / 120);
          if (r > .4) { c.fillStyle = rgba(C.light, .1); c.beginPath(); c.arc(x + (y / 24 % 2) * 12, y, r, 0, TAU); c.fill(); }
        }
        const s = c.createRadialGradient(1500, 260, 0, 1500, 260, 240); s.addColorStop(0, rgba(C.light, .5)); s.addColorStop(.4, rgba(C.light, .25)); s.addColorStop(1, rgba(C.light, 0));
        c.fillStyle = s; c.fillRect(1200, 0, 600, 600);
      });
      const petals = Array.from({ length: 46 }, () => mk(true));
      function mk(any) { return { x: rnd() * (W + 400) - 200, y: any ? rnd() * H : -40, vy: lerp(30, 70, rnd()), vx: lerp(-30, 10, rnd()), r: rnd() * TAU, vr: (rnd() - .5) * 2, f: rnd() * TAU, s: lerp(10, 20, rnd()), c: mix(C.primary, C.light, lerp(.2, .7, rnd())) }; }
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          ctx.save(); ctx.translate(960, 1250); ctx.rotate(t * .025);
          ctx.fillStyle = rgba(C.light, .05 * env.amt);
          for (let i = 0; i < 24; i += 2) { const a = i / 24 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2400, a, a + TAU / 24); ctx.closePath(); ctx.fill(); }
          ctx.restore();
          petals.forEach((p, i) => {
            p.y += p.vy * dt; p.x += (p.vx + Math.sin(t + p.f) * 30) * dt; p.r += p.vr * dt;
            if (p.y > H + 40) petals[i] = mk(false);
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(Math.cos(t * 1.5 + p.f) * .5 + .7, 1);
            ctx.fillStyle = rgba(p.c, .75 * Math.min(1, env.amt));
            ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.bezierCurveTo(p.s * .9, -p.s * .6, p.s * .7, p.s * .6, 0, p.s);
            ctx.bezierCurveTo(-p.s * .7, p.s * .6, -p.s * .9, -p.s * .6, -p.s * .18, -p.s * .9); ctx.lineTo(0, -p.s * .65); ctx.closePath(); ctx.fill();
            ctx.restore();
          });
        }
      };
    }
  };

  /* ---------- Tin Foil Hat (conspiracy board) ---------- */
  S.tinfoil = {
    name: "Tin Foil Hat", group: "Shows", desc: "A conspiracy corkboard: blurry photos, clippings, red string and a roaming flashlight", title: "block",
    build(env) {
      const { C, rnd } = env;
      const RED = "#D7263D";
      const HAND = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
      const cork = env.layer((c) => {
        c.fillStyle = mix("#8A5A33", C.dark, .25); c.fillRect(0, 0, W, H);
        for (let i = 0; i < 26000; i++) { const v = rnd(); c.fillStyle = v < .5 ? `rgba(60,35,15,${rnd() * .35})` : `rgba(230,190,140,${rnd() * .22})`; c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 3); }
        const g = c.createRadialGradient(960, 540, 300, 960, 540, 1150); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // old pin holes and torn paper bits
        for (let i = 0; i < 90; i++) { c.fillStyle = "rgba(20,10,5,.5)"; c.beginPath(); c.arc(rnd() * W, rnd() * H, 2, 0, TAU); c.fill(); }
        for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(240,235,220,${.25 + rnd() * .3})`; c.save(); c.translate(rnd() * W, rnd() * H); c.rotate(rnd() * TAU); c.fillRect(0, 0, 14 + rnd() * 30, 8 + rnd() * 16); c.restore(); }
      });
      /* --- the evidence, each drawn once into its own little canvas --- */
      const make = (w, h, fn) => { const cv = document.createElement("canvas"); cv.width = w + 24; cv.height = h + 24; const c = cv.getContext("2d"); c.translate(12, 12); fn(c, w, h); return cv; };
      const photoArt = {
        ufo(c, x, y) { c.fillStyle = "rgba(255,255,220,.18)"; c.beginPath(); c.moveTo(x - 18, y + 8); c.lineTo(x + 18, y + 8); c.lineTo(x + 55, y + 85); c.lineTo(x - 55, y + 85); c.closePath(); c.fill();
          c.fillStyle = "#c9cfd6"; c.beginPath(); c.ellipse(x, y, 62, 16, 0, 0, TAU); c.fill(); c.fillStyle = "#9fd7ff"; c.beginPath(); c.ellipse(x, y - 10, 24, 18, 0, Math.PI, TAU); c.fill();
          c.fillStyle = "#ffe066"; [-38, -13, 13, 38].forEach((dx) => { c.beginPath(); c.arc(x + dx, y + 3, 4, 0, TAU); c.fill(); }); },
        eye(c, x, y) { c.strokeStyle = "#f2e3b3"; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y - 62); c.lineTo(x + 66, y + 50); c.lineTo(x - 66, y + 50); c.closePath(); c.stroke();
          c.beginPath(); c.ellipse(x, y + 12, 28, 15, 0, 0, TAU); c.stroke(); c.fillStyle = "#f2e3b3"; c.beginPath(); c.arc(x, y + 12, 8, 0, TAU); c.fill();
          for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .3; c.beginPath(); c.moveTo(x + Math.cos(a) * 80, y - 10 + Math.sin(a) * 80); c.lineTo(x + Math.cos(a) * 98, y - 10 + Math.sin(a) * 98); c.stroke(); } },
        ball(c, x, y) { c.fillStyle = "#e27a2e"; c.beginPath(); c.arc(x, y, 52, 0, TAU); c.fill(); c.strokeStyle = "#3a1d0a"; c.lineWidth = 4;
          c.beginPath(); c.arc(x, y, 52, 0, TAU); c.moveTo(x - 52, y); c.lineTo(x + 52, y); c.moveTo(x, y - 52); c.lineTo(x, y + 52); c.stroke();
          c.beginPath(); c.arc(x - 70, y, 52, -.75, .75); c.stroke(); c.beginPath(); c.arc(x + 70, y, 52, Math.PI - .75, Math.PI + .75); c.stroke();
          c.fillStyle = "#fff"; c.font = `bold 64px ${HAND}`; c.textAlign = "center"; c.fillText("?", x + 62, y - 30); },
        foot(c, x, y) { c.fillStyle = "#c9b28f"; c.beginPath(); c.ellipse(x, y + 12, 30, 52, -.15, 0, TAU); c.fill();
          [[-24, -50, 10], [-8, -58, 9], [8, -58, 9], [22, -52, 8], [33, -42, 7]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, y + dy, r, 0, TAU); c.fill(); });
          c.strokeStyle = "#f2efe6"; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(x - 70, y + 70); c.lineTo(x + 70, y + 70); c.stroke(); c.setLineDash([]); }
      };
      const polaroid = (art, cap) => make(210, 250, (c, w, h) => {
        c.shadowColor = "rgba(0,0,0,.45)"; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = "#F2EFE6"; c.fillRect(0, 0, w, h); c.shadowColor = "transparent";
        const g = c.createLinearGradient(0, 14, 0, 196); g.addColorStop(0, mix(C.dark, "#22303a", .5)); g.addColorStop(1, "#0d0f12"); c.fillStyle = g; c.fillRect(14, 14, w - 28, 182);
        c.save(); c.beginPath(); c.rect(14, 14, w - 28, 182); c.clip(); photoArt[art](c, w / 2, 100);
        for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${rnd() * .07})`; c.fillRect(14 + rnd() * (w - 28), 14 + rnd() * 182, 2, 2); } c.restore();
        c.fillStyle = "#26211c"; c.font = `bold 22px ${HAND}`; c.textAlign = "center"; c.fillText(cap, w / 2, 230);
      });
      const clipping = (head) => make(300, 190, (c, w, h) => {
        c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 12; c.shadowOffsetY = 5; c.fillStyle = "#E7E1D1";
        c.beginPath(); c.moveTo(0, 4); for (let x = 0; x <= w; x += 12) c.lineTo(x, (x / 12) % 2 ? 0 : 6); for (let y = 0; y <= h; y += 12) c.lineTo(w - ((y / 12) % 2 ? 0 : 5), y); c.lineTo(0, h); c.closePath(); c.fill(); c.shadowColor = "transparent";
        c.fillStyle = "#1c1a17"; c.font = "900 30px Georgia, 'Times New Roman', serif"; c.textAlign = "left";
        head.forEach((l, i) => c.fillText(l, 16, 44 + i * 34));
        c.fillStyle = "rgba(30,28,25,.55)"; const top = 44 + head.length * 34 - 10;
        c.fillRect(16, top, 92, h - top - 16);
        for (let y = top + 4; y < h - 16; y += 11) c.fillRect(120, y, w - 136 - (rnd() * 40), 4);
      });
      const sticky = (lines, col) => make(160, 150, (c, w, h) => {
        c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 10; c.shadowOffsetY = 6; c.fillStyle = col; c.fillRect(0, 0, w, h); c.shadowColor = "transparent";
        c.fillStyle = "rgba(0,0,0,.08)"; c.fillRect(0, 0, w, 22);
        c.fillStyle = "#1d1b2a"; c.font = `bold 30px ${HAND}`; c.textAlign = "center";
        lines.forEach((l, i) => c.fillText(l, w / 2, 62 + i * 38 - (lines.length - 1) * 10));
      });
      const items = [
        { cv: polaroid("ufo", "EXHIBIT A"), x: 250, y: 360, r: -.07 },
        { cv: clipping(["WHO REALLY", "WON THE DRAFT?"]), x: 640, y: 330, r: .04 },
        { cv: polaroid("eye", "THEY WATCH"), x: 1290, y: 350, r: .06 },
        { cv: sticky(["FOLLOW", "THE REFS"], "#F7E463"), x: 1690, y: 330, r: -.05 },
        { cv: clipping(["FROZEN", "ENVELOPE?!"]), x: 400, y: 740, r: -.03 },
        { cv: polaroid("ball", "WHY THIS BALL?"), x: 960, y: 640, r: .03 },
        { cv: sticky(["WAKE", "UP!!"], "#FF9EC4"), x: 1440, y: 790, r: .07 },
        { cv: polaroid("foot", "SIZE 22??"), x: 1700, y: 650, r: -.05 },
        { cv: clipping(["LEAGUE DENIES", "EVERYTHING"]), x: 1110, y: 930, r: -.02 },
        { cv: sticky(["?!"], "#9FE3FF"), x: 170, y: 960, r: .1 }
      ].map((it) => Object.assign(it, { p: rnd() * TAU, pin: [it.x, it.y - it.cv.height / 2 + 26] }));
      const LINKS = [[0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [5, 4], [5, 6], [3, 7], [6, 7], [5, 8], [4, 9], [2, 7], [8, 6]];
      const stamps = [];
      let nextStamp = 2;
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(cork, 0, 0, W, H);
          const pin = (it) => [it.pin[0] + Math.sin(t * .6 + it.p) * 2, it.pin[1]];
          // string under the items' pins
          ctx.lineCap = "round";
          for (const [a, b] of LINKS) {
            const [x1, y1] = pin(items[a]), [x2, y2] = pin(items[b]), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 28 + Math.sin(t + a) * 4;
            ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x1 + 3, y1 + 5); ctx.quadraticCurveTo(mx + 3, my + 5, x2 + 3, y2 + 5); ctx.stroke();
            ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
          }
          for (const it of items) {
            ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.r + Math.sin(t * .6 + it.p) * .012);
            ctx.drawImage(it.cv, -it.cv.width / 2, -it.cv.height / 2); ctx.restore();
          }
          // pulses of "connection" running along the string
          for (let i = 0; i < LINKS.length; i++) {
            const [a, b] = LINKS[i], u = ((t * .35 + i * .37) % 1.6); if (u > 1) continue;
            const [x1, y1] = pin(items[a]), [x2, y2] = pin(items[b]), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 28 + Math.sin(t + a) * 4;
            const x = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2, y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2;
            const g = ctx.createRadialGradient(x, y, 0, x, y, 16 * Math.max(.4, env.glow)); g.addColorStop(0, rgba("#FFB3B3", .9 * Math.min(1, env.amt))); g.addColorStop(1, rgba(RED, 0));
            ctx.fillStyle = g; ctx.fillRect(x - 24, y - 24, 48, 48);
          }
          // push pins
          for (const it of items) { const [x, y] = pin(it); ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.arc(x + 3, y + 4, 9, 0, TAU); ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, TAU); ctx.fill(); }
          // CLASSIFIED stamps land now and then
          if (t > nextStamp) { const it = items[Math.floor(rnd() * items.length)]; stamps.push({ x: it.x + (rnd() - .5) * 40, y: it.y + (rnd() - .5) * 30, r: (rnd() - .5) * .5, born: t, word: rnd() < .5 ? "CLASSIFIED" : "REDACTED" }); nextStamp = t + lerp(3, 6, rnd()); }
          for (let i = stamps.length - 1; i >= 0; i--) {
            const s = stamps[i], age = t - s.born; if (age > 4) { stamps.splice(i, 1); continue; }
            const sc = age < .18 ? 2.2 - age / .18 * 1.2 : 1, al = age > 3.3 ? (4 - age) / .7 : 1;
            ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.r); ctx.scale(sc, sc); ctx.globalAlpha = .85 * al;
            ctx.font = "900 44px 'Courier New', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            const w = ctx.measureText(s.word).width + 30; ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.strokeRect(-w / 2, -32, w, 64); ctx.fillStyle = RED; ctx.fillText(s.word, 0, 2);
            ctx.restore();
          }
          // the flashlight wandering over the board
          const fx = 960 + Math.sin(t * .23) * 640 + Math.sin(t * .51) * 160, fy = 540 + Math.cos(t * .31) * 300;
          const fl = ctx.createRadialGradient(fx, fy, 60, fx, fy, 620); fl.addColorStop(0, "rgba(255,240,200,.10)"); fl.addColorStop(.35, "rgba(0,0,0,0)"); fl.addColorStop(1, `rgba(0,0,0,${.55 * Math.min(1.4, env.amt)})`);
          ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
        }
      };
    }
  };

  /* ---------- Synthwave ---------- */
  S.synthwave = {
    name: "Synthwave", group: "Style", desc: "Striped neon sun, glowing mountains, endless grid", title: "neon",
    build(env) {
      const { C, rnd } = env;
      const HZ = 650;
      const bg = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, C.dark); g.addColorStop(.6, C.secondary); g.addColorStop(1, mix(C.secondary, C.primary, .55));
        c.fillStyle = g; c.fillRect(0, 0, W, HZ);
        for (let i = 0; i < 170; i++) { c.fillStyle = rgba(C.light, rnd() * .8); c.fillRect(rnd() * W, rnd() * HZ * .6, 2, 2); }
        // sun with stripes cut out
        const sun = document.createElement("canvas"); sun.width = 560; sun.height = 560; const s = sun.getContext("2d");
        const sg = s.createLinearGradient(0, 30, 0, 530); sg.addColorStop(0, C.digit); sg.addColorStop(1, C.primary);
        s.fillStyle = sg; s.beginPath(); s.arc(280, 280, 250, 0, TAU); s.fill();
        s.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 8; i++) { const y = 300 + i * 30, h = 3 + i * 2.6; s.fillRect(0, y, 560, h); }
        const glow = c.createRadialGradient(960, HZ - 150, 120, 960, HZ - 150, 560); glow.addColorStop(0, rgba(C.primary, Math.min(1, .45 * env.glow))); glow.addColorStop(1, rgba(C.primary, 0));
        c.fillStyle = glow; c.fillRect(0, 0, W, HZ);
        c.drawImage(sun, 960 - 280, HZ - 150 - 280);
        // mountains on both sides
        const range = (base, amp, col, rim) => {
          c.fillStyle = col; c.beginPath(); c.moveTo(0, HZ);
          const pts = []; for (let x = 0; x <= W; x += 60) { const edge = Math.abs(x - 960) / 960; pts.push([x, HZ - (base + amp * edge * edge * (0.6 + 0.4 * rnd()))]); }
          pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(W, HZ); c.closePath(); c.fill();
          c.strokeStyle = rim; c.lineWidth = 3; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
        };
        range(10, 320, mix(C.secondary, C.dark, .2), rgba(C.accent, .35));
        range(0, 200, mix(C.dark, C.secondary, .25), rgba(C.accent, .7));
        const fg = c.createLinearGradient(0, HZ, 0, H); fg.addColorStop(0, mix(C.dark, C.secondary, .6)); fg.addColorStop(1, C.dark);
        c.fillStyle = fg; c.fillRect(0, HZ, W, H - HZ);
      });
      return {
        draw(ctx, t) {
          ctx.drawImage(bg, 0, 0, W, H);
          const a = env.amt;
          const line = (x1, y1, x2, y2, al) => {
            ctx.strokeStyle = rgba(C.accent, al * .25 * a); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.strokeStyle = rgba(C.accent, al * .9 * a); ctx.lineWidth = 2; ctx.stroke();
          };
          for (let i = -26; i <= 26; i++) line(960 + i * 26, HZ, 960 + i * 300, H + 40, .8);
          const N = 16, ph = (t * .45) % 1;
          for (let j = 0; j < N; j++) { const p = (j + ph) / N, y = HZ + (H - HZ) * p * p; line(0, y, W, y, .25 + .75 * p); }
          ctx.strokeStyle = rgba(C.primary, .9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, HZ); ctx.lineTo(W, HZ); ctx.stroke();
        }
      };
    }
  };

  /* =====================================================================
     MORE STYLE SCENES
     ===================================================================== */

  /* ---------- Vaporwave ---------- */
  S.vaporwave = {
    name: "Vaporwave", group: "Style", desc: "Pastel sunset, checkerboard plaza rolling toward you, spinning wireframes", title: "neon",
    build(env) {
      const { C, rnd } = env;
      const HZ = 610;
      const bg = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, C.dark); g.addColorStop(.55, mix(C.secondary, C.accent, .25)); g.addColorStop(1, mix(C.primary, C.light, .25));
        c.fillStyle = g; c.fillRect(0, 0, W, HZ);
        // sun with glitchy offset slices
        const sun = document.createElement("canvas"); sun.width = 520; sun.height = 520; const s = sun.getContext("2d");
        const sg = s.createLinearGradient(0, 0, 0, 520); sg.addColorStop(0, mix(C.digit, C.light, .3)); sg.addColorStop(1, C.primary);
        s.fillStyle = sg; s.beginPath(); s.arc(260, 260, 240, 0, TAU); s.fill();
        for (let y = 250; y < 520; y += 26) { const off = (rnd() - .5) * 40; c.drawImage(sun, 0, y, 520, 13, 700 + off, HZ - 360 + y, 520, 13); }
        c.drawImage(sun, 0, 0, 520, 250, 700, HZ - 360, 520, 250);
        for (let i = 0; i < 120; i++) { c.fillStyle = rgba(C.light, rnd() * .6); c.fillRect(rnd() * W, rnd() * HZ * .5, 2, 2); }
      });
      // a wireframe shape: vertices + edges
      const cube = { v: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]] };
      const pyr = { v: [[0, -1.3, 0], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], e: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1]] };
      const wire = (ctx, m, x, y, s, a, b, col) => {
        const P = m.v.map(([px, py, pz]) => { let X = px * Math.cos(a) - pz * Math.sin(a), Z = px * Math.sin(a) + pz * Math.cos(a); let Y = py * Math.cos(b) - Z * Math.sin(b); Z = py * Math.sin(b) + Z * Math.cos(b); const k = 4 / (4 + Z); return [x + X * s * k, y + Y * s * k]; });
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); m.e.forEach(([i, j]) => { ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); }); ctx.stroke();
      };
      return {
        draw(ctx, t) {
          ctx.drawImage(bg, 0, 0, W, H);
          // checkerboard floor in perspective
          const f = 300, cam = 1.6, scroll = (t * 1.2) % 2;
          ctx.fillStyle = C.dark; ctx.fillRect(0, HZ, W, H - HZ);
          for (let row = 0; row < 26; row++) {
            const z1 = 1 + row - scroll, z2 = z1 + 1; if (z2 <= .3) continue;
            const y1 = HZ + f * cam / Math.max(.3, z2), y2 = HZ + f * cam / Math.max(.3, z1);
            for (let i = -14; i < 14; i++) {
              if (((i + row) & 1) === 0) continue;
              const xa = (z) => 960 + i * f / z, xb = (z) => 960 + (i + 1) * f / z;
              const shade = Math.min(1, 1.6 / z1);
              ctx.fillStyle = rgba(mix(C.secondary, C.accent, .55), (.25 + .55 * shade) * Math.min(1.3, env.amt));
              ctx.beginPath(); ctx.moveTo(xa(z2), y1); ctx.lineTo(xb(z2), y1); ctx.lineTo(xb(Math.max(.3, z1)), y2); ctx.lineTo(xa(Math.max(.3, z1)), y2); ctx.closePath(); ctx.fill();
            }
          }
          const hg = ctx.createLinearGradient(0, HZ - 4, 0, HZ + 120); hg.addColorStop(0, rgba(C.primary, .65)); hg.addColorStop(1, rgba(C.primary, 0));
          ctx.fillStyle = hg; ctx.fillRect(0, HZ, W, 120);
          wire(ctx, cube, 300, 330 + Math.sin(t * .8) * 30, 80, t * .6, t * .4, rgba(C.accent, .75));
          wire(ctx, pyr, 1620, 300 + Math.cos(t * .7) * 30, 90, -t * .5, .35, rgba(C.light, .7));
        }
      };
    }
  };

  /* ---------- Neon Rain ---------- */
  S.neonrain = {
    name: "Neon Rain", group: "Style", desc: "Rainy city night, flickering neon signs reflected in wet streets", title: "neon",
    build(env) {
      const { C, rnd } = env;
      const GROUND = 720;
      const city = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, C.dark); g.addColorStop(1, mix(C.dark, C.secondary, .7));
        c.fillStyle = g; c.fillRect(0, 0, W, GROUND);
        for (let layer = 0; layer < 2; layer++) {
          let x = -20;
          while (x < W) {
            const w = lerp(70, 170, rnd()), h = lerp(180, 520, rnd()) * (layer ? 1 : .75);
            c.fillStyle = mix(C.dark, C.secondary, layer ? .45 : .25); c.fillRect(x, GROUND - h, w - 6, h);
            for (let wy = GROUND - h + 18; wy < GROUND - 20; wy += 22) for (let wx = x + 10; wx < x + w - 18; wx += 18)
              if (rnd() < .28) { c.fillStyle = rgba(rnd() < .5 ? C.digit : C.light, .25 + rnd() * .35); c.fillRect(wx, wy, 7, 9); }
            x += w;
          }
        }
        const gr = c.createLinearGradient(0, GROUND, 0, H); gr.addColorStop(0, mix(C.dark, C.secondary, .5)); gr.addColorStop(1, C.dark);
        c.fillStyle = gr; c.fillRect(0, GROUND, W, H - GROUND);
      });
      // neon signs: simple outlined shapes
      const signs = [
        { x: 230, y: 330, k: "rect", w: 220, h: 80, c: C.primary }, { x: 610, y: 250, k: "circle", r: 55, c: C.accent },
        { x: 1260, y: 290, k: "arrow", w: 190, h: 70, c: C.digit }, { x: 1600, y: 380, k: "rect", w: 160, h: 160, c: C.accent },
        { x: 930, y: 400, k: "bars", w: 150, h: 60, c: C.primary }
      ].map((s) => Object.assign(s, { p: rnd() * 10 }));
      const shape = (ctx, s) => {
        ctx.beginPath();
        if (s.k === "rect") { roundRect(ctx, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, 16); }
        else if (s.k === "circle") ctx.arc(s.x, s.y, s.r, 0, TAU);
        else if (s.k === "arrow") { ctx.moveTo(s.x - s.w / 2, s.y - s.h / 4); ctx.lineTo(s.x + s.w / 6, s.y - s.h / 4); ctx.lineTo(s.x + s.w / 6, s.y - s.h / 2); ctx.lineTo(s.x + s.w / 2, s.y); ctx.lineTo(s.x + s.w / 6, s.y + s.h / 2); ctx.lineTo(s.x + s.w / 6, s.y + s.h / 4); ctx.lineTo(s.x - s.w / 2, s.y + s.h / 4); ctx.closePath(); }
        else { for (let i = 0; i < 4; i++) { ctx.moveTo(s.x - s.w / 2 + i * s.w / 3.2, s.y + s.h / 2); ctx.lineTo(s.x - s.w / 2 + i * s.w / 3.2, s.y - s.h / 2 + i * 8); } }
      };
      const drops = Array.from({ length: 260 }, () => ({ x: rnd() * W, y: rnd() * H, v: lerp(900, 1400, rnd()), l: lerp(18, 40, rnd()) }));
      const splashes = [];
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(city, 0, 0, W, H);
          const glow = env.glow;
          for (const s of signs) {
            const flick = Math.sin(t * 11 + s.p) > .93 || Math.sin(t * 2.3 + s.p * 3) > .985 ? .25 : 1;
            for (const mirror of [false, true]) {
              ctx.save();
              if (mirror) { ctx.translate(0, GROUND * 2); ctx.scale(1, -1); ctx.globalAlpha = .28; ctx.translate(Math.sin(t * 3 + s.p) * 6, 0); }
              shape(ctx, s); ctx.lineCap = "round"; ctx.lineJoin = "round";
              ctx.strokeStyle = rgba(s.c, .22 * flick * Math.min(2, glow)); ctx.lineWidth = 6 + 18 * glow; ctx.stroke();
              ctx.strokeStyle = rgba(s.c, .95 * flick); ctx.lineWidth = 5; ctx.stroke();
              ctx.strokeStyle = rgba(C.light, .8 * flick); ctx.lineWidth = 1.5; ctx.stroke();
              ctx.restore();
            }
          }
          // ripples on the wet street
          ctx.strokeStyle = rgba(C.light, .06); ctx.lineWidth = 2;
          for (let y = GROUND + 20; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y + Math.sin(t + y) * 2); ctx.lineTo(W, y + Math.cos(t * 1.3 + y) * 2); ctx.stroke(); }
          // rain
          ctx.strokeStyle = rgba(C.light, .28 * Math.min(1.5, env.amt)); ctx.lineWidth = 1.6; ctx.beginPath();
          for (const d of drops) {
            d.y += d.v * dt; d.x -= d.v * .12 * dt;
            if (d.y > GROUND + rnd() * (H - GROUND)) { if (splashes.length < 60) splashes.push({ x: d.x, y: d.y, life: 0 }); d.y = -40; d.x = rnd() * (W + 200); }
            ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * .12, d.y - d.l);
          }
          ctx.stroke();
          for (let i = splashes.length - 1; i >= 0; i--) {
            const s = splashes[i]; s.life += dt; if (s.life > .35) { splashes.splice(i, 1); continue; }
            ctx.strokeStyle = rgba(C.light, .35 * (1 - s.life / .35)); ctx.beginPath(); ctx.ellipse(s.x, s.y, 4 + s.life * 40, 1.5 + s.life * 8, 0, 0, TAU); ctx.stroke();
          }
        }
      };
    }
  };

  /* ---------- Paper Cut ---------- */
  S.papercut = {
    name: "Paper Cut", group: "Style", desc: "Layered paper hills with soft shadows, gently swaying, paper sun and clouds", title: "block",
    build(env) {
      const { C, rnd } = env;
      const layers = Array.from({ length: 6 }, (_, i) => ({ base: 430 + i * 105, amp: 70 - i * 6, f: lerp(.0018, .0034, rnd()), p: rnd() * TAU, sp: .15 + i * .05,
        col: mix(mix(C.secondary, C.primary, i / 7), C.dark, i === 5 ? .35 : 0) }));
      const clouds = Array.from({ length: 5 }, (_, i) => ({ x: rnd() * W, y: 250 + rnd() * 170, s: lerp(.7, 1.3, rnd()), v: lerp(8, 20, rnd()) }));
      const sky = env.layer((c) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mix(C.dark, C.secondary, .5)); g.addColorStop(1, mix(C.secondary, C.accent, .3)); c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 4000; i++) { c.fillStyle = rgba(rnd() < .5 ? "#000000" : "#ffffff", .025); c.fillRect(rnd() * W, rnd() * H, 2, 2); } });   // paper grain
      const hill = (ctx, L, t, dy) => {
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, L.base + dy + Math.sin(x * L.f + L.p + t * L.sp) * L.amp + Math.sin(x * L.f * 2.3 + L.p * 2 - t * L.sp * .7) * L.amp * .3);
        ctx.lineTo(W, H); ctx.closePath();
      };
      const cloud = (ctx, x, y, s) => { ctx.beginPath(); [[0, 0, 50], [55, -20, 60], [115, 0, 48], [60, 18, 52]].forEach(([dx, dy, r]) => { ctx.moveTo(x + dx * s + r * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); }); };
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(sky, 0, 0, W, H);
          // paper sun
          ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.arc(1460 + 10, 330 + 12, 120, 0, TAU); ctx.fill();
          ctx.fillStyle = mix(C.digit, C.light, .2); ctx.beginPath(); ctx.arc(1460, 330, 120, 0, TAU); ctx.fill();
          for (const c of clouds) {
            c.x += c.v * dt; if (c.x > W + 200) c.x = -250;
            ctx.fillStyle = "rgba(0,0,0,.15)"; cloud(ctx, c.x + 8, c.y + 10, c.s); ctx.fill();
            ctx.fillStyle = rgba(C.light, .92); cloud(ctx, c.x, c.y, c.s); ctx.fill();
          }
          for (const L of layers) {
            ctx.fillStyle = "rgba(0,0,0,.28)"; hill(ctx, L, t, -10); ctx.save(); ctx.translate(0, -6); ctx.fill(); ctx.restore();
            ctx.fillStyle = L.col; hill(ctx, L, t, 0); ctx.fill();
          }
        }
      };
    }
  };

  /* ---------- Comic Pop ---------- */
  S.comic = {
    name: "Comic Pop", group: "Style", desc: "Spinning comic-book sunburst, halftone dots and starbursts that pop", title: "block",
    build(env) {
      const { C, rnd } = env;
      const dots = env.layer((c) => {
        for (let y = 0; y < H; y += 22) for (let x = (y / 22 % 2) * 11; x < W; x += 22) {
          const d = Math.hypot(x - 960, y - 540) / 1100, r = 1 + d * 8;
          c.fillStyle = rgba(C.dark, .35); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        }
      });
      const bursts = [];
      const star = (ctx, x, y, r, n, rot) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, rr = i % 2 ? r * .55 : r * (0.9 + .1 * Math.sin(i * 7)); ctx[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); };
      let next = 0;
      return {
        draw(ctx, t, dt) {
          ctx.fillStyle = C.secondary; ctx.fillRect(0, 0, W, H);
          const n = 24, rot = t * .08;
          for (let i = 0; i < n; i++) {
            if (i % 2) continue;
            ctx.fillStyle = rgba(C.primary, .55 * Math.min(1.4, env.amt)); ctx.beginPath(); ctx.moveTo(960, 540);
            ctx.arc(960, 540, 1300, rot + i * TAU / n, rot + (i + 1) * TAU / n); ctx.closePath(); ctx.fill();
          }
          ctx.drawImage(dots, 0, 0, W, H);
          // speed lines sweeping across
          ctx.strokeStyle = rgba(C.light, .35); ctx.lineWidth = 4; ctx.lineCap = "round";
          for (let i = 0; i < 9; i++) { const y = 80 + i * 115, x = ((t * 520 + i * 377) % (W + 900)) - 450; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 180 + (i % 3) * 70, y); ctx.stroke(); }
          // pop starbursts
          if (t > next) { next = t + lerp(1.2, 2.4, rnd()); bursts.push({ x: lerp(200, 1720, rnd()), y: lerp(160, 920, rnd()), r: lerp(70, 140, rnd()), c: rnd() < .5 ? C.accent : C.digit, born: t, rot: rnd() * TAU }); }
          for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i], age = t - b.born; if (age > 2.2) { bursts.splice(i, 1); continue; }
            const s = age < .25 ? age / .25 * 1.15 : age < .4 ? 1.15 - (age - .25) / .15 * .15 : age > 1.8 ? 1 - (age - 1.8) / .4 : 1;
            ctx.save(); ctx.translate(b.x, b.y); ctx.scale(s, s);
            star(ctx, 0, 0, b.r, 12, b.rot); ctx.fillStyle = b.c; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.dark; ctx.stroke();
            star(ctx, 0, 0, b.r * .55, 12, b.rot + .2); ctx.fillStyle = C.light; ctx.fill();
            ctx.restore();
          }
        }
      };
    }
  };

  /* ---------- Chalk Talk ---------- */
  S.chalktalk = {
    name: "Chalk Talk", group: "Style", desc: "A coach's chalkboard: half court, X's and O's, plays drawing themselves", title: "block",
    build(env) {
      const { C, rnd } = env;
      const chalk = mix(C.light, "#ffffff", .3);
      const board = env.layer((c) => {
        c.fillStyle = mix(C.dark, "#1d3a2c", .55); c.fillRect(0, 0, W, H);
        for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H, r = lerp(80, 300, rnd()); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(chalk, .045)); g.addColorStop(1, rgba(chalk, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
        // half court in chalk (moved down a little so the show title doesn't cover the hoop)
        c.translate(0, 60);
        c.strokeStyle = rgba(chalk, .55); c.lineWidth = 5; c.lineCap = "round";
        const L = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => { const jx = x + (rnd() - .5) * 3, jy = y + (rnd() - .5) * 3; i ? c.lineTo(jx, jy) : c.moveTo(jx, jy); }); c.stroke(); };
        L([[260, 1020], [260, 120], [1660, 120], [1660, 1020]]);        // sidelines + baseline
        L([[760, 120], [760, 520], [1160, 520], [1160, 120]]);          // the paint
        c.beginPath(); c.arc(960, 520, 200, 0, Math.PI); c.stroke();     // free-throw circle
        c.beginPath(); c.moveTo(380, 120); c.lineTo(380, 300); c.arc(960, 210, 600, Math.PI - .16, .16, true); c.lineTo(1540, 120); c.stroke();   // three-point line
        c.beginPath(); c.arc(960, 175, 22, 0, TAU); c.stroke(); L([[900, 150], [1020, 150]]);   // hoop + backboard
        c.beginPath(); c.arc(960, 980, 200, Math.PI, TAU); c.stroke();    // half-court circle
      });
      // plays: players (x/o) and moves: [kind, points]  kind: cut | pass | dribble | screen
      const PLAYS = [
        { o: [[960, 860], [520, 640], [1400, 640], [600, 260], [1320, 260]], x: [[960, 760], [600, 600], [1320, 600], [680, 300], [1240, 300]],
          m: [["pass", [[960, 860], [520, 640]]], ["cut", [[960, 860], [880, 600], [960, 360]]], ["pass", [[520, 640], [960, 360]]], ["screen", [[1320, 260], [1060, 330]]]] },
        { o: [[960, 860], [480, 520], [1440, 520], [820, 260], [1100, 260]], x: [[960, 780], [560, 520], [1360, 520], [860, 330], [1060, 330]],
          m: [["dribble", [[960, 860], [1160, 760], [1330, 640]]], ["screen", [[1100, 260], [1300, 600]]], ["cut", [[480, 520], [660, 330], [880, 220]]], ["pass", [[1330, 640], [880, 220]]]] },
        { o: [[700, 860], [1220, 860], [400, 360], [1520, 360], [960, 300]], x: [[720, 760], [1200, 760], [480, 380], [1440, 380], [960, 380]],
          m: [["pass", [[700, 860], [1220, 860]]], ["cut", [[700, 860], [760, 560], [1000, 420]]], ["dribble", [[1220, 860], [1380, 700], [1440, 560]]], ["pass", [[1440, 560], [1000, 420]]], ["cut", [[960, 300], [700, 240]]]] }
      ];
      const sample = (pts) => {   // turn a few points into a smooth polyline
        if (pts.length === 2) return Array.from({ length: 30 }, (_, i) => [lerp(pts[0][0], pts[1][0], i / 29), lerp(pts[0][1], pts[1][1], i / 29)]);
        const out = []; for (let i = 0; i <= 40; i++) { const u = i / 40, a = pts[0], b = pts[1], c = pts[2]; out.push([(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * b[0] + u * u * c[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * b[1] + u * u * c[1]]); } return out;
      };
      PLAYS.forEach((p) => p.m.forEach((m) => m.push(sample(m[1]))));
      const drawMove = (ctx, kind, path, frac) => {
        const n = Math.max(2, Math.floor(path.length * frac)); const P = path.slice(0, n);
        ctx.strokeStyle = rgba(chalk, .85); ctx.lineWidth = 5; ctx.setLineDash(kind === "pass" ? [16, 14] : []);
        ctx.beginPath();
        P.forEach(([x, y], i) => {
          if (kind === "dribble" && i > 0 && i < P.length - 1) { const [px, py] = P[i - 1], ang = Math.atan2(y - py, x - px) + Math.PI / 2, w = (i % 2 ? 9 : -9); ctx.lineTo(x + Math.cos(ang) * w, y + Math.sin(ang) * w); }
          else i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke(); ctx.setLineDash([]);
        const [x2, y2] = P[P.length - 1], [x1, y1] = P[P.length - 2], a = Math.atan2(y2 - y1, x2 - x1);
        if (kind === "screen") { ctx.beginPath(); ctx.moveTo(x2 + Math.cos(a + Math.PI / 2) * 22, y2 + Math.sin(a + Math.PI / 2) * 22); ctx.lineTo(x2 - Math.cos(a + Math.PI / 2) * 22, y2 - Math.sin(a + Math.PI / 2) * 22); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a - .45) * 26, y2 - Math.sin(a - .45) * 26); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a + .45) * 26, y2 - Math.sin(a + .45) * 26); ctx.stroke(); }
      };
      const PLAY_T = 11;
      return {
        draw(ctx, t) {
          ctx.drawImage(board, 0, 0, W, H);
          const k = Math.floor(t / PLAY_T) % PLAYS.length, pt = t % PLAY_T, p = PLAYS[k];
          const fade = pt > PLAY_T - 1.2 ? (PLAY_T - pt) / 1.2 : pt < .6 ? pt / .6 : 1;
          ctx.save(); ctx.translate(0, 60); ctx.globalAlpha = fade * Math.min(1, .55 + .45 * env.amt); ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.font = "bold 58px 'Comic Sans MS', 'Segoe Print', 'Bradley Hand', cursive"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          p.o.forEach(([x, y]) => { ctx.strokeStyle = rgba(C.primary, .95); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.stroke(); });
          p.x.forEach(([x, y]) => { ctx.strokeStyle = rgba(C.accent, .95); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 20, y - 20); ctx.lineTo(x + 20, y + 20); ctx.moveTo(x + 20, y - 20); ctx.lineTo(x - 20, y + 20); ctx.stroke(); });
          p.m.forEach((m, i) => { const st = 1 + i * 1.8, f = Math.max(0, Math.min(1, (pt - st) / 1.4)); if (f > 0) drawMove(ctx, m[0], m[2], f); });
          ctx.restore();
        }
      };
    }
  };

  /* ---------- VHS ---------- */
  S.vhs = {
    name: "VHS Tape", group: "Style", desc: "Old tape look: tracking lines, color fringes, static and a PLAY counter", title: "block",
    build(env) {
      const { C, rnd } = env;
      const scene = env.layer((c) => {
        const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.dark); g.addColorStop(.5, C.secondary); g.addColorStop(1, mix(C.dark, C.primary, .3)); c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 7; i++) { const x = rnd() * W, y = rnd() * H, r = lerp(160, 420, rnd()), col = [C.primary, C.accent, C.digit][i % 3]; const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(col, .45)); rg.addColorStop(1, rgba(col, 0)); c.fillStyle = rg; c.fillRect(0, 0, W, H); }
        c.strokeStyle = rgba(C.light, .12); c.lineWidth = 3; for (let i = 0; i < 12; i++) { c.strokeRect(lerp(100, 1600, rnd()), lerp(100, 800, rnd()), lerp(80, 260, rnd()), lerp(80, 260, rnd())); }
      });
      const lines = env.layer((c) => { for (let y = 0; y < H; y += 4) { c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(0, y, W, 2); } });
      let glitchUntil = 0, nextGlitch = 2;
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(scene, 0, 0, W, H);
          // color fringe
          ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .12;
          ctx.drawImage(scene, 6 + Math.sin(t * 3) * 3, 0, W, H); ctx.drawImage(scene, -6, 0, W, H);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
          // glitch: shift a few slices sideways now and then
          if (t > nextGlitch) { glitchUntil = t + lerp(.15, .5, rnd()); nextGlitch = t + lerp(2, 6, rnd()); }
          if (t < glitchUntil) for (let i = 0; i < 6; i++) { const y = rnd() * H, h = lerp(8, 60, rnd()); ctx.drawImage(scene, 0, y, W, h, (rnd() - .5) * 120, y, W, h); }
          // tracking band rolling down
          const by = (t * 160) % (H + 300) - 150;
          const tb = ctx.createLinearGradient(0, by - 60, 0, by + 60); tb.addColorStop(0, "rgba(255,255,255,0)"); tb.addColorStop(.5, rgba(C.light, .14 * Math.min(1.5, env.amt))); tb.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = tb; ctx.fillRect(0, by - 60, W, 120);
          for (let i = 0; i < 90; i++) { ctx.fillStyle = rgba(C.light, rnd() * .35); ctx.fillRect(rnd() * W, by - 40 + rnd() * 80, rnd() * 50, 2); }
          // static specks
          for (let i = 0; i < 160; i++) { ctx.fillStyle = rgba(rnd() < .5 ? "#ffffff" : "#000000", rnd() * .25); ctx.fillRect(rnd() * W, rnd() * H, 3, 2); }
          ctx.drawImage(lines, 0, 0, W, H);
          // on-screen display
          ctx.font = "bold 46px 'VT323', 'Courier New', monospace"; ctx.textBaseline = "top"; ctx.fillStyle = rgba(C.light, .9);
          ctx.fillText("PLAY ►", 80, 70);
          const s = Math.floor(t / env.speed), tc = `${String(Math.floor(s / 3600)).padStart(1, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
          ctx.textAlign = "right"; ctx.fillText(tc, W - 80, 70); ctx.fillText("SP", W - 80, 126); ctx.textAlign = "left";
        }
      };
    }
  };

  /* =====================================================================
     ABSTRACT
     ===================================================================== */

  S.aurora = {
    name: "Aurora", group: "Abstract", desc: "Big soft color blobs slowly flowing into each other", title: "block",
    build(env) {
      const { C, rnd } = env;
      const lw = 192, lh = 108, low = document.createElement("canvas"); low.width = lw; low.height = lh; const c = low.getContext("2d");
      const blobs = [C.primary, C.accent, C.secondary, C.digit, C.primary, C.accent].map((col) => ({ col, ax: rnd() * TAU, ay: rnd() * TAU, fx: lerp(.05, .12, rnd()), fy: lerp(.04, .1, rnd()), r: lerp(35, 70, rnd()) }));
      return {
        draw(ctx, t) {
          c.globalCompositeOperation = "source-over"; c.fillStyle = C.dark; c.fillRect(0, 0, lw, lh);
          c.globalCompositeOperation = "lighter";
          for (const b of blobs) {
            const x = lw / 2 + Math.cos(t * b.fx + b.ax) * lw * .38, y = lh / 2 + Math.sin(t * b.fy + b.ay) * lh * .36;
            const g = c.createRadialGradient(x, y, 0, x, y, b.r); g.addColorStop(0, rgba(b.col, .42 * Math.min(1.3, env.amt))); g.addColorStop(1, rgba(b.col, 0));
            c.fillStyle = g; c.fillRect(0, 0, lw, lh);
          }
          ctx.imageSmoothingEnabled = true; ctx.drawImage(low, 0, 0, W, H);
        }
      };
    }
  };

  S.waves = {
    name: "Waves", group: "Abstract", desc: "Layered color waves rolling across the bottom", title: "block",
    build(env) {
      const { C } = env;
      const cols = [C.secondary, mix(C.secondary, C.primary, .35), C.primary, mix(C.primary, C.accent, .5), C.accent, mix(C.accent, C.light, .3)];
      const bg = env.layer((c) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.dark); g.addColorStop(1, mix(C.dark, C.secondary, .7)); c.fillStyle = g; c.fillRect(0, 0, W, H); });
      return {
        draw(ctx, t) {
          ctx.drawImage(bg, 0, 0, W, H);
          cols.forEach((col, i) => {
            const base = 560 + i * 85, amp = 60 - i * 5;
            ctx.fillStyle = rgba(col, (.22 + i * .05) * Math.min(1.4, env.amt)); ctx.beginPath(); ctx.moveTo(0, H);
            for (let x = 0; x <= W; x += 16) ctx.lineTo(x, base + Math.sin(x * .0026 + t * (.35 + i * .07) + i) * amp + Math.sin(x * .006 - t * .5 + i * 2) * amp * .35);
            ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
          });
          ctx.strokeStyle = rgba(C.light, .12 * env.amt); ctx.lineWidth = 2;
          for (let k = 0; k < 5; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 16) { const y = 180 + k * 40 + Math.sin(x * .002 + t * .3 + k * .7) * 40; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
        }
      };
    }
  };

  S.shapes = {
    name: "Shapes", group: "Abstract", desc: "Playful floating geometry — circles, triangles, squiggles", title: "block",
    build(env) {
      const { C, rnd } = env;
      const kinds = ["circle", "ring", "tri", "square", "squiggle", "dots", "plus"];
      const shapes = Array.from({ length: 30 }, () => ({ k: kinds[Math.floor(rnd() * kinds.length)], x: rnd() * W, y: rnd() * H, s: lerp(24, 70, rnd()), r: rnd() * TAU,
        vr: (rnd() - .5) * .4, vx: (rnd() - .5) * 26, vy: (rnd() - .5) * 26, c: [C.primary, C.accent, C.digit, C.light][Math.floor(rnd() * 4)] }));
      const bg = env.layer((c) => { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.dark); g.addColorStop(1, C.secondary); c.fillStyle = g; c.fillRect(0, 0, W, H); });
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          for (const s of shapes) {
            s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.vr * dt;
            if (s.x < -100) s.x = W + 100; if (s.x > W + 100) s.x = -100; if (s.y < -100) s.y = H + 100; if (s.y > H + 100) s.y = -100;
            ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.r);
            const a = .4 * Math.min(1.5, env.amt); ctx.fillStyle = rgba(s.c, a); ctx.strokeStyle = rgba(s.c, a); ctx.lineWidth = 8; ctx.lineCap = "round";
            const z = s.s;
            if (s.k === "circle") { ctx.beginPath(); ctx.arc(0, 0, z * .6, 0, TAU); ctx.fill(); }
            else if (s.k === "ring") { ctx.beginPath(); ctx.arc(0, 0, z * .6, 0, TAU); ctx.stroke(); }
            else if (s.k === "tri") { ctx.beginPath(); ctx.moveTo(0, -z * .7); ctx.lineTo(z * .65, z * .5); ctx.lineTo(-z * .65, z * .5); ctx.closePath(); ctx.fill(); }
            else if (s.k === "square") { ctx.strokeRect(-z * .5, -z * .5, z, z); }
            else if (s.k === "squiggle") { ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx[i ? "lineTo" : "moveTo"](-z + i * z / 3, i % 2 ? -z * .25 : z * .25); ctx.stroke(); }
            else if (s.k === "dots") { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(i * z * .4, j * z * .4, 5, 0, TAU); ctx.fill(); } }
            else { ctx.fillRect(-z * .5, -5, z, 10); ctx.fillRect(-5, -z * .5, 10, z); }
            ctx.restore();
          }
        }
      };
    }
  };

  S.lowpoly = {
    name: "Low Poly", group: "Abstract", desc: "A faceted triangle mesh with slowly shifting light", title: "block",
    build(env) {
      const { C, rnd } = env;
      const cols = 14, rows = 9, pts = [];
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const edge = i === 0 || j === 0 || i === cols || j === rows;
        pts.push({ x: i * W / cols + (edge ? 0 : (rnd() - .5) * 90), y: j * H / rows + (edge ? 0 : (rnd() - .5) * 80), p: rnd() * TAU });
      }
      const tris = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
        if (rnd() < .5) tris.push([a, b, d], [a, d, c]); else tris.push([a, b, c], [b, d, c]);
      }
      return {
        draw(ctx, t) {
          const P = pts.map((p) => ({ x: p.x + Math.sin(t * .4 + p.p) * 6, y: p.y + Math.cos(t * .35 + p.p) * 6 }));
          for (const tr of tris) {
            const [A, B, Cc] = tr.map((k) => P[k]);
            const cx = (A.x + B.x + Cc.x) / 3, cy = (A.y + B.y + Cc.y) / 3;
            const shade = .5 + .5 * Math.sin(t * .5 + cx * .004 + cy * .003);
            const base = mix(C.dark, C.secondary, Math.min(1, cy / H * .9 + .1));
            const col = mix(base, cx < W / 2 ? C.primary : C.accent, shade * .22 * Math.min(1.5, env.amt));
            ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(Cc.x, Cc.y); ctx.closePath(); ctx.fill(); ctx.stroke();
          }
        }
      };
    }
  };

  S.flow = {
    name: "Flow Field", group: "Abstract", desc: "Generative art: thousands of trails drifting along invisible currents", title: "block", persistent: true,
    build(env) {
      const { C, rnd } = env;
      const cols = [C.primary, C.accent, C.digit, C.light];
      const mk = () => ({ x: rnd() * W, y: rnd() * H, life: lerp(2, 7, rnd()), c: cols[Math.floor(rnd() * 4)] });
      const parts = Array.from({ length: 900 }, mk);
      let first = true;
      return {
        draw(ctx, t, dt) {
          if (first) { ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H); first = false; }
          ctx.fillStyle = rgba(C.dark, .04); ctx.fillRect(0, 0, W, H);
          ctx.lineWidth = 2.5;
          parts.forEach((p, i) => {
            const a = Math.sin(p.x * .0021 + t * .1) * 2 + Math.cos(p.y * .0027 - t * .07) * 2 + Math.sin((p.x + p.y) * .0009) ;
            const nx = p.x + Math.cos(a) * 70 * dt, ny = p.y + Math.sin(a) * 70 * dt;
            ctx.strokeStyle = rgba(p.c, .5 * env.amt); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
            p.x = nx; p.y = ny; p.life -= dt;
            if (p.life < 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) parts[i] = mk();
          });
        }
      };
    }
  };

  S.warp = {
    name: "Warp", group: "Abstract", desc: "Stars streaming past, like flying through space", title: "neon",
    build(env) {
      const { C, rnd } = env;
      const mk = (any) => ({ x: (rnd() - .5) * 2, y: (rnd() - .5) * 2, z: any ? rnd() : 1, c: rnd() < .25 ? C.accent : rnd() < .4 ? C.primary : C.light });
      const stars = Array.from({ length: 420 }, () => mk(true));
      const bg = env.layer((c) => { const g = c.createRadialGradient(960, 540, 0, 960, 540, 1100); g.addColorStop(0, mix(C.secondary, C.dark, .2)); g.addColorStop(1, C.dark); c.fillStyle = g; c.fillRect(0, 0, W, H); });
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          ctx.lineCap = "round";
          stars.forEach((s, i) => {
            const pz = s.z; s.z -= dt * .32;
            if (s.z <= .02) { stars[i] = mk(false); return; }
            const k = 520, x1 = 960 + s.x / pz * k, y1 = 540 + s.y / pz * k, x2 = 960 + s.x / s.z * k, y2 = 540 + s.y / s.z * k;
            if (x2 < -50 || x2 > W + 50 || y2 < -50 || y2 > H + 50) { stars[i] = mk(false); return; }
            ctx.strokeStyle = rgba(s.c, Math.min(1, (.15 + (1 - s.z) * .85) * env.amt)); ctx.lineWidth = (1 - s.z) * 5 + 1;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          });
        }
      };
    }
  };

  S.halftone = {
    name: "Halftone", group: "Abstract", desc: "A grid of dots rippling like a speaker cone", title: "block",
    build(env) {
      const { C } = env;
      const step = 38, dots = [];
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) dots.push([x, y]);
      return {
        draw(ctx, t) {
          ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
          const ax = 960 + Math.cos(t * .2) * 600, ay = 540 + Math.sin(t * .27) * 300, bx = 960 + Math.cos(t * .13 + 2) * 700, by = 540 + Math.sin(t * .17 + 1) * 350;
          for (const [x, y] of dots) {
            const v = .5 + .25 * Math.sin(Math.hypot(x - ax, y - ay) * .012 - t * 1.6) + .25 * Math.sin(Math.hypot(x - bx, y - by) * .01 - t * 1.1);
            const r = 2 + v * 13;
            ctx.fillStyle = rgba(mix(C.secondary, v > .55 ? C.primary : C.accent, v), .32 * Math.min(1.6, env.amt) + .06);
            ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          }
        }
      };
    }
  };

  /* =====================================================================
     MORE ABSTRACT SCENES
     ===================================================================== */

  /* ---------- Lava Lamp (metaballs, computed at low resolution and scaled up) ---------- */
  S.lava = {
    name: "Lava Lamp", group: "Abstract", desc: "Soft blobs rising, merging and splitting like a lava lamp", title: "block",
    build(env) {
      const { C, rnd } = env;
      const lw = 160, lh = 90, low = document.createElement("canvas"); low.width = lw; low.height = lh;
      const lc = low.getContext("2d"), img = lc.createImageData(lw, lh);
      const rgb = (h) => hexToRgb(h);
      const A = rgb(C.primary), B = rgb(C.accent), D = rgb(C.dark), S2 = rgb(C.secondary);
      const balls = Array.from({ length: 9 }, () => ({ x: rnd() * lw, ph: rnd() * TAU, sp: lerp(.05, .12, rnd()), r: lerp(9, 17, rnd()), wob: rnd() * TAU }));
      return {
        draw(ctx, t) {
          const P = balls.map((b) => [b.x + Math.sin(t * .3 + b.wob) * 12, lh / 2 + Math.sin(t * b.sp * 4 + b.ph) * lh * .55, b.r * b.r]);
          const d = img.data, amt = Math.min(1.4, env.amt);
          for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
            let f = 0; for (const [bx, by, r2] of P) { const dx = x - bx, dy = y - by; f += r2 / (dx * dx + dy * dy + 1); }
            const i = (y * lw + x) * 4, v = y / lh;
            // blend blob and background over a soft band around the edge (f ≈ 1)
            const inside = Math.max(0, Math.min(1, (f - .82) / .36)), sm = inside * inside * (3 - 2 * inside);
            const edge = Math.max(0, Math.min(1, (f - 1) * 1.6)), g = Math.min(1, f) * .45 * amt;
            for (let c = 0; c < 3; c++) {
              const blob = (A[c] + (B[c] - A[c]) * v) * (.65 + .35 * edge);
              const base = D[c] + (S2[c] - D[c]) * (1 - v) * .6, bgc = base + ((A[c] + B[c]) / 2 - base) * g * g;
              d[i + c] = bgc + (blob - bgc) * sm;
            }
            d[i + 3] = 255;
          }
          lc.putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = true; ctx.drawImage(low, 0, 0, W, H);
        }
      };
    }
  };

  /* ---------- Silk Ribbons ---------- */
  S.ribbons = {
    name: "Silk Ribbons", group: "Abstract", desc: "Bundles of fine lines twisting like silk in slow motion", title: "block",
    build(env) {
      const { C, rnd } = env;
      const bg = env.layer((c) => { const g = c.createRadialGradient(960, 540, 0, 960, 540, 1100); g.addColorStop(0, mix(C.secondary, C.dark, .3)); g.addColorStop(1, C.dark); c.fillStyle = g; c.fillRect(0, 0, W, H); });
      const R = [C.primary, C.accent, C.digit, C.light].map((col, i) => ({ col, y: 260 + i * 190, amp: lerp(90, 170, rnd()), f: lerp(.0016, .0028, rnd()), p: rnd() * TAU, tw: lerp(.6, 1.2, rnd()) }));
      return {
        draw(ctx, t) {
          ctx.drawImage(bg, 0, 0, W, H);
          ctx.lineWidth = 1.4; ctx.globalCompositeOperation = "lighter";
          for (const r of R) {
            ctx.strokeStyle = rgba(r.col, .2 * Math.min(1.6, env.amt));
            for (let k = 0; k < 26; k++) {
              const off = (k - 13) / 13;
              ctx.beginPath();
              for (let x = -40; x <= W + 40; x += 24) {
                const tw = Math.sin(x * .0018 + t * .4 * r.tw + r.p) * 60 * off;   // the twist
                const y = r.y + Math.sin(x * r.f + t * .25 + r.p) * r.amp + tw + Math.sin(x * .004 - t * .3 + k * .05) * 12;
                x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
          }
          ctx.globalCompositeOperation = "source-over";
        }
      };
    }
  };

  /* ---------- Constellation ---------- */
  S.plexus = {
    name: "Constellation", group: "Abstract", desc: "Drifting points that link up into a glowing network", title: "neon",
    build(env) {
      const { C, rnd } = env;
      const N = 95, LINK = 190;
      const pts = Array.from({ length: N }, () => ({ x: rnd() * W, y: rnd() * H, vx: (rnd() - .5) * 30, vy: (rnd() - .5) * 30, c: rnd() < .3 ? C.accent : rnd() < .5 ? C.primary : C.light }));
      const bg = env.layer((c) => { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.dark); g.addColorStop(1, mix(C.dark, C.secondary, .8)); c.fillStyle = g; c.fillRect(0, 0, W, H); });
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          for (const p of pts) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
          ctx.lineWidth = 1.5;
          for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
            if (d2 > LINK * LINK) continue;
            ctx.strokeStyle = rgba(a.c, (1 - Math.sqrt(d2) / LINK) * .55 * Math.min(1.5, env.amt));
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
          for (const p of pts) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10 + 8 * env.glow); g.addColorStop(0, rgba(p.c, .9)); g.addColorStop(1, rgba(p.c, 0));
            ctx.fillStyle = g; ctx.fillRect(p.x - 20, p.y - 20, 40, 40);
            ctx.fillStyle = rgba(C.light, .95); ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, TAU); ctx.fill();
          }
        }
      };
    }
  };

  /* ---------- Topography (contour lines, marching squares) ---------- */
  S.topo = {
    name: "Topography", group: "Abstract", desc: "Map contour lines slowly shifting like moving terrain", title: "block",
    build(env) {
      const { C } = env;
      const cell = 24, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1, F = new Float32Array(cols * rows);
      const LEVELS = 11;
      const bg = env.layer((c) => { c.fillStyle = mix(C.dark, C.secondary, .35); c.fillRect(0, 0, W, H); });
      return {
        draw(ctx, t) {
          ctx.drawImage(bg, 0, 0, W, H);
          const T = t * .12;
          for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
            const x = i * cell, y = j * cell;
            F[j * cols + i] = Math.sin(x * .0021 + T) * Math.cos(y * .0027 - T * .8) + .6 * Math.sin((x + y) * .0016 - T * 1.3) + .4 * Math.cos(Math.hypot(x - 960, y - 540) * .006 - T * 1.7);
          }
          ctx.lineWidth = 2.6;
          for (let L = 0; L < LEVELS; L++) {
            const lv = -1.8 + L * 3.6 / LEVELS;
            ctx.strokeStyle = rgba(mix(C.primary, C.accent, L / LEVELS), (L % 3 === 0 ? .9 : .5) * Math.min(1.5, env.amt));
            ctx.beginPath();
            for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
              const a = F[j * cols + i], b = F[j * cols + i + 1], c = F[(j + 1) * cols + i + 1], d = F[(j + 1) * cols + i];
              const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
              if (idx === 0 || idx === 15) continue;
              const x = i * cell, y = j * cell, e = (p, q) => (lv - p) / (q - p);
              const top = [x + cell * e(a, b), y], right = [x + cell, y + cell * e(b, c)], bottom = [x + cell * e(d, c), y + cell], left = [x, y + cell * e(a, d)];
              const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
              switch (idx) {
                case 1: case 14: seg(left, bottom); break; case 2: case 13: seg(bottom, right); break; case 3: case 12: seg(left, right); break;
                case 4: case 11: seg(top, right); break; case 6: case 9: seg(top, bottom); break; case 7: case 8: seg(left, top); break;
                case 5: seg(left, top); seg(bottom, right); break; case 10: seg(top, right); seg(left, bottom); break;
              }
            }
            ctx.stroke();
          }
        }
      };
    }
  };

  /* ---------- Bokeh ---------- */
  S.bokeh = {
    name: "Bokeh", group: "Abstract", desc: "Soft out-of-focus lights drifting, like a blurry arena crowd", title: "block",
    build(env) {
      const { C, rnd } = env;
      const sprite = (col, ring) => { const s = document.createElement("canvas"); s.width = s.height = 128; const c = s.getContext("2d");
        const g = c.createRadialGradient(64, 64, 0, 64, 64, 62); g.addColorStop(0, rgba(col, ring ? .18 : .55)); g.addColorStop(ring ? .85 : .7, rgba(col, ring ? .3 : .35)); g.addColorStop(1, rgba(col, 0));
        c.fillStyle = g; c.beginPath(); c.arc(64, 64, 62, 0, TAU); c.fill(); return s; };
      const sprites = [C.primary, C.accent, C.digit, C.light].flatMap((c) => [sprite(c, false), sprite(c, true)]);
      const bg = env.layer((c) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.dark); g.addColorStop(1, mix(C.dark, C.secondary, .8)); c.fillStyle = g; c.fillRect(0, 0, W, H); });
      const lights = Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * H, r: lerp(30, 150, rnd() ** 2), v: lerp(6, 22, rnd()), s: Math.floor(rnd() * sprites.length), p: rnd() * TAU }));
      return {
        draw(ctx, t, dt) {
          ctx.drawImage(bg, 0, 0, W, H);
          ctx.globalCompositeOperation = "lighter";
          for (const l of lights) {
            l.y -= l.v * dt; l.x += Math.sin(t * .3 + l.p) * 8 * dt; if (l.y < -l.r) { l.y = H + l.r; l.x = rnd() * W; }
            ctx.globalAlpha = Math.min(1, (.45 + .35 * Math.sin(t * .8 + l.p)) * Math.min(1.5, env.amt));
            ctx.drawImage(sprites[l.s], l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
          }
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        }
      };
    }
  };

  /* ---------- Truchet tiles ---------- */
  S.truchet = {
    name: "Truchet Tiles", group: "Abstract", desc: "A maze of curved tiles that keep flipping into new paths", title: "block",
    build(env) {
      const { C, rnd } = env;
      const T = 96, cols = Math.ceil(W / T), rows = Math.ceil(H / T) + 1;
      const tiles = Array.from({ length: cols * rows }, () => ({ o: rnd() < .5 ? 0 : 1, a: 0, flip: 0 }));
      let next = 0;
      return {
        draw(ctx, t, dt) {
          ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
          if (t > next) { next = t + .12; const k = Math.floor(rnd() * tiles.length); if (!tiles[k].flip) tiles[k].flip = 1e-6; }
          ctx.lineCap = "round";
          for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
            const tl = tiles[j * cols + i];
            if (tl.flip) { tl.flip += dt / .6; if (tl.flip >= 1) { tl.flip = 0; tl.o ^= 1; } }
            const ease = tl.flip ? (1 - Math.cos(tl.flip * Math.PI)) / 2 : 0;
            const cx = i * T + T / 2, cy = j * T + T / 2;
            const k = (i / cols + j / rows) / 2, col = mix(C.primary, C.accent, k);
            ctx.save(); ctx.translate(cx, cy); ctx.rotate((tl.o + ease) * Math.PI / 2);
            ctx.strokeStyle = rgba(col, .2 * Math.min(1.5, env.amt)); ctx.lineWidth = 26;
            ctx.beginPath(); ctx.arc(-T / 2, -T / 2, T / 2, 0, Math.PI / 2); ctx.stroke(); ctx.beginPath(); ctx.arc(T / 2, T / 2, T / 2, Math.PI, Math.PI * 1.5); ctx.stroke();
            ctx.strokeStyle = rgba(col, .75 * Math.min(1.3, env.amt)); ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(-T / 2, -T / 2, T / 2, 0, Math.PI / 2); ctx.stroke(); ctx.beginPath(); ctx.arc(T / 2, T / 2, T / 2, Math.PI, Math.PI * 1.5); ctx.stroke();
            ctx.restore();
          }
        }
      };
    }
  };

  /* ---------- Kaleidoscope ---------- */
  S.kaleido = {
    name: "Kaleidoscope", group: "Abstract", desc: "Shapes tumbling inside a slowly turning twelve-way mirror", title: "neon",
    build(env) {
      const { C, rnd } = env;
      const R = 1150, WEDGE = TAU / 12;
      const src = document.createElement("canvas"); src.width = 600; src.height = 420; const s = src.getContext("2d");
      const bits = Array.from({ length: 22 }, () => ({ x: rnd() * 600, y: rnd() * 420, r: lerp(18, 70, rnd()), k: Math.floor(rnd() * 3), c: [C.primary, C.accent, C.digit, C.light][Math.floor(rnd() * 4)], vx: (rnd() - .5) * 40, vy: (rnd() - .5) * 40, a: rnd() * TAU }));
      return {
        draw(ctx, t, dt) {
          s.fillStyle = C.dark; s.fillRect(0, 0, 600, 420);
          for (const b of bits) {
            b.x = (b.x + b.vx * dt + 600) % 600; b.y = (b.y + b.vy * dt + 420) % 420; b.a += dt * .5;
            s.save(); s.translate(b.x, b.y); s.rotate(b.a); s.fillStyle = rgba(b.c, .55 * Math.min(1.5, env.amt)); s.strokeStyle = rgba(b.c, .9); s.lineWidth = 4;
            s.beginPath();
            if (b.k === 0) s.arc(0, 0, b.r, 0, TAU); else if (b.k === 1) { s.moveTo(0, -b.r); s.lineTo(b.r, b.r * .8); s.lineTo(-b.r, b.r * .8); s.closePath(); } else s.rect(-b.r * .7, -b.r * .7, b.r * 1.4, b.r * 1.4);
            s.fill(); s.stroke(); s.restore();
          }
          ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
          ctx.save(); ctx.translate(960, 540); ctx.rotate(t * .05);
          for (let i = 0; i < 12; i++) {
            ctx.save(); ctx.rotate(i * WEDGE); if (i % 2) ctx.scale(1, -1);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, 0, WEDGE + .003); ctx.closePath(); ctx.clip();
            ctx.drawImage(src, 0, 0, 600, 420, 0, -20, R * .55, R * .385); ctx.drawImage(src, 0, 0, 600, 420, R * .5, -20, R * .55, R * .385);
            ctx.restore();
          }
          ctx.restore();
          const v = ctx.createRadialGradient(960, 540, 300, 960, 540, 1100); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, rgba(C.dark, .75));
          ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
        }
      };
    }
  };

  window.AWYM_SCENES = S;
  window.AWYM_SCENE_HELPERS = { rgba, mix, seeded };
})();
