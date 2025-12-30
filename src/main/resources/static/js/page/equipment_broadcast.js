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
        default: return "warning";
    }
}

/** ✅ SpkDisaster 리스트 캐시(방송 실행 시 재사용) */
let disasterCache = [];

/** ✅ 체크리스트 선택(방송대상 선택 아래 리스트) */
let selectedTargetSpeakerIds = new Set();

async function listSpeakers() {
    const res = await fetch("/api/btype/query/config/list");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
}

/**
 * 체크리스트 렌더링 (equipmentPage.html에 아래 id가 있을 때만 동작)
 * - targetSpeakerSearch
 * - targetSpeakerSelectAll
 * - targetSpeakerList
 * - targetSpeakerEmpty
 * - selectedTargetSpeakerCount
 */
function renderTargetSpeakerList(list) {
    const listEl = document.getElementById("targetSpeakerList");
    const emptyEl = document.getElementById("targetSpeakerEmpty");
    const cntEl = document.getElementById("selectedTargetSpeakerCount");
    const allEl = document.getElementById("targetSpeakerSelectAll");

    // 체크리스트 UI 없는 페이지면 스킵 (기존 카드 방식만 사용)
    if (!listEl || !emptyEl || !cntEl) return;

    listEl.innerHTML = "";

    if (!list || list.length === 0) {
        emptyEl.classList.remove("d-none");
        cntEl.textContent = "0";
        if (allEl) allEl.checked = false;
        return;
    }
    emptyEl.classList.add("d-none");

    list.forEach(spk => {
        // equipment_broadcast.js에서 speaker.id를 사용중이므로 그대로 사용
        const id = String(safeValue(spk.id, ""));
        if (!id) return;

        const name = safeName(safeValue(spk.speakerName));
        const adr = safeValue(spk.speakerAdr, "-");
        const statusClass = safeStatus(spk.connStat);

        const checked = selectedTargetSpeakerIds.has(id);

        const row = document.createElement("div");
        row.className = "d-flex align-items-center justify-content-between px-2 py-2 rounded bg-white bg-opacity-10";
        row.innerHTML = `
            <div class="form-check mb-0 w-100">
                <input class="form-check-input targetSpeakerChk" type="checkbox"
                    id="ts_${id}" data-id="${id}" ${checked ? "checked" : ""}>
                <label class="form-check-label w-100" for="ts_${id}">
                    <div class="d-flex align-items-center gap-2">
                        <span class="dot dot-${statusClass}"></span>
                        <span class="fw-semibold text-white">${name}</span>
                    </div>
                    <div class="small text-white-50">${adr}</div>
                </label>
            </div>
        `;

        // ✅ 행 클릭 시 체크 토글 (input 직접 클릭은 제외)
        row.addEventListener("click", (e) => {
            if (e.target.closest("input")) return;
            const chk = row.querySelector("input.targetSpeakerChk");
            chk.checked = !chk.checked;
            chk.dispatchEvent(new Event("change"));
        });

        // ✅ 체크 변경 처리
        row.querySelector("input.targetSpeakerChk").addEventListener("change", (e) => {
            const sid = String(e.target.dataset.id);
            if (e.target.checked) selectedTargetSpeakerIds.add(sid);
            else selectedTargetSpeakerIds.delete(sid);

            cntEl.textContent = String(selectedTargetSpeakerIds.size);

            // 전체선택 동기화
            if (allEl) {
                const total = document.querySelectorAll(".targetSpeakerChk").length;
                const checkedCount = document.querySelectorAll(".targetSpeakerChk:checked").length;
                allEl.checked = (total > 0 && total === checkedCount);
            }
        });

        listEl.appendChild(row);
    });

    cntEl.textContent = String(selectedTargetSpeakerIds.size);

    // 전체선택 초기 동기화
    const allEl2 = document.getElementById("targetSpeakerSelectAll");
    if (allEl2) {
        const total = document.querySelectorAll(".targetSpeakerChk").length;
        const checkedCount = document.querySelectorAll(".targetSpeakerChk:checked").length;
        allEl2.checked = (total > 0 && total === checkedCount);
    }
}

