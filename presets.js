/**
 * presets.js — color presets, suggested fonts, and the theme.css writer
 * =====================================================================
 * Shared by theme-editor.html and theme-dock.html (Theme Panel).
 *
 *   window.AWYM_PRESET_CATEGORIES  [{ name, presets: { "Preset name": colors } }]  presets by category
 *                              (pickers show a heading per category). Add your own: copy a line
 *                              into a category, rename it, change the hex codes.
 *   window.AWYM_COLOR_PRESETS  { "Preset name": {primary, secondary, accent, dark, light, "clock-digit", warning} }
 *                              every preset in one list (built from the categories)
 *   window.AWYM_FONT_LISTS     { display: [...], heading: [...], body: [...] }  Google Fonts names
 *                              suggested for each job (any Google Font works when typed in).
 *   window.AWYM_THEME_FILE(t)  the full text of a theme.css for theme object t
 *                              (the same keys AWYM.applyTheme accepts, see shared.js)
 */
/* Color presets, by category. Within each category they are listed A–Z
   ("Show" keeps the default first). The NBA sets only borrow team colors:
   no team names or logos ever appear on screen. */
window.AWYM_PRESET_CATEGORIES = [
  { name: "Show", presets: {
    "Yo Momma (default)": { primary: "#F26B1D", secondary: "#2A1747", accent: "#FF3D7F", dark: "#120A1F", light: "#FFF4E0", "clock-digit": "#FFB23E", warning: "#FF2E3B" },
    "Momma's Kitchen": { primary: "#E63946", secondary: "#1D3557", accent: "#F4D35E", dark: "#0E1A2B", light: "#FFF8E7", "clock-digit": "#F4D35E", warning: "#FF2E3B" }
  } },
  { name: "NBA teams (inspired)", presets: {
    "76ers-Inspired": { primary: "#ED174C", secondary: "#006BB6", accent: "#FFFFFF", dark: "#001834", light: "#FFFFFF", "clock-digit": "#ED174C", warning: "#FFC72C" },
    "Bucks-Inspired": { primary: "#EEE1C6", secondary: "#00471B", accent: "#0077C0", dark: "#00200C", light: "#FFFFFF", "clock-digit": "#EEE1C6", warning: "#FF3B3B" },
    "Bulls-Inspired": { primary: "#CE1141", secondary: "#1A1A1A", accent: "#FFFFFF", dark: "#0A0A0A", light: "#FFFFFF", "clock-digit": "#CE1141", warning: "#FFC72C" },
    "Cavaliers-Inspired": { primary: "#FDBB30", secondary: "#860038", accent: "#FFFFFF", dark: "#1F0A12", light: "#FFFFFF", "clock-digit": "#FDBB30", warning: "#FF3B3B" },
    "Celtics-Inspired": { primary: "#1FA351", secondary: "#007A33", accent: "#BA9653", dark: "#05170D", light: "#FFFFFF", "clock-digit": "#BA9653", warning: "#FF3B3B" },
    "Clippers-Inspired": { primary: "#C8102E", secondary: "#1D428A", accent: "#FFFFFF", dark: "#0A1A3A", light: "#FFFFFF", "clock-digit": "#C8102E", warning: "#FFC72C" },
    "Grizzlies-Inspired": { primary: "#7D9CD6", secondary: "#12173F", accent: "#F5B112", dark: "#080A1F", light: "#FFFFFF", "clock-digit": "#F5B112", warning: "#FF3B3B" },
    "Hawks-Inspired": { primary: "#E03A3E", secondary: "#26282A", accent: "#C1D32F", dark: "#121314", light: "#FFFFFF", "clock-digit": "#C1D32F", warning: "#FFC72C" },
    "Heat-Inspired": { primary: "#D0103A", secondary: "#1A1A1A", accent: "#F9A01B", dark: "#0A0A0A", light: "#FFFFFF", "clock-digit": "#F9A01B", warning: "#FF2E2E" },
    "Hornets-Inspired": { primary: "#00A3B4", secondary: "#1D1160", accent: "#A1A1A4", dark: "#0C0733", light: "#FFFFFF", "clock-digit": "#00A3B4", warning: "#FF3B3B" },
    "Jazz-Inspired": { primary: "#F9A01B", secondary: "#002B5C", accent: "#3DB86B", dark: "#00132B", light: "#FFFFFF", "clock-digit": "#F9A01B", warning: "#FF3B3B" },
    "Kings-Inspired": { primary: "#C4CED4", secondary: "#5A2D81", accent: "#A982D9", dark: "#1B0D29", light: "#FFFFFF", "clock-digit": "#C4CED4", warning: "#FF3B3B" },
    "Knicks-Inspired": { primary: "#F58426", secondary: "#006BB6", accent: "#BEC0C2", dark: "#0A1A33", light: "#FFFFFF", "clock-digit": "#F58426", warning: "#FF3B3B" },
    "Lakers-Inspired": { primary: "#FDB927", secondary: "#552583", accent: "#B794F4", dark: "#1E0B33", light: "#FFFFFF", "clock-digit": "#FDB927", warning: "#FF3B3B" },
    "Magic-Inspired": { primary: "#1A8FE0", secondary: "#0B1F3A", accent: "#C4CED4", dark: "#050E1C", light: "#FFFFFF", "clock-digit": "#1A8FE0", warning: "#FF3B3B" },
    "Mavericks-Inspired": { primary: "#1E7FCB", secondary: "#002B5E", accent: "#B8C4CA", dark: "#001330", light: "#FFFFFF", "clock-digit": "#B8C4CA", warning: "#FF3B3B" },
    "Nets-Inspired": { primary: "#FFFFFF", secondary: "#2B2B2B", accent: "#A1A1A4", dark: "#000000", light: "#FFFFFF", "clock-digit": "#FFFFFF", warning: "#FF3B3B" },
    "Nuggets-Inspired": { primary: "#FEC524", secondary: "#0E2240", accent: "#C8384B", dark: "#06111F", light: "#FFFFFF", "clock-digit": "#FEC524", warning: "#FF3B3B" },
    "Pacers-Inspired": { primary: "#FDBB30", secondary: "#002D62", accent: "#BEC0C2", dark: "#00142E", light: "#FFFFFF", "clock-digit": "#FDBB30", warning: "#FF3B3B" },
    "Pelicans-Inspired": { primary: "#C8102E", secondary: "#0C2340", accent: "#B9A06A", dark: "#05101F", light: "#FFFFFF", "clock-digit": "#B9A06A", warning: "#FFC72C" },
    "Pistons-Inspired": { primary: "#C8102E", secondary: "#1D42BA", accent: "#BEC0C2", dark: "#0B1533", light: "#FFFFFF", "clock-digit": "#C8102E", warning: "#FFC72C" },
    "Raptors-Inspired": { primary: "#CE1141", secondary: "#1C1C1E", accent: "#B4975A", dark: "#0B0B0C", light: "#FFFFFF", "clock-digit": "#CE1141", warning: "#FFC72C" },
    "Rockets-Inspired": { primary: "#CE1141", secondary: "#2A2A2E", accent: "#C4CED4", dark: "#111113", light: "#FFFFFF", "clock-digit": "#CE1141", warning: "#FFC72C" },
    "Spurs-Inspired": { primary: "#C4CED4", secondary: "#2A2A2A", accent: "#00B2A9", dark: "#0F0F0F", light: "#FFFFFF", "clock-digit": "#C4CED4", warning: "#FF3B3B" },
    "Suns-Inspired": { primary: "#E56020", secondary: "#1D1160", accent: "#F9AD1B", dark: "#0B0624", light: "#FFFFFF", "clock-digit": "#F9AD1B", warning: "#FF3B3B" },
    "Thunder-Inspired": { primary: "#EF3B24", secondary: "#002D62", accent: "#2E9BE6", dark: "#00142E", light: "#FFFFFF", "clock-digit": "#FDBB30", warning: "#FF3B3B" },
    "Timberwolves-Inspired": { primary: "#78BE20", secondary: "#0C2340", accent: "#4D90CD", dark: "#05101F", light: "#FFFFFF", "clock-digit": "#78BE20", warning: "#FF3B3B" },
    "Trail Blazers-Inspired": { primary: "#E03A3E", secondary: "#1F1F1F", accent: "#FFFFFF", dark: "#0A0A0A", light: "#FFFFFF", "clock-digit": "#E03A3E", warning: "#FFC72C" },
    "Warriors-Inspired": { primary: "#FFC72C", secondary: "#1D428A", accent: "#FFFFFF", dark: "#0B1A3A", light: "#FFFFFF", "clock-digit": "#FFC72C", warning: "#FF3B3B" },
    "Wizards-Inspired": { primary: "#E31837", secondary: "#002B5C", accent: "#C4CED4", dark: "#00132B", light: "#FFFFFF", "clock-digit": "#E31837", warning: "#FFC72C" }
  } },
  { name: "Basketball", presets: {
    "All-Star Weekend": { primary: "#2FB8FF", secondary: "#2A1D4E", accent: "#FF4FB0", dark: "#130D2A", light: "#FFFFFF", "clock-digit": "#FFE14D", warning: "#FF3B5C" },
    "Carolina Sky": { primary: "#7BAFD4", secondary: "#13294B", accent: "#FFFFFF", dark: "#091A33", light: "#F4F9FF", "clock-digit": "#7BAFD4", warning: "#FF5A5F" },
    "Chalkboard": { primary: "#F4E285", secondary: "#24382E", accent: "#FFFFFF", dark: "#111D17", light: "#F2F5EE", "clock-digit": "#F4E285", warning: "#FF6B6B" },
    "Championship Gold": { primary: "#F2C14E", secondary: "#14213D", accent: "#E5E5E5", dark: "#0A1124", light: "#FFFFFF", "clock-digit": "#F2C14E", warning: "#FF4040" },
    "Classic Court": { primary: "#F47A20", secondary: "#0F2240", accent: "#FFFFFF", dark: "#07111F", light: "#F5F7FA", "clock-digit": "#FF9B2F", warning: "#FF3030" },
    "Concrete Court": { primary: "#FF8A3D", secondary: "#3A3F47", accent: "#D7DCE2", dark: "#1B1E23", light: "#F5F6F8", "clock-digit": "#FF8A3D", warning: "#FF3B3B" },
    "Hardwood Classic": { primary: "#E28A3B", secondary: "#4A2C1A", accent: "#F3D9A4", dark: "#22140C", light: "#FFF6E8", "clock-digit": "#FFB547", warning: "#FF3B30" },
    "Heat Check": { primary: "#E8202E", secondary: "#1A1A1A", accent: "#F9A01B", dark: "#0A0A0A", light: "#FFFFFF", "clock-digit": "#F9A01B", warning: "#FF2E2E" },
    "Night Game": { primary: "#FDB927", secondary: "#3A1A6B", accent: "#B794F4", dark: "#140829", light: "#FFFFFF", "clock-digit": "#FDB927", warning: "#FF4D4D" },
    "Playoff Red": { primary: "#E21B3C", secondary: "#1A1D2B", accent: "#FFFFFF", dark: "#0B0C14", light: "#FFFFFF", "clock-digit": "#FF4560", warning: "#FFD23F" },
    "Purple & Gold": { primary: "#FDB927", secondary: "#552583", accent: "#FFFFFF", dark: "#1E0B33", light: "#FFFFFF", "clock-digit": "#FDB927", warning: "#FF4D4D" },
    "Streetball": { primary: "#C6FF2E", secondary: "#1C1C1C", accent: "#2EE6FF", dark: "#0A0A0A", light: "#F2F2F2", "clock-digit": "#C6FF2E", warning: "#FF3B3B" }
  } },
  { name: "Broadcast & classic", presets: {
    "Broadcast Blue": { primary: "#1D6FE0", secondary: "#0C1F3F", accent: "#E63946", dark: "#06112A", light: "#FFFFFF", "clock-digit": "#FFD166", warning: "#FF3B3B" },
    "Gold Standard": { primary: "#D4AF37", secondary: "#1C1C1C", accent: "#F5E6B8", dark: "#0D0D0D", light: "#FAF7EF", "clock-digit": "#D4AF37", warning: "#FF4040" },
    "Holiday": { primary: "#D62828", secondary: "#0B3D2E", accent: "#F7D774", dark: "#06201A", light: "#FFF8F0", "clock-digit": "#F7D774", warning: "#FF3B3B" },
    "Monochrome": { primary: "#FFFFFF", secondary: "#2A2A2A", accent: "#BDBDBD", dark: "#111111", light: "#F5F5F5", "clock-digit": "#FFFFFF", warning: "#FF4040" },
    "Newsroom": { primary: "#D7263D", secondary: "#1B2A4A", accent: "#F4F4F4", dark: "#0C1529", light: "#FFFFFF", "clock-digit": "#FFC857", warning: "#FF2E2E" }
  } },
  { name: "Conspiracy & spooky", presets: {
    "Area 51": { primary: "#39FF14", secondary: "#14261A", accent: "#B8FFB0", dark: "#050D07", light: "#E9FFE6", "clock-digit": "#39FF14", warning: "#FF3B3B" },
    "Blood Moon": { primary: "#C1121F", secondary: "#2B0A0F", accent: "#FDB833", dark: "#120407", light: "#FDF0D5", "clock-digit": "#FDB833", warning: "#FF2E2E" },
    "Classified": { primary: "#C1272D", secondary: "#2E2A24", accent: "#E8D9B5", dark: "#15130F", light: "#F6EEDB", "clock-digit": "#E8D9B5", warning: "#FF3B3B" },
    "Halloween": { primary: "#FF7518", secondary: "#1B1B1B", accent: "#8E44AD", dark: "#0B0B0B", light: "#F7F1E3", "clock-digit": "#FF7518", warning: "#FF2E2E" },
    "Tin Foil": { primary: "#C9D1D9", secondary: "#2B3138", accent: "#7CFF6B", dark: "#121519", light: "#F5F7FA", "clock-digit": "#7CFF6B", warning: "#FF3B3B" }
  } },
  { name: "Cool", presets: {
    "Deep Sea": { primary: "#00C2C7", secondary: "#0A2A43", accent: "#FF9F68", dark: "#04131F", light: "#E8FBFF", "clock-digit": "#00C2C7", warning: "#FF4F5E" },
    "Emerald": { primary: "#2ECC71", secondary: "#0B3D2E", accent: "#F1C40F", dark: "#06201A", light: "#F2FFF7", "clock-digit": "#2ECC71", warning: "#FF4D4D" },
    "Forest Camp": { primary: "#8BC34A", secondary: "#2B3A22", accent: "#FFB74D", dark: "#141C10", light: "#F4F1E1", "clock-digit": "#FFB74D", warning: "#FF5252" },
    "Ice Cold": { primary: "#7FDBFF", secondary: "#0E2A47", accent: "#FFFFFF", dark: "#06182B", light: "#EAF6FF", "clock-digit": "#7FDBFF", warning: "#FF5A5F" },
    "Mint Chip": { primary: "#3EB489", secondary: "#2A2D34", accent: "#F7F7F2", dark: "#16181D", light: "#FFFFFF", "clock-digit": "#3EB489", warning: "#FF5C5C" },
    "Ocean Breeze": { primary: "#2EC4B6", secondary: "#0F3B57", accent: "#FFBF69", dark: "#081F30", light: "#F4FBFF", "clock-digit": "#2EC4B6", warning: "#FF5C5C" },
    "Slate & Coral": { primary: "#FF6F61", secondary: "#2F3E4E", accent: "#9AD1D4", dark: "#151E28", light: "#F7FAFC", "clock-digit": "#FF9F8F", warning: "#FF3B3B" }
  } },
  { name: "Neon & retro", presets: {
    "Cyberpunk": { primary: "#FCEE0A", secondary: "#1B1F2A", accent: "#00F0FF", dark: "#0A0C12", light: "#F2F2F2", "clock-digit": "#FCEE0A", warning: "#FF003C" },
    "Electric Lime": { primary: "#D4FF00", secondary: "#232A1A", accent: "#8A5CFF", dark: "#0E120A", light: "#F7FFE0", "clock-digit": "#D4FF00", warning: "#FF3B3B" },
    "Galaxy": { primary: "#7B2CBF", secondary: "#10002B", accent: "#E0AAFF", dark: "#05000F", light: "#F8F0FF", "clock-digit": "#C77DFF", warning: "#FF4D6D" },
    "Matrix": { primary: "#00FF41", secondary: "#0D1F12", accent: "#9DFFB0", dark: "#020A04", light: "#E8FFE9", "clock-digit": "#00FF41", warning: "#FF3B3B" },
    "Miami Nights": { primary: "#FF5EAE", secondary: "#14305E", accent: "#35E0E8", dark: "#0A1630", light: "#FFFFFF", "clock-digit": "#35E0E8", warning: "#FF3B5C" },
    "Midnight Neon": { primary: "#00F0FF", secondary: "#120A2E", accent: "#FF00C8", dark: "#07041A", light: "#F2F7FF", "clock-digit": "#00F0FF", warning: "#FF3B6B" },
    "Toxic": { primary: "#A3FF12", secondary: "#2A0F3D", accent: "#FF2ECF", dark: "#12061C", light: "#F6FFE8", "clock-digit": "#A3FF12", warning: "#FF3B3B" },
    "Vaporwave": { primary: "#FF71CE", secondary: "#2B1B5A", accent: "#01CDFE", dark: "#120B2E", light: "#FFFBFF", "clock-digit": "#05FFA1", warning: "#FF3B6B" }
  } },
  { name: "Playful & pastel", presets: {
    "Candy Shop": { primary: "#FF6FB5", secondary: "#3E1F5C", accent: "#7BDFF2", dark: "#1E0F2E", light: "#FFF5FB", "clock-digit": "#FFD166", warning: "#FF3B6B" },
    "Grape Soda": { primary: "#B388FF", secondary: "#2D1650", accent: "#FF80AB", dark: "#170A2E", light: "#F8F2FF", "clock-digit": "#B388FF", warning: "#FF4F79" },
    "Lemon Drop": { primary: "#FFE74C", secondary: "#2C2A4A", accent: "#FF5964", dark: "#16152A", light: "#FFFFFF", "clock-digit": "#FFE74C", warning: "#FF3B3B" },
    "Pastel Dream": { primary: "#FFB5C2", secondary: "#3B3561", accent: "#A8E6CF", dark: "#1E1B35", light: "#FFFFFF", "clock-digit": "#FFDAC1", warning: "#FF6B81" },
    "Royal Velvet": { primary: "#9B5DE5", secondary: "#1F1147", accent: "#F15BB5", dark: "#0E0726", light: "#FBF8FF", "clock-digit": "#FEE440", warning: "#FF4D6D" }
  } },
  { name: "Warm", presets: {
    "Cherry Cola": { primary: "#E0475B", secondary: "#3B1219", accent: "#F2C3A7", dark: "#1C080C", light: "#FFF1EC", "clock-digit": "#F2C3A7", warning: "#FF2E3B" },
    "Coffeehouse": { primary: "#C08552", secondary: "#3C2A21", accent: "#E8C39E", dark: "#1E1410", light: "#FFF8F0", "clock-digit": "#E8C39E", warning: "#FF5A4E" },
    "Desert Sand": { primary: "#E07A5F", secondary: "#3D405B", accent: "#F2CC8F", dark: "#1F2133", light: "#F4F1DE", "clock-digit": "#F2CC8F", warning: "#FF4D4D" },
    "Fire & Ice": { primary: "#FF5E3A", secondary: "#122B47", accent: "#5BC0EB", dark: "#0A1726", light: "#F5FAFF", "clock-digit": "#FFB347", warning: "#FF2E3B" },
    "Peach Fuzz": { primary: "#FFA477", secondary: "#3F2E4A", accent: "#FFE3C2", dark: "#1F1626", light: "#FFF7F0", "clock-digit": "#FFC9A3", warning: "#FF4D6D" },
    "Sunset Boulevard": { primary: "#FF7B54", secondary: "#3D1E4D", accent: "#FFB26B", dark: "#1F0E2A", light: "#FFF3E6", "clock-digit": "#FFD56B", warning: "#FF3B5C" }
  } }
];
/* The same presets as one list ({ "Preset name": colors }), in category order. */
window.AWYM_COLOR_PRESETS = Object.assign({}, ...window.AWYM_PRESET_CATEGORIES.map((c) => c.presets));

