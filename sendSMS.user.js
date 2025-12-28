// ==UserScript==
// @name                发送验证码
// @namespace           cj-send-sms
// @match               https://www.ccw.site/profile/*
// @grant               none
// @version             1.0.3
// @author              Chen-Jin
// @description         使国外号码绑定的 CCW 账号能够发送验证码
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/sendSMS.user.js
// @downloadURL         https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/sendSMS.user.js
// @run-at              document-start
// ==/UserScript==
if (!countryCode) window.countryCode = "1";

const XHR = XMLHttpRequest.prototype;
const originalSend = XHR.send;
XHR.send = function (body) {
	try {
		if (this.__sentry_xhr__.url.includes("sso.ccw.site/web/auth/assistant/captcha/v2/create")) {
			let json = JSON.parse(body);
			json.countryCode = countryCode;
			if (json.captcha) console.log(`发送验证码至 +${countryCode} ${json.recipient}`);
			return originalSend.call(this, JSON.stringify(json));
		}
		return originalSend.apply(this, arguments);
	} catch(e) {
		console.error(e, this);
	}
};
