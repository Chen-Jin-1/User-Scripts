// ==UserScript==
// @name              自动签到
// @namespace         cj-auto-check-in
// @version           1.0.5
// @description       无需多点，立即签到
// @author            Chen-Jin
// @match             https://*.ccw.site/*
// @icon              https://m.ccw.site/community/images/logo-ccw.png
// @updateURL         https://us.chen-jin.dpdns.org/autoCheckIn.user.js?
// @downloadURL       https://us.chen-jin.dpdns.org/autoCheckIn.user.js?
// @grant             unsafeWindow
// @run-at            document-start
// ==/UserScript==

const _apply = Function.prototype.apply;
Function.prototype.apply = function(thisArg, args) {
    if (typeof thisArg === "object" && thisArg && thisArg.defaults && thisArg.interceptors && thisArg.interceptors.request.handlers.length > 0) {
        Function.prototype.apply = _apply;
        (async (axios) => {
            try {
                const checkIn = await axios.post("https://community-web.ccw.site/check_in_record/detail", {scene: "HOMEPAGE"});
                const rr = checkIn.checkInRecordResps[checkIn.todayIndex];
                if (rr.isCheckIn !== true) {
                    await axios.post("https://community-web.ccw.site/check_in_record/insert", {scene: 'HOMEPAGE'});
                    console.log(`签到成功，领取 ${rr.bucks} 金币`);
                } else console.log("今日已签到");
            } catch(e) {
                window.alert("签到失败，请刷新重试");
                console.error(e);
            }

        })(thisArg);
    }
    return _apply.call(this, thisArg, args);
};

if (document.cookie.includes("cookie-user-id")) {
    const originSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
        if (this.__sentry_xhr__?.url === "https://community-web.ccw.site/task/mine") {
            const originalOnReadyStateChange = this.onreadystatechange;
            this.onreadystatechange = function() {
                const response = JSON.parse(this.response);
                response.body = response.body.map(task => {
                    if (task.status === "PREPARED") task.status = "CYCLE";
                    return task;
                });

                const modifiedResponse = JSON.stringify(response);
                Object.defineProperties(this, {
                    'responseText': {
                        value: modifiedResponse,
                        writable: false,
                        configurable: true
                    },
                    'response': {
                        value: modifiedResponse,
                        writable: false,
                        configurable: true
                    }
                });
                return originalOnReadyStateChange.apply(this, arguments);
            }
            this.addEventListener("load", () => {
                XMLHttpRequest.prototype.send = originSend;
                let tasks = JSON.parse(this.response).body.filter(task => task.status === "PREPARED");
                tasks.forEach(task => {
                    fetch("https://community-web.ccw.site//task/award", {
                        body: JSON.stringify({taskOid: task.oid}),
                        method: 'post',
                        credentials: 'include',
                        headers: {'content-type': 'application/json'}
                    })
                        .then(response => response.json())
                        .then(({body}) => console.log(`已领取任务 ${task.name}，获得 ${body.rewareValue} 金币`));
                });
            })
        }
        return originSend.call(this, body);
    }
}