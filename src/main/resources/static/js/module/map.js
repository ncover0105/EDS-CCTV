/******************************************
 * map.js - CCTV + SPEAKER 지도 표시(실DB)
 ******************************************/

let vworldMap = null;
let mapLayer = null;
let gpsData = [];   // ← DB에서 받아온 데이터로 채움
let activePopupCoordinate = null;
let activePopupData = null;
let statusListBound = false;
let statusToggleBound = false;
let filterChipsBound = false;
let mapEventsBound = false;
let viewEventsBound = false;
let isStatusListCollapsed = false;
let currentDeviceFilter = 'all'; // 'all' | 'cctv' | 'speaker'

let initialCenter = null;
let initialZoom = 18;
const minZoom = 12;
const maxZoom = 20;
const labelMinZoom = 18;

const ICONS = {
    cctv: (accentColor) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="15" height="10" rx="2" fill="white"/>
    <polygon points="17,9 22,6 22,18 17,15" fill="white"/>
    <circle cx="9" cy="12" r="2.5" fill="${accentColor}"/>
  </svg>`,
    speaker: () => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <polygon points="3,8 3,16 7,16 13,20 13,4 7,8" fill="white"/>
    <path d="M16 8.5c1.5 1 2.5 2.5 2.5 3.5s-1 2.5-2.5 3.5"
      stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
  </svg>`
};

const COLORS = {
    cctv: "#378ADD",
    speaker: "#378ADD",
    offline: "#A32D2D"
};

const markerStyleCache = new Map();

function getMarkerColor(type, status) {
    return status === "offline" ? COLORS.offline : (COLORS[type] || COLORS.cctv);
}

function isCctvOperationalStatus(rawStatus) {
    const s = String(rawStatus ?? "").trim().toUpperCase();
    return s === "1" || s === "01" || s === "Y";
}

function createMarkerSvg(type, status) {
    const color = getMarkerColor(type, status);
    const iconFactory = ICONS[type] || ICONS.cctv;
    const innerIcon = iconFactory(color);

    // 뱃지(32×32 rounded) + callout 삼각형 (tip y=39)
    // 전체 viewBox 32×40
    return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none">
        <defs>
            <filter id="ms" x="-40%" y="-30%" width="180%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.8" flood-color="#000" flood-opacity="0.28"/>
            </filter>
        </defs>
        <path d="M9 0 H23 Q32 0 32 9 V23 Q32 32 23 32 H19 L16 39 L13 32 H9 Q0 32 0 23 V9 Q0 0 9 0 Z"
              fill="${color}" filter="url(#ms)" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>
        <g transform="translate(7 7)">${innerIcon}</g>
    </svg>`;
}

function createMarkerIcon(type, status, scale) {
    const svg = createMarkerSvg(type, status);
    const src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);

    return new ol.style.Icon({
        src,
        scale,
        // 하단 callout 꼭짓점(y≈39/40)이 지도 좌표에 정렬
        anchor: [0.5, 0.975],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction"
    });
}

/* ============================================================
    1) API에서 CCTV + SPEAKER 데이터 불러오기
============================================================ */
async function loadMapData() {
    try {
        const [cctvRes, speakerRes] = await Promise.all([
            fetch('/api/cctv/list'),
            fetch('/api/btype/query/config/speakers')
        ]);

        if (!cctvRes.ok || !speakerRes.ok) {
            throw new Error(`지도 데이터 요청 실패: CCTV ${cctvRes.status}, SPEAKER ${speakerRes.status}`);
        }

        const cctvList = await cctvRes.json();
        const speakerList = await speakerRes.json();

        gpsData = []; // 초기화

        /* ============================================================
            CCTV → gpsData
        ============================================================ */
        cctvList.forEach((c, idx) => {
            const lat = c.latitude;
            const lng = c.longitude;

            if (!isValidCoordinate(lat, lng)) {
                console.warn(`CCTV ${c.name || c.cctvCode} 좌표 오류 또는 한국 밖 → 제외`);
                return;
            }

            gpsData.push({
                id: String(c.cctvCode || c.id || c.name || `cctv-${idx}`),
                name: c.name || c.cctvCode,
                lat: Number(lat),
                lng: Number(lng),
                status: isCctvOperationalStatus(c.statusProc ?? c.statusCam) ? "online" : "offline",
                type: "cctv"
            });
        });

        /* ============================================================
            SPEAKER → gpsData
        ============================================================ */
        speakerList.forEach((s, idx) => {
            const lat = s.speakerLatitude;
            const lng = s.speakerLongitude;

            if (!isValidCoordinate(lat, lng)) {
                console.warn(`SPEAKER ${s.speakerName || s.speakerId || s.speakerKey} 좌표 오류 또는 한국 밖 → 제외`);
                return;
            }

            gpsData.push({
                id: String(s.speakerId || s.speakerKey || s.speakerName || `speaker-${idx}`),
                name: s.speakerName || s.speakerId || s.speakerKey,
                locationName: s.locationName || s.description || s.speakerName || s.speakerId || s.speakerKey,
                lat: Number(lat),
                lng: Number(lng),
                status: s.connectStatus === 0 ? "online" : "offline",
                type: "speaker"
            });
        });

        if (gpsData.length === 0) {
            console.error("gpsData 비어있음 → 지도 생성 중단");
            return;
        }
        updateStatusSummary();

        if (vworldMap) {
            refreshMap();
        } else {
            initVWorldMap();
        }

    } catch (err) {
        console.error("loadMapData ERROR:", err);
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

    // 처음 로딩 시 최초 중심값 저장
    if (!initialCenter) {
        initialCenter = center;
    }

    vworldMap = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                preload: Infinity,
                source: new ol.source.XYZ({
                    url: `https://api.vworld.kr/req/wmts/1.0.0/${mapApiKey}/Satellite/{z}/{y}/{x}.jpeg`,
                    transition: 0
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

    // 허브 페이지에서 맵 인스턴스를 참조할 수 있도록 노출
    window._olMapRef = vworldMap;
    document.dispatchEvent(new CustomEvent('olmapready', { detail: { map: vworldMap } }));
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

        return feature;
    });

    mapLayer = new ol.layer.Vector({
        source: new ol.source.Vector({ features }),
        style: markerStyleFunction
    });

    vworldMap.addLayer(mapLayer);
    if (!mapEventsBound) {
        vworldMap.on('pointermove', handlePointerMove);
        vworldMap.on('singleclick', handleSingleClick);
        vworldMap.on('moveend', repositionMapPopup);
        mapEventsBound = true;
    }

    if (!viewEventsBound) {
        vworldMap.getView().on("change:center", function () {
            repositionMapPopup();
        });

        vworldMap.getView().on("change:resolution", function () {
            repositionMapPopup();
            if (mapLayer) mapLayer.changed();
        });

        viewEventsBound = true;
    }
}

