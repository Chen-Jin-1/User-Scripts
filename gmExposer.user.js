// ==UserScript==
// @name         挂载 GM 函数
// @namespace    cj-gm-exposer
// @version      1.0.0
// @description  挂载所有 GM_* 函数
// @author       Chen-Jin
// @match        *://*/*
// @grant        GM_addElement
// @grant        GM_addStyle
// @grant        GM_addValueChangeListener
// @grant        GM_cookie
// @grant        GM_deleteValue
// @grant        GM_deleteValues
// @grant        GM_download
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @grant        GM_getValue
// @grant        GM_getValues
// @grant        GM_info
// @grant        GM_listValues
// @grant        GM_log
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_removeValueChangeListener
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_setValues
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @icon         https://www.chen-jin.dpdns.org/Chen-Jin-circle.png
// @updateURL    https://us.chen-jin.dpdns.org/gmExposer.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/gmExposer.user.js
// ==/UserScript==

unsafeWindow.GMF = {
    GM_addElement,
    GM_addStyle,
    GM_addValueChangeListener,
    GM_cookie,
    GM_deleteValue,
    GM_deleteValues,
    GM_download,
    GM_getResourceText,
    GM_getResourceURL,
    GM_getValue,
    GM_getValues,
    GM_info,
    GM_listValues,
    GM_log,
    GM_notification,
    GM_openInTab,
    GM_registerMenuCommand,
    GM_removeValueChangeListener,
    GM_setClipboard,
    GM_setValue,
    GM_setValues,
    GM_unregisterMenuCommand,
    GM_xmlhttpRequest
};