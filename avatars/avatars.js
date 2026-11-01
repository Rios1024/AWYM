/**
 * avatars.js — the faces each seat can switch to instead of their live camera
 * ===========================================================================
 * Used by avatar.html (the layer between a camera and its frame), the Show
 * Runner's "Faces" section and the key pictures (hotkeys.js / hotkey-icons.html).
 *
 * To give someone faces: put square pictures (JPG / PNG / WebP, face in the
 * middle, about 1000 x 1000) in avatars/seat<N>/ and list them below in the
 * order you want. "bg" is the color behind the face (match the pictures'
 * background so the edges disappear).
 * Seat 1's faces also have hotkeys (Ctrl + Alt + Shift + F13 … F22) and their own
 * stream-deck page.
 */
window.AWYM_AVATARS = {
  "1": {
    bg: "#c7c7c7",
    faces: [
      { file: "seat1/01-smile.jpg", name: "Smile" },
      { file: "seat1/02-skeptical.jpg", name: "Skeptical" },
      { file: "seat1/03-shocked.jpg", name: "Shocked" },
      { file: "seat1/04-thinking.jpg", name: "Thinking" },
      { file: "seat1/05-happy.jpg", name: "Happy" },
      { file: "seat1/06-cringe.jpg", name: "Cringe" },
      { file: "seat1/07-unimpressed.jpg", name: "Unimpressed" },
      { file: "seat1/08-starstruck.jpg", name: "Starstruck" },
      { file: "seat1/09-facepalm.jpg", name: "Facepalm" },
      { file: "seat1/10-smug.jpg", name: "Smug" }
    ]
  }
  // "2": { bg: "#c7c7c7", faces: [ { file: "seat2/01-smile.png", name: "Smile" } ] },
};
