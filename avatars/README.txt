FACES (AVATARS) INSTEAD OF A LIVE CAMERA
========================================
Each seat can swap its live camera for a set of pictures: a cartoon you, a
reaction face, a "be right back" picture… The frame, name plate, speaking
light and effects all stay on top.

  seat1/       Seat 1's faces (Smile, Skeptical, Shocked, Thinking, Happy,
               Cringe, Unimpressed, Starstruck, Facepalm, Smug). The ones in
               the download are emoji placeholders: replace them with your
               own pictures, same file names (then, for the key pictures,
               run tools/make_face_thumbs.py and tools/make_icons.py)
  avatars.js   the list of faces for each seat

Switch faces in the Show Runner (Faces section), with the hotkeys
(seat 1: Ctrl + Alt + Shift + F13 … F22 for the faces, D for face/camera,
J for the next face) or on the Faces page of the ready-made stream-deck
layouts. Picking a face turns the face on; "Live camera" switches back.

ADDING FACES (any seat)
  1. Put square pictures in avatars/seat2/ (or seat3, seat4): face in the
     middle, about 1000 x 1000, JPG / PNG / WebP.
  2. Open avatars.js in a text editor and list them, like seat 1.
  3. Reload the Avatar source in OBS (right-click → Refresh) and the Show
     Runner dock.
