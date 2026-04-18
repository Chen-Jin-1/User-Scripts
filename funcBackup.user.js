// ==UserScript==
// @name         函数备份
// @namespace    cj-func-backup
// @version      1.0.0
// @description  在任何网站上保留原先函数或对象
// @match        *://*/*
// @run-at       document-start
// @icon         
// @author       Chen-Jin
// @updateURL    https://us.chen-jin.dpdns.org/funcBackup.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/funcBackup.user.js
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