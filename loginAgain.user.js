// ==UserScript==
// @name                恢复登录
// @namespace           cj-login-again
// @version             1.0.1
// @description         掉登后点击按钮即可自动登录
// @author              Chen-Jin
// @match               https://*.ccw.site/*
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://us.chen-jin.dpdns.org/loginAgain.user.js?
// @downloadURL         https://us.chen-jin.dpdns.org/loginAgain.user.js?
// @run-at              document-idle
// @grant               GM_registerMenuCommand
// ==/UserScript==

GM_registerMenuCommand("恢复登录", () => {
    document.cookie = "cookie-user-id=0;path=/";
    location.reload();
});