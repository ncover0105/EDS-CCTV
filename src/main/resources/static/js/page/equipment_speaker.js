const SPEAKER_LIST_API = "/api/btype/query/config/speakers";
const SPEAKER_STATUS_API = (speakerKey) => `/api/btype/query/status/${encodeURIComponent(speakerKey)}`;


const SPEAKER_BASE_API = "/api/btype/query/config/speaker";
const SPEAKER_CREATE_API = SPEAKER_BASE_API; // POST
const SPEAKER_UPDATE_API = (speakerKey) => `${SPEAKER_BASE_API}/${speakerKey}`; // PUT
const SPEAKER_DELETE_API = (speakerKey) => `${SPEAKER_BASE_API}/${speakerKey}`; // DELETE

const SPEAKER_ACTION_API = "/api/btype/command/action";

// 선택: 목록 자동 갱신(초). 0이면 비활성
const SPEAKER_POLL_SECONDS = 0;

// 스피커 테이블 페이지네이션
const SPEAKER_ITEMS_PER_PAGE = 10;

// 페이지 상태(필터/검색 도입 시에도 여기 리스트만 바꾸면 됨)
let speakerPageState = {
  currentPage: 1,
  itemsPerPage: SPEAKER_ITEMS_PER_PAGE,
  // 실제 렌더 대상으로 사용할 리스트(기본: speakerListState)
  viewList: []
};

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

let speakerListState = [];
let pollTimer = null;

/* ------------------------------
  Utils
------------------------------ */
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
  if (window.App && App.utils && typeof App.utils.showGlobalAlert === "function") {
    App.utils.showGlobalAlert(msg, type);
  } else {
    console.log(`[${type}] ${msg}`);
  }
}

function getSelectedSpeakerCheckbox() {
  return document.querySelector('input[name="selectedIds"]:checked');
}

/* ------------------------------
  API calls
------------------------------ */
async function fetchSpeakerList() {
  const res = await fetch(SPEAKER_LIST_API, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`list api failed: ${res.status}`);
  const data = await res.json();
  speakerListState = Array.isArray(data) ? data : [];
  return speakerListState;
}

const API_BASE = window.location.origin;

async function fetchSpeakerStatus(speakerKey) {
  const url = `${API_BASE}/api/btype/query/status/${encodeURIComponent(speakerKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${t}`);
  }
  return await res.json();
}

async function postSpeakerAction({ speakerIds, action, extraParam = "" }) {
  const res = await fetch(SPEAKER_ACTION_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ speakerIds, action, extraParam })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`action failed: ${res.status} ${t}`);
  }
  // 필요 시 서버가 응답 JSON을 주면 여기서 파싱
  return await res.json().catch(() => ({}));
}

/* ------------------------------
  SEARCH (추가)
  - 입력값(이름/ID/지역/전화번호) 포함 시 viewList 필터
------------------------------ */
function normalizeText(v) {
  return String(v ?? "").trim().toLowerCase();
}

