/* ===================================
* equipment_broadcast.js (수정본)
* - 방송 대상 선택 UI: #targetSpeakerList 를 speaker-card 스타일로 렌더링
* - 스피커 목록: /api/btype/query/config/list (API)
* - ✅ broadcastTypesContainer 에서 사용자정의(CUSTOM) 생성 제거
* - ✅ 방송종류(#bc_broadcast_type)에서 TTS 선택 시 customMessageArea 표시
* =================================== */

/* -----------------------------
* 공통 유틸
* ----------------------------- */
function safeValue(value, fallback = "-") {
    return (value === null || value === undefined || String(value).trim() === "")
    ? fallback
    : value;
}

function safeName(name) {
    if (!name || String(name).trim() === "") return "이름없음";
    const s = String(name);
    if (s.length > 20) return s.substring(0, 10) + "…" + s.substring(s.length - 5);
    return s;
}

function safeStatus(connStat) {
    switch (String(connStat ?? "").trim()) {
    case "00": return "offline";
    case "01": return "online";
    case "02": return "online";
    default: return "warning";
    }
}

function escapeHtml(str) {
    return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------------
* 스피커 필드 매핑 (통일)
* - API 응답 필드가 id/speakerKey 등 혼재해도 하나로 통일
* ----------------------------- */
function getSpeakerKey(spk) {
    const raw =
    spk?.id ??
    spk?.speakerKey ??
    spk?.speakerId ??
    spk?.deviceId ??
    spk?.uid ??
    spk?.speakerUid;

    const key = String(raw ?? "").trim();
    return key || "";
}

function getSpeakerName(spk, keyFallback = "") {
    const raw =
    spk?.speakerName ??
    spk?.name ??
    spk?.speakerNm ??
    spk?.spkName ??
    spk?.deviceName;

    const name = String(raw ?? "").trim();
    return safeName(name || (keyFallback ? `KEY:${keyFallback}` : "이름없음"));
}

function getSpeakerAdr(spk) {
    const raw =
    spk?.speakerAdr ??
    spk?.address ??
    spk?.addr ??
    spk?.regionName ??
    spk?.installArea ??
    spk?.location;

    return String(raw ?? "").trim() || "-";
}

function getSpeakerId(spk) {
    return (
    spk?.speakerId ??
    spk?.deviceId ??
    spk?.uid ??
    getSpeakerKey(spk)
    );
}

/* -----------------------------
* 방송 데이터 캐시
* ----------------------------- */
let disasterCache = [];                  // 재난(방송종류) 캐시
let broadcastSpeakerCache = [];          // 방송 탭 스피커 목록 캐시(API)

/** ✅ 체크리스트 선택값(방송 대상) - speakerKey 기준 */
let selectedTargetSpeakerKeys = new Set();

/** (기존) 전역 변수 안전화 */
window.selectedSpeakers = window.selectedSpeakers || [];
window.selectedBroadcastType = window.selectedBroadcastType || null;

/* -----------------------------
* API
* ----------------------------- */
async function listSpeakers() {
    const res = await fetch("/api/btype/query/config/list");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
}

async function listDisasters() {
    const res = await fetch("/api/disaster");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
}

/* -----------------------------
* 체크리스트 UI 렌더링 (speaker-card 디자인)
* - targetSpeakerList에 speaker-card 형태로 추가
* - 카드 클릭으로 체크 토글
* ----------------------------- */
function renderTargetSpeakerList(list) {
    const listEl = document.getElementById("targetSpeakerList");
    const emptyEl = document.getElementById("targetSpeakerEmpty");
    const cntEl = document.getElementById("selectedTargetSpeakerCount");
    const allEl = document.getElementById("targetSpeakerSelectAll");

    if (!listEl || !emptyEl || !cntEl) return;

    listEl.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
    emptyEl.classList.remove("d-none");
    cntEl.textContent = "0";
    if (allEl) allEl.checked = false;
    return;
    }

    // 일단 숨겼다가 실제 append가 0이면 다시 표시
    emptyEl.classList.add("d-none");

    let appended = 0;

    list.forEach(spk => {
    const speakerKey = getSpeakerKey(spk);
    if (!speakerKey) return;

    const name = getSpeakerName(spk, speakerKey);
    const adr = getSpeakerAdr(spk);
    const spkId = getSpeakerId(spk);

    const connStat = spk?.connStat ?? spk?.connectStat ?? spk?.status ?? spk?.connStatus;
    const statusClass = safeStatus(connStat);

    const checked = selectedTargetSpeakerKeys.has(speakerKey);

    listEl.insertAdjacentHTML(
        "beforeend",
        `
        <div class="speaker-card overflow-hidden h-auto min-h-0 mb-2 ${checked ? "selected" : ""}"
            data-speaker-key="${escapeHtml(speakerKey)}">
        <div class="d-flex justify-content-between align-items-start">
            <div class="w-100">
            <div class="d-flex align-items-center justify-content-between gap-2">
                <div class="d-flex align-items-center gap-2">
                <span class="dot dot-${statusClass}"></span>
                <div class="fw-semibold text-white">${escapeHtml(name)}</div>
                </div>

                <div class="form-check mb-0 ms-2">
                <input class="form-check-input targetSpeakerChk"
                        type="checkbox"
                        data-speaker-key="${escapeHtml(speakerKey)}"
                        ${checked ? "checked" : ""}>
                </div>
            </div>

            <div class="small text-white-50 mt-1">${escapeHtml(spkId)}</div>
            </div>
        </div>
        </div>
        `
    );

    appended++;
    });

    // ✅ 실제로 1개도 붙지 않았다면 empty 표시
    if (appended === 0) {
    emptyEl.classList.remove("d-none");
    cntEl.textContent = "0";
    if (allEl) allEl.checked = false;
    return;
    }

    // ✅ 카운트/전체선택 동기화
    cntEl.textContent = String(selectedTargetSpeakerKeys.size);
    if (allEl) {
    const total = listEl.querySelectorAll(".targetSpeakerChk").length;
    const checkedCount = listEl.querySelectorAll(".targetSpeakerChk:checked").length;
    allEl.checked = (total > 0 && total === checkedCount);
    }
}

