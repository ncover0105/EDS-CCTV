document.addEventListener("DOMContentLoaded", function () {
    Weather.init();           // AWS + 예보 + 위성 + 레이더 자동 로드
    // Weather.loadAirQuality(); // 대기질 1회 호출
    SpecialReport.init();
});

window.Weather = (function () {

    /* ============================================================================
        1) 맵핑 정보
    =========================================================================== */
    const windDirectionMap = {
        '북풍': 135, '북동풍': 170, '동풍': 225, '남동풍': 270,
        '남풍': -45, '남서풍': 0, '서풍': 45, '북서풍': 90
    };

    const airClassMap = {
        "좋음": "good",
        "보통": "normal",
        "나쁨": "bad",
        "매우 나쁨": "very-bad"
    };

    let currentMapType = "radar";

    /* ============================================================================
        2) 초기화
    =========================================================================== */
    function init() {
        loadAllWeather();
        loadAirQuality(); 
        
        setInterval(loadAllWeather, 300000);
        setInterval(loadAirQuality, 900000);
        toggleMapImage();
    }

    async function loadAllWeather() {
        await Promise.all([
            loadAWS(),
            loadForecast(),
            loadSatellite(),
            loadRadar()
        ]);
    }

    /* ============================================================================
        3) AWS
    =========================================================================== */
    async function loadAWS() {
        try {
            const data = await fetchJson('/api/weather/aws');
            updateAWS(data);
        } catch (e) {
            console.error("AWS 데이터 오류:", e);
            updateAWS(null); // ⬅️ 실패 시에도 화면 안정 유지
        }
    }
    
    function updateAWS(data) {
        safeText("#temperature", data?.temperature, "°");
        safeText("#windSpeed", data?.windspeed, "m/s");
        safeText("#humidity", data?.humidity, "%");
    
        if (data?.winddirection && windDirectionMap[data.winddirection] !== undefined) {
            $("#windText").text(data.winddirection);
            $("#windIcon").css(
                "transform",
                `rotate(${windDirectionMap[data.winddirection]}deg)`
            );
        } else {
            $("#windText").text("-");
            $("#windIcon").css("transform", "rotate(0deg)");
        }
    }

    /* ============================================================================
        4) 예보
    =========================================================================== */
    async function loadForecast() {
        try {
            const data = await fetchJson('/api/weather/forecast');
            updateForecast(data);
        } catch (e) {
            console.error("예보 데이터 오류:", e);
            updateForecast(null);
        }
    }
    
    function updateForecast(data) {
        safeText("#rainfall", data?.rainfall, "%");
        safeText("#weather", data?.weather);
    
        safeIcon(
            "#weather_icon",
            data?.icon ? `/production/fill/all/${data.icon}` : null
        );
    }

    /* ============================================================================
        5) 위성 이미지
    =========================================================================== */
    async function loadSatellite() {
        try {
            const r = await fetchJson('/api/weather/getSatelliteImg');
            if (r?.data?.sateName) {
                updateImage("satelliteImg", `/imgFiles/sailimg/${r.data.sateName}`);
            }
        } catch (e) {
            console.error("위성 이미지 오류:", e);
        }
    }

    /* ============================================================================
        6) 레이더 이미지
    =========================================================================== */
    async function loadRadar() {
        try {
            const r = await fetchJson('/api/weather/getRadarImg');
            if (r?.data?.radarName) {
                updateImage("radarImg", `/imgFiles/radar/${r.data.radarName}`);
            }
        } catch (e) {
            console.error("레이더 이미지 오류:", e);
        }
    }

    /* ============================================================================
        7) 공통 이미지 로드
    =========================================================================== */
    async function updateImage(elementId, url) {
        const img = document.getElementById(elementId);
        const spinner = document.getElementById(
            elementId === "radarImg" ? "loadingSpinnerRadar" : "loadingSpinnerSatellite"
        );
    
        const newUrl = url + "?ts=" + Date.now();
        const currentUrl = img.getAttribute("src");
    
        // 1) 파일 이름이 같은 경우 → 변경할 필요 없음
        //    (query string 제외하고 비교)
        if (currentUrl && currentUrl.split("?")[0] === url) {
            // console.log(`[${elementId}] 동일 이미지 → 갱신하지 않음`);
            return;
        }
    
        // img.classList.add("d-none");
        spinner.classList.remove("d-none");
    
        const currentImg = new Image();
    
        currentImg.onload = () => {
            // 2) 로드 성공한 경우에만 교체
            img.src = newUrl;
            img.classList.remove("d-none");
            spinner.classList.add("d-none");
    
            // 토글 모드 유지
            // toggleMapImage();
        };
    
        currentImg.onerror = () => {
            console.warn(`이미지 로드 실패: ${newUrl}`);
    
            // 3) 실패하면 기존 이미지 유지
            // img.src = currentUrl;
            // img.classList.remove("d-none");
            img.classList.add("d-none");
            spinner.classList.remove("d-none"); // ✅ 실패 시에도 계속 표시    
            // toggle 유지
            // toggleMapImage();
        };
    
        // 실제 이미지 로드 시도
        currentImg.src = newUrl;
    }
    
    /* ============================================================================
        8) 레이더/위성 토글 UI
    =========================================================================== */
    function switchRadarType(type, btn) {
        // 버튼 active 토글
        document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
        if (btn) btn.classList.add("active");
    
        // 현재 타입 상태 저장
        currentMapType = type;
    
        // 화면 전환
        toggleMapImage();
    }
    
    // 탭 이벤트만 처리 수정
    function toggleMapImage() {
        const isRadar = currentMapType === "radar";
    
        const radarContent = document.getElementById("radar-map");
        const satelliteContent = document.getElementById("satellite-map");
    
        if (isRadar) {
            radarContent.classList.remove("d-none");
            satelliteContent.classList.add("d-none");
        } else {
            satelliteContent.classList.remove("d-none");
            radarContent.classList.add("d-none");
        }
    }
    
    // function toggleMapImage() {
    //     const isRadar = currentMapType === "radar";
    
    //     const radarImg = document.getElementById("radarImg");
    //     const satelliteImg = document.getElementById("satelliteImg");
    
    //     const loadingRadar = document.getElementById("loadingSpinnerRadar");
    //     const loadingSatellite = document.getElementById("loadingSpinnerSatellite");
    
    //     const radarContent = document.getElementById("radar-map");
    //     const satelliteContent = document.getElementById("satellite-map");
    
    //     if (isRadar) {
    //         radarContent.classList.remove("d-none");
    //         satelliteContent.classList.add("d-none");
    
    //         if (radarImg.naturalWidth > 0) {
    //             radarImg.classList.remove("d-none");
    //             loadingRadar.classList.add("d-none");
    //         } else {
    //             radarImg.classList.add("d-none");
    //             loadingRadar.classList.remove("d-none");
    //         }
    
    //     } else {
    //         satelliteContent.classList.remove("d-none");
    //         radarContent.classList.add("d-none");
    
    //         if (satelliteImg.naturalWidth > 0) {
    //             satelliteImg.classList.remove("d-none");
    //             loadingSatellite.classList.add("d-none");
    //         } else {
    //             satelliteImg.classList.add("d-none");
    //             loadingSatellite.classList.remove("d-none");
    //         }
    //     }
    // }
    

    /* ============================================================================
        9) 대기질 안전 처리
    =========================================================================== */

    // 값이 null/빈값/NaN이면 "--"
    function safeValue(value) {
        if (value === null || value === undefined || value === "" || isNaN(value)) {
            return "--";
        }
        return value;
    }

    function safeGrade(value) {
        if (!value || value.trim() === "") return "--";
        return value;
    }

    function resetAirClass(element, baseClass) {
        element.className = baseClass;
    }

    async function loadAirQuality() {
        try {
            const res = await fetch('/api/weather/air');
            const air = await res.json();

            if (!air) {
                updateAirQualityError();
                return;
            }

            updateAirQuality(air);

        } catch (e) {
            console.error("대기질 가져오기 실패:", e);
            updateAirQualityError();
        }
    }

    function updateAirQuality(air) {
        const pm10Val = safeValue(air.pm10);
        const pm25Val = safeValue(air.pm25);

        const pm10GradeVal = safeGrade(air.pm10Grade);
        const pm25GradeVal = safeGrade(air.pm25Grade);

        const pm10Value = document.getElementById("pm10Value");
        const pm25Value = document.getElementById("pm25Value");
        const pm10Grade = document.getElementById("pm10Grade");
        const pm25Grade = document.getElementById("pm25Grade");

        pm10Value.textContent = pm10Val === "--" ? "--" : `${pm10Val} μg/m³`;
        pm25Value.textContent = pm25Val === "--" ? "--" : `${pm25Val} μg/m³`;

        pm10Grade.textContent = pm10GradeVal;
        pm25Grade.textContent = pm25GradeVal;

        if (pm10Val === "--") resetAirClass(pm10Value, "air-quality-value");
        else applyAirClass(pm10Value, "air-quality-value", pm10GradeVal);

        if (pm25Val === "--") resetAirClass(pm25Value, "air-quality-value");
        else applyAirClass(pm25Value, "air-quality-value", pm25GradeVal);

        if (pm10GradeVal === "--") resetAirClass(pm10Grade, "air-quality-grade");
        else applyAirClass(pm10Grade, "air-quality-grade", pm10GradeVal);

        if (pm25GradeVal === "--") resetAirClass(pm25Grade, "air-quality-grade");
        else applyAirClass(pm25Grade, "air-quality-grade", pm25GradeVal);
    }

    function updateAirQualityError() {
        updateAirQuality({
            pm10: "--",
            pm25: "--",
            pm10Grade: "--",
            pm25Grade: "--"
        });
    }

    function applyAirClass(element, baseClass, gradeText) {
        const gradeClass = airClassMap[gradeText] ?? "";
        element.className = baseClass;
        if (gradeClass) element.classList.add(gradeClass);
    }

    /* ============================================================================
        10) 공통
    =========================================================================== */
    async function fetchJson(path) {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Fetch 실패: ${path}`);
        return res.json();
    }

    function safeText(selector, value, unit = '', emptyText = '-') {
        if (
            value === null ||
            value === undefined ||
            value === '' ||
            (typeof value === 'number' && isNaN(value))
        ) {
            $(selector).text(emptyText);
        } else {
            $(selector).text(`${value}${unit}`);
        }
    }

    function safeIcon(selector, src) {
        if (!src) {
            $(selector).addClass('invisible');
        } else {
            $(selector)
                .attr('src', src)
                .removeClass('invisible');
        }
    }

    /* ============================================================================
        EXPORT
    =========================================================================== */
    return {
        init,
        switchRadarType
    };

})();

window.SpecialReport = (function () {

    // ====== 매핑 (사용자 제공 그대로 사용) ======
    const WRN_LABEL = {
    W: '강풍', R: '호우', C: '한파', D: '건조', V: '풍랑', O: '해일', N: '지진해일',
    Y: '황사', H: '폭염', T: '태풍', S: '대설', F: '안개',
    };

    const LVL_LABEL = { 1: '예비특보', 2: '주의보', 3: '경보' };

    const CMD_LABEL = {
    1: '발표', 2: '대치', 3: '해제', 4: '대치해제', 5: '연장', 6: '변경', 7: '변경해제'
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

    // ====== 설정 ======
    const API_URL = "/api/weather/special/latest";
    const REFRESH_MS = 5 * 60 * 1000; // 서비스 refresh(5분)와 맞춤

    function init() {
        load();
        setInterval(load, REFRESH_MS);
    }

    async function load() {
        const lineEl = document.getElementById("specialReportLine");
        const emptyEl = document.getElementById("specialReportEmpty");

        if (!lineEl || !emptyEl) return;

        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            if (!json || json.exists !== true || !json.data) {
            showEmpty(lineEl, emptyEl);
            return;
            }

            renderOneLine(json.data, lineEl, emptyEl);

        } catch (e) {
            // 통신 실패 시: UI는 "없음"으로 떨어뜨리되 로그만 남김
            console.error("특보 로드 실패:", e);
            showEmpty(lineEl, emptyEl);
        }
    }

    function showEmpty(lineEl, emptyEl) {
        lineEl.classList.add("d-none");
        emptyEl.classList.remove("d-none");
    }

    function showLine(lineEl, emptyEl) {
        emptyEl.classList.add("d-none");
        lineEl.classList.remove("d-none");
    }

    function renderOneLine(d, lineEl, emptyEl) {
        const regId = safe(d.regId);
        const wrn = safe(d.wrn);
        const lvlRaw = safe(d.lvl);
        const cmd = safe(d.cmd);
    
        const regionName = REG_ID_TO_KO[regId] || regId || "지역";
        const wrnName = WRN_LABEL[wrn] || wrn || "특보";
        const lvlNum = parseInt(lvlRaw, 10);
        const cmdName = CMD_LABEL[parseInt(cmd, 10)] || "";
        const timeText = format12(safe(d.tmFc)) || formatIso(safe(d.createdAt));
    
        // ---- lvl 클래스: 라인 전체에 반영 ----
        lineEl.classList.remove("lvl-0", "lvl-1", "lvl-2", "lvl-3");
        const lvlClass = [1,2,3].includes(lvlNum) ? `lvl-${lvlNum}` : "lvl-0";
        lineEl.classList.add(lvlClass);
    
        // ---- 마크업: 배지는 제거하고 텍스트 중심으로 ----
        lineEl.innerHTML = `
        <span class="sr-time">${timeText || "-"}</span>
        <span class="sr-dot">•</span>
        <span class="sr-region">${regionName}</span>
        <span class="sr-wrn-text">${wrnName}${lvlNum ? " " + (LVL_LABEL[lvlNum] || "") : ""}</span>
        ${cmdName ? `<span class="sr-cmd-text">${cmdName}</span>` : ""}
        `;
    
        showLine(lineEl, emptyEl);
    }
    

    function safe(v) {
    if (v === null || v === undefined) return "";
    const s = String(v).trim();
    return s;
    }

    // tmFc (yyyyMMddHHmm or yyyyMMddHHmmss) -> "MM-DD HH:mm"
    function format12(s) {
    const d = safe(s).replace(/\D/g, "");
    if (d.length < 12) return "";
    const mm = d.substring(4, 6);
    const dd = d.substring(6, 8);
    const hh = d.substring(8, 10);
    const mi = d.substring(10, 12);
    return `${mm}-${dd} ${hh}:${mi}`;
    }

    // ISO "2026-01-21T12:01:54" -> "MM-DD HH:mm"
    function formatIso(iso) {
    const s = safe(iso);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return "";
    return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
    }

    return { init };

})();
