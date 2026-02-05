document.addEventListener("DOMContentLoaded", () => {
  bindTopButtons();
  loadCctvList();

  const tbody = document.getElementById("cctvTableBody");
  if (tbody) {
    tbody.addEventListener("click", (event) => {
      const editBtn = event.target.closest(".row-edit-btn");
      if (editBtn) {
        event.stopPropagation();
        const row = editBtn.closest("tr");
        if (row) openEditModalFromRow(row);
        return;
      }

      const delBtn = event.target.closest(".row-del-btn");
      if (delBtn) {
        event.stopPropagation();
        const row = delBtn.closest("tr");
        if (row) deleteCctvFromRow(row);
      }
    });
  }

  const editModalEl = document.getElementById("editCctvModal");
  if (!editModalEl) return;

  editModalEl.addEventListener("hidden.bs.modal", () => {
    setVal("editCctvlocationCode", "");
    setVal("editCctvCode", "");
    setVal("editCctvName", "");
    setVal("editCctvLoginId", "");
    setVal("editCctvLoginPassword", "");
    setVal("editCctvUrl", "");
    setVal("editCctvLat", "");
    setVal("editCctvLng", "");
  });
});

function bindTopButtons() {
  const btnRegister = document.getElementById("btn-register");
  if (btnRegister) btnRegister.addEventListener("click", openAddModal);

  const btnSaveEdit = document.getElementById("btn-save-edit-cctv");
  if (btnSaveEdit) btnSaveEdit.addEventListener("click", submitEditCctv);
}

/* -----------------------------
 * 추가
 * ----------------------------- */
function openAddModal() {
  const modalEl = document.getElementById("addCctvModal");
  if (!modalEl) return alert("addCctvModal을 찾을 수 없습니다.");

  setVal("cctvLocationCode", "");
  setVal("cctvCode", "");
  setVal("cctvName", "");
  setVal("cctvLoginId", "");
  setVal("cctvLoginPassword", "");
  setVal("cctvUrl", "");
  setVal("cctvMountpointId", "");
  setVal("cctvVideoPort", "");
  setVal("cctvWsPort", "");
  setVal("cctvLat", "");
  setVal("cctvLng", "");

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}
window.submitAddCctv = function submitAddCctv() {
  const locationCode = getVal("cctvLocationCode").trim();
  const code = getVal("cctvCode").trim();
  const name = getVal("cctvName").trim();
  const url = getVal("cctvUrl").trim();
  const lat = getVal("cctvLat").trim();
  const lng = getVal("cctvLng").trim();
  const loginId = getVal("cctvLoginId").trim();
  const loginPw = getVal("cctvLoginPassword").trim();
  const mountpointId = getVal("cctvMountpointId").trim();
  const videoPort = getVal("cctvVideoPort").trim();
  const wsPort = getVal("cctvWsPort").trim();

  if (!code) return alert("CCTV 코드는 필수입니다.");
  if (!name) return alert("CCTV 이름은 필수입니다.");

  const payload = {
    locationCode: locationCode || null,
    cctvCode: code,
    name: name,
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
      bootstrap.Modal.getInstance(document.getElementById("addCctvModal"))?.hide();
      loadCctvList();
    })
    .catch((err) => {
      console.error(err);
      alert("CCTV 추가 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
    });
};

function submitEditCctv() {
  const locationCode = getVal("editCctvlocationCode").trim();
  const code = getVal("editCctvCode").trim();
  const name = getVal("editCctvName").trim();
  const url = getVal("editCctvUrl").trim();
  const lat = getVal("editCctvLat").trim();
  const lng = getVal("editCctvLng").trim();
  const loginId = getVal("editCctvLoginId").trim();
  const loginPw = getVal("editCctvLoginPassword").trim();

  if (!locationCode) return alert("Location 코드를 찾을 수 없습니다.");
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
      bootstrap.Modal.getInstance(document.getElementById("editCctvModal"))?.hide();
      loadCctvList();
    })
    .catch((err) => {
      console.error(err);
      alert("CCTV 수정 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
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

  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `
      <tr class="text-center">
        <td colspan="6" style="height: 60vh;">
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

  list.forEach((cctv) => {
    const locationCode = cctv.locationCode ?? "";
    const code = cctv.cctvCode ?? "-";
    const name = cctv.name ?? "";
    const url = cctv.rtspUrl ?? "-";
    const statusCam = cctv.statusCam ?? "";
    const lat = cctv.latitude ?? "-";
    const lng = cctv.longitude ?? "-";

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

    tr.dataset.locationCode = locationCode;
    tr.dataset.code = code;
    tr.dataset.name = name;
    tr.dataset.loginId = cctv.id ?? "";
    tr.dataset.loginPw = cctv.password ?? "";
    tr.dataset.rtspUrl = (url === "-" ? "" : url);
    tr.dataset.latitude = (lat === "-" ? "" : lat);
    tr.dataset.longitude = (lng === "-" ? "" : lng);
    tr.dataset.mountpointId = cctv.mountpointId ?? "";
    tr.dataset.videoPort = cctv.videoPort ?? "";
    tr.dataset.wsPort = cctv.wsPort ?? "";

    tr.innerHTML = `
      <td>${escapeHtml(name || code)}</td>
      <td style="word-break: break-all;">${escapeHtml(url)}</td>
      <td>${statusHtml}</td>
      <td>${escapeHtml(lat)}</td>
      <td>${escapeHtml(lng)}</td>
      <td class="text-center">
        <button class="icon-btn me-1 row-edit-btn"
                data-code="${escapeHtml(code)}" title="수정">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="icon-btn delete row-del-btn"
                data-code="${escapeHtml(code)}" title="삭제">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEditModalFromRow(row) {
  setVal("editCctvlocationCode", row.dataset.locationCode || "");
  setVal("editCctvCode", row.dataset.code);
  setVal("editCctvName", row.dataset.name || "");
  setVal("editCctvLoginId", row.dataset.loginId || "");
  setVal("editCctvLoginPassword", "");
  setVal("editCctvUrl", row.dataset.rtspUrl || "");
  setVal("editCctvMountpointId", row.dataset.mountpointId || "");
  setVal("editCctvVideoPort", row.dataset.videoPort || "");
  setVal("editCctvWsPort", row.dataset.wsPort || "");
  setVal("editCctvLat", row.dataset.latitude || "");
  setVal("editCctvLng", row.dataset.longitude || "");

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("editCctvModal")
  ).show();
}

function deleteCctvFromRow(row) {
  const code = row.dataset.code;
  const locationCode = row.dataset.locationCode || "";
  if (!locationCode) {
    return alert("locationCode가 없습니다. 목록 데이터를 확인하세요.");
  }

  if (!confirm(`CCTV(${locationCode}/${code})를 삭제할까요?`)) return;

  fetch(`/api/cctv/${encodeURIComponent(locationCode)}/${encodeURIComponent(code)}`, { method: "DELETE" })
    .then((res) => {
      if (!res.ok) throw new Error("delete failed");
      loadCctvList();
    })
    .catch(() => alert("삭제 처리 중 오류가 발생했습니다."));
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