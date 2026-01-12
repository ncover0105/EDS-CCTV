/**
 * ======================================================
 * setting_bgm.js
 *  - BGM 관리 + (스케줄 카드 UI) 통합JS 스타일 동작
 *  - ✅ 스케줄 모달: 발령 설정 + (TTS시만 메시지) + 스피커 리스트 선택
 * ======================================================
 */

/* =======================
 * BGM(파일) CRUD 파트
 * ======================= */
let bgmData = [];
let bgmInitialized = false;

const ScheduleApi = {
  async listSpeakers() {
    const res = await fetch("/api/btype/query/config/list");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
  },

  async listDisasters() {
    const res = await fetch("/api/btype/query/disaster");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
  }
};

function initBgmManager() {
  if (bgmInitialized) return;
  bgmInitialized = true;

  console.log('[BGM] initBgmManager');

  // BGM CRUD
  syncBgmDataFromDOM();
  bindBgmEvents();
  updateBgmCountText();

  // ✅ 통합JS처럼: 스케줄도 함께 초기화/렌더
  initScheduleManager();

  // ✅ 스케줄 모달(발령 설정 + 스피커 선택) 이벤트 바인딩
  bindScheduleModalEvents();
}

/* ---------- DOM -> Data ---------- */
function syncBgmDataFromDOM() {
  const tbody = document.getElementById('bgmList');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  bgmData = rows.map((tr, idx) => {
    const cb = tr.querySelector('input[name="selectedBgmIds"]');
    const tds = tr.querySelectorAll('td');

    const id = cb?.value ?? String(idx + 1);
    const name = (tds[2]?.textContent ?? '').trim();
    const path = (tds[3]?.textContent ?? '').trim();
    const useText = (tds[4]?.textContent ?? '').trim();
    const useFlag = useText.includes('사용') ? 'Use' : 'Unuse';

    return { id, name, path, useFlag };
  });
}

/* ---------- Events ---------- */
function bindBgmEvents() {
  const tbody = document.getElementById('bgmList');
  if (!tbody) return;

  tbody.addEventListener('click', (e) => {
    if (e.target.matches('input[type="checkbox"]')) return;
    const row = e.target.closest('tr');
    if (!row) return;
    const cb = row.querySelector('input[name="selectedBgmIds"]');
    if (!cb) return;

    cb.checked = !cb.checked;
    row.classList.toggle('table-active', cb.checked);
  });

  tbody.addEventListener('change', (e) => {
    if (!e.target.matches('input[name="selectedBgmIds"]')) return;
    const row = e.target.closest('tr');
    if (row) row.classList.toggle('table-active', e.target.checked);
  });

  const saveBtn = document.getElementById('bgmSaveUpdateBtn');
  if (saveBtn) saveBtn.addEventListener('click', onSaveBgmModal);
}

function getSelectedBgmIds() {
  return Array.from(
    document.querySelectorAll('#bgmList input[name="selectedBgmIds"]:checked')
  ).map(cb => cb.value);
}

function clearBgmSelection() {
  document.querySelectorAll('#bgmList input[name="selectedBgmIds"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#bgmList tr').forEach(tr => tr.classList.remove('table-active'));
}

/* ---------- CRUD ---------- */
function bgmInsert() { openBgmModal('insert'); }

function bgmUpdate() {
  const ids = getSelectedBgmIds();
  if (ids.length !== 1) return alert('수정은 1개만 선택하세요.');

  const item = bgmData.find(x => String(x.id) === String(ids[0]));
  if (!item) return alert('선택한 BGM 항목을 찾을 수 없습니다.');

  openBgmModal('update', item);
}

function bgmDeprecated() {
  const ids = getSelectedBgmIds();
  if (ids.length === 0) return alert('삭제(미사용)할 BGM을 선택하세요.');
  if (!confirm(`선택한 ${ids.length}개 BGM을 미사용 처리할까요?`)) return;

  ids.forEach(id => {
    const item = bgmData.find(x => String(x.id) === String(id));
    if (item) item.useFlag = 'Unuse';
  });

  clearBgmSelection();
  renderBgmTable();
  updateBgmCountText();
  // TODO 서버연동
}

