// ==UserScript==
// @name         显示关注动态
// @version      1.0.0
// @description  在个人动态显示关注动态
// @match        https://www.ccw.site/student/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @downloadURL  https://us.chen-jin.dpdns.org/showFollowingFeed.user.js
// @author       Chen-Jin
// @grant        none
// ==/UserScript==
const _open = XMLHttpRequest.prototype.open,
    _send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u === "https://community-web.ccw.site/feed/list") this.send = b => {
        const _ = JSON.parse(b);
        _.types.push("FOLLOWING");
        _send.call(this, JSON.stringify(_));
    }
    return _open.call(this, m, u, a);
}