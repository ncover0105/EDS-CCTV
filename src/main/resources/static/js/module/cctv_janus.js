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
        pluginHandles
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
    
                    } else {
                        console.log(`⚠️ 스트림 OFF (${cam.name})`);
                        handle._hasVideo = false;
                        CCTVLayout.showPlaceholder(cam);
                    }
                },
    
                oncleanup: () => {
                    console.log(`🧹 cleanup 발생: ${cam.mountpointId}`);
                    CCTVLayout.showPlaceholder(cam);
    
                    delete pluginHandles[cam.mountpointId];
                }
            });
        });
    }
    

    return exports;

})();


// let peerConnections = {};
// // let signalingSocket;
// const janusServer = "ws://localhost:8188/janus";
// // const janusServer = "https://localhost:8088/janus";

// let janus = null;
// // let sfutest = null;
// const pluginHandles = {};

// // -------------------- Janus 연결 --------------------
// async function initSignaling() {
//     if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
//         console.log('WebRTC getUserMedia 지원');
//     } else {
//         console.log('WebRTC getUserMedia 미지원');
//     }

//     if (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection) {
//         console.log('WebRTC PeerConnection 지원');
//     } else {
//         console.log('WebRTC PeerConnection 미지원');
//     }

//     janus = new Janus({
//         server: janusServer,
//         iceServers: [
//             { urls: "stun:stun.l.google.com:19302" },
//             // { urls: "turn:220.88.250.100:3478", username: "edscorp", credential: "edscorp1!" }
//             // { urls: "turn:172.24.55.162:3478", username: "edscorp", credential: "edscorp1!" }
//         ],
//         iceTransportPolicy: "all",
//         success: async function () {
//             console.log("Janus 연결 성공");
//             Promise.all(cameras.map(cam => initJanusCam(cam)))
//                 .then(() => console.log("✅ 모든 카메라 초기화 완료"))
//                 .catch(err => console.error("카메라 초기화 오류:", err));
//         },
//         error: function (err) { console.error("Janus 연결 실패:", err); }
//     });
// }

// async function initJanusCam(cam) {
//     // 이미 attach 되어 있다면 stop & detach
//     if (pluginHandles[cam.mountpointId]) {
//         console.log('이미 연결된 mountpoint:', cam.mountpointId);
//         pluginHandles[cam.mountpointId].send({ message: { request: "stop" } });
//         pluginHandles[cam.mountpointId].detach();
//         delete pluginHandles[cam.mountpointId];
//     }

//     return new Promise((resolve, reject) => {
//         janus.attach({
//             plugin: "janus.plugin.streaming",

//             success: function(handle) {
//                 console.log(`✅ Mountpoint attached ${cam.mountpointId}`);
//                 pluginHandles[cam.mountpointId] = handle;
//                 handle._started = false;

//                 // watch 요청
//                 setTimeout(() => {
//                     console.log(`▶️ Watch 요청 전송: mountpoint ${cam.mountpointId}`);
//                     handle.send({ message: { request: "watch", id: cam.mountpointId } });
//                     resolve();
//                 }, 100);
//             },

//             error: function(err) {
//                 console.error(`❌ Attach 에러: ${cam.mountpointId}`, err);
//                 resolve();
//             },

//             onmessage: function(msg, jsep) {
//                 const handle = pluginHandles[cam.mountpointId];
//                 if (msg.error) {
//                     console.error(`[Mountpoint ${cam.mountpointId}] 서버 에러:`, msg.error);
//                     return;
//                 }
//                 if (jsep && !handle._started) {
//                     handle._started = true;
//                     console.log(`[Mountpoint ${cam.mountpointId}] JSEP offer 수신, Answer 생성`);
//                     handle.createAnswer({
//                         jsep: jsep,
//                         media: { audioSend:false, audioRecv:false, videoSend:false, videoRecv:true },
//                         trickle: true,
//                         success: function(answer) {
//                             console.log(`[Mountpoint ${cam.mountpointId}] Answer SDP 생성`);
//                             handle.send({ message:{ request: "start" }, jsep: answer });
//                         },
//                         error: function(err) {
//                             console.error(`[Mountpoint ${cam.mountpointId}] createAnswer 실패:`, err);
//                         }
//                     });
//                 }
//             },

