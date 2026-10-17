// ==UserScript==
// @name         复制确认
// @namespace    cj-copy-confirm
// @version      1.0.0
// @description  在复制到剪贴板前询问
// @match        *://*/*
// @run-at       document-start
// @icon         https://www.chen-jin.dpdns.org/Chen-Jin-circle.png
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/copyConfirm.user.js
// @grant        none
// ==/UserScript==

const STATE = {
  blockAll: false,
  cooldownUntil: 0,
  cooldownMs: 3000,
};

function isSilentMode() {
  return STATE.blockAll || Date.now() < STATE.cooldownUntil;
}

function handleUserCancel() {
  if (confirm('拦截所有复制操作？')) {
    STATE.blockAll = true;
  } else {
    STATE.cooldownUntil = Date.now() + STATE.cooldownMs;
  }
}

function askPermission(displayText, methodLabel) {
  if (isSilentMode()) return false;
  if (confirm(`允许由 ${methodLabel} 复制以下内容？\n\n${displayText}`)) return true;
  handleUserCancel();
  return false;
}

async function getTextFromClipboardItem(item) {
  try {
    const types = item.types || [];
    const textType = types.find(t => t === 'text/plain' || t === 'text/html');
    if (!textType) return '[非文本内容]';
    const blob = await item.getType(textType);
    return await blob.text();
  } catch (e) {
    return '[无法读取内容]';
  }
}

const originalWriteText = navigator.clipboard?.writeText;
originalWriteText && (navigator.clipboard.writeText = async function (text) {
  const allow = askPermission(text, 'writeText');
  if (allow) return originalWriteText.call(navigator.clipboard, text);
  return;
});

const originalWrite = navigator.clipboard?.write;
originalWrite && (navigator.clipboard.write = async function (data) {
  let displayText = '';
  try {
    if (Array.isArray(data)) {
      const texts = await Promise.all(data.map(getTextFromClipboardItem));
      displayText = texts.join('\n---\n');
    } else {
      displayText = '[无法解析 ClipboardItem]';
    }
  } catch (e) {
    displayText = '[读取内容时出错]';
  }

  const allow = askPermission(displayText, 'write');
  if (allow) return originalWrite.call(navigator.clipboard, data);
  return;
});

const originalExecCommand = document.execCommand;
document.execCommand = function (command, showUI, value) {
  if (command.toLowerCase() === 'copy') {
    let selectedText = '';
    const sel = window?.getSelection?.();
    if (sel?.toString()) selectedText = sel.toString();

    const displayText = selectedText || '[空]';
    const allow = askPermission(displayText, "execCommand");
    if (!allow) return true;
  }
  return originalExecCommand.call(document, command, showUI, value);
};