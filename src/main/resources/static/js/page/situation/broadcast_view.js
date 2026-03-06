// /js/page/situation/broadcast_view.js
(function () {
    'use strict';

    // ✅ 당신 컨트롤러 기준 (Page / Slice 형태든 content 배열만 있으면 됨)
    const API_LIST = '/api/spk/web/alert-logs';

    let broadcastData = [];
    let broadcastFiltered = [];

    /* ---------------------------
    * 공통 유틸
    * --------------------------- */
    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    // datetime-local 값 "YYYY-MM-DDTHH:mm" → "YYYY-MM-DD"
    function toYmdFromDatetimeLocal(v) {
        if (!v) return '';
        return String(v).split('T')[0];
    }

    // Date → "YYYY-MM-DDTHH:mm" (datetime-local용)
    function toDatetimeLocalValue(d) {
        if (!(d instanceof Date)) return '';
        const y = d.getFullYear();
        const m = pad2(d.getMonth() + 1);
        const day = pad2(d.getDate());
        const hh = pad2(d.getHours());
        const mm = pad2(d.getMinutes());
        return `${y}-${m}-${day}T${hh}:${mm}`;
    }

    // 우선순위(문자열) → 숫자(서버 alertPriority)
    // 프로젝트에서 priority 숫자 정책이 다르면 여기만 바꾸면 됩니다.
    function mapPriorityToNumber(v) {
        if (v === null || v === undefined) return null;
        const s = String(v).trim().toUpperCase();
        if (!s) return null;

        // 이미 숫자로 오면 그대로 사용
        const asNum = parseInt(s, 10);
        if (!Number.isNaN(asNum) && String(asNum) === s) return asNum;

        // 문자열 매핑(예시)
        switch (s) {
            case 'NONE': return 1;
            case 'CAUTION': return 2;
            case 'WARNING': return 3;
            case 'DANGER': return 4;
            default: return null;
        }
    }

    // 방송모드(REAL/TEST) → 숫자(서버 alertMode)
    // 프로젝트에서 alertMode 정책이 다르면 여기만 바꾸면 됩니다.
    function mapModeToNumber(v) {
        if (v === null || v === undefined) return null;
        const s = String(v).trim().toUpperCase();
        if (!s) return null;

        // 이미 숫자로 오면 그대로 사용
        const asNum = parseInt(s, 10);
        if (!Number.isNaN(asNum) && String(asNum) === s) return asNum;

        if (s === 'REAL') return 1;
        if (s === 'TEST') return 0;
        return null;
    }

    function kindToText(kind) {
        const n = parseInt(kind, 10);
        if (n === 1) return 'TTS';
        if (n === 2) return '사이렌';
        if (n === 3) return '혼합';
        return '-';
    }

    function modeToText(mode) {
        const n = parseInt(mode, 10);
        if (n === 1) return 'REAL';
        if (n === 0) return 'TEST';
        return '-';
    }

    function priorityToText(priority) {
        const n = parseInt(priority, 10);
        if (n === 4) return 'DANGER';
        if (n === 3) return 'WARNING';
        if (n === 2) return 'CAUTION';
        if (n === 1) return 'NONE';
        return '-';
    }

    function extractRowsFromResponse(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;            // List 형태
        if (Array.isArray(data.content)) return data.content; // Page/Slice 형태
        if (Array.isArray(data.items)) return data.items;
        return [];
    }

    async function fetchAlertLogs(params) {
        const qs = new URLSearchParams();
        Object.entries(params || {}).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            if (typeof v === 'string' && v.trim() === '') return;
            qs.set(k, String(v));
        });

        const url = `${API_LIST}?${qs.toString()}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error(`alert logs http ${res.status}`);
        return await res.json();
    }

    /* ---------------------------
    * 데이터 → 화면 모델 매핑
    * (SpkWebAlertLogResponseDTO 기반)
    * --------------------------- */
    function mapRowToItem(row) {
        // createdAt: "2026-01-18T18:47:54.105" 형태라고 가정(스프링 기본)
        const dt = row?.createdAt ? new Date(row.createdAt) : new Date();

        const deviceId = row?.deviceId ?? '-';
        const disasterCode = row?.disasterCode ?? '-';

        const alertKind = row?.alertKind;
        const alertRange = row?.alertRange;
        const alertMode = row?.alertMode;
        const alertPriority = row?.alertPriority;

        const status = String(row?.status ?? '').toUpperCase() || '-';
        const commandCode = row?.commandCode ?? '';

        const title = `${disasterCode} · ${kindToText(alertKind)}`;

        return {
            id: row?.id ?? 0,
            dt,
            time: window.SituationCommon?.formatDateTime
                ? window.SituationCommon.formatDateTime(dt)
                : dt.toLocaleString(),

            title,
            deviceId,
            disasterCode,

            alertKind,
            alertRange,
            alertMode,
            alertPriority,

            status,
            commandCode,

            ttsMessage: (row?.ttsMessage ?? '').toString(),
            alertStoCd: row?.alertStoCd ?? '',
            alertSirenCd: row?.alertSirenCd ?? '',
        };
    }

    /* ---------------------------
    * 통계/카드 렌더
    * --------------------------- */
    function updateBroadcastStats(list) {
        const totalEl = document.getElementById('broadcast_stat_total');
        const todayEl = document.getElementById('broadcast_stat_today');
        const realEl = document.getElementById('broadcast_stat_real');
        const testEl = document.getElementById('broadcast_stat_test');
        if (!totalEl || !todayEl || !realEl || !testEl) return;

        const today = new Date();
        const total = list.length;

        const todayCount = list.filter(x => window.SituationCommon?.isSameYmd
            ? window.SituationCommon.isSameYmd(x.dt, today)
            : true
        ).length;

        const realCount = list.filter(x => parseInt(x.alertMode, 10) === 1).length;
        const testCount = list.filter(x => parseInt(x.alertMode, 10) === 0).length;

        totalEl.textContent = total;
        todayEl.textContent = todayCount;
        realEl.textContent = realCount;
        testEl.textContent = testCount;

        const countEl = document.getElementById('broadcastCount');
        if (countEl) countEl.textContent = `총 ${total}건 | 발령 내역을 조회합니다.`;
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
            itemsEl.appendChild(createBroadcastCard(item, index));
        });

        updateBroadcastStats(broadcastFiltered);
    }

    function chip(text, style) {
        const esc = window.SituationCommon?.escapeHtml || ((s) => String(s));
        const t = esc(text ?? '-');
        const bg = style?.bg ?? '#f3f4f6';
        const color = style?.color ?? '#374151';
        const border = style?.border ?? '#e5e7eb';
        return `
        <span style="padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
        background:${bg};color:${color};border:1px solid ${border};">${t}</span>
    `;
    }

    function createBroadcastCard(item) {
        const esc = window.SituationCommon?.escapeHtml || ((s) => String(s));

        const card = document.createElement("div");
        card.className = "broadcast-card-modern fade-in";
        card.dataset.id = item.id;

        const modeText = modeToText(item.alertMode);
        const priorityText = priorityToText(item.alertPriority);
        const kindText = kindToText(item.alertKind);
        const statusText = String(item.status || "-").toUpperCase();
        const isSuccess = statusText === "SENT" || statusText === "SUCCESS";

        const msg = (item.ttsMessage || "").trim() || "메시지 없음";
        const stoCd = (item.alertStoCd || "-").trim();
        const sirenCd = (item.alertSirenCd || "-").trim();

        const statusClass = isSuccess ? "status-ok" : "status-fail";
        const priorityClass = priorityText.toLowerCase();

        // 고유 ID (아코디언용)
        const accId = `bcm_acc_${item.id}`;

        card.innerHTML = `
    <div class="bcm-header" style="margin-bottom: 12px;">
        <div class="bcm-title-wrap">
            <div class="bcm-icon ${isSuccess ? 'ok' : 'fail'}">
                <i class="bi bi-broadcast-pin"></i>
            </div>
            <div class="bcm-title-info">
                <h4 class="bcm-title">${esc(item.disasterCode)} · ${esc(kindText)}</h4>
                <span class="bcm-time"><i class="bi bi-clock"></i> ${esc(item.time)}</span>
            </div>
        </div>
        <div class="bcm-status-badge ${statusClass}">
            ${isSuccess ? '<i class="bi bi-check-circle-fill"></i>' : '<i class="bi bi-exclamation-triangle-fill"></i>'}
            ${esc(statusText)}
        </div>
    </div>

    <!-- 컴팩트하게 정리된 기본 정보 영역 -->
    <div class="bcm-meta-compact">
        <span class="bcm-compact-val"><i class="bi bi-hdd-network"></i> ${esc(item.deviceId)}</span>
        <span class="bcm-compact-val priority-${priorityClass}">${esc(priorityText)}</span>
        <span class="bcm-compact-val">${esc(modeText)}</span>
        <span class="bcm-compact-val"><i class="bi bi-diagram-3"></i> 범위: ${esc(item.alertRange ?? "-")}</span>
    </div>

    <!-- 아코디언 영역 (상세) -->
    <div class="bcm-inline-accordion" id="${accId}_parent">
        <button class="bcm-inline-acc-btn collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${accId}_body" aria-expanded="false" aria-controls="${accId}_body">
            상세 정보 보기 <i class="bi bi-chevron-down"></i>
        </button>
        
        <div id="${accId}_body" class="collapse bcm-inline-acc-body" data-bs-parent="#${accId}_parent">
            <!-- 부가 정보 그리드 -->
            <div class="bcm-meta-grid" style="margin-bottom: 12px;">
                <div class="bcm-meta-item">
                    <span class="bcm-meta-label">CMD</span>
                    <span class="bcm-meta-val">${esc(item.commandCode || "-")}</span>
                </div>
                <div class="bcm-meta-item">
                    <span class="bcm-meta-label">STO 코드</span>
                    <span class="bcm-meta-val">${esc(stoCd)}</span>
                </div>
                <div class="bcm-meta-item">
                    <span class="bcm-meta-label">사이렌 코드</span>
                    <span class="bcm-meta-val">${esc(sirenCd)}</span>
                </div>
            </div>

            <!-- 메시지 박스 -->
            <div class="bcm-message-box" style="margin-top:0; padding-top:12px; border-top: 1px dashed rgba(255, 255, 255, 0.1);">
                <div class="bcm-msg-label"><i class="bi bi-chat-square-text"></i> TTS 메시지</div>
                <div class="bcm-msg-content">${esc(msg)}</div>
            </div>
        </div>
    </div>
    `;

        return card;
    }

    // Modal 관련 함수들 모두 제거 (이제 아코디언에서 처리)

    /* ---------------------------
    * 조회(검색 버튼 기준)
    * --------------------------- */
    async function loadBroadcastListFromUi() {
        const startEl = document.getElementById('broadcastStartDateTime');
        const endEl = document.getElementById('broadcastEndDateTime');

        // 고급필터로 옮겨도 id만 유지하면 정상 작동  [oai_citation:2‡situationPage.html](sediment://file_00000000ea8471fab458d65e1faa98ed)
        const modeEl = document.getElementById('broadcastModeFilter');
        const priorityEl = document.getElementById('broadcastPriorityFilter');

        // 스피커 검색(고급필터에 있어도 됨)
        const speakerEl = document.getElementById('broadcastSpeakerSearch');

        const startYmd = toYmdFromDatetimeLocal(startEl?.value);
        const endYmd = toYmdFromDatetimeLocal(endEl?.value);

        const modeNum = mapModeToNumber(modeEl?.value);
        const priorityNum = mapPriorityToNumber(priorityEl?.value);
        const deviceId = (speakerEl?.value || '').trim();

        // ✅ 서버 파라미터 구성 (SpkWebAlertLogSearchRequest 바인딩용)
        // - 같은 날짜면 date 사용
        // - 다르면 from/to 사용
        const params = {
            page: 0,
            size: 200
        };

        if (startYmd && endYmd && startYmd === endYmd) {
            params.date = startYmd;
        } else {
            if (startYmd) params.from = startYmd;
            if (endYmd) params.to = endYmd;
            // 둘 다 없으면 서버쪽 기본(오늘) 적용되도록 비워둠
        }

        if (modeNum !== null) params.alertMode = modeNum;
        if (priorityNum !== null) params.alertPriority = priorityNum;
        if (deviceId) params.deviceId = deviceId;

        try {
            const data = await fetchAlertLogs(params);
            const rows = extractRowsFromResponse(data);

            broadcastData = rows.map(mapRowToItem);
            broadcastFiltered = broadcastData;

            renderBroadcastCards();
        } catch (err) {
            console.error('broadcast load error:', err);
            broadcastData = [];
            broadcastFiltered = [];
            renderBroadcastCards();
        }
    }

    function setDefaultTodayRange() {
        const startEl = document.getElementById('broadcastStartDateTime');
        const endEl = document.getElementById('broadcastEndDateTime');
        if (!startEl || !endEl) return;

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);

        startEl.value = toDatetimeLocalValue(start);
        endEl.value = toDatetimeLocalValue(end);
    }

    function bindEventsOnce() {
        const searchBtn = document.getElementById('broadcastSearchBtn');
        if (searchBtn?.dataset.bound === '1') return;

        if (searchBtn) {
            searchBtn.dataset.bound = '1';
            searchBtn.addEventListener('click', loadBroadcastListFromUi);
        }

        // ✅ “선택해서 검색” 요구사항: change/input 자동 조회 제거
        // (기존 코드에서 liveApply 제거)  [oai_citation:3‡broadcast_view.js](sediment://file_000000004f0071fa9d9cf8fb1af8000d)

        // Enter 키로 검색
        const startEl = document.getElementById('broadcastStartDateTime');
        const endEl = document.getElementById('broadcastEndDateTime');
        const modeEl = document.getElementById('broadcastModeFilter');
        const priorityEl = document.getElementById('broadcastPriorityFilter');
        const speakerEl = document.getElementById('broadcastSpeakerSearch');

        [startEl, endEl, modeEl, priorityEl, speakerEl].forEach((el) => {
            if (!el) return;
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loadBroadcastListFromUi();
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        if (window.currentView && window.currentView !== 'broadcast') return;

        bindEventsOnce();

        // ✅ 최초 로드: 오늘 날짜로 세팅 후, 오늘 전체 리스트 자동 조회
        setDefaultTodayRange();
        await loadBroadcastListFromUi();
    });

})();