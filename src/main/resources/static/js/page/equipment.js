const itemsPerPage = 15;
const cardPerPage = 9;
let currentPage = 1;

let selectedSpeakerId = null;
let selectedSpeakers = [];
let selectedBroadcastType = null;
let broadcastInProgress = false;
let audio = null;

const speakerTabCache = {
    isInitialized: false,
    speakers: []
};

const broadcastTabCache = {
    isInitialized: false
};

// Add ripple animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }
    
    .badge.online {
        animation: pulse 2s ease-in-out infinite;
    }
`;
document.head.appendChild(style);

// Tab switching animation
document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', function (e) {
        const target = document.querySelector(e.target.getAttribute('href'));
        target.classList.add('animate-fade-in');
        
        setTimeout(() => {
            target.classList.remove('animate-fade-in');
        }, 600);
    });
});

// Add click effects to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

const statusItems = [
    { field: "connectionStatus", label: "연결 상태" },
    { field: "acStatus", label: "AC 상태" },
    { field: "dcStatus", label: "DC 상태" },
    { field: "batteryStatus", label: "배터리" },
    { field: "solarChargerStatus", label: "태양열" },
    { field: "lteAntennaStatus", label: "LTE" },
    { field: "cpuTemperature", label: "CPU 온도" },
    { field: "mcuVersion", label: "MCU 버전" }
];


// --- 상단 페이지 전환 탭 ---
function switchTab(button, targetId, indicatorId) {
    document.querySelectorAll('.modern-nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    button.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(content => {
        content.classList.remove('show', 'active');
    });

    const content = document.getElementById(`${targetId}-content`);
    if (content) {
        content.classList.add('show', 'active');
    }

    const indicator = document.getElementById(`indicator${indicatorId}`);
    if (indicator) {
        const rect = button.getBoundingClientRect();
        const parentRect = button.parentElement.getBoundingClientRect();
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - parentRect.left}px`;
    }

    if (targetId === 'broadcast' && !speakerTabCache.isInitialized) {
        // console.log('[INFO] 스피커 카드 초기 생성 시작');
        // speakerTabCache.speakers = generateRandomSpeakers(15);
        // renderSpeakerCards(speakerTabCache.speakers);
        renderSpeakerCards();
        speakerTabCache.isInitialized = true;

        // console.log('[INFO] 방송유형 카드 초기 생성 시작');
        renderBroadcastTypes();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('currentView : ', currentView);
    const tabLinks = document.querySelectorAll("#equipmentTabs .nav-link");

    tabLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            const href = link.getAttribute("href");
            const view = href.includes("speaker") ? "speaker" : "broadcast";

            const url = new URL(window.location);
            url.searchParams.set("view", view);
            window.history.replaceState({}, '', url);
        });
    });

    const activeTab = document.querySelector(".modern-nav-tab.active");
    if (activeTab) {
        switchTab(activeTab, activeTab.dataset.target, activeTab.dataset.indicator);
    }

    // document.getElementById('speakerImageSection').style.display = 'none';
    renderSpeakerTable(currentPage);
    // renderSpeakerTable(currentPage);

    const container = document.getElementById("statusPanelContainer");

    statusItems.forEach(item => {
        const col = document.createElement("div");
        col.className = "col-12 col-lg-6";
    
        col.innerHTML = `
            <div class="status-item bg-light d-flex align-items-center gap-4 p-4 border-bottom rounded shadow-sm">
                <div>
                    <div class="text-secondary small mb-2">${item.label}</div>
                    <div class="fw-bold" data-field="${item.field}">-</div>
                </div>
            </div>
        `;
    
        container.appendChild(col);
    });
    
});

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        startBroadcast();
    } else if (e.key === 'Escape') {
        stopBroadcast();
    }
});

