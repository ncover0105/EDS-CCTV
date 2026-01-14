/**
 * ======================================================
 * setting.ment.js
 *  - 문안(멘트) 관리 전용 JS
 *  - 추가 / 수정 / 삭제(미사용 처리)
 *  - 탭 진입 시 initMentManager() 1회 호출
 * ======================================================
 */

let mentData = [];
let mentInitialized = false;

/* ===============================
 * 진입 포인트 (탭 진입 시 1회)
 * =============================== */
function initMentManager() {
    if (mentInitialized) return;
    mentInitialized = true;

    console.log('[Ment] initMentManager');

    syncMentDataFromDOM();
    bindMentEvents();
    updateMentCountText();
}

/* ===============================
 * DOM → Data 동기화
 * =============================== */
function syncMentDataFromDOM() {
    const tbody = document.getElementById('mentList');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    mentData = rows.map((tr, idx) => {
        const cb = tr.querySelector('input[name="selectedIds"]');
        const tds = tr.querySelectorAll('td');

        const id = cb?.value ?? String(idx + 1);
        const name = tds[2]?.textContent.trim() ?? '';
        const content = tds[3]?.textContent.trim() ?? '';
        const badgeText = tds[4]?.textContent.trim() ?? '';
        const useFlag = badgeText.includes('사용중') ? 'Use' : 'Unuse';

        return { id, name, content, useFlag };
    });
}

/* ===============================
 * 이벤트 바인딩
 * =============================== */
function bindMentEvents() {
    const tbody = document.getElementById('mentList');
    if (!tbody) return;

    // ✅ 행 클릭 → 해당 행만 선택(단일)
    tbody.addEventListener('click', (e) => {
        // 체크박스 직접 클릭은 change에서 처리
        if (e.target.matches('input[type="checkbox"]')) return;

        const row = e.target.closest('tr');
        if (!row) return;

        const cb = row.querySelector('input[name="selectedIds"]');
        if (!cb) return;

        cb.checked = true;           // ✅ 토글 금지, 무조건 선택
        selectSingleMent(cb);        // ✅ 나머지 해제 + 하이라이트 정리
    });

    // ✅ 체크 변경 → 단일 선택 강제
    tbody.addEventListener('change', (e) => {
        if (!e.target.matches('input[name="selectedIds"]')) return;
        selectSingleMent(e.target);
    });

    // 모달 저장
    const saveBtn = document.getElementById('mentSaveUpdateBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', onSaveMentModal);
    }
}

/* ===============================
 * 공통 유틸
 * =============================== */
function getSelectedMentIds() {
    return Array.from(
        document.querySelectorAll('#mentList input[name="selectedIds"]:checked')
    ).map(cb => cb.value);
}

function clearMentSelection() {
    document
        .querySelectorAll('#mentList input[name="selectedIds"]')
        .forEach(cb => cb.checked = false);

    document
        .querySelectorAll('#mentList tr')
        .forEach(tr => tr.classList.remove('table-active'));
}

/* ===============================
 * 추가
 * =============================== */
function mentInsert() {
    openMentModal('insert');
}

/* ===============================
 * 수정
 * =============================== */
function mentUpdate() {
  const checked = document.querySelector('#mentList input[name="selectedIds"]:checked');
  if (!checked) {
    alert('수정할 문안을 1개 선택하세요.');
    return;
  }

  const item = {
    id: checked.value,
    name: checked.dataset.name ?? '',
    content: checked.dataset.content ?? '',
    useFlag: checked.dataset.useflag ?? ''
  };

  openMentModal('update', item);
}

/* ===============================
 * 삭제 (미사용 처리)
 * =============================== */
