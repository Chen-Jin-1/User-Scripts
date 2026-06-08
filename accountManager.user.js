// ==UserScript==
// @name              账号管理器
// @namespace         cj-auto-check-in
// @version           1.2.0
// @description       快捷切换 CCW 账号
// @author            Chen-Jin
// @match             https://*.ccw.site/*
// @match             https://us.chen-jin.dpdns.org/settings/accountManager
// @match             file://*/*accountManager*
// @icon              https://www.chen-jin.dpdns.org/Chen-Jin-circle.png
// @updateURL         https://us.chen-jin.dpdns.org/accountManager.user.js?
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

if (location.hostname === 'us.chen-jin.dpdns.org' || location.protocol === "file:")
    return unsafeWindow.accountManager = {
        GM_getValue,
        GM_setValue,
        GM_xmlhttpRequest
    };


let accounts = GM_getValue("accounts", {}),
    menuId = {},
    currentId;

const login = (loginKey, password, noCookies = 0) => {
    if (!noCookies) document.cookie = "cookie-user-id=0;path=/;domain=.ccw.site";
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
        headers: {'content-type': 'application/json'},
    });
}

const loginByToken = (token) => {
    return new Promise((resolve) => {
        GM_cookie.set({
            url: 'https://www.ccw.site',
            name: 'token',
            value: token,
            domain: '.ccw.site',
            path: '/',
            httpOnly: true,
        }, () => resolve(true));
    });
}

const r = id => {
    const account = accounts[id];
    if (account.token) {
        menuId[id] = GM_registerMenuCommand(`${account.name} (${id})`, () => {
            loginByToken(account.token).then(() => location.reload());
        });
    } else if (account.pwd) {
        menuId[id] = GM_registerMenuCommand(`${account.name} (${id})`, () => {
            login(id, account.pwd).then(() => location.reload());
        });
    }
}

function refreshMenu() {
    for (const id in menuId) {
        GM_unregisterMenuCommand(menuId[id]);
    }
    menuId = {};
    accounts = GM_getValue("accounts", {});
    for (const id in accounts) r(id);
    if (currentId && accounts[currentId]) {
        menuId[currentId] = GM_registerMenuCommand(`[当前] ${accounts[currentId].name} (${currentId})`, () => {});
    }
}

for (const id in accounts) r(id);

if (document.cookie.includes("cookie-user-id")) {
    const sc = json => {
        currentId = json.studentNumber;
        if (menuId[currentId]) {
            GM_unregisterMenuCommand(menuId[currentId]);
        }
        if (accounts.hasOwnProperty(currentId)) {
            menuId[currentId] = GM_registerMenuCommand(`[当前] ${json.name} (${currentId})`, () => {});
            if (accounts[currentId].name !== json.name) {
                accounts[currentId].name = json.name;
                GM_setValue("accounts", accounts);
            }
        }
    }
    let _open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m, u, a) {
        try {
            if (u === "https://community-web.ccw.site/students/self/detail") {
                this.addEventListener("load", () => {
                    XMLHttpRequest.prototype.open = _open;
                    let json = JSON.parse(this.response).body;
                    json && sc(json);
                });
            }
            return _open.call(this, m, u, a);
        } catch(e) {
            console.error(e, this);
        }
    }
}


GM_registerMenuCommand("⚙️ 打开设置", () => open("https://us.chen-jin.dpdns.org/settings/accountManager", "_blank"));
GM_registerMenuCommand("🔄 刷新菜单", refreshMenu);
