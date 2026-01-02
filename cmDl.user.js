// ==UserScript==
// @name         从外链式生成器下载音乐
// @namespace    cj-cm-op-dl
// @version      1.0.1
// @description  打开外链式生成器即可下载
// @match        https://music.163.com/outchain/player*
// @grant        GM_download
// @run-at       document-start
// @icon         https://music.163.com/favicon.ico
// @author       Chen-Jin
// @updateURL    https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/cmDl.user.js
// @downloadURL  https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/cmDl.user.js
// ==/UserScript==

const srcSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src').set;
Object.defineProperty(HTMLMediaElement.prototype, 'src', {
    set(value) {
        if (value) {
            setTimeout(() => {
                GM_download({
                  name: document.getElementById("title").innerText + '.mp3',
                  url: this.src,
                });
            }, 1000)
        }
        return srcSetter.call(this, value);
    },
    get: Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src').get,
    configurable: true
});
