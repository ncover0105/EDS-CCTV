(() => {
    const PAGE_SIZE = 12;

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

        // 필터 칩
        document.querySelectorAll(".cctv-filters .chip").forEach(chip => {
            chip.addEventListener("click", () => {
                document.querySelectorAll(".cctv-filters .chip").forEach(c => c.classList.remove("is-active"));
                chip.classList.add("is-active");
                currentFilter = chip.dataset.filter;
                currentPage = 1;
                applyFilter();
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
        const ok = fullList.filter(c => c.statusCam === "1").length;
        const bad = fullList.filter(c => c.statusCam === "0").length;
        const unk = total - ok - bad;

        setText("cctvStatTotal", total);
        setText("cctvStatOk", ok);
        setText("cctvStatBad", bad);
        setText("cctvStatUnk", unk);
        setText("cctvCountText", `등록된 CCTV 총 ${total}건`);
    }

    function applyFilter() {
        filteredList = fullList.filter(item => {
            // 1. 상태 필터
            let statusMatch = true;
            if (currentFilter === "ok") statusMatch = item.statusCam === "1";
            else if (currentFilter === "bad") statusMatch = item.statusCam === "0";
            else if (currentFilter === "unk") statusMatch = !item.statusCam || (item.statusCam !== "1" && item.statusCam !== "0");

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
        const emptyEl = document.getElementById("cctvEmpty");
        const tableEl = document.getElementById("cctvTable");
        const pagingEl = document.getElementById("cctvPagination");

        if (!tbody) return;

        if (filteredList.length === 0) {
            tbody.innerHTML = "";
            emptyEl?.classList.remove("d-none");
            tableEl?.classList.add("d-none");
            if (pagingEl) pagingEl.innerHTML = "";
            return;
        }

        emptyEl?.classList.add("d-none");
        tableEl?.classList.remove("d-none");

        const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filteredList.slice(start, start + PAGE_SIZE);

        tbody.innerHTML = pageItems.map(item => rowHtml(item)).join("");
        renderPagination(totalPages);

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
        const status = item.statusCam;

        let statusHtml = "";
        if (status === "1") {
            statusHtml = `<span class="badge ok-bg text-success border border-success border-opacity-25 py-1 px-2 d-inline-flex align-items-center gap-1">
      <span class="status-dot ok"></span> 정상
    </span>`;
        } else if (status === "0") {
            statusHtml = `<span class="badge danger-bg text-danger border border-danger border-opacity-25 py-1 px-2 d-inline-flex align-items-center gap-1">
      <span class="status-dot bad"></span> 신호없음
    </span>`;
        } else {
            statusHtml = `<span class="badge bg-black-20 text-muted border border-white-10 py-1 px-2 d-inline-flex align-items-center gap-1">
      <span class="status-dot unknown"></span> 알수없음
    </span>`;
        }

        const safeName = escapeHtml(String(name));
        const safeLoc = escapeHtml(String(loc));
        const safeCode = escapeHtml(String(code));
        const safeUrl = escapeHtml(String(url));

        // 좌표는 "lat, lng" 형태로 표시
        const coordText = (lat === "-" || lng === "-") ? "-" : `${lat}, ${lng}`;

        return `
    <tr data-location-code="${safeLoc}"
        data-cctv-code="${safeCode}"
        data-name="${safeName}"
        data-url="${safeUrl}"
        data-lat="${lat}"
        data-lng="${lng}"
        data-mountpoint-id="${item.mountpointId || ""}"
        data-login-id="${item.id || ""}"
        data-video-port="${item.videoPort || ""}"
        data-ws-port="${item.wsPort || ""}">

      <td>${statusHtml}</td>
      <td class="text-primary fw-600">${safeName}</td>
      <td class="text-secondary">${safeLoc}</td>
      <td class="text-secondary font-mono small">${safeCode}</td>

      <!-- ✅ RTSP -->
      <td class="text-muted small text-truncate" style="max-width: 320px;" title="${safeUrl}">
        ${safeUrl}
      </td>

      <!-- ✅ 좌표 -->
      <td class="text-muted small">${escapeHtml(String(coordText))}</td>

      <td class="text-center">
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


    function renderPagination(totalPages) {
        const el = document.getElementById("cctvPagination");
        if (!el) return;

        let html = "";
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // 이전
        html += `<button type="button" class="eq-page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹</button>`;

        for (let i = startPage; i <= endPage; i++) {
            html += `<button type="button" class="eq-page-btn ${i === currentPage ? 'is-active' : ''}" data-page="${i}">${i}</button>`;
        }

        // 다음
        html += `<button type="button" class="eq-page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">›</button>`;

        el.innerHTML = html;

        el.querySelectorAll(".eq-page-btn[data-page]").forEach(btn => {
            btn.addEventListener("click", () => {
                const p = parseInt(btn.dataset.page);
                if (p > 0 && p <= totalPages) {
                    currentPage = p;
                    renderPage();
                }
            });
        });
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

