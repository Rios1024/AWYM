"""Build VSD Craft scene files (.SDProfile) for the VSD M18 from the AWYM hotkey list.

Format learned from the user's own export: a zip with
  manifest.json                       first page (Actions + Pages list)
  profiles/<PAGE>.sdProfile/manifest.json   every other page
  Images/<ID>.png                     key pictures, referenced as "<ID>.png"
Keys are "column,row"; the 3 plain buttons are column 5 (rows 0, 1, 2 = left, middle, right).
"""
import json, os, random, re, shutil, string, sys, zipfile

import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))   # the kit (this repo)
BUILD = _os.path.join(ROOT, "tools", ".build"); _os.makedirs(BUILD, exist_ok=True)
KIT = ROOT
OUT = os.path.join(KIT, "stream-controller", "VSD-M18")
SERIAL = ""   # left blank in shared files (VSD Craft fills in your own device)

# id, key, icon file from hotkeys.js order
src = open(os.path.join(KIT, "hotkeys.js"), encoding="utf-8").read()
icons = sorted(f for f in os.listdir(os.path.join(KIT, "icons/hotkeys")) if f.endswith(".png"))
ICON = {re.sub(r"^\d+-|\.png$", "", f): f for f in icons}
assert len(ICON) == 51, len(ICON)
KEYS = {"next": "N", "prev": "P", "clear": "X", "clock-toggle": "S", "clock-reset": "R", "clock-buzz": "Z",
        "clock-foil": "T", "clock-hide": "K", "score-a": "Q", "score-b": "W", "score-show": "E", "winner": "Y",
        "lt-1": "1", "lt-2": "2", "lt-3": "3", "lt-4": "4", "lt-hide": "5", "save-clip": "C", "replay": "V",
        "mark": "M", "hide-stats": "G", "hide-text": "H",
        "fx-fire": "F", "fx-ice": "I", "fx-zap": "L", "fx-smoke": "O", "fx-sparks": "A", "fx-shake": "B", "fx-stop": "U",
        "mute-1": "BRACKETLEFT", "mute-2": "BRACKETRIGHT", "mute-3": "SEMICOLON", "mute-4": "APOSTROPHE", "unmute-all": "BACKSLASH"}
SOUND_KEYS = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "6", "7", "8", "9", "0"]
SOUNDS = ["airhorn", "buzzer", "ding", "wrong", "rimshot", "drumroll", "ooh", "applause", "chaching", "sadtrombone",
          "scratch", "swoosh", "whistle", "gong", "boing", "micdrop", "tinfoil"]
for s, k in zip(SOUNDS, SOUND_KEYS): KEYS["snd-" + s] = k
assert set(KEYS) == set(ICON), set(KEYS) ^ set(ICON)
# cross-check against hotkeys.js / setup script so the deck can't drift from OBS
for i, k in KEYS.items():
    if not i.startswith(("snd-", "lt-", "mute-")) or i == "lt-hide":
        assert re.search(r'id: "%s".*?key: "%s"' % (re.escape(i), re.escape(k)), src), i
lua = open(os.path.join(KIT, "awym-obs-setup.lua"), encoding="utf-8").read()

OEM = {"BRACKETLEFT": 219, "BRACKETRIGHT": 221, "SEMICOLON": 186, "APOSTROPHE": 222, "BACKSLASH": 220}
def vk(k):  # Windows virtual-key code (the sample stores N as 78)
    if k in OEM: return OEM[k]
    if re.fullmatch(r"F\d+", k): return 111 + int(k[1:])
    return ord(k)

SCOREBOARD = ["score-a", "score-b", "score-show", "winner", "snd-micdrop",
              "lt-1", "lt-2", "lt-3", "lt-4", "lt-hide",
              "snd-ding", "snd-wrong", "snd-buzzer", "snd-ooh", "snd-applause"]
FRAME_FX = ["fx-fire", "fx-ice", "fx-zap", "fx-smoke", "fx-sparks",
            "fx-shake", "fx-stop", None, None, None,
            None, None, None, None, None]
