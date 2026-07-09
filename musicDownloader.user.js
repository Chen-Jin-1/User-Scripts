// ==UserScript==
// @name         音乐下载器
// @namespace    cj-music-downloader
// @version      0
// @description  便捷下载四大平台音乐
// @author       Chen-Jin
// @match        https://music.163.com/*
// @match        https://kuwo.cn/*
// @match        https://www.kuwo.cn/*
// @match        https://y.qq.com/n/ryqq_v2/player
// @match        https://www.kugou.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @icon         https://music.163.com/favicon.ico
// @downloadURL  https://us.chen-jin.dpdns.org/musicDownloader.user.js
// ==/UserScript==

let name, url;
const s = new top.CSSStyleSheet();
s.replaceSync(`#cj-md {
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
#cj-md:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
#cj-md:active {
    transform: translateY(0);
}`);
top.document.adoptedStyleSheets.push(s);
document.querySelectorAll("#cj-md").forEach(x => x.remove());
const btn = document.createElement("div");
btn.id = "cj-md";
btn.textContent = "⬇️ 下载";
btn.onclick = () => {
    btn.style.pointerEvents = 'none';
    btn.textContent = '获取数据';
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        responseType: 'blob',
        onload: res => {
            const blobUrl = URL.createObjectURL(res.response);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = name;
            a.click();
            btn.textContent = '✅ 完成';
        },
        onerror: () => btn.textContent = '❌ 失败',
    });
    btn.style.pointerEvents = 'auto';
};
if (location.host === "music.163.com") {
    if (frameElement) {
        const id = new URLSearchParams(location.search).get("id");
        name = document.title.split(" - ").slice(0, 2).join(" - ").replaceAll("/", "、") + ".mp3";
        url = document.querySelector('.vip-song, .u-btni-vipply, .u-btn-vip-download, .u-btni-fav[data-fee="1"], .u-icn-98, .u-icn-vip, .u-icn-vipply') ? `https://api.qijieya.cn/meting/?type=url&id=${id}` : `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
    } else {
        const song = JSON.parse(localStorage['track-queue'])[JSON.parse(localStorage['player-setting']).index];
        name = `${song.name} - ${song.artists.map(x => x.name).join("、")}.mp3`;
        url = `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;
    }    
    
    const btn = document.createElement("div");
    btn.id = "cj-md";
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
    top.document.querySelectorAll('#cj-md').forEach(x => x.remove());
    top.document.body.appendChild(btn);
}