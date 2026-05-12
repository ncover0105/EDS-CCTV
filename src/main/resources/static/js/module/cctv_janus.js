// ============================
//  CCTV JANUS STREAMING CORE
// ============================

window.CCTVJanus = (function () {

    // const janusServerUrl = "ws://localhost:8188/janus";
    // const janusServerUrl = "ws://172.24.55.162:8188/janus";
    const janusServerUrl = "ws://edscorp.iptime.org:3030";
    // const janusServerUrl = "wss://192.168.0.100:8189/janus";
    
    const CONNECT_GRACE_MS = 15000;
    const RECONNECT_COOLDOWN_MS = 10000;
    const DISPLAY_PENDING_GRACE_MS = 40000;
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

    function isDisplayPending(cam) {
        if (!cam?.__streamDisplayPending) return false;
        const age = Date.now() - (cam.__streamDisplayStartedAt || 0);
        return age < DISPLAY_PENDING_GRACE_MS;
    }

    function getCameraLabel(cam, fallbackKey) {
        return cam?.name || cam?.cctvCode || String(fallbackKey || cam?.mountpointId || "unknown");
    }

    function reportStreamSuccess(cam, fallbackKey) {
        const label = getCameraLabel(cam, fallbackKey);
        if (cam) {
            if (cam.__streamLogState === "success") return;
            cam.__streamLogState = "success";
        }
        console.log(`[스트리밍 성공] ${label}`);
    }

    function reportStreamFailure(cam, fallbackKey, reason) {
        const label = getCameraLabel(cam, fallbackKey);
        const message = reason ? `[스트리밍 실패] ${label} - ${reason}` : `[스트리밍 실패] ${label}`;
        if (cam) {
            if (cam.__streamLogState === message) return;
            cam.__streamLogState = message;
        }
        console.error(message);
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
        // console.log("[CCTVJanus] destroy() 시작 - 핸들 수:", Object.keys(pluginHandles).length);

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

    }


    // ── 팝업/단일 카메라용 연결 (Janus 미초기화 시 자동 초기화) ──────
    async function connectSingle(cam, opts = {}) {
        if (!janus) {
            await new Promise((resolve) => {
                Janus.init({
                    debug: false,
                    callback: () => {
                        janus = new Janus({
                            server: janusServerUrl,
                            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                            iceTransportPolicy: 'all',
                            success: resolve,
                            error: () => resolve()
                        });
                    }
                });
            });
        }
        if (!janus) {
            if (typeof opts.onCleanup === 'function') opts.onCleanup();
            return;
        }
        return initJanusCam(cam, opts);
    }

    function disconnectSingle(key) {
        const h = pluginHandles[key];
        if (!h) return;
        try { h.send({ message: { request: 'stop' } }); } catch (e) { }
        try { h.detach(); } catch (e) { }
        delete pluginHandles[key];
    }

    // 외부에서 접근 필요한 값 공개
    const exports = {
        initSignaling,
        initJanusCam,
        connectSingle,
        disconnectSingle,
        pluginHandles,
        reconnectAll,
        reconnectOne,
        openFullscreenHigh,
        closeFullscreenHigh,
        destroy,
    };

    // ------------------------------
    // Janus 서버 연결
    // ------------------------------
    async function initSignaling(cameras) {
        Janus.init({
            debug: false,
            callback: () => {
                janus = new Janus({
                    server: janusServerUrl,
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    iceTransportPolicy: "all",
                    success: async () => {
                        const targetCams = getTargetCameras(cameras);
                        const validCams = targetCams.filter(cam => toPositiveInt(cam?.mountpointId) != null);
                        targetCams
                            .filter(cam => toPositiveInt(cam?.mountpointId) == null)
                            .forEach(cam => reportStreamFailure(cam, cam?.cctvCode, "mountpointId 없음"));

                        cleanupHiddenHandles(validCams);
                        Promise.all(validCams.map(cam => initJanusCam(cam)))
                            .catch(() => { });
                    },
                    error: () => { }
                });
            }
        });
    }

    // ------------------------------
    // Mountpoint attach + Watch
    // ------------------------------
    async function initJanusCam(cam, opts = {}) {
        const watchId = toPositiveInt(opts.watchId ?? cam?.mountpointId);
        if (watchId == null) {
            reportStreamFailure(cam, opts.key, "mountpointId 없음");
            return;
        }

        const key = opts.key ?? String(watchId);
        const startedAt = Date.now();
        cam.__janusConnecting = true;
        cam.__janusConnectStartedAt = startedAt;
        cam.__streamDisplayPending = true;
        cam.__streamDisplayStartedAt = startedAt;
        cam.__streamTraceStartedAt = startedAt;
        cam.__streamUiState = "connecting";

        // placeholder 강제는 grid용만( fullscreen은 건드리지 않음 )
        if (!opts.skipPrepareReconnect) {
            try { window.CCTVLayout?.prepareReconnect?.(cam); } catch (e) { }
        }

        if (pluginHandles[key]) {
            // console.log(`Handle 중복 제거: key=${key}`);
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

                    // ICE 상태 모니터링 추가
                    const checkIce = setInterval(() => {
                        const pc = h.webrtcStuff?.pc;
                        if (!pc) return;
                        const state = pc.iceConnectionState;
                        if (state === "failed" || state === "disconnected") {
                            reportStreamFailure(cam, key, `ICE ${state}`);
                            clearInterval(checkIce);
                            if (!opts.key?.startsWith("fs-")) {
                                // window.CCTVLayout?.scheduleReconnect?.(cam, key);
                            }
                        }
                        // 핸들이 삭제됐으면 인터벌도 정리
                        if (!pluginHandles[key]) clearInterval(checkIce);
                    }, 3000);
                    h._iceInterval = checkIce;

                    setTimeout(() => {
                        h.send({ message: { request: "watch", id: watchId } });
                        resolve();
                    }, 100);
                },

                error: () => {
                    reportStreamFailure(cam, key, "attach 실패");
                    resolve();
                },

                onmessage: (msg, jsep) => {
                    if (!handle) return;

                    if (msg.error) {
                        reportStreamFailure(cam, key, msg.error || "서버 오류");
                        return;
                    }

                    if (jsep && !handle._started) {
                        handle._started = true;
                        handle.createAnswer({
                            jsep,
                            media: { audioRecv: false, audioSend: false, videoRecv: true, videoSend: false },
                            success: ans => {
                                handle.send({ message: { request: "start" }, jsep: ans });
                            },
                            error: () => reportStreamFailure(cam, key, "응답 생성 실패")
                        });
                    }
                },

                onremotetrack: (track, mid, on) => {
                    if (!handle) return;
                    if (track.kind !== "video") return;

                    if (on) {
                        const stream = new MediaStream([track]);
                        handle._hasVideo = true;
                        cam.__janusConnecting = false;
                        cam.__janusLastConnectedAt = Date.now();
                        cam.__streamUiState = "connecting";
                        reportStreamSuccess(cam, key);

                        // fullscreen용이면 opts.onStream으로 전달
                        if (typeof opts.onStream === "function") {
                            opts.onStream(stream);
                        } else {
                            CCTVLayout.attachStreamToVideo(cam, stream);
                        }
                    } else {
                        handle._hasVideo = false;
                        cam.__janusConnecting = false;
                        cam.__streamDisplayPending = false;
                        cam.__streamUiState = "disconnected";
                        reportStreamFailure(cam, key, "원격 비디오 종료");
                        if (typeof opts.onOff === "function") opts.onOff();
                        else CCTVLayout.showPlaceholder(cam);
                    }
                },

                oncleanup: () => {
                    cam.__janusConnecting = false;
                    cam.__streamDisplayPending = false;
                    cam.__streamUiState = "disconnected";
                    reportStreamFailure(cam, key, "세션 정리");
                    delete pluginHandles[key];
                    if (typeof opts.onCleanup === "function") {
                        opts.onCleanup();
                    } else {
                        CCTVLayout.showPlaceholder(cam);
                        // fullscreen용이 아닌 일반 그리드 핸들만 자동 재연결
                        if (!opts.key?.startsWith("fs-")) {
                            // CCTVLayout.scheduleReconnect(cam, key);
                        }
                    }
                }
            });
        });
    }

    async function reconnectAll(cameras) {
        // Janus 세션이 아직 없으면 최초 연결부터
        if (!janus) {
            return initSignaling(cameras);
        }

        const targetCams = getTargetCameras(cameras);
        cleanupHiddenHandles(targetCams);

        // console.log("전체 재연결 시작");
        for (const cam of targetCams) {
            if (toPositiveInt(cam?.mountpointId) == null) {
                continue;
            }
            if (isDisplayPending(cam)) {
                continue;
            }
            try {
                await initJanusCam(cam); // 내부에서 stop/detach 후 watch 재시작함
            } catch (e) {
                reportStreamFailure(cam, cam?.mountpointId, "재연결 실패");
            }
        }
        // console.log("전체 재연결 완료");
    }

    async function reconnectOne(cameras, key) {
        // key: mountpointId 또는 cctvCode
        const cam = cameras.find(c => String(c.mountpointId) === String(key) || String(c.cctvCode) === String(key));
        if (!cam) {
            return;
        }

        const now = Date.now();
        if (isDisplayPending(cam)) {
            return;
        }
        const connectAge = now - (cam.__janusConnectStartedAt || 0);
        if (cam.__janusConnecting && connectAge < CONNECT_GRACE_MS) {
            return;
        }
        const lastAttemptAge = now - (cam.__janusLastReconnectAt || 0);
        if (lastAttemptAge < RECONNECT_COOLDOWN_MS) {
            return;
        }

        if (!janus) {
            return initSignaling(cameras);
        }

        // console.log(`선택 재연결: ${cam.name} (mount=${cam.mountpointId})`);
        try {
            cam.__janusLastReconnectAt = now;
            await initJanusCam(cam);
        } catch (e) {
            reportStreamFailure(cam, cam?.mountpointId, "재연결 실패");
        }
    }

    async function openFullscreenHigh(cam) {
        if (!janus) {
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
            reportStreamFailure(cam, cam?.mountpointId, "fullscreen 소스 없음");
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
