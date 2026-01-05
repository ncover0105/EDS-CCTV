/* ===================================
* equipment_broadcast.js (수정본)
* - 방송 대상 선택 UI: #targetSpeakerList 를 speaker-card 스타일로 렌더링
* - 스피커 목록: /api/btype/query/config/list (API)
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
    const res = await fetch("/api/btype/query/disaster");
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

/* -----------------------------
* 방송 타입 선택 / 실행 / 중지
* ----------------------------- */
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
    window.selectedBroadcastType = code;

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

function startBroadcast() {
    if (!window.selectedBroadcastType) {
    App.utils.showGlobalAlert("방송 유형을 선택해 주세요.", "warning");
    return;
    }

    const speakerCodes = getSelectedSpeakerCodes();
    if (!speakerCodes || speakerCodes.length === 0) {
    App.utils.showGlobalAlert("방송 대상을 선택해 주세요.", "warning");
    return;
    }

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

    // 3) 방송 종류 렌더링
    await renderBroadcastTypes();

    __broadcastInitOnce = true;
    } catch (e) {
    console.error("broadcast init error:", e);
    }
}

window.initBroadcastPage = initBroadcastPage;