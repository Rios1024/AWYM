/**
 * hotkeys.js — every action you can put on an OBS hotkey or a stream-deck key
 * ===========================================================================
 * Used by hotkeys.html (the relay that carries out a pressed hotkey),
 * hotkey-icons.html (key icons) and START-HERE.html (the hotkey list).
 * The OBS setup script (awym-obs-setup.lua) has the same list of ids, names
 * and suggested keys; keep the two in step if you add one.
 *
 * Entry fields:
 *   id      used in the relay address and the script (letters, digits, -)
 *   name    shown in OBS → Settings → Hotkeys as "AWYM: <name>"
 *   group   show | clock | score | sound | lower | clips | graphics | fx | mute (sets the key color)
 *   icon    emoji on the key, or text (when `text` is true), e.g. "+1"
 *   label   one or two short words under the icon
 *   key     suggested key, always with Ctrl + Alt + Shift (OBS key names without OBS_KEY_,
 *           e.g. BRACKETLEFT for [ ; AWYM_HOTKEY_TEXT shows them as the character)
 *   route   "direct": the relay does it itself
 *           "runner": the Show Runner dock does it (it needs the rundown, scores,
 *                     sound volume or the OBS connection), with a fallback for sounds
 *   badge   optional small "✕" corner badge (hide actions)
 *   fx      frame effect (frame-fx.html) the action plays; the Show Runner picks whose frame,
 *           without it the relay sends it to whoever has the floor
 */
