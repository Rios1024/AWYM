ARGUE WITH YO MOMMA! — OBS OVERLAY KIT
======================================

>>> FIRST: unzip this folder, move it to Documents, then double-click
>>> START-HERE.html. It gives you the exact OBS address for every overlay
>>> on YOUR computer (with Copy buttons) and walks you through setup step
>>> by step. This README is the detailed reference.

>>> FASTEST: OBS → Tools → Scripts → "+" → pick awym-obs-setup.lua from
>>> this folder → click "Build my scenes". It creates every scene and
>>> overlay for you. Then add the five docks (addresses shown in the
>>> Scripts window) and put your cameras behind the frames. Leave the
>>> script loaded: it also provides the AWYM hotkeys.

WHAT "BUILD MY SCENES" MAKES
----------------------------
  Scenes (in this order): Starting Soon · Main Show · Show: 1 Person ·
  Show: 2 People · Show: 3 People · Show: 4 People · Show: 2 + Moderator ·
  Show: 3 + Moderator · Show: 4 + Moderator · Show: 5 + Moderator ·
  Be Right Back · Technical Difficulties · Halftime · Thanks for Watching ·
  Show Overlays.
    Main Show uses the layout picked in the script ("Main Show layout");
    the Show: … scenes are every layout, ready to switch to (untick "Also
    make a scene for every layout" to skip them). In the moderator layouts
    seat 1 is the moderator, a bit smaller (on the left, or in the middle
    for 2 + Moderator).
  Sources have plain names (Frame 1, Shot Clock…). Older kits called them
    "AWYM …": Build my scenes renames those (unless the plain name is
    already taken).
  Groups, each its own color in the Sources list:
    Seat 1 … Seat 6 (Moderator in the moderator layouts)
        Camera N (or Guest Seat N), Avatar N, Frame N, Frame FX N
        Click a group's eye to hide that person; drag the group to move
        them (the effects and avatar follow their frame anyway).
    Names        the lower thirds
    Background   (no group; locked)
    Show Overlays  a scene shown on top of every show scene, so the
        graphics are set up once:
        Graphics    Shot Clock, On-Screen Text, Stats Overlay, Debate Overlay
        Show Tools  Instant Replay (hidden until a replay), Sound Effects,
                    Hotkeys
    Groups in the Show: … scenes end in the layout, e.g. "Seat 2 (3+M)":
    OBS needs every group name to be different.
  Cameras: each seat gets "Camera N", a Video Capture Device with no device
    picked yet: double-click it and choose the camera. It's cut to a circle
    with masks/circle-16x9.png, which fits 16:9 cameras (1920x1080,
    1280x720). For a 4:3 camera, open its Filters → Circle cutout and pick
    masks/circle-4x3.png. Untick "Add a camera…" to place cameras yourself.
    Same camera in every scene: it's one source, shown in each.
  An existing Main Show is never rebuilt (only missing overlays are
    added). For the grouped version, rename it (e.g. "Main Show old") and
    click Build my scenes; delete the old one when you're happy.
  Seats 5 and 6 (4 + / 5 + Moderator) have names in the Control Panel and
    mics in the Show Runner's Talk time like the others; the hotkeys and
    stream-deck keys cover seats 1–4.

What's in this folder
---------------------
  START-HERE.html     Step-by-step OBS setup with copy-ready addresses
  awym-obs-setup.lua  OBS script (Tools → Scripts) that builds all scenes, layouts and overlays
  background.html     Full-screen animated show background with the show title
  background-gallery.html  Pick a background scene, mix effects, copy the OBS address
  backgrounds.js      The background scenes (no need to touch)
  packs.js            Show packs used by the Theme Editor (no need to touch)
  screen.html         Full-screen stream screens: Starting Soon, Be Right Back, Technical
                      Difficulties, Intermission, Halftime, Up Next, Thanks for Watching,
                      Offline, or your own custom message
  screen-maker.html   Set up those screens with your own words and copy the OBS address
  screens.js          Default wording for the screens (no need to touch)
  shot-clock.html     Segment timer styled like an arena shot clock (buzzer included)
  lower-third.html    Name / role / handle / jersey-number graphic
  frame.html          Themed ring + name plate for circle-cutout cameras
  avatar.html         Faces instead of a live camera (between the camera and its frame)
  avatars/            The faces (avatars.js lists them; seat 1 has ten)
  frame-fx.html       Effects around a camera frame: fire, ice, lightning, smoke,
                      sparks, shake (the camera stays clear)
  stats-card.html     NBA stats overlay (score cards, player lines, standings, ticker)
  content.html        On-screen text overlay: whatever you type in the Content Panel
  debate.html         Debate overlay: scoreboard, winner, hot-take receipts, segment
                      intros, REPLAY tag (all controlled from the Show Runner)
  sfx.html            Invisible audio source that plays the Show Runner's sound board
  control-panel.html  Dock: shot clock, lower thirds, camera-frame spotlight
  stats-desk.html     Dock: look up NBA games and put stats on screen
  theme-dock.html     Dock: change colors, fonts, scene, badge, show name and glow live
  content-panel.html  Dock: type formatted text, lists, emojis and photos onto the screen,
                      or import a whole show script from Google Docs / Word
  script-import.js    Reads imported scripts (.docx, .md, .html, pasted docs)
  templates/          The show-script template for writers (.docx and .md)
  rich-text.css       How that formatted text looks (no need to touch)
  show-runner.html    Dock: rundown, debate scoreboard, receipts, sound board, talk time,
                      clips & instant replays, and Backup & restore
  sfx.js              The sound board's sounds: your files, the kit's recordings,
                      or made in code
  sounds/             Put your own sound files here to replace any sound
                      (sounds/README.txt); sounds/kit/ has the real recordings
  lib/                anime.js (animation library, MIT licence) for the effects
  obs-ws.js           Talks to OBS's WebSocket server for clips/replays (no need to touch)
  hotkeys.html        Invisible source that carries out OBS hotkeys (Hotkeys)
  hotkeys.js          The 73 hotkey actions and their suggested keys
  hotkey-icons.html   Make stream-deck key pictures in your show colors
  stream-controller/  Ready-made setups: VSD M18 scenes and Elgato Stream Deck
                      profiles (15-key, XL, Mini, Neo, +)
  icons/hotkeys/      Ready-made key pictures (144 x 144 PNG), one per action
  backups/            Where the Show Runner's "Save backup file" puts backups
  guests.html         Remote guests: VDO.Ninja invite links and OBS addresses per seat
  presets.js          Color presets and font lists (add your own presets here)
  mask-maker.html     Make custom PNG masks (circle, rounded, hexagon)
  theme-editor.html   Pick fonts and colors with live previews and save them
  masks/              Ready-made masks for 16:9, 4:3 and 1:1 cameras
  theme.css           ALL fonts, colors and the show name live here
  shared.js           Shared code (no need to touch)
  player-lookup.js    Player lookup code used by the Stats Desk (no need to touch)

Keep every file in the same folder. Put the folder somewhere permanent
(e.g. Documents\awym-obs) before adding it to OBS, because OBS remembers
the file paths.


IMPORTANT: HOW TO ADD ANY OVERLAY
---------------------------------
Sources → + → Browser. UNTICK "Local file" and type the address in the URL
box instead, like:

  Windows:  file:///C:/Users/YOU/Documents/awym-obs/shot-clock.html
  Mac:      file:///Users/YOU/Documents/awym-obs/shot-clock.html

Use forward slashes, and write spaces as %20. This matters: the docks can
only talk to overlays added this way, not ones added with "Local file".


0) BACKGROUND (the only place the show name appears)
----------------------------------------------------
  Easiest: double-click background-gallery.html, click a scene, mix in any
  extra effects, and click "Copy OBS address". Paste that into a Browser
  source. Size: 1920 x 1080. Put it at the BOTTOM of the scene's source
  list so cameras, frames and cards sit on top of it.

  Scenes (each one animates on its own, in your theme colors):
    Show themes
      court      Basketball Court — hardwood with arena lighting
      fighter    Fight Night — versus split, speed lines, sparks (fighting games / Tekken)
      retro      Retro Arcade — 8-bit sky, scrolling pixel hills, CRT lines
      fantasy    Crystal Realm — floating crystals, magic circle (fantasy RPGs / Final Fantasy)
      spire      The Climb — dark spire with a glowing map path (deckbuilders / Slay the Spire)
      tabletop   Tabletop Quest — candlelit dungeon map, d20s, runes (D&D / tabletop RPGs)
      boardgame  Game Night — hex tiles, dice, pawns (board games)
      cards      Card Table — felt table, suits, drifting cards (card games / TCGs)
      music      Studio — equalizer bars, sound waves (music)
      hiphop     Block Party — skyline, spinning vinyl, bass pulses (hip-hop)
      anime      Sakura — sunburst, halftone, cherry-blossom petals (anime)
      tinfoil    Tin Foil Hat — conspiracy corkboard: blurry photos, clippings,
                 red string, CLASSIFIED stamps, a roaming flashlight
    Style
      synthwave  Synthwave — striped neon sun, mountains, endless grid
      vaporwave  Vaporwave — pastel sunset, checkerboard plaza, spinning wireframes
      neonrain   Neon Rain — rainy city night, flickering neon in wet streets
      papercut   Paper Cut — layered paper hills, paper sun and clouds
      comic      Comic Pop — spinning sunburst, halftone, popping starbursts
      chalktalk  Chalk Talk — coach's chalkboard, X's and O's drawing plays
      vhs        VHS Tape — tracking lines, color fringe, static, PLAY counter
    Abstract art
      aurora     soft color blobs flowing together
      waves      layered color waves
      shapes     playful floating geometry
      lowpoly    faceted triangle mesh with shifting light
      flow       generative flow-field trails
      warp       stars streaming past
      halftone   rippling dot grid
      lava       lava-lamp blobs rising and merging
      ribbons    silky bundles of fine lines twisting
      plexus     Constellation — drifting points linking into a network
      topo       Topography — map contour lines shifting
      bokeh      soft out-of-focus lights drifting
      truchet    Truchet Tiles — a maze of curved tiles flipping
      kaleido    Kaleidoscope — shapes in a turning twelve-way mirror

  TIN FOIL TAKEOVER: while the Tin Foil alert is on (Control Panel 🛸
  button, F on the clock, or the hotkey), the Main Show background fades to
  the Tin Foil Hat board, and fades back when you turn it off. To skip
  that, add &foilbg=0 to the background's address.
  All of these are original artwork drawn in code — no official logos,
  characters or game art — so they're safe to stream.

  Extra effects you can layer on any scene: spotlights, sheen, drift,
  flashes. The court also has pulse, lines and bounce. Effect presets:
  arena (court default: spotlights + sheen + flashes), chill, hoops,
  hype, none.

  Address settings, if you'd rather type them:
    ?scene=synthwave which scene (leave it out to use the one in theme.css)
    &anim=chill      extra effects: a preset, or names joined by commas
    &speed=0.5       0.25 (very slow) to 2 (double speed); default 1
    &intensity=low   low, medium (default) or high
    &title=center    top (default), center, bottom, or none
    &tagline=Hoops%20debates,%20settled%20by%20Momma   a line under the title
    &court=0         hide the court lines (court scene)
    &foilbg=0        don't switch to the Tin Foil board during the Tin Foil alert
  The title comes from --show-name in theme.css, and the colors follow
  the theme, so it changes along with everything else.