/* ---------- Modal ---------- */
function openBgmModal(mode, item = null) {
  const modalEl = document.getElementById('bgmUpdateModal');
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  modalEl.dataset.mode = mode;
  const title = modalEl.querySelector('.modal-title');
  if (title) title.textContent = (mode === 'insert') ? 'BGM 추가' : 'BGM 수정';

  setVal('bgmUpdateId', item?.id ?? '');
  setVal('bgmUpdateName', item?.name ?? '');
  setVal('bgmUpdatePath', item?.path ?? '');
  setVal('bgmUpdateStatus', item?.useFlag === 'Use' ? '사용' : '미사용');

  modal.show();
}

function onSaveBgmModal() {
  const modalEl = document.getElementById('bgmUpdateModal');
  if (!modalEl) return;

  const mode = modalEl.dataset.mode || 'update';

  const id = getVal('bgmUpdateId').trim();
  const name = getVal('bgmUpdateName').trim();
  const path = getVal('bgmUpdatePath').trim();
  const statusKor = getVal('bgmUpdateStatus');
  const useFlag = statusKor === '사용' ? 'Use' : 'Unuse';

  if (!name) return alert('BGM 이름은 필수입니다.');

  if (mode === 'insert') {
    bgmData.unshift({ id: String(Date.now()), name, path, useFlag });
    // TODO 서버연동
  } else {
    const item = bgmData.find(x => String(x.id) === String(id));
    if (!item) return alert('수정할 BGM을 찾을 수 없습니다.');
    item.name = name;
    item.path = path;
    item.useFlag = useFlag;
    // TODO 서버연동
  }

  renderBgmTable();
  updateBgmCountText();
  bootstrap.Modal.getOrCreateInstance(modalEl).hide();
}

