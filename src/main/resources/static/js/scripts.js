const interval = 120000; // 60초
let eventToastr = {};

let currentAudio = null;

let logContainer;
let emptyMessage;

// 페이지가 로드되면 즉시 실행
document.addEventListener("DOMContentLoaded", function () {

    toastr.options = {
        closeButton: false,
        debug: false,
        newestOnTop: false,
        progressBar: false,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        onclick: null,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "0",
        extendedTimeOut: "0",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };
    
    setTime();

    Logs.init();

    const modalEl = document.getElementById("broadcast_modal");

    // modalEl.addEventListener("shown.bs.modal", () => {
    //     console.log("broadcast_modal opened → running init()");
    //     BroadcastModal.init();
    // });

    Weather.init();          // AWS, 예보, 레이더, 위성 (2분 주기)
    loadTodayLatestDisasterOneLine();
    if (typeof Janus === "undefined") {
        alert("❌ Janus.js 라이브러리 로드 실패");
        return;
    }
    
    CCTVLayout.init(cameras);
    CCTVJanus.initSignaling(cameras);
    SSE_MQTT.connect();

    document.getElementById("reconnectAllBtn")?.addEventListener("click", () => {
        showConfirmModal("전체 재연결", "모든 CCTV를 재연결할까요?", async () => {
            await CCTVJanus.reconnectAll(cameras);
            // showToast("전체 재연결 완료", "success");
            App.utils.showGlobalAlert("전체 재연결 완료", "success");
        });
    });

    document.getElementById("restartAllServerBtn")?.addEventListener("click", () => {
        showConfirmModal(
            "스트리밍 서버 전체 재시작",
            "전체 CCTV 스트리밍 서버를 재시작합니다.\n일시적으로 전체 영상이 끊길 수 있습니다.\n진행할까요?",
            async () => {
                await callRestartAllServer();
            }
        );
    });

    const refreshBtn = document.getElementById("refreshMap");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            console.log("지도 새로고침 버튼 클릭됨");
            refreshMap();
        });
    }

    document.getElementById('mapBtn').addEventListener('click', () => {

        const mapContainer = document.getElementById('map-container');
        const btn = document.getElementById('mapBtn');
        const icon = btn.querySelector("i");
        const text = btn.querySelector("span");
    
        const isMapVisible = !mapContainer.classList.contains('d-none');
    
        // UI 전환
        if (isMapVisible) {
            // 현재 지도 → CCTV로 변경
            showCCTVView();

            icon.className = "bi bi-geo-alt-fill";
            text.textContent = "지도화면";
        } else {
            // 현재 CCTV → 지도 화면으로 변경
            showMapView();

            icon.className = "bi bi-camera-video-fill";
            text.textContent = "CCTV 화면";
        }
    });

    document.querySelectorAll('.speaker-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.speaker-item').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            
            // 선택된 스피커 정보로 설정 업데이트
            const speakerId = this.dataset.speakerId;
            updateSpeakerSettings(speakerId);
        });
    });

    // 저장 및 발령 버튼 이벤트
    document.querySelector('.btn-primary').addEventListener('click', function() {
        // showToast('설정이 저장되었습니다.', 'success');
        App.utils.showGlobalAlert('설정이 저장되었습니다.', 'success');
    });

    // updateRangeValue('volumeRange', 'volumeValue');
    // generateRandomSpeakers();
    
    // loadSpeakerList();
    // renderSpeakerPanel();

    
    const entryTestBtn = document.getElementById("entryTestBtn");

    if (entryTestBtn) {
        entryTestBtn.addEventListener("click", () => {

            // ===== 테스트용 더미 데이터 =====
            const camName = "CCTV-01";
            const msg = "허가되지 않은 인원이 위험구역에 진입했습니다.";
            const boundaryNum = 2;
            
            if (typeof window.triggerEmergencyScreenEffect === "function") {
                window.triggerEmergencyScreenEffect();
            }

            showEmergencyToastr(camName, msg, boundaryNum);
        });
    }

});

async function callRestartAllServer() {
    try {
        setServerRestartBusy(true);

        const res = await fetch("/api/cctv/stream/restart-all", { method: "POST" }); 
        // ✅ 컨트롤러가 /cctv 아래면: "/cctv/stream/restart-all" 로 바꿔야 함

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // showToast("전체 스트리밍 서버 재시작 요청 완료", "success");
        App.utils.showGlobalAlert("전체 스트리밍 서버 재시작 완료", "success");
    } catch (e) {
        console.error(e);
        // showToast("전체 재시작 실패", "danger");
        App.utils.showGlobalAlert("전체 재시작 실패", "danger");
    } finally {
        setServerRestartBusy(false);
    }
}

function setServerRestartBusy(busy) {
    const btn = document.getElementById("restartAllServerBtn");
    if (!btn) return;
    btn.disabled = busy;
}

