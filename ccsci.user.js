// ==UserScript==
// @name         CCW 评论区自定义图片
// @namespace    CCW Comment Section Custom Images
// @version      0.0.1
// @description  CCW Comment Section Custom Images
// @author       xiaochen004hao
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @match        https://www.ccw.site/*
// @grant        none
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const firstTimeKey = 'CCW Comment Section Custom Images';

    if (!localStorage.getItem(firstTimeKey)) {
        // 显示操作提示
        alert('🎨 CCW 评论区自定义图片已启用！\n\n✨ 使用方法：\n1. 点击作品评论区的截屏按钮（剪刀图标✂️）\n2. 选择本地图片文件\n3. 取消选择本地图片则视为使用原本的截屏功能\n\n💡 提示：因为CCW底层原因，宽远大于高和透明背景的图片会出现一些奇奇怪怪的效果');
        // 标记为已显示
        localStorage.setItem(firstTimeKey, 'true');
    }

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM已经加载完成
        setTimeout(init, 1000); // 给React一些时间初始化
    }

    function init() {
        // 尝试获取VM对象
        const vvm = getVM();

        if (!vvm) {
            console.log('未找到VM对象，将在1秒后重试...');
            setTimeout(init, 1000);
            return;
        }

        console.log('成功获取VM对象，开始劫持requestSnapshot函数');

        // 保存原始函数引用
        const originalRequestSnapshot = vvm.renderer.requestSnapshot;
        const originalWHC = ['', '', ''];

        // 劫持函数
        vvm.renderer.requestSnapshot = function (originalCallback) {
            // 创建一个新的回调函数，它会忽略所有参数并上传本地图片
            const hijackedCallback = function (...args) {
                // 忽略所有传入的参数
                console.log('忽略的参数:', args);

                // 创建文件输入元素
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';

                document.body.appendChild(fileInput);

                fileInput.onchange = async (event) => {
                    const file = event.target.files[0];

                    if (!file || !file.type.startsWith('image/')) {
                        document.body.removeChild(fileInput);
                        // 如果没有选择有效文件，调用原始回调可能传入原始参数
                        if (originalCallback) originalCallback(...args);
                        return;
                    }

                    try {
                        // 将本地图片转换为base64
                        const base64Data = await convertFileToBase64(file);

                        // 用base64数据调用原始回调函数
                        if (originalCallback) {
                            let t = document.createElement("img");
                            t.src = base64Data;
                            t.onload = function () {
                                let w = document.querySelector('div[class*="gandi_stage_stage_"][class*="gandi_stage_playerOnly_"][class*="ccw-stage-wrapper"]');
                                let f = document.querySelector('div[class*="flash-"]');
                                originalWHC[0] = w ? w.style.width : '';
                                originalWHC[1] = w ? w.style.height : '';
                                originalWHC[2] = f ? f.style.backgroundColor : '';
                                document.querySelector('div[class*="gandi_stage_monitor-wrapper_"]').style.display = "none";
                                vvm.renderer.canvas.style.display = "none";
                                if (w) {
                                    vvm.renderer.canvas.style.width = w.style.width = w.style.width;
                                    vvm.renderer.canvas.style.height = w.style.height = (parseInt(w.style.width) / t.width * t.height) + 'px';
                                }
                                if (f) f.style.backgroundColor = "transparent";
                                setTimeout(() => {
                                    vvm.renderer.canvas.style.display = "none";
                                    originalCallback(base64Data);
                                    vvm.renderer.canvas.style.display = "none";
                                });
                            };
                        }
                    } catch (error) {
                        console.error('图片转换失败:', error);
                        // 如果转换失败，可能调用原始回调或保持沉默
                        if (originalCallback) originalCallback(...args);
                    } finally {
                        document.body.removeChild(fileInput);
                        let w = document.querySelector('div[class*="gandi_stage_stage_"][class*="gandi_stage_playerOnly_"][class*="ccw-stage-wrapper"]');
                        let f = document.querySelector('div[class*="flash-"]');
                        setTimeout(() => {
                            if (w) {
                                vvm.renderer.canvas.style.width = w.style.width = originalWHC[0];
                                vvm.renderer.canvas.style.height = w.style.height = originalWHC[1];
                            }
                            if (f) f.style.backgroundColor = originalWHC[2];
                            document.querySelector('div[class*="gandi_stage_monitor-wrapper_"]').style.display = "";
                            vvm.renderer.canvas.style.display = "inline-block";
                        }, 500);
                    }
                };

                fileInput.oncancel = () => {
                    document.body.removeChild(fileInput);
                    // 用户取消选择，调用原始回调可能传入原始参数
                    if (originalCallback) originalCallback(...args);
                };

                // 触发文件选择
                fileInput.click();
            };

            // 用修改后的回调函数调用原始函数
            return originalRequestSnapshot.call(vvm.renderer, hijackedCallback);
        };

        console.log('requestSnapshot函数劫持完成');
    }

    // 获取VM对象的函数
    function getVM() {
        const internalRoots = Array.from(document.querySelectorAll('*')).map(el => {
            const key = Object.keys(el).filter(keyName => keyName.includes('__reactContainer'))
                .at(-1);
            return el[key];
        })
            .filter(key => key);

        for (const root of internalRoots) {
            const seen = new Map();
            const stores = new Set();

            const search = obj => {
                if (seen.has(obj)) {
                    return;
                }
                seen.set(obj, true);

                for (const name in obj) {
                    if (name === 'getState') {
                        const store = obj;
                        const state = store.getState();
                        if (state?.scratchGui?.vm && state.scratchPaint && state.locales) {
                            return store; // Found target store
                        }
                        stores.add(obj);
                    }

                    // eslint-disable-next-line no-prototype-builtins
                    if ((obj?.hasOwnProperty?.(name)) && (typeof obj[name] === 'object') && (obj[name] !== null)) {
                        const result = search(obj[name]);
                        if (result) return result; // Propagate found store
                    }
                }
            };

            const result = search(root);
            if (result) return result.getState().scratchGui.vm;
        }
        return null;
    }

    // 辅助函数：将文件转换为base64
    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                // 如果需要确保是PNG格式，可以在这里处理
                const base64Data = e.target.result;

                // 如果是其他格式，转换为PNG
                if (!file.type.includes('png')) {
                    convertToPNG(base64Data).then(resolve).catch(reject);
                } else {
                    resolve(base64Data);
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    }

    // 将任意图片格式转换为PNG格式的base64
    function convertToPNG(base64Data) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('无法创建canvas上下文'));
                    return;
                }

                // 绘制图片到canvas
                ctx.drawImage(img, 0, 0);

                // 转换为PNG格式的base64
                const pngBase64 = canvas.toDataURL('image/png');
                resolve(pngBase64);
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            img.src = base64Data;
        });
    }
})();
