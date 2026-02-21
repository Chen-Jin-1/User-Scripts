// ==UserScript==
// @name         拦截CCW的个人隐私API
// @namespace    https://qm.qq.com/q/j0y9kktZ4s
// @version      1.3.1
// @description  拦截个人隐私
// @author       娅
// @match        https://www.ccw.site/detail/*
// @match        https://www.ccw.site/player/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let vm = null;
    let interceptCount = 0;
    const interceptApiList = [
        "https://sso.ccw.site/web/auth/logout",
        "https://community-web.ccw.site/students/self/detail",
        "https://community-web.ccw.site/study-community/member/detail",
        "https://community-web.ccw.site/locked_user/detail",
        "https://community-web.ccw.site/students/profile",
        "https://community-web.ccw.site/creation/student/detail",
        "https://community-web.ccw.site/students/update",
        "https://community-web.ccw.site/study-trade/trade/donate",
        "https://community-web.ccw.site/currency/account/personal",
        "https://community-web.ccw.site/students/creator_score"
    ];
    const interceptApiRegex = new RegExp(
        interceptApiList.map(api => api.replace(/\//g, '\\/').replace(/\./g, '\\.'))
        .join('|'), 'i'
    );

    //param {Object} vmInstance - VM实例
    //@returns {Boolean} 是否加载完成
    function isProjectLoaded(vmInstance) {
        if (!vmInstance || !vmInstance.runtime) return false;
        const conditions = [
            vmInstance.runtime._loaded === true,
            vmInstance.runtime.targets.length > 0 && vmInstance.runtime.getTargetForStage(),//角色资源
            !!vmInstance.runtime.projectData,//项目数据
            !!vmInstance.runtime._steppingInterval
        ];
        return conditions.some(condition => condition);
    }
    async function waitForProjectLoaded(vmInstance, timeout = 30000) {
        const startTime = Date.now();
        return new Promise((resolve, reject) => {
            const checkLoaded = () => {
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`作品加载超时（${timeout/1000}秒）`));
                    return;
                }
                if (isProjectLoaded(vmInstance)) {
                    console.log("作品完成加载");
                    resolve(vmInstance);
                    return;
                }
                setTimeout(checkLoaded, 100);
            };

            checkLoaded();
        });
    }
    //获取vm实例
    async function getVM() {
        if (self.eureka?.vm) {
            return Promise.resolve(self.eureka.vm);
        }
        if (document.readyState === 'complete') {
            const store = getReduxStoreFromDOM();
            if (store?.getState()?.scratchGui?.vm) {
                return store.getState().scratchGui.vm;
            }
        }
        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("获取VM超时（15秒）")), 15000);
            const originalBind = Function.prototype.bind;

            Function.prototype.bind = function (self2, ...args) {
                if (self2 && typeof self2 === 'object' && 'editingTarget' in self2 && 'runtime' in self2) {
                    clearTimeout(timeout);
                    Function.prototype.bind = originalBind;//恢复原生方法
                    resolve(self2);
                    return originalBind.call(this, self2, ...args);
                }
                return originalBind.call(this, self2, ...args);
            };
        });
    }

    function getReduxStoreFromDOM() {
        const internalRoots = Array.from(document.querySelectorAll('*')).map(el => {
            const reactKey = Object.keys(el).find(k => k.includes('__reactContainer') || k.includes('__reactInternalInstance'));
            return reactKey ? el[reactKey] : null;
        }).filter(Boolean);
        const searchStore = (obj, seen = new WeakSet()) => {
            if (seen.has(obj)) return null;
            seen.add(obj);
            if (obj && typeof obj === 'object' && typeof obj.getState === 'function') {
                try {
                    const state = obj.getState();
                    if (state?.scratchGui?.vm) return obj;
                } catch (e) {}
            }

            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const result = searchStore(obj[key], seen);
                    if (result) return result;
                }
            }
            return null;
        };

        for (const root of internalRoots) {
            const store = searchStore(root);
            if (store) return store;
        }
        return null;
    }
    //👇API拦截器👇
    function initFullApiInterceptor() {
        console.log("隐私API拦截器启用");

        //拦截XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const originalXhrSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._isInterceptTarget = interceptApiRegex.test(url);
            if (this._isInterceptTarget) {
                interceptCount++;
                console.log(`已拦截${interceptCount}条个人隐私API [XHR]：${url}`);
            }
            return originalXhrOpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function(...rest) {
            if (this._isInterceptTarget) {
                this.abort();
                return;
            }
            return originalXhrSend.call(this, ...rest);
        };

        //拦截fetch
        const originalFetch = window.fetch;
        window.fetch = function(input, ...rest) {
            const url = typeof input === 'string' ? input : input.url;
            if (interceptApiRegex.test(url)) {
                interceptCount++;
                console.log(`已拦截${interceptCount}条个人隐私API [fetch]：${url}`);
                return Promise.reject(new Error(`[拦截成功] 隐私API：${url}`));
            }
            return originalFetch.call(window, input, ...rest);
        };

        //拦截axios
        const watchAxios = () => {
            if (window.axios) {
                const originalAxiosRequest = window.axios.request;
                window.axios.request = function(config) {
                    const url = config.url;
                    if (url && interceptApiRegex.test(url)) {
                        interceptCount++;
                        console.log(`已拦截${interceptCount}条个人隐私API [axios]：${url}`);
                        return Promise.reject(new Error(`[拦截成功] 隐私API：${url}`));
                    }
                    return originalAxiosRequest.call(this, config);
                };
                ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
                    const originalMethod = window.axios[method];
                    window.axios[method] = function(url, config) {
                        if (interceptApiRegex.test(url)) {
                            interceptCount++;
                            console.log(`已拦截${interceptCount}条个人隐私API [axios-${method}]：${url}`);
                            return Promise.reject(new Error(`[拦截成功] 隐私API：${url}`));
                        }
                        return originalMethod.call(this, url, config);
                    };
                });
            } else {
                setTimeout(watchAxios, 100);
            }
        };
        watchAxios();

        //拦截iframe/worker中的请求
        const originalURL = window.URL;
        window.URL = function(url, ...rest) {
            if (url && interceptApiRegex.test(url)) {
                interceptCount++;
                console.log(`已拦截${interceptCount}条个人隐私API ：${url}`);
                return new originalURL('about:blank', ...rest);
            }
            return new originalURL(url, ...rest);
        };
        window.URL.prototype = originalURL.prototype;
    }

    async function main() {
        try {
            let retryCount = 0;
            while (!vm && retryCount < 3) {
                try {
                    vm = await getVM();
                } catch (e) {
                    retryCount++;
                    console.warn(`VM获取失败 第${retryCount}次重试：`, e.message);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (!vm) {
                console.error("⚠️VM获取失败⚠️\n 脚本未启用");
                return;
            }

            console.log("等待作品完成加载");
            try {
                await waitForProjectLoaded(vm, 20000);
            } catch (e) {
                console.error("作品加载失败", e.message);
                return;
            }
            console.log("初始化API拦截器");
            initFullApiInterceptor();

        } catch (error) {
            console.error("脚本异常 ：", error);
        }
    }

    main();

})();