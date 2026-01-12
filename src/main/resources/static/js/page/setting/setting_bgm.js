/**
 * setting_bgm.js (스케줄/방송 스케줄 관리용 - 전체 수정본)
 * - tb_spk_broadcast_schedule 기반
 * - schedule_name(스케줄 이름) + enabled_yn + 요일/시간 + bc_* + disaster_code + tts_message + speaker_ids(JSON 배열)
 * - 스케줄 카드 렌더링 + 펼치기(할당 스피커 상세) + 모달 신규/수정 + 저장/수정/삭제 API 연동
 *
 * 전제 HTML(id):
 *  - #add-schedule-btn, #schedule-list, #schedule-count, #no-schedule-msg
 *  - #scheduleModal, #scheduleModalLabel, #submitBtn, #schedule-form
 *  - #sc_schedule_id(hidden), #sc_name, #sc_enabled
 *  - input[name=startTime], input[name=endTime], #isRepeat, #weekdays
 *  - #sc_mode, #sc_alert_type, #sc_broadcast_type, #sc_priority, #sc_scope, #sc_disaster, #sc_tts, #ttsSection
 *  - 스피커 선택: #speakerPickTbody, #speakerSearch, #speakerPickedCount, #speakerPickAll
 *
 * API (예시)
 *  - GET    /api/btype/schedule/list
 *  - POST   /api/btype/schedule
 *  - PUT    /api/btype/schedule/{id}
 *  - DELETE /api/btype/schedule/{id}
 *  - GET    /api/btype/query/config/list   (SpkConfig 목록)
 */

