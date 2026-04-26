// ==UserScript==
// @name         计时器报废器
// @namespace    cj-timer-breaker
// @version      1.0.0
// @description  阻止编辑器立即运行代码
// @match        https://www.ccw.site/gandi*
// @run-at       document-start
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @updateURL    https://us.chen-jin.dpdns.org/extensionBreaker.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/extensionBreaker.user.js
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

let timer, menu, clock;
const fakeTimer = () => -Infinity;

const _bind = Function.prototype.bind;
Function.prototype.bind = function(thisArg, ...args) {
    if (thisArg && thisArg.runtime && thisArg.greenFlag) {
        clock = thisArg.runtime.ioDevices.clock;
        timer = clock.projectTimer;
        sTimer();
    }
    return _bind.call(this, thisArg, ...args);
};

const sTimer = () => {
    clock.projectTimer = fakeTimer;
    GM_unregisterMenuCommand(menu);
    menu = GM_registerMenuCommand('恢复计时器', rTimer);
}

const rTimer = () => {
    clock.projectTimer = timer;
    GM_unregisterMenuCommand(menu);
    menu = GM_registerMenuCommand('毁灭计时器', sTimer);
}