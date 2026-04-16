/* modal_tts_manage.js */

const TtsManageApi = {
    async list({ page = 0, size = 200 } = {}) {
        const res = await fetch(`/api/tts?page=${page}&size=${size}`, { method: "GET" });
        if (!res.ok) throw new Error("TTS list failed");
        const data = await res.json().catch(() => null);

        // Page(content) 또는 배열 대응
        return Array.isArray(data) ? data : (data?.content ?? []);
    },

    async create(payload) {
        const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("TTS create failed");
        return res.json().catch(() => null);
    },

    async update(id, payload) {
        const res = await fetch(`/api/tts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("TTS update failed");
        return res.json().catch(() => null);
    },

    async remove(id) {
        const res = await fetch(`/api/tts/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
            const message = await res.text().catch(() => "");
            throw new Error(message || `TTS delete failed: ${res.status}`);
        }
        return true;
    },
};

window.TtsManageModal = {
    state: {
        items: [],
        selectedId: null,
        mode: "create",
        statusConfirmResolve: null,
    },

    els() {
        return {
            list: document.getElementById("tts_list"),
            filterUse: document.getElementById("tts_filter_use"),
            search: document.getElementById("tts_search"),
            btnSave: document.getElementById("tts_save"),
            btnDelete: document.getElementById("tts_delete"),
            status: document.getElementById("tts_inline_status"),
            statusText: document.getElementById("tts_inline_status_text"),
            statusIcon: document.getElementById("tts_inline_status_icon"),
            statusActions: document.getElementById("tts_inline_status_actions"),
            statusConfirm: document.getElementById("tts_inline_status_confirm"),
            statusCancel: document.getElementById("tts_inline_status_cancel"),
            statusClose: document.getElementById("tts_inline_status_close"),

            id: document.getElementById("tts_id"),
            name: document.getElementById("tts_name"),
            useFlag: document.getElementById("tts_use_flag"),
            msg: document.getElementById("tts_msg"),
        };
    },

    init() {
        if (this.state.initialized) return;

        const el = this.els();
        if (!el.list) return; // 모달 fragment가 포함되지 않은 페이지일 수 있음

        this.state.initialized = true;

        el.filterUse?.addEventListener("change", () => this.renderList());
        el.search?.addEventListener("input", () => this.renderList());

        el.btnSave?.addEventListener("click", () => this.save());
        el.btnDelete?.addEventListener("click", () => this.remove());
        el.statusClose?.addEventListener("click", () => this.hideStatus());

        // 모달 열릴 때마다 목록 갱신하고 싶으면(선택)
        const modalEl = document.getElementById("tts_manage_modal");
        if (modalEl) {
            modalEl.addEventListener("shown.bs.modal", () => {
                this.loadList();
            });
        }
    },

    async loadList() {
        try {
            this.state.items = await TtsManageApi.list({ page: 0, size: 200 });
            this.renderList();
            // 목록 갱신 시 선택이 없으면 신규 폼 유지
            if (!this.state.selectedId) this.resetForm();
        } catch (e) {
            console.error(e);
            this.showStatus("TTS 목록을 불러오지 못했습니다.", "danger");
        }
    },

    clearStatusActions() {
        const el = this.els();
        if (this.state.statusConfirmResolve) {
            const resolve = this.state.statusConfirmResolve;
            this.state.statusConfirmResolve = null;
            resolve(false);
        }
        if (el.statusConfirm) el.statusConfirm.onclick = null;
        if (el.statusCancel) el.statusCancel.onclick = null;
        el.statusActions?.classList.add("d-none");
        el.statusClose?.classList.remove("d-none");
    },

    showStatus(message, type = "info") {
        const el = this.els();
        if (!el.status || !el.statusText) return;

        this.clearStatusActions();

        el.status.classList.remove("d-none", "is-success", "is-warning", "is-danger", "is-info");
        el.status.classList.add(`is-${type}`);
        el.statusText.textContent = message;

        if (el.statusIcon) {
            const iconMap = {
                success: "bi-check-circle",
                warning: "bi-exclamation-triangle",
                danger: "bi-x-circle",
                info: "bi-info-circle",
            };
            el.statusIcon.className = `bi ${iconMap[type] ?? iconMap.info} bc-inline-status-icon`;
        }
    },

    hideStatus() {
        this.clearStatusActions();
        this.els().status?.classList.add("d-none");
    },

    confirmStatus(message, type = "warning") {
        const el = this.els();
        if (!el.status || !el.statusText || !el.statusConfirm || !el.statusCancel || !el.statusActions) {
            return Promise.resolve(window.confirm(message));
        }

        this.showStatus(message, type);
        el.statusActions.classList.remove("d-none");
        el.statusClose?.classList.add("d-none");

        return new Promise(resolve => {
            this.state.statusConfirmResolve = resolve;

            el.statusConfirm.onclick = () => {
                this.state.statusConfirmResolve = null;
                this.hideStatus();
                resolve(true);
            };
            el.statusCancel.onclick = () => {
                this.state.statusConfirmResolve = null;
                this.hideStatus();
                resolve(false);
            };
        });
    },

    getFilteredItems() {
        const el = this.els();
        const use = el.filterUse?.value ?? "ALL";
        const q = (el.search?.value ?? "").trim().toLowerCase();

        return (this.state.items ?? [])
            .filter(x => {
                if (use === "ALL") return true;
                return String(x.ttsUseFlag) === use;
            })
            .filter(x => {
                if (!q) return true;
                const name = String(x.ttsName ?? "").toLowerCase();
                const msg = String(x.ttsMsg ?? "").toLowerCase();
                return name.includes(q) || msg.includes(q);
            })
            .sort((a, b) => (b.ttsId ?? 0) - (a.ttsId ?? 0));
    },

    updateUiMode() {
        const el = this.els();
        const isEdit = this.state.mode === "edit";
        if (el.btnSave) el.btnSave.textContent = isEdit ? "수정" : "저장";
        if (el.btnDelete) {
            el.btnDelete.disabled = !isEdit;
            el.btnDelete.classList.toggle("d-none", !isEdit);
        }

        const modeTextEl = document.getElementById("tts_mode_badge_text");
        if (modeTextEl) modeTextEl.textContent = isEdit ? "편집" : "신규";
    },

    updateCountUi(items = []) {
        const totalEl = document.getElementById("tts_count_badge");
        if (totalEl) totalEl.textContent = String(items.length);
    },

    async notifyChanged(action, payload = {}) {
        window.TtsDataCache?.clear?.();

        window.dispatchEvent(new CustomEvent("tts:list-changed", {
            detail: { action, ...payload }
        }));
        document.dispatchEvent(new CustomEvent("tts:list-changed", {
            detail: { action, ...payload }
        }));

        if (window.BroadcastModal?.loadTtsList) {
            await window.BroadcastModal.loadTtsList({ force: true });
        }
        if (window.refreshBroadcastTtsTemplates) {
            await window.refreshBroadcastTtsTemplates();
        }
    },

    renderList() {
        const el = this.els();
        const listEl = el.list;
        if (!listEl) return;

        const items = this.getFilteredItems();
        this.updateCountUi(items);

        if (items.length === 0) {
            listEl.innerHTML = `
            <div class="no-results">
                표시할 TTS가 없습니다.
            </div>
            `;
            return;
        }

        listEl.innerHTML = "";
        items.forEach(item => {
            const row = document.createElement("div");
            row.setAttribute("role", "button");
            row.tabIndex = 0;
            row.className = "speaker-item tts-item";
            if (String(item.ttsId) === String(this.state.selectedId)) {
                row.classList.add("selected");
            }

            const flag = item.ttsUseFlag ?? true;
            const safeName = this.escapeHtml(item.ttsName ?? "");
            const safeMsg = this.escapeHtml(item.ttsMsg ?? "");
            row.innerHTML = `
            <span class="status-dot ${flag ? "ok" : "off"}"></span>
                        <div class="speaker-info">
                            <div class="speaker-name">${safeName}</div>
                            <div class="speaker-loc">${safeMsg}</div>
                        </div>
            <div class="tts-flag ${flag ? "use" : "not-use"}">
                ${flag ? "Use" : "NotUse"}
            </div>
            `;

            const onSelect = () => {
                if (String(this.state.selectedId) === String(item.ttsId)) {
                    this.resetForm();
                } else {
                    this.selectItem(item.ttsId);
                }
            };

            row.addEventListener("click", onSelect);
            row.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect();
                }
            });
            listEl.appendChild(row);
        });
    },

    selectItem(id) {
        const item = (this.state.items ?? []).find(x => String(x.ttsId) === String(id));
        if (!item) return;

        this.state.selectedId = item.ttsId;
        this.state.mode = "edit";

        const el = this.els();
        if (el.id) el.id.value = String(item.ttsId ?? "");
        if (el.name) el.name.value = String(item.ttsName ?? "");
        if (el.useFlag) el.useFlag.value = String(item.ttsUseFlag ?? true);
        if (el.msg) el.msg.value = String(item.ttsMsg ?? "");

        this.updateUiMode();
        this.renderList();
    },

    resetForm() {
        this.state.selectedId = null;
        this.state.mode = "create";

        const el = this.els();
        if (el.id) el.id.value = "";
        if (el.name) el.name.value = "";
        if (el.useFlag) el.useFlag.value = "true";
        if (el.msg) el.msg.value = "";

        this.updateUiMode();
        this.renderList();
    },

    async save() {
        const el = this.els();
        const idVal = (el.id?.value ?? "").trim();
        const ttsName = (el.name?.value ?? "").trim();
        const ttsMsg = (el.msg?.value ?? "").trim();
        const ttsUseFlag = (el.useFlag?.value === "true");

        // Validation을 서버에서 안 쓰는 구성이라면, 프론트에서 최소 체크 권장
        if (!ttsName) {
            this.showStatus("TTS 이름을 입력하세요.", "warning");
            return;
        }
        if (!ttsMsg) {
            this.showStatus("TTS 메시지를 입력하세요.", "warning");
            return;
        }

        const payload = { ttsName, ttsMsg, ttsUseFlag };

        try {
            let saved;
            if (!idVal) saved = await TtsManageApi.create(payload);
            else saved = await TtsManageApi.update(idVal, payload);

            await this.loadList();

            // 정책에 따라 유지 or 해제
            this.resetForm(); // 요청대로: 저장 후 해제

            await this.notifyChanged(idVal ? "update" : "create", { item: saved });

            this.showStatus("저장되었습니다.", "success");
        } catch (e) {
            console.error(e);
            this.showStatus("저장에 실패했습니다.", "danger");
        }
    },

    async remove() {
        console.log("TTS 삭제");

        const el = this.els();
        const idVal = String((el.id?.value || this.state.selectedId || "")).trim();
        if (!idVal) {
            this.showStatus("삭제할 항목을 선택하세요.", "warning");
            return;
        }

        if (!await this.confirmStatus("선택한 TTS를 삭제하시겠습니까?", "danger")) return;

        try {
            await TtsManageApi.remove(idVal);

            this.state.items = (this.state.items ?? []).filter(item => String(item.ttsId) !== String(idVal));
            this.resetForm();
            await this.loadList();

            await this.notifyChanged("delete", { id: idVal });

            this.showStatus("삭제되었습니다.", "success");
        } catch (e) {
            console.error(e);
            this.showStatus("삭제에 실패했습니다.", "danger");
        }
    },

    // HTML escape (리스트 렌더링 안전)
    escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    },
};

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
    window.TtsManageModal?.init();
});
