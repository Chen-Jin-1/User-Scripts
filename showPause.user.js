// ==UserScript==
// @name                显示暂停
// @namespace           cj-show-pause
// @match               https://www.ccw.site/detail/*
// @grant               none
// @version             1.0.2
// @author              Chen-Jin
// @description         使费米隐藏暂停失效
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://us.chen-jin.dpdns.org/showPause.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/showPause.user.js
// ==/UserScript==

const style = document.createElement('style');
style.textContent = 'div[class*="action-control-"] {visibility: visible !important;}';
document.head.appendChild(style);