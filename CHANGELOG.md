# Changelog

## 1.2.2 (2026-11-05)

- Fixed: in some layout scenes, cameras, frames and effects could be built off screen (OBS moves a group to fit its layers as they're added). Each seat's layers are now placed relative to where their group ends up, and a new "Reset layout positions" button puts existing scenes right.

## 1.2.1 (2026-11-05)

- Chalk Talk background: the court lines are redrawn smoothly (the three-point corners meet the arc cleanly; dashed top half on the free-throw circle, restricted area added).

## 1.2.0 (2026-11-05)

- Show Runner: Layouts section to switch between Main Show and the layout scenes (works with Studio Mode), with a ★ suggestion based on who's in the seats.
- Eight light backgrounds (Daylight Court, Studio White, Sports Page, Clear Sky, Confetti, Whiteboard, Pastel Mesh, Home Jersey) in a new "Light & bright" group; the title switches to dark lettering on them.

## 1.1.0 (2026-11-02)

- Guests page: badge pictures (a logo or photo in the camera frame's name plate, right of the name, and in the lower third) and Saved guests for people who come back.
- Cameras are centred on their frames when the scenes are built (everything in a seat shares the ring's centre), and a new "Line up cameras with their frames" button fixes scenes built earlier.
- The speaking-light level meter no longer shifts the name plate when it lights up.
- Fixed: the Control Panel's ★ spotlight light could switch off by itself.

## 1.0.0 (2026-11-01)

First release on GitHub.

- Scenes, stream screens and 33 animated backgrounds, built by the OBS setup script.
- Camera frames, lower thirds, remote guests (VDO.Ninja), shot clock with Tin Foil alert.
- Stats Desk: live NBA scores, box scores, player lines, standings, ticker.
- Show Runner: rundown, debate scoreboard, hot-take receipts, sound board (seven real recordings, the rest synthesized, any of them replaceable), clips and instant replay, backups.
- Frame effects: fire, ice, lightning, smoke, sparks, shake.
- Fine-tune sliders for every frame effect and the speaking light (amount, size, speed, brightness; ripple distance, fade time…).
- Talk time: speaking light (with a halo and ripples that spread out and fade), talk time per person, overlap, cut-ins, on-screen card.
- Mute buttons per person, with a MUTED tag on their frame.
- Content Panel with rich text and photos, and show-script import from Google Docs / Word.
- Theme Panel with live colors, fonts and glow; 80 presets.
- Verdicts 🧢 Cap, 🧱 Bricked, 🌬️ Air ball, 🟥 Technical foul, 💥 Posterized, 🔥 On fire and 🤡 Clown take; the verdicts get their own row in the Show Runner and their own stream-deck page.
- Frame effects 💯 100% Facts (gold strip, certified seal, gold ring; Ctrl+Alt+Shift+period) and 👨‍🍳 Cooking (chef's hat, gas-burner flames, steam, hot strip; Ctrl+Alt+Shift+slash).
- Frame effect 🗑️ Trash take: a "TRASH TAKE" strip across the camera and a trash can popping up under the frame (hotkey Ctrl+Alt+Shift+comma).
- Layout scenes: 1–4 people and 2–5 + moderator; sources grouped per seat and color-coded; plain source names (no "AWYM" prefix); up to 6 seats.
- Faces: swap a live camera for prebuilt pictures (seat 1 has ten), with hotkeys and a stream-deck Faces page.
- 73 OBS hotkeys; ready-made layouts for the VSD M18 (one file, 7 pages) and Elgato Stream Deck 15-key, XL, Mini, Neo and +.
