/* ==========================================================
 * modal_speaker_setting.js (안정화 버전)
 * 스피커 설정 모달 전용 JS (단일 파일 + 내부 모듈 구조)
 * ========================================================== */

/* =============================================
    상태 변수
============================================= */
let selectedSpeaker = null;

/* =============================================
    공통 안전 유틸 함수
============================================= */
function safe(value, fallback = "-") {
    return value !== undefined && value !== null && value !== "" ? value : fallback;
}

function safeNum(value, fallback = 0) {
    return isNaN(Number(value)) ? fallback : Number(value);
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = safe(value, "");
}

function setChecked(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = !!value;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = safe(value, "-");
}


/* =============================================
    ① 스피커 목록 모듈
============================================= */
const SpeakerList = {
    speakers: [],

    async load() {
        try {
            const res = await fetch("/api/speaker/list");

            if (!res.ok) {
                console.error("스피커 목록 응답 오류:", res.status);
                return;
            }

            this.speakers = await res.json() ?? [];

            this.render();
            this.updateCount();

        } catch (e) {
            console.error("[SpeakerList] 로딩 오류:", e);
        }
    },

    render() {
        const container = document.getElementById("speakerOffcanvasList");
        const emptyMsg = document.getElementById("emptySpeakerMessage");

        if (!container) {
            console.warn("[SpeakerList] container 없음");
            return;
        }

        container.innerHTML = "";

        if (!this.speakers || this.speakers.length === 0) {
            emptyMsg?.classList.remove("d-none");
            return;
        }
        emptyMsg?.classList.add("d-none");

        this.speakers.forEach(spk => container.insertAdjacentHTML("beforeend", this.createCard(spk)));
    },

    updateCount() {
        const el = document.getElementById("speakerCount");
        if (el) el.textContent = `총 ${this.speakers.length}개`;
    },

    createCard(spk) {
        const isOnline = safe(spk.connStat) === "01";

        const textClass = isOnline ? "text-white" : "text-light opacity-50";
        const ipClass = isOnline ? "text-light opacity-75" : "text-light opacity-25";
        const statusText = isOnline ? "온라인" : "오프라인";

        return `
            <div class="speaker-card overflow-hidden h-auto min-h-0 mb-2"
                data-speaker-code="${safe(spk.speakerCode)}"
                data-location="${safe(spk.locationCode)}"
                style="cursor:pointer;">

                <div class="d-flex align-items-center">
                    <div class="flex-grow-1">
                        <div class="fw-semibold ${textClass}">${safe(spk.speakerName ?? spk.name)}</div>
                        <div class="small ${ipClass}">${safe(spk.url)}</div>
                    </div>

                    <div class="d-flex align-items-center">
                        <span class="badge rounded-pill px-3 py-1 ${isOnline ? 'online' : 'secondary'}">
                            ${statusText}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
};


/* =============================================
    ② 스피커 상세 표시 영역(읽기전용)
============================================= */
const SpeakerDetail = {

    fillBasicInfo(spk) {
        if (!spk) return;

        this.set("detail_name", spk.speakerName);
        this.set("detail_id", spk.id);
        this.set("detail_control_ip", spk.url);
    },

    fillChannelVolumes(s) {
        if (!s) return;

        const fields = [
            "bgm_ch1", "bgm_ch2", "bgm_ch3", "bgm_ch4",
            "alert_ch1", "alert_ch2", "alert_ch3", "alert_ch4",
            "fm_ch1", "fm_ch2", "fm_ch3", "fm_ch4"
        ];

        fields.forEach(f => this.set(f, s[f]));

        this.set("use_ch1", s.use_ch1 === 1 ? "사용" : "X");
        this.set("use_ch2", s.use_ch2 === 1 ? "사용" : "X");
        this.set("use_ch3", s.use_ch3 === 1 ? "사용" : "X");
        this.set("use_ch4", s.use_ch4 === 1 ? "사용" : "X");
    },

    fillExtraSettings(s) {
        if (!s) return;

        const map = {
            "detail_bgm_folder": "bgm_folder",
            "detail_bgm_status": "bgm_status",
            "detail_bgm_input_volume": "bgm_input_volume",

            "detail_msg_volume": "msg_volume",
            "detail_tts_volume": "tts_volume",
            "detail_fm_volume": "fm_volume",

            "detail_tts_pitch": "tts_pitch",
            "detail_tts_speed": "tts_speed",
            "detail_polling_interval": "polling_interval",

            "detail_sound_mode": "sound_mode",
            "detail_frequency": "frequency",
            "detail_frequency_region": "frequencyRegion"
        };

        for (const id in map) {
            this.set(id, s[map[id]]);
        }
    },

    set(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = safe(value);
    }
};


/* =============================================
    ③ 스피커 설정 조회 모듈
============================================= */
const SpeakerSetting = {

    async fetch(locationCode, speakerCode) {
        try {
            console.log("설정 조회:", locationCode, speakerCode);
            const res = await fetch(`/api/speaker/setting/${locationCode}/${speakerCode}`);
            if (!res.ok) {
                console.error("설정 조회 실패:", res.status);
                App.utils.showGlobalAlert(`설정 조회 실패`, "danger");
                return null;
            }
            return await res.json();

        } catch (e) {
            console.error("[SpeakerSetting] fetch 오류:", e);
            return null;
        }
    }

};


/* =============================================
    ④ 모달 전체 컨트롤러
============================================= */
const SpeakerSettingModal = {

    init() {
        const modalEl = document.getElementById("speaker_setting_modal");
        if (!modalEl) return;

        modalEl.addEventListener("shown.bs.modal", () => {
            SpeakerList.load();
        });

        modalEl.addEventListener("hidden.bs.modal", () => {
            // selectedSpeaker = null;
            this.resetState();
        });

        this.bindClickList();
        this.bindLoadDetail();
    },

    bindClickList() {
        document.addEventListener("click", function (e) {
            const card = e.target.closest(".speaker-card");
            if (!card) return;

            document.querySelectorAll(".speaker-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            const code = card.dataset.speakerCode;
            const location = card.dataset.location;

            const raw = SpeakerList.speakers.find(s =>
                safe(s.speakerCode) === code && safe(s.locationCode) === location);

            if (!raw) {
                console.error("스피커 정보를 찾을 수 없음:", code, location);
                return;
            }

            selectedSpeaker = {
                speakerCode: safe(raw.speakerCode),
                locationCode: safe(raw.locationCode),
                speakerName: safe(raw.speakerName ?? raw.name),
                conn: safe(raw.connStat),
                id: safe(raw.id),
                url: safe(raw.url)
            };

            SpeakerDetail.fillBasicInfo(selectedSpeaker);
        });
    },

    bindLoadDetail() {
        document.getElementById("speakerSettingInfo")?.addEventListener("click", async () => {
    
            if (!selectedSpeaker) {
                Swal.fire({
                    icon: 'warning',
                    title: '스피커 선택 필요',
                    text: '스피커를 먼저 선택해주세요.',
                    confirmButtonText: '확인',
                    customClass: {
                        popup: 'eds-swal-popup',
                        confirmButton: 'btn-apple info'
                    },
                    buttonsStyling: false
                });
                return;
            }
    
            // 🎯 오프라인 확인
            if (selectedSpeaker.conn === "00") {
    
                const result = await Swal.fire({
                    icon: 'info',
                    title: '오프라인 스피커',
                    html:
                        "이 스피커는 현재 <b style='color:#ff7675;'>오프라인</b> 상태입니다.<br>" +
                        "장비로 설정 전송은 불가능하며,<br>" +
                        "<b>저장된 DB 설정만 조회</b>할 수 있습니다.<br><br>" +
                        "그래도 조회하시겠습니까?",
                    showCancelButton: true,
                    confirmButtonText: '조회',
                    cancelButtonText: '닫기',
                    reverseButtons: true,
                    customClass: {
                        popup: 'eds-swal-popup',
                        confirmButton: 'btn btn-primary mx-2',
                        cancelButton: 'btn btn-secondary mx-2'
                    },
                    buttonsStyling: false
                });
    
                if (!result.isConfirmed) return;
            }
    
            const { locationCode, speakerCode } = selectedSpeaker;
    
            try {
                const setting = await SpeakerSetting.fetch(locationCode, speakerCode);
    
                if (!setting) {
                    Swal.fire({
                        icon: 'error',
                        title: '설정 없음',
                        text: '스피커 설정 정보가 없습니다.',
                        confirmButtonText: '확인',
                        customClass: {
                            popup: 'eds-swal-popup',
                            confirmButton: 'btn-apple error'
                        },
                        buttonsStyling: false
                    });
                    return;
                }
    
                // DB값 채우기
                SpeakerDetail.fillChannelVolumes(setting);
                SpeakerDetail.fillExtraSettings(setting);
    
                // 수정 패널 채우기
                SpeakerForm.fill(setting);
    
            } catch (e) {
                Swal.fire({
                    icon: 'error',
                    title: '조회 실패',
                    text: '스피커 설정 조회 중 오류가 발생했습니다.',
                    confirmButtonText: '확인',
                    customClass: {
                        popup: 'eds-swal-popup',
                        confirmButton: 'btn-apple error'
                    },
                    buttonsStyling: false
                });
            }
        });
    },

    resetState() {

        console.log("[SpeakerSettingModal] 초기화 실행");
    
        // 선택 스피커 초기화
        selectedSpeaker = null;
    
        // 선택된 카드 active 제거
        document.querySelectorAll(".speaker-card.active")
            .forEach(c => c.classList.remove("active"));
    
        // 상세 영역 초기화
        const detailIds = [
            "detail_name", "detail_id", "detail_control_ip",
            "bgm_ch1", "bgm_ch2", "bgm_ch3", "bgm_ch4",
            "alert_ch1", "alert_ch2", "alert_ch3", "alert_ch4",
            "fm_ch1", "fm_ch2", "fm_ch3", "fm_ch4",
            "use_ch1", "use_ch2", "use_ch3", "use_ch4",
            "detail_bgm_folder", "detail_bgm_status", "detail_bgm_input_volume",
            "detail_msg_volume", "detail_tts_volume", "detail_fm_volume",
            "detail_tts_pitch", "detail_tts_speed", "detail_polling_interval",
            "detail_sound_mode", "detail_frequency", "detail_frequency_region"
        ];
    
        detailIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "-";
        });
    
        // 수정 폼(입력) 초기화 (선택적으로 활성화)
        const formEl = document.getElementById("speakerSettingForm");
        if (formEl) formEl.reset?.();
    },
    
    
};


/* =============================================
    ⑤ 수정 폼 데이터 바인딩
============================================= */
const SpeakerForm = {

    fill(s) {
        if (!s) return;

        setVal("volumeType", s.volume_type);
        setChecked("volumeSettingToggle", s.volume_enabled);

        setVal("vol_ch1", s.bgm_ch1);
        setVal("vol_ch2", s.bgm_ch2);
        setVal("vol_ch3", s.bgm_ch3);
        setVal("vol_ch4", s.bgm_ch4);

        setChecked("ttsSettingToggle", s.tts_enabled);
        setVal("ttsSpeed", s.tts_speed);
        setVal("ttsPitch", s.tts_pitch);
        setVal("audioType", s.audio_type);
        setVal("volumeRange", safeNum(s.tts_volume));
        setText("volumeValue", `${safeNum(s.tts_volume)}%`);

        setChecked("soundSettingToggle", s.sound_enabled);
        setVal("soundMode", s.sound_mode);
        setVal("bgmFolder", s.bgm_folder);

        setChecked("channelSettingToggle", s.channel_enabled);
        setVal("use_ch1_sel", s.use_ch1);
        setVal("use_ch2_sel", s.use_ch2);
        setVal("use_ch3_sel", s.use_ch3);
        setVal("use_ch4_sel", s.use_ch4);

        setChecked("bgmSettingToggle", s.bgm_enabled);
        setVal("bgmFolderSel", s.bgm_folder);
        setVal("bgmStatusSel", s.bgm_status);
        setVal("freqSel", s.frequency);
        setVal("freqRegionSel", s.frequencyRegion);

        setChecked("netSettingToggle", s.net_enabled);
        setVal("net_ip", selectedSpeaker.url);
        setVal("net_speaker_id", selectedSpeaker.id);
        setVal("net_interval", s.polling_interval);
    }
};


/* =============================================
    DOMContentLoaded
============================================= */
document.addEventListener("DOMContentLoaded", () => {
    SpeakerSettingModal.init();
});
