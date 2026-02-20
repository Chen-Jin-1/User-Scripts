// ==UserScript==
// @name         Variable Modifier
// @version      2.0
// @description  修改变量，仅仅只是Scratch VM
// @author       我的名字你应该知道的
// @match        https://www.ccw.site/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 新增：存储锁定的变量信息 { [variableId]: { timer: 定时器, value: 锁定值, roleName: 角色名, isLocked: 是否锁定 } }
    const lockedVariables = {};
    // 新增：存储当前正在编辑的变量ID，避免刷新时覆盖输入
    let editingVariableId = null;
    // 新增：实时刷新定时器
    let realtimeRefreshTimer = null;

    // 1. 获取Scratch VM实例核心代码
    const orig = Function.prototype.bind;
    Function.prototype.bind = function(self2, ...args) {
        if (self2?.runtime && self2) {
            window.vm = self2;
            Function.prototype.bind = orig; // 获取后恢复原生bind方法
            // VM获取成功后启动实时刷新
            startRealtimeRefresh();
        }
        return orig.call(this, self2, ...args);
    };

    // 新增：检查元素是否在可视区域内
    function isElementInViewport(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const panel = document.getElementById('scratch-variable-panel');
        if (!panel) return false;
        const panelRect = panel.getBoundingClientRect();

        // 判定条件：元素与面板可视区域有重叠
        return (
            rect.top <= panelRect.bottom &&
            rect.bottom >= panelRect.top &&
            rect.left <= panelRect.right &&
            rect.right >= panelRect.left
        );
    }

    // 新增：获取单个变量的最新值
    function getVariableLatestValue(roleName, variableId) {
        if (!window.vm) return null;
        const runtime = window.vm.runtime;
        const target = runtime.targets.find(t => t.getName() === roleName);
        if (!target || !target.variables[variableId]) return null;
        return target.variables[variableId].value;
    }

    // 新增：智能刷新可视区域内的变量（排除正在编辑的）
    function smartRefreshVisibleVariables() {
        if (!window.vm) return;

        // 获取所有变量项
        const variableItems = document.querySelectorAll('.variable-item');
        if (!variableItems.length) return;

        variableItems.forEach(item => {
            const lockBtn = item.querySelector('.lock-btn');
            const variableInput = item.querySelector('.variable-input');
            const variableId = lockBtn?.getAttribute('data-variable-id');
            const roleName = lockBtn?.getAttribute('data-role');

            // 跳过条件：无ID、正在编辑、已锁定、不在可视区域
            if (!variableId || !roleName) return;
            if (variableId === editingVariableId) return;
            if (lockedVariables[variableId]?.isLocked) return;
            if (!isElementInViewport(item)) return;

            // 获取最新值并更新（避免无意义的DOM操作）
            const latestValue = getVariableLatestValue(roleName, variableId);
            if (latestValue !== null && variableInput.value !== String(latestValue)) {
                variableInput.value = latestValue;
            }
        });
    }

    // 新增：启动实时刷新（节流处理，避免过度刷新）
    function startRealtimeRefresh() {
        // 先清除已有定时器，防止重复创建
        if (realtimeRefreshTimer) {
            clearInterval(realtimeRefreshTimer);
        }
        // 200ms刷新一次，兼顾实时性和性能
        realtimeRefreshTimer = setInterval(smartRefreshVisibleVariables, 200);
    }

    // 2. 注入面板样式（新增锁按钮样式）
    GM_addStyle(`
        #scratch-variable-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px; /* 加宽适配锁按钮 */
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px;
            z-index: 99999999; /* 确保悬浮在最上层 */
            max-height: 80vh;
            overflow-y: auto;
        }
        #scratch-variable-panel .panel-title {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 16px 0;
            color: #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #scratch-variable-panel .refresh-btn {
            padding: 4px 12px;
            background: #4285f4;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        #scratch-variable-panel .refresh-btn:hover {
            background: #3367d6;
        }
        #scratch-variable-panel .role-section {
            margin: 12px 0 20px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 6px;
        }
        #scratch-variable-panel .role-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 10px 0;
            color: #2d2d2d;
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
        }
        #scratch-variable-panel .variable-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px dashed #eee;
        }
        /* 新增：锁按钮样式 */
        #scratch-variable-panel .lock-btn {
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
            background-size: 18px 18px;
            background-repeat: no-repeat;
            background-position: center;
        }
        #scratch-variable-panel .lock-btn.unlocked {
            background-color: #f1f1f1;
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'%3E%3C/path%3E%3C/svg%3E");
        }
        #scratch-variable-panel .lock-btn.locked {
            background-color: #ff4444;
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm6 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'%3E%3C/path%3E%3C/svg%3E");
        }
        #scratch-variable-panel .variable-name {
            color: #555;
            font-size: 14px;
            flex: 1; /* 新增：自适应宽度 */
        }
        #scratch-variable-panel .variable-input {
            width: 100px; /* 微调宽度适配锁按钮 */
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        #scratch-variable-panel .variable-save {
            margin-left: 8px;
            padding: 4px 8px;
            background: #0f9d58;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        #scratch-variable-panel .variable-save:hover {
            background: #0d8b4d;
        }
        #scratch-variable-panel .no-vm-tip {
            color: #d93025;
            font-size: 14px;
            text-align: center;
            padding: 20px 0;
        }
        #scratch-variable-panel .no-variable-tip {
            color: #666;
            font-size: 14px;
            text-align: center;
            padding: 10px 0;
        }
        /* 新增：锁定状态下输入框样式 */
        #scratch-variable-panel .variable-input.locked {
            background-color: #ffebee;
            border-color: #ff4444;
        }
    `);

    // 3. 创建变量操控面板DOM（无修改）
    function createVariablePanel() {
        const panel = document.createElement('div');
        panel.id = 'scratch-variable-panel';
        panel.innerHTML = `
            <div class="panel-title">
                Scratch 变量操控面板
                <button class="refresh-btn" id="refresh-variable-btn">刷新面板</button>
            </div>
            <div id="variable-content-container">
                <div class="no-vm-tip">暂未获取到Scratch VM实例</div>
            </div>
        `;
        document.body.appendChild(panel);

        // 绑定刷新按钮事件
        document.getElementById('refresh-variable-btn').addEventListener('click', renderVariableContent);
    }

    // 4. 获取所有角色及对应变量（修复角色重复问题）
    function getRoleVariables() {
        if (!window.vm) return null;

        const roleVariables = [];
        const runtime = window.vm.runtime;
        const targets = runtime.targets;

        // 新增：用Set去重，记录已处理的角色名
        const processedRoles = new Set();

        targets.forEach(target => {
            const roleName = target.getName();
            // 修复：跳过已处理的角色，避免重复
            if (processedRoles.has(roleName)) return;
            processedRoles.add(roleName);

            const variables = target.variables;
            const variableList = [];

            for (const [variableId, variableData] of Object.entries(variables)) {
                variableList.push({
                    id: variableId,
                    name: variableData.name,
                    value: variableData.value,
                    // 新增：携带锁定状态
                    isLocked: !!lockedVariables[variableId]?.isLocked
                });
            }

            if (variableList.length > 0) {
                roleVariables.push({
                    roleName: roleName,
                    variables: variableList
                });
            }
        });

        return roleVariables;
    }

    // 5. 修改变量值的核心方法（无修改）
    function updateScratchVariable(roleName, variableId, newValue) {
        if (!window.vm) return false;

        const runtime = window.vm.runtime;
        const targets = runtime.targets;

        const target = targets.find(t => t.getName() === roleName);
        if (!target) return false;

        if (!target.variables[variableId]) return false;

        let finalValue = newValue;
        const originalType = typeof target.variables[variableId].value;
        if (originalType === 'number' && !isNaN(Number(finalValue))) {
            finalValue = Number(finalValue);
        }

        target.variables[variableId].value = finalValue;
        window.vm.emit('variableChanged', target.id, variableId);
        return true;
    }

    // 新增：锁定/解锁变量的核心方法
    function toggleVariableLock(roleName, variableId, isLocked, initialValue) {
        // 解锁逻辑
        if (!isLocked) {
            if (lockedVariables[variableId]) {
                // 清除定时器
                clearInterval(lockedVariables[variableId].timer);
                // 删除锁定记录
                delete lockedVariables[variableId];
            }
            return;
        }

        // 锁定逻辑
        // 先解锁（防止重复锁定）
        toggleVariableLock(roleName, variableId, false);
        // 记录锁定信息
        lockedVariables[variableId] = {
            roleName,
            isLocked: true,
            value: initialValue,
            // 启动定时器：每100ms强制设置一次变量值
            timer: setInterval(() => {
                updateScratchVariable(roleName, variableId, lockedVariables[variableId].value);
            }, 100)
        };
    }

    // 新增：更新锁定变量的值（输入框修改时同步）
    function updateLockedVariableValue(variableId, newValue) {
        if (lockedVariables[variableId]?.isLocked) {
            lockedVariables[variableId].value = newValue;
        }
    }

    // 6. 渲染变量内容（新增锁按钮逻辑 + 编辑状态监听）
    function renderVariableContent() {
        const container = document.getElementById('variable-content-container');
        const roleVariables = getRoleVariables();

        if (!roleVariables) {
            container.innerHTML = '<div class="no-vm-tip">暂未获取到Scratch VM实例</div>';
            return;
        }

        if (roleVariables.length === 0) {
            container.innerHTML = '<div class="no-variable-tip">当前无可用角色变量</div>';
            return;
        }

        let contentHtml = '';
        roleVariables.forEach(roleItem => {
            contentHtml += `<div class="role-section">
                <div class="role-title">角色：${roleItem.roleName}</div>
            `;

            roleItem.variables.forEach(variable => {
                // 新增：根据锁定状态设置按钮样式和输入框样式
                const lockClass = variable.isLocked ? 'locked' : 'unlocked';
                const inputClass = variable.isLocked ? 'variable-input locked' : 'variable-input';
                contentHtml += `
                <div class="variable-item">
                    <!-- 新增：锁按钮 -->
                    <button class="lock-btn ${lockClass}"
                            data-role="${roleItem.roleName}"
                            data-variable-id="${variable.id}"
                            title="${variable.isLocked ? '点击解锁' : '点击锁定'}"></button>
                    <span class="variable-name">${variable.name}</span>
                    <div class="variable-operate">
                        <input type="text" class="${inputClass}"
                               data-role="${roleItem.roleName}"
                               data-variable-id="${variable.id}"
                               value="${variable.value}">
                        <button class="variable-save"
                                data-role="${roleItem.roleName}"
                                data-variable-id="${variable.id}">保存</button>
                    </div>
                </div>
                `;
            });

            contentHtml += `</div>`;
        });

        container.innerHTML = contentHtml;

        // 绑定锁按钮事件
        document.querySelectorAll('.lock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const roleName = this.getAttribute('data-role');
                const variableId = this.getAttribute('data-variable-id');
                const inputDom = document.querySelector(`.variable-input[data-role="${roleName}"][data-variable-id="${variableId}"]`);
                const currentValue = inputDom.value.trim();
                const isCurrentlyLocked = this.classList.contains('locked');

                // 切换锁定状态
                toggleVariableLock(roleName, variableId, !isCurrentlyLocked, currentValue);

                // 更新UI
                this.classList.toggle('locked');
                this.classList.toggle('unlocked');
                inputDom.classList.toggle('locked');
                this.setAttribute('title', !isCurrentlyLocked ? '点击解锁' : '点击锁定');

                // 移除弹窗提示
                // alert(`变量【${this.nextElementSibling.textContent}】已${!isCurrentlyLocked ? '锁定' : '解锁'}！`);
            });
        });

        // 绑定输入框编辑状态（新增：记录正在编辑的变量ID）
        document.querySelectorAll('.variable-input').forEach(input => {
            // 聚焦时标记为正在编辑
            input.addEventListener('focus', function() {
                editingVariableId = this.getAttribute('data-variable-id');
            });
            // 失焦时取消编辑标记
            input.addEventListener('blur', function() {
                editingVariableId = null;
            });
            // 输入时同步锁定变量的值
            input.addEventListener('input', function() {
                const variableId = this.getAttribute('data-variable-id');
                const newValue = this.value.trim();
                updateLockedVariableValue(variableId, newValue);
            });
        });

        // 绑定保存按钮事件
        document.querySelectorAll('.variable-save').forEach(btn => {
            btn.addEventListener('click', function() {
                const roleName = this.getAttribute('data-role');
                const variableId = this.getAttribute('data-variable-id');
                const inputDom = document.querySelector(`.variable-input[data-role="${roleName}"][data-variable-id="${variableId}"]`);
                const newValue = inputDom.value.trim();

                const isSuccess = updateScratchVariable(roleName, variableId, newValue);
                if (isSuccess) {
                    // 同步锁定变量的值
                    updateLockedVariableValue(variableId, newValue);
                    // 移除成功弹窗
                    // alert(`变量【${inputDom.parentElement.previousElementSibling.textContent}】修改成功！`);
                } else {
                    // 移除失败弹窗
                    // alert('变量修改失败，请检查！');
                }
                // 保存后取消编辑状态
                editingVariableId = null;
            });
        });
    }

    // 7. 初始化脚本（优化：增加清理逻辑）
    function initScript() {
        createVariablePanel();
        setTimeout(renderVariableContent, 1000);

        const vmCheckTimer = setInterval(() => {
            if (window.vm) {
                renderVariableContent();
                clearInterval(vmCheckTimer);
            }
        }, 2000);

        // 新增：页面卸载时清除所有定时器
        window.addEventListener('beforeunload', () => {
            // 清除锁定变量的定时器
            Object.values(lockedVariables).forEach(item => {
                clearInterval(item.timer);
            });
            // 清除实时刷新定时器
            if (realtimeRefreshTimer) {
                clearInterval(realtimeRefreshTimer);
            }
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initScript();
    } else {
        document.addEventListener('DOMContentLoaded', initScript);
    }

})();