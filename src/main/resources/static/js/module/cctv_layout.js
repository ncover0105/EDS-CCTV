window.CCTVLayout = (function () {

    let cameras = [];
    let videoCache = {};
    let originalParent = null;
    let originalElement = null;

    let currentLayout = 4;

    /* ============================
     *   공통 LOG 함수
     * ============================ */
    function log(action, detail = "") {
        console.log(`📌 [CCTVLayout] ${action}`, detail);
    }

    /* ============================
     *   연결된 카메라 수 계산
     *   - Janus handle._hasVideo(true) 기반
     *   - 없으면 status(정상) 기반, 그것도 없으면 cameras.length
     * ============================ */
    function getConnectedCameraCount() {
        try {
            const handles = window.CCTVJanus?.pluginHandles;
            if (handles && typeof handles === "object") {
                const connected = Object.values(handles).filter(h => h && h._hasVideo === true).length;
                return connected;
            }
        } catch (e) {
            // ignore
        }

        // fallback 1) status === "1"
        const statusBased = cameras.filter(c => c.status === "1").length;
        if (statusBased > 0) return statusBased;

        // fallback 2) 등록된 전체 카메라 수
        return cameras.length;
    }

    function getMaxLayoutByCameraCount(count) {
        if (count <= 4) return 4;
        if (count <= 9) return 9;
        return 16; // 10개 이상은 16까지
    }

    function clampLayout(layout, connectedCount = getConnectedCameraCount()) {
        const maxLayout = getMaxLayoutByCameraCount(connectedCount);
        const allowed = [4, 9, 16];

        let normalized = allowed.includes(layout) ? layout : 4;
        if (normalized > maxLayout) normalized = maxLayout;

        return normalized;
    }

    function updateLayoutButtons(connectedCount = getConnectedCameraCount()) {
        const maxLayout = getMaxLayoutByCameraCount(connectedCount);

        document.querySelectorAll("[data-layout]").forEach(btn => {
            const v = parseInt(btn.getAttribute("data-layout"), 10);
            const disabled = v > maxLayout;

            btn.disabled = disabled;
            btn.classList.toggle("disabled", disabled);
            btn.setAttribute("aria-disabled", disabled ? "true" : "false");
        });
    }

    /* ============================
     *   연결 수에 맞춰 레이아웃 자동 변경
     * ============================ */
    function syncLayoutToConnectedCameras() {
        const connected = getConnectedCameraCount();
        const desired = getMaxLayoutByCameraCount(connected);

        updateLayoutButtons(connected);

        // 현재 레이아웃이 연결수보다 크면 자동으로 내려줌
        const clamped = clampLayout(currentLayout, connected);
        if (clamped !== currentLayout || desired !== currentLayout) {
            // 정책: "항상 연결 수 기준 최대 레이아웃으로 맞춘다"
            // (원하시면: currentLayout 유지 + 초과만 clamp로만 동작하도록 변경 가능)
            renderGrid(desired);
        }
    }

    /* ============================
     *   초기화
     * ============================ */
    function init(cameraList) {
        cameras = cameraList;
        log("init()", `카메라 개수 = ${cameras.length}`);

        // 최초 렌더 (등록 카메라 수 기준 임시)
        renderGrid(cameras.length > 4 ? 9 : 4);
        bindEvents();

        // 실제 연결(영상) 수 기준으로 한번 더 정렬
        syncLayoutToConnectedCameras();
    }

    function bindEvents() {
        document.querySelectorAll("[data-layout]").forEach(btn => {
            btn.addEventListener("click", () => {
                const layout = parseInt(btn.getAttribute("data-layout"), 10);
                log("Layout 변경(요청)", layout);

                // 수동 클릭도 연결 수 기준으로 clamp
                const connected = getConnectedCameraCount();
                const clamped = clampLayout(layout, connected);

                renderGrid(clamped);
            });
        });

        const closeBtn = document.getElementById("closefullScreen");
        if (closeBtn) closeBtn.addEventListener("click", closeFullscreen);

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") closeFullscreen();
        });
    }

    /* ============================
     *      GRID RENDERING
     * ============================ */
    function renderGrid(layout) {
        const connected = getConnectedCameraCount();
        const finalLayout = clampLayout(layout, connected);

        currentLayout = finalLayout;
        log("renderGrid()", `layout=${layout} -> final=${finalLayout} (connected=${connected})`);

        updateLayoutButtons(connected);

        const container = document.getElementById("cctv-container");
        container.innerHTML = "";

        const grid = document.createElement("div");
        grid.className = "cctv-grid";

        if (finalLayout === 4) grid.classList.add("grid-2x2");
        else if (finalLayout === 9) grid.classList.add("grid-3x3");
        else if (finalLayout === 16) grid.classList.add("grid-4x4");

        for (let i = 0; i < finalLayout; i++) {
            grid.appendChild(createFeed(i));
        }

        container.appendChild(grid);
    }

    function createFeed(index) {
        const feed = document.createElement("div");
        feed.className = "cctv-feed";

        if (index >= cameras.length) {
            log("createFeed()", `index=${index} → 빈 슬롯`);
            feed.innerHTML = emptySlotHtml();
            return feed;
        }

        const cam = cameras[index];
        log("createFeed()", `카메라=${cam.name}`);

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

        if (video) {
            log("createVideo()", `캐시 HIT → video-${cam.mountpointId}`);
        } else {
            log("createVideo()", `캐시 MISS → 생성: video-${cam.mountpointId}`);

            video = document.createElement("video");
            video.id = `video-${cam.mountpointId}`;
            video.className = "w-100 h-100 d-none";
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;

            videoCache[cam.mountpointId] = video;
        }
        return video;
    }

    const CCTV_PLACEHOLDER_HTML = `
    <div class="cctv-placeholder" 
        style="
            width: 100%; height: 100%; background: var(--bs-black);
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: bold;
        ">
        <div style="text-align:center;">
            <i class="bi bi-camera-video-off"></i><br>
            <small>연결없음</small>
        </div>
    </div>
    `;

    function createPlaceholder(cam) {
        log("createPlaceholder()", `placeholder-${cam.mountpointId}`);

        const placeholder = document.createElement("div");
        placeholder.id = `placeholder-${cam.mountpointId}`;
        placeholder.className = "cctv-placeholder";
        placeholder.style.cssText = `
            width: 100%; height: 100%; background: var(--bs-black);
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: bold;
        `;
        placeholder.innerHTML = `
            <div style="text-align:center;">
                <i class="bi bi-camera-video-off"></i><br>
                <small>연결없음</small>
            </div>
        `;

        return placeholder;
    }

    function emptySlotHtml() {
        return CCTV_PLACEHOLDER_HTML;
    }

    function createOverlay() {
        const div = document.createElement("div");
        div.className = "cctv-overlay";
        return div;
    }

    function createControls(cam, video) {
        const div = document.createElement("div");
        div.className = "cctv-controls";

        const fullscreenBtn = document.createElement("button");
        fullscreenBtn.className = "cctv-control-btn";
        fullscreenBtn.innerHTML = `<i class="bi bi-arrows-fullscreen"></i>`;
        fullscreenBtn.title = "전체화면";

        fullscreenBtn.addEventListener('click', e => {
            e.stopPropagation();
            console.log(`[FULLSCREEN BTN CLICK] camera: ${cam.name}`);

            if (!video.classList.contains('d-none')) {
                console.log(`[FULLSCREEN START] ${cam.name} 영상 표시 중`);
                showFullscreen(video);
            } else {
                console.warn(`[FULLSCREEN FAIL] ${cam.name} 영상 없음`);
                showConfirmModal("확인 요청", `${cam.name} 카메라에 연결된 영상이 없습니다.`);
            }
        });

        div.appendChild(fullscreenBtn);
        return div;
    }

    function createLabel(cam) {
        const label = document.createElement("div");
        label.className = "cctv-label";

        const statusText = cam.status === "1" ? "정상" : "오프라인";
        const statusClass = cam.status === "1" ? "online" : "offline";

        label.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${cam.name}</div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="dot dot-${statusClass}"></span>
                <span>${statusText}</span>
            </div>
        `;
        return label;
    }

    /* ============================
     *   전체화면
     * ============================ */
    function showFullscreen(videoEl) {
        const fullscreenView = document.getElementById('fullscreenView');
        const fullscreenContent = fullscreenView.querySelector('.fullscreen-content');

        if (fullscreenView.classList.contains('active')) {
            console.warn("[showFullscreen] 이미 전체화면 상태");
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
        log("closeFullscreen()");

        const fullView = document.getElementById("fullscreenView");
        const content = fullView.querySelector(".fullscreen-content");

        if (originalParent && originalElement) {
            const mountId = originalElement.id.replace("video-", "");
            const placeholder = document.getElementById(`placeholder-${mountId}`);

            log("전체화면 → 원래 자리 복귀", originalElement.id);

            originalParent.appendChild(originalElement);

            originalElement.classList.remove("d-none");
            originalElement.style.display = "block";

            if (placeholder) {
                placeholder.classList.add("d-none");
                placeholder.style.display = "none";
            }
        }

        content.innerHTML = "";
        fullView.classList.add("d-none");
        fullView.classList.remove("active");

        originalParent = null;
        originalElement = null;

        log("전체화면 종료 완료");
    }

    /* ============================
     *   Placeholder 표시
     * ============================ */
    function showPlaceholder(cam) {
        log("showPlaceholder()", cam.name);

        const video = document.getElementById(`video-${cam.mountpointId}`);
        const placeholder = document.getElementById(`placeholder-${cam.mountpointId}`);

        if (video) video.classList.add("d-none");
        if (placeholder) placeholder.classList.remove("d-none");

        // 끊겼을 때도 자동 레이아웃 반영
        syncLayoutToConnectedCameras();
    }

    /* ============================
     *   스트림 연결
     * ============================ */
    function attachStreamToVideo(cam, stream) {
        log("attachStreamToVideo()", cam.name);

        const videoEl = document.getElementById(`video-${cam.mountpointId}`);
        const placeholder = document.getElementById(`placeholder-${cam.mountpointId}`);

        if (!videoEl) {
            console.error("❌ Video element 없음:", `video-${cam.mountpointId}`);
            return;
        }

        if (videoEl.srcObject) {
            log("기존 stream stop()", "");
            videoEl.srcObject.getTracks().forEach(t => t.stop());
        }

        videoEl.srcObject = stream;

        videoEl.play().then(() => {
            log("영상 재생 성공", cam.name);
            videoEl.classList.remove("d-none");
            placeholder?.classList.add("d-none");

            // 연결 성공 시 자동 레이아웃 반영
            syncLayoutToConnectedCameras();
        }).catch(err => {
            console.warn("⚠️ 자동 재생 실패:", err);
        });
    }

    // confirm modal (기존 코드에서 사용 중이면 그대로 유지)
    function showConfirmModal(title, message) {
        alert(`${title}\n${message}`);
    }

    return {
        init,
        renderGrid,
        attachStreamToVideo,
        showPlaceholder,

        // 신규 공개 API
        getConnectedCameraCount,
        syncLayoutToConnectedCameras
    };

})();
