// ==UserScript==
// @name         获取axios
// @version      1.0.1
// @description  获取 CCW 的 Axios
// @author       不想上学 & Chen-Jin
// @match        https://www.ccw.site/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
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
})()
