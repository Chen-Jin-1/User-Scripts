// ==UserScript==
// @name                CSS 合集
// @namespace           cj-css-set
// @match               https://www.ccw.site/*
// @match               https://turbowarp.org/*
// @grant               none
// @version             1.0.0
// @author              Chen-Jin
// @description         CSS 注入脚本集合
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @downloadURL         https://us.chen-jin.dpdns.org/cssSet.user.js
// @run-at              document-start
// ==/UserScript==
const x = document.createElement("style")
x.innerHTML = `.ReactModal__Overlay.ReactModal__Overlay--after-open.gandi_webgl-modal_modal-overlay_2yidY, .ReactModal__Overlay.ReactModal__Overlay--after-open.browser-modal_modal-overlay_3TDyF {display: none}
div[class*="action-control-"] {visibility: visible !important;}
.leftContent-3zu6j>p, .bioDisplay-3PigT, .signature-1K1p- {max-height: 10vh; overflow-y: scroll}
li:has([data-testid="ExtensionOutlinedIcon"])+li:has([data-testid="DeleteForeverOutlinedIcon"]){display:none}`;
document.head.appendChild(x);