// ==UserScript==
// @name         摘帽
// @namespace    cj-hats-breaker
// @version      1.0.0
// @description  阻止利用帽子块立即运行代码
// @match        https://www.ccw.site/gandi*
// @run-at       document-start
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/hatsBreaker.user.js
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

let menuId;
const main = rt => {
    const hats = rt._hats,
        proxy = new Proxy(hats, { get: (target, prop) => ({ ...target?.[prop], edgeActivated: false }) }),
        toProxy = () => {
            rt._hats = proxy;
            GM_unregisterMenuCommand(menuId);
            menuId = GM_registerMenuCommand("戴帽", toObject);
        },
        toObject = () => {
            rt._hats = hats;
            GM_unregisterMenuCommand(menuId);
            menuId = GM_registerMenuCommand("摘帽", toProxy);
        };
    toProxy();
};

if (window.rt) {
    main(rt);
} else {
    const _bind = Function.prototype.bind;
    Function.prototype.bind = function(thisArg, ...args) {
        if (thisArg && thisArg.runtime && thisArg.greenFlag) {
            main(thisArg.runtime);
            Function.prototype.bind = _bind;
        }
        return _bind.call(this, thisArg, ...args);
    };
}