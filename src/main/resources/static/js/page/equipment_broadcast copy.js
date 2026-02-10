/* ===================================
* equipment_broadcast.js (드롭다운 버전)
* - 방송 유형 카드 UI 제거
* - 방송 유형(재난) 드롭다운 + TTS 템플릿 드롭다운 추가
* - 발령 전송은 /api/btype/command/alert 만 수행
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

// "저장메시지/기타"에서 사용하는 재난 코드
window.selectedBroadcastType = window.selectedBroadcastType || null;

// TTS 템플릿 선택값(선택된 템플릿 객체 캐시)
window.selectedTtsTemplate = window.selectedTtsTemplate || null;

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

    // TTS면 CFW 고정(기존 정책 유지), 저장메시지/기타면 선택한 재난 코드 사용
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
* 드롭다운: 재난(방송 유형) / TTS 템플릿
* ----------------------------- */
function isUseFlag(v) {
    const s = String(v ?? "").trim().toUpperCase();
    return s === "Y" || s === "USE" || s === "1" || s === "TRUE";
}

function resetInfoPanel() {
    const infoArea = document.getElementById("selectedBroadcastInfo");
    const t = document.getElementById("selectedBroadcastTitle");
    const m = document.getElementById("selectedBroadcastMessage");
    const a = document.getElementById("selectedBroadcastAudio");

    if (t) t.innerText = "-";
    if (m) m.innerText = "-";
    if (a) a.innerText = "-";
    if (infoArea) infoArea.style.display = "none";
}

function showInfoPanel({ title, message, audio }) {
    const infoArea = document.getElementById("selectedBroadcastInfo");
    const t = document.getElementById("selectedBroadcastTitle");
    const m = document.getElementById("selectedBroadcastMessage");
    const a = document.getElementById("selectedBroadcastAudio");

    if (t) t.innerText = title ?? "-";
    if (m) m.innerText = message ?? "-";
    if (a) a.innerText = audio ?? "";
    if (infoArea) infoArea.style.display = "block";
}

async function renderDisasterSelect() {
    const sel = document.getElementById("bc_disaster_type");
    if (!sel) return;

    sel.innerHTML = `<option value="" selected>방송 유형 선택</option>`;

    const disasters = await listDisasters();
    disasterCache = Array.isArray(disasters) ? disasters : [];

    const list = disasterCache
        .filter(d => isUseFlag(d?.dstUseFlag))
        .sort((a, b) => (a?.dstPriority ?? 9999) - (b?.dstPriority ?? 9999));

    list.forEach(d => {
        const opt = document.createElement("option");
        opt.value = String(d?.dstCode ?? "").trim();
        opt.textContent = safeValue(d?.dstName, "(이름없음)");

        // 미리보기 데이터
        opt.dataset.title = safeValue(d?.dstName, "(이름없음)");
        opt.dataset.message = safeValue(d?.dstStoreMsg, "");
        const audioFile = (d?.dstStoCode ?? "").trim() || (d?.dstSirenCode ?? "").trim() || "";
        opt.dataset.audio = audioFile ? `저장코드: ${audioFile}` : "";

        sel.appendChild(opt);
    });

    // 변경 이벤트 바인딩(1회)
    if (sel.dataset.bound !== "1") {
        sel.addEventListener("change", () => {
            const code = String(sel.value ?? "").trim();
            window.selectedBroadcastType = code || null;

            // 저장메시지/기타에서 의미가 크므로, 선택 시 패널 표시
            const opt = sel.options[sel.selectedIndex];
            if (!code) {
                // 아무 것도 선택 안 했으면 패널은 TTS 쪽 선택이 있으면 그걸 우선
                syncInfoPanel();
                return;
            }

            showInfoPanel({
                title: opt?.dataset?.title || "방송 유형",
                message: opt?.dataset?.message || "",
                audio: opt?.dataset?.audio || ""
            });
        });
        sel.dataset.bound = "1";
    }
}

/**
 * broadcastList(서버 렌더링 전역 변수) 기반으로 TTS 템플릿 드롭다운 구성
 * - broadcastList의 필드가 프로젝트마다 다를 수 있어 최대한 방어적으로 매핑
 */
