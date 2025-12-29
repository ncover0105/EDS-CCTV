/* ===================================
 * equipment_broadcast.js
 * 방송 카드, 방송 선택, 방송 실행 (SpkDisaster API 기반)
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
        case "02": return "online";
        default:   return "warrning";
    }
}

/** ✅ SpkDisaster 리스트 캐시(방송 실행 시 재사용) */
let disasterCache = [];

async function listDisasters() {
    const res = await fetch("/api/btype/query/disaster");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
}

/** ✅ dstUseFlag 값이 Y/Use/1/true 등 다양하게 오는 경우를 허용 */
function isUseFlag(v) {
    const s = String(v ?? "").trim().toUpperCase();
    return s === "Y" || s === "USE" || s === "1" || s === "TRUE";
}

/** ✅ 우선순위 기반 스타일 매핑 (원하면 규칙 변경 가능) */
function mapDisasterStyle(disaster) {
    const p = Number(disaster?.dstPriority ?? 99);

    if (p <= 1) {
        return { type: "emergency", icon: "bi-exclamation-triangle-fill", colorVar: "--accent-red" };
    }
    if (p <= 3) {
        return { type: "warning", icon: "bi-bell-fill", colorVar: "--accent-orange" };
    }
    return { type: "normal", icon: "bi-megaphone-fill", colorVar: "--accent-primary" };
}

/** =========================
 * 스피커 카드 생성
 * ========================= */
