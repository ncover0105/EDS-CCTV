/* ================================
 * equipment_speaker.js (API Only)
 *  - GET  /config/speakers           -> List<SpeakerRowDto>
 *  - GET  /status/{speakerKey}       -> SpkStatusResponse
 * ================================ */

/* ------------------------------
  API endpoints
------------------------------ */
const SPEAKER_LIST_API = "/api/btype/query/config/speakers";
const SPEAKER_STATUS_API = (speakerKey) => `/api/btype/query/status/${encodeURIComponent(speakerKey)}`;

// 선택: 목록 자동 갱신(초). 0이면 비활성
const SPEAKER_POLL_SECONDS = 0;

// 스피커 테이블 페이지네이션
const SPEAKER_ITEMS_PER_PAGE = 15;

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
  return `<span class="status-badge status-primary bg-transparent">
            미수신
          </span>`;
}

function useBadge(saveDivi) {
  // saveDivi: 00 사용(미삭제), 01 미사용(삭제) - 정책에 따라 조정
  const isUse = (!saveDivi || saveDivi === "00");
  const cls = isUse ? "status-success" : "status-primary";
  const text = isUse ? "사용" : "미사용";
  return `<span class="status-badge ${cls}">${text}</span>`;
}

function alertMsg(msg, type) {
  if (window.App && App.utils && typeof App.utils.showGlobalAlert === "function") {
    App.utils.showGlobalAlert(msg, type);
  } else {
    console.log(`[${type}] ${msg}`);
  }
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

async function fetchSpeakerStatus(speakerKey) {
  const res = await fetch(SPEAKER_STATUS_API(speakerKey), { headers: { "Accept": "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`status api failed: ${res.status}`);
  return await res.json();
}

/* ------------------------------
  Render table
  SpeakerRowDto 필드 기대:
  - speakerKey, speakerId, speakerName, connectStatus, receiveTime
  - cdmaNumber, locationName, speakerLatitude, speakerLongitude, saveDivi
  - (선택) speakerAdr : 있으면 상세패널 주소 표시
------------------------------ */
function renderSpeakerTable(page = speakerPageState.currentPage) {
  const tbody = document.getElementById("speakerTableBody");
  if (!tbody) return;

  // viewList가 비어있으면 기본 상태를 사용
  if (!Array.isArray(speakerPageState.viewList) || speakerPageState.viewList.length === 0) {
    // speakerListState가 있을 때(초기 렌더) viewList를 기본으로 셋
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

    // pagination도 0건 상태로 갱신
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

    // 행 클릭 시 단일 선택
    tr.addEventListener("click", (e) => {
      const cb = tr.querySelector('input[type="checkbox"]');
      if (!cb) return;

      if (e.target && e.target.type === "checkbox") {
        // 체크박스 직접 클릭: 다중 선택 허용(기존 정책 유지)
        document.querySelectorAll('input[name="selectedIds"]').forEach(x => {
          if (x !== cb) x.checked = false;
        });
      } else {
        // 행 클릭: 단일 선택 토글
        const was = cb.checked;
        document.querySelectorAll('input[name="selectedIds"]').forEach(x => x.checked = false);
        cb.checked = !was;
      }

      if (!cb.checked) {
        resetDetail();
        return;
      }

      // 선택 즉시 기본 정보 반영 (상태는 버튼에서 호출)
      const titleEl = document.getElementById("selectedSpeakerTitle");
      const adrEl = document.getElementById("selectedSpeakeraddress");
      const lastEl = document.getElementById("selectedSpeakerLastUpdate");

      if (titleEl) titleEl.innerText = safe(cb.dataset.name);
      if (adrEl) adrEl.innerText = safe(cb.dataset.adr);
      if (lastEl) lastEl.innerText = "-";
    });

    tbody.appendChild(tr);
  });

  // 전체 건수는 전체 리스트 기준
  const cnt = document.getElementById("speakerCount");
  if (cnt) cnt.innerText = `${totalItems}건`;

  // Pagination 렌더
  if (window.App && App.utils && typeof App.utils.renderPagination === "function") {
    App.utils.renderPagination({
      containerId: "speakerPagination",
      currentPage: speakerPageState.currentPage,
      totalItems: totalItems,
      itemsPerPage: speakerPageState.itemsPerPage,
      onPageChange: (p) => {
        speakerPageState.currentPage = p;
        // 페이지 이동 시 기존 선택은 보통 UX상 리셋하는게 안전
        resetDetail();
        renderSpeakerTable(p);
      }
    });
  } else {
    // utils 미로딩 시: 최소 동작(이전/다음만)
    const ul = document.getElementById("speakerPagination");
    if (ul) {
      ul.innerHTML = "";
      const mk = (label, disabled, onClick) => {
        const li = document.createElement("li");
        li.className = "page-item" + (disabled ? " disabled" : "");
        li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
        if (!disabled) li.querySelector("a").addEventListener("click", (e) => { e.preventDefault(); onClick(); });
        return li;
      };
      ul.appendChild(mk("이전", speakerPageState.currentPage === 1, () => renderSpeakerTable(speakerPageState.currentPage - 1)));
      ul.appendChild(mk(`${speakerPageState.currentPage}/${totalPages}`, true, () => {}));
      ul.appendChild(mk("다음", speakerPageState.currentPage === totalPages, () => renderSpeakerTable(speakerPageState.currentPage + 1)));
    }
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
  const checked = document.querySelector('input[name="selectedIds"]:checked');
  if (!checked) {
    resetDetail();
    alertMsg("스피커를 선택해주세요.", "warning");
    return;
  }
  actionFn(checked);
}

/* ------------------------------
  Request status (GET /status/{speakerKey})
  SpkStatusResponse 기대 필드:
  - connectionStatus, acStatus, dcStatus, batteryStatus
  - solarStatus, lteStatus, cpuTemp, mcuVersion, receiveTime
------------------------------ */
async function requestStatus(selectedCheckbox) {
  const speakerKey = selectedCheckbox.dataset.key || selectedCheckbox.value;
  const speakerName = selectedCheckbox.dataset.name;
  const speakerAdr = selectedCheckbox.dataset.adr;

  try {
    const data = await fetchSpeakerStatus(speakerKey);
    if (!data) {
      resetDetail();
      alertMsg("해당 스피커 상태 정보 없음.", "info");
      return;
    }

    // 기본 정보
    const titleEl = document.getElementById("selectedSpeakerTitle");
    const adrEl = document.getElementById("selectedSpeakeraddress");
    const lastEl = document.getElementById("selectedSpeakerLastUpdate");

    if (titleEl) titleEl.innerText = safe(speakerName);
    if (adrEl) adrEl.innerText = safe(speakerAdr);
    if (lastEl) lastEl.innerText = fmtDateTime(data.receiveTime);

    // 상태 모니터링 값
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerText = safe(v);
      el.classList.remove("text-success", "text-danger", "text-warning", "text-muted", "text-primary", "fw-semibold");
      // "정상/이상" 문자열이면 색을 간단히 주고 싶으면 아래 로직 유지
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

    // 선택된 행의 수신시간/연결 배지도 같이 갱신(선택 사항)
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

/* ------------------------------
  Refresh list + render (no global)
------------------------------ */
async function refreshSpeakerListAndRender({ preserveSelection = true } = {}) {
  let selectedKey = null;

  if (preserveSelection) {
    const checked = document.querySelector('input[name="selectedIds"]:checked');
    if (checked) selectedKey = checked.value;
  }

  await fetchSpeakerList();

  // 기본 viewList = 전체 목록
  setViewList(speakerListState, { resetPage: !preserveSelection });

  // 선택 유지: 선택된 키가 있으면 해당 항목이 포함된 페이지로 점프
  if (selectedKey && Array.isArray(speakerPageState.viewList) && speakerPageState.viewList.length > 0) {
    const idx = speakerPageState.viewList.findIndex(x => String(x?.speakerKey) === String(selectedKey));
    if (idx >= 0) {
      const p = Math.floor(idx / speakerPageState.itemsPerPage) + 1;
      speakerPageState.currentPage = p;
    }
  }

  renderSpeakerTable(speakerPageState.currentPage);

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

/* =========================
   Entry point for equipment_init.js
========================= */
async function initSpeakerPage() {
  if (!document.getElementById("speakerTableBody")) return;

  try {
    await refreshSpeakerListAndRender({ preserveSelection: false });
    resetDetail();
    startPolling();
  } catch (e) {
    console.error(e);
    resetDetail();
    alertMsg("스피커 목록 조회 실패", "danger");
  }

  // HTML에서 onclick으로도 호출되지만, 혹시 onclick 제거 시를 대비한 바인딩(안전)
  const btn = document.querySelector("#btn-request-status");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", () => handleButtonClick(btn, requestStatus));
    btn.dataset.bound = "1";
  }
}

/* ------------------------------
   Expose globals for HTML handlers
------------------------------ */
window.initSpeakerPage = initSpeakerPage;
window.handleButtonClick = handleButtonClick;
window.requestStatus = requestStatus;
window.resetDetail = resetDetail;
window.renderSpeakerTable = renderSpeakerTable;