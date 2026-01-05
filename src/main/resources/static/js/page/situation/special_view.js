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
    V: '풍랑',
    O: '해일',
    N: '대설',
    Y: '황사',
    H: '폭염',
    A: '태풍',
    S: '지진해일',
    F: '안개',
    P: '지진',
    G: '가뭄',
    I: '풍수해',
    T: '폭풍해일'
  };

  const LVL_LABEL = {
    2: '예비',
    3: '주의보',
    4: '경보'
  };

  const CMD_LABEL = {
    1: '발표',
    2: '대치',
    3: '해제',
    4: '연장',
    5: '변경'
  };

  const REG_ID_TO_KO = {
    /* =======================
        해상(Sea)
        ======================= */
    "S1132210": "동해남부북쪽안쪽먼바다",
    "S1132220": "동해남부북쪽바깥먼바다",
    "S1252010": "서해중부안쪽먼바다",
    "S1252020": "서해중부바깥먼바다",
    "S1152010": "동해중부안쪽먼바다",
    "S1152020": "동해중부바깥먼바다",
    "S1232110": "서해남부북쪽안쪽먼바다",
    "S1232120": "서해남부북쪽바깥먼바다",
    "S1232210": "서해남부남쪽안쪽먼바다",
    "S1232220": "서해남부남쪽바깥먼바다",
    "S1324020": "제주도남쪽바깥먼바다",
    "S1324210": "제주도남서쪽안쪽먼바다",

    /* =======================
        육상(Land)
        ======================= */
    "L1082900": "울산서부",
    "L1082800": "울산동부",
    "L1082600": "부산중부",
    "L1082500": "부산동부",
    "L1082700": "부산서부",

    "L1072310": "울진군평지",
    "L1072400": "포항시",
    "L1071200": "상주시",
    "L1071500": "안동시",
    "L1071600": "영주시",
    "L1070300": "구미시",
    "L1070400": "영천시",
    "L1070500": "경산시",
    "L1071000": "칠곡군",
    "L1071100": "김천시",
    "L1072200": "영덕군",
    "L1072500": "경주시",
    "L1075020": "경북북동산지",

    "L1020110": "강릉시평지",
    "L1020210": "동해시평지",
    "L1020410": "삼척시평지",
    "L1020510": "속초시평지",
    "L1020610": "고성군평지",
    "L1020710": "양양군평지",
    "L1020300": "태백시",
    "L1025020": "강원북부산지",
    "L1026020": "강원중부산지",
    "L1027020": "강원남부산지",

    "L1081200": "함안군",
    "L1081400": "진주시",
    "L1081500": "하동군",
    "L1081700": "함양군",
    "L1080500": "양산시",
    "L1081000": "밀양시",
    "L1081100": "의령군",
    "L1081300": "창녕군",
    "L1081600": "산청군",
    "L1081900": "합천군",
    "L1082300": "고성군",
    "L1082000": "통영시",
    "L1082100": "사천시",
    "L1082200": "거제시",
    "L1082400": "남해군",
    "L1080600": "창원시",
    "L1080900": "김해시",

    "L1010200": "광명시",
    "L1010600": "부천시",
    "L1011900": "수원시",
    "L1012600": "군포시",

    "L1051200": "순천시",
    "L1051000": "여수시",
    "L1051100": "광양시",

    "L1100100": "서울동남권",
    "L1100200": "서울동북권",
    "L1100300": "서울서남권",

    "L1070100": "대구광역시",
    "L1052500": "흑산도·홍도",
    "L1072100": "울릉도·독도",
    "L1014100": "서해5도"
  };

  // =========================
  // util
  // =========================
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

  // -------------------------
  // Badge helpers (Bootstrap 5)
  // -------------------------
  function getLvlBadgeClass(lvlTxt) {
    if (!lvlTxt || lvlTxt === '-') return '';
    if (String(lvlTxt).includes('경보')) return 'status-error';
    if (String(lvlTxt).includes('주의보')) return 'status-warning';
    if (String(lvlTxt).includes('예비')) return 'status-info';
    return 'bg-secondary';
  }

  function getCmdBadgeClass(cmdTxt) {
    if (!cmdTxt || cmdTxt === '-') return 'bg-secondary';

    // CMD_LABEL 기준 (발표/대치/해제/연장/변경)
    const t = String(cmdTxt);
    if (t.includes('해제')) return 'bg-dark';
    if (t.includes('발표')) return 'bg-primary';
    if (t.includes('대치')) return 'bg-warning text-dark';
    if (t.includes('연장')) return 'bg-success';
    if (t.includes('변경')) return 'bg-info text-dark';

    return 'bg-secondary';
  }

  // "특보 발령 승인 상태" 칸: LVL / CMD 조합 (텍스트 버전)
  function formatApproveStatus(lvl, cmd) {
    const lvlTxt = formatLvl(lvl);
    const cmdTxt = formatCmd(cmd);
    if (lvlTxt === '-' && cmdTxt === '-') return '-';
    if (lvlTxt === '-') return cmdTxt;
    if (cmdTxt === '-') return lvlTxt;
    return `${lvlTxt} / ${cmdTxt}`;
  }

  // "승인상태" 배지 버전: LVL 배지 + CMD 배지
  function formatApproveStatusBadge(lvl, cmd) {
    const lvlTxt = formatLvl(lvl);
    const cmdTxt = formatCmd(cmd);

    if (lvlTxt === '-' && cmdTxt === '-') {
      return `<span class="badge bg-secondary">-</span>`;
    }

    const lvlHtml = (lvlTxt && lvlTxt !== '-')
      ? `<span class="status-badge ${getLvlBadgeClass(lvlTxt)}">${lvlTxt}</span>`
      : `<span>-</span>`;

    const cmdHtml = (cmdTxt && cmdTxt !== '-')
      ? `<span class="status-badge ${getCmdBadgeClass(cmdTxt)}">${cmdTxt}</span>`
      : `<span>-</span>`;

    return `<span class="d-inline-flex gap-1 align-items-center">${lvlHtml}${cmdHtml}</span>`;
  }

  // LVL 배지(예비/주의보/경보)
  function formatLvlText(lvl) {
    const lvlTxt = formatLvl(lvl);
    if (!lvlTxt || lvlTxt === '-') return `<span>-</span>`;
    return `<span class="badge ${getLvlBadgeClass(lvlTxt)}">${lvlTxt}</span>`;
  }

  // CMD 배지(발표/대치/해제/연장/변경)
  function formatCmdText(cmd) {
    const cmdTxt = formatCmd(cmd);
    if (!cmdTxt || cmdTxt === '-') return `<span>-</span>`;
    return `<span>${cmdTxt}</span>`;
  }

  function getRegKoById(regId) {
    if (!regId) return "-";
    return REG_ID_TO_KO[regId] ?? regId;
  }

  // SEND: 0/미통보, 1/통보
  function formatSend(send) {
    const s = String(send ?? '').trim();
    if (s === '1') return '통보';
    if (s === '0') return '미통보';
    return s || '-';
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
    // 특보 view HTML의 날짜 input id: startDateTime/endDateTime
    const startEl = document.getElementById('startDateTime');
    const endEl = document.getElementById('endDateTime');

    const params = new URLSearchParams();
    const start = dtLocalToIsoLdt(startEl?.value);
    const end = dtLocalToIsoLdt(endEl?.value);

    if (start) params.set('startDateTime', start);
    if (end) params.set('endDateTime', end);

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
  // 렌더링
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
          <td colspan="7" class="text-center text-secondary py-5">
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
      // const regionText = id.regId || '-';                // 4열 (REG_ID)
      // const approveText = formatApproveStatusBadge(row.lvl, row.cmd); // (대안) 승인상태 배지 1칸에 LVL+CMD 표시
      const regionText = getRegKoById(id.regId);         // 4열
      const lvlText = formatLvlText(row.lvl);            // 5열 (배지)
      const cmdText = formatCmdText(row.cmd);            // 6열 (배지)
      const sendText = formatSend(row.send);             // 7열

      return `
        <tr>
          <td>${no}</td>
          <td>${wrnText}</td>
          <td>${tmInText}</td>
          <td>${regionText}</td>
          <td>${lvlText}</td>
          <td>${cmdText}</td>
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
    // 특보 화면 검색 버튼이 onclick="situationSearch()"
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
