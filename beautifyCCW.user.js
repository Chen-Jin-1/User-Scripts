// ==UserScript==
// @name         CCW 美化
// @namespace    cj-beautify-ccw
// @version      1.0.0
// @description  美化 CCW UI
// @match        https://*.ccw.site/*
// @run-at       document-start
// @icon         https://m.ccw.site/user_projects_assets/c2bf0912-a904-4c43-af80-e5b8d4912049.png?x-oss-process=image/circle,r_1000
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/beautifyCCW.user.js
// @grant        none
// ==/UserScript==

const s = new CSSStyleSheet();
s.replaceSync(`.container-3vlMF {
    background: #ffffff40;
    backdrop-filter: blur(5px);
}
.rc-dialog-content {
    background: transparent !important;
}
.menu-item-26NVJ:hover {
    background: #14141f50;
}
.container-3NtvT.user-select-1UO1P {
    background: #20202a80;
    backdrop-filter: blur(5px);
}
.calendar-3LCFs {
    background: #ffffff50;
}
.statistics-LwBpK {
    background: #fff1dc80;
}
.tabs-item-2SCdu {
    color: #999;
}
.tabs-item-active-14Up0 {
    color: #fff;
}
.task-3LLP2, .contract-item-2yRq0 {
    background: #ffffff30;
}
.view-normal-1wU49:not(:hover)>* {
    color: #ffffff60 !important;
}
.ccw-modal-body, .login-fqrdY {
    background: #00000040 !important;
    backdrop-filter: blur(5px);
}
.head-3_uvV {
    background: transparent;
    border-bottom: 1px solid #ffffff20;
}
.input-2S6hi, .button-EeCjR:disabled {
    background: #22222280 !important;
}
@keyframes cj-show {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes cj-hide {
    from { opacity: 0; }
    to { opacity: 1; }
}
.c-modal-root-container, .rd-modal-root-container {
    backdrop-filter: blur(5px);
    transition-duration: .3s ease-in;
    animation: cj-show .3s ease-out forwards;
}
.c-modal-container, .rd-modal-container {
    background: #20202a50;
}
.c-modal-root-container:has(.c-modal-exit), .rd-modal-root-container:has(.rd-modal-exit) {
    opacity: 0;
    backdrop-filter: unset;
}
.user-select-1UO1P {
    left: 50% !important;
    transition: all .3s !important;
    pointer-events: none;
    opacity: 0 !important;
}
.user-center-2T9j9:hover > .user-select-1UO1P {
    pointer-events: auto;
    opacity: 1 !important;
}
.user-center-2T9j9::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 30px;
    background: transparent;
    z-index: 2;
    cursor: default;
    pointer-events: none;
}
.user-center-2T9j9:hover::after {
    pointer-events: auto;
}
.rd-toast-container {
    background: #ffffff40;
    backdrop-filter: blur(5px);
}
.rd-toast-container > span {
    color: white;
}
.displayNone {
    display: unset !important;
    opacity: 0 !important;
    pointer-events: none !important;
}
.actionSheet-ScqOS {
    transition-duration: 0.3s;
}
.ghost-2DGBD:after {
    animation: cj-show .3s ease-out forwards;
}
.list-2lTGp {
    background: #2d2d3850;
    backdrop-filter: blur(5px);
}
`);
document.adoptedStyleSheets.push(s);