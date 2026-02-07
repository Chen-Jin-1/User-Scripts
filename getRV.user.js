// ==UserScript==
// @name                获取 Runtime & VM
// @namespace           cj-get-rv
// @match               https://www.ccw.site/detail/*
// @match               https://www.ccw.site/gandi*
// @match               https://www.ccw.site/creator/*
// @match               https://www.ccw.site/player/*
// @grant               none
// @version             1.0.4
// @author              Chen-Jin
// @description         获取 Scratch Runtime 和 vm
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRV.user.js
// @downloadURL         https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRV.user.js
// @run-at              document-start
// ==/UserScript==

const x = setInterval(() => {
    if (window.Scratch?.runtime) {
        clearInterval(x);
        console.log("runtime", rt = runtime = Scratch.runtime);
        console.log("vm", vm = Scratch.runtime.extensionManager.vm);
    }
}, 100);