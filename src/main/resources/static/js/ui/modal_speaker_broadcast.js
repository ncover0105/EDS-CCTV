/* ==========================================================
* modal_broadcast_modal.js
* - 기존 styles.css 디자인 그대로 쓰는 발령 모달
* - 스피커 선택 → 발령 설정 활성화 → 발령 전송
* ========================================================== */

let bcSelectedSpeaker = null;

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

/* =========================
API (엔드포인트는 프로젝트에 맞게 변경)
========================= */
const BroadcastApi = {
async listSpeakers() {
const res = await fetch("/api/btype/query/config/list");
if (!res.ok) return [];
return (await res.json()) ?? [];
},

async listDisasters() {
const res = await fetch("/api/btype/query/disaster");
if (!res.ok) return [];
return (await res.json()) ?? [];
},

async send(payload) {
// TODO: 실제 발령 API로 변경
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

/* =========================
리스트/재난 로딩
========================= */
const BroadcastModal = {
    speakers: [],

    async loadSpeakers() {
        this.speakers = await BroadcastApi.listSpeakers();

        const listEl = document.getElementById("bc_speaker_list");
        const emptyEl = document.getElementById("bc_empty_speaker");
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
            const name = safe(spk.speakerName ?? spk.name ?? speakerKey);
            const desc = safe(spk.description, "");

            listEl.insertAdjacentHTML("beforeend", `
                <div class="speaker-card overflow-hidden h-auto min-h-0 mb-2"
                    data-speaker-key="${String(speakerKey)}">
                <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="fw-semibold text-white mb-1">${name}</div>
                    <div class="small text-white-50">${desc}</div>
                </div>
                </div>
            </div>
            `);
        });
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

    applyScopeUI() {
        const scope = document.getElementById("bc_scope")?.value ?? "SPEAKER";

        // 기본 숨김
        // hide("bc_scope_sido_wrap");
        // hide("bc_scope_gun_wrap");
        // hide("bc_scope_speaker_wrap");

        // if (scope === "SIDO") {
        //     show("bc_scope_sido_wrap");
        //     setText("bc_scope_hint", "시/도 단위로 방송합니다.");
        // } else if (scope === "GUN") {
        //     show("bc_scope_sido_wrap");
        //     show("bc_scope_gun_wrap");
        //     setText("bc_scope_hint", "시/도 + 군/구 범위를 지정합니다.");
        // } else {
        //     show("bc_scope_speaker_wrap");
        //     setText("bc_scope_hint", "선택된 스피커로 방송합니다.");
        // }
    },

    getPayloadForPreview() {
        const scope = document.getElementById("bc_scope")?.value ?? "SPEAKER";

        return {
            speakerKey: bcSelectedSpeaker?.speakerKey ?? "",
            mode: document.getElementById("bc_mode")?.value ?? "REAL",
            alertType: document.getElementById("bc_alert_type")?.value ?? "CFW",
            broadcastType: document.getElementById("bc_broadcast_type")?.value ?? "TTS",
            priority: document.getElementById("bc_priority")?.value ?? "NONE",
            scope,
            sido: document.getElementById("bc_sido")?.value ?? "",
            gun: document.getElementById("bc_gun")?.value ?? "",
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
        bcSelectedSpeaker = null;

        setText("bc_hint", "스피커 선택 후 발령 단계를 진행할 수 있습니다.");
        setText("bc_step_text", "스피커를 선택하세요.");
        setVal("bc_selected_speaker_name", "");
        // setVal("bc_scope_speaker_key", "");

        // 우측 영역 초기 상태
        hide("bc_manual_area");
        show("bc_need_select");

        // 버튼 비활성
        const goBtn = document.getElementById("bc_go_manual");
        if (goBtn) goBtn.disabled = true;

        // active 제거
        document.querySelectorAll("#bc_speaker_list .speaker-card.active").forEach(el => el.classList.remove("active"));

        // 폼 기본값 유지하면서 스코프 UI만 세팅
        this.applyScopeUI();
        this.refreshPreview();
    },

    init() {
        const modalEl = document.getElementById("speaker_broadcast_modal");
        if (!modalEl) return;

        modalEl.addEventListener("shown.bs.modal", async () => {
            this.reset();
            await this.loadSpeakers();
            await this.loadDisasters();
            this.applyScopeUI();
            this.refreshPreview();
        });

        modalEl.addEventListener("hidden.bs.modal", () => this.reset());

        // 스피커 갱신
        modalEl.addEventListener("click", async (e) => {
            if (e.target.closest("#bc_refresh_speaker")) {
            await this.loadSpeakers();
            notify("스피커 리스트를 갱신했습니다.", "success");
            }
        });

        // 재난 갱신
        // modalEl.addEventListener("click", async (e) => {
        //     if (e.target.closest("#bc_refresh_disaster")) {
        //     await this.loadDisasters();
        //     notify("재난 리스트를 갱신했습니다.", "success");
        //     }
        // });

        // 스피커 선택
        modalEl.addEventListener("click", (e) => {
            const card = e.target.closest("#bc_speaker_list .speaker-card");
            if (!card) return;

            document.querySelectorAll("#bc_speaker_list .speaker-card").forEach(el => el.classList.remove("active"));
            card.classList.add("active");

            const speakerKey = card.dataset.speakerKey;
            const raw = this.speakers.find(s => String(s?.speakerKey) === String(speakerKey));
            if (!raw) return;

            bcSelectedSpeaker = {
            speakerKey: raw.speakerKey,
            speakerName: raw.speakerName ?? raw.name ?? `KEY:${speakerKey}`
            };

            setText("bc_hint", "발령 설정을 진행할 수 있습니다.");
            setText("bc_step_text", "발령 설정을 진행하세요.");

            setVal("bc_selected_speaker_name", bcSelectedSpeaker.speakerName);
            // setVal("bc_scope_speaker_key", bcSelectedSpeaker.speakerKey);

            // 우측 버튼 활성화
            const goBtn = document.getElementById("bc_go_manual");
            if (goBtn) goBtn.disabled = false;

            this.refreshPreview();
        });

        // 발령 설정 버튼
        modalEl.addEventListener("click", (e) => {
            if (!e.target.closest("#bc_go_manual")) return;
            if (!bcSelectedSpeaker?.speakerKey) {
            notify("스피커를 먼저 선택해주세요.", "warning");
            return;
        }

            hide("bc_need_select");
            show("bc_manual_area");
            showTab("tab-bc-manual");
            this.applyScopeUI();
            this.refreshPreview();
        });

        // 스코프 변경 등 -> 미리보기 갱신
        modalEl.addEventListener("change", (e) => {
            if (e.target?.id === "bc_scope") this.applyScopeUI();
            if ([
            "bc_mode","bc_alert_type","bc_broadcast_type","bc_priority",
            "bc_scope","bc_sido","bc_gun","bc_disaster"
            ].includes(e.target?.id)) {
            this.refreshPreview();
            }
        });

        modalEl.addEventListener("input", (e) => {
            if (e.target?.id === "bc_tts") this.refreshPreview();
        });

        // 발령
        modalEl.addEventListener("click", async (e) => {
            const btn = e.target.closest("#bc_send");
            if (!btn) return;

            if (!bcSelectedSpeaker?.speakerKey) {
                notify("스피커를 먼저 선택해주세요.", "warning");
                return;
            }

            const payload = this.getPayloadForPreview();

            // 간단 검증
            if (!payload.disasterCode) {
                notify("재난을 선택해주세요.", "warning");
                return;
            }
            if (payload.broadcastType === "TTS" && !payload.tts.trim()) {
                notify("TTS 메시지를 입력해주세요.", "warning");
                return;
            }

            btn.disabled = true;
            btn.dataset.loading = "1";

            try {
                const res = await BroadcastApi.send(payload);
                console.log("broadcast result =", res);
                notify("발령 요청을 전송했습니다.", "success");
            } catch (err) {
                console.error("broadcast send error:", err);
                notify("발령 요청 중 오류가 발생했습니다.", "danger");
            } finally {
                btn.disabled = false;
                btn.dataset.loading = "0";
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
BroadcastModal.init();
});
