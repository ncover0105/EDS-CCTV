// /js/page/situation/situation_view.js
(function () {
    'use strict';
  
    const pageSize = 15;
    let currentPage = 1;
    let totalCount = 0;
  
    // ====== 필터 값 읽기 ======
    function getFilters() {
      const startEl = document.getElementById('startDateTime');
      const endEl = document.getElementById('endDateTime');
      const boundaryEl = document.getElementById('boundaryFilter');
  
      const startDt = window.SituationCommon.parseInputDateTime(startEl?.value);
      const endDt = window.SituationCommon.parseInputDateTime(endEl?.value);
  
      const from = window.SituationCommon.toLocalDateTimeParam(startDt);
      const to = window.SituationCommon.toLocalDateTimeParam(endDt);
  
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
  
      // SituationApiController를 만들지 않는다고 하셨으니 MenuController 아래로
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
  
      const startNo = (page - 1) * pageSize;
  
      const rowsHTML = (items || []).map((it, idx) => {
        const no = startNo + idx + 1;
  
        // DTO 필드 기준: id, cctvCode, alertCode, boundaryNum, log, inpDttm
        const cctvCode = window.SituationCommon.escapeHtml(it.cctvCode ?? '-');
        const alertCode = window.SituationCommon.escapeHtml(it.alertCode ?? '-');
        const boundaryNum = window.SituationCommon.escapeHtml(it.boundaryNum ?? '-');
        const log = window.SituationCommon.escapeHtml(it.log ?? '-');
        const inpDttm = window.SituationCommon.escapeHtml(it.inpDttm ?? '-');
  
        return `
          <tr>
            <td>${no}</td>
            <td>${cctvCode}</td>
            <td>${alertCode}</td>
            <td>${boundaryNum}</td>
            <td title="${log}">${log}</td>
            <td>${inpDttm}</td>
          </tr>
        `;
      }).join('');
  
      // 컬럼 수 6개 기준
      const emptyRowsHTML = window.SituationCommon.safeGetEmptyRowsHTML(
        pageSize,
        (items || []).length,
        6
      );
  
      tbody.innerHTML = rowsHTML + emptyRowsHTML;
    }
  
    function renderCount() {
      const countEl = document.getElementById('situationCount');
      if (!countEl) return;
  
      const f = getFilters();
      const boundaryLabel = f.boundaryNum ? `${f.boundaryNum}번 구역` : '전체 구역';
      const dateLabel = (f.from || f.to) ? '조건검색' : '오늘';
  
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
      const data = await fetchEmergencyList(currentPage);
  
      totalCount = data.totalCount ?? 0;
      renderRows(data.items ?? [], currentPage);
      renderCount();
      renderPagination();
    }
  
    // ====== HTML 버튼 onclick="situationSearch()" 연결 ======
    window.situationSearch = function () {
      currentPage = 1;
      loadPage().catch(console.error);
    };
  
    // ====== 최초 로딩 ======
    document.addEventListener('DOMContentLoaded', () => {
      if (window.currentView && window.currentView !== 'situation') return;
  
      // 기존 유틸이 있으면 기본 일시 채우기(있다면)
      if (window.App?.utils?.fillDateTimeInputs) {
        window.App.utils.fillDateTimeInputs();
      }
  
      // 최초 조회
      loadPage().catch(console.error);
    });
  
  })();
  