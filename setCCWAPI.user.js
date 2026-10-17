// ==UserScript==
// @name                拦截 CCW API
// @namespace           cj-set-ccw-api
// @match               https://www.ccw.site/detail/*
// @version             1.0.5
// @author              Chen-Jin
// @description         修改社区扩展积木返回值
// @icon                https://m.ccw.site/user_projects_assets/a6edfa0f6b8dda2fc126d847989c94ba.svg
// @downloadURL         https://us.chen-jin.dpdns.org/setCCWAPI.user.js
// @run-at              document-start
// ==/UserScript==

const config = {}, _bind = Function.prototype.bind;
Function.prototype.bind = function(thisArg, ...args) {
    if (thisArg && thisArg.runtime && thisArg.greenFlag) {
        let cca = {};
        const { ccwAPI } = thisArg.runtime,
            lock = (p, v) => Object.defineProperty(cca, p, {
                get: () => v,
                set() {},
            }),
            hook = ccwAPI => {
                lock('isFollowed', async (arg) => {
                    console.log(`是 ${arg} 粉丝`);
                    return true;
                });
                lock('isMyFans', async () => {
                    console.log(`是作者粉丝`);
                    return true;
                });
                lock('isLiked', async () => {
                    console.log(`已点赞`);
                    return true;
                });
                // lock('redirect', async (arg) => {
                //     console.log(`跳转到 https://ccw.site/${arg}`);
                //     return true;
                // });
                lock('requestCoins', async (arg) => {
                    console.log(`请求投 ${arg} 币`);
                    return true;
                });
                lock('requestFollow', async () => {
                    console.log(`请求关注作者`);
                    return true;
                });
                lock('getCoinCount', async () => {
                    if (!config.hasOwnProperty("coins")) {
                        const p = prompt("获取投币数修改为"), c = +p;
                        config.coins = isNaN(c) || (p !== '0' && c === 0) ? Infinity : c;
                    }
                    console.log(`获取投币数 为 ${config.coins}`);
                    return config.coins;
                });
                lock('isLikedProject', async (arg) => {
                    console.log(`作品 ${arg} 是否点赞`);
                    return true;
                });
                lock('isFavoriteProject', async (arg) => {
                    console.log(`作品 ${arg} 是否收藏`);
                    return true;
                });
                console.log("钩", ccwAPI);
            };
        Object.defineProperty(runtime, 'ccwAPI', {
            get: () => cca,
            set: v => hook(cca = v),
        });
        Function.prototype.bind = _bind;
    }
    return _bind.call(this, thisArg, ...args);
};