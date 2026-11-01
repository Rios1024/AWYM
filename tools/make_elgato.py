"""Elgato Stream Deck profiles (.streamDeckProfile, format V3, Stream Deck app 7.3+) for the AWYM hotkeys.

Format follows jlgabriel/streamdeck-profile-generator (V3, tested by its author on Stream Deck 7.3)
plus key pictures as documented in graham42's streamdeck-editor notes:
  package.json
  Profiles/<UUID>.sdProfile/manifest.json                 Device, Name, Pages {Current, Default, Pages}
  Profiles/<UUID>.sdProfile/Profiles/<PAGE>/manifest.json  Controllers[{Type: Keypad, Actions{"col,row"}}]
  Profiles/<UUID>.sdProfile/Profiles/<PAGE>/Images/<id>.png  288 x 288, referenced as "Images/<id>.png"
The default page is an empty landing page; the content pages are listed in Pages.Pages.
Also writes stream-controller/layouts.js (every model's layout, for START-HERE's previews).
"""
import json, os, random, subprocess, sys, uuid, zipfile

import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))   # the kit (this repo)
BUILD = _os.path.join(ROOT, "tools", ".build"); _os.makedirs(BUILD, exist_ok=True)
KIT = ROOT
OUT = os.path.join(KIT, "stream-controller", "Elgato-Stream-Deck")
ICONS = os.path.join(KIT, "icons", "hotkeys")   # 144 x 144: twice a standard key

H = json.loads(subprocess.run(["node", "-e", "global.window={}; require(%s); require(%s); console.log(JSON.stringify(window.AWYM_HOTKEYS))" % (json.dumps(os.path.join(KIT, "avatars", "avatars.js")), json.dumps(os.path.join(KIT, "hotkeys.js")))],
                              capture_output=True, text=True, check=True).stdout)
BY = {h["id"]: h for h in H}
FILE = {h["id"]: "%02d-%s.png" % (i + 1, h["id"]) for i, h in enumerate(H)}
assert len(H) == 73

