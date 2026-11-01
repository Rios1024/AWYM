"""avatars/thumbs.js: small embedded copies of every face in avatars/avatars.js, for the
key pictures (hotkey-icons.html can't export a canvas that has local files drawn on it,
but it can use these). Run after adding faces. Needs Node.js and Pillow."""
import base64, io, json, os, subprocess
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "avatars")
sets = json.loads(subprocess.run(["node", "-e", "global.window={}; require(%s); console.log(JSON.stringify(window.AWYM_AVATARS))" % json.dumps(os.path.join(A, "avatars.js"))], capture_output=True, text=True, check=True).stdout)
out = {}
for seat, s in sets.items():
    for f in s.get("faces", []):
        p = os.path.join(A, f["file"])
        if not os.path.exists(p): print("missing:", p); continue
        im = Image.open(p).convert("RGB"); im.thumbnail((192, 192), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "JPEG", quality=82, optimize=True)
        out[f["file"]] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
with open(os.path.join(A, "thumbs.js"), "w", encoding="utf-8") as fh:
    fh.write("/* Made by tools/make_face_thumbs.py: small copies of the faces for the key pictures. */\n")
    fh.write("window.AWYM_AVATAR_THUMBS = " + json.dumps(out, indent=0) + ";\n")
print(len(out), "thumbnails,", os.path.getsize(os.path.join(A, "thumbs.js")) // 1024, "KB")
