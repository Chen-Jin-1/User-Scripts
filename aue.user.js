// ==UserScript==
// @name                允许未知扩展
// @namespace           cj-allow-unknown-extensions
// @match               https://www.ccw.site/detail/*
// @match               https://www.ccw.site/gandi*
// @version             0
// @author              Chen-Jin
// @description         使带有未知扩展的作品能正常运行、发布
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://us.chen-jin.dpdns.org/aue.user.js
// @downloadURL         https://us.chen-jin.dpdns.org/aue.user.js
// @run-at              document-start
// ==/UserScript==

let vm;
const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, ...args) {
    this._url = u;

    const _send = this.send;
    if (u.startsWith("https://bfs-web.ccw.site/extensions/")) {
        const extensionId = u.split("/").at(-1);
        this.send = b => {
            const _onreadystatechange = this.onreadystatechange;
            this.onreadystatechange = () => {
                Object.defineProperty(this, 'responseText', {
                    get: () => JSON.stringify({
    "body": {
        "cover": "https://m.ccw.site/works-covers/c5f66f18-a39b-49ae-a235-9c36241af333.png",
        "createdAt": 1749814068000,
        "creationId": "684bf23114fe4e50ac96520a",
        "description": "执行任意 JavaScript 代码",
        "eid": extensionId,
        "icon": "test",
        "id": 847,
        "latestProjectCoverLink": null,
        "latestProjectLink": null,
        "name": "i-js (仅编辑器可用)",
        "publisher": {
            "avatar": "https://m.ccw.site/avatar/5db279a4483f207ab58b3929/8ee25976-87df-47fb-b90b-f0a23d37b688.png",
            "id": "5db279a4483f207ab58b3929",
            "locked": null,
            "nickname": "往昔余庆"
        },
        "publisherId": "5db279a4483f207ab58b3929",
        "stats": {
            "averageRating": 3.659091,
            "commentCount": 0,
            "donateCount": 0,
            "favoriteCount": 0,
            "likeCount": 9,
            "mostApprovedReviews": [
                {
                    "commenter": {
                        "accountOid": "692538ef86bbc77f84e3b259",
                        "avatar": "https://m.ccw.site/user_projects_assets/c2bf0912-a904-4c43-af80-e5b8d4912049.png",
                        "name": "Chen-Jin"
                    },
                    "commenterId": 1672038,
                    "content": "-评分: 5\n-标签: 安全\n安全扩展需要危险数 < 3\n这么看来成不了安全扩展了，打个安全吧",
                    "createdAt": 1770538013000,
                    "ext": {},
                    "id": 9045588,
                    "parentId": null,
                    "receiverId": null,
                    "replyToId": null,
                    "status": "PUBLISHED",
                    "topicId": 759328,
                    "type": null,
                    "updatedAt": 1770538013000,
                    "weight": 0
                },
            ],
            "reviewCount": 22,
            "reviewTags": [
                {
                    "count": 13,
                    "tag": "安全"
                },
                {
                    "count": 9,
                    "tag": "原创"
                },
                {
                    "count": 0,
                    "tag": "危险"
                },
                {
                    "count": 2,
                    "tag": "潜在风险"
                }
            ]
        },
        "status": "SUBMITTED",
        "updatedAt": 1771877369000,
        "versions": [
            {
                "assetUri": "https://m.ccw.site/user_projects_assets/2e8f6b1093dd294813f3a5a7d48d06bd.js",
                "changelog": null,
                "createdAt": 1771877368000,
                "demos": [],
                "eid": "i",
                "id": 5359,
                "license": null,
                "previews": [
                    "https://m.ccw.site/user_projects_assets/ab6a967b4981e54708763bc3fe41496d.svg"
                ],
                "projectCoverLink": null,
                "projectLink": "https://m.ccw.site/user_projects_sb3/205558881/d103c91c9a0cd77a6164b55af399aff8.sb3",
                "readme": "test",
                "releaseTags": [
                    "Release"
                ],
                "releasedAt": 1771877368000,
                "tags": [],
                "tutorials": [],
                "updatedAt": 1771877368000,
                "version": "0.7.0"
            },
        ]
    },
    "code": "200",
    "msg": null,
    "status": 200
}),
                    configurable: true
                });
                console.log(this);
                _onreadystatechange.call(this);
            }
            return _send.call(this, b);
        };
    } else if (u === "https://community-web.ccw.site/creation/detail") {
        console.log(this);
    }

    return _open.call(this, m, u, ...args);
};

