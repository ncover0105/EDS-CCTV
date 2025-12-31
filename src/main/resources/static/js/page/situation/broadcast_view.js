// /js/page/situation/broadcast_view.js
(function () {
    'use strict';

    let broadcastData = [];
    let broadcastFiltered = [];

    function updateBroadcastStats(list) {
    const totalEl = document.getElementById('broadcast_stat_total');
    const todayEl = document.getElementById('broadcast_stat_today');
    const realEl = document.getElementById('broadcast_stat_real');
    const testEl = document.getElementById('broadcast_stat_test');
    if (!totalEl || !todayEl || !realEl || !testEl) return;

    const today = new Date();
    const total = list.length;
    const todayCount = list.filter(x => window.SituationCommon.isSameYmd(x.dt, today)).length;
    const realCount = list.filter(x => x.isReal).length;
    const testCount = list.filter(x => !x.isReal).length;

    totalEl.textContent = total;
    todayEl.textContent = todayCount;
    realEl.textContent = realCount;
    testEl.textContent = testCount;

    const countEl = document.getElementById('broadcastCount');
    if (countEl) countEl.textContent = `총 ${total}건`;
    }

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

    function extractRowsFromResponse(data) {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.content)) return data.content;
    return [];
    }

    function normalizePriority(p) {
    const v = (p ?? '').toString().trim().toUpperCase();
    if (!v) return 'NONE';
    if (['NONE', 'CAUTION', 'WARNING', 'DANGER'].includes(v)) return v;

    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) {
        if (n >= 4) return 'DANGER';
        if (n === 3) return 'WARNING';
        if (n === 2) return 'CAUTION';
        return 'NONE';
    }
    return 'NONE';
    }

    function formatSpeakerIds(raw) {
    const s = String(raw).trim();
    if (!s) return '';

    try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
        if (arr.length === 0) return '-';
        if (arr.length <= 2) return arr.join(', ');
        return `${arr[0]}, ${arr[1]} 외 ${arr.length - 2}대 (총 ${arr.length}대)`;
        }
    } catch (_) {}

    if (s.length > 40) return `${s.slice(0, 40)}...`;
    return s;
    }

    function mapRowToBroadcastItem(row) {
    const dt = row.dispatchTime ? new Date(row.dispatchTime) : new Date();

    const mode = (row.mode || '').toUpperCase();
    const dispatchType = (row.dispatchType || 'MANUAL').toUpperCase();
    const broadcastType = (row.broadcastType || 'ETC').toUpperCase();
    const scope = (row.scope || '').toUpperCase();
    const priority = normalizePriority(row.priority);

    const disasterCode = row.disasterCode || '';
    const disasterName = row.disasterName || disasterCode || 'UNKNOWN';

    let speakerText = row.speakerId || '';
    if (!speakerText && row.speakerIds) {
        speakerText = formatSpeakerIds(row.speakerIds);
    }
    if (!speakerText) speakerText = '-';

    const message = (row.ttsMessage ?? '').toString().trim();
    const title = `${disasterName} · ${broadcastType}`;

    return {
        no: row.logKey ?? 0,
        dt,
        time: window.SituationCommon.formatDateTime(dt),

        title,
        mode,
        isReal: mode === 'REAL',
        dispatchType,
        broadcastType,
        priority,

        speakerName: speakerText,
        location: scope || '-',
        senderName: row.requestUserId || 'unknown',
        code: row.commandCode || '',

        disasterCode,
        disasterName,
        requestIp: row.requestIp || '',
        memo: row.memo || '',
        message,

        // 원문 보존이 필요하면 여기에 추가
        speakerIdsRaw: row.speakerIds || ''
    };
    }

    function getPriorityChipStyle(priority) {
    const p = (priority || 'NONE').toUpperCase();
    switch (p) {
        case 'DANGER':  return { bg: '#111827', color: '#ffffff', border: '#111827' };
        case 'WARNING': return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
        case 'CAUTION': return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
        case 'NONE':
        default:        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    }
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

    function getTypeMeta(type) {
    switch ((type || 'ETC').toUpperCase()) {
        case 'TTS':   return { icon: 'bi bi-chat-dots', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
        case 'BGM':   return { icon: 'bi bi-music-note-beamed', bg: '#ecfccb', color: '#3f6212', border: '#d9f99d' };
        case 'SIREN': return { icon: 'bi bi-exclamation-triangle', bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' };
        default:      return { icon: 'bi bi-broadcast', bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
    }

    function renderBroadcastCards() {
    const listEl = document.getElementById('broadcastCardList');
    const emptyEl = document.getElementById('broadcastEmptyState');
    const itemsEl = document.getElementById('broadcastCardItems');

    if (!listEl || !emptyEl || !itemsEl) return;

    itemsEl.innerHTML = '';

    if (!broadcastFiltered || broadcastFiltered.length === 0) {
        listEl.classList.add('is-empty');
        emptyEl.classList.remove('d-none');
        itemsEl.classList.add('d-none');
        updateBroadcastStats([]);
        return;
    }

    listEl.classList.remove('is-empty');
    emptyEl.classList.add('d-none');
    itemsEl.classList.remove('d-none');

    broadcastFiltered.forEach((item, index) => {
        const card = createBroadcastCard(item, index);
        itemsEl.appendChild(card);
    });

    updateBroadcastStats(broadcastFiltered);
    }

    function createBroadcastCard(item, index) {
    const esc = window.SituationCommon.escapeHtml;

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

    const title = esc(item.title || 'UNKNOWN');
    const speakerText = esc(item.speakerName || '-');
    const scopeText = esc(item.location || '-');
    const senderText = esc(item.senderName || '-');
    const timeText = esc(item.time || '-');
    const codeText = esc(item.code || '');

    const preview = (item.message || '').trim();
    const previewHtml = preview ? esc(preview) : '<span class="text-secondary">메시지 없음</span>';

    card.innerHTML = `
        <div style="padding: 14px 16px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div style="min-width:0; flex: 1 1 360px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span style="
                width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;
                border-radius:8px;background:${typeMeta.bg};color:${typeMeta.color};
                border:1px solid ${typeMeta.border};
                "><i class="${typeMeta.icon}"></i></span>
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
                background:${modeStyle.bg};color:${modeStyle.color};border:1px solid ${modeStyle.border};">${modeText}</span>

                <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                background:${dispatchTypeChip.bg};color:${dispatchTypeChip.color};border:1px solid ${dispatchTypeChip.border};">${esc(dispatchType)}</span>

                <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                background:${priorityStyle.bg};color:${priorityStyle.color};border:1px solid ${priorityStyle.border};">${p}</span>

                <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;">${esc(type)}</span>

                ${codeText ? `
                <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
                    background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;">CMD ${codeText}</span>` : ''}
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
                <div class="fw-semibold mb-2">메시지</div>
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

            </div>

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
    const esc = window.SituationCommon.escapeHtml;
    return `<span class="px-2 py-1 rounded-pill small fw-bold"
        style="background:${bg};color:${color};border:1px solid ${border};">${esc(text)}</span>`;
    }

    function openBroadcastDetail(item) {
    const esc = window.SituationCommon.escapeHtml;

    ensureBroadcastDetailModal();

    const title = `${item.disasterName || item.disasterCode || 'UNKNOWN'} · ${(item.broadcastType || 'ETC').toUpperCase()}`;
    const subtitle = `${item.time || '-'} · ${item.disasterCode ? 'CODE ' + item.disasterCode : ''}`;

    document.getElementById('bd_title').textContent = title;
    document.getElementById('bd_subtitle').textContent = subtitle;

    const pStyle = getPriorityChipStyle(item.priority);
    const mStyle = item.isReal
        ? { bg:'#fee2e2', color:'#b91c1c', border:'#fecaca' }
        : { bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe' };
    const dStyle = getDispatchTypeChipStyle(item.dispatchType);

    const badges = [
        badgeHtml((item.isReal ? 'REAL' : 'TEST'), mStyle.bg, mStyle.color, mStyle.border),
        badgeHtml((item.dispatchType || 'MANUAL').toUpperCase(), dStyle.bg, dStyle.color, dStyle.border),
        badgeHtml((item.priority || 'NONE').toUpperCase(), pStyle.bg, pStyle.color, pStyle.border),
        badgeHtml((item.broadcastType || 'ETC').toUpperCase(), '#f3f4f6', '#374151', '#e5e7eb'),
    ];
    document.getElementById('bd_badges').innerHTML = badges.join('');

    document.getElementById('bd_speakers').textContent = item.speakerName || '-';
    document.getElementById('bd_scope').textContent = item.location || '-';

    const msg = (item.message || '').trim();
    document.getElementById('bd_message').textContent = msg || '메시지 없음';

    document.getElementById('bd_user').textContent = item.senderName || '-';
    document.getElementById('bd_ip').textContent = item.requestIp || '-';
    document.getElementById('bd_cmd').textContent = item.code ? `CMD ${item.code}` : '-';
    document.getElementById('bd_dst').textContent = item.disasterCode || '-';

    document.getElementById('bd_speaker_ids_raw').textContent = (item.speakerIdsRaw || '').toString();
    document.getElementById('bd_memo').textContent = (item.memo || '').toString();

    const modalEl = document.getElementById('broadcastDetailModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    }

    async function applyBroadcastFilters(isInitialLoad = false) {
    const startEl = document.getElementById('broadcastStartDateTime');
    const endEl = document.getElementById('broadcastEndDateTime');
    const modeEl = document.getElementById('broadcastModeFilter');
    const priorityEl = document.getElementById('broadcastPriorityFilter');
    const speakerEl = document.getElementById('broadcastSpeakerSearch');
    const messageEl = document.getElementById('broadcastMessageSearch');

    const startDt = isInitialLoad ? null : window.SituationCommon.parseInputDateTime(startEl?.value);
    const endDt   = isInitialLoad ? null : window.SituationCommon.parseInputDateTime(endEl?.value);

    const mode = modeEl?.value;
    const priority = priorityEl?.value;
    const speakerQ = speakerEl?.value?.trim();
    const messageQ = messageEl?.value?.trim();

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
        const s = window.SituationCommon.toLocalDateTimeParam(startDt);
        const e = window.SituationCommon.toLocalDateTimeParam(endDt);
        if (s) params.start = s;
        if (e) params.end = e;
        }

        const data = await fetchBroadcastLogsFromServer(params);
        const rows = extractRowsFromResponse(data);

        broadcastData = rows.map(mapRowToBroadcastItem);
        broadcastFiltered = broadcastData;

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
        searchBtn.addEventListener('click', () => applyBroadcastFilters(false));
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
        if (startEl) startEl.value = '';
        if (endEl) endEl.value = '';
        if (modeEl) modeEl.value = '';
        if (priorityEl) priorityEl.value = '';
        if (speakerEl) speakerEl.value = '';
        if (messageEl) messageEl.value = '';
        await applyBroadcastFilters(true); // 다시 “오늘 기본”
        });
    }

    const liveApply = () => applyBroadcastFilters(false);
    [startEl, endEl, modeEl, priorityEl].forEach(el => {
        if (el) el.addEventListener('change', liveApply);
    });

    [speakerEl, messageEl].forEach(el => {
        if (el) {
        el.addEventListener('input', () => {
            clearTimeout(el.t);
            el.t = setTimeout(liveApply, 250);
        });
        }
    });
    }

    document.addEventListener('DOMContentLoaded', async () => {
    if (window.currentView && window.currentView !== 'broadcast') return;

    bindBroadcastEventsOnce();
    await applyBroadcastFilters(true); // 최초 로드: start/end 미전송 → 서버 “오늘 기본”
    });
})();
