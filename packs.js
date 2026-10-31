/**
 * packs.js — show packs: a ready-made look for each kind of show
 * ===============================================================
 * Each pack sets the background scene, lower-third badge icon, three fonts
 * and seven colors in one click. Used by theme-editor.html ("Show packs") and
 * theme-dock.html (Theme Panel). All fonts are free Google Fonts; all scenes
 * are original artwork (no official logos, characters or game art).
 *
 * Pack fields:
 *   key     unique id (lowercase, no spaces)
 *   name    shown on the button
 *   desc    what kind of show it suits (tooltip)
 *   scene   a key from backgrounds.js (window.AWYM_SCENES)
 *   icon    lower-third badge: ball, star, controller, note, dice, card, d20,
 *           sword, mic, bolt, crystal, vinyl, none
 *   fonts   { display, heading, body }  Google Fonts family names
 *   colors  { primary, secondary, accent, dark, light, "clock-digit", warning }
 *
 * To add your own pack, copy one entry, change the values, and save.
 */
window.AWYM_PACKS = [
  { key: "yomomma", name: "Argue with Yo Momma!", desc: "Basketball debate (the original)", scene: "court", icon: "ball",
    fonts: { display: "Bungee", heading: "Anton", body: "Barlow Condensed" },
    colors: { primary: "#F26B1D", secondary: "#2A1747", accent: "#FF3D7F", dark: "#120A1F", light: "#FFF4E0", "clock-digit": "#FFB23E", warning: "#FF2E3B" } },
  { key: "fightnight", name: "Fight Night", desc: "Fighting games (Tekken and friends)", scene: "fighter", icon: "bolt",
    fonts: { display: "Russo One", heading: "Teko", body: "Rajdhani" },
    colors: { primary: "#FF3B30", secondary: "#1A1C2B", accent: "#FFC93C", dark: "#08090F", light: "#F4F4F6", "clock-digit": "#FFC93C", warning: "#FF2E3B" } },
  { key: "retroarcade", name: "Retro Arcade", desc: "Retro and 8-bit games", scene: "retro", icon: "controller",
    fonts: { display: "Press Start 2P", heading: "VT323", body: "VT323" },
    colors: { primary: "#FF4F79", secondary: "#2B2D6E", accent: "#3DDC97", dark: "#0B0C24", light: "#F5F5F5", "clock-digit": "#FFD23F", warning: "#FF3B3B" } },
  { key: "crystalrealm", name: "Crystal Realm", desc: "Fantasy RPGs (Final Fantasy and friends)", scene: "fantasy", icon: "crystal",
    fonts: { display: "Cinzel Decorative", heading: "Cinzel", body: "Cormorant Garamond" },
    colors: { primary: "#7FD4FF", secondary: "#241E5C", accent: "#E8C66A", dark: "#0B0A24", light: "#F3F0FF", "clock-digit": "#7FD4FF", warning: "#FF5A7A" } },
  { key: "theclimb", name: "The Climb", desc: "Roguelike deckbuilders (Slay the Spire and friends)", scene: "spire", icon: "sword",
    fonts: { display: "Pirata One", heading: "Eczar", body: "Rubik" },
    colors: { primary: "#E05A3A", secondary: "#2E2438", accent: "#6FD6C8", dark: "#120E17", light: "#F1E9DB", "clock-digit": "#F0B44C", warning: "#FF3B30" } },
  { key: "tabletop", name: "Tabletop Quest", desc: "Dungeons & Dragons and tabletop RPGs", scene: "tabletop", icon: "d20",
    fonts: { display: "MedievalSharp", heading: "Cinzel", body: "Crimson Pro" },
    colors: { primary: "#C0392B", secondary: "#3B2A1E", accent: "#D4A64A", dark: "#1A120C", light: "#F4E9D3", "clock-digit": "#E8B04B", warning: "#FF4136" } },
  { key: "gamenight", name: "Game Night", desc: "Board games", scene: "boardgame", icon: "dice",
    fonts: { display: "Lilita One", heading: "Fredoka", body: "Nunito" },
    colors: { primary: "#F6A623", secondary: "#24405E", accent: "#E9573F", dark: "#13202F", light: "#FFF8EC", "clock-digit": "#F6A623", warning: "#FF4D4D" } },
  { key: "cardtable", name: "Card Table", desc: "Card games, TCGs and poker", scene: "cards", icon: "card",
    fonts: { display: "Playfair Display SC", heading: "Playfair Display", body: "Josefin Sans" },
    colors: { primary: "#D9B65D", secondary: "#0F4D3A", accent: "#C8323C", dark: "#06261C", light: "#F6F1E4", "clock-digit": "#D9B65D", warning: "#FF3B3B" } },
  { key: "studio", name: "Studio", desc: "Music shows", scene: "music", icon: "note",
    fonts: { display: "Monoton", heading: "Bebas Neue", body: "Space Grotesk" },
    colors: { primary: "#8A5CFF", secondary: "#171A2B", accent: "#2FE6C8", dark: "#0A0C14", light: "#EEF1FF", "clock-digit": "#2FE6C8", warning: "#FF4D6D" } },
  { key: "blockparty", name: "Block Party", desc: "Hip-hop", scene: "hiphop", icon: "mic",
    fonts: { display: "Permanent Marker", heading: "Anton", body: "Archivo Narrow" },
    colors: { primary: "#FFCC00", secondary: "#1C1C24", accent: "#FF3366", dark: "#0A0A0E", light: "#FFFFFF", "clock-digit": "#FFCC00", warning: "#FF3B3B" } },
  { key: "sakura", name: "Sakura", desc: "Anime", scene: "anime", icon: "star",
    fonts: { display: "Mochiy Pop One", heading: "Zen Maru Gothic", body: "Quicksand" },
    colors: { primary: "#FF7AA2", secondary: "#2C2350", accent: "#7EE0FF", dark: "#161230", light: "#FFF6FA", "clock-digit": "#FF7AA2", warning: "#FF3B5C" } },
  { key: "synthwave", name: "Synthwave", desc: "Neon retro-future, any topic", scene: "synthwave", icon: "bolt",
    fonts: { display: "Orbitron", heading: "Teko", body: "Rajdhani" },
    colors: { primary: "#FF2E97", secondary: "#2B0B4A", accent: "#2DE2E6", dark: "#0D0221", light: "#F9F1FF", "clock-digit": "#FF9E3D", warning: "#FF3B3B" } },
  { key: "neonflow", name: "Neon Flow", desc: "Abstract generative art, any topic", scene: "flow", icon: "star",
    fonts: { display: "Syne", heading: "Outfit", body: "Outfit" },
    colors: { primary: "#00E5A0", secondary: "#1B1640", accent: "#7B61FF", dark: "#0B0A1A", light: "#F4F4FF", "clock-digit": "#00E5A0", warning: "#FF4D6D" } },
  { key: "tinfoil", name: "Tin Foil Hat", desc: "Conspiracy theories (the Tin Foil segment as a whole show)", scene: "tinfoil", icon: "bolt",
    fonts: { display: "Special Elite", heading: "Oswald", body: "Courier Prime" },
    colors: { primary: "#D7263D", secondary: "#2E2A24", accent: "#7CFF6B", dark: "#15130F", light: "#F6EEDB", "clock-digit": "#7CFF6B", warning: "#FF3B3B" } },
  { key: "chalk", name: "Chalk Talk", desc: "X's and O's on the coach's chalkboard", scene: "chalktalk", icon: "ball",
    fonts: { display: "Permanent Marker", heading: "Oswald", body: "Barlow Condensed" },
    colors: { primary: "#F4E285", secondary: "#24382E", accent: "#FF8FA3", dark: "#111D17", light: "#F2F5EE", "clock-digit": "#F4E285", warning: "#FF6B6B" } },
  { key: "vapor", name: "Vaporwave", desc: "Pastel retro-future, any topic", scene: "vaporwave", icon: "star",
    fonts: { display: "Monoton", heading: "Teko", body: "Rajdhani" },
    colors: { primary: "#FF71CE", secondary: "#2B1B5A", accent: "#01CDFE", dark: "#120B2E", light: "#FFFBFF", "clock-digit": "#05FFA1", warning: "#FF3B6B" } },
  { key: "pastel", name: "Pastel Aurora", desc: "Soft abstract color, any topic", scene: "aurora", icon: "star",
    fonts: { display: "Righteous", heading: "Outfit", body: "Outfit" },
    colors: { primary: "#FF9AA2", secondary: "#3A2E6E", accent: "#A0E7E5", dark: "#1A1433", light: "#FFFFFF", "clock-digit": "#FFDAC1", warning: "#FF5C7A" } }
];
/* Body fonts here that have 400, 500, 600 and 700 weights (safe to ask Google for all four). */
/* Fonts in this list are loaded with weights 400–700 when used for body text.
   Others load just their regular weight (asking Google for weights a font
   doesn't have makes the whole request fail). */
window.AWYM_BODY_WEIGHT_FONTS = ["Barlow Condensed", "Roboto Condensed", "Oswald", "Saira Condensed", "Archivo Narrow", "IBM Plex Sans Condensed",
  "Encode Sans Condensed", "Rajdhani", "Kanit", "Exo 2", "Montserrat", "Inter", "Cormorant Garamond", "Rubik", "Crimson Pro", "Nunito",
  "Josefin Sans", "Space Grotesk", "Quicksand", "Outfit"];
