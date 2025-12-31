// /js/page/situation/special.view.js
// - API: /api/weather/warning/history
// - 호출 방식: fetchJson() (기존 AWS 패턴과 동일)
// - UI: 스크롤 전용(페이지네이션 없음), #specialList만 렌더
(function () {
    'use strict';
  
    const maxLimit = 1000;
    let specialData = [];
  
    // =========================
    // DDL 기반 코드 매핑
    // =========================
    const WRN_LABEL = {
      W: '강풍',
      R: '호우',
      C: '한파',
      D: '건조',
      O: '해일',
      N: '지진해일',
      V: '풍랑',
      T: '태풍',
      S: '대설',
      Y: '황사',
      H: '폭염',
      F: '안개'
    };
  
    const LVL_LABEL = { '1': '예비', '2': '주의보', '3': '경보' };
  
    const CMD_LABEL = {
      '1': '발표',
      '2': '대치',
      '3': '해제',
      '4': '대치해제(자동)',
      '5': '연장',
      '6': '변경',
      '7': '변경해제'
    };
  
    function formatWrn(wrn) {
      const w = String(wrn ?? '').trim().toUpperCase();
      if (!w) return '전체';
      return WRN_LABEL[w] ? WRN_LABEL[w] : w;
    }
  
    function formatLvl(lvl) {
      const v = String(lvl ?? '').trim();
      if (!v) return '-';
      return LVL_LABEL[v] ? LVL_LABEL[v] : v;
    }
  
    function formatCmd(cmd) {
      const v = String(cmd ?? '').trim();
      if (!v) return '-';
      return CMD_LABEL[v] ? CMD_LABEL[v] : v;
    }
  
    // "특보 발령 승인 상태" 칸: LVL / CMD 조합
    function formatApproveStatus(lvl, cmd) {
      const lvlTxt = formatLvl(lvl);
      const cmdTxt = formatCmd(cmd);
      if (lvlTxt === '-' && cmdTxt === '-') return '-';
      if (lvlTxt === '-') return cmdTxt;
      if (cmdTxt === '-') return lvlTxt;
      return `${lvlTxt} / ${cmdTxt}`;
    }
  
    // SEND: 0/미통보, 1/통보
    function formatSend(send) {
      const s = String(send ?? '').trim();
      if (s === '1') return '통보';
      if (s === '0') return '미통보';
      if (!s) return '-';
      return s;
    }
  
    // yyyyMMddHHmm -> "yyyy-MM-dd HH:mm"
    function fmt12ToText(v12) {
      if (!v12 || typeof v12 !== 'string' || v12.length < 12) return v12 || '-';
      const y = v12.substring(0, 4);
      const m = v12.substring(4, 6);
      const d = v12.substring(6, 8);
      const hh = v12.substring(8, 10);
      const mm = v12.substring(10, 12);
      return `${y}-${m}-${d} ${hh}:${mm}`;
    }
  
    // datetime-local ("YYYY-MM-DDTHH:mm") -> ISO LocalDateTime ("YYYY-MM-DDTHH:mm:ss")
    function dtLocalToIsoLdt(v) {
      if (!v) return null;
      return v.length === 16 ? `${v}:00` : v;
    }
  
    // =========================
    // 서버 호출(fetchJson 사용)
    // =========================
    async function loadSpecialFromServer() {
      // 특보 view HTML의 날짜 input id: startDateTime/endDateTime :contentReference[oaicite:1]{index=1}
      const startEl = document.getElementById('startDateTime');
      const endEl = document.getElementById('endDateTime');
  
      const params = new URLSearchParams();
      const start = dtLocalToIsoLdt(startEl?.value);
      const end = dtLocalToIsoLdt(endEl?.value);
  
      if (start) params.set('start', start);
      if (end) params.set('end', end);
  
      // 필요 시 HTML에 input 추가하면 자동으로 붙일 수 있게 구조만 남김
      // const stn = document.getElementById('specialStn')?.value?.trim();
      // if (stn) params.set('stn', stn);
  
      params.set('limit', String(maxLimit));
  
      const url = `/api/weather/warning/history?${params.toString()}`;
  
      try {
        // 기존 패턴: const data = await fetchJson(...)
        const data = await App.utils.fetchJson(url);
        specialData = Array.isArray(data) ? data : [];
        renderSpecialTable();
      } catch (e) {
        console.error('특보 이력 데이터 오류:', e);
        specialData = [];
        renderSpecialTable();
      }
    }
  
    // =========================
    // 렌더 (6 컬럼 고정)
    // =========================
    function renderSpecialTable() {
      const tbody = document.getElementById('specialList');
      if (!tbody) {
        console.error('specialList tbody not found');
        return;
      }
  
      if (!specialData || specialData.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-secondary py-5">
              조회된 특보 이력이 없습니다.
            </td>
          </tr>
        `;
        const countEl = document.getElementById('specialCount');
        if (countEl) countEl.innerText = `총 0건 | 특보 이력을 조회하세요`;
        return;
      }
  
      tbody.innerHTML = specialData.map((row, idx) => {
        const no = idx + 1;
  
        const id = row.id || {};
        const wrnText = formatWrn(id.wrn);                 // 2열
        const tmInText = fmt12ToText(id.tmIn);             // 3열
        const regionText = id.regId || '-';                // 4열 (REG_ID)
        const approveText = formatApproveStatus(row.lvl, row.cmd); // 5열
        const sendText = formatSend(row.send);             // 6열
  
        return `
          <tr>
            <td>${no}</td>
            <td>${wrnText}</td>
            <td>${tmInText}</td>
            <td>${regionText}</td>
            <td>${approveText}</td>
            <td>${sendText}</td>
          </tr>
        `;
      }).join('');
  
      const countEl = document.getElementById('specialCount');
      if (countEl) countEl.innerText = `총 ${specialData.length}건 | 특보 이력을 조회하세요`;
    }
  
    // =========================
    // 이벤트 연결
    // =========================
    function bindOnce() {
      // 특보 화면 검색 버튼이 onclick="situationSearch()" :contentReference[oaicite:2]{index=2}
      window.situationSearch = function () {
        if (window.currentView && window.currentView !== 'special') return;
        loadSpecialFromServer();
      };
  
      // 날짜 변경 시 자동 조회(원치 않으면 제거)
      const startEl = document.getElementById('startDateTime');
      const endEl = document.getElementById('endDateTime');
      [startEl, endEl].forEach(el => {
        if (el) el.addEventListener('change', () => loadSpecialFromServer());
      });
    }
  
    // =========================
    // init
    // =========================
    document.addEventListener('DOMContentLoaded', () => {
      if (window.currentView && window.currentView !== 'special') return;
  
      bindOnce();
      loadSpecialFromServer(); // 최초 로딩
  
      if (window.App?.utils?.fillDateTimeInputs) {
        window.App.utils.fillDateTimeInputs();
      }
    });
  })();
  