function markerStyleFunction(feature, resolution) {
    const data = feature.get("gpsData");
    if (!isDeviceVisibleByFilter(data)) {
        return null;
    }

    // 현재 줌 레벨 구하기
    const zoom = vworldMap.getView().getZoom();
    const zoomKey = Math.round(zoom * 10) / 10;
    const showLabel = zoom >= labelMinZoom;
    const labelText = String(data.name || "");

    const scale = 0.74 + ((zoom - 13) * 0.064);

    const cacheKey = showLabel
        ? `${data.type}:${data.status}:${zoomKey}:label:${labelText}`
        : `${data.type}:${data.status}:${zoomKey}:plain`;
    if (markerStyleCache.has(cacheKey)) {
        return markerStyleCache.get(cacheKey);
    }

    const styleOptions = {
        image: createMarkerIcon(data.type, data.status, scale)
    };

    if (showLabel) {
        styleOptions.text = new ol.style.Text({
            text: labelText,
            offsetY: 10,
            font: '600 12px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
            fill: new ol.style.Fill({ color: "#f8fafc" }),
            stroke: new ol.style.Stroke({ color: "rgba(15, 23, 42, 0.92)", width: 3 }),
            textAlign: "center",
            textBaseline: "top",
            overflow: true
        });
    }

    const style = new ol.style.Style(styleOptions);

    markerStyleCache.set(cacheKey, style);
    return style;
}

function isDeviceVisibleByFilter(data) {
    if (!data) return false;
    return currentDeviceFilter === "all" || data.type === currentDeviceFilter;
}

