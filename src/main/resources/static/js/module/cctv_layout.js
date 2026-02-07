window.CCTVLayout = (function () {

    let cameras = [];
    let videoCache = {};
    let originalParent = null;
    let originalElement = null;

    let currentLayout = 4;
    let focusedCamIndex = 0;

    let fullscreenEventsBound = false;

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
    function renderGrid(layout) {
        log("renderGrid()", `layout = ${layout}`);
        currentLayout = layout;

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
    }

    function createFeed(index) {
        const feed = document.createElement("div");
        feed.className = "cctv-feed";

        let camIndex = index;
        if (currentLayout === 1) camIndex = focusedCamIndex;

        if (camIndex >= cameras.length) {
            log("createFeed()", `index=${index} → 빈 슬롯`);
            feed.innerHTML = emptySlotHtml();
            return feed;
        }

        // if (index >= cameras.length) {
        //     log("createFeed()", `index=${index} → 빈 슬롯`);
        //     feed.innerHTML = emptySlotHtml();
        //     return feed;
        // }

        const cam = cameras[camIndex];

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

        const reconnectBtn = document.createElement("button");
        reconnectBtn.className = "cctv-control-btn";
        reconnectBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i>`;
        reconnectBtn.title = "재연결";

        reconnectBtn.addEventListener("click", async (e) => {
            e.stopPropagation();

            // 프론트 재-watch 방식 (cctv_janus.js에 reconnectOne export 필요)
            try {
                await CCTVJanus.reconnectOne(cameras, cam.mountpointId);
                // showToast(`${cam.name} 재연결 완료`, "success");
                App.utils.showGlobalAlert(`${cam.name} 재연결 완료`, "success");
            } catch (err) {
                console.error("reconnectOne error", err);
                // showToast(`${cam.name} 재연결 실패`, "danger");
                App.utils.showGlobalAlert(`${cam.name} 재연결 실패`, "danger");
            }
        });

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

        if (currentLayout === 1) {
            const sel = document.createElement("select");
            sel.className = "cctv-cam-select"; // CSS는 아래에 제공
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

        const statusText = cam.status === "1" ? "정상" : "오프라인";
        const statusClass = cam.status === "1" ? "online" : "offline";

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

            // 전환된 카메라 스트림 연결 안정화
            const cam = cameras[focusedCamIndex];
            if (window.CCTVJanus?.reconnectOne) {
                window.CCTVJanus.reconnectOne(cameras, cam.mountpointId).catch(console.error);
            }
        }
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

        const fullView = document.getElementById("fullscreenView");
        const content = fullView.querySelector(".fullscreen-content");

        if (originalParent && originalElement) {
            const mountId = originalElement.id.replace("video-", "");
            const placeholder = document.getElementById(`placeholder-${mountId}`);

            // 원래 자리 복귀
            originalParent.appendChild(originalElement);

            syncVisibilityByMountId(mountId);

            // video 표시 보장
            // originalElement.classList.remove("d-none");
            // originalElement.style.display = "block";

            // placeholder 숨기기
            // if (placeholder) {
            //     placeholder.classList.add("d-none");
            //     placeholder.style.display = "none";
            // }
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
    function syncVisibilityByMountId(mountId) {
        const video = document.getElementById(`video-${mountId}`);
        const placeholder = document.getElementById(`placeholder-${mountId}`);
        if (!video || !placeholder) return;

        const hasPlayed = video.dataset.hasPlayed === "1";
        if (hasPlayed) {
            video.classList.remove("d-none");
            placeholder.classList.add("d-none");
        } else {
            video.classList.add("d-none");
            placeholder.classList.remove("d-none");
        }
    }

    function showPlaceholder(cam, opts = {}) {
        log("showPlaceholder()", cam?.name);

        const video = document.getElementById(`video-${cam.mountpointId}`);
        const placeholder = document.getElementById(`placeholder-${cam.mountpointId}`);

        if (video) {
            video.classList.add("d-none");
            // 다음 재연결 시 영상 스트리밍 전까지 placeholder 표시를 위한 초기화
            video.dataset.hasPlayed = "0";
            if (opts.clearSrcObject && video.srcObject) {
                try { video.srcObject.getTracks().forEach(t => t.stop()); } catch (e) { }
                video.srcObject = null;
            }
        }

        if (placeholder) placeholder.classList.remove("d-none");

        if (opts.report !== false) {
            reportStatusCam(cam, 0);
        }
    }

    function prepareReconnect(cam) {
        showPlaceholder(cam, { clearSrcObject: true, report: false });
    }

    function showAllPlaceholders(cameraList) {
        (cameraList || cameras || []).forEach(c => {
            try { prepareReconnect(c); } catch (e) { }
        });
    }

    async function reportStatusCam(cam, statusCam) {
        if (!cam.locationCode || !cam.cctvCode) {
            console.warn("locationCode/cctvCode 없음", cam);
            return;
        }
        await fetch(
            `/api/cctv/status?locationCode=${encodeURIComponent(cam.locationCode)}`
            + `&cctvCode=${encodeURIComponent(cam.cctvCode)}`
            + `&statusCam=${statusCam}`,
            { method: "POST" }
        );
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

        // placeholder 상태 초기화
        videoEl.dataset.hasPlayed = "0";
        videoEl.classList.add("d-none");
        placeholder?.classList.remove("d-none");


        if (videoEl.srcObject) {
            log("기존 stream stop()", "");
            try { videoEl.srcObject.getTracks().forEach(t => t.stop()); } catch (e) { }
        }

        videoEl.srcObject = stream;

        if (!videoEl.dataset.statusBound) {
            videoEl.dataset.statusBound = "1";

            videoEl.addEventListener("playing", () => {
                log("▶️ video playing (confirmed)", cam.name);

                // play 성공 때만 placeholder 제거
                videoEl.dataset.hasPlayed = "1";
                videoEl.classList.remove("d-none");
                placeholder?.classList.add("d-none");

                reportStatusCam(cam, 1);
            });

            const failSoft = () => {
                // waiting/stalled는 정상 재생 중에도 잠깐 발생 가능
                // 아직 한 번도 재생되지 않은 상태일 때만 placeholder 유지
                if (videoEl.dataset.hasPlayed !== "1") {
                    log("video not playable (pre-play)", cam.name);
                    showPlaceholder(cam, { report: false });
                }
            };

            const failHard = () => {
                log("video not playable (ended/error)", cam.name);
                showPlaceholder(cam);
            };

            videoEl.addEventListener("stalled", failSoft);
            videoEl.addEventListener("waiting", failSoft);
            videoEl.addEventListener("ended", failHard);
            videoEl.addEventListener("error", failHard);
        }


        videoEl.play()
            .then(() => {
                log("영상 재생 성공", cam.name);
            }).catch(err => {
                console.warn("자동 재생 실패:", err);
            });

        stream.getTracks()
            .forEach(track => {
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
        showPlaceholder,
        setFocusedCameraByIndex,
        closeFullscreen
    };

})();
