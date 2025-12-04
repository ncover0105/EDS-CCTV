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

    modalEl.addEventListener("shown.bs.modal", () => {
        console.log("broadcast_modal opened → running init()");
        BroadcastModal.init();
    });

    Weather.init();          // AWS, 예보, 레이더, 위성 (2분 주기)
    Weather.loadAirQuality(); // 대기질 1회 호출

    if (typeof Janus === "undefined") {
        alert("❌ Janus.js 라이브러리 로드 실패");
        return;
    }
    
    CCTVLayout.init(cameras);
    CCTVJanus.initSignaling(cameras);
    SSE_MQTT.connect();

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
        showToast('설정이 저장되었습니다.', 'success');
    });

    updateRangeValue('volumeRange', 'volumeValue');
    // generateRandomSpeakers();
    
    // loadSpeakerList();
    renderSpeakerPanel();
});

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

function showToast(message, type) {
    const toastHtml = `
        <div class="toast position-fixed top-0 end-0 m-3" style="z-index: 9999;">
            <div class="toast-body bg-${type} text-white d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'} me-2"></i>
                ${message}
            </div>
        </div>
    `;
    
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    document.body.appendChild(toastElement.firstElementChild);
    
    const toast = new bootstrap.Toast(toastElement.firstElementChild);
    toast.show();
    
    setTimeout(() => {
        toastElement.firstElementChild.remove();
    }, 3000);
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

let speakerCounter = 0;
        
// 스피커 상태 배열
const statuses = ['온라인', '오프라인'];
const statusClasses = ['online', 'offline'];
const statusColors = ['success', 'danger'];

// 랜덤 IP 생성
function generateRandomIP() {
    return `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
}

// 스피커 카드 생성
function createSpeakerCard(id, name, ip, status) {

    const isOnline = status === "온라인";

    const textClass = isOnline 
        ? "text-white" 
        : "text-light opacity-50";   // 👈 오프라인 흐리게

    const ipClass = isOnline
        ? "text-light opacity-75"
        : "text-light opacity-25";   // 👈 IP도 더 흐리게

    return `
        <div class="speaker-card h-auto min-h-0 mb-2" data-speaker-id="${id}">
            <div class="d-flex align-items-center">

                <!-- Left: Speaker Info -->
                <div class="flex-grow-1">
                    <div class="fw-semibold ${textClass}">${name}</div>
                    <div class="small ${ipClass}">${ip}</div>
                </div>

                <!-- Right: Status -->
                <div class="d-flex align-items-center">
                    <span class="badge rounded-pill px-3 py-1 ${isOnline ? 'online' : 'secondary'}">
                        ${status}
                    </span>
                </div>
            </div>
        </div>
    `;
}


// 스피커 추가
function addRandomSpeaker() {
    speakerCounter++;
    const statusIndex = Math.floor(Math.random() * 2);
    const status = statuses[statusIndex];
    const statusClass = statusClasses[statusIndex];
    const statusColor = statusColors[statusIndex];
    
    const speakerCard = createSpeakerCard(
        `SP${String(speakerCounter).padStart(3, '0')}`,
        `스피커-${String(speakerCounter).padStart(3, '0')}`,
        generateRandomIP(),
        status,
        statusClass,
        statusColor
    );
    
    document.getElementById('speakerOffcanvasList').insertAdjacentHTML('beforeend', speakerCard);
    updateSpeakerCount();
}

// 여러 스피커 랜덤 생성
function generateRandomSpeakers() {
    console.log("generateRandomSpeakers : ");
    // 기존 스피커 초기화
    document.getElementById('speakerOffcanvasList').innerHTML = '';
    speakerCounter = 0;
    
    // 5-15개 랜덤 생성
    const count = Math.floor(Math.random() * 11) + 5;
    for (let i = 0; i < count; i++) {
        addRandomSpeaker();
    }
}

// 스피커 개수 업데이트
function updateSpeakerCount() {
    document.getElementById('speakerCount').textContent = `총 ${speakerCounter}개`;
}

// 스피커 카드 클릭 이벤트
document.addEventListener('click', function(e) {
    if (e.target.closest('.speaker-card')) {
        // 기존 active 제거
        document.querySelectorAll('.speaker-card').forEach(card => {
            card.classList.remove('active');
        });
        // 클릭한 카드에 active 추가
        e.target.closest('.speaker-card').classList.add('active');
    }
});

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
        // App.utils.fetchJson() 사용 가능
        // speakerList = await App.utils.fetchJson("/api/speaker/list");

        const res = await fetch("/api/speaker/list");
        speakerList = await res.json();

    } catch (err) {
        console.error("❌ Speaker list load error:", err);
        container.classList.add("d-none");
        emptyMessage.classList.remove("d-none");
        emptyMessage.innerText = "스피커 목록을 불러오지 못했습니다.";
        return;
    }

    // ⛔ 데이터 초기화
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
            <div class="log-item d-flex align-items-center justify-content-between">
                <div>
                    <div class="fw-semibold text-white">
                        ${(sp.speakerName || sp.name || "").trim() || "알수 없음"}
                    </div>
                    <div class="small text-white opacity-75">
                        ${(sp.speakerAdr || sp.ip || "").trim() || "알수 없음"}
                    </div>
                </div>

                <span class="status-badge rounded-4 ${isOnline ? "status-success " : "status-error"}">
                    ${isOnline ? "온라인" : "오프라인"}
                </span>
            </div>
        `;
        // bg-transparent
        container.insertAdjacentHTML("beforeend", html);
    });
}