/* Suggested fonts for each of the three font jobs:
   display = show title, tags, "VS" · heading = names, scores, numbers · body = small text */
window.AWYM_FONT_LISTS = {
  display: ["Bungee", "Bebas Neue", "Anton", "Bowlby One SC", "Black Ops One", "Russo One", "Graduate", "Bangers", "Luckiest Guy",
    "Rubik Mono One", "Alfa Slab One", "Racing Sans One", "Righteous", "Permanent Marker", "Shrikhand", "Teko", "Bungee Inline",
    "Press Start 2P", "Special Elite", "Orbitron", "Cinzel Decorative", "Pirata One", "MedievalSharp", "Lilita One", "Playfair Display SC", "Monoton", "Mochiy Pop One", "Syne"],
  heading: ["Anton", "Bebas Neue", "Oswald", "League Gothic", "Teko", "Big Shoulders Display", "Staatliches", "Fjalla One",
    "Saira Condensed", "Archivo Black", "Squada One", "Alumni Sans", "Graduate", "Barlow Condensed",
    "VT323", "Cinzel", "Eczar", "Fredoka", "Playfair Display", "Zen Maru Gothic", "Outfit"],
  body: ["Barlow Condensed", "Roboto Condensed", "Oswald", "Saira Condensed", "Archivo Narrow", "IBM Plex Sans Condensed",
    "Encode Sans Condensed", "Rajdhani", "Kanit", "Exo 2", "Montserrat", "Inter",
    "Rubik", "Nunito", "Quicksand", "Space Grotesk", "Outfit", "Josefin Sans", "Crimson Pro", "Cormorant Garamond"]
};

