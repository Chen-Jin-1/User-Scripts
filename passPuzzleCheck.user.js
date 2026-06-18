// ==UserScript==
// @name                自动通过拼图验证
// @namespace           cj-pass-puzzle-check
// @match               https://*.ccw.site/*
// @grant               none
// @version             1.0.0
// @author              Chen-Jin
// @description         自动识别拼图位置通过验证
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://us.chen-jin.dpdns.org/passPuzzleCheck.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/passPuzzleCheck.user.js
// @run-at              document-start
// ==/UserScript==

function detectGapX(bgDataUrl, jigsawDataUrl) {
    return new Promise((resolve, reject) => {
        const bgCanvas = document.createElement('canvas');
        const jCanvas = document.createElement('canvas');
        const bgCtx = bgCanvas.getContext('2d');
        const jCtx = jCanvas.getContext('2d');

        const bgImg = new Image();
        const jImg = new Image();
        let loaded = 0;

        function onComplete() {
            loaded++;
            if (loaded === 2) {
                try {
                    bgCanvas.width = bgImg.width;
                    bgCanvas.height = bgImg.height;
                    jCanvas.width = jImg.width;
                    jCanvas.height = jImg.height;

                    bgCtx.drawImage(bgImg, 0, 0);
                    jCtx.drawImage(jImg, 0, 0);

                    const bgData = bgCtx.getImageData(0, 0, bgCanvas.width, bgCanvas.height).data;
                    const jData = jCtx.getImageData(0, 0, jCanvas.width, jCanvas.height).data;

                    const bgW = bgCanvas.width, bgH = bgCanvas.height;
                    const jW = jCanvas.width, jH = jCanvas.height;

                    // ---- 提取拼图块的有效像素（非透明） ----
                    const puzzlePixels = [];
                    for (let y = 0; y < jH; y++) {
                        for (let x = 0; x < jW; x++) {
                            const idx = (y * jW + x) * 4;
                            if (jData[idx + 3] > 30) {
                                puzzlePixels.push({
                                    x, y,
                                    r: jData[idx],
                                    g: jData[idx + 1],
                                    b: jData[idx + 2]
                                });
                            }
                        }
                    }

                    // ---- 在背景图上滑动匹配 ----
                    const searchEnd = bgW - jW;
                    let bestX = 0;
                    let bestScore = Infinity;
                    const step = 2; // 步长

                    for (let x = 0; x <= searchEnd; x += step) {
                        let totalDiff = 0;
                        for (const p of puzzlePixels) {
                            const bgIdx = ((p.y) * bgW + (x + p.x)) * 4;
                            totalDiff += Math.abs(bgData[bgIdx] - p.r) +
                                         Math.abs(bgData[bgIdx + 1] - p.g) +
                                         Math.abs(bgData[bgIdx + 2] - p.b);
                        }
                        const avgDiff = totalDiff / puzzlePixels.length;
                        if (avgDiff < bestScore) {
                            bestScore = avgDiff;
                            bestX = x;
                        }
                    }

                    // ---- 精细搜索 ----
                    const fineStart = Math.max(0, bestX - 15);
                    const fineEnd = Math.min(searchEnd, bestX + 15);
                    let fineBest = bestX;
                    let fineScore = bestScore;

                    for (let x = fineStart; x <= fineEnd; x++) {
                        let totalDiff = 0;
                        for (const p of puzzlePixels) {
                            const bgIdx = ((p.y) * bgW + (x + p.x)) * 4;
                            totalDiff += Math.abs(bgData[bgIdx] - p.r) +
                                         Math.abs(bgData[bgIdx + 1] - p.g) +
                                         Math.abs(bgData[bgIdx + 2] - p.b);
                        }
                        const avgDiff = totalDiff / puzzlePixels.length;
                        if (avgDiff < fineScore) {
                            fineScore = avgDiff;
                            fineBest = x;
                        }
                    }
                    resolve(fineBest);

                } catch (err) {
                    reject(err);
                }
            }
        }

        bgImg.onload = onComplete;
        jImg.onload = onComplete;

        bgImg.src = bgDataUrl;
        jImg.src = jigsawDataUrl;
    });
}

function simulateDragInstant(sliderEl, targetX) {
    return new Promise((resolve) => {
        const rect = sliderEl.getBoundingClientRect();
        const startClientX = rect.left + rect.width / 2;
        const startClientY = rect.top + rect.height / 2;
        const endClientX = startClientX + targetX;

        // ---- 1. mousedown ----
        const downEvent = new MouseEvent('mousedown', {
            clientX: startClientX,
            clientY: startClientY,
            bubbles: true,
            cancelable: true,
            buttons: 1,
        });
        sliderEl.dispatchEvent(downEvent);

        // ---- 2. 直接移动到目标位置（只有一次mousemove） ----
        const moveEvent = new MouseEvent('mousemove', {
            clientX: endClientX,
            clientY: startClientY,
            bubbles: true,
            cancelable: true,
            buttons: 1,
        });
        sliderEl.dispatchEvent(moveEvent);

        // ---- 3. mouseup ----
        const upEvent = new MouseEvent('mouseup', {
            clientX: endClientX,
            clientY: startClientY,
            bubbles: true,
            cancelable: true,
            buttons: 0,
        });
        sliderEl.dispatchEvent(upEvent);

        resolve();
    });
}

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u === "https://op-parent-api.xiguacity.cn/captcha/create") {
        this.addEventListener("load", async () => {
            const { data } = JSON.parse(this.responseText).body;
            const x = await detectGapX(data.bgImg, data.jigsawImg);
            simulateDragInstant(document.querySelector('.modalMask:not([style*="none"]) .sliderIcon'), x);
        })
    }
    return _open.call(this, m, u, a);
}

const css = document.createElement('style');
css.id = "cj-pzc-css";
css.textContent = '.modalMask{visibility:hidden}';
document.head.appendChild(css);