/**
 * sfx.js — the sound board's built-in sound effects
 * ==================================================
 * Each sound plays the first of these that exists:
 *   1. YOUR FILE:   sounds/<id>.mp3 (or .ogg .wav .m4a .webm), e.g. sounds/airhorn.mp3
 *   2. RECORDING:   sounds/kit/<id>.ogg, real recordings that come with the kit
 *                   (CC0, see sounds/kit/CREDITS.txt): applause, cha-ching, correct,
 *                   wrong, swoosh, boing, mic drop
 *   3. SYNTHESIZED: made in code with the Web Audio API (every sound has one)
 * Used by sfx.html (the invisible OBS audio source that really plays them, so OBS
 * captures the sound) and by show-runner.html (to preview a sound in the dock).
 *
 * window.AWYM_SFX:
 *   list                     [{id, name, icon}] in sound-board order
 *   ready                    Promise, resolves once the sound files have been looked for
 *   source(id)               "yours" | "recording" | "synth": what play(id) will use
 *   play(id, volume = 0.8)   play one now; returns its length in seconds
 *   playBuffer(buf, volume)  play a decoded AudioBuffer (custom sounds)
 *   decode(dataURL)          → Promise<AudioBuffer>  (custom sounds)
 *   stop()                   cut every sound that's playing (files too)
 *   ctx()                    the shared AudioContext
 *
 * To add a sound: add {id, name, icon} to LIST and a function with the same id
 * to SOUNDS. It receives (ctx, out, t) — out is a gain node to connect to,
 * t the start time — and returns the sound's length in seconds.
 */
