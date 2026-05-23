// ==UserScript==
// @name              封禁用户主页查看器
// @namespace         cj-home-viewer
// @version           0
// @description       查看被封禁用户的主页
// @match             https://www.ccw.site/student/*
// @grant             none
// @run-at            document-start
// @icon              https://m.ccw.site/community/images/logo-ccw.png
// @author            Chen-Jin
// @updateURL         https://us.chen-jin.dpdns.org/homeViewer.user.js
// @downloadURL       https://us.chen-jin.dpdns.org/homeViewer.user.js
// ==/UserScript==

let oid, user, uid;

async function getOid(body) {
    const j = JSON.parse(body);
    if (j.studentNumber) oid = (await (await fetch("https://community-web.ccw.site/students/profile", {
        method: 'post',
        body,
        headers: {'content-type': 'application/json'},
    })).json()).body.studentOid;
    else oid = j.studentOid;
    user = (await (await fetch("https://community-web.ccw.site/user-card/detail", {
        method: 'post',
        body: JSON.stringify({oid}),
        headers: {'content-type': 'application/json'},
    })).json()).body.user;
};
const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u === "https://community-web.ccw.site/locked_user/detail") {
        Object.defineProperty(this, "responseText", {
            get: () => '{"body":{"locked":false},"code":"200","msg":null,"status":200}'
        });
        this.onload = () => {
            if (JSON.parse(this.response).locked === false) XMLHttpRequest.prototype.open = _open;
        };
    } else if (u === "https://community-web.ccw.site/students/profile") {
        console.warn(this);
        const _send = this.send;
        this.send = body => {
            if (!oid) return getOid(body).then(() => _send.call(this, body));
            Object.defineProperty(this, "responseText", {
                get: () => JSON.stringify({
                    "body": {
                        "approvedContent": null,
                        "approvedType": null,
                        "avatar": user.avatar,
                        "bio": user.bio,
                        "birthday": 0,
                        "category": "ordinary",
                        "commentCount": -1,
                        "extraInfo": {
                            "hobbies": "已封禁",
                            "learnedProgrammingLanguages": "",
                            "programmingCapability": "true",
                            "selfIntroduction": "该用户已被封禁"
                        },
                        "gender": "MALE",
                        "hideGender": false,
                        "identityAuthRank": "L2",
                        "lastLoginAt": 1778414924588,
                        "memberArchive": {
                            "accountOid": null,
                            "defaultEditor": null,
                            "greatCreationOid": null,
                            "homepageCover": "https://m.ccw.site/post/692538ef86bbc77f84e3b259/d3783aed-f8f2-498e-abb3-3c02811b2166.png?x=0&y=0"
                        },
                        "name": user.name,
                        "picUrl": null,
                        "regChannel": "1",
                        "reputationScore": {
                            "rank": "EXCELLENT",
                            "score": 100,
                            "studentOid": oid
                        },
                        "statistics": {
                            "badgesCount": null,
                            "homeworkCount": 173,
                            "likeHomeworkCount": 177
                        },
                        "studentCreatedDays": 166,
                        "studentNumber": "278018102",
                        "studentOid": oid,
                        "virtualValue": null
                    },
                    "code": "200",
                    "msg": null,
                    "status": 200
                })
            });
            _send.call(this, body);
        }
    }
    return _open.call(this, m, u, a);
}