function getTtsItemId(item, idx) {
    return String(
        item?.id ??
        item?.broadcastKey ??
        item?.brdKey ??
        item?.code ??
        item?.broadcastCode ??
        item?.brdCode ??
        idx
    ).trim();
}

function getTtsItemTitle(item) {
    return String(
        item?.title ??
        item?.broadcastTitle ??
        item?.brdTitle ??
        item?.name ??
        item?.ttsTitle ??
        item?.ttsName ??
        "TTS 템플릿"
    ).trim();
}

function getTtsItemMessage(item) {
    return String(
        item?.text ??
        item?.message ??
        item?.broadcastText ??
        item?.brdText ??
        item?.ttsMessage ??
        item?.ttsText ??
        ""
    );
}

function renderTtsTemplateSelect() {
    const sel = document.getElementById("bc_tts_template");
    if (!sel) return;

    sel.innerHTML = `<option value="" selected>TTS 템플릿 선택</option>`;

    const list = Array.isArray(window.broadcastList) ? window.broadcastList : (Array.isArray(broadcastList) ? broadcastList : []);
    list.forEach((item, idx) => {
        const id = getTtsItemId(item, idx);
        const title = getTtsItemTitle(item);
        const msg = getTtsItemMessage(item);

        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = title;

        // 미리보기/자동입력용 데이터
        opt.dataset.title = title;
        opt.dataset.message = msg;

        sel.appendChild(opt);
    });

    if (sel.dataset.bound !== "1") {
        sel.addEventListener("change", () => {
            const val = String(sel.value ?? "").trim();
            const opt = sel.options[sel.selectedIndex];

            if (!val) {
                window.selectedTtsTemplate = null;
                syncInfoPanel();
                return;
            }

            // 선택된 템플릿 캐시
            window.selectedTtsTemplate = {
                id: val,
                title: opt?.dataset?.title || "",
                message: opt?.dataset?.message || ""
            };

            // TTS 종류로 강제 전환 + 메시지 자동 입력
            const kindSel = document.getElementById("bc_broadcast_type");
            if (kindSel && String(kindSel.value) !== "1") {
                kindSel.value = "1";
            }
            updateCustomMessageAreaVisibility();

            const customText = document.getElementById("customMessageText");
            if (customText) {
                customText.value = window.selectedTtsTemplate.message || "";
            }

            showInfoPanel({
                title: `TTS: ${window.selectedTtsTemplate.title || "-"}`,
                message: window.selectedTtsTemplate.message || "",
                audio: "" // TTS 템플릿은 오디오 코드 개념이 없으면 비움
            });
        });
        sel.dataset.bound = "1";
    }
}

/**
 * 정보 패널 우선순위:
 * 1) TTS 템플릿 선택이 있으면 TTS 정보
 * 2) 아니면 재난(방송유형) 선택이 있으면 재난 정보
 * 3) 둘 다 없으면 숨김
 */
function syncInfoPanel() {
    const ttsSel = document.getElementById("bc_tts_template");
    const disSel = document.getElementById("bc_disaster_type");

    const ttsVal = String(ttsSel?.value ?? "").trim();
    if (ttsVal) {
        const opt = ttsSel.options[ttsSel.selectedIndex];
        showInfoPanel({
            title: `TTS: ${opt?.dataset?.title || "-"}`,
            message: opt?.dataset?.message || "",
            audio: ""
        });
        return;
    }

    const disVal = String(disSel?.value ?? "").trim();
    if (disVal) {
        const opt = disSel.options[disSel.selectedIndex];
        showInfoPanel({
            title: opt?.dataset?.title || "방송 유형",
            message: opt?.dataset?.message || "",
            audio: opt?.dataset?.audio || ""
        });
        return;
    }

    resetInfoPanel();
}

/* -----------------------------
* 방송 종류(TTS/저장/기타) 바인딩
* ----------------------------- */
function updateCustomMessageAreaVisibility() {
    const customArea = document.getElementById("customMessageArea");
    const customText = document.getElementById("customMessageText");

    const show = isTtsBroadcastMode();

    if (customArea) customArea.style.display = show ? "block" : "none";
    if (!show && customText) customText.value = "";
}