function refreshMarkerFilter() {
    if (activePopupData && !isDeviceVisibleByFilter(activePopupData)) {
        hideMapPopup();
    }

    if (mapLayer) {
        mapLayer.changed();
    }
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
                <div class="map-device-popup-headline">
                    <div class="map-device-popup-icon" id="mapDevicePopupIcon">
                        <i class="bi bi-cpu"></i>
                    </div>
                    <div class="map-device-popup-header-copy">
                        <div class="map-device-popup-name" id="mapDevicePopupName">-</div>
                    </div>
                </div>
            </div>
            <div class="map-device-popup-body">
                <div class="map-device-popup-data-grid">
                    <div class="map-device-popup-data-card">
                        <div class="map-device-popup-status-card" id="mapDevicePopupStatusCard">
                            <div class="map-device-popup-status-icon" id="mapDevicePopupStatusIcon">
                                <i class="bi bi-activity"></i>
                            </div>
                            <div class="map-device-popup-status-copy">
                                <div class="map-device-popup-data-label">연결 상태</div>
                                <div class="map-device-popup-status-title" id="mapDevicePopupStatus">-</div>
                            </div>
                        </div>
                    </div>
                    <div class="map-device-popup-data-card">
                        <div class="map-device-popup-location-row">
                            <div class="map-device-popup-location-icon">
                                <i class="bi bi-geo-alt-fill"></i>
                            </div>
                            <div class="map-device-popup-location-copy">
                                <div class="map-device-popup-data-label">위치</div>
                                <div class="map-device-popup-data-value" id="mapDevicePopupLocation">-</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="map-device-popup-actions">
                <button type="button" class="map-device-popup-action-btn map-device-popup-action-btn--ghost"
                        id="mapDevicePopupControlBtn">
                    <i class="bi bi-sliders"></i>
                    <span>설정</span>
                </button>
                <button type="button" class="map-device-popup-action-btn" id="mapDevicePopupBroadcastBtn">
                    <i class="bi bi-broadcast-pin"></i>
                    <span>방송</span>
                </button>
            </div>
        `;

        mapEl.appendChild(popupEl);

        popupEl.querySelector(".map-device-popup-close")?.addEventListener("click", hideMapPopup);
        popupEl.querySelector("#mapDevicePopupControlBtn")?.addEventListener("click", function () {
            if (!activePopupData || activePopupData.type !== "speaker") return;

            const modalEl = document.getElementById("speaker_setting_modal");
            if (!modalEl || typeof bootstrap === "undefined") return;

            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        });
        popupEl.querySelector("#mapDevicePopupBroadcastBtn")?.addEventListener("click", function () {
            if (!activePopupData || activePopupData.type !== "speaker") return;

            window._broadcastHintCamera = activePopupData.name || "";
            const modalEl = document.getElementById("speaker_broadcast_modal");
            if (!modalEl || typeof bootstrap === "undefined") return;

            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        });
    }
}

function showMapPopup(data, coordinate) {
    const popupEl = document.getElementById("mapDevicePopup");
    if (!popupEl) return;

    activePopupCoordinate = coordinate;
    activePopupData = data;

    const isSpeaker = data.type === "speaker";
    const statusText = isSpeaker
        ? (data.status === "online" ? "정상 연결" : "오프라인")
        : (data.status === "online" ? "정상" : "오프라인");
    const iconEl = popupEl.querySelector("#mapDevicePopupIcon");
    const locationEl = popupEl.querySelector("#mapDevicePopupLocation");
    const statusEl = popupEl.querySelector("#mapDevicePopupStatus");
    const statusCardEl = popupEl.querySelector("#mapDevicePopupStatusCard");
    const statusIconEl = popupEl.querySelector("#mapDevicePopupStatusIcon");
    const controlBtn = popupEl.querySelector("#mapDevicePopupControlBtn");
    const broadcastBtn = popupEl.querySelector("#mapDevicePopupBroadcastBtn");

    popupEl.classList.remove("is-speaker", "is-cctv");
    popupEl.classList.add(isSpeaker ? "is-speaker" : "is-cctv");
    popupEl.querySelector("#mapDevicePopupName").textContent = data.name || "-";
    statusEl.textContent = statusText;
    statusEl.classList.remove("is-online", "is-offline");
    statusEl.classList.add(data.status === "online" ? "is-online" : "is-offline");
    if (statusCardEl) {
        statusCardEl.classList.remove("is-online", "is-offline");
        statusCardEl.classList.add(data.status === "online" ? "is-online" : "is-offline");
    }
    if (iconEl) {
        iconEl.innerHTML = isSpeaker
            ? '<i class="bi bi-megaphone-fill"></i>'
            : '<i class="bi bi-camera-video-fill"></i>';
    }
    if (statusIconEl) {
        statusIconEl.innerHTML = data.status === "online"
            ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle cx="6" cy="12" r="2.2" fill="currentColor"></circle>
                    <circle cx="18" cy="7" r="2.2" fill="currentColor"></circle>
                    <circle cx="18" cy="17" r="2.2" fill="currentColor"></circle>
                    <path d="M8.3 11.1 15.7 7.9M8.3 12.9l7.4 3.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                </svg>`
            : `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle cx="6" cy="12" r="2.2" fill="currentColor"></circle>
                    <circle cx="18" cy="7" r="2.2" fill="currentColor"></circle>
                    <circle cx="18" cy="17" r="2.2" fill="currentColor"></circle>
                    <path d="M8.3 11.1 15.7 7.9M8.3 12.9l7.4 3.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.28"></path>
                    <path d="M7 17 17 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>
                </svg>`;
    }
    if (locationEl) {
        locationEl.textContent = data.locationName || data.name || "-";
    }
    if (controlBtn) {
        controlBtn.style.display = isSpeaker ? "inline-flex" : "none";
    }
    if (broadcastBtn) {
        broadcastBtn.style.display = isSpeaker ? "inline-flex" : "none";
    }

    popupEl.style.display = "block";
    repositionMapPopup();
}

