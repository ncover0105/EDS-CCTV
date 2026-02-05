/* ===================================
* equipment_broadcast.js (발령 전용 교체본)
* - 파일/오디오 실행 로직 제거
* - 방송 탭에서도 모달과 동일하게 /api/btype/command/alert 발령 전송만 수행
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

function formatIsoToYmdHms(isoLike) {
    if (!isoLike) return "";
    return String(isoLike).replace("T", " ").split(".")[0];
}

/* -----------------------------
* 스피커 필드 매핑 (통일)
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
* 캐시/선택 상태
* ----------------------------- */
let disasterCache = [];
let broadcastSpeakerCache = [];

let selectedTargetSpeakerKeys = new Set();

window.selectedSpeakers = window.selectedSpeakers || [];
window.selectedBroadcastType = window.selectedBroadcastType || null;

/* -----------------------------
* API (조회)
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
* 발령 API (전송)
* ----------------------------- */
const ALERT_API_URL = "/api/btype/command/alert";

const ALERT_LOG_LATEST_API = "/api/spk/web/alert-logs/latest";

function getSelectedSpeakerCodes() {
    return Array.from(selectedTargetSpeakerKeys);
}

function getSelectedDeviceIdsForAlert() {
    const keys = getSelectedSpeakerCodes();
    const list = Array.isArray(broadcastSpeakerCache) ? broadcastSpeakerCache : [];

    const deviceIds = list
        .filter(sp => keys.includes(getSpeakerKey(sp)))
        .map(sp => String(getSpeakerId(sp) ?? "").trim())
        .filter(Boolean);

    return Array.from(new Set(deviceIds));
}

function isTtsBroadcastMode() {
    const sel = document.getElementById("bc_broadcast_type");
    // equipmentPage.html 기준: 1=TTS, 2=저장메시지, 3=기타
    return String(sel?.value ?? "") === "1";
}

function buildServerAlertPayload({ deviceId, ttsMessage }) {
    const alertMode = document.getElementById("bc_mode")?.value ?? "1";
    const alertKind = document.getElementById("bc_broadcast_type")?.value ?? "2";
    const alertRange = document.getElementById("bc_scope")?.value ?? "3";
    const alertPriority = document.getElementById("bc_priority")?.value ?? "3";

    const disasterCode = isTtsBroadcastMode()
        ? "CFW"
        : String(window.selectedBroadcastType ?? "").trim();

    return {
        deviceId: String(deviceId),
        commandCode: "41",
        alertMode: Number(alertMode),
        disasterCode,
        alertKind: Number(alertKind),
        alertRange: Number(alertRange),
        alertPriority: Number(alertPriority),
        ttsMessage: String(ttsMessage ?? "")
    };
}

async function sendAlertToServer(payload) {
    const res = await fetch(ALERT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
    }
}

