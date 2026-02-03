// ==UserScript==
// @name                智能个签
// @namespace           cj-smart-bio
// @match               https://www.ccw.site/*
// @grant               none
// @version             1.0.0
// @author              Chen-Jin
// @description         防止个签过长，影响个签观感
// @icon                https://m.ccw.site/user_projects_assets/6df19377-8e84-4929-9e9c-93ddca968dcc.png
// @updateURL           https://us.chen-jin.dpdns.org/smartBio.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/smartBio.user.js
// @run-at              document-start
// ==/UserScript==
var x = document.createElement("style")
x.innerHTML = '.leftContent-3zu6j>p, .bioDisplay-3PigT, .signature-1K1p- {max-height: 10vh; overflow-y: scroll}';
document.head.appendChild(x);
