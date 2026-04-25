// ==UserScript==
// @name         扩展报废器
// @namespace    cj-extension-breaker
// @version      0.0.1
// @description  阻止恶意扩展加载
// @match        https://www.ccw.site/detail/*
// @match        https://www.ccw.site/player/*
// @match        https://www.ccw.site/gandi*
// @run-at       document-body
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @updateURL    https://us.chen-jin.dpdns.org/extensionBreaker.user.js
// @downloadURL  https://us.chen-jin.dpdns.org/extensionBreaker.user.js
// ==/UserScript==

let urls;
const _then = Promise.prototype.then;
Promise.prototype.then = function(f, r) {
    return _then.call(this, v => {
        if (v?.[0]?.extensionURLs) {
            console.log(v)
            urls = v[0].extensionURLs;
            Promise.prototype.then = _then;
        }
        return f ? f(v) : v;
    }, r);
};

const _bind = Function.prototype.bind;
Function.prototype.bind = function(thisArg, ...args) {
    if (thisArg && thisArg.runtime && thisArg.greenFlag) {
        console.log('vm11', thisArg);
        const _load = thisArg.extensionManager.loadExtensionURL;
        thisArg.extensionManager.loadExtensionURL = function(x) {
            console.log(x);
            return _load.call(this, x);
        }
        
    }
    return _bind.call(this, thisArg, ...args);
};