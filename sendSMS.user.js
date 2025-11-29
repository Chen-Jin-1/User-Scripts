// ==UserScript==
// @name                发送验证码
// @namespace           cj-send-sms
// @match               https://www.ccw.site/profile/*
// @grant               none
// @version             1.0.2
// @author              Chen-Jin
// @description         使国外号码绑定的 CCW 账号能够发送验证码
// @icon                https://m.ccw.site/user_projects_assets/c496b3fd-a476-4f1d-8f15-c77b17d30f11.png?x-oss-procss=image/circle,r_150
// @updateURL           https://bgithub.xyz/Chen-Jin-1/User-Scripts/raw/refs/heads/main/sendSMS.user.js
// @downloadURL         https://bgithub.xyz/Chen-Jin-1/User-Scripts/raw/refs/heads/main/sendSMS.user.js
// @run-at              document-start
// ==/UserScript==

var countryCode = "1" // 国家区号，可修改

const XHR = XMLHttpRequest.prototype;
const originalSend = XHR.send;
XHR.send = function (body) {
	try {
		if (this.__sentry_xhr__.url.includes("sso.ccw.site/web/auth/assistant/captcha/v2/create")) {
			let json = JSON.parse(body);
			json.countryCode = countryCode;
			window.alert(`验证码已发送至 +${countryCode} ${json.recipient}`);
			return originalSend.call(this, JSON.stringify(json));
		}
		return originalSend.apply(this, arguments);
	} catch(e) {
		console.error(e, this);
	}
};
