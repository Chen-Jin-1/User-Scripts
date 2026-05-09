// ==UserScript==
// @name         函数备份
// @namespace    cj-func-backup
// @version      1.0.1
// @description  在任何网站上保留原先函数或对象
// @match        *://*/*
// @run-at       document-start
// @icon         https://m.ccw.site/user_projects_assets/c2bf0912-a904-4c43-af80-e5b8d4912049.png?x-oss-process=image/circle,r_1000
// @author       Chen-Jin
// @updateURL    https://us.chen-jin.dpdns.org/funcBackup.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/funcBackup.user.js
// @grant        none
// ==/UserScript==

const functions = ["fetch", "XMLHttpRequest.prototype.open", "XMLHttpRequest.prototype.send", "console", "open"];
functions.forEach(_ => {
    const parts = _.split('.');
    let target = window;
    
    for (let i = 0; i < parts.length; i++) {
        if (!target) return;
        target = target[parts[i]];
    }
    
    const f = target;
    f && console.log("backup", _, window["_" + _.replaceAll(".", "_")] = typeof f === "object" ? {...f} : f);
});