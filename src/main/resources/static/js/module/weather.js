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

        updateSkyBanner(data?.weather);
    }

    // =============================================
    // 하늘 배너 FX — 날씨 조건에 따라 동적 렌더링
    // =============================================
    function updateSkyBanner(condition) {
        const banner = document.getElementById('sbWxBanner');
        const fxEl = document.getElementById('sbWxFx');

        console.log("[SkyBanner] raw condition:", condition);

        if (!banner || !fxEl) {
            console.warn("[SkyBanner] banner 또는 fxEl 없음");
            return;
        }

        const cond = (condition ?? '').toUpperCase();

        // 1) 배너 배경 클래스 교체
        banner.classList.remove(
            'wx-clear', 'wx-cloudy', 'wx-overcast',
            'wx-rain', 'wx-sleet', 'wx-snow',
            'wx-shower', 'wx-thunderstorm', 'wx-unknown'
        );

        const bannerClassMap = {
            CLEAR: 'wx-clear',
            CLOUDY: 'wx-cloudy',
            OVERCAST: 'wx-overcast',
            RAIN: 'wx-rain',
            SLEET: 'wx-sleet',
            SNOW: 'wx-snow',
            SHOWER: 'wx-shower',
            THUNDERSTORM: 'wx-thunderstorm',

            "맑음": 'wx-clear',
            "구름많음": 'wx-cloudy',
            "흐림": 'wx-overcast',
            "비": 'wx-rain',
            "비/눈": 'wx-sleet',
            "눈": 'wx-snow',
            "소나기": 'wx-shower',
            "천둥번개": 'wx-thunderstorm'
        };

        const appliedClass = bannerClassMap[cond] ?? 'wx-unknown';
        banner.classList.add(appliedClass);

        // 2) FX 영역 교체
        const fxHtml = buildFxHtml(cond);
        fxEl.innerHTML = fxHtml;
    }

    // =============================================
    // 날씨별 FX HTML 생성
    // =============================================
    function buildFxHtml(cond) {

        // ── 공통 하단 페이드 ──
        const fadeBottom = `<div class="sb-wx-fade-bottom"></div>`;

        // ─────────────────────────────────────────
        // CLEAR — 태양 글로우 + 광선 + 별 + 희미한 구름
        // ─────────────────────────────────────────
        if (cond === 'CLEAR') {
            const stars = [
                { top: 8, left: 30, delay: '0s' },
                { top: 14, left: 120, delay: '.8s' },
                { top: 6, left: 210, delay: '1.4s' },
                { top: 18, left: 290, delay: '.4s' },
                { top: 10, left: 340, delay: '1.1s' },
            ].map(s => `<div class="sb-wx-star" style="top:${s.top}px;left:${s.left}px;animation-delay:${s.delay};"></div>`).join('');

            return `
                <div class="sb-wx-sun" style="width:80px;height:80px;top:-30px;right:30px;"></div>
                <div class="sb-wx-cloud" style="width:70px;height:18px;top:14px;left:50px;opacity:0.07;"></div>
                <div class="sb-wx-cloud" style="width:45px;height:14px;top:22px;left:160px;opacity:0.05;background:rgba(200,220,255,.04);"></div>
                ${stars}
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // CLOUDY — 중간 구름 레이어 3개
        // ─────────────────────────────────────────
        if (cond === 'CLOUDY') {
            return `
                <div class="sb-wx-cloud" style="width:90px;height:26px;top:8px; left:40px; opacity:0.45;"></div>
                <div class="sb-wx-cloud" style="width:60px;height:18px;top:18px;left:80px; opacity:0.22;background:rgba(200,220,255,.06);"></div>
                <div class="sb-wx-cloud" style="width:75px;height:22px;top:10px;left:190px;opacity:0.40;"></div>
                <div class="sb-wx-cloud" style="width:50px;height:16px;top:20px;left:280px;opacity:0.30;"></div>
                <div class="sb-wx-mist"  style="top:28px;"></div>
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // OVERCAST — 짙은 구름 + 미스트 2단
        // ─────────────────────────────────────────
        if (cond === 'OVERCAST') {
            return `
                <div class="sb-wx-cloud" style="width:120px;height:30px;top:4px; left:10px; opacity:0.70;"></div>
                <div class="sb-wx-cloud" style="width:90px; height:26px;top:8px; left:100px;opacity:0.55;"></div>
                <div class="sb-wx-cloud" style="width:100px;height:28px;top:6px; left:220px;opacity:0.65;"></div>
                <div class="sb-wx-mist"  style="top:22px;animation-duration:5s;"></div>
                <div class="sb-wx-mist"  style="top:32px;animation-duration:7s;animation-delay:1s;"></div>
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // RAIN — 구름 + 비 7줄기
        // ─────────────────────────────────────────
        if (cond === 'RAIN') {
            const rainLines = [
                { left: 20, height: 18, delay: '0s' },
                { left: 60, height: 16, delay: '.22s' },
                { left: 105, height: 20, delay: '.40s' },
                { left: 150, height: 17, delay: '.08s' },
                { left: 195, height: 19, delay: '.30s' },
                { left: 245, height: 16, delay: '.55s' },
                { left: 295, height: 18, delay: '.15s' },
                { left: 335, height: 17, delay: '.38s' },
            ].map(r => `<div class="sb-wx-rain-line" style="top:-12px;left:${r.left}px;height:${r.height}px;animation-delay:${r.delay};animation-duration:0.7s;"></div>`).join('');

            return `
                <div class="sb-wx-cloud" style="width:90px;height:26px;top:6px; left:30px; opacity:0.55;"></div>
                <div class="sb-wx-cloud" style="width:70px;height:20px;top:12px;left:80px; opacity:0.28;background:rgba(200,220,255,.06);"></div>
                <div class="sb-wx-cloud" style="width:80px;height:24px;top:8px; left:200px;opacity:0.50;"></div>
                <div class="sb-wx-rain">${rainLines}</div>
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // SLEET — 구름 + 비 + 진눈깨비 혼합
        // ─────────────────────────────────────────
        if (cond === 'SLEET') {
            const rainLines = [
                { left: 30, height: 14, delay: '0s' },
                { left: 90, height: 12, delay: '.28s' },
                { left: 160, height: 15, delay: '.50s' },
                { left: 220, height: 13, delay: '.12s' },
                { left: 290, height: 14, delay: '.36s' },
            ].map(r => `<div class="sb-wx-rain-line" style="top:-10px;left:${r.left}px;height:${r.height}px;animation-delay:${r.delay};animation-duration:0.8s;"></div>`).join('');

            const sleetLines = [
                { left: 55, delay: '.15s' },
                { left: 130, delay: '.42s' },
                { left: 190, delay: '0s' },
                { left: 255, delay: '.60s' },
                { left: 315, delay: '.25s' },
            ].map(s => `<div class="sb-wx-sleet-line" style="top:-10px;left:${s.left}px;height:10px;animation-delay:${s.delay};"></div>`).join('');

            const flakes = [
                { left: 70, delay: '.1s', size: 'sm' },
                { left: 175, delay: '.55s', size: 'sm' },
                { left: 270, delay: '.35s', size: 'sm' },
            ].map(s => `<div class="sb-wx-snow-flake ${s.size}" style="left:${s.left}px;animation-delay:${s.delay};animation-duration:2.2s;"></div>`).join('');

            return `
                <div class="sb-wx-cloud" style="width:90px;height:26px;top:6px; left:30px; opacity:0.55;"></div>
                <div class="sb-wx-cloud" style="width:75px;height:22px;top:10px;left:200px;opacity:0.50;"></div>
                <div class="sb-wx-rain">${rainLines}${sleetLines}</div>
                <div class="sb-wx-snow">${flakes}</div>
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // SNOW — 구름 + 다양한 크기의 눈송이 9개
        // ─────────────────────────────────────────
        if (cond === 'SNOW') {
            const flakes = [
                { left: 25, delay: '0s', size: 'md', dur: '1.9s' },
                { left: 70, delay: '.35s', size: 'sm', dur: '2.2s' },
                { left: 110, delay: '.7s', size: 'lg', dur: '1.6s' },
                { left: 155, delay: '.15s', size: 'md', dur: '2.0s' },
                { left: 200, delay: '.50s', size: 'sm', dur: '2.4s' },
                { left: 245, delay: '.25s', size: 'md', dur: '1.8s' },
                { left: 285, delay: '.60s', size: 'lg', dur: '1.7s' },
                { left: 320, delay: '.40s', size: 'sm', dur: '2.1s' },
                { left: 355, delay: '.10s', size: 'md', dur: '2.3s' },
            ].map(s => `<div class="sb-wx-snow-flake ${s.size}" style="left:${s.left}px;animation-delay:${s.delay};animation-duration:${s.dur};"></div>`).join('');

            return `
                <div class="sb-wx-cloud" style="width:85px;height:24px;top:7px; left:40px; opacity:0.50;"></div>
                <div class="sb-wx-cloud" style="width:60px;height:18px;top:14px;left:85px; opacity:0.25;background:rgba(200,220,255,.06);"></div>
                <div class="sb-wx-cloud" style="width:75px;height:22px;top:9px; left:200px;opacity:0.48;"></div>
                <div class="sb-wx-snow">${flakes}</div>
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // SHOWER — 구름 + 빗줄기 밀도 높게 (빠름)
        // ─────────────────────────────────────────
        if (cond === 'SHOWER') {
            const rainLines = [
                { left: 15, height: 20, delay: '0s' },
                { left: 45, height: 17, delay: '.10s' },
                { left: 80, height: 22, delay: '.22s' },
                { left: 115, height: 18, delay: '.05s' },
                { left: 150, height: 21, delay: '.30s' },
                { left: 185, height: 17, delay: '.15s' },
                { left: 220, height: 20, delay: '.38s' },
                { left: 255, height: 19, delay: '.08s' },
                { left: 290, height: 22, delay: '.25s' },
                { left: 325, height: 18, delay: '.18s' },
                { left: 355, height: 20, delay: '.42s' },
            ].map(r => `<div class="sb-wx-rain-line heavy" style="top:-14px;left:${r.left}px;height:${r.height}px;animation-delay:${r.delay};animation-duration:0.45s;"></div>`).join('');

            return `
                <div class="sb-wx-cloud" style="width:100px;height:28px;top:5px; left:20px; opacity:0.60;"></div>
                <div class="sb-wx-cloud" style="width:80px; height:24px;top:9px; left:100px;opacity:0.35;background:rgba(200,220,255,.06);"></div>
                <div class="sb-wx-cloud" style="width:90px; height:26px;top:6px; left:220px;opacity:0.58;"></div>
                <div class="sb-wx-rain">${rainLines}</div>
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // THUNDERSTORM — 짙은 구름 + 폭우 + 번개 볼트 + 플래시
        // ─────────────────────────────────────────
        if (cond === 'THUNDERSTORM') {
            const rainLines = [
                { left: 10, height: 22, delay: '0s' },
                { left: 38, height: 18, delay: '.06s' },
                { left: 68, height: 24, delay: '.20s' },
                { left: 100, height: 20, delay: '.35s' },
                { left: 132, height: 22, delay: '.12s' },
                { left: 165, height: 18, delay: '.28s' },
                { left: 198, height: 23, delay: '.04s' },
                { left: 230, height: 20, delay: '.40s' },
                { left: 262, height: 24, delay: '.16s' },
                { left: 295, height: 19, delay: '.32s' },
                { left: 325, height: 22, delay: '.08s' },
                { left: 355, height: 20, delay: '.44s' },
            ].map(r => `<div class="sb-wx-rain-line heavy" style="top:-14px;left:${r.left}px;height:${r.height}px;animation-delay:${r.delay};animation-duration:0.38s;"></div>`).join('');

            const bolt = `
                <svg class="sb-wx-bolt" style="top:4px;left:185px;width:18px;height:30px;" viewBox="0 0 18 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="11,0 3,16 9,16 7,30 15,12 9,12" fill="rgba(255,240,100,0.92)" />
                </svg>
            `;

            return `
                <div class="sb-wx-cloud" style="width:110px;height:30px;top:2px; left:10px; opacity:0.72;"></div>
                <div class="sb-wx-cloud" style="width:90px; height:26px;top:6px; left:100px;opacity:0.55;background:rgba(200,220,255,.06);"></div>
                <div class="sb-wx-cloud" style="width:100px;height:28px;top:3px; left:230px;opacity:0.68;"></div>
                <div class="sb-wx-lightning" id="sbWxLightning"></div>
                <div class="sb-wx-rain">${rainLines}</div>
                ${bolt}
                ${fadeBottom}
            `;
        }

        // ─────────────────────────────────────────
        // DEFAULT (unknown)
        // ─────────────────────────────────────────
        return `
            <div class="sb-wx-cloud" style="width:70px;height:22px;top:12px;left:60px; opacity:0.25;"></div>
            <div class="sb-wx-cloud" style="width:50px;height:16px;top:20px;left:90px; opacity:0.12;background:rgba(200,220,255,.06);"></div>
            <div class="sb-wx-cloud" style="width:60px;height:18px;top:26px;left:170px;opacity:0.22;"></div>
            ${fadeBottom}
        `;
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
    let tickerResizeTimer = null;
    let tickerItemsCache = [];

    function init() {
        load();
        setInterval(load, REFRESH_MS);
        bindTickerResize();
        window.refreshTicker = () => renderTicker(tickerItemsCache);
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
        tickerItemsCache = [];
        renderTicker(tickerItemsCache);
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
        const lvlClass = [1, 2, 3].includes(lvlNum) ? `lvl-${lvlNum}` : "lvl-0";
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
        tickerItemsCache = [{
            text: `${regionName} - ${wrnName}${lvlNum ? " " + (LVL_LABEL[lvlNum] || "") : ""}${cmdName ? " " + cmdName : ""}`.trim(),
            level: getTickerLevelByLvl(lvlNum)
        }];
        renderTicker(tickerItemsCache);
    }

    function bindTickerResize() {
        window.addEventListener("resize", () => {
            clearTimeout(tickerResizeTimer);
            tickerResizeTimer = setTimeout(() => renderTicker(tickerItemsCache), 120);
        });
    }

    function getTickerLevelByLvl(lvlNum) {
        if (lvlNum >= 3) return "hi";
        if (lvlNum === 2) return "warn";
        return "";
    }

    function renderTicker(reportItems) {
        const inner = document.getElementById("tickerInner");
        const track = inner?.parentElement;
        const tag = document.getElementById("tickerTag");
        const tagLabel = document.getElementById("tickerTagLabel");
        if (!inner || !track) return;

        if (!reportItems || reportItems.length === 0) {
            inner.innerHTML = `<span class="t-item t-empty">수신된 특보 정보가 없습니다.</span>`;
            inner.classList.remove("scrolling", "single");
            inner.style.removeProperty("--ticker-shift");
            inner.style.removeProperty("animationDuration");
            tag?.classList.add("no-data");
            if (tagLabel) tagLabel.textContent = "특보";
            return;
        }

        tag?.classList.remove("no-data");
        const highCount = reportItems.filter(i => i.level === "hi").length;
        if (tagLabel) tagLabel.textContent = highCount > 0 ? `긴급 ${highCount}` : "특보";

        if (reportItems.length === 1) {
            const item = reportItems[0];
            inner.innerHTML = `<span class="t-item ${item.level}">${item.text}</span>`;
            inner.classList.remove("scrolling");
            inner.classList.add("single");
            inner.style.removeProperty("--ticker-shift");
            inner.style.removeProperty("animationDuration");
            return;
        }

        inner.classList.remove("single");

        let loopItems = [...reportItems];
        let shiftPx = 0;
        const makeItemsHtml = (items) => items.map((item, i) =>
            `<span class="t-item ${item.level}">${item.text}</span>` +
            (i < items.length - 1 ? `<span class="t-sep">·</span>` : "")
        ).join("");

        const minLoopWidth = track.clientWidth + 40;
        for (let i = 0; i < 24; i++) {
            const loopHtml = makeItemsHtml(loopItems);
            inner.innerHTML =
                `<span class="ticker-loop">${loopHtml}</span>` +
                `<span class="t-sep ticker-loop-gap" style="margin:0 32px"></span>` +
                `<span class="ticker-loop">${loopHtml}</span>`;

            const firstLoop = inner.querySelector(".ticker-loop");
            const gap = inner.querySelector(".ticker-loop-gap");
            const loopWidth = firstLoop?.scrollWidth || 0;
            const gapWidth = gap?.scrollWidth || 0;
            shiftPx = loopWidth + gapWidth;

            if (loopWidth >= minLoopWidth) {
                break;
            }
            loopItems = loopItems.concat(reportItems);
        }

        inner.style.setProperty("--ticker-shift", `${shiftPx}px`);
        inner.classList.add("scrolling");
        const duration = Math.max(18, Math.round(shiftPx / 90));
        inner.style.animationDuration = `${duration}s`;
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
