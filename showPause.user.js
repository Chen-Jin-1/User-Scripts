// ==UserScript==
// @name                显示暂停
// @namespace           cj-show-pause
// @match               https://www.ccw.site/detail/*
// @grant               none
// @version             1.0.1
// @author              Chen-Jin
// @description         防止作品隐藏暂停按钮
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://us.chen-jin.dpdns.org/showPause.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/showPause.user.js
// ==/UserScript==

const style = document.createElement('style');
style.innerHTML = 'div[class*="action-control-"] {visibility: visible !important;}';
document.head.appendChild(style);
