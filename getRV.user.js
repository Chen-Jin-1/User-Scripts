// ==UserScript==
// @name                获取 Runtime & VM
// @namespace           cj-get-rv
// @match               https://www.ccw.site/detail/*
// @match               https://www.ccw.site/gandi*
// @match               https://www.ccw.site/creator/*
// @match               https://www.ccw.site/player/*
// @grant               none
// @version             1.0.1
// @author              Chen-Jin
// @description         获取 Scratch Runtime 和 vm
// @icon                https://m.ccw.site/user_projects_assets/6df19377-8e84-4929-9e9c-93ddca968dcc.png
// @updateURL           https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRV.user.js
// @downloadURL         https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRV.user.js
// @run-at              document-start
// ==/UserScript==

var x = setInterval(() => {
    if (window.Scratch && Scratch.runtime) {
        clearInterval(x);
        console.log("runtime", window.rt = Scratch.runtime);
        console.log("vm", window.vm = Scratch.runtime.extensionManager.vm);
    }
});