// --- 스피커 관리 테이블 렌더링 ---
const data = Array.from({ length: 35 }, (_, i) => {
    const random = arr => arr[Math.floor(Math.random() * arr.length)];
    return {
        id: i + 1,
        name: `스피커 ${i + 1}`,
        status: i % 2 === 0 ? 'Y' : 'N',
        time: `2025-07-11 10:${(i + 10).toString().padStart(2, '0')}`,
        phone: `010-1234-${String(i + 1).padStart(4, '0')}`,
        location: `지역 ${i + 1}`,
        lat: 37.5 + i * 0.01,
        lon: 127 + i * 0.01,
        enabled: i % 2 === 0 ? 'Y' : 'N',
        image: '/images/sp.png',
        connectionStatus: random(['Online', 'Offline']),
        acStatus: random(['정상', '비정상']),
        dcStatus: random(['정상', '비정상']),
        batteryStatus: random(['100%', '90%', '80%', '70%']),
        solarChargerStatus: random(['충전 중', '충전 완료', '비활성']),
        lteAntennaStatus: random(['신호 강함', '신호 약함']),
        cpuTemperature: random(['32°C', '35°C', '40°C']),
        mcuVersion: random(['v1.0.0', 'v2.1.3', 'v3.0.0'])
    };
});

function renderSpeakerTable() {
    console.log('renderSpeakerTable : ', speakerList);

    const tbody = document.getElementById('speakerTableBody');
    tbody.innerHTML = '';

    speakerList.forEach((item) => {
        const row = document.createElement('tr');
        const statusBadgeClass = item.connStat === '01' ? 'status-success' : 'status-error';
        const statusBadgeText = item.connStat === '01'
        ? `<i class="bi bi-check-circle-fill me-1"></i>연결`
        : `<i class="bi bi-exclamation-triangle-fill me-1"></i>이상`;
            const badgeClass = item.useInfo === '1' ? 'status-success' : 'status-primary';
        const badgeText = item.useInfo === '1' ? '사용' : '미사용';

        row.innerHTML = `
            <td>
                <input type="checkbox" 
                    name="selectedIds" 
                    value="${App.utils.safeValue(item.speakerCode)}"
                    data-location="${App.utils.safeValue(item.locationCode)}"
                    data-name="${App.utils.safeValue(item.speakerName)}"
                    data-adr="${App.utils.safeValue(item.speakerAdr)}">
            </td>
            <td>${App.utils.safeValue(item.id)}</td>
            <td>${App.utils.safeValue(item.speakerName)}</td>
            <td><span class="status-badge ${statusBadgeClass}">${statusBadgeText}</span></td>
            <td>${App.utils.safeValue(item.recvTime)}</td>
            <td>${App.utils.safeValue(item.phone)}</td>
            <td>${App.utils.safeValue(item.speakerAdr)}</td>
            <td>${App.utils.safeValue(item.lat)}</td>
            <td>${App.utils.safeValue(item.lng)}</td>
            <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        `;
        row.addEventListener('click', (event) => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            
            if (event.target.type === 'checkbox') {
                // 체크박스 클릭 시 다른 체크박스 해제
                document.querySelectorAll('input[name="selectedIds"]').forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
                return;
            }
        
            // 행 클릭 시 체크박스 토글
            const isChecked = checkbox.checked;
            document.querySelectorAll('input[name="selectedIds"]').forEach(cb => cb.checked = false); // 모두 해제
            checkbox.checked = !isChecked; // 현재 행만 토글

            if (!checkbox.checked) {
                resetDetail();
            }
        });

        tbody.appendChild(row);
    });

    document.getElementById('speakerCount').innerText = `총 ${speakerList.length}개`;
}

// --- 방송 스피커 리스트 카드 ---
function generateRandomSpeakers(count) {
    const locations = [
        '서울시 강남구', '부산시 해운대구', '대전시 유성구',
        '광주시 서구', '인천시 연수구', '대구시 수성구',
        '울산시 남구', '경기도 수원시', '강원도 춘천시',
        '충청북도 청주시', '전라북도 전주시', '제주시'
    ];

    const speakers = [];

    for (let i = 1; i <= count; i++) {
        const location = locations[Math.floor(Math.random() * locations.length)];
        const lat = (33 + Math.random() * 7).toFixed(4);  // 33 ~ 40도
        const lng = (124 + Math.random() * 6).toFixed(4); // 124 ~ 130도
        const online = Math.random() > 0.3;

        speakers.push({
            id: `spk${i}`,
            name: `스피커 ${String.fromCharCode(64 + i)}`, // A, B, C, ...
            location,
            lat,
            lng,
            online
        });
    }

    return speakers;
}