/* ---------- Render ---------- */
function renderBgmTable() {
  const tbody = document.getElementById('bgmList');
  if (!tbody) return;

  tbody.innerHTML = '';
  bgmData.forEach((b, idx) => {
    const isUse = b.useFlag === 'Use';
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><input type="checkbox" name="selectedBgmIds" value="${escapeHtml(b.id)}"></td>
        <td>${idx + 1}</td>
        <td>${escapeHtml(b.name)}</td>
        <td class="text-wrap">${escapeHtml(b.path)}</td>
        <td>
          <span class="status-badge ${isUse ? 'status-success' : 'status-primary'}">
            ${isUse ? '사용중' : '미사용'}
          </span>
        </td>
      </tr>
    `);
  });
}

function updateBgmCountText() {
  const el = document.getElementById('bgmCount');
  if (!el) return;
  el.textContent = `총 ${bgmData.length}개 | BGM 항목을 관리하세요`;
}

/* ======================================================
 * ✅ Schedule (통합 JS 스타일)
 * ====================================================== */

let scheduleInitialized = false;
let scheduleList = [];
let expandedSchedule = null;

const weekDays = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' }, { key: 'wed', label: '수' },
  { key: 'thu', label: '목' }, { key: 'fri', label: '금' }, { key: 'sat', label: '토' }, { key: 'sun', label: '일' }
];

// function initScheduleManager() {
//   if (scheduleInitialized) return;
//   scheduleInitialized = true;

//   // bgm에서만 의미 있게 동작
//   if (window.currentView && window.currentView !== 'bgm') return;

//   const listDiv = document.getElementById('schedule-list');
//   const emptyMsg = document.getElementById('no-schedule-msg');
//   if (!listDiv || !emptyMsg) return; // 스케줄 UI가 없으면 종료

//   // ✅ 원본 데이터(없으면 빈 배열)
//   const raw = window.scheduleListDataRaw;
//   const scheduleListData = Array.isArray(raw) ? raw : [];

//   scheduleList = scheduleListData.length ? groupSchedules(scheduleListData) : [];
//   window.scheduleList = scheduleList;

//   renderScheduleList();
//   bindScheduleEvents();
// }

async function initScheduleManager() {
  if (scheduleInitialized) return;
  scheduleInitialized = true;

  if (window.currentView && window.currentView !== 'bgm') return;

  const listDiv = document.getElementById('schedule-list');
  const emptyMsg = document.getElementById('no-schedule-msg');
  if (!listDiv || !emptyMsg) return;

  const res = await fetch('/api/btype/schedule/list');
  const data = res.ok ? await res.json() : [];
  scheduleList = Array.isArray(data) ? data : [];

  renderScheduleList();
  bindScheduleEvents();
}

function groupSchedules(scheduleListData) {
  const formatDateTime = (dt) => {
    if (!dt) return '-';
    return String(dt).substring(0, 16).replace('T', ' ');
  };

  return Object.values(
    scheduleListData.reduce((acc, schedule) => {
      const id = schedule.scheduleId;

      if (!acc[id]) {
        acc[id] = {
          id: schedule.scheduleId,
          name: schedule.scheduleName,
          startTime: String(schedule.startTime),
          endTime: String(schedule.endTime),
          playType: schedule.playType,
          bgmFolder: schedule.folderName,
          isRepeat: schedule.repeatEnabled || false,
          weekSchedule: schedule.weekSchedule,
          createdDate: formatDateTime(schedule.recvTime),
          createdAt: formatDateTime(schedule.createdAt),
          speakers: []
        };
      }

      if (schedule.speakerCode) {
        acc[id].speakers.push({
          speakerCode: schedule.speakerCode,
          speakerName: schedule.speakerName || '-',
          installAddress: schedule.installAddress || '-',
          phone: schedule.phone || '-',
          connStat: schedule.connStat || '00',
          recvTime: formatDateTime(schedule.recvTime),
          createdAt: formatDateTime(schedule.createdAt)
        });
      }

      return acc;
    }, {})
  );
}

function renderScheduleList() {
  const listDiv = document.getElementById('schedule-list');
  const countSpan = document.getElementById('schedule-count');
  const emptyMsg = document.getElementById('no-schedule-msg');
  if (!listDiv || !emptyMsg) return;

  emptyMsg.classList.toggle('d-none', scheduleList.length > 0);

  if (countSpan) {
    countSpan.textContent =
      `총 ${scheduleList.length}개의 스케줄 | 재생 스케줄과 단말 정보를 관리하세요`;
  }

  listDiv.innerHTML = '';
  if (scheduleList.length === 0) return;

  scheduleList.forEach(schedule => {
    const isExpanded = expandedSchedule === schedule.id;

    let weekStr = '-';
    if (schedule.weekSchedule && typeof schedule.weekSchedule === 'object') {
      weekStr = weekDays
        .filter(d => schedule.weekSchedule[d.key])
        .map(d => d.label)
        .join(', ') || '-';
    }

    const scheduleName = escapeHtml(schedule.name ?? '이름 없는 스케줄');
    const playTypeTxt = escapeHtml(schedule.playType ?? '-');
    const createdTxt = escapeHtml(schedule.createdDate ?? '');
    const timeRange =
      `${escapeHtml((schedule.startTime ?? '').substring(0, 5))} ~ ` +
      `${escapeHtml((schedule.endTime ?? '').substring(0, 5))}`;

    const repeatInfo = schedule.isRepeat
      ? `<span class="meta-item text-primary">
           <i class="bi bi-arrow-repeat"></i>반복
         </span>`
      : '';

    const bgmInfo =
      (schedule.playType === 'BGM' && schedule.bgmFolder)
        ? `<span class="meta-item">
             <i class="bi bi-file-earmark-music"></i>
             ${escapeHtml(schedule.bgmFolder)}
           </span>`
        : '';

    const card = document.createElement('div');
    card.className = 'schedule-card-v2 mb-2';
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-3">

        <!-- 좌측: 스케줄 핵심 정보 -->
        <div class="flex-grow-1" style="min-width:260px;">

          <!-- 스케줄 이름 -->
          <div class="d-flex align-items-center gap-2 mb-2">
            <button class="icon-btn"
                    type="button"
                    data-action="toggle"
                    data-id="${schedule.id}"
                    aria-label="toggle">
              <i class="bi bi-chevron-${isExpanded ? 'up' : 'down'}"></i>
            </button>

            <i class="bi bi-calendar-event text-info"></i>
            <div class="fw-semibold text-white fs-6">
              ${scheduleName}
            </div>

            <span class="status-badge ${schedule.playType === 'BGM'
              ? 'status-info'
              : 'status-purple'} ms-1">
              ${playTypeTxt}
            </span>
          </div>

          <!-- 메타 정보 -->
          <div class="schedule-meta">
            <span class="meta-item">
              <i class="bi bi-clock"></i>${timeRange}
            </span>

            <span class="meta-item">
              <i class="bi bi-calendar-week"></i>${escapeHtml(weekStr)}
            </span>

            ${repeatInfo}
            ${bgmInfo}

            <span class="meta-item text-muted">
              <i class="bi bi-calendar3"></i>${createdTxt}
            </span>
          </div>
        </div>

        <!-- 우측: 액션 -->
        <div class="schedule-actions flex-shrink-0">
          <button class="icon-btn"
                  type="button"
                  data-action="edit"
                  data-id="${schedule.id}"
                  aria-label="edit">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="icon-btn"
                  type="button"
                  data-action="delete"
                  data-id="${schedule.id}"
                  aria-label="delete">
            <i class="bi bi-trash3 text-danger"></i>
          </button>
        </div>
      </div>

      ${isExpanded
        ? `<div class="schedule-expand">
             ${renderSpeakerTable(schedule)}
           </div>`
        : ''}
    `;

    listDiv.appendChild(card);
  });
}

