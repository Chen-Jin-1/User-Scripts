// ==UserScript==
// @name                获取 Runtime & VM
// @namespace           cj-get-rv
// @match               https://www.ccw.site/detail/*
// @match               https://www.ccw.site/gandi/*
// @match               https://www.ccw.site/creator/*
// @match               https://www.ccw.site/player/*
// @grant               none
// @version             1.0.0
// @author              Chen-Jin
// @description         获取 CCW 的 Runtime 和 vm，供开发用
// @icon                https://m.ccw.site/user_projects_assets/6df19377-8e84-4929-9e9c-93ddca968dcc.png
// @updateURL           https://bgithub.xyz/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRV.user.js
// @downloadURL         https://bgithub.xyz/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getRV.user.js
// @run-at              document-start
// ==/UserScript==

function getRuntime() {
    return new Promise(resolve => {
        var x = setInterval(() => {
            if (window.Scratch && Scratch.runtime) {
                clearInterval(x);
                resolve(Scratch.runtime);
            }
        })
    })
}

getRuntime().then(rt => {
    console.log("已获取到 Runtime", window.rt = rt, "VM", window.vm = rt.extensionManager.vm);
});