const _bind = Function.prototype.bind;
Function.prototype.bind = function(thisArg, ...args) {
    if (thisArg && thisArg.runtime && thisArg.greenFlag) {
        vm = thisArg;
        vm.runtime.extensionManager.addOfficialExtensionInfo({
    "info": {
        "name": "CCWData.name",
        "description": "CCWData.desc",
        "extensionId": "i",
        "iconURL": "https://static.xiguacity.cn/h1t86b7fg6c7k36wnt0cb30m/static/assets/cover.726fd0a2.svg",
        "insetIconURL": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI5IiBoZWlnaHQ9IjEyOSIgdmlld0JveD0iMCAwIDEyOSAxMjkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjMyIiB5PSI1NyIgd2lkdGg9IjY2IiBoZWlnaHQ9IjE1IiByeD0iNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNiAzOEMzMy43OTA5IDM4IDMyIDM5Ljc5MDkgMzIgNDJWNDlDMzIgNTEuMjA5MSAzMy43OTA5IDUzIDM2IDUzSDk0Qzk2LjIwOTEgNTMgOTggNTEuMjA5MSA5OCA0OVY0MkM5OCAzOS43OTA5IDk2LjIwOTEgMzggOTQgMzhIMzZaTTM4IDQyQzM3LjQ0NzcgNDIgMzcgNDIuNDQ3NyAzNyA0M1Y0N0MzNyA0Ny41NTIzIDM3LjQ0NzcgNDggMzggNDhINDJDNDIuNTUyMyA0OCA0MyA0Ny41NTIzIDQzIDQ3VjQzQzQzIDQyLjQ0NzcgNDIuNTUyMyA0MiA0MiA0MkgzOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzYgNzZDMzMuNzkwOSA3NiAzMiA3Ny43OTA5IDMyIDgwVjg3QzMyIDg5LjIwOTEgMzMuNzkwOSA5MSAzNiA5MUg5NEM5Ni4yMDkxIDkxIDk4IDg5LjIwOTEgOTggODdWODBDOTggNzcuNzkwOSA5Ni4yMDkxIDc2IDk0IDc2SDM2Wk04OCA4MUM4Ny40NDc3IDgxIDg3IDgxLjQ0NzcgODcgODJWODZDODcgODYuNTUyMyA4Ny40NDc3IDg3IDg4IDg3SDkyQzkyLjU1MjMgODcgOTMgODYuNTUyMyA5MyA4NlY4MkM5MyA4MS40NDc3IDkyLjU1MjMgODEgOTIgODFIODhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
        "featured": true,
        "disabled": false,
        "doc": "CCWData.doc",
        "collaboratorList": [
            {
                "collaborator": "Nick@Gandi",
                "collaboratorURL": "https://www.ccw.site/student/5d47fec31c94e579b89cd259"
            },
            {
                "collaborator": "Jevan@Gandi",
                "collaboratorURL": "https://www.ccw.site/student/5b42fa53eb0a194fe2d364cc"
            }
        ],
        "collaborator": "Nick@Gandi",
        "collaboratorURL": "https://www.ccw.site/student/5d47fec31c94e579b89cd259"
    },
    "l10n": {
        "zh-cn": {
            "CCWData.name": "Gandi 云数据 v1.3",
            "CCWData.desc": "☁️ 云数据存取不用愁，搭配 JSON 工具使用更方便！",
            "CCWData.doc": "https://getgandi.com/cn/extensions/data-utils?minimal"
        },
        "en": {
            "CCWData.name": "Gandi Cloud Data v1.3",
            "CCWData.desc": "☁️ Cloud data access is easy, with JSON utilities doubly so!",
            "CCWData.doc": "https://getgandi.com/extensions/data-utils?minimal"
        }
    }
})
        Function.prototype.bind = _bind;
    }
    return _bind.call(this, thisArg, ...args);
};