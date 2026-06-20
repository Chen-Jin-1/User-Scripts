// ==UserScript==
// @name         显示评论 ID
// @namespace    cj-comment-id
// @version      1.0.0
// @description  在评论区直接查看评论 ID
// @match        https://www.ccw.site/*
// @run-at       document-start
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/commentId.user.js
// ==/UserScript==

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(m, u, a) {
    if (u.startsWith("https://community-web.ccw.site/comment/page")) {
        const _send = XMLHttpRequest.prototype.send.bind(this);
        this.send = async body => {
            this.onload = () => Object.defineProperty(this, "responseText", {
                get() {
                    const r = JSON.parse(this.response);
                    r.body.data.forEach(item => {
                        const imgMatch = item.content.match(/!\[[^\]]*\]\([^)]+\)/);
                        if (imgMatch) {
                            const idx = item.content.indexOf(imgMatch[0]) + imgMatch[0].length;
                            item.content = item.content.slice(0, idx) + `#${item.id}\n` + item.content.slice(idx).trimStart();
                        } else {
                            item.content = `#${item.id}\n${item.content}`;
                        }
                    });
                    return JSON.stringify(r);
                }
            });
            _send(body);
        }
    }
    _open.call(this, m, u, a);
}

window.addEventListener("load", () => {
    const observer = new MutationObserver(mutations => {
        const spans = [];
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) node.querySelectorAll?.('div.c-comment-content > span:not([class])')?.forEach(span => spans.push(span));
            });
        });
        spans.forEach(span => {
            const node = span.childNodes[0];
            if (node.nodeType === Node.TEXT_NODE && /#\d+/.test(node.textContent)) {
                const text = node.textContent;
                const match = text.match(/(#\d+)/);
                if (match) {
                    const idText = match[1];
                    const after = text.substring(match.index + idText.length + 1);
                    const idSpan = document.createElement('span');
                    idSpan.textContent = idText + '\n';
                    idSpan.style.color = '#bbb';
                    if (after) span.insertBefore(document.createTextNode(after), node.nextSibling);
                    span.parentNode.prepend(idSpan);
                    span.removeChild(node);
                }
            }
        });
    });
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: false
    });
});