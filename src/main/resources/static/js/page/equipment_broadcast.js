/* ===================================
 * equipment_broadcast.js
 * 방송 카드, 방송 선택, 방송 실행
 * =================================== */

function safeValue(value, fallback = "-") {
    return (value === null || value === undefined || String(value).trim() === "")
        ? fallback
        : value;
}

function safeName(name) {
    if (!name || name.trim() === "") return "이름없음";
    if (name.length > 20) return name.substring(0, 10) + "…" + name.substring(name.length - 5);
    return name;
}

function safeStatus(connStat) {
    switch (connStat) {
        case "00": return "offline";
        case "01": return "online";
        case "02": return "error";
        default:   return "offline"; // 알 수 없는 값 → offline 처리
    }
}

function renderSpeakerCards() {
    const container = document.getElementById('speaker-card-container');
    if (!container) return;

    container.innerHTML = '';

    /* 전체 스피커 */
    const allCard = document.createElement('div');
    allCard.className = 'speaker-card all-speakers';
    allCard.onclick = () => selectSpeaker('all');
    allCard.innerHTML = `
        <h6 class="mb-1">전체 스피커</h6>
        <small>모든 스피커에 방송</small>
    `;
    container.appendChild(allCard);

    /* 개별 스피커 */
    speakerList.forEach(speaker => {
        const card = document.createElement('div');
        card.className = 'speaker-card';
        card.dataset.id = safeValue(speaker.id, "");
        card.onclick = () => selectSpeaker(speaker.id);

        const name = safeName(safeValue(speaker.speakerName));
        const adr = safeValue(speaker.speakerAdr, "-");
        const lat = safeValue(speaker.lat, "-");
        const lng = safeValue(speaker.lng, "-");

        const statusClass = safeStatus(speaker.connStat);

        card.innerHTML = `
            <div class="d-flex mb-3">
                <div class="speaker-status ${statusClass}"></div>
            </div>
            <div class="d-flex flex-column justify-content-center flex-grow-1">
                <h6 class="mt-2 mb-1">${name}</h6>
                <small class="text-white-50 mb-1">${adr}</small>
                <small><i class="bi bi-geo-alt"></i> ${lat}, ${lng}</small>
            </div>
        `;

        container.appendChild(card);
    });

    console.log(`총 ${speakerList.length}개 스피커 카드 생성`);
}


/* ------------------------------
    스피커 선택
------------------------------ */
function selectSpeaker(speakerId) {
    const cards = document.querySelectorAll('.speaker-card');
    const allButton = document.querySelector('.all-speakers');

    if (speakerId === 'all') {
        if (selectedSpeakers.includes('all')) {
            selectedSpeakers = [];
            allButton.classList.remove('selected');
            cards.forEach(c => c.classList.remove('selected'));
        } else {
            allButton.classList.add('selected');
            selectedSpeakers = ['all', ...Array.from(cards).map(c => c.dataset.id)];
            cards.forEach(c => c.classList.add('selected'));
        }
    } else {
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

    console.log("선택된 스피커:", selectedSpeakers);
}

/* ------------------------------
    방송 타입 카드 렌더링
------------------------------ */
function renderBroadcastTypes() {
    const container = document.getElementById('broadcastTypesContainer');
    container.innerHTML = '';

    broadcastList.forEach(broadcast => {
        const div = document.createElement('div');
        div.className = `broadcast-type ${broadcast.type}`;

        div.dataset.title = broadcast.title;
        div.dataset.message = broadcast.text;
        div.dataset.audio = broadcast.audioFile;
        div.dataset.category = broadcast.type;

        const icon = document.createElement('i');
        icon.className = `bi ${broadcast.icon}`;
        icon.style.color =
            broadcast.type === 'test' ? 'var(--accent-primary)' :
            broadcast.type === 'warning' ? 'var(--accent-orange)' :
            broadcast.type === 'emergency' ? 'var(--accent-red)' :
            'var(--accent-primary)';
        icon.style.fontSize = '1.5rem';

        div.appendChild(icon);

        const titleDiv = document.createElement('div');
        titleDiv.textContent = broadcast.title;
        div.appendChild(titleDiv);

        div.onclick = () => selectBroadcastType(div, broadcast.title);

        container.appendChild(div);
    });

    resetSelection();
}

/* ------------------------------
    방송 타입 선택
------------------------------ */
function selectBroadcastType(element, type) {
    const infoArea = document.getElementById('selectedBroadcastInfo');
    const customArea = document.getElementById('customMessageArea');
    const titleEl = document.getElementById('selectedBroadcastTitle');
    const messageEl = document.getElementById('selectedBroadcastMessage');
    // const audioEl = document.getElementById('selectedBroadcastAudio');

    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        selectedBroadcastType = null;
        infoArea.style.display = 'none';
        customArea.style.display = 'none';
        return;
    }

    document.querySelectorAll('.broadcast-type').forEach(el => el.classList.remove('selected'));

    element.classList.add('selected');
    selectedBroadcastType = type;

    if (type === '사용자정의') {
        customArea.style.display = 'block';
        infoArea.style.display = 'none';
        return;
    }

    const title = element.dataset.title;
    const message = element.dataset.message;
    const audio = element.dataset.audio;

    titleEl.innerText = title;
    messageEl.innerText = message;
    // audioEl.innerText = audio ? `음원 파일: ${audio}` : '';

    infoArea.style.display = 'block';
    customArea.style.display = 'none';
}

