// ==UserScript==
// @name         反 CCW CSP
// @namespace    cj-un-ccw-csp
// @version      1.0.1
// @description  防止 HCN 出的馊主意导致 CCW 作品、扩展异常
// @match        https://www.ccw.site/*
// @run-at       document-start
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/unccwcsp.user.js
// ==/UserScript==

const originalPrepend = Element.prototype.prepend;
document.head.prepend = function(...nodes) {
    for (const node of nodes) if (node?.tagName === 'META' && node.getAttribute('http-equiv') === 'Content-Security-Policy') return;
    return originalPrepend.call(document.head, ...nodes);
};