// ==UserScript==
// @name         网易云音乐下载
// @namespace    cj-cm-dl
// @version      2.0.1
// @description  便捷下载音乐
// @match        https://music.163.com/song?id=*
// @grant        GM_download
// @run-at       document-end
// @icon         https://music.163.com/favicon.ico
// @author       Chen-Jin
// @updateURL    https://us.chen-jin.dpdns.org/cmDl.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/cmDl.user.js
// ==/UserScript==

if (document.querySelector('.u-btni-play-dis')) throw "无法播放";
const id = new URLSearchParams(location.search).get("id");
const name = document.title.split(" - ").slice(0, 2).join(" - ").replaceAll("/", "、") + ".mp3";
const isVIP = document.querySelector('i.lab.u-icn.u-icn-98');
const url = isVIP ? `https://api.qijieya.cn/meting/?type=url&id=${id}` : `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
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
btn.textContent = isVIP ? "下载（第三方 API）" : "下载";
host.appendChild(btn);
btn.onclick = () => {
    GM_download({
        url,
        name,
        onerror: e => (btn.textContent = "下载出错", console.error(e)),
        onprogress: p => btn.textContent = `${Math.ceil((p.loaded / p.total) * 100)}%`,
        onload: () => btn.textContent = "下载完成",
        ontimeout: () => btn.textContent = "下载超时",
    })
}
top.document.body.appendChild(host);