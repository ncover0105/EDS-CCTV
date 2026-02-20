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
        return String(v ?? "Use").trim().toLowerCase() === "use";
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
            opt.textContent = safeName(t.ttsName);
            sel.appendChild(opt);
        });
    }

    function bindTtsTemplateDropdown() {
        const sel = document.getElementById("bc_tts_list");
        const text = document.getElementById("customMessageText");
        if (!sel || !text) return;

        if (sel.dataset.bound === "1") return;

        sel.addEventListener("change", () => {
            const id = sel.value;

            // 🔥 직접입력 선택 시 무조건 초기화
            if (!id) {
                text.value = "";
                text.placeholder = "직접 메시지를 입력하세요";
                return;
            }

            const found = (ttsTemplateCache || []).find(
                t => String(t?.ttsId) === String(id)
            );

            text.value = found?.ttsMsg ?? "";
        });

        sel.dataset.bound = "1";
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
        // 1=TTS, 2=저장메시지, 3=기타
        return String(sel?.value ?? "") === "1";
    }

    function buildServerAlertPayload({ deviceId, ttsMessage }) {
        const alertMode = document.getElementById("bc_mode")?.value ?? "1";
        const alertKind = document.getElementById("bc_broadcast_type")?.value ?? "2";
        const alertRange = document.getElementById("bc_scope")?.value ?? "3";
        const alertPriority = document.getElementById("bc_priority")?.value ?? "3";

        // 백엔드 요구: 저장메시지/기타는 선택된 재난코드 사용, TTS는 CFW 고정
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
     * 방송 종류(재난) 렌더링 (드롭다운만 사용)
     * ----------------------------- */
    function isUseFlag(v) {
        const s = String(v ?? "").trim().toUpperCase();
        return s === "Y" || s === "USE" || s === "1" || s === "TRUE";
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

        const showTts = isTtsBroadcastMode();

        if (customArea) customArea.style.display = showTts ? "block" : "none";
        if (disasterArea) {
            disasterArea.style.display = showTts ? "none" : "block";
            const msgArea = document.getElementById("bc_disaster_msg_area");
            if (showTts && msgArea) msgArea.classList.add("d-none");
        }

        if (!showTts && customText) customText.value = "";
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
            const disasterMsgArea = document.getElementById("bc_disaster_msg_area");
            const disasterMsgText = document.getElementById("bc_disaster_msg_text");

            if (disasterSel) disasterSel.value = "";
            if (disasterMsgArea) disasterMsgArea.classList.add("d-none");
            if (disasterMsgText) disasterMsgText.textContent = "";

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

            /* -----------------------------
             * 4. 화면 표시 로직 다시 반영
             * ----------------------------- */
            updateCustomMessageAreaVisibility();
        });

        sel.dataset.bound = "1";

        updateCustomMessageAreaVisibility();
    }

    function bindDisasterSelector() {
        const sel = document.getElementById("bc_disaster");
        if (!sel || sel.dataset.boundDisaster === "1") return;

        const msgArea = document.getElementById("bc_disaster_msg_area");

        sel.addEventListener("change", () => {
            const val = sel.value;
            if (!msgArea) return;

            const msgText = document.getElementById("bc_disaster_msg_text");

            if (!val) {
                msgArea.classList.add("d-none");
                if (msgText) msgText.textContent = "";
                window.selectedBroadcastType = null;
                return;
            }

            window.selectedBroadcastType = val;

            const found = disasterCache.find(d => String(d.dstCode) === val);
            if (found && found.dstStoreMsg) {
                if (msgText) msgText.textContent = found.dstStoreMsg;
                msgArea.classList.remove("d-none");
            } else {
                msgArea.classList.add("d-none");
                if (msgText) msgText.textContent = "";
            }
        });

        sel.dataset.boundDisaster = "1";
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

        const deviceIds = getSelectedDeviceIdsForAlert();
        if (!deviceIds.length) {
            uiAlert("선택된 대상의 deviceId 매핑이 없습니다.", "danger");
            return;
        }

        const offlineList = getOfflineSpeakers();

        const doSend = async () => {
            try {
                for (const id of deviceIds) {
                    const payload = buildServerAlertPayload({
                        deviceId: id,
                        ttsMessage: isTts ? msg : ""
                    });

                    console.log("[BC PANE SEND SERVER PAYLOAD]", payload);
                    await sendAlertToServer(payload);
                }

                await loadLatestAlertLogs();
                uiAlert(`발령 요청 전송 완료 (${deviceIds.length}대)`, "success");
            } catch (e) {
                console.error(e);
                uiAlert("발령 전송 실패", "danger");
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
        uiAlert("현재 화면에서는 파일/오디오 실행 기능이 비활성화되었습니다.", "info");
    }
    window.stopBroadcast = stopBroadcast;

    /* -----------------------------
     * 방송 선택 초기화
     * ----------------------------- */
    function resetSelection() {
        clearTargetSpeakers();
        window.selectedBroadcastType = null;

        const customText = document.getElementById("customMessageText");
        if (customText) customText.value = "";

        const ttsSel = document.getElementById("bc_tts_list");
        if (ttsSel) ttsSel.value = "";

        // DropDown 초기화 + 메시지 영역 숨김
        const disasterSel = document.getElementById("bc_disaster");
        const disasterMsg = document.getElementById("bc_disaster_msg_area");
        const disasterText = document.getElementById("bc_disaster_msg_text");
        if (disasterSel) disasterSel.value = "";
        if (disasterMsg) {
            disasterMsg.classList.add("d-none");
            if (disasterText) disasterText.textContent = "";
        }

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

        const bodyHtml = html ? html : `<div class="log-message">${escapeHtml(message ?? "-")}</div>`;

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

    async function loadLatestAlertLogs() {
        const res = await fetch(ALERT_LOG_LATEST_API, { method: "GET" });
        if (!res.ok) throw new Error(`alert log api failed: ${res.status}`);

        const rows = await res.json();
        if (!Array.isArray(rows)) return;

        clearBroadcastLogPanel();

        rows.forEach((r) => {
            const status = String(r?.status ?? "").toUpperCase();
            const level = (status === "SENT") ? "success" : (status === "FAILED") ? "error" : "";
            const ts = formatIsoToYmdHms(r?.createdAt);

            appendBroadcastLogEntry(
                { timestamp: ts, level, html: buildAlertLogHtml(r) },
                { notify: false }
            );
        });
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
            bindBroadcastTypeSelector();
            bindDisasterSelector();
            await initTtsTemplateDropdown();

            await loadLatestAlertLogs();

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
