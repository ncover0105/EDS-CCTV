/* ==========================================================
* modal_speaker_broadcast.js (multi-select fixed)
* - speaker-card 클릭: active 토글(개별), 다른 카드 active 유지
* - 전체 선택/전체 해제(bc_toggle_all)
* - HTML 값 기준: bc_mode=0/1, bc_broadcast_type=1/2/3
* - 기존 단일 선택(bcSelectedSpeaker) 제거 -> Set 기반
* ========================================================== */

/* ---------- Utils ---------- */
function safe(v, fb = "-") {
    return v !== undefined && v !== null && v !== "" ? v : fb;
}
function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = safe(v, "-");
}
function setVal(id, v) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = (v === undefined || v === null) ? "" : String(v);
}

function show(id) { document.getElementById(id)?.classList.remove("d-none"); }
function hide(id) { document.getElementById(id)?.classList.add("d-none"); }
function getPanelPrefixes() { return ["b_bc"]; }
function getSpeakerTypeToken(type) {
    return String(type ?? "A").toUpperCase().includes("B") ? "type-b" : "type-a";
}
function getSpeakerTypeLabel(type) {
    return String(type ?? "A").toUpperCase().includes("B") ? "B 타입" : "A 타입";
}
function isUseTtsFlag(v) {
    const normalized = String(v ?? "true").trim().toLowerCase();
    return normalized === "use" || normalized === "true" || normalized === "1";
}

// function showTab(btnId) {
//     const btn = document.getElementById(btnId);
//     if (!btn) return;
//     if (typeof bootstrap === "undefined" || !bootstrap.Tab) return;
//     bootstrap.Tab.getOrCreateInstance(btn).show();
// }

function getInlineStatusElements() {
    return {
        box: document.getElementById("bc_inline_status"),
        text: document.getElementById("bc_inline_status_text")
    };
}

let bcInlineStatusTimer = null;

function showInlineStatus(msg, type = "warning") {
    const { box, text } = getInlineStatusElements();
    if (!box || !text) return;

    if (bcInlineStatusTimer) {
        clearTimeout(bcInlineStatusTimer);
        bcInlineStatusTimer = null;
    }

    box.classList.remove("d-none", "is-success", "is-warning", "is-danger", "is-info");
    box.classList.add(`is-${type === "danger" ? "danger" : type === "success" ? "success" : type === "info" ? "info" : "warning"}`);
    text.textContent = msg;

    if (type === "success") {
        bcInlineStatusTimer = setTimeout(() => clearInlineStatus(), 2500);
    }
}

function clearInlineStatus() {
    const { box, text } = getInlineStatusElements();
    if (!box || !text) return;

    if (bcInlineStatusTimer) {
        clearTimeout(bcInlineStatusTimer);
        bcInlineStatusTimer = null;
    }

    box.classList.add("d-none");
    box.classList.remove("is-success", "is-warning", "is-danger", "is-info");
    text.textContent = "";
}

function setFieldError(id, msg = "") {
    const field = document.getElementById(id);
    const err = document.getElementById(`${id}_error`);

    if (field) field.classList.toggle("is-invalid", !!msg);
    if (err) {
        err.textContent = msg;
        err.classList.toggle("show", !!msg);
    }
}

function clearValidationErrors() {
    ["a_bc_disaster", "a_bc_tts", "b_bc_disaster", "b_bc_tts"].forEach(id => setFieldError(id, ""));
}

function showHintMessage(msg) {
    setText("bc_hint", msg);
}

function setActionStatus(prefix, section, msg = "", type = "") {
    const el = document.getElementById(`${prefix}_${section}_status`);
    if (!el) return;

    el.textContent = msg;
    el.classList.remove("d-none", "is-success", "is-danger");

    if (!msg) {
        el.classList.add("d-none");
        return;
    }

    if (type === "success") el.classList.add("is-success");
    if (type === "danger") el.classList.add("is-danger");
}

function clearActionStatuses() {
    getPanelPrefixes().forEach(prefix => {
        setActionStatus(prefix, "broadcast", "");
        setActionStatus(prefix, "bgm", "");
    });
}

function clearAllStatuses() {
    clearInlineStatus();
    clearActionStatuses();
}

