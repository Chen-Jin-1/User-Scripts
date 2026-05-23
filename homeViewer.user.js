// ==UserScript==
// @name              封禁用户主页查看器
// @namespace         cj-home-viewer
// @version           0
// @description       查看被封禁用户的主页
// @match             https://www.ccw.site/student/*
// @grant             none
// @run-at            document-start
// @icon              https://m.ccw.site/community/images/logo-ccw.png
// @author            Chen-Jin
// @updateURL         https://us.chen-jin.dpdns.org/kgDl.user.js
// @downloadURL       https://us.chen-jin.dpdns.org/kgDl.user.js
// ==/UserScript==

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u === "https://community-web.ccw.site/locked_user/detail") {
        Object.defineProperty(this, "responseText", {
            get: () => '{"body":{"locked":false},"code":"200","msg":null,"status":200}'
        });
    } else if (u === "https://community-web.ccw.site/locked_user/detail")
    return _open.call(this, m, u, a);
}