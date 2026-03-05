(() => {
    const MENT_API_BASE = "/api/disaster";
    const PAGESIZE = 10;

    let mentData = [];
    let currentPage = 1;

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

    function getSelectedMentIds() {
        return Array.from(document.querySelectorAll('input[name="selectedIds"]:checked'))
            .map((cb) => String(cb.value));
    }

    function clearMentSelection() {
        document.querySelectorAll('input[name="selectedIds"]:checked')
            .forEach((cb) => {
                cb.checked = false;
            });
    }

    function updateMentCountText() {
        const el = document.getElementById("mentCount");
        if (!el) return;
        el.textContent = `총 ${mentData.length}개의 문안 | 문안 내용과 문안 정보를 관리하세요`;
    }

    async function loadMentList() {
        const list = await apiRequest(MENT_API_BASE, "GET");

        mentData = (list || []).map((d) => ({
            id: d.dstCode,
            name: d.dstName ?? "",
            content: d.dstStoreMsg ?? "",
            useFlag: d.dstUseFlag ?? "Unuse",
        }));

        currentPage = 1;
        renderMentTable();
        updateMentCountText();
        clearMentSelection();
    }

    function applyRowSelectionStyles() {
        const tbody = document.getElementById("mentList");
        if (!tbody) return;

        tbody.querySelectorAll("tr").forEach((tr) => {
            const cb = tr.querySelector('input[name="selectedIds"]');
            tr.classList.toggle("table-active", !!cb?.checked);
        });
    }

    function selectOnlyThisCheckbox(targetCb) {
        document.querySelectorAll('input[name="selectedIds"]').forEach((cb) => {
            cb.checked = cb === targetCb;
        });
        applyRowSelectionStyles();
    }

    function renderMentTable() {
        const tbody = document.getElementById('mentList');
        if (!tbody) return;

        const totalPages = Math.max(1, Math.ceil(mentData.length / PAGESIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGESIZE;
        const pageData = mentData.slice(start, start + PAGESIZE);

        if (pageData.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="5" style="height:60vh;">
                    <div class="d-flex align-items-center justify-content-center h-100">
                        <span class="text-muted"><i class="bi bi-inbox me-2"></i>등록된 방송 멘트가 없습니다.</span>
                    </div>
                </td>
            </tr>`;

            // 빈 상태에서도 페이지네이션 렌더 (비활성 상태로)
            window.App.utils.renderPagination({
                containerId: 'mentPagination',
                currentPage: currentPage,
                totalItems: mentData.length,
                itemsPerPage: PAGESIZE,
                onPageChange: (p) => {
                    currentPage = p;
                    clearMentSelection();
                    renderMentTable();
                },
            });
            return;
        }

        tbody.innerHTML = '';
        pageData.forEach((item, idx) => {
            const isUse = item.useFlag === 'Use';
            const no = start + idx + 1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td><input type="checkbox" name="selectedIds" value="${escapeHtml(item.id)}"
                data-name="${escapeHtml(item.name)}"
                data-content="${escapeHtml(item.content)}"
                data-useflag="${escapeHtml(item.useFlag)}">
            </td>
            <td>${no}</td>
            <td>${escapeHtml(item.name) || '-'}</td>
            <td class="text-wrap">${escapeHtml(item.content) || '-'}</td>
            <td>
                <span class="status-badge ${isUse ? 'status-success' : 'status-primary'}">
                    ${isUse
                    ? `<i class="bi bi-check-circle-fill me-1 text-success"></i>사용`
                    : `<i class="bi bi-x-circle-fill me-1 text-secondary"></i>미사용`}
                </span>
            </td>`;

            const cb = tr.querySelector('input[name="selectedIds"]');
            cb.addEventListener('click', (e) => {
                e.stopPropagation();
                if (cb.checked) selectOnlyThisCheckbox(cb);
                else applyRowSelectionStyles();
            });
            tr.addEventListener('click', () => {
                const willCheck = !cb.checked;
                if (willCheck) { cb.checked = true; selectOnlyThisCheckbox(cb); }
                else { cb.checked = false; applyRowSelectionStyles(); }
            });

            tbody.appendChild(tr);
        });

        applyRowSelectionStyles();

        // ✅ 공통 페이지네이션
        window.App.utils.renderPagination({
            containerId: 'mentPagination',
            currentPage: currentPage,
            totalItems: mentData.length,
            itemsPerPage: PAGESIZE,
            onPageChange: (p) => {
                currentPage = p;
                clearMentSelection();
                renderMentTable();
            },
        });
    }

    window.mentInsert = function mentInsert() {
        document.getElementById("mentUpdateId").value = "";
        document.getElementById("mentUpdateName").value = "";
        document.getElementById("mentUpdateCode").value = "";
        document.getElementById("mentUpdateCode").readOnly = false;
        document.getElementById("mentUpdateContent").value = "";
        document.getElementById("mentUpdateStatus").value = "사용";

        const modalEl = document.getElementById("mentUpdateModal");
        modalEl.dataset.mode = "insert";

        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    };

    window.mentUpdate = function mentUpdate() {
        const checked = document.querySelectorAll('input[name="selectedIds"]:checked');
        if (checked.length !== 1) {
            alert("수정할 문안을 1개만 선택하세요.");
            return;
        }

        const cb = checked[0];

        const code = cb.value;
        const name = cb.dataset.name || "";
        const content = cb.dataset.content || "";
        const useFlag = cb.dataset.useflag || "Unuse";

        document.getElementById("mentUpdateId").value = code;
        document.getElementById("mentUpdateCode").value = code;
        document.getElementById("mentUpdateCode").readOnly = true;
        document.getElementById("mentUpdateName").value = name;
        document.getElementById("mentUpdateContent").value = content;
        document.getElementById("mentUpdateStatus").value = useFlag === "Use" ? "사용" : "미사용";

        const modalEl = document.getElementById("mentUpdateModal");
        modalEl.dataset.mode = "update";

        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    };

    window.mentDeprecated = async function mentDeprecated() {
        const ids = getSelectedMentIds();
        if (ids.length === 0) {
            alert("삭제할 문안을 선택하세요.");
            return;
        }

        if (!confirm(`선택한 ${ids.length}개 문안을 삭제할까요? (복구 불가)`)) return;

        try {
            await apiRequest(`${MENT_API_BASE}`, "DELETE", { ids });

            const idSet = new Set(ids.map(String));
            mentData = mentData.filter((x) => !idSet.has(String(x.id)));
            clearMentSelection();
            renderMentTable();
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

        if (!/^\d{3}$/.test(codeInput)) {
            alert("코드는 3자리 숫자여야 합니다. 예: 001");
            return;
        }
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
                    content: created.dstStoreMsg ?? content,
                    useFlag: created.dstUseFlag ?? useFlag,
                });
                currentPage = 1;
            } else {
                const dstCode = idHidden || codeInput;
                if (!dstCode) {
                    alert("수정 대상 코드(dstCode)가 없습니다.");
                    return;
                }

                const updated = await apiRequest(`${MENT_API_BASE}/${encodeURIComponent(dstCode)}`, "PUT", {
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
                item.name = updated.dstName ?? name;
                item.content = updated.dstStoreMsg ?? content;
                item.useFlag = updated.dstUseFlag ?? useFlag;
            }

            clearMentSelection();
            renderMentTable();
            updateMentCountText();
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
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
    });
})();
