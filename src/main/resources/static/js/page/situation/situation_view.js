// /js/page/situation/situation_view.js
(function () {
  'use strict';

  const pageSize = 15;
  let currentPage = 1;
  let totalCount = 0;

  /**
   * ✅ 요구사항
   * - 최초 로드: "오늘(년/월/일)" 기준으로 조회되게(서버 기본 로직 사용) => from/to 파라미터 전송 안 함
   * - 검색 클릭: 입력한 시작/끝 "시간까지 포함"해서 조회(from/to 전송)
   */
  let useServerDefaultOnInit = true;

  // ====== datetime-local 입력 기본값(표시용) ======
  function pad2(n) { return String(n).padStart(2, '0'); }

  // 화면에는 "오늘"이 보이도록 넣되, 최초 조회는 서버 기본값을 쓰므로 from/to는 전송하지 않음
  function setTodayRangeInputs() {
    const startEl = document.getElementById('startDateTime');
    const endEl = document.getElementById('endDateTime');
    if (!startEl || !endEl) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = pad2(now.getMonth() + 1);
    const d = pad2(now.getDate());

    // datetime-local 특성상 날짜만 표시 불가 -> 기본 시간으로 세팅
    startEl.value = `${y}-${m}-${d}T00:00`;
    endEl.value = `${y}-${m}-${d}T23:59`;
  }

  // ====== 필터 값 읽기 ======
  function getFilters() {
    const startEl = document.getElementById('startDateTime');
    const endEl = document.getElementById('endDateTime');
    const boundaryEl = document.getElementById('boundaryFilter');

    // ✅ 최초 로딩은 입력값이 있더라도 서버 기본(오늘) 사용 => from/to 미전송
    if (useServerDefaultOnInit) {
      return {
        from: '',
        to: '',
        boundaryNum: boundaryEl?.value ? boundaryEl.value.trim() : ''
      };
    }

    // ===== 검색 시에는 시간 포함 입력값을 그대로 반영 =====
    const startRaw = (startEl?.value || '').trim();
    const endRaw = (endEl?.value || '').trim();

    const startDt = startRaw ? window.SituationCommon.parseInputDateTime(startRaw) : null;
    const endDt = endRaw ? window.SituationCommon.parseInputDateTime(endRaw) : null;

    let fromDt = startDt;
    let toDt = endDt;

    // 둘 다 비어있으면 서버 기본 사용(원하면 여기서 경고 처리 가능)
    if (!fromDt && !toDt) {
      return {
        from: '',
        to: '',
        boundaryNum: boundaryEl?.value ? boundaryEl.value.trim() : ''
      };
    }

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
    const to = toDt ? window.SituationCommon.toLocalDateTimeParam(toDt) : '';
    const boundaryNum = boundaryEl?.value ? boundaryEl.value.trim() : '';

    return { from, to, boundaryNum };
  }

  // ====== API 호출 ======
  async function fetchEmergencyList(page) {
    const f = getFilters();
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
    });

    // 기간/구역은 선택값일 수 있음
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

    const cols = 6; // 번호, CCTV, 알림, 구역, 로그, 발생시각
    const list = Array.isArray(items) ? items : [];

    // 0건: 메시지 행
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

    const rowsHTML = list.map((it, idx) => {
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

    tbody.innerHTML = rowsHTML;
  }

  function renderCount() {
    const countEl = document.getElementById('situationCount');
    if (!countEl) return;

    const f = getFilters();
    const boundaryLabel = f.boundaryNum ? `${f.boundaryNum}번 구역` : '전체 구역';

    // ✅ 최초 로딩은 "오늘", 검색 모드에서는 "조건검색"
    const dateLabel = (useServerDefaultOnInit || (!f.from && !f.to)) ? '오늘' : '조건검색';

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

  // ====== HTML 버튼 onclick="situationSearch()" 연결 ======
  window.situationSearch = function () {
    // ✅ 검색 클릭 순간부터는 입력값(시간 포함) 기반으로 조회
    useServerDefaultOnInit = false;

    currentPage = 1;
    loadPage().catch(console.error);
  };

  // ====== 최초 로딩 ======
  document.addEventListener('DOMContentLoaded', () => {
    if (window.currentView && window.currentView !== 'situation') return;

    // ✅ 화면 표시용: 오늘 날짜로 세팅(시간은 기본값)
    setTodayRangeInputs();

    // ❌ 기존 유틸이 현재시각을 넣어서 from==to가 될 수 있음 -> 사용 금지 권장
    // if (window.App?.utils?.fillDateTimeInputs) window.App.utils.fillDateTimeInputs();

    // ✅ 최초 조회: 서버 기본(오늘) 사용 => from/to 미전송
    useServerDefaultOnInit = true;
    loadPage().catch(console.error);
  });

})();