/* The full theme.css text for a theme object, used by "Copy as theme.css". */
window.AWYM_THEME_FILE = function (t) {
  const W = window.AWYM_BODY_WEIGHT_FONTS || [];
  const url = (f, w) => "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(f).replace(/%20/g, "+") + (w ? ":wght@400;500;600;700" : "") + "&display=swap";
  const imports = [...new Set([url(t["font-display"]), url(t["font-heading"]), url(t["font-body"], W.includes(t["font-body"]))])].map((u) => '@import url("' + u + '");').join("\n");
  return `/* ==========================================================================
   ${String(t["show-name"] || "").toUpperCase()}  —  THEME FILE
   --------------------------------------------------------------------------
   This is the ONLY file you need to edit to change fonts, colors or the
   show name. Every overlay reads from it. Use theme-editor.html or the
   Theme Panel dock in OBS. After replacing this file, right-click each OBS
   browser source → Refresh.
   ========================================================================== */

/* --- Fonts (loaded from Google Fonts) --- */
${imports}

:root {
  --font-display: "${t["font-display"]}", Impact, sans-serif;  /* show title, tags, "VS" */
  --font-heading: "${t["font-heading"]}", Impact, sans-serif;  /* names, scores, numbers, card titles */
  --font-body:    "${t["font-body"]}", "Arial Narrow", Arial, sans-serif;  /* roles, labels, small text */
}

/* --- Show name and colors --- */
:root {
  /* Show name (keep the quotes) — shown on the background */
  --show-name: ${JSON.stringify(t["show-name"] || "")};

  /* Default background scene and lower-third badge (keep the quotes) */
  --scene: ${JSON.stringify(t.scene || "court")};
  --badge-icon: ${JSON.stringify(t["badge-icon"] || "ball")};

  /* Main colors */
  --primary:     ${t.primary};  /* jersey numbers, borders, highlights */
  --secondary:   ${t.secondary};  /* panel backgrounds */
  --accent:      ${t.accent};  /* role text, tags, small pops of color */

  /* Neutrals */
  --dark:        ${t.dark};  /* darkest background (clock housing) */
  --light:       ${t.light};  /* main text color */

  /* Shot clock */
  --clock-digit: ${t["clock-digit"]};  /* lit clock digits */
  --warning:     ${t.warning};  /* digits + glow in the final 10 seconds */
${t["title-size"] ? `
  /* Background title size (100 = normal) */
  --title-size: ${JSON.stringify(t["title-size"])};
` : ""}${t.glow != null && t.glow !== "" ? `
  /* Glow strength in percent (0 = none, 100 = normal, 200 = double) */
  --glow: ${JSON.stringify(String(t.glow))};
` : ""}${t["bg-anim"] != null || t["bg-speed"] || t["bg-intensity"] || t["bg-court"] ? `
  /* Background animation (Main Show) */
${t["bg-anim"] != null ? `  --bg-anim: ${JSON.stringify(t["bg-anim"])};       /* extra effects, e.g. "arena" or "drift,flashes" or "none" */\n` : ""}${t["bg-speed"] ? `  --bg-speed: ${JSON.stringify(t["bg-speed"])};        /* 0.25 to 2 */\n` : ""}${t["bg-intensity"] ? `  --bg-intensity: ${JSON.stringify(t["bg-intensity"])};  /* low, medium or high */\n` : ""}${t["bg-court"] ? `  --bg-court: ${JSON.stringify(t["bg-court"])};         /* court lines: "1" on, "0" off */\n` : ""}` : ""}}
`;
};
