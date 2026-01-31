// ==UserScript==
// @name         自动签到
// @version      1.0.0
// @description  在 CCW 自动签到
// @author       Chen-Jin
// @match        https://www.ccw.site/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @updateURL    https://us.chen-jin.dpdns.org/autoCheckIn.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/autoCheckIn.user.js
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

const _apply = Function.prototype.apply;
Function.prototype.apply = function(thisArg, args) {
    if (typeof thisArg === "object" && thisArg && thisArg.defaults && thisArg.interceptors && thisArg.interceptors.request.handlers.length > 0) {
        Function.prototype.apply = _apply;
        (async (axios) => {
            try {
                await axios.post("https://community-web.ccw.site/check_in_record/insert", {scene: 'HOMEPAGE'});
            } catch(e) {
                console.error(e);
            }

        })(thisArg);
    }
    return _apply.call(this, thisArg, args);
};