/* ------------------------------
    방송 실행
------------------------------ */
function startBroadcast() {
    if (!selectedBroadcastType) {
        App.utils.showGlobalAlert("방송 유형을 선택해 주세요.", "warning");
        return;
    }

    const typeInfo = broadcastList.find(bt => bt.title === selectedBroadcastType);
    if (!typeInfo || !typeInfo.audioFile) {
        App.utils.showGlobalAlert("유효한 방송 유형이 아닙니다.", "danger");
        return;
    }

    const offlineList = getOfflineSpeakers();

    if (offlineList.length > 0) {
        const names = offlineList.map(sp => sp.speakerName || sp.speakerCode).join(", ");
        
        edsConfirm(
            `다음 스피커는 <span class="text-danger fw-bold">오프라인</span>입니다:<br><br>
            <b>${names}</b><br><br>
            그래도 방송을 진행할까요?`,
            () => proceedBroadcast(typeInfo)
        );
    
        return;
    }
    

    // 오프라인 없으면 바로 실행
    proceedBroadcast(typeInfo);
}

function proceedBroadcast(typeInfo) {
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

    // ==========================
    //  🔥 여기에 로그 저장 호출
    // ==========================
    const speakerCodes = getSelectedSpeakerCodes();
    logBroadcastStart(typeInfo, speakerCodes);

    audio.play().then(() => {
        const duration = audio.duration;
        audio.addEventListener('timeupdate', () => {
            if (!broadcastInProgress || audio.paused || audio.ended) {
                progressFill.style.width = '100%';
                progressText.textContent = '100%';
                progressContainer.classList.add('d-none');
                broadcastInProgress = false;
                resetSelection();
                return;
            }

            const percent = (audio.currentTime / duration) * 100;
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${percent.toFixed(1)}%`;
        });
    }).catch(err => {
        App.utils.showGlobalAlert("오디오 재생 실패", "danger");
        progressContainer.classList.add('d-none');
    });
}


/* ------------------------------
    방송 중지
------------------------------ */
function stopBroadcast() {
    if (!broadcastInProgress) {
        App.utils.showGlobalAlert("진행 중인 방송이 없습니다.", "warning");
        return;
    }

    broadcastInProgress = false;
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    document.getElementById('broadcastProgress').classList.add('d-none');

    App.utils.showGlobalAlert("방송이 중지되었습니다.", "success");
}

/* ------------------------------
    테스트 방송
------------------------------ */
function testBroadcast() {
    if (selectedSpeakers.length === 0) {
        App.utils.showGlobalAlert("테스트할 스피커를 선택해주세요.", "warning");
        return;
    }

    const speakers = selectedSpeakers.includes('all') ? '전체 스피커' : selectedSpeakers.join(', ');
    App.utils.showGlobalAlert(`${speakers}에서 테스트 방송 시작`, "info");
}

/* ------------------------------
    방송 선택 초기화
------------------------------ */
function resetSelection() {
    selectedSpeakers = [];
    document.querySelectorAll('.speaker-card').forEach(card => {
        card.classList.remove('selected');
    });

    selectedBroadcastType = null;
    document.querySelectorAll('.broadcast-type').forEach(el => {
        el.classList.remove('selected');
    });

    document.getElementById('customMessageArea').style.display = 'none';
    document.getElementById('customMessageText').value = '';

    const infoArea = document.getElementById('selectedBroadcastInfo');
    infoArea.style.display = 'none';

    document.getElementById('selectedBroadcastTitle').innerText = '-';
    document.getElementById('selectedBroadcastMessage').innerText = '';
    document.getElementById('selectedBroadcastAudio').innerText = '';
}

function edsConfirm(message, onConfirm) {
    const msgEl = document.getElementById("edsConfirmMessage");
    const titleEl = document.getElementById("edsConfirmTitle");

    msgEl.innerHTML = message;
    titleEl.innerText = "확인";

    const okBtn = document.getElementById("edsConfirmOk");
    const cancelBtn = document.getElementById("edsConfirmCancel");

    const modalEl = document.getElementById("edsConfirmModal");
    const modal = new bootstrap.Modal(modalEl);

    okBtn.onclick = () => {
        modal.hide();
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => modal.hide();

    modal.show();
}

function getOfflineSpeakers() {
    return speakerList
        .filter(sp => selectedSpeakers.includes(sp.id))
        .filter(sp => sp.connStat !== "01"); // 01 = 정상
}

function logBroadcastStart(typeInfo, speakerCodes) {
    const payload = {
        broadcastTitle: typeInfo.title,
        broadcastType: typeInfo.type,
        audioFile: typeInfo.audioFile,
        speakerCodes: speakerCodes,   // 리스트 형태
        timestamp: new Date().toISOString()
    };

    fetch("/api/broadcast/log/start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error("로그 저장 실패");
        return res.text();
    })
    .then(data => console.log("📌 방송 로그 저장 완료:", data))
    .catch(err => console.error("🚨 방송 로그 저장 오류:", err));
}