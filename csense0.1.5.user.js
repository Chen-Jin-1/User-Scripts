// ==UserScript==
// @name         CSense
// @namespace    CSense
// @version      0.1.5
// @license      AGPL-3.0
// @description  一个 CCW 安全审计工具
// @author       FurryR
// @match        https://www.ccw.site/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @grant        none
// @run-at       document-start
// ==/UserScript==
"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/util/inject.js
  function patch(obj, p, fn) {
    if (obj[p]) obj[p] = fn(obj[p]);
  }
  function addStyle(css) {
    if (css instanceof URL) {
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = css.toString();
      document.documentElement.appendChild(style);
    } else {
      const style = document.createElement("style");
      style.textContent = css;
      document.documentElement.appendChild(style);
    }
  }
  function trap(callback) {
    patch(Function.prototype, "bind", (_bind) => {
      return function(self2, ...args) {
        if (typeof self2 === "object" && self2 !== null && Object.prototype.hasOwnProperty.call(self2, "editingTarget") && Object.prototype.hasOwnProperty.call(self2, "runtime")) {
          Function.prototype.bind = _bind;
          callback(self2);
          return _bind.call(this, self2, ...args);
        }
        return _bind.call(this, self2, ...args);
      };
    });
  }
  var vm = globalThis.__CSense_vm_trap ?? new Promise(trap);
  delete globalThis.__CSense_vm_trap;
  var LazyXHR = class {
    constructor() {
      this.interceptors = {
        request: {
          handlers: [],
          use: (fulfilled, rejected, options) => {
            this.interceptors.request.handlers.push({
              fulfilled,
              rejected,
              synchronous: false,
              runWhen: options?.runWhen ?? null
            });
          }
        },
        response: {
          handlers: [],
          use: (fulfilled, rejected, options) => {
            this.interceptors.response.handlers.push({
              fulfilled,
              rejected,
              synchronous: false,
              runWhen: options?.runWhen ?? null
            });
          }
        }
      };
    }
    delegate(axiosInstance) {
      axiosInstance.interceptors.request.handlers.unshift(
        ...this.interceptors.request.handlers
      );
      axiosInstance.interceptors.response.handlers.unshift(
        ...this.interceptors.response.handlers
      );
    }
  };

  // src/base/scene.js
  var SceneManager = class {
    constructor(target) {
      this._disposed = false;
      this.overlays = [];
      this.target = target;
      this.updateRequested = false;
      this.scene = [];
      const fn = () => {
        if (this.updateRequested) {
          this.updateRequested = false;
          this._render();
        }
        if (!this._disposed) requestAnimationFrame(fn);
      };
      requestAnimationFrame(fn);
    }
    _doSetTitle() {
    }
    _updateTitle() {
      const c = this.scene.at(-1).constructor;
      this._doSetTitle(c.title ?? c.name);
    }
    dispose() {
      this._disposed = true;
    }
    _destroy() {
      while (this.target.firstChild) {
        this.target.removeChild(this.target.firstChild);
      }
    }
    _render() {
      this._destroy();
      this._updateTitle();
      this.overlays.forEach((overlay) => overlay.render());
      this.scene.at(-1).render();
    }
    addOverlay(scene) {
      this.overlays.push(scene);
      this.requestUpdate();
    }
    removeOverlay(scene) {
      const index = this.overlays.indexOf(scene);
      if (index !== -1) {
        this.overlays[index].dispose();
        this.overlays.splice(index, 1);
        this.requestUpdate();
      }
    }
    back() {
      if (this.scene.length > 1) {
        const scene = this.scene.pop();
        scene.dispose();
        this.requestUpdate();
        return true;
      }
      return false;
    }
    open(scene) {
      this.scene.push(scene);
      this.requestUpdate();
    }
    requestUpdate() {
      this.updateRequested = true;
    }
  };

  // src/api/ccwdata.js
  var Database = class {
    constructor() {
      this.data = /* @__PURE__ */ new Map();
      this.watchers = /* @__PURE__ */ new Map();
    }
    watch(key, callback) {
      this.watchers.set(key, callback);
    }
    set(key, value) {
      if (this.data.get(key) === value) return;
      if (this.watchers.has(key)) {
        return this.data.set(
          key,
          this.watchers.get(key)(this.data.get(key), value)
        );
      } else this.data.set(key, value);
    }
    get(key) {
      return this.data.get(key);
    }
    has(key) {
      return this.data.has(key);
    }
    entries() {
      return this.data.entries();
    }
    values() {
      return this.data.values();
    }
    keys() {
      return this.data.keys();
    }
  };

  // src/util/extensionInjector.js
  var ExtensionInjector = class {
    constructor() {
      this.extensions = /* @__PURE__ */ new Map();
    }
    on(name, callback) {
      if (!this.extensions.has(name)) {
        this.extensions.set(name, []);
      }
      this.extensions.get(name).push(callback);
    }
    emit(name, extensionObject) {
      if (!this.extensions.has(name)) return;
      for (const callback of this.extensions.get(name)) {
        try {
          callback(extensionObject);
        } catch (e) {
          console.error(`[CSense] \u6269\u5C55\u4E8B\u4EF6 ${name} \u56DE\u8C03\u5931\u8D25`, e);
        }
      }
    }
  };

  // src/base/state.js
  var state_default = {
    pluginPromise: Promise.resolve(),
    userInfo: null,
    myInfo: null,
    vm: null,
    /** @type {Record<string, Database>} */
    ccwdata: Object.freeze({
      /** @type {Database} */
      project: new Database(),
      /** @type {Database} */
      user: new Database()
    }),
    extensionInjector: new ExtensionInjector(),
    mmo: {
      /** @type {RegExp[]} */
      broadcastBlackList: []
    },
    button: null,
    /** @type {LazyXHR} */
    axios: new LazyXHR(),
    isIdentified: false
  };

  // src/overlay/identity.js
  var IdentityWarningOverlay = class {
    constructor(manager) {
      this.manager = manager;
      this.showOverlay = false;
      this.isUpdated = false;
      state_default.axios.interceptors.response.use((resp) => {
        if (resp.config.url.endsWith("/students/self/detail") && this.isUpdated) {
          const body = resp.data.body;
          if (body) {
            state_default.myInfo = body;
            if (body.identitiyAuthRank === "L2") {
              this.showOverlay = true;
              state_default.isIdentified = true;
              manager.requestUpdate();
            }
          }
        }
        return resp;
      });
    }
    render() {
      const target = this.manager.target;
      if (this.showOverlay) {
        const warningDiv = document.createElement("div");
        warningDiv.style.cursor = "pointer";
        warningDiv.textContent = "\u8D26\u6237\u5DF2\u5B9E\u540D\u8BA4\u8BC1";
        warningDiv.title = "\u4E3A\u9632\u6B62\u60A8\u7684\u884C\u4E3A\u906D\u5230\u8FFD\u8E2A\uFF0C\u8BF7\u767B\u51FA\u8D26\u6237\u6216\u5207\u6362\u5230\u672A\u5B9E\u540D\u8BA4\u8BC1\u7684\u8D26\u6237\u3002\u60A8\u53EF\u4EE5\u70B9\u51FB\u6B64\u5904\u7ACB\u523B\u767B\u51FA\u3002";
        warningDiv.style.width = "100%";
        warningDiv.style.backgroundColor = "yellow";
        warningDiv.style.color = "black";
        warningDiv.style.textAlign = "center";
        warningDiv.style.padding = "5px";
        warningDiv.style.fontSize = "12px";
        warningDiv.style.boxSizing = "border-box";
        warningDiv.addEventListener("click", async () => {
          await fetch("https://sso.ccw.site/web/auth/logout", {
            headers: {
              "content-type": "application/json"
            },
            body: "{}",
            method: "POST",
            mode: "cors",
            credentials: "include"
          });
          document.cookie = "cookie-user-id=;domain=.ccw.site;path=/;max-age=-999999";
          window.location.reload();
        });
        target.appendChild(warningDiv);
      }
    }
    dispose() {
    }
  };

  // src/asset/logo.svg
  var logo_default = 'data:image/svg+xml,<?xml version="1.0" encoding="UTF-8"?>%0A<svg fill="none" version="1.1" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">%0A  <g transform="matrix(1,0,0,-1,0,80)">%0A    <g transform="matrix(1,0,0,-1,0,160)">%0A      <path%0A        d="m9.4332 86.067-1.7864-1.782c-4.6571 3.6624-7.6468 9.3405-7.6468 15.715 0 5.3448 2.1018 10.2 5.5258 13.788l1.7728-1.7684c-2.9708-3.1349-4.7924-7.365-4.7924-12.019 0-5.6848 2.7174-10.737 6.927-13.933zm2.7405 29.575-1.8541 1.8496c2.8814 1.5984 6.1991 2.5088 9.7299 2.5088 10.396 0 18.945-7.8934 19.95-18h-2.5205c-0.9949 8.7231-8.4191 15.5-17.43 15.5-2.8321 0-5.5075-0.6695-7.8758-1.8584zm19.256-28.96 1.6169-1.9102c-3.5-2.9753-8.0385-4.7712-12.997-4.7712-1.6482 0-3.2499 0.19838-4.7825 0.57251l2.1313 2.126c0.8646-0.13074 1.75-0.19853 2.6512-0.19853 4.3427 0 8.3169 1.574 11.38 4.1814z"%0A        fill="%2330D34B" fill-rule="evenodd" />%0A      <path%0A        d="m20.05 86.045v-0.045285c-6.0798 0-11.257 3.8564-13.207 9.2507-1.9631 5.3748-0.47868 11.63 4.1686 15.519 5.4162 4.5336 13.258 4.2889 18.375-0.2846l-0.0192-0.0161c2.4219-2.1464 4.0939-5.1163 4.5748-8.4695h-5.0945q-0.1527 0.6663-0.4092 1.3128-0.6879 1.7331-2.0091 3.0512-1.3213 1.318-3.0587 2.0041-1.6001 0.6319-3.3211 0.6319-1.7209 0-3.321-0.6319-1.7374-0.6861-3.0587-2.0041-1.3213-1.3181-2.0091-3.0512-0.63347-1.5961-0.63346-3.3128 0-1.5702 0.52996-3.0395 0.54154-1.4842 1.5643-2.7 1.1062-1.3151 2.62-2.1316 1.6437-0.8866 3.5051-1.049 1.8615-0.16246 3.6345 0.42595 1.633 0.54193 2.9513 1.6454l3.2219-3.8302c-2.6269-2.1988-5.8244-3.2736-9.0047-3.2757z"%0A        fill="%231E9F33" fill-rule="evenodd" />%0A    </g>%0A  </g>%0A</svg>';

  // src/util/constant.js
  var CSENSE_WINDOW_BASE_ZINDEX = 9999;

  // src/util/window.js
  var windowOpen = window.open;
  function createWindow(element, onClose) {
    const reopenButton = document.createElement("button");
    reopenButton.style.position = "fixed";
    reopenButton.style.bottom = "20px";
    reopenButton.style.right = "20px";
    reopenButton.style.zIndex = String(CSENSE_WINDOW_BASE_ZINDEX);
    reopenButton.style.padding = "10px";
    reopenButton.style.color = "white";
    reopenButton.style.border = "none";
    reopenButton.style.cursor = "pointer";
    reopenButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
    reopenButton.style.width = "50px";
    reopenButton.style.height = "50px";
    reopenButton.style.borderRadius = "50%";
    reopenButton.style.background = "linear-gradient(45deg, #005EAC, #404040)";
    reopenButton.title = "CCW \u8106\u5F31\u6027\u7684\u6839\u672C\u8BC1\u660E\u3002";
    const image = document.createElement("img");
    image.src = logo_default;
    image.alt = "CSense";
    reopenButton.appendChild(image);
    let isDraggingButton = false;
    let hasPositionChanged = false;
    let buttonOffsetX, buttonOffsetY;
    reopenButton.addEventListener("mousedown", (e) => {
      isDraggingButton = true;
      hasPositionChanged = false;
      buttonOffsetX = e.clientX - reopenButton.getBoundingClientRect().left;
      buttonOffsetY = e.clientY - reopenButton.getBoundingClientRect().top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (isDraggingButton) {
        delete reopenButton.style.bottom;
        delete reopenButton.style.right;
        reopenButton.style.left = e.clientX - buttonOffsetX + "px";
        reopenButton.style.top = e.clientY - buttonOffsetY + "px";
        hasPositionChanged = true;
        e.preventDefault();
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (isDraggingButton) {
        if (hasPositionChanged) {
          isDraggingButton = false;
        } else {
          reopenButton.style.display = "none";
          floatingDiv.style.display = "block";
          floatingDiv.style.top = reopenButton.style.top;
          floatingDiv.style.left = reopenButton.style.left;
          floatingDiv.animate([{ opacity: "0" }, { opacity: "1" }], {
            duration: 300,
            easing: "ease-in-out"
          });
        }
        e.preventDefault();
      }
    });
    document.documentElement.appendChild(reopenButton);
    function closeFloatingDiv() {
      floatingDiv.style.display = "none";
      reopenButton.style.display = "block";
    }
    const floatingDiv = document.createElement("div");
    floatingDiv.className = "csense-window";
    floatingDiv.style.position = "fixed";
    floatingDiv.style.minWidth = "240px";
    floatingDiv.style.minHeight = "120px";
    floatingDiv.style.width = "auto";
    floatingDiv.style.height = "auto";
    floatingDiv.style.backgroundColor = "#ffffff";
    floatingDiv.style.color = "#000000";
    floatingDiv.style.border = "1px solid #dddddd";
    floatingDiv.style.borderRadius = "8px";
    floatingDiv.style.zIndex = "9999";
    floatingDiv.style.top = "20px";
    floatingDiv.style.left = "20px";
    floatingDiv.style.overflow = "hidden";
    floatingDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    let isDragging = false;
    let offsetX, offsetY;
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.padding = "10px";
    header.style.background = "linear-gradient(45deg, #005EAC, #404040)";
    header.style.color = "white";
    header.style.cursor = "move";
    header.style.borderTopLeftRadius = "8px";
    header.style.borderTopRightRadius = "8px";
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - floatingDiv.getBoundingClientRect().left;
      offsetY = e.clientY - floatingDiv.getBoundingClientRect().top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        floatingDiv.style.left = e.clientX - offsetX + "px";
        floatingDiv.style.top = e.clientY - offsetY + "px";
        e.preventDefault();
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (isDragging) {
        isDragging = false;
        e.preventDefault();
      }
    });
    const logo = document.createElement("img");
    logo.src = logo_default;
    logo.alt = "CSense";
    logo.style.cursor = "pointer";
    logo.style.height = "24px";
    logo.style.marginRight = "10px";
    let isRotating = false;
    let rotation = 0;
    function rotate() {
      if (isRotating) {
        rotation += 15;
        logo.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(rotate);
      }
    }
    logo.addEventListener("mouseover", () => {
      if (!isRotating) {
        logo.style.transition = "transform 0.3s linear";
        isRotating = true;
        rotate();
      }
    });
    logo.addEventListener("mouseout", () => {
      isRotating = false;
      rotation = 0;
      logo.style.transition = "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)";
      logo.style.transform = `rotate(0deg)`;
    });
    header.appendChild(logo);
    const title = document.createElement("strong");
    title.textContent = "CSense";
    title.style.flexGrow = "1";
    title.style.textAlign = "left";
    title.style.fontFamily = "monospace";
    title.style.fontSize = "1em";
    title.style.fontWeight = "normal";
    header.appendChild(title);
    const closeButton = document.createElement("button");
    closeButton.style.background = "none";
    closeButton.style.border = "none";
    closeButton.style.color = "white";
    closeButton.style.cursor = "pointer";
    closeButton.textContent = "\u2716";
    closeButton.addEventListener("click", () => {
      if (onClose()) closeFloatingDiv();
    });
    header.appendChild(closeButton);
    floatingDiv.appendChild(header);
    floatingDiv.appendChild(element);
    closeFloatingDiv();
    document.documentElement.appendChild(floatingDiv);
    return {
      button: reopenButton,
      window: floatingDiv,
      setTitle: (v) => {
        title.textContent = v;
      }
    };
  }
  function createScrollable() {
    const scrollable = document.createElement("div");
    scrollable.style.maxHeight = "300px";
    scrollable.style.maxWidth = "500px";
    scrollable.style.overflowY = "auto";
    scrollable.style.padding = "0";
    scrollable.style.margin = "0";
    return scrollable;
  }

  // src/api/vmapi.js
  var Variable = class _Variable {
    static freezed = Symbol("LockedByCSense");
    constructor(target, id) {
      this.variable = target.variables[id];
    }
    get() {
      return this.variable.value;
    }
    set(v) {
      this.variable.value = v;
      return this;
    }
    get freezing() {
      return !!this.variable[_Variable.freezed];
    }
    set freezing(v) {
      if (v) {
        if (this.variable[_Variable.freezed]) return;
        this.variable[_Variable.freezed] = true;
        this.watch(function(before) {
          return before;
        });
      } else {
        delete this.variable[_Variable.freezed];
        this.unwatch();
      }
    }
    watch(callback) {
      let variable = this.variable.value;
      Object.defineProperty(this.variable, "value", {
        get() {
          return variable;
        },
        set(value) {
          const oldValue = variable;
          variable = callback(oldValue, value);
        },
        configurable: true
      });
    }
    unwatch() {
      const freezedValue = this.variable.value;
      delete this.variable.value;
      this.variable.value = freezedValue;
    }
  };
  var VMAPI = class {
    constructor(vm2) {
      this.instance = vm2;
    }
    sprite(name) {
      const v = this.instance.runtime.targets.find((t) => t.sprite.name === name);
      if (!v) return null;
      return new VMSprite(v.sprite);
    }
  };
  var VMSprite = class {
    constructor(sprite) {
      this.sprite = sprite;
    }
    get clones() {
      return this.sprite.clones.map((v) => new VMTarget(v));
    }
    on(event, callback) {
      if (event === "clone") {
        patch(this.sprite, "createClone", (createClone) => {
          return function(...args) {
            const res = createClone.call(this, ...args);
            callback(res);
            return res;
          };
        });
      }
    }
  };
  var VMTarget = class {
    constructor(target) {
      this.target = target;
    }
    varId(id) {
      if (this.target.variables[id]) return new Variable(this.target, id);
      return null;
    }
    var(name) {
      const v = Object.values(this.target.variables).find((v2) => v2.name === name);
      if (v) return new Variable(this.target, v.id);
      return null;
    }
  };

  // src/scene/sprite.js
  var SpriteScene = class {
    static title = "\u53D8\u91CF\u7BA1\u7406";
    constructor(manager, sprite) {
      this.manager = manager;
      this.sprite = sprite;
      this.runtime = sprite.runtime;
      this.isRunning = this.runtime.frameLoop.running;
      Object.defineProperty(this.runtime.frameLoop, "running", {
        get: () => this.isRunning,
        set: (value) => {
          this.isRunning = value;
          if (this.pauseButton) this.modifyPauseState(this.pauseButton);
        },
        configurable: true
      });
      this.selected = null;
      this.disposed = false;
      this.lastLength = null;
      this.lastFocused = null;
      this.pauseButton = null;
      this.inputs = {};
      this.index = null;
      this.total = null;
      const animationFrame = () => {
        if (this.index) {
          this.index.max = this.sprite.clones.length;
          if (this.selected !== null && this.selected >= this.sprite.clones.length) {
            this.selected = this.sprite.clones.length - 1;
            this.manager.requestUpdate();
            return;
          }
        }
        if (this.total && this.sprite.clones.length !== this.lastLength) {
          this.total.textContent = `/ ${this.sprite.clones.length}`;
          this.lastLength = this.sprite.clones.length;
          this.total.animate([{ color: "red" }, { color: "" }], {
            duration: 300
          });
        }
        for (const [id, value] of Object.entries(this.inputs)) {
          const content = String(
            this.sprite.clones[this.selected ?? 0].variables[id].value
          );
          if (value.value !== content && value !== this.lastFocused) {
            value.animate([{ color: "red" }, { color: "" }], {
              duration: 300
            });
            value.value = content;
          }
        }
        if (!this.disposed) requestAnimationFrame(animationFrame);
      };
      requestAnimationFrame(animationFrame);
    }
    modifyPauseState(pauseButton) {
      pauseButton.textContent = this.isRunning ? "\u23F8\uFE0F" : "\u25B6\uFE0F";
      pauseButton.title = this.isRunning ? "\u6682\u505C" : "\u7EE7\u7EED";
      pauseButton.style.padding = "5px";
      pauseButton.style.border = "none";
      pauseButton.style.borderRadius = "5px";
      pauseButton.style.color = "white";
      pauseButton.style.backgroundColor = this.isRunning ? "blue" : "#e9ae3b";
      pauseButton.style.cursor = "pointer";
      pauseButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
      pauseButton.style.width = "30px";
      pauseButton.style.height = "30px";
    }
    render() {
      if (this.selected >= this.sprite.clones.length) {
        this.selected = this.sprite.clones.length - 1;
      }
      const target = this.manager.target;
      const sprite = this.sprite;
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.alignItems = "center";
      target.appendChild(container);
      const pauseButton = document.createElement("button");
      pauseButton.addEventListener("click", () => {
        if (this.isRunning) {
          this.runtime.frameLoop.stop();
        } else {
          this.runtime.frameLoop.start();
        }
      });
      this.pauseButton = pauseButton;
      this.modifyPauseState(pauseButton);
      container.appendChild(pauseButton);
      const cloneIndex = document.createElement("input");
      cloneIndex.type = "number";
      cloneIndex.min = 1;
      cloneIndex.value = this.selected === null ? "" : this.selected + 1;
      cloneIndex.max = this.sprite.clones.length;
      cloneIndex.placeholder = "\u514B\u9686\u4F53\u7F16\u53F7";
      cloneIndex.style.flexGrow = "1";
      cloneIndex.style.padding = "5px";
      cloneIndex.style.border = "1px solid #ddd";
      cloneIndex.style.borderRadius = "4px";
      cloneIndex.addEventListener("change", () => {
        const index = parseInt(cloneIndex.value);
        if (index >= 1 && index <= this.sprite.clones.length) {
          this.selected = index - 1;
          this.manager.requestUpdate();
        }
      });
      this.index = cloneIndex;
      container.appendChild(cloneIndex);
      const total = document.createElement("span");
      total.style.color = "#999";
      total.style.marginLeft = "10px";
      this.lastLength = this.sprite.clones.length;
      total.textContent = `/ ${this.sprite.clones.length}`;
      this.total = total;
      container.appendChild(total);
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "\u641C\u7D22\u53D8\u91CF...";
      searchInput.style.padding = "5px";
      searchInput.style.border = "1px solid #ddd";
      searchInput.style.width = "100%";
      searchInput.style.boxSizing = "border-box";
      searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        const items = variableList.children;
        let hasResults = false;
        Array.from(items).forEach((item) => {
          if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
            item.style.display = "flex";
            hasResults = true;
          } else if (item.className !== "no-results") {
            item.style.display = "none";
          }
        });
        if (!hasResults) {
          if (!variableList.querySelector(".no-results")) {
            const noResultsItem = document.createElement("li");
            noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
            noResultsItem.className = "no-results";
            noResultsItem.style.display = "flex";
            noResultsItem.style.justifyContent = "center";
            noResultsItem.style.alignItems = "center";
            noResultsItem.style.width = "100%";
            noResultsItem.style.height = "100%";
            noResultsItem.style.color = "#999";
            variableList.appendChild(noResultsItem);
          }
        } else {
          const noResultsItem = variableList.querySelector(".no-results");
          if (noResultsItem) {
            variableList.removeChild(noResultsItem);
          }
        }
      });
      target.appendChild(searchInput);
      const scrollable = createScrollable();
      const variableList = document.createElement("ul");
      variableList.style.padding = "0";
      variableList.style.margin = "0";
      variableList.style.listStyleType = "none";
      variableList.style.marginTop = "10px";
      if (Object.keys(sprite.clones[this.selected ?? 0].variables).length === 0) {
        const noResultsItem = document.createElement("li");
        noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
        noResultsItem.className = "no-results";
        noResultsItem.style.display = "flex";
        noResultsItem.style.justifyContent = "center";
        noResultsItem.style.alignItems = "center";
        noResultsItem.style.width = "100%";
        noResultsItem.style.height = "100%";
        noResultsItem.style.color = "#999";
        variableList.appendChild(noResultsItem);
      } else {
        this.inputs = Object.fromEntries(
          Object.values(sprite.clones[this.selected ?? 0].variables).map(
            (variable) => {
              const listItem = document.createElement("li");
              listItem.style.display = "flex";
              listItem.style.alignItems = "center";
              listItem.style.marginBottom = "5px";
              listItem.style.padding = "5px";
              listItem.style.border = "1px solid #ddd";
              listItem.style.borderRadius = "4px";
              listItem.style.backgroundColor = "#f9f9f9";
              const nameSpan = document.createElement("span");
              nameSpan.textContent = variable.name;
              nameSpan.className = "item-name";
              nameSpan.style.flexGrow = "1";
              nameSpan.style.marginRight = "10px";
              const valueInput = document.createElement("input");
              valueInput.type = "text";
              valueInput.style.fontFamily = "monospace";
              valueInput.value = Array.isArray(variable.value) ? JSON.stringify(variable.value) : variable.value;
              valueInput.style.flexGrow = "2";
              valueInput.style.marginRight = "10px";
              valueInput.addEventListener("change", () => {
                try {
                  variable.value = JSON.parse(valueInput.value);
                } catch {
                  variable.value = valueInput.value;
                }
              });
              valueInput.addEventListener("focus", () => {
                this.lastFocused = valueInput;
              });
              valueInput.addEventListener("blur", () => {
                this.lastFocused = null;
              });
              const lockButton = document.createElement("button");
              lockButton.style.marginRight = "5px";
              const v = new Variable(
                sprite.clones[this.selected ?? 0],
                variable.id
              );
              lockButton.textContent = v.freezing ? "\u{1F513}" : "\u{1F512}";
              lockButton.title = v.freezing ? "\u89E3\u9501" : "\u9501\u5B9A";
              valueInput.disabled = v.freezing;
              lockButton.addEventListener("click", () => {
                try {
                  variable.value = JSON.parse(valueInput.value);
                } catch {
                  variable.value = valueInput.value;
                }
                v.freezing = !v.freezing;
                lockButton.title = v.freezing ? "\u89E3\u9501" : "\u9501\u5B9A";
                lockButton.textContent = v.freezing ? "\u{1F513}" : "\u{1F512}";
                valueInput.disabled = v.freezing;
              });
              listItem.appendChild(nameSpan);
              listItem.appendChild(valueInput);
              listItem.appendChild(lockButton);
              variableList.appendChild(listItem);
              return [variable.id, valueInput];
            }
          )
        );
      }
      scrollable.appendChild(variableList);
      target.appendChild(scrollable);
    }
    dispose() {
      this.disposed = true;
      delete this.runtime.frameLoop.running;
      this.runtime.frameLoop.running = this.isRunning;
    }
  };

  // src/scene/project.js
  var ProjectScene = class {
    static title = "\u9879\u76EE";
    constructor(manager, JSZip, input) {
      this.manager = manager;
      this.vm = state_default.vm;
      this.JSZip = JSZip;
      this.input = input;
    }
    render() {
      const target = this.manager.target;
      const searchContainer = document.createElement("div");
      searchContainer.style.display = "flex";
      searchContainer.style.justifyContent = "center";
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "\u641C\u7D22\u89D2\u8272...";
      searchInput.style.padding = "5px";
      searchInput.style.border = "1px solid #ddd";
      searchInput.style.width = "100%";
      searchInput.style.boxSizing = "border-box";
      const downloadButton = document.createElement("button");
      downloadButton.textContent = "\u2B07\uFE0F";
      downloadButton.title = "\u4E0B\u8F7D\u9879\u76EE";
      downloadButton.style.padding = "10px";
      downloadButton.style.border = "none";
      downloadButton.style.cursor = "pointer";
      downloadButton.style.background = "rgb(0, 123, 255)";
      downloadButton.style.color = "white";
      downloadButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
      downloadButton.addEventListener("click", async () => {
        downloadButton.disabled = true;
        let zip = null;
        let projectJson = null;
        if (typeof this.input === "string" || typeof this.input === "object" && !(this.input instanceof ArrayBuffer) && !(this.input instanceof Uint8Array)) {
          zip = new this.JSZip();
          zip.file("project.json", this.input);
          projectJson = JSON.parse(this.input);
        } else {
          zip = await this.JSZip.loadAsync(this.input);
          const projectFile = zip.file("project.json");
          projectJson = JSON.parse(await projectFile.async("string"));
        }
        const filesToFetch = [];
        if (projectJson.gandi?.assets) {
          projectJson.gandi.assets.forEach((asset) => {
            filesToFetch.push([
              `${asset.md5ext}`,
              `https://m.ccw.site/user_projects_assets/${encodeURIComponent(asset.md5ext)}`
            ]);
          });
        }
        for (const target2 of projectJson.targets) {
          target2.sounds.forEach((sound) => {
            filesToFetch.push([
              `${sound.md5ext}`,
              `https://m.ccw.site/user_projects_assets/${encodeURIComponent(sound.md5ext)}`
            ]);
          });
          target2.costumes.forEach((costume) => {
            filesToFetch.push([
              `${costume.md5ext}`,
              `https://m.ccw.site/user_projects_assets/${encodeURIComponent(costume.md5ext)}`
            ]);
          });
        }
        const concurrency = 32;
        let index = 0;
        await Promise.all(
          new Array(concurrency).fill(0).map(async () => {
            while (index < filesToFetch.length) {
              const [md5ext, url2] = filesToFetch[index++];
              if (zip.file(md5ext)) continue;
              try {
                const res = await fetch(url2);
                if (!res.ok)
                  throw new Error(`Failed to fetch ${url2}: ${res.statusText}`);
                const blob = await res.blob();
                zip.file(md5ext, blob);
              } catch (e) {
                console.error(e);
              }
            }
          })
        );
        const content = await zip.generateAsync({ type: "arraybuffer" });
        const url = URL.createObjectURL(
          new Blob([content], { type: "application/zip" })
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "project.sb3";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadButton.disabled = false;
      });
      searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        const items = spriteList.children;
        let hasResults = false;
        Array.from(items).forEach((item) => {
          if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
            item.style.display = "flex";
            hasResults = true;
          } else if (item.className !== "no-results") {
            item.style.display = "none";
          }
        });
        if (!hasResults) {
          if (!spriteList.querySelector(".no-results")) {
            const noResultsItem = document.createElement("li");
            noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
            noResultsItem.className = "no-results";
            noResultsItem.style.display = "flex";
            noResultsItem.style.justifyContent = "center";
            noResultsItem.style.alignItems = "center";
            noResultsItem.style.width = "100%";
            noResultsItem.style.height = "100%";
            noResultsItem.style.color = "#999";
            spriteList.appendChild(noResultsItem);
          }
        } else {
          const noResultsItem = spriteList.querySelector(".no-results");
          if (noResultsItem) {
            spriteList.removeChild(noResultsItem);
          }
        }
      });
      searchContainer.appendChild(searchInput);
      searchContainer.appendChild(downloadButton);
      target.appendChild(searchContainer);
      const scrollable = createScrollable();
      const spriteList = document.createElement("ul");
      spriteList.style.marginTop = "10px";
      spriteList.style.padding = "0";
      spriteList.style.margin = "0";
      spriteList.style.listStyleType = "none";
      const sprites = this.vm.runtime.targets.filter((target2) => target2.isOriginal).map((target2) => target2.sprite);
      sprites.forEach((sprite) => {
        const listItem = document.createElement("li");
        listItem.style.display = "flex";
        listItem.style.flexDirection = "column";
        listItem.style.alignItems = "center";
        listItem.style.flex = "1 1 calc(25% - 10px)";
        listItem.style.maxWidth = "25%";
        listItem.style.margin = "5px";
        listItem.style.boxSizing = "border-box";
        listItem.style.textAlign = "center";
        listItem.style.padding = "10px";
        listItem.style.border = "1px solid #ddd";
        listItem.style.borderRadius = "8px";
        listItem.style.backgroundColor = "#f9f9f9";
        listItem.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        listItem.addEventListener("mouseover", () => {
          listItem.style.transform = "scale(1.05)";
          listItem.style.transition = "transform 0.2s ease-in-out";
        });
        listItem.addEventListener("mouseout", () => {
          listItem.style.transform = "scale(1)";
        });
        listItem.addEventListener("click", () => {
          this.manager.open(new SpriteScene(this.manager, sprite));
        });
        const spriteImage = document.createElement("img");
        spriteImage.src = sprite.costumes[0].asset.encodeDataURI();
        spriteImage.alt = sprite.name;
        spriteImage.style.width = "100%";
        spriteImage.style.height = "100%";
        spriteImage.style.marginBottom = "5px";
        const spriteName = document.createElement("div");
        spriteName.title = spriteName.textContent = sprite.name;
        spriteName.style.width = "80px";
        spriteName.className = "item-name";
        spriteName.style.fontSize = "14px";
        spriteName.style.fontWeight = "bold";
        spriteName.style.whiteSpace = "nowrap";
        spriteName.style.overflow = "hidden";
        spriteName.style.textOverflow = "ellipsis";
        listItem.appendChild(spriteImage);
        listItem.appendChild(spriteName);
        spriteList.appendChild(listItem);
      });
      spriteList.style.display = "flex";
      spriteList.style.flexWrap = "wrap";
      scrollable.appendChild(spriteList);
      target.appendChild(scrollable);
    }
    dispose() {
    }
  };

  // src/scene/leaderboard.js
  var LeaderboardScene = class {
    static title = "\u6392\u884C\u699C";
    constructor(manager, extension, leaderboardId) {
      this.manager = manager;
      this.extension = extension;
      this.leaderboardId = leaderboardId;
      this.leaderboard = null;
      this.fetching = false;
    }
    render() {
      const scrollable = createScrollable();
      if (!this.leaderboard) {
        if (!this.fetching)
          fetch(
            `https://gandi-main.ccw.site/creation/leaderboards/${this.leaderboardId}/records`,
            {
              credentials: "include"
            }
          ).then((v) => v.json()).then((v) => {
            if (v.body) {
              this.leaderboard = v.body;
              this.fetching = false;
              this.manager.requestUpdate();
            }
          });
        this.fetching = true;
        const loading = document.createElement("strong");
        loading.style.color = "#999";
        loading.textContent = "\u52A0\u8F7D\u4E2D...";
        loading.style.display = "block";
        loading.style.textAlign = "center";
        scrollable.appendChild(loading);
        this.manager.target.appendChild(scrollable);
      } else {
        const searchContainer = document.createElement("div");
        searchContainer.style.display = "flex";
        searchContainer.style.justifyContent = "center";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "\u641C\u7D22\u6392\u884C\u699C...";
        searchInput.style.padding = "5px";
        searchInput.style.border = "1px solid #ddd";
        searchInput.style.width = "100%";
        searchInput.style.boxSizing = "border-box";
        searchInput.addEventListener("input", () => {
          const filter = searchInput.value.toLowerCase();
          const items = leaderboardList.children;
          let hasResults = false;
          Array.from(items).forEach((item) => {
            if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
              item.style.display = "flex";
              hasResults = true;
            } else if (item.className !== "no-results") {
              item.style.display = "none";
            }
          });
          if (!hasResults) {
            if (!leaderboardList.querySelector(".no-results")) {
              const noResultsItem = document.createElement("li");
              noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
              noResultsItem.className = "no-results";
              noResultsItem.style.display = "flex";
              noResultsItem.style.justifyContent = "center";
              noResultsItem.style.alignItems = "center";
              noResultsItem.style.width = "100%";
              noResultsItem.style.height = "100%";
              noResultsItem.style.color = "#999";
              leaderboardList.appendChild(noResultsItem);
            }
          } else {
            const noResultsItem = leaderboardList.querySelector(".no-results");
            if (noResultsItem) {
              leaderboardList.removeChild(noResultsItem);
            }
          }
        });
        searchContainer.appendChild(searchInput);
        this.manager.target.appendChild(searchContainer);
        const leaderboardList = document.createElement("ul");
        leaderboardList.style.marginTop = "10px";
        leaderboardList.style.padding = "0";
        leaderboardList.style.margin = "0";
        leaderboardList.style.listStyleType = "none";
        this.leaderboard.leaderboardRecords.forEach((record) => {
          const listItem = document.createElement("li");
          listItem.style.display = "flex";
          listItem.style.flexDirection = "column";
          listItem.style.alignItems = "flex-start";
          listItem.style.padding = "5px";
          listItem.style.border = "1px solid #ddd";
          listItem.style.borderRadius = "4px";
          listItem.style.backgroundColor = "#f9f9f9";
          const rankSpan = document.createElement("span");
          rankSpan.textContent = `${record.ranking}`;
          rankSpan.style.marginRight = "10px";
          const nameContainer = document.createElement("div");
          nameContainer.style.display = "flex";
          nameContainer.style.alignItems = "center";
          nameContainer.style.width = "100%";
          const avatar = document.createElement("img");
          avatar.src = record.user.avatar;
          avatar.alt = "avatar";
          avatar.style.width = "24px";
          avatar.style.height = "24px";
          avatar.style.marginRight = "10px";
          avatar.style.cursor = "pointer";
          avatar.style.borderRadius = "50%";
          avatar.title = "\u67E5\u770B\u4E3B\u9875";
          avatar.addEventListener("click", () => {
            windowOpen(
              `https://www.ccw.site/student/${record.user.id}`,
              "window",
              "left=100,top=100,width=640,height=640"
            );
          });
          const nameSpan = document.createElement("span");
          nameSpan.textContent = record.user.nickname;
          nameSpan.className = "item-name";
          nameSpan.style.flexGrow = "1";
          nameSpan.style.marginRight = "10px";
          nameSpan.style.textWrapMode = "nowrap";
          nameSpan.style.overflow = "hidden";
          nameSpan.style.textOverflow = "ellipsis";
          nameSpan.title = `\u521B\u5EFA\u65F6\u95F4 ${record.createdAt === null ? "\u672A\u77E5" : new Date(record.createdAt)} / \u6700\u540E\u66F4\u65B0 ${record.updatedAt === null ? "\u672A\u77E5" : new Date(record.updatedAt)}`;
          const scoreSpan = document.createElement("span");
          scoreSpan.textContent = `${record.score} ${this.leaderboard.scoreUnit}`;
          scoreSpan.style.color = "#666";
          scoreSpan.style.textWrapMode = "nowrap";
          scoreSpan.style.overflow = "hidden";
          scoreSpan.style.textOverflow = "ellipsis";
          nameContainer.appendChild(rankSpan);
          nameContainer.appendChild(avatar);
          nameContainer.appendChild(nameSpan);
          nameContainer.appendChild(scoreSpan);
          listItem.appendChild(nameContainer);
          leaderboardList.appendChild(listItem);
        });
        scrollable.appendChild(leaderboardList);
        this.manager.target.appendChild(scrollable);
        if (this.leaderboard.curUserLeaderboardRecord) {
          const record = this.leaderboard.curUserLeaderboardRecord;
          const userItem = document.createElement("div");
          userItem.style.display = "flex";
          userItem.style.flexDirection = "column";
          userItem.style.alignItems = "flex-start";
          userItem.style.padding = "5px";
          userItem.style.border = "1px solid #ddd";
          userItem.style.borderRadius = "4px";
          userItem.style.backgroundColor = "#f9f9f9";
          const rankSpan = document.createElement("span");
          rankSpan.textContent = `${record.ranking}`;
          rankSpan.style.marginRight = "10px";
          const nameContainer = document.createElement("div");
          nameContainer.style.display = "flex";
          nameContainer.style.alignItems = "center";
          nameContainer.style.width = "100%";
          const avatar = document.createElement("img");
          avatar.src = record.user.avatar;
          avatar.alt = "avatar";
          avatar.style.width = "24px";
          avatar.style.height = "24px";
          avatar.style.marginRight = "10px";
          avatar.style.cursor = "default";
          avatar.style.borderRadius = "50%";
          const nameSpan = document.createElement("span");
          nameSpan.textContent = record.user.nickname;
          nameSpan.style.flexGrow = "1";
          nameSpan.style.marginRight = "10px";
          nameSpan.style.textWrapMode = "nowrap";
          nameSpan.style.overflow = "hidden";
          nameSpan.style.textOverflow = "ellipsis";
          nameSpan.title = `\u521B\u5EFA\u65F6\u95F4 ${record.createdAt === null ? "\u672A\u77E5" : new Date(record.createdAt)} / \u6700\u540E\u66F4\u65B0 ${record.updatedAt === null ? "\u672A\u77E5" : new Date(record.updatedAt)}`;
          const scoreInput = document.createElement("input");
          scoreInput.value = record.score;
          scoreInput.type = "number";
          scoreInput.style.border = "none";
          scoreInput.style.outline = "none";
          scoreInput.style.direction = "rtl";
          scoreInput.style.color = "#666";
          scoreInput.style.width = "100%";
          scoreInput.style.backgroundColor = "transparent";
          scoreInput.placeholder = "(\u65E0\u5206\u6570)";
          scoreInput.style.marginRight = "5px";
          scoreInput.addEventListener("change", () => {
            const v = Number(scoreInput.value);
            if (Number.isNaN(v)) {
              scoreInput.value = record.score;
            } else if (record.value !== v) {
              record.score = v;
              this.extension.apis.insertLeaderboard(
                this.leaderboardId,
                record.score,
                record.ext
              );
            }
          });
          const unitSpan = document.createElement("span");
          unitSpan.textContent = `${this.leaderboard.scoreUnit}`;
          unitSpan.style.color = "#666";
          unitSpan.style.textWrapMode = "nowrap";
          unitSpan.style.textOverflow = "ellipsis";
          nameContainer.appendChild(rankSpan);
          nameContainer.appendChild(avatar);
          nameContainer.appendChild(nameSpan);
          nameContainer.append(scoreInput);
          nameContainer.appendChild(unitSpan);
          userItem.appendChild(nameContainer);
          this.manager.target.appendChild(userItem);
        }
      }
    }
    dispose() {
    }
  };

  // src/scene/achievement.js
  var AchievementScene = class {
    static title = "\u6210\u5C31";
    constructor(manager, extension) {
      this.manager = manager;
      this.extension = extension;
      this.achievementList = null;
      this.leaderboardList = null;
      this.selected = "achievement";
      this.fetchingAchievement = false;
      this.fetchingLeaderboard = false;
    }
    renderLeaderboard() {
      const scrollable = createScrollable();
      if (!this.leaderboardList) {
        if (!this.fetchingLeaderboard)
          fetch(
            `https://gandi-main.ccw.site/creation/leaderboards?creationId=${this.extension.runtime.ccwAPI.getProjectUUID()}&perPage=200`,
            {
              credentials: "include"
            }
          ).then((v) => v.json()).then((v) => {
            if (v.body) {
              this.leaderboardList = v.body;
              this.fetchingLeaderboard = false;
              this.manager.requestUpdate();
            }
          });
        this.fetchingLeaderboard = true;
        const loading = document.createElement("strong");
        loading.style.color = "#999";
        loading.textContent = "\u52A0\u8F7D\u4E2D...";
        loading.style.display = "block";
        loading.style.textAlign = "center";
        scrollable.appendChild(loading);
      } else {
        const searchContainer = document.createElement("div");
        searchContainer.style.display = "flex";
        searchContainer.style.justifyContent = "center";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "\u641C\u7D22\u6392\u884C\u699C...";
        searchInput.style.padding = "5px";
        searchInput.style.border = "1px solid #ddd";
        searchInput.style.width = "100%";
        searchInput.style.boxSizing = "border-box";
        searchInput.addEventListener("input", () => {
          const filter = searchInput.value.toLowerCase();
          const items = leaderboardList.children;
          let hasResults = false;
          Array.from(items).forEach((item) => {
            if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
              item.style.display = "flex";
              hasResults = true;
            } else if (item.className !== "no-results") {
              item.style.display = "none";
            }
          });
          if (!hasResults) {
            if (!leaderboardList.querySelector(".no-results")) {
              const noResultsItem = document.createElement("li");
              noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
              noResultsItem.className = "no-results";
              noResultsItem.style.display = "flex";
              noResultsItem.style.justifyContent = "center";
              noResultsItem.style.alignItems = "center";
              noResultsItem.style.width = "100%";
              noResultsItem.style.height = "100%";
              noResultsItem.style.color = "#999";
              leaderboardList.appendChild(noResultsItem);
            }
          } else {
            const noResultsItem = leaderboardList.querySelector(".no-results");
            if (noResultsItem) {
              leaderboardList.removeChild(noResultsItem);
            }
          }
        });
        searchContainer.appendChild(searchInput);
        this.manager.target.appendChild(searchContainer);
        const leaderboardList = document.createElement("ul");
        leaderboardList.style.marginTop = "10px";
        leaderboardList.style.padding = "0";
        leaderboardList.style.margin = "0";
        leaderboardList.style.listStyleType = "none";
        if (this.leaderboardList.length === 0) {
          const noResultsItem = document.createElement("li");
          noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
          noResultsItem.className = "no-results";
          noResultsItem.style.display = "flex";
          noResultsItem.style.justifyContent = "center";
          noResultsItem.style.alignItems = "center";
          noResultsItem.style.width = "100%";
          noResultsItem.style.height = "100%";
          noResultsItem.style.color = "#999";
          leaderboardList.appendChild(noResultsItem);
        } else {
          this.leaderboardList.forEach((leaderboard) => {
            const listItem = document.createElement("li");
            listItem.style.display = "flex";
            listItem.style.flexDirection = "column";
            listItem.style.alignItems = "flex-start";
            listItem.style.marginBottom = "5px";
            listItem.style.padding = "5px";
            listItem.style.border = "1px solid #ddd";
            listItem.style.borderRadius = "4px";
            listItem.style.backgroundColor = "#f9f9f9";
            const nameContainer = document.createElement("div");
            nameContainer.style.display = "flex";
            nameContainer.style.alignItems = "center";
            nameContainer.style.width = "100%";
            const nameSpan = document.createElement("span");
            nameSpan.textContent = leaderboard.title;
            nameSpan.className = "item-name";
            nameSpan.title = `\u521B\u5EFA\u65F6\u95F4 ${leaderboard.createdAt === null ? "\u672A\u77E5" : new Date(leaderboard.createdAt)} / \u6700\u540E\u66F4\u65B0 ${new Date(
              leaderboard.updatedAt === null ? "\u672A\u77E5" : leaderboard.updatedAt
            )}`;
            nameSpan.style.flexGrow = "1";
            nameSpan.style.marginRight = "10px";
            const inspectButton = document.createElement("button");
            inspectButton.textContent = "\u{1F50D}";
            inspectButton.style.cursor = "pointer";
            inspectButton.style.marginRight = "5px";
            inspectButton.title = "\u67E5\u770B\u6392\u884C\u699C";
            inspectButton.addEventListener("click", () => {
              this.manager.open(
                new LeaderboardScene(
                  this.manager,
                  this.extension,
                  leaderboard.oid
                )
              );
            });
            const extra = document.createElement("span");
            extra.title = extra.textContent = `\u5355\u4F4D: ${leaderboard.scoreUnit}`;
            extra.style.textWrap = "nowrap";
            extra.style.overflow = "hidden";
            extra.style.textOverflow = "ellipsis";
            extra.style.maxWidth = "400px";
            extra.style.color = "#666";
            extra.style.width = "100%";
            nameContainer.appendChild(nameSpan);
            nameContainer.appendChild(inspectButton);
            listItem.appendChild(nameContainer);
            listItem.appendChild(extra);
            leaderboardList.appendChild(listItem);
          });
        }
        scrollable.appendChild(leaderboardList);
      }
      this.manager.target.appendChild(scrollable);
    }
    renderAchievements() {
      const scrollable = createScrollable();
      if (!this.achievementList) {
        if (!this.fetchingAchievement)
          fetch(
            `https://gandi-main.ccw.site/achievements?creationId=${this.extension.runtime.ccwAPI.getProjectUUID()}&perPage=200`,
            {
              credentials: "include"
            }
          ).then((v) => v.json()).then((v) => {
            if (v.body) {
              this.achievementList = v.body.data;
              this.fetchingAchievement = false;
              this.manager.requestUpdate();
            }
          });
        this.fetchingAchievement = true;
        const loading = document.createElement("strong");
        loading.style.color = "#999";
        loading.textContent = "\u52A0\u8F7D\u4E2D...";
        loading.style.display = "block";
        loading.style.textAlign = "center";
        scrollable.appendChild(loading);
      } else {
        const searchContainer = document.createElement("div");
        searchContainer.style.display = "flex";
        searchContainer.style.justifyContent = "center";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "\u641C\u7D22\u6210\u5C31...";
        searchInput.style.padding = "5px";
        searchInput.style.border = "1px solid #ddd";
        searchInput.style.width = "100%";
        searchInput.style.boxSizing = "border-box";
        searchInput.addEventListener("input", () => {
          const filter = searchInput.value.toLowerCase();
          const items = achievementList.children;
          let hasResults = false;
          Array.from(items).forEach((item) => {
            if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
              item.style.display = "flex";
              hasResults = true;
            } else if (item.className !== "no-results") {
              item.style.display = "none";
            }
          });
          if (!hasResults) {
            if (!achievementList.querySelector(".no-results")) {
              const noResultsItem = document.createElement("li");
              noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
              noResultsItem.className = "no-results";
              noResultsItem.style.display = "flex";
              noResultsItem.style.justifyContent = "center";
              noResultsItem.style.alignItems = "center";
              noResultsItem.style.width = "100%";
              noResultsItem.style.height = "100%";
              noResultsItem.style.color = "#999";
              achievementList.appendChild(noResultsItem);
            }
          } else {
            const noResultsItem = achievementList.querySelector(".no-results");
            if (noResultsItem) {
              achievementList.removeChild(noResultsItem);
            }
          }
        });
        searchContainer.appendChild(searchInput);
        this.manager.target.appendChild(searchContainer);
        const achievementList = document.createElement("ul");
        achievementList.style.marginTop = "10px";
        achievementList.style.padding = "0";
        achievementList.style.margin = "0";
        achievementList.style.listStyleType = "none";
        if (this.achievementList.length === 0) {
          const noResultsItem = document.createElement("li");
          noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
          noResultsItem.className = "no-results";
          noResultsItem.style.display = "flex";
          noResultsItem.style.justifyContent = "center";
          noResultsItem.style.alignItems = "center";
          noResultsItem.style.width = "100%";
          noResultsItem.style.height = "100%";
          noResultsItem.style.color = "#999";
          achievementList.appendChild(noResultsItem);
        } else {
          this.achievementList.forEach((achievement) => {
            const listItem = document.createElement("li");
            listItem.style.display = "flex";
            listItem.style.flexDirection = "column";
            listItem.style.alignItems = "flex-start";
            listItem.style.marginBottom = "5px";
            listItem.style.padding = "5px";
            listItem.style.border = "1px solid #ddd";
            listItem.style.borderRadius = "4px";
            listItem.style.backgroundColor = "#f9f9f9";
            const nameContainer = document.createElement("div");
            nameContainer.style.display = "flex";
            nameContainer.style.alignItems = "center";
            nameContainer.style.width = "100%";
            const icon = document.createElement("img");
            icon.src = achievement.icon;
            icon.title = `\u521B\u5EFA\u65F6\u95F4 ${achievement.createdAt === null ? "\u672A\u77E5" : new Date(achievement.createdAt)} / \u6700\u540E\u66F4\u65B0 ${achievement.updatedAt === null ? "\u672A\u77E5" : new Date(achievement.updatedAt)}`;
            icon.alt = "icon";
            icon.style.width = "24px";
            icon.style.height = "24px";
            icon.style.marginRight = "10px";
            const nameSpan = document.createElement("span");
            nameSpan.textContent = achievement.title;
            nameSpan.className = "item-name";
            nameSpan.title = achievement.description;
            nameSpan.style.flexGrow = "1";
            nameSpan.style.marginRight = "10px";
            const toggleButton = document.createElement("button");
            toggleButton.textContent = achievement.obtained ? "\u2705" : "\u274C";
            toggleButton.style.cursor = achievement.obtained ? "default" : "pointer";
            toggleButton.title = achievement.obtained ? "\u5DF2\u83B7\u5F97\u8BE5\u6210\u5C31" : "\u83B7\u5F97";
            toggleButton.style.marginRight = "5px";
            if (!achievement.obtained) {
              toggleButton.addEventListener(
                "click",
                () => {
                  this.extension.apis.obtainAchievement(achievement.oid);
                  achievement.obtained = true;
                  toggleButton.style.cursor = "default";
                  toggleButton.textContent = "\u2705";
                  toggleButton.title = "\u5DF2\u83B7\u5F97\u8BE5\u6210\u5C31";
                },
                { once: true }
              );
            }
            const extra = document.createElement("input");
            extra.type = "text";
            extra.value = achievement.recordExt ?? "";
            extra.placeholder = "(\u65E0\u9644\u52A0\u8BF4\u660E)";
            extra.style.color = "#666";
            extra.style.backgroundColor = "transparent";
            extra.style.width = "100%";
            extra.style.outline = "none";
            extra.style.border = "none";
            extra.addEventListener("change", () => {
              if (achievement.recordExt !== extra.value) {
                achievement.recordExt = extra.value;
                this.extension.apis.updateAchievementExtra(
                  achievement.oid,
                  extra.value
                );
              }
            });
            nameContainer.appendChild(icon);
            nameContainer.appendChild(nameSpan);
            nameContainer.appendChild(toggleButton);
            listItem.appendChild(nameContainer);
            listItem.appendChild(extra);
            achievementList.appendChild(listItem);
          });
        }
        scrollable.appendChild(achievementList);
      }
      this.manager.target.appendChild(scrollable);
    }
    render() {
      const tabContainer = document.createElement("div");
      tabContainer.style.display = "flex";
      tabContainer.style.justifyContent = "center";
      const achievementTab = document.createElement("button");
      achievementTab.textContent = "\u6210\u5C31";
      achievementTab.style.flexGrow = "1";
      achievementTab.style.padding = "10px";
      achievementTab.style.border = "1px solid #ddd";
      achievementTab.style.borderBottom = this.selected === "achievement" ? "none" : "1px solid #ddd";
      achievementTab.style.backgroundColor = this.selected === "achievement" ? "#f9f9f9" : "#fff";
      achievementTab.style.cursor = "pointer";
      achievementTab.addEventListener("click", () => {
        this.selected = "achievement";
        this.manager.requestUpdate();
      });
      const leaderboardTab = document.createElement("button");
      leaderboardTab.textContent = "\u6392\u884C\u699C";
      leaderboardTab.style.flexGrow = "1";
      leaderboardTab.style.padding = "10px";
      leaderboardTab.style.border = "1px solid #ddd";
      leaderboardTab.style.borderBottom = this.selected === "leaderboard" ? "none" : "1px solid #ddd";
      leaderboardTab.style.backgroundColor = this.selected === "leaderboard" ? "#f9f9f9" : "#fff";
      leaderboardTab.style.cursor = "pointer";
      leaderboardTab.addEventListener("click", () => {
        this.selected = "leaderboard";
        this.manager.requestUpdate();
      });
      tabContainer.appendChild(achievementTab);
      tabContainer.appendChild(leaderboardTab);
      this.manager.target.appendChild(tabContainer);
      if (this.selected === "achievement") {
        this.renderAchievements();
      } else {
        this.renderLeaderboard();
      }
    }
    dispose() {
    }
  };

  // src/scene/economyPool.js
  var EconomyPoolScene = class _EconomyPoolScene {
    static title = "\u5E01\u6C60\u7BA1\u7406";
    constructor(manager, extension, pool) {
      this.manager = manager;
      this.extension = extension;
      this.pool = pool;
    }
    static parseRule(str) {
      let state = 0;
      let key = "";
      const res = [];
      for (const c of str) {
        if (state === 0) {
          if (c === "[") {
            res.push(key);
            key = "";
            state = 1;
          } else {
            key += c;
          }
        } else if (state === 1) {
          if (c === "]") {
            state = 0;
            res.push({ name: key });
            key = "";
          } else {
            key += c;
          }
        }
      }
      if (state !== 0) throw new Error("Brace unclosed");
      if (key !== "") res.push(key);
      return res;
    }
    render() {
      const scrollable = createScrollable();
      const searchContainer = document.createElement("div");
      searchContainer.style.display = "flex";
      searchContainer.style.justifyContent = "center";
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "\u641C\u7D22\u89C4\u5219...";
      searchInput.style.padding = "5px";
      searchInput.style.border = "1px solid #ddd";
      searchInput.style.width = "100%";
      searchInput.style.boxSizing = "border-box";
      searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        const items = ruleList.children;
        let hasResults = false;
        Array.from(items).forEach((item) => {
          if (item.className !== "no-results" && item.description.toLowerCase().includes(filter)) {
            item.style.display = "flex";
            hasResults = true;
          } else if (item.className !== "no-results") {
            item.style.display = "none";
          }
        });
        if (!hasResults) {
          if (!ruleList.querySelector(".no-results")) {
            const noResultsItem = document.createElement("li");
            noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
            noResultsItem.className = "no-results";
            noResultsItem.style.display = "flex";
            noResultsItem.style.justifyContent = "center";
            noResultsItem.style.alignItems = "center";
            noResultsItem.style.width = "100%";
            noResultsItem.style.height = "100%";
            noResultsItem.style.color = "#999";
            ruleList.appendChild(noResultsItem);
          }
        } else {
          const noResultsItem = ruleList.querySelector(".no-results");
          if (noResultsItem) {
            ruleList.removeChild(noResultsItem);
          }
        }
      });
      searchContainer.appendChild(searchInput);
      this.manager.target.appendChild(searchContainer);
      const ruleList = document.createElement("ul");
      ruleList.style.marginTop = "10px";
      ruleList.style.padding = "0";
      ruleList.style.margin = "0";
      ruleList.style.listStyleType = "none";
      if (this.pool.rules.length === 0) {
        const noResultsItem = document.createElement("li");
        noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
        noResultsItem.className = "no-results";
        noResultsItem.style.display = "flex";
        noResultsItem.style.justifyContent = "center";
        noResultsItem.style.alignItems = "center";
        noResultsItem.style.width = "100%";
        noResultsItem.style.height = "100%";
        noResultsItem.style.color = "#999";
        ruleList.appendChild(noResultsItem);
      } else {
        this.pool.rules.forEach((rule) => {
          const listItem = document.createElement("li");
          listItem.description = rule.rule.funSignature.zh_cn;
          listItem.style.display = "flex";
          listItem.style.flexDirection = "column";
          listItem.style.alignItems = "flex-start";
          listItem.style.marginBottom = "5px";
          listItem.style.padding = "5px";
          listItem.style.border = "1px solid #ddd";
          listItem.style.borderRadius = "4px";
          listItem.style.backgroundColor = "#f9f9f9";
          const ruleContainer = document.createElement("div");
          ruleContainer.style.display = "flex";
          ruleContainer.style.alignItems = "center";
          ruleContainer.style.width = "100%";
          const parsedRule = _EconomyPoolScene.parseRule(
            rule.rule.funSignature.zh_cn
          );
          const inputs = {};
          for (const element of parsedRule) {
            if (typeof element === "string") {
              const span = document.createElement("span");
              span.textContent = element;
              span.style.textWrapMode = "nowrap";
              span.style.overflow = "hidden";
              span.style.textOverflow = "ellipsis";
              ruleContainer.appendChild(span);
            } else {
              const input = document.createElement("input");
              input.type = "number";
              input.placeholder = element.name;
              input.style.border = "none";
              input.style.outline = "none";
              input.style.backgroundColor = "transparent";
              input.style.textWrapMode = "nowrap";
              input.style.overflow = "hidden";
              input.style.textOverflow = "ellipsis";
              input.style.marginRight = "5px";
              input.style.width = "50px";
              ruleContainer.appendChild(input);
              inputs[element.name] = input;
            }
          }
          const executeButton = document.createElement("button");
          executeButton.textContent = "\u6267\u884C";
          executeButton.style.cursor = "pointer";
          executeButton.style.marginLeft = "auto";
          executeButton.title = rule.rule.title;
          executeButton.addEventListener("click", () => {
            let invalid = false;
            const params = Object.fromEntries(
              Object.entries(inputs).map(([key, input]) => {
                const value = Number(input.value);
                if (input.value === "" || Number.isNaN(value) || value <= 0) {
                  input.animate(
                    [{ backgroundColor: "red" }, { backgroundColor: "" }],
                    {
                      duration: 300
                    }
                  );
                  invalid = true;
                  return [key, 0];
                } else return [key, value];
              })
            );
            if (!invalid) {
              this.extension.apis.requestExecuteSmartContract(
                this.pool.id,
                rule.id,
                rule.rule.code,
                params
              );
            }
          });
          ruleContainer.appendChild(executeButton);
          listItem.appendChild(ruleContainer);
          ruleList.appendChild(listItem);
        });
      }
      scrollable.appendChild(ruleList);
      this.manager.target.appendChild(scrollable);
      const fundPanel = document.createElement("div");
      fundPanel.style.display = "flex";
      fundPanel.style.flexDirection = "row";
      fundPanel.style.alignItems = "flex-start";
      fundPanel.style.padding = "5px";
      fundPanel.style.border = "1px solid #ddd";
      fundPanel.style.borderRadius = "4px";
      fundPanel.style.backgroundColor = "#f9f9f9";
      const detailButton = document.createElement("button");
      detailButton.textContent = "\u89C4\u5219\u8BE6\u60C5";
      detailButton.style.cursor = "pointer";
      detailButton.style.marginRight = "5px";
      detailButton.title = "\u67E5\u770B\u89C4\u5219\u8BE6\u60C5";
      detailButton.addEventListener("click", () => {
        this.extension.apis.showSmartContractDetail(this.pool.id);
      });
      fundPanel.appendChild(detailButton);
      const fundButton = document.createElement("button");
      fundButton.textContent = "\u65E0\u507F\u6CE8\u8D44";
      fundButton.style.cursor = "pointer";
      fundButton.title = "\u8FDB\u884C\u65E0\u507F\u6CE8\u8D44";
      fundButton.addEventListener("click", () => {
        this.extension._requestFund({
          contractId: this.pool.id
        });
      });
      fundPanel.appendChild(fundButton);
      this.manager.target.appendChild(fundPanel);
    }
    dispose() {
    }
  };

  // src/scene/economy.js
  var EconomyScene = class {
    static title = "\u7ECF\u6D4E\u5408\u7EA6";
    constructor(manager, extension) {
      this.manager = manager;
      this.extension = extension;
      this.pools = null;
      this.fetching = false;
    }
    render() {
      const scrollable = createScrollable();
      if (!this.pools) {
        if (!this.fetching) {
          ;
          (async () => {
            const poolList = await this.extension.apis.getSmartContractList();
            for (const pool of poolList) {
              pool.balance = await this.extension.apis.getSmartContractAccountByContractId(
                pool.id
              );
            }
            this.fetching = false;
            this.pools = poolList;
            this.manager.requestUpdate();
          })();
        }
        this.fetching = true;
        const loading = document.createElement("strong");
        loading.style.color = "#999";
        loading.textContent = "\u52A0\u8F7D\u4E2D...";
        loading.style.display = "block";
        loading.style.textAlign = "center";
        scrollable.appendChild(loading);
      } else {
        const searchContainer = document.createElement("div");
        searchContainer.style.display = "flex";
        searchContainer.style.justifyContent = "center";
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "\u641C\u7D22\u5408\u7EA6...";
        searchInput.style.padding = "5px";
        searchInput.style.border = "1px solid #ddd";
        searchInput.style.width = "100%";
        searchInput.style.boxSizing = "border-box";
        searchInput.addEventListener("input", () => {
          const filter = searchInput.value.toLowerCase();
          const items = poolList.children;
          let hasResults = false;
          Array.from(items).forEach((item) => {
            if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
              item.style.display = "flex";
              hasResults = true;
            } else if (item.className !== "no-results") {
              item.style.display = "none";
            }
          });
          if (!hasResults) {
            if (!poolList.querySelector(".no-results")) {
              const noResultsItem = document.createElement("li");
              noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
              noResultsItem.className = "no-results";
              noResultsItem.style.display = "flex";
              noResultsItem.style.justifyContent = "center";
              noResultsItem.style.alignItems = "center";
              noResultsItem.style.width = "100%";
              noResultsItem.style.height = "100%";
              noResultsItem.style.color = "#999";
              poolList.appendChild(noResultsItem);
            }
          } else {
            const noResultsItem = poolList.querySelector(".no-results");
            if (noResultsItem) {
              poolList.removeChild(noResultsItem);
            }
          }
        });
        searchContainer.appendChild(searchInput);
        this.manager.target.appendChild(searchContainer);
        const poolList = document.createElement("ul");
        poolList.style.marginTop = "10px";
        poolList.style.padding = "0";
        poolList.style.margin = "0";
        poolList.style.listStyleType = "none";
        this.pools.forEach((pool) => {
          const typeMap = {
            DUCK_MAKER: "\u9E2D\u91CC\u5965",
            GENERAL: "\u901A\u7528",
            GENERAL_NO_SPLIT: "\u901A\u7528 (\u4F5C\u8005\u65E0\u5206\u6210)"
          };
          const listItem = document.createElement("li");
          listItem.style.display = "flex";
          listItem.style.flexDirection = "column";
          listItem.style.alignItems = "flex-start";
          listItem.style.marginBottom = "5px";
          listItem.style.padding = "5px";
          listItem.style.border = "1px solid #ddd";
          listItem.style.borderRadius = "4px";
          listItem.style.backgroundColor = "#f9f9f9";
          const nameContainer = document.createElement("div");
          nameContainer.style.display = "flex";
          nameContainer.style.alignItems = "center";
          nameContainer.style.width = "100%";
          const nameSpan = document.createElement("span");
          nameSpan.textContent = pool.title;
          nameSpan.className = "item-name";
          if (pool.status !== "ENABLED") {
            nameSpan.style.color = "#999";
          }
          nameSpan.title = `\u521B\u5EFA\u65F6\u95F4 ${pool.createdAt === null ? "\u672A\u77E5" : new Date(pool.createdAt)} / \u6700\u540E\u66F4\u65B0 ${new Date(
            pool.updatedAt === null ? "\u672A\u77E5" : pool.updatedAt
          )}`;
          nameSpan.style.flexGrow = "1";
          nameSpan.style.marginRight = "10px";
          const inspectButton = document.createElement("button");
          inspectButton.textContent = "\u{1F50D}";
          inspectButton.style.cursor = "pointer";
          inspectButton.style.marginRight = "5px";
          inspectButton.title = "\u67E5\u770B\u5408\u7EA6";
          inspectButton.addEventListener("click", () => {
            this.manager.open(
              new EconomyPoolScene(this.manager, this.extension, pool)
            );
          });
          const extra = document.createElement("span");
          extra.title = extra.textContent = `(${pool.status === "ENABLED" ? "\u53EF\u7528" : "\u4E0D\u53EF\u7528"}) ${typeMap[pool.type] ?? "\u672A\u77E5"} / ${pool.balance} \u5E01`;
          extra.style.textWrap = "nowrap";
          extra.style.overflow = "hidden";
          extra.style.textOverflow = "ellipsis";
          extra.style.maxWidth = "400px";
          extra.style.color = "#666";
          extra.style.width = "100%";
          nameContainer.appendChild(nameSpan);
          nameContainer.appendChild(inspectButton);
          listItem.appendChild(nameContainer);
          listItem.appendChild(extra);
          poolList.appendChild(listItem);
        });
        scrollable.appendChild(poolList);
      }
      this.manager.target.appendChild(scrollable);
    }
    dispose() {
    }
  };

  // src/scene/mmo.js
  var MMOScene = class {
    static title = "MMO";
    constructor(manager, extension) {
      this.manager = manager;
      this.extension = extension;
      this.inputing = false;
    }
    render() {
      if (this.extension.currentRoom) {
        const title1 = document.createElement("p");
        title1.textContent = "\u8FC7\u6EE4\u5E7F\u64AD";
        title1.style.fontSize = "16px";
        title1.style.marginBottom = "5px";
        this.manager.target.appendChild(title1);
        const description = document.createElement("p");
        description.textContent = "\u60A8\u53EF\u4EE5\u5728\u8FD9\u91CC\u7BA1\u7406\u5E7F\u64AD\u7684\u9ED1\u540D\u5355\u3002";
        description.style.cursor = "help";
        description.title = `\u5E7F\u64AD\u683C\u5F0F\u5982\u4E0B\uFF1A
\u6D88\u606F\u7C7B\u578B(session="",uuid="",name="",content="")`;
        description.style.fontSize = "12px";
        this.manager.target.appendChild(description);
        const description2 = document.createElement("p");
        description2.textContent = "\u5982\u679C\u6D88\u606F\u7684\u5185\u5BB9\u5339\u914D\u4EFB\u4F55\u4E00\u4E2A\u6B63\u5219\u8868\u8FBE\u5F0F\uFF0C\u5B83\u5C06\u4E0D\u4F1A\u88AB Scratch \u5904\u7406\u3002";
        description2.style.fontSize = "12px";
        description2.style.marginBottom = "10px";
        this.manager.target.appendChild(description2);
        const scrollable = createScrollable();
        const list = document.createElement("ul");
        if (state_default.mmo.broadcastBlackList.length === 0) {
          const noResultsItem = document.createElement("li");
          noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
          noResultsItem.className = "no-results";
          noResultsItem.style.display = "flex";
          noResultsItem.style.justifyContent = "center";
          noResultsItem.style.alignItems = "center";
          noResultsItem.style.width = "100%";
          noResultsItem.style.height = "100%";
          noResultsItem.style.color = "#999";
          list.appendChild(noResultsItem);
        } else {
          state_default.mmo.broadcastBlackList.forEach((regex, index) => {
            const listItem = document.createElement("li");
            listItem.style.display = "flex";
            listItem.style.alignItems = "center";
            listItem.style.justifyContent = "space-between";
            listItem.style.padding = "5px 0";
            const regexSpan = document.createElement("span");
            regexSpan.textContent = regex.toString();
            regexSpan.style.flexGrow = "1";
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "\u274C";
            deleteBtn.title = "\u5220\u9664";
            deleteBtn.style.marginLeft = "10px";
            deleteBtn.addEventListener("click", () => {
              state_default.mmo.broadcastBlackList.splice(index, 1);
              this.manager.requestUpdate();
            });
            listItem.appendChild(regexSpan);
            listItem.appendChild(deleteBtn);
            list.appendChild(listItem);
          });
        }
        scrollable.appendChild(list);
        this.manager.target.appendChild(scrollable);
        const flexInputContainer = document.createElement("div");
        flexInputContainer.style.display = "flex";
        const regexBefore = document.createElement("span");
        regexBefore.textContent = "/";
        regexBefore.style.marginRight = "5px";
        flexInputContainer.appendChild(regexBefore);
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "\u6DFB\u52A0\u65B0\u7684\u6B63\u5219\u8868\u8FBE\u5F0F...";
        input.style.flexGrow = "1";
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            try {
              const newRegex = new RegExp(input.value, "g");
              state_default.mmo.broadcastBlackList.push(newRegex);
              this.inputing = true;
              this.manager.requestUpdate();
            } catch {
              input.animate([{ color: "red" }, { color: "" }], {
                duration: 300
              });
            }
          }
        });
        if (this.inputing) {
          this.inputing = false;
          input.select();
        }
        flexInputContainer.appendChild(input);
        const regexAfter = document.createElement("span");
        regexAfter.textContent = "/g";
        regexAfter.style.marginLeft = "5px";
        flexInputContainer.appendChild(regexAfter);
        this.manager.target.appendChild(flexInputContainer);
        const title2 = document.createElement("p");
        title2.textContent = "\u53D1\u9001\u5E7F\u64AD";
        this.manager.target.appendChild(title2);
        const description3 = document.createElement("p");
        description3.textContent = "\u60A8\u53EF\u4EE5\u5728\u8FD9\u91CC\u53D1\u9001\u5E7F\u64AD\u3002";
        description3.style.cursor = "help";
        description3.title = `\u5E7F\u64AD\u683C\u5F0F\u5982\u4E0B\uFF1A
\u6D88\u606F\u7C7B\u578B("")
\u5982\u679C\u6CA1\u6709\u5185\u5BB9\uFF0C\u5219 content \u53EF\u4EE5\u7701\u7565\uFF1A
\u6D88\u606F\u7C7B\u578B()`;
        description3.style.fontSize = "12px";
        this.manager.target.appendChild(description3);
        const input2 = document.createElement("input");
        input2.type = "text";
        input2.style.width = "100%";
        input2.placeholder = "\u5E7F\u64AD\u5185\u5BB9...";
        input2.style.display = "block";
        input2.style.marginTop = "10px";
        input2.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            let match;
            if (match = input2.value.match(/(.*?)\("(.*?)"\)/)) {
              try {
                this.extension.broadcastMsg({
                  type: match[1],
                  content: JSON.parse('"' + match[2] + '"')
                });
                input2.value = "";
              } catch {
                input2.animate([{ color: "red" }, { color: "" }], {
                  duration: 300
                });
              }
            } else if (match = input2.value.match(/(.*?)\(\)/)) {
              try {
                this.extension.broadcastMsg({
                  type: match[1],
                  content: ""
                });
                input2.value = "";
              } catch {
                input2.animate([{ color: "red" }, { color: "" }], {
                  duration: 300
                });
              }
            } else {
              input2.animate([{ color: "red" }, { color: "" }], {
                duration: 300
              });
            }
          }
        });
        this.manager.target.appendChild(input2);
      } else {
        const p = document.createElement("p");
        p.textContent = "\u73B0\u5728\u6CA1\u6709\u52A0\u5165\u4EFB\u4F55\u623F\u95F4\u3002\u8BF7\u5728\u52A0\u5165\u623F\u95F4\u540E\u91CD\u65B0\u6253\u5F00\u6B64\u9875\u9762\u3002";
        this.manager.target.appendChild(p);
      }
    }
    dispose() {
    }
  };

  // src/overlay/result.js
  var ResultOverlay = class {
    constructor(manager, isSuccess, message) {
      this.manager = manager;
      this.isSuccess = isSuccess;
      this.message = message;
      setTimeout(() => {
        this.manager.removeOverlay(this);
      }, 3e3);
    }
    render() {
      const target = this.manager.target;
      const div = document.createElement("div");
      div.textContent = this.message;
      div.style.width = "100%";
      div.style.backgroundColor = this.isSuccess ? "green" : "red";
      div.style.color = "white";
      div.style.textAlign = "center";
      div.style.padding = "5px";
      div.style.fontSize = "12px";
      div.style.boxSizing = "border-box";
      div.animate(
        [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }],
        {
          duration: 300,
          easing: "ease-in-out"
        }
      );
      div.style.position = "relative";
      div.style.zIndex = "-1";
      target.appendChild(div);
    }
    dispose() {
    }
  };

  // src/base/monaco.js
  addStyle(
    new URL(
      "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/editor/editor.main.css"
    )
  );
  window.MonacoEnvironment = {
    getWorkerUrl(fileName) {
      if (fileName === "workerMain.js") {
        return `data:text/javascript;base64,${btoa(
          `(function(fetch){globalThis.fetch=function(url,...args){return fetch.call(this,'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/base/worker/'+url,...args);};})(globalThis.fetch);importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/base/worker/workerMain.js');`
        )}`;
      }
    }
  };
  var Monaco = import("https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/+esm");

  // src/scene/script.js
  var ScriptScene = class {
    static title = "\u9AD8\u7EA7";
    constructor(manager) {
      this.manager = manager;
      this.Monaco = null;
      Monaco.then((v) => {
        this.Monaco = v;
        this.manager.requestUpdate();
      });
      this.editor = null;
      this.overlay = null;
    }
    run(code) {
      const engine = {
        async vm() {
          const v = await vm;
          return new VMAPI(v);
        },
        get ccwdata() {
          return globalThis.ccwdata;
        }
      };
      return new async function() {
      }.constructor("engine", code)(engine);
    }
    render() {
      if (!this.Monaco) {
        const loading = document.createElement("strong");
        loading.style.color = "#999";
        loading.textContent = "\u52A0\u8F7D\u4E2D...";
        loading.style.display = "block";
        loading.style.textAlign = "center";
        this.manager.target.appendChild(loading);
      } else {
        if (this.editor) this.editor.dispose();
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.alignItems = "center";
        container.style.padding = "10px";
        const description = document.createElement("p");
        description.textContent = "\u4F60\u53EF\u4EE5\u6307\u5B9A\u4E00\u4E2A\u81EA\u5B9A\u4E49\u811A\u672C\u7528\u4E8E\u8FDB\u884C\u81EA\u52A8\u5316\u64CD\u4F5C\u3002\u53EF\u4F7F\u7528\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u811A\u672C\u3002";
        description.style.marginBottom = "10px";
        container.appendChild(description);
        const editor = document.createElement("div");
        editor.style.width = "100%";
        editor.style.height = "300px";
        editor.style.marginBottom = "10px";
        const editorValue = window.localStorage.getItem("__csense-storaged-script") ?? `// \u8FD9\u662F CSense Scripting API \u7684\u4F7F\u7528\u793A\u4F8B\u3002
const vm = await engine.vm()
const target = vm.sprite('Stage').clones[0]
target.var('\u6211\u7684\u53D8\u91CF').set('\u4F60\u597D').watch(function (before, after) {
  return '\u4F60\u597D\uFF0C' + after
}) // .freezing = true
`;
        this.editor = this.Monaco.editor.create(editor, {
          value: editorValue,
          automaticLayout: true,
          language: "javascript",
          tabSize: 2,
          insertSpaces: true
        });
        this.editor.addAction({
          id: "csense.execute",
          label: `\u8FD0\u884C\u811A\u672C`,
          contextMenuGroupId: "csense",
          run: () => {
            const v = this.run(this.editor.getValue());
            this.overlay = new ResultOverlay(this.manager, true, "\u811A\u672C\u5DF2\u8FD0\u884C\u3002");
            this.manager.addOverlay(this.overlay);
            v.then(
              () => {
              },
              (err) => {
                console.error(err);
                if (this.overlay) {
                  this.overlay.isSuccess = false;
                  this.overlay.message = "\u53D1\u751F\u9519\u8BEF\u3002\u8BF7\u68C0\u67E5 DevTools \u63A7\u5236\u53F0\u3002";
                  this.manager.requestUpdate();
                }
              }
            );
          }
        });
        this.editor.onDidChangeModelContent(() => {
          window.localStorage.setItem(
            "__csense-storaged-script",
            this.editor.getValue()
          );
        });
        container.appendChild(editor);
        this.manager.target.appendChild(container);
      }
    }
    dispose() {
      this.editor.dispose();
      this.manager.removeOverlay(this.overlay);
      this.overlay = null;
    }
  };

  // src/scene/about.js
  var AboutScene = class {
    static title = "\u5173\u4E8E";
    constructor(manager) {
      this.manager = manager;
    }
    pSmall(message) {
      const p = document.createElement("p");
      p.textContent = message;
      p.style.textAlign = "center";
      p.style.fontSize = "small";
      return p;
    }
    render() {
      const scrollable = createScrollable();
      const container = document.createElement("div");
      const logo = document.createElement("img");
      logo.src = logo_default;
      logo.alt = "CSense";
      logo.style.display = "block";
      logo.style.margin = "0 auto";
      logo.style.width = "120px";
      logo.style.height = "120px";
      logo.style.marginTop = "30px";
      logo.style.marginBottom = "20px";
      container.appendChild(logo);
      const description = document.createElement("p");
      description.textContent = "\u4E00\u4E2A CCW \u5B89\u5168\u5BA1\u8BA1\u5DE5\u5177\u3002";
      description.style.textAlign = "center";
      description.style.fontWeight = "bold";
      description.style.fontSize = "small";
      container.appendChild(description);
      container.appendChild(this.pSmall("\u6B64\u5DE5\u5177\u57FA\u4E8E AGPL-3.0 \u534F\u8BAE\u53D1\u5E03\u3002"));
      container.appendChild(
        this.pSmall(
          "\u4F7F\u7528\u6B64\u5DE5\u5177\u5373\u4EE3\u8868\u60A8\u613F\u610F\u4E3A\u60A8\u7684\u6240\u6709\u884C\u4E3A\u8D1F\u5168\u90E8\u8D23\u4EFB\uFF0C\u4E0E\u6B64\u5DE5\u5177\u7684\u5F00\u53D1\u8005\u65E0\u5173\u3002"
        )
      );
      container.appendChild(
        this.pSmall(
          "\u5728\u9075\u5FAA\u5F00\u6E90\u534F\u8BAE\u7684\u524D\u63D0\u4E0B\uFF0C\u60A8\u53EF\u4EE5\u5BF9\u6B64\u5DE5\u5177\u8FDB\u884C\u81EA\u7531\u4FEE\u6539\u3001\u5206\u53D1\u3001\u4E8C\u6B21\u521B\u4F5C\u3002"
        )
      );
      container.appendChild(this.pSmall("\u8BF7\u52FF\u5C06\u6B64\u5DE5\u5177\u7528\u4E8E\u975E\u6CD5\u7528\u9014\u3002"));
      container.appendChild(
        this.pSmall(
          "\u6B64\u5DE5\u5177\u7684\u6E90\u4EE3\u7801\u4F4D\u4E8E https://github.com/csense-rev/csense-rev\u3002"
        )
      );
      scrollable.appendChild(container);
      this.manager.target.appendChild(scrollable);
    }
    dispose() {
    }
  };

  // src/scene/ccwdata.js
  var CCWDataScene = class {
    static title = "\u4E91\u6570\u636E\u7BA1\u7406";
    constructor(manager, extension) {
      this.manager = manager;
      this.extension = extension;
      this.selected = "project";
      this.disposed = false;
      this.lastFocused = null;
      this.noResultsItem = null;
      this.inputs = {};
      const animationFrame = () => {
        const db = state_default.ccwdata[this.selected];
        for (const [name, value] of db.entries()) {
          if (!this.inputs[name]) {
            const v = this.createListElement(this.selected, name);
            this.inputs[name] = v[1];
            this.manager.target.querySelector("ul").appendChild(v[2]);
            if (this.noResultsItem) {
              this.noResultsItem.remove();
              this.noResultsItem = null;
            }
          } else {
            if (this.inputs[name].value !== value && this.inputs[name] !== this.lastFocused) {
              this.inputs[name].animate([{ color: "red" }, { color: "" }], {
                duration: 300
              });
              this.inputs[name].value = value;
            }
          }
        }
        if (!this.disposed) requestAnimationFrame(animationFrame);
      };
      requestAnimationFrame(animationFrame);
    }
    createListElement(type, name) {
      const value = state_default.ccwdata[type].get(name);
      const listItem = document.createElement("li");
      listItem.style.display = "flex";
      listItem.style.alignItems = "center";
      listItem.style.marginBottom = "5px";
      listItem.style.padding = "5px";
      listItem.style.border = "1px solid #ddd";
      listItem.style.borderRadius = "4px";
      listItem.style.backgroundColor = "#f9f9f9";
      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      nameSpan.style.flexGrow = "1";
      nameSpan.style.marginRight = "10px";
      nameSpan.className = "item-name";
      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.style.fontFamily = "monospace";
      valueInput.value = Array.isArray(value) ? JSON.stringify(value) : value;
      valueInput.style.flexGrow = "2";
      valueInput.style.marginRight = "10px";
      valueInput.addEventListener("change", () => {
        if (type === "project") {
          this.extension._setValueToProject(name, valueInput.value);
        } else {
          this.extension._setValueToUser(name, valueInput.value);
        }
      });
      valueInput.addEventListener("focus", () => {
        this.lastFocused = valueInput;
      });
      valueInput.addEventListener("blur", () => {
        this.lastFocused = null;
      });
      listItem.appendChild(nameSpan);
      listItem.appendChild(valueInput);
      return [name, valueInput, listItem];
    }
    render() {
      const tabContainer = document.createElement("div");
      tabContainer.style.display = "flex";
      tabContainer.style.justifyContent = "center";
      const projectTab = document.createElement("button");
      projectTab.textContent = "\u4F5C\u54C1";
      projectTab.style.flexGrow = "1";
      projectTab.style.padding = "10px";
      projectTab.style.border = "1px solid #ddd";
      projectTab.style.borderBottom = this.selected === "project" ? "none" : "1px solid #ddd";
      projectTab.style.backgroundColor = this.selected === "project" ? "#f9f9f9" : "#fff";
      projectTab.style.cursor = "pointer";
      projectTab.addEventListener("click", () => {
        this.selected = "project";
        this.manager.requestUpdate();
      });
      const userTab = document.createElement("button");
      userTab.textContent = "\u7528\u6237";
      userTab.style.flexGrow = "1";
      userTab.style.padding = "10px";
      userTab.style.border = "1px solid #ddd";
      userTab.style.borderBottom = this.selected === "user" ? "none" : "1px solid #ddd";
      userTab.style.backgroundColor = this.selected === "user" ? "#f9f9f9" : "#fff";
      userTab.style.cursor = "pointer";
      userTab.addEventListener("click", () => {
        this.selected = "user";
        this.manager.requestUpdate();
      });
      tabContainer.appendChild(projectTab);
      tabContainer.appendChild(userTab);
      this.manager.target.appendChild(tabContainer);
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "\u641C\u7D22\u53D8\u91CF...";
      searchInput.style.padding = "5px";
      searchInput.style.border = "1px solid #ddd";
      searchInput.style.width = "100%";
      searchInput.style.boxSizing = "border-box";
      searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        const items = variableList.children;
        let hasResults = false;
        Array.from(items).forEach((item) => {
          if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
            item.style.display = "flex";
            hasResults = true;
          } else if (item.className !== "no-results") {
            item.style.display = "none";
          }
        });
        if (!hasResults) {
          if (!variableList.querySelector(".no-results")) {
            const noResultsItem = document.createElement("li");
            noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
            noResultsItem.className = "no-results";
            noResultsItem.style.display = "flex";
            noResultsItem.style.justifyContent = "center";
            noResultsItem.style.alignItems = "center";
            noResultsItem.style.width = "100%";
            noResultsItem.style.height = "100%";
            noResultsItem.style.color = "#999";
            variableList.appendChild(noResultsItem);
          }
        } else {
          const noResultsItem = variableList.querySelector(".no-results");
          if (noResultsItem) {
            variableList.removeChild(noResultsItem);
          }
        }
      });
      this.manager.target.appendChild(searchInput);
      const scrollable = createScrollable();
      const db = state_default.ccwdata[this.selected];
      const variableList = document.createElement("ul");
      variableList.style.padding = "0";
      variableList.style.margin = "0";
      variableList.style.listStyleType = "none";
      variableList.style.marginTop = "10px";
      if (db.keys().length === 0) {
        const noResultsItem = document.createElement("li");
        noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
        noResultsItem.className = "no-results";
        noResultsItem.style.display = "flex";
        noResultsItem.style.justifyContent = "center";
        noResultsItem.style.alignItems = "center";
        noResultsItem.style.width = "100%";
        noResultsItem.style.height = "100%";
        noResultsItem.style.color = "#999";
        this.noResultsItem = noResultsItem;
        variableList.appendChild(noResultsItem);
      } else {
        this.inputs = Object.fromEntries(
          db.keys().map((name) => {
            const v = this.createListElement(this.selected, name);
            variableList.appendChild(v[2]);
            return [name, v[1]];
          })
        );
      }
      scrollable.appendChild(variableList);
      this.manager.target.appendChild(scrollable);
    }
    dispose() {
      this.disposed = true;
    }
  };

  // package.json
  var version = "0.1.5";

  // src/sandbox/bridge.ts
  var Bridge = class _Bridge {
    send_fn;
    send_trigger;
    recv_trigger;
    // polyfill Source: https://stackoverflow.com/a/2117523
    static uuid() {
      return crypto.randomUUID instanceof Function ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(
        /[018]/g,
        (c) => (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
      );
    }
    send(method, args) {
      return new Promise((resolve, reject) => {
        const id = _Bridge.uuid();
        this.send_fn({
          type: "message",
          id,
          request: {
            method,
            args
          }
        });
        this.send_trigger.set(id, {
          resolve(val) {
            resolve(val);
          },
          reject(err) {
            reject(err);
          }
        });
      });
    }
    recv(method, trigger) {
      this.recv_trigger.set(method, trigger);
    }
    constructor(send_fn, eventListener) {
      ;
      [this.send_fn, this.send_trigger, this.recv_trigger] = [
        send_fn,
        /* @__PURE__ */ new Map(),
        /* @__PURE__ */ new Map()
      ];
      eventListener((ev) => {
        if (ev.data.type == "result") {
          const pm = this.send_trigger.get(ev.data.id);
          if (pm !== void 0) {
            switch (ev.data.result.status) {
              case "resolve": {
                pm.resolve(ev.data.result);
                this.send_trigger.delete(ev.data.id);
                break;
              }
              case "reject": {
                pm.reject(ev.data.result.value);
                this.send_trigger.delete(ev.data.id);
                break;
              }
            }
          }
        } else {
          const trigger = this.recv_trigger.get(ev.data.request.method);
          if (trigger !== void 0) {
            try {
              const res = trigger(ev.data.request.args);
              if (res instanceof Promise) {
                res.then(
                  (res2) => {
                    this.send_fn({
                      type: "result",
                      id: ev.data.id,
                      result: {
                        status: "resolve",
                        value: res2
                      }
                    });
                  },
                  (err) => {
                    this.send_fn({
                      type: "result",
                      id: ev.data.id,
                      result: {
                        status: "reject",
                        value: err
                      }
                    });
                  }
                );
              } else {
                this.send_fn({
                  type: "result",
                  id: ev.data.id,
                  result: {
                    status: "resolve",
                    value: res
                  }
                });
              }
            } catch (err) {
              this.send_fn({
                type: "result",
                id: ev.data.id,
                result: {
                  status: "reject",
                  value: err
                }
              });
            }
          } else {
            this.send_fn({
              type: "result",
              id: ev.data.id,
              result: {
                status: "reject",
                value: `${ev.data.request.method} is not defined`
              }
            });
          }
        }
      });
    }
  };

  // src/sandbox/sandbox.ts
  var Sandbox = class {
    bridge;
    scope;
    url;
    async evaluate(fn, ...args) {
      const result = await this.bridge.send("eval", [
        fn.toString(),
        args
      ]);
      if (result.status == "resolve") return result.value;
      throw result.value;
    }
    dispose() {
      this.scope.terminate();
      URL.revokeObjectURL(this.url);
    }
    regist(method, trigger) {
      this.bridge.recv(method, trigger);
    }
    constructor(prepatch) {
      this.scope = new Worker(
        this.url = URL.createObjectURL(
          new Blob(
            [
              `
          ;((prepatch) => {
            var Bridge = ${Bridge}
            const post = globalThis.postMessage
            const bridge = new Bridge(post.bind(this.scope), ev =>
              globalThis.addEventListener('message', ev)
            )
            prepatch.call(globalThis, globalThis, bridge)
            bridge.recv('eval', (val) => {
              const [code, args] = val
              const ret = new Function('return ' + code)()
              if (ret instanceof Function) return ret.apply(globalThis, args)
              return ret
            })
          })(${prepatch ? prepatch.toString() : ""})
        `
            ],
            { type: "text/javascript" }
          )
        )
      );
      this.bridge = new Bridge(
        this.scope.postMessage.bind(this.scope),
        (ev) => this.scope.addEventListener("message", ev)
      );
    }
  };

  // src/sandbox/index.js
  async function getExtensionInfo(code, timeout = 10) {
    const sandbox = new Sandbox((global, bridge) => {
      class Color {
        /**
         * @typedef {object} RGBObject - An object representing a color in RGB format.
         * @property {number} r - the red component, in the range [0, 255].
         * @property {number} g - the green component, in the range [0, 255].
         * @property {number} b - the blue component, in the range [0, 255].
         */
        /**
         * @typedef {object} HSVObject - An object representing a color in HSV format.
         * @property {number} h - hue, in the range [0-359).
         * @property {number} s - saturation, in the range [0,1].
         * @property {number} v - value, in the range [0,1].
         */
        /** @type {RGBObject} */
        static get RGB_BLACK() {
          return { r: 0, g: 0, b: 0 };
        }
        /** @type {RGBObject} */
        static get RGB_WHITE() {
          return { r: 255, g: 255, b: 255 };
        }
        /**
         * Convert a Scratch decimal color to a hex string, #RRGGBB.
         * @param {number} decimal RGB color as a decimal.
         * @return {string} RGB color as #RRGGBB hex string.
         */
        static decimalToHex(decimal) {
          if (decimal < 0) {
            decimal += 16777215 + 1;
          }
          let hex = Number(decimal).toString(16);
          hex = `#${"000000".substr(0, 6 - hex.length)}${hex}`;
          return hex;
        }
        /**
         * Convert a Scratch decimal color to an RGB color object.
         * @param {number} decimal RGB color as decimal.
         * @return {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
         */
        static decimalToRgb(decimal) {
          const a = decimal >> 24 & 255;
          const r = decimal >> 16 & 255;
          const g = decimal >> 8 & 255;
          const b = decimal & 255;
          return { r, g, b, a: a > 0 ? a : 255 };
        }
        /**
         * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
         * @param {!string} hex Hex representation of the color.
         * @return {RGBObject} null on failure, or rgb: {r: red [0,255], g: green [0,255], b: blue [0,255]}.
         */
        static hexToRgb(hex) {
          if (hex.startsWith("#")) {
            hex = hex.substring(1);
          }
          const parsed = parseInt(hex, 16);
          if (isNaN(parsed)) {
            return null;
          }
          if (hex.length === 6) {
            return {
              r: parsed >> 16 & 255,
              g: parsed >> 8 & 255,
              b: parsed & 255
            };
          } else if (hex.length === 3) {
            const r = parsed >> 8 & 15;
            const g = parsed >> 4 & 15;
            const b = parsed & 15;
            return {
              r: r << 4 | r,
              g: g << 4 | g,
              b: b << 4 | b
            };
          }
          return null;
        }
        /**
         * Convert an RGB color object to a hex color.
         * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
         * @return {!string} Hex representation of the color.
         */
        static rgbToHex(rgb) {
          return Color.decimalToHex(Color.rgbToDecimal(rgb));
        }
        /**
         * Convert an RGB color object to a Scratch decimal color.
         * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
         * @return {!number} Number representing the color.
         */
        static rgbToDecimal(rgb) {
          return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
        }
        /**
         * Convert a hex color (e.g., F00, #03F, #0033FF) to a decimal color number.
         * @param {!string} hex Hex representation of the color.
         * @return {!number} Number representing the color.
         */
        static hexToDecimal(hex) {
          return Color.rgbToDecimal(Color.hexToRgb(hex));
        }
        /**
         * Convert an HSV color to RGB format.
         * @param {HSVObject} hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
         * @return {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
         */
        static hsvToRgb(hsv) {
          let h = hsv.h % 360;
          if (h < 0) h += 360;
          const s = Math.max(0, Math.min(hsv.s, 1));
          const v = Math.max(0, Math.min(hsv.v, 1));
          const i = Math.floor(h / 60);
          const f = h / 60 - i;
          const p = v * (1 - s);
          const q = v * (1 - s * f);
          const t = v * (1 - s * (1 - f));
          let r;
          let g;
          let b;
          switch (i) {
            default:
            case 0:
              r = v;
              g = t;
              b = p;
              break;
            case 1:
              r = q;
              g = v;
              b = p;
              break;
            case 2:
              r = p;
              g = v;
              b = t;
              break;
            case 3:
              r = p;
              g = q;
              b = v;
              break;
            case 4:
              r = t;
              g = p;
              b = v;
              break;
            case 5:
              r = v;
              g = p;
              b = q;
              break;
          }
          return {
            r: Math.floor(r * 255),
            g: Math.floor(g * 255),
            b: Math.floor(b * 255)
          };
        }
        /**
         * Convert an RGB color to HSV format.
         * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
         * @return {HSVObject} hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
         */
        static rgbToHsv(rgb) {
          const r = rgb.r / 255;
          const g = rgb.g / 255;
          const b = rgb.b / 255;
          const x = Math.min(Math.min(r, g), b);
          const v = Math.max(Math.max(r, g), b);
          let h = 0;
          let s = 0;
          if (x !== v) {
            const f = r === x ? g - b : g === x ? b - r : r - g;
            const i = r === x ? 3 : g === x ? 5 : 1;
            h = (i - f / (v - x)) * 60 % 360;
            s = (v - x) / v;
          }
          return { h, s, v };
        }
        /**
         * Linear interpolation between rgb0 and rgb1.
         * @param {RGBObject} rgb0 - the color corresponding to fraction1 <= 0.
         * @param {RGBObject} rgb1 - the color corresponding to fraction1 >= 1.
         * @param {number} fraction1 - the interpolation parameter. If this is 0.5, for example, mix the two colors equally.
         * @return {RGBObject} the interpolated color.
         */
        static mixRgb(rgb0, rgb1, fraction1) {
          if (fraction1 <= 0) return rgb0;
          if (fraction1 >= 1) return rgb1;
          const fraction0 = 1 - fraction1;
          return {
            r: fraction0 * rgb0.r + fraction1 * rgb1.r,
            g: fraction0 * rgb0.g + fraction1 * rgb1.g,
            b: fraction0 * rgb0.b + fraction1 * rgb1.b
          };
        }
      }
      const isNotActuallyZero = (val) => {
        if (typeof val !== "string") return false;
        for (let i = 0; i < val.length; i++) {
          const code2 = val.charCodeAt(i);
          if (code2 === 48 || code2 === 9) {
            return false;
          }
        }
        return true;
      };
      class Cast {
        /**
         * Scratch cast to number.
         * Treats NaN as 0.
         * In Scratch 2.0, this is captured by `interp.numArg.`
         * @param {*} value Value to cast to number.
         * @return {number} The Scratch-casted number value.
         */
        static toNumber(value) {
          if (typeof value === "number") {
            if (Number.isNaN(value)) {
              return 0;
            }
            return value;
          }
          const n = Number(value);
          if (Number.isNaN(n)) {
            return 0;
          }
          return n;
        }
        /**
         * Scratch cast to boolean.
         * In Scratch 2.0, this is captured by `interp.boolArg.`
         * Treats some string values differently from JavaScript.
         * @param {*} value Value to cast to boolean.
         * @return {boolean} The Scratch-casted boolean value.
         */
        static toBoolean(value) {
          if (typeof value === "boolean") {
            return value;
          }
          if (typeof value === "string") {
            if (value === "" || value === "0" || value.toLowerCase() === "false") {
              return false;
            }
            return true;
          }
          return Boolean(value);
        }
        /**
         * Scratch cast to string.
         * @param {*} value Value to cast to string.
         * @return {string} The Scratch-casted string value.
         */
        static toString(value) {
          return String(value);
        }
        /**
         * Cast any Scratch argument to an RGB color array to be used for the renderer.
         * @param {*} value Value to convert to RGB color array.
         * @return {Array.<number>} [r,g,b], values between 0-255.
         */
        static toRgbColorList(value) {
          const color = Cast.toRgbColorObject(value);
          return [color.r, color.g, color.b];
        }
        /**
         * Cast any Scratch argument to an RGB color object to be used for the renderer.
         * @param {*} value Value to convert to RGB color object.
         * @return {RGBOject} [r,g,b], values between 0-255.
         */
        static toRgbColorObject(value) {
          let color;
          if (typeof value === "string" && value.substring(0, 1) === "#") {
            color = Color.hexToRgb(value);
            if (!color) color = { r: 0, g: 0, b: 0, a: 255 };
          } else {
            color = Color.decimalToRgb(Cast.toNumber(value));
          }
          return color;
        }
        /**
         * Determine if a Scratch argument is a white space string (or null / empty).
         * @param {*} val value to check.
         * @return {boolean} True if the argument is all white spaces or null / empty.
         */
        static isWhiteSpace(val) {
          return val === null || typeof val === "string" && val.trim().length === 0;
        }
        /**
         * Compare two values, using Scratch cast, case-insensitive string compare, etc.
         * In Scratch 2.0, this is captured by `interp.compare.`
         * @param {*} v1 First value to compare.
         * @param {*} v2 Second value to compare.
         * @returns {number} Negative number if v1 < v2; 0 if equal; positive otherwise.
         */
        static compare(v1, v2) {
          let n1 = Number(v1);
          let n2 = Number(v2);
          if (n1 === 0 && isNotActuallyZero(v1)) {
            n1 = NaN;
          } else if (n2 === 0 && isNotActuallyZero(v2)) {
            n2 = NaN;
          }
          if (isNaN(n1) || isNaN(n2)) {
            const s1 = String(v1).toLowerCase();
            const s2 = String(v2).toLowerCase();
            if (s1 < s2) {
              return -1;
            } else if (s1 > s2) {
              return 1;
            }
            return 0;
          }
          if (n1 === Infinity && n2 === Infinity || n1 === -Infinity && n2 === -Infinity) {
            return 0;
          }
          return n1 - n2;
        }
        /**
         * Determine if a Scratch argument number represents a round integer.
         * @param {*} val Value to check.
         * @return {boolean} True if number looks like an integer.
         */
        static isInt(val) {
          if (typeof val === "number") {
            if (isNaN(val)) {
              return true;
            }
            return val === Math.floor(val);
          } else if (typeof val === "boolean") {
            return true;
          } else if (typeof val === "string") {
            return val.indexOf(".") < 0;
          }
          return false;
        }
        static get LIST_INVALID() {
          return "INVALID";
        }
        static get LIST_ALL() {
          return "ALL";
        }
        /**
         * Compute a 1-based index into a list, based on a Scratch argument.
         * Two special cases may be returned:
         * LIST_ALL: if the block is referring to all of the items in the list.
         * LIST_INVALID: if the index was invalid in any way.
         * @param {*} index Scratch arg, including 1-based numbers or special cases.
         * @param {number} length Length of the list.
         * @param {boolean} acceptAll Whether it should accept "all" or not.
         * @return {(number|string)} 1-based index for list, LIST_ALL, or LIST_INVALID.
         */
        static toListIndex(index, length, acceptAll) {
          if (typeof index !== "number") {
            if (index === "all") {
              return acceptAll ? Cast.LIST_ALL : Cast.LIST_INVALID;
            }
            if (index === "last") {
              if (length > 0) {
                return length;
              }
              return Cast.LIST_INVALID;
            } else if (index === "random" || index === "any") {
              if (length > 0) {
                return 1 + Math.floor(Math.random() * length);
              }
              return Cast.LIST_INVALID;
            }
          }
          index = Math.floor(Cast.toNumber(index));
          if (index < 1 || index > length) {
            return Cast.LIST_INVALID;
          }
          return index;
        }
      }
      delete global.fetch;
      delete global.XMLHttpRequest;
      delete global.WebSocket;
      delete global.Worker;
      delete global.importScripts;
      global.window = global;
      global.console = {
        log: () => {
        },
        info: () => {
        },
        warn: () => {
        },
        error: () => {
        },
        debug: () => {
        },
        trace: () => {
        },
        dir: () => {
        },
        time: () => {
        },
        timeLog: () => {
        },
        timeStamp: () => {
        },
        timeEnd: () => {
        },
        assert: () => {
        },
        clear: () => {
        },
        count: () => {
        },
        countReset: () => {
        },
        group: () => {
        },
        groupEnd: () => {
        },
        table: () => {
        },
        profile: () => {
        },
        profileEnd: () => {
        }
      };
      global.document = {
        createElement: () => ({
          style: {},
          setAttribute: () => {
          },
          getContext: () => ({
            fillRect: () => {
            },
            drawImage: () => {
            },
            getImageData: () => ({
              data: []
            }),
            putImageData: () => {
            },
            createImageData: () => [],
            setTransform: () => {
            },
            drawFocusIfNeeded: () => {
            },
            resetTransform: () => {
            }
          }),
          appendChild: () => {
          },
          addEventListener: () => {
          },
          removeEventListener: () => {
          }
        }),
        addEventListener: () => {
        },
        removeEventListener: () => {
        },
        body: {
          appendChild: () => {
          }
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        readyState: "complete",
        documentElement: {
          style: {}
        }
      };
      let translation = {};
      const dummyTranslate = Object.assign(
        (message, args) => {
          if (message && typeof message === "object") {
            return translation?.["zh-cn"]?.[message?.id] ?? translation?.["en"]?.[message?.id] ?? message?.default;
          } else if (typeof message === "string") {
            return translation?.["zh-cn"]?.[message] ?? translation?.["en"]?.[message] ?? message;
          }
          return null;
        },
        {
          setup(t) {
            if (t && typeof t === "object") {
              translation = t;
            }
          }
        }
      );
      const fakeVm = {
        getAllSprites() {
          return [];
        },
        getEditingTarget() {
          return null;
        },
        getRenderer() {
          return null;
        },
        getRuntime() {
          return fakeVm.runtime;
        },
        on() {
        },
        removeListener() {
        },
        emit() {
        },
        runtime: {
          getTargetById() {
            return null;
          },
          getAllTargets() {
            return [];
          },
          getFormatMessage: (obj) => {
            global.Scratch.translate.setup(obj);
            return global.Scratch.translate;
          }
        }
      };
      global.Scratch = {
        ArgumentType: {
          ANGLE: "angle",
          BOOLEAN: "Boolean",
          COLOR: "color",
          NUMBER: "number",
          STRING: "string",
          MATRIX: "matrix",
          NOTE: "note",
          IMAGE: "image",
          XIGUA_MATRIX: "xigua_matrix",
          XIGUA_WHITE_BOARD_NOTE: "xigua_white_board_note",
          CCW_HAT_PARAMETER: "ccw_hat_parameter",
          COSTUME: "costume",
          SOUND: "sound"
        },
        BlockType: {
          BOOLEAN: "Boolean",
          BUTTON: "button",
          LABEL: "label",
          COMMAND: "command",
          CONDITIONAL: "conditional",
          EVENT: "event",
          HAT: "hat",
          LOOP: "loop",
          REPORTER: "reporter",
          XML: "xml"
        },
        TargetType: {
          SPRITE: "sprite",
          STAGE: "stage"
        },
        extensions: {
          unsandboxed: true,
          register: function(ext) {
            global.extensionInstance = ext;
          }
        },
        Cast,
        Color,
        vm: fakeVm,
        runtime: fakeVm.runtime,
        renderer: null,
        translate: dummyTranslate
      };
      global.extensionInstance = null;
    });
    const timeoutPm = new Promise(
      (resolve) => setTimeout(() => {
        resolve({
          result: "error",
          error: "Timeout",
          info: null
        });
      }, timeout * 1e3)
    );
    let result = sandbox.evaluate(async (code2) => {
      try {
        const AsyncFunction = Object.getPrototypeOf(
          async function() {
          }
        ).constructor;
        const fn = new AsyncFunction(code2);
        await fn();
        if (globalThis.tempExt) {
          globalThis.extensionInstance = new globalThis.tempExt.Extension(
            globalThis.runtime
          );
        }
        return {
          result: "success",
          error: null,
          info: JSON.parse(JSON.stringify(globalThis.extensionInstance.getInfo()))
        };
      } catch (e) {
        return {
          result: "error",
          error: e instanceof Error ? e.stack : String(e),
          info: null
        };
      }
    }, code);
    return Promise.race([result, timeoutPm]).then((res) => {
      sandbox.dispose();
      return res;
    });
  }

  // src/scene/extensionEdit.js
  var ExtensionEditScene = class {
    static title = "\u7F16\u8F91\u6269\u5C55";
    /**
     *
     * @param {import('../base/scene.js').SceneManager} manager
     * @param {{ name: string, url: string, type: 'custom', newContent: string | null }} extension
     */
    constructor(manager, extension) {
      this.manager = manager;
      this.extension = extension;
      Monaco.then((v) => {
        this.Monaco = v;
        this.manager.requestUpdate();
      });
      this.editor = null;
    }
    async getExtensionInfo() {
      const extensionInfo = await getExtensionInfo(
        this.extension.newContent ?? ""
      );
      if (extensionInfo.result !== "success") {
        return extensionInfo;
      } else {
        const template = `// \u4EE3\u7801\u5E76\u4E0D\u76F4\u63A5\u53EF\u7528\uFF0C\u8BF7\u6839\u636E\u6269\u5C55\u5B9E\u9645\u529F\u80FD\u8FDB\u884C\u4FEE\u6539\u3002

;(function (Scratch, info) {
  'use strict'
  class Extension {
    getInfo() {
      return info
    }${(() => {
          const getDefaultDummy = (blockType) => {
            switch (blockType) {
              case "reporter":
                return "\n      return 0\n    ";
              case "Boolean":
                return "\n      return false\n    ";
              default:
                return "";
            }
          };
          try {
            const code = extensionInfo.info.blocks.map(
              (v) => `[${JSON.stringify(v.opcode ?? v.func)}] () {${getDefaultDummy(v.blockType)}}`
            );
            return code.length ? "\n    " + code.join("\n    ") : "";
          } catch {
            return "";
          }
        })()}
  }
  Scratch.extensions.register(new Extension())
})(Scratch, ${JSON.stringify(extensionInfo.info, null, 2)})`;
        return template.trim();
      }
    }
    render() {
      const target = this.manager.target;
      if (!this.Monaco) {
        const loading = document.createElement("strong");
        loading.style.color = "#999";
        loading.textContent = "\u52A0\u8F7D\u4E2D...";
        loading.style.display = "block";
        loading.style.textAlign = "center";
        target.appendChild(loading);
      } else {
        if (this.editor) this.editor.dispose();
        const editor = document.createElement("div");
        editor.style.width = "550px";
        editor.style.height = "300px";
        editor.style.marginBottom = "10px";
        target.appendChild(editor);
        this.editor = this.Monaco.editor.create(editor, {
          value: this.extension.newContent ?? "// \u6B63\u5728\u83B7\u53D6\u6269\u5C55\u5185\u5BB9...",
          automaticLayout: true,
          language: "javascript",
          tabSize: 2,
          insertSpaces: true
        });
        this.editor.onDidChangeModelContent(() => {
          this.extension.newContent = this.editor.getValue();
        });
        if (this.extension.newContent === null) {
          fetch(this.extension.url).then((r) => r.text()).then((text) => {
            this.extension.newContent = text;
            this.editor.setValue(text);
          }).catch(() => {
            this.editor.setValue(this.extension.newContent);
            this.extension.newContent = null;
          });
        }
        const toolbar = document.createElement("div");
        toolbar.style.display = "flex";
        toolbar.style.width = "100%";
        toolbar.style.height = "50px";
        if (this.extension.url.startsWith(
          "https://m.ccw.site/user_projects_assets/"
        )) {
          const loading = document.createElement("p");
          loading.style.color = "#999";
          loading.textContent = "\u6B63\u5728\u89E3\u6790\u6269\u5C55...";
          loading.style.display = "block";
          loading.style.textAlign = "center";
          toolbar.appendChild(loading);
          fetch(
            `https://bfs-web.ccw.site/extensions/${encodeURIComponent(this.extension.name)}`
          ).then((v) => v.json()).then((data) => {
            if (data.status !== 200) {
              loading.textContent = "\u89E3\u6790\u6269\u5C55\u5931\u8D25\u3002";
              return;
            }
            const body = data.body;
            const version2 = body.versions.find(
              (v) => v.assetUri === this.extension.url
            );
            if (!version2) {
              loading.textContent = "\u89E3\u6790\u6269\u5C55\u5931\u8D25\u3002";
              return;
            }
            const link = document.createElement("a");
            link.href = `https://assets.ccw.site/extensions/${body.eid}`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = `${body.name} (${version2.version})`;
            link.style.textDecoration = "none";
            link.style.color = "#999";
            link.style.marginRight = "10px";
            link.style.marginTop = "10px";
            link.style.marginLeft = "10px";
            loading.replaceWith(link);
            const useNoopButton = document.createElement("button");
            useNoopButton.textContent = "\u751F\u6210\u7A7A\u6269\u5C55";
            useNoopButton.title = "\u6839\u636E\u5B98\u65B9\u79EF\u6728\u9884\u89C8\u751F\u6210\u7A7A\u6269\u5C55 (\u53EF\u80FD\u51FA\u73B0\u95EE\u9898)\u3002\u53F3\u952E\u53EF\u4EE5\u4F7F\u7528\u6C99\u7BB1\u89E3\u6790\u3002";
            useNoopButton.style.marginBottom = "10px";
            useNoopButton.style.marginLeft = "10px";
            useNoopButton.style.padding = "10px 20px";
            useNoopButton.style.fontSize = "16px";
            useNoopButton.addEventListener("click", async () => {
              try {
                useNoopButton.disabled = true;
                useNoopButton.textContent = "\u8BF7\u7A0D\u7B49";
                const preview = version2.previews[0];
                const svg = await fetch(preview).then((r) => r.text());
                const parser = new DOMParser();
                const doc = parser.parseFromString(svg, "image/svg+xml");
                const opcode = `/**
${Array.from(
                  doc.querySelectorAll("g.blocklyDraggable")
                ).map((v) => {
                  const typeMap = {
                    "reporter boolean": "Scratch.BlockType.BOOLEAN",
                    "reporter round": "Scratch.BlockType.REPORTER",
                    "c-block": "Scratch.BlockType.CONDITIONAL"
                  };
                  return {
                    opcode: v.getAttribute("data-id"),
                    type: Object.entries(typeMap).find(
                      ([k]) => v.getAttribute("data-shapes").includes(k)
                    )?.[1] || "(\u672A\u77E5)"
                  };
                }).map((v) => {
                  return ` * @${v.opcode} \u7C7B\u578B ${v.type}`;
                })}
 */`;
                const res = await this.getExtensionInfo();
                if (typeof res !== "string") {
                  useNoopButton.textContent = "\u53D1\u751F\u9519\u8BEF";
                  useNoopButton.style.color = "#999";
                  useNoopButton.title = res.error;
                  return;
                }
                let code = opcode + "\n\n" + res;
                this.extension.newContent = code;
                this.editor.setValue(this.extension.newContent);
                useNoopButton.textContent = "\u751F\u6210\u7A7A\u6269\u5C55";
                useNoopButton.disabled = false;
              } catch (e) {
                useNoopButton.textContent = "\u53D1\u751F\u9519\u8BEF";
                useNoopButton.style.color = "#999";
                useNoopButton.title = e instanceof Error ? e.stack ?? e.message : String(e);
              }
            });
            link.after(useNoopButton);
            const marketButton = document.createElement("button");
            marketButton.textContent = "\u4F7F\u7528\u4F18\u5316\u7248";
            marketButton.title = "\u4F7F\u7528\u793E\u533A\u7EF4\u62A4\u7684\u4F18\u5316\u7248\u6269\u5C55\u3002\u6240\u6709\u6269\u5C55\u5747\u7ECF\u8FC7 CSense \u5B98\u65B9\u5BA1\u6838\u3002";
            marketButton.style.marginBottom = "10px";
            marketButton.style.marginLeft = "10px";
            marketButton.style.padding = "10px 20px";
            marketButton.style.fontSize = "16px";
            marketButton.addEventListener("click", async () => {
              marketButton.disabled = true;
              marketButton.textContent = "\u8BF7\u7A0D\u7B49";
              const ext = await fetch(
                `https://csense-rev.github.io/csense-marketplace/${body.eid}/${version2.version}.js`
              ).then((r) => {
                if (!r.ok) return null;
                return r.text();
              }).catch(() => null);
              if (!ext) {
                marketButton.textContent = "\u83B7\u53D6\u5931\u8D25";
                marketButton.style.color = "#999";
                marketButton.title = "\u793E\u533A\u5E02\u573A\u6682\u65E0\u6B64\u6269\u5C55\u3002\u8BF7\u8BBF\u95EE https://github.com/csense-rev/csense-marketplace \u8BF7\u6C42\u6B64\u6269\u5C55\u3002";
                return;
              }
              this.extension.newContent = ext;
              this.editor.setValue(this.extension.newContent);
              marketButton.textContent = "\u4F7F\u7528\u4F18\u5316\u7248";
              marketButton.disabled = false;
            });
            useNoopButton.after(marketButton);
            const space = document.createElement("div");
            space.style.flexGrow = "1";
            marketButton.after(space);
            const inspectButton = document.createElement("button");
            inspectButton.textContent = "\u{1F50E}";
            inspectButton.style.marginBottom = "10px";
            inspectButton.style.marginRight = "10px";
            inspectButton.style.padding = "5px";
            inspectButton.title = "\u67E5\u770B\u5B98\u65B9\u63D0\u4F9B\u7684\u79EF\u6728\u9884\u89C8\u3002";
            let floatDiv = null;
            let hideTimeout = null;
            const showPreview = (ev) => {
              const svgUrl = version2.previews[0];
              if (!svgUrl) return;
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
              }
              if (!floatDiv) {
                floatDiv = document.createElement("div");
                floatDiv.style.position = "fixed";
                const mouseX = ev.clientX;
                const mouseY = ev.clientY;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const popupWidth = 700;
                const popupHeight = 300;
                const rightSpace = windowWidth - mouseX;
                const leftSpace = mouseX;
                if (rightSpace >= popupWidth) {
                  floatDiv.style.left = mouseX + "px";
                  floatDiv.style.bottom = windowHeight - mouseY + "px";
                } else if (leftSpace >= popupWidth) {
                  floatDiv.style.right = windowWidth - mouseX + "px";
                  floatDiv.style.bottom = windowHeight - mouseY + "px";
                } else {
                  floatDiv.style.right = windowWidth - mouseX + "px";
                  floatDiv.style.bottom = windowHeight - mouseY + "px";
                }
                floatDiv.style.backgroundColor = "#fff";
                floatDiv.style.border = "1px solid #ccc";
                floatDiv.style.borderRadius = "8px";
                floatDiv.style.padding = "10px";
                floatDiv.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                floatDiv.style.zIndex = String(CSENSE_WINDOW_BASE_ZINDEX + 1);
                floatDiv.style.maxWidth = "700px";
                floatDiv.style.maxHeight = "300px";
                floatDiv.style.overflowX = "auto";
                const img = document.createElement("img");
                img.src = svgUrl;
                img.style.display = "block";
                img.style.margin = "10px";
                img.style.maxWidth = "100%";
                img.style.height = "auto";
                floatDiv.appendChild(img);
                document.body.appendChild(floatDiv);
                floatDiv.addEventListener("mouseenter", () => {
                  if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                  }
                });
                floatDiv.addEventListener("mouseleave", () => {
                  hideTimeout = setTimeout(() => {
                    if (floatDiv) {
                      floatDiv.remove();
                      floatDiv = null;
                    }
                  }, 100);
                });
              }
            };
            const hidePreview = () => {
              hideTimeout = setTimeout(() => {
                if (floatDiv) {
                  floatDiv.remove();
                  floatDiv = null;
                }
              }, 100);
            };
            inspectButton.addEventListener("mouseenter", showPreview);
            inspectButton.addEventListener("mouseleave", hidePreview);
            space.after(inspectButton);
          }).catch((v) => {
            loading.textContent = "\u89E3\u6790\u6269\u5C55\u5931\u8D25\u3002";
          });
        } else {
          const useNoopButton = document.createElement("button");
          useNoopButton.textContent = "\u751F\u6210\u7A7A\u6269\u5C55";
          useNoopButton.title = "\u5C1D\u8BD5\u4F7F\u7528\u6C99\u7BB1\u751F\u6210\u7A7A\u6269\u5C55\u3002";
          useNoopButton.style.marginBottom = "10px";
          useNoopButton.style.marginLeft = "10px";
          useNoopButton.style.padding = "10px 20px";
          useNoopButton.style.fontSize = "16px";
          useNoopButton.addEventListener("click", async (ev) => {
            useNoopButton.disabled = true;
            useNoopButton.textContent = "\u8BF7\u7A0D\u7B49";
            const res = await this.getExtensionInfo();
            if (typeof res !== "string") {
              useNoopButton.textContent = "\u53D1\u751F\u9519\u8BEF";
              useNoopButton.style.color = "#999";
              useNoopButton.title = res.error;
            }
            this.extension.newContent = res;
            this.editor.setValue(this.extension.newContent);
            useNoopButton.textContent = "\u751F\u6210\u7A7A\u6269\u5C55";
            useNoopButton.disabled = false;
          });
          toolbar.appendChild(useNoopButton);
        }
        target.appendChild(toolbar);
      }
    }
    dispose() {
      this.editor?.dispose();
    }
  };

  // src/scene/extension.js
  var ExtensionScene = class {
    static title = "\u6269\u5C55";
    /**
     *
     * @param {import('../base/scene.js').SceneManager} manager
     * @param {import('../overlay/extension.js').ExtensionOverlay} overlay
     */
    constructor(manager, overlay) {
      this.manager = manager;
      this.overlay = overlay;
      const extensionsList = this.extensionsList = [];
      for (const ext of this.overlay.projectJson.extensions) {
        if (!this.overlay.projectJson.gandi?.wildExtensions?.[ext])
          extensionsList.push({
            name: ext,
            type: "internal",
            url: null
          });
      }
      if (this.overlay.projectJson.gandi?.wildExtensions) {
        for (const [name, obj] of Object.entries(
          this.overlay.projectJson.gandi?.wildExtensions ?? {}
        )) {
          extensionsList.push({
            name,
            type: "custom",
            url: obj.url,
            newContent: null
          });
        }
      }
    }
    async loadExtension(ext) {
      if (!state_default.vm.extensionManager._gandiExternalExtensionServicesLoaded) {
        await state_default.vm.extensionManager.loadGandiExternalExtensionServers();
      }
      if (ext.type === "internal") {
        await state_default.vm.extensionManager.loadExtensionURL(ext.name);
      } else if (ext.type === "custom" && ext.url) {
        let url = ext.url;
        let isFake = false;
        if (ext.newContent !== null) {
          url = URL.createObjectURL(
            new File([ext.newContent], "extension.js", {
              type: "application/javascript"
            })
          );
          patch(
            state_default.vm.extensionManager,
            "addCustomExtensionInfo",
            (addCustomExtensionInfo) => {
              return function(ext2, maskUrl) {
                if (maskUrl === url) {
                  maskUrl = ext2.url;
                }
                state_default.vm.extensionManager.addCustomExtensionInfo = addCustomExtensionInfo;
                return addCustomExtensionInfo.call(this, ext2, maskUrl);
              };
            }
          );
          isFake = true;
          patch(document, "createElement", (createElement) => {
            return function(tagName) {
              if (tagName === "script") {
                const script = createElement.call(this, tagName);
                const proxy = new Proxy(script, {
                  set(target, prop, value) {
                    if (prop === "src") {
                      return Reflect.set(target, "src", url);
                    } else return Reflect.set(target, prop, value);
                  }
                });
                document.createElement = createElement;
                patch(document.body, "append", (append) => {
                  return function(child) {
                    if (child === proxy) {
                      document.body.append = append;
                      return append.call(this, script);
                    }
                    return append.call(this, child);
                  };
                });
                patch(document.body, "removeChild", (removeChild) => {
                  return function(child) {
                    if (child === proxy) {
                      document.body.removeChild = removeChild;
                      return removeChild.call(this, script);
                    }
                    return removeChild.call(this, child);
                  };
                });
                return proxy;
              }
              return createElement.call(this, tagName);
            };
          });
        }
        await state_default.vm.extensionManager.loadExtensionURL(url);
        if (isFake) URL.revokeObjectURL(url);
      }
    }
    async loadModifiedProject() {
      for (const ext of this.extensionsList) {
        if (state_default.vm.extensionManager.isExtensionLoaded(ext.name)) {
          continue;
        }
        await this.loadExtension(ext);
      }
      if (this.overlay.projectJson.gandi?.wildExtensions) {
        this.overlay.projectJson.gandi.wildExtensions = {};
      }
      const _clearLoadedExtensions = state_default.vm.extensionManager.clearLoadedExtensions;
      state_default.vm.extensionManager.clearLoadedExtensions = function() {
        state_default.vm.extensionManager.clearLoadedExtensions = _clearLoadedExtensions;
      };
      this.overlay.projectJson.extensions = [];
      this.overlay.projectJson.extensionURLs = {};
      this.overlay.input = this.overlay.input.file(
        "project.json",
        JSON.stringify(this.overlay.projectJson)
      );
      this.overlay.resolver.resolve(this.overlay.input);
    }
    render() {
      const target = this.manager.target;
      const extensionsList = this.extensionsList;
      if (extensionsList.length === 0) {
        const noExt = document.createElement("p");
        noExt.style.textAlign = "center";
        noExt.textContent = "\u8BE5\u9879\u76EE\u6CA1\u6709\u4F7F\u7528\u4EFB\u4F55\u6269\u5C55\u3002";
        target.appendChild(noExt);
        return;
      }
      const container = document.createElement("div");
      container.style.display = "flex";
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "\u641C\u7D22\u6269\u5C55...";
      searchInput.style.padding = "5px";
      searchInput.style.border = "1px solid #ddd";
      searchInput.style.flexGrow = "1";
      searchInput.style.boxSizing = "border-box";
      searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        const items = list.children;
        let hasResults = false;
        Array.from(items).forEach((item) => {
          if (item.className !== "no-results" && item.querySelector(".item-name").textContent.toLowerCase().includes(filter)) {
            item.style.display = "flex";
            hasResults = true;
          } else if (item.className !== "no-results") {
            item.style.display = "none";
          }
        });
        if (!hasResults) {
          if (!list.querySelector(".no-results")) {
            const noResultsItem = document.createElement("li");
            noResultsItem.textContent = "(\u65E0\u7ED3\u679C)";
            noResultsItem.className = "no-results";
            noResultsItem.style.display = "flex";
            noResultsItem.style.justifyContent = "center";
            noResultsItem.style.alignItems = "center";
            noResultsItem.style.width = "100%";
            noResultsItem.style.height = "100%";
            noResultsItem.style.color = "#999";
            list.appendChild(noResultsItem);
          }
        } else {
          const noResultsItem = list.querySelector(".no-results");
          if (noResultsItem) {
            list.removeChild(noResultsItem);
          }
        }
      });
      container.appendChild(searchInput);
      const continueButton = document.createElement("button");
      continueButton.textContent = "\u25B6\uFE0F";
      continueButton.title = "\u5B8C\u6210\u7F16\u8F91";
      continueButton.style.padding = "5px";
      continueButton.style.border = "none";
      continueButton.style.borderRadius = "5px";
      continueButton.style.color = "white";
      continueButton.style.backgroundColor = "blue";
      continueButton.style.cursor = "pointer";
      continueButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
      continueButton.style.width = "30px";
      continueButton.style.height = "30px";
      continueButton.addEventListener("click", async () => {
        this.manager.back();
        this.overlay.showOverlay = false;
        await this.loadModifiedProject();
      });
      container.appendChild(continueButton);
      target.appendChild(container);
      const scrollable = createScrollable();
      const list = document.createElement("ul");
      list.style.listStyle = "none";
      list.style.padding = "0";
      list.style.margin = "0";
      let loadPromise = Promise.resolve();
      extensionsList.forEach((ext) => {
        const listItem = document.createElement("li");
        listItem.style.display = "flex";
        listItem.style.alignItems = "center";
        listItem.style.padding = "5px";
        listItem.style.border = "1px solid #ddd";
        listItem.style.borderRadius = "4px";
        listItem.style.backgroundColor = "#f9f9f9";
        const name = document.createElement("span");
        name.textContent = ext.name;
        name.classList.add("item-name");
        name.style.marginRight = "10px";
        listItem.appendChild(name);
        const type = document.createElement("span");
        type.textContent = ext.type === "internal" ? "\u5B98\u65B9\u6269\u5C55" : `\u81EA\u5B9A\u4E49\u6269\u5C55${ext.newContent !== null ? " (\u5DF2\u4FEE\u6539)" : ""}`;
        if (ext.type === "custom" && ext.url) {
          type.title = ext.url;
        }
        type.style.fontSize = "12px";
        type.style.color = "#666";
        type.style.flexGrow = "1";
        listItem.appendChild(type);
        let editButton = null;
        if (ext.type === "custom" && ext.url && !state_default.vm.extensionManager.isExtensionLoaded(ext.name)) {
          editButton = document.createElement("button");
          editButton.textContent = "\u270F\uFE0F";
          editButton.title = "\u70B9\u51FB\u6B64\u5904\u7F16\u8F91\u6B64\u6269\u5C55\u3002\u5C06\u4F1A\u6253\u5F00\u4E00\u4E2A\u4EE3\u7801\u7F16\u8F91\u5668\u3002";
          editButton.style.marginRight = "5px";
          editButton.addEventListener("click", () => {
            this.manager.open(new ExtensionEditScene(this.manager, ext));
          });
          listItem.appendChild(editButton);
        }
        const loadButton = document.createElement("button");
        loadButton.textContent = "\u23EC";
        loadButton.title = "\u7ACB\u523B\u52A0\u8F7D\u6269\u5C55";
        if (state_default.vm.extensionManager.isExtensionLoaded(ext.name)) {
          loadButton.textContent = "\u2705";
          loadButton.title = "\u5DF2\u52A0\u8F7D";
          loadButton.disabled = true;
        } else {
          loadButton.addEventListener("click", () => {
            loadButton.textContent = "\u2705";
            loadButton.title = "\u5DF2\u52A0\u8F7D";
            loadButton.disabled = true;
            if (editButton) {
              listItem.removeChild(editButton);
              editButton = null;
            }
            loadPromise = loadPromise.then(() => this.loadExtension(ext));
          });
        }
        listItem.appendChild(loadButton);
        list.appendChild(listItem);
      });
      scrollable.appendChild(list);
      target.appendChild(scrollable);
    }
    dispose() {
    }
  };

  // src/overlay/extension.js
  var ExtensionOverlay = class {
    /**
     * @param {import('../base/scene.js').SceneManager} manager
     * @param {import('jszip')} input
     * @param {object} projectJson
     * @param {PromiseWithResolvers<import('jszip')>} resolver
     */
    constructor(manager, input, projectJson, resolver) {
      this.manager = manager;
      this.input = input;
      this.projectJson = projectJson;
      this.resolver = resolver;
      this.showOverlay = true;
      this.resolver.promise.then(() => {
        manager.removeOverlay(this);
      });
      state_default.button.style.filter = "invert(1) hue-rotate(180deg)";
      state_default.button.title = "CSense \u62E6\u622A\u4E86\u6269\u5C55\u7684\u52A0\u8F7D\uFF0C\u8BF7\u70B9\u51FB\u8FDB\u884C\u5904\u7406\u3002";
      this.scene = new ExtensionScene(this.manager, this);
    }
    render() {
      if (this.manager.scene.at(-1).constructor.title !== "\u4E3B\u9875" || !this.showOverlay) {
        return;
      }
      const target = this.manager.target;
      const warningDiv = document.createElement("div");
      warningDiv.style.cursor = "pointer";
      warningDiv.textContent = "\u8BF7\u5904\u7406\u9879\u76EE\u6269\u5C55";
      warningDiv.title = "\u8BE5\u9879\u76EE\u81EA\u5E26\u4E86\u4E00\u4E9B\u6269\u5C55\u3002\u5728\u60A8\u786E\u8BA4\u4E4B\u524D\uFF0C\u9879\u76EE\u5C06\u4E0D\u4F1A\u52A0\u8F7D\u3002\u70B9\u51FB\u6B64\u5904\u8FDB\u884C\u5904\u7406\u3002";
      warningDiv.style.width = "100%";
      warningDiv.style.backgroundColor = "orange";
      warningDiv.style.color = "black";
      warningDiv.style.textAlign = "center";
      warningDiv.style.padding = "5px";
      warningDiv.style.fontSize = "12px";
      warningDiv.style.boxSizing = "border-box";
      warningDiv.addEventListener("click", async () => {
        this.manager.open(this.scene);
      });
      target.appendChild(warningDiv);
    }
    dispose() {
      state_default.button.style.filter = "none";
      state_default.button.title = "CCW \u8106\u5F31\u6027\u7684\u6839\u672C\u8BC1\u660E\u3002";
    }
  };

  // src/util/withResolvers.js
  function withResolvers() {
    let resolveFn, rejectFn;
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });
    return {
      promise,
      resolve: resolveFn,
      reject: rejectFn
    };
  }

  // src/scene/plugin.js
  var PluginScene = class {
    static title = "\u63D2\u4EF6";
    /**
     *
     * @param {import('../base/scene.js').SceneManager} manager
     */
    constructor(manager) {
      this.plugins = JSON.parse(
        window.localStorage.getItem("__csense-plugins") ?? (window.localStorage.setItem("__csense-plugins", "[]"), "[]")
      );
      this.manager = manager;
      state_default.pluginPromise = Promise.all(
        this.plugins.map((v) => this.loadPlugin(v))
      );
    }
    async loadPlugin(url) {
      try {
        const resp = await import(url);
        await resp.initalize({
          HomeScene,
          globalState: state_default,
          patch,
          createScrollable,
          withResolvers,
          manager: this.manager,
          SceneManager,
          vmPromise: vm
        });
      } catch (e) {
        console.error(`[CSense] \u52A0\u8F7D\u63D2\u4EF6 ${url} \u5931\u8D25`, e);
        return;
      }
    }
    updatePlugins() {
      this.plugins = this.plugins.filter((v) => v);
      window.localStorage.setItem(
        "__csense-plugins",
        JSON.stringify(this.plugins)
      );
      window.location.reload();
    }
    render() {
      const target = this.manager.target;
      const container = document.createElement("div");
      container.style.display = "flex";
      const urlInput = document.createElement("input");
      urlInput.type = "text";
      urlInput.placeholder = "\u8F93\u5165\u63D2\u4EF6\u5730\u5740...";
      urlInput.style.padding = "5px";
      urlInput.style.border = "1px solid #ddd";
      urlInput.style.flexGrow = "1";
      urlInput.style.boxSizing = "border-box";
      container.appendChild(urlInput);
      const addButton = document.createElement("button");
      addButton.textContent = "\u2795";
      addButton.title = "\u6DFB\u52A0\u63D2\u4EF6 (\u5C06\u4F1A\u5237\u65B0\u9875\u9762)";
      addButton.style.padding = "5px";
      addButton.style.border = "none";
      addButton.style.borderRadius = "5px";
      addButton.style.color = "white";
      addButton.style.backgroundColor = "blue";
      addButton.style.cursor = "pointer";
      addButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
      addButton.style.width = "30px";
      addButton.style.height = "30px";
      addButton.addEventListener("click", async () => {
        const url = urlInput.value.trim();
        if (!url) return;
        let urlObj = null;
        try {
          urlObj = new URL(url);
        } catch {
          alert("\u65E0\u6548\u7684 URL");
          return;
        }
        if (!urlObj.href.startsWith("https://") && !urlObj.href.startsWith("http://")) {
          alert("\u4EC5\u652F\u6301 HTTP(S) \u63D2\u4EF6\u5730\u5740");
          return;
        }
        if (!urlObj.href.endsWith(".js")) {
          alert("\u63D2\u4EF6\u5730\u5740\u5FC5\u987B\u4EE5 .js \u7ED3\u5C3E");
          return;
        }
        if (this.plugins.includes(urlObj.href)) {
          alert("\u6B64\u63D2\u4EF6\u5DF2\u6DFB\u52A0");
          return;
        }
        this.plugins.push(urlObj.href);
        this.updatePlugins();
      });
      container.appendChild(addButton);
      target.appendChild(container);
      const scrollable = createScrollable();
      const list = document.createElement("ul");
      list.style.listStyle = "none";
      list.style.padding = "0";
      list.style.margin = "0";
      let loadPromise = Promise.resolve();
      this.plugins.forEach((url, idx) => {
        let urlObj = null;
        try {
          urlObj = new URL(url);
        } catch {
          this.plugins[idx] = null;
          return;
        }
        const listItem = document.createElement("li");
        listItem.style.display = "flex";
        listItem.style.alignItems = "center";
        listItem.style.padding = "5px";
        listItem.style.border = "1px solid #ddd";
        listItem.style.borderRadius = "4px";
        listItem.style.backgroundColor = "#f9f9f9";
        const name = document.createElement("span");
        name.textContent = decodeURIComponent(
          urlObj.pathname.replace(/\/$/, "").split("/").at(-1) || urlObj.hostname || "\u672A\u77E5"
        );
        name.classList.add("item-name");
        name.style.marginRight = "10px";
        listItem.appendChild(name);
        const type = document.createElement("span");
        type.textContent = urlObj.hostname === "csense-rev.github.io" ? "\u5B98\u65B9\u63D2\u4EF6" : `\u7B2C\u4E09\u65B9\u63D2\u4EF6`;
        type.title = urlObj.href;
        type.style.fontSize = "12px";
        type.style.color = "#666";
        type.style.flexGrow = "1";
        listItem.appendChild(type);
        const removeButton = document.createElement("button");
        removeButton.textContent = "\u274C";
        removeButton.title = "\u5220\u9664\u63D2\u4EF6 (\u5C06\u4F1A\u5237\u65B0\u9875\u9762)";
        removeButton.addEventListener("click", () => {
          this.plugins[idx] = null;
          this.updatePlugins();
        });
        listItem.appendChild(removeButton);
        list.appendChild(listItem);
      });
      scrollable.appendChild(list);
      target.appendChild(scrollable);
    }
    dispose() {
    }
  };

  // src/scene/home.js
  var HomeScene = class _HomeScene {
    static title = "\u4E3B\u9875";
    // 添加新 entry 时请往这里写东西
    static featureListOrder = [
      "\u{1F4DD} \u4F5C\u54C1\u6570\u636E",
      "\u{1F329}\uFE0F \u4E91\u6570\u636E",
      "\u{1F3AE} MMO \u6846\u67B6",
      "\u{1F3C6} \u6210\u5C31\u76F8\u5173\u529F\u80FD",
      "\u{1F4DC} \u7ECF\u6D4E\u5408\u7EA6",
      "\u2699\uFE0F \u9AD8\u7EA7",
      "\u{1F6E0}\uFE0F \u63D2\u4EF6",
      "\u2139\uFE0F \u5173\u4E8E"
    ];
    /**
     * @param {Set<[string, Function]>} featureList
     * @param {string[]} order
     */
    static orderBy(featureList, order) {
      return Array.from(featureList.entries()).sort((a, b) => {
        return order.indexOf(a[0]) - order.indexOf(b[0]);
      });
    }
    /**
     *
     * @param {import('../base/scene').SceneManager} manager
     */
    constructor(manager) {
      this.plugin = new PluginScene(manager);
      state_default.userInfo = null;
      state_default.axios.interceptors.response.use((resp) => {
        if (resp.config.url.endsWith("/students/self/detail") && !state_default.userInfo) {
          const body = resp.data.body;
          state_default.myInfo = body;
          if (!this.isProfilePage) {
            state_default.userInfo = {
              userId: body.studentNumber,
              userName: body.name,
              uuid: body.oid,
              oid: body.oid,
              avatar: body.avatar,
              constellation: -1,
              following: 0,
              followers: 0,
              liked: 0,
              gender: ["MALE", "FEMALE"].indexOf(body.gender),
              // TODO for gandi: non-binary
              pendant: "",
              reputationScore: body.reputationScore
            };
            manager.requestUpdate();
          }
        }
        return resp;
      });
      state_default.axios.interceptors.response.use((resp) => {
        if (resp.config.url === "https://community-web.ccw.site/creation/detail") {
          resp.data.body.requireLogin = false;
        }
        return resp;
      });
      if (window.location.pathname.startsWith("/student/")) {
        this.isProfilePage = true;
        state_default.axios.interceptors.response.use((resp) => {
          if (resp.config.url.endsWith("/students/profile") && resp.data.body && !state_default.userInfo) {
            const body = resp.data.body;
            state_default.userInfo = {
              userId: body.studentNumber,
              userName: body.name,
              uuid: body.studentOid,
              oid: body.studentOid,
              avatar: body.avatar,
              constellation: -1,
              following: 0,
              followers: 0,
              liked: 0,
              gender: ["MALE", "FEMALE"].indexOf(body.gender),
              pendant: "",
              reputationScore: body.reputationScore
            };
            manager.requestUpdate();
          }
          return resp;
        });
      } else {
        this.isProfilePage = false;
        vm.then((vm2) => {
          state_default.vm = vm2;
          patch(vm2, "loadProject", (loadProject) => {
            return async (input) => {
              const JSZip = vm2.exports.JSZip;
              this.featureList.set(
                "\u{1F4DD} \u4F5C\u54C1\u6570\u636E",
                () => this.manager.open(new ProjectScene(this.manager, JSZip, input))
              );
              this.manager.requestUpdate();
              let projectZip = null;
              let projectJson = null;
              if (typeof input === "string" || typeof input === "object" && !(input instanceof ArrayBuffer) && !(input instanceof Uint8Array)) {
                projectZip = new JSZip();
                projectZip.file("project.json", input);
                projectJson = typeof input === "string" ? JSON.parse(input) : input;
              } else {
                projectZip = await JSZip.loadAsync(input);
                const file = projectZip.file("project.json");
                if (file) {
                  const content = await file.async("string");
                  projectJson = JSON.parse(content);
                }
              }
              state_default.button.style.filter = "invert(1) hue-rotate(180deg)";
              state_default.button.title = "CSense \u6B63\u5728\u52A0\u8F7D\u63D2\u4EF6\u3002";
              await state_default.pluginPromise;
              state_default.button.style.filter = "none";
              state_default.button.title = "CCW \u8106\u5F31\u6027\u7684\u6839\u672C\u8BC1\u660E\u3002";
              if (projectJson.extensions && projectJson.extensions.length > 0) {
                const resolver = withResolvers();
                this.manager.addOverlay(
                  new ExtensionOverlay(
                    this.manager,
                    projectZip,
                    projectJson,
                    resolver
                  )
                );
                input = await (await resolver.promise).generateAsync({
                  type: "arraybuffer"
                });
              }
              return loadProject.call(vm2, input);
            };
          });
          const patchCCWAPI = (ccwAPI) => {
            const _getUserInfo = ccwAPI.getUserInfo;
            ccwAPI.getUserInfo = async function() {
              if (state_default.userInfo) return state_default.userInfo;
              return await _getUserInfo.call(this);
            };
          };
          if (vm2.runtime.ccwAPI) patchCCWAPI(vm2.runtime.ccwAPI);
          const _setCCWAPI = vm2.runtime.setCCWAPI;
          vm2.runtime.setCCWAPI = function(api) {
            _setCCWAPI.call(this, api);
            patchCCWAPI(api);
          };
          let userName = vm2.runtime.ioDevices.userData._username;
          Object.defineProperty(vm2.runtime.ioDevices.userData, "_username", {
            get: () => {
              if (state_default.userInfo) return state_default.userInfo.userName;
              return userName;
            },
            set(value) {
              userName = value;
            }
          });
          const _compilerRegisterExtension = vm2.runtime.constructor.prototype.compilerRegisterExtension;
          const patchUUID = (extensionObject) => {
            Object.defineProperties(extensionObject, {
              UserId: {
                get() {
                  return state_default.userInfo?.userId;
                },
                set() {
                }
              },
              ccwUserNickname: {
                get() {
                  return state_default.userInfo?.userName;
                },
                set() {
                }
              },
              ccwUserUUID: {
                get() {
                  return state_default.userInfo?.userId;
                },
                set() {
                }
              }
            });
          };
          patch(
            vm2.extensionManager,
            "isValidExtensionURL",
            (isValidExtensionURL) => {
              return function(extensionURL) {
                if (extensionURL.startsWith("blob:")) return true;
                return isValidExtensionURL.call(this, extensionURL);
              };
            }
          );
          state_default.extensionInjector.on("community", (extensionObject) => {
            extensionObject.getCoinCount = () => Infinity;
            extensionObject.isUserLikedOtherProject = extensionObject.isLiked = extensionObject.isMyFans = extensionObject.isFanOfSomeone = extensionObject.requestFollow = extensionObject.isUserFavoriteOtherProject = () => true;
            const _insertCoinAndWaitForResult = extensionObject.insertCoinAndWaitForResult;
            extensionObject.insertCoinAndWaitForResult = function(args) {
              if (confirm(`\u4F5C\u54C1\u8BF7\u6C42\u6295 ${args.COUNT} \u4E2A\u5E01\uFF0C\u662F\u5426\u4F2A\u9020\u7ED3\u679C\uFF1F`)) {
                return true;
              }
              return _insertCoinAndWaitForResult.call(this, args);
            };
          });
          state_default.extensionInjector.on(
            "GandiAchievementAndLeaderboard",
            (extensionObject) => {
              this.featureList.set("\u{1F3C6} \u6210\u5C31\u76F8\u5173\u529F\u80FD", () => {
                this.manager.open(
                  new AchievementScene(this.manager, extensionObject)
                );
              });
              this.manager.requestUpdate();
            }
          );
          state_default.extensionInjector.on("GandiEconomy", (extensionObject) => {
            patch(extensionObject, "requestFundReturn", (requestFundReturn) => {
              return function(args) {
                const res = prompt(
                  "\u4F5C\u54C1\u6B63\u5728\u8BF7\u6C42\u5408\u7EA6\u65E0\u507F\u6CE8\u8D44\u3002\u8BF7\u8F93\u5165\u4F2A\u9020\u7684\u6CE8\u8D44\u91D1\u989D\u3002\n\u5F53\u4E0D\u8F93\u5165\u4EFB\u4F55\u5185\u5BB9\u65F6\uFF0C\u5C06\u81EA\u52A8\u56DE\u843D\u5230\u5B98\u65B9\u5B9E\u73B0\u3002"
                );
                if (res === null || res === "") {
                  return requestFundReturn.call(this, args);
                }
                const v = Number(res);
                if (Number.isNaN(v) || v < 0) {
                  return 0;
                }
                return v;
              };
            });
            this.featureList.set("\u{1F4DC} \u7ECF\u6D4E\u5408\u7EA6", () => {
              this.manager.open(new EconomyScene(this.manager, extensionObject));
            });
          });
          state_default.extensionInjector.on("CCWMMO", (extensionObject) => {
            patchUUID(extensionObject);
            extensionObject.dispatchNewMessageWithParams = function(_, util) {
              const blackList = state_default.mmo.broadcastBlackList;
              const hatParam = util.thread.hatParam;
              const message = `${hatParam.type}(session=${JSON.stringify(hatParam.sender)},uuid=${JSON.stringify(hatParam.senderUID)},name=${JSON.stringify(hatParam.name)},content=${JSON.stringify(hatParam.content)})`;
              if (blackList.some((regex) => regex.test(message))) {
                return false;
              }
              return true;
            };
            this.featureList.set("\u{1F3AE} MMO \u6846\u67B6", () => {
              this.manager.open(new MMOScene(this.manager, extensionObject));
            });
          });
          state_default.extensionInjector.on("CCWData", (extensionObject) => {
            this.featureList.set("\u{1F329}\uFE0F \u4E91\u6570\u636E", () => {
              this.manager.open(new CCWDataScene(this.manager, extensionObject));
            });
            extensionObject.sendPlayEventCode = () => {
            };
            patch(
              extensionObject,
              "_getValueFromProject",
              (_getValueFromProject) => {
                return async function(name) {
                  const newValue = await _getValueFromProject.call(this, name);
                  state_default.ccwdata.project.set(name, newValue);
                  const possiblyModifiedValue = state_default.ccwdata.project.get(name);
                  if (possiblyModifiedValue !== newValue) {
                    return extensionObject._setValueToProject(
                      name,
                      possiblyModifiedValue
                    );
                  }
                  return possiblyModifiedValue;
                };
              }
            );
            patch(extensionObject, "_setValueToProject", (_setValueToProject) => {
              return async function(name, value) {
                state_default.ccwdata.project.set(name, value);
                return await _setValueToProject.call(
                  this,
                  name,
                  state_default.ccwdata.project.get(name)
                );
              };
            });
            patch(extensionObject, "_getValueFromUser", (_getValueFromUser) => {
              return async function(name) {
                const newValue = await _getValueFromUser.call(this, name);
                state_default.ccwdata.user.set(name, newValue);
                const possiblyModifiedValue = state_default.ccwdata.user.get(name);
                if (possiblyModifiedValue !== newValue) {
                  return extensionObject._setValueToUser(
                    name,
                    possiblyModifiedValue
                  );
                }
                return possiblyModifiedValue;
              };
            });
            patch(extensionObject, "_setValueToUser", (_setValueToUser) => {
              return async function(name, value) {
                state_default.ccwdata.user.set(name, value);
                return await _setValueToUser.call(
                  this,
                  name,
                  state_default.ccwdata.user.get(name)
                );
              };
            });
          });
          vm2.runtime.compilerRegisterExtension = (name, extensionObject) => {
            state_default.extensionInjector.emit(name, extensionObject);
            _compilerRegisterExtension.call(vm2.runtime, name, extensionObject);
          };
        });
      }
      this.manager = manager;
      this.animationFrame = null;
      this.avatarRotation = 0;
      this.featureList = /* @__PURE__ */ new Map([
        [
          "\u2699\uFE0F \u9AD8\u7EA7",
          () => {
            this.manager.open(new ScriptScene(this.manager));
          }
        ],
        [
          "\u{1F6E0}\uFE0F \u63D2\u4EF6",
          () => {
            this.manager.open(this.plugin);
          }
        ],
        [
          "\u2139\uFE0F \u5173\u4E8E",
          () => {
            this.manager.open(new AboutScene(this.manager));
          }
        ]
      ]);
    }
    static createListButton(feature, callback) {
      const li = document.createElement("li");
      li.textContent = feature;
      li.style.padding = "10px";
      li.style.margin = "5px 0";
      li.style.backgroundColor = "#f0f0f0";
      li.style.borderRadius = "8px";
      li.style.cursor = "pointer";
      li.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
      li.addEventListener("mouseover", () => {
        li.style.transform = "scale(1.05)";
        li.style.transition = "transform 0.2s ease-in-out";
      });
      li.addEventListener("mouseout", () => {
        li.style.transform = "scale(1)";
      });
      li.addEventListener("click", callback);
      return li;
    }
    renderFeatureList() {
      const ul = document.createElement("ul");
      const features = _HomeScene.orderBy(
        this.featureList,
        _HomeScene.featureListOrder
      );
      features.forEach((feature) => {
        ul.appendChild(_HomeScene.createListButton(feature[0], feature[1]));
      });
      ul.style.padding = "0";
      ul.style.margin = "0";
      ul.style.listStyleType = "none";
      return ul;
    }
    render() {
      const scrollable = createScrollable();
      const userProfile = document.createElement("div");
      userProfile.style.display = "flex";
      userProfile.style.marginTop = "10px";
      userProfile.style.flexDirection = "column";
      userProfile.style.alignItems = "center";
      userProfile.style.marginBottom = "10px";
      const avatar = document.createElement("img");
      avatar.src = state_default.userInfo?.avatar ?? logo_default;
      avatar.alt = "\u7528\u6237\u5934\u50CF";
      avatar.style.width = "120px";
      avatar.style.height = "120px";
      avatar.style.cursor = "pointer";
      avatar.style.borderRadius = "50%";
      avatar.style.marginBottom = "10px";
      if (!this.isProfilePage && (state_default.userInfo || !document.cookie.includes("cookie-user-id="))) {
        const handleFile = (file) => {
          if (file && file.type.startsWith("application/json")) {
            const reader = new FileReader();
            reader.onload = (event) => {
              state_default.userInfo = JSON.parse(event.target.result);
              this.manager.requestUpdate();
            };
            reader.readAsText(file);
          }
        };
        avatar.style.transition = "opacity 0.3s ease-in-out";
        avatar.title = "\u5BFC\u5165\u7528\u6237\u914D\u7F6E\u6587\u4EF6";
        avatar.addEventListener("dragover", (e) => {
          avatar.style.opacity = "0.5";
          e.preventDefault();
        });
        avatar.addEventListener("dragleave", (e) => {
          avatar.style.opacity = "1";
          e.preventDefault();
        });
        avatar.addEventListener("mouseover", () => {
          avatar.style.opacity = "0.5";
        });
        avatar.addEventListener("mouseout", () => {
          avatar.style.opacity = "1";
        });
        avatar.addEventListener("drop", (e) => {
          avatar.style.opacity = "1";
          const file = e.dataTransfer.files[0];
          handleFile(file);
          e.preventDefault();
        });
        avatar.addEventListener("click", () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json";
          input.style.display = "none";
          input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            handleFile(file);
          });
          input.click();
        });
      } else if (state_default.userInfo) {
        avatar.style.transition = "opacity 0.3s ease-in-out";
        avatar.title = "\u4E0B\u8F7D\u7528\u6237\u914D\u7F6E\u6587\u4EF6";
        avatar.addEventListener("click", () => {
          const blob = new Blob([JSON.stringify(state_default.userInfo, null, 2)], {
            type: "application/json"
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = `${state_default.userInfo.uuid}.json`;
          a.href = url;
          a.click();
          URL.revokeObjectURL(url);
        });
        avatar.addEventListener("mouseover", () => {
          avatar.style.opacity = "0.5";
        });
        avatar.addEventListener("mouseout", () => {
          avatar.style.opacity = "1";
        });
      }
      const rotateAvatar = () => {
        if (!state_default.userInfo && document.cookie.includes("cookie-user-id=")) {
          this.avatarRotation += 5;
          avatar.style.transform = `rotate(${this.avatarRotation}deg)`;
          this.animationFrame = requestAnimationFrame(rotateAvatar);
        } else {
          this.avatarRotation = 0;
          this.animationFrame = null;
        }
      };
      if (!this.animationFrame) {
        rotateAvatar();
      }
      const username = document.createElement("div");
      username.textContent = state_default.userInfo?.userName ?? (document.cookie.includes("cookie-user-id=") ? "\u8BF7\u7A0D\u7B49..." : "\u672A\u767B\u5F55");
      username.style.fontSize = "16px";
      username.style.fontWeight = "bold";
      userProfile.appendChild(avatar);
      userProfile.appendChild(username);
      scrollable.appendChild(userProfile);
      const ul = this.renderFeatureList();
      scrollable.appendChild(ul);
      const about = document.createElement("strong");
      about.style.color = "#999";
      about.textContent = `CSense v${version}`;
      about.style.display = "block";
      about.style.textAlign = "center";
      scrollable.appendChild(about);
      this.manager.target.appendChild(scrollable);
    }
    dispose() {
    }
  };

  // src/index.js
  (() => {
    function asNativeFunc(fn) {
      const toString = fn.toString = () => "function () { [native code] }";
      fn.toString.toString = toString;
      return fn;
    }
    if (!console.log.toString().includes("[native code]")) {
      alert(
        "CSense \u52A0\u8F7D\u5F97\u592A\u6162\u4E86\u3002\n\n\u8FD9\u53EF\u80FD\u4F1A\u5BFC\u81F4\u4E00\u4E9B\u529F\u80FD\u5F02\u5E38\uFF0C\u5E76\u4E14\u6211\u4EEC\u4E0D\u4F1A\u4FEE\u590D\u8FD9\u4E9B\u5F02\u5E38\u3002\n\u5982\u679C\u60A8\u5728\u4F7F\u7528 Tampermonkey: \u8BF7\u6362\u7528 Violentmonkey\u3002\n\u5982\u679C\u60A8\u5728\u4F7F\u7528 Violentmonkey\uFF1A\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u52FE\u9009\u540C\u6B65 page \u6A21\u5F0F\u3002\u8FD9\u53EF\u80FD\u4F1A\u5BFC\u81F4\u4E00\u4E9B\u811A\u672C\u5F02\u5E38\uFF0C\u8BF7\u81EA\u884C\u53D6\u820D\u3002"
      );
    }
    const _apply = Function.prototype.apply;
    Function.prototype.apply = function(thisArg, args) {
      if (typeof thisArg === "object" && thisArg && thisArg.defaults && thisArg.interceptors && thisArg.interceptors.request.handlers.length > 0) {
        if (state_default.axios instanceof LazyXHR) {
          state_default.axios.delegate(thisArg);
          state_default.axios = thisArg;
          window.axios = thisArg;
        }
        this.apply = _apply;
      }
      return _apply.call(this, thisArg, args);
    };
    const content = document.createElement("div");
    content.style.fontFamily = "unset";
    const manager = new SceneManager(content);
    manager.addOverlay(new IdentityWarningOverlay(manager));
    manager.open(new HomeScene(manager));
    const win = createWindow(content, () => {
      return !manager.back();
    });
    manager._doSetTitle = win.setTitle;
    state_default.button = win.button;
    manager._updateTitle();
    globalThis.manager = manager;
    const querySelectorAll = Document.prototype.querySelectorAll;
    Document.prototype.querySelectorAll = asNativeFunc(function(selectors) {
      if (this !== document) {
        return querySelectorAll.call(this, selectors);
      }
      const elements = Array.from(querySelectorAll.call(this, selectors));
      const result = elements.filter(
        (el) => !(el === win.button || el === win.window)
      );
      return Object.assign(result, {
        item(nth) {
          return result[nth];
        }
      });
    });
    const querySelector = Document.prototype.querySelector;
    Document.prototype.querySelector = asNativeFunc(function(selectors) {
      if (this !== document) {
        return querySelector.call(this, selectors);
      }
      const res = querySelector.call(this, selectors);
      if (res === win.button || res === win.window) {
        return null;
      }
      return res;
    });
  })();
})();