function repositionMapPopup() {
    const popupEl = document.getElementById("mapDevicePopup");
    if (!popupEl || !activePopupCoordinate || popupEl.style.display === "none" || !vworldMap) return;

    const pixel = vworldMap.getPixelFromCoordinate(activePopupCoordinate);
    popupEl.style.left = `${pixel[0]}px`;
    popupEl.style.top = `${pixel[1]}px`;
}

function hideMapPopup() {
    const popupEl = document.getElementById("mapDevicePopup");
    if (popupEl) {
        popupEl.style.display = "none";
    }
    activePopupCoordinate = null;
    activePopupData = null;
}

function syncStatusListCollapsedUI() {
    const summaryEl = document.querySelector(".camera-status-summary");
    const toggleEl = document.getElementById("deviceStatusToggle");
    if (!summaryEl || !toggleEl) return;

    summaryEl.classList.toggle("is-collapsed", isStatusListCollapsed);
    toggleEl.setAttribute("aria-expanded", String(!isStatusListCollapsed));
}

function bindStatusToggle() {
    if (statusToggleBound) return;

    const toggleEl = document.getElementById("deviceStatusToggle");
    if (!toggleEl) return;

    toggleEl.addEventListener("click", () => {
        isStatusListCollapsed = !isStatusListCollapsed;
        syncStatusListCollapsedUI();
    });

    syncStatusListCollapsedUI();
    statusToggleBound = true;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getSortedDeviceItems(deviceType) {
    return gpsData
        .filter((item) => item.type === deviceType)
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function getFilteredItems() {
    if (currentDeviceFilter === 'all') {
        return [...gpsData].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'cctv' ? -1 : 1;
            return a.name.localeCompare(b.name, "ko");
        });
    }
    return getSortedDeviceItems(currentDeviceFilter);
}

function renderUnifiedStatusList() {
    const listEl = document.getElementById("deviceStatusList");
    if (!listEl) return;

    const items = getFilteredItems();

    if (!Array.isArray(items) || items.length === 0) {
        const label = currentDeviceFilter === 'cctv' ? 'CCTV' : currentDeviceFilter === 'speaker' ? '스피커' : '';
        listEl.innerHTML = `<div class="device-status-empty">${label ? label + ' ' : ''}장치가 없습니다.</div>`;
        return;
    }

    listEl.innerHTML = items.map((item, index) => {
        const statusClass = item.status === "online" ? "is-online" : "is-offline";
        const typeLabel = item.type === "speaker" ? "스피커" : "CCTV";
        const iconClass = item.type === "speaker" ? "bi-volume-up-fill" : "bi-camera-video-fill";
        const name = escapeHtml(item.name || `${typeLabel} ${index + 1}`);
        const id = escapeHtml(item.id || `${item.type}-${index}`);

        return `
            <button type="button" class="device-status-item" data-device-id="${id}" data-device-type="${item.type}">
                <span class="device-status-avatar" aria-hidden="true">
                    <i class="bi ${iconClass}"></i>
                </span>
                <div class="device-status-main">
                    <div class="device-status-name">${name}</div>
                    <div class="device-status-meta">${escapeHtml(typeLabel)}</div>
                </div>
                <span class="device-status-side">
                    <span class="device-status-badge ${statusClass}"></span>
                    <span class="device-status-arrow" aria-hidden="true">
                        <i class="bi bi-chevron-right"></i>
                    </span>
                </span>
            </button>
        `;
    }).join("");
}

