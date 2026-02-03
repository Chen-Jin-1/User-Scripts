// ==UserScript==
// @name                隐藏警告
// @namespace           cj-hide-warn
// @match               https://www.ccw.site/gandi/*
// @match               https://www.ccw.site/gandi
// @match               https://turbowarp.org/*
// @grant               none
// @version             1.0.0
// @author              Chen-Jin
// @description         隐藏 Gandi 和 TurboWarp 中不支持 WebGL 警告
// @icon                https://m.ccw.site/user_projects_assets/6df19377-8e84-4929-9e9c-93ddca968dcc.png
// @updateURL           https://us.chen-jin.dpdns.org/hideWarn.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/hideWarn.user.js
// @run-at              document-start
// ==/UserScript==

var x = document.createElement("style")
x.innerHTML = '.ReactModal__Overlay.ReactModal__Overlay--after-open.gandi_webgl-modal_modal-overlay_2yidY, .ReactModal__Overlay.ReactModal__Overlay--after-open.browser-modal_modal-overlay_3TDyF {display: none}';
document.head.appendChild(x);