function renderSpeakerCards() {
    const container = document.getElementById("speaker-card-container");
    if (!container) return;

    container.innerHTML = "";

    /* 전체 스피커 */
    const allCard = document.createElement("div");
    allCard.className = "speaker-card all-speakers";
    allCard.onclick = () => selectSpeaker("all");
    allCard.innerHTML = `
        <h6 class="mb-1">전체 스피커</h6>
        <small>모든 스피커에 방송</small>
    `;
    container.appendChild(allCard);

    /* 개별 스피커 */
    speakerList.forEach((speaker) => {
        const card = document.createElement("div");
        card.className = "speaker-card";
        card.dataset.id = safeValue(speaker.id, "");
        card.onclick = () => selectSpeaker(speaker.id);

        const name = safeName(safeValue(speaker.speakerName));
        const adr = safeValue(speaker.speakerAdr, "-");
        const lat = safeValue(speaker.lat, "-");
        const lng = safeValue(speaker.lng, "-");

        const statusClass = safeStatus(speaker.connStat);

        card.innerHTML = `
            <div class="d-flex mb-3">
                <div class="dot dot-${statusClass}"></div>
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

/* =========================
 * 스피커 선택
 * ========================= */
function selectSpeaker(speakerId) {
    const cards = document.querySelectorAll(".speaker-card");
    const allButton = document.querySelector(".all-speakers");

    if (speakerId === "all") {
        if (selectedSpeakers.includes("all")) {
            selectedSpeakers = [];
            allButton.classList.remove("selected");
            cards.forEach((c) => c.classList.remove("selected"));
        } else {
            allButton.classList.add("selected");
            // ✅ 문법 오류 방지 + "all" 포함해서 전체 선택
            selectedSpeakers = ["all", ...Array.from(cards).map((c) => c.dataset.id).filter(Boolean)];
            cards.forEach((c) => c.classList.add("selected"));
        }
    } else {
        allButton.classList.remove("selected");
        selectedSpeakers = selectedSpeakers.filter((id) => id !== "all");

        const card = document.querySelector(`.speaker-card[data-id="${speakerId}"]`);
        if (!card) return;

        if (selectedSpeakers.includes(speakerId)) {
            selectedSpeakers = selectedSpeakers.filter((id) => id !== speakerId);
            card.classList.remove("selected");
        } else {
            selectedSpeakers.push(speakerId);
            card.classList.add("selected");
        }
    }

    console.log("선택된 스피커:", selectedSpeakers);
}

/* =========================
 * 방송 타입 카드 렌더링 (SpkDisaster API 기반)
 * ========================= */
async function renderBroadcastTypes() {
    const container = document.getElementById("broadcastTypesContainer");
    if (!container) return;

    container.innerHTML = "";

    // ✅ DB에서 재난 리스트 로드 + 캐시
    const disasters = await listDisasters();
    disasterCache = Array.isArray(disasters) ? disasters : [];

    // ✅ 사용중만 + 우선순위 정렬
    const list = disasterCache
        .filter((d) => isUseFlag(d?.dstUseFlag))
        .sort((a, b) => (a?.dstPriority ?? 9999) - (b?.dstPriority ?? 9999));

    console.log("disasters:", disasterCache);
    console.log("render list:", list);

    list.forEach((disaster) => {
        const { type, icon, colorVar } = mapDisasterStyle(disaster);

        const div = document.createElement("div");
        div.className = `broadcast-type ${type}`;

        // ✅ 핵심: 선택 키는 dstCode(PK)로!
        div.dataset.code = safeValue(disaster.dstCode, "");
        div.dataset.title = safeValue(disaster.dstName, "");
        div.dataset.message = safeValue(disaster.dstStoreMsg, "");

        // ✅ audioFile 매핑(기존 proceedBroadcast 유지용)
        // - 저장코드(dstStoCode)를 우선 audioFile로 사용
        // - 없으면 사이렌코드(dstSirenCode)를 대체값으로
        const audioFile = (disaster.dstStoCode ?? "").trim() || (disaster.dstSirenCode ?? "").trim() || "";
        div.dataset.audio = audioFile;
        div.dataset.category = type;

        const iconEl = document.createElement("i");
        iconEl.className = `bi ${icon}`;
        iconEl.style.color = `var(${colorVar})`;
        iconEl.style.fontSize = "1.5rem";
        div.appendChild(iconEl);

        const titleDiv = document.createElement("div");
        titleDiv.textContent = safeValue(disaster.dstName, "(이름없음)");
        div.appendChild(titleDiv);

        // ✅ selectBroadcastType에 dstCode를 넘김
        div.onclick = () => selectBroadcastType(div, div.dataset.code);

        container.appendChild(div);
    });

    // ✅ 사용자정의 카드 (원하면 제거 가능)
    const custom = document.createElement("div");
    custom.className = "broadcast-type normal";
    custom.dataset.code = "CUSTOM";
    custom.dataset.title = "사용자정의";
    custom.dataset.message = "";
    custom.dataset.audio = "";
    custom.dataset.category = "normal";
    custom.innerHTML = `
        <i class="bi bi-pencil-square" style="color: var(--accent-primary); font-size:1.5rem;"></i>
        <div>사용자정의</div>
    `;
    custom.onclick = () => selectBroadcastType(custom, "CUSTOM");
    container.appendChild(custom);

    resetSelection();
}

/* =========================
 * 방송 타입 선택
 * ========================= */
function selectBroadcastType(element, code) {
    const infoArea = document.getElementById("selectedBroadcastInfo");
    const customArea = document.getElementById("customMessageArea");
    const titleEl = document.getElementById("selectedBroadcastTitle");
    const messageEl = document.getElementById("selectedBroadcastMessage");
    const audioEl = document.getElementById("selectedBroadcastAudio");

    if (element.classList.contains("selected")) {
        element.classList.remove("selected");
        selectedBroadcastType = null;
        infoArea.style.display = "none";
        customArea.style.display = "none";
        return;
    }

    document.querySelectorAll(".broadcast-type").forEach((el) => el.classList.remove("selected"));

    element.classList.add("selected");
    selectedBroadcastType = code; // ✅ 이제 dstCode or "CUSTOM"

    if (code === "CUSTOM") {
        customArea.style.display = "block";
        infoArea.style.display = "none";
        return;
    }

    const title = element.dataset.title;
    const message = element.dataset.message;
    const audio = element.dataset.audio;

    titleEl.innerText = title || "-";
    messageEl.innerText = message || "-";
    audioEl.innerText = audio ? `저장코드: ${audio}` : "";

    infoArea.style.display = "block";
    customArea.style.display = "none";
}

/* =========================
 * 방송 실행
 * ========================= */
function startBroadcast() {
    if (!selectedBroadcastType) {
        App.utils.showGlobalAlert("방송 유형을 선택해 주세요.", "warning");
        return;
    }

    // 사용자정의 처리
    if (selectedBroadcastType === "CUSTOM") {
        const msg = (document.getElementById("customMessageText")?.value ?? "").trim();
        if (!msg) {
            App.utils.showGlobalAlert("사용자 정의 메시지를 입력해 주세요.", "warning");
            return;
        }

        const typeInfo = {
            title: "사용자정의",
            type: "normal",
            audioFile: "",     // 사용자정의는 오디오 없이 처리(필요하면 지정)
            text: msg
        };

        const offlineList = getOfflineSpeakers();
        if (offlineList.length > 0) {
            const names = offlineList.map((sp) => sp.speakerName || sp.speakerCode).join(", ");
            edsConfirm(
                `다음 스피커는 <span class="text-danger fw-bold">오프라인</span>입니다:<br><br>
                <b>${names}</b><br><br>
                그래도 방송을 진행할까요?`,
                () => proceedBroadcast(typeInfo)
            );
            return;
        }

        proceedBroadcast(typeInfo);
        return;
    }

    // ✅ dstCode로 DB 데이터 찾기
    const disaster = (disasterCache ?? []).find((d) => String(d.dstCode) === String(selectedBroadcastType));
    if (!disaster) {
        App.utils.showGlobalAlert("유효한 방송 유형이 아닙니다. (재난 코드 없음)", "danger");
        return;
    }

    const { type } = mapDisasterStyle(disaster);
    const audioFile = (disaster.dstStoCode ?? "").trim() || (disaster.dstSirenCode ?? "").trim() || "";

    // 기존 로직 유지: audioFile 없으면 막기(원하면 여기서 메시지방송만 허용 가능)
    if (!audioFile) {
        App.utils.showGlobalAlert("해당 재난 코드에 저장코드/사이렌코드가 없습니다.", "warning");
        return;
    }

    const typeInfo = {
        title: disaster.dstName,
        type,
        audioFile,               // ✅ proceedBroadcast에서 /audio/{audioFile}로 재생
        text: disaster.dstStoreMsg,
        dstCode: disaster.dstCode
    };

    const offlineList = getOfflineSpeakers();

    if (offlineList.length > 0) {
        const names = offlineList.map((sp) => sp.speakerName || sp.speakerCode).join(", ");
        edsConfirm(
            `다음 스피커는 <span class="text-danger fw-bold">오프라인</span>입니다:<br><br>
            <b>${names}</b><br><br>
            그래도 방송을 진행할까요?`,
            () => proceedBroadcast(typeInfo)
        );
        return;
    }

    proceedBroadcast(typeInfo);
}

function proceedBroadcast(typeInfo) {
    const audioSrc = `/audio/${typeInfo.audioFile}`;

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    // 사용자정의(오디오 없음)일 수도 있으니 방어
    if (!typeInfo.audioFile) {
        // 오디오 없이 진행바만 짧게 표시
        const progressContainer = document.getElementById("broadcastProgress");
        const progressFill = document.getElementById("progressFill");
        const progressText = document.getElementById("progressText");

        progressContainer.classList.remove("d-none");
        progressFill.style.width = "100%";
        progressText.textContent = "100%";

        const speakerCodes = getSelectedSpeakerCodes();
        logBroadcastStart(typeInfo, speakerCodes);

        setTimeout(() => {
            progressContainer.classList.add("d-none");
            resetSelection();
        }, 800);
        return;
    }

    audio = new Audio(audioSrc);

    const progressContainer = document.getElementById("broadcastProgress");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    progressContainer.classList.remove("d-none");
    progressFill.style.width = "0%";
    progressText.textContent = "0%";
    broadcastInProgress = true;

    // 🔥 로그 저장 호출
    const speakerCodes = getSelectedSpeakerCodes();
    logBroadcastStart(typeInfo, speakerCodes);

    audio.play().then(() => {
        const duration = audio.duration;
        audio.addEventListener("timeupdate", () => {
            if (!broadcastInProgress || audio.paused || audio.ended) {
                progressFill.style.width = "100%";
                progressText.textContent = "100%";
                progressContainer.classList.add("d-none");
                broadcastInProgress = false;
                resetSelection();
                return;
            }

            const percent = (audio.currentTime / duration) * 100;
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${percent.toFixed(1)}%`;
        });
    }).catch(() => {
        App.utils.showGlobalAlert("오디오 재생 실패", "danger");
        progressContainer.classList.add("d-none");
    });
}