STREAM SCREENS (starting soon, be right back, and more)
-------------------------------------------------------
  Easiest: double-click screen-maker.html. Pick a screen, write your own
  headline, message, rotating lines, socials and bottom line, add a
  countdown (a number of minutes, or "until 8:00 PM"), pick a background,
  and click "Copy OBS address".
  In OBS, make a scene for each screen (e.g. "Starting Soon", "BRB"), add a
  Browser source with that address, size 1920 x 1080. The animated
  background is built in, so it can be the only source in that scene.
  Tip: tick "Refresh browser when scene becomes active" so a minutes
  countdown starts fresh every time you switch to it.

  Screens: starting, brb, technical, intermission, halftime, upnext,
  ending (Thanks for Watching), offline, custom.

  Changing the words live: the Control Panel dock has a "Stream screens"
  section. Pick the screen, type new words, click "Update screen". You can
  also start or stop a countdown there ("back in 5 minutes").

  Address settings, if you'd rather type them:
    ?type=brb  &title=…  &message=…  &lines=A|B|C  &minutes=5  &at=19:30
    &countlabel=…  &done=…  &socials=A|B  &next=…  &scene=…  &bg=0
    &showname=0  &icon=play|cup|tv|hourglass|next|heart|moon|megaphone|none


SHOW PACKS (for your other shows)
---------------------------------
  In theme-editor.html, "Show packs" re-skins the whole kit in one click —
  background scene, lower-third badge icon, fonts and colors:
    Argue with Yo Momma! (basketball) · Fight Night (fighting games)
    Retro Arcade · Crystal Realm (fantasy RPGs) · The Climb (deckbuilders)
    Tabletop Quest (D&D) · Game Night (board games) · Card Table (card games)
    Studio (music) · Block Party (hip-hop) · Sakura (anime) · Synthwave
    Neon Flow (abstract) · Tin Foil Hat (conspiracies) · Chalk Talk
    (X's and O's) · Vaporwave · Pastel Aurora (abstract)
  Then tweak anything, change the show name, and Download theme.css.
  Tip: keep one copy of this whole folder per show (e.g. awym-obs,
  fight-night-obs), each with its own theme.css.


