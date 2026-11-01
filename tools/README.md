# tools/

Scripts that rebuild the generated files. You don't need them to use the kit; they're for when you change the hotkeys, layouts or templates.

Needs Python 3 and Node.js. `make_icons.py` also needs Playwright (`pip install playwright` then `python -m playwright install chromium`), `make_template.py` needs `pip install python-docx`, and `make_kit_sounds.py` needs `ffmpeg` and `numpy`.

| Script | Makes | Run after changing |
|---|---|---|
| `make_icons.py` | `icons/hotkeys/*.png` (144 × 144) | `hotkeys.js` (actions, icons, labels) or `hotkey-icons.html` |
| `make_sdprofile.py` | `stream-controller/VSD-M18/*.SDProfile` | the M18 pages (in the script) or the icons |
| `make_elgato.py` | `stream-controller/Elgato-Stream-Deck/*.streamDeckProfile` and `stream-controller/layouts.js` | the Stream Deck sections (in the script); run `make_sdprofile.py` first |
| `make_deck_readme.py` | `stream-controller/README.txt` | any layout |
| `make_template.py` | `templates/AWYM-Show-Script-Template.docx` and `.md` | the template text (in the script) |
| `make_face_thumbs.py` | `avatars/thumbs.js` (small copies of the faces for the key pictures) | `avatars/avatars.js` (then run `make_icons.py`) |
| `make_kit_sounds.py <sfx-kit folder>` | `sounds/kit/*.ogg` and `CREDITS.txt` | which recordings are used, or their levels |

Adding a hotkey: add it to `hotkeys.js` **and** to the `HOTKEYS` table in `awym-obs-setup.lua` (same id and key), handle it in `hotkeys.html` (route "direct") or in `show-runner.html`'s `HOTKEY` map (route "runner"), then run `make_icons.py`, `make_sdprofile.py`, `make_elgato.py` and `make_deck_readme.py` (and add its key to the `KEYS` table in `make_sdprofile.py`).

Order for a full rebuild:

```
python tools/make_icons.py
python tools/make_sdprofile.py
python tools/make_elgato.py
python tools/make_deck_readme.py
python tools/make_template.py
```
