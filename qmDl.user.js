// ==UserScript=
// @name         QQ 音乐下载
// @namespace    cj-cm-dl
// @version      0
// @description  便捷下载音乐
// @match        https://y.qq.com/n/ryqq_v2/player
// @grant        GM_download
// @run-at       document-end
// @icon         https://y.qq.com/favicon.ico
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/qqDl.user.js
// ==/UserScript==

let capturedUrls = [];
const _parse = JSON.parse;
JSON.parse = json => {
    const r = _parse(json);
    console.log(r);
    return r;
}

const originalDefineProperty = unsafeWindow.Object.defineProperty;
unsafeWindow.Object.defineProperty = function(obj, prop, descriptor) {
    if (obj?.__esModule && prop === 'QMAPlayerCore') {
        const originalGetter = descriptor.get;
        return originalDefineProperty.call(this, obj, prop, {
            ...descriptor,
            get: function() {
                const OriginalClass = originalGetter.call(this);
                if (OriginalClass.__hijacked) return OriginalClass;
                const WrappedClass = function(...args) {
                    const instance = new OriginalClass(...args);

                    if (instance._loader && instance._loader.worker) {
                        const worker = instance._loader.worker;
                        worker.fetch = function(e, t, n, r) {
                            if (e && e.includes('.m4a') && e.includes('vkey=')) {
                                console.log('URL:', e);
                                capturedUrls.push(e);
                                unsafeWindow.__qqAudioUrl = e;
                            }
                            return fetch(e, { headers: { 'Range': `bytes=${t != null ? t : 0}-${(t != null ? t : 0) + n - 1}` } }).then(res => {
                                const range = res.headers.get('Content-Range');
                                if (!range) throw new Error('Content-Range unsupport');
                                return res.blob().then(blob => ({ blob, range, size: parseInt(range.split('/')[1]) || blob.size }));
                            });
                        };
                    }

                    unsafeWindow.__qqPlayer = instance;
                    return instance;
                };

                WrappedClass.prototype = OriginalClass.prototype;
                WrappedClass.prototype.constructor = WrappedClass;
                return WrappedClass;
            },
        });
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
};

// ========== 下载函数 ==========
function download() {
    const url = unsafeWindow.__qqAudioUrl || capturedUrls[capturedUrls.length - 1];
    if (!url) {
        console.warn('[QQ下载器] 没有捕获到 URL，请先播放歌曲');
        return;
    }
    console.log('[QQ下载器] 下载 URL:', url);
    if (typeof GM_download !== 'undefined') {
        GM_download({
            url: url,
            name: `song_${Date.now()}.m4a`,
            saveAs: true
        });
    } else {
        window.open(url);
    }
}

// ========== 创建下载按钮 ==========
function createUI() {
    if (document.getElementById('qq-dl-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'qq-dl-btn';
    btn.textContent = '⬇️';
    btn.style.cssText = `
        position: fixed; bottom: 100px; right: 20px; z-index: 99999;
        background: #31c27c; color: #fff; border: none; border-radius: 50%;
        width: 56px; height: 56px; font-size: 24px; cursor: pointer;
        box-shadow: 0 4px 12px rgba(49,194,124,0.4);
        transition: all 0.3s ease;
    `;
    btn.onclick = download;
    document.body.appendChild(btn);
    console.log('[QQ下载器] ✅ UI 已创建');
}

// ========== 暴露控制台接口 ==========
unsafeWindow.__dl = {
    download,
    getUrl: () => unsafeWindow.__qqAudioUrl || capturedUrls[capturedUrls.length - 1],
    getAllUrls: () => capturedUrls,
    reset: () => { capturedUrls = []; }
};

// ========== 初始化 ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
} else {
    createUI();
}

console.log('[QQ下载器] ✅ 已加载，播放歌曲后点击按钮下载');
console.log('[QQ下载器] 📌 或执行 __dl.download()');