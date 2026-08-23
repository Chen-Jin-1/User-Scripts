// ==UserScript==
// @name         挂载 GM API Lite
// @namespace    cj-gm-exposer-lite
// @version      1.0.0
// @description  更少函数，只为兼容 Via
// @author       Chen-Jin
// @match        *://*/*
// @grant        GM_addElement
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_download
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @icon         https://www.chen-jin.dpdns.org/Chen-Jin-circle.png
// @downloadURL  https://us.chen-jin.dpdns.org/gmExposerLite.user.js
// ==/UserScript==

unsafeWindow.GMF = {
    GM_addElement,
    GM_addStyle,
    GM_deleteValue,
    GM_download,
    GM_getResourceText,
    GM_getResourceURL,
    GM_getValue,
    GM_listValues,
    GM_registerMenuCommand,
    GM_setClipboard,
    GM_setValue,
    GM_unregisterMenuCommand,
    GM_xmlhttpRequest
};