// ==UserScript==
// @name         Monoco Editor 输入
// @namespace    cj-monaco-input
// @version      -1
// @description  在 Gandi IDE 使用 Monaco Editor 输入
// @match        https://www.ccw.site/gandi*
// @run-at       document-start
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/monacoInput.user.js
// @grant        none
// ==/UserScript==

let style = new CSSStyleSheet();
style.replaceSync(`/* ===== Monaco Editor 样式 ===== */

/* 主容器 - 全屏覆盖 */
.monaco-editor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  animation: monacoFadeIn 0.3s ease-out;
}

@keyframes monacoFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 工具栏 */
.monaco-toolbar {
  padding: 12px 24px;
  background: #252526;
  color: #cccccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.monaco-toolbar-title {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.monaco-toolbar-title .icon {
  font-size: 18px;
}

.monaco-toolbar-actions {
  display: flex;
  gap: 10px;
}

.monaco-toolbar-actions button {
  padding: 6px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  outline: none;
  font-family: inherit;
}

/* 保存按钮 */
.btn-save {
  background: #0e639c;
  color: white;
}

.btn-save:hover {
  background: #1177bb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 99, 156, 0.4);
}

.btn-save:active {
  transform: translateY(0px);
}

/* 取消按钮 */
.btn-cancel {
  background: #3e3e42;
  color: #cccccc;
}

.btn-cancel:hover {
  background: #4e4e52;
  transform: translateY(-1px);
}

.btn-cancel:active {
  transform: translateY(0px);
}

/* 编辑器包装器 */
.monaco-editor-wrapper {
  flex: 1;
  padding: 12px;
  min-height: 0;
  background: #1e1e1e;
}

.monaco-editor-wrapper .monaco-editor {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

/* Monaco 编辑器内部样式覆盖 */
.monaco-editor-wrapper .monaco-editor .margin {
  background: #1e1e1e !important;
}

.monaco-editor-wrapper .monaco-editor .monaco-scrollable-element {
  border-radius: 6px;
}

/* ===== 状态栏（可选） ===== */
.monaco-status-bar {
  padding: 6px 20px;
  background: #007acc;
  color: white;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.monaco-status-bar .info {
  display: flex;
  gap: 16px;
}

.monaco-status-bar .info span {
  opacity: 0.8;
}

/* ===== 响应式适配 ===== */
@media (max-width: 768px) {
  .monaco-toolbar {
    padding: 8px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .monaco-toolbar-title {
    font-size: 12px;
  }

  .monaco-toolbar-actions button {
    padding: 4px 12px;
    font-size: 12px;
  }

  .monaco-editor-wrapper {
    padding: 6px;
  }
}

@media (max-width: 480px) {
  .monaco-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .monaco-toolbar-actions {
    justify-content: stretch;
  }

  .monaco-toolbar-actions button {
    flex: 1;
  }
}

/* ===== 加载动画 ===== */
.monaco-editor-container.loading {
  pointer-events: none;
}

.monaco-editor-container.loading::after {
  content: '加载中...';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #cccccc;
  font-size: 16px;
  z-index: 1;
}

.monaco-editor-container.loading .monaco-editor-wrapper {
  opacity: 0.5;
}

/* ===== 滚动条美化 ===== */
.monaco-editor-wrapper ::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.monaco-editor-wrapper ::-webkit-scrollbar-track {
  background: #1e1e1e;
  border-radius: 6px;
}

.monaco-editor-wrapper ::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 6px;
}

.monaco-editor-wrapper ::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}

.monaco-editor-wrapper ::-webkit-scrollbar-corner {
  background: transparent;
}

/* ===== 工具栏图标 ===== */
.monaco-toolbar .shortcut-hint {
  font-size: 11px;
  opacity: 0.6;
  margin-left: 6px;
  font-weight: normal;
}

/* ===== 无障碍支持 ===== */
.monaco-toolbar-actions button:focus-visible {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.monaco-toolbar-actions button:active {
  transform: scale(0.98);
}

/* ===== 高级编辑器特殊样式 ===== */
.monaco-editor-container .monaco-editor .view-line {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
}

.monaco-editor-container .monaco-editor .line-numbers {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
  color: #858585 !important;
}

/* ===== 与 Blockly 兼容 ===== */
.monaco-editor-container .monaco-editor .cursor {
  border-color: #ffffff !important;
}

.monaco-editor-container .monaco-editor .selected-text {
  background: #264f78 !important;
}

/* ===== 全屏模式额外样式 ===== */
.monaco-editor-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
}

/* ===== 自定义主题支持 ===== */
.monaco-editor-container[data-theme="light"] .monaco-toolbar {
  background: #ffffff;
  border-bottom: 1px solid #d0d0d0;
}

.monaco-editor-container[data-theme="dark"] .monaco-toolbar {
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

/* ===== 错误状态 ===== */
.monaco-editor-container.has-error .monaco-editor-wrapper {
  border: 2px solid #f44336;
  border-radius: 6px;
}

.monaco-editor-container .error-message {
  display: none;
  padding: 8px 16px;
  background: #f44336;
  color: white;
  font-size: 13px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.monaco-editor-container.has-error .error-message {
  display: block;
}

/* ===== 键盘提示 ===== */
.keyboard-hint {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  margin: 0 2px;
}

.monaco-toolbar .keyboard-hint {
  color: #858585;
}

@media (prefers-color-scheme: light) {
  .monaco-toolbar .keyboard-hint {
    background: rgba(0, 0, 0, 0.05);
    color: #666;
  }
}`);
document.adoptedStyleSheets.push(style);

