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

const ICONS = {
    cctv: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="15" height="10" rx="2" fill="white"/>
    <polygon points="17,9 22,6 22,18 17,15" fill="white"/>
    <circle cx="9" cy="12" r="2.5" fill="#378ADD"/>
  </svg>`,
    speaker: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <polygon points="3,8 3,16 7,16 13,20 13,4 7,8" fill="white"/>
    <path d="M16 8.5c1.5 1 2.5 2.5 2.5 3.5s-1 2.5-2.5 3.5"
      stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
  </svg>`
};

const COLORS = {
    cctv: "#378ADD",
    speaker: "#639922",
    offline: "#A32D2D"
};

const markerStyleCache = new Map();

function getMarkerColor(type, status) {
    return status === "offline" ? COLORS.offline : (COLORS[type] || COLORS.cctv);
}

function createMarkerSvg(type, status) {
    const color = getMarkerColor(type, status);
    const innerIcon = ICONS[type] || ICONS.cctv;

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38" fill="none">
        <rect x="0" y="0" width="30" height="30" rx="10" fill="${color}"/>
        <g transform="translate(6 6)">
            ${innerIcon}
        </g>
        <circle cx="15" cy="35" r="2.4" fill="${color}" fill-opacity="0.5"/>
    </svg>`;
}

function createMarkerIcon(type, status, scale) {
    const svg = createMarkerSvg(type, status);
    const src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);

    return new ol.style.Icon({
        src,
        scale,
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction"
    });
}

/* ============================================================
    1) API에서 CCTV + SPEAKER 데이터 불러오기
============================================================ */
async function loadMapData() {
    try {
        console.log("===== 📡 loadMapData 요청 시작 =====");

        const [cctvRes, speakerRes] = await Promise.all([
            fetch('/api/cctv/list'),
            fetch('/api/btype/query/config/speakers')
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
        speakerList.forEach((s) => {
            const lat = s.speakerLatitude;
            const lng = s.speakerLongitude;

            if (!isValidCoordinate(lat, lng)) {
                console.warn(`❌ SPEAKER ${s.speakerName || s.speakerId || s.speakerKey} 좌표 오류 또는 한국 밖 → 제외`);
                return;
            }

            gpsData.push({
                name: s.speakerName || s.speakerId || s.speakerKey,
                lat: Number(lat),
                lng: Number(lng),
                status: s.connectStatus === 0 ? "online" : "offline",
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

    ensureMapPopup();

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

    const scale = 0.74 + ((zoom - 13) * 0.064);

    const cacheKey = `${data.type}:${data.status}:${zoom}`;
    if (markerStyleCache.has(cacheKey)) {
        return markerStyleCache.get(cacheKey);
    }

    const style = new ol.style.Style({
        image: createMarkerIcon(data.type, data.status, scale)
    });

    markerStyleCache.set(cacheKey, style);
    return style;
}

function ensureMapPopup() {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    let popupEl = document.getElementById("mapDevicePopup");
    if (!popupEl) {
        popupEl = document.createElement("div");
        popupEl.id = "mapDevicePopup";
        popupEl.className = "map-device-popup";
        popupEl.innerHTML = `
            <button type="button" class="map-device-popup-close" aria-label="팝업 닫기">&times;</button>
            <div class="map-device-popup-header">
                <div class="map-device-popup-label">장치 정보</div>
                <div class="map-device-popup-name" id="mapDevicePopupName">-</div>
            </div>
            <div class="map-device-popup-body">
                <div class="map-device-popup-row">
                    <span class="map-device-popup-key">종류</span>
                    <span class="map-device-popup-type" id="mapDevicePopupType">-</span>
                </div>
                <div class="map-device-popup-row">
                    <span class="map-device-popup-key">상태</span>
                    <span class="map-device-popup-status" id="mapDevicePopupStatus">-</span>
                </div>
            </div>
        `;
        popupEl.style.position = "absolute";
        popupEl.style.left = "0";
        popupEl.style.top = "0";
        popupEl.style.minWidth = "240px";
        popupEl.style.maxWidth = "300px";
        popupEl.style.padding = "0";
        popupEl.style.borderRadius = "18px";
        popupEl.style.background = "rgba(10, 14, 22, 0.96)";
        popupEl.style.border = "1px solid rgba(255,255,255,0.14)";
        popupEl.style.boxShadow = "0 20px 44px rgba(0,0,0,0.42)";
        popupEl.style.backdropFilter = "blur(14px)";
        popupEl.style.color = "#eef4ff";
        popupEl.style.pointerEvents = "auto";
        popupEl.style.display = "none";
        popupEl.style.zIndex = "30";
        popupEl.style.transform = "translate(-50%, calc(-100% - 22px))";

        mapEl.appendChild(popupEl);

        const styleEl = document.createElement("style");
        styleEl.id = "mapDevicePopupStyle";
        styleEl.textContent = `
            .map-device-popup::after {
                content: "";
                position: absolute;
                left: 50%;
                bottom: -8px;
                width: 16px;
                height: 16px;
                background: rgba(10, 14, 22, 0.96);
                border-right: 1px solid rgba(255,255,255,0.14);
                border-bottom: 1px solid rgba(255,255,255,0.14);
                transform: translateX(-50%) rotate(45deg);
            }
            .map-device-popup-close {
                position: absolute;
                top: 12px;
                right: 12px;
                border: 0;
                background: transparent;
                color: rgba(238,244,255,0.72);
                font-size: 18px;
                line-height: 1;
                cursor: pointer;
                z-index: 1;
            }
            .map-device-popup-header {
                padding: 16px 18px 14px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
                border-radius: 18px 18px 0 0;
            }
            .map-device-popup-label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: rgba(238,244,255,0.52);
                margin-bottom: 6px;
            }
            .map-device-popup-name {
                font-size: 16px;
                font-weight: 700;
                line-height: 1.35;
                padding-right: 22px;
            }
            .map-device-popup-body {
                padding: 14px 18px 16px;
            }
            .map-device-popup-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .map-device-popup-row + .map-device-popup-row {
                margin-top: 10px;
            }
            .map-device-popup-key {
                font-size: 12px;
                font-weight: 600;
                color: rgba(238,244,255,0.58);
            }
            .map-device-popup-type,
            .map-device-popup-status {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 28px;
                padding: 0 10px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
            }
            .map-device-popup-type {
                background: rgba(255,255,255,0.08);
                color: rgba(238,244,255,0.92);
            }
            .map-device-popup-status.is-online {
                background: rgba(46, 228, 107, 0.14);
                color: #67ef97;
            }
            .map-device-popup-status.is-offline {
                background: rgba(220, 77, 77, 0.16);
                color: #ff8c8c;
            }
        `;
        if (!document.getElementById(styleEl.id)) {
            document.head.appendChild(styleEl);
        }

        popupEl.querySelector(".map-device-popup-close")?.addEventListener("click", hideMapPopup);
    }
}

function showMapPopup(data, coordinate) {
    const popupEl = document.getElementById("mapDevicePopup");
    if (!popupEl) return;

    const typeText = data.type === "speaker" ? "스피커" : "CCTV";
    const statusText = data.status === "online" ? "정상" : "오프라인";
    const statusEl = popupEl.querySelector("#mapDevicePopupStatus");
    const pixel = vworldMap.getPixelFromCoordinate(coordinate);

    popupEl.querySelector("#mapDevicePopupName").textContent = data.name || "-";
    popupEl.querySelector("#mapDevicePopupType").textContent = typeText;
    statusEl.textContent = statusText;
    statusEl.classList.remove("is-online", "is-offline");
    statusEl.classList.add(data.status === "online" ? "is-online" : "is-offline");

    popupEl.style.left = `${pixel[0]}px`;
    popupEl.style.top = `${pixel[1]}px`;
    popupEl.style.display = "block";
}

function hideMapPopup() {
    const popupEl = document.getElementById("mapDevicePopup");
    if (popupEl) {
        popupEl.style.display = "none";
    }
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
    const feature = vworldMap.forEachFeatureAtPixel(evt.pixel, f => f);
    if (!feature) {
        hideMapPopup();
        return;
    }

    const data = feature.get("gpsData");
    const coordinate = feature.getGeometry().getCoordinates();
    showMapPopup(data, coordinate);
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
    hideMapPopup();
}

function updateStatusSummary() {
    const online = gpsData.filter(d => d.status === "online").length;
    const offline = gpsData.filter(d => d.status === "offline").length;

    document.getElementById("onlineCount").textContent = online;
    document.getElementById("offlineCount").textContent = offline;
    // document.getElementById("warningCount").textContent = 0;
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