(function () {
  const SOUND_KEYS = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "6", "7", "8", "9", "0"];
  const SOUNDS = [
    ["airhorn", "Air horn", "📯"], ["buzzer", "Buzzer", "📣"], ["ding", "Correct", "✅"], ["wrong", "Wrong", "❌"],
    ["rimshot", "Rimshot", "😆"], ["drumroll", "Drumroll", "🥁"], ["ooh", "Crowd ooh", "😮"], ["applause", "Applause", "👏"],
    ["chaching", "Cha-ching", "💰"], ["sadtrombone", "Sad trombone", "📉"], ["scratch", "Record scratch", "💿"], ["swoosh", "Swoosh", "💨"],
    ["whistle", "Whistle", "🏁"], ["gong", "Gong", "🔔"], ["boing", "Boing", "🌀"], ["micdrop", "Mic drop", "🎤"], ["tinfoil", "Tin Foil sound", "🛸"]
  ];
  window.AWYM_HOTKEYS = [
    // run of show
    { id: "next", name: "Next segment", group: "show", icon: "⏭️", label: "Next", key: "N", route: "runner" },
    { id: "prev", name: "Previous segment", group: "show", icon: "⏮️", label: "Prev", key: "P", route: "runner" },
    { id: "clear", name: "Clear screen", group: "show", icon: "🚨", label: "Clear", key: "X", route: "direct" },
    // shot clock
    { id: "clock-toggle", name: "Shot clock start/pause", group: "clock", icon: "⏯️", label: "Start/Pause", key: "S", route: "direct" },
    { id: "clock-reset", name: "Shot clock reset", group: "clock", icon: "🔄", label: "Reset", key: "R", route: "direct" },
    { id: "clock-buzz", name: "Shot clock buzzer", group: "clock", icon: "📢", label: "Clock buzzer", key: "Z", route: "direct" },
    { id: "clock-foil", name: "Tin Foil alert", group: "clock", icon: "🛸", label: "Tin Foil", key: "T", route: "direct" },
    { id: "clock-hide", name: "Shot clock show/hide", group: "clock", icon: "⏱️", badge: true, label: "Hide clock", key: "K", route: "direct" },
    // scoreboard
    { id: "score-a", name: "Side A +1", group: "score", icon: "+1", text: true, side: "a", label: "Side A", key: "Q", route: "runner" },
    { id: "score-b", name: "Side B +1", group: "score", icon: "+1", text: true, side: "b", label: "Side B", key: "W", route: "runner" },
    { id: "score-show", name: "Show/hide scoreboard", group: "score", icon: "🆚", label: "Scoreboard", key: "E", route: "runner" },
    { id: "winner", name: "Declare winner", group: "score", icon: "🏆", label: "Winner", key: "Y", route: "runner" },
    // sound board
    ...SOUNDS.map(([s, name, icon], i) => ({ id: "snd-" + s, sound: s, name: "Sound: " + name, group: "sound", icon, label: name, key: SOUND_KEYS[i], route: "runner" })),
    // lower thirds
    ...[1, 2, 3, 4].map((n) => ({ id: "lt-" + n, name: "Lower third " + n + " show/hide", group: "lower", icon: String(n), text: true, label: "Name " + n, key: String(n), route: "direct" })),
    { id: "lt-hide", name: "Hide all lower thirds", group: "lower", icon: "🙈", label: "Hide names", key: "5", route: "direct" },
    // clips
    { id: "save-clip", name: "Save clip", group: "clips", icon: "💾", label: "Save clip", key: "C", route: "runner" },
    { id: "replay", name: "Instant replay", group: "clips", icon: "🎬", label: "Replay", key: "V", route: "runner" },
    { id: "mark", name: "Mark moment", group: "clips", icon: "📍", label: "Mark", key: "M", route: "runner" },
    // graphics
    { id: "hide-stats", name: "Hide stats card", group: "graphics", icon: "📊", badge: true, label: "Hide stats", key: "G", route: "direct" },
    { id: "hide-text", name: "Hide on-screen text", group: "graphics", icon: "📝", badge: true, label: "Hide text", key: "H", route: "direct" },
    // frame effects (on the frame picked in the Show Runner; "has the floor" without it)
    { id: "fx-fire", fx: "fire", name: "Frame effect: Fire", group: "fx", icon: "🔥", label: "Fire", key: "F", route: "runner" },
    { id: "fx-ice", fx: "ice", name: "Frame effect: Ice", group: "fx", icon: "🧊", label: "Ice", key: "I", route: "runner" },
    { id: "fx-zap", fx: "zap", name: "Frame effect: Lightning", group: "fx", icon: "⚡", label: "Lightning", key: "L", route: "runner" },
    { id: "fx-smoke", fx: "smoke", name: "Frame effect: Smoke", group: "fx", icon: "💨", label: "Smoke", key: "O", route: "runner" },
    { id: "fx-sparks", fx: "sparks", name: "Frame effect: Sparks", group: "fx", icon: "✨", label: "Sparks", key: "A", route: "runner" },
    { id: "fx-shake", fx: "shake", name: "Frame effect: Shake", group: "fx", icon: "💥", label: "Shake", key: "B", route: "runner" },
    { id: "fx-stop", name: "Stop frame effects", group: "fx", icon: "🧯", label: "Stop FX", key: "U", route: "runner" },
    // mute each seat's mic in OBS (the mic picked for that seat in the Show Runner's Talk time)
    ...[["BRACKETLEFT"], ["BRACKETRIGHT"], ["SEMICOLON"], ["APOSTROPHE"]].map(([k], i) => ({ id: "mute-" + (i + 1), seat: i + 1, name: "Mute seat " + (i + 1) + " on/off", group: "mute", icon: "🔇", label: "Mute " + (i + 1), key: k, route: "runner" })),
    { id: "unmute-all", name: "Unmute everyone", group: "mute", icon: "🔊", label: "Unmute all", key: "BACKSLASH", route: "runner" }
  ];
  /* Group names and the color each group's keys use (a theme color variable, or a fixed color). */
  window.AWYM_HOTKEY_GROUPS = {
    show: { name: "Run of show", color: "--primary" }, clock: { name: "Shot clock", color: "--clock-digit" },
    score: { name: "Scoreboard", color: "--accent" }, sound: { name: "Sound board", color: "#3DDC84" },
    lower: { name: "Lower thirds", color: "--primary" }, clips: { name: "Clips", color: "--warning" },
    graphics: { name: "Graphics", color: "--light" }, fx: { name: "Frame effects", color: "#FF6A2B" }, mute: { name: "Mute", color: "#E5484D" }
  };
  /** "Ctrl + Alt + Shift + N" for a suggested key. */
  const CHAR = { SPACE: "Space", BRACKETLEFT: "[", BRACKETRIGHT: "]", SEMICOLON: ";", APOSTROPHE: "'", BACKSLASH: "\\", COMMA: ",", PERIOD: ".", SLASH: "/", MINUS: "-", EQUAL: "=" };
  window.AWYM_HOTKEY_TEXT = (k) => "Ctrl + Alt + Shift + " + (CHAR[k] || k);
})();