function bindFilterChips() {
    if (filterChipsBound) return;

    const chipsEl = document.getElementById("deviceFilterChips");
    if (!chipsEl) return;

    chipsEl.addEventListener("click", (event) => {
        const chip = event.target.closest(".device-filter-tab");
        if (!chip) return;

        currentDeviceFilter = chip.dataset.filter || 'all';

        chipsEl.querySelectorAll(".device-filter-tab").forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");

        renderUnifiedStatusList();
        refreshMarkerFilter();
    });

    filterChipsBound = true;
}

function bindStatusListEvents() {
    if (statusListBound) return;

    const listEl = document.getElementById("deviceStatusList");
    if (!listEl) return;

    listEl.addEventListener("click", (event) => {
        const button = event.target.closest(".device-status-item");
        if (!button) return;

        const deviceType = button.dataset.deviceType;
        const deviceId = button.dataset.deviceId;
        const selected = gpsData.find(item => item.type === deviceType && item.id === deviceId);

        if (!selected || !vworldMap) return;

        const coordinate = ol.proj.fromLonLat([selected.lng, selected.lat]);
        const targetZoom = Math.max(vworldMap.getView().getZoom() || initialZoom, 16);

        vworldMap.getView().animate({
            center: coordinate,
            zoom: Math.min(targetZoom, maxZoom),
            duration: 350
        });

        showMapPopup(selected, coordinate);
    });

    statusListBound = true;
}


/* ============================================================
    5) Hover Cursor / Click 이벤트
============================================================ */
function handlePointerMove(evt) {
    if (!vworldMap) return;

    const mapContainer = vworldMap.getTargetElement();
    if (!mapContainer) return;

    const feature = vworldMap.forEachFeatureAtPixel(
        evt.pixel,
        f => f,
        { hitTolerance: 8 }
    );

    mapContainer.style.cursor = feature ? 'pointer' : 'default';
}

/* ============================================================
    6) 클릭 → Offcanvas (또는 허브 페이지 훅)
============================================================ */
function handleSingleClick(evt) {
    const features = [];
    vworldMap.forEachFeatureAtPixel(
        evt.pixel,
        f => {
            features.push(f);
            return false;
        },
        { hitTolerance: 8 }
    );

    if (!features.length) {
        hideMapPopup();
        if (typeof window.onHubMapClick === 'function') window.onHubMapClick(null, null, null);
        return;
    }

    const feature = features.find(f => !!f.get("gpsData")) || features.find(f => !!f.get("eventData"));
    if (!feature) return;

    const gpsData = feature.get("gpsData");
    const coordinate = feature.getGeometry().getCoordinates();

    // 허브 페이지가 클릭을 완전히 가져감
    if (typeof window.onHubMapClick === 'function') {
        window.onHubMapClick(gpsData || null, coordinate, feature);
        return;
    }

    if (gpsData) showMapPopup(gpsData, coordinate);
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

function updateFilterCounts() {
    const total = gpsData.length;
    const cctvCount = gpsData.filter(i => i.type === 'cctv').length;
    const speakerCount = gpsData.filter(i => i.type === 'speaker').length;

    const totalEl = document.getElementById("deviceTotalCount");
    const allEl = document.getElementById("filterCountAll");
    const cctvEl = document.getElementById("filterCountCctv");
    const speakerEl = document.getElementById("filterCountSpeaker");

    if (totalEl) totalEl.textContent = total;
    if (allEl) allEl.textContent = total;
    if (cctvEl) cctvEl.textContent = cctvCount;
    if (speakerEl) speakerEl.textContent = speakerCount;
}

function updateStatusSummary() {
    updateFilterCounts();
    renderUnifiedStatusList();
    bindStatusListEvents();
    bindFilterChips();
    bindStatusToggle();
    syncStatusListCollapsedUI();
}

async function showMapView() {
    document.getElementById('cctv-container').classList.add('d-none');
    document.getElementById('map-container').classList.remove('d-none');

    if (!vworldMap) {
        await loadMapData();
    }

    setTimeout(() => {
        if (vworldMap) vworldMap.updateSize();
    }, 300);
}

function showCCTVView() {
    document.getElementById('map-container').classList.add('d-none');
    document.getElementById('cctv-container').classList.remove('d-none');
}

function refreshMap() {
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
}

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
window.loadMapData = loadMapData;
window.showMapPopup = showMapPopup;
window.hideMapPopup = hideMapPopup;
