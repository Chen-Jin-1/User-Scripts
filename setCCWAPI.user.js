// ==UserScript==
// @name                挟持 CCW API
// @namespace           cj-set-ccw-api
// @match               https://www.ccw.site/detail/*
// @grant               none
// @version             1.0.1
// @author              Chen-Jin
// @description         防止作品使用连接社区扩展骗币等
// @icon                https://m.ccw.site/user_projects_assets/6df19377-8e84-4929-9e9c-93ddca968dcc.png
// @updateURL           https://bgithub.xyz/Chen-Jin-1/User-Scripts/raw/refs/heads/main/setCCWAPI.user.js
// @downloadURL         https://bgithub.xyz/Chen-Jin-1/User-Scripts/raw/refs/heads/main/setCCWAPI.user.js
// @run-at              document-start
// ==/UserScript==

var config = {
    // 可修改此对象
    coins: 1000, // 投币数
};

function getCCWAPI() {
    return new Promise(resolve => {
        var x = setInterval(() => {
            if (window.Scratch?.runtime?.ccwAPI?.isFollowed) {
                clearInterval(x);
                resolve(Scratch.runtime.ccwAPI);
            }
        })
    })
}

(async function() {
    var ccwAPI = await getCCWAPI();
    console.log("挟持 CCW API 脚本已获取到 CCW API 并挟持");
    setInterval(() => {
        ccwAPI.isFollowed = async (arg) => {
            console.log(`已挟持 是 ${arg} 粉丝`);
            return true;
        };
        ccwAPI.isMyFans = async () => {
            console.log(`已挟持 是作者粉丝`);
            return true;
        };
        ccwAPI.isLiked = async () => {
            console.log(`已挟持 已点赞`);
            return true;
        };
        ccwAPI.redirect = async (arg) => {
            console.log(`已挟持 跳转到 https://ccw.site/${arg}`);
            return true;
        };
        ccwAPI.requestCoins = async (arg) => {
            console.log(`已挟持 请求投 ${arg} 币`);
            return true;
        };
        ccwAPI.requestFollow = async () => {
            console.log(`已挟持 请求关注作者`);
            return true;
        };
        ccwAPI.getCoinCount = async () => {
            console.log(`已挟持 获取投币数 为 ${config.coins}`);
            return config.coins;
        };
        ccwAPI.isLikedProject = async (arg) => {
            console.log(`已挟持 点赞作品 ${arg}`);
            return true;
        };
        ccwAPI.isFavoriteProject = async (arg) => {
            console.log(`已挟持 收藏作品 ${arg}`);
            return true;
        };
    }, 1000);
})();
