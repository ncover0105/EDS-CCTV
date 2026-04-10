(() => {
    const PANE_ID = "equipment-cctv-pane";
    const PAGE_SIZE = 1000; // 페이지네이션 없이 스크롤 용으로 확대

    let fullList = [];        // API에서 가져온 원본 전체 목록
    let filteredList = [];    // 검색/필터가 적용된 현재 목록
    let currentPage = 1;

    let currentFilter = "all";
    let currentSearch = "";

    document.addEventListener("DOMContentLoaded", () => {
        init();
    });

    function init() {
        bindEvents();
        syncFilterUi();
        loadCctvList();
    }

    function bindEvents() {
        // 새로고침
        document.getElementById("cctv-btn-refresh")?.addEventListener("click", () => {
            loadCctvList();
        });

        // 검색 (실시간)
        const searchInput = document.getElementById("cctvSearch");
        searchInput?.addEventListener("input", (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            currentPage = 1;
            applyFilter();
        });

        // 상태 요약 바
        document.querySelectorAll(".cctv-status-bar .cctv-stat").forEach(stat => {
            stat.addEventListener("click", () => {
                setCurrentFilter(stat.dataset.filter);
            });
            stat.addEventListener("keydown", (e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setCurrentFilter(stat.dataset.filter);
            });
        });

        // 추가 모달 열기 버튼
        document.getElementById("cctv-btn-add")?.addEventListener("click", () => {
            openAddModal();
        });
        document.getElementById("cctv-btn-empty-add")?.addEventListener("click", () => {
            openAddModal();
        });

        // 추가/수정 저장
        document.getElementById("cctv-btn-save-add")?.addEventListener("click", submitAddCctv);
        document.getElementById("cctv-btn-save-edit")?.addEventListener("click", submitEditCctv);

        // 테이블 이벤트 위임 (수정/삭제)
        const tbody = document.getElementById("cctvTbody");
        tbody?.addEventListener("click", (e) => {
            const row = e.target.closest("tr");
            if (!row) return;

            const editBtn = e.target.closest(".row-edit-btn");
            if (editBtn) {
                openEditModalFromRow(row);
                return;
            }

            const delBtn = e.target.closest(".row-del-btn");
            if (delBtn) {
                deleteCctvFromRow(row);
                return;
            }
        });

        const cardList = document.getElementById("cctvCardList");
        cardList?.addEventListener("click", (e) => {
            const card = e.target.closest(".cctv-card");
            if (!card) return;

            const editBtn = e.target.closest(".row-edit-btn");
            if (editBtn) {
                openEditModalFromRow(card);
                return;
            }

            const delBtn = e.target.closest(".row-del-btn");
            if (delBtn) {
                deleteCctvFromRow(card);
            }
        });

        // 체크박스 전체 선택
        document.getElementById("cctv-check-all")?.addEventListener("change", (e) => {
            const checked = e.target.checked;
            document.querySelectorAll("#cctvTbody .cctv-row-check").forEach(cb => {
                cb.checked = checked;
            });
            updateSelectedDeleteButton();
        });

        tbody?.addEventListener("change", (e) => {
            if (e.target.classList.contains("cctv-row-check")) {
                updateSelectedDeleteButton();
            }
        });

        // 선택 삭제 버튼 (추가 기능)
        document.getElementById("cctv-btn-delete-selected")?.addEventListener("click", deleteSelectedCctvs);

        // 모달 닫힐 때 폼 리셋
        document.getElementById("cctvAddModal")?.addEventListener("hidden.bs.modal", () => {
            document.getElementById("addCctvForm")?.reset();
        });
        document.getElementById("cctvEditModal")?.addEventListener("hidden.bs.modal", () => {
            document.getElementById("editCctvForm")?.reset();
        });

        document.addEventListener("click", handleEquipmentNavReset);

        const pane = document.getElementById(PANE_ID);
        pane?.addEventListener("equipment:pane-activated", () => {
            onPaneActivated();
        });
        pane?.addEventListener("equipment:pane-deactivated", () => {
            onPaneDeactivated();
        });
    }

    /* -----------------------------
     * 데이터 로드 및 필터링
     * ----------------------------- */
    function loadCctvList() {
        console.log("Loading CCTV list...");
        fetch("/api/cctv/list")
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((data) => {
                fullList = Array.isArray(data) ? data : [];
                updateStats();
                applyFilter();
            })
            .catch((err) => {
                console.error(err);
                // alert("CCTV 목록 조회 중 오류가 발생했습니다.");
            });
    }

    function updateStats() {
        const total = fullList.length;
        const ok = fullList.filter(c => getStatusFilterKey(c) === "ok").length;
        const bad = fullList.filter(c => getStatusFilterKey(c) === "bad").length;

        setText("cctvStatTotal", total);
        setText("cctvStatOk", ok);
        setText("cctvStatBad", bad);
        setText("cctvCountText", `등록된 CCTV 총 ${total}건`);
    }

    function applyFilter() {
        filteredList = fullList.filter(item => {
            // 1. 상태 필터
            const itemFilterKey = getStatusFilterKey(item);
            let statusMatch = true;
            if (currentFilter === "ok") statusMatch = itemFilterKey === "ok";
            else if (currentFilter === "bad") statusMatch = itemFilterKey === "bad";

            if (!statusMatch) return false;

            // 2. 검색 필터
            if (!currentSearch) return true;
            const name = (item.name || "").toLowerCase();
            const code = (item.cctvCode || "").toLowerCase();
            const loc = (item.locationCode || "").toLowerCase();
            const url = (item.rtspUrl || "").toLowerCase();

            return name.includes(currentSearch) ||
                code.includes(currentSearch) ||
                loc.includes(currentSearch) ||
                url.includes(currentSearch);
        });

        renderPage();
    }

    /* -----------------------------
     * 렌더링
     * ----------------------------- */
    function renderPage() {
        const tbody = document.getElementById("cctvTbody");
        const cardListEl = document.getElementById("cctvCardList");
        const emptyEl = document.getElementById("cctvEmpty");
        const tableEl = document.getElementById("cctvTable");
        const tableResponsiveEl = tableEl?.closest(".table-responsive");
        const pagingEl = document.getElementById("cctvPagination");

        if (!tbody || !cardListEl) return;

        if (filteredList.length === 0) {
            tbody.innerHTML = "";
            cardListEl.innerHTML = "";
            emptyEl?.classList.remove("d-none");
            tableEl?.classList.add("d-none");
            tableResponsiveEl?.classList.add("d-none");
            cardListEl.hidden = true;
            if (pagingEl) pagingEl.innerHTML = "";
            return;
        }

        emptyEl?.classList.add("d-none");
        tableEl?.classList.remove("d-none");
        tableResponsiveEl?.classList.remove("d-none");
        cardListEl.hidden = false;

        const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filteredList.slice(start, start + PAGE_SIZE);

        tbody.innerHTML = pageItems.map(item => rowHtml(item)).join("");
        cardListEl.innerHTML = pageItems.map(item => cardHtml(item)).join("");

        /* 페이지네이션 동작 주석 처리
        if (window.App?.utils?.renderPagination) {
            window.App.utils.renderPagination({
                containerId: "cctvPagination",
                currentPage: currentPage,
                totalItems: filteredList.length,
                itemsPerPage: PAGE_SIZE,
                onPageChange: (p) => {
                    currentPage = p;
                    renderPage();
                }
            });
        }
        */

        // 체크올 상태 동기화
        const checkAll = document.getElementById("cctv-check-all");
        if (checkAll) checkAll.checked = false;
        updateSelectedDeleteButton();
    }

    function rowHtml(item) {
        const code = item.cctvCode || "-";
        const name = item.name || "-";
        const loc = item.locationCode || "-";
        const url = item.rtspUrl || "-";
        const lat = (item.latitude ?? "-");
        const lng = (item.longitude ?? "-");
        const status = getStatusValue(item);

        const statusbadge = buildStatusBadge(status);
        const datasetAttrs = buildDatasetAttrs(item, { code, name, loc, url, lat, lng });
        const safeName = escapeHtml(String(name));
        const safeLoc = escapeHtml(String(loc));
        const safeCode = escapeHtml(String(code));
        const safeUrl = escapeHtml(String(url));
        const coordText = formatCoordText(lat, lng);

        return `
    <tr ${datasetAttrs}>

      <td class="text-center align-middle">${statusbadge}</td>
      <td class="text-primary fw-600 text-center align-middle">${safeName}</td>
      <td class="text-secondary text-center align-middle">${safeLoc}</td>
      <td class="text-secondary font-mono small text-center align-middle">${safeCode}</td>

      <!-- RTSP -->
      <td class="text-muted small text-truncate text-center align-middle" title="${safeUrl}">
        ${safeUrl}
      </td>

      <!-- 좌표 -->
      <td class="text-muted small text-center align-middle">${escapeHtml(String(coordText))}</td>

      <td class="text-center align-middle">
        <div class="d-flex justify-content-center gap-1">
          <button class="icon-btn row-edit-btn" type="button" title="정보 수정" aria-label="정보 수정">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="icon-btn delete row-del-btn" type="button" title="삭제" aria-label="삭제">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
    }

    function cardHtml(item) {
        const code = item.cctvCode || "-";
        const name = item.name || "-";
        const loc = item.locationCode || "-";
        const url = item.rtspUrl || "-";
        const lat = (item.latitude ?? "-");
        const lng = (item.longitude ?? "-");
        const status = getStatusValue(item);

        const statusbadge = buildStatusBadge(status);
        const datasetAttrs = buildDatasetAttrs(item, { code, name, loc, url, lat, lng });
        const safeName = escapeHtml(String(name));
        const safeLoc = escapeHtml(String(loc));
        const safeCode = escapeHtml(String(code));
        const safeUrl = escapeHtml(String(url));
        const coordText = escapeHtml(String(formatCoordText(lat, lng)));

        return `
    <article class="cctv-card" ${datasetAttrs}>
      <div class="cctv-card-top">
        <div class="cctv-card-title-wrap">
          <div class="cctv-card-title">${safeName}</div>
          <div class="cctv-card-code">${safeCode}</div>
        </div>
        <div class="cctv-card-status">${statusbadge}</div>
      </div>
      <div class="cctv-card-meta">
        <div class="cctv-card-row">
          <span class="cctv-card-label">Location</span>
          <span class="cctv-card-value">${safeLoc}</span>
        </div>
        <div class="cctv-card-row">
          <span class="cctv-card-label">RTSP</span>
          <span class="cctv-card-value cctv-card-url" title="${safeUrl}">${safeUrl}</span>
        </div>
        <div class="cctv-card-row">
          <span class="cctv-card-label">좌표</span>
          <span class="cctv-card-value">${coordText}</span>
        </div>
      </div>
      <div class="cctv-card-actions">
        <button class="icon-btn row-edit-btn" type="button" title="정보 수정" aria-label="정보 수정">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="icon-btn delete row-del-btn" type="button" title="삭제" aria-label="삭제">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </article>
  `;
    }

    function setCurrentFilter(filter) {
        currentFilter = filter || "all";
        currentPage = 1;
        syncFilterUi();
        applyFilter();
    }

    function syncFilterUi() {
        document.querySelectorAll(".cctv-status-bar .cctv-stat").forEach(stat => {
            const isActive = stat.dataset.filter === currentFilter;
            stat.classList.toggle("is-active", isActive);
            stat.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    function resetCctvFilterState() {
        currentFilter = "all";
        currentSearch = "";
        currentPage = 1;

        const searchInput = document.getElementById("cctvSearch");
        if (searchInput) searchInput.value = "";

        syncFilterUi();
    }

    function onPaneDeactivated() {
        resetCctvFilterState();
    }

    function onPaneActivated() {
        resetCctvFilterState();
        applyFilter();
    }

    function handleEquipmentNavReset(e) {
        const navBtn = e.target.closest(".eq-nav-item, .eq-tab-item");
        if (!navBtn) return;

        const targetId = navBtn.dataset.target || "";
        if (targetId !== PANE_ID) {
            onPaneDeactivated();
        }
    }



    function updateSelectedDeleteButton() {
        const checkedCount = document.querySelectorAll("#cctvTbody .cctv-row-check:checked").length;
        const btn = document.getElementById("cctv-btn-delete-selected");
        if (btn) {
            if (checkedCount > 0) {
                btn.classList.remove("d-none");
                btn.querySelector("span").textContent = `삭제 (${checkedCount})`;
            } else {
                btn.classList.add("d-none");
            }
        }
    }

    /* -----------------------------
     * CRUD
     * ----------------------------- */
    function openAddModal() {
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("cctvAddModal"));
        modal.show();
    }

    function submitAddCctv() {
        const locationCode = getVal("cctvlocationCode");
        const code = getVal("cctvCode");
        const name = getVal("cctvName");

        if (!locationCode || !code || !name) {
            alert("필수 입력 항목(*표시)을 모두 입력해 주세요.");
            return;
        }

        const payload = {
            locationCode,
            cctvCode: code,
            name,
            rtspUrl: getVal("cctvUrl") || null,
            latitude: getVal("cctvLat") || null,
            longitude: getVal("cctvLng") || null,
            id: getVal("cctvLoginId") || null,
            password: getVal("cctvLoginPassword") || null,
            mountpointId: getVal("cctvMountpointId") ? Number(getVal("cctvMountpointId")) : null,
            videoPort: getVal("cctvVideoPort") ? Number(getVal("cctvVideoPort")) : null,
            wsPort: getVal("cctvWsPort") || null,
        };

        fetch("/api/cctv/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json().catch(() => ({}));
            })
            .then(() => {
                bootstrap.Modal.getInstance(document.getElementById("cctvAddModal"))?.hide();
                loadCctvList();
            })
            .catch(err => {
                console.error(err);
                alert("저장 중 오류가 발생했습니다: " + err.message);
            });
    }

    function openEditModalFromRow(row) {
        setVal("editCctvlocationCode", row.dataset.locationCode);
        setVal("editCctvCode", row.dataset.cctvCode);
        setVal("editCctvName", row.dataset.name);
        setVal("editCctvUrl", row.dataset.url);
        setVal("editCctvLat", row.dataset.lat);
        setVal("editCctvLng", row.dataset.lng);
        setVal("editCctvMountpointId", row.dataset.mountpointId);
        setVal("editCctvLoginId", row.dataset.loginId);
        setVal("editCctvLoginPassword", ""); // 비밀번호는 보안상 빈값
        setVal("editCctvVideoPort", row.dataset.videoPort);
        setVal("editCctvWsPort", row.dataset.wsPort);

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("cctvEditModal"));
        modal.show();
    }

    function submitEditCctv() {
        const locationCode = getVal("editCctvlocationCode");
        const code = getVal("editCctvCode");
        const name = getVal("editCctvName");

        if (!name) {
            alert("CCTV 이름은 필수입니다.");
            return;
        }

        const pw = getVal("editCctvLoginPassword");
        const payload = {
            name,
            rtspUrl: getVal("editCctvUrl") || null,
            latitude: getVal("editCctvLat") || null,
            longitude: getVal("editCctvLng") || null,
            id: getVal("editCctvLoginId") || null,
            mountpointId: getVal("editCctvMountpointId") ? Number(getVal("editCctvMountpointId")) : null,
            videoPort: getVal("editCctvVideoPort") ? Number(getVal("editCctvVideoPort")) : null,
            wsPort: getVal("editCctvWsPort") || null,
            ...(pw ? { password: pw } : {})
        };

        fetch(`/api/cctv/${encodeURIComponent(locationCode)}/${encodeURIComponent(code)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json().catch(() => ({}));
            })
            .then(() => {
                bootstrap.Modal.getInstance(document.getElementById("cctvEditModal"))?.hide();
                loadCctvList();
            })
            .catch(err => {
                console.error(err);
                alert("수정 중 오류가 발생했습니다: " + err.message);
            });
    }

    function deleteCctvFromRow(row) {
        const loc = row.dataset.locationCode;
        const code = row.dataset.cctvCode;
        const name = row.dataset.name;

        if (!confirm(`CCTV '${name}'(${code})를 정말로 삭제하시겠습니까?`)) return;

        fetch(`/api/cctv/${encodeURIComponent(loc)}/${encodeURIComponent(code)}`, {
            method: "DELETE"
        })
            .then(res => {
                if (!res.ok) throw new Error("Delete failed");
                loadCctvList();
            })
            .catch(err => {
                console.error(err);
                alert("삭제 중 오류가 발생했습니다.");
            });
    }

    function deleteSelectedCctvs() {
        const checkedRows = document.querySelectorAll("#cctvTbody .cctv-row-check:checked");
        if (checkedRows.length === 0) return;

        if (!confirm(`${checkedRows.length}개의 CCTV를 삭제하시겠습니까?`)) return;

        const promises = Array.from(checkedRows).map(cb => {
            const row = cb.closest("tr");
            const loc = row.dataset.locationCode;
            const code = row.dataset.cctvCode;
            return fetch(`/api/cctv/${encodeURIComponent(loc)}/${encodeURIComponent(code)}`, { method: "DELETE" });
        });

        Promise.all(promises)
            .then(() => {
                loadCctvList();
            })
            .catch(err => {
                console.error(err);
                alert("일부 항목 삭제 중 오류가 발생했습니다.");
            });
    }

    /* -----------------------------
     * Helpers
     * ----------------------------- */
    function getVal(id) { return document.getElementById(id)?.value.trim() ?? ""; }
    function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v ?? ""; }
    function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

    function getStatusValue(item) {
        return String(item?.statusProc ?? item?.statusCam ?? "").trim();
    }

    function getStatusFilterKey(item) {
        const status = getStatusValue(item);
        if (status === "1") return "ok";
        return "bad";
    }

    function buildStatusBadge(status) {
        if (status === "1") {
            return `<span class="badge ok-bg text-success border border-success border-opacity-25 py-1 px-2 d-inline-flex align-items-center gap-1">
      <span class="status-dot ok"></span> 정상
    </span>`;
        }

        return `<span class="badge danger-bg text-danger border border-danger border-opacity-25 py-1 px-2 d-inline-flex align-items-center gap-1">
      <span class="status-dot bad"></span> 신호없음
    </span>`;
    }

    function formatCoordText(lat, lng) {
        return (lat === "-" || lng === "-") ? "-" : `${lat}, ${lng}`;
    }

    function buildDatasetAttrs(item, { code, name, loc, url, lat, lng }) {
        return `
        data-location-code="${escapeHtml(String(loc))}"
        data-cctv-code="${escapeHtml(String(code))}"
        data-name="${escapeHtml(String(name))}"
        data-url="${escapeHtml(String(url))}"
        data-lat="${escapeHtml(String(lat))}"
        data-lng="${escapeHtml(String(lng))}"
        data-mountpoint-id="${escapeHtml(String(item.mountpointId || ""))}"
        data-login-id="${escapeHtml(String(item.id || ""))}"
        data-video-port="${escapeHtml(String(item.videoPort || ""))}"
        data-ws-port="${escapeHtml(String(item.wsPort || ""))}"`;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

})();



