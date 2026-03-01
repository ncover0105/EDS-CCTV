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

function showTab(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (typeof bootstrap === "undefined" || !bootstrap.Tab) return;
    bootstrap.Tab.getOrCreateInstance(btn).show();
}

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

    // ── 기존 hint / steptext / selectedspeakername 처리 ──
    if (count === 0) {
        setVal('bcselectedspeakername', '');
        setText('bchint', '스피커를 선택해주세요.');
        setText('bcsteptext', '스피커를 선택하세요.');
    } else if (count === 1) {
        const oneName = activeCards[0].dataset?.speakerName
            || activeCards[0].querySelector('.speaker-name')?.textContent?.trim();
        setVal('bcselectedspeakername', oneName);
        setText('bchint', `${oneName} 선택됨.`);
        setText('bcsteptext', `${oneName} 선택됨.`);
    } else {
        setVal('bcselectedspeakername', count);
        setText('bchint', `${count}개 스피커 선택됨.`);
        setText('bcsteptext', `${count}개 스피커 선택됨.`);
    }

    // ── 전체선택 버튼 텍스트 ──
    const toggleBtn = document.getElementById('bctoggleall');
    const total = document.querySelectorAll('#bcspeakerlist .speaker-item').length;
    if (toggleBtn) {
        const allSelected = total > 0 && count === total;
        toggleBtn.querySelector('i').className = allSelected
            ? 'bi bi-x-square'
            : 'bi bi-check2-all';
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

        const chip = document.createElement('span');
        chip.className = 'bc-chip';
        chip.innerHTML = `
            ${name}
            <button class="bc-chip-remove" data-key="${key}" aria-label="${name} 선택 해제"
                    style="width:14px;height:14px;display:flex;align-items:center;
                           justify-content:center;border-radius:50%;cursor:pointer;
                           background:rgba(59,110,246,.2);border:none;
                           font-size:11px;color:var(--m-primary);line-height:1;
                           padding:0;">×</button>
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

            listEl.insertAdjacentHTML('beforeend', `
            <div class="speaker-item ${isOffline ? 'offline' : ''}"
                 role="option"
                 aria-selected="false"
                 aria-disabled="${isOffline}"
                 data-speaker-key="${String(speakerKey)}"
                 data-speaker-id="${String(speakerId)}"
                 data-speaker-name="${String(name)}"
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
            </div>
        `);
        });

        bcSelectedSpeakerKeys.clear();
        bcSelectedSpeakerIds.clear();
        syncSelectionUI();
    },



    async loadDisasters() {
        const sel = document.getElementById("bc_disaster");
        if (!sel) return;

        const items = await BroadcastApi.listDisasters();
        sel.innerHTML = `<option value="" selected>재난을 선택하세요</option>`;

        items
            .filter(m => (m.useInfo ?? 1) === 1)
            .forEach((m) => {
                const code = m.dstCode ?? m.code ?? m.id ?? "";
                const name = m.dstName ?? m.name ?? m.title ?? String(code);

                const opt = document.createElement("option");
                opt.value = String(code);
                opt.textContent = `${name} (${code})`;
                sel.appendChild(opt);
            });
    },

    async loadTtsList() {
        const wrap = document.getElementById("bc_tts_wrap");
        const textarea = document.getElementById("bc_tts");
        if (!wrap || !textarea) return;

        let sel = document.getElementById("bc_tts_list");
        if (!sel) {
            sel = document.createElement("select");
            sel.id = "bc_tts_list";
            sel.className = "form-select-dark mb-2";
            textarea.insertAdjacentElement("beforebegin", sel);
        }

        // ✅ 핵심: select가 이미 있어도 change 이벤트를 1번은 무조건 바인딩
        if (!sel.dataset.bound) {
            sel.addEventListener("change", () => {
                const msg = sel.value || "";
                textarea.value = msg;            // ✅ 여기서 textarea 채움

                // (권장) 선택 = TTS 방송으로 UI도 맞춤
                const typeEl = document.getElementById("bc_broadcast_type");
                const disEl = document.getElementById("bc_disaster");
                if (typeEl) typeEl.value = "1";
                if (disEl) disEl.value = "";

                this.applyBroadcastTypeUI();
                this.refreshPreview();

                // UX
                textarea.focus();
            });
            sel.dataset.bound = "1";
        }

        const items = await BroadcastApi.listTts();

        sel.innerHTML = `<option value="">TTS를 선택하세요</option>`;
        items
            .filter(x => (x.ttsUseFlag ?? "Use") === "Use")
            .forEach(x => {
                const opt = document.createElement("option");
                opt.value = String(x.ttsMsg ?? "");
                opt.textContent = String(x.ttsName ?? `TTS-${x.ttsId ?? ""}`);
                sel.appendChild(opt);
            });

        sel.disabled = (sel.options.length <= 1);
    },

    getPayloadForPreview() {
        return {
            speakerIds: getSelectedSpeakerIds(),
            mode: document.getElementById("bc_mode")?.value ?? "1",
            alertType: document.getElementById("bc_alert_type")?.value ?? "0",
            broadcastType: document.getElementById("bc_broadcast_type")?.value ?? "1",
            priority: document.getElementById("bc_priority")?.value ?? "0",
            scope: document.getElementById("bc_scope")?.value ?? "3",
            disasterCode: document.getElementById("bc_disaster")?.value ?? "",
            tts: document.getElementById("bc_tts")?.value ?? ""
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

        setText("bc_hint", "스피커 선택 후 설정 정보를 조회하면 발령 단계로 진행됩니다.");
        setText("bc_step_text", "스피커를 선택하세요.");
        setVal("bc_selected_speaker_name", "");

        // active 제거
        document.querySelectorAll('#bcspeakerlist .speaker-item.selected')
            .forEach(el => {
                el.classList.remove('selected');
                el.setAttribute('aria-selected', 'false');
            });

        this.refreshPreview();
        this.applyBroadcastTypeUI();
    },

    applyBroadcastTypeUI() {
        const typeEl = document.getElementById("bc_broadcast_type");
        const disEl = document.getElementById("bc_disaster");
        const wrap = document.getElementById("bc_tts_wrap");
        const tts = document.getElementById("bc_tts");
        const ttsSel = document.getElementById("bc_tts_list");

        const type = typeEl?.value ?? "1";
        const disaster = disEl?.value ?? "";
        const hasDisaster = !!String(disaster).trim();

        const canUseTts = (type === "1") && !hasDisaster;

        if (wrap) wrap.classList.toggle("tts-locked", !canUseTts);

        if (tts) tts.disabled = !canUseTts;
        if (ttsSel) ttsSel.disabled = !canUseTts;
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
            notify("스피커 리스트를 갱신했습니다.", "success");
        });

        // 전체 선택/해제 토글
        modalEl.addEventListener('click', e => {
            if (!e.target.closest('#bc_toggle_all')) return;
            const cards = [...document.querySelectorAll('#bc_speaker_list .speaker-item:not(.offline)')];
            if (!cards.length) return;
            const allSelected = cards.every(c => c.classList.contains('selected'));
            if (allSelected) {
                cards.forEach(c => {
                    c.classList.remove('selected');
                    c.setAttribute('aria-selected', 'false');
                });
                bcSelectedSpeakerKeys.clear();
                bcSelectedSpeakerIds.clear();
            } else {
                cards.forEach(c => {
                    c.classList.add('selected');
                    c.setAttribute('aria-selected', 'true');
                    const k = String(c.dataset.speakerKey ?? '');
                    const d = String(c.dataset.speakerId ?? '');
                    if (k) bcSelectedSpeakerKeys.add(k);
                    if (d) bcSelectedSpeakerIds.add(d);
                });
            }
            syncSelectionUI();
        });

        // speaker-card 개별 토글(다중 선택)
        modalEl.addEventListener('click', e => {
            const card = e.target.closest('#bc_speaker_list .speaker-item:not(.offline)');
            if (!card) return;
            const speakerKey = String(card.dataset.speakerKey ?? '');
            const speakerId = String(card.dataset.speakerId ?? '');
            if (!speakerKey) return;

            const willSelect = !card.classList.contains('selected');
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
            const id = e.target?.id;
            if (![
                "bc_mode", "bc_alert_type", "bc_broadcast_type",
                "bc_priority", "bc_scope", "bc_disaster"
            ].includes(id)) return;

            const typeEl = document.getElementById("bc_broadcast_type");
            const disEl = document.getElementById("bc_disaster");

            // 1) 재난 선택 시: 저장메시지(2) 강제
            if (id === "bc_disaster") {
                const disVal = disEl?.value ?? "";
                if (String(disVal).trim()) {
                    if (typeEl) typeEl.value = "2"; // 저장메시지
                }
                this.applyBroadcastTypeUI();
                this.refreshPreview();
                return;
            }

            // 2) 방송종류 변경 시: TTS(1)면 재난 선택 해제 + TTS 표시
            if (id === "bc_broadcast_type") {
                const typeVal = typeEl?.value ?? "1";

                if (typeVal === "1") {
                    // TTS 선택 → 재난 해제
                    if (disEl) disEl.value = "";
                }

                this.applyBroadcastTypeUI();
                this.refreshPreview();
                return;
            }

            // 그 외 항목 변경: 미리보기만 갱신
            this.refreshPreview();
        });

        modalEl.addEventListener("input", (e) => {
            if (e.target?.id === "bc_tts") this.refreshPreview();
        });

        modalEl.addEventListener("click", async (e) => {
            const btn = e.target.closest("#bc_send");
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

        document.getElementById("bc_open_tts_manage")?.addEventListener("click", () => {
            // 1) 발령 모달 닫기
            const bcEl = document.getElementById("broadcast_modal"); // ✅ 발령 모달 id로 바꾸세요
            if (bcEl) bootstrap.Modal.getOrCreateInstance(bcEl).hide();

            // 2) TTS 관리 모달 열기
            const ttsEl = document.getElementById("tts_manage_modal");
            if (!ttsEl) return;

            const ttsModal = bootstrap.Modal.getOrCreateInstance(ttsEl);
            ttsModal.show();

            ttsEl.addEventListener("shown.bs.modal", () => {
                window.TtsManageModal?.loadList?.();
            }, { once: true });
        });

    }
};

// BGM 토글 → 볼륨 슬라이더 표시
const bcBgmCheck = document.getElementById('bcbgmcheck');
const bcVolumeRow = document.getElementById('bcvolumerow');
const bcBgmVolume = document.getElementById('bcbgmvolume');
const bcVolDisplay = document.getElementById('bcvoldisplay');

if (bcBgmCheck) {
    bcBgmCheck.addEventListener('change', () => {
        bcVolumeRow?.classList.toggle('d-none', !bcBgmCheck.checked);
        // 기존 ON/OFF 버튼 트리거 (JS 호환)
        document.getElementById(bcBgmCheck.checked ? 'bcbgmon' : 'bcbgmoff')?.click();
    });
}
if (bcBgmVolume) {
    bcBgmVolume.addEventListener('input', () => {
        if (bcVolDisplay) bcVolDisplay.textContent = bcBgmVolume.value;
        const pct = bcBgmVolume.value + '%';
        bcBgmVolume.style.background =
            `linear-gradient(90deg, var(--m-primary) ${pct}, var(--m-border) ${pct})`;
    });
    // 초기 색상
    bcBgmVolume.style.background = 'linear-gradient(90deg, var(--m-primary) 50%, #e4e7ef 50%)';
}

// 방송 모드 라디오 → bcmode select + 액센트 동기화
document.querySelectorAll('input[name="bc_mode_radio"]').forEach(r => {
    r.addEventListener('change', () => {
        const bcModeSelect = document.getElementById('bc_mode');
        if (bcModeSelect) bcModeSelect.value = r.value;
        BroadcastModal._onModeChange();
    });
});

// 방송 유형 라디오 → bcbroadcasttype select 동기화
document.querySelectorAll('input[name="bcTypeRadio"]').forEach(r => {
    r.addEventListener('change', () => {
        const bcTypeSelect = document.getElementById('bcbroadcasttype');
        if (bcTypeSelect) {
            bcTypeSelect.value = r.value;
            bcTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
});

// TTS 글자수 카운터
document.getElementById('bctts')?.addEventListener('input', function () {
    const counter = document.getElementById('bcTtsCharCount');
    if (counter) counter.textContent = this.value.length;
});


document.addEventListener("DOMContentLoaded", () => {
    BroadcastModal.init();

    // 모드 변경 시 액센트/배지 UI 갱신
    BroadcastModal._onModeChange = function () {
        const isTest = document.getElementById('bc_mode')?.value === '0';

        // 액센트 바
        document.getElementById('bc_mode_accent')
            ?.classList.toggle('test', isTest);

        // 배지
        const badge = document.getElementById('bc_mode_badge');
        if (badge) badge.className = 'mode-badge' + (isTest ? ' test' : '');

        const badgeText = document.getElementById('bc_mode_badge_text');
        if (badgeText) badgeText.textContent = isTest ? '시험 방송' : '실제 방송';

        // 모달 루트
        document.getElementById('speaker_broadcast_modal')
            ?.classList.toggle('test-mode', isTest);

        // 발령 버튼
        const sendBtn = document.getElementById('bc_send');
        if (sendBtn) {
            sendBtn.classList.toggle('test-mode', isTest);
        }

        BroadcastModal.refreshPreview?.();
    };

    // syncSelectionUI 후 새 카운터도 동기화
    const _origSync = BroadcastModal.syncSelectionUI?.bind(BroadcastModal);
    if (_origSync) {
        BroadcastModal.syncSelectionUI = function () {
            _origSync();
            const count = document.querySelectorAll('#bc_speaker_list .speaker-item.selected').length;
            ['bc_selected_count_bar', 'bc_selected_count_footer'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = count;
            });
        };
    }

    // BGM 슬라이더 초기 색상
    const slider = document.getElementById('bcbgmvolume');
    if (slider) {
        slider.style.background = 'linear-gradient(90deg,var(--m-primary) 50%,var(--m-border) 50%)';
    }
});

