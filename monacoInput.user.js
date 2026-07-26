// ==UserScript==
// @name         Monoco Editor 输入
// @namespace    cj-monaco-input
// @version      1.0.0
// @description  在 Gandi IDE 使用 Monaco Editor 输入
// @match        https://www.ccw.site/gandi*
// @run-at       document-start
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @author       Chen-Jin
// @downloadURL  https://us.chen-jin.dpdns.org/monacoInput.user.js
// @grant        none
// ==/UserScript==

let rt = 0, style = new CSSStyleSheet();
style.replaceSync(`/* ===== Monaco Editor 样式 ===== */

/* 主容器 - 全屏覆盖 */
.monaco-editor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
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

/* ===== 暗色主题适配 ===== */
@media (prefers-color-scheme: light) {
  .monaco-editor-container {
    background: #ffffff;
  }
  
  .monaco-toolbar {
    background: #f3f3f3;
    color: #333333;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .monaco-editor-wrapper {
    background: #ffffff;
  }
  
  .btn-save {
    background: #0066b3;
  }
  
  .btn-save:hover {
    background: #0077cc;
  }
  
  .btn-cancel {
    background: #e0e0e0;
    color: #333333;
  }
  
  .btn-cancel:hover {
    background: #d0d0d0;
  }
  
  .monaco-editor-wrapper .monaco-editor .margin {
    background: #f3f3f3 !important;
  }
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
            console.log(this);
            Object.defineProperty(this.plugins, 'witcat-blockinput', {
                get: () => () => {},
                set: v => v(),
            })
        }
        delete window.GandiPlugins;
        window.GandiPlugins = v;
    },
    configurable: 1,
});


function s(rt) {
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

      // 检查 Monaco 是否可用
      isMonacoAvailable: function() {
        return typeof monaco !== 'undefined' && monaco.editor;
      },

      // 使用 Monaco Editor 替代原输入框
      setupMonacoEditor: function(Blockly) {
        if (!this.isMonacoAvailable()) {
          console.warn('Monaco Editor not available, using fallback');
          return false;
        }

        const self = this;

        // 修改 showEditor_ 使用 Monaco
        Blockly.FieldTextInput.prototype.showEditor_ = function(e) {
          // 如果已经有编辑器打开，先关闭
          if (this.monacoEditor_) {
            this.closeEditor_();
          }

          const opcode = this.sourceBlock_.parentBlock_.type;
          const language = opcode === "cjjst_js" || opcode === "i_js" ? 'javascript' : 'text';

          // 获取当前值
          const currentValue = this.getValue() || '';
          
          // 创建容器
          const container = document.createElement('div');
          container.className = 'monaco-editor-container';
          
          // 创建工具栏
          const toolbar = document.createElement('div');
          toolbar.className = 'monaco-toolbar';
          toolbar.innerHTML = `
            <span class="monaco-toolbar-title">📝 高级编辑器 (Ctrl+Enter 保存 · Esc 取消)</span>
            <div class="monaco-toolbar-actions">
              <button class="btn-save" id="monaco-save-btn">保存 (Ctrl+Enter)</button>
              <button class="btn-cancel" id="monaco-cancel-btn">取消 (Esc)</button>
            </div>
          `;
          container.appendChild(toolbar);
          
          // 编辑器容器
          const editorWrapper = document.createElement('div');
          editorWrapper.className = 'monaco-editor-wrapper';
          container.appendChild(editorWrapper);
          
          document.body.appendChild(container);
          
          // 创建 Monaco Editor
          const editor = monaco.editor.create(editorWrapper, {
            value: currentValue,
            language,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true, maxColumn: 80 },
            fontSize: 14,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            lineNumbers: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false
            },
            renderWhitespace: 'selection',
            tabSize: 2,
            insertSpaces: true
          });
          
          // 保存引用
          this.monacoEditor_ = editor;
          this.monacoContainer_ = container;
          
          // 调整大小
          setTimeout(() => {
            editor.layout();
          }, 100);
          
          // 保存按钮
          document.getElementById('monaco-save-btn').addEventListener('click', () => {
            const newValue = editor.getValue();
            this.setValue(newValue);
            this.closeEditor_();
          });
          
          // 取消按钮
          document.getElementById('monaco-cancel-btn').addEventListener('click', () => {
            this.closeEditor_();
          });
          
          // 快捷键：Ctrl+Enter 保存
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            document.getElementById('monaco-save-btn').click();
          });
          
          // 快捷键：Esc 取消
          editor.addCommand(monaco.KeyCode.Escape, () => {
            document.getElementById('monaco-cancel-btn').click();
          });
          
          // 自动调整大小
          const resizeObserver = new ResizeObserver(() => {
            editor.layout();
          });
          resizeObserver.observe(editorWrapper);
          this.monacoResizeObserver_ = resizeObserver;
          
          // 聚焦编辑器
          setTimeout(() => {
            editor.focus();
          }, 50);
        };

        // 修改 closeEditor_ 清理 Monaco
        Blockly.FieldTextInput.prototype.closeEditor_ = function() {
          // 清理 Monaco
          if (this.monacoEditor_) {
            this.monacoEditor_.dispose();
            this.monacoEditor_ = null;
          }
          if (this.monacoResizeObserver_) {
            this.monacoResizeObserver_.disconnect();
            this.monacoResizeObserver_ = null;
          }
          if (this.monacoContainer_) {
            this.monacoContainer_.remove();
            this.monacoContainer_ = null;
          }
          
          // 调用原方法
          if (originCloseEditor_) {
            originCloseEditor_.call(this);
          }
        };

        return true;
      },

      // 弹窗使用 Monaco
      showMonacoPopup: function(input, checkLong) {
        return new Promise((resolve) => {
          if (!this.isMonacoAvailable()) {
            // 降级方案
            resolve();
            return;
          }

          const currentValue = input.value || '';
          
          // 创建全屏容器
          const container = document.createElement('div');
          container.className = 'monaco-editor-container';
          
          // 创建工具栏
          const toolbar = document.createElement('div');
          toolbar.className = 'monaco-toolbar';
          toolbar.innerHTML = `
            <span class="monaco-toolbar-title">📝 高级编辑器 (Ctrl+Enter 保存 · Esc 取消)</span>
            <div class="monaco-toolbar-actions">
              <button class="btn-save" id="popup-save-btn">保存 (Ctrl+Enter)</button>
              <button class="btn-cancel" id="popup-cancel-btn">取消 (Esc)</button>
            </div>
          `;
          container.appendChild(toolbar);
          
          // 编辑器容器
          const editorWrapper = document.createElement('div');
          editorWrapper.className = 'monaco-editor-wrapper';
          container.appendChild(editorWrapper);
          
          document.body.appendChild(container);
          
          // 创建编辑器
          const editor = monaco.editor.create(editorWrapper, {
            value: currentValue,
            language: 'text',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            lineNumbers: 'on'
          });
          
          setTimeout(() => {
            editor.layout();
            editor.focus();
          }, 100);
          
          // 保存
          document.getElementById('popup-save-btn').addEventListener('click', () => {
            const newValue = editor.getValue();
            input.value = newValue;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            editor.dispose();
            container.remove();
            resolve();
          });
          
          // 取消
          document.getElementById('popup-cancel-btn').addEventListener('click', () => {
            editor.dispose();
            container.remove();
            resolve();
          });
          
          // 快捷键
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            document.getElementById('popup-save-btn').click();
          });
          
          editor.addCommand(monaco.KeyCode.Escape, () => {
            document.getElementById('popup-cancel-btn').click();
          });
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
              borderRestoration[opcodeToSettings[block.type]] === true
                ? blockly.OUTPUT_SHAPE_SQUARE
                : blockly.OUTPUT_SHAPE_ROUND,
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

      textLeft: function(start) {
      //   if (start) {
      //     styleElement.innerHTML = `
      //       .blocklyHtmlInput{
      //         text-align: left;
      //       }
      //     `;
      //   } else {
      //     styleElement.innerHTML = `
      //       .blocklyHtmlInput{
      //         text-align: center;
      //       }
      //     `;
      //   }
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
        // 如果 Monaco 可用，使用 Monaco 版本
        if (this.isMonacoAvailable()) {
          this.setupMonacoEditor(Blockly);
          return;
        }

        // 否则使用原 textarea 版本
        const originShowEditorFunc = originShowEditor_;
        Blockly.FieldTextInput.prototype.showEditor_ = function(e) {
          const originalCreateElement = document.createElement;
          document.createElement = function(tagName) {
            document.createElement = originalCreateElement;
            if (
              tagName === "INPUT" &&
              document.getElementsByClassName("gandi_custom-procedures_workspace_1d2uW").length === 0
            ) {
              let s = originalCreateElement.call(document, "div");
              s.ClassName = "blocklyHtmlInputs";
              return originalCreateElement.call(document, textarea);
            } else {
              return originalCreateElement.call(document, tagName);
            }
          };
          originShowEditorFunc.call(this, e);
          document.createElement = originalCreateElement;

          const event = new Event("startInputing");
          document.body.dispatchEvent(event);
        };

        const originalResizeEditor = originalResizeEditor_;
        Blockly.FieldTextInput.prototype.resizeEditor_ = function() {
          if (!ResizeEditorAble) {
            originalResizeEditor.call(this);
            if (textarea === "textarea") {
              var scale = this.sourceBlock_.workspace.scale;
              var div = Blockly.WidgetDiv.DIV;

              var initialWidth;
              if (this.sourceBlock_.isShadow()) {
                initialWidth = this.sourceBlock_.getHeightWidth().width * scale;
              } else {
                initialWidth = this.size_.width * scale;
              }

              var width;
              if (Blockly.BlockSvg.FIELD_TEXTINPUT_EXPAND_PAST_TRUNCATION) {
                var textWidth = Blockly.scratchBlocksUtils.measureText(
                  Blockly.FieldTextInput.htmlInput_.style.fontSize,
                  Blockly.FieldTextInput.htmlInput_.style.fontFamily,
                  Blockly.FieldTextInput.htmlInput_.style.fontWeight,
                  Blockly.FieldTextInput.htmlInput_.value,
                );
                textWidth += Blockly.FieldTextInput.TEXT_MEASURE_PADDING_MAGIC;
                textWidth *= scale;
                width = textWidth;
              } else {
                width = initialWidth;
              }
              width = Math.max(width, Blockly.BlockSvg.FIELD_WIDTH_MIN_EDIT * scale);
              width = Math.min(width, Blockly.BlockSvg.FIELD_WIDTH_MAX_EDIT * scale);
              div.style.width = width / scale + 1 + "px";
              div.style.height = this.size_.height + "px";
              div.style.transform = "scale(" + scale + ")";

              div.style.marginLeft = -0.5 * (width - initialWidth) + "px";

              var borderRadius = this.getBorderRadius() + 0.5;
              div.style.borderRadius = borderRadius + "px";
              Blockly.FieldTextInput.htmlInput_.style.borderRadius = borderRadius + "px";
              var strokeColour = this.sourceBlock_.getColourTertiary();
              div.style.borderColor = strokeColour;

              var xy = this.getAbsoluteXY_();
              xy.x -= scale / 2;
              xy.y -= scale / 2;
              if (this.sourceBlock_.RTL) {
                xy.x += width;
                xy.x -= div.offsetWidth * scale;
                xy.x += 1 * scale;
              }
              xy.y += 1 * scale;
              if (navigator.userAgent.includes("Firefox")) {
                xy.x += 2 * scale;
                xy.y += 1 * scale;
              }
              if (navigator.userAgent.includes("WebKit")) {
                xy.y -= 1 * scale;
              }
              div.style.left = xy.x + "px";
              div.style.top = xy.y + "px";
            }
          }
        };

        const originHtmlInputKeyDown = originHtmlInputKeyDown_;
        Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_ = function(e) {
          if (e.keyCode === 13) {
            let es = {};
            es.keyCode = null;
            originHtmlInputKeyDown.call(this, es);
          } else {
            originHtmlInputKeyDown.call(this, e);
          }
          const event = new Event("startInputing");
          document.body.dispatchEvent(event);
        };

        function splitStringIntoLines(inputString, charactersPerLine) {
          const regex = new RegExp(".{1," + charactersPerLine + "}", "g");
          let inputStringSplit = [];
          inputString.split("\n").forEach((line) => {
            if (line.match(regex)) inputStringSplit.push(...line.match(regex));
            else inputStringSplit.push("\u00A0");
          });
          if (inputStringSplit.length > Blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH) {
            inputStringSplit = inputStringSplit.slice(0, Blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH);
            let s = inputStringSplit[Blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH - 1];
            inputStringSplit[Blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH - 1] = s.slice(0, charactersPerLine - 3) + "…";
          }
          return inputStringSplit;
        }

        const originalRender = originalRender_;
        Blockly.FieldTextInput.prototype.render_ = function() {
          this.textElement_?.setAttribute("text-anchor", inputLabelTextAnchor);
          originalRender.call(this);
          if (textarea === "textarea") {
            if (this.visible_ && this.textElement_) {
              while (this.textElement_.firstChild) {
                this.textElement_.removeChild(this.textElement_.firstChild);
              }
              let test = this.getDisplayText_();
              if (lineRender) {
                if (this.getText()) {
                  if (this.getText().length > Blockly.BlockSvg.MAX_DISPLAY_LENGTH) {
                    test = this.getText().slice(0, Blockly.BlockSvg.MAX_DISPLAY_LENGTH - 3) + "...";
                  } else {
                    test = this.getText();
                  }
                }
              }
              const lines = splitStringIntoLines(test, renderWidth);
              let maxLengthLine = 0;
              let maxLength = 0;
              for (let index = 0; index < lines.length; index++) {
                const lineText = lines[index];
                let tspan = document.createElementNS(Blockly.SVG_NS, "tspan");
                if (lineText.length > maxLength) {
                  maxLength = lineText.length;
                  maxLengthLine = index;
                }
                tspan.textContent = lineText;
                if (index !== 0) {
                  tspan.setAttribute("dy", 16);
                } else {
                  tspan.setAttribute("x", 0);
                }
                this.textElement_.appendChild(tspan);
              }
              const fc = this.textElement_.children[maxLengthLine];

              this.size_.height = 16 * (lines.length + 1);
              this.size_.width = fc.getComputedTextLength();

              this.arrowWidth_ = 0;
              if (this.positionArrow) {
                this.arrowWidth_ = this.positionArrow(this.size_.width);
                this.size_.width += this.arrowWidth_;
              }
              var centerTextX = (this.size_.width - this.arrowWidth_) / 2;
              if (this.sourceBlock_.RTL) {
                centerTextX += this.arrowWidth_;
              }
              if (this.sourceBlock_.isShadow() && !this.positionArrow) {
                var minOffset = Blockly.BlockSvg.FIELD_WIDTH / 2;
                if (this.sourceBlock_.RTL) {
                  var minCenter = this.size_.width - minOffset;
                  centerTextX = Math.min(minCenter, centerTextX);
                } else {
                  centerTextX = Math.max(minOffset, centerTextX);
                }
              }

              this.textElement_.setAttribute("x", centerTextX);
              centerTextX = inputLabelTextAnchor === "middle" ? centerTextX : 0;
              for (const iterator of this.textElement_.children) {
                iterator.setAttribute("x", centerTextX);
              }
            }

            if (this.box_) {
              this.box_.setAttribute("width", this.size_.width);
              this.box_.setAttribute("height", this.size_.height);
            }
          }
        };
      },

      turnRender: function(bool) {
        ResizeEditorAble = bool;
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

  // ============================================
  // 2. 主功能
  // ============================================
  function initWitcatBlockinput(blocklyInstance, workspaceInstance) {
    const Blockly = rt.scratchBlocks;
    const workspace = Blockly.getMainWorkspace();

    // 初始化 lineText
    lineText.init(Blockly);
    
    // 状态变量
    let show = false;
    let inshow = false;
    let textLeft = true;
    let loaded = [];
    let checkLong = 50;
    let timer = null;
    let useMonaco = lineText.isMonacoAvailable();

    // 防抖函数
    function debounce(func, delay) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func();
      }, delay);
    }

    // 监听器
    const listener = function() {
      const input = document.querySelector('.blocklyHtmlInput');
      if (!input) return;
      
      input.style.resize = "none";
      if (input.value.length > checkLong) {
        if (!show) {
          show = true;
          if (useMonaco) {
            lineText.showMonacoPopup(input, checkLong).then(() => {
              show = false;
            });
          } else {
            // 使用原弹窗
            popups(input).then(() => {
              show = false;
            });
          }
        }
      }
      if (!inshow) {
        setTimeout(() => {
          if (input.scrollHeight <= input.offsetHeight) {
            input.style.lineHeight = input.scrollHeight + "px";
            if (input.scrollHeight > input.offsetHeight) {
              input.style.lineHeight = "1.2";
            }
          } else {
            input.style.lineHeight = "1.2";
          }
        }, 10);
      } else {
        input.style.lineHeight = "1.2";
      }
    };

    // 原弹窗函数（保留作为降级方案）
    function popups(input) {
      return new Promise((resolve) => {
        inshow = true;
        lineText.turnRender(true);
        
        const div = document.createElement("div");
        div.style.position = "fixed";
        div.style.top = "0px";
        div.style.left = "0px";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.zIndex = "9999";
        div.style.transition = "all 0.2s ease-out";
        div.style.backgroundColor = "#00000000";

        div.innerHTML = `
          <div id="myModal" class="modal">
            <div class="modals">
              <span class="close">&times;</span>
              <h5 class="modal-title">高级输入</h5>
              <div class="modal-content"></div>
            </div>
          </div>
          <style>
            .modal {
              height: 0%;
              transition: all 0.2s ease-out;
            }
            .modal-content {
              margin-top: 16px;
              height: calc(100% - 16px);
              overflow: scroll;
            }
            .modals {
              background-color: #00000000;
              margin: 15vh 25vw;
              padding: 20px;
              border-radius: 10px;
              width: 50%;
              height: 70vh;
              position: relative;
              transition: all 0.3s ease-out;
            }
            .modal-content::-webkit-scrollbar-corner {
              background-color: transparent;
            }
            .modal-content p {
              color: var(--theme-text-primary);
            }
            .modals h5 {
              position: relative;
              bottom: 10px;
              color: #00000000;
              font-size: 20px;
              transition: all 0.3s ease-out;
            }
            .close {
              cursor: pointer;
              position: absolute;
              top: 0;
              right: 10px;
              font-size: 28px;
              font-weight: bold;
              color: #00000000;
              transition: all 0.3s ease-out;
            }
            .close:hover,
            .close:focus {
              color: black;
              text-decoration: none;
            }
          </style>
        `;

        function inputstyle() {
          try {
            input.parentElement.style.opacity = "1.0";
            input.parentElement.style.position = "fixed";
            input.parentElement.style.top = "calc(15vh + 30px)";
            input.parentElement.style.left = "25vw";
            input.parentElement.style.width = "calc(50% - 20px)";
            input.parentElement.style.height = "calc(70vh - 60px)";
            input.parentElement.style.margin = "20px 10px";
            input.parentElement.style.border = "none";
            input.parentElement.style.background = "var(--theme-color-150)";
            input.parentElement.style.borderRadius = "10px";
            input.parentElement.style.transform = "";
            input.parentElement.style.padding = "10px";
            input.parentElement.style.boxShadow = "var(--theme-scrollbar-color) 0px 0px 0px 4px";
            input.style.background = "var(--theme-color-150)";
            input.style.border = "none";
            input.style.color = "var(--theme-text-primary)";
            input.style.borderRadius = "0px";
            input.style.textAlign = textLeft ? "left" : "center";
          } catch {
            input = document.querySelector('.blocklyHtmlInput');
            if (!input) return;
            input.parentElement.style.transition = "none";
            input.parentElement.style.opacity = "0.0";
            input.parentElement.style.position = "fixed";
            input.parentElement.style.top = "15vh";
            input.parentElement.style.left = "25vw";
            input.parentElement.style.width = "50%";
            input.parentElement.style.height = "70vh";
            input.parentElement.style.margin = "20px 10px";
            input.parentElement.style.border = "none";
            input.parentElement.style.background = "var(--theme-color-150)";
            input.parentElement.style.borderRadius = "10px";
            input.parentElement.style.transform = "";
            input.parentElement.style.padding = "10px";
            input.parentElement.style.boxShadow = "var(--theme-scrollbar-color) 0px 0px 0px 4px";
            input.style.background = "var(--theme-color-150)";
            input.style.border = "none";
            input.style.color = "var(--theme-text-primary)";
            input.style.borderRadius = "0px";
            input.style.textAlign = textLeft ? "left" : "center";
            setTimeout(() => {
              input.parentElement.style.transition = "all 0.3s ease-out";
              inputstyle();
            }, 10);
          }
        }

        input.parentElement.style.transition = "all 0.3s ease-out";
        inputstyle();

        document.body.appendChild(div);

        const modal = document.getElementById("myModal");
        const span = document.querySelector(".close");

        const config = {
          attributes: true,
          childList: true,
          subtree: true,
        };

        const callback = function(mutationsList, observer) {
          observer.disconnect();
          const input = document.querySelector('.blocklyHtmlInput');
          if (input) {
            inputstyle();
            observer.observe(input.parentElement, config);
          } else {
            div.style.backgroundColor = "#00000000";
            modal.style.height = "0%";
            document.querySelector('.modals').style.backgroundColor = "#00000000";
            span.style.color = "#00000000";
            document.querySelector('.modal-title').style.color = "#00000000";
            setTimeout(() => {
              inshow = false;
              lineText.turnRender(false);
              div.remove();
              resolve();
            }, 300);
          }
        };

        const observer = new MutationObserver(callback);
        observer.observe(input.parentElement, config);

        setTimeout(() => {
          div.style.backgroundColor = "var(--theme-scrollbar-color)";
          modal.style.height = "80%";
          document.querySelector('.modals').style.backgroundColor = "var(--theme-color-300)";
          span.style.color = "var(--theme-box-shadow-color)";
          document.querySelector('.modal-title').style.color = "var(--theme-text-primary)";
        }, 300);
      });
    }

    // 初始化功能
    if (loaded.indexOf("start") === -1) {
      document.body.addEventListener("startInputing", listener);
      loaded.push("start");
    }
    
    if (loaded.indexOf("textLeft") === -1) {
      lineText.textLeft(false);
      loaded.push("textLeft");
    }
    
    if (loaded.indexOf("svg") === -1) {
      lineText.svg(Blockly);
      loaded.push("svg");
    }
    
    if (loaded.indexOf("svgStart-text") === -1) {
      lineText.svgStart(true, workspace, Blockly, "text");
      loaded.push("svgStart-text");
    }
    
    if (loaded.indexOf("changeRenderWidth") === -1) {
      lineText.changeRenderWidth(20, workspace);
      loaded.push("changeRenderWidth");
    }
    
    if (loaded.indexOf("textarea") === -1) {
      lineText.textarea(Blockly);
      loaded.push("textarea");
    }
    
    if (loaded.indexOf("changTextarea") === -1) {
      lineText.changTextarea(true);
      loaded.push("changTextarea");
    }
    
    if (loaded.indexOf("linerender") === -1) {
      lineText.linerender(true, workspace, false);
      loaded.push("linerender");
    }
    
    if (loaded.indexOf("texthide") === -1) {
      lineText.texthide(20, workspace, Blockly);
      loaded.push("texthide");
    }
    
    if (loaded.indexOf("texthides") === -1) {
      lineText.texthides(3, workspace, Blockly);
      loaded.push("texthides");
    }

    // 返回控制对象
    return {
      dispose: function() {
        document.body.removeEventListener("startInputing", listener);
        lineText.changTextarea(false);
        lineText.textLeft(false);
        lineText.dispose(workspace, Blockly);
      },
      setCheckLong: function(value) {
        checkLong = value;
      },
      setTextLeft: function(value) {
        textLeft = value;
        lineText.textLeft(value);
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
      },
      setUseMonaco: function(value) {
        useMonaco = value && lineText.isMonacoAvailable();
      }
    };
  }

  // ============================================
  // 3. 暴露到全局
  // ============================================
  window.WitcatBlockinput = {
    init: initWitcatBlockinput,
    lineText: lineText,
    isMonacoAvailable: function() {
      return lineText.isMonacoAvailable();
    }
  };

  // 自动初始化
  const instance = initWitcatBlockinput(rt.scratchBlocks, rt.scratchBlocks.getMainWorkspace());
  window.__witcatInstance = instance;
  console.log('WitcatBlockinput initialized' + (lineText.isMonacoAvailable() ? ' with Monaco Editor' : ' with fallback'));

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