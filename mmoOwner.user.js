// ==UserScript==
// @name         MMO腐竹
// @version      1.1
// @description  vm太好用了你知道吗
// @author       0070
// @match        https://www.ccw.site/detail/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const origBind = Function.prototype.bind;
    Function.prototype.bind = function(self2, ...args) {
        if (self2?.runtime && self2) {
            window.vm = self2;
            Function.prototype.bind = origBind;
        }
        return origBind.call(this, self2, ...args);
    };

    class SettingsStorage {
        constructor() {
            this.db = null;
            this.dbName = 'MMO腐竹Settings';
            this.storeName = 'settings';
            this.version = 1;
        }

        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve();
                };
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'url' });
                    }
                };
            });
        }

        async getSettings(url) {
            if (!this.db) await this.init();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(url);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result || null);
            });
        }

        async saveSettings(url, offsetX, offsetY) {
            if (!this.db) await this.init();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const settings = { url, offsetX, offsetY, timestamp: Date.now() };
                const request = store.put(settings);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }
    }

    const storage = new SettingsStorage();
    const currentURL = window.location.href;

    async function waitForGameData() {
        while (true) {
            try {
                const sessionId = await vm.runtime.ext_CCWMMO.currentRoom.sessionId;
                const clientListStr = await vm.runtime.ext_CCWMMO.getClientList({FORMAT: "JSON"});
                const clientList = JSON.parse(clientListStr);
                if (sessionId && clientList.length > 0) {
                    return {sessionId, clientList};
                }
            } catch (e) {
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    function getCameraData() {
        try {
            const cameraX = vm.runtime.ext_GandiKamera.cameraX;
            const cameraY = vm.runtime.ext_GandiKamera.cameraY;
            const cameraZoom = vm.runtime.ext_GandiKamera.cameraZoom;
            return {
                cameraX,
                cameraY,
                cameraZoom,
                zoomFactor: cameraZoom / 100
            };
        } catch (e) {
            return {
                cameraX: 0,
                cameraY: 0,
                cameraZoom: 100,
                zoomFactor: 1
            };
        }
    }

    function setCameraToMyPosition(myX, myY) {
        try {
            vm.runtime.ext_GandiKamera.cameraX = myX;
            vm.runtime.ext_GandiKamera.cameraY = myY;
            return true;
        } catch (e) {
            return false;
        }
    }

    function getPlayerFaction(extra) {
        if (!extra) return 'neutral';
        const extraStr = String(extra).toLowerCase();
        const factionKeywords = {
            'blue': ['蓝色', '蓝方', '蓝队', 'blu', 'blue', '蓝'],
            'red': ['红色', '红方', '红队', 'red', '红'],
            'green': ['绿色', '绿方', '绿队', 'green', '绿'],
            'yellow': ['黄色', '黄方', '黄队', 'yellow', '黄'],
            'purple': ['紫色', '紫方', '紫队', 'purple', '紫'],
            'orange': ['橙色', '橙方', '橙队', 'orange', '橙'],
            'cyan': ['青色', '青方', '青队', 'cyan', '青'],
            'pink': ['粉色', '粉方', '粉队', 'pink', '粉']
        };
        for (const [faction, keywords] of Object.entries(factionKeywords)) {
            for (const keyword of keywords) {
                if (extraStr.includes(keyword)) return faction;
            }
        }
        return 'neutral';
    }

    function getFactionColor(faction, distance, warningRange) {
        const factionColors = {
            'blue': { r: 100, g: 150, b: 255 },
            'red': { r: 255, g: 100, b: 100 },
            'green': { r: 100, g: 255, b: 100 },
            'yellow': { r: 255, g: 255, b: 100 },
            'purple': { r: 200, g: 100, b: 255 },
            'orange': { r: 255, g: 150, b: 50 },
            'cyan': { r: 100, g: 255, b: 255 },
            'pink': { r: 255, g: 150, b: 255 },
            'neutral': { r: 200, g: 200, b: 200 }
        };
        const color = factionColors[faction] || factionColors['neutral'];
        if (distance < warningRange) {
            const warningFactor = 1 - (distance / warningRange);
            const alpha = 0.7 + warningFactor * 0.3;
            const intensity = 0.8 + warningFactor * 0.2;
            return {
                r: Math.min(255, Math.floor(color.r * intensity)),
                g: Math.min(255, Math.floor(color.g * intensity)),
                b: Math.min(255, Math.floor(color.b * intensity)),
                a: alpha
            };
        } else {
            return { r: color.r, g: color.g, b: color.b, a: 0.7 };
        }
    }

    function setMousePosition(x, y) {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseMoveEvent = new MouseEvent('mousemove', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x + rect.left,
            clientY: y + rect.top
        });
        canvas.dispatchEvent(mouseMoveEvent);
    }

    function lockMouseToZero() {
        try {
            if (vm.runtime && vm.runtime.ioDevices && vm.runtime.ioDevices.mouse) {
                vm.runtime.ioDevices.mouse.getScratchX = () => 0;
                vm.runtime.ioDevices.mouse.getScratchY = () => 0;
                return true;
            }
        } catch (e) {}
        return false;
    }

    function unlockMouse() {
        try {
            if (vm.runtime && vm.runtime.ioDevices && vm.runtime.ioDevices.mouse) {
                delete vm.runtime.ioDevices.mouse.getScratchX;
                delete vm.runtime.ioDevices.mouse.getScratchY;
                return true;
            }
        } catch (e) {}
        return false;
    }

    async function main() {
        const {sessionId, clientList} = await waitForGameData();
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const overlay = document.createElement('canvas');
        overlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        canvas.parentElement.appendChild(overlay);
        const ctx = overlay.getContext('2d');

        const controlPanel = document.createElement('div');
        controlPanel.style.cssText = 'position:absolute;top:10px;left:10px;z-index:10000;background:rgba(0,0,0,0.7);padding:0;border-radius:3px;color:white;font-size:10px;font-family:Arial;min-width:30px;transition:all 0.2s ease;';
        document.body.appendChild(controlPanel);

        const expandBtn = document.createElement('div');
        expandBtn.style.cssText = 'width:30px;height:30px;background:#555;color:white;font-size:20px;font-weight:bold;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;';
        expandBtn.textContent = '⚙';
        controlPanel.appendChild(expandBtn);

        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = 'padding:5px;display:none;';
        controlPanel.appendChild(controlsContainer);

        let isExpanded = false;
        expandBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            controlsContainer.style.display = isExpanded ? 'block' : 'none';
            controlPanel.style.minWidth = isExpanded ? '150px' : '30px';
            expandBtn.textContent = isExpanded ? '❌' : '⚙';
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.style.cssText = 'width:100%;padding:3px 5px;border-radius:2px;border:none;background:#4CAF50;color:white;cursor:pointer;font-size:10px;font-weight:bold;margin-bottom:5px;';
        toggleBtn.textContent = '开启雷达';
        controlsContainer.appendChild(toggleBtn);

        const cameraToggleBtn = document.createElement('button');
        cameraToggleBtn.style.cssText = 'width:100%;padding:3px 5px;border-radius:2px;border:none;background:#2196F3;color:white;cursor:pointer;font-size:10px;font-weight:bold;margin-bottom:5px;';
        cameraToggleBtn.textContent = '锁定摄像机';
        controlsContainer.appendChild(cameraToggleBtn);

        const aimToggleBtn = document.createElement('button');
        aimToggleBtn.style.cssText = 'width:100%;padding:3px 5px;border-radius:2px;border:none;background:#FF9800;color:white;cursor:pointer;font-size:10px;font-weight:bold;margin-bottom:5px;';
        aimToggleBtn.textContent = '开启自瞄';
        controlsContainer.appendChild(aimToggleBtn);

        let savedSettings = null;
        try {
            savedSettings = await storage.getSettings(currentURL);
        } catch (e) {
            console.log('无法加载设置:', e);
        }

        let offsetX = savedSettings ? savedSettings.offsetX : 0;
        let offsetY = savedSettings ? savedSettings.offsetY : 0;
        let warningRange = 500, aimOffsetRange = 0;
        let isActive = false, isCameraTracking = false, isAiming = false;
        let myLastX = 0, myLastY = 0, myFaction = 'neutral';
        let lastAimTime = 0, lastRandomOffset = 0, lastAimAngle = 0;
        const AIM_INTERVAL = 100;
        const UPDATE_FPS = 30;
        let lastUpdateTime = 0;
        const fpsInterval = 1000 / UPDATE_FPS;
        let isProcessing = false;

        function createSlider(label, min, max, value, callback, saveCallback = null) {
            const container = document.createElement('div');
            container.style.marginBottom = '5px';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.cssText = 'display:block;margin-bottom:2px;font-size:9px;';
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = min;
            slider.max = max;
            slider.value = value;
            slider.style.cssText = 'width:100%;height:8px;';
            let saveTimeout = null;
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                callback(val);
                labelEl.textContent = `${label.split(':')[0]}:${val}`;
                if (saveCallback) {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => saveCallback(val), 500);
                }
            });
            container.appendChild(labelEl);
            container.appendChild(slider);
            controlsContainer.appendChild(container);
            return { slider, labelEl };
        }

        const { slider: offsetXSlider, labelEl: offsetXLabel } = createSlider(
            'X偏移:0', -200, 200, offsetX,
            (val) => { offsetX = val; },
            async (val) => {
                try {
                    await storage.saveSettings(currentURL, val, offsetY);
                } catch (e) {
                    console.log('保存失败:', e);
                }
            }
        );
        offsetXLabel.textContent = `X偏移:${offsetX}`;

        const { slider: offsetYSlider, labelEl: offsetYLabel } = createSlider(
            'Y偏移:0', -200, 200, offsetY,
            (val) => { offsetY = val; },
            async (val) => {
                try {
                    await storage.saveSettings(currentURL, offsetX, val);
                } catch (e) {
                    console.log('保存失败:', e);
                }
            }
        );
        offsetYLabel.textContent = `Y偏移:${offsetY}`;

        const warningSlider = createSlider('预警:500', 0, 1000, 500, (val) => {
            warningRange = val;
        });
        warningSlider.labelEl.textContent = `预警:${warningRange}`;

        const aimOffsetSlider = createSlider('自瞄偏移:0', 0, 10, 0, (val) => {
            aimOffsetRange = val;
        });
        aimOffsetSlider.labelEl.textContent = `自瞄偏移:${aimOffsetRange}`;

        toggleBtn.addEventListener('click', () => {
            isActive = !isActive;
            toggleBtn.style.backgroundColor = isActive ? '#F44336' : '#4CAF50';
            toggleBtn.textContent = isActive ? '关闭雷达' : '开启雷达';
            if (!isActive) {
                ctx.clearRect(0, 0, overlay.width, overlay.height);
            }
        });

        cameraToggleBtn.addEventListener('click', () => {
            isCameraTracking = !isCameraTracking;
            cameraToggleBtn.style.backgroundColor = isCameraTracking ? '#F44336' : '#2196F3';
            cameraToggleBtn.textContent = isCameraTracking ? '解锁摄像机' : '锁定摄像机';
        });

        aimToggleBtn.addEventListener('click', () => {
            isAiming = !isAiming;
            aimToggleBtn.style.backgroundColor = isAiming ? '#F44336' : '#FF9800';
            aimToggleBtn.textContent = isAiming ? '关闭自瞄' : '开启自瞄';
            if (isAiming) {
                lockMouseToZero();
            } else {
                unlockMouse();
                lastRandomOffset = 0;
            }
        });

        function updateCanvasSize() {
            overlay.width = canvas.width;
            overlay.height = canvas.height;
        }

        async function processFrame() {
            if (isProcessing) return;
            isProcessing = true;
            const now = Date.now();
            const elapsed = now - lastUpdateTime;
            if (elapsed < fpsInterval) {
                isProcessing = false;
                requestAnimationFrame(processFrame);
                return;
            }
            lastUpdateTime = now - (elapsed % fpsInterval);
            try {
                const currentSessionId = await vm.runtime.ext_CCWMMO.currentRoom.sessionId;
                const clientListStr = await vm.runtime.ext_CCWMMO.getClientList({FORMAT: "JSON"});
                const clients = JSON.parse(clientListStr);
                const cameraData = getCameraData();
                const me = clients.find(c => c.sessionId === currentSessionId);
                if (!me) {
                    isProcessing = false;
                    requestAnimationFrame(processFrame);
                    return;
                }
                myLastX = me.x;
                myLastY = me.y;
                myFaction = getPlayerFaction(me.extra);

                if (isCameraTracking) {
                    if (!setCameraToMyPosition(myLastX, myLastY)) {
                        isCameraTracking = false;
                        cameraToggleBtn.style.backgroundColor = '#2196F3';
                        cameraToggleBtn.textContent = '锁定摄像机';
                    }
                }

                updateCanvasSize();
                if (!isActive) {
                    isProcessing = false;
                    requestAnimationFrame(processFrame);
                    return;
                }

                const centerX = overlay.width / 2 + offsetX;
                const centerY = overlay.height / 2 + offsetY;
                const maxPointerLength = Math.min(overlay.width, overlay.height) * 0.6;

                ctx.clearRect(0, 0, overlay.width, overlay.height);
                ctx.beginPath();
                ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.fill();

                let allPlayers = [], enemyPlayers = [];
                let currentAimTarget = null, currentAimAngle = 0;

                for (let i = 0; i < clients.length; i++) {
                    const client = clients[i];
                    if (client.sessionId === currentSessionId) continue;

                    const dx = client.x - myLastX;
                    const dy = client.y - myLastY;
                    const realDistance = Math.sqrt(dx * dx + dy * dy);

                    allPlayers.push({ client, distance: realDistance });

                    const clientFaction = getPlayerFaction(client.extra);
                    if (clientFaction !== 'neutral' && clientFaction !== myFaction) {
                        enemyPlayers.push({ client, distance: realDistance, faction: clientFaction });
                    }

                    if (!isActive) continue;

                    let scaledX = (client.x - cameraData.cameraX) * (overlay.width / 640) * cameraData.zoomFactor;
                    let scaledY = (client.y - cameraData.cameraY) * (overlay.height / 360) * cameraData.zoomFactor;
                    const canvasYPos = -scaledY;
                    const angle = Math.atan2(canvasYPos, scaledX);
                    const screenDistance = Math.sqrt(scaledX * scaledX + canvasYPos * canvasYPos);

                    let pointerLength = screenDistance < maxPointerLength ? Math.max(screenDistance, 15) : maxPointerLength;
                    const endX = centerX + Math.cos(angle) * pointerLength;
                    const endY = centerY + Math.sin(angle) * pointerLength;

                    const colorInfo = getFactionColor(clientFaction, realDistance, warningRange);
                    let lineWidth = 3;
                    if (realDistance < warningRange) {
                        const warningFactor = 1 - (realDistance / warningRange);
                        lineWidth = 2 + warningFactor * 3;
                    }

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = `rgba(${colorInfo.r},${colorInfo.g},${colorInfo.b},${colorInfo.a})`;
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();

                    const arrowSize = Math.max(6, Math.min(10, pointerLength * 0.1));
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI/6), endY - arrowSize * Math.sin(angle - Math.PI/6));
                    ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI/6), endY - arrowSize * Math.sin(angle + Math.PI/6));
                    ctx.closePath();
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.fill();

                    const textX = endX + Math.cos(angle) * 25;
                    const textY = endY + Math.sin(angle) * 25;
                    ctx.font = '18px Arial bold';
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.textAlign = 'center';
                    ctx.fillText(Math.round(realDistance), textX, textY);
                }

                if (isAiming && now - lastAimTime > AIM_INTERVAL) {
                    lastAimTime = now;
                    let targetPlayers = enemyPlayers.length > 0 ? enemyPlayers : allPlayers;

                    if (targetPlayers.length > 0) {
                        targetPlayers.sort((a, b) => a.distance - b.distance);
                        const targetClient = targetPlayers[0].client;
                        currentAimTarget = targetClient;

                        const dx = targetClient.x - myLastX;
                        const dy = targetClient.y - myLastY;
                        const targetAngle = Math.atan2(dy, dx);
                        let finalAimAngle = targetAngle;
                        if (aimOffsetRange > 0) {
                            const offsetAngle = (Math.random() * 2 - 1) * aimOffsetRange * (Math.PI / 180);
                            finalAimAngle = targetAngle + offsetAngle;
                            lastRandomOffset = offsetAngle;
                        } else {
                            lastRandomOffset = 0;
                        }
                        lastAimAngle = finalAimAngle;
                        currentAimAngle = finalAimAngle;
                        const targetScreenX = centerX + Math.cos(finalAimAngle) * (maxPointerLength + 50);
                        const targetScreenY = centerY - Math.sin(finalAimAngle) * (maxPointerLength + 50);
                        setMousePosition(targetScreenX, targetScreenY);
                    }
                } else if (currentAimTarget) {
                    const dx = currentAimTarget.x - myLastX;
                    const dy = currentAimTarget.y - myLastY;
                    currentAimAngle = lastAimAngle;
                }

                if (isAiming && currentAimTarget) {
                    const aimArrowLength = 100;
                    const aimArrowX = centerX + Math.cos(currentAimAngle) * aimArrowLength;
                    const aimArrowY = centerY - Math.sin(currentAimAngle) * aimArrowLength;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(aimArrowX, aimArrowY);
                    ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    const aimTextX = aimArrowX + Math.cos(currentAimAngle) * 20;
                    const aimTextY = aimArrowY - Math.sin(currentAimAngle) * 20;
                    ctx.font = '16px Arial bold';
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
                    ctx.textAlign = 'center';
                    ctx.fillText('自瞄', aimTextX, aimTextY);
                }
            } catch (e) {}

            isProcessing = false;
            requestAnimationFrame(processFrame);
        }

        processFrame();
    }
    setTimeout(main, 1000);
})();