// // ==UserScript==
// @name              账号管理器
// @namespace         cj-auto-check-in
// @version           0.0
// @description       快捷切换 CCW 账号
// @author            Chen-Jin
// @match             https://*.ccw.site/*
// @icon              https://m.ccw.site/community/images/logo-ccw.png
// @updateURL         https://us.chen-jin.dpdns.org/accountManager.user.js?
// @downloadURL       https://us.chen-jin.dpdns.org/accountManager.user.js?
// @grant             unsafeWindow
// @run-at            document-start
// ==/UserScript==


// fetch("https://sso.ccw.site/web/auth/login-by-password", {
//     method: 'post',
//     credentials: 'include',
//     body: JSON.stringify({
//         "loginKey": "278020881",
//         "clientCode": "STUDY_COMMUNITY",
//         "password": "!!!!!!!!!!password!!!!!!!!!",
//         "extra": "{\"device\":\"账号管理器创建\",\"browser\":\"账号管理器创建\"}"
//     }),
//     headers: {'content-type': 'application/json'},
// }).then(_ => location.reload())