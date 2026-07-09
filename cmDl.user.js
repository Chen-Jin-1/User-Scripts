// ==UserScript==
// @name         网易云音乐下载
// @namespace    cj-cm-dl
// @version      2.2.0
// @description  便捷下载音乐
// @match        https://music.163.com/*
// @run-at       document-start
// @icon         https://music.163.com/favicon.ico
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/cmDl.user.js
// ==/UserScript==

let name, song, url;
if (frameElement) {
    const id = new URLSearchParams(location.search).get("id");
    name = document.title.split(" - ").slice(0, 2).join(" - ").replaceAll("/", "、") + ".mp3";
    url = document.querySelector('.vip-song, .u-btni-vipply, .u-btn-vip-download, .u-btni-fav[data-fee="1"], .u-icn-98, .u-icn-vip, .u-icn-vipply') ? `https://api.qijieya.cn/meting/?type=url&id=${id}` : `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
} else {
    const song = JSON.parse(localStorage['track-queue'])[JSON.parse(localStorage['player-setting']).index];
    name = `${song.name} - ${song.artists.map(x => x.name).join("、")}.mp3`;
    url = `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;
}
document.querySelectorAll("#cmdl").forEach(x => x.remove());
const s = new top.CSSStyleSheet();
s.replaceSync(`#cmdl {
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
#cmdl:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
#cmdl:active {
    transform: translateY(0);
}`);
top.document.adoptedStyleSheets.push(s);
const btn = document.createElement("div");
btn.id = "cmdl";
btn.textContent = "⬇️ 下载";
btn.onclick = async () => {
    btn.style.pointerEvents = 'none';
    btn.textContent = '获取数据';
    const response = await fetch(url);
    if (!response.ok) throw btn.textContent = 'HTTP Error ' + response.status;
    else if (response.url === "https//music.163.com/404") throw btn.textContent = 'HTTP Error 404';
    btn.textContent = '转为 Blob';
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    btn.textContent = '下载';
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name;
    a.click();
    btn.textContent = '✅ 完成';
    btn.style.pointerEvents = 'auto';
}
top.document.querySelectorAll('#cmdl').forEach(x => x.remove());
top.document.body.appendChild(btn);