(() => {
    const PAGE_SIZE = 10;

    let fullList = [];
    let currentPage = 1;

    document.addEventListener("DOMContentLoaded", () => {
        bindTopButtons();
        bindTableDelegation();
        loadCctvList();
    });

    function bindTopButtons() {
        document.getElementById("cctv-btn-refresh")?.addEventListener("click", loadCctvList);

        document.getElementById("cctv-btn-save-add")?.addEventListener("click", submitAddCctv);
        document.getElementById("cctv-btn-save-edit")?.addEventListener("click", submitEditCctv);

        document.getElementById("cctv-check-all")?.addEventListener("change", (e) => {
            const checked = !!e.target.checked;
            document.querySelectorAll("#cctvTbody input.cctv-row-check").forEach((cb) => (cb.checked = checked));
        });

        // edit modal reset (원본 로직과 동일 목적)
        document.getElementById("cctvEditModal")?.addEventListener("hidden.bs.modal", () => {
            // 필요 시 edit input reset
            // setVal("cctv-edit-name", "");
        });
    }

    function bindTableDelegation() {
        const tbody = document.getElementById("cctvTbody");
        if (!tbody) return;

        tbody.addEventListener("click", (e) => {
            const editBtn = e.target.closest(".cctv-btn-edit");
            if (editBtn) {
                e.preventDefault();
                const tr = editBtn.closest("tr");
                if (tr) openEditModalFromRow(tr);
                return;
            }

            const delBtn = e.target.closest(".cctv-btn-delete");
            if (delBtn) {
                e.preventDefault();
                const tr = delBtn.closest("tr");
                if (tr) deleteCctvFromRow(tr);
                return;
            }
        });
    }

    /* -----------------------------
     * 목록
     * ----------------------------- */
    function loadCctvList() {
        fetch("/api/cctv/list")
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((data) => {
                fullList = Array.isArray(data) ? data : [];
                currentPage = 1;
                updateCount(fullList.length);
                renderPage();
            })
            .catch((err) => {
                console.error(err);
                alert("CCTV 목록 조회 중 오류가 발생했습니다.");
            });
    }

    function renderPage() {
        const emptyEl = document.getElementById("cctvEmpty");
        const tableEl = document.getElementById("cctvTable");
        const tbody = document.getElementById("cctvTbody");
        const paging = document.getElementById("cctvPagination");

        if (!tbody) return;

        // empty
        if (fullList.length === 0) {
            tbody.innerHTML = "";
            emptyEl?.classList.remove("d-none");
            tableEl?.classList.add("d-none");
            paging && (paging.innerHTML = "");
            return;
        } else {
            emptyEl?.classList.add("d-none");
            tableEl?.classList.remove("d-none");
        }

        const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE));
        currentPage = clamp(currentPage, 1, totalPages);

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageItems = fullList.slice(start, start + PAGE_SIZE);

        tbody.innerHTML = pageItems.map((cctv, idx) => rowHtml(cctv, start + idx)).join("");

        renderPagination(totalPages);
    }

    function rowHtml(cctv, rowIndex) {
        const locationCode = cctv.locationCode ?? "";
        const code = cctv.cctvCode ?? "-";
        const name = cctv.name ?? "";
        const url = cctv.rtspUrl ?? "-";
        const statusCam = cctv.statusCam ?? "";
        const lat = cctv.latitude ?? "-";
        const lng = cctv.longitude ?? "-";

        const badge = statusBadge(statusCam);

        // row에 dataset 박아두면 edit/delete에서 그대로 사용 가능
        return `
        <tr ...>
            <td data-label="선택">
                <input type="checkbox" class="form-check-input cctv-row-check" ...>
            </td>
            <td data-label="상태">${badge}</td>
            <td data-label="이름"><strong>${escapeHtml(name || code)}</strong></td>
            <td data-label="Location">${escapeHtml(locationCode || "-")}</td>
            <td data-label="Code">${escapeHtml(code)}</td>
            <td data-label="RTSP" class="rtsp">${escapeHtml(url)}</td>
            <td data-label="좌표">${escapeHtml(String(lat))}, ${escapeHtml(String(lng))}</td>
            <td data-label="액션"> ...버튼... </td>
        </tr>
        `;
    }

    function statusBadge(statusCam) {
        if (statusCam === "1") {
            return `<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>정상</span>`;
        }
        if (statusCam === "0") {
            return `<span class="badge bg-danger"><i class="bi bi-x-circle-fill me-1"></i>신호없음</span>`;
        }
        return `<span class="badge bg-secondary"><i class="bi bi-question-circle-fill me-1"></i>알 수 없음</span>`;
    }

    function renderPagination(totalPages) {
        const el = document.getElementById("cctvPagination");
        if (!el) return;

        const btn = (label, page, disabled = false, active = false) => `
      <button type="button"
        class="eq-page-btn ${active ? "is-active" : ""}"
        ${disabled ? "disabled" : ""}
        data-page="${page}">
        ${label}
      </button>
    `;

        let html = "";
        html += btn("«", 1, currentPage === 1);
        html += btn("‹", currentPage - 1, currentPage === 1);

        // 페이지 번호는 5개 정도만 노출(원하면 7/9로 조정)
        const windowSize = 5;
        const half = Math.floor(windowSize / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + windowSize - 1);
        start = Math.max(1, end - windowSize + 1);

        for (let p = start; p <= end; p++) {
            html += btn(String(p), p, false, p === currentPage);
        }

        html += btn("›", currentPage + 1, currentPage === totalPages);
        html += btn("»", totalPages, currentPage === totalPages);

        el.innerHTML = html;

        // 클릭 바인딩(이 컨테이너에서만)
        el.querySelectorAll("button[data-page]").forEach((b) => {
            b.addEventListener("click", () => {
                const p = Number(b.dataset.page);
                if (!Number.isFinite(p)) return;
                currentPage = p;
                renderPage();
                // 체크올 해제
                const all = document.getElementById("cctv-check-all");
                if (all) all.checked = false;
            });
        });
    }

    function updateCount(count) {
        const el = document.getElementById("cctvCountText");
        if (el) el.textContent = `등록된 CCTV 총 ${count}건 (페이지당 ${PAGE_SIZE}개)`;
    }

    /* -----------------------------
     * 추가 / 수정 / 삭제 (원본 흐름 유지)
     * ----------------------------- */

    function submitAddCctv() {
        // 아래 id들은 너가 modal에 배치한 input id에 맞춰서 통일해줘야 함
        const locationCode = getVal("cctv-locationCode").trim();
        const code = getVal("cctv-code").trim();
        const name = getVal("cctv-name").trim();
        const url = getVal("cctv-rtspUrl").trim();
        const lat = getVal("cctv-lat").trim();
        const lng = getVal("cctv-lng").trim();
        const loginId = getVal("cctv-loginId").trim();
        const loginPw = getVal("cctv-loginPw").trim();
        const mountpointId = getVal("cctv-mountpointId").trim();
        const videoPort = getVal("cctv-videoPort").trim();
        const wsPort = getVal("cctv-wsPort").trim();

        if (!code) return alert("CCTV 코드는 필수입니다.");
        if (!name) return alert("CCTV 이름은 필수입니다.");

        const payload = {
            locationCode: locationCode || null,
            cctvCode: code,
            name,
            rtspUrl: url || null,
            latitude: lat || null,
            longitude: lng || null,
            id: loginId || null,
            password: loginPw || null,
            mountpointId: mountpointId ? Number(mountpointId) : null,
            videoPort: videoPort ? Number(videoPort) : null,
            wsPort: wsPort || null,
        };

        fetch("/api/cctv/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json().catch(() => ({}));
            })
            .then(() => {
                bootstrap.Modal.getInstance(document.getElementById("cctvAddModal"))?.hide();
                loadCctvList();
            })
            .catch((err) => {
                console.error(err);
                alert("CCTV 추가 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
            });
    }

    function openEditModalFromRow(tr) {
        // edit input id는 아래처럼 네임스페이스 추천
        setVal("cctv-edit-locationCode", tr.dataset.locationCode || "");
        setVal("cctv-edit-code", tr.dataset.cctvCode || "");
        setVal("cctv-edit-name", tr.dataset.name || "");
        setVal("cctv-edit-loginId", tr.dataset.loginId || "");
        setVal("cctv-edit-loginPw", ""); // 비번은 항상 빈 값
        setVal("cctv-edit-rtspUrl", tr.dataset.rtspUrl || "");
        setVal("cctv-edit-mountpointId", tr.dataset.mountpointId || "");
        setVal("cctv-edit-videoPort", tr.dataset.videoPort || "");
        setVal("cctv-edit-wsPort", tr.dataset.wsPort || "");
        setVal("cctv-edit-lat", tr.dataset.latitude || "");
        setVal("cctv-edit-lng", tr.dataset.longitude || "");

        bootstrap.Modal.getOrCreateInstance(document.getElementById("cctvEditModal")).show();
    }

    function submitEditCctv() {
        const locationCode = getVal("cctv-edit-locationCode").trim();
        const code = getVal("cctv-edit-code").trim();
        const name = getVal("cctv-edit-name").trim();
        const url = getVal("cctv-edit-rtspUrl").trim();
        const lat = getVal("cctv-edit-lat").trim();
        const lng = getVal("cctv-edit-lng").trim();
        const loginId = getVal("cctv-edit-loginId").trim();
        const loginPw = getVal("cctv-edit-loginPw").trim();
        const mountpointId = getVal("cctv-edit-mountpointId").trim();
        const videoPort = getVal("cctv-edit-videoPort").trim();
        const wsPort = getVal("cctv-edit-wsPort").trim();

        if (!locationCode) return alert("Location 코드를 찾을 수 없습니다.");
        if (!code) return alert("CCTV 코드를 찾을 수 없습니다.");
        if (!name) return alert("CCTV 이름은 필수입니다.");

        const payload = {
            name,
            rtspUrl: url || null,
            latitude: lat || null,
            longitude: lng || null,
            id: loginId || null,
            mountpointId: mountpointId ? Number(mountpointId) : null,
            videoPort: videoPort ? Number(videoPort) : null,
            wsPort: wsPort || null,
            ...(loginPw ? { password: loginPw } : {}),
        };

        fetch(`/api/cctv/${encodeURIComponent(locationCode)}/${encodeURIComponent(code)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json().catch(() => ({}));
            })
            .then(() => {
                bootstrap.Modal.getInstance(document.getElementById("cctvEditModal"))?.hide();
                loadCctvList();
            })
            .catch((err) => {
                console.error(err);
                alert("CCTV 수정 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
            });
    }

    function deleteCctvFromRow(tr) {
        const code = tr.dataset.cctvCode || "";
        const locationCode = tr.dataset.locationCode || "";

        if (!locationCode) return alert("locationCode가 없습니다. 목록 데이터를 확인하세요.");
        if (!confirm(`CCTV(${locationCode}/${code})를 삭제할까요?`)) return;

        fetch(`/api/cctv/${encodeURIComponent(locationCode)}/${encodeURIComponent(code)}`, {
            method: "DELETE",
        })
            .then((res) => {
                if (!res.ok) throw new Error("delete failed");
                loadCctvList();
            })
            .catch(() => alert("삭제 처리 중 오류가 발생했습니다."));
    }

    /* helpers */
    function getVal(id) {
        return document.getElementById(id)?.value ?? "";
    }
    function setVal(id, v) {
        const el = document.getElementById(id);
        if (el) el.value = v;
    }
    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
    function clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }
})();
