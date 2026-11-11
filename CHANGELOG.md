# Changelog

## 1.2.5 (2026-11-10)

- Shot clock overtime: an **Overtime +1:00** button on the Control Panel (hotkey Ctrl+Alt+Shift+Page Down, stream-deck key, key O on the clock) adds a minute, starts the clock and turns its frame and numbers electric purple with a glow, an "OVERTIME" banner and a horn. Press again for 2OT, 3OT…; Reset ends it. `&otcolor=` and `&ot=` change the colour and length. 74 hotkeys now.
- Stats Desk → Player lookup: "Last N games" (3, 5, 7, 10, 15 or 20, in any season, with an average row; reaches into last season early in a new one) and a "Pick a game" list to show one game's full stat line.

## 1.2.4 (2026-11-06)

- Guests page: "Send names and badges" also puts seats 1–4 on the show intro's name plates (top-left, top-right, bottom-left, bottom-right; an empty seat = no plate). There's a checkbox to turn it off; the Intro Editor shows the new names too.

## 1.2.3 (2026-11-06)

- Show intro (`intro.html`): the two corners slam together, a VS stamp, a quick argument in speech bubbles, then the show title lands letter by letter with confetti, sound bars, the tagline, the episode badge and name plates in all four corners, and it wipes to black. It follows theme.css (fonts, dark/light, gold), and its sound effects are made in code.
- Intro Editor dock (`intro-editor.html`): live preview with sliders for speed, hold, letter stagger, bounce, shake, corner colors (or the theme's), depth, title size, confetti, sound bars and film grain; letter entrances (Drop, Slam, Spin, Rise); up to four center stamps, words or pictures; any Google Font per job. Changes go straight to OBS; Play in OBS; Copy / Paste settings.
- The setup script adds an **Intro** scene after Starting Soon. It plays each time you switch to it, then switches to Main Show (only while Intro is on air; the source gets "Advanced access to OBS"). START-HERE and the script panel show the Intro Editor dock address.

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
