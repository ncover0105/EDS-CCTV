/**
 * ======================================================
 * setting.user.js
 *  - 사용자 관리 전용 JS (추가/수정/삭제)
 * ======================================================
 */

let userData = [];
let userInitialized = false;

function initUserManager() {
  if (userInitialized) return;
  userInitialized = true;

  console.log('[User] initUserManager');

  syncUserDataFromDOM();
  bindUserEvents();
  updateUserCountText();
}

/* ---------- DOM -> Data ---------- */
function syncUserDataFromDOM() {
  const tbody = document.getElementById('userList');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  userData = rows.map((tr, idx) => {
    const cb = tr.querySelector('input[name="selectedUserIds"]');
    const tds = tr.querySelectorAll('td');

    // td 예시: 0 체크, 1 번호, 2 아이디, 3 이름, 4 권한, 5 사용여부
    const id = cb?.value ?? String(idx + 1);
    const userId = (tds[2]?.textContent ?? '').trim();
    const name = (tds[3]?.textContent ?? '').trim();
    const role = (tds[4]?.textContent ?? '').trim();
    const useText = (tds[5]?.textContent ?? '').trim();
    const useFlag = useText.includes('사용') ? 'Use' : 'Unuse';

    return { id, userId, name, role, useFlag };
  });
}

/* ---------- Events ---------- */
function bindUserEvents() {
  const tbody = document.getElementById('userList');
  if (!tbody) return;

  // 행 클릭 -> 체크 토글
  tbody.addEventListener('click', (e) => {
    if (e.target.matches('input[type="checkbox"]')) return;
    const row = e.target.closest('tr');
    if (!row) return;
    const cb = row.querySelector('input[name="selectedUserIds"]');
    if (!cb) return;

    cb.checked = !cb.checked;
    row.classList.toggle('table-active', cb.checked);
  });

  tbody.addEventListener('change', (e) => {
    if (!e.target.matches('input[name="selectedUserIds"]')) return;
    const row = e.target.closest('tr');
    if (row) row.classList.toggle('table-active', e.target.checked);
  });

  const saveBtn = document.getElementById('userSaveUpdateBtn');
  if (saveBtn) saveBtn.addEventListener('click', onSaveUserModal);
}

function getSelectedUserIds() {
  return Array.from(
    document.querySelectorAll('#userList input[name="selectedUserIds"]:checked')
  ).map(cb => cb.value);
}

function clearUserSelection() {
  document.querySelectorAll('#userList input[name="selectedUserIds"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#userList tr').forEach(tr => tr.classList.remove('table-active'));
}

/* ---------- CRUD ---------- */
function userInsert() {
  openUserModal('insert');
}

function userUpdate() {
  const ids = getSelectedUserIds();
  if (ids.length !== 1) {
    alert('수정은 1명만 선택하세요.');
    return;
  }
  const item = userData.find(x => String(x.id) === String(ids[0]));
  if (!item) {
    alert('선택한 사용자를 찾을 수 없습니다.');
    return;
  }
  openUserModal('update', item);
}

// 삭제(미사용 처리)
function userDeprecated() {
  const ids = getSelectedUserIds();
  if (ids.length === 0) {
    alert('삭제(미사용)할 사용자를 선택하세요.');
    return;
  }
  if (!confirm(`선택한 ${ids.length}명 사용자를 미사용 처리할까요?`)) return;

  ids.forEach(id => {
    const item = userData.find(x => String(x.id) === String(id));
    if (item) item.useFlag = 'Unuse';
  });

  clearUserSelection();
  renderUserTable();
  updateUserCountText();

  // TODO 서버연동:
  // PATCH /api/user/deprecated
}

/* ---------- Modal ---------- */
// HTML에 아래 입력들이 있다고 가정(없으면 너 HTML에 맞게 id만 바꿔줘)
// #userUpdateId (hidden), #userUpdateUserId, #userUpdateName, #userUpdateRole, #userUpdateStatus
function openUserModal(mode, item = null) {
  const modalEl = document.getElementById('userUpdateModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  modalEl.dataset.mode = mode;

  const title = modalEl.querySelector('.modal-title');
  if (title) title.textContent = (mode === 'insert') ? '사용자 추가' : '사용자 수정';

  setVal('userUpdateId', item?.id ?? '');
  setVal('userUpdateUserId', item?.userId ?? '');
  setVal('userUpdateName', item?.name ?? '');
  setVal('userUpdateRole', item?.role ?? '');
  setVal('userUpdateStatus', item?.useFlag === 'Use' ? '사용' : '미사용');

  modal.show();
}

function onSaveUserModal() {
  const modalEl = document.getElementById('userUpdateModal');
  const mode = modalEl.dataset.mode || 'update';

  const id = getVal('userUpdateId').trim();
  const userId = getVal('userUpdateUserId').trim();
  const name = getVal('userUpdateName').trim();
  const role = getVal('userUpdateRole').trim();
  const statusKor = getVal('userUpdateStatus');
  const useFlag = statusKor === '사용' ? 'Use' : 'Unuse';

  if (!userId || !name) {
    alert('아이디/이름은 필수입니다.');
    return;
  }

  if (mode === 'insert') {
    userData.unshift({ id: String(Date.now()), userId, name, role, useFlag });
    // TODO 서버연동: POST /api/user
  } else {
    const item = userData.find(x => String(x.id) === String(id));
    if (!item) {
      alert('수정할 사용자를 찾을 수 없습니다.');
      return;
    }
    item.userId = userId;
    item.name = name;
    item.role = role;
    item.useFlag = useFlag;
    // TODO 서버연동: PUT /api/user/{id}
  }

  renderUserTable();
  updateUserCountText();
  bootstrap.Modal.getOrCreateInstance(modalEl).hide();
}

/* ---------- Render ---------- */
function renderUserTable() {
  const tbody = document.getElementById('userList');
  if (!tbody) return;

  tbody.innerHTML = '';

  userData.forEach((u, idx) => {
    const isUse = u.useFlag === 'Use';
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><input type="checkbox" name="selectedUserIds" value="${escapeHtml(u.id)}"></td>
        <td>${idx + 1}</td>
        <td>${escapeHtml(u.userId)}</td>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>
          <span class="status-badge ${isUse ? 'status-success' : 'status-primary'}">
            ${isUse ? '사용중' : '미사용'}
          </span>
        </td>
      </tr>
    `);
  });
}

function updateUserCountText() {
  const el = document.getElementById('userCount');
  if (!el) return;
  el.textContent = `총 ${userData.length}명 | 사용자 정보를 관리하세요`;
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
