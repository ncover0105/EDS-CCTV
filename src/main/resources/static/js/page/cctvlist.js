/**
 * ======================================================
 * cctvlist.js
 *  - CCTV 추가 / 수정 / 사용중지(삭제 대체)
 *  - cctvListPage.html DOM 구조 기준
 * ======================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    bindRowSelectEvents();
    bindTopButtons();
  
    // (선택) 화면 진입 시 서버 목록으로 한번 동기화하고 싶으면 켜기
    // loadCctvList();
  });
  
  function bindTopButtons() {
    const btnRegister = document.getElementById("btn-register");
    const btnEdit = document.getElementById("btn-edit");
    const btnDisable = document.getElementById("btn-disable");
  
    if (btnRegister) btnRegister.addEventListener("click", openAddModal);
    if (btnEdit) btnEdit.addEventListener("click", openEditModal);
    if (btnDisable) btnDisable.addEventListener("click", disableSelectedCctv);
  
    const btnSaveEdit = document.getElementById("btn-save-edit-cctv");
    if (btnSaveEdit) btnSaveEdit.addEventListener("click", submitEditCctv);
  }
  
  /* -----------------------------
   * Row 선택(클릭으로 체크 토글)
   * ----------------------------- */
  function bindRowSelectEvents() {
    const tbody = document.getElementById("cctvTableBody");
    if (!tbody) return;
  
    tbody.addEventListener("click", (event) => {
      const row = event.target.closest("tr");
      if (!row) return;
  
      const checkbox = row.querySelector("input.cctv-checkbox");
      if (!checkbox) return; // empty-row
  
      // 체크박스 직접 클릭이면 중복 토글 방지
      if (event.target === checkbox) {
        row.classList.toggle("table-active", checkbox.checked);
        return;
      }
  
      checkbox.checked = !checkbox.checked;
      row.classList.toggle("table-active", checkbox.checked);
    });
  
    tbody.addEventListener("change", (event) => {
      if (!event.target.matches("input.cctv-checkbox")) return;
      const row = event.target.closest("tr");
      if (row) row.classList.toggle("table-active", event.target.checked);
    });
  }
  
  function getSelectedCctvCodes() {
    return Array.from(document.querySelectorAll(".cctv-checkbox:checked"))
      .map(cb => cb.value)
      .filter(Boolean);
  }
  
  function clearSelection() {
    document.querySelectorAll(".cctv-checkbox").forEach(cb => (cb.checked = false));
    document.querySelectorAll("#cctvTableBody tr").forEach(tr => tr.classList.remove("table-active"));
  }
  
  /* -----------------------------
   * 추가
   * ----------------------------- */
  function openAddModal() {
    const modalEl = document.getElementById("addCctvModal");
    if (!modalEl) return alert("addCctvModal을 찾을 수 없습니다.");
  
    // 폼 초기화
    setVal("cctvCode", "");
    setVal("cctvName", "");
    setVal("cctvLoginId", "");
    setVal("cctvLoginPassword", "");
    setVal("cctvUrl", "");
    setVal("cctvLat", "");
    setVal("cctvLng", "");
  
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
  
  // ✅ 기존 HTML에서 추가 버튼이 onclick="submitAddCctv()" 라서 함수명 유지
  function submitAddCctv() {
    const code = getVal("cctvCode").trim();
    const name = getVal("cctvName").trim();
    const url = getVal("cctvUrl").trim();
    const lat = parseFloat(getVal("cctvLat"));
    const lng = parseFloat(getVal("cctvLng"));
    const loginId = getVal("cctvLoginId").trim();
    const loginPw = getVal("cctvLoginPassword").trim();
  
    if (!code) return alert("CCTV 코드는 필수입니다.");
    if (!name) return alert("CCTV 이름은 필수입니다.");
  
    // ⚠️ API DTO 키는 백엔드에 맞춰야 함.
    // 현재 프로젝트 th:each에 cctv.cctvCode / cctv.rtspUrl / cctv.latitude / cctv.longitude 를 쓰고 있으니 그에 맞춰 전송
    const payload = {
      cctvCode: code,
      cctvName: name,
      rtspUrl: url || null,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      id: loginId || null,
      password: loginPw || null
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
        bootstrap.Modal.getInstance(document.getElementById("addCctvModal"))?.hide();
        loadCctvList();
      })
      .catch((err) => {
        console.error(err);
        alert("CCTV 추가 중 오류가 발생했습니다.");
      });
  }
  
  /* -----------------------------
   * 수정
   * ----------------------------- */
  function openEditModal() {
    const selected = getSelectedCctvCodes();
    if (selected.length !== 1) {
      App.utils.showGlobalAlert("수정은 1개만 선택하세요.", "warning");
      return;
    }
  
    const code = selected[0];
  
    // ✅ 현재 화면에 있는 row에서 값 뽑아서 모달 채우기
    const row = document.querySelector(`.cctv-checkbox[value="${cssEscape(code)}"]`)?.closest("tr");
    console.log(row?.dataset);
    console.log(row?.dataset.loginId);
    console.log(row?.dataset.loginPw);

    if (!row) {
        alert("선택한 CCTV 행을 찾을 수 없습니다.");
        return;
    }

    const tds = row.querySelectorAll("td");
    // 현재 표: 0선택 1번호 2CCTV명(코드 표시중) 3URL 4상태 5위도 6경도
    const cctvCode = (tds[2]?.textContent ?? "").trim();
    const rtspUrl = (tds[3]?.textContent ?? "").trim();
    const latitude = (tds[5]?.textContent ?? "").trim();
    const longitude = (tds[6]?.textContent ?? "").trim();

    setVal("editCctvCode", cctvCode);
    setVal("editCctvName", cctvCode);
    setVal("editCctvLoginId", row.dataset.loginId || "");
    setVal("editCctvLoginPassword", row.dataset.loginPw || "");
    setVal("editCctvUrl", rtspUrl === "-" ? "" : rtspUrl);
    setVal("editCctvLat", latitude === "-" ? "" : latitude);
    setVal("editCctvLng", longitude === "-" ? "" : longitude);

    const modalEl = document.getElementById("editCctvModal");
    if (!modalEl) return alert("editCctvModal을 찾을 수 없습니다.");
  
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
  
  function submitEditCctv() {
    const code = getVal("editCctvCode").trim();
    const name = getVal("editCctvName").trim();
    const url = getVal("editCctvUrl").trim();
    const lat = parseFloat(getVal("editCctvLat"));
    const lng = parseFloat(getVal("editCctvLng"));
    const loginId = getVal("editCctvLoginId").trim();
    const loginPw = getVal("editCctvLoginPassword").trim();
  
    if (!code) return alert("CCTV 코드를 찾을 수 없습니다.");
    if (!name) return alert("CCTV 이름은 필수입니다.");
  
    const payload = {
      cctvCode: code,
      cctvName: name,
      rtspUrl: url || null,
      latitude: Number.isFinite(lat) ? String(lat) : null,
      longitude: Number.isFinite(lng) ? String(lng) : null,
      id: loginId || null,
      ...(loginPw ? { password: loginPw } : {})
    };
  
    fetch(`/api/cctv/update/${code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.text().then(t => (t ? JSON.parse(t) : {})).catch(() => ({}));
      })
      .then(() => {
        bootstrap.Modal.getInstance(document.getElementById("editCctvModal"))?.hide();
        clearSelection();
        loadCctvList();
      })
      .catch((err) => {
        console.error(err);
        alert("CCTV 수정 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
      });
  }
  
  /* -----------------------------
   * 사용중지(삭제 대체)
   * ----------------------------- */
  function deleteSelectedCctv() {
    const selected = getSelectedCctvCodes();
    if (selected.length !== 1) {
      alert("삭제는 1개만 선택해서 처리하세요.");
      return;
    }
  
    const code = selected[0];
    if (!confirm(`CCTV(${code})를 삭제할까요?`)) return;
  
    fetch(`/api/cctv/delete/${code}`, {
      method: "DELETE"
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
      })
      .then(() => {
        clearSelection();
        loadCctvList();
      })
      .catch((err) => {
        console.error(err);
        alert("삭제 처리 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
      });
  }

  /* -----------------------------
   * 목록 갱신(렌더링)
   * ----------------------------- */
  function loadCctvList() {
    fetch("/api/cctv/list")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        renderCctvTable(Array.isArray(data) ? data : []);
        updateCctvCount(Array.isArray(data) ? data.length : 0);
      })
      .catch((err) => {
        console.error(err);
        alert("CCTV 목록 조회 중 오류가 발생했습니다.");
      });
  }
  
  function renderCctvTable(list) {
    const tbody = document.getElementById("cctvTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `
        <tr class="text-center">
            <td colspan="7" style="height: 60vh;">
            <div class="d-flex align-items-center justify-content-center h-100">
                <span class="text-muted">
                <i class="bi bi-inbox me-2"></i>
                등록된 CCTV가 없습니다.
                </span>
            </div>
            </td>
        </tr>
        `;
        return;
    }

    list.forEach((cctv, idx) => {
        const code = cctv.cctvCode ?? cctv.code ?? "-";
        const url = cctv.rtspUrl ?? cctv.url ?? "-";
        const statusCam = cctv.statusCam ?? "";
        const lat = cctv.latitude ?? "-";
        const lng = cctv.longitude ?? "-";

        const loginId = cctv.id ?? "";
        const loginPw = cctv.password ?? "";

        const statusHtml =
        statusCam === "1"
        ? `<span class="status-badge status-success d-inline-flex align-items-center gap-1">
            <i class="bi bi-check-circle-fill"></i> 정상
            </span>`
        : statusCam === "0"
        ? `<span class="status-badge status-error d-inline-flex align-items-center gap-1">
            <i class="bi bi-x-circle-fill"></i> 신호없음
            </span>`
        : `-`;

        const tr = document.createElement("tr");
        tr.dataset.loginId = loginId;
        tr.dataset.loginPw = loginPw;

        tr.innerHTML = `
        <td><input type="checkbox" name="selectedCctv" value="${escapeHtml(code)}" class="form-check-input cctv-checkbox" /></td>
        <td>${idx + 1}</td>
        <td>${escapeHtml(code)}</td>
        <td style="word-break: break-all;">${escapeHtml(url)}</td>
        <td>${statusHtml}</td>
        <td>${escapeHtml(lat)}</td>
        <td>${escapeHtml(lng)}</td>
        `;

        tbody.appendChild(tr);
    });
  }
  
  function updateCctvCount(count) {
    const el = document.getElementById("userCount"); // 현재 HTML이 userCount id를 쓰고 있음
    if (!el) return;
    el.textContent = `등록된 CCTV 총 ${count}건 | 등록된 CCTV를 관리하세요`;
  }
  
  /* -----------------------------
   * Helpers
   * ----------------------------- */
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
  function cssEscape(value) {
    // 간단 escape (따옴표/대괄호 등 방지)
    return String(value).replaceAll('"', '\\"');
  }
  