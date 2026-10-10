// ==UserScript==
// @name              账号管理器
// @namespace         cj-auto-check-in
// @version           1.2.11
// @description       快捷切换 CCW 账号
// @author            Chen-Jin
// @match             https://*.ccw.site/*
// @match             https://us.chen-jin.dpdns.org/settings/accountManager.html
// @icon              https://www.chen-jin.dpdns.org/Chen-Jin-circle.png
// @downloadURL       https://us.chen-jin.dpdns.org/accountManager.user.js?
// @grant             unsafeWindow
// @grant             GM_registerMenuCommand
// @grant             GM_unregisterMenuCommand
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_xmlhttpRequest
// @grant             GM_cookie
// @run-at            document-start
// ==/UserScript==

if (location.hostname === 'us.chen-jin.dpdns.org' || location.hostname === 'localhost') 
    try {
        return unsafeWindow.accountManager = { GM_getValue, GM_setValue, GM_xmlhttpRequest, GM_cookie };
    } catch {
        return unsafeWindow.accountManager = { GM_getValue, GM_setValue, GM_xmlhttpRequest };
    }
let accounts = GM_getValue("accounts", {}), menuId = {}, currentId;
const login = (loginKey, password, noCookies = 0) => {
    return fetch("https://sso.ccw.site/web/auth/login-by-password", {
        method: 'post',
        credentials: noCookies ? 'omit' : 'include',
        body: JSON.stringify({
            loginKey,
            password,
            clientCode: "STUDY_COMMUNITY",
            extra: JSON.stringify({
                device: GM_getValue("device", "账号管理器创建"),
                browser: GM_getValue("browser", "账号管理器创建")
            })
        }),
        headers: { 'content-type': 'application/json' },
    });
}, loginByToken = token => new Promise((resolve) => {
    GM_cookie.set({
        url: 'https://www.ccw.site',
        name: 'token',
        value: token,
        domain: '.ccw.site',
        path: '/',
        httpOnly: true,
        expirationDate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    }, result => resolve(!result?.message?.includes('HTTP-only')));
}), soc = () => fetch("https://community-web.ccw.site/students/self/detail", {
        method: 'post',
        body: '{}',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
    })
    .then(r => r.json())
    .then(d => document.cookie = `cookie-user-id=${d.body.oid};path=/;domain=.ccw.site;max-age=15552000`),
    reload = location.reload.bind(location), r = id => {
    if (menuId[id]) GM_unregisterMenuCommand(menuId[id]);
    const account = accounts[id], text = `${currentId === id ? "[当前] " : ""}${account.name} (${id})`;
    menuId[id] = GM_registerMenuCommand(text, () => 
        account.token
            ? loginByToken(account.token).then(r => r
                ? soc().then(reload)
                : confirm("Http Only Cookie 读写未授权，查看教程？") && open("https://d.chen-jin.dpdns.org/enableHttpOnly"))
            : menuId[id] = login(id, account.pwd)
                .then(r => r.json())
                .then(d => d.body
                    ? fetch("https://community-web.ccw.site/notification/page", {
                        method: 'post',
                        body: '{notifyGroup:"WEB_SYSTEM"}',
                        credentials: 'include',
                        headers: { 'content-type': 'application/json' }
                    }).then(() => {
                        document.cookie = `cookie-user-id=${d.body.accountObjectId};path=/;domain=.ccw.site;max-age=15552000`;
                        reload();
                    })
                    : alert(d.msg))
    );
}
function refreshMenu() {
    for (const id in menuId) GM_unregisterMenuCommand(menuId[id]);
    menuId = {};
    accounts = GM_getValue("accounts", {});
    for (const id in accounts) r(id);
    if (currentId && accounts[currentId]) r(currentId);
    menuId.s = GM_registerMenuCommand("⚙️ 打开设置", () => open("https://us.chen-jin.dpdns.org/settings/accountManager.html", "_blank"));
    menuId.r = GM_registerMenuCommand("🔄 刷新菜单", refreshMenu);
    GM_cookie.list({
        url: 'https://www.ccw.site',
        name: 'token',
    }, x => x?.length && (menuId.rr = GM_registerMenuCommand("👤 恢复登录", () => soc().then(reload))));
}

refreshMenu();
if (document.cookie.includes("cookie-user-id")) {
    const _open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m, u, a) {
        if (u === "https://community-web.ccw.site/students/self/detail") this.addEventListener("load", () => {
            XMLHttpRequest.prototype.open = _open;
            let json = JSON.parse(this.response).body;
            if (json) {
                currentId = json.studentNumber;
                if (menuId[currentId]) GM_unregisterMenuCommand(menuId[currentId]);
                if (accounts.hasOwnProperty(currentId)) {
                    r(currentId);
                    if (accounts[currentId].name !== json.name) {
                        accounts[currentId].name = json.name;
                        GM_setValue("accounts", accounts);
                    }
                }
            };
        });
        return _open.call(this, m, u, a);
    }
}