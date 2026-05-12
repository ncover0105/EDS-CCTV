window.CCTVLayout = (function () {

    let cameras = [];
    let videoCache = {};
    let originalParent = null;
    let originalElement = null;

    let currentLayout = 4;
    let focusedCamIndex = 0;

    let fullscreenEventsBound = false;

    const reconnectTimers = {};

    /* ============================
     *   공통 LOG 함수
     * ============================ */
    const DEBUG = false;

    function log(level, action, detail = "") {
        const prefix = `[CCTVLayout] ${action}`;
        if (level === "debug") {
            if (!DEBUG) return;
            console.debug(prefix, detail);
            return;
        }
        if (level === "warn") {
            console.warn(prefix, detail);
            return;
        }
        if (level === "error") {
            console.error(prefix, detail);
            return;
        }
        if (!DEBUG) return;
        console.log(prefix, detail);
    }

    /* ============================
     *   초기화
     * ============================ */
    function init(cameraList) {
        cameras = Array.isArray(cameraList) ? cameraList.slice().sort((a, b) => {
            const aId = Number(a?.mountpointId ?? Number.MAX_SAFE_INTEGER);
            const bId = Number(b?.mountpointId ?? Number.MAX_SAFE_INTEGER);
            return aId - bId;
        }) : [];
        // renderGrid(cameras.length > 4 ? 9 : 4);
        renderGrid(4);

        bindFullscreenEvents();
    }

    function bindFullscreenEvents() {
        if (fullscreenEventsBound) return;
        fullscreenEventsBound = true;

        const closeBtn = document.getElementById("closefullScreen");
        if (closeBtn) {
            closeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                closeFullscreen();
            });
        }

        document.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;
            const fullView = document.getElementById("fullscreenView");
            if (fullView && fullView.classList.contains("active")) {
                closeFullscreen();
            }
        });
    }

    /* ============================
     *      GRID RENDERING
     * ============================ */
    // ===== 스트림 선택 유틸 =====
    function ensureDefaults(cam) {
        // 최초 1회만 기본값을 저장(서버가 내려준 mountpointId = 기본)
        if (cam.__defaultMountpointId === undefined) cam.__defaultMountpointId = cam.mountpointId ?? null;

        // 기본 URL은 legacy(rtspUrl) 우선
        if (cam.__defaultRtspUrl === undefined) {
            cam.__defaultRtspUrl = cam.rtspUrl || cam.lowRtspUrl || cam.highRtspUrl || null;
        }
    }

    // prefer: "low" | "high"
    function pickStream(cam, prefer) {
        ensureDefaults(cam);

        const def = { mp: cam.__defaultMountpointId ?? null, url: cam.__defaultRtspUrl ?? null };

        // 기본 운영은 항상 legacy mountpointId 사용
        // (향후 low/high 전환 필요 시 아래 로직 복원)
        // const low = { mp: cam.lowMountpointId ?? null, url: cam.lowRtspUrl ?? null };
        // const high = { mp: cam.highMountpointId ?? null, url: cam.highRtspUrl ?? null };
        // let chosen = def;
        // if (prefer === "low") chosen = (low.mp && low.url) ? low : def;
        // if (prefer === "high") chosen = (high.mp && high.url) ? high : def;
        const chosen = def;

        // 최종 검증: mp/url 둘 중 하나라도 없으면 “스트리밍 금지”
        const ok = !!(chosen.mp && chosen.url);
        return { ok, mountpointId: chosen.mp, rtspUrl: chosen.url, used: "default" };
    }

    function applyStreamPreferenceForLayout(layout) {
        // 분할: 전부 low 우선
        if (layout !== 1) {
            cameras.forEach(cam => {
                const s = pickStream(cam, "low");
                cam.mountpointId = s.ok ? s.mountpointId : null;
                cam.__streamBlocked = !s.ok;
                cam.__streamUsed = s.used;
            });
            return;
        }

        // 1x1: 선택된 1대는 high 우선
        const focusedCam = cameras[focusedCamIndex];
        if (focusedCam) {
            const s = pickStream(focusedCam, "high");
            focusedCam.mountpointId = s.ok ? s.mountpointId : null;
            focusedCam.__streamBlocked = !s.ok;
            focusedCam.__streamUsed = s.used;
        }
    }

    function renderGrid(layout) {
        layout = normalizeLayoutForViewport(layout);
        log("debug", "renderGrid()", `layout = ${layout}`);
        if (layout !== 1) {
            focusedCamIndex = 0;
        }
        currentLayout = layout;

        applyStreamPreferenceForLayout(layout);

        const container = document.getElementById("cctv-container");
        container.innerHTML = "";

        const grid = document.createElement("div");
        grid.className = "cctv-grid";

        if (layout === 1) grid.classList.add("grid-1x1");
        else if (layout === 4) grid.classList.add("grid-2x2");
        else if (layout === 9) grid.classList.add("grid-3x3");
        else if (layout === 16) grid.classList.add("grid-4x4");

        for (let i = 0; i < layout; i++) {
            grid.appendChild(createFeed(i));
        }

        container.appendChild(grid);

        // 분할 변경으로 DOM이 재구성된 직후, 기존 video 재생 상태를 다시 반영한다.
        getVisibleCameras().forEach(cam => {
            syncVisibilityByMountId(cam.mountpointId);
        });
    }

    function normalizeLayoutForViewport(layout) {
        const isMobile = window.matchMedia?.("(max-width: 767.98px)")?.matches || window.innerWidth <= 767;
        return isMobile ? 1 : layout;
    }

    function getVisibleCameras() {
        const visible = [];
        if (!Array.isArray(cameras) || cameras.length === 0) return visible;

        if (currentLayout === 1) {
            const cam = cameras[focusedCamIndex];
            if (cam && !cam.__streamBlocked && cam.mountpointId) visible.push(cam);
            return visible;
        }

        for (let i = 0; i < currentLayout; i++) {
            const cam = cameras[i];
            if (!cam) continue;
            if (cam.__streamBlocked || !cam.mountpointId) continue;
            visible.push(cam);
        }
        return visible;
    }

    function createFeed(index) {
        const feed = document.createElement("div");
        feed.className = "cctv-feed";

        let camIndex = index;
        if (currentLayout === 1) camIndex = focusedCamIndex;

        if (camIndex >= cameras.length) {
            log("debug", "createFeed()", `index=${index} → 빈 슬롯`);
            feed.innerHTML = emptySlotHtml();
            return feed;
        }

        // if (index >= cameras.length) {
        //     log("createFeed()", `index=${index} → 빈 슬롯`);
        //     feed.innerHTML = emptySlotHtml();
        //     return feed;
        // }

        const cam = cameras[camIndex];

        if (cam.__streamBlocked || !cam.mountpointId) {
            log("debug", "createFeed()", `스트리밍 차단: ${cam.name} (used=${cam.__streamUsed})`);
            feed.innerHTML = emptySlotHtml();
            // 식별용 dataset은 남겨도 됨
            feed.dataset.cctvCode = cam.cctvCode || "";
            feed.dataset.camName = cam.name || "";
            return feed;
        }

        feed.dataset.mountpointId = cam.mountpointId;
        feed.dataset.cctvCode = cam.cctvCode || "";
        feed.dataset.camName = cam.name || "";

        feed.addEventListener("click", (e) => {
            if (e.target.closest(".cctv-controls")) return;

            const isActive = feed.classList.contains("active");

            // 일단 전부 해제
            document.querySelectorAll(".cctv-feed.active")
                .forEach(el => el.classList.remove("active"));

            if (isActive) return;

            feed.classList.add("active");
        });

        const video = createVideo(cam);
        const placeholder = createPlaceholder(cam);

        feed.appendChild(video);
        feed.appendChild(placeholder);
        feed.appendChild(createOverlay());
        feed.appendChild(createControls(cam, video));
        feed.appendChild(createLabel(cam));

        return feed;
    }

    /* ============================
     *   video 엘리먼트 캐싱
     * ============================ */
    function createVideo(cam) {
        let video = videoCache[cam.mountpointId];

        if (!video) {
            video = document.createElement("video");
            video.id = `video-${cam.mountpointId}`;
            video.className = "w-100 h-100 d-none";
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;

            video.setAttribute("autoplay", "");
            video.setAttribute("muted", "");
            video.setAttribute("playsinline", "");
            video.setAttribute("webkit-playsinline", "");

            // 고정 키로 DOM 탐색
            video.dataset.cctvCode = cam.cctvCode || "";

            videoCache[cam.mountpointId] = video;
        } else {
            // 캐시 HIT에서도 보정
            video.dataset.cctvCode = cam.cctvCode || "";
        }
        return video;
    }

    function isCameraOnline(cam) {
        const status = String(cam?.status ?? "").toUpperCase();
        return status === "1" || status === "01" || status === "Y";
    }

    function getUiStreamState(cam) {
        if (!cam) return "offline";
        if (cam.__streamUiState) return cam.__streamUiState;
        return isCameraOnline(cam) ? "connecting" : "offline";
    }

    function getCctvState(cam) {
        return getUiStreamState(cam);
    }

    function setPlaceholderState(placeholder, state, cam) {
        if (!placeholder) return;
        placeholder.dataset.cctvState = state;
        placeholder.innerHTML = getCctvPlaceholderInnerHtml(
            state,
            cam?.name || cam?.cctvCode || "CAM"
        );
    }

    function getCctvPlaceholderInnerHtml(state, camId = "CAM 01") {
        const iconMap = {
            "no-signal": `
            <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="8" width="40" height="28" rx="3" stroke="#F5C842" stroke-width="2.5"/>
              <line x1="16" y1="36" x2="12" y2="44" stroke="#F5C842" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="32" y1="36" x2="36" y2="44" stroke="#F5C842" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="10" y1="44" x2="38" y2="44" stroke="#F5C842" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="8" y1="16" x2="40" y2="16" stroke="#F5C842" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.35"/>
              <line x1="8" y1="22" x2="40" y2="22" stroke="#F5C842" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.35"/>
              <line x1="8" y1="28" x2="40" y2="28" stroke="#F5C842" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.35"/>
            </svg>`,
            "disconnected": `
            <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="20" r="9" stroke="#E05C5C" stroke-width="2.5"/>
              <circle cx="24" cy="20" r="3.5" fill="#E05C5C" opacity="0.25"/>
              <line x1="6" y1="36" x2="16" y2="26" stroke="#E05C5C" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="32" y1="26" x2="42" y2="36" stroke="#E05C5C" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="36" y1="7" x2="12" y2="41" stroke="#E05C5C" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
            </svg>`,
            "offline": `
            <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="16" stroke="#888888" stroke-width="2.5"/>
              <line x1="24" y1="14" x2="24" y2="26" stroke="#888888" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="24" cy="31" r="2" fill="#888888"/>
            </svg>`,
            "connecting": `
            <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="16" stroke="#5BB8F5" stroke-width="2.5" stroke-dasharray="25 75" stroke-linecap="round"/>
              <circle cx="24" cy="24" r="8" stroke="#5BB8F5" stroke-width="2" opacity="0.25"/>
            </svg>`
        };

        const textMap = {
            "no-signal": {
                label: "NO SIGNAL",
                sub: "영상 신호를 수신하지 못하고 있습니다",
                badge: "SIGNAL LOST"
            },
            "disconnected": {
                label: "CAMERA DISCONNECTED",
                sub: "카메라 연결이 끊어졌습니다",
                badge: "SIGNAL LOST"
            },
            "offline": {
                label: "DEVICE OFFLINE",
                sub: "장치가 오프라인 상태입니다",
                badge: "OFFLINE"
            },
            "connecting": {
                label: `CONNECTING<span class="cctv-dots"></span>`,
                sub: "카메라에 연결 중입니다",
                badge: "CONNECTING"
            }
        };

        const t = textMap[state] || textMap["offline"];

        return `
        <div class="cctv-scanline"></div>
        <div class="cctv-rec">REC ●</div>

        <div class="cctv-body">
            <div class="cctv-icon">${iconMap[state] || iconMap["offline"]}</div>

            <div class="cctv-text-block">
                <p class="cctv-place-label">${t.label}</p>
                <p class="cctv-place-sub">${t.sub}</p>
            </div>

            <div class="cctv-status-badge">
                <div class="cctv-status-dot"></div>
                <span class="cctv-status-text">${t.badge}</span>
            </div>
        </div>
    `;
    }

    function createPlaceholder(cam) {
        const state = getCctvState(cam);

        const placeholder = document.createElement("div");
        placeholder.id = `placeholder-${cam.mountpointId}`;
        placeholder.className = "cctv-wrap cctv-placeholder";
        placeholder.dataset.cctvCode = cam.cctvCode || "";
        setPlaceholderState(placeholder, state, cam);

        return placeholder;
    }

    function emptySlotHtml() {
        return `
        <div class="cctv-wrap cctv-placeholder" data-cctv-state="offline">
            ${getCctvPlaceholderInnerHtml("offline", "EMPTY")}
        </div>
    `;
    }

    // const CCTV_PLACEHOLDER_HTML = `
    // <div class="cctv-placeholder" 
    //     style="
    //         width: 100%; height: 100%; background: var(--bs-black);
    //         display: flex; align-items: center; justify-content: center;
    //         color: white; font-weight: bold;
    //     ">
    //     <div style="text-align:center;">
    //         <i class="bi bi-camera-video-off"></i><br>
    //         <small>연결없음</small>
    //     </div>
    // </div>
    // `;

    // function createPlaceholder(cam) {
    //     log("createPlaceholder()", `placeholder-${cam.mountpointId}`);

    //     const placeholder = document.createElement("div");
    //     placeholder.id = `placeholder-${cam.mountpointId}`;
    //     placeholder.className = "cctv-placeholder";

    //     placeholder.dataset.cctvCode = cam.cctvCode || "";

    //     placeholder.style.cssText = `
    //         width: 100%; height: 100%; background: var(--bs-black);
    //         display: flex; align-items: center; justify-content: center;
    //         color: white; font-weight: bold;
    //     `;
    //     placeholder.innerHTML = `
    //         <div style="text-align:center;">
    //             <i class="bi bi-camera-video-off"></i><br>
    //             <small>연결없음</small>
    //         </div>
    //     `;

    //     return placeholder;
    // }

    // function emptySlotHtml() {
    //     return CCTV_PLACEHOLDER_HTML;
    // }

    function createOverlay() {
        const div = document.createElement("div");
        div.className = "cctv-overlay";
        return div;
    }

    function createControls(cam, video) {
        const div = document.createElement("div");
        div.className = "cctv-controls";

        const reconnectBtn = document.createElement("button");
        reconnectBtn.className = "cctv-control-btn";
        reconnectBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i>`;
        reconnectBtn.title = "재연결";

        reconnectBtn.addEventListener("click", async (e) => {
            e.stopPropagation();

            // 재-watch 방식
            try {
                await CCTVJanus.reconnectOne(cameras, cam.mountpointId);
                App.utils.showGlobalAlert(`${cam.name} 재연결 완료`, "success");
            } catch (err) {
                log("error", "reconnectOne error", err);
                App.utils.showGlobalAlert(`${cam.name} 재연결 실패`, "danger");
            }
        });

        const fullscreenBtn = document.createElement("button");
        fullscreenBtn.className = "cctv-control-btn";
        fullscreenBtn.innerHTML = `<i class="bi bi-arrows-fullscreen"></i>`;
        fullscreenBtn.title = "전체화면";

        fullscreenBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            if (!video.classList.contains("d-none")) {
                // 기존 방식: 스트리밍 중인 video를 그대로 확대 (끊김 없음)
                showFullscreen(video);
            } else {
                showConfirmModal("확인 요청", `${cam.name} 카메라에 연결된 영상이 없습니다.`);
            }
        });

        if (currentLayout === 1) {
            const sel = document.createElement("select");
            sel.className = "cctv-cam-select";
            sel.title = "카메라 선택";

            sel.innerHTML = cameras.map((c, i) => {
                const selected = (i === focusedCamIndex) ? "selected" : "";
                const name = (c?.name ?? `CAM-${i + 1}`);
                return `<option value="${i}" ${selected}>${name}</option>`;
            }).join("");

            // 클릭/변경 시 feed 클릭(active 토글) 방지
            sel.addEventListener("click", (e) => e.stopPropagation());
            sel.addEventListener("change", (e) => {
                e.stopPropagation();
                const idx = parseInt(sel.value, 10);
                setFocusedCameraByIndex(idx); // 아래에서 추가할 함수
            });

            div.appendChild(sel);
        }

        div.appendChild(reconnectBtn);
        div.appendChild(fullscreenBtn);
        return div;
    }

    function createLabel(cam) {
        const label = document.createElement("div");
        label.className = "cctv-label";

        const online = isCameraOnline(cam);
        const statusText = online ? "정상" : "오프라인";
        const statusClass = online ? "online" : "offline";

        label.innerHTML = `
            <span class="cctv-name">${cam.name}</span>
            <span class="cctv-status status-${statusClass} d-none">
                ${statusText}
            </span>
        `;
        return label;
    }

    // 카메라 선택
    function setFocusedCameraByIndex(idx) {
        if (typeof idx !== "number" || idx < 0 || idx >= cameras.length) return;
        focusedCamIndex = idx;

        if (currentLayout === 1) {
            renderGrid(1);
            window.CCTVJanus?.reconnectAll?.(cameras);
        }
    }

    /* ============================
     *   전체화면
     * ============================ */

    let fsCam = null; // 현재 fullscreen 대상 cam

    function openFullscreen(cam) {
        const fullscreenView = document.getElementById("fullscreenView");
        const fullscreenContent = fullscreenView.querySelector(".fullscreen-content");

        fsCam = cam;

        fullscreenContent.innerHTML = `
    <div class="w-100 h-100 position-relative" style="background: black;">
      <video id="fs-video" class="w-100 h-100" autoplay muted playsinline style="object-fit:contain;"></video>
      <div id="fs-placeholder" class="cctv-placeholder d-none"
           style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff;">
        <div style="text-align:center;">
          <i class="bi bi-camera-video-off"></i><br>
          <small>연결없음</small>
        </div>
      </div>
    </div>
  `;

        fullscreenView.classList.remove("d-none");
        fullscreenView.classList.add("active");
    }

    function attachStreamToFullscreen(cam, stream) {
        // 다른 cam의 stream이 섞이는 것 방지
        if (!fsCam || String(fsCam.cctvCode) !== String(cam.cctvCode)) return;

        const v = document.getElementById("fs-video");
        const ph = document.getElementById("fs-placeholder");
        if (!v) return;

        if (v.srcObject) {
            try { v.srcObject.getTracks().forEach(t => t.stop()); } catch (e) { }
        }
        v.srcObject = stream;

        ph?.classList.add("d-none");
        v.play().catch(() => { });
    }

    function showFullscreenPlaceholder(cam) {
        if (!fsCam || String(fsCam.cctvCode) !== String(cam.cctvCode)) return;
        const ph = document.getElementById("fs-placeholder");
        if (ph) ph.classList.remove("d-none");
    }

    function showFullscreen(videoEl) {

        const fullscreenView = document.getElementById('fullscreenView');
        const fullscreenContent = fullscreenView.querySelector('.fullscreen-content');

        if (fullscreenView.classList.contains('active')) {
            log("warn", "showFullscreen", "이미 전체화면 상태");
            return;
        }

        originalParent = videoEl.parentElement;
        originalElement = videoEl;

        videoEl.classList.remove('d-none');
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'contain';

        fullscreenContent.innerHTML = '';
        fullscreenContent.appendChild(videoEl);
        fullscreenView.classList.remove('d-none');
        fullscreenView.classList.add('active');
    }

    function closeFullscreen() {
        const fullscreenView = document.getElementById("fullscreenView");
        const fullscreenContent = fullscreenView.querySelector(".fullscreen-content");

        if (originalParent && originalElement) {
            fullscreenContent.innerHTML = "";
            originalParent.appendChild(originalElement);

            originalElement.style.width = "";
            originalElement.style.height = "";
            originalElement.style.objectFit = "";
        } else {
            fullscreenContent.innerHTML = "";
        }

        fullscreenView.classList.add("d-none");
        fullscreenView.classList.remove("active");

        originalParent = null;
        originalElement = null;

        log("debug", "전체화면 종료 완료(기존 방식)");
    }

    /* ============================
     *   상태 카운트
     * ============================ */
    function updateStatusCounts() {
        const online = cameras.filter(c => isCameraOnline(c)).length;
        const offline = cameras.length - online;

        log("debug", "updateStatusCounts()", `online=${online}, offline=${offline}`);

        document.getElementById("online-count").textContent = online;
        document.getElementById("warning-count").textContent = 0;
        document.getElementById("offline-count").textContent = offline;
    }

    /* ============================
     *   Placeholder 표시
     * ============================ */
    function syncVisibilityByMountId(mountId) {
        const video = document.getElementById(`video-${mountId}`);
        const placeholder = document.getElementById(`placeholder-${mountId}`);
        if (!video || !placeholder) return;

        const stream = video.srcObject;
        const hasLiveTrack = !!(stream
            && typeof stream.getTracks === "function"
            && stream.getTracks().some(track => track.readyState === "live"));
        const hasPlayed = video.dataset.hasPlayed === "1" || hasLiveTrack;

        if (hasPlayed) {
            video.dataset.hasPlayed = "1";
            video.classList.remove("d-none");
            placeholder.classList.add("d-none");
            video.play().catch(() => { });
        } else {
            video.classList.add("d-none");
            placeholder.classList.remove("d-none");
        }
    }

    function showPlaceholder(cam, opts = {}) {
        log("debug", "showPlaceholder()", cam?.name);
        cam.__streamDisplayPending = false;

        const video = document.getElementById(`video-${cam.mountpointId}`);
        const placeholder = document.getElementById(`placeholder-${cam.mountpointId}`);

        if (video) {
            if (video._watchdog) {
                clearInterval(video._watchdog);
                video._watchdog = null;
            }
            if (video._stallTimer) {
                clearTimeout(video._stallTimer);
                video._stallTimer = null;
            }
            video.classList.add("d-none");
            // 다음 재연결 시 영상 스트리밍 전까지 placeholder 표시를 위한 초기화
            video.dataset.hasPlayed = "0";
            if (opts.clearSrcObject && video.srcObject) {
                try { video.srcObject.getTracks().forEach(t => t.stop()); } catch (e) { }
                video.srcObject = null;
            }
        }

        if (placeholder) {
            setPlaceholderState(placeholder, getCctvState(cam), cam);
            placeholder.classList.remove("d-none");
        }

        if (opts.report !== false) {
            reportStatusCam(cam, 0);
        }
    }

    function prepareReconnect(cam) {
        cam.__janusConnecting = true;
        cam.__streamUiState = "connecting";
        const placeholder = document.getElementById(`placeholder-${cam.mountpointId}`);
        if (placeholder) {
            setPlaceholderState(placeholder, "connecting", cam);
        }
        showPlaceholder(cam, { clearSrcObject: true, report: false });
    }

    function showAllPlaceholders(cameraList) {
        (cameraList || cameras || []).forEach(c => {
            try { prepareReconnect(c); } catch (e) { }
        });
    }

    async function reportStatusCam(cam, statusCam) {
        if (!cam?.locationCode || !cam?.cctvCode) return;

        const payload = {
            locationCode: String(cam.locationCode),
            cctvCode: String(cam.cctvCode),
            statusCam: Number(statusCam),
        };

        const res = await fetch("/api/cctv/status", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            log("warn", "reportStatusCam failed", {
                status: res.status,
                body: await res.text().catch(() => "")
            });
        }
    }

    async function switchCamToHighAndReconnect(cam) {
        // 기본값 저장(없으면 생성)
        if (cam.__defaultMountpointId === undefined) cam.__defaultMountpointId = cam.mountpointId ?? null;
        if (cam.__defaultRtspUrl === undefined) cam.__defaultRtspUrl = cam.lowRtspUrl || cam.highRtspUrl || null;

        const highMp = cam.highMountpointId ?? null;
        const highUrl = cam.highRtspUrl ?? null;

        const defMp = cam.__defaultMountpointId ?? null;
        const defUrl = cam.__defaultRtspUrl ?? null;

        // HIGH 우선, 없으면 기본
        const chosenMp = (highMp && highUrl) ? highMp : defMp;
        const chosenUrl = (highMp && highUrl) ? highUrl : defUrl;

        // 둘 중 하나라도 없으면 스트리밍 요청 막기
        if (!chosenMp || !chosenUrl) {
            log("warn", "switchCamToHighAndReconnect blocked", {
                name: cam?.name, chosenMp, chosenUrl
            });
            CCTVLayout.showPlaceholder(cam);
            return;
        }

        // cam.mountpointId를 HIGH(또는 기본)으로 갱신
        cam.mountpointId = chosenMp;
        cam.__streamBlocked = false;
        cam.__streamUsed = (highMp && highUrl) ? "high" : "default";

        // 해당 카메라만 재연결 (전체 reconnectAll 말고)
        await CCTVJanus.reconnectOne(cameras, cam.mountpointId);
    }

    /* ============================
     *   스트림 연결
     * ============================ */
    function attachStreamToVideo(cam, stream) {
        log("debug", "attachStreamToVideo()", cam.name);
        const traceStartedAt = cam?.__streamTraceStartedAt || Date.now();

        const videoEl =
            document.querySelector(`video[data-cctv-code="${cam.cctvCode}"]`) ||
            document.getElementById(`video-${cam.mountpointId}`); // fallback

        const placeholder =
            document.querySelector(`div.cctv-placeholder[data-cctv-code="${cam.cctvCode}"]`) ||
            document.getElementById(`placeholder-${cam.mountpointId}`); // fallback

        if (!videoEl) {
            log("error", "Video element 없음", {
                expectedCctvCode: cam.cctvCode,
                mountpointId: cam.mountpointId,
            });
            return;
        }

        videoEl.dataset.hasPlayed = "0";
        videoEl.classList.add("d-none");
        placeholder?.classList.remove("d-none");

        if (videoEl.srcObject) {
            try { videoEl.srcObject.getTracks().forEach(t => t.stop()); } catch (e) { }
        }

        videoEl.srcObject = stream;
        videoEl._traceStartedAt = traceStartedAt;
        videoEl._traceKey = String(cam.mountpointId);
        log("debug", "stream srcObject assigned", `key=${cam.mountpointId} tracks=${stream.getTracks().length} +${Date.now() - traceStartedAt}ms`);


        if (!videoEl.dataset.statusBound) {
            videoEl.dataset.statusBound = "1";

            videoEl.addEventListener("loadedmetadata", () => {
                const elapsed = Date.now() - (videoEl._traceStartedAt || Date.now());
                log("debug", "stream loadedmetadata", `key=${videoEl._traceKey} readyState=${videoEl.readyState} +${elapsed}ms`);
            });

            videoEl.addEventListener("canplay", () => {
                const elapsed = Date.now() - (videoEl._traceStartedAt || Date.now());
                log("debug", "stream canplay", `key=${videoEl._traceKey} readyState=${videoEl.readyState} +${elapsed}ms`);
            });

            videoEl.addEventListener("playing", () => {
                log("debug", "video playing (confirmed)", cam.name);
                const elapsed = Date.now() - (videoEl._traceStartedAt || Date.now());
                log("debug", "stream playing", `key=${videoEl._traceKey} currentTime=${videoEl.currentTime} +${elapsed}ms`);
                cam.__janusConnecting = false;
                cam.__streamDisplayPending = false;
                cam.__streamDisplayedAt = Date.now();
                cam.__streamUiState = "connected";

                // play 성공 때만 placeholder 제거
                videoEl.dataset.hasPlayed = "1";
                videoEl.classList.remove("d-none");
                placeholder?.classList.add("d-none");

                startWatchdog(cam, videoEl);
                reportStatusCam(cam, 1);
            });

            const failSoft = () => {
                if (videoEl.dataset.hasPlayed !== "1") {
                    cam.__streamUiState = isCameraOnline(cam) ? "connecting" : "offline";
                    showPlaceholder(cam, { report: false });
                    return;
                }
                // 재생 이력이 있는데 stalled되면 3초 후 재연결
                if (!videoEl._stallTimer) {
                    videoEl._stallTimer = setTimeout(() => {
                        videoEl._stallTimer = null;
                        log("warn", "stalled auto reconnect", cam.name);
                        scheduleReconnect(cam, String(cam.mountpointId), 5000);
                    }, 3000);
                }
            };

            const failHard = () => {
                log("debug", "video not playable (ended/error)", cam.name);
                cam.__streamUiState = isCameraOnline(cam) ? "disconnected" : "offline";
                showPlaceholder(cam);
            };

            videoEl.addEventListener("stalled", failSoft);
            videoEl.addEventListener("waiting", failSoft);
            videoEl.addEventListener("ended", failHard);
            videoEl.addEventListener("error", failHard);
        }


        videoEl.play()
            .then(() => {
                log("debug", "영상 재생 성공", cam.name);
                const elapsed = Date.now() - (videoEl._traceStartedAt || Date.now());
                log("debug", "stream play resolved", `key=${videoEl._traceKey} +${elapsed}ms`);
            }).catch(err => {
                log("warn", "자동 재생 실패", err);
            });

        stream.getTracks()
            .forEach(track => {
                track.onended = () => {
                    log("debug", "track.onended", cam.name);
                    cam.__streamUiState = isCameraOnline(cam) ? "disconnected" : "offline";
                    showPlaceholder(cam);
                };
            });
    }

    function startWatchdog(cam, videoEl) {
        let lastTime = -1;
        let frozenCount = 0;

        const timer = setInterval(() => {
            // 영상이 재생 중이 아니면 watchdog 불필요
            if (videoEl.dataset.hasPlayed !== "1") return;
            if (videoEl.paused || videoEl.ended) return;

            const current = videoEl.currentTime;
            if (current === lastTime) {
                frozenCount++;
                if (frozenCount >= 3) { // 9초 연속 동결
                    log("warn", "watchdog reconnect", cam.name);
                    clearInterval(timer);
                    videoEl._watchdog = null;
                    scheduleReconnect(cam, String(cam.mountpointId), 8000);
                }
            } else {
                frozenCount = 0;
            }
            lastTime = current;
        }, 3000);

        // 기존 watchdog이 있으면 정리
        if (videoEl._watchdog) clearInterval(videoEl._watchdog);
        videoEl._watchdog = timer;
    }

    function scheduleReconnect(cam, key, delayMs = 3000) {
        if (reconnectTimers[key]) return; // 이미 예약됨

        const startedAt = cam?.__janusConnectStartedAt || 0;
        const connectAge = Date.now() - startedAt;
        const graceLeft = cam?.__janusConnecting ? Math.max(0, 15000 - connectAge) : 0;
        const effectiveDelay = Math.max(delayMs, graceLeft + 1000);

        log("debug", "scheduleReconnect", `key=${key}, ${effectiveDelay}ms 후 재연결 예약`);
        reconnectTimers[key] = setTimeout(async () => {
            delete reconnectTimers[key];
            if (!window.CCTVJanus?.reconnectOne) {
                log("warn", "scheduleReconnect", "CCTVJanus.reconnectOne 없음, 무시");
                return;
            }
            try {
                await window.CCTVJanus.reconnectOne(cameras, cam.mountpointId);
            } catch (e) {
                log("error", "scheduleReconnect 실패", { key, error: e });
            }
        }, effectiveDelay);
    }

    /**
     * 모든 video srcObject 트랙 정지 + 캐시 초기화
     * 페이지 이탈 시 호출
     */
    function destroy() {

        // 타이머 정리
        for (const k in reconnectTimers) {
            clearTimeout(reconnectTimers[k]);
            delete reconnectTimers[k];
        }

        // 모든 video 트랙 정지
        for (const mountId in videoCache) {
            const video = videoCache[mountId];
            try {
                if (video._watchdog) {
                    clearInterval(video._watchdog);
                    video._watchdog = null;
                }
                if (video._stallTimer) {
                    clearTimeout(video._stallTimer);
                    video._stallTimer = null;
                }
                video.srcObject?.getTracks().forEach(t => t.stop());
                video.srcObject = null;
            } catch (e) { }
        }

        document.querySelectorAll("video[data-cctv-code]").forEach(video => {
            if (video._watchdog) {
                clearInterval(video._watchdog);
                video._watchdog = null;
            }
            if (video._stallTimer) {
                clearTimeout(video._stallTimer);
                video._stallTimer = null;
            }
        });

        videoCache = {};
        cameras = [];

        // fullscreen 열려있으면 닫기
        const fullView = document.getElementById("fullscreenView");
        if (fullView?.classList.contains("active")) {
            closeFullscreen();
        }

        log("debug", "cctv destroy");
    }

    return {
        init,
        renderGrid,
        getVisibleCameras,
        attachStreamToVideo,
        showPlaceholder,
        setFocusedCameraByIndex,
        closeFullscreen,
        openFullscreen,
        attachStreamToFullscreen,
        showFullscreenPlaceholder,
        scheduleReconnect,
        destroy
    };

})();
