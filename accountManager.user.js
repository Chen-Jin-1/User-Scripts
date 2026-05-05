// ==UserScript==
// @name              账号管理器
// @namespace         cj-auto-check-in
// @version           1.0.5
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
// @grant             GM_download
// @run-at            document-start
// ==/UserScript==

let accounts = GM_getValue("accounts", {}), menuId = {}, currentId;

const login = (loginKey, password, noCookies = 0) => {
    if (!noCookies) document.cookie = "cookie-user-id=0;path=/";
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

const r = id => menuId[id] = GM_registerMenuCommand(`${accounts[id].name} (${id})`, () => login(id, accounts[id].pwd).then(() => location.reload()));

for (const id in accounts) r(id);
if (document.cookie.includes("cookie-user-id")) {
    const sc = json => {
        currentId = json.studentNumber;
        GM_unregisterMenuCommand(menuId[currentId]);
        if (accounts.hasOwnProperty(currentId)) menuId[currentId] = GM_registerMenuCommand(`[当前] ${json.name} (${currentId})`, () => {});
        if (accounts[currentId]) {
            accounts[currentId].name = json.name;
            GM_setValue("accounts", accounts);
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

GM_registerMenuCommand("添加账号", () => {
    let id = window.prompt("CCW ID", accounts[currentId] ? '' : currentId);
    if (accounts[id]) return `账号 ${accounts[id].name} 已存在`;
    if (Number(id) === NaN) return window.alert("这是什么 ID 🤔");
    fetch("https://community-web.ccw.site/students/profile", {
        method: 'post',
        body: JSON.stringify({studentNumber: id}),
        headers: {'content-type': 'application/json'},
    })
        .then(response => response.json())
        .then(data => {
            if (!data.body) return window.alert(data.msg);
            else {
                let s = data.body, pwd = window.prompt("密码");
                pwd && login(id, pwd, 1)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.body) {
                            window.alert(data.msg);
                            return;
                        } else {
                            accounts[id] = { name: s.name, pwd };
                            GM_setValue("accounts", accounts);
                            fetch("https://sso.ccw.site/web/auth/logout_by_session", {
                                body: JSON.stringify({id: data.body.id}),
                                method: 'post',
                                headers: {'content-type': 'application/json'},
                            });
                            if (confirm("已添加，是否现在登录？")) login(id, pwd).then(() => location.reload());
                            else r(id);
                        }
                    });
            }
        });
});

GM_registerMenuCommand("删除账号", () => {
    let id = window.prompt("CCW ID");
    if (id === null || !accounts[id] || !confirm(`确定删除账号 ${accounts[id].name}？`)) return;
    GM_unregisterMenuCommand(menuId[id]);
    delete accounts[id];
    GM_setValue("accounts", accounts);
    alert(accounts.hasOwnProperty(id) ? "删除失败" : "已删除");
});

GM_registerMenuCommand("导入配置", () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cj-account-manager-config, .json';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                accounts = data;
                GM_setValue("accounts", accounts);
                window.alert('导入成功');
            } catch(e) {
                window.alert('失败');
                console.error(e);
            }
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
});

GM_registerMenuCommand("导出配置", () => GM_download({
    url: 'data:application/octet-stream,' + encodeURIComponent(JSON.stringify(accounts)),
    name: Date.now() + '.cj-account-manager-config',
    saveAs: 1,
}));