// function renderSpeakerTable(schedule) {
//   const speakers = Array.isArray(schedule.speakers) ? schedule.speakers : [];
//   if (speakers.length === 0) {
//     return `
//       <hr class="my-3">
//       <div class="alert alert-info mb-0" role="alert">
//         <i class="bi bi-info-circle me-2"></i>할당된 단말이 없습니다.
//       </div>
//     `;
//   }

//   return `
//     <hr class="my-3">
//     <div>
//       <h6 class="fw-bold mb-3 text-muted">할당된 스피커 (${speakers.length}개)</h6>
//       <div class="table-responsive rounded-3">
//         <table class="table table-dark">
//           <thead>
//             <tr>
//               <th>코드</th><th>단말명</th><th>설치주소</th><th>연락처</th><th>연결상태</th><th>등록시간</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${speakers.map(sp => `
//               <tr>
//                 <td><small class="text-muted">${escapeHtml(sp.speakerCode || '-')}</small></td>
//                 <td>${escapeHtml(sp.speakerName || '-')}</td>
//                 <td>${escapeHtml(sp.installAddress || '-')}</td>
//                 <td>${escapeHtml(sp.phone || '-')}</td>
//                 <td>
//                   <span class="status-badge ${
//                     sp.connStat === '01' ? 'status-success' :
//                     sp.connStat === '00' ? 'status-primary' : 'status-warning'
//                   }">
//                     ${sp.connStat === '01' ? '연결' : sp.connStat === '00' ? '미연결' : '알수없음'}
//                   </span>
//                 </td>
//                 <td><small class="text-muted">${escapeHtml(sp.createdAt ? String(sp.createdAt).substring(0, 19) : '-')}</small></td>
//               </tr>
//             `).join('')}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   `;
// }
function renderSpeakerTable(schedule) {
  const speakers = Array.isArray(schedule.speakers) ? schedule.speakers : [];

  if (speakers.length === 0) {
    return `
      <!-- <hr class="my-3" style="border-color:#30363D;"> -->
      <div class="p-3 rounded-3 border" style="background:#0D1117;border-color:#30363D;color:#8B949E;">
        <i class="bi bi-info-circle me-2"></i>할당된 단말이 없습니다.
      </div>
    `;
  }

  return `
    <!-- <hr class="my-3" style="border-color:#30363D;"> -->
    <div>
      <h6 class="fw-bold mb-3" style="color:#8B949E;">
        할당된 스피커 (${speakers.length}개)
      </h6>

      <!-- 다크 테이블 컨테이너 -->
      <div class="table-responsive rounded-3 schedule-table-wrap">
        <table class="table table-dark align-middle mb-0 w-100">
          <colgroup>
            <col style="width: 12%;">
            <col style="width: 16%;">
            <col style="width: 22%;">
            <col style="width: 16%;">
            <col style="width: 12%;">
            <col style="width: 22%;">
          </colgroup>
          <thead>
            <tr>
              <th>코드</th>
              <th>단말명</th>
              <th>설치주소</th>
              <th>연락처</th>
              <th>연결상태</th>
              <th>등록시간</th>
            </tr>
          </thead>

          <tbody>
            ${speakers.map(sp => {
              const statClass =
                sp.connStat === '01' ? 'status-success' :
                sp.connStat === '00' ? 'status-primary' : 'status-warning';

              const statText =
                sp.connStat === '01' ? '연결' :
                sp.connStat === '00' ? '미연결' : '알수없음';

              const createdAt = sp.createdAt ? String(sp.createdAt).substring(0, 19) : '-';

              return `
                <tr style="border-color:#30363D;">
                  <td style="border-color:#30363D;">
                    <small style="color:#8B949E;">${escapeHtml(sp.speakerCode || '-')}</small>
                  </td>
                  <td style="border-color:#30363D;">${escapeHtml(sp.speakerName || '-')}</td>
                  <td style="border-color:#30363D;">${escapeHtml(sp.installAddress || '-')}</td>
                  <td style="border-color:#30363D;">${escapeHtml(sp.phone || '-')}</td>
                  <td style="border-color:#30363D;">
                    <span class="status-badge ${statClass}">${statText}</span>
                  </td>
                  <td style="border-color:#30363D;">
                    <small style="color:#8B949E;">${escapeHtml(createdAt)}</small>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindScheduleEvents() {
  const listDiv = document.getElementById('schedule-list');
  if (!listDiv) return;

  listDiv.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);

    if (action === 'toggle') {
      expandedSchedule = (expandedSchedule === id) ? null : id;
      renderScheduleList();
      return;
    }

    if (action === 'edit') {
      console.log('[Schedule] edit:', id);
      alert('스케줄 수정 연결 전입니다.');
      return;
    }

    if (action === 'delete') {
      if (!confirm('해당 스케줄을 삭제할까요?')) return;
      console.log('[Schedule] delete:', id);
      alert('스케줄 삭제 연결 전입니다.');
    }
  });
}