(function () {
  let ac = null, master = null;
  /** The shared AudioContext (created on first use) and a master bus that stop() can cut. */
  function ctx() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    if (!master) { master = ac.createGain(); master.connect(ac.destination); }
    return ac;
  }

  /* ---------- building blocks ---------- */
  let noiseBuf = null;
  /** Two seconds of white noise, made once and reused. */
  function noise(c) {
    if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  /** A gain node with an attack/hold/release envelope, connected to out. */
  function env(c, out, t, peak, attack, hold, release) {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    g.connect(out);
    return g;
  }
  /** An oscillator from t for dur seconds, into node. */
  function osc(c, node, type, freq, t, dur, detune = 0) {
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    o.connect(node); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  /** A burst of filtered noise. */
  function hiss(c, node, t, dur, type = "bandpass", freq = 2000, q = 1) {
    const s = c.createBufferSource(); s.buffer = noise(c); s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    s.connect(f).connect(node); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return { src: s, filter: f };
  }
  /** Soft clipping, for a meaner sound (air horn). */
  function drive(c, amount) {
    const ws = c.createWaveShaper(), n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(x * amount); }
    ws.curve = curve; return ws;
  }
  /** A struck bell: a few sine partials with a long fade. */
  function bell(c, out, t, f, peak = 0.35, len = 1.6) {
    [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]].forEach(([k, a]) => osc(c, env(c, out, t, peak * a, 0.004, 0, len / k ** 0.3), "sine", f * k, t, len));
  }

  /* ---------- the sounds ---------- */
  const SOUNDS = {
    airhorn(c, out, t) {
      const dist = drive(c, 3), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
      dist.connect(lp).connect(out);
      [[0, 0.16], [0.22, 0.16], [0.44, 0.95]].forEach(([at, len]) => {
        const g = env(c, dist, t + at, 0.32, 0.015, len, 0.09);
        [466, 470, 587, 591, 698].forEach((f, i) => { const o = osc(c, g, "sawtooth", f, t + at, len + 0.12, i * 3); o.frequency.exponentialRampToValueAtTime(f * 0.97, t + at + len); });
      });
      return 1.6;
    },
    buzzer(c, out, t) {
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400; lp.connect(out);
      const g = env(c, lp, t, 0.35, 0.03, 1.1, 0.15);
      [[196, "sawtooth", 0.6], [247, "square", 0.25], [98, "sawtooth", 0.4]].forEach(([f, type, a]) => { const gg = c.createGain(); gg.gain.value = a; gg.connect(g); osc(c, gg, type, f, t, 1.3); });
      return 1.35;
    },
    ding(c, out, t) { bell(c, out, t, 1318.5, 0.3, 1.2); bell(c, out, t + 0.14, 1760, 0.3, 1.6); return 1.9; },
    wrong(c, out, t) {
      [0, 0.28].forEach((at, i) => { const g = env(c, out, t + at, 0.22, 0.01, i ? 0.42 : 0.16, 0.05); osc(c, g, "square", 155, t + at, 0.6); osc(c, g, "square", 147, t + at, 0.6); });
      return 0.85;
    },
    rimshot(c, out, t) {
      const tom = (at, f) => { const g = env(c, out, t + at, 0.6, 0.003, 0.02, 0.28); const o = osc(c, g, "sine", f, t + at, 0.35); o.frequency.exponentialRampToValueAtTime(f * 0.45, t + at + 0.3); hiss(c, env(c, out, t + at, 0.12, 0.002, 0, 0.08), t + at, 0.1, "highpass", 1500); };
      tom(0, 210); tom(0.22, 150);
      hiss(c, env(c, out, t + 0.5, 0.28, 0.003, 0.05, 1.3), t + 0.5, 1.5, "highpass", 6000, 0.7);
      return 2;
    },
    drumroll(c, out, t) {
      const len = 2.4;
      for (let i = 0; i < len * 26; i++) {
        const at = t + i / 26 + Math.random() * 0.006, k = i / (len * 26);
        hiss(c, env(c, out, at, 0.05 + 0.25 * k * k, 0.002, 0.005, 0.05), at, 0.07, "bandpass", 1800, 0.8);
      }
      const crash = t + len + 0.02;
      hiss(c, env(c, out, crash, 0.35, 0.003, 0.05, 1.8), crash, 2, "highpass", 5000, 0.6);
      const g = env(c, out, crash, 0.5, 0.003, 0.02, 0.4); const o = osc(c, g, "sine", 120, crash, 0.5); o.frequency.exponentialRampToValueAtTime(50, crash + 0.4);
      return len + 2;
    },
    scratch(c, out, t) {
      const g = env(c, out, t, 0.5, 0.01, 0.4, 0.1);
      const h = hiss(c, g, t, 0.55, "bandpass", 900, 4);
      [[0, 400], [0.12, 2600], [0.24, 500], [0.36, 3000], [0.5, 300]].forEach(([at, f]) => h.filter.frequency.exponentialRampToValueAtTime(f, t + at + 0.01));
      return 0.65;
    },
    swoosh(c, out, t) {
      const g = env(c, out, t, 0.45, 0.25, 0, 0.35);
      const h = hiss(c, g, t, 0.65, "bandpass", 300, 2.5);
      h.filter.frequency.exponentialRampToValueAtTime(3500, t + 0.3); h.filter.frequency.exponentialRampToValueAtTime(800, t + 0.6);
      return 0.7;
    },
    applause(c, out, t) {
      const len = 3.4, bus = c.createGain(); bus.connect(out);
      bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(1, t + 0.4); bus.gain.setValueAtTime(1, t + len - 1.2); bus.gain.exponentialRampToValueAtTime(0.0001, t + len);
      for (let i = 0; i < len * 70; i++) {
        const at = t + Math.random() * len;
        hiss(c, env(c, bus, at, 0.06 + Math.random() * 0.08, 0.001, 0.003, 0.03 + Math.random() * 0.03), at, 0.07, "bandpass", 900 + Math.random() * 2200, 1.2);
      }
      hiss(c, env(c, bus, t, 0.05, 0.4, len - 1.6, 1.2), t, len, "bandpass", 1500, 0.5);   // the "wash" under the claps
      return len;
    },
    ooh(c, out, t) {
      // a crowd going "ooooh": several voices through "oo" formants, sliding down together
      const len = 1.9, f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), mix = c.createGain();
      f1.type = f2.type = "bandpass"; f1.frequency.value = 330; f2.frequency.value = 820; f1.Q.value = 5; f2.Q.value = 6;
      const g = env(c, mix, t, 0.9, 0.25, len - 0.85, 0.6);
      mix.connect(out); f1.connect(g); f2.connect(g);
      for (let v = 0; v < 10; v++) {
        const base = 150 + Math.random() * 130, start = t + Math.random() * 0.12;
        const vg = c.createGain(); vg.gain.value = 0.22; vg.connect(f1); vg.connect(f2);
        const o = osc(c, vg, "sawtooth", base * 1.08, start, len);
        o.frequency.linearRampToValueAtTime(base * 1.12, start + 0.4); o.frequency.exponentialRampToValueAtTime(base * 0.86, start + len);
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5 + Math.random() * 2; lg.gain.value = base * 0.012;
        lfo.connect(lg).connect(o.frequency); lfo.start(start); lfo.stop(start + len + 0.05);
      }
      return len + 0.1;
    },
    gong(c, out, t) {
      [[110, 0.4], [153, 0.3], [217, 0.22], [274, 0.18], [356, 0.12], [512, 0.08]].forEach(([f, a], i) => {
        const g = env(c, out, t, a, 0.01, 0, 4 - i * 0.3); const o = osc(c, g, "sine", f, t, 4.2);
        o.frequency.setValueAtTime(f * 1.01, t); o.frequency.exponentialRampToValueAtTime(f, t + 1.5);
      });
      hiss(c, env(c, out, t, 0.08, 0.005, 0, 1.2), t, 1.3, "bandpass", 700, 1);
      return 4.3;
    },
    chaching(c, out, t) {
      for (let i = 0; i < 6; i++) { const at = t + i * 0.035; hiss(c, env(c, out, at, 0.18, 0.002, 0.01, 0.05), at, 0.08, "bandpass", 3500 + i * 300, 3); }  // drawer rattle
      bell(c, out, t + 0.22, 2093, 0.28, 1.0); bell(c, out, t + 0.33, 2637, 0.32, 1.5);
      return 1.9;
    },
    sadtrombone(c, out, t) {
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 6; lp.connect(out);
      [[293.7, 0, 0.42], [277.2, 0.48, 0.42], [261.6, 0.96, 0.42], [246.9, 1.44, 1.3]].forEach(([f, at, len], i) => {
        const g = env(c, lp, t + at, 0.3, 0.04, len - 0.12, 0.12);
        const o = osc(c, g, "sawtooth", f, t + at, len);
        lp.frequency.setValueAtTime(300, t + at); lp.frequency.exponentialRampToValueAtTime(1500, t + at + 0.12); lp.frequency.exponentialRampToValueAtTime(500, t + at + len);
        if (i === 3) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 7; lfo.connect(lg).connect(o.frequency); lfo.start(t + at + 0.2); lfo.stop(t + at + len); }
      });
      return 2.9;
    },
    whistle(c, out, t) {
      const len = 0.9, g = env(c, out, t, 0.18, 0.02, len - 0.12, 0.08);
      const o = osc(c, g, "sine", 2850, t, len);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.type = "square"; lfo.frequency.value = 32; lg.gain.value = 180;
      lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + len);
      hiss(c, env(c, out, t, 0.05, 0.02, len - 0.12, 0.08), t, len, "bandpass", 2900, 3);
      return len + 0.1;
    },
    boing(c, out, t) {
      const g = env(c, out, t, 0.35, 0.005, 0.1, 0.6);
      const o = osc(c, g, "triangle", 180, t, 0.75);
      o.frequency.exponentialRampToValueAtTime(520, t + 0.08); o.frequency.exponentialRampToValueAtTime(260, t + 0.7);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 16; lg.gain.setValueAtTime(90, t); lg.gain.exponentialRampToValueAtTime(5, t + 0.7);
      lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + 0.75);
      return 0.8;
    },
    micdrop(c, out, t) {
      const g = env(c, out, t, 0.9, 0.002, 0.03, 0.5); const o = osc(c, g, "sine", 95, t, 0.6); o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
      hiss(c, env(c, out, t, 0.35, 0.002, 0.01, 0.25), t, 0.3, "lowpass", 900, 0.7);
      [0.18, 0.31].forEach((at, i) => hiss(c, env(c, out, t + at, 0.12 / (i + 1), 0.002, 0.01, 0.12), t + at, 0.15, "lowpass", 700, 0.7));  // bounce
      const fb = env(c, out, t + 0.35, 0.05, 0.4, 0.5, 0.6); osc(c, fb, "sine", 2960, t + 0.35, 1.6);   // a little feedback whine
      return 2;
    },
    tinfoil(c, out, t) {
      const dur = 2.6, g = env(c, out, t, 0.22, 0.25, dur - 0.75, 0.5);
      const o = osc(c, g, "sine", 520, t, dur);
      o.frequency.exponentialRampToValueAtTime(980, t + 0.7); o.frequency.exponentialRampToValueAtTime(620, t + 1.4); o.frequency.exponentialRampToValueAtTime(1180, t + 2.2);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6.5; lg.gain.value = 22; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
      return dur;
    }
  };

  /* Sound-board order. icon = what's on the button. */
  const LIST = [
    { id: "airhorn", name: "Air horn", icon: "📯" },
    { id: "buzzer", name: "Buzzer", icon: "🚨" },
    { id: "ding", name: "Correct", icon: "✅" },
    { id: "wrong", name: "Wrong", icon: "❌" },
    { id: "rimshot", name: "Rimshot", icon: "😆" },
    { id: "drumroll", name: "Drumroll", icon: "🥁" },
    { id: "ooh", name: "Crowd ooh", icon: "😮" },
    { id: "applause", name: "Applause", icon: "👏" },
    { id: "chaching", name: "Cha-ching", icon: "💰" },
    { id: "sadtrombone", name: "Sad trombone", icon: "📉" },
    { id: "scratch", name: "Record scratch", icon: "💿" },
    { id: "swoosh", name: "Swoosh", icon: "💨" },
    { id: "whistle", name: "Whistle", icon: "🏁" },
    { id: "gong", name: "Gong", icon: "🔔" },
    { id: "boing", name: "Boing", icon: "🌀" },
    { id: "micdrop", name: "Mic drop", icon: "🎤" },
    { id: "tinfoil", name: "Tin Foil", icon: "🛸" }
  ];

  /* ---------- sound files (your own, then the kit's recordings) ----------
     Played with <audio> elements: they load from file:/// addresses, which fetch() can't. */
  const KIT_FILES = ["applause", "chaching", "ding", "wrong", "swoosh", "boing", "micdrop"];
  const EXTS = ["mp3", "ogg", "wav", "m4a", "webm"];
  const here = ((document.currentScript && document.currentScript.src) || location.href).replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  const files = {};            // id → { url, el (loaded <audio>), from: "yours" | "recording" }
  const live = new Set();      // <audio> elements playing now
  /** Does this sound file exist and play? Resolves with a loaded <audio>, or null. */
  function probe(url) {
    return new Promise((res) => {
      if (typeof Audio === "undefined") return res(null);
      const a = new Audio(); let done = false;
      const end = (v) => { if (!done) { done = true; a.oncanplaythrough = a.onloadeddata = a.onerror = null; res(v); } };
      a.preload = "auto"; a.oncanplaythrough = a.onloadeddata = () => end(a); a.onerror = () => end(null);
      setTimeout(() => end(null), 5000);
      a.src = url;
    });
  }
  async function findFile(id) {
    for (const ext of EXTS) { const url = here + "sounds/" + id + "." + ext, el = await probe(url); if (el) return { url, el, from: "yours" }; }
    if (KIT_FILES.includes(id)) { const url = here + "sounds/kit/" + id + ".ogg", el = await probe(url); if (el) return { url, el, from: "recording" }; }
    return null;
  }
  const ready = Promise.all(Object.keys(SOUNDS).map((id) => findFile(id).then((f) => { if (f) files[id] = f; }).catch(() => {})));
  let looked = false; ready.then(() => { looked = true; });
  /** Play a sound file at a volume (0–1). */
  function playFile(f, volume) {
    const a = f.el.cloneNode(); a.volume = Math.max(0, Math.min(1, volume));
    live.add(a); a.onended = a.onerror = () => live.delete(a);
    const p = a.play(); if (p && p.catch) p.catch(() => live.delete(a));
    return isFinite(f.el.duration) ? f.el.duration : 0;
  }

  /** Play a sound: your file, else the kit's recording, else the synthesized one.
   *  @returns {number} length in seconds (0 if unknown) */
  function play(id, volume = 0.8) {
    if (!looked && SOUNDS[id]) { ready.then(() => play(id, volume)); return 0; }   // first second after loading
    if (files[id]) return playFile(files[id], volume);
    return synth(id, volume);
  }
  /** Play the synthesized version of a sound. */
  function synth(id, volume = 0.8) {
    const fn = SOUNDS[id]; if (!fn) return 0;
    const c = ctx(), out = c.createGain();
    out.gain.value = Math.max(0, Math.min(1.5, volume)); out.connect(master);
    return fn(c, out, c.currentTime + 0.02);
  }
  /** Play a decoded custom sound. */
  function playBuffer(buf, volume = 0.8) {
    const c = ctx(), s = c.createBufferSource(), g = c.createGain();
    g.gain.value = Math.max(0, Math.min(1.5, volume)); s.buffer = buf; s.connect(g).connect(master); s.start();
    return buf.duration;
  }
  /** A data: address (from a chosen sound file) → AudioBuffer. */
  async function decode(dataURL) {
    const bytes = await (await fetch(dataURL)).arrayBuffer();
    return await new Promise((res, rej) => ctx().decodeAudioData(bytes, res, rej));
  }
  /** Cut every sound that's playing (the 🚨 Clear button and the board's Stop). */
  function stop() {
    for (const a of live) { try { a.pause(); } catch (e) {} } live.clear();
    if (!ac || !master) return;
    master.disconnect(); master = ac.createGain(); master.connect(ac.destination);
  }
  window.AWYM_SFX = { list: LIST, play, synth, playBuffer, decode, stop, ctx, ready, has: (id) => !!SOUNDS[id],
    source: (id) => files[id] ? files[id].from : "synth" };
})();
