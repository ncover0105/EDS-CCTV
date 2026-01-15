// /js/page/situation/situation_view.js
// - 상황발생이력: 현재 입력된 시간/구역 값으로 검색
(function () {
  'use strict';

  const pageSize = 15;
  let currentPage = 1;
  let totalCount = 0;

  // ====== datetime-local 표시용 기본값(오늘) ======
  function pad2(n) { return String(n).padStart(2, '0'); }

  function setTodayRangeInputsIfEmpty() {
    const startEl = document.getElementById('startDateTime');
    const endEl = document.getElementById('endDateTime');
    if (!startEl || !endEl) return;

    // 이미 값이 있으면 건드리지 않음
    if ((startEl.value && startEl.value.trim()) || (endEl.value && endEl.value.trim())) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = pad2(now.getMonth() + 1);
    const d = pad2(now.getDate());

    startEl.value = `${y}-${m}-${d}T00:00`;
    endEl.value = `${y}-${m}-${d}T23:59`;
  }

  // ====== 공백/미선택이면 null ======
  function getTrimValue(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const raw = el.value;
    if (raw == null) return null;
    const t = String(raw).trim();
    return t.length ? t : null;
  }

  // ====== 필터 읽기: "현재 입력된 값" 그대로 사용 ======
  function getFilters() {
    const startRaw = getTrimValue('startDateTime'); // "YYYY-MM-DDTHH:mm"
    const endRaw   = getTrimValue('endDateTime');
    const boundaryNum = getTrimValue('boundaryFilter'); // ""이면 null

    // parseInputDateTime / toLocalDateTimeParam 은 situation_common.js의 유틸 사용 가정
    const startDt = startRaw ? window.SituationCommon.parseInputDateTime(startRaw) : null;
    const endDt   = endRaw ? window.SituationCommon.parseInputDateTime(endRaw) : null;

    // ✅ 둘 다 비면 날짜조건 제외
    if (!startDt && !endDt) {
      return { from: '', to: '', boundaryNum: boundaryNum || '' };
    }

    let fromDt = startDt;
    let toDt = endDt;

    // 시작만 있으면 종료 자동 보정(시작 + 1일)
    if (fromDt && !toDt) {
      toDt = new Date(fromDt.getTime() + 24 * 60 * 60 * 1000);
    }

    // 종료만 있으면 시작 자동 보정(종료 - 1일)
    if (!fromDt && toDt) {
      fromDt = new Date(toDt.getTime() - 24 * 60 * 60 * 1000);
    }

    // from > to면 스왑
    if (fromDt && toDt && fromDt.getTime() > toDt.getTime()) {
      const tmp = fromDt; fromDt = toDt; toDt = tmp;
    }

    // from == to면 to를 +1분 보정
    if (fromDt && toDt && fromDt.getTime() === toDt.getTime()) {
      toDt = new Date(toDt.getTime() + 60 * 1000);
    }

    const from = fromDt ? window.SituationCommon.toLocalDateTimeParam(fromDt) : '';
    const to   = toDt ? window.SituationCommon.toLocalDateTimeParam(toDt) : '';

    return { from, to, boundaryNum: boundaryNum || '' };
  }

  // ====== API 호출 ======
  async function fetchEmergencyList(page) {
    const f = getFilters();

    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
    });

    // ✅ 선택(입력)된 항목만 전송 (미선택은 제외)
    if (f.from) params.set('from', f.from);
    if (f.to) params.set('to', f.to);
    if (f.boundaryNum) params.set('boundaryNum', f.boundaryNum);

    const url = `/menu/situation/emergency/search?${params.toString()}`;
    console.log('[situation_view] fetch url =', url);

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  }

  // ====== 테이블 렌더 ======
  function renderRows(items, page) {
    const tbody = document.getElementById('situationList');
    if (!tbody) return;

    const cols = 6;
    const list = Array.isArray(items) ? items : [];

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${cols}" class="text-center text-white-50 py-5">
            조회된 상황 발생 이력이 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    const startNo = (page - 1) * pageSize;

    tbody.innerHTML = list.map((it, idx) => {
      const no = startNo + idx + 1;

      const cctvCode = window.SituationCommon.escapeHtml(it.cctvCode ?? '-');
      const alertCode = window.SituationCommon.escapeHtml(it.alertCode ?? '-');
      const boundaryNum = window.SituationCommon.escapeHtml(it.boundaryNum ?? '-');
      const log = window.SituationCommon.escapeHtml(it.log ?? '-');
      const inpDttm = window.SituationCommon.escapeHtml(it.inpDttm ?? '-');

      const alertCellHtml =
        alertCode === '003'
          ? `<span class="status-badge status-error">출입알림</span>`
          : alertCode;

      return `
        <tr>
          <td class="text-center">${no}</td>
          <td>${cctvCode}</td>
          <td>${alertCellHtml}</td>
          <td class="text-center">${boundaryNum}번구역</td>
          <td title="${log}">${log}</td>
          <td>${inpDttm}</td>
        </tr>
      `;
    }).join('');
  }

  function renderCount() {
    const countEl = document.getElementById('situationCount');
    if (!countEl) return;

    const f = getFilters();
    const boundaryLabel = f.boundaryNum ? `${f.boundaryNum}번 구역` : '전체 구역';
    const dateLabel = (f.from || f.to) ? '조건검색' : '전체기간';

    countEl.innerText = `${dateLabel} / ${boundaryLabel} / 총 ${totalCount}건 | 상황 발생 이력을 관리하세요`;
  }

  function renderPagination() {
    window.SituationCommon.safeRenderPagination(
      'situationPagination',
      currentPage,
      totalCount,
      pageSize,
      (newPage) => {
        currentPage = newPage;
        loadPage().catch(console.error);
      }
    );
  }

  async function loadPage() {
    try {
      const data = await fetchEmergencyList(currentPage);
      totalCount = data.totalCount ?? 0;

      renderRows(data.items ?? [], currentPage);
      renderCount();
      renderPagination();
    } catch (e) {
      console.error('[situation_view] loadPage failed:', e);
      totalCount = 0;

      renderRows([], currentPage);
      renderCount();
      renderPagination();
    }
  }

  // ====== 검색 버튼(onclick="situationSearch()") ======
  window.situationSearch = function () {
    currentPage = 1;
    loadPage().catch(console.error);
  };

  // ====== 최초 로딩 ======
  document.addEventListener('DOMContentLoaded', () => {
    if (window.currentView && window.currentView !== 'situation') return;

    // 입력값이 비어있으면 오늘 기본값 세팅(원치 않으면 이 줄을 제거)
    setTodayRangeInputsIfEmpty();

    // ✅ 최초 로딩도 "현재 입력된 값"으로 조회
    loadPage().catch(console.error);
  });

})();
