// ==UserScript==
// @name         反 CSP Meta
// @namespace    cj-un-ccw-csp
// @version      1.0.0
// @description  阻止 CCW 神人运维写的 CSP meta 添加导致作品异常
// @match        https://www.ccw.site/*
// @run-at       document-start
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/unccwcsp.user.js
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

const originalPrepend = Element.prototype.prepend;
document.head.prepend = function(...nodes) {
    for (const node of nodes) if (node?.tagName === 'META' && node.getAttribute('http-equiv') === 'Content-Security-Policy') return;
    return originalPrepend.call(document.head, ...nodes);
};