// ==UserScript==
// @name              扩展报废器
// @namespace         cj-extensions-destroyer
// @version           1.0.0
// @description       远离恶意扩展
// @author            Chen-Jin
// @match             https://www.ccw.site/player/*
// @match             https://www.ccw.site/detail/*
// @match             https://www.ccw.site/gandi*
// @icon              https://m.ccw.site/community/images/logo-ccw.png
// @updateURL         https://us.chen-jin.dpdns.org/extensionsDestroyer.user.js?
// @downloadURL       https://us.chen-jin.dpdns.org/extensionsDestroyer.user.js?
// @run-at            document-start
// ==/UserScript==

const x = setInterval(() => {
    if (window.Scratch?.runtime) {
        clearInterval(x);
        console.log("runtime", window.rt = Scratch.runtime);
        console.log("vm", window.vm = Scratch.runtime.extensionManager.vm);
    }
}, 100);