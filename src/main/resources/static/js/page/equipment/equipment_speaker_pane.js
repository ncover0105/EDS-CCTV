/**
 * equipment_speaker_pane.js
 * ---------------------------------------------------------
 * - equipment-speaker-pane(fragment) 전용 스피커 관리 로직
 * - 기존 equipment_speaker.js 기반으로 기능 동일(목록/검색/페이지네이션/CRUD/상태요청)
 * - Pane 전환 구조(.eq-pane.is-active)에서 "활성화될 때만" 초기화/로딩
 */

(function () {
    "use strict";

    const PANE_ID = "equipment-speaker-pane";

    // ===== API (equipment_speaker.js와 동일) =====
    const SPEAKER_LIST_API = "/api/btype/query/config/speakers";
    const SPEAKER_STATUS_API = (speakerKey) => `/api/btype/query/status/${encodeURIComponent(speakerKey)}`;

    const SPEAKER_BASE_API = "/api/btype/query/config/speaker";
    const SPEAKER_CREATE_API = SPEAKER_BASE_API; // POST
    const SPEAKER_UPDATE_API = (speakerKey) => `${SPEAKER_BASE_API}/${speakerKey}`; // PUT
    const SPEAKER_DELETE_API = (speakerKey) => `${SPEAKER_BASE_API}/${speakerKey}`; // DELETE

    const SPEAKER_ACTION_API = "/api/btype/command/action";

    // 페이지네이션(기본값) - 실제 rows는 wrap 높이로 동적 계산
    const SPEAKER_ITEMS_PER_PAGE = 1000; // 스크롤 동작을 위해 한 화면 조회수 확대
    const API_BASE = window.location.origin;

    // ===== State =====
    let speakerListState = [];
    let speakerPageState = {
        currentPage: 1,
        itemsPerPage: SPEAKER_ITEMS_PER_PAGE,
        viewList: []
    };

    let currentFilter = "all";
    let currentSearch = "";

    let isInitialized = false;
    let resizeDebounceTimer = null;

    // ===== DOM scope helpers =====
    function paneRoot() {
        return document.getElementById(PANE_ID);
    }

    function s$(selector) {
        const root = paneRoot();
        return root ? root.querySelector(selector) : null;
    }

    function ss$(selector) {
        const root = paneRoot();
        return root ? root.querySelectorAll(selector) : [];
    }

    function isPaneActive() {
        return !!paneRoot()?.classList.contains("is-active");
    }

    // ===== Utils (equipment_speaker.js 기반) =====
    function safe(v, empty = "-") {
        if (v === null || v === undefined) return empty;
        const s = String(v).trim();
        return s.length ? s : empty;
    }

    function fmtDateTime(dt) {
        if (!dt) return "-";
        const s = String(dt).replace("T", " ");
        return s.length >= 19 ? s.substring(0, 19) : s;
    }

    function connectBadge(connectStatus) {
        // connectStatus: 0 정상, 1 이상, null 미수신
        if (connectStatus === 0) {
            return `<span class="status-badge status-success bg-transparent">
                <i class="bi bi-check-circle-fill me-1"></i>정상
              </span>`;
        }
        if (connectStatus === 1) {
            return `<span class="status-badge status-error bg-transparent">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>이상
              </span>`;
        }
        return `<span class="status-badge status-primary bg-transparent">미수신</span>`;
    }

    function alertMsg(msg, type) {
        if (window.App?.utils?.showGlobalAlert) {
            window.App.utils.showGlobalAlert(msg, type);
        } else {
            console.log(`[${type}] ${msg}`);
        }
    }

    function extractApiErrorMessage(rawText, fallback) {
        const text = String(rawText ?? "").trim();
        if (!text) return fallback;
        try {
            const parsed = JSON.parse(text);
            if (parsed?.message) return parsed.message;
        } catch (_) { }
        return text;
    }

    // ===== Pagination helpers =====
    function getTotalPages(totalItems, perPage) {
        const t = Math.max(0, Number(totalItems) || 0);
        const p = Math.max(1, Number(perPage) || 10);
        return Math.max(1, Math.ceil(t / p));
    }

    function clampPage(page, totalPages) {
        const p = Number(page) || 1;
        return Math.min(Math.max(1, p), totalPages);
    }

    function setViewList(list, { resetPage = false } = {}) {
        speakerPageState.viewList = Array.isArray(list) ? list : [];
        const totalPages = getTotalPages(speakerPageState.viewList.length, speakerPageState.itemsPerPage);
        speakerPageState.currentPage = resetPage ? 1 : clampPage(speakerPageState.currentPage, totalPages);
    }

    // ===== Selection helper (Pane 내부에서만) =====
    function getSelectedSpeakerCheckbox() {
        return s$('input[name="selectedIds"]:checked');
    }

    // ===== API calls =====
    async function fetchSpeakerList() {
        const res = await fetch(SPEAKER_LIST_API, { headers: { "Accept": "application/json" } });
        if (!res.ok) throw new Error(`list api failed: ${res.status}`);
        const data = await res.json();
        speakerListState = Array.isArray(data) ? data : [];
        return speakerListState;
    }

    async function fetchSpeakerStatus(speakerKey) {
        const url = `${API_BASE}${SPEAKER_STATUS_API(speakerKey)}`;
        const res = await fetch(url);
        if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${t}`);
        }
        return await res.json();
    }

    async function postSpeakerAction({ speakerIds, action, extraParam = "", password = "" }) {
        const res = await fetch(SPEAKER_ACTION_API, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ speakerIds, action, extraParam, password })
        });

        if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(extractApiErrorMessage(t, `action failed: ${res.status}`));
        }

        return await res.json().catch(() => ({}));
    }

    // ===== Search =====
    function normalizeText(v) {
        return String(v ?? "").trim().toLowerCase();
    }

    function applySpeakerSearch(query) {
        currentSearch = normalizeText(query);
        applyFilter();
    }

    function applyFilter() {
        const q = currentSearch;
        const f = currentFilter;

        let filtered = speakerListState || [];

        // 1. 상태 필터
        if (f !== "all") {
            filtered = filtered.filter(x => {
                if (f === "ok") return x.connectStatus === 0;
                if (f === "bad" || f === "warn") return x.connectStatus === 1; // 1을 오류/점검중으로 임시 매핑
                if (f === "unknown") return x.connectStatus === null || x.connectStatus === undefined;
                return true;
            });
        }

        // 2. 검색 필터
        if (q) {
            filtered = filtered.filter(x => {
                const speakerId = normalizeText(x?.speakerId);
                const speakerName = normalizeText(x?.speakerName);
                const locationName = normalizeText(x?.locationName);
                const cdmaNumber = normalizeText(x?.cdmaNumber);
                const speakerKey = normalizeText(x?.speakerKey);
                return (
                    speakerId.includes(q) ||
                    speakerName.includes(q) ||
                    locationName.includes(q) ||
                    cdmaNumber.includes(q) ||
                    speakerKey.includes(q)
                );
            });
        }

        setViewList(filtered, { resetPage: true });
        renderSpeakerTable(1);
    }

    function updateStats() {
        const total = speakerListState.length;
        const ok = speakerListState.filter(x => x.connectStatus === 0).length;
        const bad = speakerListState.filter(x => x.connectStatus === 1).length;
        const unk = speakerListState.filter(x => x.connectStatus === null || x.connectStatus === undefined).length;

        // Status bar
        const setText = (id, v) => { const el = s$("#" + id); if (el) el.innerText = v; };
        setText("speakerStatTotal", total);
        setText("speakerStatOk", ok);
        setText("speakerStatUnk", unk);

        // Subtitle count
        const cntText = s$("#speakerCountValue");
        if (cntText) cntText.innerText = total;

    }

    function bindSpeakerSearchUI() {
        const input = s$("#speakerSearchInput");
        if (input && !input.dataset.bound) {
            input.addEventListener("input", () => applySpeakerSearch(input.value));
            input.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    input.value = "";
                    applySpeakerSearch("");
                }
            });
            input.dataset.bound = "1";
        }
    }

    function bindSpeakerFilterUI() {
        const filterWrap = s$(".speaker-filters");
        if (filterWrap && !filterWrap.dataset.bound) {
            filterWrap.addEventListener("click", (e) => {
                const btn = e.target.closest(".chip[data-filter]");
                if (!btn || !filterWrap.contains(btn)) return;

                const filter = btn.dataset.filter || "all";
                window.filterSpeakers(filter, btn);
            });
            filterWrap.dataset.bound = "1";
        }
    }

    function syncSpeakerFilterUI() {
        ss$(".speaker-filters .chip").forEach(chip => {
            chip.classList.toggle("is-active", (chip.dataset.filter || "all") === currentFilter);
        });
    }

    function resetSpeakerFilterState() {
        currentFilter = "all";
        currentSearch = "";

        const input = s$("#speakerSearchInput");
        if (input) input.value = "";

        syncSpeakerFilterUI();
    }

    function bindCrudButtons() {
        const addBtns = ss$("#speakerAddBtn");
        const updateBtn = s$("#speakerUpdateBtn");
        const deleteBtn = s$("#speakerDeleteBtn");

        addBtns.forEach((btn) => {
            if (!btn.dataset.bound) {
                btn.addEventListener("click", speakerAdd);
                btn.dataset.bound = "1";
            }
        });
        if (updateBtn && !updateBtn.dataset.bound) {
            updateBtn.addEventListener("click", speakerUpdate);
            updateBtn.dataset.bound = "1";
        }
        if (deleteBtn && !deleteBtn.dataset.bound) {
            deleteBtn.addEventListener("click", speakerDeleted);
            deleteBtn.dataset.bound = "1";
        }
    }

    // ===== Dynamic rows 계산 =====
    // function calculateSpeakerPageSize() {
    //     const wrap = s$(".speaker-table-wrap") || s$(".table-container");
    //     const tbody = s$("#speakerTableBody");
    //     if (!wrap || !tbody) return SPEAKER_ITEMS_PER_PAGE;

    //     const wrapHeight = wrap.clientHeight;
    //     const thead = wrap.querySelector("thead");
    //     const headHeight = thead ? thead.getBoundingClientRect().height : 45;

    //     const sampleRow = tbody.querySelector("tr:not(.table-empty-row)");
    //     let rowHeight = 40;
    //     if (sampleRow) rowHeight = sampleRow.getBoundingClientRect().height;

    //     const availableHeight = wrapHeight - headHeight - 60; // footer 여유
    //     const calculatedRows = Math.floor(availableHeight / rowHeight);

    //     return Math.max(5, Math.min(calculatedRows > 0 ? calculatedRows : SPEAKER_ITEMS_PER_PAGE, 30));
    // }

    // ===== Detail panel =====
    function resetDetail() {
        const titleEl = s$("#selectedSpeakerTitle");
        const adrEl = s$("#selectedSpeakeraddress");
        const lastEl = s$("#selectedSpeakerLastUpdate");

        if (titleEl) titleEl.innerText = "스피커를 선택하세요";
        if (adrEl) adrEl.innerText = "-";
        if (lastEl) lastEl.innerText = "-";

        [
            "connectionStatus",
            "acStatus",
            "dcStatus",
            "batteryStatus",
            "solarChargerStatus",
            "lteAntennaStatus",
            "cpuTemperature",
            "mcuVersion"
        ].forEach(id => {
            const el = s$("#" + id);
            if (!el) return;
            el.innerText = "-";
            el.classList.remove("text-success", "text-danger", "text-warning", "text-muted", "text-primary", "fw-semibold");
            el.classList.add("text-muted");
        });
    }

    // ===== Render table =====
    function renderSpeakerTable(page = speakerPageState.currentPage) {
        const tbody = s$("#speakerTableBody");
        if (!tbody) return;

        // Pane 비활성 상태면 렌더 불필요
        if (!isPaneActive()) return;

        // 동적 페이지 사이즈 반영
        // speakerPageState.itemsPerPage = calculateSpeakerPageSize();
        speakerPageState.itemsPerPage = SPEAKER_ITEMS_PER_PAGE;

        const list = Array.isArray(speakerPageState.viewList) && speakerPageState.viewList.length
            ? speakerPageState.viewList
            : (speakerListState || []);

        const totalItems = list.length;
        const totalPages = getTotalPages(totalItems, speakerPageState.itemsPerPage);
        speakerPageState.currentPage = clampPage(page, totalPages);

        const start = (speakerPageState.currentPage - 1) * speakerPageState.itemsPerPage;
        const end = start + speakerPageState.itemsPerPage;
        const pageList = list.slice(start, end);

        tbody.innerHTML = "";

        if (!pageList || pageList.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-muted py-4">
            등록된 스피커가 없습니다.
          </td>
        </tr>`;
            const cnt0 = s$("#speakerCountValue");
            if (cnt0) cnt0.innerText = "0";

            /* 페이지네이션 동작 주석 처리
            if (window.App?.utils?.renderPagination) {
                window.App.utils.renderPagination({
                    containerId: "speakerPagination",
                    currentPage: 1,
                    totalItems: 0,
                    itemsPerPage: speakerPageState.itemsPerPage,
                    onPageChange: (p) => {
                        speakerPageState.currentPage = p;
                        resetDetail();
                        renderSpeakerTable(p);
                    }
                });
            }
            */
            return;
        }

        pageList.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>
          <input type="checkbox"
            name="selectedIds"
            value="${safe(item.speakerKey, "")}"
            data-key="${safe(item.speakerKey, "")}"
            data-id="${safe(item.speakerId, "")}"
            data-name="${safe(item.speakerName, "")}"
            data-adr="${safe(item.speakerAdr, "-")}">
        </td>
        <td>${safe(item.speakerId)}</td>
        <td>${safe(item.speakerName)}</td>
        <td data-col="connect">${connectBadge(item.connectStatus)}</td>
        <td data-col="receive">${fmtDateTime(item.receiveTime)}</td>
        <td>${safe(item.cdmaNumber)}</td>
        <td>${safe(item.locationName)}</td>
        <td>${safe(item.speakerLatitude)}</td>
        <td>${safe(item.speakerLongitude)}</td>
      `;

            tr.addEventListener("click", (e) => {
                const cb = tr.querySelector('input[type="checkbox"]');
                if (!cb) return;

                // 단일 선택 유지
                if (e.target && e.target.type === "checkbox") {
                    ss$('input[name="selectedIds"]').forEach(x => { if (x !== cb) x.checked = false; });
                } else {
                    const was = cb.checked;
                    ss$('input[name="selectedIds"]').forEach(x => x.checked = false);
                    cb.checked = !was;
                }

                if (!cb.checked) {
                    resetDetail();
                    return;
                }

                const titleEl = s$("#selectedSpeakerTitle");
                const adrEl = s$("#selectedSpeakeraddress");
                const lastEl = s$("#selectedSpeakerLastUpdate");

                if (titleEl) titleEl.innerText = safe(cb.dataset.name);
                if (adrEl) adrEl.innerText = safe(cb.dataset.adr);
                if (lastEl) lastEl.innerText = "-";
            });

            tbody.appendChild(tr);
        });

        // ghost rows (레이아웃 안정화)
        // const missing = Math.max(0, speakerPageState.itemsPerPage - pageList.length);
        // if (missing > 0) {
        //     const colCount = 9;
        //     const ghostCell = `<td><span class="row-ghost">-</span></td>`;
        //     const rowHtml = ghostCell.repeat(colCount);
        //     for (let i = 0; i < missing; i++) {
        //         const emptyTr = document.createElement("tr");
        //         emptyTr.className = "table-empty-row";
        //         emptyTr.innerHTML = rowHtml;
        //         tbody.appendChild(emptyTr);
        //     }
        // }

        const cnt = s$("#speakerCountValue");
        if (cnt) cnt.innerText = String(totalItems);

        /* 페이지네이션 동작 주석 처리
        if (window.App?.utils?.renderPagination) {
            window.App.utils.renderPagination({
                containerId: "speakerPagination",
                currentPage: speakerPageState.currentPage,
                totalItems,
                itemsPerPage: speakerPageState.itemsPerPage,
                onPageChange: (p) => {
                    speakerPageState.currentPage = p;
                    resetDetail();
                    renderSpeakerTable(p);
                }
            });
        }
        */
    }

    // ===== Refresh =====
    async function refreshSpeakerListAndRender({ preserveSelection = true } = {}) {
        let selectedKey = null;
        if (preserveSelection) {
            const checked = getSelectedSpeakerCheckbox();
            if (checked) selectedKey = checked.value;
        }

        await fetchSpeakerList();
        updateStats();

        const searchInput = s$("#speakerSearchInput");
        const q = searchInput ? searchInput.value : "";
        currentSearch = normalizeText(q);

        applyFilter();

        if (selectedKey) {
            const cb = s$(`input[name="selectedIds"][value="${CSS.escape(String(selectedKey))}"]`);
            if (cb) cb.checked = true;
        }
    }

    // ===== Button click helper (HTML onclick 호환) =====
    function handleButtonClick(_btn, actionFn) {
        const checked = getSelectedSpeakerCheckbox();
        if (!checked) {
            resetDetail();
            alertMsg("스피커를 선택해주세요.", "warning");
            return;
        }
        actionFn(checked);
    }

    // ===== Actions =====
    async function requestStatus(selectedCheckbox) {
        const speakerKey = selectedCheckbox.dataset.key || selectedCheckbox.value;
        const speakerId = selectedCheckbox.dataset.id;
        const speakerName = selectedCheckbox.dataset.name;
        const speakerAdr = selectedCheckbox.dataset.adr;

        const password = prompt("비밀번호를 입력하세요.");
        if (password === null) return; // 취소 시 중단

        let actionSuccess = true;
        try {
            await postSpeakerAction({ speakerIds: [speakerId], action: "status", password });
        } catch (e) {
            console.error(e);
            actionSuccess = false;
        }

        try {
            const data = await fetchSpeakerStatus(speakerKey);
            if (!data) {
                resetDetail();
                alertMsg(actionSuccess ? "해당 스피커 최근 상태 정보 없음." : "요청 실패 및 상태 정보 없음.", actionSuccess ? "info" : "danger");
                return;
            }

            const titleEl = s$("#selectedSpeakerTitle");
            const adrEl = s$("#selectedSpeakeraddress");
            const lastEl = s$("#selectedSpeakerLastUpdate");

            if (titleEl) titleEl.innerText = safe(speakerName);
            if (adrEl) adrEl.innerText = safe(speakerAdr);
            if (lastEl) lastEl.innerText = fmtDateTime(data.receiveTime);

            const set = (id, v) => {
                const el = s$("#" + id);
                if (!el) return;
                el.innerText = safe(v);
                el.classList.remove("text-success", "text-danger", "text-warning", "text-muted", "text-primary", "fw-semibold");
                const t = String(v ?? "").trim();
                if (!t || t === "-") el.classList.add("text-muted");
                else if (t.includes("정상") || t.includes("연결")) el.classList.add("text-success", "fw-semibold");
                else if (t.includes("이상") || t.includes("미연결") || t.includes("실패")) el.classList.add("text-danger", "fw-semibold");
                else el.classList.add("text-primary", "fw-semibold");
            };

            set("connectionStatus", data.connectionStatus);
            set("acStatus", data.acStatus);
            set("dcStatus", data.dcStatus);
            set("batteryStatus", data.batteryStatus);
            set("solarChargerStatus", data.solarChargerStatus);
            set("lteAntennaStatus", data.lteAntennaStatus);
            set("cpuTemperature", data.cpuTemperature);
            set("mcuVersion", data.mcuVersion);

            // 테이블 row 즉시 갱신(선택된 행 기준)
            const row = selectedCheckbox.closest("tr");
            if (row) {
                const receiveTd = row.querySelector('[data-col="receive"]');
                if (receiveTd) receiveTd.innerText = fmtDateTime(data.receiveTime);

                const connectTd = row.querySelector('[data-col="connect"]');
                if (connectTd) {
                    const ok = String(data.connectionStatus || "").includes("정상") || String(data.connectionStatus || "").includes("연결");
                    connectTd.innerHTML = ok
                        ? `<span class="status-badge status-success bg-transparent"><i class="bi bi-check-circle-fill me-1"></i>정상</span>`
                        : `<span class="status-badge status-error bg-transparent"><i class="bi bi-exclamation-triangle-fill me-1"></i>이상</span>`;
                }
            }

            if (actionSuccess) {
                alertMsg("스피커 상태 조회가 완료되었습니다.", "success");
            } else {
                alertMsg("상태 요청(발신)에는 실패했으나 최근 정보를 표시합니다.", "warning");
            }
        } catch (e) {
            console.error(e);
            resetDetail();
            alertMsg("스피커 최근 상태 조회 실패", "danger");
        }
    }

    async function setTime(selectedCheckbox) {
        const speakerId = selectedCheckbox.dataset.id;

        const password = prompt("비밀번호를 입력하세요.");
        if (password === null) return; // 취소 시 중단

        try {
            await postSpeakerAction({ speakerIds: [speakerId], action: "time", password });
            alertMsg("시간 동기화(발신) 요청을 전송했습니다.", "success");
        } catch (e) {
            console.error(e);
            alertMsg(e?.message || "시간 동기화 요청 실패", "danger");
        }
    }

    async function resetRequest(selectedCheckbox) {
        const speakerId = selectedCheckbox.dataset.id;

        const password = prompt("비밀번호를 입력하세요.");
        if (password === null) return; // 취소 시 중단

        try {
            await postSpeakerAction({ speakerIds: [speakerId], action: "reset", password });
            alertMsg("리셋(발신) 요청을 전송했습니다.", "success");
        } catch (e) {
            console.error(e);
            alertMsg(e?.message || "리셋(발신) 요청 실패", "danger");
        }
    }

    // ===== Modals (pane 밖에 있을 수 있어 document 기준) =====
    function openModal(modalId) {
        const el = document.getElementById(modalId);
        if (!el) {
            alertMsg(`모달(${modalId})을 찾지 못했습니다.`, "warning");
            return null;
        }
        const m = bootstrap.Modal.getOrCreateInstance(el);
        m.show();
        return m;
    }

    function closeModal(modalId) {
        const el = document.getElementById(modalId);
        if (!el) return;
        const m = bootstrap.Modal.getInstance(el);
        if (m) m.hide();
    }

    function setVal(id, v) {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = (v === null || v === undefined) ? "" : String(v);
    }
    function getVal(id) {
        const el = document.getElementById(id);
        return el ? String(el.value ?? "").trim() : "";
    }

    // ===== CRUD =====
    function speakerAdd() {
        setVal("add_speakerId", "");
        setVal("add_speakerName", "");
        setVal("add_cdmaNumber", "");
        setVal("add_locationName", "");
        setVal("add_speakerAdr", "");
        setVal("add_speakerLatitude", "");
        setVal("add_speakerLongitude", "");
        setVal("add_description", "");

        openModal("speaker_add_modal");

        const saveBtn = document.getElementById("btnSpeakerAddSave");
        if (saveBtn && !saveBtn.dataset.bound) {
            saveBtn.addEventListener("click", speakerAddSubmit);
            saveBtn.dataset.bound = "1";
        }
    }

    async function speakerAddSubmit() {
        const speakerId = getVal("add_speakerId");
        if (!speakerId) {
            alertMsg("speakerId(단말 ID)는 필수입니다.", "warning");
            return;
        }

        const payload = {
            speakerId,
            speakerName: getVal("add_speakerName"),
            cdmaNumber: getVal("add_cdmaNumber"),
            locationName: getVal("add_locationName"),
            speakerAdr: getVal("add_speakerAdr"),
            speakerLatitude: getVal("add_speakerLatitude") || null,
            speakerLongitude: getVal("add_speakerLongitude") || null,
            description: getVal("add_description")
        };

        try {
            const res = await fetch(SPEAKER_CREATE_API, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`create failed: ${res.status} ${t}`);
            }

            alertMsg("스피커가 등록되었습니다.", "success");
            closeModal("speaker_add_modal");

            await refreshSpeakerListAndRender({ preserveSelection: false });
            resetDetail();
        } catch (e) {
            console.error(e);
            alertMsg("추가 실패(엔드포인트/필수값/중복ID 확인)", "danger");
        }
    }

    async function speakerUpdate() {
        const checked = getSelectedSpeakerCheckbox();
        if (!checked) {
            alertMsg("수정할 스피커를 선택해주세요.", "warning");
            return;
        }

        const speakerKey = checked.dataset.key || checked.value;
        const current = (speakerListState || []).find(x => String(x?.speakerKey) === String(speakerKey));
        if (!current) {
            alertMsg("선택된 스피커 정보를 찾지 못했습니다. 목록을 갱신하세요.", "warning");
            return;
        }

        setVal("edit_speakerKey", current.speakerKey);
        setVal("edit_speakerId", current.speakerId);
        setVal("edit_speakerName", current.speakerName);
        setVal("edit_cdmaNumber", current.cdmaNumber);
        setVal("edit_locationName", current.locationName);
        setVal("edit_speakerAdr", current.speakerAdr);
        setVal("edit_speakerLatitude", current.speakerLatitude);
        setVal("edit_speakerLongitude", current.speakerLongitude);
        setVal("edit_description", current.description);

        openModal("speaker_update_modal");

        const saveBtn = document.getElementById("btnSpeakerSave");
        if (saveBtn && !saveBtn.dataset.bound) {
            saveBtn.addEventListener("click", speakerUpdateSubmit);
            saveBtn.dataset.bound = "1";
        }
    }

    async function speakerUpdateSubmit() {
        const speakerKey = getVal("edit_speakerKey");
        if (!speakerKey) {
            alertMsg("speakerKey가 없습니다. 모달 바인딩을 확인하세요.", "warning");
            return;
        }

        const payload = {
            speakerId: getVal("edit_speakerId"),
            speakerName: getVal("edit_speakerName"),
            cdmaNumber: getVal("edit_cdmaNumber"),
            locationName: getVal("edit_locationName"),
            speakerAdr: getVal("edit_speakerAdr"),
            speakerLatitude: getVal("edit_speakerLatitude") || null,
            speakerLongitude: getVal("edit_speakerLongitude") || null,
            description: getVal("edit_description")
        };

        try {
            const res = await fetch(SPEAKER_UPDATE_API(speakerKey), {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`update failed: ${res.status} ${t}`);
            }

            alertMsg("수정이 완료되었습니다.", "success");
            closeModal("speaker_update_modal");

            await refreshSpeakerListAndRender({ preserveSelection: true });
        } catch (e) {
            console.error(e);
            alertMsg("수정 실패(엔드포인트/파라미터 확인)", "danger");
        }
    }

    async function speakerDeleted() {
        const checked = getSelectedSpeakerCheckbox();
        if (!checked) {
            alertMsg("삭제할 스피커를 선택해주세요.", "warning");
            return;
        }

        const speakerKey = checked.dataset.key || checked.value;
        const speakerName = checked.dataset.name || "";

        const ok = confirm(`선택한 스피커를 삭제하시겠습니까?\n\n- ${speakerName} (${speakerKey})`);
        if (!ok) return;

        try {
            const res = await fetch(SPEAKER_DELETE_API(speakerKey), {
                method: "DELETE",
                headers: { "Accept": "application/json" }
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`delete failed: ${res.status} ${t}`);
            }

            alertMsg("삭제가 완료되었습니다.", "success");
            await refreshSpeakerListAndRender({ preserveSelection: false });
            resetDetail();
        } catch (e) {
            console.error(e);
            alertMsg("삭제 실패(엔드포인트/권한 확인)", "danger");
        }
    }

    // ===== Pane lifecycle =====
    async function onPaneActivated() {
        // 최초 1회만 UI 바인딩
        if (!isInitialized) initOnce();

        resetSpeakerFilterState();

        // 활성화될 때마다 데이터 새로 로딩(원하면 preserveSelection true로 바꿔도 됨)
        try {
            await refreshSpeakerListAndRender({ preserveSelection: false });
        } catch (e) {
            console.error(e);
            resetDetail();
            alertMsg("스피커 목록 조회 실패", "danger");
        }
    }

    function onPaneDeactivated() {
        resetSpeakerFilterState();
    }

    function handleEquipmentNavReset(e) {
        const navBtn = e.target.closest(".eq-nav-item, .eq-tab-item");
        if (!navBtn) return;

        const targetId = navBtn.dataset.target || "";
        if (targetId !== PANE_ID) {
            onPaneDeactivated();
        }
    }

    function initOnce() {
        if (isInitialized) return;

        // 검색 바인딩
        bindSpeakerSearchUI();
        bindSpeakerFilterUI();
        bindCrudButtons();

        // 리사이즈 시 리렌더 (활성 pane일 때만)
        window.addEventListener("resize", () => {
            clearTimeout(resizeDebounceTimer);
            resizeDebounceTimer = setTimeout(() => {
                if (isPaneActive()) renderSpeakerTable();
            }, 250);
        });

        isInitialized = true;
    }

    // ===== Global exports (HTML onclick 호환) =====
    // equipment-speaker-pane.html 에서 onclick="speakerAdd()" 같은 형태이므로 동일 이름으로 export
    window.speakerAdd = speakerAdd;
    window.speakerUpdate = speakerUpdate;
    window.speakerDeleted = speakerDeleted;

    window.handleButtonClick = handleButtonClick;
    window.requestStatus = requestStatus;
    window.setTime = setTime;
    window.resetRequest = resetRequest;

    window.filterSpeakers = (filter, btn) => {
        currentFilter = filter || "all";
        syncSpeakerFilterUI();
        applyFilter();
    };

    // (디버그/필요시 사용)
    window.__SpeakerPane = {
        onPaneActivated,
        refresh: refreshSpeakerListAndRender,
        render: renderSpeakerTable,
        resetDetail
    };

    // ===== is-active 감지 (Pane 전환 구조 대응) =====
    const rootEl = paneRoot();
    if (!rootEl) return;

    rootEl.addEventListener("equipment:pane-deactivated", () => {
        onPaneDeactivated();
    });
    document.addEventListener("click", handleEquipmentNavReset);

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === "attributes" && m.attributeName === "class") {
                if (isPaneActive()) onPaneActivated();
            }
        }
    });

    observer.observe(rootEl, { attributes: true });

    // 초기 진입: 이미 is-active 상태라면 즉시 로딩
    if (isPaneActive()) onPaneActivated();

})();
