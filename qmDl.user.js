// ==UserScript==
// @name         QQ 音乐下载
// @namespace    cj-cm-dl
// @version      1.0.0
// @description  便捷下载音乐
// @match        https://y.qq.com/n/ryqq_v2/player
// @run-at       document-start
// @icon         https://y.qq.com/favicon.ico
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/qqDl.user.js
// ==/UserScript==

const btn = document.createElement('div'), s = new CSSStyleSheet();
s.replaceSync(`#qmdl {
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
#qmdl:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
#qmdl:active {
    transform: translateY(0);
}`);
document.adoptedStyleSheets.push(s);
btn.id = 'qmdl';
const _ce = document.createElement.bind(document);
document.createElement = tn => {
    if (tn === 'audio') {
        const e = _ce(tn);
        btn.textContent = '⬇️ 下载';
        btn.onclick = async () => {
            const d = JSON.parse(localStorage.playSongData).value,
                s = d.songList[d.index];
                url = e.src;
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
            a.download = `${s.title} - ${s.singer.map(s => s.name).join('、')}.${url.split("?")[0].split(".").pop()}`;
            a.click();
            btn.textContent = '✅ 完成';
            btn.style.pointerEvents = 'auto';
        }
        document.body.appendChild(btn);
        return e;
    }
    return _ce(tn);
}
Object.defineProperty(navigator, 'userAgent', { get: () => 'Edg/' });