function renderSpeakerCards() {
    const container = document.getElementById('speaker-card-container');
    if (!container) return;

    container.innerHTML = ''; // 초기화

    // 전체 스피커 카드
    const allCard = document.createElement('div');
    allCard.className = 'speaker-card all-speakers';
    allCard.onclick = () => selectSpeaker('all');
    allCard.innerHTML = `
        <h6 class="mb-1">전체 스피커</h6>
        <small>모든 스피커에 방송</small>
    `;
    container.appendChild(allCard);

    // 랜덤 스피커 카드
    speakerList.forEach(speaker => {
        console.log('renderSpeakerCards : id = ', speaker.id);

        const card = document.createElement('div');
        card.className = 'speaker-card';
        card.dataset.id = speaker.id; // 추가
        card.onclick = () => selectSpeaker(speaker.id);

        let statusClass = '';
        switch (speaker.connStat) {
            case "00": // 연결 안 됨
                statusClass = "offline";
                break;
            case "01": // 연결 중
                statusClass = "online";
                break;
            case "02": // 연결 됨
                statusClass = "error";
                break;
            default:
                statusClass = "offline";
        }
        
        card.innerHTML = `
            <div class="d-flex mb-3">
                <div class="speaker-status ${statusClass}"></div>
            </div>

            <div class="d-flex flex-column justify-content-center flex-grow-1 text-warp">
                <h6 class="mt-2 mb-1">${speaker.speakerName ? speaker.speakerName : "알 수 없음"}</h6>
                <small class="text-white-50 mb-1">${speaker.speakerAdr ? speaker.speakerAdr : "알 수 없음"}</small>
                <small><i class="bi bi-geo-alt"></i> 
                    ${speaker.lat && speaker.lng ? `${speaker.lat}, ${speaker.lng}` : "알 수 없음"}
                </small>
            </div>
        `;

        container.appendChild(card);
    });

    console.log(`[INFO] 총 ${speakerList.length}개 스피커 카드 렌더링 완료`);
}

// --- 스피커 선택 및 방송 ---
function selectSpeaker(speakerId) {
    const cards = document.querySelectorAll('.speaker-card');
    const allButton = document.querySelector('.all-speakers');

    if (speakerId === 'all') {
        if (selectedSpeakers.includes('all')) {
            // 전체 해제
            allButton.classList.remove('selected');
            cards.forEach(card => card.classList.remove('selected'));
            selectedSpeakers = [];
        } else {
            // 전체 선택 (유효한 ID만)
            allButton.classList.add('selected');
            cards.forEach(card => card.classList.add('selected'));

            const ids = Array.from(cards)
                .map(card => card.dataset.id)
                .filter(id => id); // undefined/null 제거

            selectedSpeakers = ['all', ...ids];
        }
    } else {
        // 개별 스피커 선택
        allButton.classList.remove('selected');
        selectedSpeakers = selectedSpeakers.filter(id => id !== 'all');

        const card = document.querySelector(`.speaker-card[data-id="${speakerId}"]`);
        if (!card) return;

        if (selectedSpeakers.includes(speakerId)) {
            selectedSpeakers = selectedSpeakers.filter(id => id !== speakerId);
            card.classList.remove('selected');
        } else {
            selectedSpeakers.push(speakerId);
            card.classList.add('selected');
        }
    }

    console.log('선택된 스피커:', selectedSpeakers);
}

