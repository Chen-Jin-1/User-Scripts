// ==UserScript==
// @name         酷狗音乐下载
// @namespace    cj-kg-dl
// @version      1.0.2
// @description  便捷下载音乐
// @match        https://www.kugou.com/mixsong/*
// @match        https://www.kugou.com/song/*
// @run-at       document-start
// @icon         https://www.kugou.com/favicon.ico
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/kgDl.user.js
// ==/UserScript==

let url, name;
const host = document.createElement('div');
host.style.cssText = 'position: fixed; z-index: 100000;';
const s = new CSSStyleSheet();
s.replaceSync(`#kgdl {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 10px 18px;
    color: white;
    cursor: pointer;
    border-radius: 25px;
    user-select: none;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    background: steelblue;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s ease;
    font-family: 'PingFang', sans-serif;
    opacity: 1;
    line-height: initial;
    touch-action: none;
}
#kgdl:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
#kgdl:active {
    transform: translateY(0);
}`);
document.adoptedStyleSheets.push(s);
const btn = document.createElement("div");
btn.id = "kgdl";
host.appendChild(btn);
btn.onclick = async () => {
    btn.style.pointerEvents = 'none';
    btn.textContent = '获取数据'
    const response = await fetch(url);
    if (!response.ok) throw btn.textContent = 'HTTP Error ' + response.status;
    btn.textContent = '转为 Blob';
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    btn.textContent = '保存';
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name;
    a.click();
    btn.textContent = '✅ 完成';
    btn.style.pointerEvents = 'auto';
};

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u.startsWith("https://wwwapi.kugou.com/play/songinfo?")) {
        this.addEventListener("load", () => {
            r = JSON.parse(this.response);
            name = r.data.audio_name + '.mp3';
            url = r.data.play_url;
            btn.textContent = "⬇️ 下载";
            document.body.appendChild(host);
        });
    }
    return _open.call(this, m, u, a);
}