// ==UserScript==
// @name         ccw伪装手机号
// @version      1.0.0
// @description  ccw伪装手机号
// @match        https://*.ccw.site/*
// @author       不想上学
// @run-at       document-start
// ==/UserScript==
(function () {
    'use strict';
    function patch(obj, p, fn) {
        if (obj[p]) obj[p] = fn(obj[p])
    }
    const identityAuthRank="L1", oid="", id="";
    const XHR = XMLHttpRequest.prototype;
    patch(XHR, "open", _open => function (method, url) {
        if (true) {
            if (url == "https://community-web.ccw.site/students/self/detail") {
                alert("伪装");
                return _open.call(
                    this,
                    method,
                    "data:application/json," + JSON.stringify({ "body": { "abGroup": null, "accountNumber": null, "address": null, "addressCode": null, "age": null, "archive": null, "avatar": "https://m.ccw.site/community/images/avatar-default.png", "bio": "", "birthYear": null, "birthday": null, "category": null, "city": null, "commentCount": 0, "contactPhone": 12345678901, "countryCode": null, "createdAt": Date.now(), "currentMajorClazzOid": null, "currentParent": { "bindPhone": "12345678901", "qqNickname": "不想上学", "qqNum": null }, "distinctId": null, "district": null, "email": null, "energy": null, "energyRegain": null, "examScore": null, "extraInfo": null, "firstTime": null, "followingStatus": null, "fullName": "创作者", "gender": null, "grade": 0, "group": null, "guest": null, "guestNumber": null, "hideGender": false, "host": "aliyun", "identity": null, identityAuthRank: identityAuthRank == "L2" ? "L2" : "L1", "identityType": null, "informationModifyDate": { "avatarModifiedAt": null, "nameModifiedAt": null }, "keywords": [], "lastLoginAt": null, "lastStudyAt": null, "lowAge": null, "midexamScore": null, "miniprojectFreeNum": null, "mpClicked": null, "mpShowedModal": null, "mpTutorial": null, "name": "创作者", "newWorkbenchTutorial": null, oid, "orgId": null, "parents": [{ "acceptedCashInviteOnce": null, "alphaUser": null, "altName": null, "annualIncome": null, "archive": null, "authedTime": null, "avatar": null, "bindPhone": "90240334147", "birthday": null, "cashInviteCreatedAt": null, "cashInviteRestartAt": null, "clazzDevice": null, "company": null, "countryCode": null, "createdAt": null, "degree": null, "distinctId": "CD7C6B6226784144970A0EDDAE9F4070", "divorced": null, "email": null, "ext": {}, "followTeachers": [], "fullName": null, "gender": null, "giftCardCampaign": null, "guestOid": null, "idcard": null, "industry": null, "integer": null, "inviterableId": null, "inviterableType": null, "isEmployee": null, "jobPosition": null, "lastSubscribeAt": null, "mainContact": null, "name": null, "needSelectClazz": null, oid, "overseaExperience": null, "phoneAddr": { "phone": "12345678901" }, "powerUser": null, "realName": null, "relationship": null, "remarkName": null, "rewardsCashesCount": null, "source": null, "sourceCategory": null, "sourceInfo": null, "status": null, "student": null, "studentOid": oid, "subscribe": null, "subscribeScene": null, "tags": null, "telephone": "90240334147", "university": null, "updatedAt": null, "userTags": [], "userType": null, "wechatAccount": null, "wechatCity": null, "wechatCountry": null, "wechatOpenid": null, "wechatProvince": null, "wechatUnionid": null, "wehubWxid": null, "wxid": null }], "passwordDigest": null, "photo": null, "picUrl": null, "province": null, "qq": null, "receiver": null, "regChannel": "1", "remarkName": null, "reputationScore": { "rank": "EXCELLENT", "score": 100, "studentOid": null }, "role": null, "school": null, "showServiceTerm": null, "showTaskList": null, "stats": null, "studentNumber": id, "task": null, "teacherUnreadedMessages": null, "tutorialSteps": null, "updatedAt": Date.now(), "validateSchool": null, "virtualValue": null, "watchedMiniProjectTutorailVideo": null, "xiguaStudentNo": null }, "code": "200", "msg": null, "status": 200 })
                );
            }
        }
        return _open.call(this, ...arguments);
    });
})()
