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
function getPanelPrefixes() { return ["a_bc", "b_bc"]; }
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

function notify(msg, type = "warning") {
    try {
        if (window.App?.utils?.showGlobalAlert) return window.App.utils.showGlobalAlert(msg, type);
    } catch (_) { }
    alert(msg);
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

    const areaEmpty = document.getElementById('bc_area_empty');
    const areaA = document.getElementById('bc_area_type_a');
    const areaB = document.getElementById('bc_area_type_b');

    // ── 기존 hint / steptext / selectedspeakername 처리 ──
    if (count === 0) {
        BroadcastModal.resetPanelForms?.();
        setVal('bc_selected_speaker_name', '');
        setText('bc_hint', '스피커를 선택해주세요.');
        setText('a_bc_step_text', '스피커를 선택하세요.');
        setText('b_bc_step_text', '스피커를 선택하세요.');

        if (areaEmpty) areaEmpty.classList.remove('d-none');
        if (areaA) areaA.classList.add('d-none');
        if (areaB) areaB.classList.add('d-none');
    } else {
        const oneName = activeCards[0].dataset?.speakerName
            || activeCards[0].querySelector('.speaker-name')?.textContent?.trim();

        if (count === 1) {
            setVal('bc_selected_speaker_name', oneName);
            setText('bc_hint', `${getSpeakerTypeLabel(activeCards[0].dataset.type)} · ${oneName} 선택됨.`);
            setText('a_bc_step_text', `${oneName} 선택됨.`);
            setText('b_bc_step_text', `${oneName} 선택됨.`);
        } else {
            setVal('bc_selected_speaker_name', count);
            setText('bc_hint', `${getSpeakerTypeLabel(activeCards[0].dataset.type)} · ${count}개 스피커 선택됨.`);
            setText('a_bc_step_text', `${count}개 스피커 선택됨.`);
            setText('b_bc_step_text', `${count}개 스피커 선택됨.`);
        }

        if (areaEmpty) areaEmpty.classList.add('d-none');

        // 타입에 따른 패널 전환 로직 (첫 번째 선택된 스피커 타입 기준)
        const firstType = activeCards[0].dataset.type;
        if (firstType && firstType.toUpperCase().includes('B')) {
            if (areaA) areaA.classList.add('d-none');
            if (areaB) areaB.classList.remove('d-none');
        } else {
            if (areaB) areaB.classList.add('d-none');
            if (areaA) areaA.classList.remove('d-none');
        }
    }

    // ── 선택 칩 렌더링 ──
    renderChips(activeCards);

    // ── 카운터 동기화 ──
    ['bc_selected_count_bar', 'bc_selected_count_footer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    });

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
        chip.className = `bc-chip ${chipTypeClass}`;
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
            throw new Error(`HTTP ${res.status} ${txt}`);
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
            <div class="speaker-item ${typeToken} ${isOffline ? 'offline' : ''}"
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
                    <div class="speaker-name">${name}</div>
                    <div class="speaker-loc">${location || speakerId}</div>
                </div>
                <div class="status-dot"
                     title="${isOffline ? '오프라인' : '온라인'}"></div>
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

            // ✅ 핵심: select가 이미 있어도 change 이벤트를 1번은 무조건 바인딩
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
        // 타입에 맞춰 올바른 폼 요소를 읽어오도록 수정
        const activeCards = getActiveCards();
        const prefix = activeCards.length > 0 && activeCards[0].dataset.type && activeCards[0].dataset.type.toUpperCase().includes('B') ? 'b_bc_' : 'a_bc_';

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

    refreshPreview() {
        const pre = document.getElementById("bc_preview");
        if (!pre) return;
        pre.textContent = JSON.stringify(this.getPayloadForPreview(), null, 2);
    },

    reset() {
        bcSelectedSpeakerKeys.clear();
        bcSelectedSpeakerIds.clear();

        setText("bc_hint", "선택 후 같은 타입만 함께 선택됩니다.");
        setText("a_bc_step_text", "스피커를 선택하세요.");
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
        const counter = document.getElementById(`${prefix}_tts_char_count`);
        if (counter) counter.textContent = "0";
    },

    applyBroadcastTypeUI() {
        getPanelPrefixes().forEach(prefix => {
            const typeEl = document.getElementById(`${prefix}_broadcast_type`);
            const disEl = document.getElementById(`${prefix}_disaster`);
            const wrap = document.getElementById(`${prefix}_tts_wrap`);
            const tts = document.getElementById(`${prefix}_tts`);
            const ttsSel = document.getElementById(`${prefix}_tts_list`);
            const type = typeEl?.value ?? "1";

            const disaster = disEl?.value ?? "";
            const hasDisaster = !!String(disaster).trim();

            const canUseTts = type === "1" && !hasDisaster;
            const shouldClearTts = !canUseTts && (type === "2" || hasDisaster);

            if (wrap) wrap.classList.toggle("tts-locked", !canUseTts);

            if (tts) tts.disabled = !canUseTts;
            if (ttsSel) ttsSel.disabled = !canUseTts;
            if (shouldClearTts) this.clearTtsFields(prefix);
        });
    },

    buildServerPayload(deviceId) {
        const ui = this.getPayloadForPreview();

        // 서버가 요구하는 키로 변환
        return {
            deviceId: String(deviceId),
            alertMode: String(ui.mode ?? ""),
            alertKind: String(ui.broadcastType ?? ""),
            alertRange: String(ui.scope ?? ""),
            alertPriority: String(ui.priority ?? ""),
            disasterCode: String(ui.disasterCode ?? ""),
            ttsMessage: String(ui.tts ?? "")
        };
    },

    init() {
        const modalEl = document.getElementById("speaker_broadcast_modal");
        if (!modalEl) return;

        modalEl.addEventListener("shown.bs.modal", async () => {
            this.reset();
            await this.loadSpeakers();
            await this.loadDisasters();
            await this.loadTtsList();
            this.applyBroadcastTypeUI();
            this.refreshPreview();
        });

        modalEl.addEventListener("hidden.bs.modal", () => this.reset());

        // 스피커 갱신
        modalEl.addEventListener("click", async (e) => {
            if (!e.target.closest("#bc_refresh_speaker")) return;
            await this.loadSpeakers();
            notify("스피커 목록을 새로고침했습니다.", "success");
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

            // 다른 타입 스피커 선택 방지 로직
            if (willSelect) {
                const activeCards = getActiveCards();
                if (activeCards.length > 0) {
                    const firstSelectedType = String(activeCards[0].dataset.type ?? 'A').toUpperCase();

                    // 'B' 타입 여부로 비교 (A vs B 등, 타입이 다를 경우)
                    const isFirstTypeB = firstSelectedType.includes('B');
                    const isCurrentTypeB = speakerType.includes('B');

                    if (isFirstTypeB !== isCurrentTypeB) {
                        notify(`[${firstSelectedType}] 타입 스피커가 이미 선택되어 있습니다. 동일 타입의 스피커만 선택할 수 있습니다.`, "warning");
                        return;
                    }
                }
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
            // Check if the id ends with one of the target suffixes
            if (![
                "mode", "alert_type", "broadcast_type",
                "priority", "scope", "disaster"
            ].some(suffix => id.endsWith(suffix))) return;

            const prefix = id.startsWith("a_bc_") ? "a_bc_" : (id.startsWith("b_bc_") ? "b_bc_" : "");
            if (!prefix) return;

            const typeEl = document.getElementById(`${prefix}broadcast_type`);
            const disEl = document.getElementById(`${prefix}disaster`);

            // 1) 재난 선택 시: 저장메시지(2) 강제
            if (id.endsWith("disaster")) {
                const disVal = disEl?.value ?? "";
                if (String(disVal).trim()) {
                    if (typeEl) typeEl.value = "2"; // 저장메시지
                    this.syncRadioGroup(`${prefix}type_radio`, "2");
                    this.clearTtsFields(prefix);
                }
                this.applyBroadcastTypeUI();
                this.refreshPreview();
                return;
            }

            // 2) 방송종류 변경 시: TTS(1)면 재난 선택 해제 + TTS 표시
            if (id.endsWith("broadcast_type")) {
                const typeVal = typeEl?.value ?? "1";
                this.syncRadioGroup(`${prefix}type_radio`, typeVal);

                if (typeVal === "1") {
                    // TTS 선택 → 재난 해제
                    if (disEl) disEl.value = "";
                } else if (typeVal === "2") {
                    this.clearTtsFields(prefix);
                }

                this.applyBroadcastTypeUI();
                this.refreshPreview();
                return;
            }

            // 그 외 항목 변경: 미리보기만 갱신
            this.refreshPreview();
        });

        modalEl.addEventListener("input", (e) => {
            if (e.target?.id === "a_bc_tts" || e.target?.id === "b_bc_tts") this.refreshPreview();
        });

        modalEl.addEventListener("click", async (e) => {
            const btn = e.target.closest("#a_bc_send, #b_bc_send");
            if (!btn) return;

            const payloadUI = this.getPayloadForPreview();
            const selectedIds = [...new Set(payloadUI.speakerIds)]; // 중복 제거
            const isTTS = (payloadUI.broadcastType === "1");

            if (selectedIds.length === 0) {
                notify("스피커를 먼저 선택해주세요.", "warning");
                return;
            }

            if (isTTS) {
                payloadUI.disasterCode = "CFW";
            }

            if (!isTTS && !payloadUI.disasterCode) {
                notify("재난 코드를 선택해주세요.", "warning");
                return;
            }

            btn.disabled = true;
            try {
                for (const id of selectedIds) {
                    const serverPayload = this.buildServerPayload(id);

                    console.log("[BC SEND]", serverPayload);
                    await BroadcastApi.send(serverPayload); // ✅ 개별 전송 + await
                }

                notify(`발령 전송 완료 (${selectedIds.length}대)`, "success");
            } catch (err) {
                console.error(err);
                notify(`발령 전송 실패`, "danger");
            } finally {
                btn.disabled = false;
            }
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