1) SHOT CLOCK
-------------
  URL:  .../shot-clock.html?time=3:00&label=Hot%20Take
  Size: 640 x 320
  Tick "Control audio via OBS" to hear the buzzer.
  Optional: &autostart=1  &sound=0  &ticks=0


2) LOWER THIRDS (one source per person)
---------------------------------------
  URL:  .../lower-third.html?id=1&name=Your%20Name&role=Moderator&handle=@you&number=23
  Size: 1920 x 1080 (lay it over the whole canvas)
  Use id=1, id=2, id=3, id=4 for different people.
  Optional: &side=right   &autohide=8   &hidden=1
  No jersey number? A badge icon shows instead (set in theme.css or the
  Theme Editor; or per person with &icon=star — ball, star, controller,
  note, dice, card, d20, sword, mic, bolt, crystal, vinyl, none).
  Tip: tick "Refresh browser when scene becomes active" so it animates in
  every time you cut to that scene.


3) CIRCLE CUTOUTS FOR CAMERAS
-----------------------------
  (START-HERE.html has a calculator that works out all the numbers below.)
  Simplest: crop the camera square first, then use a 1x1 mask:
    Filters → + Crop/Pad (for 1920x1080: Left 420, Right 420; for
    1280x720: Left 280, Right 280), then + Image Mask/Blend with
    masks/circle-1x1.png. Or skip the crop and use the mask matching the
    camera's shape, as below.
  a) Right-click the camera (or call/guest video) source → Filters.
  b) Under Effect Filters click + → Image Mask/Blend.
       Type: Alpha Mask (Alpha Channel)
       Path: masks/circle-16x9.png   (use the file that matches the
             camera's shape: 16x9 for most webcams, 4x3 or 1x1 otherwise)
  c) Optional: add a Crop/Pad filter to trim the empty sides
     (for a 1920x1080 camera, crop 420 from left and right).
  d) For the themed ring, add frame.html ON TOP of the camera:
       URL:  .../frame.html?id=1&shape=circle
       Size: 600 x 660
     Line it up: the open hole is 87% of the frame's width. Make the
     masked camera's height about 93% of the frame's width and center it
     under the hole. Group the two (select both → right-click → Group) so
     they move together.
     Shapes: circle (default), rounded, hexagon — match the mask you used.
     The name plate uses the same slot as the lower third with that id.
     Optional: &plate=0 (no name plate), &number=23

  Need a different shape, size or face position? Open mask-maker.html in
  your browser, adjust, and click "Download mask PNG".


