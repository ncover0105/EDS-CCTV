const itemsPerPage = 15;
const resultItemsPerPage = 5;
let currentPage = 1;

const alertNames = ['홍수', '태풍', '산불', '지진', '화재'];
const regions = ['중부', '남부', '동부', '서부', '북부', '도심'];

let specialData;
let broadcastData = [];          // 서버에서 받은 원본(카드용 매핑 후)
let broadcastFiltered = [];      // 화면 렌더 대상

let filteredResultData = [];
const resultData = [];

const situationData = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    content: `상황 ${i + 1}`,
    datetime: `2025-07-11 10:10${i.toString().padStart(2, '0')}:00`,
    status: i % 3 === 0 ? 'COMPLETE' : 'PENDING',
    location: regions[i % 5] || ''
}));

const renderMap = {
    'situation-page': renderSituationTable,
    'broadcast-page': renderBroadcastCards,  // 카드 렌더
    'special-page': renderSpecialTable
};

function renderView(currentView, currentPage) {
    const renderFunc = renderMap[currentView];
    if (renderFunc) {
        renderFunc(currentPage);
    } else {
        refreshData();
    }
}

function getBadgeClass(status) {
    return status ? 'status-success' : 'status-primary';
}

function getResultBadgeClass(result) {
    return result ? 'status-success' : 'status-error';
}

document.addEventListener('DOMContentLoaded', async function () {
    // 특이사항/상황은 기존 유지
    specialData = generateRandomSpecialData();

    const view = document.body.dataset.view || 'none';
    renderView(view, currentPage);

    if (window.App?.utils?.fillDateTimeInputs) {
        App.utils.fillDateTimeInputs();
    }

    // ✅ 발령 이력 페이지면: 이벤트 바인딩 + 서버 조회(처음엔 오늘 기본)
    if (currentView === 'broadcast') {
        bindBroadcastEventsOnce();
        await applyBroadcastFilters(true, true); // resetPage=true, isInitialLoad=true
    }
});

