(()=>{"use strict";var __webpack_modules__={"./src/index.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PaperlessUploader)
/* harmony export */ });
/* harmony import */ var siyuan__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! siyuan */ "siyuan");
/* harmony import */ var siyuan__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(siyuan__WEBPACK_IMPORTED_MODULE_0__);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

const STORAGE_KEY = "paperless-config";
class PaperlessUploader extends siyuan__WEBPACK_IMPORTED_MODULE_0__.Plugin {
  constructor() {
    super(...arguments);
    this.config = {};
    this.uploadedFiles = /* @__PURE__ */ new Set();
    this.supportedSuffixes = [];
    this.injectContextMenu = ({ detail }) => {
      var _a;
      const el = detail.element;
      let filePath = "";
      const imgEl = el.querySelector("img");
      const src = (imgEl == null ? void 0 : imgEl.getAttribute("src")) || ((_a = el == null ? void 0 : el.dataset) == null ? void 0 : _a.href) || "";
      if (src.includes("assets/")) {
        filePath = src;
      } else if (src.includes("/assets/")) {
        const match = src.match(/\\/assets\\/([^?#]+)/);
        if (match)
          filePath = \`assets/\${match[1]}\`;
      }
      const name = filePath.split("/").pop();
      if (!filePath || !name || !this.supportedSuffixes.some((s) => name.endsWith(s)))
        return;
      detail.menu.addItem({
        icon: "iconUpload",
        label: this.i18n.uploadmanual,
        click: () => __async(this, null, function* () {
          if (yield this.documentExists(name)) {
            (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(this.i18n.docExistsSkip.replace("\${name}", name));
            return;
          }
          yield this.uploadFile(\`/data/\${filePath}\`, name);
        })
      });
    };
  }
  onload() {
    return __async(this, null, function* () {
      yield this.loadData(STORAGE_KEY);
      this.config = this.data[STORAGE_KEY] || {};
      this.addTopBar({
        icon: "iconUpload",
        title: this.i18n.uploadmanual,
        position: "right",
        callback: () => this.uploadAll()
      });
      this.eventBus.on("open-menu-image", this.injectContextMenu);
      this.eventBus.on("open-menu-link", this.injectContextMenu);
      this.registerSettingUI();
    });
  }
  onunload() {
    this.eventBus.off("open-menu-image", this.injectContextMenu);
    this.eventBus.off("open-menu-link", this.injectContextMenu);
  }
  registerSettingUI() {
    this.setting = new siyuan__WEBPACK_IMPORTED_MODULE_0__.Setting({
      confirmCallback: () => this.saveData(STORAGE_KEY, this.config)
    });
    const input = document.createElement("input");
    input.className = "b3-text-field fn__block";
    input.placeholder = "http://your-paperless-url";
    input.value = this.config.baseURL || "";
    input.addEventListener("input", () => {
      this.config.baseURL = input.value;
    });
    const authInput = document.createElement("input");
    authInput.className = "b3-text-field fn__block";
    authInput.placeholder = "xxxxxx...PaperLess Token";
    authInput.value = this.config.authHeader || "";
    authInput.addEventListener("input", () => {
      this.config.authHeader = authInput.value;
    });
    const suffixInput = document.createElement("input");
    suffixInput.className = "b3-text-field fn__block";
    suffixInput.placeholder = "*.pdf, *.png";
    suffixInput.value = this.config.suffixes || "*.pdf";
    suffixInput.addEventListener("input", () => {
      this.config.suffixes = suffixInput.value;
      this.supportedSuffixes = this.parseSuffixes(this.config.suffixes);
    });
    const testBtn = document.createElement("button");
    testBtn.className = "b3-button";
    testBtn.textContent = this.i18n.testconnect;
    testBtn.onclick = () => __async(this, null, function* () {
      const ok = yield this.testConnection();
      (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(ok ? this.i18n.connectSuccess : this.i18n.connectFail, 5e3, ok ? "info" : "error");
    });
    this.setting.addItem({ title: this.i18n.paperlessAddr, createActionElement: () => input });
    this.setting.addItem({ title: this.i18n.paperlessToken, createActionElement: () => authInput });
    this.setting.addItem({ title: this.i18n.paperlessSuffix, createActionElement: () => suffixInput });
    this.setting.addItem({ title: this.i18n.testconnect, actionElement: testBtn });
    this.supportedSuffixes = this.parseSuffixes(this.config.suffixes || "*.pdf");
  }
  parseSuffixes(raw) {
    return raw.split(/[\\,\\s]+/).map((s) => s.replace("*", "").trim()).filter(Boolean);
  }
  getAuthHeader() {
    if (!this.config.authHeader)
      return "";
    return this.config.authHeader.trim().startsWith("Token ") ? this.config.authHeader.trim() : \`Token \${this.config.authHeader.trim()}\`;
  }
  testConnection() {
    return __async(this, null, function* () {
      return new Promise((resolve) => {
        (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.fetchPost)("/api/network/forwardProxy", {
          url: \`\${this.config.baseURL}/api/documents/?page=1\`,
          method: "GET",
          headers: [{ Authorization: this.getAuthHeader() }],
          responseEncoding: "text",
          timeout: 5e3
        }, (res) => {
          var _a, _b;
          const body = (_a = res == null ? void 0 : res.data) == null ? void 0 : _a.body;
          if (((_b = res == null ? void 0 : res.data) == null ? void 0 : _b.status) === 200 || typeof body === "string" && body.includes("results")) {
            resolve(true);
          } else {
            try {
              const json = JSON.parse(body);
              const detail = json.detail || this.i18n.unknownError;
              const msg = this.i18n.errorWithDetail.replace("\${detail}", detail);
              (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(msg, 5e3, "error");
            } catch (e) {
            }
            resolve(false);
          }
        });
      });
    });
  }
  uploadAll() {
    return __async(this, null, function* () {
      const res = yield new Promise((resolve) => {
        (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.fetchPost)("/api/file/readDir", { path: "/data/assets" }, resolve);
      });
      if (!res || !res.data || !Array.isArray(res.data)) {
        (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(this.i18n.failgetassets, 5e3, "error");
        return;
      }
      const files = res.data.map((f) => f.name).filter(
        (name) => this.supportedSuffixes.some((suffix) => name.endsWith(suffix))
      );
      if (files.length === 0) {
        (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(this.i18n.noinvaildassets, 5e3, "info");
        return;
      }
      let successCount = 0, skipCount = 0;
      for (const name of files) {
        if (yield this.documentExists(name)) {
          skipCount++;
          continue;
        }
        const ok = yield this.uploadFile(\`/data/assets/\${name}\`, name);
        if (ok)
          successCount++;
      }
      const msg = this.i18n.uploadSummary.replace("\${total}", files.length.toString()).replace("\${success}", successCount.toString()).replace("\${skipped}", skipCount.toString());
      (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(msg, 6e3);
    });
  }
  documentExists(name) {
    return __async(this, null, function* () {
      const searchUrl = \`\${this.config.baseURL}/api/documents/?title=\${encodeURIComponent(name)}\`;
      try {
        const res = yield fetch(searchUrl, {
          method: "GET",
          headers: { Authorization: this.getAuthHeader() }
        });
        const json = yield res.json();
        return Array.isArray(json.results) && json.results.some((doc) => doc.title === name);
      } catch (e) {
        console.warn(this.i18n.failedsearch, e);
        return false;
      }
    });
  }
  uploadFile(path, name) {
    return __async(this, null, function* () {
      try {
        const blob = yield fetch("/api/file/getFile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path })
        }).then((res) => {
          if (!res.ok)
            throw new Error(this.i18n.cannotgetfile);
          return res.blob();
        });
        const formData = new FormData();
        formData.append("title", name);
        formData.append("document", blob, name);
        const response = yield fetch(\`\${this.config.baseURL}/api/documents/post_document/\`, {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader()
          },
          body: formData
        });
        const text = (yield response.text()).trim().replace(/^"|"$/g, "");
        console.log("\\u4E0A\\u4F20\\u54CD\\u5E94\\uFF1A", text);
        if (response.ok && /^[a-f0-9\\-]{36}$/.test(text)) {
          this.uploadedFiles.add(name);
          return true;
        }
        try {
          const json = JSON.parse(text);
          if (json == null ? void 0 : json.task_id) {
            this.uploadedFiles.add(name);
            return true;
          }
        } catch (e) {
        }
        (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(this.i18n.uploadFail.replace("\${name}", name), 5e3, "error");
        return false;
      } catch (e) {
        console.error("\\u4E0A\\u4F20\\u5F02\\u5E38\\uFF1A", e);
        (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(this.i18n.uploadError.replace("\${name}", name), 5e3, "error");
        return false;
      }
    });
  }
}


//# sourceURL=webpack://plugin-sample/./src/index.ts?`)},siyuan:e=>{e.exports=require("siyuan")}},__webpack_module_cache__={};function __webpack_require__(e){var n=__webpack_module_cache__[e];if(n!==void 0)return n.exports;var t=__webpack_module_cache__[e]={exports:{}};return __webpack_modules__[e](t,t.exports,__webpack_require__),t.exports}__webpack_require__.n=e=>{var n=e&&e.__esModule?()=>e.default:()=>e;return __webpack_require__.d(n,{a:n}),n},__webpack_require__.d=(e,n)=>{for(var t in n)__webpack_require__.o(n,t)&&!__webpack_require__.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:n[t]})},__webpack_require__.o=(e,n)=>Object.prototype.hasOwnProperty.call(e,n),__webpack_require__.r=e=>{typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var __webpack_exports__=__webpack_require__("./src/index.ts");module.exports=__webpack_exports__})();
