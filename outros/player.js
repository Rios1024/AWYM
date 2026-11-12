/* ============================================================================
   OUTRO PLAYER: lets the HyperFrames outro compositions in this folder play
   live in a browser or OBS (no rendering needed).

   Load it in <head>, before the composition's own script. It:
     - answers window.__hyperframes.getVariables() with the composition's
       declared defaults (data-composition-variables on <html>) overlaid with
       the values in the address: ?vars=<url-encoded JSON>
     - drives the composition's paused GSAP timeline in real time, shows each
       timed element only between its data-start and data-start + data-duration
       (like the HyperFrames runtime), and plays the <audio> clips at their times
       with their data-volume and data-fade-in / data-fade-out
     - does nothing by itself unless asked (?autoplay=1 or a message), so the
       same file still renders with `npx hyperframes render`.

   Messages (window.postMessage, from the page that holds it in an <iframe>):
     in:  {awymOutro: 1, cmd: "play" | "pause" | "stop" | "seek", t, muted}
     out: {awymOutro: 1, ev: "ready", id, duration, schema, values}
          {awymOutro: 1, ev: "time", t, playing}   (about 10 times a second while playing)
          {awymOutro: 1, ev: "done"}
   ============================================================================ */
(function () {
  "use strict";
  const qs = new URLSearchParams(location.search);
  let schema = [];
  try { schema = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]"); } catch (e) { schema = []; }
  let given = {};
  try { given = JSON.parse(qs.get("vars") || "{}") || {}; } catch (e) { given = {}; }
  const values = {};
  schema.forEach((v) => { values[v.id] = v.default; });
  Object.keys(given).forEach((k) => { if (given[k] !== "" && given[k] !== null && given[k] !== undefined) values[k] = given[k]; });

  // only stand in for HyperFrames when its own runtime isn't here (e.g. during `hyperframes render`)
  if (!window.__hyperframes || typeof window.__hyperframes.getVariables !== "function") {
    window.__hyperframes = Object.assign(window.__hyperframes || {}, { getVariables: () => Object.assign({}, values), __awymPlayer: true });
  }
  if (!window.__hyperframes.__awymPlayer) return;

  const post = (msg) => { try { (window.parent !== window ? window.parent : window).postMessage(Object.assign({ awymOutro: 1 }, msg), "*"); } catch (e) {} };

  let root, tl, duration = 10, timed = [], clips = [];
  let playing = false, t0 = 0, from = 0, now = 0, muted = qs.get("muted") === "1", lastPost = 0, raf = 0;

  function setup() {
    root = document.querySelector("[data-composition-id]");
    if (!root) return false;
    const id = root.getAttribute("data-composition-id");
    tl = window.__timelines && window.__timelines[id];
    if (!tl) return false;
    duration = Number(root.getAttribute("data-duration")) || tl.duration() || 10;
    timed = [...root.querySelectorAll("[data-start]")].filter((el) => el !== root && el.tagName !== "AUDIO" && el.tagName !== "VIDEO");
    clips = [...root.querySelectorAll("audio[data-start]")].map((a) => ({
      a, start: +a.dataset.start || 0, dur: +a.dataset.duration || 0, vol: Math.min(1, a.dataset.volume ? +a.dataset.volume : 1),
      fin: +a.dataset.fadeIn || 0, fout: +a.dataset.fadeOut || 0, mstart: +a.dataset.mediaStart || 0, on: false
    }));
    clips.forEach((c) => { c.a.preload = "auto"; c.a.load(); });
    return { id };
  }

  /** Show only the timed elements whose window holds time t. */
  function vis(t) {
    for (const el of timed) {
      const s = +el.dataset.start || 0, d = el.dataset.duration ? +el.dataset.duration : Infinity;
      el.style.visibility = (t >= s && t < s + d) ? "" : "hidden";
    }
  }

  function audio(t) {
    for (const c of clips) {
      const inside = playing && !muted && t >= c.start && t < c.start + c.dur;
      if (inside) {
        const local = t - c.start;
        let g = c.vol;
        if (c.fin > 0 && local < c.fin) g *= local / c.fin;
        if (c.fout > 0 && c.dur - local < c.fout) g *= Math.max(0, (c.dur - local) / c.fout);
        c.a.volume = Math.max(0, Math.min(1, g));
        if (!c.on) {
          c.on = true;
          try { c.a.currentTime = c.mstart + local; } catch (e) {}
          const p = c.a.play(); if (p && p.catch) p.catch(() => {});
        }
      } else if (c.on) { c.on = false; try { c.a.pause(); } catch (e) {} }
    }
  }

  function render(t) {
    now = Math.max(0, Math.min(duration, t));
    tl.seek(Math.min(now, tl.duration()), false);
    vis(now);
    audio(now);
  }

  function frame() {
    if (!playing) return;
    const t = from + (performance.now() - t0) / 1000;
    if (t >= duration) {
      render(duration - 1 / 60); playing = false; audio(now);
      post({ ev: "time", t: duration, playing: false }); post({ ev: "done" });
      return;
    }
    render(t);
    if (performance.now() - lastPost > 100) { lastPost = performance.now(); post({ ev: "time", t, playing: true }); }
    raf = requestAnimationFrame(frame);
  }

  function play(at) {
    from = at !== undefined ? at : (now >= duration - .05 ? 0 : now);
    if (at === undefined && now >= duration - .05) from = 0;
    clips.forEach((c) => { c.on = false; try { c.a.pause(); } catch (e) {} });
    t0 = performance.now(); playing = true;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function pause() { playing = false; cancelAnimationFrame(raf); audio(now); post({ ev: "time", t: now, playing: false }); }

  addEventListener("message", (e) => {
    const m = e.data;
    if (!m || !m.awymOutro || !m.cmd || !tl) return;
    if (typeof m.muted === "boolean") { muted = m.muted; if (muted) audio(-1); }
    if (m.cmd === "play") play(m.t === undefined ? 0 : +m.t);
    else if (m.cmd === "resume") play();
    else if (m.cmd === "pause") pause();
    else if (m.cmd === "stop") { pause(); render(duration - 1 / 60); }
    else if (m.cmd === "seek") { pause(); render(+m.t || 0); post({ ev: "time", t: now, playing: false }); }
  });

  addEventListener("load", () => {
    const ok = setup();
    if (!ok) { post({ ev: "error", message: "No composition timeline found" }); return; }
    const start = qs.get("at") !== null ? +qs.get("at") : 0;
    const go = () => {
      render(start);
      post({ ev: "ready", id: ok.id, duration, schema, values });
      if (qs.get("autoplay") === "1") play(start);
    };
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1500))]).then(go);
  });
})();
