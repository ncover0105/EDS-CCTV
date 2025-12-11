/******************************************
 * map.js - CCTV + SPEAKER 지도 표시(실DB)
 ******************************************/

let vworldMap = null;
let mapMarkers = [];
let mapLayer = null;
let gpsData = [];   // ← DB에서 받아온 데이터로 채움

let initialCenter = null;
let initialZoom = 18;
const minZoom = 13;
const maxZoom = 18;

const statusColorMap = {
    "01": "#2ee46b",       // 정상
    "online": "#2ee46b",  
    "00": "#ff595e",       // 오프라인
    "offline": "#ff595e",
    "unknown": "#6c757d"
};

/* ============================================================
    1) API에서 CCTV + SPEAKER 데이터 불러오기
============================================================ */
async function loadMapData() {
    try {
        console.log("===== 📡 loadMapData 요청 시작 =====");

        const [cctvRes, speakerRes] = await Promise.all([
            fetch('/api/cctv/list'),
            fetch('/api/speaker/list')
        ]);

        console.log("📥 CCTV 응답 상태:", cctvRes.status);
        console.log("📥 SPEAKER 응답 상태:", speakerRes.status);

        const cctvList = await cctvRes.json();
        const speakerList = await speakerRes.json();

        console.log("===== 📌 원본 CCTV 데이터 =====");
        console.table(cctvList);

        console.log("===== 📌 원본 SPEAKER 데이터 =====");
        console.table(speakerList);

        gpsData = []; // 초기화

        /* ============================================================
            CCTV → gpsData
        ============================================================ */
        cctvList.forEach((c, idx) => {
            const lat = c.latitude;
            const lng = c.longitude;
        
            if (!isValidCoordinate(lat, lng)) {
                console.warn(`❌ CCTV ${c.name || c.cctvCode} 좌표 오류 또는 한국 밖 → 제외`);
                return;
            }
        
            gpsData.push({
                name: c.name || c.cctvCode,
                lat: Number(lat),
                lng: Number(lng),
                status: c.statusCam == "1" ? "online" : "offline",
                type: "cctv"
            });
        });

        /* ============================================================
            SPEAKER → gpsData
        ============================================================ */
        speakerList.forEach((s, idx) => {
            const lat = s.lat || s.latitude;
            const lng = s.lng || s.longitude;
        
            if (!isValidCoordinate(lat, lng)) {
                console.warn(`❌ SPEAKER ${s.speakerName || s.speakerCode} 좌표 오류 또는 한국 밖 → 제외`);
                return;
            }
        
            gpsData.push({
                name: s.speakerName || s.speakerCode,
                lat: Number(lat),
                lng: Number(lng),
                status: s.connStat === "01" ? "online" : "offline",
                type: "speaker"
            });
        });

        console.log("===== 🧭 변환된 GPS DATA =====");
        console.table(gpsData);

        if (gpsData.length === 0) {
            console.error("❌ gpsData 비어있음 → 지도 생성 중단");
            return;
        }
        console.table(gpsData);
        updateStatusSummary();

        initVWorldMap();

    } catch (err) {
        console.error("❌ loadMapData ERROR:", err);
    }
}

/******************************************
 * 좌표값이 정상인지 검증
 ******************************************/
function isValidCoordinate(lat, lng) {
    if (lat === null || lng === null) return false;
    if (lat === undefined || lng === undefined) return false;

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (isNaN(latNum) || isNaN(lngNum)) return false;

    // 일반 위도/경도 범위
    if (latNum < -90 || latNum > 90) return false;
    if (lngNum < -180 || lngNum > 180) return false;

    // 반드시 한국인지 체크
    return isKoreaCoordinate(latNum, lngNum);
}

function isKoreaCoordinate(lat, lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (latNum < 33.0 || latNum > 38.7) return false;
    if (lngNum < 124.0 || lngNum > 132.0) return false;

    return true;
}

/* ============================================================
    2) 지도 중심 계산
============================================================ */
function calculateCenterCoordinate(dataArray) {
    if (!dataArray.length) return { lat: 37.5665, lng: 126.9780 };

    let totalLat = 0, totalLng = 0;

    dataArray.forEach(d => {
        totalLat += d.lat;
        totalLng += d.lng;
    });

    return {
        lat: totalLat / dataArray.length,
        lng: totalLng / dataArray.length
    };
}

