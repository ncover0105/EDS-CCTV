/* ===================================
 * equipment_broadcast_pane.js
 * - equipmentPage2.html / equipment-broadcast-pane.html 전용
 * - 기존 equipment_broadcast.js 로직을 Pane 구조에 맞게 동작하도록 래핑
 * - 핵심: /api/btype/command/alert 발령 전송 + 대상/재난/로그 UI
 * =================================== */

(function () {
    "use strict";

    /* -----------------------------
     * Alert/Toast 호환 유틸 (App.utils 없을 때도 동작)
     * ----------------------------- */
    function uiAlert(message, level) {
        try {
            if (window.App && window.App.utils && typeof window.App.utils.showGlobalAlert === "function") {
                window.App.utils.showGlobalAlert(message, level);
                return;
            }
        } catch (_) { }
        // fallback
        window.alert(message);
    }

    function extractApiErrorMessage(rawText, fallback) {
        const text = String(rawText ?? "").trim();
        if (!text) return fallback;
        try {
            const parsed = JSON.parse(text);
            if (parsed?.message) return parsed.message;
        } catch (_) { }
        return text;
    }

    /* -----------------------------
     * 공통 유틸 (원본 유지)
     * ----------------------------- */
    function safeValue(value, fallback = "-") {
        return (value === null || value === undefined || String(value).trim() === "") ? fallback : value;
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
        const raw = String(isoLike).trim();
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
            return formatLogTimestamp(parsed);
        }
        return raw.replace("T", " ").split(".")[0];
    }

    function formatDateToYmd(date = new Date()) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function getDisasterPriorityTone(priority) {
        const p = Number(priority);
        if (p === 1) return "high";
        if (p === 2) return "medium";
        if (p === 3) return "low";
        return "default";
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
    let alertLogState = {
        page: 0,
        hasNext: true,
        loading: false,
        initialized: false,
        date: formatDateToYmd(new Date())
    };

    window.selectedSpeakers = window.selectedSpeakers || [];
    window.selectedBroadcastType = window.selectedBroadcastType || null;

    /* -----------------------------
     * 스피커 타입 유틸리티
     * ----------------------------- */
    function normalizeSpeakerType(type) {
        if (!type) return "B";
        const t = String(type).trim().toUpperCase();
        if (t === "A" || t === "1") return "A";
        return "B";
    }

    function toUiTypeKey(type) {
        return normalizeSpeakerType(type).toLowerCase();
    }


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
     * TTS 템플릿 조회
     * ----------------------------- */
    const TTS_LIST_API_URL = "/api/tts";
    let ttsTemplateCache = []; // [{ttsId, ttsName, ttsMsg, ttsUseFlag, ...}]

    async function listTtsTemplates({ page = 0, size = 1000 } = {}) {
        const qs = new URLSearchParams({ page: String(page), size: String(size) });
        const res = await fetch(`${TTS_LIST_API_URL}?${qs.toString()}`);
        if (!res.ok) return [];

        // Spring Data Page<T> 형태: { content: [...], ... }
        const data = await res.json().catch(() => null);
        if (!data) return [];

        if (Array.isArray(data)) return data; // 혹시 배열로 내려오는 경우도 방어
        return Array.isArray(data.content) ? data.content : [];
    }

    function isUseTtsFlag(v) {
        const normalized = String(v ?? "true").trim().toLowerCase();
        return normalized === "use" || normalized === "true" || normalized === "1";
    }

    function renderTtsTemplateDropdown() {
        const sel = document.getElementById("bc_tts_list");
        if (!sel) return;

        sel.innerHTML = `<option value="">직접 입력</option>`;

        const list = Array.isArray(ttsTemplateCache) ? ttsTemplateCache : [];
        const visible = list
            .filter(t => t && t.ttsId != null)
            .filter(t => isUseTtsFlag(t.ttsUseFlag))
            .sort((a, b) => (Number(b.ttsId) || 0) - (Number(a.ttsId) || 0));

        visible.forEach(t => {
            const opt = document.createElement("option");
            opt.value = String(t.ttsId);
            opt.textContent = String(t.ttsName ?? `TTS-${t.ttsId ?? ""}`);
            sel.appendChild(opt);
        });

        sel.disabled = visible.length === 0;
    }

    function bindTtsTemplateDropdown() {
        const sel = document.getElementById("bc_tts_list");
        const text = document.getElementById("customMessageText");
        if (!sel || !text) return;

        if (sel.dataset.bound === "1") return;

        sel.addEventListener("change", () => {
            const id = sel.value;

            if (!id) {
                text.value = "";
                text.placeholder = "직접 메시지를 입력하세요";
                updateCustomMessageCounter();
                setBroadcastExecutionState("idle");
                syncBroadcastPhaseState();
                return;
            }

            const found = (ttsTemplateCache || []).find(
                t => String(t?.ttsId) === String(id)
            );

            text.value = found?.ttsMsg ?? "";
            if (text.value.length > 1000) {
                text.value = text.value.slice(0, 1000);
            }

            updateCustomMessageCounter();
            setBroadcastExecutionState("idle");
            syncBroadcastPhaseState();
        });

        sel.dataset.bound = "1";
    }

    function syncChoiceButtons(selectId) {
        const selectEl = document.getElementById(selectId);
        if (!selectEl) return;

        const value = String(selectEl.value ?? "");
        document.querySelectorAll(`.bc-choice-btn[data-target='${selectId}']`).forEach((btn) => {
            btn.classList.toggle("is-active", String(btn.dataset.value ?? "") === value);
        });
    }

    function bindChoiceButtonGroup(selectId) {
        const selectEl = document.getElementById(selectId);
        if (!selectEl || selectEl.dataset.boundChoice === "1") return;

        document.querySelectorAll(`.bc-choice-btn[data-target='${selectId}']`).forEach((btn) => {
            btn.addEventListener("click", () => {
                const value = String(btn.dataset.value ?? "");
                if (selectEl.value === value) return;

                selectEl.value = value;
                selectEl.dispatchEvent(new Event("change", { bubbles: true }));
                syncChoiceButtons(selectId);
            });
        });

        selectEl.addEventListener("change", () => syncChoiceButtons(selectId));
        selectEl.dataset.boundChoice = "1";
        syncChoiceButtons(selectId);
    }

    function renderDisasterCardList() {
        const listEl = document.getElementById("bc_disaster_card_list");
        const emptyEl = document.getElementById("bc_disaster_empty");
        if (!listEl || !emptyEl) return;
        const prevScrollTop = listEl.scrollTop;

        const list = (Array.isArray(disasterCache) ? disasterCache : [])
            .filter(d => isUseFlag(d?.dstUseFlag))
            .sort((a, b) => (a?.dstPriority ?? 9999) - (b?.dstPriority ?? 9999));

        listEl.innerHTML = "";

        if (list.length === 0) {
            emptyEl.classList.remove("d-none");
            return;
        }

        emptyEl.classList.add("d-none");
        const selectedCode = String(window.selectedBroadcastType ?? "");

        list.forEach((d) => {
            const code = String(safeValue(d?.dstCode, ""));
            const title = String(safeValue(d?.dstName, "재난 메시지"));
            const priority = String(d?.dstPriority ?? "-");
            const priorityTone = getDisasterPriorityTone(d?.dstPriority);

            listEl.insertAdjacentHTML("beforeend", `
                <button type="button" class="bc-disaster-card bc-disaster-card--${escapeHtml(priorityTone)} ${selectedCode === code ? "is-selected" : ""}" data-disaster-code="${escapeHtml(code)}">
                    <div class="bc-card-content">
                        <div class="bc-card-title">${escapeHtml(title)}</div>
                        <div class="bc-card-meta">
                            <span class="bc-priority-badge bc-priority-badge--${escapeHtml(priorityTone)}">우선순위 ${escapeHtml(priority)}</span>
                        </div>
                    </div>
                </button>
            `);
        });

        requestAnimationFrame(() => {
            listEl.scrollTop = prevScrollTop;
        });

        syncSelectedDisasterMessagePreview();

    }

    function syncSelectedDisasterMessagePreview() {
        const msgArea = document.getElementById("bc_disaster_msg_area");
        const msgText = document.getElementById("bc_disaster_msg_text");
        if (!msgArea || !msgText) return;

        const selectedCode = String(window.selectedBroadcastType ?? "").trim();
        if (!selectedCode) {
            msgArea.classList.add("d-none");
            msgArea.hidden = true;
            msgText.textContent = "";
            return;
        }

        const selected = (disasterCache || []).find((d) => String(safeValue(d?.dstCode, "")) === selectedCode);
        const selectedMsg = String(selected?.dstStoreMsg ?? "").trim();

        msgText.textContent = selectedMsg || "등록된 안내 문구가 없습니다.";
        msgArea.classList.remove("d-none");
        msgArea.hidden = false;
    }

    function bindDisasterCardList() {
        const listEl = document.getElementById("bc_disaster_card_list");
        const selectEl = document.getElementById("bc_disaster");
        if (!listEl || !selectEl || listEl.dataset.bound === "1") return;

        listEl.addEventListener("click", (e) => {
            const card = e.target.closest(".bc-disaster-card");
            if (!card) return;

            const code = String(card.dataset.disasterCode ?? "");
            if (!code) return;

            const currentSelected = String(window.selectedBroadcastType ?? "").trim();
            selectEl.value = currentSelected === code ? "" : code;
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        });

        listEl.dataset.bound = "1";
    }

    function focusSelectedDisasterCard(code) {
        if (!code) return;

        const safeCode = String(code).replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
        const card = document.querySelector(`.bc-disaster-card[data-disaster-code="${safeCode}"]`);
        if (!card || typeof card.focus !== "function") return;

        requestAnimationFrame(() => {
            try {
                card.focus({ preventScroll: true });
            } catch (_) {
                card.focus();
            }
        });
    }

    async function initTtsTemplateDropdown() {
        try {
            ttsTemplateCache = await listTtsTemplates({ page: 0, size: 1000 });
            renderTtsTemplateDropdown();
            bindTtsTemplateDropdown();
        } catch (e) {
            console.warn("tts template list load failed:", e);
        }
    }

    /* -----------------------------
     * 발령 API (전송)
     * ----------------------------- */
    const ALERT_API_URL = "/api/btype/command/alert";
    const ACTION_API_URL = "/api/btype/command/action";
    const ALERT_LOG_API_URL = "/api/spk/web/alert-logs";
    const ALERT_LOG_PAGE_SIZE = 100;
    let broadcastExecutionState = "idle";

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

    function getSelectedAlertTargets() {
        const keys = getSelectedSpeakerCodes();
        const list = Array.isArray(broadcastSpeakerCache) ? broadcastSpeakerCache : [];

        return list
            .filter(sp => keys.includes(getSpeakerKey(sp)))
            .map(sp => ({
                speakerKey: getSpeakerKey(sp),
                deviceId: String(getSpeakerId(sp) ?? "").trim()
            }))
            .filter(target => target.deviceId);
    }

    function getSelectedSpeakerIds() {
        return getSelectedDeviceIdsForAlert();
    }

    function isBroadcastMessageConfigured() {
        if (isTtsBroadcastMode()) {
            const msg = String(document.getElementById("customMessageText")?.value ?? "").trim();
            const ttsTemplateId = String(document.getElementById("bc_tts_list")?.value ?? "").trim();
            return msg.length > 0 || ttsTemplateId.length > 0;
        }

        return String(window.selectedBroadcastType ?? "").trim().length > 0;
    }

    function setBroadcastExecutionState(nextState = "idle") {
        broadcastExecutionState = nextState;
        syncBroadcastPhaseState();
    }

    function getPhase3Presentation(hasSelection, isConfigured) {
        if (!hasSelection || !isConfigured) {
            return { icon: "3", stateText: "대기", stateClass: "" };
        }

        switch (broadcastExecutionState) {
            case "loading":
                return { icon: "...", stateText: "전송 중", stateClass: "is-loading" };
            case "success":
                return { icon: "✓", stateText: "전송 완료", stateClass: "is-success" };
            case "error":
                return { icon: "!", stateText: "전송 실패", stateClass: "is-error" };
            default:
                return { icon: "3", stateText: "실행 가능", stateClass: "is-active" };
        }
    }

    function syncBroadcastPhaseState() {
        const phase1 = document.getElementById("bcPhase1");
        const phase2 = document.getElementById("bcPhase2");
        const phase3 = document.getElementById("bcPhase3");
        const phase3Icon = phase3?.querySelector(".bc-phase-icon");
        const phase3State = document.getElementById("bcPhase3State");
        const phases = [phase1, phase2, phase3].filter(Boolean);
        if (phases.length !== 3) return;

        const hasSelection = getSelectedSpeakerCodes().length > 0;
        const isConfigured = hasSelection && isBroadcastMessageConfigured();
        const activeStep = !hasSelection ? 1 : (isConfigured ? 3 : 2);

        phases.forEach((phase, idx) => {
            const stepNo = idx + 1;
            phase.classList.remove("is-loading", "is-success", "is-error");
            phase.classList.toggle("is-active", stepNo === activeStep);
            phase.classList.toggle("is-done", stepNo < activeStep);
        });

        const phase3Presentation = getPhase3Presentation(hasSelection, isConfigured);
        if (phase3) {
            phase3.classList.remove("is-active", "is-loading", "is-success", "is-error");
            phase3.classList.toggle("is-done", hasSelection && isConfigured);
            if (phase3Presentation.stateClass) {
                phase3.classList.add(phase3Presentation.stateClass);
            }
        }
        if (phase3Icon) phase3Icon.textContent = phase3Presentation.icon;
        if (phase3State) phase3State.textContent = phase3Presentation.stateText;
    }

    function isTtsBroadcastMode() {
        const sel = document.getElementById("bc_broadcast_type");
        // 1=TTS, 2=저장메시지, 3=기타
        return String(sel?.value ?? "") === "1";
    }

    function buildServerAlertPayload({ deviceId, deviceIds, ttsMessage, password = "" }) {
        const alertMode = document.getElementById("bc_mode")?.value ?? "1";
        const alertKind = document.getElementById("bc_broadcast_type")?.value ?? "2";
        const alertRange = document.getElementById("bc_scope")?.value ?? "3";
        const alertPriority = document.getElementById("bc_priority")?.value ?? "3";

        // 백엔드 요구: 저장메시지/기타는 선택된 재난코드 사용, TTS는 CFW 고정
        const disasterCode = isTtsBroadcastMode()
            ? "CFW"
            : String(window.selectedBroadcastType ?? "").trim();

        return {
            deviceId: String(deviceId ?? deviceIds?.[0] ?? ""),
            deviceIds: Array.isArray(deviceIds)
                ? deviceIds.map(id => String(id ?? "").trim()).filter(Boolean)
                : undefined,
            commandCode: "41",
            alertMode: Number(alertMode),
            disasterCode,
            alertKind: Number(alertKind),
            alertRange: Number(alertRange),
            alertPriority: Number(alertPriority),
            ttsMessage: String(ttsMessage ?? ""),
            password
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
            throw new Error(extractApiErrorMessage(txt, `HTTP ${res.status}`));
        }
    }

    async function sendSpeakerAction(payload) {
        const res = await fetch(ACTION_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(extractApiErrorMessage(txt, `HTTP ${res.status}`));
        }

        return await res.json().catch(() => ({}));
    }

    function setActionButtonBusy(btnId, busy) {
        const btn = document.getElementById(btnId);
        if (!btn) return null;

        if (!btn.dataset.label) {
            btn.dataset.label = btn.innerHTML;
        }

        btn.disabled = busy;
        btn.innerHTML = busy
            ? `<i class="bi bi-arrow-repeat"></i> 처리 중...`
            : btn.dataset.label;

        return btn;
    }

    async function runBroadcastBgmAction(action, btnId) {
        const speakerIds = getSelectedSpeakerIds();
        if (!speakerIds.length) {
            uiAlert("BGM 제어 대상을 선택해 주세요.", "warning");
            return;
        }

        const password = prompt("비밀번호를 입력하세요.");
        if (password === null) return; // 취소

        const isOn = (action === "bgmOn");
        const label = isOn ? "BGM ON" : "BGM OFF";
        setActionButtonBusy(btnId, true);

        try {
            await sendSpeakerAction({ speakerIds, action, password });
            uiAlert(`${label} 실행 완료 (${speakerIds.length}대)`, "success");
            appendBroadcastLogEntry({
                html: buildAlertLogHtml({
                    status: "1",
                    createdAt: new Date(),
                    deviceId: speakerIds[0] ?? "-",
                    commandCode: "47",
                    bgmReqType: isOn ? "01" : "00",
                })
            }, { stickToBottom: true });
            await loadAlertLogs({ reset: true, stickToBottom: true });
        } catch (e) {
            console.error(e);
            uiAlert(e?.message || `${label} 실행 실패`, "danger");
            appendBroadcastLogEntry({
                html: buildAlertLogHtml({
                    status: "0",
                    createdAt: new Date(),
                    deviceId: speakerIds[0] ?? "-",
                    commandCode: "47",
                    bgmReqType: isOn ? "01" : "00",
                })
            }, { stickToBottom: true });
        } finally {
            setActionButtonBusy(btnId, false);
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
            syncBroadcastPhaseState();
            return;
        }

        emptyEl.classList.add("d-none");

        let appended = 0;

        list.forEach(spk => {
            const speakerKey = getSpeakerKey(spk);
            if (!speakerKey) return;

            const name = getSpeakerName(spk, speakerKey);
            const spkId = getSpeakerId(spk);
            const rawType = spk?.speakerType ?? spk?.type ?? spk?.spkType ?? "B";
            const type = normalizeSpeakerType(rawType);
            const uiTypeKey = toUiTypeKey(rawType);

            const connStat = spk?.connStat ?? spk?.connectStat ?? spk?.status ?? spk?.connStatus;
            const statusClass = safeStatus(connStat);
            const isOffline = statusClass === "offline";

            const checked = selectedTargetSpeakerKeys.has(speakerKey);

            listEl.insertAdjacentHTML(
                "beforeend",
                `
        <div class="speaker-card ${checked ? "selected" : ""} ${isOffline ? "offline" : ""}"
          data-speaker-key="${escapeHtml(speakerKey)}">
          <div class="d-flex justify-content-between align-items-center">
            <div class="w-100 d-flex align-items-center gap-3">
              <div class="form-check mb-0">
                  <input class="form-check-input targetSpeakerChk"
                  type="checkbox"
                  data-speaker-key="${escapeHtml(speakerKey)}"
                  ${checked ? "checked" : ""}>
              </div>
              
              <div class="speaker-info-main flex-grow-1">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <div class="speaker-name fw-bold">${escapeHtml(name)}</div>
                </div>
                <div class="speaker-sub-id">${escapeHtml(spkId)}</div>
              </div>
              
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
            syncBroadcastPhaseState();
            return;
        }

        cntEl.textContent = String(selectedTargetSpeakerKeys.size);

        if (allEl) {
            const total = listEl.querySelectorAll(".targetSpeakerChk").length;
            const checkedCount = listEl.querySelectorAll(".targetSpeakerChk:checked").length;
            allEl.checked = (total > 0 && total === checkedCount);
        }

        syncBroadcastPhaseState();
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
                const type = String(chk.dataset.speakerType || "B");
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

                setBroadcastExecutionState("idle");
                syncBroadcastPhaseState();
                // updateComposerTheme();
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
                setBroadcastExecutionState("idle");
                syncBroadcastPhaseState();
                // updateComposerTheme();
            });

            allEl.dataset.bound = "1";
        }
    }

    function clearTargetSpeakers() {
        selectedTargetSpeakerKeys.clear();
        setBroadcastExecutionState("idle");

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

        syncBroadcastPhaseState();
    }
    window.clearTargetSpeakers = clearTargetSpeakers;

    /* -----------------------------
     * 방송 종류(재난) 렌더링 (드롭다운만 사용)
     * ----------------------------- */
    function isUseFlag(v) {
        const s = String(v ?? "").trim().toUpperCase();
        return s === "Y" || s === "USE" || s === "1" || s === "TRUE";
    }

    function getDisasterNameByCode(code) {
        const normalizedCode = String(code ?? "").trim();
        if (!normalizedCode) return "-";

        const found = (Array.isArray(disasterCache) ? disasterCache : []).find(
            (d) => String(d?.dstCode ?? "").trim() === normalizedCode
        );

        return String(found?.dstName ?? "").trim() || normalizedCode;
    }

    async function renderBroadcastTypes() {
        const disasters = await listDisasters();
        disasterCache = Array.isArray(disasters) ? disasters : [];

        const select = document.getElementById("bc_disaster");
        if (select) {
            select.innerHTML = `<option value="" selected>-- 선택 --</option>`;

            const listForDropdown = disasterCache
                .filter(d => isUseFlag(d?.dstUseFlag))
                .sort((a, b) => (a?.dstPriority ?? 9999) - (b?.dstPriority ?? 9999));

            listForDropdown.forEach(d => {
                const opt = document.createElement("option");
                opt.value = safeValue(d.dstCode, "");
                opt.textContent = safeName(d.dstName);
                select.appendChild(opt);
            });
        }

        renderDisasterCardList();
        resetSelection();
    }

    function edsConfirm(message, onConfirm) {
        const modalEl = document.getElementById("edsConfirmModal");
        if (!modalEl || !window.bootstrap) {
            // 모달이 없으면 즉시 confirm fallback
            if (window.confirm(message.replaceAll(/<[^>]*>/g, ""))) onConfirm?.();
            return;
        }

        const msgEl = document.getElementById("edsConfirmMessage");
        const titleEl = document.getElementById("edsConfirmTitle");
        if (msgEl) msgEl.innerHTML = message;
        if (titleEl) titleEl.innerText = "확인";

        const okBtn = document.getElementById("edsConfirmOk");
        const cancelBtn = document.getElementById("edsConfirmCancel");

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
        const customText = document.getElementById("customMessageText");
        const disasterArea = document.getElementById("bc_disaster_area");

        // 1=TTS, 2=저장메시지, 3=기타
        const showTts = isTtsBroadcastMode();

        // [Fix] d-none 클래스를 toggle하여 CSS 우선순위 충돌 방지
        if (customArea) {
            customArea.classList.toggle("d-none", !showTts);
            customArea.style.display = showTts ? "flex" : "none";
        }
        if (disasterArea) {
            disasterArea.classList.toggle("d-none", showTts);
            disasterArea.style.display = showTts ? "none" : "flex";
        }

        if (!showTts && customText) {
            customText.value = "";
            updateCustomMessageCounter();
        }

        // 상태 초기화 및 재검색
        if (!showTts) {
            renderDisasterCardList();
        } else {
            syncSelectedDisasterMessagePreview();
        }

        setBroadcastExecutionState("idle");
        syncBroadcastPhaseState();
    }

    function bindBroadcastTypeSelector() {
        const sel = document.getElementById("bc_broadcast_type");
        if (!sel) return;

        if (sel.dataset.bound === "1") return;

        sel.addEventListener("change", () => {

            /* -----------------------------
             * 1. 재난 선택 초기화
             * ----------------------------- */
            const disasterSel = document.getElementById("bc_disaster");

            if (disasterSel) disasterSel.value = "";

            window.selectedBroadcastType = null;

            /* -----------------------------
             * 2. TTS 드롭다운 초기화
             * ----------------------------- */
            const ttsSel = document.getElementById("bc_tts_list");
            if (ttsSel) ttsSel.value = "";

            /* -----------------------------
             * 3. 사용자 메시지 초기화
             * ----------------------------- */
            const customText = document.getElementById("customMessageText");
            if (customText) customText.value = "";
            updateCustomMessageCounter();

            setBroadcastExecutionState("idle");

            /* -----------------------------
             * 4. 화면 표시 로직 다시 반영
             * ----------------------------- */
            updateCustomMessageAreaVisibility();
            renderDisasterCardList();
            syncBroadcastPhaseState();
        });

        sel.dataset.bound = "1";

        updateCustomMessageAreaVisibility();
    }

    function bindDisasterSelector() {
        const sel = document.getElementById("bc_disaster");
        if (!sel || sel.dataset.boundDisaster === "1") return;

        sel.addEventListener("change", () => {
            const val = sel.value;

            if (!val) {
                window.selectedBroadcastType = null;
                setBroadcastExecutionState("idle");
                renderDisasterCardList();
                syncSelectedDisasterMessagePreview();
                syncBroadcastPhaseState();
                return;
            }

            window.selectedBroadcastType = val;

            setBroadcastExecutionState("idle");
            renderDisasterCardList();
            syncSelectedDisasterMessagePreview();
            focusSelectedDisasterCard(val);
            syncBroadcastPhaseState();
        });

        sel.dataset.boundDisaster = "1";
    }

    function updateCustomMessageCounter() {
        const textEl = document.getElementById("customMessageText");
        const countEl = document.getElementById("customMessageCount");
        if (!textEl || !countEl) return;

        if (textEl.value.length > 1000) {
            textEl.value = textEl.value.slice(0, 1000);
        }

        countEl.textContent = textEl.value.length;
    }

    function bindBroadcastMessageInput() {
        const textEl = document.getElementById("customMessageText");
        if (!textEl || textEl.dataset.boundPhase === "1") return;

        textEl.addEventListener("input", () => {
            updateCustomMessageCounter();
            setBroadcastExecutionState("idle");
            syncBroadcastPhaseState();
        });

        updateCustomMessageCounter();
        textEl.dataset.boundPhase = "1";
    }
    /* -----------------------------
     * 발령 실행 (startBroadcast)
     * ----------------------------- */
    async function startBroadcast() {
        const speakerKeys = getSelectedSpeakerCodes();
        if (!speakerKeys || speakerKeys.length === 0) {
            uiAlert("발령 대상을 선택해 주세요.", "warning");
            return;
        }

        if (!isTtsBroadcastMode() && !window.selectedBroadcastType) {
            uiAlert("발령을 위해 재난 유형을 선택해 주세요.", "warning");
            return;
        }

        const isTts = isTtsBroadcastMode();
        const msg = (document.getElementById("customMessageText")?.value ?? "").trim();

        if (isTts && !msg) {
            uiAlert("TTS 메시지를 입력해 주세요.", "warning");
            return;
        }

        const alertTargets = getSelectedAlertTargets();
        if (!alertTargets.length) {
            uiAlert("선택된 대상의 deviceId 매핑이 없습니다.", "danger");
            return;
        }

        const offlineList = getOfflineSpeakers();

        const doSend = async () => {
            const password = prompt("비밀번호를 입력하세요.");
            if (password === null) return;

            let payload = null;
            try {
                setBroadcastExecutionState("loading");
                payload = buildServerAlertPayload({
                    deviceId: alertTargets[0]?.deviceId ?? "",
                    deviceIds: alertTargets.map(target => target.deviceId),
                    ttsMessage: isTts ? msg : "",
                    password
                });

                console.log("[BC PANE SEND SERVER PAYLOAD]", payload);
                await sendAlertToServer(payload);

                appendBroadcastLogEntry({
                    html: buildAlertLogHtml({
                        status: "1",
                        createdAt: new Date(),
                        deviceId: payload.deviceId ?? "-",
                        commandCode: payload.commandCode ?? "41",
                        alertMode: payload.alertMode,
                        disasterCode: payload.disasterCode,
                        alertKind: payload.alertKind,
                        ttsMessage: payload.ttsMessage,
                    })
                }, { stickToBottom: true });
                await loadAlertLogs({ reset: true, stickToBottom: true });
                setBroadcastExecutionState("success");
                uiAlert(`발령 요청 전송 완료 (${alertTargets.length}대)`, "success");
            } catch (e) {
                console.error(e);
                setBroadcastExecutionState("error");
                uiAlert(e?.message || "발령 전송 실패", "danger");
                appendBroadcastLogEntry({
                    html: buildAlertLogHtml({
                        status: "0",
                        createdAt: new Date(),
                        deviceId: payload?.deviceId ?? "-",
                        commandCode: payload?.commandCode ?? "41",
                        alertMode: payload?.alertMode ?? Number(document.getElementById("bc_mode")?.value ?? 1),
                        disasterCode: payload?.disasterCode ?? String(window.selectedBroadcastType ?? "").trim(),
                        alertKind: payload?.alertKind ?? Number(document.getElementById("bc_broadcast_type")?.value ?? 2),
                        ttsMessage: payload?.ttsMessage ?? msg,
                    })
                }, { stickToBottom: true });
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

    function stopBroadcast() {
        const speakerKeys = getSelectedSpeakerCodes();
        if (!speakerKeys || speakerKeys.length === 0) {
            uiAlert("발령 대상을 선택해 주세요.", "warning");
            return;
        }
        const password = prompt("비밀번호를 입력하세요.");
        if (password === null) return;

        setBroadcastExecutionState("idle");
        uiAlert("방송 종료 명령은 현재 백엔드 액션이 연결되어 있지 않습니다.", "info");
    }
    window.stopBroadcast = stopBroadcast;

    async function startBroadcastBgm() {
        await runBroadcastBgmAction("bgmOn", "broadcastBgmOnBtn");
    }
    window.startBroadcastBgm = startBroadcastBgm;

    async function stopBroadcastBgm() {
        await runBroadcastBgmAction("bgmOff", "broadcastBgmOffBtn");
    }
    window.stopBroadcastBgm = stopBroadcastBgm;

    /* -----------------------------
     * 방송 선택 초기화
     * ----------------------------- */
    function resetSelection() {
        setBroadcastExecutionState("idle");
        clearTargetSpeakers();
        window.selectedBroadcastType = null;

        const customText = document.getElementById("customMessageText");
        if (customText) customText.value = "";
        updateCustomMessageCounter();

        const ttsSel = document.getElementById("bc_tts_list");
        if (ttsSel) ttsSel.value = "";

        // DropDown 초기화 + 메시지 영역 숨김
        const disasterSel = document.getElementById("bc_disaster");
        if (disasterSel) disasterSel.value = "";

        updateCustomMessageAreaVisibility();
    }
    window.resetSelection = resetSelection;

    /* -----------------------------
     * Broadcast Log (최근 발령 로그)
     * ----------------------------- */
    function formatLogTimestamp(d = new Date()) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
            `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function clearBroadcastLogPanel() {
        const panel = document.getElementById("broadcastLogPanel");
        if (panel) panel.innerHTML = "";
        syncBroadcastLogEmptyState();
    }

    function syncBroadcastLogEmptyState() {
        const panel = document.getElementById("broadcastLogPanel");
        const emptyEl = document.getElementById("broadcastLogEmpty");

        if (!panel || !emptyEl) return;
        const hasRows = (panel.childElementCount > 0);

        emptyEl.classList.toggle("d-none", hasRows);
        panel.classList.toggle("d-none", !hasRows);
    }

    function getBroadcastLogScrollElement() {
        return document.getElementById("broadcastLogSection");
    }

    function buildAlertLogHtml(row) {
        const status = String(row?.status ?? "");
        const ts = formatIsoToYmdHms(row?.createdAt);

        const deviceId = String(row?.deviceId ?? "-");
        const commandCode = String(row?.commandCode ?? "").trim();
        const bgmReqType = String(row?.bgmReqType ?? "").trim();
        const disasterCode = String(row?.disasterCode ?? "-");
        const disasterName = getDisasterNameByCode(disasterCode);
        const kind = String(row?.alertKind ?? "-");
        const alertMode = String(row?.alertMode ?? "-");

        const kindMap = {
            "1": "TTS",
            "2": "저장 메시지",
            "3": "기타"
        };

        const alertModeMap = {
            "0": "시험 방송",
            "1": "실제 방송"
        };

        const statusMap = {
            "1": { text: "성공", className: "status-ok" },
            "0": { text: "실패", className: "status-err" }
        };

        const kindText = commandCode === "47"
            ? "BGM 제어"
            : (kindMap[kind] ?? kind);
        const alertModeText = commandCode === "47"
            ? "음원 제어"
            : (alertModeMap[alertMode] ?? alertMode);
        const { text: statusText, className: statusClass } =
            statusMap[status] ?? { text: status || "-", className: "status-none" };

        const content = commandCode === "47"
            ? (bgmReqType === "01" ? "BGM ON" : bgmReqType === "00" ? "BGM OFF" : "BGM 제어")
            : (kind === "1" && row?.ttsMessage ? row.ttsMessage : `재난: ${disasterName}`);

        return `
            <div class="bc-log-card">
                <div class="bc-log-card-header">
                    <span class="bc-log-time">${escapeHtml(ts)}</span>
                    <span class="bc-log-badge ${statusClass}">${escapeHtml(statusText)}</span>
                </div>
                <div class="bc-log-card-body">
                    <div class="bc-log-main-info">
                        <span class="bc-log-kind">${escapeHtml(kindText)}</span>
                        <span class="bc-log-kind">${escapeHtml(alertModeText)}</span>
                        <span class="bc-log-device">ID: ${escapeHtml(deviceId)}</span>
                    </div>
                    <div class="bc-log-content">${escapeHtml(content)}</div>
                </div>
            </div>
        `;
    }

    function appendBroadcastLogEntry({ timestamp, message, html }, opts = {}) {
        const panel = document.getElementById("broadcastLogPanel");
        if (!panel) return;

        const ts = timestamp || formatLogTimestamp(new Date());
        const { append = false, stickToBottom = false } = opts;

        let markup = "";
        if (html) {
            markup = html;
        } else {
            markup = `
                <div class="bc-log-card log-info-msg">
                    <span class="bc-log-time">${escapeHtml(ts)}</span>
                    <span class="text-muted small">${escapeHtml(message ?? "-")}</span>
                </div>
            `;
        }

        panel.insertAdjacentHTML(append ? "beforeend" : "afterbegin", markup);
        syncBroadcastLogEmptyState();

        const scrollEl = getBroadcastLogScrollElement();
        if (scrollEl && stickToBottom) {
            scrollEl.scrollTop = append ? scrollEl.scrollHeight : 0;
        }
    }

    function normalizeAlertLogRows(payload) {
        if (Array.isArray(payload)) {
            return { rows: payload, hasNext: false };
        }

        if (!payload || !Array.isArray(payload.content)) {
            return { rows: [], hasNext: false };
        }

        return {
            rows: payload.content,
            hasNext: Boolean(payload.hasNext)
        };
    }

    async function fetchAlertLogPage(page = 0) {
        const qs = new URLSearchParams({
            date: alertLogState.date,
            page: String(page),
            size: String(ALERT_LOG_PAGE_SIZE)
        });
        const res = await fetch(`${ALERT_LOG_API_URL}?${qs.toString()}`, { method: "GET" });
        if (!res.ok) throw new Error(`alert log api failed: ${res.status}`);

        const payload = await res.json().catch(() => null);
        return normalizeAlertLogRows(payload);
    }

    function renderAlertLogRows(rows, { reset = false, stickToBottom = false } = {}) {
        if (reset) clearBroadcastLogPanel();

        rows.forEach((r) => {
            const status = String(r?.status ?? "").toUpperCase();
            const level = (status === "SENT") ? "success" : (status === "FAILED") ? "error" : "";
            const ts = formatIsoToYmdHms(r?.createdAt);

            appendBroadcastLogEntry(
                { timestamp: ts, level, html: buildAlertLogHtml(r) },
                { append: true, stickToBottom }
            );
        });

        syncBroadcastLogEmptyState();
    }

    async function loadAlertLogs({ reset = false, stickToBottom = false } = {}) {
        if (alertLogState.loading) return;

        if (reset) {
            alertLogState.page = 0;
            alertLogState.hasNext = true;
            alertLogState.date = formatDateToYmd(new Date());
        }

        if (!alertLogState.hasNext && !reset) return;

        alertLogState.loading = true;

        try {
            const { rows, hasNext } = await fetchAlertLogPage(alertLogState.page);
            renderAlertLogRows(rows, { reset, stickToBottom });
            alertLogState.hasNext = hasNext;
            alertLogState.page += 1;
            alertLogState.initialized = true;
            syncBroadcastLogEmptyState();
        } finally {
            alertLogState.loading = false;
        }
    }

    function bindBroadcastLogScroll() {
        const scrollEl = getBroadcastLogScrollElement();
        if (!scrollEl || scrollEl.dataset.bound === "1") return;

        scrollEl.addEventListener("scroll", () => {
            if (alertLogState.loading || !alertLogState.hasNext) return;

            const threshold = 120;
            const remaining = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
            if (remaining <= threshold) {
                loadAlertLogs();
            }
        });

        scrollEl.dataset.bound = "1";
    }

    /* -----------------------------
     * Pane 초기화 진입점
     * ----------------------------- */
    let __broadcastInitOnce = false;

    async function initBroadcastPane(options = { once: true, refresh: false }) {
        const hasBroadcastDom =
            document.getElementById("equipment-broadcast-pane") ||
            document.getElementById("targetSpeakerList") ||
            document.getElementById("bc_broadcast_type");

        if (!hasBroadcastDom) return;

        if (!options.refresh && options.once && __broadcastInitOnce) return;

        try {
            broadcastSpeakerCache = await listSpeakers();
            renderTargetSpeakerList(broadcastSpeakerCache);
            bindTargetSpeakerUI();

            await renderBroadcastTypes();
            bindChoiceButtonGroup("bc_mode");
            bindChoiceButtonGroup("bc_broadcast_type");
            bindBroadcastTypeSelector();
            bindDisasterSelector();
            bindDisasterCardList();
            bindBroadcastMessageInput();
            await initTtsTemplateDropdown();
            syncBroadcastPhaseState();

            bindBroadcastLogScroll();
            syncBroadcastLogEmptyState();
            await loadAlertLogs({ reset: true });

            // TTS 관리 모달 연결 (존재할 때만)
            const btn = document.getElementById("bc_open_tts_manage");
            if (btn && !btn.dataset.bound) {
                btn.addEventListener("click", () => {
                    const ttsEl = document.getElementById("tts_manage_modal");
                    if (!ttsEl || !window.bootstrap) return;

                    const ttsModal = bootstrap.Modal.getOrCreateInstance(ttsEl);
                    ttsModal.show();

                    ttsEl.addEventListener("shown.bs.modal", () => {
                        window.TtsManageModal?.loadList?.();
                    }, { once: true });
                });
                btn.dataset.bound = "1";
            }

            __broadcastInitOnce = true;
        } catch (e) {
            console.error("broadcast pane init error:", e);
        }
    }

    // 외부에서 필요 시 호출할 수 있도록 export
    window.initBroadcastPane = initBroadcastPane;

    /* -----------------------------
     * Pane 활성화 감지
     * - equipment2.js가 pane class를 토글(is-active)할 때, 방송 pane 활성화 순간에 init 수행
     * - 초기 로딩에서도 한번 시도
     * ----------------------------- */
    function isBroadcastPaneActive() {
        const pane = document.getElementById("equipment-broadcast-pane");
        if (!pane) return false;
        return pane.classList.contains("is-active");
    }

    function boot() {
        // 초기 로딩: 이미 방송 pane가 active면 init
        if (isBroadcastPaneActive()) {
            initBroadcastPane({ once: true, refresh: false });
        }

        // class 변경 감지 (tab/pane 전환)
        const pane = document.getElementById("equipment-broadcast-pane");
        if (!pane || !window.MutationObserver) return;

        const obs = new MutationObserver(() => {
            if (isBroadcastPaneActive()) {
                initBroadcastPane({ once: true, refresh: false });
            }
        });

        obs.observe(pane, { attributes: true, attributeFilter: ["class"] });

        // nav 클릭 fallback (data-target 기반)
        document.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-target='equipment-broadcast-pane']");
            if (!btn) return;
            // 전환 직후 DOM 반영을 기다렸다가 init
            setTimeout(() => initBroadcastPane({ once: true, refresh: false }), 0);
        }, { capture: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
