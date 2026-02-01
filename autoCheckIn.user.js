// ==UserScript==
// @name              自动签到
// @namespace         cj-auto-check-in
// @version           1.0.3
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
                    axios.post("https://community-web.ccw.site/check_in_record/insert", {scene: 'HOMEPAGE'})
                        .then(r => console.log(`签到成功，领取 ${rr.bucks} 金币`))
                        .then(e => {
                            window.alert("签到失败，请刷新重试");
                            console.error(e);
                        });
                } else console.log("今日已签到");
            } catch(e) {
                console.error(e);
            }

        })(thisArg);
    }
    return _apply.call(this, thisArg, args);
};