function applySpeakerSearch(query) {
  const q = normalizeText(query);
  if (!q) {
    setViewList(speakerListState, { resetPage: true });
    renderSpeakerTable(1);
    return;
  }

  const filtered = (speakerListState || []).filter(x => {
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

  setViewList(filtered, { resetPage: true });
  renderSpeakerTable(1);
}

function bindSpeakerSearchUI() {
  const input = document.getElementById("speakerSearchInput");
  const clearBtn = document.getElementById("speakerSearchClear");

  if (input && !input.dataset.bound) {
    input.addEventListener("input", () => applySpeakerSearch(input.value));
    input.addEventListener("keydown", (e) => {
      // ESC로 초기화
      if (e.key === "Escape") {
        input.value = "";
        applySpeakerSearch("");
      }
    });
    input.dataset.bound = "1";
  }

  if (clearBtn && !clearBtn.dataset.bound) {
    clearBtn.addEventListener("click", () => {
      if (input) input.value = "";
      applySpeakerSearch("");
    });
    clearBtn.dataset.bound = "1";
  }
}

/* ------------------------------
  Render table
------------------------------ */
function renderSpeakerTable(page = speakerPageState.currentPage) {
  const tbody = document.getElementById("speakerTableBody");
  if (!tbody) return;

  // viewList가 비어있으면 기본 상태를 사용
  if (!Array.isArray(speakerPageState.viewList) || speakerPageState.viewList.length === 0) {
    if (Array.isArray(speakerListState) && speakerListState.length > 0) {
      setViewList(speakerListState);
    }
  }

  const list = Array.isArray(speakerPageState.viewList) ? speakerPageState.viewList : [];
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
    const cnt0 = document.getElementById("speakerCount");
    if (cnt0) cnt0.innerText = "0건";

    if (window.App && App.utils && typeof App.utils.renderPagination === "function") {
      App.utils.renderPagination({
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

      if (e.target && e.target.type === "checkbox") {
        document.querySelectorAll('input[name="selectedIds"]').forEach(x => {
          if (x !== cb) x.checked = false;
        });
      } else {
        const was = cb.checked;
        document.querySelectorAll('input[name="selectedIds"]').forEach(x => x.checked = false);
        cb.checked = !was;
      }

      if (!cb.checked) {
        resetDetail();
        return;
      }

      const titleEl = document.getElementById("selectedSpeakerTitle");
      const adrEl = document.getElementById("selectedSpeakeraddress");
      const lastEl = document.getElementById("selectedSpeakerLastUpdate");

      if (titleEl) titleEl.innerText = safe(cb.dataset.name);
      if (adrEl) adrEl.innerText = safe(cb.dataset.adr);
      if (lastEl) lastEl.innerText = "-";
    });

    tbody.appendChild(tr);
  });

  const cnt = document.getElementById("speakerCount");
  if (cnt) cnt.innerText = `${totalItems}건`;

  if (window.App && App.utils && typeof App.utils.renderPagination === "function") {
    App.utils.renderPagination({
      containerId: "speakerPagination",
      currentPage: speakerPageState.currentPage,
      totalItems: totalItems,
      itemsPerPage: speakerPageState.itemsPerPage,
      onPageChange: (p) => {
        speakerPageState.currentPage = p;
        resetDetail();
        renderSpeakerTable(p);
      }
    });
  }
}

/* ------------------------------
  Detail panel reset
------------------------------ */
function resetDetail() {
  const titleEl = document.getElementById("selectedSpeakerTitle");
  const adrEl = document.getElementById("selectedSpeakeraddress");
  const lastEl = document.getElementById("selectedSpeakerLastUpdate");

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
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = "-";
    el.classList.remove("text-success", "text-danger", "text-warning", "text-muted", "text-primary", "fw-semibold");
    el.classList.add("text-muted");
  });
}

/* ------------------------------
  Button click helper (HTML onclick 호환)
------------------------------ */
function handleButtonClick(_, actionFn) {
  const checked = getSelectedSpeakerCheckbox();
  if (!checked) {
    resetDetail();
    alertMsg("스피커를 선택해주세요.", "warning");
    return;
  }
  actionFn(checked);
}