function renderBroadcastTypes() {
    const container = document.getElementById('broadcastTypesContainer');
    container.innerHTML = '';

    broadcastList.forEach(broadcast => {
        const div = document.createElement('div');
        div.className = 'broadcast-type ${broadcast.type}';

        div.dataset.title = broadcast.title;
        div.dataset.message = broadcast.text;
        div.dataset.audio = broadcast.audioFile;
        div.dataset.category = broadcast.type;

        const icon = document.createElement('i');
        icon.className = `bi ${broadcast.icon}`;
        const color = broadcast.type === 'test' ? 'var(--accent-primary)' :
                    broadcast.type === 'warning' ? 'var(--accent-orange)' :
                    broadcast.type === 'emergency' ? 'var(--accent-red)' :
                    broadcast.type === '' ? 'var(--accent-green)' : 'var(--accent-primary)';
        icon.style.color = color;
        icon.style.fontSize = '1.5rem';
        div.appendChild(icon);

        const titleDiv = document.createElement('div');
        titleDiv.textContent = broadcast.title;
        div.appendChild(titleDiv);

        div.onclick = () => selectBroadcastType(div, broadcast.title);
        container.appendChild(div);
    });

    // 초기화
    resetSelection();
}

function selectBroadcastType(element, type) {
    const infoArea = document.getElementById('selectedBroadcastInfo');
    const customArea = document.getElementById('customMessageArea');
    const titleEl = document.getElementById('selectedBroadcastTitle');
    const messageEl = document.getElementById('selectedBroadcastMessage');
    const audioEl = document.getElementById('selectedBroadcastAudio');

    // 선택 해제 및 초기화
    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        selectedBroadcastType = null;

        // 표시 영역 초기화 및 숨기기
        titleEl.innerText = '-';
        messageEl.innerText = '';
        audioEl.innerText = '';
        infoArea.style.display = 'none';
        customArea.style.display = 'none';

        console.log('선택이 해제되었습니다.');
        return;
    }

    // 기존 선택 해제
    document.querySelectorAll('.broadcast-type').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 새로운 선택
    element.classList.add('selected');
    selectedBroadcastType = type;

    titleEl.innerText = '-';
    messageEl.innerText = '';
    audioEl.innerText = '';
    infoArea.style.display = 'none';
    customArea.style.display = 'none';

    if (type === '사용자정의') {
        customArea.style.display = 'block';
        return;
    } else {
        customArea.style.display = 'none';

        const title = element.dataset.title || '-';
        const message = element.dataset.message || '메시지 내용이 없습니다.';
        const audio = element.dataset.audio || '';
    
        titleEl.innerText = title;
        messageEl.innerText = message;
        audioEl.innerText = audio ? `음원 파일: ${audio}` : '';
        infoArea.style.display = 'block';
    }
    
    console.log('선택된 방송 타입:', type);
}

