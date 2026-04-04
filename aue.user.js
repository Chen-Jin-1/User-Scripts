// ==UserScript==
// @name                允许未知扩展
// @namespace           cj-allow-unknown-extensions
// @match               https://www.ccw.site/detail/*
// @match               https://www.ccw.site/gandi*
// @version             1.0.0
// @author              Chen-Jin
// @description         使带有未知扩展的作品能正常运行、发布
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://us.chen-jin.dpdns.org/aue.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/aue.user.js
// @run-at              document-start
// ==/UserScript==

let urls = [], em;
const _then = Promise.prototype.then;
Promise.prototype.then = function(f, r) {
    return _then.call(this, v => {
        if (v?.[0]?.extensionURLs) {
            urls = v[0].extensionURLs;
            Promise.prototype.then = _then;
        }
        return f ? f(v) : v;
    }, r);
};

const _bind = Function.prototype.bind;
Function.prototype.bind = function(t, ...args) {
    if (t?.runtime && t.greenFlag) {
        em = t.extensionManager;
        Function.prototype.bind = _bind;
    }
    return _bind.call(this, t, ...args);
};

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, ...args) {
    const _send = this.send;
    if (u.startsWith("https://bfs-web.ccw.site/extensions/")) {
        const id = u.split("/").at(-1);
        const assetUri = urls[id] ?? em._customExtensionInfo[id]?.url;
        if (assetUri) this.send = b => {
            const _onreadystatechange = this.onreadystatechange;
            if (this.readyState === 4) this.onreadystatechange = () => {
                Object.defineProperty(this, 'responseText', {
                    get: () => JSON.stringify({
                        body: {
                            description: "此扩展已被修改为安全扩展",
                            name: id,
                            publisher: { nickname: "Chen-Jin" },
                            publisherId: 1,
                            stats: {
                                averageRating: 5,
                                mostApprovedReviews: [
                                    {
                                        commenter: {
                                            accountOid: 1,
                                            name: "Chen-Jin"
                                        },
                                        content: "扩展已被脚本修改为安全扩展",
                                    },
                                ],
                                reviewTags: [
                                    {
                                        count: 1234,
                                        tag: "安全"
                                    },
                                ]
                            },
                            versions: [
                                {
                                    assetUri,
                                    version: "changed"
                                },
                            ]
                        },
                        code: "200",
                        msg: null,
                        status: 200
                    }),
                    configurable: true,
                });
                _onreadystatechange.call(this);
            }
            return _send.call(this, b);
        };
    }

    return _open.call(this, m, u, ...args);
};