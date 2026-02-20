// ==UserScript==
// @name         无视黑名单
// @version      1.0.0
// @description  在ccw无视黑名单
// @match        https://*.ccw.site/*
// @author       不想上学
// @run-at       document-start
// ==/UserScript==
(function () {
    'use strict';
    function patch(obj, p, fn) {
        if (obj[p]) obj[p] = fn(obj[p])
    }
    const XHR = XMLHttpRequest.prototype;
    patch(XHR, "open", _open => function (method, url) {
        if (url == "https://community-web.ccw.site/student/block_record/status") {
                return _open.call(
                    this,
                    method,
                    'data:application/json,{"body":"NOT_BLOCKED","code":"200","msg":null,"status":200}'
                );
            }
        return _open.call(this, ...arguments);
    });
})()