/* ============================================================
    3) 지도 초기화
============================================================ */
function initVWorldMap() {
    if (!gpsData.length) return;

    const center = calculateCenterCoordinate(gpsData);

    // ⭐ 처음 로딩 시 최초 중심값 저장
    if (!initialCenter) {
        initialCenter = center;
    }

    vworldMap = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: `https://api.vworld.kr/req/wmts/1.0.0/${mapApiKey}/Satellite/{z}/{y}/{x}.jpeg`
                })
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([center.lng, center.lat]),
            zoom: initialZoom
        })
    });

    addMarkers();
    setTimeout(fitMap, 300);
}


/* ============================================================
    4) 마커 추가
============================================================ */
function addMarkers() {
    if (!vworldMap || !gpsData.length) return;

    clearMarkers();

    const features = gpsData.map(data => {
        const feature = new ol.Feature({
            geometry: new ol.geom.Point(
                ol.proj.fromLonLat([data.lng, data.lat])
            ),
            gpsData: data
        });

        // let iconImg = data.type === "cctv"
        //     ? "/images/cctv-red.png"
        //     : "/images/speaker-blue.png";

        // feature.setStyle(
        //     new ol.style.Style({
        //         image: new ol.style.Icon({
        //             src: iconImg,
        //             scale: 0.03, 
        //             anchor: [0.5, 1]
        //         }),
        //         text: new ol.style.Text({
        //             text: data.status === "online" ? "정상" : "오프라인",
        //             offsetY: 14,
        //             font: "600 13px sans-serif",
                
        //             // 색상: 맵 위에서 가장 잘 보이는 조합
        //             fill: new ol.style.Fill({
        //                 color: data.status === "online" ? "#31f47b" : "#ff6b6b"
        //             }),
                
        //             // 테두리를 반투명 검정으로 → 배경처럼 작용
        //             stroke: new ol.style.Stroke({
        //                 color: "#000",  // ← 여기 변화가 가장 큼
        //                 width: 2
        //             })
        //         })
        //     })
        // );
        
        return feature;
    });

    mapLayer = new ol.layer.Vector({
        source: new ol.source.Vector({ features }),
        style: markerStyleFunction 
    });

    vworldMap.addLayer(mapLayer);
    mapMarkers = features;

    if (!window._mapEventRegistered) {
        vworldMap.on('pointermove', handlePointerMove);
        vworldMap.on('singleclick', handleSingleClick);
        window._mapEventRegistered = true;
    }

    vworldMap.getView().on("change:resolution", function () {
        if (mapLayer) mapLayer.changed();
    });
}

function markerStyleFunction(feature, resolution) {
    const data = feature.get("gpsData");

    // 현재 줌 레벨 구하기
    const zoom = vworldMap.getView().getZoom();

    // 줌 레벨에 따라 아이콘 크기를 변경
    // zoom 13 ~ 18 기준으로 scale 변화
    const baseScale = 0.03;     // 기존 아이콘 크기
    const scale = baseScale * (zoom / 15); 
    // → zoom 15일 때 = 1x
    // → zoom 18일 때 = 1.2x (조금 커짐)
    // → zoom 13일 때 = 0.86x (조금 작아짐)

    // 텍스트 크기도 함께 확대
    const fontSize = 11 + (zoom - 13) * 0.7;   // 13px ~ 15px 범위로 자연 증가

    let iconImg = data.type === "cctv"
        ? "/images/cctv-red.png"
        : "/images/speaker-blue.png";

    return new ol.style.Style({
        image: new ol.style.Icon({
            src: iconImg,
            scale: scale,
            anchor: [0.5, 1]
        }),
        text: new ol.style.Text({
            text: data.status === "online" ? "정상" : "오프라인",
            offsetY: 14,
            font: `600 ${fontSize}px sans-serif`,
            fill: new ol.style.Fill({
                color: data.status === "online" ? "#31f47b" : "#ff6b6b"
            }),
            stroke: new ol.style.Stroke({
                color: "rgba(0,0,0,0.55)",
                width: 3
            })
        })
    });
}