/** ✅ 체크리스트 UI 이벤트 바인딩 */
function bindTargetSpeakerUI() {
    // 체크리스트 UI가 없으면 스킵
    if (!document.getElementById("targetSpeakerList")) return;

    const searchEl = document.getElementById("targetSpeakerSearch");
    const allEl = document.getElementById("targetSpeakerSelectAll");

    // 최초 렌더
    renderTargetSpeakerList(window.speakerList || []);

    // 검색 필터
    if (searchEl) {
        searchEl.addEventListener("input", () => {
            const q = searchEl.value.trim().toLowerCase();
            const base = window.speakerList || [];
            const filtered = !q ? base : base.filter(spk => {
                const id = String(spk.id ?? "").toLowerCase();
                const name = String(spk.speakerName ?? "").toLowerCase();
                const adr = String(spk.speakerAdr ?? "").toLowerCase();
                return id.includes(q) || name.includes(q) || adr.includes(q);
            });
            renderTargetSpeakerList(filtered);
        });
    }

    // 전체 선택/해제
    if (allEl) {
        allEl.addEventListener("change", () => {
            document.querySelectorAll(".targetSpeakerChk").forEach(chk => {
                chk.checked = allEl.checked;
                chk.dispatchEvent(new Event("change"));
            });
        });
    }
}

/** ✅ 체크리스트 선택 해제 버튼용 */
function clearTargetSpeakers() {
    selectedTargetSpeakerIds.clear();
    document.querySelectorAll(".targetSpeakerChk").forEach(chk => (chk.checked = false));

    const cntEl = document.getElementById("selectedTargetSpeakerCount");
    if (cntEl) cntEl.textContent = "0";

    const allEl = document.getElementById("targetSpeakerSelectAll");
    if (allEl) allEl.checked = false;
}

/** ✅ 체크리스트 선택이 있으면 그걸 우선 사용, 없으면 기존 카드 선택(selectedSpeakers) 사용 */
function getSelectedSpeakerCodes() {
    // 체크리스트 UI 존재 + 선택 있으면 우선
    if (document.getElementById("targetSpeakerList") && selectedTargetSpeakerIds.size > 0) {
        return Array.from(selectedTargetSpeakerIds);
    }

    // 기존 카드 선택 방식(기존 로직 유지)
    if (Array.isArray(window.selectedSpeakers) && window.selectedSpeakers.length > 0) {
        // "all"이면 전체 id로 확장
        if (window.selectedSpeakers.includes("all")) {
            return (window.speakerList || []).map(sp => String(sp.id)).filter(Boolean);
        }
        return window.selectedSpeakers.map(String);
    }

    return [];
}

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
    (window.speakerList || []).forEach((speaker) => {
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

    console.log(`총 ${(window.speakerList || []).length}개 스피커 카드 생성`);
}

/* =========================
 * 스피커 선택 (기존 카드 방식)
 * ========================= */
function selectSpeaker(speakerId) {
    // selectedSpeakers는 기존 코드 구조상 전역으로 존재한다고 가정
    // (없으면 window에 만들어 둠)
    if (!Array.isArray(window.selectedSpeakers)) window.selectedSpeakers = [];

    const cards = document.querySelectorAll(".speaker-card");
    const allButton = document.querySelector(".all-speakers");

    if (speakerId === "all") {
        if (window.selectedSpeakers.includes("all")) {
            window.selectedSpeakers = [];
            allButton?.classList.remove("selected");
            cards.forEach((c) => c.classList.remove("selected"));
        } else {
            allButton?.classList.add("selected");
            // ✅ "all" 포함 + 전체 선택
            window.selectedSpeakers = ["all", ...Array.from(cards).map((c) => c.dataset.id).filter(Boolean)];
            cards.forEach((c) => c.classList.add("selected"));
        }
    } else {
        allButton?.classList.remove("selected");
        window.selectedSpeakers = window.selectedSpeakers.filter((id) => id !== "all");

        const card = document.querySelector(`.speaker-card[data-id="${speakerId}"]`);
        if (!card) return;

        if (window.selectedSpeakers.includes(speakerId)) {
            window.selectedSpeakers = window.selectedSpeakers.filter((id) => id !== speakerId);
            card.classList.remove("selected");
        } else {
            window.selectedSpeakers.push(speakerId);
            card.classList.add("selected");
        }
    }

    console.log("선택된 스피커:", window.selectedSpeakers);
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

        div.onclick = () => selectBroadcastType(div, div.dataset.code);
        container.appendChild(div);
    });

    // ✅ 사용자정의 카드
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
        window.selectedBroadcastType = null;
        if (infoArea) infoArea.style.display = "none";
        if (customArea) customArea.style.display = "none";
        return;
    }

    document.querySelectorAll(".broadcast-type").forEach((el) => el.classList.remove("selected"));

    element.classList.add("selected");
    window.selectedBroadcastType = code; // dstCode or "CUSTOM"

    if (code === "CUSTOM") {
        if (customArea) customArea.style.display = "block";
        if (infoArea) infoArea.style.display = "none";
        return;
    }

    const title = element.dataset.title;
    const message = element.dataset.message;
    const audio = element.dataset.audio;

    if (titleEl) titleEl.innerText = title || "-";
    if (messageEl) messageEl.innerText = message || "-";
    if (audioEl) audioEl.innerText = audio ? `저장코드: ${audio}` : "";

    if (infoArea) infoArea.style.display = "block";
    if (customArea) customArea.style.display = "none";
}

