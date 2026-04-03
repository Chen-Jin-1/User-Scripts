// ==UserScript==
// @name                获取 Runtime & VM Plus
// @namespace           cj-get-rv-plus
// @match               https://www.ccw.site/*
// @grant               none
// @version             1.0.0
// @author              Chen-Jin
// @description         获取 Scratch Runtime 和 vm
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRVPlus.user.js
// @downloadURL         https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRVPlus.user.js
// @run-at              document-start
// ==/UserScript==

const _bind = Function.prototype.bind;
Function.prototype.bind = function(thisArg, ...args) {
    if (thisArg && thisArg.runtime && thisArg.greenFlag) {
        console.log("vm", vm = thisArg);
        console.log("runtime", runtime = rt = vm.runtime)
        Function.prototype.bind = _bind;
    }
    return _bind.call(this, thisArg, ...args);
};