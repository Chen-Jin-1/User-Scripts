// ==UserScript==
// @name         酷狗音乐下载
// @namespace    cj-kg-dl
// @version      1.0.0
// @description  便捷下载音乐
// @match        https://www.kugou.com/mixsong/*
// @grant        GM_download
// @run-at       document-start
// @icon         https://www.kugou.com/favicon.ico
// @author       Chen-Jin
// @updateURL    https://us.chen-jin.dpdns.org/kgDl.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/kgDl.user.js
// ==/UserScript==

let url, name;
const host = document.createElement('div');
host.style.cssText = 'position: fixed; z-index: 100000;';
const styles = document.createElement("style");
styles.textContent = `#cmdl {
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
#cmdl.cmdl-hidden {
    opacity: 0 !important;
    pointer-events: none;
}
#cmdl:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
#cmdl:active {
    transform: translateY(0);
}`;
host.appendChild(styles);
const btn = document.createElement("div");
btn.id = "cmdl";
host.appendChild(btn);
btn.onclick = () => GM_download({
    url,
    name,
    onerror: e => (btn.textContent = "下载出错", console.error(e)),
    onprogress: p => btn.textContent = `${Math.ceil((p.loaded / p.total) * 100)}%`,
    onload: () => btn.textContent = "下载完成",
    ontimeout: () => btn.textContent = "下载超时",
})

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u.startsWith("https://wwwapi.kugou.com/play/songinfo?")) {
        this.addEventListener("load", () => {
            r = JSON.parse(this.response);
            name = r.data.audio_name + '.mp3';
            url = r.data.play_url;
            btn.textContent = "下载";
            document.body.appendChild(host);
        });
    }
    return _open.call(this, m, u, a);
}