/* =========================
 * 방송 실행
 * ========================= */
function startBroadcast() {
    if (!window.selectedBroadcastType) {
        App.utils.showGlobalAlert("방송 유형을 선택해 주세요.", "warning");
        return;
    }

    // ✅ 대상 스피커 선택 체크 (체크리스트/카드 둘 다 포함)
    const speakerCodes = getSelectedSpeakerCodes();
    if (!speakerCodes || speakerCodes.length === 0) {
        App.utils.showGlobalAlert("방송 대상을 선택해 주세요.", "warning");
        return;
    }

    // 사용자정의 처리
    if (window.selectedBroadcastType === "CUSTOM") {
        const msg = (document.getElementById("customMessageText")?.value ?? "").trim();
        if (!msg) {
            App.utils.showGlobalAlert("사용자 정의 메시지를 입력해 주세요.", "warning");
            return;
        }

        const typeInfo = {
            title: "사용자정의",
            type: "normal",
            audioFile: "",
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
    const disaster = (disasterCache ?? []).find((d) => String(d.dstCode) === String(window.selectedBroadcastType));
    if (!disaster) {
        App.utils.showGlobalAlert("유효한 방송 유형이 아닙니다. (재난 코드 없음)", "danger");
        return;
    }

    const { type } = mapDisasterStyle(disaster);
    const audioFile = (disaster.dstStoCode ?? "").trim() || (disaster.dstSirenCode ?? "").trim() || "";

    if (!audioFile) {
        App.utils.showGlobalAlert("해당 재난 코드에 저장코드/사이렌코드가 없습니다.", "warning");
        return;
    }

    const typeInfo = {
        title: disaster.dstName,
        type,
        audioFile,
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
    // audio, broadcastInProgress 는 기존처럼 전역이라고 가정 (없으면 window에 생성)
    if (typeof window.audio === "undefined") window.audio = null;
    if (typeof window.broadcastInProgress === "undefined") window.broadcastInProgress = false;

    const audioSrc = `/audio/${typeInfo.audioFile}`;

    if (window.audio) {
        window.audio.pause();
        window.audio.currentTime = 0;
    }

    // 사용자정의(오디오 없음)일 수도 있으니 방어
    if (!typeInfo.audioFile) {
        const progressContainer = document.getElementById("broadcastProgress");
        const progressFill = document.getElementById("progressFill");
        const progressText = document.getElementById("progressText");

        if (progressContainer && progressFill && progressText) {
            progressContainer.classList.remove("d-none");
            progressFill.style.width = "100%";
            progressText.textContent = "100%";
        }

        const speakerCodes = getSelectedSpeakerCodes();
        logBroadcastStart(typeInfo, speakerCodes);

        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add("d-none");
            resetSelection();
        }, 800);
        return;
    }

    window.audio = new Audio(audioSrc);

    const progressContainer = document.getElementById("broadcastProgress");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    if (progressContainer && progressFill && progressText) {
        progressContainer.classList.remove("d-none");
        progressFill.style.width = "0%";
        progressText.textContent = "0%";
    }

    window.broadcastInProgress = true;

    // 🔥 로그 저장 호출
    const speakerCodes = getSelectedSpeakerCodes();
    logBroadcastStart(typeInfo, speakerCodes);

    window.audio.play().then(() => {
        const duration = window.audio.duration;
        window.audio.addEventListener("timeupdate", () => {
            if (!window.broadcastInProgress || window.audio.paused || window.audio.ended) {
                if (progressFill) progressFill.style.width = "100%";
                if (progressText) progressText.textContent = "100%";
                if (progressContainer) progressContainer.classList.add("d-none");
                window.broadcastInProgress = false;
                resetSelection();
                return;
            }

            const percent = (window.audio.currentTime / duration) * 100;
            if (progressFill) progressFill.style.width = `${percent}%`;
            if (progressText) progressText.textContent = `${percent.toFixed(1)}%`;
        });
    }).catch(() => {
        App.utils.showGlobalAlert("오디오 재생 실패", "danger");
        if (progressContainer) progressContainer.classList.add("d-none");
    });
}

/* =========================
 * 방송 중지
 * ========================= */
function stopBroadcast() {
    if (!window.broadcastInProgress) {
        App.utils.showGlobalAlert("진행 중인 방송이 없습니다.", "warning");
        return;
    }

    window.broadcastInProgress = false;
    if (window.audio) {
        window.audio.pause();
        window.audio.currentTime = 0;
    }

    document.getElementById("broadcastProgress")?.classList.add("d-none");
    App.utils.showGlobalAlert("방송이 중지되었습니다.", "success");
}

/* =========================
 * 테스트 방송
 * ========================= */
function testBroadcast() {
    // 체크리스트/카드 모두 반영
    const codes = getSelectedSpeakerCodes();
    if (!codes || codes.length === 0) {
        App.utils.showGlobalAlert("테스트할 스피커를 선택해주세요.", "warning");
        return;
    }

    const speakers = (codes.length === (window.speakerList || []).length) ? "전체 스피커" : codes.join(", ");
    App.utils.showGlobalAlert(`${speakers}에서 테스트 방송 시작`, "info");
}

/* =========================
 * 방송 선택 초기화
 * ========================= */
function resetSelection() {
    // 기존 카드 선택 초기화
    if (Array.isArray(window.selectedSpeakers)) window.selectedSpeakers = [];
    document.querySelectorAll(".speaker-card").forEach((card) => {
        card.classList.remove("selected");
    });

    // 체크리스트 초기화(있으면)
    clearTargetSpeakers();

    // 방송 타입 초기화
    window.selectedBroadcastType = null;
    document.querySelectorAll(".broadcast-type").forEach((el) => {
        el.classList.remove("selected");
    });

    const customArea = document.getElementById("customMessageArea");
    if (customArea) customArea.style.display = "none";

    const customText = document.getElementById("customMessageText");
    if (customText) customText.value = "";

    const infoArea = document.getElementById("selectedBroadcastInfo");
    if (infoArea) infoArea.style.display = "none";

    const t = document.getElementById("selectedBroadcastTitle");
    const m = document.getElementById("selectedBroadcastMessage");
    const a = document.getElementById("selectedBroadcastAudio");
    if (t) t.innerText = "-";
    if (m) m.innerText = "";
    if (a) a.innerText = "";
}

/* =========================
 * Confirm Modal
 * ========================= */
function edsConfirm(message, onConfirm) {
    const msgEl = document.getElementById("edsConfirmMessage");
    const titleEl = document.getElementById("edsConfirmTitle");

    if (msgEl) msgEl.innerHTML = message;
    if (titleEl) titleEl.innerText = "확인";

    const okBtn = document.getElementById("edsConfirmOk");
    const cancelBtn = document.getElementById("edsConfirmCancel");

    const modalEl = document.getElementById("edsConfirmModal");
    const modal = new bootstrap.Modal(modalEl);

    if (okBtn) {
        okBtn.onclick = () => {
            modal.hide();
            if (onConfirm) onConfirm();
        };
    }
    if (cancelBtn) cancelBtn.onclick = () => modal.hide();

    modal.show();
}

/** ✅ 오프라인 스피커 찾기 (체크리스트/카드 선택 모두 반영) */
function getOfflineSpeakers() {
    const codes = getSelectedSpeakerCodes();
    return (window.speakerList || [])
        .filter((sp) => codes.includes(String(sp.id)))
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
        renderSpeakerCards();     // 기존 카드 UI
        bindTargetSpeakerUI();    // ✅ 체크리스트 UI (있으면)
        await renderBroadcastTypes();
    } catch (e) {
        console.error("init error:", e);
    }
});
