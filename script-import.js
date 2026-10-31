/**
 * script-import.js — turn a writer's show script into segments and on-screen pieces
 * ==================================================================================
 * Used by content-panel.html ("Import a script"). Reads:
 *   - text copied from Google Docs or Word and pasted (HTML on the clipboard)
 *   - a Markdown file (.md: Google Docs → File → Download → Markdown), or plain text
 *   - a web page (.html / .htm: File → Download → Web page, the .html inside the zip)
 *   - a Word file (.docx: Google Docs → File → Download → Microsoft Word), photos included
 *
 * How the script is laid out (see templates/README.txt):
 *   Heading 1   a SEGMENT. "Hot Takes (5 min)" sets its length. A short first line
 *               under it (before any Heading 2) becomes its intro line.
 *   Heading 2   a PIECE: one on-screen card. The heading is the card's header; the
 *               text under it (bold, italics, underline, lists, photos) is the card.
 *   Heading 3+  big text inside a piece.
 *   A divider   (horizontal line, or --- in Markdown) starts a new piece with no header.
 *   "Note: …"   a paragraph starting with Note: (or Host note:) is left out.
 *   No Heading 1 at all: everything goes in one segment named after the document.
 *
 * window.AWYM_IMPORT:
 *   fromFile(file)          → Promise<script>   (.md .markdown .txt .html .htm .docx)
 *   fromHTML(html, title)   → script            (e.g. pasted from Google Docs)
 *   fromMarkdown(text, title) → script
 *   fromDocx(arrayBuffer, title) → Promise<script>
 *   script = { title, segments: [{ name, minutes, desc, pieces: [{ header, html }] }] }
 *   (html is raw here; the Content Panel cleans it with AWYM.cleanHTML.)
 */
