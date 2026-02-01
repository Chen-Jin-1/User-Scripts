// ==UserScript==
// @name              账号管理器
// @namespace         cj-auto-check-in
// @version           1.0.0
// @description       快捷切换 CCW 账号
// @author            Chen-Jin
// @match             https://*.ccw.site/*
// @icon              https://m.ccw.site/community/images/logo-ccw.png
// @updateURL         https://us.chen-jin.dpdns.org/accountManager.user.js?
// @downloadURL       https://us.chen-jin.dpdns.org/accountManager.user.js?
// @grant             unsafeWindow
// @grant             GM_registerMenuCommand
// @grant             GM_unregisterMenuCommand
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_listValues
// @run-at            document-start
// ==/UserScript==

let accounts = GM_getValue("accounts", {});
let menuId = {};

const login = (loginKey, password, noCookies = 0) => {
    return fetch("https://sso.ccw.site/web/auth/login-by-password", {
        method: 'post',
        credentials: noCookies ? 'omit' : 'include',
        body: JSON.stringify({
            loginKey,
            password,
            clientCode: "STUDY_COMMUNITY",
            extra: "{\"device\":\"账号管理器创建\",\"browser\":\"账号管理器创建\"}"
        }),
        headers: {'content-type': 'application/json'},
    });
}

for (const id in accounts) {
    menuId[id] = GM_registerMenuCommand(`${accounts[id].name} (${id})`, () => login(id, accounts[id].pwd).then(() => location.reload()));
}

let originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function() {
    try {
        if (this.__sentry_xhr__.url === "https://community-web.ccw.site/students/self/detail") {
            this.addEventListener("load", () => {
                XMLHttpRequest.prototype.send = originalSend;
                let json = JSON.parse(this.response).body;
                if (json) {
                    currentId = json.studentNumber;
                    GM_unregisterMenuCommand(menuId[currentId]);
                    if (accounts.hasOwnProperty(currentId)) {
                        menuId[currentId] = GM_registerMenuCommand(`[当前] ${json.name} (${currentId})`, () => {});
                    }
                    if (accounts[currentId]) {
                        accounts[currentId].name = json.name;
                        GM_setValue("accounts", accounts);
                    }
                } else currentId = undefined;
            });
        }
        return originalSend.apply(this, arguments);
    } catch(e) {
        console.error(e, this);
    }
}

GM_registerMenuCommand("添加账号", () => {
    let id = window.prompt("CCW ID", currentId);
    if (Number(id) === NaN) {
        window.alert("你添个锤子啊");
        return;
    }
    fetch("https://community-web.ccw.site/students/profile", {
        method: 'post',
        body: JSON.stringify({studentNumber: id}),
        headers: {'content-type': 'application/json'},
    })
        .then(response => response.json())
        .then(data => {
            if (!data.body) {
                window.alert(data.msg);
                return;
            } else {
                let s = data.body;
                let pwd = window.prompt("密码");
                login(id, pwd, 1)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.body) {
                            window.alert(data.msg);
                            return;
                        } else {
                            accounts[id] = {
                                name: s.name,
                                pwd,
                            }
                            GM_setValue("accounts", accounts);
                            fetch("https://sso.ccw.site/web/auth/logout_by_session", {
                                body: JSON.stringify({id: data.body.id}),
                                method: 'post',
                                headers: {'content-type': 'application/json'},
                            });
                            window.alert("已添加");
                            GM_unregisterMenuCommand(menuId[id]);
                            if (id != currentId) {
                                GM_registerMenuCommand(`${s.name} (${id})`, () => login(id, pwd).then(() => location.reload()));
                            } else {
                                GM_registerMenuCommand(`[当前] ${s.name} (${id})`, () => {});
                            }
                        }
                    });
            }
        });
});

GM_registerMenuCommand("删除账号", () => {
    let id = window.prompt("CCW ID");
    delete accounts[id];
    GM_setValue("accounts", accounts);
    if (id !== null) {
        window.alert(accounts.hasOwnProperty(id) ? "已删除" : "不存在");
        if (id == currentId) GM_unregisterMenuCommand(menuId[currentId]);
    }
});