4) CONTROL PANEL DOCK
---------------------
  Docks → Custom Browser Docks…
    Dock name: AWYM Control
    URL: file:///C:/Users/YOU/Documents/awym-obs/control-panel.html
  Shot clock: Hide clock / Show clock (top of the section) fades the clock
  off screen and back; it keeps counting while hidden.
  Also start/pause/reset, quick times (0:30 and 1–5 minutes),
  custom time (minutes + seconds, then Set or Set & start), segment
  label, buzzer, and Tin Foil: for conspiracy-theory takes. It puts a
  wobbling tin-foil hat and a foil shine on the shot clock, swaps the label
  to "Tin Foil Alert", and plays a spooky warble (if sound is on). Click it
  again to go back to normal; the clock keeps running either way.
  (Want different wording? Add &foillabel=Conspiracy%20Corner to the
  shot clock's address.)
  Background title: change the title and tagline on the background, or
  move it (top / center / bottom / hide), live. Leave Title empty to use
  the show name; "Back to default" undoes your changes.
  People: type names in; Show/Hide slides each lower third in and out;
  ★ spotlights that person's camera frame (turns the others off).
  The green light means it can reach the overlays.

  FOLDING SECTIONS (every dock except the Theme Panel): click a section's header
  (e.g. "Shot Clock" or "Standings") to fold it away; click it again to
  open it. The ⊟ button at the top folds or opens everything at once.
  Folded sections stay folded next time OBS starts.


5) NBA STATS
------------
  a) Add the overlay:  .../stats-card.html   Size: 1920 x 1080
  b) Add the dock:     Docks → Custom Browser Docks… → .../stats-desk.html
  In the Stats Desk:
    - Pick a date to see that day's games, then click a game.
    - Score: score card with quarter-by-quarter scoring (live or final).
    - Leaders: each team's top scorer, rebounder and passer.
    - Compare: shooting %, rebounds, assists, turnovers and more, side by side.
    - Box score: click a team (e.g. NYK or BOS) for that team's full box
      score: every player's minutes, points, rebounds, assists, steals,
      blocks, turnovers, FG, 3PT, FT and +/-, starters first, then the
      bench, with team totals. Players who didn't play are listed underneath.
      The team's best in points, rebounds and assists is highlighted.
      Tick "Starters only" for a shorter card (it redraws straight away).
    - Player stat line: pick anyone who played and click Show.
    - Standings: East or West, top 10 or all 15.
    - Score ticker: scrolling scores for that date along the bottom.
    - Card header: type your own title (e.g. "Who's the real MVP?").
    - Live games refresh on their own every 30 seconds.

  Player lookup (in the Stats Desk):
    - Type a name and click Find, then click A or B to load that player.
      If search can't find someone, open their page on espn.com and paste
      the link (espn.com/nba/player/_/id/…) into the box instead.
    - Pick a season: this season, career, or any past season.
    - Averages: points, rebounds, assists per game plus shooting, steals,
      blocks, turnovers for the season you picked.
    - History: season-by-season table with the career line. "History
      shows" picks last 10, first 10, best 10 (by points) or every season.
      The ★ marks their highest-scoring season.
    - Last 5: their five most recent games.
    - Compare A vs B: two players side by side, each with its own season,
      e.g. one player's career against another's rookie year.
    All player numbers are regular-season per-game averages.

  Data comes from ESPN's public NBA feed (no account or key needed). It's
  unofficial and undocumented, so ESPN can change or limit it at any time.
  If the desk says it can't reach ESPN, check the internet connection.
  Press a card's button again (Score, Leaders, Box score, Standings, …)
  to hide that card; the button with a green dot is what's on screen.
  Card position (Options): Left, Center, Right, or Full, where the card is
  scaled up to fill the screen on a themed backdrop that covers everything
  behind it (the score ticker still shows if it's on).
  Cards automatically stay above the lower thirds and the score ticker:
  tall ones (all 15 standings, long histories) move up and tighten their
  rows to fit. Untick "Keep cards clear of lower thirds" in Options if
  you'd rather use the full height of the screen.
  The cards use team colors and abbreviations, not team logos, to steer
  clear of trademark trouble. Turn team colors off in Options to use your
  show colors instead.


5b) ON-SCREEN TEXT (CONTENT PANEL)
----------------------------------
  a) Add the overlay:  .../content.html   Size: 1920 x 1080
     (Main Show, below the stats overlay in the Sources list)
  b) Add the dock:     Docks → Custom Browser Docks… → .../content-panel.html
  In the Content Panel:
    - Type in the box. Select text and use the buttons to format it:
        B / I / U        bold, italics, underline (or Ctrl+B / I / U)
        •≡  1.≡          bullet list, numbered list
        Big              a big heading line
        A−  A+           make the selected text smaller or bigger, step by
                         step (60% to 220%; Ctrl+Shift+< / >). The number
                         between them shows the size where the cursor is.
        ⇤  ≡             align left / center
        ● ● ●            main color, accent color, normal color
        😀               emoji picker (Windows: Win + . also works)
        🖼️               add a photo: choose a file, paste a web address or
                         a file path (C:\Pictures\chart.png), or just paste
                         (Ctrl+V) or drag a picture into the box
        ⌫                clear formatting from the selected text
      Click a photo in the box to make it S, M, L or Full width, or remove it.
      Big photos are shrunk automatically; small animated GIFs keep moving.
    - Header (optional): a title bar on top, e.g. "Tonight's topics".
    - Show / Hide puts it on screen or takes it off. Ctrl+Enter = show/update.
      Tick "Live typing" to have the screen follow every keystroke, or
      click Update when you're ready.
    - Saved: Save keeps the piece (talking points, rules, a poll) in a list;
      ▶ shows a saved piece straight away, Edit loads it into the box.
      Everything is remembered when OBS restarts, photos included.
    - Layout: Left, Center, Right or Full (fills the screen on a backdrop);
      Narrow, Medium or Wide; Top or Middle; Card or Text only (just the
      text with an outline, to sit over video); text size; hide by itself
      after a few seconds; keep clear of lower thirds.
    Long text shrinks itself to fit. Pasted text keeps only bold, italics,
    underline, lists and big lines (no links, scripts or outside styles).