function setSendButtonState(btn, isLoading, count = 0) {
    if (!btn) return;

    if (!btn.dataset.defaultHtml) {
        btn.dataset.defaultHtml = btn.innerHTML;
    }

    btn.disabled = isLoading;
    btn.innerHTML = isLoading
        ? `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 전송 중${count > 0 ? ` (${count}대)` : ""}`
        : btn.dataset.defaultHtml;
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

function extractApiErrorMessage(rawText, fallback = "요청 처리 중 오류가 발생했습니다.") {
    const text = String(rawText ?? "").trim();
    if (!text) return fallback;
    try {
        const parsed = JSON.parse(text);
        if (parsed?.message) return parsed.message;
    } catch (_) { }
    return text;
}

function promptSpeakerPassword(message = "비밀번호를 입력하세요.") {
    const password = window.prompt(message);
    if (password === null) return null;
    return password;
}

/* ---------- Selection State (multi) ---------- */
const bcSelectedSpeakerKeys = new Set();  // data-speaker-key
const bcSelectedSpeakerIds = new Set();    // data-device-id

function getActiveCards() {
    return [...document.querySelectorAll('#bc_speaker_list .speaker-item.selected')];
}

function getSelectedSpeakerIds() {
    // active 된 카드에서 speakerId 추출
    return getActiveCards()
        .map(card => card.dataset.speakerId)
        .filter(Boolean);
}

function syncSelectionUI() {
    const activeCards = getActiveCards();
    const count = activeCards.length;

    const areaB = document.getElementById('bc_area_type_b');

    // ── steptext / selectedspeakername 처리 ──
    if (count === 0) {
        BroadcastModal.resetPanelForms?.();
        setVal('bc_selected_speaker_name', '');
        setText('b_bc_step_text', '스피커를 선택하세요.');

        if (areaB) areaB.classList.remove('d-none');
    } else {
        const oneName = activeCards[0].dataset?.speakerName
            || activeCards[0].querySelector('.speaker-name')?.textContent?.trim();

        if (count === 1) {
            setVal('bc_selected_speaker_name', oneName);
            setText('b_bc_step_text', `${oneName} 선택됨.`);
        } else {
            setVal('bc_selected_speaker_name', count);
            setText('b_bc_step_text', `${count}개 스피커 선택됨.`);
        }

        if (areaB) areaB.classList.remove('d-none');
    }

    // ── 선택 칩 렌더링 ──
    renderChips(activeCards);

    // ── 카운터 동기화 ──
    ['bc_selected_count_bar', 'bc_selected_count_footer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    });

    clearActionStatuses();
    BroadcastModal.refreshPreview?.();
}

function renderChips(activeCards) {
    const wrap = document.getElementById('bcchipswrap');
    const empty = document.getElementById('bc_chips_empty');
    if (!wrap) return;

    wrap.querySelectorAll('.bc-chip').forEach(c => c.remove());

    if (!activeCards.length) {
        if (empty) empty.style.display = '';
        return;
    }

    if (empty) empty.style.display = 'none';

    activeCards.forEach(card => {
        const name = card.dataset.speakerName || '스피커';
        const key = card.dataset.speakerKey || '';
        const chipTypeClass = getSpeakerTypeToken(card.dataset.type);

        const chip = document.createElement('span');
        chip.className = `bc-chip`;
        chip.innerHTML = `
            ${name}
            <button class="bc-chip-remove" data-key="${key}" aria-label="${name} 선택 해제"
                    style="width:14px;height:14px;display:flex;align-items:center;
                           justify-content:center;border-radius:50%;cursor:pointer;
                           border:none;font-size:11px;line-height:1;padding:0;">×</button>
        `;

        chip.querySelector('.bc-chip-remove').addEventListener('click', () => {
            const targetCard = document.querySelector(
                `#bc_speaker_list .speaker-item[data-speaker-key="${key}"]`
            );
            if (targetCard) {
                targetCard.classList.remove('selected');
                targetCard.setAttribute('aria-selected', 'false');
                bcSelectedSpeakerKeys.delete(key);
                bcSelectedSpeakerIds.delete(card.dataset.speakerId || '');
                syncSelectionUI(); // empty/카운트까지 같이 갱신됨
            }
        });

        wrap.appendChild(chip);
    });
}


/* ---------- API ---------- */
const BroadcastApi = {
    async listSpeakers() {
        const res = await fetch("/api/btype/query/config/list");
        if (!res.ok) return [];
        return (await res.json()) ?? [];
    },

    async listDisasters() {
        const res = await fetch("/api/disaster");
        if (!res.ok) return [];
        return (await res.json()) ?? [];
    },

    async listTts() {
        // Spring Boot API: GET /api/tts?page=0&size=200
        const res = await fetch("/api/tts?page=0&size=200");
        if (!res.ok) return [];
        const data = await res.json().catch(() => null);

        // Page 형태(content) 또는 배열 형태 모두 대응
        const items = Array.isArray(data) ? data : (data?.content ?? []);
        return items ?? [];
    },

    async send(payload) {
        const res = await fetch("/api/btype/command/alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(extractApiErrorMessage(txt, `HTTP ${res.status}`));
        }
        return await res.json().catch(() => ({}));
    },

    async action(payload) {
        const res = await fetch("/api/btype/command/action", {
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
};

/* ==========================================================
* Modal
* ========================================================== */
const BroadcastModal = {
    speakers: [],
    ttsItems: [],

    async loadSpeakers() {
        this.speakers = await BroadcastApi.listSpeakers() ?? [];
        const listEl = document.getElementById('bc_speaker_list');
        if (!listEl) return;

        listEl.innerHTML = '';
        setText('bc_speaker_count', this.speakers.length);

        if (!this.speakers.length) {
            show('bc_empty_speaker');
            return;
        }
        hide('bc_empty_speaker');

        this.speakers.forEach(spk => {
            const speakerKey = spk?.speakerKey ?? '';
            const speakerId = spk?.speakerId ?? '';
            const name = safe(spk.speakerName ?? spk.name ?? speakerKey);
            const location = safe(spk.description ?? spk.location ?? '', '');
            const isOffline = spk.status === 'offline' || spk.connectYn === 'N';
            const type = safe(spk.type, 'A');
            const typeToken = getSpeakerTypeToken(type);

            listEl.insertAdjacentHTML('beforeend', `
            <div class="speaker-item ${isOffline ? 'offline' : ''}"
                 role="option"
                 aria-selected="false"
                 aria-disabled="${isOffline}"
                 data-speaker-key="${String(speakerKey)}"
                 data-speaker-id="${String(speakerId)}"
                 data-speaker-name="${String(name)}"
                 data-type="${type}"
                 tabindex="${isOffline ? -1 : 0}"
                 title="${isOffline ? '오프라인 - 선택 불가' : location}">
                <div class="speaker-cb" aria-hidden="true">
                    <svg width="11" height="11" viewBox="0 0 24 24"
                         fill="none" stroke="white" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div class="speaker-info">
                    <div class="d-flex align-items-center gap-2">
                        <div class="speaker-name">${name}</div>
                    </div>
                    <div class="speaker-loc">${location || speakerId}</div>
                </div>
                <i class="bi bi-chevron-right speaker-arrow" aria-hidden="true"></i>
            </div>
        `);
        });

        bcSelectedSpeakerKeys.clear();
        bcSelectedSpeakerIds.clear();
        syncSelectionUI();
    },



    async loadDisasters() {
        const items = await BroadcastApi.listDisasters();
        const optionsHTML = [`<option value="" selected>재난을 선택하세요</option>`];

        items
            .filter(m => (m.useInfo ?? 1) === 1)
            .forEach((m) => {
                const code = m.dstCode ?? m.code ?? m.id ?? "";
                const name = m.dstName ?? m.name ?? m.title ?? String(code);
                optionsHTML.push(`<option value="${String(code)}">${String(name)} (${String(code)})</option>`);
            });

        getPanelPrefixes().forEach(prefix => {
            const sel = document.getElementById(`${prefix}_disaster`);
            if (!sel) return;
            sel.innerHTML = optionsHTML.join("");
        });
    },

    async loadTtsList() {
        const items = await BroadcastApi.listTts();
        const activeItems = (items ?? [])
            .filter(x => x && x.ttsId != null)
            .filter(x => isUseTtsFlag(x.ttsUseFlag))
            .sort((a, b) => (Number(b.ttsId) || 0) - (Number(a.ttsId) || 0));
        this.ttsItems = activeItems;
        const ttsOptionsHTML = `<option value="">TTS를 선택하세요</option>` +
            activeItems
                .map(x => `<option value="${String(x.ttsId)}">${String(x.ttsName ?? `TTS-${x.ttsId ?? ""}`)}</option>`)
                .join("");

        getPanelPrefixes().forEach(prefix => {
            const wrap = document.getElementById(`${prefix}_tts_wrap`);
            const textarea = document.getElementById(`${prefix}_tts`);
            if (!wrap || !textarea) return;

            let sel = document.getElementById(`${prefix}_tts_list`);
            if (!sel) return;

            // select가 이미 있어도 change 이벤트를 1번은 무조건 바인딩
            if (!sel.dataset.bound) {
                sel.addEventListener("change", () => {
                    const selected = (this.ttsItems ?? []).find(item => String(item.ttsId) === String(sel.value));
                    textarea.value = selected?.ttsMsg ?? "";

                    // (권장) 선택 = TTS 방송으로 UI도 맞춤
                    const typeEl = document.getElementById(`${prefix}_broadcast_type`);
                    const disEl = document.getElementById(`${prefix}_disaster`);
                    if (typeEl) typeEl.value = "1";
                    if (disEl) disEl.value = "";
                    this.syncRadioGroup(`${prefix}_type_radio`, "1");

                    clearActionStatuses();
                    this.applyBroadcastTypeUI();
                    this.refreshPreview();

                    // UX
                    const counter = document.getElementById(`${prefix}_tts_char_count`);
                    if (counter) counter.textContent = textarea.value.length;
                    textarea.focus();
                });
                sel.dataset.bound = "1";
            }

            sel.innerHTML = ttsOptionsHTML;
            sel.disabled = activeItems.length === 0;
        });
    },

    getPayloadForPreview() {
        const prefix = "b_bc_";
        return {
            speakerIds: getSelectedSpeakerIds(),
            mode: document.getElementById(`${prefix}mode`)?.value ?? "1",
            alertType: document.getElementById(`${prefix}alert_type`)?.value ?? "0",
            broadcastType: document.getElementById(`${prefix}broadcast_type`)?.value ?? "1",
            priority: document.getElementById(`${prefix}priority`)?.value ?? "0",
            scope: document.getElementById(`${prefix}scope`)?.value ?? "3",
            disasterCode: document.getElementById(`${prefix}disaster`)?.value ?? "",
            tts: document.getElementById(`${prefix}tts`)?.value ?? ""
        };
    },

    validateBeforeSend(payloadUI) {
        clearValidationErrors();
        clearAllStatuses();

        const selectedIds = [...new Set((payloadUI?.speakerIds ?? []).filter(Boolean))];
        const broadcastType = String(payloadUI?.broadcastType ?? "1");
        const isTTS = broadcastType === "1";
        const disasterCode = normalizeText(payloadUI?.disasterCode);
        const ttsMessage = normalizeText(payloadUI?.tts);
        console.log('🚨 방송 전 TTS 확인:', { ttsMessage, length: ttsMessage.length });
        const prefix = selectedIds.length > 0 ? "b_bc" : null;

        if (selectedIds.length === 0) {
            App.utils.showGlobalAlert("스피커를 먼저 선택해주세요.", "warning");
            return { ok: false };
        }

        if (isTTS && !ttsMessage) {
            if (prefix) setFieldError(`${prefix}_tts`, "TTS 내용을 입력하거나 TTS 프리셋을 선택해주세요.");
            return { ok: false };
        }

        if (!isTTS && !disasterCode) {
            if (prefix) setFieldError(`${prefix}_disaster`, "재난 메시지를 보내려면 재난 코드를 선택해주세요.");
            return { ok: false };
        }

        return {
            ok: true,
            selectedIds,
            payloadUI: {
                ...payloadUI,
                disasterCode: isTTS ? "CFW" : disasterCode,
                tts: isTTS ? ttsMessage : ""
            }
        };
    },

    refreshPreview() {
        const pre = document.getElementById("bc_preview");
        if (!pre) return;
        pre.textContent = JSON.stringify(this.getPayloadForPreview(), null, 2);
    },

    reset() {
        bcSelectedSpeakerKeys.clear();
        bcSelectedSpeakerIds.clear();
        clearValidationErrors();
        clearAllStatuses();

        setText("b_bc_step_text", "스피커를 선택하세요.");
        setVal("bc_selected_speaker_name", "");

        // active 제거
        document.querySelectorAll('#bc_speaker_list .speaker-item.selected')
            .forEach(el => {
                el.classList.remove('selected');
                el.setAttribute('aria-selected', 'false');
            });

        this.resetPanelForms();

        this.refreshPreview();
        this.applyBroadcastTypeUI();
    },

    resetPanelForms() {
        getPanelPrefixes().forEach(prefix => {
            setVal(`${prefix}_mode`, "1");
            setVal(`${prefix}_broadcast_type`, "1");
            setVal(`${prefix}_disaster`, "");
            this.syncRadioGroup(`${prefix}_mode_radio`, "1");
            this.syncRadioGroup(`${prefix}_type_radio`, "1");
            this.clearTtsFields(prefix);
        });

        this.applyBroadcastTypeUI();
    },

    syncRadioGroup(name, value) {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.checked = radio.value === String(value);
        });
    },

    clearTtsFields(prefix) {
        setVal(`${prefix}_tts_list`, "");
        setVal(`${prefix}_tts`, "");
        setFieldError(`${prefix}_tts`, "");
        const counter = document.getElementById(`${prefix}_tts_char_count`);
        if (counter) counter.textContent = "0";
    },

    applyBroadcastTypeUI() {
        getPanelPrefixes().forEach(prefix => {
            const typeEl = document.getElementById(`${prefix}_broadcast_type`);
            const disEl = document.getElementById(`${prefix}_disaster`);
            const disCard = disEl?.closest(".m-card");
            const wrap = document.getElementById(`${prefix}_tts_wrap`);
            const tts = document.getElementById(`${prefix}_tts`);
            const ttsSel = document.getElementById(`${prefix}_tts_list`);
            const type = typeEl?.value ?? "1";

            const disaster = disEl?.value ?? "";
            const hasDisaster = !!String(disaster).trim();

            const isTtsOnly = type === "1";
            const isStoredMessage = type === "2";
            const isEtc = type === "3";
            const canUseTts = (isTtsOnly && !hasDisaster) || isEtc;
            const canUseDisaster = !isTtsOnly;
            const shouldClearTts = !canUseTts && (isStoredMessage || hasDisaster);

            if (wrap) wrap.classList.toggle("tts-locked", !canUseTts);
            if (disCard) disCard.classList.toggle("disaster-locked", !canUseDisaster);

            if (disEl) disEl.disabled = !canUseDisaster;
            if (tts) tts.disabled = !canUseTts;
            if (ttsSel) ttsSel.disabled = !canUseTts;
            if (shouldClearTts) this.clearTtsFields(prefix);
            if (canUseTts) setFieldError(`${prefix}_disaster`, "");
        });
    },

    buildServerPayload(deviceIds, ui = this.getPayloadForPreview()) {

        const normalizedIds = Array.isArray(deviceIds)
            ? [...new Set(deviceIds.map(id => String(id ?? "").trim()).filter(Boolean))]
            : [String(deviceIds ?? "").trim()].filter(Boolean);

        // 서버가 요구하는 키로 변환
        // 기존 단건 전송:
        // return {
        //     deviceId: String(deviceId),
        //     alertMode: String(ui.mode ?? ""),
        //     alertKind: String(ui.broadcastType ?? ""),
        //     alertRange: String(ui.scope ?? ""),
        //     alertPriority: String(ui.priority ?? ""),
        //     disasterCode: String(ui.disasterCode ?? ""),
        //     ttsMessage: String(ui.tts ?? "")
        // };
        return {
            // 단건 호환 필드도 함께 유지
            deviceId: normalizedIds[0] ?? "",
            deviceIds: normalizedIds,
            alertMode: String(ui.mode ?? ""),
            alertKind: String(ui.broadcastType ?? ""),
            alertRange: String(ui.scope ?? ""),
            alertPriority: String(ui.priority ?? ""),
            disasterCode: String(ui.disasterCode ?? ""),
            ttsMessage: String(ui.tts ?? "")
        };
    },

    getActivePanelPrefix() {
        return "b_bc";
    },

    validateSelection() {
        const selectedIds = [...new Set(getSelectedSpeakerIds().filter(Boolean))];
        if (selectedIds.length === 0) {
            showHintMessage("스피커를 먼저 선택해주세요.");
            return { ok: false };
        }

        return { ok: true, selectedIds };
    },

    async runBgmAction(action, btn) {
        const validation = this.validateSelection();
        if (!validation.ok) return;

        const { selectedIds } = validation;
        const activePrefix = this.getActivePanelPrefix();
        const actionLabel = action === "bgmOn" ? "BGM ON" : "BGM OFF";

        clearAllStatuses();
        setActionStatus(activePrefix, "bgm", "");
        setSendButtonState(btn, true, selectedIds.length);

        const password = promptSpeakerPassword("비밀번호를 입력하세요.");
        if (password === null) {
            setSendButtonState(btn, false);
            return;
        }

        try {
            await BroadcastApi.action({
                speakerIds: selectedIds,
                action,
                password
            });
            setActionStatus(activePrefix, "bgm", `${actionLabel} 실행 완료 (${selectedIds.length}대)`, "success");
        } catch (err) {
            console.error(err);
            setActionStatus(activePrefix, "bgm", err?.message || `${actionLabel} 실행 실패`, "danger");
        } finally {
            setSendButtonState(btn, false);
        }
    },

    init() {
        const modalEl = document.getElementById("speaker_broadcast_modal");
        if (!modalEl) return;

        modalEl.addEventListener("shown.bs.modal", async () => {
            this.reset();
            try {
                await this.loadSpeakers();
                await this.loadDisasters();
                await this.loadTtsList();
            } catch (err) {
                console.error("방송 모달 초기화 실패:", err);
                showInlineStatus("방송 설정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.", "danger");
            }
            this.applyBroadcastTypeUI();
            this.refreshPreview();
        });

        modalEl.addEventListener("hidden.bs.modal", () => this.reset());

        // 스피커 갱신
        modalEl.addEventListener("click", async (e) => {
            if (!e.target.closest("#bc_refresh_speaker")) return;
            try {
                await this.loadSpeakers();
                showInlineStatus("스피커 목록을 새로고침했습니다.", "success");
                clearActionStatuses();
            } catch (err) {
                console.error("스피커 목록 새로고침 실패:", err);
                showInlineStatus("스피커 목록을 불러오지 못했습니다.", "danger");
            }
        });

        // speaker-card 개별 토글(다중 선택)
        modalEl.addEventListener('click', e => {
            const card = e.target.closest('#bc_speaker_list .speaker-item:not(.offline)');
            if (!card) return;
            const speakerKey = String(card.dataset.speakerKey ?? '');
            const speakerId = String(card.dataset.speakerId ?? '');
            const speakerType = String(card.dataset.type ?? 'A').toUpperCase();
            if (!speakerKey) return;

            const willSelect = !card.classList.contains('selected');

            if (willSelect) {
                // 타입 제한 없음 - 모든 타입 함께 선택 가능
            }

            card.classList.toggle('selected', willSelect);
            card.setAttribute('aria-selected', String(willSelect));

            if (willSelect) {
                bcSelectedSpeakerKeys.add(speakerKey);
                if (speakerId) bcSelectedSpeakerIds.add(speakerId);
            } else {
                bcSelectedSpeakerKeys.delete(speakerKey);
                if (speakerId) bcSelectedSpeakerIds.delete(speakerId);
            }
            syncSelectionUI();
        });

        modalEl.addEventListener("change", (e) => {
            const id = e.target?.id || "";
            if (id === "b_bc_disaster") {
                setFieldError(id, "");
                clearAllStatuses();
            }
            // Check if the id ends with one of the target suffixes
            if (![
                "mode", "alert_type", "broadcast_type",
                "priority", "scope", "disaster"
            ].some(suffix => id.endsWith(suffix))) return;

            const prefix = id.startsWith("b_bc_") ? "b_bc" : "";
            if (!prefix) return;

            const typeEl = document.getElementById(`${prefix}_broadcast_type`);
            const disEl = document.getElementById(`${prefix}_disaster`);

            // 1) 재난 선택 시: 저장메시지(2) 강제
            if (id.endsWith("disaster")) {
                const disVal = disEl?.value ?? "";
                if (String(disVal).trim()) {
                    if ((typeEl?.value ?? "1") !== "3") {
                        if (typeEl) typeEl.value = "2"; // 저장메시지
                        this.syncRadioGroup(`${prefix}_type_radio`, "2");
                        this.clearTtsFields(prefix);
                    }
                }
                clearAllStatuses();
                this.applyBroadcastTypeUI();
                this.refreshPreview();
                return;
            }

            // 2) 방송종류 변경 시: TTS(1)면 재난 선택 해제 + TTS 표시
            if (id.endsWith("broadcast_type")) {
                const typeVal = typeEl?.value ?? "1";
                this.syncRadioGroup(`${prefix}_type_radio`, typeVal);

                if (typeVal === "1") {
                    // TTS 선택 → 재난 해제
                    if (disEl) disEl.value = "";
                    setFieldError(`${prefix}_disaster`, "");
                } else if (typeVal === "2") {
                    this.clearTtsFields(prefix);
                }

                clearAllStatuses();
                this.applyBroadcastTypeUI();
                this.refreshPreview();
                return;
            }

            // 그 외 항목 변경: 미리보기만 갱신
            clearAllStatuses();
            this.refreshPreview();
        });

        modalEl.addEventListener("input", (e) => {
            if (e.target?.id === "b_bc_tts") {
                setFieldError(e.target.id, "");
                clearAllStatuses();
                this.refreshPreview();
            }
        });

        modalEl.addEventListener("click", async (e) => {
            const btn = e.target.closest("#b_bc_send");
            if (!btn) return;

            // 1. 스피커 선택 여부 먼저 확인
            const selectedCards = getActiveCards();
            if (selectedCards.length === 0) {
                if (window.iziToast) {
                    window.iziToast.warning({
                        message: '스피커를 먼저 선택해주세요.',
                        position: 'topRight',
                        timeout: 3000,
                        progressBar: true
                    });
                } else {
                    App.utils.showGlobalAlert("스피커를 먼저 선택해주세요.", "warning");
                }
                return;
            }

            // 2. 선택된 스피커 이름/개수 확인
            const selectedNames = selectedCards
                .map(card =>
                    card.dataset.speakerName ||
                    card.querySelector(".speaker-name")?.textContent?.trim() ||
                    "스피커"
                )
                .filter(Boolean);

            // const confirmMessage = selectedNames.length === 1
            //     ? `[${selectedNames[0]}] 스피커로 발령을 전송할까요?`
            //     : `선택한 ${selectedNames.length}개 스피커로 발령을 전송할까요?`;

            // if (!window.confirm(confirmMessage)) {
            //     return;
            // }

            // 3. 기존 검증 로직 유지
            const validation = this.validateBeforeSend(this.getPayloadForPreview());
            if (!validation.ok) {
                return;
            }

            const { payloadUI, selectedIds } = validation;
            const activePrefix = "b_bc";

            clearAllStatuses();
            // setActionStatus(activePrefix, "broadcast", "");
            setSendButtonState(btn, true, selectedIds.length);

            const password = promptSpeakerPassword("비밀번호를 입력하세요.");
            if (password === null) {
                setSendButtonState(btn, false);
                return;
            }

            try {
                const serverPayload = this.buildServerPayload(selectedIds, payloadUI);
                serverPayload.password = password;

                console.log("[BC SEND]", serverPayload);
                await BroadcastApi.send(serverPayload);
                App.utils.showGlobalAlert("발령 전송 완료", "success");

                // setActionStatus(
                //     activePrefix,
                //     "broadcast",
                //     `발령 전송 완료 (${selectedIds.length}대)`,
                //     "success"
                // );
            } catch (err) {
                console.error(err);
                App.utils.showGlobalAlert(err?.message || "발령 전송 실패", "danger");
                // setActionStatus(activePrefix, "broadcast", "발령 전송 실패", "danger");
            } finally {
                setSendButtonState(btn, false);
            }
        });

        modalEl.addEventListener("click", async (e) => {
            const btn = e.target.closest("#b_bc_bgm_on, #b_bc_bgm_off");
            if (!btn) return;

            const action = btn.id.endsWith("bgm_on") ? "bgmOn" : "bgmOff";
            await this.runBgmAction(action, btn);
        });

        getPanelPrefixes().forEach(prefix => {
            document.querySelectorAll(`input[name="${prefix}_mode_radio"]`).forEach(radio => {
                radio.addEventListener("change", () => {
                    setVal(`${prefix}_mode`, radio.value);
                    this.refreshPreview();
                });
            });

            document.querySelectorAll(`input[name="${prefix}_type_radio"]`).forEach(radio => {
                radio.addEventListener("change", () => {
                    setVal(`${prefix}_broadcast_type`, radio.value);
                    document.getElementById(`${prefix}_broadcast_type`)
                        ?.dispatchEvent(new Event("change", { bubbles: true }));
                });
            });
        });

    }
};


document.addEventListener("DOMContentLoaded", () => {
    BroadcastModal.init();
});
