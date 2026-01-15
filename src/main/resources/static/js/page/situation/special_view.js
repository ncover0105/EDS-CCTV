// /js/page/situation/special_view.js
// - API: /api/weather/warning/history
// - 검색 조건: 날짜는 "사용자 직접 변경했을 때만" 포함, 특보종류/단계는 값 있을 때만 포함
(function () {
  'use strict';

  const maxLimit = 1000;
  let specialData = [];

  // -------------------------
  // 사용자 입력 여부 플래그(날짜만)
  // -------------------------
  const userTouched = {
    startDateTime: false,
    endDateTime: false
  };

  // =========================
  // 코드 매핑
  // =========================
  const WRN_LABEL = {
    W: '강풍',
    R: '호우',
    C: '한파',
    D: '건조',
    V: '풍랑',
    O: '해일',
    N: '지진해일',
    Y: '황사',
    H: '폭염',
    T: '태풍',
    S: '대설',
    F: '안개',
  };

  const LVL_LABEL = {
    1: '예비특보',
    2: '주의보',
    3: '경보'
  };

  // ✅ 사용자가 말씀하신 CMD_LABEL 포함 + 실제 표시에도 사용
  const CMD_LABEL = {
    1: '발표',
    2: '대치',
    3: '해제',
    4: '대치해제',
    5: '연장',
    6: '변경',
    7: '변경해제'
  };

  const REG_ID_TO_KO = {
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
    return WRN_LABEL[w] ?? (w || '전체');
  }

  function formatLvl(lvl) {
    const v = String(lvl ?? '').trim();
    return LVL_LABEL[v] ?? (v || '-');
  }

  // ✅ CMD 라벨 변환
  function formatCmd(cmd) {
    const v = String(cmd ?? '').trim();
    if (!v) return '-';
    return CMD_LABEL[v] ?? v;
  }

  function getLvlBadgeClass(lvlTxt) {
    if (!lvlTxt || lvlTxt === '-') return '';
    if (String(lvlTxt).includes('경보')) return 'status-error';
    if (String(lvlTxt).includes('주의보')) return 'status-warning';
    if (String(lvlTxt).includes('예비')) return 'status-info';
    return 'bg-secondary';
  }

  function formatLvlText(lvl) {
    const lvlTxt = formatLvl(lvl);
    if (!lvlTxt || lvlTxt === '-') return `<span>-</span>`;
    return `<span class="status-badge ${getLvlBadgeClass(lvlTxt)} fw-bold">${lvlTxt}</span>`;
  }

  function getRegKoById(regId) {
    if (!regId) return "-";
    return REG_ID_TO_KO[regId] ?? regId;
  }

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

  // datetime-local ("YYYY-MM-DDTHH:mm") -> "YYYY-MM-DDTHH:mm:ss"
  function dtLocalToIsoLdt(v) {
    if (!v) return null;
    return v.length === 16 ? `${v}:00` : v;
  }

  // 공백/미선택이면 null
  function getTrimValue(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const raw = el.value;
    if (raw == null) return null;
    const t = String(raw).trim();
    return t.length ? t : null;
  }

  // =========================
  // 서버 호출
  // =========================
  async function loadSpecialFromServer() {
    const params = new URLSearchParams();

    // ✅ 날짜: "사용자 직접 변경"한 경우에만 파라미터 포함
    if (userTouched.startDateTime) {
      const startRaw = getTrimValue('startDateTime');
      const start = dtLocalToIsoLdt(startRaw);
      if (start) params.set('startDateTime', start);
    }

    if (userTouched.endDateTime) {
      const endRaw = getTrimValue('endDateTime');
      const end = dtLocalToIsoLdt(endRaw);
      if (end) params.set('endDateTime', end);
    }

    // ✅ 특보 종류/단계: 선택된 경우만 포함 (value=""이면 제외)
    const wrn = getTrimValue('specialWrn');
    const lvl = getTrimValue('specialLvl');
    if (wrn) params.set('wrn', wrn);
    if (lvl) params.set('lvl', lvl);

    params.set('limit', String(maxLimit));

    const url = `/api/weather/warning/history?${params.toString()}`;

    try {
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
    if (!tbody) return;

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
      const id = row.id || {};

      const wrnText = formatWrn(id.wrn);
      const tmInText = fmt12ToText(id.tmIn);
      const regionText = getRegKoById(id.regId);
      const lvlHtml = formatLvlText(row.lvl);
      const cmdText = formatCmd(row.cmd);     // ✅ CMD_LABEL 적용
      const sendText = formatSend(row.send);

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${wrnText}</td>
          <td>${tmInText}</td>
          <td>${regionText}</td>
          <td>${lvlHtml}</td>
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
    window.situationSearch = function () {
      if (window.currentView && window.currentView !== 'special') return;
      loadSpecialFromServer();
    };

    const startEl = document.getElementById('startDateTime');
    const endEl = document.getElementById('endDateTime');

    // ✅ 사용자가 직접 변경했을 때만 true
    if (startEl) {
      startEl.addEventListener('change', () => { userTouched.startDateTime = true; });
      startEl.addEventListener('input', () => { userTouched.startDateTime = true; });
    }
    if (endEl) {
      endEl.addEventListener('change', () => { userTouched.endDateTime = true; });
      endEl.addEventListener('input', () => { userTouched.endDateTime = true; });
    }

    // 변경 시 자동조회가 필요하면 아래를 주석 해제
    // const wrnEl = document.getElementById('specialWrn');
    // const lvlEl = document.getElementById('specialLvl');
    // [wrnEl, lvlEl].forEach(el => {
    //   if (el) el.addEventListener('change', () => loadSpecialFromServer());
    // });
  }

  // =========================
  // init
  // =========================
  document.addEventListener('DOMContentLoaded', () => {
    if (window.currentView && window.currentView !== 'special') return;

    bindOnce();

    // ✅ fillDateTimeInputs()가 값을 넣더라도 userTouched가 false면 날짜 조건은 전송되지 않음
    if (window.App?.utils?.fillDateTimeInputs) {
      window.App.utils.fillDateTimeInputs();
    }

    // 최초 로딩: 날짜 조건 제외 상태로 조회
    loadSpecialFromServer();
  });
})();
