/* ================================
 * equipment_speaker.js (API Only)
 *  - GET  /config/speakers           -> List<SpeakerRowDto>
 *  - GET  /status/{speakerKey}       -> SpkStatusResponse
 *  - window.speakerList 사용 ❌ (전역 상태 제거)
 * ================================ */

/* ------------------------------
   API endpoints
------------------------------ */
const SPEAKER_LIST_API = "/api/btype/query/config/speakers";
const SPEAKER_STATUS_API = (speakerKey) => `/api/btype/query/status/${encodeURIComponent(speakerKey)}`;

// 선택: 목록 자동 갱신(초). 0이면 비활성
const SPEAKER_POLL_SECONDS = 0;

/* ------------------------------
   Local state (전역 아님)
------------------------------ */
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
function renderSpeakerTable() {
  const tbody = document.getElementById("speakerTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!speakerListState || speakerListState.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted py-4">
          등록된 스피커가 없습니다.
        </td>
      </tr>`;
    const cnt0 = document.getElementById("speakerCount");
    if (cnt0) cnt0.innerText = "0건";
    return;
  }

  speakerListState.forEach(item => {
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

  const cnt = document.getElementById("speakerCount");
  if (cnt) cnt.innerText = `${speakerListState.length}건`;
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
  renderSpeakerTable();

  if (selectedKey) {
    const cb = document.querySelector(`input[name="selectedIds"][value="${CSS.escape(String(selectedKey))}"]`);
    if (cb) cb.checked = true;
  }
}

/* ------------------------------
   Polling (optional)
------------------------------ */
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
