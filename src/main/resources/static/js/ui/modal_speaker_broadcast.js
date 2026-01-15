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
    } catch (_) {}
    alert(msg);
}

/* ---------- Selection State (multi) ---------- */
const bcSelectedSpeakerKeys = new Set();  // data-speaker-key
const bcSelectedSpeakerIds = new Set();    // data-device-id

function getActiveCards() {
    return [...document.querySelectorAll("#bc_speaker_list .speaker-card.active")];
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

    if (count === 0) {
        setVal("bc_selected_speaker_name", "");
        setText("bc_hint", "스피커 선택 후 설정 정보를 조회하면 발령 단계로 진행됩니다.");
        setText("bc_step_text", "스피커를 선택하세요.");
    } else if (count === 1) {
    const oneName =
        activeCards[0].dataset?.speakerName ||
        activeCards[0].querySelector(".fw-semibold")?.textContent?.trim() ||
        "선택됨";
        setVal("bc_selected_speaker_name", oneName);
        setText("bc_hint", "발령 설정을 진행할 수 있습니다.");
        setText("bc_step_text", "발령 설정을 진행하세요.");
    } else {
        setVal("bc_selected_speaker_name", `${count}개 선택됨`);
        setText("bc_hint", "발령 설정을 진행할 수 있습니다.");
        setText("bc_step_text", "발령 설정을 진행하세요.");
    }

    // 발령 설정 버튼 활성/비활성
    // const goBtn = document.getElementById("bc_go_manual");
    // if (goBtn) goBtn.disabled = (count === 0);

    // 전체 선택/해제 버튼 텍스트
    const toggleBtn = document.getElementById("bc_toggle_all");
    const total = document.querySelectorAll("#bc_speaker_list .speaker-card").length;
    if (toggleBtn) {
        const allSelected = total > 0 && count === total;
        toggleBtn.textContent = allSelected ? "전체 해제" : "전체 선택";
    }

    BroadcastModal.refreshPreview();
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

    async send(payload) {
        const res = await fetch("/api/btype/broadcast/send", {
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
    this.speakers = await BroadcastApi.listSpeakers();

    const listEl = document.getElementById("bc_speaker_list");
    if (!listEl) return;

    listEl.innerHTML = "";
    setText("bc_speaker_count", `${this.speakers.length} 개`);

    if (!this.speakers.length) {
        show("bc_empty_speaker");
        return;
    }
    hide("bc_empty_speaker");

    this.speakers.forEach((spk) => {
        const speakerKey = spk?.speakerKey ?? "";
        const speakerId = spk?.speakerId ?? "";
        const name = safe(spk.speakerName ?? spk.name ?? speakerKey);
        const desc = safe(spk.description, "");

        listEl.insertAdjacentHTML("beforeend", `
        <div class="speaker-card overflow-hidden h-auto min-h-0 mb-2"
            data-speaker-key="${String(speakerKey)}"
            data-speaker-id="${String(speakerId)}"
            data-speaker-name="${String(name)}">
            <div class="d-flex justify-content-between align-items-start">
            <div>
                <div class="fw-semibold text-white mb-1">${name}</div>
                <div class="small text-white-50">${desc}</div>
            </div>
            </div>
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

        // hide("bc_manual_area");
        // show("bc_need_select");

        // const goBtn = document.getElementById("bc_go_manual");
        // if (goBtn) goBtn.disabled = true;

        // active 제거
        document.querySelectorAll("#bc_speaker_list .speaker-card.active")
            .forEach(el => el.classList.remove("active"));

        this.refreshPreview();
        this.applyBroadcastTypeUI();
    },

    applyBroadcastTypeUI() {
        const type = document.getElementById("bc_broadcast_type")?.value ?? "1"; // "1"=TTS
        const wrap = document.getElementById("bc_tts_wrap");
        const tts = document.getElementById("bc_tts");
    
        const isTts = (type === "1");
    
        // 1) TTS일 때만 보이게
        if (wrap) wrap.classList.toggle("d-none", !isTts);
    
        // 2) 비-TTS일 때는 값 비우고 편집도 막기(안 보이더라도 안전하게)
        if (tts) {
            if (!isTts) tts.value = "";
                tts.disabled = !isTts;
        }
    },

    init() {
        const modalEl = document.getElementById("speaker_broadcast_modal");
        if (!modalEl) return;

        modalEl.addEventListener("shown.bs.modal", async () => {
            this.reset();
            await this.loadSpeakers();
            await this.loadDisasters();
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

        // ✅ 전체 선택/해제 토글
        modalEl.addEventListener("click", (e) => {
            if (!e.target.closest("#bc_toggle_all")) return;

            const cards = [...document.querySelectorAll("#bc_speaker_list .speaker-card")];
            if (cards.length === 0) return;

            const allSelected = cards.every(c => c.classList.contains("active"));

            if (allSelected) {
                // 전체 해제
                cards.forEach(c => c.classList.remove("active"));
                bcSelectedSpeakerKeys.clear();
                bcSelectedSpeakerIds.clear();
            } else {
            // 전체 선택
                cards.forEach(c => {
                    c.classList.add("active");
                    const k = String(c.dataset.speakerKey ?? "");
                    const d = String(c.dataset.speakerId ?? "");
                    if (k) bcSelectedSpeakerKeys.add(k);
                    if (d) bcSelectedSpeakerIds.add(d);
                });
            }

            syncSelectionUI();
        });

        // speaker-card 개별 토글(다중 선택)
        modalEl.addEventListener("click", (e) => {
            const card = e.target.closest("#bc_speaker_list .speaker-card");
            if (!card) return;

            const speakerKey = String(card.dataset.speakerKey ?? "");
            const speakerId = String(card.dataset.speakerId ?? "");
            if (!speakerKey) return;

            // 이 카드만 토글, 다른 카드 active 유지
            const willActive = !card.classList.contains("active");
            card.classList.toggle("active", willActive);

            if (willActive) {
                bcSelectedSpeakerKeys.add(speakerKey);
                if (speakerId) bcSelectedSpeakerIds.add(speakerId);
            } else {
                bcSelectedSpeakerKeys.delete(speakerKey);
                if (speakerId) bcSelectedSpeakerIds.delete(speakerId);
            }

            syncSelectionUI();
        });

        // 발령 설정 버튼
        // modalEl.addEventListener("click", (e) => {
        //     if (!e.target.closest("#bc_go_manual")) return;

        //     const selected = getSelectedSpeakerIds();
        //     if (selected.length === 0) {
        //         notify("스피커를 먼저 선택해주세요.", "warning");
        //         return;
        //     }

        //     hide("bc_need_select");
        //     show("bc_manual_area");
        //     showTab("tab-bc-manual");
        //     this.refreshPreview();
        // });

        // 폼 변경 -> 미리보기 갱신
        modalEl.addEventListener("change", (e) => {
            if ([
                "bc_mode", "bc_alert_type", "bc_broadcast_type",
                "bc_priority", "bc_scope", "bc_disaster"
                ].includes(e.target?.id)) {
                if (e.target?.id === "bc_broadcast_type") this.applyBroadcastTypeUI();
                this.refreshPreview();
            }
        });

        modalEl.addEventListener("input", (e) => {
            if (e.target?.id === "bc_tts") this.refreshPreview();
        });

        // 발령(여기서는 선택 검증만 정리. 실제 전송은 기존 코드 유지/연결하면 됨)
        modalEl.addEventListener("click", async (e) => {
            const btn = e.target.closest("#bc_send");
            if (!btn) return;

            const payloadUI = this.getPayloadForPreview();

            if (payloadUI.speakerIds.length === 0) {
                notify("스피커를 먼저 선택해주세요.", "warning");
                return;
            }
            if (!payloadUI.disasterCode) {
                notify("재난 코드를 선택해주세요.", "warning");
                return;
            }

            // 방송 종류(HTML 값): 1 = TTS 일 때만 메시지 필수
            if (payloadUI.broadcastType === "1" && !payloadUI.tts.trim()) {
                notify("TTS 메시지를 입력해주세요.", "warning");
                return;
            }

            console.log("[BC SEND PREVIEW]", payloadUI);
            notify(`선택된 스피커 ${payloadUI.speakerIds.length}대 기준으로 발령 payload 준비 완료`, "info");
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    BroadcastModal.init();
});