/* ============================================================
    5) Tooltip, Click 이벤트 동일 유지
============================================================ */
function handlePointerMove(evt) {
    const tooltip = document.getElementById('mapTooltip');
    if (!tooltip) return;

    const mapContainer = vworldMap.getTargetElement();
    const feature = vworldMap.forEachFeatureAtPixel(evt.pixel, f => f);

    if (!feature) {
        tooltip.classList.add('d-none');
        mapContainer.style.cursor = 'default';
        return;
    }

    const data = feature.get('gpsData');
    const coord = feature.getGeometry().getCoordinates();
    const screen = vworldMap.getPixelFromCoordinate(coord);

    tooltip.innerHTML = `
        <div class="tooltip-header"><strong>${data.name}</strong></div>
        <div class="status-badge ${data.status}">${data.status}</div>
        <div class="tooltip-meta">${data.type}</div>
    `;

    const pos = adjustTooltipPosition(tooltip, screen[0], screen[1], mapContainer.clientWidth, mapContainer.clientHeight);

    tooltip.style.left = `${pos.x}px`;
    tooltip.style.top = `${pos.y}px`;
    tooltip.classList.remove('d-none');

    mapContainer.style.cursor = 'pointer';
}

function adjustTooltipPosition(tooltip, x, y, containerWidth, containerHeight) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const offset = 25;
    const topOffset = 60;
    const leftOffset = 5;
    const padding = 10;

    let finalX = x - tooltipRect.width / 2 - leftOffset;
    let finalY = y + offset;

    let arrowPos = 'top';

    if (finalX + tooltipRect.width + padding > containerWidth) {
        finalX = containerWidth - tooltipRect.width - padding;
    }

    if (finalX < padding) {
        finalX = padding;
    }

    if (y + tooltipRect.height + offset + padding > containerHeight) {
        finalY = y - tooltipRect.height - topOffset;
        arrowPos = 'bottom';
    }

    if (finalY < padding) {
        finalY = y + offset;
        arrowPos = 'top';
    }

    return { x: finalX, y: finalY, arrowPos };
}

/* ============================================================
    6) 클릭 → Offcanvas
============================================================ */
function handleSingleClick(evt) {
    vworldMap.forEachFeatureAtPixel(evt.pixel, feature => {
        new bootstrap.Modal(document.getElementById('speakerModal')).show();
    });
}

/* ============================================================
    7) 마커 정리 / 지도 FIT / 화면 전환
============================================================ */
function fitMap() {
    if (!gpsData.length) return;

    const extent = ol.extent.createEmpty();

    gpsData.forEach(item => {
        const coord = ol.proj.fromLonLat([item.lng, item.lat]);
        ol.extent.extend(extent, ol.extent.boundingExtent([coord]));
    });

    vworldMap.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 300,
        maxZoom: maxZoom,
        minZoom: minZoom
    });

    // fitMap 후, 줌 범위 보정
    const currentZoom = vworldMap.getView().getZoom();
    if (currentZoom > maxZoom) {
        vworldMap.getView().setZoom(maxZoom);
    }
    if (currentZoom < minZoom) {
        vworldMap.getView().setZoom(minZoom);
    }
}

function clearMarkers() {
    if (mapLayer) {
        vworldMap.removeLayer(mapLayer);
        mapLayer = null;
    }
}

function updateStatusSummary() {
    const online = gpsData.filter(d => d.status === "online").length;
    const offline = gpsData.filter(d => d.status === "offline").length;

    document.getElementById("onlineCount").textContent = online;
    document.getElementById("offlineCount").textContent = offline;
    // document.getElementById("warningCount").textContent = 0;
    document.getElementById("maintenanceCount").textContent = 0;
}

window.showMapView = function () {
    document.getElementById('cctv-container').classList.add('d-none');
    document.getElementById('map-container').classList.remove('d-none');

    if (!vworldMap) {
        loadMapData();
        setTimeout(() => {
            vworldMap.updateSize();
        }, 300);
    }
};

window.showCCTVView = function () {
    document.getElementById('map-container').classList.add('d-none');
    document.getElementById('cctv-container').classList.remove('d-none');
};

window.refreshMap = function () {
    if (!vworldMap) return;

    clearMarkers();
    addMarkers();

    // 지도 위치를 처음 좌표로 리셋
    if (initialCenter) {
        vworldMap.getView().setCenter(
            ol.proj.fromLonLat([initialCenter.lng, initialCenter.lat])
        );
    }

    // 줌 레벨 초깃값으로 설정
    vworldMap.getView().setZoom(initialZoom);

    console.log("지도 초기 위치/줌으로 리셋 완료");
};

window.addEventListener('resize', () => {
    if (vworldMap) {
        // 레이아웃 변화를 반영하도록 약간 딜레이 후 업데이트
        setTimeout(() => {
            vworldMap.updateSize();
        }, 200);
    }
});

window.showMapView = showMapView;
window.showCCTVView = showCCTVView;
window.refreshMap = refreshMap;