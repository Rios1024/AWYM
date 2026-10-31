/**
 * screens.js — the full-screen stream screens and their default wording
 * =====================================================================
 * Used by screen.html (shows one), screen-maker.html (builds addresses),
 * control-panel.html ("Stream screens" live edits) and START-HERE.html.
 * Every piece of text can be replaced with your own in the address or live.
 *
 * Entry fields (the key is what ?type= uses):
 *   name        shown in pickers
 *   icon        animated icon: play, cup, tv, hourglass, next, heart, moon, megaphone
 *   title       headline
 *   message     line under the headline
 *   lines       rotating lines, separated by "|" ("" = none)
 *   countLabel  small text under a countdown
 *   done        text when a countdown reaches zero
 */
window.AWYM_SCREENS = {
  starting:     { name: "Starting Soon",          icon: "play",      title: "Starting Soon",          message: "Grab a snack and get comfy.",
                  lines: "Chat is open, say hi!|Get your hottest take ready|Hydrate, then debate", countLabel: "until we go live", done: "Any second now…" },
  brb:          { name: "Be Right Back",          icon: "cup",       title: "Be Right Back",          message: "Don't go anywhere, we'll be back in a moment.",
                  lines: "", countLabel: "until we're back", done: "Coming back now…" },
  technical:    { name: "Technical Difficulties", icon: "tv",        title: "Technical Difficulties", message: "Please stand by while we fix it.",
                  lines: "Don't touch that dial|Our engineers are on it (it's us, we're the engineers)", countLabel: "", done: "" },
  intermission: { name: "Intermission",           icon: "hourglass", title: "Intermission",           message: "Stretch your legs. We'll be right back.",
                  lines: "", countLabel: "until we're back", done: "Back any second…" },
  halftime:     { name: "Halftime",               icon: "hourglass", title: "Halftime",               message: "Refill your drink. Second half coming up.",
                  lines: "", countLabel: "until the second half", done: "Second half starting…" },
  upnext:       { name: "Up Next",                icon: "next",      title: "Up Next",                message: "The great debate continues",
                  lines: "", countLabel: "", done: "" },
  ending:       { name: "Thanks for Watching",    icon: "heart",     title: "Thanks for Watching!",   message: "See you next time.",
                  lines: "", countLabel: "", done: "" },
  offline:      { name: "Offline",                icon: "moon",      title: "We're Offline",          message: "Catch the next show soon.",
                  lines: "", countLabel: "", done: "" },
  custom:       { name: "Custom Message",         icon: "megaphone", title: "Your Message Here",      message: "Type anything you like.",
                  lines: "", countLabel: "", done: "" }
};