/* =========================
 * 방송 중지
 * ========================= */
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

    document.getElementById("broadcastProgress").classList.add("d-none");
    App.utils.showGlobalAlert("방송이 중지되었습니다.", "success");
}

/* =========================
 * 테스트 방송
 * ========================= */
function testBroadcast() {
    if (selectedSpeakers.length === 0) {
        App.utils.showGlobalAlert("테스트할 스피커를 선택해주세요.", "warning");
        return;
    }

    const speakers = selectedSpeakers.includes("all") ? "전체 스피커" : selectedSpeakers.join(", ");
    App.utils.showGlobalAlert(`${speakers}에서 테스트 방송 시작`, "info");
}

/* =========================
 * 방송 선택 초기화
 * ========================= */
function resetSelection() {
    selectedSpeakers = [];
    document.querySelectorAll(".speaker-card").forEach((card) => {
        card.classList.remove("selected");
    });

    selectedBroadcastType = null;
    document.querySelectorAll(".broadcast-type").forEach((el) => {
        el.classList.remove("selected");
    });

    document.getElementById("customMessageArea").style.display = "none";
    document.getElementById("customMessageText").value = "";

    const infoArea = document.getElementById("selectedBroadcastInfo");
    infoArea.style.display = "none";

    document.getElementById("selectedBroadcastTitle").innerText = "-";
    document.getElementById("selectedBroadcastMessage").innerText = "";
    document.getElementById("selectedBroadcastAudio").innerText = "";
}