function bindBroadcastKindSelector() {
    const sel = document.getElementById("bc_broadcast_type");
    if (!sel) return;

    if (sel.dataset.bound === "1") return;

    sel.addEventListener("change", () => {
        updateCustomMessageAreaVisibility();

        // 저장메시지/기타로 바꾸면, TTS 템플릿 선택값은 유지하되(원하면 지워도 됨)
        // 메시지 자동 입력은 하지 않음. 패널은 sync로 재정렬.
        syncInfoPanel();
    });

    sel.dataset.bound = "1";
    updateCustomMessageAreaVisibility();
}

/* -----------------------------
* 확인 모달(원본 유지)
* ----------------------------- */
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

/* -----------------------------
* 발령 실행 (startBroadcast)
* ----------------------------- */
async function startBroadcast() {
    const speakerKeys = getSelectedSpeakerCodes();
    if (!speakerKeys || speakerKeys.length === 0) {
        App.utils.showGlobalAlert("발령 대상을 선택해 주세요.", "warning");
        return;
    }

    const isTts = isTtsBroadcastMode();

    // 저장메시지/기타면 재난(방송유형) 선택 필수
    if (!isTts && !window.selectedBroadcastType) {
        App.utils.showGlobalAlert("발령을 위해 방송 유형(재난)을 선택해 주세요.", "warning");
        return;
    }

    // TTS면 메시지 필수인데, 템플릿 선택으로 채워진 경우도 허용
    const customText = document.getElementById("customMessageText");
    let msg = (customText?.value ?? "").trim();

    if (isTts && !msg) {
        const ttsSel = document.getElementById("bc_tts_template");
        const opt = ttsSel?.options?.[ttsSel.selectedIndex];
        const templMsg = String(opt?.dataset?.message ?? "").trim();
        if (templMsg) {
            msg = templMsg;
            if (customText) customText.value = templMsg; // UI도 동기화
        }
    }

    if (isTts && !msg) {
        App.utils.showGlobalAlert("TTS 메시지를 입력하거나 템플릿을 선택해 주세요.", "warning");
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
                    ttsMessage: isTts ? msg : "" // 저장/기타는 정책상 빈값
                });

                console.log("[BC TAB SEND SERVER PAYLOAD]", payload);
                await sendAlertToServer(payload);
            }

            await loadLatestAlertLogs();
            App.utils.showGlobalAlert(`발령 요청 전송 완료 (${deviceIds.length}대)`, "success");
        } catch (e) {
            console.error(e);
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
* stop/test 버튼 유지(기능 비활성)
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
    window.selectedTtsTemplate = null;

    const disSel = document.getElementById("bc_disaster_type");
    const ttsSel = document.getElementById("bc_tts_template");
    if (disSel) disSel.value = "";
    if (ttsSel) ttsSel.value = "";

    const customText = document.getElementById("customMessageText");
    if (customText) customText.value = "";

    resetInfoPanel();
    updateCustomMessageAreaVisibility();
}
window.resetSelection = resetSelection;

/* -----------------------------
* Broadcast Log (원본 유지)
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

    const kindText =
        kind === "1" ? "TTS" :
            kind === "2" ? "저장 메시지" :
                kind === "3" ? "기타" : kind;

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
        document.getElementById("bc_disaster_type") ||
        document.getElementById("bc_tts_template");

    if (!hasBroadcastDom) return;

    if (!options.refresh && options.once && __broadcastInitOnce) return;

    try {
        broadcastSpeakerCache = await listSpeakers();
        renderTargetSpeakerList(broadcastSpeakerCache);
        bindTargetSpeakerUI();

        await renderDisasterSelect();
        renderTtsTemplateSelect();
        bindBroadcastKindSelector();

        // 초기 패널 상태 동기화
        syncInfoPanel();

        await loadLatestAlertLogs();
        __broadcastInitOnce = true;
    } catch (e) {
        console.error("broadcast init error:", e);
    }

    // TTS 관리 모달 오픈(원본 유지)
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