function showEmergencyToastr(camName, msg, boundaryNum) {
    const box = document.querySelector(".notification");

    document.getElementById("notification-title").innerText =
        `${camName}\n위험구역 출입 발생`;

    document.getElementById("notification-message").innerText = msg;

    box.classList.add("show");

    box.onclick = () => {
        // 1) 발령 모달 오픈
        window.openBroadcastModal(camName, boundaryNum);

        // 2) 알림 닫기
        box.classList.remove("show");
        document.getElementById("emergencyOverlay").classList.remove("active");
    };
}

// 전역 함수 (어느 JS 파일에서든 호출 가능)
window.openBroadcastModal = function (camName, boundaryNum) {
    const modalEl = document.getElementById("speaker_broadcast_modal");
    if (!modalEl) return;

    // 힌트 문구 업데이트
    const hintEl = document.getElementById("bc_hint");
    if (hintEl) {
        hintEl.innerText =
            `${camName} / ${boundaryNum}번 구역 출입 이벤트 - 스피커 선택 후 발령을 진행하세요.`;
    }

    // boundaryNum / camName 저장 (bc_send 등에서 사용)
    modalEl.dataset.boundaryNum = String(boundaryNum);
    modalEl.dataset.camName = camName;

    // Bootstrap 모달 오픈
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
};


