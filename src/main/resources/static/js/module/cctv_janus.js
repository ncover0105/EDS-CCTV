// ============================
//  CCTV JANUS STREAMING CORE
// ============================

window.CCTVJanus = (function () {

    const janusServer = "ws://localhost:8188/janus";
    let janus = null;

    // mountpoint handle 저장
    const pluginHandles = {};

    // 외부에서 접근 필요한 값 공개
    const exports = {
        initSignaling,
        initJanusCam,
        pluginHandles,
        reconnectAll,
        reconnectOne
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
                    server: janusServer,
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    iceTransportPolicy: "all",
                    success: async () => {
                        console.log("✅ Janus 연결 성공");

                        Promise.all(cameras.map(cam => initJanusCam(cam)))
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
    async function initJanusCam(cam) {

        if (pluginHandles[cam.mountpointId]) {
            console.log(`🔄 Mountpoint 중복 제거: ${cam.mountpointId}`);
            const old = pluginHandles[cam.mountpointId];
            old.send({ message: { request: "stop" } });
            old.detach();
            delete pluginHandles[cam.mountpointId];
            // window.CCTVLayout?.syncLayoutToConnectedCameras?.();
        }
    
        return new Promise((resolve) => {
    
            let handle = null;  // ★★★ onremotetrack에서 사용할 handle
    
            janus.attach({
                plugin: "janus.plugin.streaming",
    
                success: function (h) {
                    console.log(`🎬 Mountpoint attach 완료: ${cam.mountpointId}`);
    
                    handle = h;  // ★ 저장
                    pluginHandles[cam.mountpointId] = h;
                    h._started = false;
    
                    setTimeout(() => {
                        console.log(`▶️ Watch 요청: ${cam.mountpointId}`);
                        h.send({ message: { request: "watch", id: cam.mountpointId } });
                        resolve();
                    }, 100);
                },
    
                error: err => {
                    console.error(`❌ attach 실패(${cam.mountpointId}):`, err);
                    resolve();
                },
    
                onmessage: (msg, jsep) => {
                    if (!handle) return; // 안전 처리
    
                    if (msg.error) {
                        console.error(`[${cam.mountpointId}] 서버 메시지 오류:`, msg.error);
                        return;
                    }
    
                    if (jsep && !handle._started) {
                        handle._started = true;
                        console.log(`📝 Offer 수신 → Answer 생성 (${cam.mountpointId})`);
    
                        handle.createAnswer({
                            jsep,
                            media: { audioRecv: false, audioSend: false, videoRecv: true, videoSend: false },
                            success: ans => {
                                handle.send({
                                    message: { request: "start" },
                                    jsep: ans
                                });
                            },
                            error: err => {
                                console.error(`[${cam.mountpointId}] createAnswer 실패:`, err);
                            }
                        });
                    }
                },
    
                // ------------------------------------------------
                // ★★★ handle 변수 사용 가능해짐
                // ------------------------------------------------
                onremotetrack: (track, mid, on) => {
                    if (!handle) return;  // 안전 처리
                    if (track.kind !== "video") return;
    
                    if (on) {
                        console.log(`🎥 스트림 ON (${cam.name})`);
                        const stream = new MediaStream([track]);
                        CCTVLayout.attachStreamToVideo(cam, stream);
                        handle._hasVideo = true;
                        // window.CCTVLayout?.syncLayoutToConnectedCameras?.();
                    } else {
                        console.log(`⚠️ 스트림 OFF (${cam.name})`);
                        handle._hasVideo = false;
                        CCTVLayout.showPlaceholder(cam);
                        // window.CCTVLayout?.syncLayoutToConnectedCameras?.();
                    }
                },
    
                oncleanup: () => {
                    console.log(`🧹 cleanup 발생: ${cam.mountpointId}`);
                    delete pluginHandles[cam.mountpointId];
                    CCTVLayout.showPlaceholder(cam);
                    // window.CCTVLayout?.syncLayoutToConnectedCameras?.();
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
    
        console.log("전체 재연결 시작");
    for (const cam of cameras) {
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
    

    return exports;

})();