import json, subprocess, sys, numpy as np, os, hashlib
import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))   # the kit (this repo)
BUILD = _os.path.join(ROOT, "tools", ".build"); _os.makedirs(BUILD, exist_ok=True)
KIT = sys.argv[1]   # a clone of https://github.com/wyzowl/sfx-kit
OUT = _os.path.join(ROOT, "sounds", "kit")
PICK = {  # our id: (sfx-kit id, target loudest-400ms RMS in dB at the sound board's 80%)
    "applause": ("celebration-applause-big", -19),
    "chaching": ("money-register", -18),
    "ding": ("notification-success-ding-ding", -18),
    "wrong": ("digital-denied", -16),
    "swoosh": ("whoosh-medium-hard", -20.5),
    "boing": ("move-spring", -18),
    "micdrop": ("impact-deep-hard", -15),
}
meta = {s["id"]: s for s in json.load(open(os.path.join(KIT, "sounds.json")))["sounds"]}
def pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)
def loud(d):
    win, hop = 19200, 2400; best = 0
    for s in range(0, max(1, len(d) - win + 1), hop): best = max(best, float(np.sqrt(np.mean(d[s:s+win] ** 2))))
    return 20 * np.log10(best + 1e-9), 20 * np.log10(float(np.max(np.abs(d))) + 1e-9)
credits = []
for ours, (theirs, target) in PICK.items():
    m = meta[theirs]; src = os.path.join(KIT, m["file"])
    assert hashlib.sha256(open(src, "rb").read()).hexdigest() == m["sha256"], "checksum mismatch " + theirs
    r, pk = loud(pcm(src))
    want = target - 20 * np.log10(0.8)            # the board plays at 80% by default
    gain = want - r
    gain = min(gain, -1.0 - pk + 5)                # up to 5 dB into a gentle limiter, peaks held at -1.5 dBFS
    dst = os.path.join(OUT, ours + ".ogg")
    af = f"volume={gain:.2f}dB" + (",alimiter=limit=0.84:attack=2:release=60:level=false" if gain > -1.0 - pk else "")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", af, "-ar", "48000", "-c:a", "libvorbis", "-q:a", "6", dst], check=True)
    r2, pk2 = loud(pcm(dst))
    print(f"{ours:9} ← {theirs:32} {m['duration']:.2f}s  gain {gain:+5.1f} dB → rms400 {r2 + 20*np.log10(0.8):6.1f} dB at 80%, peak {pk2:5.1f} dB, {os.path.getsize(dst)//1024} KB")
    credits.append((ours, theirs, m["description"]))
with open(os.path.join(OUT, "CREDITS.txt"), "w") as f:
    f.write("REAL RECORDED SOUNDS IN THE KIT\n===============================\n")
    f.write("From SFX Kit by Wyzowl (https://github.com/wyzowl/sfx-kit), CC0 1.0 (public\n")
    f.write("domain): free for any use, including streams and YouTube; no credit required.\n")
    f.write("Converted to Ogg Vorbis and levelled to match the rest of the sound board.\n\n")
    for ours, theirs, desc in credits: f.write(f"  {ours + '.ogg':14} {theirs:32} {desc}\n")
