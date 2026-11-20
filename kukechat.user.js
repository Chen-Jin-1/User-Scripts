// ==UserScript==
// @name         KukeChat for CCW
// @namespace    https://chat-api.kuke.ink/
// @version      0.7.7
// @description  重做共创世界网页版的消息中心和动态页，并把 KukeChat 接进共创世界。
// @author       kukemc
// @match        https://www.ccw.site/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://chat-api.kuke.ink/ccw.user.js
// @updateURL    https://chat-api.kuke.ink/ccw.meta.js
// ==/UserScript==
(function() {
  "use strict";
  const API = "https://community-web.ccw.site";
  const ORIGIN = "https://www.ccw.site";
  const ASSETS_HOST = "https://assets.ccw.site";
  const GAMEJAM_HOST = "https://www.ccw.site/gamejam";
  const PAGE_SIZE = 20;
  const MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const MD5_K = new Int32Array(64);
  for (let i = 0; i < 64; i++) MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  function md5Bytes(bytes) {
    const len = bytes.length;
    const nblk = (len + 8 >> 6) + 1;
    const w = new Int32Array(nblk * 16);
    for (let i = 0; i < len; i++) w[i >> 2] |= bytes[i] << i % 4 * 8;
    w[len >> 2] |= 128 << len % 4 * 8;
    w[nblk * 16 - 2] = len * 8 | 0;
    w[nblk * 16 - 1] = Math.floor(len / 536870912);
    let a0 = 1732584193, b0 = 4023233417 | 0, c0 = 2562383102 | 0, d0 = 271733878;
    for (let o = 0; o < w.length; o += 16) {
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) {
          F = B & C | ~B & D;
          g = i;
        } else if (i < 32) {
          F = D & B | ~D & C;
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          F = B ^ C ^ D;
          g = (3 * i + 5) % 16;
        } else {
          F = C ^ (B | ~D);
          g = 7 * i % 16;
        }
        const s = MD5_S[(i >> 4) * 4 + i % 4];
        F = F + A + MD5_K[i] + w[o + g] | 0;
        A = D;
        D = C;
        C = B;
        B = B + (F << s | F >>> 32 - s) | 0;
      }
      a0 = a0 + A | 0;
      b0 = b0 + B | 0;
      c0 = c0 + C | 0;
      d0 = d0 + D | 0;
    }
    const out = new Uint8Array(16);
    [a0, b0, c0, d0].forEach((v, k) => {
      for (let j = 0; j < 4; j++) out[k * 4 + j] = v >>> j * 8 & 255;
    });
    return out;
  }
  const utf8 = (s) => new TextEncoder().encode(s);
  const concat = (a, b) => {
    const r = new Uint8Array(a.length + b.length);
    r.set(a);
    r.set(b, a.length);
    return r;
  };
  function hmacMd5Hex(key, msg) {
    let k = utf8(key);
    if (k.length > 64) k = md5Bytes(k);
    const ipad = new Uint8Array(64), opad = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      ipad[i] = (k[i] || 0) ^ 54;
      opad[i] = (k[i] || 0) ^ 92;
    }
    const out = md5Bytes(concat(opad, md5Bytes(concat(ipad, utf8(msg)))));
    return Array.from(out, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  class ApiError extends Error {
    constructor(code, msg) {
      super(msg || "请求失败");
      this.code = String(code || "");
    }
  }
  let signing = null;
  function ccwToken() {
    try {
      const m = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
      return m ? decodeURIComponent(m[1]) : "";
    } catch (_) {
      return "";
    }
  }
  function ensureSigning() {
    if (!signing) {
      const token2 = ccwToken();
      const opts = { method: "POST", credentials: "include", headers: { "Content-Type": "application/json;charset=UTF-8", ...token2 ? { Token: token2 } : {} } };
      signing = Promise.all([
        fetch(API + "/health/check", opts).then((r) => r.json()).catch(() => null),
        fetch(API + "/base/dateTime", opts).then((r) => r.json()).catch(() => null)
      ]).then(([hc, t]) => {
        const key = Array.isArray(hc && hc.body) ? hc.body.map(({ traceId }) => traceId ? traceId[parseInt(traceId[0], 16) + 1] || "" : "").reverse().join("") : "";
        const diff = t && Number(t.body) ? Number(t.body) - Date.now() : 0;
        return { key, diff };
      });
    }
    return signing;
  }
  async function post(path, body, extraHeaders) {
    const data = body === void 0 ? {} : body;
    const json = JSON.stringify(data);
    const token2 = ccwToken();
    const headers = { "Content-Type": "application/json;charset=UTF-8", ...token2 ? { token: token2 } : {}, ...extraHeaders || {} };
    const sig = await ensureSigning();
    if (sig.key) {
      const tt = String(Date.now() + sig.diff);
      headers.a = hmacMd5Hex(sig.key, "ccw" + json + tt);
      headers.b = tt;
    }
    const res = await fetch(API + path, { method: "POST", credentials: "include", headers, body: json });
    let payload;
    try {
      payload = await res.json();
    } catch (_) {
      throw new ApiError(res.status, "网络错误（" + res.status + "）");
    }
    if (+payload.status !== 200) throw new ApiError(payload.code, (payload.msg || "请求失败").replace(/\(\w+\)/g, ""));
    return payload.body;
  }
  const api = {
    summary: (prepareMarkAll) => post(
      "/notification/v3/summary",
      prepareMarkAll ? { includePreview: false, prepareMarkAll: true } : { includePreview: true },
      prepareMarkAll ? { "Cache-Control": "no-store" } : void 0
    ),
    page: (group, filter, cursor) => post("/notification/v3/page", { group, filter, cursor, pageSize: PAGE_SIZE }),
    markRead: (req) => post("/notification/v3/mark_read", req),
    reply: (content, replyToId) => post("/comment/reply", { content, replyToId }),
    follow: (oid) => post("/study-community/following/follow", { followingOid: oid }),
    emojis: () => Promise.all([post("/emoji/all", {}), post("/emoji/category/list", {})])
  };
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  }
  function safeUrl(raw) {
    if (!raw) return "";
    try {
      const u = new URL(raw, ORIGIN);
      return (u.protocol === "https:" || u.protocol === "http:") && !u.username && !u.password ? u.href : "";
    } catch (_) {
      return "";
    }
  }
  const ANCHOR_TYPES = ["CREATION", "PROFILE", "HASH_TAG", "POST", "SEASON", "ACTIVITY", "ASSET_MARKET", "EXTENSION"];
  function withCommentAnchor(href, commentId, subjectType) {
    if (!href || !commentId || !ANCHOR_TYPES.includes(subjectType)) return href;
    const id = String(commentId).trim();
    if (!/^\d+$/.test(id)) return href;
    const u = new URL(href);
    u.searchParams.set("comment", id);
    return u.href;
  }
  function targetHref(item) {
    const t = item.target || { type: "NONE" };
    if (t.type === "NONE") return "";
    if (t.type === "URL") return safeUrl(t.url);
    const id = t.subjectId;
    let base = "";
    switch (t.subjectType) {
      case "CREATION":
        base = "/detail/" + id;
        break;
      case "PROFILE":
        base = "/student/" + id;
        break;
      case "ACTIVITY":
        base = "/events/" + encodeURIComponent(id);
        break;
      case "POST":
        base = item.url || (item.content && item.content.ext && item.content.ext.slug ? "/post/" + item.content.ext.slug : "");
        break;
      case "SEASON":
        base = "/stars";
        break;
      case "TEAM":
        base = GAMEJAM_HOST + "/teamDetail?id=" + encodeURIComponent(id) + "&activityId=1688636318306";
        break;
      case "ASSET_MARKET":
        base = item.url || (item.assetMarketInfo && item.assetMarketInfo.path ? ASSETS_HOST + "/assets" + item.assetMarketInfo.path : "");
        break;
      case "EXTENSION":
        base = item.url || (item.extensionInfo && item.extensionInfo.eid ? ASSETS_HOST + "/extension/" + item.extensionInfo.eid : "");
        break;
      default:
        base = item.url || "";
        break;
    }
    let href = safeUrl(base);
    if (href && t.subjectType === "HASH_TAG") {
      const u = new URL(href);
      u.searchParams.set("tab", "forum");
      href = u.href;
    }
    return withCommentAnchor(href, t.commentId, t.subjectType);
  }
  let emojiMap = null;
  function loadEmojis() {
    if (emojiMap) return Promise.resolve();
    return api.emojis().then(([all, cats]) => {
      const map = {};
      const catById = {};
      (cats || []).forEach((c) => {
        catById[String(c.id)] = c.name;
      });
      (all || []).forEach((e) => {
        if (!e || !e.name || !e.imageUrl) return;
        const id = String(e.category);
        const keys = [id, catById[id]].filter(Boolean);
        keys.forEach((k) => {
          (map[k] = map[k] || {})[e.name] = e.imageUrl;
        });
      });
      emojiMap = map;
    }).catch(() => {
      emojiMap = {};
    });
  }
  const IMG_HOST = /^https:\/\/([a-z0-9-]+\.)*(ccw\.site|xiguacity\.cn|aliyuncs\.com|myqcloud\.com)\//i;
  function richText(text) {
    const frag = document.createDocumentFragment();
    const re = /!\[[^\]]*\]\(([^)\s]+)\)|\(([^()_\s]+)_([^()]+)\)|(https?:\/\/[^\s<>"'，。！？、；：（）【】《》「」]+)/g;
    let last = 0, m;
    while (m = re.exec(text)) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[1] !== void 0) {
        if (IMG_HOST.test(m[1])) frag.appendChild(h("a", { class: "ccwn-img", href: m[1], target: "_blank", rel: "noreferrer" }, h("img", { src: m[1], loading: "lazy", alt: "" })));
        else frag.appendChild(document.createTextNode(m[0]));
      } else if (m[2] !== void 0) {
        const url = emojiMap && emojiMap[m[2]] && emojiMap[m[2]][m[3]];
        if (url) frag.appendChild(h("img", { class: "ccwn-emoji", src: url, alt: m[3], title: m[3] }));
        else frag.appendChild(document.createTextNode(m[2] === "default" ? m[3] : m[0]));
      } else {
        const url = safeUrl(m[4]);
        frag.appendChild(url ? h("a", { href: url, target: "_blank", rel: "noreferrer" }, m[4]) : document.createTextNode(m[4]));
      }
      last = re.lastIndex;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }
  function safeHtml(html) {
    const doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html");
    const out = document.createDocumentFragment();
    const walk = (node, parent) => {
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) {
          parent.appendChild(document.createTextNode(c.textContent));
          return;
        }
        if (c.nodeType !== 1) return;
        const tag = c.tagName.toLowerCase();
        if (tag === "a") {
          const url = safeUrl(c.getAttribute("href"));
          const a = url ? h("a", { href: url, target: "_blank", rel: "noreferrer" }) : h("span");
          walk(c, a);
          parent.appendChild(a);
        } else if (tag === "b" || tag === "strong") {
          const b = h("strong");
          walk(c, b);
          parent.appendChild(b);
        } else if (tag === "br") {
          parent.appendChild(document.createTextNode("\n"));
        } else if (tag === "script" || tag === "style") ;
        else {
          const block = ["p", "div", "tr", "li", "table"].includes(tag);
          walk(c, parent);
          if (block) parent.appendChild(document.createTextNode("\n"));
        }
      });
    };
    walk(doc.body.firstChild, out);
    const box = document.createElement("div");
    box.appendChild(out);
    const tw = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    let nl = 2;
    const texts = [];
    while (tw.nextNode()) texts.push(tw.currentNode);
    texts.forEach((t) => {
      let r = "";
      for (const ch of t.textContent.replace(/\r/g, "")) {
        if (ch === "\n") {
          if (nl < 1) r += ch;
          nl++;
        } else if ((ch === " " || ch === "	" || ch === " ") && nl > 0) ;
        else {
          r += ch;
          nl = 0;
        }
      }
      t.textContent = r;
    });
    while (box.firstChild) out.appendChild(box.firstChild);
    while (out.firstChild && out.firstChild.nodeType === 3 && !out.firstChild.textContent.trim()) out.removeChild(out.firstChild);
    while (out.lastChild && out.lastChild.nodeType === 3 && !out.lastChild.textContent.trim()) out.removeChild(out.lastChild);
    return out;
  }
  const looksHtml = (s) => /<\/?[a-z][^>]*>/i.test(s);
  const plain = (s) => looksHtml(s) ? new DOMParser().parseFromString(s, "text/html").body.textContent : s;
  const PIX = {
    ALL: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNyIgeT0iOSIgd2lkdGg9IjQyIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjciIHk9IjEyIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSAxMikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjEwIiB5PSIxNSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgMTUpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxMyIgeT0iMTgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQzIDE4KSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMTYiIHk9IjIxIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0MCAyMSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjE5IiB5PSIyNCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMzcgMjQpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIyMiIgeT0iMjciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjI1IiB5PSIzMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjgiIHk9IjMwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAzNCAyNykiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjciIHk9IjEyIiB3aWR0aD0iMzMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgNyAxMikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjUyIiB5PSIxMiIgd2lkdGg9IjMzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDUyIDEyKSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iNDUiIHdpZHRoPSI0MiIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEwIDEyVjE1SDdWNDVINDlWMTVINDZWMTJIMTBaTTQzIDE4VjE1SDQ2VjE4SDQzWk00MCAyMVYxOEg0M1YyMUg0MFpNMzcgMjRWMjFINDBWMjRIMzdaTTM0IDI3VjI0SDM3VjI3SDM0Wk0zMSAzMFYyN0gzNFYzMEgzMVpNMjUgMzBIMzFWMzNIMjVWMzBaTTIyIDI3SDI1VjMwSDIyVjI3Wk0xOSAyNEgyMlYyN0gxOVYyNFpNMTYgMjFIMTlWMjRIMTZWMjFaTTEzIDE4SDE2VjIxSDEzVjE4Wk0xMyAxOFYxNUgxMFYxOEgxM1oiIGZpbGw9IiM5MzJGMTAiLz4KPHJlY3QgeD0iMTMiIHk9IjEyIiB3aWR0aD0iMzAiIGhlaWdodD0iMyIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIxMyIgeT0iMTUiIHdpZHRoPSIyNyIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjE2IiB5PSIxOCIgd2lkdGg9IjIxIiBoZWlnaHQ9IjMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMTkiIHk9IjIxIiB3aWR0aD0iMTUiIGhlaWdodD0iMyIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIyMiIgeT0iMjQiIHdpZHRoPSI5IiBoZWlnaHQ9IjMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMjUiIHk9IjI3IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjEwIiB5PSIxMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIxMyIgeT0iMTIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjE2IiB5PSIxMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMjgiIHk9IjI3IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjMxIiB5PSIyNCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSIzNCIgeT0iMjEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iMzciIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjQwIiB5PSIxNSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSI0MyIgeT0iMTIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iNyIgeT0iMTUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjciIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSI3IiB5PSIzNiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iNyIgeT0iMzkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEwIiB5PSIzOSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSI3IiB5PSI0MiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iMjEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjciIHk9IjI0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSI3IiB5PSIyNyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iNyIgeT0iMzAiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjciIHk9IjMzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxMCIgeT0iMjQiIHdpZHRoPSI5IiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMTAiIHk9IjMwIiB3aWR0aD0iMTUiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxMCIgeT0iMzMiIHdpZHRoPSI5IiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMTAiIHk9IjI3IiB3aWR0aD0iMTIiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxMCIgeT0iMTgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMTAiIHk9IjM2IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjEwIiB5PSIyMSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxMyIgeT0iMjEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDkgMTUpIiBmaWxsPSIjOTMyRjEwIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQ5IDE4KSIgZmlsbD0iIzkzMkYxMCIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSAzNikiIGZpbGw9IiM5MzJGMTAiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDkgMzMpIiBmaWxsPSIjOTMyRjEwIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQ5IDMwKSIgZmlsbD0iIzkzMkYxMCIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSAyNykiIGZpbGw9IiM5MzJGMTAiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDkgMjQpIiBmaWxsPSIjOTMyRjEwIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQ5IDM5KSIgZmlsbD0iIzkzMkYxMCIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSA0MikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQ2IDM5KSIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSAyMSkiIGZpbGw9IiM5MzJGMTAiLz4KPHJlY3Qgd2lkdGg9IjkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgMjQpIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHdpZHRoPSIxMiIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0NiAzMCkiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3Qgd2lkdGg9IjkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgMzMpIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHdpZHRoPSIxMiIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0NiAyNykiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgMTgpIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQ2IDM2KSIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0MyAzNikiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgMjEpIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQzIDIxKSIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxOSIgeT0iMzMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjE2IiB5PSIzNiIgd2lkdGg9IjI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMTMiIHk9IjM5IiB3aWR0aD0iMzAiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxMCIgeT0iNDIiIHdpZHRoPSIzNiIgaGVpZ2h0PSIzIiBmaWxsPSIjOTMyRjEwIi8+CjxyZWN0IHg9IjMxIiB5PSIzMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxOSIgeT0iMjciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM5MzJGMTAiLz4KPHJlY3QgeD0iMTYiIHk9IjMwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjOTMyRjEwIi8+CjxyZWN0IHg9IjEzIiB5PSIzMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzkzMkYxMCIvPgo8cmVjdCB4PSIxMCIgeT0iMzYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM5MzJGMTAiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMzcgMjcpIiBmaWxsPSIjOTMyRjEwIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQwIDMwKSIgZmlsbD0iIzkzMkYxMCIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0MyAzMykiIGZpbGw9IiM5MzJGMTAiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgMzYpIiBmaWxsPSIjOTMyRjEwIi8+Cjwvc3ZnPgo=",
    REPLY: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMSIgeT0iMTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjEyIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0NiIgeT0iMTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjEyIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxMyIgeT0iMjkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQzIiB5PSI4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0MyIgeT0iMjMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQiIHk9IjgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjEwIiB5PSIzMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iMzUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQiIHk9IjIzIiB3aWR0aD0iNiIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0IiB5PSIyNiIgd2lkdGg9IjMiIGhlaWdodD0iOSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iNSIgd2lkdGg9IjM2IiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjE2IiB5PSIyNiIgd2lkdGg9IjI3IiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik03IDhINDNWMTFINDZWMjNINDNWMjZIMTZWMjlIMTNWMzJIMTBWMzVIN1YyNkgxMFYyM0g0VjExSDdWOFoiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3QgeD0iNyIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNCIgeT0iMTEiIHdpZHRoPSI0MiIgaGVpZ2h0PSIzIiBmaWxsPSIjNjYzREZCIi8+CjxyZWN0IHg9IjQiIHk9IjE0IiB3aWR0aD0iNDIiIGhlaWdodD0iMyIgZmlsbD0iIzY2M0RGQiIvPgo8cmVjdCB4PSI0IiB5PSIxNyIgd2lkdGg9IjQyIiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNCIgeT0iMjAiIHdpZHRoPSI0MiIgaGVpZ2h0PSIzIiBmaWxsPSIjNjYzREZCIi8+CjxyZWN0IHg9IjEwIiB5PSIyMyIgd2lkdGg9IjMzIiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNyIgeT0iMjYiIHdpZHRoPSI5IiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNyIgeT0iMjkiIHdpZHRoPSI2IiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNyIgeT0iMzIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3QgeD0iNCIgeT0iMTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjciIHk9IjgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEzIiB5PSIxMSIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMTMiIHk9IjE3IiB3aWR0aD0iOSIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjE2IiB5PSIyMyIgd2lkdGg9IjI3IiBoZWlnaHQ9IjMiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3QgeD0iMTMiIHk9IjI2IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjNEIxRDk1Ii8+CjxyZWN0IHg9IjQzIiB5PSIyMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzRCMUQ5NSIvPgo8cmVjdCB4PSIxMCIgeT0iMjkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMTIiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDU4IDI5KSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMTIiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDEzIDI5KSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgNDcpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAxNiAyNikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDE2IDQxKSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMjYpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSA1MCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDUzKSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjYiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgNDEpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSI5IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1NSA0NCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzNiIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1MiAyMykiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIyNyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0MyA0NCkiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik01MiAyNkgxNlYyOUgxM1YzOEgxNlY0NEg0M1Y0N0g0NlY1MEg0OVY1M0g1MlY0NEg0OVY0MUg1NVYyOUg1MlYyNloiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjM2IiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDI2KSIgZmlsbD0iIzVDRkY2RCIvPgo8cmVjdCB3aWR0aD0iNDIiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMjkpIiBmaWxsPSIjNUNGRjZEIi8+CjxyZWN0IHdpZHRoPSI0MiIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1NSAzMikiIGZpbGw9IiM1Q0ZGNkQiLz4KPHJlY3Qgd2lkdGg9IjQyIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDU1IDM1KSIgZmlsbD0iIzVDRkY2RCIvPgo8cmVjdCB3aWR0aD0iMzkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMzgpIiBmaWxsPSIjNUNGRjZEIi8+CjxyZWN0IHdpZHRoPSIzMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSA0MSkiIGZpbGw9IiM1Q0ZGNkQiLz4KPHJlY3Qgd2lkdGg9IjkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTIgNDQpIiBmaWxsPSIjNUNGRjZEIi8+CjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDQ3KSIgZmlsbD0iIzVDRkY2RCIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1MiA1MCkiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMTYgMjkpIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAxOSAyNikiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHdpZHRoPSIyNCIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0NiAyOSkiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3Qgd2lkdGg9IjkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMzEgMzUpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQ5IDQxKSIgZmlsbD0iIzBFODYxQSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1NSAzOCkiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMzUpIiBmaWxsPSIjMEU4NjFBIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDU1IDMyKSIgZmlsbD0iIzBFODYxQSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1MiAzOCkiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTIgNDQpIiBmaWxsPSIjMEU4NjFBIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDQ3KSIgZmlsbD0iIzBFODYxQSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSA0NCkiIGZpbGw9IiMwRTg2MUEiLz4KPC9zdmc+Cg==",
    CONTENT_INTERACTION: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iOSIgeT0iOCIgd2lkdGg9IjMiIGhlaWdodD0iMjAiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjM5IiB5PSI1IiB3aWR0aD0iMyIgaGVpZ2h0PSIyNyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMzkgNSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjM5IiB5PSI4IiB3aWR0aD0iMyIgaGVpZ2h0PSIyMCIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNDgiIHk9IjE0IiB3aWR0aD0iMyIgaGVpZ2h0PSIxNCIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iOSIgeT0iMjgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjEyIiB5PSIzMSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjYiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDggMzEpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0NSAxMSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjE0IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OCAxNCkiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUxIDI4KSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMTgiIHk9IjM0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxNSIgeT0iMzEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjIxIiB5PSIzNyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjQiIHk9IjQwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIyNyIgeT0iNDMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQyIDM0KSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDIgMjgpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0MiAzMSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDM5IDM3KSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMzYgNDApIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAzMyA0MykiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjYiIHk9IjMxIiB3aWR0aD0iMyIgaGVpZ2h0PSIyMSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNTEiIHk9IjUyIiB3aWR0aD0iMyIgaGVpZ2h0PSI0MiIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgNTEgNTIpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxOCIgeT0iMzEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDE4IDMxKSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMTgiIHk9IjgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDE4IDgpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxNSIgeT0iOCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMTUgOCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjM5IiB5PSI4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCAzOSA4KSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNDgiIHk9IjE0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCA0OCAxNCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjE4IiB5PSIxMSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMTggMTEpIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIyMSIgeT0iOCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjEgOCkiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzkgMjhWOEwxMiA4TDEyIDI4TDEyIDMxSDE4VjM0SDIxVjM3TDI0IDM3VjQwSDI3VjQzSDMwVjQwSDMzVjM3TDM2IDM3VjM0TDM5IDM0VjMxVjI4WiIgZmlsbD0id2hpdGUiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTQuMzcxMTRlLTA4IC0xIC0xIDQuMzcxMTRlLTA4IDMzIDQzKSIgZmlsbD0iI0FFQUVBRSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtNC4zNzExNGUtMDggLTEgLTEgNC4zNzExNGUtMDggMzYgNDApIiBmaWxsPSIjQUVBRUFFIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC00LjM3MTE0ZS0wOCAtMSAtMSA0LjM3MTE0ZS0wOCAzOSAzNykiIGZpbGw9IiNBRUFFQUUiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTQuMzcxMTRlLTA4IC0xIC0xIDQuMzcxMTRlLTA4IDQ4IDMxKSIgZmlsbD0iI0FFQUVBRSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtNC4zNzExNGUtMDggLTEgLTEgNC4zNzExNGUtMDggNDUgMzEpIiBmaWxsPSIjRkZGOUY5Ii8+CjxyZWN0IHg9IjEyIiB5PSIzMSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMTIgMzEpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxMiIgeT0iNDkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDEyIDQ5KSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNTEiIHk9IjMxIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCA1MSAzMSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjUxIiB5PSI0OSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgNTEgNDkpIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE4IDM0VjM3TDIxIDM3VjQwSDI0VjQzSDI3VjQ2SDMzVjQzSDM2VjQwSDM5VjM3TDQyIDM3VjM0SDUxVjM3VjQwVjQzVjQ2VjQ5VjUySDlWNDlWNDZMOSA0M1Y0MEw5IDM3TDkgMzRIMThaIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjUxIiB5PSI0OSIgd2lkdGg9IjMiIGhlaWdodD0iNDIiIHRyYW5zZm9ybT0icm90YXRlKDkwIDUxIDQ5KSIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSI1MSIgeT0iNDYiIHdpZHRoPSIzIiBoZWlnaHQ9IjQyIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCA1MSA0NikiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMjciIHk9IjQzIiB3aWR0aD0iMyIgaGVpZ2h0PSIxOCIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjcgNDMpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjUxIiB5PSI0MyIgd2lkdGg9IjMiIGhlaWdodD0iMTgiIHRyYW5zZm9ybT0icm90YXRlKDkwIDUxIDQzKSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIxOCIgeT0iMzQiIHdpZHRoPSIzIiBoZWlnaHQ9IjkiIHRyYW5zZm9ybT0icm90YXRlKDkwIDE4IDM0KSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSI1MSIgeT0iMzQiIHdpZHRoPSIzIiBoZWlnaHQ9IjkiIHRyYW5zZm9ybT0icm90YXRlKDkwIDUxIDM0KSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIyNCIgeT0iNDAiIHdpZHRoPSIzIiBoZWlnaHQ9IjE1IiB0cmFuc2Zvcm09InJvdGF0ZSg5MCAyNCA0MCkiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iNTEiIHk9IjQwIiB3aWR0aD0iMyIgaGVpZ2h0PSIxNSIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgNTEgNDApIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjIxIiB5PSIzNyIgd2lkdGg9IjMiIGhlaWdodD0iMTIiIHRyYW5zZm9ybT0icm90YXRlKDkwIDIxIDM3KSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSI1MSIgeT0iMzciIHdpZHRoPSIzIiBoZWlnaHQ9IjEyIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCA1MSAzNykiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMTIiIHk9IjM0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCAxMiAzNCkiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEyIiB5PSIzNyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMTIgMzcpIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxNSIgeT0iMzQiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDE1IDM0KSIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iNTEiIHk9IjQzIiB3aWR0aD0iNiIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCA1MSA0MykiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iNTEiIHk9IjMxIiB3aWR0aD0iMyIgaGVpZ2h0PSIyMSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjQiIHk9IjE2IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCAyNCAxNikiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjI0IiB5PSIxMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjQgMTMpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjI0IiB5PSIyNSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjQgMjUpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjI0IiB5PSIxMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAyNCAxMykiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjE4IiB5PSIyMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAxOCAyMikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjMwIiB5PSIyMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAzMCAyMikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjI0IiB5PSIzMSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAyNCAzMSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjIxIiB5PSIyOCIgd2lkdGg9IjMiIGhlaWdodD0iNiIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAyMSAyOCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjI3IiB5PSIyOCIgd2lkdGg9IjMiIGhlaWdodD0iNiIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAyNyAyOCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjI3IiB5PSIxOSIgd2lkdGg9IjMiIGhlaWdodD0iNiIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAyNyAxOSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjIxIiB5PSIxOSIgd2lkdGg9IjMiIGhlaWdodD0iNiIgdHJhbnNmb3JtPSJyb3RhdGUoLTE4MCAyMSAxOSkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjIxIiB5PSIxOSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjEgMTkpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjI0IiB5PSIxOSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjQgMTkpIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIyNyIgeT0iMTkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDI3IDE5KSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIyNCIgeT0iMjIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDI0IDIyKSIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMzMiIHk9IjMxIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSgtMTgwIDMzIDMxKSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzMiIHk9IjM3IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSgtMTgwIDMzIDM3KSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzMiIHk9IjM0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSgtMTgwIDMzIDM0KSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIzMCIgeT0iMzQiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKC0xODAgMzAgMzQpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIzNiIgeT0iMzQiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKC0xODAgMzYgMzQpIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4K",
    SYSTEM: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQwIDNIMzFWNkg0MFYzWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTQ2IDlINDNWMTJINDZWOVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik00MyA2SDQwVjEySDQzVjZaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNNDkgMTJINDZWMTVINDlWMTJaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNNTIgMTVINDlWMThINTJWMTVaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjggOUgyNVYxMkgyOFY5WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTMxIDZIMjhWMTJIMzFWNloiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0yNSAxMkgyMlYxNUgyNVYxMloiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0yMiAxNUgxOVYxOEgyMlYxNVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik00MiA1MUgzOVY1NEg0MlY1MVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zMyA1MUgzMFY1NEgzM1Y1MVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0xNiA0NUgxM1Y0OEgxNlY0NVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik01OCA0NUg1NVY0OEg1OFY0NVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik01OCA0OEgxM1Y1MUg1OFY0OFoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zOSA1NEgzM1Y1N0gzOVY1NFoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik01NSAxOEg1MlY0NUg1NVYxOFoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0xOSAxOEgxNlY0NUgxOVYxOFoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik00MCA2VjEySDQ2VjE1SDQ5VjE4SDUyVjQ1SDU1VjQ4SDE2VjQ1SDE5TDE5IDE4SDIyVjE1SDI1VjEySDMxVjZINDBaIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjM0IiB5PSI2IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjM3IiB5PSI2IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjM0IiB5PSI5IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjM3IiB5PSI5IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjI4IiB5PSIxMiIgd2lkdGg9IjE1IiBoZWlnaHQ9IjMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMjUiIHk9IjE1IiB3aWR0aD0iMTgiIGhlaWdodD0iMzMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMjIiIHk9IjE4IiB3aWR0aD0iMzAiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjIgMTgpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjI1IiB5PSIxOCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDI1IDE4KSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSI0NiIgeT0iMTUiIHdpZHRoPSIzMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCA0NiAxNSkiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iNDkiIHk9IjE4IiB3aWR0aD0iMzAiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgNDkgMTgpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjUyIiB5PSIxOCIgd2lkdGg9IjI3IiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDUyIDE4KSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIxNiIgeT0iNDUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iNTIiIHk9IjQ1IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjUyIiB5PSIxOCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDUyIDE4KSIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSI0NiIgeT0iNDUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iNDkiIHk9IjQ1IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjQzIiB5PSIxMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSI0NiIgeT0iMTUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iMzEiIHk9IjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjMxIiB5PSI5IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIyNSIgeT0iMTIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjIyIiB5PSIxNSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMTkiIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIzMyIgeT0iNTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMzYiIHk9IjUxIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjMwIiB5PSIyNSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzMiIHk9IjIyIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIzMyIgeT0iMjUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjMzIiB5PSIyMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzAiIHk9IjIyIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSI0MSIgeT0iMjIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjM0IiB5PSIzMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzQiIHk9IjM5IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIzMSIgeT0iMzYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjM3IiB5PSIzMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzciIHk9IjM5IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0MCIgeT0iMzYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQwIiB5PSIzMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNDMiIHk9IjMzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIyOCIgeT0iMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjMxIiB5PSIzMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzciIHk9IjMzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjM3IiB5PSIzNiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSI0MCIgeT0iMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMzQiIHk9IjMzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIzNCIgeT0iMzYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMzEiIHk9IjMzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSI0MSIgeT0iMjUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQ0IiB5PSIyMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNDQiIHk9IjI1IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjAgMTRWMTFMMTEgMTFWMTRMMjAgMTRaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjMgMzhWMzVIMTRWMzhIMjNaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjMgMTRWMTFIMjBWMTRIMjNaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTEgMTRWMTFIOFYxNEgxMVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik04IDE3TDggMTRINVYxN0g4WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTI2IDE3VjE0SDIzVjE3SDI2WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTI2IDI5VjI2SDIzVjI5SDI2WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTggMjlMOCAyNkg1VjI5SDhaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjMgMzJWMjlIMTRWMzJIMjNaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTQgMzVWMzJIMTFWMzVIMTRaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjYgMzVWMzJIMjNWMzVIMjZaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTEgMzJWMjlIOFYzMkgxMVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0yOSAyNlYxN0gyNlYyNkgyOVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik01IDI2TDUgMTdIMkwyIDI2SDVaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjMgMTdWMTRIOFYxN0g1VjI2SDhWMjlIMTFWMzJIMTRWMzVIMjNWMzJIMTdWMjlIMjNWMjZIMjZWMTdIMjNaIiBmaWxsPSIjNjYzREZCIi8+CjxwYXRoIGQ9Ik0yMyAzMlYzNUgxNFYzMkgyM1oiIGZpbGw9IiM2NjNERkIiLz4KPHBhdGggZD0iTTIzIDE3VjE0TDggMTRWMTdMMjMgMTdaIiBmaWxsPSIjNjYzREZCIi8+CjxwYXRoIGQ9Ik0xNyAyOVYzMkgxMVYyOUgxN1oiIGZpbGw9IiM2NjNERkIiLz4KPHBhdGggZD0iTTI2IDIwVjE3TDUgMTdWMjBMMjYgMjBaIiBmaWxsPSIjNjYzREZCIi8+CjxwYXRoIGQ9Ik0yNiAyNlYyM0w1IDIzVjI2TDI2IDI2WiIgZmlsbD0iIzY2M0RGQiIvPgo8cGF0aCBkPSJNMjYgMjNWMjBMNSAyMFYyM0wyNiAyM1oiIGZpbGw9IiM2NjNERkIiLz4KPHBhdGggZD0iTTIzIDI5VjI2TDggMjZWMjlMMjMgMjlaIiBmaWxsPSIjNjYzREZCIi8+CjxwYXRoIGQ9Ik0xNiAyMVYxOEgxMFYyMUgxNloiIGZpbGw9IiNGRERGMEIiLz4KPHBhdGggZD0iTTIyIDI2VjIzTDEwIDIzVjI2TDIyIDI2WiIgZmlsbD0iI0ZEREYwQiIvPgo8L3N2Zz4K",
    COMMUNITY: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA0NSA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMjUiIHk9IjMiIHdpZHRoPSI5IiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjEiIHk9IjE1IiB3aWR0aD0iMyIgaGVpZ2h0PSIxMiIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNCIgeT0iMTIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQiIHk9IjI3IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI3IiB5PSIzMyIgd2lkdGg9IjMiIGhlaWdodD0iNiIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMTYiIHk9IjMzIiB3aWR0aD0iMyIgaGVpZ2h0PSI2IiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxOSIgeT0iNiIgd2lkdGg9IjYiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iOSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjciIHk9IjMwIiB3aWR0aD0iMTUiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMTAiIHk9IjM5IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxMyIgeT0iMTIiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09InJvdGF0ZSg5MCAxMyAxMikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjIyIiB5PSIzMyIgd2lkdGg9IjYiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjgiIHk9IjM2IiB3aWR0aD0iNiIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIzNyIgeT0iMTUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjM3IiB5PSIyNCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNDAiIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSI2IiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIzNCIgeT0iNiIgd2lkdGg9IjMiIGhlaWdodD0iMzAiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zNCA2SDI1VjlIMTlWMTJIMTNWMzBIMjJWMzNIMjhWMzZIMzRWNloiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMzEiIHk9IjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMwIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjMxIiB5PSIzMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSIyOCIgeT0iMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iMjUiIHk9IjMwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjIyIiB5PSIzMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSIxOSIgeT0iMjciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iMTYiIHk9IjI3IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjEzIiB5PSIyNyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSIyOCIgeT0iNiIgd2lkdGg9IjMiIGhlaWdodD0iMjciIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMjUiIHk9IjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjIyIiB5PSI5IiB3aWR0aD0iMyIgaGVpZ2h0PSIyMSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIxOSIgeT0iOSIgd2lkdGg9IjMiIGhlaWdodD0iMTgiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMTYiIHk9IjEyIiB3aWR0aD0iMyIgaGVpZ2h0PSIxNSIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIxMyIgeT0iMTIiIHdpZHRoPSIzIiBoZWlnaHQ9IjE1IiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjciIHk9IjE1IiB3aWR0aD0iMyIgaGVpZ2h0PSIxNSIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxMCIgeT0iMzMiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMzciIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSI2IiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjQiIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSI5IiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjQiIHk9IjE1IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSI3IiB5PSIxMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==",
    FRIEND_SHARE: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUxIDE0SDZWMTdIOVYyMEgxMlYyM0gxNVYyNkgxNlYyOUgxOFY0NEgyN1Y0MUgzMFYzOEgzM1YzNUgzNlYzMkgzOVYyOUg0MlYyM0g0NVYyMEg0OFYxN0g1MVYxNFoiIGZpbGw9IiMzQUZGQjgiLz4KPHJlY3QgeD0iOSIgeT0iMTciIHdpZHRoPSIzOSIgaGVpZ2h0PSIzIiBmaWxsPSIjM0FGRkI4Ii8+CjxyZWN0IHg9IjYiIHk9IjE0IiB3aWR0aD0iNDUiIGhlaWdodD0iMyIgZmlsbD0iIzNBRkZCOCIvPgo8cmVjdCB4PSIxMiIgeT0iMjAiIHdpZHRoPSIzMyIgaGVpZ2h0PSIzIiBmaWxsPSIjM0FGRkI4Ii8+CjxyZWN0IHg9IjE1IiB5PSIyMyIgd2lkdGg9IjI3IiBoZWlnaHQ9IjMiIGZpbGw9IiMzQUZGQjgiLz4KPHJlY3QgeD0iMTYiIHk9IjI2IiB3aWR0aD0iMjYiIGhlaWdodD0iMyIgZmlsbD0iIzNBRkZCOCIvPgo8cmVjdCB4PSIxOCIgeT0iMjkiIHdpZHRoPSIyMSIgaGVpZ2h0PSIzIiBmaWxsPSIjM0FGRkI4Ii8+CjxyZWN0IHg9IjE4IiB5PSIzMiIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMiIGZpbGw9IiMzQUZGQjgiLz4KPHJlY3QgeD0iMTgiIHk9IjM1IiB3aWR0aD0iMTUiIGhlaWdodD0iMyIgZmlsbD0iIzNBRkZCOCIvPgo8cmVjdCB4PSIxOCIgeT0iMzgiIHdpZHRoPSIxMiIgaGVpZ2h0PSIzIiBmaWxsPSIjM0FGRkI4Ii8+CjxyZWN0IHg9IjE4IiB5PSI0MSIgd2lkdGg9IjkiIGhlaWdodD0iMyIgZmlsbD0iIzNBRkZCOCIvPgo8cmVjdCB4PSI2IiB5PSIxMSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjE4IiB5PSI0NCIgd2lkdGg9IjYiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNTEiIHk9IjE0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0NSIgeT0iMjAiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQyIiB5PSIyMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzAiIHk9IjIwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIyNyIgeT0iMjAiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjI0IiB5PSIyMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMjEiIHk9IjIzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxOCIgeT0iMjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjQ4IiB5PSIxNyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzkiIHk9IjI2IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIzNiIgeT0iMjkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjMzIiB5PSIzMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMzAiIHk9IjM1IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIyNyIgeT0iMzgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjI0IiB5PSI0MSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjQiIHk9IjM4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjMTE3NTUxIi8+CjxyZWN0IHg9IjIxIiB5PSI0MSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzExNzU1MSIvPgo8cmVjdCB4PSIyNyIgeT0iMzUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiMxMTc1NTEiLz4KPHJlY3QgeD0iMzAiIHk9IjMyIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjMTE3NTUxIi8+CjxyZWN0IHg9IjMzIiB5PSIyOSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzExNzU1MSIvPgo8cmVjdCB4PSIzNiIgeT0iMjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiMxMTc1NTEiLz4KPHJlY3QgeD0iMzkiIHk9IjIzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjMTE3NTUxIi8+CjxyZWN0IHg9IjQyIiB5PSIyMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzExNzU1MSIvPgo8cmVjdCB4PSI0NSIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiMxMTc1NTEiLz4KPHJlY3QgeD0iNiIgeT0iMTciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjMiIHk9IjE0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI5IiB5PSIyMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMTIiIHk9IjIzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxNSIgeT0iMjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjE1IiB5PSIyOSIgd2lkdGg9IjMiIGhlaWdodD0iMTgiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjIxIiB5PSIyNiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjciIHk9IjIzIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIyNCIgeT0iMjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjMwIiB5PSIyMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMTgiIHk9IjI5IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4K",
    FANS: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUzIDhIN1Y0NEgyMVY0N0gyNFY1MEgyN1Y1M0gzM1Y1MEgzNlY0N0gzOVY0NEg1M1Y4WiIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSI3IiB5PSI4IiB3aWR0aD0iNDYiIGhlaWdodD0iMzYiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMjEiIHk9IjQ0IiB3aWR0aD0iMTgiIGhlaWdodD0iMyIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSIyNCIgeT0iNDciIHdpZHRoPSIxMiIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjI3IiB5PSI1MCIgd2lkdGg9IjYiIGhlaWdodD0iMyIgZmlsbD0iI0ZEREYwQiIvPgo8cmVjdCB4PSI5IiB5PSI1IiB3aWR0aD0iNDIiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iOSIgeT0iNDQiIHdpZHRoPSIxMiIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIzOSIgeT0iNDQiIHdpZHRoPSIxMiIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIyMSIgeT0iNDciIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjM2IiB5PSI0NyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjQiIHk9IjUwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIyNyIgeT0iNTMiIHdpZHRoPSI2IiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjMzIiB5PSI1MCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDcgOCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjU2IiB5PSI4IiB3aWR0aD0iMzYiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgNTYgOCkiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zOS4wMDgzIDI3SDM2LjAwODNWMzBIMzkuMDA4M1YyN1oiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMzAiIHk9IjUwIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjMzIiB5PSI0NyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSIxMiIgeT0iOCIgd2lkdGg9IjYiIGhlaWdodD0iMyIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iOSIgeT0iOCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iOCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNDgiIHk9IjgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjUxIiB5PSI4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI5IiB5PSI0MSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNiIgeT0iNDEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQ4IiB5PSI0MSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNTAiIHk9IjQxIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxMCIgeT0iMTEiIHdpZHRoPSI5IiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDEwIDExKSIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMzYiIHk9IjQ0IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjM5IiB5PSI0MSIgd2lkdGg9IjkiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cmVjdCB4PSI1MCIgeT0iMzgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNFQTlFMDkiLz4KPHJlY3QgeD0iNDgiIHk9IjM5IiB3aWR0aD0iMyIgaGVpZ2h0PSIyIiBmaWxsPSIjRUE5RTA5Ii8+CjxyZWN0IHg9IjUwIiB5PSIzNSIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0VBOUUwOSIvPgo8cGF0aCBkPSJNMjkgMjFIMzJWMjRIMjlWMjFaIiBmaWxsPSIjMEUwRTExIi8+CjxwYXRoIGQ9Ik0zMiAxOEgzNVYyMUgzMlYxOFoiIGZpbGw9IiMwRTBFMTEiLz4KPHBhdGggZD0iTTQxIDI3SDQ0VjMwSDQxVjI3WiIgZmlsbD0iIzBFMEUxMSIvPgo8cGF0aCBkPSJNMzggMzBINDFWMzNIMzhWMzBaIiBmaWxsPSIjMEUwRTExIi8+CjxwYXRoIGQ9Ik0zNSAzM0gzOFYzNkgzNVYzM1oiIGZpbGw9IiMwRTBFMTEiLz4KPHBhdGggZD0iTTMyIDM2SDM1VjM5SDMyVjM2WiIgZmlsbD0iIzBFMEUxMSIvPgo8cGF0aCBkPSJNMjkgMzlIMzJWNDJIMjlWMzlaIiBmaWxsPSIjMEUwRTExIi8+CjxwYXRoIGQ9Ik00NCAxOEg0N1YyN0g0NFYxOFoiIGZpbGw9IiMwRTBFMTEiLz4KPHBhdGggZD0iTTE3IDI3SDIwVjMwSDE3VjI3WiIgZmlsbD0iIzBFMEUxMSIvPgo8cGF0aCBkPSJNMjAgMzBIMjNWMzNIMjBWMzBaIiBmaWxsPSIjMEUwRTExIi8+CjxwYXRoIGQ9Ik0yMyAzM0gyNlYzNkgyM1YzM1oiIGZpbGw9IiMwRTBFMTEiLz4KPHBhdGggZD0iTTI2IDM2SDI5VjM5SDI2VjM2WiIgZmlsbD0iIzBFMEUxMSIvPgo8cGF0aCBkPSJNMTQgMThIMTdWMjdIMTRWMThaIiBmaWxsPSIjMEUwRTExIi8+CjxwYXRoIGQ9Ik0xNyAxNUgyNlYxOEgxN1YxNVoiIGZpbGw9IiMwRTBFMTEiLz4KPHBhdGggZD0iTTM1IDE1SDQ0VjE4SDM1VjE1WiIgZmlsbD0iIzBFMEUxMSIvPgo8cGF0aCBkPSJNMjYgMThIMjlWMjFIMjZWMThaIiBmaWxsPSIjMEUwRTExIi8+CjxwYXRoIGQ9Ik0xNyAxOFYyN0gyMFYzMEgyM1YzM0gyNlYzNkgyOVYzOUgzMlYzNkgzNVYzM0gzOFYzMEg0MVYyN0g0NFYxOEgzNVYyMUgzMlYyNEgyOVYyMUgyNlYxOEgxN1oiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMjAiIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjM4IiB5PSIxOCIgd2lkdGg9IjYiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIzNSIgeT0iMTgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMjMiIHk9IjE4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjIwIiB5PSIxOCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIxNyIgeT0iMTgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjE3IiB5PSIyMSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMzIiIHk9IjIxIiB3aWR0aD0iMTIiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIzMSIgeT0iMjQiIHdpZHRoPSIxMyIgaGVpZ2h0PSIzIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjE3IiB5PSIyNCIgd2lkdGg9IjE0IiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPHJlY3QgeD0iMjAiIHk9IjI3IiB3aWR0aD0iMjEiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIyMyIgeT0iMzAiIHdpZHRoPSIxNSIgaGVpZ2h0PSIzIiBmaWxsPSIjRjk1QjAzIi8+CjxyZWN0IHg9IjI2IiB5PSIzMyIgd2lkdGg9IjkiIGhlaWdodD0iMyIgZmlsbD0iI0Y5NUIwMyIvPgo8cmVjdCB4PSIyOSIgeT0iMzYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiNGOTVCMDMiLz4KPC9zdmc+Cg=="
  };
  const ICON = {
    all: "M2.5 9.5h3l1 1.5h3l1-1.5h3M3.8 3.5h8.4l1.3 6v3h-11v-3z",
    reply: "M3 3.5h10v7H7.5L4.5 13v-2.5H3z",
    heart: "M8 13S2.5 9.8 2.5 6.3A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 5.5 1.3C13.5 9.8 8 13 8 13z",
    bell: "M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14h3",
    megaphone: "M2.5 6.5v3h2l6 3v-9l-6 3zM12.8 6.2v3.6",
    share: "M13.5 2.5 2.5 7l4.5 2 2 4.5zM7 9l3-3",
    star: "M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5l3.8-.5z",
    follow: "M6 7.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5zM2 13c.4-2.2 2-3.5 4-3.5s3.6 1.3 4 3.5M12.5 5.5v4M10.5 7.5h4",
    remix: "M3 5.5h9l-2-2M13 10.5H4l2 2",
    coin: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM6 8h4M8 6v4",
    download: "M8 2.5v7M5 7l3 3 3-3M3 13h10",
    refresh: "M13 8a5 5 0 1 1-1.5-3.6M13 2.5v2.8h-2.8",
    arrow: "M3 8h10M9 4l4 4-4 4",
    eye: "M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    image: "M2.5 3.5h11v9h-11zM2.5 10.5l3-3 2.5 2.5 1.5-1.5 4 3.5M10.5 6.5a1 1 0 1 0 0-.01",
    hash: "M6.5 2.5l-1.5 11M11 2.5l-1.5 11M3 6h10.5M2.5 10H13",
    close: "M4 4l8 8M12 4l-8 8"
  };
  function icon(name, size) {
    const NS = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(NS, "svg");
    const z = String(size || 16);
    s.setAttribute("viewBox", "0 0 16 16");
    s.setAttribute("width", z);
    s.setAttribute("height", z);
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "1.5");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", ICON[name] || ICON.bell);
    s.appendChild(p);
    return s;
  }
  const KC_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSIzNCIgZmlsbD0iIzE3MTcxNyIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwOCIgaGVpZ2h0PSIxMDgiIHJ4PSIyOCIgZmlsbD0iIzI2MjYyNiIgc3Ryb2tlPSIjNTI1MjUyIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzEgNDJjMC04LjI4NCA2LjcxNi0xNSAxNS0xNWgzNmM4LjI4NCAwIDE1IDYuNzE2IDE1IDE1djIxYzAgOC4yODQtNi43MTYgMTUtMTUgMTVINTkuOEw0MS4yIDk0LjZDMzguNiA5Ni45IDM0LjUgOTUgMzQuNSA5MS41Vjc3LjdDMjguMSA3NS45IDIzLjUgNzAgMjMuNSA2M1Y0MkgzMVoiIGZpbGw9IiNmNGY0ZjUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjU0IiByPSI1LjgiIGZpbGw9IiMxNzE3MTciLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjU0IiByPSI1LjgiIGZpbGw9IiM3MzczNzMiLz48Y2lyY2xlIGN4PSI3OCIgY3k9IjU0IiByPSI1LjgiIGZpbGw9IiMxNzE3MTciLz48L3N2Zz4=";
  const CSS = 'html.ccwn-on #root > main { display: none !important; }\nhtml.ccwn-on body { background: linear-gradient(180deg, #181a2b 0%, #12131f 45%, #0f0f18 100%) fixed; }\n.ccwn-app {\n  --bg: #111119; --surface: rgba(28,28,42,.78); --surface-solid: #1c1c2a; --surface-2: rgba(255,255,255,.055); --line: rgba(255,255,255,.065); --line-2: rgba(255,255,255,.12);\n  --text: #ededf3; --text-2: #b6b6c4; --muted: #7d7d8e; --accent: #3ddc84; --accent-ink: #0b1d12; --unread: rgba(61,220,132,.06);\n  --t-green: #3ddc84; --t-blue: #6aa8ff; --t-pink: #ff7a93; --t-amber: #f2b64f; --t-violet: #a58bff; --t-teal: #46d0c0;\n  --top: 60px; --sec-top: 120px;\n  position: relative; isolation: isolate;\n  color: var(--text); font: 14px/1.6 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; padding: 28px 24px 96px; min-height: calc(100vh - 60px);\n}\n.ccwn-app::before {\n  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;\n  background:\n    radial-gradient(60vw 55vh at 6% 4%, rgba(61,220,132,.20), transparent 62%),\n    radial-gradient(55vw 60vh at 96% 0%, rgba(98,112,255,.22), transparent 60%),\n    radial-gradient(50vw 55vh at 100% 100%, rgba(165,110,255,.14), transparent 62%),\n    radial-gradient(45vw 50vh at 0% 100%, rgba(40,190,200,.12), transparent 62%);\n}\n.ccwn-app::after {\n  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;\n  background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1.3px);\n  background-size: 24px 24px;\n  -webkit-mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, rgba(0,0,0,.35) 100%);\n  mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, rgba(0,0,0,.35) 100%);\n}\n.ccwn-app *, .ccwn-app *::before, .ccwn-app *::after { box-sizing: border-box; }\n:where(.ccwn-app) a { color: inherit; text-decoration: none; }\n:where(.ccwn-app) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; line-height: 1; white-space: nowrap; }\n.ccwn-app button:disabled { cursor: default; opacity: .5; }\n.ccwn-layout { max-width: 1560px; margin: 0 auto; display: grid; grid-template-columns: 272px minmax(0, 1fr) 300px; gap: 24px; align-items: start; }\n.ccwn-left, .ccwn-side { position: sticky; top: calc(var(--top) + 24px); display: flex; flex-direction: column; gap: 16px; }\n.ccwn-card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px 16px; box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 24px 60px -24px rgba(0,0,0,.55); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }\n.ccwn-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }\n.ccwn-card-head h2 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text); line-height: 20px; }\n.ccwn-card-empty { color: var(--muted); font-size: 12px; padding: 8px 0; }\n.ccwn-card-sk i { display: block; height: 44px; border-radius: 8px; background: var(--surface-2); margin-top: 8px; animation: ccwn-pulse 1.4s ease-in-out infinite; }\n.ccwn-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n.ccwn-stat { display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 8px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.04); }\n.ccwn-stat-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--tone); grid-row: span 2; align-self: start; margin-top: 9px; }\n.ccwn-stat b { font-size: 20px; line-height: 26px; font-weight: 600; color: var(--text); font-variant-numeric: tabular-nums; }\n.ccwn-stat span { grid-column: 2; font-size: 12px; color: var(--muted); line-height: 16px; }\n.ccwn-chart { margin-top: 16px; }\n.ccwn-chart-head { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); margin-bottom: 8px; }\n.ccwn-readout { color: var(--text-2); font-variant-numeric: tabular-nums; }\n.ccwn-bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; height: 96px; }\n.ccwn-bar { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: default; }\n.ccwn-bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1px solid var(--line); }\n.ccwn-bar-track i { display: block; width: 14px; border-radius: 4px 4px 0 0; background: rgba(61,220,132,.45); transition: background .15s; }\n.ccwn-bar.is-today .ccwn-bar-track i, .ccwn-bar.is-hover .ccwn-bar-track i { background: var(--accent); }\n.ccwn-bar span { font-size: 11px; color: var(--muted); line-height: 14px; }\n.ccwn-bar.is-today span { color: var(--text-2); }\n.ccwn-works { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }\n.ccwn-works a { display: flex; gap: 10px; align-items: center; padding: 6px; margin: 0 -6px; border-radius: 8px; }\n.ccwn-works a:hover { background: rgba(255,255,255,.04); }\n.ccwn-works img, .ccwn-work-ph { flex: none; width: 56px; height: 42px; border-radius: 6px; object-fit: cover; background: var(--surface-2); }\n.ccwn-work-text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }\n.ccwn-work-title { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwn-work-nums { display: flex; gap: 10px; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }\n.ccwn-work-nums > span { display: inline-flex; align-items: center; gap: 3px; }\n.ccwn-work-nums svg { color: var(--tone); }\n.ccwn-fan-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px 6px; }\n.ccwn-fan { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }\n.ccwn-fan .ccwn-avatar { width: 36px; height: 36px; }\n.ccwn-fan span { font-size: 11px; color: var(--muted); max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwn-fan:hover span { color: var(--text); }\n.ccwn-faces { display: flex; padding-left: 4px; }\n.ccwn-faces > * { margin-left: -4px; }\n.ccwn-faces .ccwn-avatar { width: 24px; height: 24px; box-shadow: 0 0 0 2px var(--surface-solid); }\n.ccwn-pix { display: block; image-rendering: pixelated; }\n\n.tone-green { --tone: var(--t-green); } .tone-blue { --tone: var(--t-blue); } .tone-pink { --tone: var(--t-pink); }\n.tone-amber { --tone: var(--t-amber); } .tone-violet { --tone: var(--t-violet); } .tone-teal { --tone: var(--t-teal); }\n\n.ccwn-nav { }\n.ccwn-nav-card, .ccwn-main { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 24px 60px -24px rgba(0,0,0,.55); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }\n.ccwn-nav-card { padding: 8px; display: flex; flex-direction: column; gap: 2px; }\n.ccwn-nav-item { display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: 10px; transition: background .15s; }\n.ccwn-nav-item:hover { background: rgba(255,255,255,.035); }\n.ccwn-nav-item.is-active { background: rgba(255,255,255,.07); box-shadow: inset 0 0 0 1px var(--line); }\n.ccwn-nav-item:first-child { margin-bottom: 6px; position: relative; }\n.ccwn-nav-item:first-child::after { content: ""; position: absolute; left: 10px; right: 10px; bottom: -4px; border-bottom: 1px solid var(--line); }\n.ccwn-tile { flex: none; width: 34px; height: 34px; display: grid; place-items: center; }\n.ccwn-nav-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }\n.ccwn-nav-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.ccwn-nav-label { color: var(--text); font-size: 14px; line-height: 20px; }\n.ccwn-nav-item.is-active .ccwn-nav-label { font-weight: 600; }\n.ccwn-nav-time { color: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }\n.ccwn-nav-preview { color: var(--muted); font-size: 12px; line-height: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwn-count { min-width: 20px; height: 18px; padding: 0 6px; border-radius: 9px; background: var(--accent); color: var(--accent-ink); font-size: 11px; line-height: 18px; text-align: center; font-weight: 600; font-variant-numeric: tabular-nums; }\n\n.ccwn-main { min-width: 0; }\n.ccwn-toolbar { position: sticky; top: var(--top); z-index: 6; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 20px; background: rgba(27,27,40,.98); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); border-radius: 14px 14px 0 0; }\n.ccwn-title { display: flex; align-items: baseline; gap: 10px; min-width: 0; }\n.ccwn-title h1 { margin: 0; font-size: 18px; font-weight: 600; line-height: 28px; color: var(--text); }\n.ccwn-sub { color: var(--muted); font-size: 13px; }\n.ccwn-tools { display: flex; align-items: center; gap: 8px; }\n.ccwn-seg { display: flex; padding: 2px; border-radius: 8px; background: rgba(0,0,0,.25); border: 1px solid var(--line); margin-right: 4px; }\n.ccwn-seg button { height: 26px; padding: 0 12px; border-radius: 6px; color: var(--muted); font-size: 13px; }\n.ccwn-seg button.is-on { background: rgba(255,255,255,.09); color: var(--text); }\n.ccwn-chip, .ccwn-btn { height: 30px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--line-2) !important; color: var(--text-2); font-size: 13px; transition: border-color .15s, color .15s, background .15s; }\n.ccwn-chip:hover, .ccwn-btn:hover:not(:disabled) { color: var(--text); border-color: rgba(255,255,255,.22) !important; }\n.ccwn-chip.is-on { color: var(--accent); border-color: rgba(61,220,132,.45) !important; background: rgba(61,220,132,.08); }\n.ccwn-btn.is-primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent) !important; font-weight: 600; }\n.ccwn-btn.is-primary:hover:not(:disabled) { color: var(--accent-ink); filter: brightness(1.06); }\n.ccwn-btn.is-small { height: 28px; padding: 0 14px; }\n.ccwn-btn.is-tiny { height: 22px; padding: 0 10px; font-size: 12px; }\n.ccwn-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 8px; color: var(--muted); }\n.ccwn-icon:hover { background: rgba(255,255,255,.06); color: var(--text); }\n\n.ccwn-section { position: sticky; top: calc(var(--sec-top) - 1px); z-index: 5; display: flex; align-items: center; gap: 10px; padding: 10px 20px 8px; font-size: 12px; color: var(--text-2); background: #1b1b28; box-shadow: 0 -10px 0 0 #1b1b28; }\n.ccwn-section::after { content: ""; flex: 1; border-top: 1px solid var(--line); }\n.ccwn-section b { font-weight: 400; color: var(--muted); font-variant-numeric: tabular-nums; }\n\n.ccwn-row { position: relative; z-index: 0; display: grid; grid-template-columns: 40px minmax(0, 1fr) 64px; column-gap: 14px; padding: 12px 20px; transition: background .6s; align-items: center; min-height: 72px; }\n/* 有正文、引用、展开列表或回复框的行：头像与第一行对齐 */\n.ccwn-row:has(.ccwn-main-col > :nth-child(2)) { align-items: start; }\n.ccwn-row + .ccwn-row::before { content: ""; position: absolute; left: 74px; right: 20px; top: 0; border-top: 1px solid var(--line); }\n.ccwn-row:hover { background: rgba(255,255,255,.022); }\n.ccwn-row.is-unread { background: var(--unread); }\n.ccwn-row.is-unread::after { content: ""; position: absolute; left: 7px; top: calc(50% - 3px); width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px rgba(61,220,132,.6); }\n.ccwn-lead { position: relative; width: 40px; height: 40px; }\n.ccwn-avatar-link { display: block; }\n.ccwn-avatar { display: block; border-radius: 50%; object-fit: cover; background: var(--surface-2); }\n.ccwn-lead > .ccwn-avatar, .ccwn-lead > .ccwn-avatar-link > .ccwn-avatar { width: 40px; height: 40px; }\n.ccwn-badge { position: absolute; right: -3px; bottom: -3px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; color: #12121a; background: var(--tone); box-shadow: 0 0 0 2px var(--surface-solid); z-index: 4; }\n.ccwn-badge svg { stroke-width: 2.2; }\n.ccwn-sys-face { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.06); }\n.ccwn-stack { position: relative; width: 40px; height: 40px; }\n.ccwn-stack > * { position: absolute; }\n.ccwn-stack .ccwn-avatar { width: 26px; height: 26px; box-shadow: 0 0 0 2px var(--surface-solid); }\n.ccwn-stack > *:nth-child(1) { left: 0; top: 0; z-index: 3; }\n.ccwn-stack > *:nth-child(2) { left: 14px; top: 4px; z-index: 2; }\n.ccwn-stack > *:nth-child(3) { left: 6px; top: 14px; z-index: 1; }\n.ccwn-main-col { min-width: 0; }\n.ccwn-aside { display: flex; justify-content: flex-end; align-items: center; }\n.ccwn-row:has(.ccwn-main-col > :nth-child(2)) .ccwn-aside { align-items: flex-start; }\n.ccwn-row:has(.ccwn-main-col > :nth-child(2)).is-unread::after { top: 29px; }\n.ccwn-line { display: flex; align-items: flex-start; gap: 12px; }\n.ccwn-head { flex: 1; min-width: 0; color: var(--text-2); line-height: 22px; overflow-wrap: anywhere; }\n.ccwn-head > * + * { margin-left: 5px; }\n.ccwn-head > .ccwn-sep, .ccwn-head > .ccwn-sep + * { margin-left: 0; }\n.ccwn-user { color: var(--text); font-weight: 600; }\n.ccwn-user:hover, .ccwn-subject:hover { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(255,255,255,.3); }\n.ccwn-verb { color: var(--muted); }\n.ccwn-subject { color: var(--text); }\n.ccwn-sys-title { color: var(--text); font-weight: 600; }\n.ccwn-meta { position: relative; flex: none; display: flex; justify-content: flex-end; min-width: 64px; height: 22px; }\n.ccwn-time { color: var(--muted); font-size: 12px; line-height: 22px; font-variant-numeric: tabular-nums; white-space: nowrap; }\n.ccwn-hover { position: absolute; right: 0; top: 0; display: flex; gap: 4px; padding-left: 16px; background: linear-gradient(90deg, transparent, #1f1f2e 16px); opacity: 0; pointer-events: none; transition: opacity .12s; }\n.ccwn-row:hover .ccwn-hover, .ccwn-row:focus-within .ccwn-hover { opacity: 1; pointer-events: auto; }\n.ccwn-row:hover .ccwn-meta .ccwn-time, .ccwn-row:focus-within .ccwn-meta .ccwn-time { opacity: 0; }\n.ccwn-act { white-space: nowrap; height: 22px; padding: 0 8px; border-radius: 6px; font-size: 12px !important; line-height: 22px !important; color: var(--text-2) !important; background: rgba(255,255,255,.07); }\n.ccwn-act:hover { color: var(--text) !important; background: rgba(255,255,255,.12); }\n.ccwn-body { margin-top: 3px; color: var(--text); white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.65; }\n.ccwn-body.is-system { color: var(--text-2); }\n.ccwn-body a { color: var(--accent); }\n.ccwn-body.is-muted { color: var(--muted); font-size: 13px; }\n.ccwn-body.is-quote { color: var(--muted); font-size: 13px; padding-left: 10px; border-left: 2px solid var(--line-2); margin-top: 4px; }\n.ccwn-body.is-clamped { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }\n.ccwn-body.is-quote.is-clamped { -webkit-line-clamp: 2; }\n.ccwn-more { margin-top: 2px; color: var(--muted) !important; font-size: 12px !important; line-height: 20px !important; }\n.ccwn-more:hover { color: var(--text) !important; }\n.ccwn-emoji { width: 22px; height: 22px; vertical-align: -5px; margin: 0 1px; object-fit: contain; }\n.ccwn-img { display: inline-block; margin-top: 4px; }\n.ccwn-body img:not(.ccwn-emoji):not(.ccwn-avatar) { cursor: zoom-in; }\n.ccwn-img img { display: block; max-width: 220px; max-height: 160px; border-radius: 6px; border: 1px solid var(--line); }\n.ccwn-sub-actions { margin-top: 4px; display: flex; align-items: center; gap: 10px; }\n.ccwn-link { color: var(--muted) !important; font-size: 12px !important; line-height: 20px !important; }\n.ccwn-link:hover { color: var(--accent) !important; }\n.ccwn-thumb { display: block; width: 64px; height: 48px; border-radius: 8px; overflow: hidden; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); }\n.ccwn-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.ccwn-muted-tag { color: var(--muted); font-size: 12px; line-height: 28px; white-space: nowrap; }\n.ccwn-agg-list { list-style: none; margin: 8px 0 2px; padding: 6px 0 0; border-top: 1px solid var(--line); display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 2px 18px; }\n.ccwn-agg-list li { display: flex; align-items: center; gap: 8px; height: 32px; min-width: 0; font-size: 13px; }\n.ccwn-agg-list li .ccwn-user { font-weight: 400; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }\n.ccwn-agg-list li.is-unread .ccwn-user { color: var(--text); }\n.ccwn-agg-list li .ccwn-time { margin-left: auto; }\n.ccwn-agg-list li .ccwn-muted-tag { line-height: 22px; }\n.ccwn-agg-list .ccwn-avatar { width: 22px; height: 22px; }\n\n.ccwn-compose { margin-top: 10px; border: 1px solid var(--line-2); border-radius: 10px; background: rgba(0,0,0,.22); }\n.ccwn-compose:focus-within { border-color: rgba(61,220,132,.5); }\n.ccwn-compose textarea { display: block; width: 100%; min-height: 64px; resize: vertical; padding: 10px 12px; background: transparent; border: 0; outline: 0; color: var(--text); font: inherit; }\n.ccwn-compose-bar { display: flex; align-items: center; gap: 8px; padding: 6px 8px 8px 12px; }\n.ccwn-compose-status { flex: 1; font-size: 12px; color: var(--muted); }\n.ccwn-compose-status.is-error { color: #ff7b72; }\n.ccwn-hint { font-size: 12px; color: var(--muted); margin-right: 4px; }\n.ccwn-compose .ccwn-btn { height: 28px; }\n\n.ccwn-foot { min-height: 1px; }\n.ccwn-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 20px; color: var(--muted); font-size: 13px; border-top: 1px solid var(--line); }\n.ccwn-state.is-end { font-size: 12px; }\n.ccwn-empty { padding: 96px 20px; text-align: center; color: var(--muted); }\n.ccwn-empty-title { font-size: 14px; }\n.ccwn-skeleton { padding: 8px 0; }\n.ccwn-sk-row { display: flex; gap: 14px; padding: 14px 20px; }\n.ccwn-sk-row i { width: 40px; height: 40px; border-radius: 50%; background: var(--surface-2); flex: none; }\n.ccwn-sk-row div { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }\n.ccwn-sk-row b, .ccwn-sk-row s { display: block; height: 10px; border-radius: 5px; background: var(--surface-2); animation: ccwn-pulse 1.4s ease-in-out infinite; }\n.ccwn-sk-row b { width: 46%; } .ccwn-sk-row s { width: 72%; }\n@keyframes ccwn-pulse { 50% { opacity: .5; } }\n\n.ccwn-toast { position: fixed; left: 50%; bottom: 32px; transform: translate(-50%, 8px); padding: 8px 16px; border-radius: 8px; background: #2a2a3b; border: 1px solid var(--line-2); color: var(--text); font-size: 13px; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; z-index: 1000; }\n.ccwn-toast.is-on { opacity: 1; transform: translate(-50%, 0); }\n\nhtml.ccwf-on #root > :not(:first-child) { display: none !important; }\nhtml.ccwf-on body { background: linear-gradient(180deg, #181a2b 0%, #12131f 45%, #0f0f18 100%) fixed; }\n.ccwf-layout { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 260px minmax(0, 720px) 300px; justify-content: center; gap: 28px; align-items: start; }\n.ccwf-main { min-width: 0; }\n.ccwf-top { display: flex; align-items: center; justify-content: space-between; padding: 4px 4px 16px; }\n.ccwf-top .ccwn-title h1 { font-size: 22px; }\n\n.ccwf-card { position: relative; margin-bottom: 16px; padding: 18px 20px 20px; border-radius: 18px; background: rgba(28,28,42,.82); border: 1px solid rgba(255,255,255,.06); box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 18px 40px -24px rgba(0,0,0,.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: border-color .2s, transform .2s; }\n.ccwf-card:hover { border-color: rgba(255,255,255,.11); }\n\n.ccwf-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }\n.ccwf-head .ccwn-avatar, .ccwf-head .ccwn-avatar-link .ccwn-avatar { width: 40px; height: 40px; }\n.ccwf-avs { display: flex; flex: none; }\n.ccwf-avs > * { margin-left: -12px; }\n.ccwf-avs > *:first-child { margin-left: 0; }\n.ccwf-avs .ccwn-avatar { box-shadow: 0 0 0 2px #1c1c2a; }\n.ccwf-who { flex: 1; min-width: 0; }\n.ccwf-names { font-size: 15px; line-height: 21px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwf-name { color: var(--text); font-weight: 600; }\n.ccwf-name:hover { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(255,255,255,.3); }\n.ccwf-sep { color: var(--muted); }\n.ccwf-sub { font-size: 13px; color: var(--muted); line-height: 19px; }\n.ccwf-dot { margin: 0 6px; }\n.ccwf-chip { flex: none; align-self: flex-start; height: 22px; line-height: 22px; padding: 0 9px; border-radius: 11px; font-size: 12px; color: var(--tone); background: color-mix(in srgb, var(--tone) 12%, transparent); }\n\n.ccwf-media { display: flex; gap: 18px; padding: 0; color: inherit; }\n.ccwf-cover { position: relative; flex: none; width: 224px; height: 168px; border-radius: 12px; overflow: hidden; background: var(--surface-2); box-shadow: 0 0 0 1px rgba(255,255,255,.06) inset; }\n.ccwf-cover.is-wide { width: 256px; height: 144px; }\n.ccwf-cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }\n.ccwf-media:hover .ccwf-cover img { transform: scale(1.035); }\n.ccwf-badge { position: absolute; right: 8px; bottom: 8px; height: 22px; line-height: 22px; padding: 0 8px; border-radius: 11px; font-size: 12px; font-weight: 600; color: #0b1d12; background: var(--accent); }\n.ccwf-badge.is-left { left: 8px; right: auto; top: 8px; bottom: auto; color: #fff; font-weight: 400; background: rgba(0,0,0,.55); backdrop-filter: blur(4px); }\n.ccwf-badge.is-gold { color: #2a1d00; background: #f2b64f; }\n.ccwf-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; padding-top: 2px; }\n.ccwf-text h3 { margin: 0; font-size: 18px; line-height: 26px; font-weight: 600; color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\n.ccwf-media:hover h3 { color: #fff; }\n.ccwf-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }\n.ccwf-label span { padding: 0 7px; height: 18px; line-height: 18px; border-radius: 9px; background: rgba(255,255,255,.06); }\n.ccwf-text p { margin: 0; font-size: 14px; line-height: 1.7; color: var(--text-2); white-space: pre-line; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }\n.ccwf-text p.is-muted { color: var(--muted); }\n.ccwf-by { display: flex; align-items: center; gap: 6px; margin-top: auto; font-size: 13px; color: var(--muted); }\n.ccwf-by .ccwn-avatar { width: 20px; height: 20px; }\n.ccwf-tags { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 13px; color: var(--accent); }\n\n.ccwf-stats { display: flex; gap: 18px; margin-top: auto; padding-top: 4px; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }\n.ccwf-stats > span { display: inline-flex; align-items: center; gap: 5px; }\n\n.ccwf-rehead { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 13px; color: var(--muted); }\n.ccwf-re-icon { display: inline-flex; color: var(--tone); }\n.ccwf-rehead .ccwn-avatar { width: 22px; height: 22px; }\n.ccwf-rehead .ccwf-name { font-size: 14px; }\n.ccwf-re-act { color: var(--muted); }\n.ccwf-people:has(> .ccwf-person:only-child) { grid-template-columns: minmax(0, 1fr); }\n.ccwf-people:has(> .ccwf-person:only-child) .ccwf-person { flex-direction: row; justify-content: space-between; padding: 12px 16px; }\n.ccwf-people:has(> .ccwf-person:only-child) .ccwf-person-link { flex-direction: row; gap: 12px; text-align: left; }\n.ccwf-people:has(> .ccwf-person:only-child) .ccwf-person .ccwn-avatar { width: 44px; height: 44px; margin: 0; }\n.ccwf-card.is-compact { padding: 14px 18px 16px; }\n.ccwf-card.is-compact .ccwf-rehead { margin-bottom: 10px; }\n.ccwf-mini-quote { display: flex; gap: 14px; padding: 10px; border-radius: 12px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.05); transition: background .15s; }\n.ccwf-mini-quote:hover { background: rgba(255,255,255,.06); }\n.ccwf-mq-cover { flex: none; width: 112px; height: 84px; border-radius: 8px; overflow: hidden; background: var(--surface-2); }\n.ccwf-mq-cover.is-wide { width: 136px; height: 76px; }\n.ccwf-mq-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.ccwf-mq-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 2px 0; }\n.ccwf-mq-text > b { font-size: 15px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwf-mq-by { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); min-width: 0; }\n.ccwf-mq-by > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwf-mq-by .ccwn-avatar { width: 18px; height: 18px; }\n.ccwf-mq-text .ccwf-stats { font-size: 12px; gap: 14px; }\n.ccwf-quote { padding: 14px; border-radius: 14px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.06); }\n.ccwf-qhead { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 14px; }\n.ccwf-qhead .ccwn-avatar { width: 28px; height: 28px; }\n.ccwf-quote .ccwf-cover { width: 192px; height: 144px; }\n.ccwf-quote .ccwf-cover.is-wide { width: 224px; height: 126px; }\n.ccwf-quote .ccwf-text h3 { font-size: 16px; line-height: 24px; }\n\n.ccwf-wall { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }\n.ccwf-wall.is-wide { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n.ccwf-tile { position: relative; display: block; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: var(--surface-2); }\n.ccwf-wall.is-wide .ccwf-tile { aspect-ratio: 16 / 9; }\n.ccwf-tile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }\n.ccwf-tile:hover img { transform: scale(1.05); }\n.ccwf-tile-cap { position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; padding: 28px 10px 8px; background: linear-gradient(180deg, transparent, rgba(0,0,0,.78)); }\n.ccwf-tile-cap b { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwf-tile-cap span { font-size: 11px; color: rgba(255,255,255,.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n\n.ccwf-people { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }\n.ccwf-person { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 10px 14px; border-radius: 14px; background: rgba(255,255,255,.04); }\n.ccwf-person-link { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; max-width: 100%; text-align: center; }\n.ccwf-person .ccwn-avatar { width: 56px; height: 56px; margin-bottom: 4px; }\n.ccwf-person b { font-size: 14px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }\n.ccwf-person-link > span { font-size: 12px; color: var(--muted); white-space: nowrap; }\n.ccwf-followed { font-size: 12px; color: var(--muted); line-height: 22px; }\n.ccwf-more { display: block; margin: 12px auto 0; font-size: 13px !important; color: var(--text-2) !important; padding: 6px 14px !important; border-radius: 14px; background: rgba(255,255,255,.05) !important; }\n.ccwf-more:hover { color: var(--text) !important; background: rgba(255,255,255,.09) !important; }\n\n.ccwf-day { display: flex; justify-content: center; margin: 26px 0 14px; }\n.ccwf-day.is-first { margin-top: 0; }\n.ccwf-day span { height: 26px; line-height: 26px; padding: 0 14px; border-radius: 13px; font-size: 12px; color: var(--text-2); background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.06); }\n\n.ccwf-state { padding: 24px; text-align: center; font-size: 13px; color: var(--muted); }\n.ccwf-state .ccwn-btn { margin-left: 12px; }\n.ccwf-state.is-empty { padding: 80px 20px; }\n.ccwf-sk-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }\n.ccwf-sk-head i { width: 40px; height: 40px; border-radius: 50%; background: var(--surface-2); }\n.ccwf-sk-head b, .ccwf-sk-body b, .ccwf-sk-body s { display: block; height: 12px; border-radius: 6px; background: var(--surface-2); animation: ccwn-pulse 1.4s ease-in-out infinite; }\n.ccwf-sk-head b { width: 160px; }\n.ccwf-sk-body { display: flex; gap: 18px; }\n.ccwf-sk-body > i { width: 224px; height: 168px; border-radius: 12px; background: var(--surface-2); animation: ccwn-pulse 1.4s ease-in-out infinite; }\n.ccwf-sk-body > div { flex: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 6px; }\n.ccwf-sk-body b { width: 60%; height: 16px; }\n.ccwf-sk-body s { width: 90%; }\n\n.ccwf-mecard { padding: 18px; }\n.ccwf-me-head { display: flex; gap: 12px; align-items: center; }\n.ccwf-me-head .ccwn-avatar { width: 48px; height: 48px; }\n.ccwf-me-head > span { display: flex; flex-direction: column; min-width: 0; }\n.ccwf-me-head b { font-size: 16px; color: var(--text); }\n.ccwf-me-head > span > span { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwf-me-stats { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 16px; text-align: center; }\n.ccwf-me-stats b { display: block; font-size: 17px; color: var(--text); font-variant-numeric: tabular-nums; }\n.ccwf-me-stats span { font-size: 12px; color: var(--muted); }\n.ccwf-me + .ccwn-nav { margin-top: 0; }\n.ccwf-recs { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }\n.ccwf-recs li { display: flex; align-items: center; gap: 10px; padding: 6px 0; }\n.ccwf-recs .ccwn-avatar { width: 36px; height: 36px; }\n.ccwf-rec-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.ccwf-rec-text b { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwf-rec-text span { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n@media (max-width: 1280px) {\n  .ccwf-layout { grid-template-columns: 240px minmax(0, 720px); }\n  .ccwf-layout .ccwn-side { display: none; }\n}\n@media (max-width: 960px) {\n  .ccwf-layout { grid-template-columns: minmax(0, 1fr); padding: 0 12px; }\n  .ccwf-layout .ccwn-left { display: none; }\n  .ccwf-media { flex-direction: column; }\n  .ccwf-cover, .ccwf-cover.is-wide { width: 100%; height: auto; aspect-ratio: 4 / 3; }\n  .ccwf-wall, .ccwf-people { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n}\n\n/* ---------- 消息中心里的私信 / 好友：中栏和右栏交给停靠进来的 KukeChat ---------- */\nhtml.ccwk-chat .ccwn-main, html.ccwk-chat .ccwn-side { display: none !important; }\n/* 停靠的 KukeChat 是固定定位、按占位块的位置贴上去的：页面一滚，窗口要晚一帧才跟上，看着像整个窗口在滚。\n   私信视图里没有要滚的内容（左栏导航和占位块都在一屏内），直接锁住页面滚动 */\nhtml.ccwk-chat, html.ccwk-chat body { overflow: hidden !important; overscroll-behavior: none; }\n.ccwk-slot { grid-column: 2 / span 2; position: sticky; top: calc(var(--top) + 24px); height: calc(100vh - var(--top) - 48px); min-height: 360px; border-radius: 14px; background: rgba(28,28,42,.82); border: 1px solid rgba(255,255,255,.065); display: grid; place-items: center; }\n.ccwk-loading { color: var(--muted); font-size: 13px; }\n.ccwk-loading.is-error { color: #ff7b72; }\n.ccwk-slot.is-ready .ccwk-loading { display: none; }\n.ccwk-tile { width: 28px; height: 28px; border-radius: 8px; display: block; }\n@media (max-width: 1280px) { .ccwk-slot { grid-column: 2 / span 1; } }\n\n/* ---------- 顶栏信封：CCW 未读 + 私信未读 ---------- */\nhtml.ccwk-badge #root header [class*="totalNotice-"] { display: none !important; }\n.ccwk-env-badge { position: absolute; top: -4px; right: -6px; z-index: 2; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #ff4d4f; color: #fff; font: 600 11px/18px "PingFang SC", "Microsoft YaHei", sans-serif; text-align: center; pointer-events: none; }\n\n/* ---------- 全站新消息提醒 ---------- */\n\n/* ---------- KukeChat 名片 / 作品群卡片（插在 CCW 原有的右栏卡片里，沿用它的外框类名） ---------- */\n.ccwk-card { height: auto !important; margin-bottom: 24px; padding: 18px 20px !important; display: flex; flex-direction: column; gap: 12px; font: 14px/1.5 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; color: #ececf2; text-align: left; }\n.ccwk-card a { color: inherit; text-decoration: none; }\n.ccwk-card-head { display: flex; align-items: center; justify-content: space-between; }\n.ccwk-brand { display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }\n.ccwk-brand img { width: 20px; height: 20px; border-radius: 6px; }\n.ccwk-state { font-size: 12px; color: #80808f; display: inline-flex; align-items: center; gap: 6px; }\n.ccwk-state::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #5c5c6b; }\n.ccwk-state.is-online { color: #3ddc84; }\n.ccwk-state.is-online::before { background: #3ddc84; }\n.ccwk-who { display: flex; align-items: center; gap: 12px; min-width: 0; }\n.ccwk-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex: none; background: rgba(255,255,255,.06); }\n.ccwk-avatar.is-square { border-radius: 12px; }\n.ccwk-who-text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }\n.ccwk-name { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; min-width: 0; }\n.ccwk-name > span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwk-lv, .ccwk-clv { flex: none; padding: 0 6px; height: 18px; border-radius: 5px; background: rgba(61,220,132,.14); color: #5fe39b; font: 600 11px/18px "PingFang SC", "Microsoft YaHei", sans-serif; }\n.ccwk-clv { display: inline-block; margin-left: 6px; vertical-align: middle; }\n.ccwk-muted { color: #80808f; font-size: 12px; }\n.ccwk-activity { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: rgba(61,220,132,.08); color: #a9efc6 !important; font-size: 13px; }\n.ccwk-activity:hover { background: rgba(61,220,132,.13); }\n.ccwk-dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: #3ddc84; }\n.ccwk-facts { font-size: 13px; color: #b6b6c4; }\n.ccwk-gifts { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }\n.ccwk-gift { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.05); font-size: 12px; color: #b6b6c4; }\n.ccwk-gift i { font-style: normal; font-size: 14px; }\n.ccwk-sub-title { font-size: 12px; color: #80808f; margin-bottom: 6px; }\n.ccwk-posts { border-top: 1px solid rgba(255,255,255,.06); padding-top: 10px; }\n.ccwk-post { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; font-size: 13px; }\n.ccwk-post-text { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #d4d4de; }\n.ccwk-post .ccwk-muted { flex: none; }\n.ccwk-actions { display: flex; flex-wrap: wrap; gap: 8px; }\n.ccwk-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 16px; border-radius: 18px; border: 0; background: rgba(255,255,255,.08); color: #ececf2 !important; font: 500 14px/1 "PingFang SC", "Microsoft YaHei", sans-serif; cursor: pointer; white-space: nowrap; text-decoration: none !important; }\n.ccwk-btn:hover { background: rgba(255,255,255,.13); }\n.ccwk-btn.is-primary { background: #3ddc84; color: #10241a !important; }\n.ccwk-btn.is-primary:hover { background: #52e293; }\n.ccwk-btn:disabled { opacity: .55; cursor: default; }\n.ccwk-btn.is-sm { flex: none; height: 30px; padding: 0 14px; font-size: 13px; border-radius: 15px; }\n.ccwk-pill { display: inline-flex; align-items: center; gap: 6px; margin-left: 12px; padding: 0 16px; min-height: 32px; border-radius: 999px; border: 0; background: #fff; color: #14141f !important; font: 500 14px/1 "PingFang SC", "Microsoft YaHei", sans-serif; cursor: pointer; text-decoration: none !important; vertical-align: middle; }\n.ccwk-pill img { width: 18px; height: 18px; border-radius: 5px; }\n.ccwk-pill:disabled { opacity: .7; cursor: default; }\n.ccwk-playing { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #b6b6c4; }\n.ccwk-playing b { color: #ececf2; font-weight: 600; }\n.ccwk-faces { display: inline-flex; flex: none; }\n.ccwk-faces img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 2px solid #23232f; margin-left: -8px; background: #2a2a38; }\n.ccwk-faces img:first-child { margin-left: 0; }\n.ccwk-invite { border-top: 1px solid rgba(255,255,255,.06); padding-top: 10px; }\n.ccwk-invite-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow: auto; }\n.ccwk-invite-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }\n.ccwk-invite-row img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }\n.ccwk-invite-row span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n\n/* ---------- 评论区 ---------- */\n.ccwk-cdot { position: absolute; right: 0; bottom: 0; width: 10px; height: 10px; border-radius: 50%; background: #3ddc84; box-shadow: 0 0 0 2px #1b1b28; }\n.ccwk-cdm { margin-right: 16px; color: inherit; text-decoration: none; }\n\n/* ---------- 互关邀请横幅 ---------- */\n.ccwk-banner { display: flex; align-items: center; gap: 14px; margin: 0 0 16px; padding: 12px 16px; border-radius: 14px; background: linear-gradient(90deg, rgba(61,220,132,.10), rgba(61,220,132,.03)); border: 1px solid rgba(61,220,132,.18); }\n.ccwk-banner .ccwk-faces img { border-color: #1e2a28; }\n.ccwk-banner-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.ccwk-banner-text b { font-size: 14px; font-weight: 600; color: #ececf2; }\n.ccwk-banner-text span { font-size: 12px; color: #9a9aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwk-banner-x { flex: none; width: 24px; height: 24px; border: 0; border-radius: 6px; background: none; color: #80808f; font-size: 16px; cursor: pointer; }\n.ccwk-banner-x:hover { background: rgba(255,255,255,.08); color: #ececf2; }\n\n/* ---------- 动态页：KukeChat 动态、输入框、好友在玩 ---------- */\n.ccwk-chip { display: inline-flex; align-items: center; gap: 5px; background: rgba(61,220,132,.12) !important; color: #5fe39b !important; }\n.ccwk-chip img { width: 14px; height: 14px; border-radius: 4px; }\n.ccwk-feed-body { display: flex; flex-direction: column; gap: 10px; padding-left: 52px; }\n.ccwk-feed-text { white-space: pre-wrap; word-break: break-word; font-size: 15px; line-height: 1.65; color: #e4e4ec; display: -webkit-box; -webkit-line-clamp: 8; -webkit-box-orient: vertical; overflow: hidden; }\n.ccwk-feed-imgs { display: grid; gap: 6px; max-width: 420px; }\n.ccwk-feed-imgs.n1 { grid-template-columns: 1fr; max-width: 320px; }\n.ccwk-feed-imgs.n2, .ccwk-feed-imgs.n4 { grid-template-columns: 1fr 1fr; }\n.ccwk-feed-imgs.n3 { grid-template-columns: 1fr 1fr 1fr; }\n.ccwk-feed-imgs img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; display: block; }\n.ccwk-feed-imgs.n1 img { aspect-ratio: auto; max-height: 360px; }\n.ccwk-feed-repost { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.04); font-size: 13px; color: #b6b6c4; }\n.ccwk-feed-repost b { color: #d4d4de; font-weight: 600; }\n.ccwk-cp { padding: 14px 18px !important; }\n.ccwk-cp-row { display: flex; align-items: flex-start; gap: 12px; }\n.ccwk-cp-av { flex: none; width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }\n.ccwk-cp-input { flex: 1; min-width: 0; box-sizing: border-box; height: 36px; max-height: 320px; padding: 7px 0; border: 0; outline: none; resize: none; background: transparent; color: #ececf2; font: 15px/22px "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; overflow-y: auto; }\n.ccwk-cp-input::placeholder { color: #6f6f80; }\n.ccwk-cp-mark { flex: none; width: 18px; height: 18px; margin-top: 9px; border-radius: 5px; opacity: .55; transition: opacity .15s; }\n.ccwk-cp:hover .ccwk-cp-mark, .ccwk-cp.is-open .ccwk-cp-mark { opacity: .9; }\n.ccwk-cp-bar { display: none; align-items: center; justify-content: space-between; gap: 12px; margin: 12px 0 0 48px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.06); }\n.ccwk-cp.is-open .ccwk-cp-bar { display: flex; }\n.ccwk-cp-seg { display: inline-flex; padding: 2px; border-radius: 8px; background: rgba(255,255,255,.05); }\n.ccwk-cp-opt { height: 26px; padding: 0 12px; border: 0; border-radius: 6px; background: none; color: #8a8a9a; font: 500 12px/26px "PingFang SC", "Microsoft YaHei", sans-serif; cursor: pointer; }\n.ccwk-cp-opt:hover { color: #d4d4de; }\n.ccwk-cp-opt.is-on { background: rgba(255,255,255,.1); color: #ececf2; }\n.ccwk-cp-right { display: inline-flex; align-items: center; gap: 12px; }\n.ccwk-cp-note, .ccwk-cp-count { font-size: 12px; color: #80808f; }\n.ccwk-cp-send { height: 30px; padding: 0 18px; border: 0; border-radius: 15px; background: #3ddc84; color: #10241a; font: 600 13px/30px "PingFang SC", "Microsoft YaHei", sans-serif; cursor: pointer; transition: background .15s, opacity .15s; }\n.ccwk-cp-send:hover:not(:disabled) { background: #52e293; }\n.ccwk-cp-send:disabled { background: rgba(255,255,255,.08); color: #6f6f80; cursor: default; }\n.ccwk-cp-body { flex: 1; min-width: 0; position: relative; display: flex; }\n.ccwk-cp.is-drop { box-shadow: 0 0 0 2px rgba(61,220,132,.55) inset; }\n.ccwk-cp-left { display: inline-flex; align-items: center; gap: 6px; }\n.ccwk-cp-tool { width: 30px; height: 30px; display: inline-grid; place-items: center; border: 0; border-radius: 8px; background: none; color: #9a9aaa; cursor: pointer; }\n.ccwk-cp-tool:hover:not(:disabled) { background: rgba(255,255,255,.07); color: #ececf2; }\n.ccwk-cp-tool:disabled { opacity: .4; cursor: default; }\n.ccwk-cp-left .ccwk-cp-seg { margin-left: 6px; }\n.ccwk-cp-imgs { display: none; flex-wrap: wrap; gap: 8px; margin: 10px 0 0 48px; }\n.ccwk-cp-imgs.has-images { display: flex; }\n.ccwk-cp-img { position: relative; width: 76px; height: 76px; border-radius: 10px; overflow: hidden; background: rgba(255,255,255,.05); }\n.ccwk-cp-img img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.ccwk-cp-img.is-busy img { opacity: .45; }\n.ccwk-cp-img.is-error img { opacity: .3; }\n.ccwk-cp-spin { position: absolute; left: 50%; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border: 2px solid rgba(255,255,255,.25); border-top-color: #fff; border-radius: 50%; animation: ccwk-spin .8s linear infinite; }\n@keyframes ccwk-spin { to { transform: rotate(360deg); } }\n.ccwk-cp-err { position: absolute; left: 0; right: 0; bottom: 0; padding: 2px 0; background: rgba(255,77,79,.85); color: #fff; font-size: 11px; text-align: center; }\n.ccwk-cp-rm { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; cursor: pointer; opacity: 0; transition: opacity .15s; }\n.ccwk-cp-img:hover .ccwk-cp-rm, .ccwk-cp-img.is-error .ccwk-cp-rm { opacity: 1; }\n.ccwk-cp-suggest { display: none; position: absolute; left: 0; top: calc(100% + 6px); z-index: 20; min-width: 240px; max-width: 360px; padding: 6px; border-radius: 12px; background: #262636; border: 1px solid rgba(255,255,255,.08); box-shadow: 0 18px 40px rgba(0,0,0,.5); }\n.ccwk-cp-suggest.is-open { display: block; }\n.ccwk-cp-sg-title { padding: 4px 8px 6px; font-size: 11px; color: #80808f; }\n.ccwk-cp-sg { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 8px; border: 0; border-radius: 8px; background: none; color: #ececf2; font: 13px/1.4 "PingFang SC", "Microsoft YaHei", sans-serif; text-align: left; cursor: pointer; }\n.ccwk-cp-sg b { font-weight: 500; color: #5fe39b; }\n.ccwk-cp-sg span { font-size: 11px; color: #80808f; }\n.ccwk-cp-sg.is-on, .ccwk-cp-sg:hover { background: rgba(255,255,255,.07); }\n.ccwk-topic { color: #5fe39b; }\n.ccwk-acts { display: flex; gap: 4px; margin-left: -8px; }\n.ccwk-act { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 0; border-radius: 8px; background: none; color: #8a8a9a; font: 13px/1 "PingFang SC", "Microsoft YaHei", sans-serif; cursor: pointer; }\n.ccwk-act:hover:not(:disabled) { background: rgba(255,255,255,.06); color: #d4d4de; }\n.ccwk-act.is-on { color: #5fe39b; }\n.ccwk-act:first-child.is-on { color: #ff6b81; }\n.ccwk-act:first-child.is-on svg path { fill: currentColor; }\n.ccwk-acts.is-readonly .ccwk-act { pointer-events: none; }\n.ccwk-rp, .ccwk-cmts { display: none; }\n.ccwk-feed-card.is-reposting .ccwk-rp { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,.035); }\n.ccwk-feed-card.is-comments .ccwk-cmts { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.06); }\n.ccwk-rp-title { font-size: 12px; color: #80808f; }\n.ccwk-rp-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.ccwk-cm-list { display: flex; flex-direction: column; gap: 12px; max-height: 420px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }\n.ccwk-cm-empty { color: #80808f; font-size: 13px; padding: 4px 0; }\n.ccwk-cm { display: flex; gap: 10px; }\n.ccwk-cm-av { flex: none; width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }\n.ccwk-cm-main { min-width: 0; flex: 1; }\n.ccwk-cm-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #80808f; }\n.ccwk-cm-meta a, .ccwk-cm-meta b { color: #c9c9d6; font-weight: 600; text-decoration: none; }\n.ccwk-cm-to { color: #80808f; }\n.ccwk-cm-reply { margin-left: auto; border: 0; background: none; color: #6f6f80; font-size: 12px; cursor: pointer; opacity: 0; }\n.ccwk-cm:hover .ccwk-cm-reply { opacity: 1; }\n.ccwk-cm-reply:hover { color: #5fe39b; }\n.ccwk-cm-text { margin-top: 2px; font-size: 14px; line-height: 1.55; color: #e4e4ec; white-space: pre-wrap; word-break: break-word; }\n.ccwk-cm-compose { display: flex; align-items: flex-end; gap: 8px; }\n.ccwk-cm-field { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }\n.ccwk-cm-hint { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #5fe39b; }\n.ccwk-cm-hint:empty { display: none; }\n.ccwk-cm-x { display: inline-grid; place-items: center; width: 16px; height: 16px; border: 0; border-radius: 50%; background: rgba(255,255,255,.08); color: #b6b6c4; cursor: pointer; }\n.ccwk-cm-input { width: 100%; box-sizing: border-box; resize: none; max-height: 120px; padding: 7px 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05); color: #ececf2; font: 14px/1.4 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; outline: none; }\n.ccwk-cm-input:focus { border-color: rgba(61,220,132,.5); }\n.ccwk-rq-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; color: #80808f; }\n.ccwk-rq-head b { color: #d4d4de; font-weight: 600; font-size: 13px; }\n.ccwk-feed-repost .ccwk-feed-text { font-size: 14px; -webkit-line-clamp: 5; }\n.ccwk-feed-imgs.is-small { max-width: 300px; margin-top: 8px; }\n.ccwk-gi { position: relative; display: block; cursor: zoom-in; }\n.ccwk-gi-more { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 10px; background: rgba(0,0,0,.5); color: #fff; font: 600 20px/1 "PingFang SC", "Microsoft YaHei", sans-serif; }\n.ccwk-cp-img img { cursor: zoom-in; }\n/* ---------- 图片查看器 ---------- */\n.ccwk-iv { position: fixed; inset: 0; z-index: 2147483600; background: rgba(8,8,14,.92); display: flex; flex-direction: column; animation: ccwk-iv-in .15s ease; font: 13px/1.4 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; color: #ececf2; user-select: none; }\n.ccwk-iv.is-out { opacity: 0; transition: opacity .15s; }\n@keyframes ccwk-iv-in { from { opacity: 0; } }\n.ccwk-iv-top { flex: none; display: flex; align-items: center; justify-content: space-between; height: 52px; padding: 0 16px 0 24px; }\n.ccwk-iv-count { color: #b6b6c4; }\n.ccwk-iv-tools { display: inline-flex; gap: 8px; }\n.ccwk-iv-btn { display: inline-flex; align-items: center; justify-content: center; height: 32px; padding: 0 14px; border: 0; border-radius: 16px; background: rgba(255,255,255,.1); color: #ececf2 !important; text-decoration: none !important; cursor: pointer; font-size: 13px; }\n.ccwk-iv-btn.is-icon { width: 32px; padding: 0; }\n.ccwk-iv-btn:hover { background: rgba(255,255,255,.18); }\n.ccwk-iv-stage { flex: 1; min-height: 0; display: grid; place-items: center; overflow: hidden; padding: 0 72px; }\n.ccwk-iv-img { max-width: 100%; max-height: 100%; object-fit: contain; opacity: 0; transition: opacity .15s, transform .08s; transform-origin: center; cursor: zoom-in; touch-action: none; }\n.ccwk-iv-img.is-ready { opacity: 1; }\n.ccwk-iv-img.is-zoomed { cursor: grab; }\n.ccwk-iv-img.is-zoomed:active { cursor: grabbing; }\n.ccwk-iv-nav { position: absolute; top: 50%; width: 44px; height: 44px; margin-top: -22px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255,255,255,.1); color: #ececf2; cursor: pointer; }\n.ccwk-iv-nav:hover { background: rgba(255,255,255,.2); }\n.ccwk-iv-nav.is-prev { left: 16px; }\n.ccwk-iv-nav.is-prev svg { transform: scaleX(-1); }\n.ccwk-iv-nav.is-next { right: 16px; }\n.ccwk-iv-strip { flex: none; display: flex; justify-content: center; gap: 8px; padding: 12px 16px 18px; overflow-x: auto; }\n.ccwk-iv-thumb { flex: none; width: 52px; height: 52px; padding: 0; border: 2px solid transparent; border-radius: 8px; overflow: hidden; background: none; cursor: pointer; opacity: .55; }\n.ccwk-iv-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.ccwk-iv-thumb.is-on { border-color: #3ddc84; opacity: 1; }\n.ccwk-iv-thumb:hover { opacity: 1; }\n.ccwk-login { display: flex; align-items: center; gap: 14px; padding: 14px 18px !important; }\n.ccwk-login-icon { flex: none; width: 36px; height: 36px; border-radius: 10px; }\n.ccwk-login-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.ccwk-login-text b { font-size: 14px; font-weight: 600; color: #ececf2; }\n.ccwk-login-text span { font-size: 12px; color: #8a8a9a; }\n.ccwk-side-icon { width: 18px; height: 18px; border-radius: 5px; }\n.ccwk-pf-list { display: flex; flex-direction: column; gap: 4px; }\n.ccwk-pf-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; margin: 0 -8px; border-radius: 10px; color: inherit; text-decoration: none; }\na.ccwk-pf-row:hover { background: rgba(255,255,255,.05); }\n.ccwk-pf-av { position: relative; flex: none; }\n.ccwk-pf-av img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; display: block; }\n.ccwk-pf-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.ccwk-pf-text b { font-size: 13px; font-weight: 600; color: #ececf2; }\n.ccwk-pf-text span { font-size: 12px; color: #80808f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwk-pf-cover { flex: none; width: 48px; height: 36px; border-radius: 6px; object-fit: cover; }\n\n/* ---------- 作品页「聊天」标签 ---------- */\n.ccwk-wc { display: none; }\n.ccwk-wc-on > :not(.ccwk-wc) { display: none !important; }\n.ccwk-wc-on > .ccwk-wc { display: flex; flex-direction: column; box-sizing: border-box; padding: 20px 20px 16px; font: 14px/1.5 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; color: #ececf2; }\n.ccwk-wc-head { flex: none; display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.07); }\n.ccwk-wc-gav { width: 40px; height: 40px; border-radius: 12px; object-fit: cover; flex: none; background: rgba(255,255,255,.06); }\n.ccwk-wc-title { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.ccwk-wc-title b { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwk-wc-title span { font-size: 12px; color: #80808f; }\n.ccwk-wc-open { flex: none; height: 28px; padding: 0 12px; border-radius: 14px; background: rgba(255,255,255,.08); color: #ececf2 !important; font-size: 12px; line-height: 28px; text-decoration: none !important; }\n.ccwk-wc-open:hover { background: rgba(255,255,255,.14); }\n.ccwk-wc-list { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 4px 12px 0; display: flex; flex-direction: column; gap: 2px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }\n.ccwk-wc-empty { margin: auto; color: #80808f; font-size: 13px; }\n.ccwk-wc-sys { align-self: center; margin: 8px 0; padding: 2px 10px; border-radius: 10px; background: rgba(255,255,255,.05); color: #80808f; font-size: 12px; }\n.ccwk-wc-msg { display: flex; gap: 10px; margin-top: 10px; }\n.ccwk-wc-msg.is-grouped { margin-top: 2px; }\n.ccwk-wc-av { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex: none; display: block; }\n.ccwk-wc-av.is-blank { visibility: hidden; }\n.ccwk-wc-main { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }\n.ccwk-wc-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; }\n.ccwk-wc-meta b { font-weight: 600; color: #c9c9d6; }\n.ccwk-wc-meta .ccwk-clv { margin-left: 0; }\n.ccwk-wc-meta time { color: #6c6c7c; }\n.ccwk-wc-bubble { max-width: 100%; padding: 7px 12px; border-radius: 4px 14px 14px 14px; background: rgba(255,255,255,.07); color: #ececf2; font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }\n.ccwk-wc-msg.is-mine .ccwk-wc-bubble { background: rgba(61,220,132,.16); color: #e6fbee; }\n.ccwk-wc-img img { display: block; max-width: 220px; max-height: 220px; border-radius: 10px; object-fit: cover; }\n.ccwk-wc-foot { flex: none; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.07); }\n.ccwk-wc-gate { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: #9a9aaa; }\n.ccwk-wc-compose { display: flex; align-items: flex-end; gap: 8px; }\n.ccwk-wc-input { flex: 1; min-width: 0; box-sizing: border-box; resize: none; max-height: 120px; padding: 7px 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05); color: #ececf2; font: 14px/1.4 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; outline: none; }\n.ccwk-wc-input:focus { border-color: rgba(61,220,132,.5); }\n\n.ccwk-toasts { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; display: flex; flex-direction: column; gap: 8px; width: 300px; font: 13px/1.45 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; }\n.ccwk-nt { padding: 10px 10px 10px 12px; border-radius: 12px; background: rgba(36,36,50,.96); border: 1px solid rgba(255,255,255,.08); box-shadow: 0 12px 32px rgba(0,0,0,.45); color: #ececf2; cursor: pointer; animation: ccwk-nt-in .18s ease; transition: opacity .18s, transform .18s; backdrop-filter: blur(12px); }\n.ccwk-nt.is-out { opacity: 0; transform: translateX(12px); }\n.ccwk-nt.is-bump { animation: ccwk-nt-bump .25s ease; }\n@keyframes ccwk-nt-in { from { opacity: 0; transform: translateY(6px); } }\n@keyframes ccwk-nt-bump { 40% { transform: translateX(-3px); } }\n.ccwk-nt-main { display: flex; align-items: center; gap: 10px; }\n.ccwk-nt-av { flex: none; width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,.06); }\n.ccwk-nt-av.is-group { border-radius: 9px; }\n.ccwk-nt-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.ccwk-nt-head { display: flex; align-items: center; gap: 6px; min-width: 0; }\n.ccwk-nt-title { min-width: 0; font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwk-nt-tag { flex: none; padding: 0 5px; border-radius: 4px; background: rgba(61,220,132,.16); color: #5fe39b; font-size: 11px; line-height: 16px; }\n.ccwk-nt-tag:empty, .ccwk-nt-count:empty { display: none; }\n.ccwk-nt-count { flex: none; margin-left: auto; color: #80808f; font-size: 11px; }\n.ccwk-nt-line { color: #a6a6b4; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.ccwk-nt-tools { flex: none; display: none; align-items: center; gap: 2px; }\n.ccwk-nt:hover .ccwk-nt-tools, .ccwk-nt.is-replying .ccwk-nt-tools, .ccwk-nt.is-settings .ccwk-nt-tools { display: inline-flex; }\n.ccwk-nt:hover .ccwk-nt-count { display: none; }\n.ccwk-nt-act { height: 24px; padding: 0 8px; border: 0; border-radius: 6px; background: rgba(255,255,255,.08); color: #ececf2; font-size: 12px; cursor: pointer; }\n.ccwk-nt-act:hover { background: rgba(255,255,255,.14); }\n.ccwk-nt-icon { width: 24px; height: 24px; display: inline-grid; place-items: center; border: 0; border-radius: 6px; background: none; color: #80808f; cursor: pointer; }\n.ccwk-nt-icon:hover { background: rgba(255,255,255,.08); color: #ececf2; }\n.ccwk-nt-input { display: none; width: 100%; box-sizing: border-box; height: 30px; margin-top: 8px; padding: 0 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05); color: #ececf2; font: inherit; outline: none; }\n.ccwk-nt-input:focus { border-color: rgba(61,220,132,.5); }\n.ccwk-nt.is-replying .ccwk-nt-input { display: block; }\n.ccwk-nt-settings { display: none; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.06); font-size: 12px; color: #8a8a9a; cursor: default; }\n.ccwk-nt.is-settings .ccwk-nt-settings { display: flex; }\n.ccwk-nt-seg .ccwk-cp-opt { padding: 0 8px; height: 24px; line-height: 24px; font-size: 11px; }\n.ccwk-nt-card { padding: 12px 14px; }\n.ccwk-nt-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #ececf2; }\n.ccwk-nt-card-head img { width: 16px; height: 16px; border-radius: 4px; }\n.ccwk-nt-card .ccwk-nt-seg { display: flex; }\n.ccwk-nt-card .ccwk-nt-seg .ccwk-cp-opt { flex: 1; }\n\n@media (max-width: 1280px) {\n  .ccwn-layout { grid-template-columns: 272px minmax(0, 1fr); max-width: 1180px; }\n  .ccwn-side { display: none; }\n}\n@media (max-width: 960px) {\n  .ccwn-left { position: static; }\n  .ccwn-fans { display: none; }\n  .ccwn-app { padding: 12px 0 60px; }\n  .ccwn-layout { grid-template-columns: 1fr; gap: 12px; }\n  .ccwn-nav { position: static; padding: 0 12px; }\n  .ccwn-nav-card { flex-direction: row; overflow-x: auto; }\n  .ccwn-nav-item { flex: none; }\n  .ccwn-nav-preview { display: none; }\n  .ccwn-nav-item:first-child { margin-bottom: 0; }\n  .ccwn-nav-item:first-child::after { display: none; }\n  .ccwn-main { border-radius: 0; border-left: 0; border-right: 0; }\n  .ccwn-toolbar { flex-wrap: wrap; border-radius: 0; }\n  .ccwn-hover { position: static; opacity: 1; pointer-events: auto; margin-left: 8px; }\n  .ccwn-row:hover .ccwn-meta .ccwn-time { opacity: 1; }\n  .ccwn-hint { display: none; }\n}\n';
  let styled = false;
  function injectStyle() {
    if (styled) return;
    styled = true;
    const s = document.createElement("style");
    s.id = "ccwn-style";
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  const pad = (n) => String(n).padStart(2, "0");
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  function relTime(iso) {
    const d = new Date(iso);
    const now = /* @__PURE__ */ new Date();
    const diff = (now - d) / 1e3;
    if (diff < 60) return "刚刚";
    if (diff < 3600) return Math.floor(diff / 60) + " 分钟前";
    const hm = pad(d.getHours()) + ":" + pad(d.getMinutes());
    const days = Math.round((dayStart(now) - dayStart(d)) / 864e5);
    if (days === 0) return hm;
    if (days === 1) return "昨天 " + hm;
    if (d.getFullYear() === now.getFullYear()) return d.getMonth() + 1 + "月" + d.getDate() + "日 " + hm;
    return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
  }
  function fullTime(iso) {
    const d = new Date(iso);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function sectionOf(iso) {
    const d = new Date(iso);
    const now = /* @__PURE__ */ new Date();
    const days = Math.round((dayStart(now) - dayStart(d)) / 864e5);
    if (days <= 0) return { key: "today", label: "今天" };
    if (days === 1) return { key: "yesterday", label: "昨天" };
    if (days < 7) return { key: "week", label: "近 7 天" };
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return { key: "month", label: "本月早些时候" };
    const key = d.getFullYear() + "-" + (d.getMonth() + 1);
    return { key, label: (d.getFullYear() === now.getFullYear() ? "" : d.getFullYear() + " 年 ") + (d.getMonth() + 1) + " 月" };
  }
  const GROUPS = ["REPLY", "CONTENT_INTERACTION", "SYSTEM", "COMMUNITY", "FRIEND_SHARE"];
  const GROUP_LABEL = {
    ALL: "全部消息",
    CHAT: "私信",
    FRIENDS: "好友",
    REPLY: "回复我的",
    CONTENT_INTERACTION: "内容互动",
    SYSTEM: "系统通知",
    COMMUNITY: "社区通知",
    FRIEND_SHARE: "好友分享"
  };
  const KIND_NOUN = { CREATION: "作品", POST: "文章", ASSET_MARKET: "素材", EXTENSION: "扩展", PROFILE: "留言板", HASH_TAG: "话题", ACTIVITY: "活动", TEAM: "Game Jam 战队", OUTSIDE_EMBED: "教程", SEASON: "星球" };
  function sender(item) {
    const s = item.senderInfo || {};
    return {
      name: s.name || item.senderName || "",
      oid: s.oid || item.senderOid || "",
      avatar: s.avatar || item.avatar || ""
    };
  }
  function subjectTitle(item) {
    return item.creationInfo && item.creationInfo.title || item.subjectOutline || item.assetMarketInfo && item.assetMarketInfo.name || item.extensionInfo && item.extensionInfo.name || item.content && (item.content.subject_outline || item.content.homework_title) || "";
  }
  function thumbOf(item) {
    const c = item.creationInfo;
    if (c) return c.latestCoverLink || c.creationRelease && c.creationRelease.coverLink || "";
    if (item.assetMarketInfo && item.assetMarketInfo.previewImages) return item.assetMarketInfo.previewImages[0] || "";
    if (item.extensionInfo) return item.extensionInfo.cover || "";
    return "";
  }
  function interactionVerb(item) {
    const c = item.contentCategory || "";
    const noun = KIND_NOUN[item.subjectType] || "内容";
    if (c === "COMMENT_LIKED") return "赞了你的" + (item.target && item.target.parentCommentId ? "回复" : "评论");
    if (c.endsWith("_FAVORITE")) return "收藏了你的" + noun;
    if (c.endsWith("_LIKED")) return "赞了你的" + noun;
    if (c === "CREATION_REMIXED") return "改编了你的作品";
    if (c === "ASSET_MARKET_DONATE") return "打赏了你的素材";
    if (c === "ASSET_MARKET_PURCHASED") return "获取了你的素材";
    return "与你的" + noun + "互动";
  }
  function replyVerb(item) {
    const isReply = Boolean(item.message) || Boolean(item.target && item.target.parentCommentId);
    const type = item.subjectType;
    if (type === "PROFILE") return isReply ? "回复了你在留言板的留言" : "在你的留言板留言";
    const noun = KIND_NOUN[type] || "内容";
    if (isReply) return "回复了你在" + noun;
    if (type === "OUTSIDE_EMBED" && !(item.content && item.content.ext && item.content.ext.courseTitle)) return isReply ? "回复了你在教程中的评论" : "在教程中评论";
    if (type === "OUTSIDE_EMBED" || type === "HASH_TAG" || type === "SEASON" || type === "ACTIVITY") return "在" + noun;
    return "评论了你的" + noun;
  }
  function replyTail(item) {
    if (item.subjectType === "OUTSIDE_EMBED" && !(item.content && item.content.ext && item.content.ext.courseTitle)) return "";
    const isReply = Boolean(item.message) || Boolean(item.target && item.target.parentCommentId);
    if (item.subjectType === "PROFILE") return "";
    if (isReply) return "中的评论";
    if (["OUTSIDE_EMBED", "HASH_TAG", "SEASON", "ACTIVITY"].includes(item.subjectType)) return "中评论";
    return "";
  }
  function shareTarget(item) {
    if (item.subjectType === "ASSET_MARKET" || item.subjectType === "SHARE_CODE") return "分享了素材";
    if (item.subjectType === "PROFILE") return "分享了一位创作者";
    if (item.subjectType === "SOCIETY") return "";
    return "分享了作品";
  }
  const SYSTEM_TITLE = {
    CREATION_AUDIT_PASSED: "作品审核通过",
    CREATION_AUDIT_REJECTED: "作品审核未通过",
    CREATION_BANNED: "作品被下架",
    CREATION_CHECKED: "作品审核结果",
    COMMENT_DELETED: "评论被删除",
    COMMENT_RESTORED: "评论已恢复",
    COMMENT_REJECTED: "评论未通过审核",
    REPORT_LOG_REJECTED: "举报未通过",
    MEMBER_MUTED: "账号禁言",
    POST_VISIBILITY_CHANGED: "文章可见性变更",
    COMMUNITY_ACTIVITY_AUDIT_PASSED: "活动审核通过",
    COMMUNITY_ACTIVITY_AUDIT_REJECTED: "活动审核未通过",
    TEAM_FORMED: "战队已组建",
    TEAM_DELETED: "战队已解散",
    TEAM_MEMBER_JOINED: "新成员加入战队",
    TEAM_MEMBER_DELETED: "成员离开战队",
    SESSION_CREATED: "新会话",
    INVITEE_REGISTERED: "好友加入社区",
    POST_RATED_AS_EXCELLENT: "文章被评为精选",
    CREATION_RECOMMENDED_AS_POTENTIAL: "作品被评为潜力新作",
    CREATION_UPDATED_TO_EXCELLENT: "作品被评为精选",
    COMMUNITY_ACTIVITY: "社区公告"
  };
  function buildRows(items, aggregate) {
    const sections = [];
    const bySection = /* @__PURE__ */ new Map();
    for (const it of items) {
      const sec = sectionOf(it.createdAt);
      let s = bySection.get(sec.key);
      if (!s) {
        s = { ...sec, rows: [], agg: /* @__PURE__ */ new Map() };
        bySection.set(sec.key, s);
        sections.push(s);
      }
      const canAgg = it.group === "CONTENT_INTERACTION" && it.subjectOid && it.contentCategory !== "COMMENT_LIKED" || it.contentCategory === "FOLLOWED";
      if (canAgg) {
        const k = it.contentCategory + "|" + (it.contentCategory === "FOLLOWED" ? "" : it.subjectOid);
        const row = s.agg.get(k);
        if (row) {
          row.items.push(it);
          continue;
        }
        const nr = { key: "agg:" + sec.key + ":" + k, items: [it] };
        s.agg.set(k, nr);
        s.rows.push(nr);
      } else {
        s.rows.push({ key: it.id, items: [it] });
      }
    }
    return sections;
  }
  const DEFAULT_BASE = "https://chat-api.kuke.ink";
  const BASE = (() => {
    try {
      return (localStorage.getItem("kukechat-ccw:api") || DEFAULT_BASE).replace(/\/$/, "");
    } catch (_) {
      return DEFAULT_BASE;
    }
  })();
  const CLIENT = "kukechat-ccw/0.7.7";
  let token = null;
  let me = null;
  let sessionTried = 0;
  let sessionPromise = null;
  const RETRY_MS = 5 * 60 * 1e3;
  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  function nonce() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function rawRequest(method, path, body, opts) {
    const o = opts || {};
    const headers = { "X-Kuke-Client": CLIENT, "X-Kuke-Platform": "web" };
    const ts = String(Date.now());
    const n = nonce();
    headers["X-Kuke-Timestamp"] = ts;
    headers["X-Kuke-Nonce"] = n;
    headers["X-Kuke-Proof"] = await sha256Hex(`${method}|${path.split("?")[0]}|${ts}|${n}|KukeChat`);
    if (o.token) headers.Authorization = "Bearer " + o.token;
    const form = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== void 0 && !form) headers["Content-Type"] = "application/json";
    const res = await fetch(BASE + "/api/v1" + path, {
      method,
      headers,
      body: body === void 0 ? void 0 : form ? body : JSON.stringify(body),
      credentials: o.cookie ? "include" : "omit",
      keepalive: Boolean(o.keepalive)
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }
    if (!res.ok) {
      const err = new Error(data && data.detail && (typeof data.detail === "string" ? data.detail : data.detail.message) || "KukeChat " + res.status);
      err.status = res.status;
      throw err;
    }
    return data;
  }
  function ensureSession() {
    if (token) return Promise.resolve(me);
    if (sessionPromise) return sessionPromise;
    let devToken = null;
    try {
      devToken = localStorage.getItem("kukechat-ccw:token");
    } catch (_) {
    }
    if (devToken) {
      sessionPromise = rawRequest("GET", "/auth/me", void 0, { token: devToken }).then((user) => {
        token = devToken;
        me = user;
        return me;
      }).catch(() => null).finally(() => {
        sessionPromise = null;
      });
      return sessionPromise;
    }
    if (sessionTried && Date.now() - sessionTried < RETRY_MS) return Promise.resolve(null);
    sessionTried = Date.now();
    sessionPromise = rawRequest("GET", "/auth/session", void 0, { cookie: true }).then((r) => {
      token = r && r.access_token;
      me = r && r.user || null;
      return token ? me : null;
    }).catch(() => null).finally(() => {
      sessionPromise = null;
    });
    return sessionPromise;
  }
  function currentToken() {
    return token;
  }
  const KUKECHAT_BASE = BASE;
  function kcIso(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value) ? value + "Z" : value;
  }
  function currentKukeUser() {
    return me;
  }
  async function kcRequest(method, path, body, opts) {
    if (!await ensureSession()) return null;
    try {
      return await rawRequest(method, path, body, { ...opts || {}, token });
    } catch (err) {
      if (err.status !== 401) throw err;
      token = null;
      sessionTried = 0;
      if (!await ensureSession()) return null;
      return rawRequest(method, path, body, { ...{}, token });
    }
  }
  function kcRequestOnUnload(method, path) {
    if (!token) return;
    rawRequest(method, path, void 0, { token, keepalive: true }).catch(() => {
    });
  }
  async function kcPublic(method, path) {
    await ensureSession().catch(() => null);
    return rawRequest(method, path, void 0, { token: token || void 0 });
  }
  const loginListeners = /* @__PURE__ */ new Set();
  function onLogin(fn) {
    loginListeners.add(fn);
    return () => loginListeners.delete(fn);
  }
  async function retrySession() {
    if (token) return me;
    sessionTried = 0;
    const user = await ensureSession();
    if (user) loginListeners.forEach((fn) => {
      try {
        fn(user);
      } catch (_) {
      }
    });
    return user;
  }
  let loginWatch = 0;
  function openKukeChatLogin() {
    const url = BASE + "/login?origin=" + encodeURIComponent(location.origin);
    const w = 460;
    const hgt = 680;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - hgt) / 2));
    const popup = window.open(url, "kukechat-login", `popup=yes,width=${w},height=${hgt},left=${left},top=${top}`);
    if (!popup) {
      window.open(url, "_blank", "noopener");
    }
    window.clearInterval(loginWatch);
    loginWatch = window.setInterval(() => {
      if (popup && popup.closed) {
        window.clearInterval(loginWatch);
        retrySession();
      }
    }, 800);
    window.setTimeout(() => window.clearInterval(loginWatch), 10 * 60 * 1e3);
  }
  window.addEventListener("focus", () => {
    if (!token) retrySession();
  });
  const listeners$1 = /* @__PURE__ */ new Set();
  let socket = null;
  let retry = 0;
  let pingTimer = 0;
  let started = false;
  function onRealtime(listener) {
    listeners$1.add(listener);
    return () => listeners$1.delete(listener);
  }
  function emit(event) {
    listeners$1.forEach((fn) => {
      try {
        fn(event);
      } catch (_) {
      }
    });
  }
  let waitTimer = 0;
  async function connect() {
    if (socket) return;
    if (!await ensureSession()) {
      window.clearTimeout(waitTimer);
      waitTimer = window.setTimeout(connect, 5 * 60 * 1e3);
      return;
    }
    const url = KUKECHAT_BASE.replace(/^http/, "ws") + "/ws?token=" + encodeURIComponent(currentToken());
    socket = new WebSocket(url);
    socket.onopen = () => {
      retry = 0;
      window.clearInterval(pingTimer);
      pingTimer = window.setInterval(() => {
        if (socket && socket.readyState === 1) socket.send("ping");
      }, 25e3);
    };
    socket.onmessage = (e) => {
      if (typeof e.data !== "string" || e.data === "pong") return;
      try {
        const msg = JSON.parse(e.data);
        if (msg && typeof msg.type === "string") emit(msg);
      } catch (_) {
      }
    };
    socket.onclose = () => {
      window.clearInterval(pingTimer);
      socket = null;
      retry = Math.min(retry + 1, 6);
      window.setTimeout(connect, Math.min(60, 2 ** (retry - 1)) * 1e3);
      emit({ type: "kc.disconnected", data: null });
    };
  }
  function startRealtime() {
    if (started) return;
    started = true;
    onLogin(() => {
      window.clearTimeout(waitTimer);
      connect();
    });
    connect();
  }
  const MAX = 3;
  const HIDE_MS = 8e3;
  const MODE_KEY = "kukechat-ccw:notify";
  const NOTIFY_MODES = [["important", "私聊和 @ 我"], ["all", "全部消息"], ["off", "关闭"]];
  let stack = null;
  let viewing = null;
  let mutedIds = /* @__PURE__ */ new Set();
  const toasts = /* @__PURE__ */ new Map();
  const modeListeners = /* @__PURE__ */ new Set();
  function setViewingConversation(id) {
    viewing = id;
  }
  function setMutedConversations(ids) {
    mutedIds = new Set(ids);
  }
  function notifyMode() {
    try {
      const v = localStorage.getItem(MODE_KEY);
      return v === "all" || v === "off" ? v : "important";
    } catch (_) {
      return "important";
    }
  }
  function setNotifyMode(mode) {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch (_) {
    }
    if (mode === "off") [...toasts.keys()].forEach((id) => closeToast(id));
    modeListeners.forEach((fn) => fn(mode));
  }
  function onNotifyMode(fn) {
    modeListeners.add(fn);
    return () => modeListeners.delete(fn);
  }
  function renderNotifyModeSwitch() {
    const seg = h("div", { class: "ccwk-cp-seg ccwk-nt-seg", role: "radiogroup", "aria-label": "新消息提醒" });
    const paint = () => {
      const mode = notifyMode();
      seg.replaceChildren(...NOTIFY_MODES.map(([value, label]) => {
        const b = h("button", { type: "button", role: "radio", class: "ccwk-cp-opt" + (mode === value ? " is-on" : ""), "aria-checked": String(mode === value) }, label);
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          setNotifyMode(value);
        });
        return b;
      }));
    };
    paint();
    onNotifyMode(paint);
    return seg;
  }
  function mentionsMe(m, me2) {
    const meta = m.metadata || {};
    if (meta.mention_all === true || meta.mentionAll === true) return "all";
    if (Array.isArray(meta.mentions) && meta.mentions.some((x) => x && (x.user_id === me2.id || x === me2.id))) return "me";
    return null;
  }
  function repliesToMe(m, me2) {
    const q = m.metadata && m.metadata.quote;
    return Boolean(q && q.sender_id === me2.id);
  }
  const pendingRefresh = /* @__PURE__ */ new Map();
  async function conversationOf(id, m) {
    const c = m && m.conversation;
    if (c && typeof c === "object" && c.type) return { type: c.type, title: c.display_title || c.title || "", avatar: c.avatar_url || null };
    const known2 = conversationInfo(id);
    if (known2) return known2;
    if (!pendingRefresh.has(id)) pendingRefresh.set(id, refreshUnread().finally(() => pendingRefresh.delete(id)));
    await pendingRefresh.get(id);
    return conversationInfo(id);
  }
  function preview(m) {
    const t = String(m.type || "").toLowerCase();
    const map = { image: "[图片]", voice: "[语音]", file: "[文件]", red_packet: "[红包]", redpacket: "[红包]", poll: "[投票]", gift: "[礼物]", forward_bundle: "[聊天记录]" };
    if (map[t]) return map[t];
    const text = String(m.content || "").replace(/\s+/g, " ").trim();
    return text || "[消息]";
  }
  function ensureStack() {
    if (!stack || !stack.isConnected) {
      stack = h("div", { class: "ccwk-toasts" });
      document.body.appendChild(stack);
    }
    return stack;
  }
  function closeToast(id) {
    const t = toasts.get(id);
    if (!t) return;
    toasts.delete(id);
    window.clearTimeout(t.timer);
    t.card.classList.add("is-out");
    window.setTimeout(() => t.card.remove(), 180);
  }
  function arm(t, id) {
    window.clearTimeout(t.timer);
    t.timer = window.setTimeout(() => closeToast(id), HIDE_MS);
  }
  function buildToast(id) {
    const t = { count: 0, timer: 0, hovering: false };
    const av = h("img", { class: "ccwk-nt-av", alt: "" });
    const title = h("b", { class: "ccwk-nt-title" });
    const tag = h("span", { class: "ccwk-nt-tag" });
    const count = h("span", { class: "ccwk-nt-count" });
    const line2 = h("span", { class: "ccwk-nt-line" });
    const replyBtn = h("button", { type: "button", class: "ccwk-nt-act" }, "回复");
    const gear = h("button", { type: "button", class: "ccwk-nt-icon", title: "提醒设置" }, icon("bell", 13));
    const x = h("button", { type: "button", class: "ccwk-nt-icon", title: "关闭" }, icon("close", 12));
    const input = h("input", { class: "ccwk-nt-input", placeholder: "回复…（Enter 发送）", maxlength: "500" });
    const settings = h("div", { class: "ccwk-nt-settings" }, h("span", { text: "新消息提醒" }), renderNotifyModeSwitch());
    const card2 = h(
      "div",
      { class: "ccwk-nt", role: "status" },
      h(
        "div",
        { class: "ccwk-nt-main" },
        av,
        h(
          "div",
          { class: "ccwk-nt-text" },
          h("div", { class: "ccwk-nt-head" }, title, tag, count),
          line2
        ),
        h("div", { class: "ccwk-nt-tools" }, replyBtn, gear, x)
      ),
      input,
      settings
    );
    t.card = card2;
    t.paint = (m, info, flag) => {
      const sender2 = m.sender || {};
      const senderName = m.sender_display_name || sender2.nickname || sender2.username || "有人";
      const group = info && info.type && info.type !== "direct";
      title.textContent = group ? info.title || "群聊" : senderName;
      av.src = (group ? info.avatar : sender2.avatar_url) || sender2.avatar_url || "https://m.ccw.site/community/images/avatar-default.png";
      av.classList.toggle("is-group", Boolean(group));
      line2.textContent = (group ? senderName + "：" : "") + preview(m);
      tag.textContent = flag === "me" ? "@ 了你" : flag === "all" ? "@ 全体" : flag === "reply" ? "回复了你" : "";
      count.textContent = t.count > 1 ? t.count + " 条新消息" : "";
    };
    card2.addEventListener("mouseenter", () => {
      t.hovering = true;
      window.clearTimeout(t.timer);
    });
    card2.addEventListener("mouseleave", () => {
      t.hovering = false;
      if (!card2.contains(document.activeElement)) arm(t, id);
    });
    card2.addEventListener("click", (e) => {
      if (e.target.closest("button, input, .ccwk-nt-settings")) return;
      closeToast(id);
      location.assign("/notice/chat?c=" + id);
    });
    replyBtn.addEventListener("click", () => {
      card2.classList.toggle("is-replying");
      card2.classList.remove("is-settings");
      if (card2.classList.contains("is-replying")) input.focus();
    });
    gear.addEventListener("click", () => {
      card2.classList.toggle("is-settings");
      card2.classList.remove("is-replying");
    });
    x.addEventListener("click", () => closeToast(id));
    input.addEventListener("keydown", async (e) => {
      if (e.key === "Escape") {
        card2.classList.remove("is-replying");
        return;
      }
      if (e.key !== "Enter" || e.isComposing) return;
      e.preventDefault();
      const content = input.value.trim();
      if (!content || input.disabled) return;
      input.disabled = true;
      try {
        await kcRequest("POST", `/conversations/${id}/messages`, { content, type: "text" });
        input.value = "";
        input.placeholder = "已发送";
        window.setTimeout(() => closeToast(id), 700);
      } catch (err) {
        input.disabled = false;
        input.placeholder = err && err.message || "发送失败";
      }
    });
    input.addEventListener("blur", () => {
      if (!t.hovering) arm(t, id);
    });
    return t;
  }
  async function show(m, flag) {
    const id = m.conversation_id;
    const info = await conversationOf(id, m);
    let t = toasts.get(id);
    if (!t) {
      t = buildToast(id);
      toasts.set(id, t);
      const s = ensureStack();
      s.appendChild(t.card);
      while (toasts.size > MAX) closeToast(toasts.keys().next().value);
    } else {
      t.card.parentNode && t.card.parentNode.appendChild(t.card);
      t.card.classList.remove("is-bump");
      void t.card.offsetWidth;
      t.card.classList.add("is-bump");
    }
    t.count += 1;
    t.paint(m, info, flag);
    if (!t.hovering && !t.card.contains(document.activeElement)) arm(t, id);
  }
  function installToast() {
    onRealtime(async (e) => {
      if (e.type !== "message.created" || !e.data) return;
      const m = e.data;
      const me2 = currentKukeUser();
      const mode = notifyMode();
      if (!me2 || mode === "off" || m.sender_id === me2.id) return;
      if (viewing === "*" || m.conversation_id === viewing || mutedIds.has(m.conversation_id)) return;
      if (String(m.type || "").toLowerCase() === "system") return;
      const mention = mentionsMe(m, me2);
      const flag = mention || (repliesToMe(m, me2) ? "reply" : null);
      if (mode === "important" && !flag) {
        const info = await conversationOf(m.conversation_id, m);
        if (!info || info.type !== "direct") return;
      }
      show(m, flag);
    });
  }
  let total = 0;
  let byConversation = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  let refreshTimer = 0;
  const isMuted = (c) => Boolean(c.my_do_not_disturb || c.my_message_setting === "silent" || c.my_message_setting === "ignore");
  function publish() {
    let sum = 0;
    byConversation.forEach((c) => {
      if (!c.muted) sum += c.unread;
    });
    total = sum;
    listeners.forEach((fn) => fn(total));
  }
  async function refreshUnread() {
    try {
      const list = await kcRequest("GET", "/conversations");
      if (!Array.isArray(list)) return;
      byConversation = new Map(list.map((c) => [c.id, {
        unread: Math.max(0, c.unread_count || 0),
        muted: isMuted(c),
        // 提醒卡片要用：私聊还是群、群名和头像
        type: c.type,
        title: c.display_title || c.title || "",
        avatar: c.avatar_url || null
      }]));
      setMutedConversations(list.filter(isMuted).map((c) => c.id));
      publish();
    } catch (_) {
    }
  }
  function onUnread(fn) {
    listeners.add(fn);
    fn(total);
    return () => listeners.delete(fn);
  }
  function conversationInfo(id) {
    return byConversation.get(id) || null;
  }
  function unreadTotal() {
    return total;
  }
  function markConversationSeen(id) {
    const c = byConversation.get(id);
    if (c && c.unread) {
      c.unread = 0;
      publish();
    }
  }
  let activeConversation = null;
  function setActiveConversation(id) {
    activeConversation = id;
    if (id != null) markConversationSeen(id);
  }
  function installUnread() {
    refreshUnread();
    onLogin(() => refreshUnread());
    onRealtime((e) => {
      if (e.type === "message.created" && e.data) {
        const me2 = currentKukeUser();
        if (me2 && e.data.sender_id === me2.id) return;
        const id = e.data.conversation_id;
        if (id === activeConversation) return;
        const c = byConversation.get(id);
        if (c) {
          c.unread += 1;
          publish();
        } else refreshUnreadSoon();
      } else if (e.type === "conversation.read" || e.type === "conversation.updated" || e.type === "connection.ready") {
        refreshUnreadSoon();
      }
    });
  }
  function refreshUnreadSoon() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshUnread, 800);
  }
  let root = null, navEl = null, toolbarEl = null, listEl = null, footEl = null, toastEl = null;
  const rowCache = /* @__PURE__ */ new Map();
  const rowByItem = /* @__PURE__ */ new Map();
  const sectionCache = /* @__PURE__ */ new Map();
  let fansEl = null, sideEl = null;
  const STAT_GROUPS = ["CONTENT_INTERACTION", "REPLY", "SYSTEM"];
  let statsGen = 0;
  async function loadStats() {
    const my = ++statsGen;
    state.stats = null;
    renderSide();
    renderFans();
    const since = dayStart(/* @__PURE__ */ new Date()) - 6 * 864e5;
    const all = [];
    const capped = {};
    try {
      await Promise.all(STAT_GROUPS.map(async (g) => {
        let cursor = null;
        for (let i = 0; i < 6; i++) {
          const p = await api.page(g, "ALL", cursor);
          const its = p.items || [];
          all.push(...its);
          if (!p.hasMore || !p.nextCursor || !its.length || Date.parse(its[its.length - 1].createdAt) < since) return;
          cursor = p.nextCursor;
        }
        capped[g] = true;
      }));
    } catch (_) {
    }
    if (my !== statsGen) return;
    state.stats = { since, capped, items: all.filter((x) => Date.parse(x.createdAt) >= since) };
    renderSide();
    renderFans();
  }
  function computeStats() {
    const st = state.stats;
    const like = [], fav = [], cmt = [], fans = [];
    const works = /* @__PURE__ */ new Map();
    const days = [];
    for (let i = 6; i >= 0; i--) days.push({ start: st.since + (6 - i) * 864e5, n: 0 });
    for (const x of st.items) {
      const c = x.contentCategory || "";
      const t = Date.parse(x.createdAt);
      const d = days.find((dd) => t >= dd.start && t < dd.start + 864e5);
      if (d) d.n++;
      let kind = null;
      if (x.group === "REPLY") {
        cmt.push(x);
        kind = "c";
      } else if (c === "FOLLOWED") fans.push(x);
      else if (c.endsWith("_FAVORITE")) {
        fav.push(x);
        kind = "f";
      } else if (c.endsWith("_LIKED")) {
        like.push(x);
        kind = "l";
      }
      if (kind && x.subjectOid && c !== "COMMENT_LIKED" && subjectTitle(x)) {
        let w = works.get(x.subjectOid);
        if (!w) {
          w = { item: x, l: 0, f: 0, c: 0 };
          works.set(x.subjectOid, w);
        }
        w[kind]++;
        if (!thumbOf(w.item) && thumbOf(x)) w.item = x;
      }
    }
    const top = Array.from(works.values()).sort((a, b) => b.l + b.f + b.c - (a.l + a.f + a.c)).slice(0, 5);
    const seen = /* @__PURE__ */ new Set();
    const fanUsers = [];
    fans.forEach((x) => {
      const u = sender(x);
      if (u.oid && !seen.has(u.oid)) {
        seen.add(u.oid);
        fanUsers.push({ u, x });
      }
    });
    return { like, fav, cmt, fans: fanUsers, days, top };
  }
  function card(title, extra, ...body) {
    return h("section", { class: "ccwn-card" }, h("header", { class: "ccwn-card-head" }, h("h2", { text: title }), extra || null), ...body);
  }
  function renderSide() {
    if (!sideEl) return;
    if (!state.stats) {
      sideEl.replaceChildren(card("近 7 天", null, h("div", { class: "ccwn-card-sk" }, h("i"), h("i"), h("i"))));
      return;
    }
    const s = computeStats();
    const cap = (g) => state.stats.capped[g] ? "+" : "";
    const tile = (ic, tone, n, label, g) => h(
      "div",
      { class: "ccwn-stat tone-" + tone },
      h("i", { class: "ccwn-stat-dot" }),
      h("b", { text: n + cap(g) }),
      h("span", { text: label })
    );
    const tiles = h(
      "div",
      { class: "ccwn-stats" },
      tile("heart", "pink", s.like.length, "获赞", "CONTENT_INTERACTION"),
      tile("star", "amber", s.fav.length, "收藏", "CONTENT_INTERACTION"),
      tile("reply", "blue", s.cmt.length, "评论", "REPLY"),
      tile("follow", "green", s.fans.length, "新粉丝", "SYSTEM")
    );
    const max = Math.max(1, ...s.days.map((d) => d.n));
    const total2 = s.days.reduce((a, d) => a + d.n, 0);
    const readout = h("span", { class: "ccwn-readout", text: "共 " + total2 + " 条" });
    const WEEK = "日一二三四五六";
    const bars = h("div", { class: "ccwn-bars" }, s.days.map((d, i) => {
      const date = new Date(d.start);
      const label = i === 6 ? "今天" : "周" + WEEK[date.getDay()];
      const col = h(
        "div",
        { class: "ccwn-bar" + (i === 6 ? " is-today" : "") },
        h("div", { class: "ccwn-bar-track" }, h("i", { style: "height:" + Math.max(d.n ? 4 : 0, Math.round(d.n / max * 100)) + "%" })),
        h("span", { text: label })
      );
      col.addEventListener("mouseenter", () => {
        readout.textContent = date.getMonth() + 1 + "月" + date.getDate() + "日 · " + d.n + " 条";
        col.classList.add("is-hover");
      });
      col.addEventListener("mouseleave", () => {
        readout.textContent = "共 " + total2 + " 条";
        col.classList.remove("is-hover");
      });
      return col;
    }));
    const chart = h("div", { class: "ccwn-chart" }, h("div", { class: "ccwn-chart-head" }, h("span", { text: "每日消息" }), readout), bars);
    const works = s.top.length ? h("ul", { class: "ccwn-works" }, s.top.map((w) => {
      const href = targetHref(w.item);
      const cover = thumbOf(w.item);
      const nums = h(
        "span",
        { class: "ccwn-work-nums" },
        w.l ? h("span", { class: "tone-pink" }, icon("heart", 12), String(w.l)) : null,
        w.f ? h("span", { class: "tone-amber" }, icon("star", 12), String(w.f)) : null,
        w.c ? h("span", { class: "tone-blue" }, icon("reply", 12), String(w.c)) : null
      );
      return h("li", null, h(
        "a",
        { href: href || "#", target: "_blank", rel: "noreferrer" },
        cover ? h("img", { src: cover, alt: "", loading: "lazy" }) : h("span", { class: "ccwn-work-ph" }),
        h("span", { class: "ccwn-work-text" }, h("span", { class: "ccwn-work-title", text: subjectTitle(w.item) }), nums)
      ));
    })) : h("div", { class: "ccwn-card-empty", text: "近 7 天还没有互动" });
    sideEl.replaceChildren(
      card("近 7 天", null, tiles, chart),
      card("互动最多的作品", null, works)
    );
  }
  function renderFans() {
    if (!fansEl) return;
    if (!state.stats) {
      fansEl.replaceChildren();
      return;
    }
    const s = computeStats();
    if (!s.fans.length) {
      fansEl.replaceChildren();
      return;
    }
    const more = h("button", { type: "button", class: "ccwn-link", onclick: () => go("SYSTEM", "ALL") }, "全部");
    fansEl.replaceChildren(card(
      "新粉丝 · " + s.fans.length + (state.stats.capped.SYSTEM ? "+" : ""),
      more,
      h("div", { class: "ccwn-fan-grid" }, s.fans.slice(0, 15).map(({ u }) => h(
        "a",
        { class: "ccwn-fan", href: "/student/" + u.oid, target: "_blank", rel: "noreferrer", title: u.name },
        avatarEl(u.avatar, "", 36),
        h("span", { text: u.name || "" })
      )))
    ));
  }
  function mount() {
    if (root) return;
    root = h("div", { id: "ccwn-root", class: "ccwn-app" });
    const layout = h("div", { class: "ccwn-layout" });
    navEl = h("nav", { class: "ccwn-nav" });
    const main = h("section", { class: "ccwn-main" });
    toolbarEl = h("header", { class: "ccwn-toolbar" });
    listEl = h("div", { class: "ccwn-list" });
    footEl = h("div", { class: "ccwn-foot" });
    main.append(toolbarEl, listEl, footEl);
    fansEl = h("div", { class: "ccwn-fans" });
    sideEl = h("aside", { class: "ccwn-side" });
    const notifyCard = h(
      "section",
      { class: "ccwn-card ccwk-nt-card" },
      h("div", { class: "ccwk-nt-card-head" }, h("span", { text: "KukeChat 消息提醒" }), h("img", { src: KC_ICON, alt: "" })),
      renderNotifyModeSwitch()
    );
    layout.append(h("div", { class: "ccwn-left" }, navEl, notifyCard, fansEl), main, sideEl);
    toastEl = h("div", { class: "ccwn-toast" });
    root.append(layout, toastEl);
    document.body.appendChild(root);
    new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) pump();
    }, { rootMargin: "600px 0px" }).observe(footEl);
  }
  const GROUP_META = {
    ALL: { icon: "all", tone: "green" },
    REPLY: { icon: "reply", tone: "blue" },
    CONTENT_INTERACTION: { icon: "heart", tone: "pink" },
    SYSTEM: { icon: "bell", tone: "amber" },
    COMMUNITY: { icon: "megaphone", tone: "violet" },
    FRIEND_SHARE: { icon: "share", tone: "teal" }
  };
  function renderNav() {
    if (!navEl) return;
    const info = {};
    let total2 = 0;
    let latest = null;
    if (state.summary) {
      total2 = state.summary.totalUnread || 0;
      (state.summary.groups || []).forEach((g) => {
        info[g.group] = g;
        if (g.preview && (!latest || Date.parse(g.preview.createdAt) > Date.parse(latest.createdAt))) latest = g.preview;
      });
    }
    const items = ["ALL", "CHAT", "FRIENDS"].concat(GROUPS).map((g) => {
      const kc2 = g === "CHAT" || g === "FRIENDS";
      const n = g === "ALL" ? total2 : g === "CHAT" ? unreadTotal() : info[g] && info[g].unreadCount || 0;
      const pv = g === "ALL" ? latest : kc2 ? null : info[g] && info[g].preview;
      const meta = GROUP_META[g] || { tone: "green" };
      return h(
        "a",
        {
          class: "ccwn-nav-item tone-" + meta.tone + (state.view === g ? " is-active" : ""),
          href: g === "ALL" ? "/notice" : g === "CHAT" ? "/notice/chat" : g === "FRIENDS" ? "/notice/friends" : "/notice/category/" + g,
          onclick: (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
            e.preventDefault();
            go(g, "ALL");
          }
        },
        h("span", { class: "ccwn-tile" }, kc2 ? h("img", { class: "ccwk-tile", src: KC_ICON, alt: "" }) : pixImg(g, 30)),
        h(
          "span",
          { class: "ccwn-nav-text" },
          h(
            "span",
            { class: "ccwn-nav-top" },
            h("span", { class: "ccwn-nav-label", text: GROUP_LABEL[g] }),
            n ? h("span", { class: "ccwn-count", text: n > 99 ? "99+" : String(n) }) : pv ? h("span", { class: "ccwn-nav-time", text: relTime(pv.createdAt) }) : null
          ),
          h("span", { class: "ccwn-nav-preview", text: kc2 ? g === "CHAT" ? "KukeChat 私聊和群聊" : "联系人、好友申请" : pv ? plain(pv.text || "").replace(/\s+/g, " ") : state.summary ? "暂无消息" : "" })
        )
      );
    });
    navEl.replaceChildren(h("div", { class: "ccwn-nav-card" }, items));
  }
  function renderToolbar() {
    if (!toolbarEl) return;
    const unread = state.summary ? state.view === "ALL" ? state.summary.totalUnread : ((state.summary.groups || []).find((g) => g.group === state.view) || {}).unreadCount : 0;
    const left = h(
      "div",
      { class: "ccwn-title" },
      h("h1", { text: GROUP_LABEL[state.view] }),
      unread ? h("span", { class: "ccwn-sub", text: unread + " 条未读" }) : h("span", { class: "ccwn-sub", text: state.summary ? "没有未读消息" : "" })
    );
    const seg = state.view === "CONTENT_INTERACTION" ? h("div", { class: "ccwn-seg" }, [["ALL", "全部"], ["LIKE", "点赞"], ["FAVORITE", "收藏"]].map(([f, l]) => h("button", { type: "button", class: state.filter === f ? "is-on" : "", onclick: () => go(state.view, f) }, l))) : null;
    const right = h(
      "div",
      { class: "ccwn-tools" },
      seg,
      h("button", { type: "button", class: "ccwn-chip" + (state.unreadOnly ? " is-on" : ""), onclick: () => {
        state.unreadOnly = !state.unreadOnly;
        renderToolbar();
        renderList$1();
        pump();
      } }, "只看未读"),
      h("button", { type: "button", class: "ccwn-btn", onclick: (e) => markAllRead(e.currentTarget), disabled: state.summary && !state.summary.totalUnread }, "全部已读"),
      h("button", { type: "button", class: "ccwn-icon", title: "刷新", onclick: () => go(state.view, state.filter, true) }, icon("refresh", 16))
    );
    toolbarEl.replaceChildren(left, right);
    syncStickyTop();
  }
  const DEFAULT_AVATAR = "https://m.ccw.site/community/images/avatar-default.png";
  function avatarEl(src, oid, size) {
    const img = h("img", { class: "ccwn-avatar", src: src || DEFAULT_AVATAR, alt: "", loading: "lazy", width: size, height: size });
    img.onerror = () => {
      img.onerror = null;
      img.src = DEFAULT_AVATAR;
    };
    return oid ? h("a", { href: "/student/" + oid, target: "_blank", rel: "noreferrer", class: "ccwn-avatar-link" }, img) : img;
  }
  function pixImg(key, size) {
    return h("img", { class: "ccwn-pix", src: PIX[key] || PIX.SYSTEM, alt: "", width: size, height: size });
  }
  function leadEl(it, face) {
    return h("div", { class: "ccwn-lead" }, face);
  }
  function sysFace(it) {
    return h("div", { class: "ccwn-sys-face" }, pixImg(it.contentCategory === "FOLLOWED" ? "FANS" : it.group, 30));
  }
  function userLink(u) {
    const name = u.name || "未知用户";
    return u.oid ? h("a", { class: "ccwn-user", href: "/student/" + u.oid, target: "_blank", rel: "noreferrer", text: name }) : h("span", { class: "ccwn-user", text: name });
  }
  function subjectLink(item, title) {
    const href = targetHref(item);
    const t = title || subjectTitle(item);
    if (!t) return null;
    return href ? h("a", { class: "ccwn-subject", href, target: "_blank", rel: "noreferrer", text: t }) : h("span", { class: "ccwn-subject", text: t });
  }
  function thumbEl(item) {
    const src = thumbOf(item);
    if (!src) return null;
    const href = targetHref(item);
    const img = h("img", { src, alt: "", loading: "lazy" });
    img.onerror = () => img.parentNode && img.parentNode.remove();
    return href ? h("a", { class: "ccwn-thumb", href, target: "_blank", rel: "noreferrer" }, img) : h("span", { class: "ccwn-thumb" }, img);
  }
  function asideEl(child) {
    return h("div", { class: "ccwn-aside" }, child);
  }
  function timeEl(iso) {
    return h("time", { class: "ccwn-time", datetime: iso, title: fullTime(iso), text: relTime(iso) });
  }
  function bodyEl(content, cls) {
    const el = h("div", { class: "ccwn-body is-clamped " + (cls || "") });
    el.appendChild(content);
    requestAnimationFrame(() => {
      if (el.isConnected && el.scrollHeight > el.clientHeight + 4 && !(el.nextSibling && el.nextSibling.classList && el.nextSibling.classList.contains("ccwn-more"))) {
        el.after(h("button", { type: "button", class: "ccwn-more", onclick: (e) => {
          el.classList.remove("is-clamped");
          el.classList.add("is-open");
          e.currentTarget.remove();
        } }, "展开"));
      }
    });
    return el;
  }
  function renderRow(row) {
    const items = row.items;
    const it = items[0];
    const unread = items.some((x) => x.readState === "UNREAD" && !state.readLocal.has(x.id));
    const el = h("article", { class: "ccwn-row" + (unread ? " is-unread" : ""), "data-ids": items.map((x) => x.id).join(",") });
    items.forEach((x) => rowByItem.set(x.id, el));
    let content;
    if (items.length > 1) content = renderAggregate(row, items);
    else if (it.group === "REPLY") content = renderReply(it);
    else if (it.group === "CONTENT_INTERACTION") content = renderInteraction(it);
    else if (it.group === "FRIEND_SHARE") content = renderShare(it);
    else content = renderSystem(it);
    el.append(...content.filter(Boolean));
    observeRow(el, items);
    return el;
  }
  function line(parts, iso, actions2) {
    const meta = h("div", { class: "ccwn-meta" }, timeEl(iso));
    const acts = (actions2 || []).filter(Boolean);
    if (acts.length) meta.appendChild(h("div", { class: "ccwn-hover" }, acts));
    return h("div", { class: "ccwn-line" }, h("div", { class: "ccwn-head" }, ...parts), meta);
  }
  const verb = (t) => h("span", { class: "ccwn-verb", text: t });
  function renderInteraction(it) {
    const u = sender(it);
    const extra = it.contentCategory === "CREATION_REMIXED" && it.content && it.content.remixed_creation_title ? h("div", { class: "ccwn-body is-muted", text: "改编作品：" + it.content.remixed_creation_title }) : null;
    const quote = it.contentCategory === "COMMENT_LIKED" && it.comment ? bodyEl(richText(plain(it.comment)), "is-quote") : null;
    return [
      leadEl(it, avatarEl(u.avatar, u.oid, 40)),
      h("div", { class: "ccwn-main-col" }, line([userLink(u), verb(interactionVerb(it)), subjectLink(it)], it.createdAt), quote, extra),
      asideEl(thumbEl(it))
    ];
  }
  function followCtl(u, it, small) {
    const status = state.following[u.oid] || it.followInfo && it.followInfo.followingStatus;
    if (status === "UNFOLLOWED") {
      return h("button", { type: "button", class: "ccwn-btn is-primary is-small" + (small ? " is-tiny" : ""), onclick: async (e) => {
        e.stopPropagation();
        const b = e.currentTarget;
        b.disabled = true;
        try {
          state.following[u.oid] = await api.follow(u.oid) || "BOTH_FOLLOWED";
          b.replaceWith(h("span", { class: "ccwn-muted-tag", text: "已互关" }));
        } catch (err) {
          b.disabled = false;
          toast(err.message || "关注失败");
        }
      } }, "回关");
    }
    if (status) return h("span", { class: "ccwn-muted-tag", text: status === "BOTH_FOLLOWED" ? "已互关" : "已关注" });
    return null;
  }
  function renderAggregate(row, items) {
    const it = items[0];
    const isFollow = it.contentCategory === "FOLLOWED";
    const users = [];
    const seen = /* @__PURE__ */ new Set();
    items.forEach((x) => {
      const u = sender(x);
      const k = u.oid || u.name;
      if (!seen.has(k)) {
        seen.add(k);
        users.push({ u, x });
      }
    });
    const faces = h("div", { class: "ccwn-faces" }, users.slice(0, 10).map(({ u }) => avatarEl(u.avatar, u.oid, 24)));
    const names = [];
    users.slice(0, 2).forEach(({ u }, i) => {
      if (i) names.push(h("span", { class: "ccwn-sep", text: "、" }));
      names.push(userLink(u));
    });
    if (users.length > 2) names.push(verb("等 " + users.length + " 人"));
    const open = state.expanded.has(row.key);
    const toggle = h("button", { type: "button", class: "ccwn-link", onclick: () => {
      if (state.expanded.has(row.key)) state.expanded.delete(row.key);
      else state.expanded.add(row.key);
      rowCache.delete(row.key);
      renderList$1();
    } }, open ? "收起" : isFollow ? "查看全部 " + users.length + " 人" : "查看全部 " + items.length + " 条");
    const detail = open ? h("ul", { class: "ccwn-agg-list" }, users.map(({ u, x }) => h(
      "li",
      { class: x.readState === "UNREAD" && !state.readLocal.has(x.id) ? "is-unread" : "" },
      avatarEl(u.avatar, u.oid, 22),
      userLink(u),
      isFollow ? followCtl(u, x, true) : null,
      timeEl(x.createdAt)
    ))) : null;
    const parts = isFollow ? names.concat(verb("关注了你")) : names.concat(verb(interactionVerb(it)), subjectLink(it));
    return [
      h("div", { class: "ccwn-lead" }, sysFace(it)),
      h("div", { class: "ccwn-main-col" }, line(parts, it.createdAt), h("div", { class: "ccwn-sub-actions" }, open ? null : faces, toggle), detail),
      asideEl(isFollow ? null : thumbEl(it))
    ];
  }
  function renderReply(it) {
    const u = sender(it);
    const course = it.content && it.content.ext && (it.content.ext.courseTitle || "").replace(/[{}]/g, "");
    const kindTitle = it.subjectType === "PROFILE" ? null : it.subjectType === "OUTSIDE_EMBED" ? course ? subjectLink(it, course) : null : subjectLink(it);
    const tail = replyTail(it);
    const href = targetHref(it);
    const canReply = Boolean(it.triggeredById && it.actions && it.actions.reply);
    const col = h("div", { class: "ccwn-main-col" });
    col.append(
      line([userLink(u), verb(replyVerb(it)), kindTitle, tail ? verb(tail) : null].filter(Boolean), it.createdAt, [
        canReply ? h("button", { type: "button", class: "ccwn-act", onclick: () => openComposer(it, col) }, "回复") : null,
        href ? h("a", { class: "ccwn-act", href, target: "_blank", rel: "noreferrer" }, "查看对话") : null
      ]),
      ...[
        it.message ? bodyEl(richText(plain(it.message)), "is-quote") : null,
        bodyEl(richText(plain(it.comment || "")), "is-comment")
      ].filter(Boolean)
    );
    if (state.composer && state.composer.id === it.id) col.appendChild(composerEl$1(it));
    return [leadEl(it, avatarEl(u.avatar, u.oid, 40)), col, asideEl(thumbEl(it))];
  }
  function composerEl$1(it) {
    const u = sender(it);
    const ta = h("textarea", { rows: "2", placeholder: "回复 " + (u.name || "") + "…", maxlength: "500" });
    ta.value = state.composer.text || "";
    ta.addEventListener("input", () => {
      state.composer.text = ta.value;
    });
    const status = h("span", { class: "ccwn-compose-status" });
    const send = h("button", { type: "button", class: "ccwn-btn is-primary" }, "发送");
    const cancel = h("button", { type: "button", class: "ccwn-btn" }, "取消");
    const close = () => {
      state.composer = null;
      box.remove();
    };
    const submit = async () => {
      const text = ta.value.trim();
      if (!text) {
        ta.focus();
        return;
      }
      send.disabled = true;
      status.textContent = "发送中…";
      status.className = "ccwn-compose-status";
      try {
        const r = await api.reply(text, it.triggeredById);
        close();
        toast(r && r.status === "CREATED" ? "回复已提交，正在审核" : "回复成功");
      } catch (e) {
        send.disabled = false;
        status.textContent = e.message || "发送失败";
        status.className = "ccwn-compose-status is-error";
      }
    };
    send.onclick = submit;
    cancel.onclick = close;
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submit();
      }
      if (e.key === "Escape") close();
    });
    const box = h("div", { class: "ccwn-compose" }, ta, h("div", { class: "ccwn-compose-bar" }, status, h("span", { class: "ccwn-hint", text: "Ctrl + Enter 发送" }), cancel, send));
    requestAnimationFrame(() => ta.focus());
    return box;
  }
  function openComposer(it, col) {
    const prev = document.querySelector(".ccwn-compose");
    if (prev) prev.remove();
    if (state.composer && state.composer.id === it.id) {
      state.composer = null;
      return;
    }
    state.composer = { id: it.id, text: "" };
    col.appendChild(composerEl$1(it));
  }
  function renderShare(it) {
    const u = sender(it);
    const v = shareTarget(it) || "发来分享";
    const msg = it.content && it.content.message || it.message || "";
    const title = it.subjectType === "PROFILE" && it.studentInfo ? subjectLink(it, it.studentInfo.name) : subjectLink(it);
    const unavailable = it.target && it.target.type === "NONE" && !msg && it.subjectType !== "SOCIETY";
    return [
      leadEl(it, avatarEl(u.avatar, u.oid, 40)),
      h(
        "div",
        { class: "ccwn-main-col" },
        line([userLink(u), verb(v), title].filter(Boolean), it.createdAt),
        msg ? bodyEl(richText(plain(msg)), "is-comment") : null,
        unavailable ? h("div", { class: "ccwn-body is-muted", text: it.title || "该内容暂不可访问" }) : null
      ),
      asideEl(thumbEl(it))
    ];
  }
  function renderSystem(it) {
    const u = sender(it);
    const hasSender = Boolean(it.senderInfo && it.senderInfo.name);
    if (it.contentCategory === "FOLLOWED") {
      return [
        leadEl(it, avatarEl(u.avatar, u.oid, 40)),
        h("div", { class: "ccwn-main-col" }, line([userLink(u), verb("关注了你")], it.createdAt)),
        asideEl(followCtl(u, it))
      ];
    }
    const raw = it.comment || it.message || it.content && it.content.comments || "";
    const title = it.title || SYSTEM_TITLE[it.contentCategory] || (it.group === "COMMUNITY" ? "社区通知" : "系统通知");
    const href = targetHref(it);
    const face = hasSender && it.contentCategory !== "INVITEE_REGISTERED" ? leadEl(it, avatarEl(u.avatar, u.oid, 40)) : h("div", { class: "ccwn-lead" }, sysFace(it));
    return [
      face,
      h(
        "div",
        { class: "ccwn-main-col" },
        line([h("span", { class: "ccwn-sys-title", text: title })], it.createdAt, [href ? h("a", { class: "ccwn-act", href, target: "_blank", rel: "noreferrer" }, "查看") : null]),
        raw ? bodyEl(looksHtml(raw) ? safeHtml(raw) : richText(raw), "is-system") : null
      ),
      asideEl(thumbEl(it))
    ];
  }
  function reconcile(container, nodes) {
    for (let i = 0; i < nodes.length; i++) {
      if (container.children[i] !== nodes[i]) container.insertBefore(nodes[i], container.children[i] || null);
    }
    while (container.children.length > nodes.length) container.lastChild.remove();
  }
  function rowSig(row) {
    return row.items.map((x) => x.id + (x.readState === "UNREAD" && !state.readLocal.has(x.id) ? "u" : "")).join(",") + (state.expanded.has(row.key) ? "+" : "");
  }
  function renderList$1() {
    if (!listEl) return;
    const items = visibleItems();
    const sections = buildRows(items);
    const nodes = [];
    for (const s of sections) {
      let sh = sectionCache.get(s.key);
      if (!sh) {
        sh = h("div", { class: "ccwn-section" }, h("span", { text: s.label }), h("b"));
        sectionCache.set(s.key, sh);
      }
      nodes.push(sh);
      for (const row of s.rows) {
        const sig = rowSig(row);
        let c = rowCache.get(row.key);
        if (!c || c.sig !== sig && !(state.composer && row.items.some((x) => x.id === state.composer.id))) {
          c = { el: renderRow(row), sig };
          rowCache.set(row.key, c);
        }
        nodes.push(c.el);
      }
    }
    reconcile(listEl, nodes);
    renderFoot$1(items.length);
  }
  function renderFoot$1(count) {
    const err = anyError();
    let content;
    if (err) {
      content = h("div", { class: "ccwn-state" }, h("span", { text: err.message || "加载失败" }), h("button", { type: "button", class: "ccwn-btn", onclick: () => {
        viewGroups().map(stream).forEach((s) => {
          s.error = null;
        });
        pump();
      } }, "重试"));
    } else if (anyLoading() || !allDone()) {
      content = count ? h("div", { class: "ccwn-state is-loading" }, "加载中…") : h("div", { class: "ccwn-skeleton" }, [0, 1, 2, 3, 4, 5].map(() => h("div", { class: "ccwn-sk-row" }, h("i"), h("div", null, h("b"), h("s")))));
    } else if (!count) {
      content = h("div", { class: "ccwn-empty" }, h("div", { class: "ccwn-empty-title", text: state.unreadOnly ? "没有未读消息" : "暂无消息" }));
    } else {
      content = h("div", { class: "ccwn-state is-end", text: "没有更早的消息了" });
    }
    footEl.replaceChildren(content);
  }
  let pumping = false;
  async function pump() {
    if (pumping || !root || !isActive) return;
    pumping = true;
    const gen = state.gen;
    try {
      for (let guard = 0; guard < 30; guard++) {
        if (gen !== state.gen) break;
        const rect = footEl.getBoundingClientRect();
        const need = rect.top < window.innerHeight + 800;
        if (!need) break;
        const s = nextStreamToLoad();
        if (!s) break;
        renderFoot$1(visibleItems().length);
        await loadStream(s);
        if (gen !== state.gen) break;
        renderList$1();
      }
    } finally {
      pumping = false;
      if (gen === state.gen) renderList$1();
    }
  }
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
  }
  function syncHeaderBadge() {
    if (!state.summary) return;
    const n = state.summary.totalUnread || 0;
    document.querySelectorAll('header a[href*="/notice"]').forEach((a) => {
      const badge = Array.from(a.querySelectorAll("*")).find((x) => !x.children.length && !x.classList.contains("ccwk-env-badge") && /^\d+\+?$/.test(x.textContent.trim()));
      if (!badge) return;
      if (n) {
        badge.textContent = n > 99 ? "99+" : String(n);
        badge.style.display = "";
      } else badge.style.display = "none";
    });
  }
  const state = {
    view: "ALL",
    filter: "ALL",
    unreadOnly: false,
    summary: null,
    streams: {},
    // group -> { items, cursor, hasMore, loading, error }
    seen: /* @__PURE__ */ new Set(),
    // 已提交标读的 id
    readLocal: /* @__PURE__ */ new Set(),
    // 本地已读（等待淡出）
    expanded: /* @__PURE__ */ new Set(),
    composer: null,
    // { id, text }
    following: {},
    // oid -> status
    gen: 0
  };
  function streamKey(g) {
    return g + ":" + (g === "CONTENT_INTERACTION" ? state.filter : "ALL");
  }
  function stream(g) {
    const k = streamKey(g);
    if (!state.streams[k]) state.streams[k] = { group: g, filter: g === "CONTENT_INTERACTION" ? state.filter : "ALL", items: [], ids: /* @__PURE__ */ new Set(), cursor: null, hasMore: true, loading: false, error: null, loaded: false };
    return state.streams[k];
  }
  const viewGroups = () => state.view === "ALL" ? GROUPS : [state.view];
  async function loadStream(s) {
    if (s.loading || !s.hasMore) return;
    s.loading = true;
    s.error = null;
    const gen = state.gen;
    try {
      const p = await api.page(s.group, s.filter, s.cursor);
      if (gen !== state.gen) return;
      for (const it of p.items || []) {
        if (s.ids.has(it.id)) continue;
        s.ids.add(it.id);
        it._token = p.readToken;
        it._filter = s.filter;
        s.items.push(it);
      }
      s.cursor = p.nextCursor;
      s.hasMore = Boolean(p.hasMore && p.nextCursor);
      s.loaded = true;
    } catch (e) {
      if (gen !== state.gen) return;
      s.error = e;
      if (e.code === "10828906") {
        deactivate(true);
        return;
      }
    } finally {
      if (gen === state.gen) s.loading = false;
    }
  }
  function visibleItems() {
    const groups = viewGroups();
    const ss = groups.map(stream);
    let frontier = -Infinity;
    for (const s of ss) {
      if (!s.hasMore) continue;
      if (!s.items.length) {
        frontier = Infinity;
        break;
      }
      frontier = Math.max(frontier, Date.parse(s.items[s.items.length - 1].createdAt));
    }
    let all = [];
    ss.forEach((s) => {
      all = all.concat(s.items);
    });
    all.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (groups.length > 1) all = all.filter((it) => Date.parse(it.createdAt) >= frontier);
    if (state.unreadOnly) all = all.filter((it) => it.readState === "UNREAD" && !state.readLocal.has(it.id));
    return all;
  }
  function nextStreamToLoad() {
    const ss = viewGroups().map(stream).filter((s) => s.hasMore && !s.error);
    if (!ss.length) return null;
    const empty = ss.find((s) => !s.items.length);
    if (empty) return empty;
    return ss.reduce((best, s) => Date.parse(s.items[s.items.length - 1].createdAt) > Date.parse(best.items[best.items.length - 1].createdAt) ? s : best);
  }
  const allDone = () => viewGroups().map(stream).every((s) => !s.hasMore);
  const anyLoading = () => viewGroups().map(stream).some((s) => s.loading);
  const anyError = () => viewGroups().map(stream).find((s) => s.error);
  let summaryTimer = 0;
  function refreshSummary(delay) {
    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(async () => {
      try {
        state.summary = await api.summary(false);
        renderNav();
        renderToolbar();
        syncHeaderBadge();
      } catch (e) {
        if (e.code === "10828906") deactivate(true);
      }
    }, delay || 0);
  }
  const pendingRead = /* @__PURE__ */ new Map();
  let flushTimer$1 = 0;
  function queueRead(it) {
    if (it.readState !== "UNREAD" || state.seen.has(it.id) || !it._token) return;
    state.seen.add(it.id);
    const k = it.group + "|" + it._filter + "|" + it._token;
    let p = pendingRead.get(k);
    if (!p) {
      p = { group: it.group, filter: it._filter, readToken: it._token, ids: /* @__PURE__ */ new Set(), items: [] };
      pendingRead.set(k, p);
    }
    p.ids.add(it.id);
    p.items.push(it);
    clearTimeout(flushTimer$1);
    flushTimer$1 = setTimeout(flushRead, 400);
  }
  async function flushRead() {
    const batches = Array.from(pendingRead.values());
    pendingRead.clear();
    for (const b of batches) {
      try {
        await api.markRead({ group: b.group, filter: b.filter, readToken: b.readToken, ids: Array.from(b.ids) });
        b.items.forEach((it) => {
          it.readState = "READ";
          markRowRead(it.id);
        });
      } catch (_) {
        b.items.forEach((it) => state.seen.delete(it.id));
      }
    }
    refreshSummary(300);
  }
  function markRowRead(id) {
    state.readLocal.add(id);
    const row = rowByItem.get(id);
    if (!row) return;
    const ids = row.dataset.ids.split(",");
    if (ids.every((x) => state.readLocal.has(x))) {
      setTimeout(() => row.classList.remove("is-unread"), 1600);
    }
  }
  let io = null;
  function resetRowObserver() {
    if (io) {
      io.disconnect();
      io = null;
    }
  }
  const dwell = /* @__PURE__ */ new Map();
  function observeRow(row, items) {
    if (!items.some((it) => it.readState === "UNREAD")) return;
    if (!io) {
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          const el = e.target;
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            if (!dwell.has(el)) dwell.set(el, setTimeout(() => {
              dwell.delete(el);
              if (document.visibilityState !== "visible") return;
              (el._items || []).forEach(queueRead);
              io.unobserve(el);
            }, 500));
          } else if (dwell.has(el)) {
            clearTimeout(dwell.get(el));
            dwell.delete(el);
          }
        }
      }, { threshold: [0, 0.6, 1] });
    }
    row._items = items;
    io.observe(row);
  }
  async function markAllRead(btn) {
    btn.disabled = true;
    btn.textContent = "处理中…";
    try {
      const s = await api.summary(true);
      const token2 = s && s.markAll && s.markAll.readToken;
      if (token2) {
        for (let i = 0; i < 50; i++) {
          const r = await api.markRead({ group: "ALL", readToken: token2 });
          if (r.completed) break;
          await new Promise((res) => setTimeout(res, Math.max(200, r.retryAfterMs || 0)));
        }
      }
      Object.values(state.streams).forEach((st) => st.items.forEach((it) => {
        if (it.readState === "UNREAD") {
          it.readState = "READ";
          markRowRead(it.id);
        }
      }));
      toast("已全部标为已读");
    } catch (e) {
      toast(e.message || "操作失败，请重试");
    }
    refreshSummary(0);
    btn.disabled = false;
    btn.textContent = "全部已读";
  }
  const MAX_SIDE = 1600;
  const TARGET_BYTES = 900 * 1024;
  const MAX_BYTES = 3 * 1024 * 1024;
  const ATTEMPTS = [[1600, 0.8], [1600, 0.7], [1280, 0.66], [1080, 0.58]];
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("图片读不出来"));
      };
      img.src = url;
    });
  }
  function encode(img, side, quality) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
  }
  async function compressForUpload(file) {
    const type = (file.type || "").toLowerCase();
    if (!type.startsWith("image/")) throw new Error("只能发图片");
    if (type === "image/gif") {
      if (file.size > MAX_BYTES) throw new Error("动图超过 3MB，发不了");
      return file;
    }
    let img;
    try {
      img = await loadImage(file);
    } catch (err) {
      if (file.size <= MAX_BYTES) return file;
      throw err;
    }
    const small = Math.max(img.naturalWidth, img.naturalHeight) <= MAX_SIDE;
    let best = null;
    for (const [side, quality] of ATTEMPTS) {
      const blob = await encode(img, side, quality);
      if (!blob) break;
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= TARGET_BYTES) break;
    }
    if (!best) {
      if (file.size <= MAX_BYTES) return file;
      throw new Error("图片太大了，换一张试试");
    }
    if (small && file.size <= best.size && file.size <= MAX_BYTES) return file;
    if (best.size > MAX_BYTES) throw new Error("图片太大了，换一张试试");
    return new File([best], (file.name || "image").replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  }
  let current$1 = null;
  function openImageViewer(urls, start = 0) {
    if (!urls || !urls.length) return;
    if (current$1) current$1.close();
    let index = Math.max(0, Math.min(start, urls.length - 1));
    let scale = 1;
    let x = 0;
    let y = 0;
    const img = h("img", { class: "ccwk-iv-img", alt: "", draggable: "false" });
    const stage = h("div", { class: "ccwk-iv-stage" }, img);
    const counter = h("span", { class: "ccwk-iv-count" });
    const original = h("a", { class: "ccwk-iv-btn", target: "_blank", rel: "noreferrer", title: "在新标签页打开原图" }, "原图");
    const closeBtn = h("button", { type: "button", class: "ccwk-iv-btn is-icon", title: "关闭（Esc）" }, icon("close", 16));
    const prev = h("button", { type: "button", class: "ccwk-iv-nav is-prev", title: "上一张（←）" }, icon("arrow", 20));
    const next = h("button", { type: "button", class: "ccwk-iv-nav is-next", title: "下一张（→）" }, icon("arrow", 20));
    const strip = h("div", { class: "ccwk-iv-strip" }, urls.map((src, i) => {
      const t = h("button", { type: "button", class: "ccwk-iv-thumb" }, h("img", { src, alt: "", loading: "lazy" }));
      t.addEventListener("click", (e) => {
        e.stopPropagation();
        show2(i);
      });
      return t;
    }));
    const root2 = h(
      "div",
      { class: "ccwk-iv", role: "dialog", "aria-modal": "true" },
      h("div", { class: "ccwk-iv-top" }, counter, h("span", { class: "ccwk-iv-tools" }, original, closeBtn)),
      stage,
      urls.length > 1 ? prev : null,
      urls.length > 1 ? next : null,
      urls.length > 1 ? strip : null
    );
    const apply = () => {
      img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      img.classList.toggle("is-zoomed", scale > 1);
    };
    const reset2 = () => {
      scale = 1;
      x = 0;
      y = 0;
      apply();
    };
    function show2(i) {
      index = (i + urls.length) % urls.length;
      img.classList.remove("is-ready");
      img.onload = () => img.classList.add("is-ready");
      img.src = urls[index];
      original.href = urls[index];
      counter.textContent = urls.length > 1 ? `${index + 1} / ${urls.length}` : "";
      strip.querySelectorAll(".ccwk-iv-thumb").forEach((t, k) => t.classList.toggle("is-on", k === index));
      reset2();
    }
    img.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (scale > 1) {
        reset2();
        return;
      }
      const fit = img.getBoundingClientRect().width / (img.naturalWidth || 1);
      scale = Math.max(2, 1 / fit);
      apply();
    });
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const next2 = Math.min(8, Math.max(1, scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      if (next2 === 1) {
        reset2();
        return;
      }
      scale = next2;
      apply();
    }, { passive: false });
    let drag = null;
    img.addEventListener("pointerdown", (e) => {
      if (scale <= 1) return;
      e.preventDefault();
      drag = { sx: e.clientX - x, sy: e.clientY - y, moved: false };
      img.setPointerCapture(e.pointerId);
    });
    img.addEventListener("pointermove", (e) => {
      if (!drag) return;
      x = e.clientX - drag.sx;
      y = e.clientY - drag.sy;
      drag.moved = true;
      apply();
    });
    img.addEventListener("pointerup", () => {
      setTimeout(() => {
        drag = null;
      }, 0);
    });
    img.addEventListener("click", (e) => e.stopPropagation());
    stage.addEventListener("click", () => {
      if (!drag) close();
    });
    prev.addEventListener("click", (e) => {
      e.stopPropagation();
      show2(index - 1);
    });
    next.addEventListener("click", (e) => {
      e.stopPropagation();
      show2(index + 1);
    });
    closeBtn.addEventListener("click", () => close());
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowLeft" && urls.length > 1) show2(index - 1);
      else if (e.key === "ArrowRight" && urls.length > 1) show2(index + 1);
    };
    const prevOverflow = document.documentElement.style.overflow;
    function close() {
      document.removeEventListener("keydown", onKey, true);
      document.documentElement.style.overflow = prevOverflow;
      root2.classList.add("is-out");
      setTimeout(() => root2.remove(), 150);
      current$1 = null;
    }
    document.addEventListener("keydown", onKey, true);
    document.documentElement.style.overflow = "hidden";
    document.body.appendChild(root2);
    current$1 = { close };
    show2(index);
  }
  function bindGallery(anchors, urls) {
    anchors.forEach((a, i) => a.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      openImageViewer(urls, i);
    }));
  }
  const CONTENT_IMG = ".ccwn-body img:not(.ccwn-emoji):not(.ccwn-avatar)";
  function installContentImageViewer() {
    document.addEventListener("click", (e) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const img = e.target.closest && e.target.closest(CONTENT_IMG);
      if (!img) return;
      const body = img.closest(".ccwn-body");
      const imgs = [...body.querySelectorAll(CONTENT_IMG)];
      const urls = imgs.map((x) => x.closest("a.ccwn-img") && x.closest("a.ccwn-img").href || x.currentSrc || x.src);
      e.preventDefault();
      e.stopPropagation();
      openImageViewer(urls, Math.max(0, imgs.indexOf(img)));
    }, true);
  }
  let selfOid = null;
  let follows = null;
  function mySelfOid() {
    if (!selfOid) {
      selfOid = post("/students/self/detail", {}).then((d) => d && (d.studentOid || d.oid) || null).catch(() => null);
    }
    return selfOid;
  }
  function myFollowings() {
    if (!follows) {
      follows = (async () => {
        const oid = await mySelfOid();
        if (!oid) return [];
        const out = [];
        for (let page = 1; page <= 5; page++) {
          const body = await post(`/student/following/page?page=${page}&perPage=100&sortType=DESC`, { studentOid: oid });
          const data = body && body.data || [];
          data.forEach((u) => {
            if (u.followingOid) out.push({ oid: u.followingOid, name: u.name, avatar: u.avatar, mutual: u.operatorFollowingStatus === "BOTH_FOLLOWED" });
          });
          if (!body || page >= (body.totalPages || 1) || !data.length) break;
        }
        return out;
      })().catch(() => {
        follows = null;
        return [];
      });
    }
    return follows;
  }
  const injectors = [];
  let frame = 0;
  function registerInjector(match, run) {
    injectors.push({ match, run });
  }
  function tick() {
    frame = 0;
    const path = location.pathname;
    injectors.forEach(({ match, run }) => {
      const m = path.match(match);
      if (!m) return;
      try {
        run(m);
      } catch (_) {
      }
    });
  }
  function schedulePages() {
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function installPages() {
    new MutationObserver(schedulePages).observe(document.body, { childList: true, subtree: true });
    schedulePages();
  }
  function memo(fn, ttl = 6e4) {
    const cache = /* @__PURE__ */ new Map();
    return (key) => {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < ttl) return hit.value;
      const value = Promise.resolve().then(() => fn(key)).catch((err) => {
        cache.delete(key);
        throw err;
      });
      cache.set(key, { at: Date.now(), value });
      return value;
    };
  }
  const GIFT_EMOJI = { flower: "🌸", lollipop: "🍭", cake: "🎂", trophy: "🏆", rocket: "🚀", castle: "🏰", star: "⭐", heart: "❤️", balloon: "🎈", crown: "👑", cat: "🐱", icecream: "🍦" };
  function activityText(a) {
    if (!a) return "";
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(kcIso(a.started_at))) / 6e4));
    const dur = mins < 1 ? "刚刚开始" : mins < 60 ? mins + " 分钟" : Math.floor(mins / 60) + " 小时";
    return (a.kind === "create" ? "正在创作 " : "正在玩 ") + "「" + a.title + "」 · " + dur;
  }
  function activityHref(a) {
    return a && a.ccw_oid ? "/detail/" + a.ccw_oid : null;
  }
  const fresh = () => ({ posts: [], ids: /* @__PURE__ */ new Set(), before: null, hasMore: true, loading: false });
  const stores = { follow: fresh(), square: fresh() };
  const session = { enabled: null, follows: null };
  const SCOPE_KEY = "kukechat-ccw:feed-scope";
  let kcScope = (() => {
    try {
      return localStorage.getItem(SCOPE_KEY) === "follow" ? "follow" : "square";
    } catch (_) {
      return "square";
    }
  })();
  function getKcScope() {
    return kcScope;
  }
  function setKcScope(scope) {
    if (scope !== "follow" && scope !== "square") return;
    kcScope = scope;
    try {
      localStorage.setItem(SCOPE_KEY, scope);
    } catch (_) {
    }
  }
  function kcStore() {
    return stores[kcScope];
  }
  function kcSignedOut() {
    return session.enabled === false;
  }
  function onKcLogin(cb) {
    return onLogin(() => {
      session.enabled = null;
      session.follows = null;
      resetKcFeed();
      cb();
    });
  }
  function renderLoginPrompt() {
    const btn = h("button", { type: "button", class: "ccwk-cp-send" }, "登录");
    btn.addEventListener("click", () => openKukeChatLogin());
    return h(
      "div",
      { class: "ccwf-card ccwk-login" },
      h("img", { class: "ccwk-login-icon", src: KC_ICON, alt: "" }),
      h(
        "div",
        { class: "ccwk-login-text" },
        h("b", { text: "登录 KukeChat" }),
        h("span", { text: "看好友和所有人的 KukeChat 动态，发动态、点赞、评论" })
      ),
      btn
    );
  }
  async function kcFeedEnabled() {
    if (session.enabled == null) session.enabled = await ensureSession().catch(() => false);
    return session.enabled;
  }
  function resetKcFeed() {
    stores.follow = fresh();
    stores.square = fresh();
    cards.clear();
  }
  function addPost(store, post2, front) {
    if (!post2 || store.ids.has(post2.id)) return;
    store.ids.add(post2.id);
    if (front) store.posts.unshift(post2);
    else store.posts.push(post2);
  }
  async function loadKcPage() {
    const scope = kcScope;
    const store = stores[scope];
    if (store.loading || !store.hasMore || !await kcFeedEnabled()) return false;
    store.loading = true;
    try {
      let page;
      if (scope === "square") {
        page = await kcRequest("GET", "/posts/feed?scope=square&limit=20" + (store.before ? "&before_id=" + store.before : ""));
      } else {
        if (!session.follows) session.follows = (await myFollowings()).map((f) => f.oid);
        page = await kcRequest("POST", "/ccw/feed", { ccw_oids: session.follows, before_id: store.before, limit: 20 });
      }
      const list = Array.isArray(page) ? page : [];
      list.forEach((p) => addPost(store, p, false));
      const ids = list.filter((p) => !p.pinned_at).map((p) => p.id);
      if (ids.length) store.before = Math.min(...ids);
      store.hasMore = list.length >= 20;
      if (stores[scope] !== store) return false;
      return list.length > 0;
    } catch (_) {
      store.hasMore = false;
      return false;
    } finally {
      store.loading = false;
    }
  }
  const groupOf = (p) => ({ groupId: "kc-" + p.id, kc: p, feed: { type: "KC_POST", feedTime: Date.parse(kcIso(p.created_at)), ownerId: "kc-" + p.author_id } });
  const byTime = (a, b) => (b.feed.feedTime || 0) - (a.feed.feedTime || 0);
  function mergeWithCcw(ccwGroups, ccwHasMore, onlyKc) {
    const store = kcStore();
    const cutoff = ccwHasMore && ccwGroups.length ? Math.min(...ccwGroups.map((g) => g.feed.feedTime || 0)) : -Infinity;
    const kcGroups = store.posts.map(groupOf).filter((g) => onlyKc || g.feed.feedTime >= cutoff);
    const oldestKc = store.posts.length ? Math.min(...store.posts.map((p) => Date.parse(kcIso(p.created_at)))) : Infinity;
    const needMore = store.hasMore && (onlyKc || oldestKc >= cutoff);
    const merged = onlyKc ? kcGroups.sort(byTime) : ccwGroups.concat(kcGroups).sort(byTime);
    return { groups: merged, needMore };
  }
  function author(p) {
    const u = p.author || {};
    return { name: u.nickname || u.username || "KukeChat 用户", avatar: u.avatar_url || u.ccw_avatar_url || "", oid: u.ccw_student_oid || "" };
  }
  function creationQuote(c) {
    return h(
      "a",
      { class: "ccwf-mini-quote", href: "/detail/" + c.oid, target: "_blank", rel: "noreferrer" },
      h("span", { class: "ccwf-mq-cover" }, c.cover_url ? h("img", { src: c.cover_url, alt: "", loading: "lazy" }) : null),
      h(
        "span",
        { class: "ccwf-mq-text" },
        h("b", { text: c.title || "" }),
        h("span", { class: "ccwf-mq-by" }, h("span", { text: (c.author_name || "") + " 的作品" }))
      )
    );
  }
  const cards = /* @__PURE__ */ new Map();
  let rerender = () => {
  };
  function setFeedRerender(fn) {
    rerender = fn;
  }
  const userName = (u) => u && (u.nickname || u.username) || "KukeChat 用户";
  function commentEl(c, onReply) {
    const u = c.author || {};
    const reply = h("button", { type: "button", class: "ccwk-cm-reply" }, "回复");
    reply.addEventListener("click", () => onReply(c));
    return h(
      "div",
      { class: "ccwk-cm" },
      h("img", { class: "ccwk-cm-av", src: u.avatar_url || u.ccw_avatar_url || KC_ICON, alt: "" }),
      h(
        "div",
        { class: "ccwk-cm-main" },
        h(
          "div",
          { class: "ccwk-cm-meta" },
          u.ccw_student_oid ? h("a", { href: "/student/" + u.ccw_student_oid, target: "_blank", rel: "noreferrer", text: userName(u) }) : h("b", { text: userName(u) }),
          c.parent_author ? h("span", { class: "ccwk-cm-to", text: "回复 " + userName(c.parent_author) }) : null,
          h("time", { text: relTime(kcIso(c.created_at)) }),
          reply
        ),
        h("div", { class: "ccwk-cm-text", text: c.content })
      )
    );
  }
  function buildCard(p, avatarEl2) {
    const a = author(p);
    const iso = kcIso(p.created_at);
    const repost = p.repost_of;
    const me2 = () => currentKukeUser();
    const likeN = h("span");
    const likeBtn = h("button", { type: "button", class: "ccwk-act" }, icon("heart", 15), likeN);
    const paintLike = () => {
      likeN.textContent = p.like_count ? fmtCount(p.like_count) : "赞";
      likeBtn.classList.toggle("is-on", Boolean(p.liked_by_me));
      likeBtn.title = p.liked_by_me ? "取消点赞" : "点赞";
    };
    likeBtn.addEventListener("click", async () => {
      if (!me2() || likeBtn.disabled) return;
      likeBtn.disabled = true;
      const before = [p.liked_by_me, p.like_count];
      p.liked_by_me = !p.liked_by_me;
      p.like_count = Math.max(0, (p.like_count || 0) + (p.liked_by_me ? 1 : -1));
      paintLike();
      try {
        const r = await kcRequest("POST", `/posts/${p.id}/like`);
        if (r) {
          p.liked_by_me = r.liked;
          p.like_count = r.like_count;
        }
      } catch (_) {
        [p.liked_by_me, p.like_count] = before;
      } finally {
        likeBtn.disabled = false;
        paintLike();
      }
    });
    const commentN = h("span");
    const commentBtn = h("button", { type: "button", class: "ccwk-act", title: "评论" }, icon("reply", 15), commentN);
    const paintComments = () => {
      commentN.textContent = p.comment_count ? fmtCount(p.comment_count) : "评论";
    };
    const panel = h("div", { class: "ccwk-cmts" });
    let comments = null;
    let replyTo = null;
    const list = h("div", { class: "ccwk-cm-list" });
    const input = h("textarea", { class: "ccwk-cm-input", rows: "1", maxlength: "500", placeholder: "写评论…" });
    const send = h("button", { type: "button", class: "ccwk-cp-send", disabled: true }, "发送");
    const replyHint = h("span", { class: "ccwk-cm-hint" });
    const setReply = (c) => {
      replyTo = c;
      replyHint.replaceChildren();
      if (c) {
        const x = h("button", { type: "button", class: "ccwk-cm-x", title: "不回复了" }, icon("close", 10));
        x.addEventListener("click", () => setReply(null));
        replyHint.append("回复 " + userName(c.author), x);
      }
      input.placeholder = c ? "回复 " + userName(c.author) + "…" : "写评论…";
      input.focus();
    };
    const renderComments = () => {
      if (!comments) {
        list.replaceChildren(h("div", { class: "ccwk-cm-empty", text: "加载中…" }));
        return;
      }
      list.replaceChildren(...comments.length ? comments.map((c) => commentEl(c, setReply)) : [h("div", { class: "ccwk-cm-empty", text: "还没有评论" })]);
    };
    const loadComments = async () => {
      renderComments();
      try {
        const r = await kcRequest("GET", `/posts/${p.id}/comments?limit=50`);
        comments = Array.isArray(r) ? r : [];
      } catch (err) {
        comments = [];
        list.replaceChildren(h("div", { class: "ccwk-cm-empty", text: err && err.message || "评论加载失败" }));
        return;
      }
      renderComments();
    };
    const submitComment = async () => {
      const content = input.value.trim();
      if (!content || send.disabled) return;
      send.disabled = true;
      input.disabled = true;
      try {
        const c = await kcRequest("POST", `/posts/${p.id}/comments`, { content, ...replyTo ? { parent_id: replyTo.id } : {} });
        input.value = "";
        setReply(null);
        if (c) {
          (comments || (comments = [])).push(c);
          p.comment_count = (p.comment_count || 0) + 1;
        }
        renderComments();
        paintComments();
      } catch (err) {
        input.placeholder = err && err.message || "发送失败";
      } finally {
        input.disabled = false;
        send.disabled = !input.value.trim();
        input.focus();
      }
    };
    input.addEventListener("input", () => {
      send.disabled = !input.value.trim();
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submitComment();
      }
    });
    send.addEventListener("click", submitComment);
    panel.append(list, h(
      "div",
      { class: "ccwk-cm-compose" },
      h("div", { class: "ccwk-cm-field" }, replyHint, input),
      send
    ));
    commentBtn.addEventListener("click", () => {
      const open = !card2.classList.contains("is-comments");
      card2.classList.toggle("is-comments", open);
      commentBtn.classList.toggle("is-on", open);
      if (open) {
        if (!comments) loadComments();
        input.focus();
      }
    });
    const target = repost && p.repost_of_id ? { id: p.repost_of_id, who: userName(repost.author) } : { id: p.id, who: a.name };
    const shareBtn = h("button", { type: "button", class: "ccwk-act", title: "转发" }, icon("share", 15), h("span", { text: "转发" }));
    const rpBox = h("div", { class: "ccwk-rp" });
    let rpVis = "public";
    const rpInput = h("textarea", { class: "ccwk-cm-input", rows: "1", maxlength: "2000", placeholder: "说点什么…（可以不写）" });
    const rpSend = h("button", { type: "button", class: "ccwk-cp-send" }, "转发");
    const rpSeg = h("div", { class: "ccwk-cp-seg" }, [["public", "公开"], ["friends", "仅好友"]].map(([v, t]) => {
      const b = h("button", { type: "button", class: "ccwk-cp-opt" + (v === rpVis ? " is-on" : "") }, t);
      b.addEventListener("click", () => {
        rpVis = v;
        rpSeg.querySelectorAll(".ccwk-cp-opt").forEach((o) => o.classList.toggle("is-on", o === b));
      });
      return b;
    }));
    const rpNote = h("span", { class: "ccwk-cp-note" });
    rpSend.addEventListener("click", async () => {
      if (rpSend.disabled) return;
      rpSend.disabled = true;
      rpNote.textContent = "转发中…";
      try {
        const post2 = await kcRequest("POST", "/posts", { content: rpInput.value.trim(), visibility: rpVis, repost_of_id: target.id });
        rpInput.value = "";
        rpNote.textContent = "已转发";
        card2.classList.remove("is-reposting");
        shareBtn.classList.remove("is-on");
        if (post2 && post2.id) {
          addPost(stores.follow, post2, true);
          if (post2.visibility === "public") addPost(stores.square, post2, true);
          rerender();
        }
      } catch (err) {
        rpNote.textContent = err && err.message || "转发失败";
      } finally {
        rpSend.disabled = false;
      }
    });
    rpInput.addEventListener("input", () => {
      rpInput.style.height = "auto";
      rpInput.style.height = Math.min(rpInput.scrollHeight, 120) + "px";
    });
    rpInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        rpSend.click();
      }
    });
    rpBox.append(
      h("div", { class: "ccwk-rp-title", text: "转发 " + target.who + " 的动态" }),
      rpInput,
      h("div", { class: "ccwk-rp-bar" }, rpSeg, h("span", { class: "ccwk-cp-right" }, rpNote, rpSend))
    );
    shareBtn.addEventListener("click", () => {
      const open = !card2.classList.contains("is-reposting");
      card2.classList.toggle("is-reposting", open);
      shareBtn.classList.toggle("is-on", open);
      if (open) rpInput.focus();
    });
    const signedIn = Boolean(me2());
    const actions2 = h("div", { class: "ccwk-acts" + (signedIn ? "" : " is-readonly") }, likeBtn, commentBtn, shareBtn);
    paintLike();
    paintComments();
    const repostEl = repost ? h(
      "div",
      { class: "ccwk-feed-repost" },
      h(
        "div",
        { class: "ccwk-rq-head" },
        h("b", { text: userName(repost.author) }),
        h("time", { text: relTime(kcIso(repost.created_at)) })
      ),
      repost.content ? postText(repost.content) : null,
      (repost.image_urls || []).length ? gallery(repost.image_urls, true) : null
    ) : null;
    const card2 = h(
      "article",
      { class: "ccwf-card ccwk-feed-card" },
      h(
        "header",
        { class: "ccwf-head" },
        avatarEl2(a.avatar, a.oid, 40),
        h(
          "div",
          { class: "ccwf-who" },
          h("div", { class: "ccwf-names" }, a.oid ? h("a", { class: "ccwf-name", href: "/student/" + a.oid, target: "_blank", rel: "noreferrer", text: a.name }) : h("span", { class: "ccwf-name", text: a.name })),
          h(
            "div",
            { class: "ccwf-sub" },
            h("span", { text: repost ? "转发了动态" : p.visibility === "friends" ? "仅好友可见" : p.visibility === "private" ? "仅自己可见" : "发布了动态" }),
            h("span", { class: "ccwf-dot", text: "·" }),
            h("time", { datetime: iso, title: fullTime(iso), text: relTime(iso) })
          )
        ),
        h("span", { class: "ccwf-chip ccwk-chip" }, h("img", { src: KC_ICON, alt: "" }), "KukeChat")
      ),
      h(
        "div",
        { class: "ccwk-feed-body" },
        p.content ? postText(p.content) : null,
        (p.image_urls || []).length ? gallery(p.image_urls, false) : null,
        repostEl,
        (p.ccw_creations || []).slice(0, 2).map(creationQuote),
        actions2,
        rpBox,
        panel
      )
    );
    return card2;
  }
  function gallery(urls, small) {
    const shown = urls.slice(0, 4);
    const anchors = shown.map((src, i) => h(
      "a",
      { href: src, target: "_blank", rel: "noreferrer", class: "ccwk-gi" },
      h("img", { src, alt: "", loading: "lazy" }),
      i === 3 && urls.length > 4 ? h("span", { class: "ccwk-gi-more", text: "+" + (urls.length - 4) }) : null
    ));
    bindGallery(anchors, urls);
    return h("div", { class: "ccwk-feed-imgs n" + shown.length + (small ? " is-small" : "") }, anchors);
  }
  const fmtCount = (n) => n >= 1e4 ? (n / 1e4).toFixed(1).replace(/\.0$/, "") + "w" : String(n);
  function renderKcCard(g, { avatarEl: avatarEl2 }) {
    const p = g.kc;
    let card2 = cards.get(p.id);
    if (!card2) {
      card2 = buildCard(p, avatarEl2);
      cards.set(p.id, card2);
    }
    return card2;
  }
  const MAX_POST = 2e3;
  const MAX_IMAGES = 9;
  function renderComposer(onPosted) {
    const me2 = currentKukeUser();
    if (!me2) return null;
    let visibility = "public";
    let busy = false;
    const images = [];
    let nextId = 1;
    const ta = h("textarea", { class: "ccwk-cp-input", rows: "1", maxlength: String(MAX_POST), placeholder: "有什么新鲜事？" });
    const count = h("span", { class: "ccwk-cp-count" });
    const note = h("span", { class: "ccwk-cp-note" });
    const btn = h("button", { type: "button", class: "ccwk-cp-send", disabled: true }, "发布");
    const thumbs = h("div", { class: "ccwk-cp-imgs" });
    const picker = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
    const imgBtn = h("button", { type: "button", class: "ccwk-cp-tool", title: "图片（也可以直接粘贴、拖进来）" }, icon("image", 16));
    const tagBtn = h("button", { type: "button", class: "ccwk-cp-tool", title: "话题" }, icon("hash", 16));
    const suggest = h("div", { class: "ccwk-cp-suggest", role: "listbox" });
    const seg = h(
      "div",
      { class: "ccwk-cp-seg", role: "radiogroup", "aria-label": "谁可以看" },
      [["public", "公开"], ["friends", "仅好友"]].map(([value, label]) => {
        const b = h("button", { type: "button", role: "radio", class: "ccwk-cp-opt" + (value === visibility ? " is-on" : ""), "aria-checked": String(value === visibility) }, label);
        b.addEventListener("click", () => {
          visibility = value;
          seg.querySelectorAll(".ccwk-cp-opt").forEach((o) => {
            const on = o === b;
            o.classList.toggle("is-on", on);
            o.setAttribute("aria-checked", String(on));
          });
          ta.focus();
        });
        return b;
      })
    );
    const card2 = h(
      "div",
      { class: "ccwf-card ccwk-cp" },
      h(
        "div",
        { class: "ccwk-cp-row" },
        h("img", { class: "ccwk-cp-av", src: me2.avatar_url || me2.ccw_avatar_url || KC_ICON, alt: "" }),
        h("div", { class: "ccwk-cp-body" }, ta, suggest),
        h("img", { class: "ccwk-cp-mark", src: KC_ICON, alt: "", title: "发到 KukeChat：好友和关注你的人能在这里看到" })
      ),
      thumbs,
      h(
        "div",
        { class: "ccwk-cp-bar" },
        h("span", { class: "ccwk-cp-left" }, imgBtn, tagBtn, seg, picker),
        h("span", { class: "ccwk-cp-right" }, note, count, btn)
      )
    );
    const uploading = () => images.some((x) => x.uploading);
    const sync = () => {
      const n = ta.value.length;
      const ready = images.filter((x) => x.url).length;
      btn.disabled = busy || uploading() || !ta.value.trim() && !ready;
      count.textContent = n > MAX_POST - 200 ? `${n} / ${MAX_POST}` : "";
      imgBtn.disabled = images.length >= MAX_IMAGES;
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 320) + "px";
      card2.classList.toggle("is-open", card2.contains(document.activeElement) || Boolean(ta.value.trim()) || images.length > 0 || busy);
    };
    const renderThumbs = () => {
      thumbs.replaceChildren(...images.map((x) => {
        const rm = h("button", { type: "button", class: "ccwk-cp-rm", title: "移除" }, icon("close", 12));
        rm.addEventListener("click", () => {
          const i = images.indexOf(x);
          if (i >= 0) images.splice(i, 1);
          URL.revokeObjectURL(x.preview);
          renderThumbs();
          sync();
        });
        const pic = h("img", { src: x.preview, alt: "" });
        pic.addEventListener("click", () => openImageViewer(images.map((y) => y.preview), images.indexOf(x)));
        return h(
          "div",
          { class: "ccwk-cp-img" + (x.uploading ? " is-busy" : "") + (x.error ? " is-error" : ""), title: x.error || "" },
          pic,
          x.uploading ? h("i", { class: "ccwk-cp-spin" }) : null,
          x.error ? h("span", { class: "ccwk-cp-err", text: "失败" }) : null,
          rm
        );
      }));
      thumbs.classList.toggle("has-images", images.length > 0);
    };
    const addFiles = (files) => {
      const list = [...files].filter((f) => (f.type || "").startsWith("image/"));
      if (!list.length) return;
      const room = MAX_IMAGES - images.length;
      if (room <= 0) {
        note.textContent = `最多 ${MAX_IMAGES} 张图`;
        return;
      }
      if (list.length > room) note.textContent = `最多 ${MAX_IMAGES} 张图，多出来的没加`;
      list.slice(0, room).forEach((file) => {
        const x = { id: nextId++, preview: URL.createObjectURL(file), url: null, error: null, uploading: true };
        images.push(x);
        (async () => {
          try {
            const blob = await compressForUpload(file);
            const form = new FormData();
            form.append("file", blob, blob.name || "image.jpg");
            const r = await kcRequest("POST", "/uploads/post-image", form);
            x.url = r && r.url;
            if (!x.url) throw new Error("上传失败");
          } catch (err) {
            x.error = err && err.message || "上传失败";
          } finally {
            x.uploading = false;
            renderThumbs();
            sync();
          }
        })();
      });
      renderThumbs();
      sync();
    };
    imgBtn.addEventListener("click", () => picker.click());
    picker.addEventListener("change", () => {
      addFiles(picker.files || []);
      picker.value = "";
    });
    ta.addEventListener("paste", (e) => {
      const files = e.clipboardData && e.clipboardData.files;
      if (files && files.length && [...files].some((f) => (f.type || "").startsWith("image/"))) {
        e.preventDefault();
        addFiles(files);
      }
    });
    card2.addEventListener("dragover", (e) => {
      if (e.dataTransfer && [...e.dataTransfer.types].includes("Files")) {
        e.preventDefault();
        card2.classList.add("is-drop");
      }
    });
    card2.addEventListener("dragleave", (e) => {
      if (!card2.contains(e.relatedTarget)) card2.classList.remove("is-drop");
    });
    card2.addEventListener("drop", (e) => {
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      e.preventDefault();
      card2.classList.remove("is-drop");
      addFiles(e.dataTransfer.files);
      ta.focus();
    });
    let topics = [];
    let active = 0;
    let query = null;
    let topicTimer = 0;
    let trending = null;
    const closeSuggest = () => {
      query = null;
      topics = [];
      suggest.replaceChildren();
      suggest.classList.remove("is-open");
    };
    const renderSuggest = () => {
      if (query == null || !topics.length) {
        suggest.replaceChildren();
        suggest.classList.remove("is-open");
        return;
      }
      suggest.replaceChildren(
        h("div", { class: "ccwk-cp-sg-title", text: query ? "话题" : "热门话题" }),
        ...topics.map((t, i) => {
          const row = h(
            "button",
            { type: "button", role: "option", class: "ccwk-cp-sg" + (i === active ? " is-on" : "") },
            h("b", { text: "#" + t.name }),
            t.post_count ? h("span", { text: t.post_count + " 条动态" }) : null
          );
          row.addEventListener("mousedown", (e) => {
            e.preventDefault();
            pickTopic(t.name);
          });
          return row;
        })
      );
      suggest.classList.add("is-open");
    };
    const pickTopic = (name) => {
      const caret = ta.selectionStart;
      const before = ta.value.slice(0, caret).replace(/#[^\s#]*$/, "#" + name + " ");
      ta.value = before + ta.value.slice(caret);
      ta.selectionStart = ta.selectionEnd = before.length;
      closeSuggest();
      sync();
      ta.focus();
    };
    const lookupTopics = () => {
      const m = ta.value.slice(0, ta.selectionStart).match(/(^|\s)#([^\s#]{0,40})$/);
      if (!m) {
        closeSuggest();
        return;
      }
      query = m[2];
      active = 0;
      window.clearTimeout(topicTimer);
      topicTimer = window.setTimeout(async () => {
        const q = query;
        try {
          let list;
          if (!q) {
            if (!trending) trending = await kcRequest("GET", "/posts/topics/trending?limit=5");
            list = trending;
          } else {
            list = await kcRequest("GET", "/posts/topics/search?limit=6&q=" + encodeURIComponent(q));
          }
          if (q !== query) return;
          topics = (Array.isArray(list) ? list : []).filter((t) => t && t.name);
          if (q && !topics.some((t) => t.name === q)) topics.push({ name: q, post_count: 0 });
          renderSuggest();
        } catch (_) {
        }
      }, query ? 180 : 0);
    };
    tagBtn.addEventListener("click", () => {
      const caret = ta.selectionStart ?? ta.value.length;
      const pre = ta.value.slice(0, caret);
      const insert = (pre && !/\s$/.test(pre) ? " " : "") + "#";
      ta.value = pre + insert + ta.value.slice(caret);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = caret + insert.length;
      sync();
      lookupTopics();
    });
    const submit = async () => {
      const content = ta.value.trim();
      const urls = images.filter((x) => x.url).map((x) => x.url);
      if (!content && !urls.length || busy || uploading()) return;
      busy = true;
      note.textContent = "发布中…";
      sync();
      try {
        const post2 = await kcRequest("POST", "/posts", { content, visibility, image_urls: urls });
        ta.value = "";
        images.forEach((x) => URL.revokeObjectURL(x.preview));
        images.length = 0;
        renderThumbs();
        note.textContent = post2 && post2.moderation_status === "pending" ? "已发布，审核后别人可见" : "已发布";
        window.setTimeout(() => {
          note.textContent = "";
        }, 3e3);
        if (post2 && post2.id) {
          addPost(stores.follow, post2, true);
          if (post2.visibility === "public") addPost(stores.square, post2, true);
        }
        onPosted();
      } catch (err) {
        note.textContent = err && err.message || "发布失败";
      } finally {
        busy = false;
        sync();
      }
    };
    ta.addEventListener("input", () => {
      sync();
      lookupTopics();
    });
    ta.addEventListener("click", lookupTopics);
    ta.addEventListener("focus", sync);
    ta.addEventListener("keydown", (e) => {
      if (suggest.classList.contains("is-open")) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          active = (active + (e.key === "ArrowDown" ? 1 : topics.length - 1)) % topics.length;
          renderSuggest();
          return;
        }
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey || e.key === "Tab") {
          e.preventDefault();
          pickTopic(topics[active].name);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeSuggest();
          return;
        }
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submit();
      }
      if (e.key === "Escape" && !ta.value.trim() && !images.length) ta.blur();
    });
    btn.addEventListener("click", submit);
    card2.addEventListener("focusout", () => window.setTimeout(() => {
      if (!card2.contains(document.activeElement)) {
        closeSuggest();
        sync();
      }
    }, 150));
    return card2;
  }
  function postText(content) {
    const el = h("div", { class: "ccwk-feed-text" });
    const re = /(^|[^\w#])#([\w\u4e00-\u9fff][\w\u4e00-\u9fff-]{0,39})/g;
    let last = 0;
    let m;
    while (m = re.exec(content)) {
      const start = m.index + m[1].length;
      if (start > last) el.appendChild(document.createTextNode(content.slice(last, start)));
      el.appendChild(h("span", { class: "ccwk-topic", text: "#" + m[2] }));
      last = start + 1 + m[2].length;
    }
    if (last < content.length) el.appendChild(document.createTextNode(content.slice(last)));
    return el;
  }
  async function renderPlayingFriends(card2) {
    if (!await kcFeedEnabled()) return null;
    const [acts, friends] = await Promise.all([
      kcRequest("GET", "/ccw/activity/friends").catch(() => []),
      kcRequest("GET", "/friends").catch(() => [])
    ]);
    const byId = new Map((Array.isArray(friends) ? friends : []).map((f) => [f.user.id, f.user]));
    const rows = (Array.isArray(acts) ? acts : []).filter((x) => x.activity && byId.has(x.user_id));
    if (!rows.length) return null;
    return card2("好友在玩", h("img", { class: "ccwk-side-icon", src: KC_ICON, alt: "", title: "来自 KukeChat" }), h(
      "div",
      { class: "ccwk-pf-list" },
      rows.slice(0, 8).map((x) => {
        const u = byId.get(x.user_id);
        const href = activityHref(x.activity);
        return h(
          href ? "a" : "div",
          { class: "ccwk-pf-row", href },
          h("span", { class: "ccwk-pf-av" }, h("img", { src: u.avatar_url || u.ccw_avatar_url || KC_ICON, alt: "" }), h("i", { class: "ccwk-cdot" })),
          h(
            "span",
            { class: "ccwk-pf-text" },
            h("b", { text: u.nickname || u.username }),
            h("span", { text: activityText(x.activity) })
          ),
          x.activity.cover_url ? h("img", { class: "ccwk-pf-cover", src: x.activity.cover_url, alt: "" }) : null
        );
      })
    ));
  }
  const FEED_FILTERS = [
    ["ALL", "全部动态", "ALL"],
    ["WORKS", "作品更新", "CONTENT_INTERACTION"],
    ["POSTS", "文章", "COMMUNITY"],
    ["LIKES", "赞与分享", "FRIEND_SHARE"],
    ["FOLLOWS", "关注", "SYSTEM"],
    ["KUKECHAT", "KukeChat", null]
  ];
  const feed = { filter: "ALL", groups: [], ids: /* @__PURE__ */ new Set(), cursor: null, hasMore: true, loading: false, error: null, loaded: false, me: null, rec: null, recPage: 0, expanded: /* @__PURE__ */ new Set(), gen: 0 };
  let feedRoot = null, feedNavEl = null, feedToolbarEl = null, feedListEl = null, feedFootEl = null, feedSideEl = null, feedMeEl = null, feedPlayEl = null, feedRecEl = null;
  let composerEl = null;
  let loginEl = null;
  let feedActive = false;
  const isFeedPath = () => /^\/feed\/?$/.test(location.pathname);
  function feedKind(t) {
    if (t === "CREATION_ITERATED" || t === "CREATION_PUBLISHED" || t === "CREATION_RATED_AS_EXCELLENT") return "WORKS";
    if (t === "POST_PUBLISHED") return "POSTS";
    if (t === "CREATION_LIKED" || t === "CREATION_SHARE" || t === "POST_LIKED" || t === "ASSET_MARKET_LIKED" || t === "ASSET_MARKET_SHARE") return "LIKES";
    if (t === "FOLLOWING" || t === "USER_RECOMMEND") return "FOLLOWS";
    if (t === "KC_POST") return "KUKECHAT";
    return "OTHER";
  }
  const msIso = (ms) => new Date(ms || Date.now()).toISOString();
  function feedSectionOf(ms) {
    const d = new Date(ms || Date.now());
    const days = Math.round((dayStart(/* @__PURE__ */ new Date()) - dayStart(d)) / 864e5);
    const key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    if (days <= 0) return { key, label: "今天" };
    if (days === 1) return { key, label: "昨天" };
    const label = (d.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear() ? "" : d.getFullYear() + "年") + (d.getMonth() + 1) + "月" + d.getDate() + "日 周" + "日一二三四五六"[d.getDay()];
    return { key, label };
  }
  const fmtNum = (n) => n == null ? "" : n >= 1e4 ? (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + "w" : String(n);
  async function loadFeedPage() {
    if (feed.loading || !feed.hasMore) return;
    feed.loading = true;
    feed.error = null;
    const gen = feed.gen;
    try {
      const p = await post("/spread_feed/aggregated/list", { cursor: feed.cursor });
      if (gen !== feed.gen) return;
      for (const g of p && p.items || []) {
        const old = feed.groups.find((x) => x.groupId === g.groupId);
        if (old) {
          const src = new Map(old.sources.map((s) => [s.feedId, s]));
          g.sources.forEach((s) => src.set(s.feedId, s));
          old.sources = Array.from(src.values());
          old.releaseIds = Array.from(/* @__PURE__ */ new Set([...old.releaseIds || [], ...g.releaseIds || []]));
        } else feed.groups.push(g);
      }
      if (p && p.hasMore && (!p.nextCursor || p.nextCursor === feed.cursor)) throw new ApiError("", "动态加载失败");
      feed.cursor = p ? p.nextCursor : null;
      feed.hasMore = Boolean(p && p.hasMore);
      feed.loaded = true;
    } catch (e) {
      if (gen === feed.gen) feed.error = e;
    } finally {
      if (gen === feed.gen) feed.loading = false;
    }
  }
  async function loadFeedSide() {
    try {
      const self = await post("/students/self/detail", {});
      const oid = self && (self.studentOid || self.oid);
      if (oid) feed.me = await post("/creation/student/detail", { studentOid: oid });
    } catch (_) {
    }
    renderFeedMe();
    try {
      feed.rec = await post("/recommend_creator/list", { excellentCount: 4, potentialCount: 8 });
    } catch (_) {
      feed.rec = [];
    }
    renderFeedSide();
    renderPlayingFriends(card).then((el) => feedPlayEl.replaceChildren(...el ? [el] : [])).catch(() => {
    });
  }
  function mountFeed() {
    if (feedRoot) return;
    feedRoot = h("div", { id: "ccwf-root", class: "ccwn-app" });
    feedNavEl = h("nav", { class: "ccwn-nav" });
    feedMeEl = h("div", { class: "ccwf-me" });
    const main = h("section", { class: "ccwf-main" });
    feedToolbarEl = h("header", { class: "ccwf-top" });
    feedListEl = h("div", { class: "ccwf-list" });
    feedFootEl = h("div", { class: "ccwf-foot" });
    main.append(feedToolbarEl, feedListEl, feedFootEl);
    feedPlayEl = h("div");
    feedRecEl = h("div");
    feedSideEl = h("aside", { class: "ccwn-side" }, feedPlayEl, feedRecEl);
    feedRoot.append(h("div", { class: "ccwf-layout" }, h("div", { class: "ccwn-left" }, feedMeEl, feedNavEl), main, feedSideEl));
    document.body.appendChild(feedRoot);
    new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) feedPump();
    }, { rootMargin: "900px 0px" }).observe(feedFootEl);
  }
  function feedCounts() {
    const c = { ALL: 0, WORKS: 0, POSTS: 0, LIKES: 0, FOLLOWS: 0, KUKECHAT: 0 };
    mergeWithCcw(feed.groups, feed.hasMore, false).groups.forEach((g) => {
      const k = feedKind(g.feed.type);
      c.ALL++;
      if (c[k] != null) c[k]++;
    });
    return c;
  }
  function renderFeedNav() {
    const c = feedCounts();
    feedNavEl.replaceChildren(h("div", { class: "ccwn-nav-card" }, FEED_FILTERS.map(([k, label, pix]) => h(
      "a",
      { class: "ccwn-nav-item" + (feed.filter === k ? " is-active" : ""), href: "/feed", onclick: (e) => {
        e.preventDefault();
        setFeedFilter(k);
      } },
      h("span", { class: "ccwn-tile" }, k === "KUKECHAT" ? h("img", { class: "ccwk-tile", src: KC_ICON, alt: "" }) : pixImg(k === "ALL" ? "FRIEND_SHARE" : pix, 30)),
      h(
        "span",
        { class: "ccwn-nav-text" },
        h("span", { class: "ccwn-nav-top" }, h("span", { class: "ccwn-nav-label", text: label }), c[k] && k !== "KUKECHAT" ? h("span", { class: "ccwn-nav-time", text: c[k] + (feed.hasMore ? "+" : "") + " 条" }) : null)
      )
    ))));
  }
  function renderFeedToolbar() {
    const label = FEED_FILTERS.find((f) => f[0] === feed.filter)[1];
    const kc2 = feed.filter === "KUKECHAT";
    const all = feed.filter === "ALL";
    const scope = getKcScope();
    const title = kc2 ? "KukeChat 动态" : all ? "好友动态" : label;
    const sub = kc2 ? scope === "square" ? "所有人的公开动态" : "好友和你关注的人" : all ? scope === "square" ? "你关注的创作者 · KukeChat 所有人" : "你关注的创作者 · KukeChat 关注的人" : "你关注的创作者";
    const seg = kc2 || all ? h(
      "div",
      { class: "ccwk-cp-seg", role: "radiogroup", "aria-label": "KukeChat 动态看谁的", title: "KukeChat 动态的范围" },
      [["square", "所有人"], ["follow", "关注的人"]].map(([value, text]) => h("button", {
        type: "button",
        role: "radio",
        class: "ccwk-cp-opt" + (scope === value ? " is-on" : ""),
        "aria-checked": String(scope === value),
        onclick: () => {
          if (getKcScope() === value) return;
          setKcScope(value);
          renderFeedToolbar();
          renderFeedList();
          window.scrollTo(0, 0);
        }
      }, text))
    ) : null;
    feedToolbarEl.replaceChildren(
      h("div", { class: "ccwn-title" }, h("h1", { text: title }), h("span", { class: "ccwn-sub", text: sub })),
      h(
        "div",
        { class: "ccwn-tools" },
        seg,
        h("button", { type: "button", class: "ccwn-icon", title: "刷新", onclick: () => resetFeed() }, icon("refresh", 16))
      )
    );
    syncStickyTop();
  }
  function renderFeedMe() {
    const m = feed.me;
    if (!m) {
      feedMeEl.replaceChildren();
      return;
    }
    feedMeEl.replaceChildren(h(
      "section",
      { class: "ccwn-card ccwf-mecard" },
      h(
        "a",
        { class: "ccwf-me-head", href: "/student/" + m.oid, target: "_blank", rel: "noreferrer" },
        avatarEl(m.avatar, "", 44),
        h("span", null, h("b", { text: m.name || "" }), h("span", { text: (m.bio || "").trim() || "这个人很懒，什么都没写" }))
      ),
      h(
        "div",
        { class: "ccwf-me-stats" },
        [["作品", m.creationCount], ["粉丝", m.followerCount], ["关注", m.followingCount], ["获赞", m.likeCount]].map(([l, n]) => h("div", null, h("b", { text: fmtNum(n || 0) }), h("span", { text: l })))
      )
    ));
  }
  function renderFeedSide() {
    const list = feed.rec || [];
    if (!list.length) {
      feedRecEl.replaceChildren();
      return;
    }
    const per = 6;
    const pages = Math.max(1, Math.ceil(list.length / per));
    const page = list.slice(feed.recPage % pages * per, feed.recPage % pages * per + per);
    const more = pages > 1 ? h("button", { type: "button", class: "ccwn-link", onclick: () => {
      feed.recPage++;
      renderFeedSide();
    } }, "换一批") : null;
    feedRecEl.replaceChildren(card("为你推荐", more, h("ul", { class: "ccwf-recs" }, page.map((u) => {
      const st = state.following[u.studentOid];
      const followed = st && st !== "UNFOLLOWED";
      const btn = followed ? h("span", { class: "ccwn-muted-tag", text: "已关注" }) : h("button", { type: "button", class: "ccwn-btn is-primary is-tiny", onclick: async (e) => {
        const b = e.currentTarget;
        b.disabled = true;
        try {
          state.following[u.studentOid] = await api.follow(u.studentOid) || "FOLLOWED";
          renderFeedSide();
        } catch (err) {
          b.disabled = false;
          toast(err.message || "关注失败");
        }
      } }, "关注");
      return h(
        "li",
        null,
        avatarEl(u.avatar, u.studentOid, 36),
        h(
          "a",
          { class: "ccwf-rec-text", href: "/student/" + u.studentOid, target: "_blank", rel: "noreferrer" },
          h("b", { text: u.name || "" }),
          h("span", { text: (u.creatorType === "EXCELLENT" ? "优秀创作者" : "潜力创作者") + " · " + fmtNum(u.followerCount || 0) + " 粉丝" })
        ),
        btn
      );
    }))));
  }
  function workHref(c, releaseOid) {
    return "/detail/" + c.creationOid + "?from=feed" + (releaseOid ? "&feedReleaseOid=" + encodeURIComponent(releaseOid) : "");
  }
  function postHref(p) {
    return "/post/" + (p.slug || p.postOid || p.oid);
  }
  const ownerOf = (g) => g.feed.ownerInfo || {};
  const userA = (u, cls) => u && u.oid ? h("a", { class: "ccwf-name", href: "/student/" + u.oid, target: "_blank", rel: "noreferrer", text: u.name || "创作者" }) : h("span", { class: "ccwf-name", text: u && u.name || "创作者" });
  const coverOf = (c) => c.coverLink || c.coverGifLink || "";
  const FEED_CHIP = {
    CREATION_ITERATED: ["作品更新", "green"],
    CREATION_PUBLISHED: ["新作品", "blue"],
    CREATION_RATED_AS_EXCELLENT: ["精选", "amber"],
    POST_PUBLISHED: ["文章", "violet"],
    CREATION_LIKED: ["点赞", "pink"],
    POST_LIKED: ["点赞", "pink"],
    CREATION_SHARE: ["分享", "teal"],
    FOLLOWING: ["关注", "teal"]
  };
  function cardHead(users, action, ms, type) {
    const list = users.filter(Boolean);
    const first = list[0] || {};
    const avatars = list.length > 1 ? h("div", { class: "ccwf-avs" }, list.slice(0, 3).map((u) => avatarEl(u.avatar, u.oid, 40))) : avatarEl(first.avatar, first.oid, 40);
    const names = [];
    list.slice(0, 2).forEach((u, i) => {
      if (i) names.push(h("span", { class: "ccwf-sep", text: "、" }));
      names.push(userA(u));
    });
    if (list.length > 2) names.push(h("span", { class: "ccwf-sep", text: " 等 " + list.length + " 人" }));
    const chip = FEED_CHIP[type];
    return h(
      "header",
      { class: "ccwf-head" },
      avatars,
      h(
        "div",
        { class: "ccwf-who" },
        h("div", { class: "ccwf-names" }, names),
        h("div", { class: "ccwf-sub" }, h("span", { text: action }), h("span", { class: "ccwf-dot", text: "·" }), h("time", { datetime: msIso(ms), title: fullTime(msIso(ms)), text: relTime(msIso(ms)) }))
      ),
      chip ? h("span", { class: "ccwf-chip tone-" + chip[1], text: chip[0] }) : null
    );
  }
  function statsRow(views, likes, comments) {
    return h(
      "div",
      { class: "ccwf-stats" },
      [["eye", views, "浏览"], ["heart", likes, "点赞"], ["reply", comments, "评论"]].map(([ic, n, title]) => n == null ? null : h("span", { title }, icon(ic, 14), fmtNum(n)))
    );
  }
  function reHead(u, action, ms, ic, tone) {
    return h(
      "header",
      { class: "ccwf-rehead tone-" + tone },
      h("span", { class: "ccwf-re-icon" }, icon(ic, 14)),
      avatarEl(u.avatar, u.oid, 22),
      userA(u),
      h("span", { class: "ccwf-re-act", text: action }),
      h("span", { class: "ccwf-dot", text: "·" }),
      h("time", { datetime: msIso(ms), title: fullTime(msIso(ms)), text: relTime(msIso(ms)) })
    );
  }
  function workBody(c, opts) {
    const o = opts || {};
    const desc = (c.description || "").trim();
    return h(
      "a",
      { class: "ccwf-media", href: workHref(c, c.creationReleaseOid), target: "_blank", rel: "noreferrer" },
      h(
        "div",
        { class: "ccwf-cover" },
        h("img", { src: coverOf(c), alt: "", loading: "lazy" }),
        o.version ? h("span", { class: "ccwf-badge", text: o.version }) : null,
        c.isTeamwork ? h("span", { class: "ccwf-badge is-left", text: "协作" }) : null
      ),
      h(
        "div",
        { class: "ccwf-text" },
        h("h3", { text: c.creationTitle || "未命名作品" }),
        o.label && (desc || o.update) ? h("div", { class: "ccwf-label" }, o.label, o.multi ? h("span", { text: "同日多次更新" }) : null) : null,
        desc ? h("p", { text: desc }) : o.update ? h("p", { class: "is-muted", text: "作者没有填写更新说明" }) : null,
        statsRow(c.viewCount, c.likeCount, c.commentCount)
      )
    );
  }
  function articleBody(p) {
    const img = p.featureImage && p.featureImage.url;
    return h(
      "a",
      { class: "ccwf-media is-article", href: postHref(p), target: "_blank", rel: "noreferrer" },
      img ? h("div", { class: "ccwf-cover is-wide" }, h("img", { src: img, alt: "", loading: "lazy" }), p.rank === "EXCELLENT" ? h("span", { class: "ccwf-badge is-gold", text: "精选" }) : null) : null,
      h(
        "div",
        { class: "ccwf-text" },
        h("h3", { text: p.title || "" }),
        p.tags && p.tags.length ? h("div", { class: "ccwf-tags" }, p.tags.slice(0, 4).map((t) => h("span", { text: "#" + t }))) : null,
        statsRow(p.viewCount, p.likeCount, p.commentCount)
      )
    );
  }
  function tileWall(items, isPost) {
    return h("div", { class: "ccwf-wall" + (isPost ? " is-wide" : "") }, items.map((x) => {
      const href = isPost ? postHref(x) : workHref(x);
      const img = isPost ? x.featureImage && x.featureImage.url : coverOf(x);
      const by = isPost ? x.author && x.author.name : x.studentBaseInfo && x.studentBaseInfo.name;
      return h(
        "a",
        { class: "ccwf-tile", href, target: "_blank", rel: "noreferrer", title: (isPost ? x.title : x.creationTitle) || "" },
        img ? h("img", { src: img, alt: "", loading: "lazy" }) : null,
        h("span", { class: "ccwf-tile-cap" }, h("b", { text: (isPost ? x.title : x.creationTitle) || "" }), by ? h("span", { text: by }) : null)
      );
    }));
  }
  function personWall(people) {
    return h("div", { class: "ccwf-people" }, people.map(({ u, status }) => {
      const st = state.following[u.oid] || status;
      const followed = st === "FOLLOWED" || st === "BOTH_FOLLOWED";
      const btn = followed ? h("span", { class: "ccwf-followed", text: st === "BOTH_FOLLOWED" ? "已互关" : "已关注" }) : h("button", { type: "button", class: "ccwn-btn is-primary is-tiny", onclick: async (e) => {
        e.preventDefault();
        const b = e.currentTarget;
        b.disabled = true;
        try {
          state.following[u.oid] = await api.follow(u.oid) || "FOLLOWED";
          b.replaceWith(h("span", { class: "ccwf-followed", text: "已关注" }));
        } catch (err) {
          b.disabled = false;
          toast(err.message || "关注失败");
        }
      } }, "关注");
      return h(
        "div",
        { class: "ccwf-person" },
        h(
          "a",
          { href: "/student/" + u.oid, target: "_blank", rel: "noreferrer", class: "ccwf-person-link" },
          avatarEl(u.avatar, "", 56),
          h("b", { text: u.name || "" }),
          h("span", { text: (u.creationCount != null ? u.creationCount + " 作品 · " : "") + fmtNum(u.followerCount || 0) + " 粉丝" })
        ),
        btn
      );
    }));
  }
  function renderFeedCard(groups, key) {
    const g = groups[0];
    if (g.kc) return renderKcCard(g, { avatarEl });
    const f = g.feed;
    const t = f.type;
    const o = ownerOf(g);
    const c = f.creationContent;
    const LIMIT = 8;
    const open = feed.expanded.has(key);
    const toggle = (n) => n > LIMIT ? h("button", { type: "button", class: "ccwf-more", onclick: () => {
      if (open) feed.expanded.delete(key);
      else feed.expanded.add(key);
      renderFeedList();
    } }, open ? "收起" : "还有 " + (n - LIMIT) + " 个") : null;
    const card2 = (...kids) => h("article", { class: "ccwf-card" }, ...kids);
    if (t === "CREATION_ITERATED" || t === "CREATION_PUBLISHED") {
      const owners = [];
      const seen = /* @__PURE__ */ new Set();
      (g.sources && g.sources.length ? g.sources.map((s) => s.ownerInfo) : [o]).forEach((u) => {
        if (u && !seen.has(u.oid)) {
          seen.add(u.oid);
          owners.push(u);
        }
      });
      const mine = owners.length === 1 && c && c.studentOid === owners[0].oid;
      const version = c && (c.customVersion ? "V" + c.customVersion : c.version ? "V" + c.version : "");
      const action = t === "CREATION_PUBLISHED" ? mine ? "发布了新作品" : "参与的作品发布了" : mine ? "更新了作品" : "参与的作品更新了";
      return card2(
        cardHead(owners, action, f.feedTime, t),
        c ? workBody(c, { version, label: t === "CREATION_ITERATED" ? "更新内容" : "作品简介", multi: (g.releaseIds || []).length > 1, update: t === "CREATION_ITERATED" }) : null
      );
    }
    if (t === "CREATION_RATED_AS_EXCELLENT") {
      return card2(cardHead([o], "参与的作品被评为精选", f.feedTime, t), c ? workBody(c, { label: "作品简介" }) : null);
    }
    if (t === "POST_PUBLISHED" && f.postContent) {
      return card2(cardHead([o], "发布了文章", f.feedTime, t), articleBody(f.postContent));
    }
    if (t === "FOLLOWING") {
      const people = groups.map((x) => x.feed.socialActionContent).filter((s) => s && s.studentBaseInfo).map((s) => ({ u: s.studentBaseInfo, status: s.followStatusWithCurrent }));
      const shown = open ? people : people.slice(0, LIMIT);
      return card2(reHead(o, people.length > 1 ? "关注了 " + people.length + " 位创作者" : "关注了创作者", f.feedTime, "follow", "teal"), personWall(shown), toggle(people.length));
    }
    if (t === "CREATION_LIKED" || t === "POST_LIKED" || t === "CREATION_SHARE") {
      const isPost = t === "POST_LIKED";
      const share = t === "CREATION_SHARE";
      const [ic, tone] = share ? ["share", "teal"] : ["heart", "pink"];
      const items = groups.map((x) => isPost ? x.feed.postContent : x.feed.creationContent).filter(Boolean);
      if (items.length === 1) {
        const one = items[0];
        const author2 = isPost ? one.author : one.studentBaseInfo;
        const img = isPost ? one.featureImage && one.featureImage.url : coverOf(one);
        return h(
          "article",
          { class: "ccwf-card is-compact" },
          reHead(o, share ? "分享了" : "赞了", f.feedTime, ic, tone),
          h(
            "a",
            { class: "ccwf-mini-quote", href: isPost ? postHref(one) : workHref(one), target: "_blank", rel: "noreferrer" },
            h("span", { class: "ccwf-mq-cover" + (isPost ? " is-wide" : "") }, img ? h("img", { src: img, alt: "", loading: "lazy" }) : null),
            h(
              "span",
              { class: "ccwf-mq-text" },
              h("b", { text: (isPost ? one.title : one.creationTitle) || "" }),
              author2 ? h("span", { class: "ccwf-mq-by" }, avatarEl(author2.avatar, "", 18), h("span", { text: author2.name + (isPost ? " 的文章" : " 的作品") })) : null,
              statsRow(one.viewCount, one.likeCount, one.commentCount)
            )
          )
        );
      }
      const shown = open ? items : items.slice(0, LIMIT);
      const what = isPost ? " 篇文章" : " 个作品";
      return card2(reHead(o, (share ? "分享了 " : "赞了 ") + items.length + what, f.feedTime, ic, tone), tileWall(shown, isPost), toggle(items.length));
    }
    return card2(cardHead([o], f.title || "有新动态", f.feedTime, t), c ? workBody(c, {}) : null);
  }
  function renderFeedList() {
    const onlyKc = feed.filter === "KUKECHAT";
    const merged = mergeWithCcw(feed.groups, feed.hasMore, onlyKc);
    const groups = merged.groups.filter((g) => feed.filter === "ALL" || feedKind(g.feed.type) === feed.filter);
    const nearBottom = !onlyKc || feedFootEl && feedFootEl.getBoundingClientRect().top < window.innerHeight + 1200;
    if (merged.needMore && nearBottom && !kcStore().loading) loadKcPage().then((changed) => {
      if (changed && feedActive) renderFeedList();
    });
    const rows = [];
    let curKey = null;
    let aggMap = null;
    for (const g of groups) {
      const sec = feedSectionOf(g.feed.feedTime);
      if (sec.key !== curKey) {
        curKey = sec.key;
        aggMap = /* @__PURE__ */ new Map();
        rows.push({ section: sec });
      }
      const t = g.feed.type;
      if (t === "CREATION_LIKED" || t === "POST_LIKED" || t === "FOLLOWING" || t === "CREATION_SHARE") {
        const k = sec.key + "|" + t + "|" + (g.feed.ownerId || "");
        const r = aggMap.get(k);
        if (r) {
          r.groups.push(g);
          continue;
        }
        const nr = { key: k, groups: [g] };
        aggMap.set(k, nr);
        rows.push(nr);
      } else rows.push({ key: g.groupId, groups: [g] });
    }
    const nodes = rows.map((r, i) => r.section ? h("div", { class: "ccwf-day" + (i === 0 ? " is-first" : "") }, h("span", { text: r.section.label })) : renderFeedCard(r.groups, r.key));
    if (feed.filter === "ALL" || onlyKc) {
      if (!composerEl) composerEl = renderComposer(() => renderFeedList());
      if (composerEl) nodes.unshift(composerEl);
      else if (kcSignedOut()) {
        if (!loginEl) loginEl = renderLoginPrompt();
        nodes.unshift(loginEl);
      } else kcFeedEnabled().then((ok) => {
        if (!ok && feedActive) renderFeedList();
      });
    }
    feedListEl.replaceChildren(...nodes);
    renderFeedFoot(groups.length);
    renderFeedNav();
  }
  function renderFeedFoot(count) {
    let content;
    if (feed.error) content = h("div", { class: "ccwf-state" }, h("span", { text: feed.error.message || "动态加载失败" }), h("button", { type: "button", class: "ccwn-btn", onclick: () => {
      feed.error = null;
      feedPump();
    } }, "重试"));
    else if (feed.filter === "KUKECHAT" && kcSignedOut()) content = null;
    else if (feed.filter === "KUKECHAT" ? kcStore().loading || kcStore().hasMore : feed.loading || feed.hasMore) content = count ? h("div", { class: "ccwf-state", text: "加载中…" }) : h("div", null, [0, 1, 2].map(() => h("div", { class: "ccwf-card ccwf-sk" }, h("div", { class: "ccwf-sk-head" }, h("i"), h("b")), h("div", { class: "ccwf-sk-body" }, h("i"), h("div", null, h("b"), h("s"), h("s"))))));
    else if (!count) content = h("div", { class: "ccwf-state is-empty", text: feed.filter === "ALL" ? "还没有动态，去关注一些创作者吧" : feed.filter === "KUKECHAT" ? getKcScope() === "square" ? "KukeChat 上还没有公开动态" : "好友和你关注的人还没在 KukeChat 发过动态" : "这一类还没有动态" });
    else content = h("div", { class: "ccwf-state", text: "已经看完了" });
    feedFootEl.replaceChildren(...content ? [content] : []);
  }
  let feedPumping = false;
  async function feedPump() {
    if (feedPumping || !feedActive) return;
    feedPumping = true;
    const gen = feed.gen;
    try {
      for (let i = 0; i < 20 && gen === feed.gen && feed.hasMore && !feed.error; i++) {
        if (feedFootEl.getBoundingClientRect().top > window.innerHeight + 1e3) break;
        renderFeedFoot(feed.groups.length);
        await loadFeedPage();
        if (gen !== feed.gen) break;
        renderFeedList();
      }
    } finally {
      feedPumping = false;
      if (gen === feed.gen) renderFeedList();
    }
  }
  function setFeedFilter(k) {
    feed.filter = k;
    renderFeedToolbar();
    renderFeedList();
    window.scrollTo(0, 0);
    feedPump();
  }
  function resetFeed() {
    feed.gen++;
    Object.assign(feed, { groups: [], cursor: null, hasMore: true, loading: false, error: null, loaded: false });
    resetKcFeed();
    feed.expanded.clear();
    renderFeedList();
    feedPump();
    loadFeedSide();
  }
  let loginHooked = false;
  function activateFeed() {
    setFeedRerender(() => {
      if (feedActive) renderFeedList();
    });
    if (!loginHooked) {
      loginHooked = true;
      onKcLogin(() => {
        loginEl = null;
        composerEl = null;
        if (feedActive) {
          renderFeedList();
          loadFeedSide();
        }
      });
    }
    if (feedActive) return;
    feedActive = true;
    document.documentElement.classList.add("ccwf-on");
    injectStyle();
    mountFeed();
    feedRoot.style.display = "";
    watchHeader();
    document.title = "好友动态 - 共创世界";
    renderFeedToolbar();
    renderFeedList();
    if (!feed.loaded) {
      feedPump();
      loadFeedSide();
    } else feedPump();
  }
  function deactivateFeed() {
    if (!feedActive) return;
    feedActive = false;
    document.documentElement.classList.remove("ccwf-on");
    if (feedRoot) feedRoot.style.display = "none";
  }
  function syncStickyTop() {
    const header = document.querySelector("#root header");
    if (!header) return;
    let hh = 0;
    const nodes = [header].concat(Array.from(header.querySelectorAll("*")).slice(0, 80));
    for (let n = header.parentElement; n && n.id !== "root"; n = n.parentElement) nodes.push(n);
    for (const n of nodes) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") {
        const r = n.getBoundingClientRect();
        if (r.top <= 1 && r.height < 200) hh = Math.max(hh, Math.round(r.bottom));
      }
    }
    [[root, toolbarEl], [feedRoot, feedToolbarEl]].forEach(([r, tb]) => {
      if (!r) return;
      r.style.setProperty("--top", hh + "px");
      r.style.setProperty("--sec-top", hh + (tb ? tb.offsetHeight : 0) + "px");
    });
  }
  let watching = false;
  function watchHeader() {
    if (watching) return;
    watching = true;
    const t = setInterval(() => {
      const header = document.querySelector("#root header");
      if (!header) return;
      clearInterval(t);
      syncStickyTop();
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => syncStickyTop());
        ro.observe(header);
        if (toolbarEl) ro.observe(toolbarEl);
        if (feedToolbarEl) ro.observe(feedToolbarEl);
      }
    }, 300);
  }
  const HEARTBEAT_MS = 60 * 1e3;
  const OID$1 = /([0-9a-f]{24})/;
  let current = null;
  let timer = 0;
  let reported = false;
  const infoCache = /* @__PURE__ */ new Map();
  function detect() {
    const path = location.pathname;
    const detail = path.match(/^\/detail\/([0-9a-f]{24})/);
    if (detail) return { kind: "play", oid: detail[1] };
    if (/^\/(gandi|creator|editor)/.test(path)) {
      const m = (location.pathname + location.search).match(OID$1);
      return { kind: "create", oid: m ? m[1] : null };
    }
    return null;
  }
  async function workInfo(oid) {
    if (!oid) return null;
    if (infoCache.has(oid)) return infoCache.get(oid);
    try {
      const d = await post("/creation/detail", { oid });
      const info = d && { title: d.title || "", cover: d.latestCoverLink || d.creationRelease && d.creationRelease.coverLink || null };
      infoCache.set(oid, info);
      return info;
    } catch (_) {
      return null;
    }
  }
  function titleFromDocument() {
    return (document.title || "").split(/ [-–|] /)[0].trim();
  }
  async function beat() {
    if (!current || document.visibilityState !== "visible") return;
    const c = current;
    if (!c.title) {
      const info = await workInfo(c.oid);
      if (c !== current) return;
      c.title = info && info.title || titleFromDocument() || (c.kind === "create" ? "新作品" : "一个作品");
      c.cover = info && info.cover;
    }
    try {
      await kcRequest("PUT", "/ccw/activity", { kind: c.kind, ccw_oid: c.oid, title: c.title.slice(0, 80), cover_url: c.cover || null });
      reported = true;
    } catch (_) {
    }
  }
  function stop(onUnload) {
    window.clearInterval(timer);
    timer = 0;
    if (!reported) return;
    reported = false;
    if (onUnload) kcRequestOnUnload("DELETE", "/ccw/activity");
    else kcRequest("DELETE", "/ccw/activity").catch(() => {
    });
  }
  function syncPresence() {
    const next = detect();
    const key = next ? next.kind + ":" + (next.oid || "") : null;
    if (current && current.key === key) return;
    if (current) stop(false);
    current = next ? { key, ...next, title: "", cover: null } : null;
    if (!current) return;
    beat();
    timer = window.setInterval(beat, HEARTBEAT_MS);
  }
  function installPresence() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") beat();
    });
    window.addEventListener("pagehide", () => stop(true));
    syncPresence();
  }
  let loading = null;
  function loadKukeChat() {
    const existing = window.__KukeChatExtensionBridge;
    if (existing && existing.embed) return Promise.resolve(existing);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = KUKECHAT_BASE + "/embed/kukechat.js";
      s.async = true;
      s.onload = () => {
        const bridge = window.__KukeChatExtensionBridge;
        if (bridge && bridge.embed) resolve(bridge);
        else reject(new Error("KukeChat 界面包版本太旧，没有嵌入接口"));
      };
      s.onerror = () => reject(new Error("KukeChat 加载失败"));
      document.head.appendChild(s);
    }).catch((err) => {
      loading = null;
      throw err;
    });
    return loading;
  }
  const DOCK_CSS = `
/* 只去掉标题栏和缩放角。左侧图标栏要留着：动态、联系人、设置、商城等都从那里进；
   而且桌面布局是 grid（图标栏 56px + 列表 + 主区），藏掉图标栏会让后面的列整体错位 */
:host([data-kc-docked]) .kwf-titlebar,
:host([data-kc-docked]) .kwf-resize { display: none !important; }
:host([data-kc-docked]) .kc-window-frame {
  border-radius: 14px !important;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.065) !important;
  box-shadow: 0 24px 60px -24px rgba(0,0,0,.55) !important;
}
:host([data-kc-docked]) .kc-window-frame > div.relative { height: 100% !important; }
/* 共创世界的配色：深底偏蓝紫、绿色强调（和消息中心、动态页一致） */
:host([data-kc-docked]) #kukechat-root#kukechat-root [data-theme='dark'] {
  --kc-accent: #3ddc84;
  --kc-accent-fill: #23a35e;
  --kc-window: #1b1b28;
  --kc-list: #1e1e2c;
  --kc-chat: #17171f;
  --kc-panel: #23232f;
  --kc-panel-muted: #272736;
  --kc-border: rgba(255,255,255,.065);
  --kc-text: #ececf2;
  --kc-muted: #8a8a9a;
}
`;
  function shadowRoot() {
    const host = document.getElementById("kukechat-shadow-host");
    return host && host.shadowRoot;
  }
  function injectDockStyle() {
    const root2 = shadowRoot();
    if (!root2 || root2.getElementById("kc-ccw-dock-style")) return;
    const st = document.createElement("style");
    st.id = "kc-ccw-dock-style";
    st.textContent = DOCK_CSS;
    root2.appendChild(st);
  }
  async function dockInto(el) {
    const bridge = await loadKukeChat();
    let frame2 = 0;
    const place = () => {
      frame2 = 0;
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.height < 200) return;
      bridge.embed.dock({ x: r.left, y: r.top, width: r.width, height: r.height });
      injectDockStyle();
    };
    const schedule = () => {
      if (!frame2) frame2 = requestAnimationFrame(place);
    };
    place();
    window.setTimeout(injectDockStyle, 300);
    window.setTimeout(injectDockStyle, 1500);
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    let last = "";
    const poll2 = window.setInterval(() => {
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      const key = [r.left, r.top, r.width, r.height].map(Math.round).join(",");
      if (key !== last) {
        last = key;
        schedule();
      }
    }, 500);
    return () => {
      window.clearInterval(poll2);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      cancelAnimationFrame(frame2);
      bridge.embed.undock();
    };
  }
  async function withEmbed(fn) {
    const bridge = await loadKukeChat();
    return fn(bridge.embed);
  }
  let slot = null;
  let undock = null;
  let currentView = null;
  function ensureSlot() {
    const layout = document.querySelector("#ccwn-root .ccwn-layout");
    if (!layout) return null;
    if (!slot || !slot.isConnected) {
      slot = h(
        "section",
        { class: "ccwk-slot" },
        h("div", { class: "ccwk-loading", text: "正在打开 KukeChat…" })
      );
      layout.appendChild(slot);
    }
    return slot;
  }
  async function enterChat(view) {
    window.scrollTo(0, 0);
    document.documentElement.classList.add("ccwk-chat");
    setViewingConversation("*");
    const el = ensureSlot();
    if (!el) return;
    const q = new URLSearchParams(location.search);
    const conversationId = Number(q.get("c")) || null;
    const userId = Number(q.get("u")) || null;
    try {
      if (!undock) undock = await dockInto(el);
      el.classList.add("is-ready");
      await withEmbed((embed) => {
        embed.setView(view === "FRIENDS" ? "contacts" : "chat");
        if (conversationId) {
          embed.openConversation(conversationId);
          setActiveConversation(conversationId);
        } else if (userId) {
          return embed.openDirect(userId);
        }
        return null;
      });
      currentView = view;
    } catch (err) {
      el.replaceChildren(h("div", { class: "ccwk-loading is-error", text: err && err.message || "KukeChat 加载失败，请刷新重试" }));
    }
  }
  function exitChat() {
    if (!currentView && !undock) return;
    document.documentElement.classList.remove("ccwk-chat");
    setViewingConversation(null);
    currentView = null;
    setActiveConversation(null);
    if (undock) {
      undock();
      undock = null;
    }
    if (slot) {
      slot.remove();
      slot = null;
    }
  }
  const CHAT_VIEWS = ["CHAT", "FRIENDS"];
  const DISMISS_KEY = "kukechat-ccw:mutuals-dismissed";
  let result = null;
  function dismissed() {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - t < 7 * 864e5;
  }
  async function load() {
    if (!result) {
      result = (async () => {
        if (!await ensureSession()) return null;
        const oids = (await myFollowings()).filter((f) => f.mutual).map((f) => f.oid);
        if (!oids.length) return null;
        return { oids, read: await kcRequest("POST", "/ccw/mutuals", { ccw_oids: oids, send: false }) };
      })().catch(() => {
        result = null;
        return null;
      });
    }
    return result;
  }
  function banner(data) {
    const users = data.read.users;
    const names = users.slice(0, 3).map((u) => u.nickname || "").filter(Boolean).join("、");
    const btn = h("button", { type: "button", class: "ccwk-btn is-primary is-sm" }, "全部加好友");
    const close = h("button", { type: "button", class: "ccwk-banner-x", title: "7 天内不再提示" }, "×");
    const el = h(
      "div",
      { class: "ccwk-banner" },
      h("span", { class: "ccwk-faces" }, users.slice(0, 4).map((u) => h("img", { src: u.avatar_url || KC_ICON, alt: "" }))),
      h(
        "div",
        { class: "ccwk-banner-text" },
        h("b", { text: users.length + " 位互关好友也在用 KukeChat" }),
        h("span", { text: names + (users.length > 3 ? " 等" : "") + " · 加为好友后可以私信、看到 TA 在玩什么" })
      ),
      btn,
      close
    );
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "发送中…";
      try {
        const r = await kcRequest("POST", "/ccw/mutuals", { ccw_oids: data.oids, send: true });
        btn.textContent = r.sent ? `已向 ${r.sent} 人发送申请` : "申请都已发过";
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        result = null;
        window.setTimeout(() => el.remove(), 2400);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = err && err.message || "发送失败";
      }
    });
    close.addEventListener("click", () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      el.remove();
    });
    return el;
  }
  function renderMutualsBanner(anchor, view) {
    const old = document.querySelector(".ccwk-banner");
    if (view !== "ALL" && view !== "SYSTEM") {
      if (old) old.remove();
      return;
    }
    if (old || dismissed() || !anchor) return;
    load().then((data) => {
      if (!data || !data.read.users.length || document.querySelector(".ccwk-banner") || !anchor.isConnected) return;
      anchor.after(banner(data));
    });
  }
  function parseRoute() {
    if (/^\/notice\/chat\/?$/.test(location.pathname)) return { view: "CHAT", filter: "ALL" };
    if (/^\/notice\/friends\/?$/.test(location.pathname)) return { view: "FRIENDS", filter: "ALL" };
    const m = location.pathname.match(/^\/notice(?:\/category\/([A-Z_]+))?\/?$/);
    if (!m) {
      const old = location.pathname.match(/^\/notice\/(like|reply|friendShare|activity|judgement|follower|system)\/?$/);
      if (!old) return null;
      const map = { like: "CONTENT_INTERACTION", reply: "REPLY", friendShare: "FRIEND_SHARE", activity: "COMMUNITY", judgement: "SYSTEM", follower: "SYSTEM", system: "ALL" };
      return { view: map[old[1]], filter: "ALL" };
    }
    const view = m[1] && GROUPS.includes(m[1]) ? m[1] : "ALL";
    const f = new URLSearchParams(location.search).get("filter");
    return { view, filter: view === "CONTENT_INTERACTION" && ["LIKE", "FAVORITE"].includes(f) ? f : "ALL" };
  }
  function go(view, filter, force) {
    const base = view === "ALL" ? "/notice" : view === "CHAT" ? "/notice/chat" : view === "FRIENDS" ? "/notice/friends" : "/notice/category/" + view;
    const url = base + (filter && filter !== "ALL" ? "?filter=" + filter : "");
    if (location.pathname + location.search !== url) origPush.call(history, history.state, "", url);
    applyRoute(force);
  }
  let isActive = false;
  let disabledForAccount = false;
  function applyRoute(force) {
    syncPresence();
    if (isFeedPath()) activateFeed();
    else deactivateFeed();
    const r = disabledForAccount ? null : parseRoute();
    if (!r) {
      exitChat();
      if (isActive) deactivate(false);
      return;
    }
    if (CHAT_VIEWS.includes(r.view)) {
      if (!isActive) activate();
      state.view = r.view;
      renderNav();
      enterChat(r.view);
      return;
    }
    exitChat();
    const changed = !isActive || r.view !== state.view || r.filter !== state.filter;
    if (!isActive) activate();
    if (!changed && !force) return;
    state.view = r.view;
    state.filter = r.filter;
    state.gen++;
    if (force) {
      state.streams = {};
      state.readLocal.clear();
      state.seen.clear();
      refreshSummary(0);
      loadStats();
    }
    rowCache.clear();
    rowByItem.clear();
    sectionCache.clear();
    state.expanded.clear();
    state.composer = null;
    resetRowObserver();
    listEl.replaceChildren();
    renderNav();
    renderToolbar();
    renderList$1();
    renderMutualsBanner(toolbarEl, state.view);
    window.scrollTo(0, 0);
    pump();
  }
  let unreadHooked = false;
  function activate() {
    isActive = true;
    if (!unreadHooked) {
      unreadHooked = true;
      onUnread(() => {
        if (isActive) renderNav();
      });
    }
    document.documentElement.classList.add("ccwn-on");
    injectStyle();
    mount();
    root.style.display = "";
    watchHeader();
    document.title = "消息中心 - 共创世界";
    loadEmojis().then(() => {
      rowCache.clear();
      renderList$1();
    });
    refreshSummary(0);
    loadStats();
  }
  function deactivate(forAccount) {
    isActive = false;
    if (forAccount) disabledForAccount = true;
    document.documentElement.classList.remove("ccwn-on");
    if (root) root.style.display = "none";
  }
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function() {
    const r = origPush.apply(this, arguments);
    queueMicrotask(() => applyRoute(false));
    return r;
  };
  history.replaceState = function() {
    const r = origReplace.apply(this, arguments);
    queueMicrotask(() => applyRoute(false));
    return r;
  };
  window.addEventListener("popstate", () => applyRoute(false));
  document.addEventListener("visibilitychange", () => {
    if (isActive && document.visibilityState === "visible") refreshSummary(0);
  });
  let kc = 0;
  let ours = null;
  function envelope() {
    return document.querySelector('#root header [class*="notice-"]');
  }
  function nativeCount(env) {
    const badge = env.querySelector('[class*="totalNotice-"]');
    if (!badge || badge.style.display === "none") return 0;
    const t = (badge.textContent || "").trim();
    return parseInt(t, 10) || 0;
  }
  function render() {
    const env = envelope();
    if (!env) return;
    const total2 = nativeCount(env) + kc;
    if (!ours || !env.contains(ours)) {
      ours = h("span", { class: "ccwk-env-badge" });
      if (getComputedStyle(env).position === "static") env.style.position = "relative";
      env.appendChild(ours);
    }
    document.documentElement.classList.toggle("ccwk-badge", kc > 0);
    const text = total2 > 99 ? "99+" : String(total2);
    const display = kc > 0 && total2 > 0 ? "" : "none";
    if (ours.textContent !== text) ours.textContent = text;
    if (ours.style.display !== display) ours.style.display = display;
  }
  function installBadge() {
    onUnread((n) => {
      kc = n;
      render();
    });
    const watch = () => {
      const env = envelope();
      if (!env) {
        window.setTimeout(watch, 500);
        return;
      }
      new MutationObserver(() => render()).observe(env, { subtree: true, childList: true, characterData: true });
      render();
    };
    watch();
  }
  const loadCard = memo(async (oid) => {
    if (!await ensureSession()) return null;
    const card2 = await kcRequest("GET", "/ccw/users/" + oid);
    if (!card2 || !card2.has_account || !card2.user) return card2;
    const id = card2.user.id;
    const [gifts, posts] = await Promise.all([
      kcRequest("GET", `/users/${id}/gifts`).catch(() => null),
      kcRequest("GET", `/posts/users/${id}?limit=3`).catch(() => [])
    ]);
    return { ...card2, gifts, posts: Array.isArray(posts) ? posts : [] };
  }, 3e4);
  const RELATION = { friend: "好友", outgoing: "已发送好友申请", incoming: "对方想加你为好友", self: "这是你" };
  function dmHref(userId) {
    return "/notice/chat?u=" + userId;
  }
  async function addFriend(card2, btn) {
    btn.disabled = true;
    btn.textContent = "发送中…";
    try {
      await kcRequest("POST", "/friends/requests", { receiver_id: card2.user.id });
      card2.friendship = "outgoing";
      btn.textContent = "已发送申请";
      document.querySelectorAll(".ccwk-pill").forEach((p) => {
        p.textContent = "已发送申请";
        p.disabled = true;
      });
    } catch (err) {
      btn.disabled = false;
      btn.textContent = err && err.message || "发送失败";
    }
  }
  function actions(card2) {
    const f = card2.friendship;
    if (f === "self") return null;
    if (f === "friend") return [h("a", { class: "ccwk-btn is-primary", href: dmHref(card2.user.id) }, "发私信")];
    if (f === "incoming") return [h("a", { class: "ccwk-btn is-primary", href: "/notice/friends" }, "去通过申请")];
    if (f === "outgoing") return [h("button", { type: "button", class: "ccwk-btn", disabled: true }, "已发送申请")];
    const add = h("button", { type: "button", class: "ccwk-btn is-primary" }, "加好友");
    add.addEventListener("click", () => addFriend(card2, add));
    return [add, h("a", { class: "ccwk-btn", href: dmHref(card2.user.id) }, "私信")];
  }
  function renderCard(card2, className) {
    const u = card2.user;
    const a = card2.activity;
    const lv = u.account_level ? h("span", { class: "ccwk-lv", text: "Lv." + u.account_level }) : null;
    const facts = [];
    if (card2.mutual_friend_count) facts.push(card2.mutual_friend_count + " 位共同好友");
    if (card2.mutual_group_count) facts.push(card2.mutual_group_count + " 个共同群聊");
    const g = card2.gifts;
    const giftRow = g && g.summary && g.summary.length ? h(
      "div",
      { class: "ccwk-gifts", title: "收到的礼物" },
      g.summary.slice(0, 6).map((e) => h(
        "span",
        { class: "ccwk-gift" },
        h("i", { text: e.gift && GIFT_EMOJI[e.gift.icon] || "🎁" }),
        h("span", { text: "×" + e.count })
      )),
      h("span", { class: "ccwk-muted", text: "魅力 " + (g.charm || 0) })
    ) : null;
    const posts = card2.posts && card2.posts.length ? h(
      "div",
      { class: "ccwk-posts" },
      h("div", { class: "ccwk-sub-title", text: "最近动态" }),
      card2.posts.map((p) => h(
        "div",
        { class: "ccwk-post" },
        h("span", { class: "ccwk-post-text", text: (p.content || (p.image_urls && p.image_urls.length ? "[图片]" : "")).replace(/\s+/g, " ") }),
        h("span", { class: "ccwk-muted", text: relTime(kcIso(p.created_at)) })
      ))
    ) : null;
    const href = activityHref(a);
    return h(
      "div",
      { class: className + " ccwk-card" },
      h(
        "div",
        { class: "ccwk-card-head" },
        h("span", { class: "ccwk-brand" }, h("img", { src: KC_ICON, alt: "" }), "KukeChat"),
        h("span", { class: "ccwk-state" + (card2.online ? " is-online" : ""), text: card2.online ? "在线" : "离线" })
      ),
      h(
        "div",
        { class: "ccwk-who" },
        h("img", { class: "ccwk-avatar", src: u.avatar_url || u.ccw_avatar_url || "", alt: "" }),
        h(
          "div",
          { class: "ccwk-who-text" },
          h("div", { class: "ccwk-name" }, h("span", { text: u.nickname || u.username }), lv),
          h("div", { class: "ccwk-muted", text: "@" + u.username + (RELATION[card2.friendship] ? " · " + RELATION[card2.friendship] : "") })
        )
      ),
      a ? h(href ? "a" : "div", { class: "ccwk-activity", href }, h("i", { class: "ccwk-dot" }), activityText(a)) : null,
      facts.length ? h("div", { class: "ccwk-facts", text: facts.join(" · ") }) : null,
      giftRow,
      posts,
      (() => {
        const btns = actions(card2);
        return btns ? h("div", { class: "ccwk-actions" }, btns) : null;
      })()
    );
  }
  function pill(card2, followBtn) {
    const f = card2.friendship;
    if (f === "self") return null;
    const label = f === "friend" ? "私信" : f === "outgoing" ? "已发送申请" : f === "incoming" ? "通过申请" : "加好友";
    const el = h(f === "none" ? "button" : "a", {
      class: "ccwk-pill",
      type: f === "none" ? "button" : null,
      href: f === "friend" ? dmHref(card2.user.id) : f === "incoming" ? "/notice/friends" : null,
      disabled: f === "outgoing",
      style: followBtn ? `height:${followBtn.offsetHeight || 36}px` : null
    }, h("img", { src: KC_ICON, alt: "" }), label);
    if (f === "none") el.addEventListener("click", () => addFriend(card2, el));
    return el;
  }
  function inject$2(m) {
    const oid = m[1].toLowerCase();
    const doc = document.querySelector('[class*="selfDoc-"]');
    const tpl = doc && doc.querySelector('[class*="selfInfo-"]');
    if (!tpl) return;
    document.querySelectorAll(".ccwk-card, .ccwk-pill").forEach((n) => {
      if (n.dataset.oid !== oid) n.remove();
    });
    const box = document.querySelector('[class*="settingBox-"]');
    const followBtn = box && box.querySelector("button");
    const needCard = !doc.querySelector(".ccwk-card");
    const needPill = followBtn && !box.querySelector(".ccwk-pill");
    if (!needCard && !needPill) return;
    loadCard(oid).then((card2) => {
      if (!card2 || !card2.has_account || !card2.user) return;
      if (!location.pathname.toLowerCase().includes(oid)) return;
      if (needCard && doc.isConnected && !doc.querySelector(".ccwk-card")) {
        const el = renderCard(card2, tpl.className.split(/\s+/).filter((c) => /^selfInfo-/.test(c)).join(" "));
        el.dataset.oid = oid;
        doc.insertBefore(el, doc.firstChild);
      }
      if (needPill && followBtn.isConnected && !box.querySelector(".ccwk-pill")) {
        const p = pill(card2, followBtn);
        if (p) {
          p.dataset.oid = oid;
          box.style.width = "auto";
          followBtn.after(p);
        }
      }
    }).catch(() => {
    });
  }
  function installProfile() {
    registerInjector(/^\/student\/([0-9a-f]{24})\/?/i, inject$2);
  }
  const OID = /^[0-9a-f]{24}$/i;
  const known = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Set();
  let flushTimer = 0;
  function authorOid(item) {
    const key = Object.keys(item).find((k) => k.startsWith("__reactFiber$"));
    let fiber = key && item[key];
    for (let depth = 0; fiber && depth < 4; depth++, fiber = fiber.return) {
      const data = fiber.memoizedProps && fiber.memoizedProps.data;
      const c = data && data.commenter;
      const oid = typeof c === "string" ? c : c && typeof c === "object" ? c.accountOid || c.studentOid || c.oid : null;
      if (typeof oid === "string" && OID.test(oid)) return oid.toLowerCase();
    }
    return null;
  }
  async function flush() {
    flushTimer = 0;
    const oids = [...pending].slice(0, 50);
    oids.forEach((o) => pending.delete(o));
    if (!oids.length || !await ensureSession()) return;
    try {
      const briefs = await kcRequest("POST", "/ccw/users/batch", { oids });
      const now = Date.now();
      oids.forEach((o) => known.set(o, { at: now, brief: null }));
      (briefs || []).forEach((b) => known.set(b.ccw_oid, { at: now, brief: b }));
      decorateAll();
    } catch (_) {
    }
    if (pending.size) flushTimer = window.setTimeout(flush, 300);
  }
  function decorate(item, b) {
    const av = item.querySelector(".c-avatar-wrapper");
    if (av && b.online && !av.querySelector(".ccwk-cdot")) {
      if (getComputedStyle(av).position === "static") av.style.position = "relative";
      av.appendChild(h("i", { class: "ccwk-cdot", title: b.activity ? activityText(b.activity) : "在 KukeChat 在线" }));
    }
    const nm = item.querySelector(".c-author-name");
    if (nm && b.account_level && !(nm.nextElementSibling && nm.nextElementSibling.classList.contains("ccwk-clv"))) {
      nm.after(h("span", { class: "ccwk-clv", title: "KukeChat 等级", text: "Lv." + b.account_level }));
    }
    const ctrl = item.querySelector(".c-reply-control > div");
    const me2 = currentKukeUser();
    if (ctrl && !ctrl.querySelector(".ccwk-cdm") && !(me2 && me2.id === b.user_id)) {
      ctrl.insertBefore(h("a", { class: "c-reply-btn ccwk-cdm", href: "/notice/chat?u=" + b.user_id, title: "在 KukeChat 里私信 TA" }, "私信"), ctrl.firstChild);
    }
  }
  function decorateAll() {
    document.querySelectorAll(".c-comment-item").forEach((item) => {
      const oid = item.dataset.ccwkOid || authorOid(item);
      if (!oid) return;
      item.dataset.ccwkOid = oid;
      const k = known.get(oid);
      if (k && Date.now() - k.at < 6e4) {
        if (k.brief) decorate(item, k.brief);
        return;
      }
      pending.add(oid);
    });
    if (pending.size && !flushTimer) flushTimer = window.setTimeout(flush, 200);
  }
  function installComments() {
    registerInjector(/^\//, () => {
      if (!document.querySelector(".c-comment-item")) return;
      decorateAll();
    });
  }
  const loadWork = memo(async (oid) => {
    if (!await ensureSession()) return null;
    return kcRequest("GET", "/ccw/works/" + oid);
  }, 3e4);
  const loadFriends = memo(() => kcRequest("GET", "/friends").catch(() => []), 12e4);
  async function join(group, btn) {
    btn.disabled = true;
    btn.textContent = "加入中…";
    try {
      await kcRequest("POST", `/conversations/${group.conversation_id}/join`);
      group.is_member = true;
      location.assign("/notice/chat?c=" + group.conversation_id);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = err && err.message || "加入失败";
    }
  }
  function invitePanel(oid, anchor) {
    const old = document.querySelector(".ccwk-invite");
    if (old) {
      old.remove();
      return;
    }
    const title = (document.title || "").replace(/\s*[-|_].*$/, "").trim() || "这个作品";
    const list = h("div", { class: "ccwk-invite-list" }, h("div", { class: "ccwk-muted", text: "加载好友…" }));
    const panel = h(
      "div",
      { class: "ccwk-invite" },
      h("div", { class: "ccwk-sub-title", text: "邀请好友一起玩" }),
      list
    );
    anchor.after(panel);
    loadFriends("all").then((friends) => {
      const rows = (Array.isArray(friends) ? friends : []).map((f) => f.friend || f.user || f).filter((u) => u && u.id);
      if (!rows.length) {
        list.replaceChildren(h("div", { class: "ccwk-muted", text: "还没有 KukeChat 好友" }));
        return;
      }
      list.replaceChildren(...rows.slice(0, 30).map((u) => {
        const btn = h("button", { type: "button", class: "ccwk-btn is-sm" }, "邀请");
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const conv = await kcRequest("POST", "/conversations/direct", { user_id: u.id, temporary: true });
            await kcRequest("POST", `/conversations/${conv.id}/messages`, { type: "text", content: `一起来玩「${title}」吧 https://www.ccw.site/detail/${oid}` });
            btn.textContent = "已邀请";
          } catch (err) {
            btn.disabled = false;
            btn.textContent = "失败";
            btn.title = err && err.message || "";
          }
        });
        return h(
          "div",
          { class: "ccwk-invite-row" },
          h("img", { src: u.avatar_url || "", alt: "" }),
          h("span", { text: u.nickname || u.username }),
          btn
        );
      }));
    });
  }
  function renderWork(info, className, oid) {
    const g = info.group;
    const playing = info.playing || [];
    const joinBtn = g && !g.is_member ? h("button", { type: "button", class: "ccwk-btn is-primary" }, "加入群聊") : null;
    if (joinBtn) joinBtn.addEventListener("click", () => join(g, joinBtn));
    const inviteBtn = h("button", { type: "button", class: "ccwk-btn" }, "邀请好友一起玩");
    const card2 = h(
      "div",
      { class: className + " ccwk-card ccwk-work" },
      h(
        "div",
        { class: "ccwk-card-head" },
        h("span", { class: "ccwk-brand" }, h("img", { src: KC_ICON, alt: "" }), g ? "作品群" : "KukeChat"),
        g ? h("span", { class: "ccwk-muted", text: g.member_count + " 名成员" }) : null
      ),
      g ? h(
        "div",
        { class: "ccwk-who" },
        h("img", { class: "ccwk-avatar is-square", src: g.avatar_url || KC_ICON, alt: "" }),
        h(
          "div",
          { class: "ccwk-who-text" },
          h("div", { class: "ccwk-name", text: g.title }),
          h("div", { class: "ccwk-muted", text: g.is_member ? "你已在群里" : "公开群，可直接加入" })
        )
      ) : null,
      playing.length ? h(
        "div",
        { class: "ccwk-playing" },
        h("span", { class: "ccwk-faces" }, playing.slice(0, 4).map((p) => h("img", { src: p.avatar_url || "", alt: "", title: p.nickname || "" }))),
        h("span", null, h("b", { text: playing.length === 1 ? playing[0].nickname || "1 位好友" : playing.length + " 位好友" }), " 正在玩")
      ) : null,
      h(
        "div",
        { class: "ccwk-actions" },
        joinBtn,
        g && g.is_member ? h("a", { class: "ccwk-btn is-primary", href: "/notice/chat?c=" + g.conversation_id }, "进入群聊") : null,
        inviteBtn
      )
    );
    inviteBtn.addEventListener("click", () => invitePanel(oid, card2.querySelector(".ccwk-actions")));
    card2.dataset.oid = oid;
    return card2;
  }
  function inject$1(m) {
    const oid = m[1].toLowerCase();
    const panel = document.querySelector('[class*="baseInfoPanel-"] [class*="content-"]');
    const tpl = panel && panel.querySelector('[class*="card-"]');
    if (!tpl) return;
    document.querySelectorAll(".ccwk-work").forEach((n) => {
      if (n.dataset.oid !== oid) n.remove();
    });
    if (panel.querySelector(".ccwk-work")) return;
    loadWork(oid).then((info) => {
      if (!info || !location.pathname.toLowerCase().includes(oid) || panel.querySelector(".ccwk-work") || !tpl.isConnected) return;
      const cls = tpl.className.split(/\s+/).filter((c) => /^card-/.test(c)).join(" ");
      tpl.after(renderWork(info, cls, oid));
    }).catch(() => {
    });
  }
  function installWork() {
    registerInjector(/^\/detail\/([0-9a-f]{24})\/?/i, inject$1);
  }
  const POLL_MS = 4e3;
  const AVATAR = "https://m.ccw.site/community/images/avatar-default.png";
  const chat = { oid: null, info: null, loading: false, messages: [], ids: /* @__PURE__ */ new Set(), lastId: 0, open: false, nativeActive: null, panel: null, list: null, foot: null, timer: 0 };
  function activeClass(el) {
    return [...el.classList].find((c) => /^active-/.test(c)) || null;
  }
  async function loadInfo(oid) {
    if (chat.loading) return;
    chat.loading = true;
    try {
      const r = await kcPublic("GET", `/ccw/works/${oid}/chat?limit=40`);
      if (chat.oid !== oid) return;
      chat.info = r && r.group ? r : { group: null };
      addMessages(r && r.messages || []);
    } catch (_) {
      chat.info = { group: null };
    } finally {
      chat.loading = false;
    }
  }
  function addMessages(list) {
    const fresh2 = list.filter((m) => !chat.ids.has(m.id));
    if (!fresh2.length) return false;
    fresh2.forEach((m) => {
      chat.ids.add(m.id);
      chat.messages.push(m);
      chat.lastId = Math.max(chat.lastId, m.id);
    });
    chat.messages.sort((a, b) => a.id - b.id);
    if (chat.messages.length > 300) chat.messages.splice(0, chat.messages.length - 300);
    return true;
  }
  async function poll() {
    if (!chat.open || document.hidden || !chat.info || !chat.info.group) return;
    try {
      const r = await kcPublic("GET", `/ccw/works/${chat.oid}/chat?after_id=${chat.lastId}&limit=50`);
      if (r && r.group) {
        const old = chat.info.group;
        const member = r.group.is_member || old.is_member;
        const changed = member !== old.is_member || r.group.member_count !== old.member_count;
        chat.info.group = { ...r.group, is_member: member };
        if (changed) {
          renderHead();
          renderFoot();
        }
      }
      if (addMessages(r && r.messages || [])) renderList(true);
    } catch (_) {
    }
  }
  function fromRealtime(m) {
    const u = m.sender || {};
    const t = String(m.type || "text").toLowerCase();
    const summary = { voice: "[语音]", forward_bundle: "[聊天记录]", poll: "[投票]", red_packet: "[红包]", gift: "[礼物]" };
    return {
      id: m.id,
      sender_id: m.sender_id,
      nickname: m.sender_display_name || u.nickname || u.username || "KukeChat 用户",
      avatar_url: u.avatar_url,
      ccw_oid: u.ccw_student_oid,
      account_level: m.sender_level || u.account_level || 0,
      type: t,
      content: summary[t] || m.content || "",
      created_at: m.created_at
    };
  }
  function timeLabel(iso) {
    const d = new Date(kcIso(iso));
    const pad2 = (n) => String(n).padStart(2, "0");
    const today = /* @__PURE__ */ new Date();
    const hm = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    return d.toDateString() === today.toDateString() ? hm : d.getMonth() + 1 + "/" + d.getDate() + " " + hm;
  }
  function messageEl(m, prev) {
    if (m.type === "system") return h("div", { class: "ccwk-wc-sys", text: m.content });
    const me2 = currentKukeUser();
    const mine = me2 && me2.id === m.sender_id;
    const grouped = prev && prev.type !== "system" && prev.sender_id === m.sender_id && Date.parse(kcIso(m.created_at)) - Date.parse(kcIso(prev.created_at)) < 18e4;
    const body = m.type === "image" ? h("a", { class: "ccwk-wc-img", href: m.content, target: "_blank", rel: "noreferrer" }, h("img", { src: m.content, alt: "", loading: "lazy" })) : h("div", { class: "ccwk-wc-bubble", text: m.content });
    const avatar = h("img", { class: "ccwk-wc-av", src: m.avatar_url || AVATAR, alt: "" });
    return h(
      "div",
      { class: "ccwk-wc-msg" + (mine ? " is-mine" : "") + (grouped ? " is-grouped" : "") },
      grouped ? h("span", { class: "ccwk-wc-av is-blank" }) : m.ccw_oid ? h("a", { href: "/student/" + m.ccw_oid, target: "_blank", rel: "noreferrer" }, avatar) : avatar,
      h(
        "div",
        { class: "ccwk-wc-main" },
        grouped ? null : h(
          "div",
          { class: "ccwk-wc-meta" },
          h("b", { text: m.nickname }),
          m.account_level ? h("span", { class: "ccwk-clv", text: "Lv." + m.account_level }) : null,
          h("time", { text: timeLabel(m.created_at) })
        ),
        body
      )
    );
  }
  function renderList(keepBottom) {
    if (!chat.list) return;
    const el = chat.list;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    const nodes = chat.messages.map((m, i) => messageEl(m, chat.messages[i - 1]));
    el.replaceChildren(...nodes.length ? nodes : [h("div", { class: "ccwk-wc-empty", text: "还没有人说话，来打个招呼吧" })]);
    if (!keepBottom || atBottom) el.scrollTop = el.scrollHeight;
  }
  function renderFoot() {
    if (!chat.foot) return;
    const g = chat.info && chat.info.group;
    const me2 = currentKukeUser();
    if (!g) {
      chat.foot.replaceChildren();
      return;
    }
    if (!me2) {
      chat.foot.replaceChildren(h(
        "div",
        { class: "ccwk-wc-gate" },
        h("span", { text: "登录 KukeChat 后可以一起聊天" }),
        h("a", { class: "ccwk-btn is-primary is-sm", href: "/notice/chat" }, "登录")
      ));
      return;
    }
    if (!g.is_member) {
      const btn = h("button", { type: "button", class: "ccwk-btn is-primary is-sm" }, "加入群聊");
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "加入中…";
        try {
          await kcRequest("POST", `/conversations/${g.conversation_id}/join`);
          const cur = chat.info.group;
          cur.is_member = true;
          cur.member_count += 1;
          renderHead();
          renderFoot();
        } catch (err) {
          btn.disabled = false;
          btn.textContent = err && err.message || "加入失败";
        }
      });
      chat.foot.replaceChildren(h("div", { class: "ccwk-wc-gate" }, h("span", { text: "加入作品群后就能一起聊" }), btn));
      return;
    }
    const input = h("textarea", { class: "ccwk-wc-input", rows: "1", maxlength: "2000", placeholder: "说点什么…（Enter 发送，Shift+Enter 换行）" });
    const send = h("button", { type: "button", class: "ccwk-btn is-primary is-sm", disabled: true }, "发送");
    const submit = async () => {
      const content = input.value.trim();
      if (!content || send.disabled) return;
      send.disabled = true;
      input.disabled = true;
      try {
        const m = await kcRequest("POST", `/conversations/${g.conversation_id}/messages`, { type: "text", content });
        input.value = "";
        if (m && m.id && addMessages([fromRealtime(m)])) renderList(false);
      } catch (err) {
        input.placeholder = err && err.message || "发送失败";
      } finally {
        input.disabled = false;
        send.disabled = !input.value.trim();
        input.focus();
      }
    };
    input.addEventListener("input", () => {
      send.disabled = !input.value.trim();
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submit();
      }
    });
    send.addEventListener("click", submit);
    chat.foot.replaceChildren(h("div", { class: "ccwk-wc-compose" }, input, send));
  }
  let headEl = null;
  function renderHead() {
    const g = chat.info && chat.info.group;
    if (!headEl || !g) return;
    headEl.replaceChildren(...[
      h("img", { class: "ccwk-wc-gav", src: g.avatar_url || KC_ICON, alt: "" }),
      h(
        "div",
        { class: "ccwk-wc-title" },
        h("b", { text: g.title }),
        h("span", { text: g.member_count + " 名成员 · KukeChat 作品群" })
      ),
      g.is_member ? h("a", { class: "ccwk-wc-open", href: "/notice/chat?c=" + g.conversation_id, title: "在消息中心打开" }, "打开") : null
    ].filter(Boolean));
  }
  function buildPanel(height) {
    headEl = h("header", { class: "ccwk-wc-head" });
    chat.list = h("div", { class: "ccwk-wc-list" });
    chat.foot = h("footer", { class: "ccwk-wc-foot" });
    chat.panel = h("section", { class: "ccwk-wc", style: `height:${Math.max(420, height)}px` }, headEl, chat.list, chat.foot);
    renderHead();
    renderList(false);
    renderFoot();
    return chat.panel;
  }
  function openTab(bar, panelHost, tab) {
    if (chat.open) return;
    const active = [...bar.children].find((li) => li !== tab && activeClass(li));
    const cls = active && activeClass(active);
    if (active && cls) {
      active.classList.remove(cls);
      tab.classList.add(cls);
      chat.nativeActive = { el: active, cls };
    }
    const height = panelHost.getBoundingClientRect().height || window.innerHeight - 140;
    if (!chat.panel || !panelHost.contains(chat.panel)) panelHost.appendChild(buildPanel(Math.min(height, window.innerHeight - 120)));
    panelHost.classList.add("ccwk-wc-on");
    chat.open = true;
    renderHead();
    renderFoot();
    renderList(false);
    window.clearInterval(chat.timer);
    chat.timer = window.setInterval(poll, POLL_MS);
    poll();
  }
  function closeTab(tab) {
    if (!chat.open) return;
    chat.open = false;
    window.clearInterval(chat.timer);
    const n = chat.nativeActive;
    if (n) {
      tab.classList.remove(n.cls);
      if (n.el.isConnected) n.el.classList.add(n.cls);
      chat.nativeActive = null;
    }
    document.querySelectorAll(".ccwk-wc-on").forEach((el) => el.classList.remove("ccwk-wc-on"));
  }
  function reset(oid) {
    window.clearInterval(chat.timer);
    Object.assign(chat, { oid, info: null, loading: false, messages: [], ids: /* @__PURE__ */ new Set(), lastId: 0, open: false, nativeActive: null, panel: null, list: null, foot: null, timer: 0 });
    headEl = null;
    document.querySelectorAll(".ccwk-wc-tab, .ccwk-wc").forEach((n) => n.remove());
    document.querySelectorAll(".ccwk-wc-on").forEach((el) => el.classList.remove("ccwk-wc-on"));
  }
  function inject(m) {
    const oid = m[1].toLowerCase();
    if (chat.oid !== oid) reset(oid);
    if (!chat.info) {
      loadInfo(oid);
      return;
    }
    if (!chat.info.group) return;
    const bar = document.querySelector('ul[class*="sliderBarTab-"]');
    const panelHost = bar && bar.parentElement && bar.parentElement.querySelector('[class*="sliderBarPanel-"]');
    if (!bar || !panelHost || bar.querySelector(".ccwk-wc-tab")) return;
    if (chat.open) {
      chat.open = false;
      chat.nativeActive = null;
      window.clearInterval(chat.timer);
      document.querySelectorAll(".ccwk-wc-on").forEach((el) => el.classList.remove("ccwk-wc-on"));
    }
    const native = bar.querySelector("li");
    const tab = h("li", { class: (native ? [...native.classList].filter((c) => /^sliderBarTabTitle-/.test(c)).join(" ") + " " : "") + "ccwk-wc-tab", title: "KukeChat 作品群" }, "聊天");
    tab.addEventListener("click", () => openTab(bar, panelHost, tab));
    bar.addEventListener("click", (e) => {
      const li = e.target.closest && e.target.closest("li");
      if (li && li !== tab) closeTab(tab);
    }, true);
    bar.appendChild(tab);
  }
  function installWorkChat() {
    registerInjector(/^\/detail\/([0-9a-f]{24})\/?/i, inject);
    onRealtime((e) => {
      const g = chat.info && chat.info.group;
      if (e.type !== "message.created" || !e.data || !g || e.data.conversation_id !== g.conversation_id) return;
      if (addMessages([fromRealtime(e.data)])) renderList(true);
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) poll();
    });
  }
  function installEverywhere() {
    injectStyle();
    startRealtime();
    installUnread();
    installBadge();
    installToast();
    installProfile();
    installComments();
    installWork();
    installWorkChat();
    installContentImageViewer();
    installPages();
  }
  function boot() {
    installPresence();
    if (document.body) installEverywhere();
    else document.addEventListener("DOMContentLoaded", installEverywhere, { once: true });
    if (!parseRoute() && !isFeedPath()) return;
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", () => applyRoute(false), { once: true });
      return;
    }
    applyRoute(false);
  }
  boot();
  window.addEventListener("resize", syncStickyTop);
  window.addEventListener("load", () => {
    applyRoute(false);
    syncStickyTop();
  });
})();