/* ======================================================
 * ✅ Schedule Modal open/bind
 *  - TTS 선택 시에만 메시지 표시
 *  - 스피커 리스트 로드(/api/btype/query/config/list) 후 체크 선택
 * ====================================================== */

let modalSpeakers = [];
let modalSpeakersFiltered = [];
let selectedSpeakerKeys = new Set();
let disastersLoaded = false;

function openScheduleModalCreate() {
  const modalEl = document.getElementById('scheduleModal');
  const formEl = document.getElementById('schedule-form');
  if (!modalEl || !formEl) {
    console.error('scheduleModal or schedule-form not found');
    return;
  }

  const titleEl = document.getElementById('scheduleModalLabel');
  const submitBtn = document.getElementById('submitBtn');
  if (titleEl) titleEl.textContent = '새 스케줄 추가';
  if (submitBtn) submitBtn.textContent = '저장';

  // 초기화
  formEl.reset();
  selectedSpeakerKeys.clear();

  // 요일 버튼 생성/토글 바인딩
  renderWeekdayButtons();

  // 모달 show
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function renderWeekdayButtons() {
  const wrap = document.getElementById('weekdays');
  if (!wrap) return;

  if (!wrap.querySelector('button[data-weekday]')) {
    wrap.innerHTML = weekDays.map(d => `
      <button type="button"
        class="btn btn-outline-secondary btn-sm flex-fill"
        data-weekday="${d.key}">
        ${d.label}
      </button>
    `).join('');
  }

  // 클릭 시 토글 (중복 바인딩 방지)
  if (!wrap.dataset.bound) {
    wrap.dataset.bound = '1';
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-weekday]');
      if (!btn) return;
      btn.classList.toggle('btn-outline-secondary');
      btn.classList.toggle('btn-primary');
    });
  }
}

/* ---------- TTS 표시 토글 ---------- */
function syncTtsSection() {
  const typeEl = document.getElementById('sc_broadcast_type');
  const ttsSec = document.getElementById('ttsSection');
  const ttsEl = document.getElementById('sc_tts');

  if (!typeEl || !ttsSec) return;

  const isTts = typeEl.value === 'TTS';
  ttsSec.classList.toggle('d-none', !isTts);
  if (!isTts && ttsEl) ttsEl.value = '';
}

/* ---------- 재난 목록 채우기 ---------- */
async function ensureDisasterOptions() {
  const select = document.getElementById('sc_disaster');
  if (!select) return;

  // 이미 로딩했으면 스킵
  if (disastersLoaded && select.options.length > 1) return;

  const list = await ScheduleApi.listDisasters();
  select.innerHTML = `<option value="" selected>재난을 선택하세요</option>`;
  list.forEach(d => {
    // 서버 필드명은 기존 모달 코드 방식에 맞춰 유연 대응
    const code = d.dstCode ?? d.code ?? d.disasterCode ?? '';
    const name = d.dstName ?? d.name ?? d.disasterName ?? code;
    if (!code) return;
    select.insertAdjacentHTML('beforeend', `
      <option value="${escapeHtml(code)}">${escapeHtml(name)}</option>
    `);
  });

  disastersLoaded = true;
}

