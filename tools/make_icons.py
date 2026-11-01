"""Render the key pictures in icons/hotkeys/ (144 x 144, default colors) with hotkey-icons.html.
Needs: pip install playwright && python -m playwright install chromium"""
import asyncio, base64, os, pathlib
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons", "hotkeys")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(pathlib.Path(ROOT, "hotkey-icons.html").as_uri()); await asyncio.sleep(1)
        files = await pg.evaluate("AWYM_ICONS.ready.then(() => AWYM_ICONS.render(144, {font: 'clean', shape: 'round'}))")
        for f in os.listdir(OUT):
            if f.endswith(".png"): os.remove(os.path.join(OUT, f))
        for f in files: open(os.path.join(OUT, f["name"]), "wb").write(base64.b64decode(f["dataURL"].split(",")[1]))
        print(len(files), "icons written", errs or ""); await b.close()
asyncio.run(main())
