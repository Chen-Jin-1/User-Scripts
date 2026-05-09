// ==UserScript==
// @name         防误删扩展
// @namespace    cj-func-backup
// @version      1.0.0
// @description  隐藏扩展删除按钮
// @match        https://www.ccw.site/gandi/extension*
// @run-at       document-body
// @icon         https://m.ccw.site/user_projects_assets/c2bf0912-a904-4c43-af80-e5b8d4912049.png?x-oss-process=image/circle,r_1000
// @author       Chen-Jin
// @updateURL    https://us.chen-jin.dpdns.org/preventExtensionDelete.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/preventExtensionDelete.user.js
// @grant        none
// ==/UserScript==

const s = document.createElement('style');
s.textContent = 'li:has([data-testid="ExtensionOutlinedIcon"])+li:has([data-testid="DeleteForeverOutlinedIcon"]){display:none}';
document.head.appendChild(s);