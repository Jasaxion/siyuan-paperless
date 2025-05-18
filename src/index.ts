import {
    Plugin, 
    Setting, 
    showMessage, 
    fetchPost
    // Menu,
    // getFrontend, 
    // IOperation, 
    // Dialog, 
    // openSetting
} from "siyuan";

const STORAGE_KEY = "paperless-config";

export default class PaperlessUploader extends Plugin {

    private config: any = {};
    private uploadedFiles: Set<string> = new Set();
    private supportedSuffixes: string[] = [];

    async onload() {
        await this.loadData(STORAGE_KEY);
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
    }

    onunload() {
        this.eventBus.off("open-menu-image", this.injectContextMenu);
        this.eventBus.off("open-menu-link", this.injectContextMenu); 
    }

    private registerSettingUI() {
        this.setting = new Setting({
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
        testBtn.onclick = async () => {
            const ok = await this.testConnection();
            showMessage(ok ? this.i18n.connectSuccess : this.i18n.connectFail, 5000, ok ? "info" : "error");
        };

        this.setting.addItem({ title: this.i18n.paperlessAddr, createActionElement: () => input });
        this.setting.addItem({ title: this.i18n.paperlessToken, createActionElement: () => authInput });
        this.setting.addItem({ title: this.i18n.paperlessSuffix, createActionElement: () => suffixInput });
        this.setting.addItem({ title: this.i18n.testconnect, actionElement: testBtn });

        this.supportedSuffixes = this.parseSuffixes(this.config.suffixes || "*.pdf");
    }

    private parseSuffixes(raw: string): string[] {
        return raw.split(/[\,\s]+/).map(s => s.replace("*", "").trim()).filter(Boolean);
    }

    private getAuthHeader(): string {
        if (!this.config.authHeader) return "";
        return this.config.authHeader.trim().startsWith("Token ") ? this.config.authHeader.trim() : `Token ${this.config.authHeader.trim()}`;
    }

    private async testConnection(): Promise<boolean> {
        return new Promise((resolve) => {
            fetchPost("/api/network/forwardProxy", {
                url: `${this.config.baseURL}/api/documents/?page=1`,
                method: "GET",
                headers: [{ Authorization: this.getAuthHeader() }],
                responseEncoding: "text",
                timeout: 5000
            }, (res: any) => {
                const body = res?.data?.body;
                if (res?.data?.status === 200 || (typeof body === "string" && body.includes("results"))) {
                    resolve(true);
                } else {
                    try {
                        const json = JSON.parse(body);
                        const detail = json.detail || this.i18n.unknownError;
                        const msg = this.i18n.errorWithDetail.replace("${detail}", detail);
                        showMessage(msg, 5000, "error");
                    } catch {}
                    resolve(false);
                }
            });
        });
    }

    private async uploadAll() {
        const res: any = await new Promise(resolve => {
            fetchPost("/api/file/readDir", { path: "/data/assets" }, resolve);
        });

        if (!res || !res.data || !Array.isArray(res.data)) {
            showMessage(this.i18n.failgetassets, 5000, "error");
            return;
        }

        const files = res.data.map((f: any) => f.name).filter((name: string) =>
            this.supportedSuffixes.some(suffix => name.endsWith(suffix))
        );

        if (files.length === 0) {
            showMessage(this.i18n.noinvaildassets, 5000, "info");
            return;
        }

        let successCount = 0, skipCount = 0;
        for (const name of files) {
            if (await this.documentExists(name)) {
                skipCount++;
                continue;
            }
            const ok = await this.uploadFile(`/data/assets/${name}`, name);
            if (ok) successCount++;
        }

        const msg = this.i18n.uploadSummary
            .replace("${total}", files.length.toString())
            .replace("${success}", successCount.toString())
            .replace("${skipped}", skipCount.toString());

        showMessage(msg, 6000);
    }

    private injectContextMenu = ({ detail }: any) => {
        const el = detail.element;
        let filePath = "";

        const imgEl = el.querySelector("img");
        const src = imgEl?.getAttribute("src") || el?.dataset?.href || "";

        if (src.includes("assets/")) {
            filePath = src;
        } else if (src.includes("/assets/")) {
            const match = src.match(/\/assets\/([^?#]+)/);
            if (match) filePath = `assets/${match[1]}`;
        }

        const name = filePath.split("/").pop();
        if (!filePath || !name || !this.supportedSuffixes.some(s => name.endsWith(s))) return;

        detail.menu.addItem({
            icon: "iconUpload",
            label: this.i18n.uploadmanual,
            click: async () => {
                if (await this.documentExists(name)) {
                    showMessage(this.i18n.docExistsSkip.replace("${name}", name));
                    return;
                }
                await this.uploadFile(`/data/${filePath}`, name);
            }
        });
    };      

    private async documentExists(name: string): Promise<boolean> {
        const searchUrl = `${this.config.baseURL}/api/documents/?title=${encodeURIComponent(name)}`;
        try {
            const res = await fetch(searchUrl, {
                method: "GET",
                headers: { Authorization: this.getAuthHeader() }
            });
            const json = await res.json();
            return Array.isArray(json.results) && json.results.some((doc: any) => doc.title === name);
        } catch (e) {
            console.warn(this.i18n.failedsearch, e);
            return false;
        }
    }

    private async uploadFile(path: string, name: string): Promise<boolean> {
        try {
            const blob = await fetch("/api/file/getFile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path })
            }).then(res => {
                if (!res.ok) throw new Error(this.i18n.cannotgetfile);
                return res.blob();
            });

            const formData = new FormData();
            formData.append("title", name);
            formData.append("document", blob, name);

            const response = await fetch(`${this.config.baseURL}/api/documents/post_document/`, {
                method: "POST",
                headers: {
                    Authorization: this.getAuthHeader()
                },
                body: formData
            });

            const text = (await response.text()).trim().replace(/^"|"$/g, "");
            console.log("上传响应：", text);

            if (response.ok && /^[a-f0-9\-]{36}$/.test(text)) {
                this.uploadedFiles.add(name);
                return true;
            }

            try {
                const json = JSON.parse(text);
                if (json?.task_id) {
                    this.uploadedFiles.add(name);
                    return true;
                }
            } catch {}

            showMessage(this.i18n.uploadFail.replace("${name}", name), 5000, "error");
            return false;
        } catch (e) {
            console.error("上传异常：", e);
            showMessage(this.i18n.uploadError.replace("${name}", name), 5000, "error");
            return false;
        }
    }
}