/**
 * ======================================================
 * setting_bgm.js
 *  - BGM 관리 + (스케줄 카드 UI) 통합JS 스타일 동작
 * ======================================================
 */

/* =======================
 * BGM(파일) CRUD 파트
 * ======================= */
let bgmData = [];
let bgmInitialized = false;

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
 *  - window.scheduleListDataRaw(원본) -> groupSchedules -> scheduleList
 *  - empty(#no-schedule-msg) 토글 + 카드 렌더 + 펼침(스피커 테이블)
 *  - 이벤트 위임(toggle/edit/delete)
 * ====================================================== */

let scheduleInitialized = false;
let scheduleList = [];
let expandedSchedule = null;

const weekDays = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' }, { key: 'wed', label: '수' },
  { key: 'thu', label: '목' }, { key: 'fri', label: '금' }, { key: 'sat', label: '토' }, { key: 'sun', label: '일' }
];

function initScheduleManager() {
  if (scheduleInitialized) return;
  scheduleInitialized = true;

  // bgm에서만 의미 있게 동작
  if (window.currentView && window.currentView !== 'bgm') return;

  const listDiv = document.getElementById('schedule-list');
  const emptyMsg = document.getElementById('no-schedule-msg');
  if (!listDiv || !emptyMsg) return; // 스케줄 UI가 없으면 종료

  // ✅ 원본 데이터(없으면 빈 배열)
  const raw = scheduleListDataRaw;
  const scheduleListData = Array.isArray(raw) ? raw : [];

  scheduleList = scheduleListData.length ? groupSchedules(scheduleListData) : [];
  window.scheduleList = scheduleList; // 필요하면 외부에서 접근

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

  // ✅ empty 토글 (핵심)
  emptyMsg.classList.toggle('d-none', scheduleList.length > 0);

  if (countSpan) {
    countSpan.textContent = `총 ${scheduleList.length}개의 스케줄 | 재생 스케줄과 단말 정보를 관리하세요`;
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

    const card = document.createElement('div');
    card.className = 'bg-white rounded shadow-sm mb-2 p-3';
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
          <button class="btn btn-sm btn-light" data-action="toggle" data-id="${schedule.id}">
            <i class="bi bi-chevron-${isExpanded ? 'up' : 'down'}"></i>
          </button>

          <span class="status-badge ${schedule.playType === 'BGM' ? 'status-info' : 'status-purple'}">
            ${escapeHtml(schedule.playType ?? '-')}
          </span>

          ${schedule.isRepeat ? `<span class="text-primary small"><i class="bi bi-arrow-repeat"></i> 반복</span>` : ''}

          <span class="text-secondary small fw-medium">
            <i class="bi bi-clock"></i>
            ${escapeHtml((schedule.startTime ?? '').substring(0, 5))} ~
            ${escapeHtml((schedule.endTime ?? '').substring(0, 5))}
          </span>

          <span class="text-secondary small">${escapeHtml(weekStr)}</span>

          ${schedule.playType === 'BGM' && schedule.bgmFolder
            ? `<span class="text-muted small"><i class="bi bi-file-earmark-music"></i> ${escapeHtml(schedule.bgmFolder)}</span>`
            : ''}
        </div>

        <div class="d-flex align-items-center gap-2">
          <span class="small text-muted">${escapeHtml(schedule.createdDate ?? '')}</span>
          <button class="btn btn-sm btn-light" data-action="edit" data-id="${schedule.id}">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-light" data-action="delete" data-id="${schedule.id}">
            <i class="bi bi-trash3 text-danger"></i>
          </button>
        </div>
      </div>

      ${isExpanded ? renderSpeakerTable(schedule) : ''}
    `;

    listDiv.appendChild(card);
  });
}

function renderSpeakerTable(schedule) {
  const speakers = Array.isArray(schedule.speakers) ? schedule.speakers : [];
  if (speakers.length === 0) {
    return `
      <hr class="my-3">
      <div class="alert alert-info mb-0" role="alert">
        <i class="bi bi-info-circle me-2"></i>할당된 단말이 없습니다.
      </div>
    `;
  }

  return `
    <hr class="my-3">
    <div>
      <h6 class="fw-bold mb-3 text-muted">할당된 스피커 (${speakers.length}개)</h6>
      <div class="table-responsive rounded-3">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>코드</th><th>단말명</th><th>설치주소</th><th>연락처</th><th>연결상태</th><th>등록시간</th>
            </tr>
          </thead>
          <tbody>
            ${speakers.map(sp => `
              <tr>
                <td><small class="text-muted">${escapeHtml(sp.speakerCode || '-')}</small></td>
                <td>${escapeHtml(sp.speakerName || '-')}</td>
                <td>${escapeHtml(sp.installAddress || '-')}</td>
                <td>${escapeHtml(sp.phone || '-')}</td>
                <td>
                  <span class="status-badge ${
                    sp.connStat === '01' ? 'status-success' :
                    sp.connStat === '00' ? 'status-primary' : 'status-warning'
                  }">
                    ${sp.connStat === '01' ? '연결' : sp.connStat === '00' ? '미연결' : '알수없음'}
                  </span>
                </td>
                <td><small class="text-muted">${escapeHtml(sp.createdAt ? String(sp.createdAt).substring(0, 19) : '-')}</small></td>
              </tr>
            `).join('')}
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
      // TODO: 스케줄 수정 모달 연동
      console.log('[Schedule] edit:', id);
      alert('스케줄 수정 연결 전입니다.');
      return;
    }

    if (action === 'delete') {
      if (!confirm('해당 스케줄을 삭제할까요?')) return;
      // TODO: 서버 삭제 연동 후 재조회/재렌더
      console.log('[Schedule] delete:', id);
      alert('스케줄 삭제 연결 전입니다.');
    }
  });
}

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
