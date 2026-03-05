// ============================
//  CCTV JANUS STREAMING CORE
// ============================

window.CCTVJanus = (function () {

    const janusServerUrl = "ws://localhost:8188/janus";
    let janus = null;

    // mountpoint handle 저장
    const pluginHandles = {};

    function toPositiveInt(value) {
        const n = Number(value);
        return Number.isInteger(n) && n > 0 ? n : null;
    }

    function getTargetCameras(cameras) {
        const visible = window.CCTVLayout?.getVisibleCameras?.();
        if (Array.isArray(visible) && visible.length > 0) return visible;
        return Array.isArray(cameras) ? cameras : [];
    }

    function cleanupHiddenHandles(targetCams) {
        const allowedKeys = new Set(
            (targetCams || [])
                .map(cam => toPositiveInt(cam?.mountpointId))
                .filter(id => id != null)
                .map(id => String(id))
        );

        for (const key in pluginHandles) {
            // fullscreen 전용 핸들은 별도 수명주기
            if (String(key).startsWith("fs-")) continue;
            if (allowedKeys.has(String(key))) continue;

            const h = pluginHandles[key];
            try { h.send({ message: { request: "stop" } }); } catch (e) { }
            try { h.detach(); } catch (e) { }
            delete pluginHandles[key];
        }
    }

    // ===================== 4. 페이지 이탈 시 정리 =====================
    /**
     * 모든 Janus 핸들 detach + video srcObject 해제
     * 서버 GStreamer/mountpoint는 건드리지 않음
     */
    function destroy() {
        console.log("[CCTVJanus] destroy() 시작 - 핸들 수:", Object.keys(pluginHandles).length);

        for (const mountId in pluginHandles) {
            const handle = pluginHandles[mountId];
            try {
                handle.send({ message: { request: "stop" } });
                handle.detach();
            } catch (e) { }
            delete pluginHandles[mountId];
        }

        // Janus 세션 자체는 keepAlive 타임아웃으로 자연 소멸
        // (강제 destroy하면 서버 mountpoint도 영향받을 수 있음)
        janus = null;

        console.log("[CCTVJanus] destroy() 완료");
    }


    // 외부에서 접근 필요한 값 공개
    const exports = {
        initSignaling,
        initJanusCam,
        pluginHandles,
        reconnectAll,
        reconnectOne,
        openFullscreenHigh,
        closeFullscreenHigh,
        destroy,
    };

    // ------------------------------
    // 1) Janus 서버 연결
    // ------------------------------
    async function initSignaling(cameras) {

        console.log("📡 Janus 초기화 시작");

        Janus.init({
            debug: "all",
            callback: () => {
                janus = new Janus({
                    server: janusServerUrl,
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    iceTransportPolicy: "all",
                    success: async () => {
                        console.log("✅ Janus 연결 성공");

                        const targetCams = getTargetCameras(cameras);
                        const validCams = targetCams.filter(cam => toPositiveInt(cam?.mountpointId) != null);
                        const skipped = targetCams.length - validCams.length;
                        if (skipped > 0) {
                            console.warn(`mountpointId가 유효하지 않은 CCTV ${skipped}건은 watch를 건너뜁니다.`);
                        }

                        cleanupHiddenHandles(validCams);
                        Promise.all(validCams.map(cam => initJanusCam(cam)))
                            .then(() => console.log("🎉 모든 카메라 초기화 완료"))
                            .catch(err => console.error("카메라 초기화 오류:", err));
                    },
                    error: err => {
                        console.error("❌ Janus 연결 실패:", err);
                    }
                });
            }
        });
    }

    // ------------------------------
    // 2) Mountpoint attach + Watch
    // ------------------------------
    async function initJanusCam(cam, opts = {}) {
        const watchId = toPositiveInt(opts.watchId ?? cam?.mountpointId);
        if (watchId == null) {
            console.warn("유효하지 않은 mountpointId로 watch를 건너뜁니다:", {
                cctvCode: cam?.cctvCode,
                mountpointId: cam?.mountpointId,
            });
            return;
        }

        const key = opts.key ?? String(watchId);

        // placeholder 강제는 grid용만( fullscreen은 건드리지 않음 )
        if (!opts.skipPrepareReconnect) {
            try { window.CCTVLayout?.prepareReconnect?.(cam); } catch (e) { }
        }

        if (pluginHandles[key]) {
            console.log(`🔄 Handle 중복 제거: key=${key}`);
            const old = pluginHandles[key];
            try { old.send({ message: { request: "stop" } }); } catch (e) { }
            try { old.detach(); } catch (e) { }
            delete pluginHandles[key];
        }

        return new Promise((resolve) => {
            let handle = null;

            janus.attach({
                plugin: "janus.plugin.streaming",

                success: function (h) {
                    handle = h;
                    pluginHandles[key] = h;
                    h._started = false;

                    setTimeout(() => {
                        console.log(`▶ Watch 요청: key=${key}, id=${watchId}`);
                        h.send({ message: { request: "watch", id: watchId } });
                        resolve();
                    }, 100);
                },

                error: err => {
                    console.error(`attach 실패(key=${key}, id=${watchId}):`, err);
                    resolve();
                },

                onmessage: (msg, jsep) => {
                    if (!handle) return;

                    if (msg.error) {
                        console.error(`[key=${key}, id=${watchId}] 서버 오류:`, msg.error);
                        return;
                    }

                    if (jsep && !handle._started) {
                        handle._started = true;
                        handle.createAnswer({
                            jsep,
                            media: { audioRecv: false, audioSend: false, videoRecv: true, videoSend: false },
                            success: ans => handle.send({ message: { request: "start" }, jsep: ans }),
                            error: err => console.error(`[key=${key}, id=${watchId}] createAnswer 실패:`, err)
                        });
                    }
                },

                onremotetrack: (track, mid, on) => {
                    if (!handle) return;
                    if (track.kind !== "video") return;

                    if (on) {
                        const stream = new MediaStream([track]);
                        handle._hasVideo = true;

                        // ✅ fullscreen용이면 opts.onStream으로 전달
                        if (typeof opts.onStream === "function") {
                            opts.onStream(stream);
                        } else {
                            CCTVLayout.attachStreamToVideo(cam, stream);
                        }
                    } else {
                        handle._hasVideo = false;
                        if (typeof opts.onOff === "function") opts.onOff();
                        else CCTVLayout.showPlaceholder(cam);
                    }
                },

                oncleanup: () => {
                    console.log(`cleanup: key=${key}, id=${watchId}`);
                    delete pluginHandles[key];
                    if (typeof opts.onCleanup === "function") opts.onCleanup();
                    else CCTVLayout.showPlaceholder(cam);
                }
            });
        });
    }

    async function reconnectAll(cameras) {
        // Janus 세션이 아직 없으면 최초 연결부터
        if (!janus) {
            console.warn("janus 세션 없음 → initSignaling부터 실행");
            return initSignaling(cameras);
        }

        const targetCams = getTargetCameras(cameras);
        cleanupHiddenHandles(targetCams);

        console.log("전체 재연결 시작");
        for (const cam of targetCams) {
            if (toPositiveInt(cam?.mountpointId) == null) {
                continue;
            }
            try {
                await initJanusCam(cam); // 내부에서 stop/detach 후 watch 재시작함
            } catch (e) {
                console.error("전체 재연결 중 오류:", cam?.mountpointId, e);
            }
        }
        console.log("전체 재연결 완료");
    }

    async function reconnectOne(cameras, key) {
        // key: mountpointId 또는 cctvCode
        const cam = cameras.find(c => String(c.mountpointId) === String(key) || String(c.cctvCode) === String(key));
        if (!cam) {
            console.warn("재연결 대상 카메라를 찾을 수 없음:", key);
            return;
        }

        if (!janus) {
            console.warn("janus 세션 없음 → initSignaling부터 실행");
            return initSignaling(cameras);
        }

        console.log(`선택 재연결: ${cam.name} (mount=${cam.mountpointId})`);
        try {
            await initJanusCam(cam);
            console.log("선택 재연결 완료:", cam.mountpointId);
        } catch (e) {
            console.error("선택 재연결 실패:", cam.mountpointId, e);
        }
    }

    async function openFullscreenHigh(cam) {
        if (!janus) {
            console.warn("janus 세션 없음");
            return;
        }

        // 기본 운영은 항상 legacy mountpointId 사용
        // (향후 high 우선 정책 필요 시 highMp/highUrl 로직 복원)
        // const highMp = cam.highMountpointId ?? null;
        // const highUrl = cam.highRtspUrl ?? null;
        const defMp = cam.__defaultMountpointId ?? cam.mountpointId ?? null;
        const defUrl = cam.__defaultRtspUrl ?? cam.rtspUrl ?? cam.lowRtspUrl ?? cam.highRtspUrl ?? null;

        const chosenMp = defMp;
        const chosenUrl = defUrl;

        if (!chosenMp || !chosenUrl) {
            console.warn("[openFullscreenHigh] blocked (no mp/url)", cam?.name, chosenMp, chosenUrl);
            window.CCTVLayout?.showFullscreenPlaceholder?.(cam);
            return;
        }

        const key = `fs-${cam.cctvCode}`;

        // ✅ fullscreen video에만 붙인다
        await initJanusCam(cam, {
            key,
            watchId: chosenMp,
            skipPrepareReconnect: true, // grid 건드리지 않기
            onStream: (stream) => window.CCTVLayout?.attachStreamToFullscreen?.(cam, stream),
            onCleanup: () => window.CCTVLayout?.showFullscreenPlaceholder?.(cam),
        });
    }

    function closeFullscreenHigh(cam) {
        const key = `fs-${cam.cctvCode}`;
        const h = pluginHandles[key];
        if (!h) return;

        try { h.send({ message: { request: "stop" } }); } catch (e) { }
        try { h.detach(); } catch (e) { }
        delete pluginHandles[key];
    }

    return exports;

})();
