/**
 * cctvlist.js (핵심 수정본)
 * - 추가: POST /api/cctv/add
 * - 수정: PUT /api/cctv/update/{cctvCode}
 * - 삭제: DELETE /api/cctv/delete/{cctvCode}
 */

document.addEventListener("DOMContentLoaded", () => {
  bindRowSelectEvents();
  bindTopButtons();
  // 화면 진입 시 최신 목록 동기화
  loadCctvList();
});

function bindTopButtons() {
  const btnRegister = document.getElementById("btn-register");
  const btnEdit = document.getElementById("btn-edit");
  const btnDisable = document.getElementById("btn-disable");

  if (btnRegister) btnRegister.addEventListener("click", openAddModal);
  if (btnEdit) btnEdit.addEventListener("click", openEditModal);
  if (btnDisable) btnDisable.addEventListener("click", deleteSelectedCctv); // ✅ 수정

  const btnSaveEdit = document.getElementById("btn-save-edit-cctv");
  if (btnSaveEdit) btnSaveEdit.addEventListener("click", submitEditCctv);
}

/* -----------------------------
 * Row 선택
 * ----------------------------- */
function bindRowSelectEvents() {
  const tbody = document.getElementById("cctvTableBody");
  if (!tbody) return;

  tbody.addEventListener("click", (event) => {
    const row = event.target.closest("tr");
    if (!row) return;

    const checkbox = row.querySelector("input.cctv-checkbox");
    if (!checkbox) return;

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
    .map((cb) => cb.value)
    .filter(Boolean);
}

function clearSelection() {
  document.querySelectorAll(".cctv-checkbox").forEach((cb) => (cb.checked = false));
  document.querySelectorAll("#cctvTableBody tr").forEach((tr) => tr.classList.remove("table-active"));
}

/* -----------------------------
 * 추가
 * ----------------------------- */
function openAddModal() {
  const modalEl = document.getElementById("addCctvModal");
  if (!modalEl) return alert("addCctvModal을 찾을 수 없습니다.");

  setVal("cctvCode", "");
  setVal("cctvName", "");
  setVal("cctvLoginId", "");
  setVal("cctvLoginPassword", "");
  setVal("cctvUrl", "");
  setVal("cctvLat", "");
  setVal("cctvLng", "");

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// HTML에서 onclick="submitAddCctv()" 이므로 전역 유지
window.submitAddCctv = function submitAddCctv() {
  const code = getVal("cctvCode").trim();
  const name = getVal("cctvName").trim();
  const url = getVal("cctvUrl").trim();
  const lat = getVal("cctvLat").trim();
  const lng = getVal("cctvLng").trim();
  const loginId = getVal("cctvLoginId").trim();
  const loginPw = getVal("cctvLoginPassword").trim();

  if (!code) return alert("CCTV 코드는 필수입니다.");
  if (!name) return alert("CCTV 이름은 필수입니다.");

  // ✅ 백엔드 DTO/엔티티 필드명에 맞춰 name으로 전송
  const payload = {
    cctvCode: code,
    name: name,
    rtspUrl: url || null,
    latitude: lat || null,
    longitude: lng || null,
    id: loginId || null,
    password: loginPw || null,
    // locationCode가 PK이면 서버에서 기본 세팅하거나, 여기서 같이 보낼 수도 있음
    // locationCode: code,
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
      bootstrap.Modal.getInstance(document.getElementById("addCctvModal"))?.hide();
      loadCctvList();
    })
    .catch((err) => {
      console.error(err);
      alert("CCTV 추가 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
    });
};

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
  const row = document.querySelector(`.cctv-checkbox[value="${cssEscape(code)}"]`)?.closest("tr");
  if (!row) return alert("선택한 CCTV 행을 찾을 수 없습니다.");

  // ✅ 렌더링 시 dataset에 name을 넣는 것을 권장(아래 render에서 반영)
  setVal("editCctvCode", code);
  setVal("editCctvName", row.dataset.name || "");
  setVal("editCctvLoginId", row.dataset.loginId || "");
  setVal("editCctvLoginPassword", ""); // 변경시에만 입력

  setVal("editCctvUrl", row.dataset.rtspUrl || "");
  setVal("editCctvLat", row.dataset.latitude || "");
  setVal("editCctvLng", row.dataset.longitude || "");

  const modalEl = document.getElementById("editCctvModal");
  if (!modalEl) return alert("editCctvModal을 찾을 수 없습니다.");

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function submitEditCctv() {
  const code = getVal("editCctvCode").trim();
  const name = getVal("editCctvName").trim();
  const url = getVal("editCctvUrl").trim();
  const lat = getVal("editCctvLat").trim();
  const lng = getVal("editCctvLng").trim();
  const loginId = getVal("editCctvLoginId").trim();
  const loginPw = getVal("editCctvLoginPassword").trim();

  if (!code) return alert("CCTV 코드를 찾을 수 없습니다.");
  if (!name) return alert("CCTV 이름은 필수입니다.");

  const payload = {
    name,
    rtspUrl: url || null,
    latitude: lat || null,
    longitude: lng || null,
    id: loginId || null,
    ...(loginPw ? { password: loginPw } : {}),
  };

  fetch(`/api/cctv/update/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      return res.json().catch(() => ({}));
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
 * 삭제
 * ----------------------------- */
function deleteSelectedCctv() {
  const selected = getSelectedCctvCodes();
  if (selected.length !== 1) return alert("삭제는 1개만 선택해서 처리하세요.");

  const code = selected[0];
  if (!confirm(`CCTV(${code})를 삭제할까요?`)) return;

  fetch(`/api/cctv/delete/${encodeURIComponent(code)}`, { method: "DELETE" })
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
 * 목록
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
            <span class="text-muted"><i class="bi bi-inbox me-2"></i>등록된 CCTV가 없습니다.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  list.forEach((cctv, idx) => {
    const code = cctv.cctvCode ?? "-";
    const name = cctv.name ?? "";        // ✅ CCTV명은 name을 보여주는 것이 정상
    const url = cctv.rtspUrl ?? "-";
    const statusCam = cctv.statusCam ?? "";
    const lat = cctv.latitude ?? "-";
    const lng = cctv.longitude ?? "-";

    const tr = document.createElement("tr");

    // ✅ edit 모달 채우기용 dataset
    tr.dataset.name = name;
    tr.dataset.rtspUrl = (url === "-" ? "" : url);
    tr.dataset.latitude = (lat === "-" ? "" : lat);
    tr.dataset.longitude = (lng === "-" ? "" : lng);
    tr.dataset.loginId = cctv.id ?? "";
    tr.dataset.loginPw = cctv.password ?? "";

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

    tr.innerHTML = `
      <td><input type="checkbox" value="${escapeHtml(code)}" class="form-check-input cctv-checkbox"/></td>
      <td>${idx + 1}</td>
      <td>${escapeHtml(name || code)}</td>
      <td style="word-break: break-all;">${escapeHtml(url)}</td>
      <td>${statusHtml}</td>
      <td>${escapeHtml(lat)}</td>
      <td>${escapeHtml(lng)}</td>
    `;

    tbody.appendChild(tr);
  });
}

function updateCctvCount(count) {
  const el = document.getElementById("userCount");
  if (!el) return;
  el.textContent = `등록된 CCTV 총 ${count}건 | 등록된 CCTV를 관리하세요`;
}

/* helpers */
function getVal(id) { return document.getElementById(id)?.value ?? ""; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function cssEscape(value) { return String(value).replaceAll('"', '\\"'); }