Object.defineProperty(window, 'GandiPlugins', {
  set: v => {
    const _ = v.default.prototype.initPluginsManager;
    v.default.prototype.initPluginsManager = function() {
      _.call(this);
      Object.defineProperty(this.plugins, 'witcat-blockinput', {
        get: () => () => {},
        set: v => v(),
      });
    }
    delete window.GandiPlugins;
    window.GandiPlugins = v;
  },
  configurable: 1,
});


function s(rt) {
  let language, Blockly = rt.scratchBlocks, checkLong = 20, show = 0;
  const lineText = (function() {
    let textarea = "textarea";
    let renderWidth = 20;
    let ResizeEditorAble = false;
    let lineRender = true;
    let inputLabelTextAnchor = "middle";
    let monacoEditorInstance = null;
    let monacoContainer = null;

    const getToolboxAndWorkspaceBlocks = (workspace) => {
      const toolbox = workspace.getToolbox();
      if (toolbox) {
        return toolbox.flyout_.getWorkspace().getAllBlocks().concat(workspace.getAllBlocks());
      }
      return [];
    };

    const opcodeToSettings = {
      text: "text",
      argument_editor_string_number: "text",
      math_number: "number",
      math_integer: "number",
      math_whole_number: "number",
      math_positive_number: "number",
      math_angle: "number",
      note: "number",
      colour_picker: "color",
    };

    let borderRestoration = {
      text: false,
      number: false,
      color: false,
    };

    // 保存原始方法
    let originShowEditor_ = null;
    let originHtmlInputKeyDown_ = null;
    let originalRender_ = null;
    let originalResizeEditor_ = null;
    let originCloseEditor_ = null;

    return {
      init: function(Blockly) {
        originShowEditor_ = Blockly.FieldTextInput.prototype.showEditor_;
        originHtmlInputKeyDown_ = Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_;
        originalRender_ = Blockly.FieldTextInput.prototype.render_;
        originalResizeEditor_ = Blockly.FieldTextInput.prototype.resizeEditor_;
        originCloseEditor_ = Blockly.FieldTextInput.prototype.closeEditor_;
      },

      // 直接检查 Monaco 是否可用
      isMonacoAvailable: () => typeof monaco !== 'undefined',

      checkAndShowPopup: function(input) {
        return new Promise((resolve) => {
          const currentValue = input.value || '';

          const container = document.createElement('div');
          container.className = 'monaco-editor-container';
          container.id = 'monaco-popup-container';

          const toolbar = document.createElement('div');
          toolbar.className = 'monaco-toolbar';
          toolbar.innerHTML = `
      <span class="monaco-toolbar-title">📝 长文本编辑器 (Ctrl+Enter 保存 · Esc 取消)</span>
      <div class="monaco-toolbar-actions">
        <button class="btn-save" id="popup-save-btn">保存 (Ctrl+Enter)</button>
        <button class="btn-cancel" id="popup-cancel-btn">取消 (Esc)</button>
      </div>
    `;
          container.appendChild(toolbar);

          const editorWrapper = document.createElement('div');
          editorWrapper.className = 'monaco-editor-wrapper';
          container.appendChild(editorWrapper);

          document.body.appendChild(container);

          const editor = monaco.editor.create(editorWrapper, {
            value: currentValue,
            language: language || 'text',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
              enabled: true
            },
            fontSize: 14,
            wordWrap: 'on',
            lineNumbers: 'on'
          });

          setTimeout(() => {
            editor.layout();
            editor.focus();
          }, 100);

          Blockly.DropDownDiv.hide();
          
          const closeInput = () => {
            Blockly.WidgetDiv.hide();
            
          }

          document.getElementById('popup-save-btn').addEventListener('click', () => {
            const newValue = editor.getValue();
            input.value = newValue;
            editor.dispose();
            container.remove();
            resolve(newValue);
            closeInput();
          });

          document.getElementById('popup-cancel-btn').addEventListener('click', () => {
            editor.dispose();
            container.remove();
            resolve(null);
            closeInput();
          });

          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            document.getElementById('popup-save-btn').click();
          });
          editor.addCommand(monaco.KeyCode.Escape, () => {
            document.getElementById('popup-cancel-btn').click();
          });
          container.onclick = e => e.stopPropagation();
        });
      },


      linerender: function(value, workspace, rerender) {
        lineRender = value;
        if (rerender !== false) {
          getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
            if (opcodeToSettings[block.type]) {
              const inputBlock = block.inputList[0].fieldRow[0];
              inputBlock.setVisible(false);
              inputBlock.setVisible(true);
              block.render();
            }
          });
        }
      },

      lineTextLeft: function(value, workspace, blockly) {
        inputLabelTextAnchor = value ? "start" : "middle";
        getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
          if (opcodeToSettings[block.type]) {
            const inputBlock = block.inputList[0].fieldRow[0];
            inputBlock.setVisible(false);
            inputBlock.setVisible(true);
            block.render();
          }
        });
      },

      svgStart: function(start, workspace, blockly, type) {
        let needRerenderBlockTypes = new Set(["text", "number", "color"]);
        if (type) {
          if (borderRestoration[type] === start) {
            return;
          }
          needRerenderBlockTypes = new Set([type]);
        }
        needRerenderBlockTypes.forEach((needRerenderBlockType) => {
          borderRestoration[needRerenderBlockType] = start;
        });
        getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
          if (needRerenderBlockTypes.has(opcodeToSettings[block.type])) {
            block.setOutputShape(
              borderRestoration[opcodeToSettings[block.type]] === true ?
              blockly.OUTPUT_SHAPE_SQUARE :
              blockly.OUTPUT_SHAPE_ROUND,
            );
            block.render();
          }
        });
      },

      svg: function(Blockly) {
        const originalJsonInit = Blockly.BlockSvg.prototype.jsonInit;

        Blockly.BlockSvg.prototype.jsonInit = function(json) {
          if (borderRestoration[opcodeToSettings[this.type]] === true) {
            originalJsonInit.call(this, {
              ...json,
              outputShape: Blockly.OUTPUT_SHAPE_SQUARE,
            });
          } else {
            originalJsonInit.call(this, json);
          }
        };
      },

      changTextarea: function(start) {
        textarea = start ? "textarea" : "input";
      },

      changeRenderWidth: function(width, workspace, rerender) {
        if (renderWidth === (width > 20 ? width : 20)) return;
        renderWidth = width > 20 ? width : 20;
        if (rerender !== false) {
          getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
            if (opcodeToSettings[block.type]) {
              const inputBlock = block.inputList[0].fieldRow[0];
              inputBlock.setVisible(false);
              inputBlock.setVisible(true);
              block.render();
            }
          });
        }
      },

      texthide: function(num, workspace, blockly, rerender) {
        if (blockly.BlockSvg.MAX_DISPLAY_LENGTH === (num > 0 ? num : Infinity)) return;
        blockly.BlockSvg.MAX_DISPLAY_LENGTH = num > 0 ? num : Infinity;
        if (rerender !== false) {
          getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
            if (opcodeToSettings[block.type]) {
              const inputBlock = block.inputList[0].fieldRow[0];
              inputBlock.maxDisplayLength = blockly.BlockSvg.MAX_DISPLAY_LENGTH;
              inputBlock.setVisible(false);
              inputBlock.setVisible(true);
              block.render();
            }
          });
        }
      },

      texthides: function(num, workspace, blockly, rerender) {
        if (blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH === (num > 0 ? num : Infinity)) return;
        blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH = num > 0 ? num : Infinity;
        if (rerender !== false) {
          getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
            if (opcodeToSettings[block.type]) {
              const inputBlock = block.inputList[0].fieldRow[0];
              inputBlock.maxDisplayLength = blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH;
              inputBlock.setVisible(false);
              inputBlock.setVisible(true);
              block.render();
            }
          });
        }
      },

      textarea: function(Blockly) {
        const originShowEditor = Blockly.FieldTextInput.prototype.showEditor_;
        const check = (input = document.querySelector('.blocklyHtmlInput')) => {
          if (!input) return;
          lastInputValue = input.value;
          input.style.resize = "none";

          if (input.value.length > checkLong) {
              lineText.checkAndShowPopup(input)
          }
        }
        Blockly.FieldTextInput.prototype.showEditor_ = function(e) {
          const op = this.sourceBlock_.parentBlock_.type;
          language = op === "cjjst_js" || op === "i_run" || op === "WitCatHTML_jsfunc" ||
            op === "WitCatHTML_jsfuncs" || op === "functionHTML" ?
            'javascript' :
            op === "WitCatHTML_html" ?
            'html' :
            'text';
          originShowEditor.call(this, e);
          check();
        };

        const originKeyDown = Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_;
        Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_ = function(e) {
          originKeyDown.call(this, e);
          check();
        };
      },

      dispose: function(workspace, Blockly) {
        Blockly.FieldTextInput.prototype.showEditor_ = originShowEditor_;
        Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_ = originHtmlInputKeyDown_;
        Blockly.FieldTextInput.prototype.render_ = originalRender_;
        Blockly.FieldTextInput.prototype.resizeEditor_ = originalResizeEditor_;
        Blockly.FieldTextInput.prototype.closeEditor_ = originCloseEditor_;
        Blockly.BlockSvg.MAX_DISPLAY_LENGTH = Infinity;

        let needRerenderBlockTypes = new Set(["text", "number", "color"]);
        needRerenderBlockTypes.forEach((needRerenderBlockType) => {
          borderRestoration[needRerenderBlockType] = false;
        });

        getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
          const key = opcodeToSettings[block.type];
          if (key) {
            if (needRerenderBlockTypes.has(key)) {
              block.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
            }
            const inputBlock = block.inputList[0].fieldRow[0];
            inputBlock.maxDisplayLength = Blockly.BlockSvg.MAX_DISPLAY_LENGTH;
            inputBlock.textElement_?.setAttribute("text-anchor", "middle");
            inputBlock.size_.height = Blockly.BlockSvg.FIELD_HEIGHT;
            inputBlock.setVisible(false);
            inputBlock.setVisible(true);
            block.render();
          }
        });
      }
    };
  })();

  function initWitcatBlockinput(blocklyInstance, workspaceInstance) {
    const workspace = Blockly.getMainWorkspace();

    lineText.init(Blockly);

    let textLeft = true;
    let loaded = [];
    let timer = null;
    let lastInputValue = '';

    function debounce(func, delay) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func();
      }, delay);
    }

    const listener = function() {
      if (isPopupOpen) return;

      const input = document.querySelector('.blocklyHtmlInput');
      if (!input) return;

      // // 如果值没有变化，不处理
      // if (input.value === lastInputValue) return;
      // lastInputValue = input.value;

      // if (input.value.length > checkLong) {
      //   if (!show) {
      //     show = true;
      //     isPopupOpen = true;

      //     lineText.checkAndShowPopup(input).then(() => {
      //       show = false;
      //       isPopupOpen = false;
      //     }).catch(() => {
      //       show = false;
      //       isPopupOpen = false;
      //     });
      //   }
      // }

      // setTimeout(() => {
      //   if (input.scrollHeight <= input.offsetHeight) {
      //     input.style.lineHeight = input.scrollHeight + "px";
      //     if (input.scrollHeight > input.offsetHeight) {
      //       input.style.lineHeight = "1.2";
      //     }
      //   } else {
      //     input.style.lineHeight = "1.2";
      //   }
      // }, 10);
    };

    // ✅ 监听 input 事件
    document.addEventListener('input', function(e) {
      const input = e.target;
      if (input && input.classList && input.classList.contains('blocklyHtmlInput')) {
        listener();
      }
    });

    lineText.svg(Blockly);
    lineText.svgStart(true, workspace, Blockly, "text");
    lineText.changeRenderWidth(20, workspace);
    lineText.changTextarea(true);
    lineText.linerender(true, workspace, false);
    lineText.texthide(20, workspace, Blockly);
    lineText.texthides(3, workspace, Blockly);
    lineText.textarea(Blockly);


    return {
      dispose: function() {
        document.removeEventListener('input', listener);
        // document.body.removeEventListener("startInputing", listener);
        lineText.changTextarea(false);
        lineText.dispose(workspace, Blockly);
      },
      setCheckLong: function(value) {
        checkLong = value;
      },
      getCheckLong: function() {
        return checkLong;
      },
      setTextLeft: function(value) {
        textLeft = value;
      },
      setLineRender: function(value) {
        lineText.linerender(value, workspace);
      },
      setRenderWidth: function(value) {
        lineText.changeRenderWidth(value, workspace);
      },
      setTextHide: function(value) {
        lineText.texthide(value, workspace, Blockly);
      },
      setTextHideLines: function(value) {
        lineText.texthides(value, workspace, Blockly);
      }
    };
  }

  // ============================================
  // 3. 暴露到全局
  // ============================================
  window.WitcatBlockinput = {
    init: initWitcatBlockinput,
    lineText: lineText,
  };

  // 自动初始化
  const instance = initWitcatBlockinput(rt.scratchBlocks, rt.scratchBlocks.getMainWorkspace());
  window.__witcatInstance = instance;

  return __witcatInstance.dispose;
}

const _bind = Function.prototype.bind;
Function.prototype.bind = function(t, ...args) {
  if (t?.runtime && t.greenFlag) {
    window.addEventListener("load", () => s(t.runtime));
    Function.prototype.bind = _bind;
  }
  return _bind.call(this, t, ...args);
};