/* ------------------------------
  Request
------------------------------ */
async function requestStatus(selectedCheckbox) {
  const speakerKey = selectedCheckbox.dataset.key || selectedCheckbox.value;
  const speakerName = selectedCheckbox.dataset.name;
  const speakerAdr = selectedCheckbox.dataset.adr;

  try {
    await postSpeakerAction({ speakerIds: [speakerKey], action: "status" });

    const data = await fetchSpeakerStatus(speakerKey);
    if (!data) {
      resetDetail();
      alertMsg("해당 스피커 상태 정보 없음.", "info");
      return;
    }

    const titleEl = document.getElementById("selectedSpeakerTitle");
    const adrEl = document.getElementById("selectedSpeakeraddress");
    const lastEl = document.getElementById("selectedSpeakerLastUpdate");

    if (titleEl) titleEl.innerText = safe(speakerName);
    if (adrEl) adrEl.innerText = safe(speakerAdr);
    if (lastEl) lastEl.innerText = fmtDateTime(data.receiveTime);

    const set = (id, v) => {
      const el = document.getElementById(id);
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

    alertMsg("스피커 상태 조회가 완료되었습니다.", "success");
  } catch (e) {
    console.error(e);
    resetDetail();
    alertMsg("스피커 상태 조회 실패", "danger");
  }
}

async function setTime(selectedCheckbox) {
  const speakerKey = selectedCheckbox.dataset.key || selectedCheckbox.value;
  try {
    await postSpeakerAction({ speakerIds: [speakerKey], action: "time" });
    alertMsg("시간 동기화(발신) 요청을 전송했습니다.", "success");
  } catch (e) {
    console.error(e);
    alertMsg("시간 동기화 요청 실패", "danger");
  }
}

async function resetRequest(selectedCheckbox) {
  const speakerKey = selectedCheckbox.dataset.key || selectedCheckbox.value;

  try {
    await postSpeakerAction({ speakerIds: [speakerKey], action: "reset" });
    alertMsg("리셋(발신) 요청을 전송했습니다.", "success");
  } catch (e) {
    console.error(e);
    alertMsg("리셋(발신) 요청 실패", "danger");
  }
}

/* ------------------------------
  Refresh list + render
------------------------------ */
async function refreshSpeakerListAndRender({ preserveSelection = true } = {}) {
  let selectedKey = null;

  if (preserveSelection) {
    const checked = getSelectedSpeakerCheckbox();
    if (checked) selectedKey = checked.value;
  }

  await fetchSpeakerList();

  // 검색 상태 유지: 현재 검색어가 있으면 그 조건으로 viewList를 다시 계산
  const searchInput = document.getElementById("speakerSearchInput");
  const q = searchInput ? searchInput.value : "";
  if (q && q.trim().length) {
    applySpeakerSearch(q);
  } else {
    setViewList(speakerListState, { resetPage: !preserveSelection });
    renderSpeakerTable(speakerPageState.currentPage);
  }

  if (selectedKey) {
    const cb = document.querySelector(`input[name="selectedIds"][value="${CSS.escape(String(selectedKey))}"]`);
    if (cb) cb.checked = true;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling() {
  stopPolling();
  if (!SPEAKER_POLL_SECONDS || SPEAKER_POLL_SECONDS <= 0) return;

  pollTimer = setInterval(async () => {
    try {
      await refreshSpeakerListAndRender({ preserveSelection: true });
    } catch (e) {
      console.error("[speaker poll]", e);
    }
  }, SPEAKER_POLL_SECONDS * 1000);
}

// 검색은 UI 바인딩으로 처리(입력 즉시 필터)
function listSpeakers() {
  // 새로고침 버튼은 제거하지만, 수정/삭제 후 내부적으로 호출해야 하므로 함수는 유지
  return refreshSpeakerListAndRender({ preserveSelection: false });
}


async function initSpeakerPage() {
  if (!document.getElementById("speakerTableBody")) return;

  try {
    // 목록 조회 + 기본 viewList 설정
    await refreshSpeakerListAndRender({ preserveSelection: false });
    resetDetail();
    startPolling();

    // 검색 UI 바인딩(추가)
    bindSpeakerSearchUI();
  } catch (e) {
    console.error(e);
    resetDetail();
    alertMsg("스피커 목록 조회 실패", "danger");
  }
}

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

    // 리스트 API를 빼셨으므로, 여기서는 화면 갱신 함수를 프로젝트에 맞게 호출하세요.
    // 예: listSpeakers(); 또는 location.reload();
    if (typeof listSpeakers === "function") await listSpeakers();
    if (typeof resetDetail === "function") resetDetail();
  } catch (e) {
    console.error(e);
    alertMsg("추가 실패(엔드포인트/필수값/중복ID 확인)", "danger");
  }
}

async function speakerUpdate() {
  const checked = getSelectedSpeakerCheckbox?.();
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
    speakerId: getVal("edit_speakerId"), // 서버에서 변경 불가여도 보내는 건 문제 없음
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

    if (typeof listSpeakers === "function") await listSpeakers();
    if (typeof resetDetail === "function") resetDetail();
  } catch (e) {
    console.error(e);
    alertMsg("수정 실패(엔드포인트/파라미터 확인)", "danger");
  }
}

async function speakerDeleted() {
  const checked = getSelectedSpeakerCheckbox?.();
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

    if (typeof listSpeakers === "function") await listSpeakers();
    if (typeof resetDetail === "function") resetDetail();
  } catch (e) {
    console.error(e);
    alertMsg("삭제 실패(엔드포인트/권한 확인)", "danger");
  }
}

/* ------------------------------
   Expose globals for HTML handlers
------------------------------ */
window.initSpeakerPage = initSpeakerPage;

window.handleButtonClick = handleButtonClick;
window.requestStatus = requestStatus;
window.setTime = setTime;
window.resetRequest = resetRequest;

window.resetDetail = resetDetail;
window.renderSpeakerTable = renderSpeakerTable;

// 추가 exports (HTML onclick과 호환)
window.listSpeakers = listSpeakers;
window.speakerAdd = speakerAdd;
window.speakerUpdate = speakerUpdate;
window.speakerDeleted = speakerDeleted;