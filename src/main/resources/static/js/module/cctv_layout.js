window.CCTVLayout = (function () {

    let cameras = [];
    let videoCache = {};
    let originalParent = null;
    let originalElement = null;

    /* ============================
     *   공통 LOG 함수
     * ============================ */
    function log(action, detail = "") {
        console.log(`📌 [CCTVLayout] ${action}`, detail);
    }

    /* ============================
     *   초기화
     * ============================ */
    function init(cameraList) {
        cameras = cameraList;
        log("init()", `카메라 개수 = ${cameras.length}`);

        renderGrid(cameras.length > 4 ? 9 : 4);
        bindEvents();
        // updateStatusCounts();
    }

    function bindEvents() {
        document.querySelectorAll("[data-layout]").forEach(btn => {
            btn.addEventListener("click", () => {
                const layout = parseInt(btn.getAttribute("data-layout"));
                log("Layout 변경", layout);
                renderGrid(layout);
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
        log("renderGrid()", `layout = ${layout}`);

        const container = document.getElementById("cctv-container");
        container.innerHTML = "";

        const grid = document.createElement("div");
        grid.className = "cctv-grid";

        if (layout === 4) grid.classList.add("grid-2x2");
        else if (layout === 9) grid.classList.add("grid-3x3");
        else if (layout === 16) grid.classList.add("grid-4x4");

        for (let i = 0; i < layout; i++) {
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
            <span class="cctv-name">${cam.name}</span>
            <span class="cctv-status status-${statusClass}">
                ${statusText}
            </span>
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
    
            // 원래 자리 복귀
            originalParent.appendChild(originalElement);
    
            // video 표시 보장
            originalElement.classList.remove("d-none");
            originalElement.style.display = "block";
    
            // placeholder 숨기기
            if (placeholder) {
                placeholder.classList.add("d-none");
                placeholder.style.display = "none";
            }
        }
    
        // fullscreen 영역 초기화
        content.innerHTML = "";
        fullView.classList.add("d-none");
        fullView.classList.remove("active");
    
        originalParent = null;
        originalElement = null;
    
        log("전체화면 종료 완료");
    }
    

    /* ============================
     *   상태 카운트
     * ============================ */
    function updateStatusCounts() {
        const online = cameras.filter(c => c.status === "1").length;
        const offline = cameras.length - online;

        log("updateStatusCounts()", `online=${online}, offline=${offline}`);

        document.getElementById("online-count").textContent = online;
        document.getElementById("warning-count").textContent = 0;
        document.getElementById("offline-count").textContent = offline;
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
        }).catch(err => {
            console.warn("⚠️ 자동 재생 실패:", err);
        });

        stream.getTracks().forEach(track => {
            track.onended = () => {
                log("track.onended", cam.name);
                showPlaceholder(cam);
            };
        });
    }

    return {
        init,
        renderGrid,
        attachStreamToVideo,
        showPlaceholder
    };

})();
