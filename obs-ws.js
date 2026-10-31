/**
 * obs-ws.js — a small client for OBS's built-in WebSocket server
 * ==============================================================
 * OBS 28 and newer include "obs-websocket" (Tools → WebSocket Server Settings).
 * It lets a page ask OBS to do things a browser page can't do on its own:
 * save a replay, start recording, switch scenes, play a clip in a media source.
 * Used by show-runner.html (Clips & replays, and rundown scene switching).
 *
 *   const obs = new AWYMObs();
 *   obs.onStatus = (state, text) => {}      "off" | "connecting" | "ready" | "error"
 *   obs.onEvent  = (type, data) => {}       e.g. "ReplayBufferSaved", {savedReplayPath}
 *   await obs.connect("ws://127.0.0.1:4455", "password");
 *   obs.meters(true)                         also get "InputVolumeMeters" (every mic's level, ~20×/s)
 *   const r = await obs.req("GetRecordStatus");   // → responseData, or throws Error(comment)
 *   obs.close();
 *
 * Protocol: obs-websocket 5.x (https://github.com/obsproject/obs-websocket).
 * Login uses SHA-256: secret = b64(sha256(password + salt)),
 * auth = b64(sha256(secret + challenge)). A plain-JS SHA-256 is included in
 * case the browser's crypto.subtle isn't available.
 */
(function () {
  /* ---------- SHA-256 (fallback when crypto.subtle is missing) ---------- */
  function sha256js(bytes) {
    const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
    const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
    m.set(bytes); m[l] = 0x80;
    const bits = l * 8; for (let i = 0; i < 8; i++) m[n - 1 - i] = Math.floor(bits / 2 ** (8 * i)) & 255;
    const w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
    for (let o = 0; o < n; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (m[o + 4 * i] << 24) | (m[o + 4 * i + 1] << 16) | (m[o + 4 * i + 2] << 8) | m[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    const out = new Uint8Array(32); for (let i = 0; i < 8; i++) { out[4 * i] = H[i] >>> 24; out[4 * i + 1] = H[i] >>> 16; out[4 * i + 2] = H[i] >>> 8; out[4 * i + 3] = H[i]; }
    return out;
  }
  /** SHA-256 of a text, as base64. */
  async function sha256b64(text) {
    const bytes = new TextEncoder().encode(text);
    let hash;
    try { hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)); } catch (e) { hash = sha256js(bytes); }
    let s = ""; hash.forEach((b) => s += String.fromCharCode(b));
    return btoa(s);
  }

  // events we listen for: General (1) + Scenes (4) + Inputs (8: mute changes) + Outputs (64) + MediaInputs (256),
  // plus InputVolumeMeters (65536, a high-volume event) when meters(true) is on
  const SUBSCRIBE = 1 | 4 | 8 | 64 | 256, METERS = 65536;

  class AWYMObs {
    constructor() { this.ws = null; this.ready = false; this.n = 0; this.pending = new Map(); this.onStatus = () => {}; this.onEvent = () => {}; this.subs = SUBSCRIBE; }
    /** Turn the audio-level events on or off (takes effect right away when connected). */
    meters(on) {
      const subs = SUBSCRIBE | (on ? METERS : 0);
      if (subs === this.subs) return;
      this.subs = subs;
      if (this.ready && this.ws) try { this.ws.send(JSON.stringify({ op: 3, d: { eventSubscriptions: subs } })); } catch (e) {}
    }
    /** Connect and log in. Resolves when OBS accepts us; rejects with a readable message. */
    connect(url, password) {
      this.close(true);
      return new Promise((resolve, reject) => {
        let settled = false;
        const fail = (msg) => { if (!settled) { settled = true; reject(new Error(msg)); } this.onStatus("error", msg); };
        let ws;
        try { ws = new WebSocket(url); } catch (e) { fail("That address doesn't look right (it should start with ws://)."); return; }
        this.ws = ws; this.onStatus("connecting", "Connecting…");
        const timer = setTimeout(() => { if (!this.ready) { fail("OBS didn't answer. Is its WebSocket server turned on?"); try { ws.close(); } catch (e) {} } }, 6000);
        ws.onmessage = async (ev) => {
          let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
          const d = msg.d || {};
          if (msg.op === 0) {                 // Hello → Identify
            const id = { rpcVersion: 1, eventSubscriptions: this.subs };
            if (d.authentication) {
              if (!password) { fail("OBS wants a password. Type it in and connect again."); ws.close(); return; }
              const secret = await sha256b64(password + d.authentication.salt);
              id.authentication = await sha256b64(secret + d.authentication.challenge);
            }
            ws.send(JSON.stringify({ op: 1, d: id }));
          } else if (msg.op === 2) {          // Identified (again after meters() re-identifies: nothing to do)
            if (this.ready) return;
            clearTimeout(timer); this.ready = true; settled = true;
            this.onStatus("ready", "Connected to OBS"); resolve();
          } else if (msg.op === 5) {          // Event
            try { this.onEvent(d.eventType, d.eventData || {}); } catch (e) {}
          } else if (msg.op === 7) {          // RequestResponse
            const p = this.pending.get(d.requestId); if (!p) return;
            this.pending.delete(d.requestId);
            if (d.requestStatus && d.requestStatus.result) p.resolve(d.responseData || {});
            else p.reject(new Error((d.requestStatus && d.requestStatus.comment) || "OBS said no (" + (d.requestStatus && d.requestStatus.code) + ")"));
          }
        };
        ws.onerror = () => fail("Couldn't reach OBS at " + url + ". Check that the WebSocket server is on and the port is right.");
        ws.onclose = (ev) => {
          clearTimeout(timer);
          const was = this.ready; this.ready = false;
          if (this.ws === ws) this.ws = null;
          this.pending.forEach((p) => p.reject(new Error("Disconnected from OBS."))); this.pending.clear();
          if (ev.code === 4009) fail("Wrong password. Copy it again from OBS → Tools → WebSocket Server Settings → Show Connect Info.");
          else if (!settled) fail("OBS closed the connection.");
          else if (was) this.onStatus("off", "Disconnected from OBS");
        };
      });
    }
    /** Send one request; resolves with OBS's responseData. */
    req(type, data) {
      if (!this.ready || !this.ws) return Promise.reject(new Error("Not connected to OBS."));
      const requestId = "r" + (++this.n);
      return new Promise((resolve, reject) => {
        this.pending.set(requestId, { resolve, reject });
        this.ws.send(JSON.stringify({ op: 6, d: { requestType: type, requestId, requestData: data || {} } }));
        setTimeout(() => { if (this.pending.has(requestId)) { this.pending.delete(requestId); reject(new Error("OBS took too long to answer.")); } }, 8000);
      });
    }
    /** Disconnect (quiet = don't report "off"). */
    close(quiet) {
      if (this.ws) { const ws = this.ws; this.ws = null; this.ready = false; try { ws.onclose = null; ws.close(); } catch (e) {} }
      if (!quiet) this.onStatus("off", "Not connected");
    }
  }
  AWYMObs.sha256b64 = sha256b64;
  window.AWYMObs = AWYMObs;
})();