function mentDeprecated() {
    const ids = getSelectedMentIds();
    if (ids.length === 0) {
        alert('삭제할 문안을 선택하세요.');
        return;
    }

    if (!confirm(`선택한 ${ids.length}개 문안을 미사용 처리할까요?`)) return;

    ids.forEach(id => {
        const item = mentData.find(x => String(x.id) === String(id));
        if (item) item.useFlag = 'Unuse';
    });

    clearMentSelection();
    renderMentTable();
    updateMentCountText();

    // TODO 서버 연동
    // PATCH /api/ment/deprecated
}

/* ===============================
 * 모달 처리
 * =============================== */
function openMentModal(mode, item = null) {
    console.log("ment 선택 item : " + item);
    const modalEl = document.getElementById('mentUpdateModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    modalEl.dataset.mode = mode;

    modalEl.querySelector('.modal-title').textContent =
        mode === 'insert' ? '멘트 추가' : '멘트 수정';

    document.getElementById('mentUpdateId').value = item?.id ?? '';
    document.getElementById('mentUpdateName').value = item?.name ?? '';
    document.getElementById('mentUpdateContent').value = item?.content ?? '';
    document.getElementById('mentUpdateStatus').value =
        item?.useFlag === 'Use' ? '사용' : '미사용';

    modal.show();
}

function onSaveMentModal() {
    const modalEl = document.getElementById('mentUpdateModal');
    const mode = modalEl.dataset.mode;

    const id = document.getElementById('mentUpdateId').value;
    const name = document.getElementById('mentUpdateName').value.trim();
    const content = document.getElementById('mentUpdateContent').value.trim();
    const statusKor = document.getElementById('mentUpdateStatus').value;
    const useFlag = statusKor === '사용' ? 'Use' : 'Unuse';

    if (!name || !content) {
        alert('이름과 내용을 입력하세요.');
        return;
    }

    if (mode === 'insert') {
        mentData.unshift({
            id: String(Date.now()),
            name,
            content,
            useFlag
        });

        // TODO 서버 연동
        // POST /api/ment
    } else {
        const item = mentData.find(x => String(x.id) === String(id));
        if (!item) {
            alert('수정할 문안을 찾을 수 없습니다.');
            return;
        }
        item.name = name;
        item.content = content;
        item.useFlag = useFlag;

        // TODO 서버 연동
        // PUT /api/ment/{id}
    }

    renderMentTable();
    updateMentCountText();

    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
}

/* ===============================
 * 렌더링
 * =============================== */
function renderMentTable() {
    const tbody = document.getElementById('mentList');
    if (!tbody) return;

    tbody.innerHTML = '';

    mentData.forEach((item, idx) => {
        const isUse = item.useFlag === 'Use';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="checkbox" name="selectedIds" value="${escapeHtml(item.id)}">
            </td>
            <td>${idx + 1}</td>
            <td>${escapeHtml(item.name)}</td>
            <td class="text-wrap">${escapeHtml(item.content)}</td>
            <td>
                <span class="status-badge ${isUse ? 'status-success' : 'status-primary'}">
                    ${isUse ? '사용중' : '미사용'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateMentCountText() {
    const el = document.getElementById('mentCount');
    if (!el) return;
    el.textContent = `총 ${mentData.length}개의 문안 | 문안 내용과 문안 정보를 관리하세요`;
}

function selectSingleMent(targetCb) {
    if (!targetCb) return;

    // 체크 해제면 하이라이트만 정리
    if (!targetCb.checked) {
        const row = targetCb.closest('tr');
        if (row) row.classList.remove('table-active');
        return;
    }

    // ✅ 다른 체크 전부 해제 + 하이라이트 제거
    document.querySelectorAll('#mentList input[name="selectedIds"]').forEach(cb => {
        if (cb !== targetCb) cb.checked = false;
    });
    document.querySelectorAll('#mentList tr').forEach(tr => tr.classList.remove('table-active'));

    // ✅ 현재 행만 활성화
    const row = targetCb.closest('tr');
    if (row) row.classList.add('table-active');
}

/* ===============================
 * XSS 방지
 * =============================== */
function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
