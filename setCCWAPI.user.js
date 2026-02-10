// ==UserScript==
// @name                修改 CCW API
// @namespace           cj-set-ccw-api
// @match               https://www.ccw.site/detail/*
// @version             1.0.4
// @author              Chen-Jin
// @description         只对连接社区扩展的一些功能有效
// @icon                https://zhishi.oss-cn-beijing.aliyuncs.com/user_projects_assets/a6edfa0f6b8dda2fc126d847989c94ba.svg
// @updateURL           https://us.chen-jin.dpdns.org/setCCWAPI.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/setCCWAPI.user.js
// @run-at              document-start
// ==/UserScript==

const config = {
    coins: 1000, // 修改后的投币数
};

function getCCWAPI() {
    return new Promise(resolve => {
        const x = setInterval(() => {
            if (window.Scratch?.runtime?.ccwAPI?.isFollowed) {
                clearInterval(x);
                resolve(Scratch.runtime.ccwAPI);
            }
        })
    })
}

(async function() {
    const ccwAPI = await getCCWAPI();
    console.log("setCCWAPI 已获取到 CCWAPI");
    setInterval(() => {
        ccwAPI.isFollowed = async (arg) => {
            console.log(`是 ${arg} 粉丝`);
            return true;
        };
        ccwAPI.isMyFans = async () => {
            console.log(`是作者粉丝`);
            return true;
        };
        ccwAPI.isLiked = async () => {
            console.log(`已点赞`);
            return true;
        };
        // ccwAPI.redirect = async (arg) => {
        //     console.log(`跳转到 https://ccw.site/${arg}`);
        //     return true;
        // };
        ccwAPI.requestCoins = async (arg) => {
            console.log(`请求投 ${arg} 币`);
            return true;
        };
        ccwAPI.requestFollow = async () => {
            console.log(`请求关注作者`);
            return true;
        };
        ccwAPI.getCoinCount = async () => {
            console.log(`获取投币数 为 ${config.coins}`);
            return config.coins;
        };
        ccwAPI.isLikedProject = async (arg) => {
            console.log(`作品 ${arg} 是否点赞`);
            return true;
        };
        ccwAPI.isFavoriteProject = async (arg) => {
            console.log(`作品 ${arg} 是否收藏`);
            return true;
        };
    }, 1000);
})();
