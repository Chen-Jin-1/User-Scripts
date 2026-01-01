// ==UserScript==
// @name                回复面板
// @namespace           cj-reply
// @match               https://*.ccw.site/*
// @grant               none
// @version             1.0.1
// @author              Chen-Jin
// @description         
// @icon                https://m.ccw.site/community/images/logo-ccw.png
// @updateURL           https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/reply.user.js
// @downloadURL         https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/reply.user.js
// @run-at              document-start
// ==/UserScript==
new Promise(resolve => {
  const _apply = Function.prototype.apply;
  Function.prototype.apply = function(thisArg, args) {
      if (typeof thisArg === "object" && thisArg && thisArg.defaults && thisArg.interceptors && thisArg.interceptors.request.handlers.length > 0) {
          resolve(thisArg);
          Function.prototype.apply = _apply;
      }
      return _apply.call(this, thisArg, args);
  };
}).then(axios => {
const rt = Scratch.runtime;
const extIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMSIgeT0iMTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjEyIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0NiIgeT0iMTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjEyIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSIxMyIgeT0iMjkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQzIiB5PSI4IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0MyIgeT0iMjMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQiIHk9IjgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjEwIiB5PSIzMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iMzUiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjQiIHk9IjIzIiB3aWR0aD0iNiIgaGVpZ2h0PSIzIiBmaWxsPSJibGFjayIvPgo8cmVjdCB4PSI0IiB5PSIyNiIgd2lkdGg9IjMiIGhlaWdodD0iOSIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iNyIgeT0iNSIgd2lkdGg9IjM2IiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHg9IjE2IiB5PSIyNiIgd2lkdGg9IjI3IiBoZWlnaHQ9IjMiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik03IDhINDNWMTFINDZWMjNINDNWMjZIMTZWMjlIMTNWMzJIMTBWMzVIN1YyNkgxMFYyM0g0VjExSDdWOFoiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3QgeD0iNyIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNCIgeT0iMTEiIHdpZHRoPSI0MiIgaGVpZ2h0PSIzIiBmaWxsPSIjNjYzREZCIi8+CjxyZWN0IHg9IjQiIHk9IjE0IiB3aWR0aD0iNDIiIGhlaWdodD0iMyIgZmlsbD0iIzY2M0RGQiIvPgo8cmVjdCB4PSI0IiB5PSIxNyIgd2lkdGg9IjQyIiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNCIgeT0iMjAiIHdpZHRoPSI0MiIgaGVpZ2h0PSIzIiBmaWxsPSIjNjYzREZCIi8+CjxyZWN0IHg9IjEwIiB5PSIyMyIgd2lkdGg9IjMzIiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNyIgeT0iMjYiIHdpZHRoPSI5IiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNyIgeT0iMjkiIHdpZHRoPSI2IiBoZWlnaHQ9IjMiIGZpbGw9IiM2NjNERkIiLz4KPHJlY3QgeD0iNyIgeT0iMzIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3QgeD0iNCIgeT0iMTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjciIHk9IjgiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEzIiB5PSIxMSIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3QgeD0iMTMiIHk9IjE3IiB3aWR0aD0iOSIgaGVpZ2h0PSIzIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHg9IjE2IiB5PSIyMyIgd2lkdGg9IjI3IiBoZWlnaHQ9IjMiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3QgeD0iMTMiIHk9IjI2IiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiBmaWxsPSIjNEIxRDk1Ii8+CjxyZWN0IHg9IjQzIiB5PSIyMCIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzRCMUQ5NSIvPgo8cmVjdCB4PSIxMCIgeT0iMjkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM0QjFEOTUiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMTIiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDU4IDI5KSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMTIiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDEzIDI5KSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNDYgNDcpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAxNiAyNikiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDE2IDQxKSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMjYpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSA1MCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDUzKSIgZmlsbD0iYmxhY2siLz4KPHJlY3Qgd2lkdGg9IjYiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgNDEpIiBmaWxsPSJibGFjayIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSI5IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1NSA0NCkiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIzNiIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1MiAyMykiIGZpbGw9ImJsYWNrIi8+CjxyZWN0IHdpZHRoPSIyNyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0MyA0NCkiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik01MiAyNkgxNlYyOUgxM1YzOEgxNlY0NEg0M1Y0N0g0NlY1MEg0OVY1M0g1MlY0NEg0OVY0MUg1NVYyOUg1MlYyNloiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjM2IiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDI2KSIgZmlsbD0iIzVDRkY2RCIvPgo8cmVjdCB3aWR0aD0iNDIiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMjkpIiBmaWxsPSIjNUNGRjZEIi8+CjxyZWN0IHdpZHRoPSI0MiIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1NSAzMikiIGZpbGw9IiM1Q0ZGNkQiLz4KPHJlY3Qgd2lkdGg9IjQyIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDU1IDM1KSIgZmlsbD0iIzVDRkY2RCIvPgo8cmVjdCB3aWR0aD0iMzkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMzgpIiBmaWxsPSIjNUNGRjZEIi8+CjxyZWN0IHdpZHRoPSIzMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSA0MSkiIGZpbGw9IiM1Q0ZGNkQiLz4KPHJlY3Qgd2lkdGg9IjkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTIgNDQpIiBmaWxsPSIjNUNGRjZEIi8+CjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDQ3KSIgZmlsbD0iIzVDRkY2RCIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1MiA1MCkiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMTYgMjkpIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAxOSAyNikiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHdpZHRoPSIyNCIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0NiAyOSkiIGZpbGw9IiNGRERGMEIiLz4KPHJlY3Qgd2lkdGg9IjkiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMzEgMzUpIiBmaWxsPSIjRkRERjBCIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDQ5IDQxKSIgZmlsbD0iIzBFODYxQSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1NSAzOCkiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTUgMzUpIiBmaWxsPSIjMEU4NjFBIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDU1IDMyKSIgZmlsbD0iIzBFODYxQSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA1MiAzOCkiIGZpbGw9IiMwRTg2MUEiLz4KPHJlY3Qgd2lkdGg9IjMiIGhlaWdodD0iMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgNTIgNDQpIiBmaWxsPSIjMEU4NjFBIi8+CjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjMiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDUyIDQ3KSIgZmlsbD0iIzBFODYxQSIvPgo8cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSA0OSA0NCkiIGZpbGw9IiMwRTg2MUEiLz4KPC9zdmc+Cg==";
function ce(tag, text = undefined, pn = undefined, id = undefined, type = 't') {
    var el = document.createElement(tag);
    if (text) el[type == 'h' ? "innerHTML" : "innerText"] = text;
    pn?.appendChild(el);
    if (id) el.id = id;
    return el;
}
function makeDraggable(element) {
    let isDragging = false;
    let startX, startY;
    let initialRight, initialTop;
    element.addEventListener('mousedown', startDrag);
    function startDrag(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const computedStyle = getComputedStyle(element);
        initialRight = parseFloat(computedStyle.right);
        initialTop = parseFloat(computedStyle.top);
        element.style.right = initialRight + 'px';
        element.style.top = initialTop + 'px';
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    }
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
}
document.getElementById("cj-reply-css")?.remove();
document.getElementById("cj-reply-main")?.remove();
var css = ce("style", `
#cj-reply-main {
    padding: 10px 12px;
    background: #ffffff55;
    background-blend-mode: overlay;
    color: #fff;
    font-family: 'PingFang';
    text-align: center;
    font-size: 12px;
    border-radius: 12px;
    display: inline-flex;
    margin-right: 10px;
    flex-direction: column;
    align-items: flex-start;
    position: fixed;
    z-index: 123456;
    top: 5px;
    right: 5px;
    cursor: grab;
    backdrop-filter: blur(2px);
    border: 1px solid #999;
    width: max-content;
    transition: opacity 0.3s ease;
    opacity: 1;
}
#cj-reply-latest-notify {
    display: flex;
    margin-top: 12px;
    border-radius: 12px;
    background: #ffffff33;
    padding: 7px;
}
#cj-reply-left {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    margin-right: 4px;
}
#cj-reply-right {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 15px;
}
#cj-reply-content {
    color: #ddd;
    text-align: left;
}
#cj-reply-time {
    color: #bbb;
}
#cj-reply-number {
    color: red;
}
#cj-reply-button {
    display: none;
    background: #00aeff70;
    border-radius: 30px;
    padding: 2px 6px;
    transition-duration: 0.3s;
    cursor: pointer;
}
#cj-reply-msg {
    background: #55555550;
    border-radius: 12px;
    padding: 7px;
    display: none;
    text-align: left;
}
#cj-reply-button:hover {
    background: #00aeff;
}
#cj-reply-button-page {
    background: #ffffff70;
    border-radius: 30px;
    padding: 2px 6px;
    transition-duration: 0.3s;
    cursor: pointer;
}
#cj-reply-button-page:hover {
    background: #fff;
    color: #aaa;
}
`, document.head, "cj-reply-css", 'h');
const main = ce("div", 0, null, "cj-reply-main", "h");
const replyStatus = ce("span", "", main, "cj-reply-number");
replyStatus.style.display = "none";
const updateTime = ce("div", 0, main, "cj-reply-update-time");
// const latestText = ce("div", '最新回复', latestBox, "cj-reply-latest-text");
const latestBox = ce("div", 0, main, "cj-reply-latest-notify");
const left = ce("img", "", latestBox, "cj-reply-left");
const right = ce("div", 0, latestBox, "cj-reply-right");
const name = ce("span", 0, right, "cj-reply-name");
const content = ce("span", 0, right, "cj-reply-content");
const time = ce("span", 0, right, "cj-reply-time");
const msg = ce("span", 0, right, "cj-reply-msg");
ce("br", 0, right);
const replyButton = ce("div", "回复", right, "cj-reply-button");
ce("br", 0, main);
const pageButton = ce("div", "打开消息页面", main, "cj-reply-button-page");
pageButton.addEventListener("click", () => window.open("https://www.ccw.site/notice/reply"));
makeDraggable(main);
if (location.href.includes("gandi")) document.body.appendChild(main);
function hide() {
    if (main.style.opacity !== "0") {
        main.style.opacity = "0";
        main.style.pointerEvents = "none";
    } else {
        if (main.getAttribute("fixed")) {
            main.style.opacity = "0.7";
        } else {
            main.style.opacity = "1";
            main.style.pointerEvents = "";
        }
    }
}
function fixed() {
    if (main.getAttribute("fixed")) {
        main.setAttribute("fixed", "");
        main.style.opacity = "1";
        main.style.pointerEvents = "";
        main.style.backdropFilter = "";
    } else {
        main.setAttribute("fixed", "1");
        main.style.opacity = "0.7";
        main.style.pointerEvents = "none";
        main.style.backdropFilter = "unset";
    };
}
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.altKey && e.code === "KeyE") hide();
    if (e.ctrlKey && e.altKey && e.code === "KeyX") fixed();
});
const axios = window.axios;
function checkAxios() {
    if (axios) {
        return true;
    } else {
        if (window.confirm("此功能需要安装获取 Axios 脚本才能使用，是否复制脚本链接？")) copy("https://gh.llkk.cc/https://github.com/Chen-Jin-1/User-Scripts/raw/refs/heads/main/getAxios.user.js")
        return false;
    }
}
var msgId = 0;
async function replyMessage() {
    if (!checkAxios()) return;
    var content = window.prompt("回复内容");
    if (content) {
        var result = await axios.post("https://community-web.ccw.site/comment/reply", {
            content,
            replyToId: msgId,
        });
        if (result) window.alert("回复成功");
    }
}
replyButton.addEventListener("click", replyMessage)
const getTimeFromDate = (date) => date.toLocaleString("zh-cn");
function updateReplyBox() {
    updateTime.innerText = "正在更新";
    fetch("https://gandi-main.ccw.site/timestamp/current")
        .then(r => r.json())
        .then(json => {
            const nowDate = new Date(json.body);
            updateTime.style.color = "";
            updateTime.innerText = "更新时间：" + getTimeFromDate(nowDate);
        })
        .catch(e => {
            updateTime.innerText = "更新失败";
            updateTime.style.color = "red";
            console.error(e);
            throw e;
        });
    fetch("https://community-web.ccw.site/notification/stats/v2", {
        method: 'post',
        body: '{"countAll": true}',
        credentials: 'include',
        headers: {
            'content-type': 'application/json',
        },
    })
        .then(r => r.json())
        .then(json => {
            if (json.body.COMMENT_TO_ME > 0) {
                replyStatus.innerText = "有新消息";
                replyStatus.style.display = "";
                if (main.opacity = "0") main.opacity = main.getAttribute("fixed") ? "0.7" : "1";
            } else {
                replyStatus.innerText = "";
                replyStatus.style.display = "none";
            };
        });
   fetch("https://community-web.ccw.site/notification/page?page=1&sortType=DESC", {
        method: 'post',
        body: '{"notifyGroup": "COMMENT_TO_ME","page": 1}',
        credentials: 'include',
        headers: {
            'content-type': 'application/json',
        },
    })
        .then(r => r.json())
        .then(json => {
            const notify = json.body.data[0];
            msgId = notify.triggeredById;
            left.src = notify.avatar;
            name.innerText = notify.senderName;
            content.innerText = notify.comment;
            const date = new Date(notify.createdAt);
            time.innerText = getTimeFromDate(date);
            if (notify.message) {
                msg.innerText = notify.message;
                msg.style.display = "unset";
            } else {
                msg.innerText = "";
                msg.style.display = "";
            }
            replyButton.style.display = "unset";
        });
}
updateReplyBox();
if (rt.extensionStorage.cjReplyInterval) clearInterval(rt.extensionStorage.cjReplyInterval);
rt.extensionStorage.cjReplyInterval = setInterval(updateReplyBox, 20000);
});