/* ---------- 스피커 선택 테이블 ---------- */
async function loadModalSpeakers() {
  const list = await ScheduleApi.listSpeakers();
  // saveDivi: 00=미삭제, 01=삭제 → 기본은 00만 보여주기
  modalSpeakers = (Array.isArray(list) ? list : []).filter(sp => (sp.saveDivi ?? '00') === '00');
  modalSpeakersFiltered = [...modalSpeakers];
  renderSpeakerPickTable();
}

function applySpeakerSearch() {
  const q = (document.getElementById('speakerSearch')?.value ?? '').trim().toLowerCase();

  if (!q) {
    modalSpeakersFiltered = [...modalSpeakers];
  } else {
    modalSpeakersFiltered = modalSpeakers.filter(sp => {
      const name = String(sp.speakerName ?? '').toLowerCase();
      const id   = String(sp.speakerId ?? '').toLowerCase();
      const loc  = String(sp.locationName ?? '').toLowerCase();
      const adr  = String(sp.speakerAdr ?? '').toLowerCase();
      return name.includes(q) || id.includes(q) || loc.includes(q) || adr.includes(q);
    });
  }
  renderSpeakerPickTable();
}

function renderSpeakerPickTable() {
  const tbody = document.getElementById('speakerPickTbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!modalSpeakersFiltered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">스피커가 없습니다.</td></tr>`;
    updatePickedCount();
    syncHeaderCheckbox();
    return;
  }

  modalSpeakersFiltered.forEach(sp => {
    const key = String(sp.speakerKey ?? '');
    const name = sp.speakerName ?? '-';
    const id = sp.speakerId ?? '-';
    const loc = sp.locationName ?? '-';
    const adr = sp.speakerAdr ?? '-';

    const checked = selectedSpeakerKeys.has(key) ? 'checked' : '';

    const tr = document.createElement('tr');
    tr.dataset.key = key;
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td style="width:44px;">
        <input class="form-check-input speaker-row-check" type="checkbox" ${checked}>
      </td>
      <td>${escapeHtml(name)}</td>
      <td><small class="text-muted">${escapeHtml(id)}</small></td>
      <td>${escapeHtml(loc)}</td>
      <td><small class="text-muted">${escapeHtml(adr)}</small></td>
    `;

    // 행 클릭 시 체크 토글
    tr.addEventListener('click', (e) => {
      if (e.target.classList.contains('speaker-row-check')) return;
      const cb = tr.querySelector('.speaker-row-check');
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });

    // 체크 변경 시 선택Set 반영
    tr.querySelector('.speaker-row-check').addEventListener('change', (e) => {
      if (!key) return;
      if (e.target.checked) selectedSpeakerKeys.add(key);
      else selectedSpeakerKeys.delete(key);
      updatePickedCount();
      syncHeaderCheckbox();
    });

    tbody.appendChild(tr);
  });

  updatePickedCount();
  syncHeaderCheckbox();
}

function updatePickedCount() {
  const el = document.getElementById('speakerPickedCount');
  if (el) el.textContent = String(selectedSpeakerKeys.size);
}

function syncHeaderCheckbox() {
  const header = document.getElementById('speakerHeaderCheck');
  if (!header) return;

  const visibleKeys = modalSpeakersFiltered.map(sp => String(sp.speakerKey ?? '')).filter(Boolean);

  if (!visibleKeys.length) {
    header.checked = false;
    header.indeterminate = false;
    return;
  }

  const selectedCount = visibleKeys.filter(k => selectedSpeakerKeys.has(k)).length;
  header.checked = (selectedCount === visibleKeys.length);
  header.indeterminate = (selectedCount > 0 && selectedCount < visibleKeys.length);
}

function getSelectedSpeakerKeys() {
  return Array.from(selectedSpeakerKeys)
    .map(v => Number(v))
    .filter(n => !Number.isNaN(n));
}

/* ---------- 모달 이벤트 바인딩 ---------- */
function bindScheduleModalEvents() {
  const modalEl = document.getElementById('scheduleModal');
  if (!modalEl) return; // 모달이 페이지에 없으면 종료

  // 방송 종류 변경 → TTS 영역 토글
  const typeEl = document.getElementById('sc_broadcast_type');
  if (typeEl && !typeEl.dataset.bound) {
    typeEl.dataset.bound = '1';
    typeEl.addEventListener('change', syncTtsSection);
  }

  // 스피커 검색
  const searchEl = document.getElementById('speakerSearch');
  if (searchEl && !searchEl.dataset.bound) {
    searchEl.dataset.bound = '1';
    searchEl.addEventListener('input', applySpeakerSearch);
  }

  // 헤더 체크박스(현재 필터된 목록 기준 전체선택/해제)
  const headerCheck = document.getElementById('speakerHeaderCheck');
  if (headerCheck && !headerCheck.dataset.bound) {
    headerCheck.dataset.bound = '1';
    headerCheck.addEventListener('change', (e) => {
      const on = e.target.checked;
      modalSpeakersFiltered.forEach(sp => {
        const k = String(sp.speakerKey ?? '');
        if (!k) return;
        if (on) selectedSpeakerKeys.add(k);
        else selectedSpeakerKeys.delete(k);
      });
      renderSpeakerPickTable();
    });
  }

  // 버튼들
  const reloadBtn = document.getElementById('speakerReloadBtn');
  if (reloadBtn && !reloadBtn.dataset.bound) {
    reloadBtn.dataset.bound = '1';
    reloadBtn.addEventListener('click', async () => {
      await loadModalSpeakers();
    });
  }

  const selectAllBtn = document.getElementById('speakerSelectAllBtn');
  if (selectAllBtn && !selectAllBtn.dataset.bound) {
    selectAllBtn.dataset.bound = '1';
    selectAllBtn.addEventListener('click', () => {
      modalSpeakersFiltered.forEach(sp => {
        const k = String(sp.speakerKey ?? '');
        if (k) selectedSpeakerKeys.add(k);
      });
      renderSpeakerPickTable();
    });
  }

  const clearBtn = document.getElementById('speakerClearBtn');
  if (clearBtn && !clearBtn.dataset.bound) {
    clearBtn.dataset.bound = '1';
    clearBtn.addEventListener('click', () => {
      modalSpeakersFiltered.forEach(sp => {
        const k = String(sp.speakerKey ?? '');
        if (k) selectedSpeakerKeys.delete(k);
      });
      renderSpeakerPickTable();
    });
  }

  // 모달 열릴 때: 재난 목록 + 스피커 목록 + TTS 토글
  if (!modalEl.dataset.boundShown) {
    modalEl.dataset.boundShown = '1';
    modalEl.addEventListener('shown.bs.modal', async () => {
      try {
        syncTtsSection();
        await ensureDisasterOptions();
        await loadModalSpeakers();
      } catch (e) {
        console.error(e);
        alert('스케줄 모달 초기화 실패: ' + (e?.message || e));
      }
    });
  }
}

/* ======================================================
 * ✅ bindScheduleEvents()에 add 버튼 연결
 * ====================================================== */
const _bindScheduleEvents = bindScheduleEvents;
bindScheduleEvents = function () {
  _bindScheduleEvents();

  const addBtn = document.getElementById('add-schedule-btn');
  if (addBtn && !addBtn.dataset.bound) {
    addBtn.dataset.bound = '1';
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openScheduleModalCreate();
    });
  }
};

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function getVal(id) { return document.getElementById(id)?.value ?? ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }

/* ===============================
 * TEST: scheduleListDataRaw (1건)
 * =============================== */
window.scheduleListDataRaw = [
  {
    scheduleId: 1,
    scheduleName: '테스트 BGM 스케줄',
    startTime: '09:00',
    endTime: '18:00',
    playType: 'BGM',
    folderName: 'DEFAULT_BGM',
    repeatEnabled: true,
    weekSchedule: {
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: false,
      sun: false
    },
    recvTime: '2026-01-11T09:00:00',
    createdAt: '2026-01-11T09:00:00',

    /* 스피커 1대 */
    speakerCode: 'SPK-001',
    speakerName: '테스트 스피커',
    installAddress: '본청 1층',
    phone: '010-1234-5678',
    connStat: '01'
  }
];

/* ======================================================
 * ✅ Entry
 * ====================================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (window.currentView === 'bgm' || !window.currentView) {
    initBgmManager();
  }
});
