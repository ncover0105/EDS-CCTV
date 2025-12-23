/**
 * ======================================================
 * setting.bgm.js
 *  - BGM 관리 전용 JS (추가/수정/삭제)
 * ======================================================
 */

let bgmData = [];
let bgmInitialized = false;

function initBgmManager() {
  if (bgmInitialized) return;
  bgmInitialized = true;

  console.log('[BGM] initBgmManager');

  syncBgmDataFromDOM();
  bindBgmEvents();
  updateBgmCountText();
}

/* ---------- DOM -> Data ---------- */
function syncBgmDataFromDOM() {
  const tbody = document.getElementById('bgmList');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  bgmData = rows.map((tr, idx) => {
    const cb = tr.querySelector('input[name="selectedBgmIds"]');
    const tds = tr.querySelectorAll('td');

    // td 예시: 0 체크, 1 번호, 2 BGM명, 3 파일/경로, 4 사용여부
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
function bgmInsert() {
  openBgmModal('insert');
}

function bgmUpdate() {
  const ids = getSelectedBgmIds();
  if (ids.length !== 1) {
    alert('수정은 1개만 선택하세요.');
    return;
  }
  const item = bgmData.find(x => String(x.id) === String(ids[0]));
  if (!item) {
    alert('선택한 BGM 항목을 찾을 수 없습니다.');
    return;
  }
  openBgmModal('update', item);
}

function bgmDeprecated() {
  const ids = getSelectedBgmIds();
  if (ids.length === 0) {
    alert('삭제(미사용)할 BGM을 선택하세요.');
    return;
  }
  if (!confirm(`선택한 ${ids.length}개 BGM을 미사용 처리할까요?`)) return;

  ids.forEach(id => {
    const item = bgmData.find(x => String(x.id) === String(id));
    if (item) item.useFlag = 'Unuse';
  });

  clearBgmSelection();
  renderBgmTable();
  updateBgmCountText();

  // TODO 서버연동: PATCH /api/bgm/deprecated
}

/* ---------- Modal ---------- */
// HTML에 아래 입력이 있다고 가정
// #bgmUpdateId(hidden), #bgmUpdateName, #bgmUpdatePath, #bgmUpdateStatus
function openBgmModal(mode, item = null) {
  const modalEl = document.getElementById('bgmUpdateModal');
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
  const mode = modalEl.dataset.mode || 'update';

  const id = getVal('bgmUpdateId').trim();
  const name = getVal('bgmUpdateName').trim();
  const path = getVal('bgmUpdatePath').trim();
  const statusKor = getVal('bgmUpdateStatus');
  const useFlag = statusKor === '사용' ? 'Use' : 'Unuse';

  if (!name) {
    alert('BGM 이름은 필수입니다.');
    return;
  }

  if (mode === 'insert') {
    bgmData.unshift({ id: String(Date.now()), name, path, useFlag });
    // TODO 서버연동: POST /api/bgm
  } else {
    const item = bgmData.find(x => String(x.id) === String(id));
    if (!item) {
      alert('수정할 BGM을 찾을 수 없습니다.');
      return;
    }
    item.name = name;
    item.path = path;
    item.useFlag = useFlag;
    // TODO 서버연동: PUT /api/bgm/{id}
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