function startBroadcast() {
    if (!selectedBroadcastType) {
        // alert('방송 유형을 선택해 주세요.');
        App.utils.showGlobalAlert("방송 유형을 선택해 주세요.", "warning");
        return;
    }

    const typeInfo = broadcastList.find(bt => bt.title === selectedBroadcastType);
    console.log('실행할 방송 타입 :', typeInfo);
    if (!typeInfo || !typeInfo.audioFile) {
        // alert('유효한 방송 유형이 아닙니다.');
        App.utils.showGlobalAlert("유효한 방송 유형이 아닙니다.", "danger");
        return;
    }

    const audioSrc = `/audio/${typeInfo.audioFile}`;
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
    audio = new Audio(audioSrc);

    const progressContainer = document.getElementById('broadcastProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    progressContainer.classList.remove('d-none');
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    broadcastInProgress = true;

    audio.play().then(() => {
        const duration = audio.duration;

        const updateProgress = () => {
            if (!broadcastInProgress || audio.paused || audio.ended) {
                progressFill.style.width = '100%';
                progressText.textContent = '100%';
                progressContainer.classList.add('d-none');
                broadcastInProgress = false;
                audio.removeEventListener('timeupdate', updateProgress);
                console.log('방송 재생 완료 또는 중지됨');
                resetSelection();
                return;
            }
            const percent = (audio.currentTime / duration) * 100;
            progressFill.style.width = `${percent.toFixed(1)}%`;
            progressText.textContent = `${percent.toFixed(1)}%`;
        };

        audio.addEventListener('timeupdate', updateProgress);
    }).catch(err => {
        // alert('오디오 재생에 실패했습니다.');
        App.utils.showGlobalAlert("오디오 재생에 실패했습니다.", "danger");
        console.error(err);
        progressContainer.classList.add('d-none');
        broadcastInProgress = false;
    });

}

function stopBroadcast() {
    if (!broadcastInProgress) {
        // alert('진행 중인 방송이 없습니다.');
        App.utils.showGlobalAlert("진행 중인 방송이 없습니다.", "warning");
        return;
    }

    broadcastInProgress = false;

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    const progressContainer = document.getElementById('broadcastProgress');
    progressContainer.classList.add('d-none');

    // alert('방송이 중지되었습니다.');
    App.utils.showGlobalAlert("방송이 중지되었습니다.", "success");

    console.log('방송 중지됨');
}

function testBroadcast() {
    if (selectedSpeakers.length === 0) {
        // alert('테스트할 스피커를 선택해주세요.');
        App.utils.showGlobalAlert("테스트할 스피커를 선택해주세요.", "warning");

        return;
    }
    
    const speakers = selectedSpeakers.includes('all') ? '전체 스피커' : selectedSpeakers.join(', ');
    // alert(`${speakers}에서 테스트 방송을 시작합니다.`);
    App.utils.showGlobalAlert(`${speakers}에서 테스트 방송을 시작합니다.`, "info");

    console.log(`테스트 방송: ${speakers}`);
}

function resetSelection() {
    // 스피커 선택 초기화
    selectedSpeakers = [];
    document.querySelectorAll('.speaker-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 방송 타입 선택 초기화
    selectedBroadcastType = null;
    document.querySelectorAll('.broadcast-type').forEach(type => {
        type.classList.remove('selected');
    });
    
    // 사용자 정의 메시지 초기화
    document.getElementById('customMessageArea').style.display = 'none';
    document.getElementById('customMessageText').value = '';
    
    // 선택 해제
    document.querySelectorAll('.broadcast-type').forEach(el => {
        el.classList.remove('selected');
    });

    // 표시 영역 초기화
    const infoArea = document.getElementById('selectedBroadcastInfo');
    const customArea = document.getElementById('customMessageArea');
    const titleEl = document.getElementById('selectedBroadcastTitle');
    const messageEl = document.getElementById('selectedBroadcastMessage');
    const audioEl = document.getElementById('selectedBroadcastAudio');

    titleEl.innerText = '-';
    messageEl.innerText = '';
    audioEl.innerText = '';
    infoArea.style.display = 'none';
    customArea.style.display = 'none';

    console.log('선택이 초기화되었습니다.');
}

function toggleAll(source) {
    const checkboxes = document.querySelectorAll('input[name="selectedIds"]');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function renderDetail(item, speakerName, speakerAdr) {
    console.log('renderDetail : ', item);

    document.getElementById('selectedSpeakerTitle').innerText =
        App.utils.safeValue(speakerName);
    document.getElementById('selectedSpeakeraddress').innerText =
        App.utils.safeValue(speakerAdr);
    document.querySelector('[data-field="connectionStatus"]').innerText =
        App.utils.safeValue(item.connStat === '01' ? 'ONLINE' : 'OFFLINE');
    document.querySelector('[data-field="acStatus"]').innerText =
        App.utils.safeValue(item.acStat === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="dcStatus"]').innerText =
        App.utils.safeValue(item.dcStat === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="batteryStatus"]').innerText =
        App.utils.safeValue(item.battery, true, '%', 0);
    document.querySelector('[data-field="solarChargerStatus"]').innerText =
        App.utils.safeValue(item.solar === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="lteAntennaStatus"]').innerText =
        App.utils.safeValue(item.lte === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="cpuTemperature"]').innerText =
        App.utils.safeValue(item.cpuTemp, true, '°C', 0);
    document.querySelector('[data-field="mcuVersion"]').innerText =
        App.utils.safeValue(item.mcuVer);

    // const img = document.getElementById('speakerImage');
    // img.src = item.image || '/images/sp.png';

    App.utils.showGlobalAlert("스피커 정보 요청이 완료되었습니다.", "success");
}

function resetDetail() {
    // 기본값 초기화
    document.getElementById('selectedSpeakerTitle').innerText = '-';
    document.getElementById('selectedSpeakeraddress').innerText = '-';
    document.querySelector('[data-field="connectionStatus"]').innerText = '-';
    document.querySelector('[data-field="acStatus"]').innerText = '-';
    document.querySelector('[data-field="dcStatus"]').innerText = '-';
    document.querySelector('[data-field="batteryStatus"]').innerText = '-';
    document.querySelector('[data-field="solarChargerStatus"]').innerText = '-';
    document.querySelector('[data-field="lteAntennaStatus"]').innerText = '-';
    document.querySelector('[data-field="cpuTemperature"]').innerText = '-';
    document.querySelector('[data-field="mcuVersion"]').innerText = '-';

    // const img = document.getElementById('speakerImage');
    // img.src = '/images/sp.png';
}


function renderDetail(item, speakerName, speakerAdr) {
    console.log('renderDetail : ', item);
    console.log('배터리 raw 값:', item.battery);
    console.log('cpu 값:', item.cpuTemp);
    console.log('mcu 값:', item.mcuVer);

    console.log('배터리 raw 값:', item.battery, typeof item.battery);

    document.getElementById('selectedSpeakerTitle').innerText
        = App.utils.safeValue(speakerName);
    document.getElementById('selectedSpeakeraddress').innerText
        = App.utils.safeValue(speakerAdr);
    document.querySelector('[data-field="connectionStatus"]').innerText
        = App.utils.safeValue(item.connStat === '01' ? 'ONLINE' : 'OFFLINE');
    document.querySelector('[data-field="acStatus"]').innerText
        = App.utils.safeValue(item.acStat === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="dcStatus"]').innerText
        = App.utils.safeValue(item.dcStat === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="batteryStatus"]').innerText
    = App.utils.safeValue(item.battery, true, '%', 0);
    document.querySelector('[data-field="solarChargerStatus"]').innerText
        = App.utils.safeValue(item.solar === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="lteAntennaStatus"]').innerText
        = App.utils.safeValue(item.lte === '1' ? 'ON' : 'OFF');
    document.querySelector('[data-field="cpuTemperature"]').innerText
        = App.utils.safeValue(item.cpuTemp, true, '°C', 0);
    document.querySelector('[data-field="mcuVersion"]').innerText
        = App.utils.safeValue(item.mcuVer);

    // const img = document.getElementById('speakerImage');
    // img.src = item.image || '/images/sp.png';

    App.utils.showGlobalAlert("스피커 정보 요청이 완료되었습니다.", "success");
}

function resetDetail() {
    // 기본값 초기화
    document.getElementById('selectedSpeakerTitle').innerText = '스피커를 선택하세요';
    document.getElementById('selectedSpeakeraddress').innerText = '';
    document.querySelector('[data-field="connectionStatus"]').innerText = '-';
    document.querySelector('[data-field="acStatus"]').innerText = '-';
    document.querySelector('[data-field="dcStatus"]').innerText = '-';
    document.querySelector('[data-field="batteryStatus"]').innerText = '-';
    document.querySelector('[data-field="solarChargerStatus"]').innerText = '-';
    document.querySelector('[data-field="lteAntennaStatus"]').innerText = '-';
    document.querySelector('[data-field="cpuTemperature"]').innerText = '-';
    document.querySelector('[data-field="mcuVersion"]').innerText = '-';

    // const img = document.getElementById('speakerImage');
    // img.src = '/images/sp.png';
}

function showAddBroadcastModal() {
    const modalEl = document.getElementById('addBroadcastModal');
    if (!modalEl) {
        console.error('addBroadcastModal 요소를 찾을 수 없습니다.');
        return;
    }
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function submitAddBroadcast() {
    const code = document.getElementById('broadcastCode').value.trim();
    const type = document.getElementById('broadcastType').value;
    const title = document.getElementById('broadcastTitle').value.trim();
    const text = document.getElementById('broadcastText').value.trim();
    const useInfo = parseInt(document.getElementById('broadcastUseInfo').value);
    const audioFile = document.getElementById('broadcastAudio').value.trim();

    if (!code || !title || !text) {
        showToast('필수 항목을 모두 입력해주세요.', '오류');
        // alert('필수 항목을 모두 입력해주세요.');
        return;
    }

    // ✅ 현재 등록된 방송 목록 가져오기 (renderBroadcastTypes()에서 사용 중인 전역 배열 사용)
    if (typeof broadcastList !== 'undefined' && Array.isArray(broadcastList)) {
        const duplicate = broadcastList.find(b =>
            b.code === code || b.title === title
        );
        if (duplicate) {
            showToast(`이미 동일한 코드(${duplicate.code}) 또는 제목("${duplicate.title}")의 방송이 존재합니다.`, '오류');

            // alert(`이미 동일한 코드(${duplicate.code}) 또는 제목("${duplicate.title}")의 방송이 존재합니다.`);
            return;
        }
    } else {
        console.warn('⚠️ broadcastList 배열을 찾을 수 없습니다. renderBroadcastTypes()에서 전역 변수로 유지해야 합니다.');
    }

    const newBroadcast = {
        code,
        type,
        title,
        text,
        useInfo,
        audioFile,
        icon: 'bi-broadcast' // 기본 아이콘
    };

    fetch('/api/broadcast/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBroadcast)
    })
    .then(res => res.json())
    .then(data => {
        showToast('✅ 방송이 추가되었습니다.', '성공');

        // alert('✅ 방송이 추가되었습니다.');
        const modalEl = document.getElementById('addBroadcastModal');
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) modal = new bootstrap.Modal(modalEl);
        modal.hide();

        renderBroadcastTypes(); // 목록 갱신
    })
    .catch(err => {
        console.error(err);
        showToast('방송 추가 중 오류가 발생했습니다.', '실패');

        // alert('방송 추가 중 오류가 발생했습니다.');
    });
}

function getCheckedSpeakers() {
    const selectedCheckbox = document.querySelector('input[name="selectedIds"]:checked');
    return selectedCheckbox;
}

function handleButtonClick(button, actionFn) {
    if (button.disabled) return; // 이미 눌렸다면 무시

    const checked = document.querySelector('input[name="selectedIds"]:checked');
    if (!checked) {
        resetDetail();
        App.utils.showGlobalAlert("스피커를 선택해주세요.", "warning");
        return;
    }

    // 버튼 비활성화 (중복 클릭 방지)
    // button.disabled = true;
    // button.classList.add("disabled");

    // 실제 동작 실행
    actionFn(checked);

    // 2초 후 버튼 다시 활성화
    // setTimeout(() => {
    //     button.disabled = false;
    //     button.classList.remove("disabled");
    // }, 2000);
}

// --- 스피커 설정 ---
function requestStatus(selectedCheckbox) {

    const speakerCode = selectedCheckbox.value;
    const locationCode = selectedCheckbox.dataset.location;
    const speakerName = selectedCheckbox.dataset.name;
    const speakerAdr  = selectedCheckbox.dataset.adr;

    console.log("요청할 스피커 코드:", speakerCode);

    fetch(`/menu/speaker/detail?locationCode=${locationCode}&speakerCode=${speakerCode}`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP status ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log("서버에서 받은 스피커 상세 데이터:", JSON.stringify(data, null, 2));
    
            if (data && data.length > 0) {
                renderDetail(data[0], speakerName, speakerAdr);
            } else {
                resetDetail();
                App.utils.showGlobalAlert("해당 스피커의 상세 정보가 없습니다.", "info");
                console.warn("스피커 상세 정보 없음:", { locationCode, speakerCode });
            }
        })
        .catch(err => {
            console.error("스피커 정보 요청 실패:", err);
            resetDetail();
            App.utils.showGlobalAlert("스피커 정보 요청 실패", "danger");
        });
}

function showUploadModal() {
    const modalEl = document.getElementById('uploadModal');
    if (!modalEl) {
        alert("모달 요소를 찾을 수 없습니다.");
        return;
    }

    // ✅ 선택 스피커 확인
    if (selectedSpeakers.length === 0) {
        alert("⚠️ 전송할 스피커를 선택하세요!");
        return;
    }

    if (selectedSpeakers.includes('all') || selectedSpeakers.length > 1) {
        alert("⚠️ 음원 파일은 한 번에 한 스피커에만 전송할 수 있습니다.");
        return;
    }

    // ✅ 선택된 스피커 정보 표시
    const targetId = selectedSpeakers[0];
    const speaker = speakerList.find(s => s.id == targetId);

    document.getElementById('targetSpeakerName').textContent =
        speaker?.speakerName || speaker?.speakerAdr || '알 수 없음';

    document.getElementById('speakerHost').value =
        speaker.speakerAdr || speaker.ipAddr || '';

    // ✅ 모달 열기 전 form 및 메시지 초기화
    const form = document.getElementById('uploadForm');
    if (form) form.reset();

    const resultMsg = document.getElementById('uploadResult');
    if (resultMsg) {
        resultMsg.textContent = "";
        resultMsg.classList.remove("text-success", "text-danger");
    }

    // ✅ 모달 표시
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
}


// 음원 파일 전송
async function sendAudioToSpeaker() {
    const form = document.getElementById('uploadForm');
    const resultMsg = document.getElementById('uploadResult');
    const formData = new FormData(form);

    console.log("📦 [FormData Entries]");
    for (let [key, value] of formData.entries()) {
        console.log(`🔑 ${key}:`, value);
    }

    console.log("📝 [Raw Form Object]:", form);

    // 모든 입력 필드에 실시간 유효성 검사 연결
    form.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('input', () => {
        if (input.value.trim()) {
            input.classList.remove('is-invalid');
        }
        });
    });

    // 전송 전 필드 유효성 검사
    let valid = true;
    form.querySelectorAll('input[required]').forEach(input => {
        if (!input.value.trim()) {
        input.classList.add('is-invalid');
        valid = false;
        } else {
        input.classList.remove('is-invalid');
        }
    });

    if (!valid) {
        resultMsg.textContent = "⚠️ 모든 항목을 입력해주세요.";
        resultMsg.classList.remove("text-success", "text-danger");
        resultMsg.classList.add("text-warning");
        return;
    }

    // 전송 시작 메시지
    resultMsg.textContent = "🔄 전송 중입니다...";
    resultMsg.classList.remove("text-success", "text-danger", "text-warning");

    try {
        const response = await fetch('/api/spk/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('전송 실패');
        const message = await response.text();

        resultMsg.textContent = "✅ " + message;
        resultMsg.classList.add("text-success");

        // 성공 시 폼 초기화 및 오류 표시 제거
        form.reset();
        form.querySelectorAll('input').forEach(input => input.classList.remove('is-invalid'));

    } catch (error) {
        resultMsg.textContent = "❌ 오류: " + error.message;
        resultMsg.classList.add("text-danger");
    }
}


// --- 시간 설정 ---
function setTime(selectedIds) {
    App.utils.showGlobalAlert("시간 설정이 완료되었습니다.", "primary");
}

// --- 원격 업데이트 ---
function remoteUpdate(selectedCheckbox) {
    App.utils.showGlobalAlert("원격 업데이트가 완료되었습니다.", "primary");
}

// --- MCU 초기화 ---
function mcuResetRequest(selectedCheckbox) {
    App.utils.showGlobalAlert("MCU 초기화가 완료되었습니다.", "primary");
}

function showToast(message, title) {
    // App.utils.showToast(message, title);
    App.utils.showToast(message);

    // App.utils.showToast('데이터 저장 완료', '시스템');
}