/* -----------------------------
* 체크리스트 UI 렌더링 (speaker-card)
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

    emptyEl.classList.add("d-none");

    let appended = 0;

    list.forEach(spk => {
        const speakerKey = getSpeakerKey(spk);
        if (!speakerKey) return;

        const name = getSpeakerName(spk, speakerKey);
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

    if (appended === 0) {
        emptyEl.classList.remove("d-none");
        cntEl.textContent = "0";
        if (allEl) allEl.checked = false;
        return;
    }

    cntEl.textContent = String(selectedTargetSpeakerKeys.size);

    if (allEl) {
        const total = listEl.querySelectorAll(".targetSpeakerChk").length;
        const checkedCount = listEl.querySelectorAll(".targetSpeakerChk:checked").length;
        allEl.checked = (total > 0 && total === checkedCount);
    }
}

function bindTargetSpeakerUI() {
    const listEl = document.getElementById("targetSpeakerList");
    if (!listEl) return;

    const searchEl = document.getElementById("targetSpeakerSearch");
    const allEl = document.getElementById("targetSpeakerSelectAll");
    const cntEl = document.getElementById("selectedTargetSpeakerCount");

    renderTargetSpeakerList(broadcastSpeakerCache);

    if (!listEl.dataset.bound) {
        listEl.addEventListener("click", (e) => {
        const card = e.target.closest(".speaker-card");
        if (!card) return;

        if (e.target.closest("input.targetSpeakerChk")) return;

        const chk = card.querySelector("input.targetSpeakerChk");
        if (!chk) return;

        chk.checked = !chk.checked;
        chk.dispatchEvent(new Event("change", { bubbles: true }));
        });

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

        if (cntEl) cntEl.textContent = String(selectedTargetSpeakerKeys.size);

        if (allEl) {
            const total = listEl.querySelectorAll(".targetSpeakerChk").length;
            const checkedCount = listEl.querySelectorAll(".targetSpeakerChk:checked").length;
            allEl.checked = (total > 0 && total === checkedCount);
        }
        });

        listEl.dataset.bound = "1";
    }

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

    if (allEl && !allEl.dataset.bound) {
        allEl.addEventListener("change", () => {
        const chks = Array.from(listEl.querySelectorAll(".targetSpeakerChk"));

        if (allEl.checked) {
            selectedTargetSpeakerKeys = new Set(
            chks.map(c => String(c.dataset.speakerKey || "")).filter(Boolean)
            );
            chks.forEach(c => {
            c.checked = true;
            c.closest(".speaker-card")?.classList.add("selected");
            });
        } else {
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

/* -----------------------------
* 방송 종류(재난) 렌더링
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
* 방송 타입 선택 UI
* ----------------------------- */
function selectBroadcastType(element, code) {
    const typeCol = document.getElementById("broadcastTypeCol");
    const infoCol = document.getElementById("broadcastInfoCol");
    const infoArea = document.getElementById("selectedBroadcastInfo");

    const sel = document.getElementById("bc_broadcast_type");
    const customText = document.getElementById("customMessageText");

    if (sel && String(sel.value) !== "2") {
    sel.value = "2";
    if (customText) customText.value = "";
    updateCustomMessageAreaVisibility();
    } else {
    if (customText) customText.value = "";
    }

    if (element.classList.contains("selected")) {
        element.classList.remove("selected");
        window.selectedBroadcastType = null;

        if (typeCol) typeCol.className = "col-12";
        if (infoCol) infoCol.classList.add("d-none");
        if (infoArea) infoArea.style.display = "none";
        return;
    }

    document.querySelectorAll(".broadcast-type")
        .forEach(el => el.classList.remove("selected"));

    element.classList.add("selected");
    window.selectedBroadcastType = code;

    if (typeCol) typeCol.className = "col-12 col-lg-7";
    if (infoCol) infoCol.classList.remove("d-none");
    if (infoArea) infoArea.style.display = "block";

    const t = document.getElementById("selectedBroadcastTitle");
    const m = document.getElementById("selectedBroadcastMessage");
    const a = document.getElementById("selectedBroadcastAudio");

    if (t) t.innerText = element.dataset.title || "-";
    if (m) m.innerText = element.dataset.message || "-";
    if (a) a.innerText = element.dataset.audio ? `저장코드: ${element.dataset.audio}` : "";
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

function getOfflineSpeakers() {
    const keys = getSelectedSpeakerCodes();
    return (broadcastSpeakerCache || [])
        .filter(sp => keys.includes(getSpeakerKey(sp)))
        .filter(sp => String(sp?.connStat ?? sp?.connectStat ?? sp?.status ?? "") !== "01");
}

function updateCustomMessageAreaVisibility() {
    const customArea = document.getElementById("customMessageArea");
    const infoArea = document.getElementById("selectedBroadcastInfo");
    const customText = document.getElementById("customMessageText");

    const show = isTtsBroadcastMode();

    if (customArea) customArea.style.display = show ? "block" : "none";

    if (!show && customText) {
        customText.value = "";
    }

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

    updateCustomMessageAreaVisibility();
}

/* -----------------------------
* 발령 실행 (startBroadcast)
* - 파일/오디오 실행 없이 발령 API만 호출
* ----------------------------- */
async function startBroadcast() {
    const speakerKeys = getSelectedSpeakerCodes();
    if (!speakerKeys || speakerKeys.length === 0) {
        App.utils.showGlobalAlert("발령 대상을 선택해 주세요.", "warning");
        return;
    }

    // 백엔드가 disasterCode를 필수로 요구하므로 TTS 포함 항상 선택 강제
    if (!isTtsBroadcastMode() && !window.selectedBroadcastType) {
    App.utils.showGlobalAlert("발령을 위해 방송 유형(재난)을 선택해 주세요.", "warning");
    return;
    }

    const isTts = isTtsBroadcastMode();
    const msg = (document.getElementById("customMessageText")?.value ?? "").trim();

    if (isTts && !msg) {
        App.utils.showGlobalAlert("TTS 메시지를 입력해 주세요.", "warning");
        return;
    }

    const deviceIds = getSelectedDeviceIdsForAlert();
    if (!deviceIds.length) {
        App.utils.showGlobalAlert("선택된 대상의 deviceId 매핑이 없습니다.", "danger");
        return;
    }

    const offlineList = getOfflineSpeakers();
    const doSend = async () => {
        try {
            for (const id of deviceIds) {
                const payload = buildServerAlertPayload({
                deviceId: id,
                ttsMessage: isTts ? msg : "" // 필요 시 여기 정책 변경 가능
                });

                console.log("[BC TAB SEND SERVER PAYLOAD]", payload);
                await sendAlertToServer(payload);

                // appendBroadcastLogEntry?.({
                // message: `발령 전송 성공 (deviceId=${id})`,
                // level: "success"
                // });
            }
            await loadLatestAlertLogs();
            App.utils.showGlobalAlert(`발령 요청 전송 완료 (${deviceIds.length}대)`, "success");
        } catch (e) {
            console.error(e);
            // appendBroadcastLogEntry?.({
            //     message: `발령 전송 실패: ${e.message}`,
            //     level: "error"
            // });
            App.utils.showGlobalAlert("발령 전송 실패", "danger");
        }
    };

    if (offlineList.length > 0) {
        const names = offlineList.map(sp => getSpeakerName(sp, getSpeakerKey(sp))).join(", ");
        edsConfirm(
        `다음 스피커는 <span class="text-danger fw-bold">오프라인</span>입니다:<br><br>
        <b>${escapeHtml(names)}</b><br><br>
        그래도 발령을 전송할까요?`,
        () => { doSend(); }
        );
        return;
    }

    await doSend();
}
window.startBroadcast = startBroadcast;

/* -----------------------------
* stop/test 버튼이 HTML에 남아있어도 오류 방지용 (기능 비활성)
* - 원하시면 equipmentPage.html에서 해당 버튼 제거 권장
* ----------------------------- */
function stopBroadcast() {
    App.utils.showGlobalAlert("현재 화면에서는 파일/오디오 실행 기능이 비활성화되었습니다.", "info");
}
window.stopBroadcast = stopBroadcast;

function testBroadcast() {
    App.utils.showGlobalAlert("현재 화면에서는 테스트 실행 기능이 비활성화되었습니다.", "info");
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

    updateCustomMessageAreaVisibility();
}
window.resetSelection = resetSelection;

/* -----------------------------
* Broadcast Log (간단 유지)
* - 기존 UI와 충돌 없이 사용 가능
* ----------------------------- */
function formatLogTimestamp(d = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
            `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function clearBroadcastLogPanel() {
    const panel = document.getElementById("broadcastLogPanel");
    if (panel) panel.innerHTML = "";
}

async function loadLatestAlertLogs() {
    const res = await fetch(ALERT_LOG_LATEST_API, { method: "GET" });
    if (!res.ok) throw new Error(`alert log api failed: ${res.status}`);

    const rows = await res.json(); // List<SpkWebAlertLogResponseDTO>
    if (!Array.isArray(rows)) return;

    clearBroadcastLogPanel();

    rows.forEach((r) => {
        const status = String(r?.status ?? "").toUpperCase();
        const level =
        status === "SENT" ? "success" :
        status === "FAILED" ? "error" : "";

        const ts = formatIsoToYmdHms(r?.createdAt);

        appendBroadcastLogEntry(
        {
            timestamp: ts,
            level,
            html: buildAlertLogHtml(r)
        },
        { notify: false }
        );
    });
}

function buildAlertLogHtml(row) {
    const status = String(row?.status ?? "").toUpperCase();

    const deviceId = String(row?.deviceId ?? "-");
    const disaster = String(row?.disasterCode ?? "-");
    const kind = String(row?.alertKind ?? "-");

    // 발령 유형 한글 매핑
    const kindText =
        kind === "1" ? "TTS" :
        kind === "2" ? "저장 메시지" :
        kind === "3" ? "기타" : kind;

    // 상태 한글
    const statusText =
        status === "SENT" ? "전송 성공" :
        status === "FAILED" ? "전송 실패" : status || "-";

    const tag = (label, value) => `
        <span class="log-tag">
        <span class="log-tag-label">${escapeHtml(label)}</span>
        <span class="log-tag-value">${escapeHtml(String(value))}</span>
        </span>
    `;

    const statusTag = `
        <span class="log-tag log-tag-status ${status === "SENT" ? "is-success" : status === "FAILED" ? "is-error" : ""}">
        <span class="log-tag-label">상태</span>
        <span class="log-tag-value">${escapeHtml(statusText)}</span>
        </span>
    `;

    return `
        <div class="log-row">
            ${tag("장비", deviceId)}
            ${tag("재난", disaster)}
            ${tag("방송유형", kindText)}
            ${statusTag}
        </div>
    `;
}

function appendBroadcastLogEntry({ timestamp, message, html, level = "" }, opts = { notify: true }) {
    const panel = document.getElementById("broadcastLogPanel");
    if (!panel) return;

    const ts = timestamp || formatLogTimestamp(new Date());
    const lvlClass = level ? ` ${level}` : "";

    const bodyHtml = html
        ? html
        : `<div class="log-message">${escapeHtml(message ?? "-")}</div>`;

    panel.insertAdjacentHTML(
        "beforeend",
        `
        <div class="log-entry${lvlClass}">
        <div class="log-timestamp">${escapeHtml(ts)}</div>
        <div class="log-body">
            ${bodyHtml}
        </div>
        </div>
        `
    );

    if (!panel.classList.contains("collapsed")) {
        panel.scrollTop = panel.scrollHeight;
    }
}

/* -----------------------------
* 방송 탭 초기화 진입점
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
        broadcastSpeakerCache = await listSpeakers();
        renderTargetSpeakerList(broadcastSpeakerCache);
        bindTargetSpeakerUI();

        await renderBroadcastTypes();
        bindBroadcastTypeSelector();
        await loadLatestAlertLogs();
        __broadcastInitOnce = true;
    } catch (e) {
        console.error("broadcast init error:", e);
    }

    document.getElementById("bc_open_tts_manage")?.addEventListener("click", () => {
        const ttsEl = document.getElementById("tts_manage_modal");
        if (!ttsEl) return;
        
        const ttsModal = bootstrap.Modal.getOrCreateInstance(ttsEl);
        ttsModal.show();
        
        ttsEl.addEventListener("shown.bs.modal", () => {
            window.TtsManageModal?.loadList?.();
        }, { once: true });
    });

}
window.initBroadcastPage = initBroadcastPage;