(function () {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const BLOCK = /^(P|DIV|H[1-6]|UL|OL|LI|HR|TABLE|TBODY|THEAD|TR|TD|TH|BLOCKQUOTE|SECTION|ARTICLE|HEADER|FOOTER|MAIN|PRE|BODY)$/;

  /* ---------------- HTML → blocks ---------------- */
  /** Inline HTML for a node: only bold / italic / underline / line breaks / photos survive,
   *  with Google Docs' inline styles (font-weight:700 etc.) turned into real tags. */
  function inline(node) {
    if (node.nodeType === 3) return esc(node.nodeValue.replace(/\s+/g, " "));
    if (node.nodeType !== 1) return "";
    const tag = node.tagName.toUpperCase(), st = (node.getAttribute("style") || "").toLowerCase();
    if (tag === "BR") return "<br>";
    if (tag === "IMG") {
      const src = node.getAttribute("src") || "";
      return /^(data:image\/|https?:)/i.test(src) ? `<img src="${esc(src)}" alt="${esc(node.getAttribute("alt") || "")}">` : "";
    }
    if (tag === "STYLE" || tag === "SCRIPT" || tag === "META" || tag === "TITLE") return "";
    let inner = Array.from(node.childNodes).map(inline).join("");
    if (!inner) return "";
    const fw = (st.match(/font-weight\s*:\s*([a-z0-9]+)/) || [])[1];
    const plainWeight = fw && (fw === "normal" || Number(fw) < 600);
    let bold = (tag === "B" || tag === "STRONG") && !plainWeight;
    if (fw && (fw === "bold" || Number(fw) >= 600)) bold = true;
    const italic = tag === "I" || tag === "EM" || /font-style\s*:\s*italic/.test(st);
    const under = tag === "U" || /text-decoration[^;]*underline/.test(st);
    if (under && tag !== "A") inner = `<u>${inner}</u>`;
    if (italic) inner = `<i>${inner}</i>`;
    if (bold) inner = `<b>${inner}</b>`;
    return inner;
  }
  const hasBlock = (el) => Array.from(el.children || []).some((c) => BLOCK.test(c.tagName.toUpperCase()) || hasBlock(c));
  const textOf = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/ /g, " ").trim(); };

  /** A document's body → [{type:"h", level, text} | {type:"p", html, text} | {type:"list", ordered, items} | {type:"hr"}]. */
  function blocks(root) {
    const out = []; let buf = [];
    const flush = () => {
      if (!buf.length) return;
      const html = buf.map(inline).join("").trim(); buf = [];
      if (textOf(html) || /<img/i.test(html)) out.push({ type: "p", html, text: textOf(html) });
    };
    const walk = (el) => {
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType === 3) { if (n.nodeValue.trim()) buf.push(n); continue; }
        if (n.nodeType !== 1) continue;
        const tag = n.tagName.toUpperCase();
        if (/^H[1-6]$/.test(tag)) { flush(); const t = n.textContent.replace(/\s+/g, " ").trim(); if (t) out.push({ type: "h", level: Number(tag[1]), text: t }); }
        else if (tag === "HR") { flush(); out.push({ type: "hr" }); }
        else if (tag === "UL" || tag === "OL") {
          flush();
          const items = [];
          const grab = (list) => Array.from(list.children).forEach((li) => {
            const sub = Array.from(li.children).filter((c) => /^(UL|OL)$/.test(c.tagName.toUpperCase()));
            const own = Array.from(li.childNodes).filter((c) => !sub.includes(c)).map(inline).join("").trim();
            if (textOf(own) || /<img/i.test(own)) items.push(own);
            sub.forEach(grab);
          });
          grab(n);
          if (items.length) out.push({ type: "list", ordered: tag === "OL", items });
        }
        else if (tag === "BR") { flush(); }
        else if (tag === "STYLE" || tag === "SCRIPT" || tag === "HEAD" || tag === "TITLE" || tag === "META") { /* skip */ }
        else if (BLOCK.test(tag) || hasBlock(n)) { flush(); walk(n); flush(); }
        else buf.push(n);   // inline element (span, b, a, img…)
      }
    };
    walk(root); flush();
    return out;
  }

  /* ---------------- blocks → segments and pieces ---------------- */
  const NOTE = /^\s*(host\s+)?note\s*:/i;
  /** "Hot Takes (5 min)" → {name: "Hot Takes", minutes: 5}. */
  function segHead(t) {
    const m = t.match(/^(.*?)[\s–—-]*[([]?\s*(\d+(?:[.,]\d+)?)\s*(m|min|mins|minutes)\s*[)\]]?\s*$/i);
    return m && m[1].trim() ? { name: m[1].trim(), minutes: Number(m[2].replace(",", ".")) } : { name: t.trim(), minutes: 0 };
  }
  function shape(list, title) {
    const segs = [];
    let seg = null, piece = null, introOK = false;
    const hasH1 = list.some((b) => b.type === "h" && b.level === 1);
    if (hasH1 && list[0] && list[0].type === "p" && list[0].text.length <= 80 && !/<img/i.test(list[0].html)) title = list.shift().text;   // a title line above the first segment
    const newSeg = (name, minutes) => { seg = { name, minutes: minutes || 0, desc: "", pieces: [] }; segs.push(seg); piece = null; introOK = true; };
    const ensureSeg = () => { if (!seg) newSeg(title || "Imported", 0); };
    const newPiece = (header) => { ensureSeg(); piece = { header: header || "", html: "" }; seg.pieces.push(piece); introOK = false; };
    for (const b of list) {
      if (b.type === "h" && b.level === 1) { const h = segHead(b.text); newSeg(h.name, h.minutes); continue; }
      if (b.type === "h" && b.level === 2) { newPiece(b.text); continue; }
      if (b.type === "hr" || (b.type === "p" && /^[-–—―_*=~·•\s]{3,}$/.test(b.text) && !/<img/i.test(b.html))) { piece = null; introOK = false; continue; }
      if (b.type === "p" && NOTE.test(b.text)) continue;                 // notes stay off screen
      if (b.type === "p" && introOK && seg && !seg.desc && !seg.pieces.length && b.text.length <= 140 && !/<img/i.test(b.html)) { seg.desc = b.text; introOK = false; continue; }
      if (!piece) newPiece("");
      if (b.type === "h") piece.html += `<h2>${esc(b.text)}</h2>`;
      else if (b.type === "p") piece.html += `<div>${b.html}</div>`;
      else if (b.type === "list") piece.html += `<${b.ordered ? "ol" : "ul"}>${b.items.map((i) => `<li>${i}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
    }
    segs.forEach((s) => { s.pieces = s.pieces.filter((p) => p.header || textOf(p.html) || /<img/i.test(p.html)); });
    return { title: title || "Imported script", segments: segs.filter((s) => s.pieces.length || s.desc || s.minutes || hasH1) };
  }

  function fromHTML(html, title) {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    const t = title || (doc.title || "").trim();
    return shape(blocks(doc.body), t);
  }

  /* ---------------- Markdown → HTML ---------------- */
  function mdInline(s, refs) {
    const keep = [];
    s = s.replace(/\\([\\`*_{}\[\]()#+\-.!|~>])/g, (m, c) => { keep.push(c); return "\u0000" + (keep.length - 1) + "\u0000"; });
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(\s*&lt;?([^)\s]+?)&gt;?(?:\s+&quot;[^&]*&quot;)?\s*\)/g, (m, alt, src) => `<img src="${src}" alt="${alt}">`);
    s = s.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (m, alt, id) => { const src = refs[(id || alt).toLowerCase()]; return src ? `<img src="${esc(src)}" alt="${alt}">` : ""; });
    s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");                                     // links keep their text
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<b><i>$1</i></b>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^\w])__([^_]+)__(?!\w)/g, "$1<b>$2</b>");
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<i>$2</i>").replace(/(^|[^\w])_([^_\s][^_]*?)_(?!\w)/g, "$1<i>$2</i>");
    s = s.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, "<u>$1</u>");
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => esc(keep[Number(i)]));
  }
  function fromMarkdown(text, title) {
    const refs = {};
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n").filter((l) => {
      const m = l.match(/^\s{0,3}\[([^\]]+)\]:\s*<?(\S+?)>?\s*(?:"[^"]*")?\s*$/);
      if (m) { refs[m[1].toLowerCase()] = m[2]; return false; }
      return true;
    });
    const out = []; let para = [], list = null;
    const endPara = () => { if (para.length) { out.push(`<p>${para.map((l) => mdInline(l.replace(/(\s{2,}|\\)$/, "\u0001"), refs)).join(" ").replace(/\u0001 ?/g, "<br>")}</p>`); para = []; } };
    const endList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${mdInline(i, refs)}</li>`).join("")}</${list.tag}>`); list = null; } };
    for (const raw of lines) {
      const l = raw.replace(/\t/g, "    ");
      let m;
      if (!l.trim()) { endPara(); endList(); continue; }
      if ((m = l.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/))) { endPara(); endList(); out.push(`<h${m[1].length}>${mdInline(m[2], refs)}</h${m[1].length}>`); continue; }
      if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(l)) { endPara(); endList(); out.push("<hr>"); continue; }
      if ((m = l.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/))) {
        endPara();
        const tag = /\d/.test(m[1]) ? "ol" : "ul";
        if (!list || (list.tag !== tag && !/^\s{2,}/.test(l))) { endList(); list = { tag, items: [] }; }
        list.items.push(m[2]); continue;
      }
      if (list && /^\s{2,}\S/.test(l)) { list.items[list.items.length - 1] += " " + l.trim(); continue; }
      endList(); para.push(l.trim());
    }
    endPara(); endList();
    return fromHTML(out.join("\n"), title);
  }

  /* ---------------- .docx (Word / Google Docs download) ---------------- */
  /** The files inside a zip: { name: () => Promise<Uint8Array> }. Uses the browser's DecompressionStream. */
  function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let e = u8.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error("That file isn't a .docx (or it's damaged).");
    const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
    const files = {};
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
      files[name] = async () => {
        const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
        const data = u8.subarray(start, start + csize);
        if (method === 0) return data;
        if (method !== 8) throw new Error("Unsupported compression in the .docx.");
        if (typeof DecompressionStream === "undefined") throw new Error("This browser can't open .docx files. Download the doc as Markdown (.md) instead.");
        let ds;
        try { ds = new DecompressionStream("deflate-raw"); } catch (er) { throw new Error("This browser can't open .docx files. Download the doc as Markdown (.md) instead."); }
        return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer());
      };
      p += 46 + nlen + xlen + clen;
    }
    return files;
  }
  const xml = (bytes) => new DOMParser().parseFromString(new TextDecoder().decode(bytes), "application/xml");
  const kids = (el, local) => Array.from(el ? el.children : []).filter((c) => c.localName === local);
  const kid = (el, local) => kids(el, local)[0] || null;
  const attr = (el, local) => { if (!el) return null; for (const a of Array.from(el.attributes)) if (a.localName === local) return a.value; return null; };
  const on = (el) => el && !/^(0|false|none)$/i.test(attr(el, "val") || "");
  function b64(bytes) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }

  async function fromDocx(buf, title) {
    const z = unzip(buf);
    if (!z["word/document.xml"]) throw new Error("That file isn't a .docx (no document inside).");
    const doc = xml(await z["word/document.xml"]());
    // style names (Heading 1, Title…), list types, picture files
    const styleName = {}, styleNum = {};   // style id → name, and → numId when the style itself is a list ("List Bullet")
    if (z["word/styles.xml"]) kids(xml(await z["word/styles.xml"]()).documentElement, "style").forEach((s) => {
      const id = attr(s, "styleId"); styleName[id] = (attr(kid(s, "name"), "val") || "").toLowerCase();
      const np = kid(kid(s, "pPr"), "numPr"); if (np) styleNum[id] = attr(kid(np, "numId"), "val");
    });
    const numFmt = {};
    if (z["word/numbering.xml"]) {
      const nd = xml(await z["word/numbering.xml"]()).documentElement, abs = {};
      kids(nd, "abstractNum").forEach((a) => { const l0 = kids(a, "lvl")[0]; abs[attr(a, "abstractNumId")] = attr(kid(l0, "numFmt"), "val") || "bullet"; });
      kids(nd, "num").forEach((n) => { numFmt[attr(n, "numId")] = abs[attr(kid(n, "abstractNumId"), "val")] || "bullet"; });
    }
    const rels = {};
    if (z["word/_rels/document.xml.rels"]) kids(xml(await z["word/_rels/document.xml.rels"]()).documentElement, "Relationship").forEach((r) => { rels[attr(r, "Id")] = attr(r, "Target"); });
    const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", bmp: "image/bmp" };
    async function picture(rid) {
      const t = rels[rid]; if (!t) return "";
      const path = t.startsWith("/") ? t.slice(1) : "word/" + t.replace(/^\.\//, "");
      const ext = (path.split(".").pop() || "").toLowerCase();
      if (!z[path] || !MIME[ext]) return "";
      return `<img src="data:${MIME[ext]};base64,${b64(await z[path]())}" alt="">`;
    }
    async function runs(el) {
      let h = "";
      for (const c of Array.from(el.children)) {
        if (c.localName === "r") {
          const pr = kid(c, "rPr");
          let t = "";
          for (const x of Array.from(c.children)) {
            if (x.localName === "t") t += esc(x.textContent);
            else if (x.localName === "tab") t += " ";
            else if (x.localName === "br" || x.localName === "cr") t += "<br>";
            else if (x.localName === "drawing" || x.localName === "pict") {
              const blip = x.getElementsByTagNameNS("*", "blip")[0], im = x.getElementsByTagNameNS("*", "imagedata")[0];
              const rid = blip ? attr(blip, "embed") : im ? attr(im, "id") : null;
              if (rid) t += await picture(rid);
            }
          }
          if (t && pr) {
            if (on(kid(pr, "u"))) t = `<u>${t}</u>`;
            if (on(kid(pr, "i"))) t = `<i>${t}</i>`;
            if (on(kid(pr, "b"))) t = `<b>${t}</b>`;
          }
          h += t;
        } else if (c.localName === "hyperlink" || c.localName === "ins" || c.localName === "smartTag" || c.localName === "sdt" || c.localName === "sdtContent" || c.localName === "fldSimple") h += await runs(c);
      }
      return h;
    }
    const out = []; let list = null;
    const endList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join("")}</${list.tag}>`); list = null; } };
    async function body(el) {
      for (const c of Array.from(el.children)) {
        if (c.localName === "tbl") { endList(); for (const cell of Array.from(c.getElementsByTagNameNS("*", "tc"))) await body(cell); continue; }
        if (c.localName === "sdt") { const sc = kid(c, "sdtContent"); if (sc) await body(sc); continue; }
        if (c.localName !== "p") continue;
        const pr = kid(c, "pPr"), sid = attr(kid(pr, "pStyle"), "val") || "", sname = styleName[sid] || sid.toLowerCase();
        const html = (await runs(c)).trim();
        const hm = sname.match(/^heading\s*(\d)/) || sid.match(/^heading\s*(\d)$/i);
        if (hm) { endList(); if (textOf(html)) out.push(`<h${Math.min(6, Number(hm[1]))}>${html}</h${Math.min(6, Number(hm[1]))}>`); continue; }
        if (sname === "title") { endList(); if (textOf(html)) out.push(`<p>${html}</p>`); continue; }
        const numPr = kid(pr, "numPr");
        const numId = numPr ? attr(kid(numPr, "numId"), "val") : styleNum[sid] || (/^list (bullet|number)/.test(sname) ? "?" : null);
        if (numId && numId !== "0") {
          const fmt = numFmt[numId] || (/^list number/.test(sname) ? "decimal" : "bullet");
          const tag = /^(bullet|none)$/i.test(fmt) ? "ul" : "ol";
          if (!list || list.tag !== tag) { endList(); list = { tag, items: [] }; }
          if (html) list.items.push(html);
          continue;
        }
        endList();
        if (!textOf(html) && !/<img/i.test(html) && kid(pr, "pBdr")) { out.push("<hr>"); continue; }   // a horizontal line
        if (html) out.push(`<p>${html}</p>`);
      }
    }
    await body(kid(doc.documentElement, "body") || doc.documentElement);
    endList();
    return fromHTML(out.join("\n"), title);
  }

  /** Any supported file → script. */
  async function fromFile(file) {
    const name = file.name || "Script", base = name.replace(/\.[^.]+$/, ""), ext = (name.split(".").pop() || "").toLowerCase();
    if (ext === "docx") return fromDocx(await file.arrayBuffer(), base);
    if (ext === "doc") throw new Error("Old .doc files can't be read. Save it as .docx (or download from Google Docs as Microsoft Word .docx).");
    if (ext === "pdf") throw new Error("PDFs can't be split into pieces. Download the doc as Word (.docx) or Markdown (.md) instead.");
    const text = await file.text();
    if (ext === "html" || ext === "htm") return fromHTML(text, base);
    return fromMarkdown(text, base);   // .md, .markdown, .txt and anything else that's text
  }

  window.AWYM_IMPORT = { fromFile, fromHTML, fromMarkdown, fromDocx };
})();