//             onremotetrack: function(track, mid, on) {
//                 console.log(`🎥 onremotetrack 이벤트: ${cam.name}, kind=${track.kind}, on=${on}`);
//                 if (track.kind === 'video') {
//                     if (on) {
//                         const stream = new MediaStream([track]);
//                         attachStreamToVideo(cam, stream);
//                         handle._hasVideo = true;   // ✅ 영상 수신됨
//                         console.log(`✅ ${cam.name} 영상 수신 시작`);
//                     } else {
//                         showPlaceholder(cam);
//                         handle._hasVideo = false;  // ❌ 영상 끊김
//                         console.warn(`⚠️ ${cam.name} 영상 중단`);
//                     }
//                 }
//             },

//             oncleanup: function() {
//                 console.log(`🧹 oncleanup: ${cam.mountpointId}`);
//                 showPlaceholder(cam);
//                 delete pluginHandles[cam.mountpointId];
//             }
//         });
//     });
// }

// function attachStreamToVideo(cam, stream) {
//         console.log('Attach stream to video:', cam.name, stream);
//         // 일관된 ID 패턴 사용
//         const videoEl = document.getElementById(`video-${cam.mountpointId}`);
//         const placeholder = document.getElementById(`placeholder-${cam.name}`);
        
//         if (!videoEl) {
//             console.error('Video element 없음:', `video-${cam.mountpointId}`);
//             return;
//         }
    
//         // 기존 스트림 정리
//         if (videoEl.srcObject) {
//             videoEl.srcObject.getTracks().forEach(t => t.stop());
//         }
    
//         // 새 스트림 할당
//         videoEl.srcObject = stream;
//         videoEl.muted = true;
//         videoEl.autoplay = true;
//         videoEl.playsInline = true;
    
//         // 재생 시도
//         const playPromise = videoEl.play();
//         if (playPromise) {
//             playPromise
//                 .then(() => {
//                     console.log('✅ 비디오 재생 시작:', cam.name);
//                     videoEl.classList.remove('d-none');
//                     placeholder?.classList.add('d-none');
//                 })
//                 .catch(err => {
//                     console.warn('⚠️ 자동 재생 실패:', cam.name, err);
//                 });
//         }
    
//         // Track 이벤트 리스너
//         stream.getTracks().forEach(track => {
//             track.onended = () => showPlaceholder(cam);
//             // track.onmute  = () => showPlaceholder(cam);
//             track.onmute  = () => {
//                 console.log('✅ Track onmute:', cam.name);
//             }
//             track.onunmute = () => {
//                 console.log('✅ Track unmuted:', cam.name);
//                 // videoEl.classList.remove('d-none');
//                 // placeholder?.classList.add('d-none');
//             };
//         });
// }

// function cleanupVideo(cam) {
//     const videoEl = document.getElementById(`video-${cam.mountpointId}`);
//     const placeholder = document.getElementById(`placeholder-${cam.name}`);
    
//     if (videoEl && videoEl.srcObject) {
//         videoEl.srcObject.getTracks().forEach(track => track.stop());
//         videoEl.srcObject = null;
//         videoEl.classList.add('d-none');
//     }
    
//     if (placeholder) {
//         placeholder.classList.remove('d-none');
//     }
// }

// // 각 카메라 WebRTC 연결
// function startStreaming() {
//     console.log("Starting streaming...");

//     // 기존 연결 종료
//     for (const key in peerConnections) {
//         if (peerConnections[key]) peerConnections[key].close();
//         delete peerConnections[key]; // 기존 연결 제거
//     }

//     cameras.forEach(camera => {
//         const video = document.getElementById(`videoCanvas${camera.name}`);
//         const placeholder = document.getElementById(`placeholder-${camera.name}`);

//         const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
//         peerConnections[camera.name] = pc;

//         // 트랙 수신
//         pc.ontrack = (event) => {
//             video.srcObject = event.streams[0];
//             placeholder.classList.add('d-none');
//             video.classList.remove('d-none');
//             console.log(`[Camera ${camera.name}] Track received, video streaming started.`);
//         };

//         // ICE candidate 발생 시 서버 전송
//         pc.onicecandidate = (event) => {
//             if (event.candidate && signalingSocket.readyState === WebSocket.OPEN) {
//                 signalingSocket.send(JSON.stringify({ type: 'ice', candidate: event.candidate, cameraId: camera.name }));
//             }
//         };

//         // 연결 상태
//         pc.onconnectionstatechange = () => {
//             console.log(`[Camera ${camera.name}] Connection state: ${pc.connectionState}`);
//         };

//         console.log(`[Camera ${camera.name}] RTCPeerConnection ready.`);
//     });
// }
