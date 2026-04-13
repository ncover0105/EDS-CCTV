// ============================
//  CCTV JANUS STREAMING CORE
// ============================

window.CCTVJanus = (function () {

    // const janusServerUrl = "ws://localhost:8188/janus";
    const janusServerUrl = "ws://172.24.55.162:8188/janus";
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
    // Janus 서버 연결
    // ------------------------------
    async function initSignaling(cameras) {
        Janus.init({
            debug: "all",
            callback: () => {
                janus = new Janus({
                    server: janusServerUrl,
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    iceTransportPolicy: "all",
                    success: async () => {
                        console.log("Janus 연결 성공");

                        const targetCams = getTargetCameras(cameras);
                        const validCams = targetCams.filter(cam => toPositiveInt(cam?.mountpointId) != null);
                        const skipped = targetCams.length - validCams.length;
                        if (skipped > 0) {
                            console.warn(`mountpointId가 유효하지 않은 CCTV ${skipped}건은 watch를 건너뜁니다.`);
                        }

                        cleanupHiddenHandles(validCams);
                        Promise.all(validCams.map(cam => initJanusCam(cam)))
                            .then(() => console.log("카메라 초기화 성공"))
                            .catch(err => console.error("카메라 초기화 오류:", err));
                    },
                    error: err => {
                        console.error("Janus 연결 실패:", err);
                    }
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
            console.warn("유효하지 않은 mountpointId로 watch를 건너뜁니다:", {
                cctvCode: cam?.cctvCode,
                mountpointId: cam?.mountpointId,
            });
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
        console.log(`[stream][${key}] init 시작 cam=${cam?.name ?? cam?.cctvCode} watchId=${watchId}`);

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
                    console.log(`[stream][${key}] attach 성공 +${Date.now() - startedAt}ms`);

                    // ICE 상태 모니터링 추가
                    const checkIce = setInterval(() => {
                        const pc = h.webrtcStuff?.pc;
                        if (!pc) return;
                        const state = pc.iceConnectionState;
                        if (state === "failed" || state === "disconnected") {
                            console.warn(`[key=${key}] ICE ${state} → 재연결 시도`);
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
                        console.log(`[stream][${key}] watch 요청 id=${watchId} +${Date.now() - startedAt}ms`);
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
                    if (jsep) {
                        console.log(`[stream][${key}] jsep 수신 type=${jsep.type} +${Date.now() - startedAt}ms`);
                    }

                    if (msg.error) {
                        console.error(`[key=${key}, id=${watchId}] 서버 오류:`, msg.error);
                        return;
                    }

                    if (jsep && !handle._started) {
                        handle._started = true;
                        handle.createAnswer({
                            jsep,
                            media: { audioRecv: false, audioSend: false, videoRecv: true, videoSend: false },
                            success: ans => {
                                console.log(`[stream][${key}] createAnswer 성공, start 전송 +${Date.now() - startedAt}ms`);
                                handle.send({ message: { request: "start" }, jsep: ans });
                            },
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
                        cam.__janusConnecting = false;
                        cam.__janusLastConnectedAt = Date.now();
                        cam.__streamUiState = "connecting";
                        console.log(`[stream][${key}] remote video track 수신 mid=${mid} readyState=${track.readyState} +${Date.now() - startedAt}ms`);

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
                        if (typeof opts.onOff === "function") opts.onOff();
                        else CCTVLayout.showPlaceholder(cam);
                    }
                },

                oncleanup: () => {
                    console.log(`cleanup: key=${key}, id=${watchId}`);
                    cam.__janusConnecting = false;
                    cam.__streamDisplayPending = false;
                    cam.__streamUiState = "disconnected";
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
            console.warn("janus 세션 없음 → initSignaling부터 실행");
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
                console.log(`[reconnectAll] ${cam.name} 화면 표시 대기 중이라 재연결 건너뜀`);
                continue;
            }
            try {
                await initJanusCam(cam); // 내부에서 stop/detach 후 watch 재시작함
            } catch (e) {
                console.error("전체 재연결 중 오류:", cam?.mountpointId, e);
            }
        }
        // console.log("전체 재연결 완료");
    }

    async function reconnectOne(cameras, key) {
        // key: mountpointId 또는 cctvCode
        const cam = cameras.find(c => String(c.mountpointId) === String(key) || String(c.cctvCode) === String(key));
        if (!cam) {
            console.warn("재연결 대상 카메라를 찾을 수 없음:", key);
            return;
        }

        const now = Date.now();
        if (isDisplayPending(cam)) {
            const waitMs = DISPLAY_PENDING_GRACE_MS - (now - (cam.__streamDisplayStartedAt || now));
            console.log(`[reconnectOne] ${cam.name} 화면 표시 대기 중, ${waitMs}ms 동안 재연결 보류`);
            return;
        }
        const connectAge = now - (cam.__janusConnectStartedAt || 0);
        if (cam.__janusConnecting && connectAge < CONNECT_GRACE_MS) {
            console.log(`[reconnectOne] ${cam.name} 아직 연결 시도 중, ${CONNECT_GRACE_MS - connectAge}ms 대기`);
            return;
        }
        const lastAttemptAge = now - (cam.__janusLastReconnectAt || 0);
        if (lastAttemptAge < RECONNECT_COOLDOWN_MS) {
            console.log(`[reconnectOne] ${cam.name} 재시도 쿨다운 중, ${RECONNECT_COOLDOWN_MS - lastAttemptAge}ms 대기`);
            return;
        }

        if (!janus) {
            console.warn("janus 세션 없음 → initSignaling부터 실행");
            return initSignaling(cameras);
        }

        // console.log(`선택 재연결: ${cam.name} (mount=${cam.mountpointId})`);
        try {
            cam.__janusLastReconnectAt = now;
            await initJanusCam(cam);
            // console.log("선택 재연결 완료:", cam.mountpointId);
        } catch (e) {
            // console.error("선택 재연결 실패:", cam.mountpointId, e);
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
