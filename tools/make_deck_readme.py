import json, os, subprocess
import os as _os
ROOT = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))   # the kit (this repo)
BUILD = _os.path.join(ROOT, "tools", ".build"); _os.makedirs(BUILD, exist_ok=True)
KIT = ROOT
js = open(KIT + "/stream-controller/layouts.js", encoding="utf-8").read()
L = json.loads(js[js.index("{"):js.rstrip().rstrip(";").rindex("}") + 1])
H = json.loads(subprocess.run(["node", "-e", "global.window={}; require(%s); require(%s); console.log(JSON.stringify(window.AWYM_HOTKEYS))" % (json.dumps(os.path.join(KIT, "avatars", "avatars.js")), json.dumps(os.path.join(KIT, "hotkeys.js")))], capture_output=True, text=True, check=True).stdout)
NAME = {h["id"]: h["label"] for h in H}
NAME.update({"@prev": "◀ page", "@next": "page ▶", None: "(empty)"})
def grid(l, ind="    "):
    out = []
    for n, p in enumerate(l["pages"]):
        out.append(f"  Page {n + 1} · {p['name']}")
        w = 15 if l["cols"] <= 5 else 12
        for r in range(l["rows"]):
            row = p["keys"][r * l["cols"]:(r + 1) * l["cols"]]
            out.append(ind + "".join((NAME.get(k) or "(empty)")[:w - 1].ljust(w) for k in row).rstrip())
    return "\n".join(out)
t = []
t.append("""READY-MADE SETUPS FOR STREAM CONTROLLERS
========================================
Every key sends one of the kit's OBS hotkeys (always Ctrl + Alt + Shift + a
key; START-HERE step 10 lists them). Keep the setup script loaded in OBS
(Tools → Scripts) and the Show Runner dock open. Press the air horn key to
test. START-HERE step 10 shows all of these with the key pictures.

  VSD-M18/              VSD Craft scenes for the VSD M18
  Elgato-Stream-Deck/   Stream Deck app profiles (15-key, XL, Mini, Neo, +)
  layouts.js            the layouts below, for START-HERE (no need to touch)

Other controllers (Mirabox/Ajazz Stream Dock, Loupedeck, Razer, Touch
Portal, macro pads): set each key to a "hotkey / keyboard shortcut" with the
keys from START-HERE step 10 and the picture from icons/hotkeys/. Use the
layouts here as a guide.
""")
m = L["m18"]
t.append("""
VSD M18 (VSD Craft)
-------------------
  VSD-M18/AWYM-Show.SDProfile         the one file: all 73 keys on 7 pages
  Import: in VSD Craft, the import button next to the scene list → pick the
  file. A scene called AWYM Show appears.
  The 3 plain buttons under the screen keys: ◀ page · Clear screen · page ▶.

AWYM Show (top row first)
""" + grid(m))
t.append("""

ELGATO STREAM DECK (Stream Deck app 6.0 or newer; made for 7.3+)
-------------------------------------------------------------
  Double-click the file for your model (or in the Stream Deck app: profile
  list → Import). A profile called "AWYM Show" appears with all 73 actions.
  ◀ / ▶ page keys sit in the bottom corners (the Neo uses its touch points
  instead). If a profile won't import on your app version, set keys by hand:
  drag System → Hotkey onto a key, press the keys, Set from File → the
  picture in icons/hotkeys/.
""")
for k in ["sd15", "xl", "mini", "neo", "plus"]:
    l = L[k]
    t.append(f"\n{l['name']}\n  {l['file']}  ({len(l['pages'])} pages)\n" + grid(l) + "\n")
open(KIT + "/stream-controller/README.txt", "w", encoding="utf-8").write("".join(t))
print(open(KIT + "/stream-controller/README.txt", encoding="utf-8").read()[:3800])