// ==================== SITUATION (기존 유지) ====================
function renderSituationTable(page) {
    const tbody = document.getElementById('situationList');
    if (!tbody) {
        console.error('situationList tbody not found');
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const currentPageData = situationData.slice(start, start + itemsPerPage);

    const rowsHTML = currentPageData.map((item, index) => {
        const badgeClass = getBadgeClass(item.status);
        return `
            <tr>
                <td>${start + index + 1}</td>
                <td>${item.content}</td>
                <td>${item.datetime}</td>
                <td class="py-1">
                    <span class="status-badge ${badgeClass}">${item.status}</span>
                </td>
                <td>${item.location}</td>
            </tr>
        `;
    }).join('');

    const emptyRowsHTML = App.utils.getEmptyRowsHTML(itemsPerPage, currentPageData.length, 5);

    tbody.innerHTML = rowsHTML + emptyRowsHTML;
    document.getElementById('situationCount').innerText = `${situationData.length}건`;

    renderSituationPagination();
}

function renderSituationPagination() {
    App.utils.renderPagination(
        'situationPagination',
        currentPage,
        situationData.length,
        itemsPerPage,
        (newPage) => {
            currentPage = newPage;
            renderSituationTable(currentPage);
        }
    );
}

// ==================== BROADCAST (DB 조회 + 운영용 카드) ====================
function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatDateTime(dt) {
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
}

function parseInputDateTime(v) {
    // datetime-local: YYYY-MM-DDTHH:mm -> Date
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

// LocalDateTime 파라미터: YYYY-MM-DDTHH:mm:ss
function toLocalDateTimeParam(d) {
    if (!d) return null;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function isSameYmd(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function escapeHtml(s) {
    return String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function updateBroadcastStats(list) {
    const totalEl = document.getElementById('broadcast_stat_total');
    const todayEl = document.getElementById('broadcast_stat_today');
    const realEl = document.getElementById('broadcast_stat_real');
    const testEl = document.getElementById('broadcast_stat_test');

    if (!totalEl || !todayEl || !realEl || !testEl) return;

    const today = new Date();
    const total = list.length;
    const todayCount = list.filter(x => isSameYmd(x.dt, today)).length;
    const realCount = list.filter(x => x.isReal).length;
    const testCount = list.filter(x => !x.isReal).length;

    totalEl.textContent = total;
    todayEl.textContent = todayCount;
    realEl.textContent = realCount;
    testEl.textContent = testCount;

    const countEl = document.getElementById('broadcastCount');
    if (countEl) countEl.textContent = `총 ${total}건`;
}

// ==================== 서버 조회 ====================
async function fetchBroadcastLogsFromServer(params) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        if (typeof v === 'string' && v.trim() === '') return;
        qs.set(k, String(v));
    });

    const url = `/api/web/dispatch/loglist?${qs.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`loglist http ${res.status}`);
    return await res.json();
}

// 응답이 Map 형태({ok, items})이거나 Page 그대로(content)일 수 있어 둘 다 대응
function extractRowsFromResponse(data) {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.content)) return data.content;
    // 혹시 Page를 그대로 반환하면 {content, number, ...}
    return [];
}

// row -> 카드 아이템 매핑 (가능한 컬럼 최대 반영)
function mapRowToBroadcastItem(row) {
    // row.dispatchTime: "2025-12-22T08:41:12" 형태(LocalDateTime)라고 가정
    const dt = row.dispatchTime ? new Date(row.dispatchTime) : new Date();

    const mode = (row.mode || '').toUpperCase();                 // REAL/TEST
    const dispatchType = (row.dispatchType || 'MANUAL').toUpperCase();  // MANUAL/AUTO/SYSTEM
    const broadcastType = (row.broadcastType || 'ETC').toUpperCase();   // TTS/BGM/SIREN/ETC
    const scope = (row.scope || '').toUpperCase();               // ALL/PART/SPEAKER/SIDO/GUN 등

    // 우선순위는 문자열(예: WARNING)일 수도, 숫자("3")일 수도 있으니 정규화
    const priority = normalizePriority(row.priority);

    const disasterCode = row.disasterCode || '';
    const disasterName = row.disasterName || disasterCode || 'UNKNOWN';

    // 대상 스피커 표시
    let speakerText = row.speakerId || '';
    if (!speakerText && row.speakerIds) {
        speakerText = formatSpeakerIds(row.speakerIds);
    }
    if (!speakerText) speakerText = '-';

    // 서버에서 최종 메시지로 내려주면 그대로 사용
    const message = (row.ttsMessage ?? '').toString().trim();

    // 제목: "재난명 · 방송유형"
    const title = `${disasterName} · ${broadcastType}`;

    return {
        no: row.logKey ?? 0,
        dt,
        time: formatDateTime(dt),

        title,
        // 배지용
        mode,
        isReal: mode === 'REAL',
        dispatchType,
        broadcastType,
        priority,

        // 카드 표시용
        speakerName: speakerText,
        location: scope || '-',  // 범위 표시(원하면 한글 변환도 가능)
        senderName: row.requestUserId || 'unknown',
        code: row.commandCode || '',

        // 상세/보조
        disasterCode,
        disasterName,
        requestIp: row.requestIp || '',
        memo: row.memo || '',
        message
    };
}

// speakerIds(JSON 배열 또는 CSV)를 운영용 텍스트로 요약
function formatSpeakerIds(raw) {
    const s = String(raw).trim();
    if (!s) return '';

    // JSON 배열 시도
    try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
            if (arr.length === 0) return '-';
            if (arr.length <= 2) return arr.join(', ');
            return `${arr[0]}, ${arr[1]} 외 ${arr.length - 2}대 (총 ${arr.length}대)`;
        }
    } catch (_) { /* ignore */ }

    // CSV/기타 문자열
    if (s.length > 40) return `${s.slice(0, 40)}...`;
    return s;
}

// priority가 "DANGER" 같은 텍스트일 수도, "3" 같은 숫자일 수도 있는 케이스 대응
function normalizePriority(p) {
    const v = (p ?? '').toString().trim().toUpperCase();
    if (!v) return 'NONE';

    // 이미 텍스트면 그대로
    if (['NONE', 'CAUTION', 'WARNING', 'DANGER'].includes(v)) return v;

    // 숫자 fallback 예시: 1~4를 NONE~DANGER로 매핑(원하는 규칙으로 조정 가능)
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) {
        if (n >= 4) return 'DANGER';
        if (n === 3) return 'WARNING';
        if (n === 2) return 'CAUTION';
        return 'NONE';
    }

    return 'NONE';
}


// ==================== 카드 렌더 ====================
function renderBroadcastCards() {
    const container = document.getElementById('broadcastCardList');
    if (!container) {
        console.error('broadcastCardList not found');
        return;
    }

    container.innerHTML = '';

    // ✅ 데이터 없을 때 표시
    if (broadcastFiltered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-secondary">
                <i class="bi bi-broadcast display-1 opacity-50 mb-3"></i>
                <h5 class="mb-1">발령 이력이 없습니다</h5>
                <p class="mb-0 small">검색 조건을 변경하여 확인해보세요</p>
            </div>
        `;
        updateBroadcastStats([]);
        return;
    }

    broadcastFiltered.forEach((item, index) => {
        const card = createBroadcastCard(item, index);
        container.appendChild(card);
    });

    updateBroadcastStats(broadcastFiltered);
}

// 운영용 컬러 안정(튀지 않게)
function getPriorityChipStyle(priority) {
    const p = (priority || 'NONE').toUpperCase();
    switch (p) {
        case 'DANGER': return { bg: '#111827', color: '#ffffff', border: '#111827' };
        case 'WARNING': return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
        case 'CAUTION': return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
        case 'NONE':
        default: return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    }
}

function getTypeMeta(type) {
    switch ((type || 'ETC').toUpperCase()) {
        case 'TTS': return { icon: 'bi bi-chat-dots', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
        case 'BGM': return { icon: 'bi bi-music-note-beamed', bg: '#ecfccb', color: '#3f6212', border: '#d9f99d' };
        case 'SIREN': return { icon: 'bi bi-exclamation-triangle', bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' };
        default: return { icon: 'bi bi-broadcast', bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
}

function createBroadcastCard(item, index) {
    const card = document.createElement('div');
    card.className = 'fade-in mb-3';
    card.dataset.id = item.no;

    card.style.cssText = `
        animation-delay: ${index * 0.05}s;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        overflow: hidden;
    `;

    const modeText = item.isReal ? 'REAL' : 'TEST';
    const modeStyle = item.isReal
        ? { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' }
        : { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };

    const p = (item.priority || 'NONE').toUpperCase();
    const priorityStyle = getPriorityChipStyle(p);

    const type = (item.broadcastType || 'ETC').toUpperCase();
    const typeMeta = getTypeMeta(type);

    const dispatchType = (item.dispatchType || 'MANUAL').toUpperCase();
    const dispatchTypeChip = getDispatchTypeChipStyle(dispatchType);

    const title = escapeHtml(item.title || 'UNKNOWN');
    const speakerText = escapeHtml(item.speakerName || '-');
    const scopeText = escapeHtml(item.location || '-');
    const senderText = escapeHtml(item.senderName || '-');
    const timeText = escapeHtml(item.time || '-');
    const codeText = escapeHtml(item.code || '');

    const preview = (item.message || '').trim();
    const previewHtml = preview ? escapeHtml(preview) : '<span class="text-secondary">메시지 없음</span>';

    card.innerHTML = `
      <div style="padding: 14px 16px;">
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div style="min-width:0; flex: 1 1 360px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span style="
                width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;
                border-radius:8px;background:${typeMeta.bg};color:${typeMeta.color};
                border:1px solid ${typeMeta.border};
              ">
                <i class="${typeMeta.icon}"></i>
              </span>
              <div style="min-width:0;">
                <div style="font-weight:800; color:#111827; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${title}
                </div>
                <div style="font-size:12px; color:#6b7280; margin-top:2px;">
                  <span style="font-weight:700; color:#374151;">대상</span> ${speakerText}
                  <span style="margin:0 6px; color:#d1d5db;">|</span>
                  <span style="font-weight:700; color:#374151;">범위</span> ${scopeText}
                </div>
              </div>
            </div>
        </div>

        <div style="flex: 1 1 260px; margin-left:auto;">
            <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
              <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                background:${modeStyle.bg};color:${modeStyle.color};border:1px solid ${modeStyle.border};">
                ${modeText}
              </span>

              <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                background:${dispatchTypeChip.bg};color:${dispatchTypeChip.color};border:1px solid ${dispatchTypeChip.border};">
                ${escapeHtml(dispatchType)}
              </span>

              <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                background:${priorityStyle.bg};color:${priorityStyle.color};border:1px solid ${priorityStyle.border};">
                ${p}
              </span>

              <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;">
                ${escapeHtml(type)}
              </span>

              ${codeText ? `
                <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                  background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;">
                  CMD ${codeText}
                </span>` : ''
              }
            </div>

            <div style="margin-top:6px; font-size:12px; color:#6b7280; text-align:right;">
              <i class="bi bi-clock"></i> ${timeText}
            </div>
          </div>
        </div>

        <div style="
          margin-top:10px;
          padding:10px 12px;
          background:#f8fafc;
          border:1px solid #e5e7eb;
          border-radius:10px;
          color:#374151;
          font-size:13px;
          line-height:1.55;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          overflow:hidden;
        ">${previewHtml}</div>

        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:10px;">
          <div style="font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <i class="bi bi-person-circle"></i>
            <span style="font-weight:700; color:#374151;">요청자</span> ${senderText}
          </div>

          <div style="display:flex; gap:8px; flex-shrink:0;">
            <button type="button" class="btn btn-outline-primary btn-sm" data-action="detail"
              style="border-radius:8px; font-weight:700;">
              <i class="bi bi-eye me-1"></i>상세
            </button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('button[data-action="detail"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openBroadcastDetail(item);
    });

    return card;
}

function getDispatchTypeChipStyle(t) {
    const v = (t || 'MANUAL').toUpperCase();
    switch (v) {
        case 'AUTO':   return { bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' };
        case 'SYSTEM': return { bg: '#e5e7eb', color: '#374151', border: '#d1d5db' };
        case 'MANUAL':
        default:       return { bg: '#cffafe', color: '#155e75', border: '#a5f3fc' };
    }
}

// ✅ 핵심: 서버 조회 기반 필터 적용
// - isInitialLoad=true 일 때는 start/end를 보내지 않음 → 서버가 “오늘” 기본값 적용
async function applyBroadcastFilters(resetPage = true, isInitialLoad = false) {
    const startEl = document.getElementById('broadcastStartDateTime');
    const endEl = document.getElementById('broadcastEndDateTime');
    const modeEl = document.getElementById('broadcastModeFilter');
    const priorityEl = document.getElementById('broadcastPriorityFilter');
    const speakerEl = document.getElementById('broadcastSpeakerSearch');
    const messageEl = document.getElementById('broadcastMessageSearch');

    const startDt = isInitialLoad ? null : parseInputDateTime(startEl?.value);
    const endDt = isInitialLoad ? null : parseInputDateTime(endEl?.value);

    const mode = modeEl?.value;                 // REAL/TEST
    const priority = priorityEl?.value;         // NONE/CAUTION/WARNING/DANGER
    const speakerQ = speakerEl?.value?.trim();  // 문자열
    const messageQ = messageEl?.value?.trim();

    if (resetPage) currentPage = 1;

    try {
        const params = {
            page: 0,
            size: 50,
            mode,
            priority,
            speakerQ,
            messageQ
        };

        if (!isInitialLoad) {
            const s = toLocalDateTimeParam(startDt);
            const e = toLocalDateTimeParam(endDt);
            if (s) params.start = s;
            if (e) params.end = e;
        }

        const data = await fetchBroadcastLogsFromServer(params);
        const rows = extractRowsFromResponse(data);

        broadcastData = rows.map(mapRowToBroadcastItem);
        broadcastFiltered = broadcastData; // 서버 필터 결과를 그대로 사용

        renderBroadcastCards();
    } catch (err) {
        console.error('broadcast log load error:', err);
        broadcastData = [];
        broadcastFiltered = [];
        renderBroadcastCards();
    }
}

function bindBroadcastEventsOnce() {
    const searchBtn = document.getElementById('broadcastSearchBtn');
    if (searchBtn?.dataset.bound === '1') return;

    const resetBtn = document.getElementById('broadcastResetBtn');
    const startEl = document.getElementById('broadcastStartDateTime');
    const endEl = document.getElementById('broadcastEndDateTime');
    const modeEl = document.getElementById('broadcastModeFilter');
    const priorityEl = document.getElementById('broadcastPriorityFilter');
    const speakerEl = document.getElementById('broadcastSpeakerSearch');
    const messageEl = document.getElementById('broadcastMessageSearch');

    if (searchBtn) {
        searchBtn.dataset.bound = '1';
        searchBtn.addEventListener('click', () => applyBroadcastFilters(true, false));
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (startEl) startEl.value = '';
            if (endEl) endEl.value = '';
            if (modeEl) modeEl.value = '';
            if (priorityEl) priorityEl.value = '';
            if (speakerEl) speakerEl.value = '';
            if (messageEl) messageEl.value = '';

            // ✅ 리셋하면 다시 “오늘 기본”
            await applyBroadcastFilters(true, true);
        });
    }

    // 날짜/셀렉트는 change 시 즉시 조회
    const liveApply = () => applyBroadcastFilters(true, false);
    [startEl, endEl, modeEl, priorityEl].forEach(el => {
        if (el) el.addEventListener('change', liveApply);
    });

    // 검색어는 debounce
    [speakerEl, messageEl].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                clearTimeout(el.t);
                el.t = setTimeout(liveApply, 250);
            });
        }
    });
}

// ==================== SPECIAL (기존 유지) ====================
function generateRandomSpecialData() {
    const length = Math.floor(Math.random() * 30) + 10;
    return Array.from({ length }, (_, i) => {
        const alert = alertNames[Math.floor(Math.random() * alertNames.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const hour = String(8 + (i % 12)).padStart(2, '0');
        const min = String(10 + i).padStart(2, '0');
        let status = '';
        if (i % 3 === 0) status = 'COMPLETE';
        else if (i % 3 === 1) status = 'PENDING';
        else status = 'CANCEL';

        return {
            no: i + 1,
            name: alert + (i + 1),
            time: `2025-07-16 ${hour}:${min}:00`,
            region,
            status,
            result: status === 'COMPLETE' ? '성공' : '실패'
        };
    });
}

function renderSpecialTable(page) {
    currentPage = page;
    const tbody = document.getElementById('specialList');
    if (!tbody) {
        console.error('specialList tbody not found');
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const currentPageData = specialData.slice(start, start + itemsPerPage);

    const rowsHTML = currentPageData.map(item => {
        const badgeClass = item.status ? 'status-success' : 'status-primary';
        return `
            <tr>
                <td>${item.no}</td>
                <td>${item.name}</td>
                <td>${item.time}</td>
                <td>${item.region}</td>
                <td><span class="status-badge ${badgeClass}">${item.status}</span></td>
                <td>${item.result}</td>
            </tr>
        `;
    }).join('');

    const emptyRowsHTML = App.utils.getEmptyRowsHTML(itemsPerPage, currentPageData.length, 6);
    tbody.innerHTML = rowsHTML + emptyRowsHTML;
    document.getElementById('specialCount').innerText = `${specialData.length}건`;

    renderSpecialPagination(page);
}

function renderSpecialPagination(page) {
    App.utils.renderPagination(
        'specialPagination',
        currentPage,
        specialData.length,
        itemsPerPage,
        (newPage) => {
            currentPage = newPage;
            renderSpecialTable(currentPage);
        }
    );
}

function refreshData() {
    specialData = generateRandomSpecialData();
    renderSpecialTable(currentPage);
}

function ensureBroadcastDetailModal() {
    if (document.getElementById('broadcastDetailModal')) return;
  
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <div class="modal fade" id="broadcastDetailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
  
          <div class="modal-header">
            <div class="d-flex flex-column">
              <h5 class="modal-title mb-1" id="bd_title">발령 상세</h5>
              <div class="small text-secondary" id="bd_subtitle"></div>
            </div>
          </div>
  
          <div class="modal-body">
            <div class="d-flex flex-wrap gap-2 mb-3" id="bd_badges"></div>
  
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <div class="border rounded-3 p-3 h-100">
                  <div class="small text-secondary mb-1">대상</div>
                  <div class="fw-semibold" id="bd_speakers">-</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="border rounded-3 p-3 h-100">
                  <div class="small text-secondary mb-1">범위</div>
                  <div class="fw-semibold" id="bd_scope">-</div>
                </div>
              </div>
            </div>
  
            <div class="border rounded-3 p-3">
              <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                <div class="fw-semibold">메시지</div>
              </div>
              <pre class="mb-0" id="bd_message"
                style="white-space:pre-wrap; word-break:break-word; max-height:220px; overflow:auto;"></pre>
            </div>
  
            <div class="accordion mt-3" id="bd_acc">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bd_more">
                    추가 정보
                  </button>
                </h2>
                <div id="bd_more" class="accordion-collapse collapse" data-bs-parent="#bd_acc">
                  <div class="accordion-body">
                    <div class="row g-2">
                      <div class="col-md-6">
                        <div class="small text-secondary">요청자</div>
                        <div class="fw-semibold" id="bd_user">-</div>
                      </div>
                      <div class="col-md-6">
                        <div class="small text-secondary">요청 IP</div>
                        <div class="fw-semibold" id="bd_ip">-</div>
                      </div>
                      <div class="col-md-6 mt-2">
                        <div class="small text-secondary">CMD</div>
                        <div class="fw-semibold" id="bd_cmd">-</div>
                      </div>
                      <div class="col-md-6 mt-2">
                        <div class="small text-secondary">재난코드</div>
                        <div class="fw-semibold" id="bd_dst">-</div>
                      </div>
  
                      <div class="col-12 mt-3">
                        <div class="small text-secondary mb-1">speakerIds 원문</div>
                        <pre class="mb-0" id="bd_speaker_ids_raw"
                          style="white-space:pre-wrap; word-break:break-word; max-height:160px; overflow:auto;"></pre>
                      </div>
  
                      <div class="col-12 mt-3">
                        <div class="small text-secondary mb-1">메모</div>
                        <pre class="mb-0" id="bd_memo"
                          style="white-space:pre-wrap; word-break:break-word;"></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
          </div><!-- /modal-body -->
  
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
          </div>
  
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(wrap.firstElementChild);
  }
  
  function badgeHtml(text, bg, color, border) {
    return `<span class="px-2 py-1 rounded-pill small fw-bold"
      style="background:${bg};color:${color};border:1px solid ${border};">${escapeHtml(text)}</span>`;
  }
  
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text || '');
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text || '';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }
  
  function openBroadcastDetail(item) {
    ensureBroadcastDetailModal();
  
    const title = `${item.disasterName || item.disasterCode || 'UNKNOWN'} · ${(item.broadcastType || 'ETC').toUpperCase()}`;
    const subtitle = `${item.time || '-'} · ${item.disasterCode ? 'CODE ' + item.disasterCode : ''}`;
  
    document.getElementById('bd_title').textContent = title;
    document.getElementById('bd_subtitle').textContent = subtitle;
  
    // 배지들
    const pStyle = getPriorityChipStyle(item.priority);
    const mStyle = item.isReal ? { bg:'#fee2e2', color:'#b91c1c', border:'#fecaca' } : { bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe' };
    const dStyle = getDispatchTypeChipStyle(item.dispatchType);
  
    const badges = [
      badgeHtml((item.isReal ? 'REAL' : 'TEST'), mStyle.bg, mStyle.color, mStyle.border),
      badgeHtml((item.dispatchType || 'MANUAL').toUpperCase(), dStyle.bg, dStyle.color, dStyle.border),
      badgeHtml((item.priority || 'NONE').toUpperCase(), pStyle.bg, pStyle.color, pStyle.border),
      badgeHtml((item.broadcastType || 'ETC').toUpperCase(), '#f3f4f6', '#374151', '#e5e7eb'),
    ];
    document.getElementById('bd_badges').innerHTML = badges.join('');
  
    // 본문
    document.getElementById('bd_speakers').textContent = item.speakerName || '-';
    document.getElementById('bd_scope').textContent = item.location || '-';
  
    const msg = (item.message || '').trim();
    document.getElementById('bd_message').textContent = msg || '메시지 없음';
  
    document.getElementById('bd_user').textContent = item.senderName || '-';
    document.getElementById('bd_ip').textContent = item.requestIp || '-';
    document.getElementById('bd_cmd').textContent = item.code ? `CMD ${item.code}` : '-';
    document.getElementById('bd_dst').textContent = item.disasterCode || '-';
  
    document.getElementById('bd_speaker_ids_raw').textContent = (item.speakerIdsRaw || item.speakerName || '').toString();
    document.getElementById('bd_memo').textContent = (item.memo || '').toString();
  
    const modalEl = document.getElementById('broadcastDetailModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
  