VK = {**{c: ord(c) for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"}, **{"F%d" % n: 111 + n for n in range(1, 25)},
      "BRACKETLEFT": 219, "BRACKETRIGHT": 221, "SEMICOLON": 186, "APOSTROPHE": 222, "BACKSLASH": 220, "COMMA": 188, "PERIOD": 190, "SLASH": 191,
      "MINUS": 189, "EQUAL": 187, "QUOTELEFT": 192, "INSERT": 45, "HOME": 36, "END": 35, "PAGEUP": 33}
QT = {**{c: ord(c) for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"}, **{"F%d" % n: 16777263 + n for n in range(1, 25)},
      "BRACKETLEFT": 91, "BRACKETRIGHT": 93, "SEMICOLON": 59, "APOSTROPHE": 39, "BACKSLASH": 92, "COMMA": 44, "PERIOD": 46, "SLASH": 47,
      "MINUS": 45, "EQUAL": 61, "QUOTELEFT": 96, "INSERT": 16777222, "HOME": 16777232, "END": 16777233, "PAGEUP": 16777238}   # Qt key = the character

SECTIONS = [
    ("Run of show", ["next", "prev", "clear", "mark"]),
    ("Shot clock", ["clock-toggle", "clock-reset", "clock-buzz", "clock-hide", "clock-foil"]),
    ("Scoreboard", ["score-a", "score-b", "score-show", "winner"]),
    ("Sound board", [h["id"] for h in H if h["group"] == "sound"]),
    ("Names", ["lt-1", "lt-2", "lt-3", "lt-4", "lt-hide"]),
    ("Frame FX", [h["id"] for h in H if h["group"] == "fx" and not h.get("verdict")]),
    ("Verdicts", [h["id"] for h in H if h.get("verdict")]),
    ("Clips & graphics", ["save-clip", "replay", "hide-stats", "hide-text"]),
    ("Mute", ["mute-1", "mute-2", "mute-3", "mute-4", "unmute-all"]),
    ("Faces", [h["id"] for h in H if h["group"] == "face"]),
]
assert sorted(i for _, s in SECTIONS for i in s) == sorted(BY), set(BY) ^ {i for _, s in SECTIONS for i in s}

MODELS = [  # key, file, name, model id, cols, rows, page keys on the deck?
    ("sd15", "AWYM-Stream-Deck-15-key.streamDeckProfile", "Stream Deck (15 keys: MK.2, original, Scissor Keys)", "20GAA9901", 5, 3, True),
    ("xl", "AWYM-Stream-Deck-XL.streamDeckProfile", "Stream Deck XL (32 keys)", "20GAT9902", 8, 4, True),
    ("mini", "AWYM-Stream-Deck-Mini.streamDeckProfile", "Stream Deck Mini (6 keys)", "20GAI9901", 3, 2, True),
    ("neo", "AWYM-Stream-Deck-Neo.streamDeckProfile", "Stream Deck Neo (8 keys; its touch points change pages)", "20GBJ9901", 4, 2, False),
    ("plus", "AWYM-Stream-Deck-Plus.streamDeckProfile", "Stream Deck + (8 keys)", "20GBD9901", 4, 2, True),
]

MUTE = ["mute-1", "mute-2", "mute-3", "mute-4", "unmute-all"]   # page 1's bottom row (as many as fit)

def pack(caps, sections):
    """Pages of action ids, by category: a section goes on a page only whole (big ones start a page and run on).
    caps(i) = how many actions page i holds."""
    todo = [(n, list(s)) for n, s in sections]
    pages = []
    while todo:
        page, names, cap = [], [], caps(len(pages))
        for sec in list(todo):
            n, items = sec
            free = cap - len(page)
            if free <= 0: break
            if len(items) <= free:
                page += items; names.append(n); todo.remove(sec)
            elif len(items) > cap and (not page or free >= 3):   # bigger than a page: fill what's left, the rest carries on
                page += items[:free]; names.append(n); sec[1][:] = items[free:]
        pages.append((" · ".join(dict.fromkeys(names)), page))
    return pages

def layout(cols, rows, navkeys):
    slots = [(c, r) for r in range(rows) for c in range(cols)]
    prev, nxt = (0, rows - 1), (cols - 1, rows - 1)
    # page 1: no "previous page" key; its bottom row starts with the mute keys
    bottom1 = [s for s in slots if s[1] == rows - 1 and not (navkeys and s == nxt)]
    pinned = MUTE[:len(bottom1)]
    rest = [i for i in MUTE if i not in pinned]
    sections = [(n, [i for i in s if i not in MUTE]) for n, s in SECTIONS]
    sections = [(n, s) for n, s in sections if s]
    if rest: sections.append(("Mute", rest))   # the mute keys that didn't fit on page 1
    free1 = [s for s in slots if s not in bottom1[:len(pinned)] and not (navkeys and s == nxt)]
    freeN = [s for s in slots if not (navkeys and s in (prev, nxt))]
    pages = pack(lambda i: len(free1) if i == 0 else len(freeN), sections)
    out = []
    for n, (name, ids) in enumerate(pages):
        grid = {}
        if n == 0:
            for pos, i in zip(bottom1, pinned): grid[pos] = i
            for pos, i in zip(free1, ids): grid[pos] = i
            if navkeys and len(pages) > 1: grid[nxt] = "@next"
            name = name + ("" if "Mute" in name else " · Mute")
        else:
            for pos, i in zip(freeN, ids): grid[pos] = i
            if navkeys: grid[prev] = "@prev"; grid[nxt] = "@next"
        out.append({"name": name, "keys": [grid.get(s) for s in slots]})
    return out

def hotkey_settings(k):
    first = {"KeyCmd": False, "KeyCtrl": True, "KeyModifiers": 7, "KeyOption": True, "KeyShift": True,
             "NativeCode": VK[k], "QTKeyCode": QT[k], "VKeyCode": VK[k]}
    blank = {"KeyCmd": False, "KeyCtrl": False, "KeyModifiers": 0, "KeyOption": False, "KeyShift": False,
             "NativeCode": 146, "QTKeyCode": 33554431, "VKeyCode": -1}
    return {"Coalesce": True, "Hotkeys": [first, dict(blank), dict(blank), dict(blank)]}

def build(key, fname, title, model, cols, rows, navkeys, seed):
    rnd = random.Random(seed)
    U = lambda: str(uuid.UUID(int=rnd.getrandbits(128), version=4))
    pages = layout(cols, rows, navkeys)
    root = "Profiles/%s.sdProfile" % U().upper()
    default = U().upper()
    page_ids = [U().upper() for _ in pages]
    files = {}
    files["package.json"] = {"AppVersion": "7.3.1.22604", "DeviceModel": model, "DeviceSettings": None, "FormatVersion": 1,
                             "OSType": "Windows", "OSVersion": "10.0.22631",
                             "RequiredPlugins": ["com.elgato.streamdeck.page", "com.elgato.streamdeck.system.hotkey"]}
    files[root + "/manifest.json"] = {"Device": {"Model": model, "UUID": ""}, "Name": "AWYM Show",
                                      "Pages": {"Current": "00000000-0000-0000-0000-000000000000", "Default": default, "Pages": page_ids},
                                      "Version": "3.0"}
    files[root + "/Profiles/%s/manifest.json" % default] = {"Controllers": [{"Actions": None, "Type": "Keypad"}], "Icon": "", "Name": ""}
    images = []
    for pid, pg in zip(page_ids, pages):
        acts = {}
        for idx, k in enumerate(pg["keys"]):
            if not k: continue
            pos = "%d,%d" % (idx % cols, idx // cols)
            if k in ("@prev", "@next"):
                nxt = k == "@next"
                acts[pos] = {"ActionID": U(), "LinkedTitle": True, "Name": "Next Page" if nxt else "Previous Page",
                             "Plugin": {"Name": "Pages", "UUID": "com.elgato.streamdeck.page", "Version": "1.0"},
                             "Resources": None, "Settings": {}, "State": 0, "States": [{}],
                             "UUID": "com.elgato.streamdeck.page." + ("next" if nxt else "previous")}
            else:
                acts[pos] = {"ActionID": U(), "LinkedTitle": True, "Name": "Hotkey",
                             "Plugin": {"Name": "Activate a Key Command", "UUID": "com.elgato.streamdeck.system.hotkey", "Version": "1.0"},
                             "Resources": None, "Settings": hotkey_settings(BY[k]["key"]), "State": 0,
                             "States": [{"Image": "Images/%s.png" % k, "ShowTitle": False, "Title": ""}],
                             "UUID": "com.elgato.streamdeck.system.hotkey"}
                images.append((root + "/Profiles/%s/Images/%s.png" % (pid, k), os.path.join(ICONS, FILE[k])))
        files[root + "/Profiles/%s/manifest.json" % pid] = {"Controllers": [{"Actions": acts, "Type": "Keypad"}], "Icon": "", "Name": pg["name"]}
    path = os.path.join(OUT, fname)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for n, d in files.items(): z.writestr(n, json.dumps(d, indent=2, ensure_ascii=False))
        for arc, src in images: z.write(src, arc)
    return pages, path

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith(".streamDeckProfile"): os.remove(os.path.join(OUT, f))
LAYOUTS = {}
for n, (key, fname, title, model, cols, rows, navkeys) in enumerate(MODELS):
    pages, path = build(key, fname, title, model, cols, rows, navkeys, 7100 + n * 31)
    covered = {k for p in pages for k in p["keys"] if k and not k.startswith("@")}
    assert covered == set(BY), (key, set(BY) - covered)
    LAYOUTS[key] = {"name": title, "file": "Elgato-Stream-Deck/" + fname, "cols": cols, "rows": rows, "pages": pages}
    print("%-5s %-44s %d pages  %s" % (key, fname, len(pages), " | ".join("%s (%d)" % (p["name"], sum(1 for k in p["keys"] if k and not k.startswith("@"))) for p in pages)))

# the VSD M18 layout (written by make_sdprofile.py) goes in too
m18 = json.load(open(os.path.join(BUILD, "m18_layout.json")))   # run make_sdprofile.py first
LAYOUTS = {"m18": m18, **LAYOUTS}
with open(os.path.join(KIT, "stream-controller", "layouts.js"), "w", encoding="utf-8") as f:
    f.write("/* Stream controller layouts, made with the profile files (for START-HERE's previews).\n"
            "   keys: action ids from hotkeys.js, row by row; \"@prev\"/\"@next\" = page keys; null = empty. */\n")
    f.write("window.AWYM_DECK_LAYOUTS = " + json.dumps(LAYOUTS, indent=1, ensure_ascii=False) + ";\n")
print("layouts.js written:", ", ".join(LAYOUTS))
