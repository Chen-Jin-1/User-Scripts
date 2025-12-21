// ==UserScript==
// @name         获取 Axios
// @version      1.0.2
// @description  获取 CCW 的 Axios
// @author       不想上学 & Chen-Jin
// @match        https://*.ccw.site/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @updateURL    https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getAxios.user.js
// @downloadURL  https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getAxios.user.js
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function(){
    const _apply = Function.prototype.apply;
    Function.prototype.apply = function(thisArg, args) {
        if (typeof thisArg === "object" && thisArg && thisArg.defaults && thisArg.interceptors && thisArg.interceptors.request.handlers.length > 0) {
            console.log("axios", unsafeWindow.axios = thisArg);
            Function.prototype.apply = _apply;
        }
        return _apply.call(this, thisArg, args);
    };
})();;
