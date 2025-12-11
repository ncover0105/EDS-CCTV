document.addEventListener("DOMContentLoaded", function () {
    Weather.init();           // AWS + 예보 + 위성 + 레이더 자동 로드
    Weather.loadAirQuality(); // 대기질 1회 호출
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
        setInterval(loadAllWeather, 120000);

        // document.querySelectorAll('input[name="map_type"]').forEach(btn => {
        //     btn.addEventListener("change", toggleMapImage);
        // });

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
            const data = await fetchJson('/api/weather/awsdata');
            updateAWS(data);
        } catch (e) {
            console.error("AWS 데이터 오류:", e);
        }
    }

    function updateAWS(data) {
        $("#temperature").text(data.temperature + "°");
        $("#windSpeed").text(data.windspeed + "m/s");
        $("#humidity").text(data.humidity + "%");

        if (data.winddirection) {
            $("#windText").text(data.winddirection);
            $("#windIcon").css("transform", `rotate(${windDirectionMap[data.winddirection] ?? 0}deg)`);
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
        }
    }

    function updateForecast(data) {
        $("#rainfall").text(data.rainfall + "%");
        $("#weather").text(data.weather);

        if (data.icon) {
            $("#weather_icon")
                .attr("src", `/production/fill/all/${data.icon}`)
                .removeClass("invisible");
        }
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
            spinner.classList.add("d-none");
    
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
        10) 공통 fetch
    =========================================================================== */
    async function fetchJson(path) {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Fetch 실패: ${path}`);
        return res.json();
    }

    /* ============================================================================
        EXPORT
    =========================================================================== */
    return {
        init,
        loadAirQuality,
        switchRadarType
    };

})();