5b+) IMPORT A SCRIPT (writers prep the show in Google Docs or Word)
------------------------------------------------------------------
  Content Panel → Import a script. Writers use the template in templates/
  (AWYM-Show-Script-Template.docx: upload it to Google Drive and open it with
  Google Docs). Heading 1 = a segment ("Hot Takes (5 min)"), Heading 2 = an
  on-screen card, a horizontal line = a new card, "Note: …" stays off screen.
  Paste the doc (Ctrl+A, Ctrl+C, then Ctrl+V into the Import box) or open the
  downloaded .docx / .md / .html / .txt. Tick the segments, choose whether
  they also fill the Show Runner's rundown, and Import. The cards appear in
  Saved, grouped by segment: pick a segment in the list (or tick "Follow the
  Show Runner's rundown" so it switches by itself when you click Next
  segment) and use ▶ Next / ◀ to put the cards on screen one after another.
  Importing the same script again replaces its cards. Details:
  templates/README.txt.


5c) SHOW RUNNER
---------------
  a) Add the overlays (Main Show, top of the Sources list):
       .../debate.html   Size: 1920 x 1080
       .../sfx.html      Size: 100 x 100, tick "Control audio via OBS"
       A Media Source named exactly "Instant Replay" (no file), hidden
     The setup script adds all three (also to a Main Show you built earlier).
  b) Add the dock:  Docks → Custom Browser Docks… → .../show-runner.html

  RUNDOWN — your show's segments in order.
    Add segments from the list of ready-made ones (Opening Tip-Off, Hot Takes,
    Buy or Sell, Starting Five, Fast Break, Yo Momma Says, Tin Foil Hat, GOAT
    Talk, Overreaction Corner, Trade Machine, Fact or Fiction, Who Ya Got?,
    Power Rankings, Rookie Watch, Mailbag, Receipts, Closing Arguments), or a
    blank one, or click "Load sample show". Reorder with ▲ ▼. Click a name to
    edit it: its intro line, shot-clock minutes, clock label, and an OBS scene
    to switch to (needs the OBS connection, see Clips).
    "Next segment ▶" (or ▶ on any row) sets the shot clock, plays a segment
    intro on screen with "Up next", switches scene if set, and marks a moment
    if OBS is recording. Tick or untick each of those under the list.

  SCOREBOARD — "who's winning".
    Type the two sides (or "Use people 1 & 2"), click Show, then +1 / +2 / −1
    as the debate goes. The tug-of-war meter leans toward whoever's ahead.
    Rounds, middle text, Score or Meter only, Top or Bottom of the screen.
    🏆 Declare winner: big announcement with confetti (and air horn +
    applause if ticked). A tie says so.

  RECEIPTS — the hot-take tracker.
    Log who said what (and when to check it). Every take gets a receipt
    number and today's date. ▶ Show prints the receipt on screen; mark it
    ✓ cashed or ✗ busted and the stamp lands live (with cha-ching or sad
    trombone). "Show record" shows everyone's cashed / busted / pending
    count and hit rate. Search and filter the list.

  SOUND BOARD — 17 sounds: air horn, buzzer, correct, wrong, rimshot,
    drumroll, crowd ooh, applause, cha-ching, sad trombone, record scratch,
    swoosh, whistle, gong, boing, mic drop, Tin Foil. Seven are real
    recordings (marked REAL: applause, cha-ching, correct, wrong, swoosh,
    boing, mic drop; CC0, see sounds/kit/CREDITS.txt); the rest are made in
    code. To replace ANY of them with your own recording, put a file named
    after it in the sounds folder, e.g. sounds/airhorn.mp3 (the list of names
    and where to find free sounds are in sounds/README.txt); its pad then
    says YOURS. Or add extra pads with "+ Your own sound" (MP3/WAV, up to
    8 MB each). Keys 1–9 and 0 play the first ten when the
    dock is clicked. Sounds play through the Sound Effects source so they're
    in the stream; "Preview here only" plays them just in the dock.

  FACES — swap someone's live camera for one of their prebuilt faces (seat 1:
    Smile, Skeptical, Shocked, Thinking, Happy, Cringe, Unimpressed,
    Starstruck, Facepalm, Smug). Click a face to put it over their camera,
    inside the frame (the name plate, speaking light and effects stay on
    top, and the face bobs along while they talk); Live camera switches
    back. Hotkeys for seat 1: Ctrl+Alt+Shift+F13…F22 pick a face, D toggles
    face / live camera, J = next face; the stream-deck layouts have a Faces
    page. Each frame needs its
    avatar layer, .../avatar.html?id=1 (600 x 660), same box as the frame,
    between the camera and the frame: Build my scenes adds it and keeps it
    lined up. Faces for other seats: avatars/README.txt.

  MUTE — a button per person at the top of the Show Runner (and next to each
    seat in Talk time) mutes or unmutes their mic in OBS; red = muted, and
    their camera frame shows a red MUTED tag. "Unmute all" appears while
    anyone is muted. Hotkeys: Ctrl+Alt+Shift+[ ] ; ' for seats 1–4 and \ to
    unmute everyone (on page 1 of every ready-made Stream Deck / M18 setup).
    It uses the mic picked for each seat in Talk time (remote guests: their
    Guest Seat source is picked for you) and needs the OBS connection.
    Muting in OBS itself shows up here too.

  TALK TIME — who's talking, and for how long. Needs the OBS connection
    (Clips & replays): it reads each mic's level from OBS.
    1. Pick each person's mic (remote guests get their Guest Seat
       source picked for you). Talk: the bar moves; the yellow line is
       Sensitivity. Move it so the bar only crosses it when they speak.
    2. Speaking light: whoever is talking gets a glowing ring and a little
       level meter on their camera frame's name plate (untick to turn off).
       Their Frame FX layer adds a soft halo and rings that ripple outward
       and fade (louder = stronger and quicker); when they stop, the glow
       fades out over a second or two. The ripples need the "Frame FX"
       layers (Build my scenes adds them); add &talk=0 to a Frame FX
       layer's address to keep just the ring.
    3. ● Track counts (❚❚ pauses; "Only count while streaming or recording"
       waits for OBS). It counts each person's talk time and share, time
       spent TALKING AT THE SAME TIME (and for each pair), CUT-INS (someone
       starting while another has been going a second or more), and dead
       air. Reset starts over; Copy stats copies them as text.
    4. On screen: the talk-time card on the Debate overlay, updating live
       (Card: right/left moves it). 🚨 Clear hides it.
    Mics in the same room hear each other: "Ignore mic bleed" skips a mic
    that's that many dB quieter than the loudest one, so one person talking
    doesn't count for both. Two people on one mic count as one.

  FRAME EFFECTS — 🔥 fire, 🧊 ice, ⚡ lightning, 💨 smoke, ✨ sparks and 💥 shake
    around a camera frame, plus the VERDICTS (their own row of buttons):
    🗑️ trash take, 💯 100% facts, 👨‍🍳 cooking, 🧢 cap, 🧱 bricked, 🌬️ air ball,
    🟥 technical foul, 💥 posterized, 🔥 on fire, 🤡 clown take.
    🗑️ Trash take: a grimy "TRASH TAKE" strip slaps across the lower part of
    the camera at an angle and a dented metal trash can pops up under the
    frame (lid flapping, stink lines, flies, paper balls). When it ends,
    the strip is tossed into the can, the lid bangs shut and the can drops
    away (🧯 Stop just fades it out).
    💯 100% Facts: a gold "100% FACTS" strip stamps across the camera, a gold
    "100% CERTIFIED" seal thuds onto the frame's top-right corner, the ring
    glows gold and sparkles. It lifts off at the end.
    👨‍🍳 Cooking: a chef's hat drops onto the top of the frame, blue gas-burner
    flames light along the lower sides, steam curls up, and a hot "COOKING"
    strip lies across the camera. At the end the hat flies off and the
    burner clicks off.
    🧢 Cap: "THAT'S CAP". Baseball caps rain down and bounce off the frame,
    and a lie-detector tape under it scribbles wildly.
    🧱 Bricked: a brick drops onto the frame (CLANK!), the ring cracks where
    it hit, rubble and dust fall, and the brick tumbles off.
    🌬️ Air ball: a basketball sails clean over the frame, missing
    everything, then a tumbleweed rolls past underneath.
    🟥 Technical foul: the ring flashes referee red, a striped "T" badge
    stamps onto the top-left corner and the strip lands with a jolt.
    💥 Posterized: the picture shatters like a backboard, white cracks
    from the impact, then the glass falls away and the camera's clear.
    🔥 On fire: arcade style. The frame catches fire (the Fire effect), a
    flaming basketball laps the ring, "ON FIRE!".
    🤡 Clown take: a red clown nose boings onto the middle of the picture
    (HONK!), rainbow wig tufts pop out of the frame's top corners and
    confetti bursts.
    The verdicts are the only effects that cover part of the picture (a
    strip across the lower part; the clown nose and the posterized glass),
    on purpose. Otherwise the
    middle of the frame is never covered, so the
    camera stays clear. Pick whose frame (★ Floor = whoever has the
    spotlight, or everyone if nobody does; Everyone; or a seat), how long
    (Quick, Normal, Until stopped), then click an effect. 🧯 Stop effects
    ends them; 🚨 Clear stops everything.
    🎚 Fine-tune the look (under Stop): pick an effect and drag its sliders,
    100% = the built-in look. Fire, ice, lightning, smoke and sparks: how
    much (amount), size or reach, speed and brightness. Shake: strength
    and length. 🎙 Speaking (the speaking light): ripple distance, fade
    time, ripples per second, brightness and halo size. Changes show on
    every frame straight away and are kept (also for the hotkeys and
    stream decks); ▶ Try it previews on the frame picked above, ↺ Reset
    puts that effect back.
    Each camera frame needs its effects layer, a Browser source
    .../frame-fx.html?id=1 (1000 x 1100) just above the frame with the same
    id (frame.html?id=1), in the same group if you grouped your camera and
    frame. The setup script adds them (also to a Main Show you built
    earlier: click Build my scenes again; it finds frames by their address,
    whatever they're called and inside groups too) and, while it's loaded,
    keeps each one lined up with its frame: move, resize or hide the frame
    and its effects follow. Nothing runs while no effect is playing.
    "No Frame FX source answered" in the Show Runner: click Build my scenes
    and read the status line; it says what it added (or that it found no
    camera frames).

  CLIPS & REPLAYS — uses OBS's built-in WebSocket server (OBS 28 or newer).
    One-time setup: Tools → WebSocket Server Settings → Enable → Show
    Connect Info → copy the password into the dock → Connect. For clips,
    also turn on Settings → Output → Replay Buffer.
      Start buffer / 💾 Save clip   saves the last N seconds (N is set in OBS)
      🎬 Instant replay             plays the newest clip full screen with a
                                    REPLAY tag, then hides it by itself
      Start recording / 📍 Mark     notes the time in the recording; "Copy as
                                    chapters" gives YouTube-ready chapters
    Saved clips are listed with the segment they came from (▶ replays one,
    Copy copies its file location).

  BACKUP & RESTORE — one file with everything from every dock: people,
    background title, stream screen words, theme, stats options, Content
    Panel pieces (photos included), rundown, scoreboard, receipts, your
    sounds, clips and moments. Never your OBS password.
    "Save backup file": OBS docks can't download files, so inside OBS the
    backup is handed to the setup script, which saves it in this kit's
    backups folder (awym-backup-YYYY-MM-DD-HH-MM.json). That needs the setup
    script loaded (Tools → Scripts) and the Show Runner connected to OBS
    (Clips & replays). Without those, the backup is copied instead: paste it
    into Notepad and save it as a .json file. ("Copy backup" always does that.)
    In a normal web browser it's an ordinary download.
    To restore, open the file (or paste it) and click Restore twice. Then
    restart OBS.

  🚨 CLEAR — in the top bar of every dock. Hides every lower third, stats
    card and ticker, on-screen text, scoreboard, receipt and replay at once,
    turns spotlights off and stops sounds. The background, cameras and shot
    clock stay.


5d) HOTKEYS AND STREAM CONTROLLERS (VSD M18, Stream Deck, Loupedeck, macro pads)
---------------------------------------------------------------------------------
  The setup script (awym-obs-setup.lua) adds 73 actions to OBS → Settings →
  Hotkeys, all named "AWYM: …". KEEP THE SCRIPT LOADED in Tools → Scripts,
  or they disappear. The first time, it fills in a key for each, always
  Ctrl + Alt + Shift plus one key (change them in Settings → Hotkeys):

    Run of show    Next segment N · Previous P · Clear screen X
    Shot clock     Start/pause S · Reset R · Buzzer Z · Tin Foil T · Show/hide K
    Scoreboard     Side A +1 Q · Side B +1 W · Show/hide E · Winner Y
    Sound board    Air horn F1 · Buzzer F2 · Correct F3 · Wrong F4 ·
                   Rimshot F5 · Drumroll F6 · Crowd ooh F7 · Applause F8 ·
                   Cha-ching F9 · Sad trombone F10 · Record scratch F11 ·
                   Swoosh F12 · Whistle 6 · Gong 7 · Boing 8 · Mic drop 9 ·
                   Tin Foil sound 0
    Lower thirds   Name 1–4 show/hide 1–4 · Hide all names 5
    Clips          Save clip C · Instant replay V · Mark moment M
    Graphics       Hide stats card G · Hide on-screen text H
    Frame effects  Fire F · Ice I · Lightning L · Smoke O · Sparks A ·
                   Shake B · Stop effects U
    Verdicts       Trash take , · 100% Facts . · Cooking / · Cap - ·
                   Bricked = · Air ball ` · Technical foul Insert ·
                   Posterized Home · On fire Page Up · Clown take End   (on the frame picked in the
                   Show Runner; without it, whoever has the floor)
    Faces (seat 1) Faces 1–10 F13–F22 · Face on/off D · Next face J
                   (F13–F22 are for stream decks; most keyboards don't have them)
    Mute           Seat 1 [ · Seat 2 ] · Seat 3 ; · Seat 4 ' · Unmute all \
                   (the keys right of L and P on a US keyboard; they need the
                   Show Runner open and connected to OBS)

  Also set Settings → Advanced → Hotkeys → Hotkey Focus Behavior → "Never
  disable hotkeys", so they work while another window is in front.
  How it works: a hotkey points the invisible "Hotkeys" source (in
  Main Show; the script adds it) at hotkeys.html#action, which tells the
  overlays and docks. Rundown, scoreboard and clip actions need the Show
  Runner dock open; sounds still play without it (at 80%).

  READY-MADE CONTROLLER SETUPS (stream-controller/; START-HERE step 10 has a
  folded section per model with its layout):
    VSD-M18/              AWYM-Show.SDProfile: one VSD Craft scene for the
                          VSD M18 with all 73 keys on 7 pages
    Elgato-Stream-Deck/   Stream Deck profiles for the 15-key (MK.2 /
                          original), XL, Mini, Neo and + : double-click to
                          import
  Any other controller (Mirabox/Ajazz Stream Dock, Loupedeck, Razer Stream
  Controller, Touch Portal, a macro pad): give a key a "Hotkey" / keyboard
  shortcut action, press that action's keys, and set its picture to the
  matching file in icons/hotkeys/ (list in icons/hotkeys/README.txt).
  hotkey-icons.html makes the pictures in your own show colors and any size.
  Details and every layout: stream-controller/README.txt.


5e) REMOTE GUESTS (VDO.Ninja)
-----------------------------
  Guests join from their browser (Chrome or Edge; phones work too) with a
  link: free, no account, nothing to install. Each one becomes their own
  Browser source in OBS, so they get a camera frame, a lower third and the
  ★ spotlight like anyone in the studio.
  1. Open guests.html. Pick which seats (People slots 1–4) are remote, type
     names. The room name and password are made for you; keep them the same
     every week and every link stays the same.
  2. Send each guest their invite link ("Copy invite message" writes the
     text for you: link, use headphones, keep the tab open).
  3. Get them into Main Show:
       Automatic: Tools → Scripts → awym-obs-setup.lua → "Remote guests"
       boxes: room name, password, seats 1–6 (e.g. 2,3) → Build my scenes (tick
       "add the overlays it's missing" if Main Show exists). Each guest
       ("Guest Seat 2" …) lands behind their camera frame, cropped
       square and cut out with the circle mask, with its own audio slider.
       By hand: each guest's OBS address as a Browser source, 1280 x 720,
       "Control audio via OBS" ticked, then crop + mask like a camera.
  4. Open "Your link" in Chrome/Edge on the OBS computer and leave it open
     so guests can hear you. Wear headphones and turn OFF Desktop Audio in
     OBS (Settings → Audio), or guests are recorded twice.
  As a dock, guests.html can also send everyone's names to the Control
  Panel (lower thirds and frame name plates).
  Links used:  invite  https://vdo.ninja/?room=R&push=RseatN&label=Name&password=P
               OBS     https://vdo.ninja/?room=R&view=RseatN&solo&password=P
  Tip: a 5-minute test call with each guest before the first show.


6) KEYBOARD FALLBACK
--------------------
  If a dock's light stays grey, right-click the overlay source → Interact.
    Shot clock: Space start/pause, R reset, ←/→ ±5s, S sound on/off
                F = Tin Foil alert on/off · H = hide/show the clock
                Presets: 1–5 = 1 to 5 minutes, 0 = 0:30
                Custom time: press T (or Enter), type the digits like a
                microwave (1 3 0 = 1:30, 4 5 = 0:45), then Enter.
                Backspace fixes a digit, Esc cancels.
    Lower third: Space or click to show/hide
    Camera frame: click to toggle the spotlight


7) CHANGE FONTS AND COLORS
--------------------------
  Live, inside OBS: add the Theme Panel dock
    Docks → Custom Browser Docks… → Dock name: Theme Panel
    URL: file:///C:/Users/YOU/Documents/awym-obs/theme-dock.html
  Click a show pack or one of 52 color presets (including Knicks- and Celtics-inspired sets), fine-tune any color, pick
  fonts, the background scene, the lower-third badge and the show name
  (leave the show name blank to hide it), the title size (50%–200%), and
  the background animation:
  quick picks, extra effects, speed, intensity and court lines.
  Glow: one slider (0%–200%) for every glow effect — shot clock digits,
  neon titles (Synthwave and other neon scenes), glowing court lines, the
  light from crystals, torches and candles in the scenes, the camera-frame
  spotlight and the stats LIVE dot. 0% = no glow, 100% = normal, 200% =
  double. "No glow", "Soft" (50%) and "Normal" are one-click shortcuts.
  (The Synthwave sun's sky glow updates the next time the background loads.)
  Every overlay updates instantly (no refreshing), and OBS remembers it.
  "Copy as theme.css" copies the look so you can paste it into theme.css
  (to keep it in the file or move it to another computer).
  "Back to theme.css" undoes everything done in the panel.

  Or, outside OBS:
  Easiest: double-click theme-editor.html.
    Fonts: three font jobs, each with live previews —
      Title     the show title, shot-clock label, tags, "VS"
      Headings  names, scores, stat numbers, card titles
      Body      roles, handles, labels, small print
    Pick from the suggestions, or type the exact name of any font from
    fonts.google.com and click Use.
    Colors: pick one of 52 color presets (including Knicks- and Celtics-inspired sets) or your own colors.
  Click "Download theme.css" and replace theme.css in this folder.
  Or edit theme.css in Notepad/TextEdit (instructions are at its top).
  Then in OBS right-click each browser source → Refresh (and each dock:
  right-click its title → Reload, or restart OBS).
  The show name is also in theme.css (--show-name); it's used by the
  background.


Fonts
-----
Fonts come from Google Fonts, so the computer needs internet the first time
OBS loads them. Without it they fall back to Impact / Arial Narrow. Very wide
fonts can crowd long names; the condensed suggestions fit best.


For developers (changing or extending the kit)
----------------------------------------------
Every file starts with a documentation header: what it is, what it loads,
which messages it sends and receives, and how its layout or data is built.
Main functions have doc comments (JSDoc-style in JavaScript, LuaDoc-style
in the OBS script). Good places to start:
  shared.js        the AWYM helpers, plus a reference for EVERY message the
                   docks and overlays send each other (BroadcastChannel
                   "awym-control")
  backgrounds.js   how a background scene works, and how to add your own
  packs.js / presets.js / screens.js   data you can extend (show packs,
                   color presets and fonts, stream screen wording)
  theme.css        every theme setting, including the optional ones
  rich-text.css    the formatting the Content Panel allows (AWYM.cleanHTML in
                   shared.js removes anything else before it reaches the screen)
