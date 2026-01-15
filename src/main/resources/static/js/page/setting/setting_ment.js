(() => {
    // ===============================
    // API 설정
    // ===============================
    const MENT_API_BASE = "/api/disaster";

    // 화면 데이터
    let mentData = [];

    // ===============================
    // 유틸
    // ===============================
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
            return null; // 204 등
    }

    function getSelectedMentIds() {
        return Array.from(document.querySelectorAll('input[name="selectedIds"]:checked'))
            .map(cb => String(cb.value));
    }

    function clearMentSelection() {
        document.querySelectorAll('input[name="selectedIds"]:checked')
            .forEach(cb => (cb.checked = false));
    }

    // ===============================
    // 카운트 표시 (HTML: id="mentCount")
    // ===============================
    function updateMentCountText() {
        const el = document.getElementById("mentCount");
        if (!el) return;
        el.textContent = `총 ${mentData.length}개의 문안 | 문안 내용과 문안 정보를 관리하세요`;
    }

    // ===============================
    // 목록 조회 / 렌더
    // ===============================
    async function loadMentList() {
        const list = await apiRequest(MENT_API_BASE, "GET");

        mentData = (list || []).map(d => ({
            id: d.dstCode,
            name: d.dstName ?? "",
            content: d.dstStoreMsg ?? "",
            useFlag: d.dstUseFlag ?? "Unuse", // "Use" / "Unuse"
        }));

        renderMentTable();
        updateMentCountText();
        clearMentSelection();
    }

    function applyRowSelectionStyles() {
        const tbody = document.getElementById("mentList");
        if (!tbody) return;
        
        tbody.querySelectorAll("tr").forEach(tr => {
            const cb = tr.querySelector('input[name="selectedIds"]');
            tr.classList.toggle("table-active", !!cb?.checked);
        });
        }
        
        function selectOnlyThisCheckbox(targetCb) {
        // 전체 해제 후 target만 체크
        document.querySelectorAll('input[name="selectedIds"]').forEach(cb => {
            cb.checked = (cb === targetCb);
        });
        applyRowSelectionStyles();
    }
        

    function renderMentTable() {
        const tbody = document.getElementById("mentList");
        if (!tbody) return;
    
        tbody.innerHTML = "";
    
        mentData.forEach((item, idx) => {
        const isUse = item.useFlag === "Use";
    
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
            <input type="checkbox"
                    name="selectedIds"
                    value="${escapeHtml(item.id)}"
                    data-name="${escapeHtml(item.name)}"
                    data-content="${escapeHtml(item.content)}"
                    data-useflag="${escapeHtml(item.useFlag)}">
            </td>
            <td>${idx + 1}</td>
            <td>${escapeHtml(item.name || "-")}</td>
            <td class="text-wrap">${escapeHtml(item.content || "-")}</td>
            <td>
            <span class="status-badge ${isUse ? "status-success" : "status-primary"}">
                ${
                isUse
                    ? `<i class="bi bi-check-circle-fill me-1 text-success"></i>사용중`
                    : `<i class="bi bi-x-circle-fill me-1 text-secondary"></i>미사용`
                }
            </span>
            </td>
        `;
    
        const cb = tr.querySelector('input[name="selectedIds"]');
    
        // 1) 체크박스 직접 클릭: 항상 1개만 선택되도록
        cb.addEventListener("click", (e) => {
            e.stopPropagation();
            // 토글 허용 여부: 요구사항이 "1개씩만 선택"이므로
            // 체크 해제는 허용하되, 체크할 때는 단일 선택 강제
            if (cb.checked) {
            selectOnlyThisCheckbox(cb);
            } else {
            applyRowSelectionStyles();
            }
        });
    
        // 2) 행 클릭: 체크 ON + 단일 선택 강제
        tr.addEventListener("click", () => {
            cb.checked = true;
            selectOnlyThisCheckbox(cb);
        });
    
        tbody.appendChild(tr);
        });
    
        // 렌더 후 선택 스타일 반영
        applyRowSelectionStyles();
    }
    

    // ===============================
    // 버튼 이벤트 (HTML에서 onclick으로 호출됨)
    // ===============================
    window.mentInsert = function mentInsert() {
        // insert 모드: hidden id 비움
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
    
        const code = cb.value; // ✅ dstCode
        const name = cb.dataset.name || "";
        const content = cb.dataset.content || "";
        const useFlag = cb.dataset.useflag || "Unuse";
    
        // hidden (update용)
        document.getElementById("mentUpdateId").value = code;
    
        // 화면 표시용 코드 (수정 불가)
        document.getElementById("mentUpdateCode").value = code;
        document.getElementById("mentUpdateCode").readOnly = true;
    
        document.getElementById("mentUpdateName").value = name;
        document.getElementById("mentUpdateContent").value = content;
        document.getElementById("mentUpdateStatus").value =
            (useFlag === "Use") ? "사용" : "미사용";
    
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
            // ✅ Hard Delete
            await apiRequest(`${MENT_API_BASE}`, "DELETE", { ids });
        
            // 로컬에서도 제거
            const idSet = new Set(ids.map(String));
            mentData = mentData.filter(x => !idSet.has(String(x.id)));
        
            renderMentTable();
            updateMentCountText();
            clearMentSelection();
    
        } catch (e) {
            console.error(e);
            alert(`삭제 실패: ${e.message}`);
        }
    };
    

    // ===============================
    // 모달 저장 버튼 이벤트 (HTML: id="mentSaveUpdateBtn")
    // ===============================
    async function onSaveMentModal() {
        const modalEl = document.getElementById("mentUpdateModal");
        const mode = modalEl.dataset.mode;
    
        const codeInput = document.getElementById("mentUpdateCode").value.trim(); // ✅ 추가
        const idHidden = document.getElementById("mentUpdateId").value.trim();   // update용
    
        const name = document.getElementById("mentUpdateName").value.trim();
        const content = document.getElementById("mentUpdateContent").value.trim();
        const statusKor = document.getElementById("mentUpdateStatus").value;
    
        const useFlag = (statusKor === "사용") ? "Use" : "Unuse";
    
        // 검증
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
                // ✅ dstCode 포함
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
        
            } else {
                // update
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
        
                const item = mentData.find(x => String(x.id) === String(dstCode));
                if (!item) {
                await loadMentList();
                } else {
                item.name = updated.dstName ?? name;
                item.content = updated.dstStoreMsg ?? content;
                item.useFlag = updated.dstUseFlag ?? useFlag;
                }
            }
        
            renderMentTable();
            updateMentCountText();
            clearMentSelection();
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        
        } catch (e) {
            console.error(e);
            alert(`저장 실패: ${e.message}`);
        }
    }
    

    // ===============================
    // 초기화
    // ===============================
    document.addEventListener("DOMContentLoaded", () => {
        // 목록 로딩
        loadMentList().catch(err => {
            console.error(err);
            alert(`목록 조회 실패: ${err.message}`);
        });

        // 모달 저장 버튼 이벤트 연결 (필수)
        document.getElementById("mentSaveUpdateBtn")
            ?.addEventListener("click", onSaveMentModal);
        });
})();