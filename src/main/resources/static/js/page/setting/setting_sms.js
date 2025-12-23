/**
 * ======================================================
 * setting.sms.js
 *  - SMS 설정/문구/대상 관리 전용 JS (추가/수정/삭제)
 * ======================================================
 */

let smsData = [];
let smsInitialized = false;

function initSmsManager() {
  if (smsInitialized) return;
  smsInitialized = true;

  console.log('[SMS] initSmsManager');

  syncSmsDataFromDOM();
  bindSmsEvents();
  updateSmsCountText();
}

/* ---------- DOM -> Data ---------- */
function syncSmsDataFromDOM() {
  const tbody = document.getElementById('smsList');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  smsData = rows.map((tr, idx) => {
    const cb = tr.querySelector('input[name="selectedSmsIds"]');
    const tds = tr.querySelectorAll('td');

    // td 예시: 0 체크, 1 번호, 2 템플릿명, 3 내용, 4 사용여부
    const id = cb?.value ?? String(idx + 1);
    const name = (tds[2]?.textContent ?? '').trim();
    const content = (tds[3]?.textContent ?? '').trim();
    const useText = (tds[4]?.textContent ?? '').trim();
    const useFlag = useText.includes('사용') ? 'Use' : 'Unuse';

    return { id, name, content, useFlag };
  });
}

/* ---------- Events ---------- */
function bindSmsEvents() {
  const tbody = document.getElementById('smsList');
  if (!tbody) return;

  tbody.addEventListener('click', (e) => {
    if (e.target.matches('input[type="checkbox"]')) return;
    const row = e.target.closest('tr');
    if (!row) return;
    const cb = row.querySelector('input[name="selectedSmsIds"]');
    if (!cb) return;

    cb.checked = !cb.checked;
    row.classList.toggle('table-active', cb.checked);
  });

  tbody.addEventListener('change', (e) => {
    if (!e.target.matches('input[name="selectedSmsIds"]')) return;
    const row = e.target.closest('tr');
    if (row) row.classList.toggle('table-active', e.target.checked);
  });

  const saveBtn = document.getElementById('smsSaveUpdateBtn');
  if (saveBtn) saveBtn.addEventListener('click', onSaveSmsModal);
}

function getSelectedSmsIds() {
  return Array.from(
    document.querySelectorAll('#smsList input[name="selectedSmsIds"]:checked')
  ).map(cb => cb.value);
}

function clearSmsSelection() {
  document.querySelectorAll('#smsList input[name="selectedSmsIds"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#smsList tr').forEach(tr => tr.classList.remove('table-active'));
}

/* ---------- CRUD ---------- */
function smsInsert() {
  openSmsModal('insert');
}

function smsUpdate() {
  const ids = getSelectedSmsIds();
  if (ids.length !== 1) {
    alert('수정은 1개만 선택하세요.');
    return;
  }
  const item = smsData.find(x => String(x.id) === String(ids[0]));
  if (!item) {
    alert('선택한 SMS 항목을 찾을 수 없습니다.');
    return;
  }
  openSmsModal('update', item);
}

function smsDeprecated() {
  const ids = getSelectedSmsIds();
  if (ids.length === 0) {
    alert('삭제(미사용)할 항목을 선택하세요.');
    return;
  }
  if (!confirm(`선택한 ${ids.length}개 항목을 미사용 처리할까요?`)) return;

  ids.forEach(id => {
    const item = smsData.find(x => String(x.id) === String(id));
    if (item) item.useFlag = 'Unuse';
  });

  clearSmsSelection();
  renderSmsTable();
  updateSmsCountText();

  // TODO 서버연동: PATCH /api/sms/deprecated
}

/* ---------- Modal ---------- */
// HTML에 아래 입력이 있다고 가정
// #smsUpdateId(hidden), #smsUpdateName, #smsUpdateContent, #smsUpdateStatus
function openSmsModal(mode, item = null) {
  const modalEl = document.getElementById('smsUpdateModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  modalEl.dataset.mode = mode;
  const title = modalEl.querySelector('.modal-title');
  if (title) title.textContent = (mode === 'insert') ? 'SMS 추가' : 'SMS 수정';

  setVal('smsUpdateId', item?.id ?? '');
  setVal('smsUpdateName', item?.name ?? '');
  setVal('smsUpdateContent', item?.content ?? '');
  setVal('smsUpdateStatus', item?.useFlag === 'Use' ? '사용' : '미사용');

  modal.show();
}

function onSaveSmsModal() {
  const modalEl = document.getElementById('smsUpdateModal');
  const mode = modalEl.dataset.mode || 'update';

  const id = getVal('smsUpdateId').trim();
  const name = getVal('smsUpdateName').trim();
  const content = getVal('smsUpdateContent').trim();
  const statusKor = getVal('smsUpdateStatus');
  const useFlag = statusKor === '사용' ? 'Use' : 'Unuse';

  if (!name || !content) {
    alert('이름/내용은 필수입니다.');
    return;
  }

  if (mode === 'insert') {
    smsData.unshift({ id: String(Date.now()), name, content, useFlag });
    // TODO 서버연동: POST /api/sms
  } else {
    const item = smsData.find(x => String(x.id) === String(id));
    if (!item) {
      alert('수정할 항목을 찾을 수 없습니다.');
      return;
    }
    item.name = name;
    item.content = content;
    item.useFlag = useFlag;
    // TODO 서버연동: PUT /api/sms/{id}
  }

  renderSmsTable();
  updateSmsCountText();
  bootstrap.Modal.getOrCreateInstance(modalEl).hide();
}

/* ---------- Render ---------- */
function renderSmsTable() {
  const tbody = document.getElementById('smsList');
  if (!tbody) return;

  tbody.innerHTML = '';

  smsData.forEach((s, idx) => {
    const isUse = s.useFlag === 'Use';
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><input type="checkbox" name="selectedSmsIds" value="${escapeHtml(s.id)}"></td>
        <td>${idx + 1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td class="text-wrap">${escapeHtml(s.content)}</td>
        <td>
          <span class="status-badge ${isUse ? 'status-success' : 'status-primary'}">
            ${isUse ? '사용중' : '미사용'}
          </span>
        </td>
      </tr>
    `);
  });
}

function updateSmsCountText() {
  const el = document.getElementById('smsCount');
  if (!el) return;
  el.textContent = `총 ${smsData.length}개 | SMS 항목을 관리하세요`;
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