window.onload = function(){

    // CCTV 아이템 클릭 이벤트 (선택)
    const cctvItems = document.querySelectorAll('.cctv-item');

    cctvItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // 액션 버튼 클릭은 제외
            if (!e.target.closest('.action-btn')) {
                // 활성화 클래스 전환
                cctvItems.forEach(cctv => cctv.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

function getSelectedCameraKey() {
    const active = document.querySelector(".cctv-feed.active");
    if (!active) return null;
    return active.dataset.mountpointId || active.dataset.cctvCode || null;
}

function getSelectedCameraName(key) {
    const active = document.querySelector(".cctv-feed.active");
    if (active?.dataset?.camName) return active.dataset.camName;

    const cam = cameras.find(c =>
    String(c.mountpointId) === String(key) || String(c.cctvCode) === String(key)
    );
    return cam?.name ?? "선택 CCTV";
}

function showToast(message, type) {
    const toastEl = document.createElement("div");
    toastEl.className = "toast position-fixed top-0 end-0 m-3";
    toastEl.style.zIndex = 9999;

    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
        <div class="toast-body bg-${type} text-white d-flex align-items-center">
        <i class="fas fa-${type === "success" ? "check" : "exclamation-triangle"} me-2"></i>
        ${message}
        </div>
    `;

    document.body.appendChild(toastEl);

    // ✅ Bootstrap 5: getOrCreateInstance 사용(중복/꼬임 방지)
    const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000, autohide: true });

    // ✅ 일부 환경에서 show() 내부 이벤트 참조로 터지는 걸 방지하기 위해 try/catch
    try {
        t.show();
    } catch (e) {
        console.error("Toast show failed:", e);
        // fallback: 그냥 DOM만 보여주고 제거
        toastEl.classList.add("show");
    }

    toastEl.addEventListener("hidden.bs.toast", () => {
        toastEl.remove();
    });

    // hidden 이벤트가 안 뜨는 경우를 대비한 안전 제거
    setTimeout(() => {
        if (toastEl.isConnected) toastEl.remove();
    }, 3500);
}


function updateSpeakerSettings(speakerId) {
    console.log('스피커 설정 로드:', speakerId);
    
    const speakerSettings = {
        'SP001': { volume: 75, bgm: 30, input: 50 },
        'SP002': { volume: 60, bgm: 25, input: 45 },
        'SP003': { volume: 80, bgm: 35, input: 55 }
    };
    
    const settings = speakerSettings[speakerId] || { volume: 50, bgm: 30, input: 50 };
    
    // document.getElementById('outputVolume').value = settings.volume;
    // document.getElementById('outputVolumeValue').textContent = settings.volume + '%';
    document.getElementById('bgmVolume').value = settings.bgm;
    document.getElementById('bgmVolumeValue').textContent = settings.bgm + '%';
    document.getElementById('inputVolume').value = settings.input;
    document.getElementById('inputVolumeValue').textContent = settings.input + '%';
}

function playAudio(filename) {
    if (currentAudio && !currentAudio.paused) return;

    const filePath = `/audio/${filename}.mp3`;
    currentAudio = new Audio(filePath);
    currentAudio.play().catch(e => console.error('Audio play error:', e));

    currentAudio.onended = function () {
        currentAudio = null;
    };
}

async function getAlertMessage(alertCode, receptionDttm, boundaryNum) {
    try {
        const response = await fetch(`/api/alerts/${alertCode}`);
        const message = await response.text(); // 단일 문자열 반환
        console.log(`경고 코드 ${alertCode}:`, message);
    } catch (error) {
        console.error("경고 메시지를 불러오는 중 오류 발생:", error);
    }
}

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmModalLabel').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;

    const confirmBtn = document.getElementById('confirmModalConfirmBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true); // 기존 이벤트 제거
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', function () {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
        const modalEl = bootstrap.Modal.getInstance(document.getElementById('confirm_modal'));
        modalEl.hide();
    });

    new bootstrap.Modal(document.getElementById('confirm_modal')).show();
}

function getCameraNameByCode(cctvCode) {
    const camera = cameras.find(cam => cam.cctvCode === cctvCode);
    return camera ? camera.name : 'Unknown';
}

// 현재 날짜 및 시간을 반환
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const date = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}년 ${month}월 ${date}일 ${hours} : ${minutes} : ${seconds}`;
}

function setTime() {
    const datetimeElement = document.getElementById("currentDate");
    
    if (datetimeElement) {
        // 초기 시간 설정
        datetimeElement.textContent = getCurrentDateTime();
        
        // 1초마다 시간 업데이트
        setInterval(() => {
            datetimeElement.textContent = getCurrentDateTime();
        }, 1000);
    }
}

// 볼륨 슬라이더 업데이트
function updateRangeValue(rangeId, valueId) {
    const range = document.getElementById(rangeId);
    const valueSpan = document.getElementById(valueId);
    
    range.addEventListener('input', function() {
        valueSpan.textContent = this.value + '%';
    });
}

window.addEventListener("beforeunload", () => {
    if (signalingSocket && signalingSocket.readyState === WebSocket.OPEN) {
        signalingSocket.close();
        console.log("WebSocket closed due to page unload");
    }
});

async function renderSpeakerPanel() {
    const container = document.getElementById("speakerContainer");
    const emptyMessage = document.getElementById("emptySpeakerMessage");

    if (!container || !emptyMessage) return;

    // 1) API에서 스피커 목록 불러오기
    let speakerList = [];
    try {
        const res = await fetch("/api/btype/query/config/list");
        speakerList = await res.json();

    } catch (err) {
        console.error("Speaker list load error:", err);
        container.classList.add("d-none");
        emptyMessage.classList.remove("d-none");
        // emptyMessage.innerText = "스피커 목록을 불러오지 못했습니다.";
        return;
    }

    // 데이터 초기화
    container.innerHTML = "";

    // 2) 스피커 없을 때
    if (!speakerList || speakerList.length === 0) {
        container.classList.add("d-none");
        emptyMessage.classList.remove("d-none");
        return;
    }

    // 3) 데이터 있을 때
    container.classList.remove("d-none");
    emptyMessage.classList.add("d-none");

    // 4) 리스트 렌더링
    speakerList.forEach(sp => {
        const isOnline =
            sp.connStat === "01" || sp.connStat === "1" || sp.status === "온라인";
        
        const html = `
            <div class="speaker-item">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                        <span>${(sp.speakerName || sp.name || "").trim() || "알수 없음"}</span>
                    </div>
                    <small style="opacity: 0.7; font-size: 0.75rem;">
                        ${(sp.speakerAdr || sp.ip || "").trim() || "알수 없음"}
                    </small>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", html);
    });
}

const DISASTER_LATEST_TODAY_API = "/api/btype/query/disasters/latest-today";

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// 한 줄 표시용 (없으면 "오늘 특보 없음")
function buildDisasterOneLine(d) {
    if (!d) return "오늘 특보 없음";

    const type = WRN_LABEL?.[d.dstCode] ?? d.dstName ?? "특보";
    const level = LVL_LABEL?.[d.dstPriority] ?? "";
    const command = CMD_LABEL?.[Number(d.dstSirenCode)] ?? "";
    const region = REG_ID_TO_KO?.[d.dstStoCode] ?? "";

    return [ `${type} ${level}`.trim(), region, command ]
        .filter(Boolean)
        .join(" · ");
}

async function loadTodayLatestDisasterOneLine() {
    const lineEl = document.getElementById("disasterLine");
    const dateEl = document.getElementById("disasterDate");
    if (!lineEl || !dateEl) return;

    // 날짜 배지(클라이언트 기준)
    const today = new Date().toISOString().slice(0, 10);
    dateEl.textContent = today.replaceAll("-", ".");

    try {
    const res = await fetch(DISASTER_LATEST_TODAY_API, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json(); // { today, item }
    const oneLine = buildDisasterOneLine(data?.item);

    lineEl.textContent = oneLine;
    lineEl.classList.remove("text-muted", "text-warning", "text-danger", "text-white-50");

    if (!data?.item) {
        lineEl.classList.add("text-muted");
    } else {
        // 기본은 경고색으로 강조(원하면 조건부로 레벨별 색상도 가능)
        lineEl.classList.add("text-warning");
    }
    } catch (e) {
    console.error("[disaster latest]", e);
    lineEl.textContent = "특보 정보 조회 실패";
    lineEl.classList.remove("text-warning");
    lineEl.classList.add("text-danger");
    }
}

