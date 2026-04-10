(() => {
    const MENT_API_BASE = "/api/disaster";
    const PAGESIZE = 1000;

    let mentData = [];
    let currentPage = 1;
    let detailMode = "view"; // view | edit | create

    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    async function apiRequest(url, method, bodyObj) {
        const opt = {
            method,
            headers: { "Content-Type": "application/json" },
        };
        if (bodyObj !== undefined && bodyObj !== null) {
            opt.body = JSON.stringify(bodyObj);
        }

        const res = await fetch(url, opt);
        if (!res.ok) {
            const msg = await res.text().catch(() => "");
            throw new Error(`API 실패(${res.status}) ${msg}`);
        }

        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return res.json();
        return null;
    }

    function isDetailEditing() {
        return detailMode === "edit" || detailMode === "create";
    }

    function isMentMobileLayout() {
        return window.matchMedia("(max-width: 960px)").matches;
    }

    function getSelectedMentIds() {
        return Array.from(document.querySelectorAll('input[name="selectedIds"]:checked'))
            .map((cb) => String(cb.value));
    }

    function getSelectedMentId() {
        return getSelectedMentIds()[0] ?? null;
    }

    function findMentCheckboxByValue(value) {
        return Array.from(document.querySelectorAll('input[name="selectedIds"]'))
            .find((cb) => String(cb.value) === String(value)) ?? null;
    }

    function setDetailMode(mode) {
        detailMode = mode;

        const isEditing = isDetailEditing();
        document.getElementById("mentDetailViewMode")?.classList.toggle("d-none", isEditing);
        document.getElementById("mentDetailEditMode")?.classList.toggle("d-none", !isEditing);
        document.getElementById("mentDetailViewActions")?.classList.toggle("d-none", isEditing);
        document.getElementById("mentDetailEditActions")?.classList.toggle("d-none", !isEditing);

        const saveBtn = document.getElementById("mentDetailSaveBtn");
        if (saveBtn) {
            saveBtn.innerHTML = mode === "create"
                ? '<i class="bi bi-plus-lg"></i><span>추가</span>'
                : '<i class="bi bi-check-lg"></i><span>저장</span>';
        }

        syncMentMobileLayout();
    }

    function syncMentMobileLayout() {
        const layoutEl = document.querySelector(".ment-manager-layout");
        if (!layoutEl) return;

        const hasSelection = !!getSelectedMentId();
        const shouldOpenDetail = isDetailEditing() || hasSelection;
        layoutEl.classList.toggle("is-mobile-detail-open", isMentMobileLayout() && shouldOpenDetail);
    }

    function fillDetailEditForm(item) {
        const safeItem = item || {};
        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value ?? "";
        };

        setValue("mentDetailEditName", safeItem.name ?? "");
        setValue("mentDetailEditCode", safeItem.id ?? "");
        setValue("mentDetailEditPriority", safeItem.priority ?? "");
        setValue("mentDetailEditSirenCode", safeItem.sirenCode ?? "");
        setValue("mentDetailEditStoCode", safeItem.stoCode ?? "");
        setValue("mentDetailEditStatus", safeItem.useFlag ?? "Unuse");
        setValue("mentDetailEditMessage", safeItem.content ?? "");
    }

    function clearMentSelection() {
        document.querySelectorAll('input[name="selectedIds"]:checked')
            .forEach((cb) => {
                cb.checked = false;
            });
        setDetailMode("view");
        renderMentDetail(null);
        syncMentMobileLayout();
    }

    function updateMentCountText() {
        const el = document.getElementById("mentCount");
        if (!el) return;
        el.textContent = `총 ${mentData.length}개의 문안 | 문안 내용과 문안 정보를 관리하세요`;
    }

    function applyRowSelectionStyles() {
        const list = document.getElementById("mentList");
        if (!list) return;

        list.querySelectorAll(".ment-card").forEach((card) => {
            const cb = card.querySelector('input[name="selectedIds"]');
            card.classList.toggle("is-selected", !!cb?.checked);
        });

        if (detailMode !== "create") {
            renderMentDetail(getSelectedMentId());
        }

        syncMentMobileLayout();
    }

    function selectOnlyThisCheckbox(targetCb) {
        document.querySelectorAll('input[name="selectedIds"]').forEach((cb) => {
            cb.checked = cb === targetCb;
        });
        applyRowSelectionStyles();
    }

    function renderMentTable() {
        const list = document.getElementById("mentList");
        if (!list) return;

        const totalPages = Math.max(1, Math.ceil(mentData.length / PAGESIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGESIZE;
        const pageData = mentData.slice(start, start + PAGESIZE);

        if (pageData.length === 0) {
            list.innerHTML = `
            <div class="ment-empty-state">
                <div class="ment-detail-empty-icon"><i class="bi bi-inbox"></i></div>
                <strong>등록된 방송 멘트가 없습니다.</strong>
                <p class="mb-0">새 문안을 추가하면 이 목록에 바로 표시됩니다.</p>
            </div>`;

            if (detailMode !== "create") {
                renderMentDetail(null);
            }
            syncMentMobileLayout();
            return;
        }

        list.innerHTML = "";
        pageData.forEach((item, idx) => {
            const isUse = item.useFlag === "Use";
            const no = start + idx + 1;
            const card = document.createElement("article");
            card.className = "ment-card";
            card.innerHTML = `
            <label class="ment-card-select">
                <input type="checkbox" name="selectedIds" value="${escapeHtml(item.id)}">
            </label>
            <div class="ment-card-content">
                <div class="ment-card-top">
                    <span class="ment-card-title">${escapeHtml(item.name) || "-"}</span>
                    <span class="ment-card-code">${escapeHtml(item.id)}</span>
                </div>
                <div class="ment-card-preview">${escapeHtml(item.content) || "-"}</div>
            </div>
            <div class="ment-card-aside">
                <span class="status-badge ${isUse ? "status-success" : "status-primary"}">
                    ${isUse
                        ? `<i class="bi bi-check-circle-fill"></i><span>사용</span>`
                        : `<i class="bi bi-x-circle-fill"></i><span>미사용</span>`}
                </span>
                <span class="ment-card-no">${no}</span>
            </div>`;

            const cb = card.querySelector('input[name="selectedIds"]');
            cb.addEventListener("click", (e) => {
                e.stopPropagation();
                if (cb.checked) selectOnlyThisCheckbox(cb);
                else applyRowSelectionStyles();
            });

            card.addEventListener("click", () => {
                const willCheck = !cb.checked;
                if (willCheck) {
                    cb.checked = true;
                    selectOnlyThisCheckbox(cb);
                } else {
                    cb.checked = false;
                    applyRowSelectionStyles();
                }
            });

            list.appendChild(card);
        });

        applyRowSelectionStyles();
    }

    function renderMentDetail(selectedId) {
        const emptyEl = document.getElementById("mentDetailEmpty");
        const contentEl = document.getElementById("mentDetailContent");
        const nameEl = document.getElementById("mentDetailName");
        const codeEl = document.getElementById("mentDetailCode");
        const priorityEl = document.getElementById("mentDetailPriority");
        const sirenCodeEl = document.getElementById("mentDetailSirenCode");
        const stoCodeEl = document.getElementById("mentDetailStoCode");
        const statusEl = document.getElementById("mentDetailStatus");
        const lengthEl = document.getElementById("mentDetailLength");
        const messageEl = document.getElementById("mentDetailMessage");

        if (!emptyEl || !contentEl || !nameEl || !codeEl || !priorityEl || !sirenCodeEl || !stoCodeEl || !statusEl || !lengthEl || !messageEl) {
            return;
        }

        if (detailMode === "create") {
            emptyEl.classList.add("d-none");
            contentEl.classList.remove("d-none");
            setDetailMode("create");
            return;
        }

        const item = mentData.find((x) => String(x.id) === String(selectedId));
        if (!item) {
            emptyEl.classList.remove("d-none");
            contentEl.classList.add("d-none");
            setDetailMode("view");
            syncMentMobileLayout();
            return;
        }

        const isUse = item.useFlag === "Use";
        emptyEl.classList.add("d-none");
        contentEl.classList.remove("d-none");

        nameEl.textContent = item.name || "-";
        codeEl.textContent = item.id || "-";
        priorityEl.textContent = item.priority ?? "-";
        sirenCodeEl.textContent = item.sirenCode || "-";
        stoCodeEl.textContent = item.stoCode || "-";
        lengthEl.textContent = `${String(item.content || "").length}자`;
        messageEl.textContent = item.content || "-";
        statusEl.className = `status-badge ${isUse ? "status-success" : "status-primary"}`;
        statusEl.innerHTML = isUse
            ? `<i class="bi bi-check-circle-fill me-1 text-success"></i>사용`
            : `<i class="bi bi-x-circle-fill me-1 text-secondary"></i>미사용`;

        fillDetailEditForm(item);
        setDetailMode(detailMode === "edit" ? "edit" : "view");
        syncMentMobileLayout();
    }

    async function loadMentList() {
        const list = await apiRequest(MENT_API_BASE, "GET");

        mentData = (list || []).map((d) => ({
            id: d.dstCode,
            name: d.dstName ?? "",
            priority: d.dstPriority ?? null,
            sirenCode: d.dstSirenCode ?? "",
            stoCode: d.dstStoCode ?? "",
            content: d.dstStoreMsg ?? "",
            useFlag: d.dstUseFlag ?? "Unuse",
        }));

        currentPage = 1;
        renderMentTable();
        updateMentCountText();

        if (detailMode !== "create") {
            clearMentSelection();
        }
    }

    function validateMentCode(code) {
        if (!code || code.length > 5) {
            alert("코드는 1자 이상 5자 이하로 입력하세요.");
            return false;
        }
        return true;
    }

    window.mentInsert = function mentInsert() {
        document.querySelectorAll('input[name="selectedIds"]').forEach((cb) => {
            cb.checked = false;
        });
        fillDetailEditForm({
            id: "",
            name: "",
            priority: null,
            sirenCode: "",
            stoCode: "",
            content: "",
            useFlag: "Use",
        });
        setDetailMode("create");
        renderMentDetail(null);
        applyRowSelectionStyles();
    };

    window.mentUpdate = function mentUpdate() {
        const selectedId = getSelectedMentId();
        if (!selectedId) {
            alert("수정할 문안을 1개만 선택하세요.");
            return;
        }

        const item = mentData.find((x) => String(x.id) === String(selectedId));
        if (!item) {
            alert("수정할 문안 정보를 찾을 수 없습니다.");
            return;
        }

        fillDetailEditForm(item);
        setDetailMode("edit");
        renderMentDetail(selectedId);
    };

    window.mentDeprecated = async function mentDeprecated() {
        const ids = getSelectedMentIds();
        if (ids.length === 0) {
            alert("삭제할 문안을 선택하세요.");
            return;
        }

        if (!confirm(`선택한 ${ids.length}개 문안을 삭제할까요? (복구 불가)`)) return;

        try {
            await apiRequest(MENT_API_BASE, "DELETE", { ids });

            const idSet = new Set(ids.map(String));
            mentData = mentData.filter((x) => !idSet.has(String(x.id)));
            renderMentTable();
            clearMentSelection();
            updateMentCountText();
        } catch (e) {
            console.error(e);
            alert(`삭제 실패: ${e.message}`);
        }
    };

    async function onSaveMentModal() {
        const modalEl = document.getElementById("mentUpdateModal");
        const mode = modalEl.dataset.mode;

        const codeInput = document.getElementById("mentUpdateCode").value.trim();
        const idHidden = document.getElementById("mentUpdateId").value.trim();

        const name = document.getElementById("mentUpdateName").value.trim();
        const content = document.getElementById("mentUpdateContent").value.trim();
        const statusKor = document.getElementById("mentUpdateStatus").value;
        const useFlag = statusKor === "사용" ? "Use" : "Unuse";

        if (!validateMentCode(codeInput)) return;
        if (!name || !content) {
            alert("이름과 내용을 입력하세요.");
            return;
        }

        try {
            if (mode === "insert") {
                const created = await apiRequest(MENT_API_BASE, "POST", {
                    dstCode: codeInput,
                    dstName: name,
                    dstStoreMsg: content,
                    dstUseFlag: useFlag,
                });

                mentData.unshift({
                    id: created.dstCode,
                    name: created.dstName ?? name,
                    priority: created.dstPriority ?? null,
                    sirenCode: created.dstSirenCode ?? "",
                    stoCode: created.dstStoCode ?? "",
                    content: created.dstStoreMsg ?? content,
                    useFlag: created.dstUseFlag ?? useFlag,
                });
                currentPage = 1;
            } else {
                const dstCode = idHidden || codeInput;
                const updated = await apiRequest(`${MENT_API_BASE}/${encodeURIComponent(dstCode)}`, "PUT", {
                    dstCode: codeInput,
                    dstName: name,
                    dstStoreMsg: content,
                    dstUseFlag: useFlag,
                });

                const item = mentData.find((x) => String(x.id) === String(dstCode));
                if (!item) {
                    await loadMentList();
                    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
                    return;
                }

                item.id = updated.dstCode ?? codeInput;
                item.name = updated.dstName ?? name;
                item.priority = updated.dstPriority ?? item.priority ?? null;
                item.sirenCode = updated.dstSirenCode ?? item.sirenCode ?? "";
                item.stoCode = updated.dstStoCode ?? item.stoCode ?? "";
                item.content = updated.dstStoreMsg ?? content;
                item.useFlag = updated.dstUseFlag ?? useFlag;
            }

            renderMentTable();
            const selectedCode = mode === "insert" ? codeInput : codeInput;
            const targetCb = findMentCheckboxByValue(selectedCode);
            if (targetCb) {
                targetCb.checked = true;
                selectOnlyThisCheckbox(targetCb);
            } else {
                clearMentSelection();
            }
            updateMentCountText();
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        } catch (e) {
            console.error(e);
            alert(`저장 실패: ${e.message}`);
        }
    }

    async function onSaveMentDetail() {
        const selectedId = getSelectedMentId();
        if (detailMode !== "create" && !selectedId) {
            alert("수정할 문안을 선택하세요.");
            return;
        }

        const name = document.getElementById("mentDetailEditName")?.value.trim() ?? "";
        const nextCode = document.getElementById("mentDetailEditCode")?.value.trim() ?? "";
        const priorityRaw = document.getElementById("mentDetailEditPriority")?.value.trim() ?? "";
        const sirenCode = document.getElementById("mentDetailEditSirenCode")?.value.trim() ?? "";
        const stoCode = document.getElementById("mentDetailEditStoCode")?.value.trim() ?? "";
        const content = document.getElementById("mentDetailEditMessage")?.value.trim() ?? "";
        const useFlag = document.getElementById("mentDetailEditStatus")?.value ?? "Unuse";
        const priority = priorityRaw === "" ? null : Number(priorityRaw);

        if (!validateMentCode(nextCode)) return;
        if (priorityRaw !== "" && Number.isNaN(priority)) {
            alert("우선순위는 숫자만 입력하세요.");
            return;
        }
        if (!name || !content) {
            alert("이름과 내용을 입력하세요.");
            return;
        }

        try {
            const payload = {
                dstCode: nextCode,
                dstName: name,
                dstPriority: priority,
                dstSirenCode: sirenCode || null,
                dstStoCode: stoCode || null,
                dstStoreMsg: content,
                dstUseFlag: useFlag,
            };

            let saved;
            if (detailMode === "create") {
                saved = await apiRequest(MENT_API_BASE, "POST", payload);
                mentData.unshift({
                    id: saved.dstCode ?? nextCode,
                    name: saved.dstName ?? name,
                    priority: saved.dstPriority ?? priority,
                    sirenCode: saved.dstSirenCode ?? sirenCode,
                    stoCode: saved.dstStoCode ?? stoCode,
                    content: saved.dstStoreMsg ?? content,
                    useFlag: saved.dstUseFlag ?? useFlag,
                });
                currentPage = 1;
            } else {
                saved = await apiRequest(`${MENT_API_BASE}/${encodeURIComponent(selectedId)}`, "PUT", payload);
                const item = mentData.find((x) => String(x.id) === String(selectedId));
                if (!item) {
                    await loadMentList();
                    return;
                }

                item.id = saved.dstCode ?? nextCode;
                item.name = saved.dstName ?? name;
                item.priority = saved.dstPriority ?? priority;
                item.sirenCode = saved.dstSirenCode ?? sirenCode;
                item.stoCode = saved.dstStoCode ?? stoCode;
                item.content = saved.dstStoreMsg ?? content;
                item.useFlag = saved.dstUseFlag ?? useFlag;
            }

            setDetailMode("view");
            renderMentTable();

            const targetCb = findMentCheckboxByValue(saved.dstCode ?? nextCode);
            if (targetCb) {
                targetCb.checked = true;
                selectOnlyThisCheckbox(targetCb);
            } else {
                clearMentSelection();
            }

            updateMentCountText();
        } catch (e) {
            console.error(e);
            alert(`저장 실패: ${e.message}`);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadMentList().catch((err) => {
            console.error(err);
            alert(`목록 조회 실패: ${err.message}`);
        });

        document.getElementById("mentSaveUpdateBtn")
            ?.addEventListener("click", onSaveMentModal);
        document.getElementById("mentDetailSaveBtn")
            ?.addEventListener("click", onSaveMentDetail);
        document.getElementById("mentDetailCancelBtn")
            ?.addEventListener("click", () => {
                setDetailMode("view");
                renderMentDetail(getSelectedMentId());
            });
        document.getElementById("mentMobileBackBtn")
            ?.addEventListener("click", () => {
                clearMentSelection();
            });
        window.addEventListener("resize", syncMentMobileLayout);
    });
})();
