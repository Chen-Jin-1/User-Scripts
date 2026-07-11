// ==UserScript==
// @name              主页查看器
// @namespace         cj-home-viewer
// @version           1.0.5
// @description       查看封禁、注销用户的主页
// @match             https://www.ccw.site/student/*
// @grant             none
// @run-at            document-start
// @icon              https://m.ccw.site/community/images/logo-ccw.png
// @author            Chen-Jin
// @downloadURL       https://us.chen-jin.dpdns.org/homeViewer.user.js
// ==/UserScript==

let oid, uid, userInfo, lockInfo, lockpmr;
typeof cjam_c !== "undefined" && delete cjam_c;
const lockpm = new Promise(r => lockpmr = r),
    _open = XMLHttpRequest.prototype.open,
    pm = new Promise(r => {
        const id = location.pathname.split("/")[2];
        fetch("https://community-web.ccw.site/students/profile", {
            method: 'post',
            body: JSON.stringify({ [id.length < 15 ? "studentNumber" : "studentOid"]: id }),
            headers: { 'content-type': 'application/json' },
        })
            .then(r => r.json())
            .then(({ body }) => {
                ({ studentNumber: uid, studentOid: oid } = body);
                if (body.category === "logoff") return r(2);
                else if (body.name) return r((XMLHttpRequest.prototype.open = _open, 0));
                fetch("https://community-web.ccw.site/user-card/detail", {
                    method: 'post',
                    body: JSON.stringify({ oid }),
                    headers: { 'content-type': 'application/json' },
                })
                    .then(r => r.json())
                    .then(({ body }) => r((userInfo = body.user, 1)));
            });
    });

XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u === "https://community-web.ccw.site/locked_user/detail") {
        Object.defineProperty(this, "responseText", {
            get: () => '{"body":{"locked":false},"code":"200","msg":null,"status":200}'
        });
        this.onload = () => lockpmr(lockInfo = JSON.parse(this.response).body, lockpm.d = 1);
    } else if (u === "https://community-web.ccw.site/students/profile") {
        const _send = XMLHttpRequest.prototype.send.bind(this);
        this.send = async body => {
            if (await pm === 0) return _send(body);
            else if (await pm === 2) {
                const _ = this.onreadystatechange;
                this.onreadystatechange = null;
                this.onload = () => {
                    Object.defineProperty(this, "responseText", {
                        get() {
                            const r = JSON.parse(this.response);
                            r.body.category = "ordinary";
                            return JSON.stringify(r);
                        }
                    });
                    _();
                };
                return _send(body);
            }
            if (!lockInfo) await fetch("https://community-web.ccw.site/locked_user/detail", {
                method: 'post',
                body: JSON.stringify({ accountOid: oid }),
                headers: { 'content-type': 'application/json' },
            })
                .then(r => r.json())
                .then(({ body }) => lockInfo = body);
            Object.defineProperty(this, "responseText", {
                get: () => JSON.stringify({
                    body: {
                        birthday: 0,
                        commentCount: 0,
                        extraInfo: {
                            hobbies: "-",
                            learnedProgrammingLanguages: "",
                            programmingCapability: "true",
                            selfIntroduction: `<font color="white">该用户已被封禁</font>
封禁时间：${new Date(lockInfo.createdAt).toLocaleString()}
解封时间：${new Date(lockInfo.unlocksAt).toLocaleString()}
更新时间：${new Date(lockInfo.updatedAt).toLocaleString()}`
                        },
                        hideGender: true,
                        lastLoginAt: 0,
                        memberArchive: { homepageCover: "https://m.ccw.site/post/692538ef86bbc77f84e3b259/d3783aed-f8f2-498e-abb3-3c02811b2166.png" },
                        regChannel: "1",
                        reputationScore: {
                            rank: "EXCELLENT",
                            score: 100,
                            studentOid: oid
                        },
                        studentCreatedDays: `解封还剩 ${Math.ceil((lockInfo.unlocksAt - Date.now()) / 86400000)} `,
                        studentNumber: uid,
                        studentOid: oid,
                        ...userInfo
                    },
                    code: "200",
                    msg: null,
                    status: 200
                })
            });
            _send(body);
        }
    } else if (u === "https://community-web.ccw.site/creation/student/detail") {
        const _send = XMLHttpRequest.prototype.send.bind(this);
        this.send = async body => {
            if (await pm === 0) return _send(body);
            else if (await pm === 2) {
                const _ = this.onreadystatechange;
                this.onreadystatechange = null;
                this.onload = () => {
                    Object.defineProperty(this, "responseText", {
                        get() {
                            const r = JSON.parse(this.response);
                            r.body.isSelf = true;
                            return JSON.stringify(r);
                        }
                    });
                    _();
                };
                return _send(body);
            }
            Object.defineProperty(this, "responseText", {
                get: () => JSON.stringify({
                    body: {
                        studentOid: oid,
                        ...userInfo,
                    },
                    code: "200",
                    msg: null,
                    status: 200
                })
            });
            _send(body);
        }
    }
    _open.call(this, m, u, a);
}