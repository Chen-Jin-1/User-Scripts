// ==UserScript==
// @name                快捷回复
// @namespace           cj-reply
// @version             1.0.2
// @description         在 Gandi 中快捷查看回复
// @author              Chen-Jin
// @match               https://www.ccw.site/gandi*
// @match               https://www.ccw.site/creator*
// @match               https://assets.ccw.site/*
// @icon                https://m.ccw.site/user_projects_assets/4448f7d5994cbe0e5283098aad745d4b.svg
// @updateURL           https://us.chen-jin.dpdns.org/reply.user.js?
// @downloadURL         https://us.chen-jin.dpdns.org/reply.user.js?
// @run-at              document-idle
// ==/UserScript==

// 搬运请先经过作者许可

const extIcon = "https://m.ccw.site/user_projects_assets/4448f7d5994cbe0e5283098aad745d4b.svg";
function makeDraggable(element) {
    let isDragging = false;
    let dragPerformed = false;
    let startX, startY;
    let initialRight, initialTop;
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('torchstart', startDrag);
    
    function startDrag(e) {
        element.style.cursor = "grabbing";
        isDragging = true;
        dragPerformed = false;
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
    
    function onDrag(e) {
        if (!isDragging) return;
        
        const moveX = Math.abs(e.clientX - startX);
        const moveY = Math.abs(e.clientY - startY);
        
        if (moveX > 5 || moveY > 5) {
            dragPerformed = true;
        }
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        element.style.right = (initialRight - deltaX) + 'px';
        element.style.top = (initialTop + deltaY) + 'px';
    }
    
    function stopDrag() {
        element.style.cursor = "";
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        
        if (dragPerformed) {
            const clickHandler = function(e) {
                e.preventDefault();
                e.stopPropagation();
                element.removeEventListener('click', clickHandler, true);
            };
            element.addEventListener('click', clickHandler, true);
            
            setTimeout(() => {
                element.removeEventListener('click', clickHandler, true);
            }, 100);
        }
    }
}

document.getElementById("cj-reply1-button")?.remove();
document.getElementById("cj-reply1-css")?.remove();
const css = document.createElement("style");
css.id = "cj-reply1-css";
css.textContent = `#cj-reply1-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    height: 50px;
    width: 50px;
    z-index: 12345678;
    border-radius: 50%;
    padding: 10px;
    background: #ffffff50;
    transition: all 0.3s ease, right 0s, top 0s;
    backdrop-filter: blur(5px);
    user-select: none;
    -webkit-user-drag: element;
    border: 1px solid #fff;
}

#cj-reply1-button img {
    height: 100%;
    width: 100%;
    pointer-events: none;
}

#cj-reply1-iframe {
    position: fixed;
    top: 0;
    left: 100vw;
    transition-duration: 0.3s;
    z-index: 11111111;
    height: 100%;
    width: 100vw;
    background: #00000060;
}

#cj-reply1-button:hover {
    background: #ffffffaa;
}

#cj-reply1-button span {
    position: absolute;
    right: 7px;
    top: 10px;
    padding: 1px;
    background: #f45940;
    flex-wrap: nowrap;
    height: 15px;
    min-width: 15px;
    line-height: 15px;
    border-radius: 15px;
    font-size: 10px;
    color: #fff;
    text-align: center;
    display: none;
}`;
document.head.appendChild(css);
const btn = document.createElement("button");
btn.id = "cj-reply1-button";
btn.innerHTML = '<img src="https://m.ccw.site/user_projects_assets/4448f7d5994cbe0e5283098aad745d4b.svg">';
document.body.appendChild(btn);
const num = document.createElement("span");
btn.appendChild(num);
makeDraggable(btn);
const ifr = document.createElement("iframe");
ifr.id = "cj-reply1-iframe";
ifr.src = "https://www.ccw.site/notice/reply";

async function update() {
    const noti = await fetch("https://community-web.ccw.site/notification/stats/v2", {
        method: "post",
        body: "{countAll: true}",
        headers: {'content-type': 'application/json'},
        credentials: 'include'
    })
        .then(r => r.json())
        .then(({body}) => body.COMMENT_TO_ME);
    if (noti) {
        num.textContent = noti;
        num.style.display = "unset";
    } else {
        num.style.display = "none";
    }
}

setInterval(update, 10000);
function openIframe() {
    num.style.display = "none";
    document.body.appendChild(ifr);
    requestAnimationFrame(() => ifr.style.left = "0");
    btn.title = "退出回复页面";
    btn.onclick = closeIframe;
}

function closeIframe() {
    ifr.style.left = "100vw";
    btn.title = "进入回复页面";
    setTimeout(() => {
        document.body.removeChild(ifr);
        btn.onclick = openIframe;
    }, 300);
    btn.onclick = null;
}

btn.title = "进入回复页面";
btn.onclick = openIframe;