/** ✅ 체크리스트 검색/전체선택 바인딩 (이벤트 위임으로 안정화) */
function bindTargetSpeakerUI() {
    const listEl = document.getElementById("targetSpeakerList");
    if (!listEl) return;

    const searchEl = document.getElementById("targetSpeakerSearch");
    const allEl = document.getElementById("targetSpeakerSelectAll");
    const cntEl = document.getElementById("selectedTargetSpeakerCount");

    // 최초 렌더
    renderTargetSpeakerList(broadcastSpeakerCache);

    // ✅ 카드/체크 이벤트 위임 (1회만)
    if (!listEl.dataset.bound) {
    // 카드 클릭 시 체크 토글
    listEl.addEventListener("click", (e) => {
        const card = e.target.closest(".speaker-card");
        if (!card) return;

        // 체크박스 자체 클릭은 change에서 처리
        if (e.target.closest("input.targetSpeakerChk")) return;

        const chk = card.querySelector("input.targetSpeakerChk");
        if (!chk) return;

        chk.checked = !chk.checked;
        chk.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // 체크 변경 처리
    listEl.addEventListener("change", (e) => {
        const chk = e.target.closest("input.targetSpeakerChk");
        if (!chk) return;

        const key = String(chk.dataset.speakerKey || "");
        if (!key) return;

        const card = chk.closest(".speaker-card");

        if (chk.checked) {
        selectedTargetSpeakerKeys.add(key);
        card?.classList.add("selected");
        } else {
        selectedTargetSpeakerKeys.delete(key);
        card?.classList.remove("selected");
        }

        // 카운트 업데이트
        if (cntEl) cntEl.textContent = String(selectedTargetSpeakerKeys.size);

        // 전체선택 동기화
        if (allEl) {
        const total = listEl.querySelectorAll(".targetSpeakerChk").length;
        const checkedCount = listEl.querySelectorAll(".targetSpeakerChk:checked").length;
        allEl.checked = (total > 0 && total === checkedCount);
        }
    });

    listEl.dataset.bound = "1";
    }

    // 검색 필터 (1회만)
    if (searchEl && !searchEl.dataset.bound) {
    searchEl.addEventListener("input", () => {
        const q = searchEl.value.trim().toLowerCase();
        const base = Array.isArray(broadcastSpeakerCache) ? broadcastSpeakerCache : [];

        const filtered = !q ? base : base.filter(spk => {
        const key = getSpeakerKey(spk).toLowerCase();
        const name = getSpeakerName(spk, key).toLowerCase();
        const adr = getSpeakerAdr(spk).toLowerCase();
        return key.includes(q) || name.includes(q) || adr.includes(q);
        });

        renderTargetSpeakerList(filtered);
    });
    searchEl.dataset.bound = "1";
    }

    // ✅ 전체 선택/해제 (1회만)
    if (allEl && !allEl.dataset.bound) {
    allEl.addEventListener("change", () => {
        const chks = Array.from(listEl.querySelectorAll(".targetSpeakerChk"));

        if (allEl.checked) {
        // 전체 선택
        selectedTargetSpeakerKeys = new Set(
            chks.map(c => String(c.dataset.speakerKey || "")).filter(Boolean)
        );
        chks.forEach(c => {
            c.checked = true;
            c.closest(".speaker-card")?.classList.add("selected");
        });
        } else {
        // 전체 해제
        selectedTargetSpeakerKeys.clear();
        chks.forEach(c => {
            c.checked = false;
            c.closest(".speaker-card")?.classList.remove("selected");
        });
        }

        if (cntEl) cntEl.textContent = String(selectedTargetSpeakerKeys.size);
    });

    allEl.dataset.bound = "1";
    }
}

/** ✅ 선택 해제 버튼용 (전체선택 체크 해제 포함) */
function clearTargetSpeakers() {
    selectedTargetSpeakerKeys.clear();

    const listEl = document.getElementById("targetSpeakerList");
    if (listEl) {
    listEl.querySelectorAll(".targetSpeakerChk").forEach(chk => {
        chk.checked = false;
        chk.closest(".speaker-card")?.classList.remove("selected");
    });
    }

    const cntEl = document.getElementById("selectedTargetSpeakerCount");
    if (cntEl) cntEl.textContent = "0";

    const allEl = document.getElementById("targetSpeakerSelectAll");
    if (allEl) allEl.checked = false;
}
window.clearTargetSpeakers = clearTargetSpeakers;

/** ✅ 방송 대상 speakerKey 리스트 반환 */
function getSelectedSpeakerCodes() {
    return Array.from(selectedTargetSpeakerKeys);
}

/* -----------------------------
* 방송 종류 렌더링
* ----------------------------- */
function isUseFlag(v) {
    const s = String(v ?? "").trim().toUpperCase();
    return s === "Y" || s === "USE" || s === "1" || s === "TRUE";
}

function mapDisasterStyle(disaster) {
    const p = Number(disaster?.dstPriority ?? 99);

    if (p <= 1) return { type: "emergency", icon: "bi-exclamation-triangle-fill", colorVar: "--accent-red" };
    if (p <= 3) return { type: "warning", icon: "bi-bell-fill", colorVar: "--accent-orange" };
    return { type: "normal", icon: "bi-megaphone-fill", colorVar: "--accent-primary" };
}

async function renderBroadcastTypes() {
    const container = document.getElementById("broadcastTypesContainer");
    if (!container) return;

    container.innerHTML = "";

    const disasters = await listDisasters();
    disasterCache = Array.isArray(disasters) ? disasters : [];

    const list = disasterCache
    .filter(d => isUseFlag(d?.dstUseFlag))
    .sort((a, b) => (a?.dstPriority ?? 9999) - (b?.dstPriority ?? 9999));

    console.log("disasters:", disasterCache);
    console.log("render list:", list);

    list.forEach((disaster) => {
    const { type, icon, colorVar } = mapDisasterStyle(disaster);

    const div = document.createElement("div");
    div.className = `broadcast-type ${type}`;

    div.dataset.code = safeValue(disaster.dstCode, "");
    div.dataset.title = safeValue(disaster.dstName, "");
    div.dataset.message = safeValue(disaster.dstStoreMsg, "");

    const audioFile = (disaster.dstStoCode ?? "").trim() || (disaster.dstSirenCode ?? "").trim() || "";
    div.dataset.audio = audioFile;
    div.dataset.category = type;

    div.innerHTML = `
        <i class="bi ${icon}" style="color: var(${colorVar}); font-size:1.5rem;"></i>
        <div class="text-wrap">${escapeHtml(safeValue(disaster.dstName, "(이름없음)"))}</div>
    `;

    div.onclick = () => selectBroadcastType(div, div.dataset.code);
    container.appendChild(div);
    });

    resetSelection();
}

/* -----------------------------
* 방송 타입 선택 / 실행 / 중지
* ----------------------------- */
function selectBroadcastType(element, code) {
    const typeCol = document.getElementById("broadcastTypeCol");
    const infoCol = document.getElementById("broadcastInfoCol");
    const infoArea = document.getElementById("selectedBroadcastInfo");

    const sel = document.getElementById("bc_broadcast_type");
    if (sel && String(sel.value) !== "2") {
        sel.value = "2";
        updateCustomMessageAreaVisibility(); // customMessageArea 숨김/표시 동기화
    }

    // 선택 해제
    if (element.classList.contains("selected")) {
        element.classList.remove("selected");
        window.selectedBroadcastType = null;
    
        // 전체 폭 복원 + 우측 영역 숨김
        if (typeCol) typeCol.className = "col-12";
        if (infoCol) infoCol.classList.add("d-none");
        if (infoArea) infoArea.style.display = "none";
        return;
    }

    document.querySelectorAll(".broadcast-type")
        .forEach(el => el.classList.remove("selected"));

    element.classList.add("selected");
    window.selectedBroadcastType = code;

    // 7:5 분할
    typeCol.className = "col-12 col-lg-7";
    infoCol.classList.remove("d-none");
    if (infoArea) infoArea.style.display = "block";

    // 정보 바인딩
    const t = document.getElementById("selectedBroadcastTitle");
    const m = document.getElementById("selectedBroadcastMessage");
    const a = document.getElementById("selectedBroadcastAudio");

    if (t) t.innerText = element.dataset.title || "-";
    if (m) m.innerText = element.dataset.message || "-";
    if (a) a.innerText = element.dataset.audio ? `저장코드: ${element.dataset.audio}` : "";
}


function getOfflineSpeakers() {
    const codes = getSelectedSpeakerCodes();
    return (broadcastSpeakerCache || [])
    .filter(sp => codes.includes(getSpeakerKey(sp)))
    .filter(sp => String(sp?.connStat ?? sp?.connectStat ?? sp?.status ?? "") !== "01");
}

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

function isTtsBroadcastMode() {
    const sel = document.getElementById("bc_broadcast_type");
    // 1=TTS, 2=저장메시지, 3=기타 (equipmentPage.html 기준)
    return String(sel?.value ?? "") === "1";
}

function updateCustomMessageAreaVisibility() {
    const customArea = document.getElementById("customMessageArea");
    const infoArea = document.getElementById("selectedBroadcastInfo");

    const show = isTtsBroadcastMode();

    if (customArea) customArea.style.display = show ? "block" : "none";

    // TTS 모드에서는 카드 선택 정보 영역이 필수가 아니므로, 선택이 없으면 숨김 유지
    if (show && infoArea && !window.selectedBroadcastType) {
        infoArea.style.display = "none";
    }
}

function bindBroadcastTypeSelector() {
    const sel = document.getElementById("bc_broadcast_type");
    if (!sel) return;

    if (sel.dataset.bound === "1") return;
    sel.addEventListener("change", () => {
        updateCustomMessageAreaVisibility();
    });
    sel.dataset.bound = "1";

    // 최초 상태 반영
    updateCustomMessageAreaVisibility();
}

function startBroadcast() {
    const speakerCodes = getSelectedSpeakerCodes();
    if (!speakerCodes || speakerCodes.length === 0) {
        App.utils.showGlobalAlert("방송 대상을 선택해 주세요.", "warning");
        return;
    }

    // ✅ 방송종류(TTS) 선택 시: customMessageArea 기반으로 사용자 메시지 방송
    if (isTtsBroadcastMode()) {
        const msg = (document.getElementById("customMessageText")?.value ?? "").trim();
        if (!msg) {
            App.utils.showGlobalAlert("TTS 메시지를 입력해 주세요.", "warning");
            return;
        }

        const typeInfo = {
            title: "TTS",
            type: "normal",
            audioFile: "",
            text: msg
        };

        const offlineList = getOfflineSpeakers();
        if (offlineList.length > 0) {
            const names = offlineList.map(sp => getSpeakerName(sp, getSpeakerKey(sp))).join(", ");
            edsConfirm(
                `다음 스피커는 <span class="text-danger fw-bold">오프라인</span>입니다:<br><br>
                <b>${escapeHtml(names)}</b><br><br>
                그래도 방송을 진행할까요?`,
                () => proceedBroadcast(typeInfo)
            );
            return;
        }

        proceedBroadcast(typeInfo);
        return;
    }

    // ✅ 저장메시지/기타 모드: 재난(방송종류 카드) 선택 필수
    if (!window.selectedBroadcastType) {
        App.utils.showGlobalAlert("방송 유형(재난)을 선택해 주세요.", "warning");
        return;
    }

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
        const names = offlineList.map(sp => getSpeakerName(sp, getSpeakerKey(sp))).join(", ");
        edsConfirm(
            `다음 스피커는 <span class="text-danger fw-bold">오프라인</span>입니다:<br><br>
            <b>${escapeHtml(names)}</b><br><br>
            그래도 방송을 진행할까요?`,
            () => proceedBroadcast(typeInfo)
        );
        return;
    }

    proceedBroadcast(typeInfo);
}
window.startBroadcast = startBroadcast;

function proceedBroadcast(typeInfo) {
    window.audio = window.audio || null;
    window.broadcastInProgress = window.broadcastInProgress || false;

    // 사용자정의는 오디오 없음
    if (!typeInfo.audioFile) {
    const progressContainer = document.getElementById("broadcastProgress");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    if (progressContainer && progressFill && progressText) {
        progressContainer.classList.remove("d-none");
        progressFill.style.width = "100%";
        progressText.textContent = "100%";
    }

    setTimeout(() => {
        if (progressContainer) progressContainer.classList.add("d-none");
        resetSelection();
    }, 800);
    return;
    }

    const audioSrc = `/audio/${typeInfo.audioFile}`;

    if (window.audio) {
    window.audio.pause();
    window.audio.currentTime = 0;
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
window.stopBroadcast = stopBroadcast;

function testBroadcast() {
    const codes = getSelectedSpeakerCodes();
    if (!codes || codes.length === 0) {
    App.utils.showGlobalAlert("테스트할 스피커를 선택해주세요.", "warning");
    return;
    }

    const speakers = codes.length > 20 ? `${codes.length}대 선택` : codes.join(", ");
    App.utils.showGlobalAlert(`${escapeHtml(speakers)}에서 테스트 방송 시작`, "info");
}
window.testBroadcast = testBroadcast;

/* -----------------------------
* 방송 선택 초기화
* ----------------------------- */
function resetSelection() {
    clearTargetSpeakers();

    window.selectedBroadcastType = null;
    document.querySelectorAll(".broadcast-type").forEach((el) => el.classList.remove("selected"));

    const customText = document.getElementById("customMessageText");
    if (customText) customText.value = "";

    const typeCol = document.getElementById("broadcastTypeCol");
    const infoCol = document.getElementById("broadcastInfoCol");

    if (typeCol) typeCol.className = "col-12";
    if (infoCol) infoCol.classList.add("d-none");

    const infoArea = document.getElementById("selectedBroadcastInfo");
    if (infoArea) infoArea.style.display = "none";

    const t = document.getElementById("selectedBroadcastTitle");
    const m = document.getElementById("selectedBroadcastMessage");
    const a = document.getElementById("selectedBroadcastAudio");
    if (t) t.innerText = "-";
    if (m) m.innerText = "";
    if (a) a.innerText = "";

    // ✅ 방송종류(TTS) 선택 상태를 기준으로 customMessageArea 표시 여부 동기화
    updateCustomMessageAreaVisibility();
}
window.resetSelection = resetSelection;

/* -----------------------------
* 방송 탭 초기화 진입점
* - equipment_init.js에서 broadcast 탭 진입 시 호출
* ----------------------------- */
let __broadcastInitOnce = false;

async function initBroadcastPage(options = { once: true, refresh: false }) {
    const hasBroadcastDom =
        document.getElementById("broadcast-content") ||
        document.getElementById("targetSpeakerList") ||
        document.getElementById("broadcastTypesContainer");

    if (!hasBroadcastDom) return;

    if (!options.refresh && options.once && __broadcastInitOnce) return;

    try {
        // 1) 스피커 목록 조회 → 캐시 반영
        broadcastSpeakerCache = await listSpeakers();
        console.log("[broadcast] speakers loaded:", broadcastSpeakerCache.length);
        console.log("[broadcast] first speaker sample:", broadcastSpeakerCache?.[0]);

        // 2) targetSpeakerList 렌더링/바인딩
        renderTargetSpeakerList(broadcastSpeakerCache);
        bindTargetSpeakerUI();

        // 3) 방송 종류(재난) 렌더링
        await renderBroadcastTypes();

        // 4) 방송종류(TTS/저장메시지/기타) 셀렉트 바인딩 → customMessageArea 표시 제어
        bindBroadcastTypeSelector();

        __broadcastInitOnce = true;
    } catch (e) {
        console.error("broadcast init error:", e);
    }

    initBroadcastLogCollapse();
    await initBroadcastLogData({ test: true, testCount: 10 });

}

function initBroadcastLogCollapse() {
    const panel = document.getElementById("broadcastLogPanel");
    const btn = document.getElementById("toggleBroadcastLogBtn");
    const badge = document.getElementById("broadcastLogBadge");
    if (!panel || !btn) return;

    // ✅ 중복 바인딩 방지 (refresh/init 재호출 대비)
    if (panel.dataset.collapseBound === "1") return;
    panel.dataset.collapseBound = "1";

    const KEY = "broadcast.log.expanded";
    const expanded = localStorage.getItem(KEY) === "1";

    const apply = (open) => {
        // 패널 자체는 숨기지 않음(프리뷰 3줄 보여야 함)
        panel.classList.remove("d-none");

        if (open) {
            panel.classList.remove("collapsed");
            btn.textContent = "접기";
            localStorage.setItem(KEY, "1");

            // ✅ 펼치면 새 로그 배지 초기화
            if (badge) {
            badge.textContent = "0";
            badge.classList.add("d-none");
            }

            // 펼칠 때는 최신 로그가 보이도록
            panel.scrollTop = panel.scrollHeight;
        } else {
            panel.classList.add("collapsed");
            btn.textContent = "펼치기";
            localStorage.setItem(KEY, "0");
            // 접힘 상태에서 배지는 __broadcastLogNotify에서 증가
        }
    };

    apply(expanded);

    btn.addEventListener("click", () => {
        const isOpen = !panel.classList.contains("collapsed");
        apply(!isOpen);
    });

    // ✅ 접힘 상태에서 새 로그 알림 배지 증가
    window.__broadcastLogNotify = function (newCount = 1) {
        if (!badge) return;

        const isCollapsed = panel.classList.contains("collapsed");
        if (!isCollapsed) return;

        const cur = parseInt(badge.textContent || "0", 10) || 0;
        badge.textContent = String(cur + (parseInt(newCount, 10) || 1));
        badge.classList.remove("d-none");
    };
}

/* ============================================================================
 * Broadcast Log: Test Generator + API Loader
 * - #broadcastLogPanel 에 log-entry 주입
 * - 접힘(collapsed) 상태면 배지 증가, 펼침이면 하단 스크롤 유지
 * ========================================================================== */

const BROADCAST_LOG_API = "/api/broadcast/logs"; // ✅ 실제 API 경로로 변경 가능

function formatLogTimestamp(d = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
            `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * level: "success" | "warning" | "error" | ""(normal)
 */
function appendBroadcastLogEntry({ timestamp, message, level = "" }, opts = { notify: true }) {
    const panel = document.getElementById("broadcastLogPanel");
    if (!panel) return;

    const ts = timestamp || formatLogTimestamp(new Date());
    const msg = message ?? "-";
    const lvlClass = level ? ` ${level}` : "";

    panel.insertAdjacentHTML(
        "beforeend",
        `
        <div class="log-entry${lvlClass}">
            <div class="log-timestamp">${escapeHtml(ts)}</div>
            <div class="log-message">${escapeHtml(msg)}</div>
        </div>
        `
    );

    // ✅ 접힘 상태면 배지 증가 (3개 제한은 CSS가 처리)
    if (opts?.notify !== false && panel.classList.contains("collapsed") && typeof window.__broadcastLogNotify === "function") {
        window.__broadcastLogNotify(1);
    }

    // ✅ 펼친 상태면 최신 로그가 보이도록
    if (!panel.classList.contains("collapsed")) {
        panel.scrollTop = panel.scrollHeight;
    }
}

function clearBroadcastLogPanel() {
    const panel = document.getElementById("broadcastLogPanel");
    if (!panel) return;
    panel.innerHTML = "";

    // 배지도 초기화
    const badge = document.getElementById("broadcastLogBadge");
    if (badge) {
        badge.textContent = "0";
        badge.classList.add("d-none");
    }
}

/** 테스트용 10개 자동 생성 */
function generateTestBroadcastLogs(count = 10) {
    clearBroadcastLogPanel();

    const samples = [
        { level: "success", message: "스피커A에 테스트 방송이 성공적으로 전송되었습니다." },
        { level: "",        message: "전체 스피커에 저장메시지 방송을 시작합니다." },
        { level: "warning", message: "스피커B 연결 상태 확인이 필요합니다." },
        { level: "error",   message: "스피커C 방송 전송 실패. 네트워크 연결을 확인하세요." },
        { level: "success", message: "TTS 방송이 정상 처리되었습니다." }
    ];

    // 최신 순서 느낌을 위해 과거 → 현재로 생성
    const now = Date.now();
    for (let i = count; i >= 1; i--) {
        const base = samples[i % samples.length];
        const d = new Date(now - i * 60_000); // 1분 간격
        appendBroadcastLogEntry({
        timestamp: formatLogTimestamp(d),
        message: `[TEST-${String(count - i + 1).padStart(2, "0")}] ${base.message}`,
        level: base.level
        }, { notify: false }); // 초기 로딩은 배지 증가하지 않음
    }

    // 접힘 상태에서 "초기 로딩"은 배지 표시하지 않음
    const badge = document.getElementById("broadcastLogBadge");
    if (badge) {
        badge.textContent = "0";
        badge.classList.add("d-none");
    }
}

/** API에서 로그를 받아 렌더링 */
async function loadBroadcastLogsFromApi() {
    // fetchJson이 프로젝트에 이미 있다면 그걸 써도 되고, 없으면 fetch로 처리
    const res = await fetch(BROADCAST_LOG_API, { method: "GET" });
    if (!res.ok) throw new Error(`broadcast log api failed: ${res.status}`);
    const data = await res.json();

    // ✅ 허용 포맷:
    // 1) [ {timestamp, message, level}, ... ]
    // 2) { items: [ ... ] }
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    if (!Array.isArray(items)) return;

    clearBroadcastLogPanel();

    items.forEach((row) => {
        const level =
        String(row?.level ?? row?.status ?? "").toLowerCase(); // 서버 필드명 변형 대비
        const normalizedLevel =
        level === "success" || level === "warning" || level === "error" ? level : "";

        appendBroadcastLogEntry({
        timestamp: row?.timestamp ?? row?.inpDttm ?? row?.time ?? "",
        message: row?.message ?? row?.log ?? row?.logMessage ?? "-",
        level: normalizedLevel
        }, { notify: false });
    });

    // 펼친 상태라면 최신 위치로
    const panel = document.getElementById("broadcastLogPanel");
    if (panel && !panel.classList.contains("collapsed")) {
        panel.scrollTop = panel.scrollHeight;
    }
}

/**
 * 통합 진입점:
 * - test=true면 테스트 10개 생성
 * - 아니면 API 로드 시도, 실패하면 테스트로 폴백
 */
async function initBroadcastLogData({ test = false, testCount = 10 } = {}) {
    if (test) {
        generateTestBroadcastLogs(testCount);
        return;
    }

    try {
        await loadBroadcastLogsFromApi();
    } catch (e) {
        console.warn("[broadcastLog] api load failed -> fallback to test logs", e);
        generateTestBroadcastLogs(testCount);
    }
}

// 전역 노출(필요 시 콘솔에서 호출)
window.initBroadcastLogData = initBroadcastLogData;
window.generateTestBroadcastLogs = generateTestBroadcastLogs;
window.loadBroadcastLogsFromApi = loadBroadcastLogsFromApi;
window.appendBroadcastLogEntry = appendBroadcastLogEntry;
window.initBroadcastPage = initBroadcastPage;