(() => {
  'use strict';

  // -------------------------
  // State
  // -------------------------
  let scheduleInitialized = false;
  let scheduleList = [];              // 정규화된 스케줄 리스트
  let expandedSchedule = null;        // 펼친 schedule id
  let selectedSpeakerKeys = new Set();// 모달에서 선택된 speakerKey(문자열)
  let allSpeakersCache = [];          // 스피커 전체 캐시

  // 요일 정의 (DB 컬럼명과 일치)
  const weekDays = [
    { key: 'mon', label: '월' },
    { key: 'tue', label: '화' },
    { key: 'wed', label: '수' },
    { key: 'thu', label: '목' },
    { key: 'fri', label: '금' },
    { key: 'sat', label: '토' },
    { key: 'sun', label: '일' }
  ];

  // -------------------------
  // Utils
  // -------------------------
  function escapeHtml(str) {
    const s = String(str ?? '');
    return s.replace(/[&<>"'`=\/]/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#x60;',
      '=': '&#x3D;',
      '/': '&#x2F;'
    }[c]));
  }

  function yn(v) {
    return String(v ?? '').toUpperCase() === 'Y';
  }

  function toY(v) {
    return yn(v) ? 'Y' : 'N';
  }

  function fmtTimeHHMM(v) {
    const s = String(v ?? '');
    // "08:00:00" or "08:00"
    return s.length >= 5 ? s.substring(0, 5) : s;
  }

  function fmtDateTime(v) {
    if (!v) return '-';
    return String(v).substring(0, 16).replace('T', ' ');
  }

  function parseSpeakerIds(speakerIds) {
    // speakerIds가 배열이면 그대로, 문자열이면 JSON parse, 실패 시 쉼표 split
    if (!speakerIds) return [];
    if (Array.isArray(speakerIds)) return speakerIds.map(String);

    const s = String(speakerIds).trim();
    if (!s) return [];
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      return s.split(',').map(x => x.trim()).filter(Boolean);
    }
  }

  // -------------------------
  // Data Normalize
  // -------------------------
  function groupSchedules(rawList) {
    const arr = Array.isArray(rawList) ? rawList : [];
    if (!arr.length) return [];

    const looksGrouped = arr.some(x => x && (Array.isArray(x.speakers) || x.speakerIds || x.bcMode || x.disasterCode));
    if (looksGrouped) {
      return arr.map(s => ({
        id: Number(s.scheduleId ?? s.id),
        name: s.scheduleName ?? s.name ?? '',
        enabledYn: s.enabledYn ?? 'Y',
        startTime: String(s.startTime ?? ''),
        endTime: String(s.endTime ?? ''),
        repeatEnabled: s.repeatEnabled ?? 'Y',
        week: {
          mon: yn(s.mon), tue: yn(s.tue), wed: yn(s.wed),
          thu: yn(s.thu), fri: yn(s.fri), sat: yn(s.sat), sun: yn(s.sun)
        },
        bcMode: s.bcMode ?? 'REAL',
        bcAlertType: s.bcAlertType ?? 'CFW',
        bcBroadcastType: s.bcBroadcastType ?? 'TTS',
        bcPriority: s.bcPriority ?? 'NONE',
        bcScope: s.bcScope ?? 'SPEAKER',
        disasterCode: s.disasterCode ?? '',
        ttsMessage: s.ttsMessage ?? '',
        speakerIds: parseSpeakerIds(s.speakerIds),
        createdAt: fmtDateTime(s.createdAt),
        updatedAt: fmtDateTime(s.updatedAt),
        speakers: Array.isArray(s.speakers) ? s.speakers : []
      }));
    }

    // flat(조인) 형태도 scheduleId로 묶어서 흡수
    const map = arr.reduce((acc, row) => {
      const id = Number(row.scheduleId ?? row.id);
      if (!id) return acc;

      if (!acc[id]) {
        acc[id] = {
          id,
          name: row.scheduleName ?? row.name ?? '',
          enabledYn: row.enabledYn ?? 'Y',
          startTime: String(row.startTime ?? ''),
          endTime: String(row.endTime ?? ''),
          repeatEnabled: row.repeatEnabled ?? 'Y',
          week: {
            mon: yn(row.mon), tue: yn(row.tue), wed: yn(row.wed),
            thu: yn(row.thu), fri: yn(row.fri), sat: yn(row.sat), sun: yn(row.sun)
          },
          bcMode: row.bcMode ?? 'REAL',
          bcAlertType: row.bcAlertType ?? 'CFW',
          bcBroadcastType: row.bcBroadcastType ?? 'TTS',
          bcPriority: row.bcPriority ?? 'NONE',
          bcScope: row.bcScope ?? 'SPEAKER',
          disasterCode: row.disasterCode ?? '',
          ttsMessage: row.ttsMessage ?? '',
          speakerIds: parseSpeakerIds(row.speakerIds),
          createdAt: fmtDateTime(row.createdAt),
          updatedAt: fmtDateTime(row.updatedAt),
          speakers: []
        };
      }

      if (row.speakerId || row.speakerKey || row.speakerName) {
        acc[id].speakers.push({
          speakerKey: row.speakerKey,
          speakerId: row.speakerId,
          speakerName: row.speakerName,
          locationCode: row.locationCode,
          locationName: row.locationName,
          speakerAdr: row.speakerAdr,
          speakerLatitude: row.speakerLatitude,
          speakerLongitude: row.speakerLongitude
        });
      }
      return acc;
    }, {});

    return Object.values(map);
  }

  // -------------------------
  // UI: Weekday Buttons
  // -------------------------
  function renderWeekdayButtons() {
    const wrap = document.getElementById('weekdays');
    if (!wrap) return;

    // 이미 생성되어 있으면 재생성하지 않아도 됨
    wrap.innerHTML = '';

    weekDays.forEach(d => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-secondary me-1 mb-1';
      btn.textContent = d.label;
      btn.setAttribute('data-weekday', d.key);
      wrap.appendChild(btn);
    });

    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-weekday]');
      if (!btn) return;

      const on = !btn.classList.contains('active');
      btn.classList.toggle('active', on);
      btn.classList.toggle('btn-primary', on);
      btn.classList.toggle('btn-outline-secondary', !on);
    });
  }

  // -------------------------
  // UI: Speaker Pick (Modal)
  // -------------------------
  async function loadModalSpeakers() {
    // 스피커 목록 API 호출(캐시)
    if (Array.isArray(allSpeakersCache) && allSpeakersCache.length) return allSpeakersCache;

    const res = await fetch('/api/btype/query/config/list');
    const data = res.ok ? await res.json() : [];
    allSpeakersCache = Array.isArray(data) ? data : [];
    return allSpeakersCache;
  }

  function updatePickedCount() {
    const el = document.getElementById('speakerPickedCount');
    if (!el) return;
    el.textContent = String(selectedSpeakerKeys.size);
  }

  function renderSpeakerPickTable(list) {
    const tbody = document.getElementById('speakerPickTbody');
    if (!tbody) return;
  
    const speakers = Array.isArray(list) ? list : [];
    tbody.innerHTML = '';
  
    if (!speakers.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">스피커가 없습니다.</td></tr>`;
      syncHeaderCheckState();
      updatePickedCount();
      return;
    }
  
    speakers.forEach(sp => {
      const tr = document.createElement('tr');
      tr.classList.add('speaker-row', 'cursor-pointer');
      tr.setAttribute('data-role', 'speaker-row');
  
      const key = sp.speakerKey != null ? String(sp.speakerKey) : '';
      const id  = sp.speakerId  != null ? String(sp.speakerId)  : '';
      const name = sp.speakerName != null ? String(sp.speakerName) : '-';
      const loc  = sp.locationName != null ? String(sp.locationName)
                 : (sp.locationCode != null ? String(sp.locationCode) : '-');
      const adr  = sp.speakerAdr != null ? String(sp.speakerAdr) : '-';
  
      const checked = key && selectedSpeakerKeys.has(key) ? 'checked' : '';
  
      tr.innerHTML = `
        <td style="width:44px;">
          <input class="form-check-input speaker-row-check"
                 type="checkbox"
                 data-role="speaker-check"
                 data-speaker-key="${escapeHtml(key)}"
                 ${checked}>
        </td>
        <td>${escapeHtml(name)}</td>
        <td><small class="text-muted">${escapeHtml(id)}</small></td>
        <td>${escapeHtml(loc)}</td>
        <td><small class="text-muted">${escapeHtml(adr)}</small></td>
      `;
      tbody.appendChild(tr);
    });
  
    syncHeaderCheckState();
    updatePickedCount();
  }

  function getVisibleSpeakerCheckboxes() {
    return Array.from(document.querySelectorAll('#speakerPickTbody input[type="checkbox"][data-role="speaker-check"]'));
  }

  function syncHeaderCheckState() {
    const header = document.getElementById('speakerHeaderCheck');
    if (!header) return;
  
    const visibles = getVisibleSpeakerCheckboxes();
    const total = visibles.length;
    const checkedCnt = visibles.filter(chk => chk.checked).length;
  
    header.checked = (total > 0 && checkedCnt === total);
    header.indeterminate = (checkedCnt > 0 && checkedCnt < total);
  }
  
  function bindSpeakerPickEvents() {
    const tbody = document.getElementById('speakerPickTbody');
    const search = document.getElementById('speakerSearch');
  
    const headerCheck = document.getElementById('speakerHeaderCheck');
    const btnSelectAll = document.getElementById('speakerSelectAllBtn');
    const btnClear = document.getElementById('speakerClearBtn');
    const btnReload = document.getElementById('speakerReloadBtn');
  
    if (tbody) {
      // 1) checkbox 직접 클릭/변경
      tbody.addEventListener('change', (e) => {
        const chk = e.target.closest('input[type="checkbox"][data-role="speaker-check"]');
        if (!chk) return;
  
        const key = chk.getAttribute('data-speaker-key');
        if (!key) return;
  
        if (chk.checked) selectedSpeakerKeys.add(String(key));
        else selectedSpeakerKeys.delete(String(key));
  
        updatePickedCount();
        syncHeaderCheckState();
      });
  
      // 2) row 전체 클릭하면 toggle (input 클릭은 제외)
      tbody.addEventListener('click', (e) => {
        // 버튼/링크/체크박스 자체 클릭은 기본 동작 유지
        if (e.target.closest('input, button, a, label')) return;
  
        const row = e.target.closest('tr[data-role="speaker-row"]');
        if (!row) return;
  
        const chk = row.querySelector('input[type="checkbox"][data-role="speaker-check"]');
        if (!chk) return;
  
        chk.checked = !chk.checked;
        chk.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  
    // 3) 헤더 전체 선택 (현재 필터로 "보이는" row 기준)
    if (headerCheck) {
      headerCheck.addEventListener('change', () => {
        const visibles = getVisibleSpeakerCheckboxes();
        visibles.forEach(chk => {
          const key = chk.getAttribute('data-speaker-key');
          if (!key) return;
  
          chk.checked = headerCheck.checked;
          if (headerCheck.checked) selectedSpeakerKeys.add(String(key));
          else selectedSpeakerKeys.delete(String(key));
        });
  
        headerCheck.indeterminate = false;
        updatePickedCount();
        syncHeaderCheckState();
      });
    }
  
    // 4) 버튼: 전체선택/선택해제
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        const visibles = getVisibleSpeakerCheckboxes();
        visibles.forEach(chk => {
          const key = chk.getAttribute('data-speaker-key');
          if (!key) return;
          chk.checked = true;
          selectedSpeakerKeys.add(String(key));
        });
        updatePickedCount();
        syncHeaderCheckState();
      });
    }
  
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        const visibles = getVisibleSpeakerCheckboxes();
        visibles.forEach(chk => {
          const key = chk.getAttribute('data-speaker-key');
          if (!key) return;
          chk.checked = false;
          selectedSpeakerKeys.delete(String(key));
        });
        updatePickedCount();
        syncHeaderCheckState();
      });
    }
  
    // 5) 새로고침: 스피커 목록 다시 로드 + 선택 상태 유지
    if (btnReload) {
      btnReload.addEventListener('click', async () => {
        try {
          allSpeakersCache = []; // 캐시 무효화
          const speakers = await loadModalSpeakers();
          // 검색어 유지
          const q = String(search?.value ?? '').trim().toLowerCase();
          const filtered = !q ? speakers : speakers.filter(sp => {
            const key = String(sp.speakerKey ?? '').toLowerCase();
            const id  = String(sp.speakerId ?? '').toLowerCase();
            const name = String(sp.speakerName ?? '').toLowerCase();
            const loc = String(sp.locationName ?? sp.locationCode ?? '').toLowerCase();
            const adr = String(sp.speakerAdr ?? '').toLowerCase();
            return key.includes(q) || id.includes(q) || name.includes(q) || loc.includes(q) || adr.includes(q);
          });
          renderSpeakerPickTable(filtered);
        } catch (e) {
          console.error(e);
        }
      });
    }
  
    // 6) 검색 필터
    if (search) {
      search.addEventListener('input', () => {
        const q = String(search.value ?? '').trim().toLowerCase();
        const filtered = !q ? allSpeakersCache : allSpeakersCache.filter(sp => {
          const key = String(sp.speakerKey ?? '').toLowerCase();
          const id  = String(sp.speakerId ?? '').toLowerCase();
          const name = String(sp.speakerName ?? '').toLowerCase();
          const loc = String(sp.locationName ?? sp.locationCode ?? '').toLowerCase();
          const adr = String(sp.speakerAdr ?? '').toLowerCase();
          return key.includes(q) || id.includes(q) || name.includes(q) || loc.includes(q) || adr.includes(q);
        });
  
        renderSpeakerPickTable(filtered);
      });
    }
  }

  function getSelectedSpeakerIds() {
    // 정책: speakerKey를 JSON 배열로 저장(권장)
    return [...selectedSpeakerKeys].map(String);
  }

  // -------------------------
  // UI: Schedule list rendering
  // -------------------------
  function renderSpeakerTable(schedule) {
    // schedule.speakers가 있으면 상세 표시, 없으면 speakerIds만 표시
    const speakers = Array.isArray(schedule.speakers) ? schedule.speakers : [];

    const onlyIds = (!speakers.length && Array.isArray(schedule.speakerIds) && schedule.speakerIds.length)
      ? schedule.speakerIds.map(id => ({ speakerKey: id, speakerId: id, speakerName: '-', locationName: '-', speakerAdr: '-' }))
      : [];

    const list = speakers.length ? speakers : onlyIds;

    if (!list.length) {
      return `
        <div class="mt-3 p-3 rounded-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);">
          <div class="text-white-50 small">할당된 스피커가 없습니다.</div>
        </div>
      `;
    }

    return `
      <div class="mt-3">
        <h6 class="text-white-50 fw-semibold mb-2">
          <i class="bi bi-speaker me-1"></i>
          할당 스피커 (${list.length}개)
        </h6>

        <div class="table-responsive rounded-3 schedule-table-wrap">
          <table class="table table-dark align-middle mb-0 w-100">
            <colgroup>
              <col style="width: 10%;">
              <col style="width: 18%;">
              <col style="width: 18%;">
              <col style="width: 22%;">
              <col style="width: 16%;">
              <col style="width: 16%;">
            </colgroup>
            <thead>
              <tr>
                <th>Key</th>
                <th>단말 ID</th>
                <th>단말명</th>
                <th>지역</th>
                <th>접속주소</th>
                <th>좌표</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(sp => {
                const key = sp.speakerKey ?? '-';
                const sid = sp.speakerId ?? '-';
                const name = sp.speakerName ?? '-';
                const loc = (sp.locationName || sp.locationCode) ? `${sp.locationName ?? ''} ${sp.locationCode ? '(' + sp.locationCode + ')' : ''}`.trim() : '-';
                const adr = sp.speakerAdr ?? '-';

                const lat = sp.speakerLatitude ?? '';
                const lng = sp.speakerLongitude ?? '';
                const coord = (lat && lng) ? `${lat}, ${lng}` : '-';

                return `
                  <tr style="border-color:#30363D;">
                    <td style="border-color:#30363D;"><small style="color:#8B949E;">${escapeHtml(String(key))}</small></td>
                    <td style="border-color:#30363D;">${escapeHtml(String(sid))}</td>
                    <td style="border-color:#30363D;">${escapeHtml(String(name))}</td>
                    <td style="border-color:#30363D;">${escapeHtml(String(loc))}</td>
                    <td style="border-color:#30363D;">${escapeHtml(String(adr))}</td>
                    <td style="border-color:#30363D;"><small style="color:#8B949E;">${escapeHtml(String(coord))}</small></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderScheduleList() {
    const listDiv = document.getElementById('schedule-list');
    const countSpan = document.getElementById('schedule-count');
    const emptyMsg = document.getElementById('no-schedule-msg');
    if (!listDiv || !emptyMsg) return;

    emptyMsg.classList.toggle('d-none', scheduleList.length > 0);

    if (countSpan) {
      countSpan.textContent = `총 ${scheduleList.length}개의 스케줄 | 방송 스케줄과 대상 스피커를 관리하세요`;
    }

    listDiv.innerHTML = '';
    if (!scheduleList.length) return;

    const badgeByPriority = (p) => {
      const v = String(p ?? 'NONE').toUpperCase();
      if (v === 'DANGER') return 'status-danger';
      if (v === 'WARNING') return 'status-warning';
      if (v === 'CAUTION') return 'status-info';
      return 'status-primary';
    };

    const weekStrOf = (s) => {
      if (!yn(s.repeatEnabled)) return '반복 없음';
      const labels = weekDays.filter(d => !!(s.week && s.week[d.key])).map(d => d.label);
      return labels.length ? labels.join(', ') : '-';
    };

    scheduleList.forEach(s => {
      const isExpanded = expandedSchedule === s.id;

      const enabledBadge = yn(s.enabledYn)
        ? `<span class="status-badge status-success">사용</span>`
        : `<span class="status-badge status-secondary">미사용</span>`;

      const speakerCount = (Array.isArray(s.speakers) && s.speakers.length)
        ? s.speakers.length
        : (Array.isArray(s.speakerIds) ? s.speakerIds.length : 0);

      const timeRange = `${escapeHtml(fmtTimeHHMM(s.startTime))} ~ ${escapeHtml(fmtTimeHHMM(s.endTime))}`;
      const weekStr = weekStrOf(s);

      const card = document.createElement('div');
      card.className = 'schedule-card-v2 mb-2';
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div class="flex-grow-1" style="min-width:260px;">
            <div class="d-flex align-items-center gap-2 mb-2">
              <button class="icon-btn" type="button" data-action="toggle" data-id="${s.id}" aria-label="toggle">
                <i class="bi bi-chevron-${isExpanded ? 'up' : 'down'}"></i>
              </button>

              <i class="bi bi-calendar-event text-info"></i>
              <div class="fw-semibold text-white fs-6">${escapeHtml(s.name || '이름 없는 스케줄')}</div>

              ${enabledBadge}
              <span class="status-badge ${badgeByPriority(s.bcPriority)} ms-1">${escapeHtml(String(s.bcPriority ?? 'NONE'))}</span>
              <span class="status-badge status-purple ms-1">${escapeHtml(String(s.bcBroadcastType ?? 'TTS'))}</span>
            </div>

            <div class="schedule-meta">
              <span class="meta-item"><i class="bi bi-clock"></i>${timeRange}</span>
              <span class="meta-item"><i class="bi bi-calendar-week"></i>${escapeHtml(weekStr)}</span>
              <span class="meta-item"><i class="bi bi-gear"></i>${escapeHtml(String(s.bcMode ?? 'REAL'))} / ${escapeHtml(String(s.bcAlertType ?? 'CFW'))} / ${escapeHtml(String(s.bcScope ?? 'SPEAKER'))}</span>
              <span class="meta-item"><i class="bi bi-megaphone"></i>${escapeHtml(String(s.disasterCode || '-'))}</span>
              <span class="meta-item text-muted"><i class="bi bi-speaker"></i>${speakerCount}대</span>
              <span class="meta-item text-muted"><i class="bi bi-calendar3"></i>${escapeHtml(s.updatedAt || s.createdAt || '-')}</span>
            </div>

            ${(String(s.bcBroadcastType ?? '').toUpperCase() === 'TTS' && s.ttsMessage)
              ? `<div class="mt-2 small text-white-50"><i class="bi bi-chat-left-text me-1"></i>${escapeHtml(s.ttsMessage)}</div>`
              : ''
            }
          </div>

          <div class="schedule-actions flex-shrink-0">
            <button class="icon-btn" type="button" data-action="edit" data-id="${s.id}" aria-label="edit">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="icon-btn" type="button" data-action="delete" data-id="${s.id}" aria-label="delete">
              <i class="bi bi-trash3 text-danger"></i>
            </button>
          </div>
        </div>

        ${isExpanded ? renderSpeakerTable(s) : ''}
      `;

      listDiv.appendChild(card);
    });
  }

  // -------------------------
  // Modal: open / fill
  // -------------------------
  function openScheduleModal(mode, schedule) {
    const modalEl = document.getElementById('scheduleModal');
    const form = document.getElementById('schedule-form');
    if (!modalEl || !form) return;

    // 요일 버튼은 모달 열기 전 반드시 존재해야 함
    renderWeekdayButtons();

    const title = document.getElementById('scheduleModalLabel');
    const submitBtn = document.getElementById('submitBtn');
    if (title) title.textContent = (mode === 'edit') ? '스케줄 수정' : '새 스케줄 추가';
    if (submitBtn) submitBtn.textContent = (mode === 'edit') ? '수정 저장' : '저장';

    // hidden schedule id
    const hid = document.getElementById('sc_schedule_id');
    if (hid) hid.value = (mode === 'edit' && schedule) ? String(schedule.id) : '';

    // name + enabled
    const nm = document.getElementById('sc_name');
    if (nm) nm.value = (mode === 'edit' && schedule) ? (schedule.name ?? '') : '';
    const en = document.getElementById('sc_enabled');
    if (en) en.value = (mode === 'edit' && schedule) ? (schedule.enabledYn ?? 'Y') : 'Y';

    // time inputs
    const stInput = form.querySelector('input[name="startTime"]');
    const etInput = form.querySelector('input[name="endTime"]');
    if (stInput) stInput.value = (mode === 'edit' && schedule) ? fmtTimeHHMM(schedule.startTime) : '08:00';
    if (etInput) etInput.value = (mode === 'edit' && schedule) ? fmtTimeHHMM(schedule.endTime) : '08:05';

    // repeat
    const isRepeat = document.getElementById('isRepeat');
    if (isRepeat) isRepeat.checked = (mode === 'edit' && schedule) ? yn(schedule.repeatEnabled) : true;

    // weekday active
    if (mode === 'edit' && schedule && schedule.week) {
      weekDays.forEach(d => {
        const btn = document.querySelector(`#weekdays [data-weekday="${d.key}"]`);
        if (!btn) return;
        const on = !!schedule.week[d.key];
        btn.classList.toggle('active', on);
        btn.classList.toggle('btn-primary', on);
        btn.classList.toggle('btn-outline-secondary', !on);
      });
    } else {
      weekDays.forEach(d => {
        const btn = document.querySelector(`#weekdays [data-weekday="${d.key}"]`);
        if (!btn) return;
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-secondary');
      });
    }

    // bc fields
    const sc_mode = document.getElementById('sc_mode');
    const sc_alert_type = document.getElementById('sc_alert_type');
    const sc_broadcast_type = document.getElementById('sc_broadcast_type');
    const sc_priority = document.getElementById('sc_priority');
    const sc_scope = document.getElementById('sc_scope');
    const sc_disaster = document.getElementById('sc_disaster');
    const sc_tts = document.getElementById('sc_tts');

    if (sc_mode) sc_mode.value = (mode === 'edit' && schedule) ? (schedule.bcMode ?? 'REAL') : 'REAL';
    if (sc_alert_type) sc_alert_type.value = (mode === 'edit' && schedule) ? (schedule.bcAlertType ?? 'CFW') : 'CFW';
    if (sc_broadcast_type) sc_broadcast_type.value = (mode === 'edit' && schedule) ? (schedule.bcBroadcastType ?? 'TTS') : 'TTS';
    if (sc_priority) sc_priority.value = (mode === 'edit' && schedule) ? (schedule.bcPriority ?? 'NONE') : 'NONE';
    if (sc_scope) sc_scope.value = (mode === 'edit' && schedule) ? (schedule.bcScope ?? 'SPEAKER') : 'SPEAKER';
    if (sc_disaster) sc_disaster.value = (mode === 'edit' && schedule) ? (schedule.disasterCode ?? '') : '';
    if (sc_tts) sc_tts.value = (mode === 'edit' && schedule) ? (schedule.ttsMessage ?? '') : '';

    // ttsSection show/hide
    const ttsSection = document.getElementById('ttsSection');
    const isTts = String((mode === 'edit' && schedule) ? (schedule.bcBroadcastType ?? 'TTS') : 'TTS').toUpperCase() === 'TTS';
    if (ttsSection) ttsSection.classList.toggle('d-none', !isTts);

    // speaker selection set (핵심: 재렌더에도 유지되도록 Set만 세팅)
    selectedSpeakerKeys = new Set();
    if (mode === 'edit' && schedule) {
      // speakerIds는 DB 저장값(문자열 배열)
      const ids = Array.isArray(schedule.speakerIds) ? schedule.speakerIds.map(String) : [];
      // speakers가 내려오면 key도 포함
      const keysFromSpeakers = Array.isArray(schedule.speakers)
        ? schedule.speakers.map(s => String(s.speakerKey ?? '')).filter(Boolean)
        : [];
      [...ids, ...keysFromSpeakers].forEach(k => {
        if (k) selectedSpeakerKeys.add(String(k));
      });
    }

    updatePickedCount();

    // 모달 표시
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  function bindBroadcastTypeToggle() {
    const sel = document.getElementById('sc_broadcast_type');
    const ttsSection = document.getElementById('ttsSection');
    if (!sel || !ttsSection) return;

    sel.addEventListener('change', () => {
      const isTts = String(sel.value ?? '').toUpperCase() === 'TTS';
      ttsSection.classList.toggle('d-none', !isTts);
    });
  }

  // -------------------------
  // CRUD: Schedule
  // -------------------------
  async function reloadScheduleList() {
    const res = await fetch('/api/btype/schedule/list');
    const data = res.ok ? await res.json() : [];
    scheduleList = groupSchedules(Array.isArray(data) ? data : []);
    renderScheduleList();
  }

  async function deleteSchedule(id) {
    if (!id) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const res = await fetch(`/api/btype/schedule/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      alert(`삭제 실패: ${msg || res.status}`);
      return;
    }
    await reloadScheduleList();
  }

  // -------------------------
  // Events: Schedule list & modal
  // -------------------------
  function bindScheduleEvents() {
    const listDiv = document.getElementById('schedule-list');
    if (!listDiv) return;

    listDiv.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const id = Number(btn.getAttribute('data-id'));

      if (action === 'toggle') {
        expandedSchedule = (expandedSchedule === id) ? null : id;
        renderScheduleList();
        return;
      }

      if (action === 'edit') {
        const schedule = scheduleList.find(s => Number(s.id) === id);
        if (!schedule) return;
        openScheduleModal('edit', schedule);
        return;
      }

      if (action === 'delete') {
        deleteSchedule(id);
      }
    });
  }

  function bindModalLifecycle() {
    const modalEl = document.getElementById('scheduleModal');
    if (!modalEl) return;

    modalEl.addEventListener('shown.bs.modal', async () => {
      // 모달이 열릴 때 스피커 로드 → 현재 selectedSpeakerKeys 반영하여 렌더
      try {
        const speakers = await loadModalSpeakers();
        renderSpeakerPickTable(speakers);
      } catch (e) {
        console.error(e);
      }
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      // 검색 초기화
      const search = document.getElementById('speakerSearch');
      if (search) search.value = '';
    });
  }

  function bindAddButton() {
    const addBtn = document.getElementById('add-schedule-btn');
    if (!addBtn) return;

    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // 신규는 선택 초기화
      selectedSpeakerKeys = new Set();
      openScheduleModal('create', null);
    });
  }

  function bindFormSubmit() {
    const form = document.getElementById('schedule-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const scheduleId = (document.getElementById('sc_schedule_id')?.value ?? '').trim();
      const scheduleName = (document.getElementById('sc_name')?.value ?? '').trim();
      const enabledYn = document.getElementById('sc_enabled')?.value ?? 'Y';

      if (!scheduleName) {
        alert('스케줄 이름은 필수입니다.');
        return;
      }

      const startTime = form.querySelector('input[name="startTime"]')?.value ?? '';
      const endTime = form.querySelector('input[name="endTime"]')?.value ?? '';
      if (!startTime || !endTime) {
        alert('시작/종료 시간은 필수입니다.');
        return;
      }

      const repeatEnabled = document.getElementById('isRepeat')?.checked ? 'Y' : 'N';

      // 요일(active)
      const week = {};
      weekDays.forEach(d => {
        const btn = document.querySelector(`#weekdays [data-weekday="${d.key}"]`);
        week[d.key] = !!btn?.classList.contains('active');
      });

      if (repeatEnabled === 'Y' && !Object.values(week).some(Boolean)) {
        alert('반복 실행 시 요일을 1개 이상 선택하세요.');
        return;
      }

      const bcMode = document.getElementById('sc_mode')?.value ?? 'REAL';
      const bcAlertType = document.getElementById('sc_alert_type')?.value ?? 'CFW';
      const bcBroadcastType = document.getElementById('sc_broadcast_type')?.value ?? 'TTS';
      const bcPriority = document.getElementById('sc_priority')?.value ?? 'NONE';
      const bcScope = document.getElementById('sc_scope')?.value ?? 'SPEAKER';
      const disasterCode = document.getElementById('sc_disaster')?.value ?? '';

      if (!disasterCode) {
        alert('재난 코드를 선택하세요.');
        return;
      }

      const ttsMessage = (document.getElementById('sc_tts')?.value ?? '').trim();
      if (String(bcBroadcastType).toUpperCase() === 'TTS' && !ttsMessage) {
        alert('TTS 방송은 TTS 메시지가 필수입니다.');
        return;
      }

      const speakerIds = getSelectedSpeakerIds();
      if (!speakerIds.length) {
        alert('대상 스피커를 1개 이상 선택하세요.');
        return;
      }

      const payload = {
        scheduleId: scheduleId ? Number(scheduleId) : null,
        scheduleName,
        enabledYn,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
        repeatEnabled,
        mon: week.mon ? 'Y' : 'N',
        tue: week.tue ? 'Y' : 'N',
        wed: week.wed ? 'Y' : 'N',
        thu: week.thu ? 'Y' : 'N',
        fri: week.fri ? 'Y' : 'N',
        sat: week.sat ? 'Y' : 'N',
        sun: week.sun ? 'Y' : 'N',
        bcMode,
        bcAlertType,
        bcBroadcastType,
        bcPriority,
        bcScope,
        disasterCode,
        ttsMessage: (String(bcBroadcastType).toUpperCase() === 'TTS') ? ttsMessage : null,
        // speakerIds는 배열로 전송 (서버에서 JSON 문자열로 저장)
        speakerIds
      };

      const isEdit = !!scheduleId;
      const url = isEdit ? `/api/btype/schedule/${scheduleId}` : `/api/btype/schedule`;
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || `HTTP ${res.status}`);
        }

        await reloadScheduleList();

        bootstrap.Modal.getInstance(document.getElementById('scheduleModal'))?.hide();
      } catch (err) {
        console.error(err);
        alert(`저장/수정 실패: ${err?.message || err}`);
      }
    });
  }

  // -------------------------
  // Init
  // -------------------------
  async function initScheduleManager() {
    if (scheduleInitialized) return;
    scheduleInitialized = true;

    // 특정 뷰 분기(프로젝트에서 쓰는 방식 유지)
    if (window.currentView && window.currentView !== 'bgm') return;

    const listDiv = document.getElementById('schedule-list');
    const emptyMsg = document.getElementById('no-schedule-msg');
    if (!listDiv || !emptyMsg) return;

    // 스케줄 목록 로딩
    await reloadScheduleList();

    // 이벤트 바인딩
    bindScheduleEvents();
    bindModalLifecycle();
    bindSpeakerPickEvents();
    bindAddButton();
    bindFormSubmit();
    bindBroadcastTypeToggle();
  }

  // DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initScheduleManager().catch(console.error);
  });

})();
