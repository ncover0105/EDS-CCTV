document.addEventListener("DOMContentLoaded", () => {
  bindTopButtons();
  loadCctvList();

  // 카드 그리드 컨테이너에서 이벤트 위임
  const cardContainer = document.getElementById("cctvTableBody");
  if (cardContainer) {
    cardContainer.addEventListener("click", (event) => {
      // 수정 버튼 클릭
      const editBtn = event.target.closest(".card-action-edit");
      if (editBtn) {
        event.stopPropagation();
        const card = editBtn.closest(".cctv-card");
        if (card) openEditModalFromCard(card);
        return;
      }

      // 삭제 버튼 클릭
      const delBtn = event.target.closest(".card-action-delete");
      if (delBtn) {
        event.stopPropagation();
        const card = delBtn.closest(".cctv-card");
        if (card) deleteCctvFromCard(card);
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
    setVal("editCctvMountpointId", "");
    setVal("editCctvVideoPort", "");
    setVal("editCctvWsPort", "");
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

  setVal("cctvlocationCode", "");
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
  const locationCode = getVal("cctvlocationCode").trim();
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
  const mountpointId = getVal("editCctvMountpointId").trim();
  const videoPort = getVal("editCctvVideoPort").trim();
  const wsPort = getVal("editCctvWsPort").trim();

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
      bootstrap.Modal.getInstance(document.getElementById("editCctvModal"))?.hide();
      loadCctvList();
    })
    .catch((err) => {
      console.error(err);
      alert("CCTV 수정 중 오류가 발생했습니다.\n" + (err?.message ?? ""));
    });
}

/* -----------------------------
 * 목록 - CCTV 카드 그리드 렌더링
 * ----------------------------- */
function loadCctvList() {
  fetch("/api/cctv/list")
    .then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    })
    .then((data) => {
      renderCctvCards(Array.isArray(data) ? data : []);
      updateCctvCount(Array.isArray(data) ? data.length : 0);
    })
    .catch((err) => {
      console.error(err);
      alert("CCTV 목록 조회 중 오류가 발생했습니다.");
    });
}

function renderCctvCards(list) {
  const container = document.getElementById("cctvTableBody");
  if (!container) return;

  container.innerHTML = "";

  // 빈 목록일 때 Empty State
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = `
      <div class="cctv-empty-state">
        <div class="empty-state-icon">
          <i class="bi bi-camera-video"></i>
        </div>
        <h3 class="empty-state-title">아직 등록된 CCTV가 없습니다</h3>
        <p class="empty-state-description">
          새 CCTV를 추가하여 실시간 모니터링을 시작하세요
        </p>
        <button class="cctv-btn-secondary" onclick="document.getElementById('btn-register').click()">
          <i class="bi bi-plus-lg"></i>
          첫 CCTV 추가하기
        </button>
      </div>
    `;
    return;
  }

  // CCTV 카드 렌더링
  list.forEach((cctv, index) => {
    const locationCode = cctv.locationCode ?? "";
    const code = cctv.cctvCode ?? "-";
    const name = cctv.name ?? "";
    const url = cctv.rtspUrl ?? "-";
    const statusCam = cctv.statusCam ?? "";
    const lat = cctv.latitude ?? "-";
    const lng = cctv.longitude ?? "-";

    // 상태 배지 HTML
    let statusBadgeHtml = "";
    if (statusCam === "1") {
      statusBadgeHtml = `
        <span class="cctv-badge cctv-badge-success">
          <i class="bi bi-check-circle-fill"></i>
          <span>정상</span>
        </span>
      `;
    } else if (statusCam === "0") {
      statusBadgeHtml = `
        <span class="cctv-badge cctv-badge-error">
          <i class="bi bi-x-circle-fill"></i>
          <span>신호없음</span>
        </span>
      `;
    } else {
      statusBadgeHtml = `
        <span class="cctv-badge cctv-badge-unknown">
          <i class="bi bi-question-circle-fill"></i>
          <span>알 수 없음</span>
        </span>
      `;
    }

    // 카드 엘리먼트 생성
    const card = document.createElement("div");
    card.className = "cctv-card";

    // 데이터 속성 설정
    card.dataset.locationCode = locationCode;
    card.dataset.cctvCode = code;
    card.dataset.name = name;
    card.dataset.loginId = cctv.id ?? "";
    card.dataset.loginPw = cctv.password ?? "";
    card.dataset.rtspUrl = url === "-" ? "" : url;
    card.dataset.latitude = lat === "-" ? "" : lat;
    card.dataset.longitude = lng === "-" ? "" : lng;
    card.dataset.mountpointId = cctv.mountpointId ?? "";
    card.dataset.videoPort = cctv.videoPort ?? "";
    card.dataset.wsPort = cctv.wsPort ?? "";

    // 카드 HTML 구성
    card.innerHTML = `
      <!-- 카드 헤더 -->
      <div class="cctv-card-header">
        <div class="card-checkbox-wrapper">
          <input type="checkbox"
            name="selectedCctv"
            value="${escapeHtml(locationCode)}|${escapeHtml(code)}"
            class="form-check-input cctv-checkbox"
            id="cctv-check-${index}" />
          <label for="cctv-check-${index}" class="checkbox-label"></label>
        </div>
        <div class="card-status-wrapper">
          ${statusBadgeHtml}
        </div>
      </div>

      <!-- 카드 바디 -->
      <div class="cctv-card-body">
        <!-- CCTV 코드 -->
        <div class="card-main-info">
          <h3 class="card-title">${escapeHtml(name || code)}</h3>
          <p class="card-subtitle">Location: ${escapeHtml(locationCode || 'N/A')}</p>
        </div>

        <!-- RTSP URL -->
        <div class="card-url-section">
          <div class="card-label">
            <i class="bi bi-link-45deg"></i>
            <span>RTSP URL</span>
          </div>
          <div class="card-url-value">${escapeHtml(url)}</div>
        </div>

        <!-- 위치 정보 -->
        <div class="card-location-grid">
          <div class="card-location-item">
            <div class="card-label">
              <i class="bi bi-geo-alt"></i>
              <span>위도</span>
            </div>
            <div class="card-value">${escapeHtml(lat)}</div>
          </div>
          <div class="card-location-item">
            <div class="card-label">
              <i class="bi bi-geo-alt-fill"></i>
              <span>경도</span>
            </div>
            <div class="card-value">${escapeHtml(lng)}</div>
          </div>
        </div>
      </div>

      <!-- 카드 푸터 -->
      <div class="cctv-card-footer">
        <button class="card-action-btn card-action-edit" 
          data-code="${escapeHtml(code)}"
          title="수정">
          <i class="bi bi-pencil"></i>
          <span>수정</span>
        </button>
        <button class="card-action-btn card-action-delete"
          data-code="${escapeHtml(code)}"
          title="삭제">
          <i class="bi bi-trash"></i>
          <span>삭제</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// 카드에서 수정 모달 열기
function openEditModalFromCard(card) {
  setVal("editCctvlocationCode", card.dataset.locationCode || "");
  setVal("editCctvCode", card.dataset.cctvCode || "");
  setVal("editCctvName", card.dataset.name || "");
  setVal("editCctvLoginId", card.dataset.loginId || "");
  setVal("editCctvLoginPassword", "");
  setVal("editCctvUrl", card.dataset.rtspUrl || "");
  setVal("editCctvMountpointId", card.dataset.mountpointId || "");
  setVal("editCctvVideoPort", card.dataset.videoPort || "");
  setVal("editCctvWsPort", card.dataset.wsPort || "");
  setVal("editCctvLat", card.dataset.latitude || "");
  setVal("editCctvLng", card.dataset.longitude || "");

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("editCctvModal")
  ).show();
}

// 카드에서 삭제
function deleteCctvFromCard(card) {
  const code = card.dataset.cctvCode;
  const locationCode = card.dataset.locationCode || "";

  if (!locationCode) {
    return alert("locationCode가 없습니다. 목록 데이터를 확인하세요.");
  }

  if (!confirm(`CCTV(${locationCode}/${code})를 삭제할까요?`)) return;

  fetch(`/api/cctv/${encodeURIComponent(locationCode)}/${encodeURIComponent(code)}`, {
    method: "DELETE"
  })
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

/* ----------------------------- 
 * 레거시 함수 (하위 호환성 유지)
 * ----------------------------- */
// Thymeleaf에서 직접 호출하는 함수들을 window에 노출
window.editCctv = function (locationCode, cctvCode) {
  // 해당 카드 찾기
  const cards = document.querySelectorAll('.cctv-card');
  for (const card of cards) {
    if (card.dataset.locationCode === locationCode &&
      card.dataset.cctvCode === cctvCode) {
      openEditModalFromCard(card);
      return;
    }
  }
  alert('해당 CCTV를 찾을 수 없습니다.');
};

window.deleteCctv = function (locationCode, cctvCode) {
  // 해당 카드 찾기
  const cards = document.querySelectorAll('.cctv-card');
  for (const card of cards) {
    if (card.dataset.locationCode === locationCode &&
      card.dataset.cctvCode === cctvCode) {
      deleteCctvFromCard(card);
      return;
    }
  }
  alert('해당 CCTV를 찾을 수 없습니다.');
};

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