/* =========================
 * Confirm Modal
 * ========================= */
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
        .filter((sp) => selectedSpeakers.includes(sp.id))
        .filter((sp) => sp.connStat !== "01"); // 01 = 정상
}

/* =========================
 * 로그 저장(서버)
 * ========================= */
function logBroadcastStart(typeInfo, speakerCodes) {
    const payload = {
        broadcastTitle: typeInfo.title,
        broadcastType: typeInfo.type,
        audioFile: typeInfo.audioFile,
        speakerCodes: speakerCodes,
        timestamp: new Date().toISOString()
    };

    fetch("/api/broadcast/log/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then((res) => {
            if (!res.ok) throw new Error("로그 저장 실패");
            return res.text();
        })
        .then((data) => console.log("📌 방송 로그 저장 완료:", data))
        .catch((err) => console.error("🚨 방송 로그 저장 오류:", err));
}

/* =========================================================
   방송 로그 (모달 표시용, 프론트 임시 저장)
   ========================================================= */

let broadcastLogs = window.broadcastLogs || [];

function pushBroadcastLog(level, message, meta = {}) {
    const entry = {
        level: level || "info",
        message: message || "",
        ts: meta.ts || new Date().toISOString(),
        data: meta
    };
    broadcastLogs.unshift(entry);
    if (broadcastLogs.length > 200) broadcastLogs = broadcastLogs.slice(0, 200);
    renderBroadcastLogs();
}

function formatKST(iso) {
    try {
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    } catch (e) {
        return iso || "-";
    }
}

function renderBroadcastLogs() {
    const listEl = document.getElementById("broadcastLogList");
    const emptyEl = document.getElementById("broadcastLogEmpty");
    const countEl = document.getElementById("broadcastLogCount");
    if (!listEl || !emptyEl || !countEl) return;

    listEl.innerHTML = "";

    if (!broadcastLogs || broadcastLogs.length === 0) {
        emptyEl.classList.remove("d-none");
        countEl.innerText = "0건";
        return;
    }

    emptyEl.classList.add("d-none");
    countEl.innerText = `${broadcastLogs.length}건`;

    broadcastLogs.forEach((item) => {
        const div = document.createElement("div");
        const level = item.level || "info";
        const badgeClass =
            level === "success" ? "bg-success" :
            level === "warning" ? "bg-warning text-dark" :
            level === "error" ? "bg-danger" :
            "bg-primary";

        div.className = "border rounded-3 p-2";
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start gap-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge ${badgeClass}">${level.toUpperCase()}</span>
                    <div class="fw-semibold">${escapeHtml(item.message)}</div>
                </div>
                <small class="text-muted flex-shrink-0">${formatKST(item.ts)}</small>
            </div>
        `;
        listEl.appendChild(div);
    });
}

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function openBroadcastLogModal() {
    renderBroadcastLogs();
    const modalEl = document.getElementById("broadcastLogModal");
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function clearBroadcastLogs() {
    broadcastLogs = [];
    renderBroadcastLogs();
}

function refreshBroadcastLogs() {
    renderBroadcastLogs();
}

/* =========================
 * 초기 실행(페이지 로드 시)
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        renderSpeakerCards();
        await renderBroadcastTypes();
    } catch (e) {
        console.error("init error:", e);
    }
});