# AWYM Show = the user's own paginated layout (pages 1–4) plus Frame FX (page 5) (their export, 2026-10-29). None = empty key.
PAGES = [  # (name, 15 keys top row first, left→right)
    ("Show", ["next", "prev", "clock-toggle", "clock-reset", "clear",
              "score-a", "score-b", "score-show", "winner", "replay",
              "mute-1", "mute-2", "mute-3", "mute-4", "unmute-all"]),
    ("Sound board", ["snd-" + s for s in SOUNDS[:15]]),
    ("Scoreboard", SCOREBOARD),
    ("Clock & clips", ["lt-hide", "clock-hide", "clock-buzz", "hide-stats", "hide-text",
                       "clock-toggle", "clock-reset", None, "snd-tinfoil", "clock-foil",
                       "save-clip", "replay", "mark", None, None]),
    ("Frame FX", FRAME_FX),
]
BUTTONS = ["page-prev", "clear", "page-next"]  # left, middle, right on every page
covered = {i for _, ks in PAGES for i in ks if i}
assert covered == set(ICON), set(ICON) - covered

def build(top_row, name, fname, seed, PAGES=PAGES, BUTTONS=BUTTONS):
    rnd = random.Random(seed)
    up = string.ascii_uppercase + string.digits
    lo = string.ascii_lowercase + string.digits
    rid = lambda alpha, parts: "-".join("".join(rnd.choice(alpha) for _ in range(n)) for n in parts)
    page_ids = [rid(up, (8, 4, 4, 4, 12)) + ".sdProfile" for _ in PAGES]
    img_id = {}  # (page number, action) -> picture file name; each page keeps its own pictures
    def pic(pg, i):
        if (pg, i) not in img_id: img_id[(pg, i)] = rid(up, (27,)) + ".png"
        return img_id[(pg, i)]

    def hotkey(i, pg):
        blank = {"KeyCmd": False, "KeyCtrl": False, "KeyModifiers": 65536, "KeyOption": False, "KeyShift": False,
                 "NativeCode": -1, "QTKeyCode": -1, "RKeyCmd": False, "RKeyCtrl": False, "RKeyOption": False,
                 "RKeyShift": False, "VKeyCode": -1, "VKeyCodes": []}
        k = vk(KEYS[i])
        first = dict(blank, KeyCtrl=True, KeyOption=True, KeyShift=True, VKeyCode=k, VKeyCodes=[k])
        return {"ActionID": rid(lo, (8, 4, 4, 4, 12)), "Controller": "Keypad", "Name": "Hotkey",
                "Settings": {"Coalesce": True, "Hotkeys": [first, dict(blank), dict(blank)], "hotkeyRadioButtonIndex": 0},
                "SoftwareSettings": {}, "State": 0, "States": [{"Image": pic(pg, i)}],
                "UUID": "com.hotspot.streamdock.system.hotkey"}

    def page_btn(which):
        return {"ActionID": rid(lo, (8, 4, 4, 4, 12)), "Controller": "Keypad",
                "Name": "Previous page" if which == "prev" else "Next page", "Settings": {}, "SoftwareSettings": {},
                "State": 0, "States": [{"Image": "Images/btn_previousPage" if which == "prev" else "Images/btn_nextPage"}],
                "UUID": "com.hotspot.streamdock.page." + ("previous" if which == "prev" else "next")}

    def actions(keys, pg):
        a = {}
        for n, i in enumerate(keys):
            if not i: continue
            col, r = n % 5, n // 5
            row = r if top_row == 0 else 2 - r
            a[f"{col},{row}"] = hotkey(i, pg)
        for row, b in enumerate(BUTTONS):
            a[f"5,{row}"] = page_btn(b[5:]) if b.startswith("page-") else hotkey(b, pg)
        return a

    files = {}
    first = {"Actions": actions(PAGES[0][1], 0), "AppIdentifier": "", "AppIdentifier0": "", "AppIdentifier1": "",
             "AppIdentifier2": "", "DeviceModel": "20GBA9901", "DeviceSerialNumber": SERIAL, "DeviceUUID": "VSDM18",
             "Name": name, "Pages": {"Current": page_ids[0], "Pages": page_ids}, "Version": "1.0"}
    files["manifest.json"] = first
    for pg, (pid, (_, keys)) in enumerate(zip(page_ids[1:], PAGES[1:]), 1):
        files[f"profiles/{pid}/manifest.json"] = {"Actions": actions(keys, pg), "DeviceModel": "20GBA9901",
                                                  "DeviceUUID": "VSDM18", "Name": "", "Version": "1.0"}
    path = os.path.join(OUT, fname)
    if os.path.exists(path): os.remove(path)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        # like VSD Craft's own export: page 1's pictures in Images/, every other page's in its own folder
        z.writestr("Images/", "")
        for (pg, i), name_ in sorted(img_id.items(), key=lambda kv: kv[0][0]):
            if pg == 0: z.write(os.path.join(KIT, "icons/hotkeys", ICON[i]), "Images/" + name_)
        z.writestr("profiles/", "")
        for pg, p in enumerate(page_ids[1:], 1):
            z.writestr(f"profiles/{p}/", "")
            z.writestr(f"profiles/{p}/Images/", "")
            for (q, i), name_ in sorted(img_id.items(), key=lambda kv: kv[0][0]):
                if q == pg: z.write(os.path.join(KIT, "icons/hotkeys", ICON[i]), f"profiles/{p}/Images/" + name_)
        for n, d in files.items():
            z.writestr(n, json.dumps(d, indent=4, ensure_ascii=False))
    return path

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith(".SDProfile"): os.remove(os.path.join(OUT, f))
SEG = ["prev", "clear", "next"]  # plain buttons on the one-page scenes: prev segment, clear, next segment
SCENES = [
    ("AWYM Show", "AWYM-Show.SDProfile", PAGES, BUTTONS),
    ("AWYM Run of Show", "AWYM-Run-of-Show.SDProfile", [("Run of show", [
        "prev", "next", "clear", "hide-stats", "hide-text",
        "clock-toggle", "clock-reset", "clock-buzz", "clock-hide", "clock-foil",
        "save-clip", "replay", "mark", "lt-hide", "snd-tinfoil"])], SEG),
    ("AWYM Scoreboard", "AWYM-Scoreboard.SDProfile", [("Scoreboard", SCOREBOARD)], SEG),
    ("AWYM Frame FX", "AWYM-Frame-FX.SDProfile", [("Frame FX", FRAME_FX)], SEG),
    ("AWYM Sound Board", "AWYM-Sound-Board.SDProfile", [("Sound board", [
        "snd-airhorn", "snd-buzzer", "snd-ding", "snd-wrong", "snd-rimshot",
        "snd-drumroll", "snd-ooh", "snd-applause", "snd-chaching", "snd-sadtrombone",
        "snd-scratch", "snd-swoosh", "snd-whistle", "snd-gong", "snd-boing"])], SEG),
]
for n, (name, fname, pages, btns) in enumerate(SCENES):
    assert all(len(k) == 15 for _, k in pages), name
    assert all(i in ICON for _, k in pages for i in [x for x in k if x] + [b for b in btns if not b.startswith("page-")])
    print(build(2, name, fname, 5150 + n * 97, pages, btns))

# the AWYM Show layout, for START-HERE's previews (make_elgato.py puts it in layouts.js)
json.dump({"name": "VSD M18 (VSD Craft)", "file": "VSD-M18/AWYM-Show.SDProfile", "cols": 5, "rows": 3,
           "buttons": ["@prev", "clear", "@next"],
           "extra": [{"name": n, "file": "VSD-M18/" + f} for n, f, _, _ in SCENES[1:]],
           "pages": [{"name": n, "keys": k} for n, k in PAGES]},
          open(os.path.join(BUILD, "m18_layout.json"), "w"))
