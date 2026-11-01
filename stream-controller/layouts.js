/* Stream controller layouts, made with the profile files (for START-HERE's previews).
   keys: action ids from hotkeys.js, row by row; "@prev"/"@next" = page keys; null = empty. */
window.AWYM_DECK_LAYOUTS = {
 "m18": {
  "name": "VSD M18 (VSD Craft)",
  "file": "VSD-M18/AWYM-Show.SDProfile",
  "cols": 5,
  "rows": 3,
  "buttons": [
   "@prev",
   "clear",
   "@next"
  ],
  "extra": [],
  "pages": [
   {
    "name": "Show",
    "keys": [
     "next",
     "prev",
     "clock-toggle",
     "clock-reset",
     "clear",
     "score-a",
     "score-b",
     "score-show",
     "winner",
     "replay",
     "mute-1",
     "mute-2",
     "mute-3",
     "mute-4",
     "unmute-all"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-airhorn",
     "snd-buzzer",
     "snd-ding",
     "snd-wrong",
     "snd-rimshot",
     "snd-drumroll",
     "snd-ooh",
     "snd-applause",
     "snd-chaching",
     "snd-sadtrombone",
     "snd-scratch",
     "snd-swoosh",
     "snd-whistle",
     "snd-gong",
     "snd-boing"
    ]
   },
   {
    "name": "Scoreboard",
    "keys": [
     "score-a",
     "score-b",
     "score-show",
     "winner",
     "snd-micdrop",
     "lt-1",
     "lt-2",
     "lt-3",
     "lt-4",
     "lt-hide",
     "snd-ding",
     "snd-wrong",
     "snd-buzzer",
     "snd-ooh",
     "snd-applause"
    ]
   },
   {
    "name": "Clock & clips",
    "keys": [
     "lt-hide",
     "clock-hide",
     "clock-buzz",
     "hide-stats",
     "hide-text",
     "clock-toggle",
     "clock-reset",
     null,
     "snd-tinfoil",
     "clock-foil",
     "save-clip",
     "replay",
     "mark",
     null,
     null
    ]
   },
   {
    "name": "Frame FX",
    "keys": [
     "fx-fire",
     "fx-ice",
     "fx-zap",
     "fx-smoke",
     "fx-sparks",
     "fx-shake",
     "fx-stop",
     null,
     null,
     null,
     null,
     null,
     null,
     null,
     null
    ]
   },
   {
    "name": "Verdicts",
    "keys": [
     "fx-trash",
     "fx-facts",
     "fx-cooking",
     "fx-cap",
     "fx-bricked",
     "fx-airball",
     "fx-technical",
     "fx-posterized",
     "fx-onfire",
     "fx-clown",
     null,
     null,
     "fx-stop",
     null,
     null
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-1",
     "face-2",
     "face-3",
     "face-4",
     "face-5",
     "face-6",
     "face-7",
     "face-8",
     "face-9",
     "face-10",
     "avatar-toggle",
     "face-next",
     null,
     null,
     null
    ]
   }
  ]
 },
 "sd15": {
  "name": "Stream Deck (15 keys: MK.2, original, Scissor Keys)",
  "file": "Elgato-Stream-Deck/AWYM-Stream-Deck-15-key.streamDeckProfile",
  "cols": 5,
  "rows": 3,
  "pages": [
   {
    "name": "Run of show · Shot clock · Mute",
    "keys": [
     "next",
     "prev",
     "clear",
     "mark",
     "clock-toggle",
     "clock-reset",
     "clock-buzz",
     "clock-hide",
     "clock-foil",
     "unmute-all",
     "mute-1",
     "mute-2",
     "mute-3",
     "mute-4",
     "@next"
    ]
   },
   {
    "name": "Scoreboard · Sound board",
    "keys": [
     "score-a",
     "score-b",
     "score-show",
     "winner",
     "snd-airhorn",
     "snd-buzzer",
     "snd-ding",
     "snd-wrong",
     "snd-rimshot",
     "snd-drumroll",
     "@prev",
     "snd-ooh",
     "snd-applause",
     "snd-chaching",
     "@next"
    ]
   },
   {
    "name": "Sound board · Names",
    "keys": [
     "snd-sadtrombone",
     "snd-scratch",
     "snd-swoosh",
     "snd-whistle",
     "snd-gong",
     "snd-boing",
     "snd-micdrop",
     "snd-tinfoil",
     "lt-1",
     "lt-2",
     "@prev",
     "lt-3",
     "lt-4",
     "lt-hide",
     "@next"
    ]
   },
   {
    "name": "Frame FX · Clips & graphics",
    "keys": [
     "fx-fire",
     "fx-ice",
     "fx-zap",
     "fx-smoke",
     "fx-sparks",
     "fx-shake",
     "fx-stop",
     "save-clip",
     "replay",
     "hide-stats",
     "@prev",
     "hide-text",
     null,
     null,
     "@next"
    ]
   },
   {
    "name": "Verdicts",
    "keys": [
     "fx-trash",
     "fx-facts",
     "fx-cooking",
     "fx-cap",
     "fx-bricked",
     "fx-airball",
     "fx-technical",
     "fx-posterized",
     "fx-onfire",
     "fx-clown",
     "@prev",
     null,
     null,
     null,
     "@next"
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-1",
     "face-2",
     "face-3",
     "face-4",
     "face-5",
     "face-6",
     "face-7",
     "face-8",
     "face-9",
     "face-10",
     "@prev",
     "avatar-toggle",
     "face-next",
     null,
     "@next"
    ]
   }
  ]
 },
 "xl": {
  "name": "Stream Deck XL (32 keys)",
  "file": "Elgato-Stream-Deck/AWYM-Stream-Deck-XL.streamDeckProfile",
  "cols": 8,
  "rows": 4,
  "pages": [
   {
    "name": "Run of show · Shot clock · Scoreboard · Names · Frame FX · Mute",
    "keys": [
     "next",
     "prev",
     "clear",
     "mark",
     "clock-toggle",
     "clock-reset",
     "clock-buzz",
     "clock-hide",
     "clock-foil",
     "score-a",
     "score-b",
     "score-show",
     "winner",
     "lt-1",
     "lt-2",
     "lt-3",
     "lt-4",
     "lt-hide",
     "fx-fire",
     "fx-ice",
     "fx-zap",
     "fx-smoke",
     "fx-sparks",
     "fx-shake",
     "mute-1",
     "mute-2",
     "mute-3",
     "mute-4",
     "unmute-all",
     "fx-stop",
     null,
     "@next"
    ]
   },
   {
    "name": "Sound board · Verdicts",
    "keys": [
     "snd-airhorn",
     "snd-buzzer",
     "snd-ding",
     "snd-wrong",
     "snd-rimshot",
     "snd-drumroll",
     "snd-ooh",
     "snd-applause",
     "snd-chaching",
     "snd-sadtrombone",
     "snd-scratch",
     "snd-swoosh",
     "snd-whistle",
     "snd-gong",
     "snd-boing",
     "snd-micdrop",
     "snd-tinfoil",
     "fx-trash",
     "fx-facts",
     "fx-cooking",
     "fx-cap",
     "fx-bricked",
     "fx-airball",
     "fx-technical",
     "@prev",
     "fx-posterized",
     "fx-onfire",
     "fx-clown",
     null,
     null,
     null,
     "@next"
    ]
   },
   {
    "name": "Clips & graphics · Faces",
    "keys": [
     "save-clip",
     "replay",
     "hide-stats",
     "hide-text",
     "face-1",
     "face-2",
     "face-3",
     "face-4",
     "face-5",
     "face-6",
     "face-7",
     "face-8",
     "face-9",
     "face-10",
     "avatar-toggle",
     "face-next",
     null,
     null,
     null,
     null,
     null,
     null,
     null,
     null,
     "@prev",
     null,
     null,
     null,
     null,
     null,
     null,
     "@next"
    ]
   }
  ]
 },
 "mini": {
  "name": "Stream Deck Mini (6 keys)",
  "file": "Elgato-Stream-Deck/AWYM-Stream-Deck-Mini.streamDeckProfile",
  "cols": 3,
  "rows": 2,
  "pages": [
   {
    "name": "Run of show · Mute",
    "keys": [
     "next",
     "prev",
     "clear",
     "mute-1",
     "mute-2",
     "@next"
    ]
   },
   {
    "name": "Run of show · Shot clock",
    "keys": [
     "mark",
     "clock-toggle",
     "clock-reset",
     "@prev",
     "clock-buzz",
     "@next"
    ]
   },
   {
    "name": "Shot clock",
    "keys": [
     "clock-hide",
     "clock-foil",
     null,
     "@prev",
     null,
     "@next"
    ]
   },
   {
    "name": "Scoreboard",
    "keys": [
     "score-a",
     "score-b",
     "score-show",
     "@prev",
     "winner",
     "@next"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-airhorn",
     "snd-buzzer",
     "snd-ding",
     "@prev",
     "snd-wrong",
     "@next"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-rimshot",
     "snd-drumroll",
     "snd-ooh",
     "@prev",
     "snd-applause",
     "@next"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-chaching",
     "snd-sadtrombone",
     "snd-scratch",
     "@prev",
     "snd-swoosh",
     "@next"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-whistle",
     "snd-gong",
     "snd-boing",
     "@prev",
     "snd-micdrop",
     "@next"
    ]
   },
   {
    "name": "Sound board · Names",
    "keys": [
     "snd-tinfoil",
     "lt-1",
     "lt-2",
     "@prev",
     "lt-3",
     "@next"
    ]
   },
   {
    "name": "Names",
    "keys": [
     "lt-4",
     "lt-hide",
     null,
     "@prev",
     null,
     "@next"
    ]
   },
   {
    "name": "Frame FX",
    "keys": [
     "fx-fire",
     "fx-ice",
     "fx-zap",
     "@prev",
     "fx-smoke",
     "@next"
    ]
   },
   {
    "name": "Frame FX",
    "keys": [
     "fx-sparks",
     "fx-shake",
     "fx-stop",
     "@prev",
     null,
     "@next"
    ]
   },
   {
    "name": "Verdicts",
    "keys": [
     "fx-trash",
     "fx-facts",
     "fx-cooking",
     "@prev",
     "fx-cap",
     "@next"
    ]
   },
   {
    "name": "Verdicts",
    "keys": [
     "fx-bricked",
     "fx-airball",
     "fx-technical",
     "@prev",
     "fx-posterized",
     "@next"
    ]
   },
   {
    "name": "Verdicts",
    "keys": [
     "fx-onfire",
     "fx-clown",
     null,
     "@prev",
     null,
     "@next"
    ]
   },
   {
    "name": "Clips & graphics",
    "keys": [
     "save-clip",
     "replay",
     "hide-stats",
     "@prev",
     "hide-text",
     "@next"
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-1",
     "face-2",
     "face-3",
     "@prev",
     "face-4",
     "@next"
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-5",
     "face-6",
     "face-7",
     "@prev",
     "face-8",
     "@next"
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-9",
     "face-10",
     "avatar-toggle",
     "@prev",
     "face-next",
     "@next"
    ]
   },
   {
    "name": "Mute",
    "keys": [
     "mute-3",
     "mute-4",
     "unmute-all",
     "@prev",
     null,
     "@next"
    ]
   }
  ]
 },
 "neo": {
  "name": "Stream Deck Neo (8 keys; its touch points change pages)",
  "file": "Elgato-Stream-Deck/AWYM-Stream-Deck-Neo.streamDeckProfile",
  "cols": 4,
  "rows": 2,
  "pages": [
   {
    "name": "Run of show · Mute",
    "keys": [
     "next",
     "prev",
     "clear",
     "mark",
     "mute-1",
     "mute-2",
     "mute-3",
     "mute-4"
    ]
   },
   {
    "name": "Shot clock · Sound board",
    "keys": [
     "clock-toggle",
     "clock-reset",
     "clock-buzz",
     "clock-hide",
     "clock-foil",
     "snd-airhorn",
     "snd-buzzer",
     "snd-ding"
    ]
   },
   {
    "name": "Scoreboard · Sound board",
    "keys": [
     "score-a",
     "score-b",
     "score-show",
     "winner",
     "snd-wrong",
     "snd-rimshot",
     "snd-drumroll",
     "snd-ooh"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-applause",
     "snd-chaching",
     "snd-sadtrombone",
     "snd-scratch",
     "snd-swoosh",
     "snd-whistle",
     "snd-gong",
     "snd-boing"
    ]
   },
   {
    "name": "Sound board · Names · Mute",
    "keys": [
     "snd-micdrop",
     "snd-tinfoil",
     "lt-1",
     "lt-2",
     "lt-3",
     "lt-4",
     "lt-hide",
     "unmute-all"
    ]
   },
   {
    "name": "Frame FX",
    "keys": [
     "fx-fire",
     "fx-ice",
     "fx-zap",
     "fx-smoke",
     "fx-sparks",
     "fx-shake",
     "fx-stop",
     null
    ]
   },
   {
    "name": "Verdicts",
    "keys": [
     "fx-trash",
     "fx-facts",
     "fx-cooking",
     "fx-cap",
     "fx-bricked",
     "fx-airball",
     "fx-technical",
     "fx-posterized"
    ]
   },
   {
    "name": "Verdicts · Clips & graphics",
    "keys": [
     "fx-onfire",
     "fx-clown",
     "save-clip",
     "replay",
     "hide-stats",
     "hide-text",
     null,
     null
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-1",
     "face-2",
     "face-3",
     "face-4",
     "face-5",
     "face-6",
     "face-7",
     "face-8"
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-9",
     "face-10",
     "avatar-toggle",
     "face-next",
     null,
     null,
     null,
     null
    ]
   }
  ]
 },
 "plus": {
  "name": "Stream Deck + (8 keys)",
  "file": "Elgato-Stream-Deck/AWYM-Stream-Deck-Plus.streamDeckProfile",
  "cols": 4,
  "rows": 2,
  "pages": [
   {
    "name": "Run of show · Mute",
    "keys": [
     "next",
     "prev",
     "clear",
     "mark",
     "mute-1",
     "mute-2",
     "mute-3",
     "@next"
    ]
   },
   {
    "name": "Shot clock",
    "keys": [
     "clock-toggle",
     "clock-reset",
     "clock-buzz",
     "clock-hide",
     "@prev",
     "clock-foil",
     null,
     "@next"
    ]
   },
   {
    "name": "Scoreboard · Mute",
    "keys": [
     "score-a",
     "score-b",
     "score-show",
     "winner",
     "@prev",
     "mute-4",
     "unmute-all",
     "@next"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-airhorn",
     "snd-buzzer",
     "snd-ding",
     "snd-wrong",
     "@prev",
     "snd-rimshot",
     "snd-drumroll",
     "@next"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-ooh",
     "snd-applause",
     "snd-chaching",
     "snd-sadtrombone",
     "@prev",
     "snd-scratch",
     "snd-swoosh",
     "@next"
    ]
   },
   {
    "name": "Sound board",
    "keys": [
     "snd-whistle",
     "snd-gong",
     "snd-boing",
     "snd-micdrop",
     "@prev",
     "snd-tinfoil",
     null,
     "@next"
    ]
   },
   {
    "name": "Names",
    "keys": [
     "lt-1",
     "lt-2",
     "lt-3",
     "lt-4",
     "@prev",
     "lt-hide",
     null,
     "@next"
    ]
   },
   {
    "name": "Frame FX",
    "keys": [
     "fx-fire",
     "fx-ice",
     "fx-zap",
     "fx-smoke",
     "@prev",
     "fx-sparks",
     "fx-shake",
     "@next"
    ]
   },
   {
    "name": "Frame FX · Verdicts",
    "keys": [
     "fx-stop",
     "fx-trash",
     "fx-facts",
     "fx-cooking",
     "@prev",
     "fx-cap",
     "fx-bricked",
     "@next"
    ]
   },
   {
    "name": "Verdicts",
    "keys": [
     "fx-airball",
     "fx-technical",
     "fx-posterized",
     "fx-onfire",
     "@prev",
     "fx-clown",
     null,
     "@next"
    ]
   },
   {
    "name": "Clips & graphics",
    "keys": [
     "save-clip",
     "replay",
     "hide-stats",
     "hide-text",
     "@prev",
     null,
     null,
     "@next"
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-1",
     "face-2",
     "face-3",
     "face-4",
     "@prev",
     "face-5",
     "face-6",
     "@next"
    ]
   },
   {
    "name": "Faces",
    "keys": [
     "face-7",
     "face-8",
     "face-9",
     "face-10",
     "@prev",
     "avatar-toggle",
     "face-next",
     "@next"
    ]
   }
  ]
 }
};
