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
    // ===== 스트림 선택 유틸 =====
    function ensureDefaults(cam) {
        // 최초 1회만 기본값을 저장(서버가 내려준 mountpointId = 기본)
        if (cam.__defaultMountpointId === undefined) cam.__defaultMountpointId = cam.mountpointId ?? null;

        // 기본 URL은 low/high 중 존재하는 걸로 잡아둠(서버 데이터 형태에 맞춤)
        if (cam.__defaultRtspUrl === undefined) {
            cam.__defaultRtspUrl = cam.lowRtspUrl || cam.highRtspUrl || null;
        }
    }

    // prefer: "low" | "high"
    function pickStream(cam, prefer) {
        ensureDefaults(cam);

        const low = { mp: cam.lowMountpointId ?? null, url: cam.lowRtspUrl ?? null };
        const high = { mp: cam.highMountpointId ?? null, url: cam.highRtspUrl ?? null };
        const def = { mp: cam.__defaultMountpointId ?? null, url: cam.__defaultRtspUrl ?? null };

        let chosen = def;
        if (prefer === "low") chosen = (low.mp && low.url) ? low : def;
        if (prefer === "high") chosen = (high.mp && high.url) ? high : def;

        // 최종 검증: mp/url 둘 중 하나라도 없으면 “스트리밍 금지”
        const ok = !!(chosen.mp && chosen.url);
        return { ok, mountpointId: chosen.mp, rtspUrl: chosen.url, used: (chosen === low ? "low" : chosen === high ? "high" : "default") };
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
        log("renderGrid()", `layout = ${layout}`);
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

        if (cam.__streamBlocked || !cam.mountpointId) {
            log("createFeed()", `스트리밍 차단: ${cam.name} (used=${cam.__streamUsed})`);
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

            // ✅ 고정 키로 DOM 탐색 가능하게
            video.dataset.cctvCode = cam.cctvCode || "";

            videoCache[cam.mountpointId] = video;
        } else {
            // ✅ 캐시 HIT에서도 보정
            video.dataset.cctvCode = cam.cctvCode || "";
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

        placeholder.dataset.cctvCode = cam.cctvCode || "";

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

            // 재-watch 방식
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

        fullscreenBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            if (!video.classList.contains("d-none")) {
                // ✅ 기존 방식: 스트리밍 중인 video를 그대로 확대 (끊김 없음)
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

        log("전체화면 종료 완료(기존 방식)");
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
            console.warn("[reportStatusCam] failed:", res.status, await res.text().catch(() => ""));
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

        // 최종 검증: 둘 중 하나라도 없으면 스트리밍 요청 막기
        if (!chosenMp || !chosenUrl) {
            console.warn("[switchCamToHighAndReconnect] blocked (no mp/url)", {
                name: cam?.name, chosenMp, chosenUrl
            });
            CCTVLayout.showPlaceholder(cam);
            return;
        }

        // cam.mountpointId를 HIGH(또는 기본)으로 갱신
        cam.mountpointId = chosenMp;
        cam.__streamBlocked = false;
        cam.__streamUsed = (highMp && highUrl) ? "high" : "default";

        // ✅ 해당 카메라만 재연결 (전체 reconnectAll 말고)
        await CCTVJanus.reconnectOne(cameras, cam.mountpointId);
    }

    /* ============================
     *   스트림 연결
     * ============================ */
    function attachStreamToVideo(cam, stream) {
        log("attachStreamToVideo()", cam.name);

        const videoEl =
            document.querySelector(`video[data-cctv-code="${cam.cctvCode}"]`) ||
            document.getElementById(`video-${cam.mountpointId}`); // fallback

        const placeholder =
            document.querySelector(`div.cctv-placeholder[data-cctv-code="${cam.cctvCode}"]`) ||
            document.getElementById(`placeholder-${cam.mountpointId}`); // fallback

        if (!videoEl) {
            console.error("❌ Video element 없음:", {
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

    /**
     * 모든 video srcObject 트랙 정지 + 캐시 초기화
     * 페이지 이탈 시 호출
     */
    function destroy() {
        console.log("[CCTVLayout] destroy() 시작");

        // 모든 video 트랙 정지
        for (const mountId in videoCache) {
            const video = videoCache[mountId];
            try {
                video.srcObject?.getTracks().forEach(t => t.stop());
                video.srcObject = null;
            } catch (e) { }
        }

        videoCache = {};
        cameras = [];

        // fullscreen 열려있으면 닫기
        const fullView = document.getElementById("fullscreenView");
        if (fullView?.classList.contains("active")) {
            closeFullscreen();
        }

        console.log("[CCTVLayout] destroy() 완료");
    }

    return {
        init,
        renderGrid,
        attachStreamToVideo,
        showPlaceholder,
        setFocusedCameraByIndex,
        closeFullscreen,
        openFullscreen,
        attachStreamToFullscreen,
        showFullscreenPlaceholder,
        destroy,
    };

})();
