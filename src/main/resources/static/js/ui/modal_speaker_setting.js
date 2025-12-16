/* ==========================================================
 * modal_speaker_setting.js  (A/B 타입 분기 버전)
 * ========================================================== */

let selectedSpeaker = null;

function safe(value, fallback = "-") {
  return value !== undefined && value !== null && value !== "" ? value : fallback;
}
function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = safe(value, "-");
}
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

/* -----------------------------
  Bootstrap 탭 유틸 (A/B 분리)
------------------------------ */
function enableTab(btnId, enable) {
  const btn = document.getElementById(btnId);
  if (btn) btn.disabled = !enable;
}
function showTab(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (typeof bootstrap === "undefined" || !bootstrap.Tab) return;
  bootstrap.Tab.getOrCreateInstance(btn).show();
}

/* -----------------------------
  manufacturer → 타입 판정
------------------------------ */
function resolveType(manufacturer) {
  const m = String(manufacturer ?? "").toUpperCase().trim();
  // 예: "A", "B", "ATYPE", "BTYPE", "B-XXX" 등 모두 허용
  if (m.startsWith("B")) return "B";
  return "A";
}

function applyTypeUI(type) {
  const a = document.getElementById("area_type_a");
  const b = document.getElementById("area_type_b");

  if (a) a.classList.toggle("d-none", type !== "A");
  if (b) b.classList.toggle("d-none", type !== "B");

  setText("speakerTypeBadge", `타입: ${type}`);
  setText("speakerTypeHint", type === "A"
    ? "A 타입 UI(기존 탭) 표시 중"
    : "B 타입 UI(tb_spk_setting) 표시 중");

  // 탭 잠금 초기화
  enableTab("tab-config-a", false);
  enableTab("tab-config-b", false);

  // 기본 탭으로 이동
  if (type === "A") showTab("tab-info-a");
  else showTab("tab-info-b");
}

/* =============================================
   ① 스피커 목록
============================================= */
const SpeakerList = {
  speakers: [],

  async load() {
    const res = await fetch("/api/speaker/list");
    if (!res.ok) return;
    this.speakers = (await res.json()) ?? [];
    this.render();
    this.updateCount();
  },

  render() {
    const container = document.getElementById("speakerOffcanvasList");
    const emptyMsg = document.getElementById("emptySpeakerMessage");
    if (!container) return;

    container.innerHTML = "";

    if (!this.speakers.length) {
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
    const statusText = isOnline ? "온라인" : "오프라인";
    const manufacturer = safe(spk.manufacturer, "-");

    return `
      <div class="speaker-card overflow-hidden h-auto min-h-0 mb-2"
           data-speaker-code="${safe(spk.speakerCode)}"
           data-location="${safe(spk.locationCode)}"
           style="cursor:pointer;">
        <div class="d-flex align-items-center">
          <div class="flex-grow-1">
            <div class="fw-semibold ${isOnline ? "text-white" : "text-light opacity-50"}">
              ${safe(spk.speakerName ?? spk.name)}
              <span class="badge bg-secondary ms-2">MFR:${manufacturer}</span>
            </div>
            <div class="small ${isOnline ? "text-light opacity-75" : "text-light opacity-25"}">${safe(spk.url)}</div>
          </div>
          <span class="badge rounded-pill px-3 py-1 ${isOnline ? "online" : "secondary"}">${statusText}</span>
        </div>
      </div>
    `;
  }
};

/* =============================================
   A 타입: (기존) 상세 표시/폼 채우기
   - 너가 올린 기존 매핑 그대로 사용 :contentReference[oaicite:2]{index=2}
============================================= */
const SpeakerDetailA = {
  fillBasicInfo(spk) {
    setText("detail_name", spk?.speakerName);
    setText("detail_id", spk?.id);
    setText("detail_control_ip", spk?.url);
  },

  fillFromSetting(s) {
    // 기존 코드 흐름 유지(필요한 경우 기존 함수 그대로 가져와도 됨)
    const fields = ["bgm_ch1","bgm_ch2","bgm_ch3","bgm_ch4","alert_ch1","alert_ch2","alert_ch3","alert_ch4","fm_ch1","fm_ch2","fm_ch3","fm_ch4"];
    fields.forEach(f => setText(f, s?.[f]));

    setText("use_ch1", s?.use_ch1 === 1 ? "사용" : "X");
    setText("use_ch2", s?.use_ch2 === 1 ? "사용" : "X");
    setText("use_ch3", s?.use_ch3 === 1 ? "사용" : "X");
    setText("use_ch4", s?.use_ch4 === 1 ? "사용" : "X");

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
    Object.keys(map).forEach(id => setText(id, s?.[map[id]]));
  }
};

/* =============================================
   B 타입: tb_spk_setting 바인딩
   - 컬럼명 그대로 받는 걸 우선으로 하고, 혹시 camelCase로 오면 fallback
============================================= */
function pick(s, ...keys) {
  for (const k of keys) {
    if (s && s[k] !== undefined && s[k] !== null) return s[k];
  }
  return null;
}

const SpeakerDetailB = {
  fillFromSetting(s) {
    setText("b_speakerKey", pick(s, "speakerKey", "speaker_key"));
    setText("b_receiveTime", pick(s, "ReceiveTime", "receiveTime", "receive_time"));
    setText("b_serverip", pick(s, "serverip", "serverIp", "server_ip"));

    // 볼륨(채널)
    setText("b_bgm_vol_ch1", pick(s, "bgm_vol_ch1", "bgmVolCh1"));
    setText("b_bgm_vol_ch2", pick(s, "bgm_vol_ch2", "bgmVolCh2"));
    setText("b_bgm_vol_ch3", pick(s, "bgm_vol_ch3", "bgmVolCh3"));
    setText("b_bgm_vol_ch4", pick(s, "bgm_vol_ch4", "bgmVolCh4"));

    setText("b_alert_vol_ch1", pick(s, "alert_vol_ch1", "alertVolCh1"));
    setText("b_alert_vol_ch2", pick(s, "alert_vol_ch2", "alertVolCh2"));
    setText("b_alert_vol_ch3", pick(s, "alert_vol_ch3", "alertVolCh3"));
    setText("b_alert_vol_ch4", pick(s, "alert_vol_ch4", "alertVolCh4"));

    setText("b_fm_vol_ch1", pick(s, "fm_vol_ch1", "fmVolCh1"));
    setText("b_fm_vol_ch2", pick(s, "fm_vol_ch2", "fmVolCh2"));
    setText("b_fm_vol_ch3", pick(s, "fm_vol_ch3", "fmVolCh3"));
    setText("b_fm_vol_ch4", pick(s, "fm_vol_ch4", "fmVolCh4"));

    // 사용여부
    setText("b_useCh1", pick(s, "useCh1", "use_ch1"));
    setText("b_useCh2", pick(s, "useCh2", "use_ch2"));
    setText("b_useCh3", pick(s, "useCh3", "use_ch3"));
    setText("b_useCh4", pick(s, "useCh4", "use_ch4"));

    // 기타
    setText("b_TTARegionCode", pick(s, "TTARegionCode", "ttaRegionCode"));
    setText("b_DMBFrequency1", pick(s, "DMBFrequency1", "dmbFrequency1"));
    setText("b_DMBFrequency2", pick(s, "DMBFrequency2", "dmbFrequency2"));

    setText("b_BGMFolderNo", pick(s, "BGMFolderNo", "bgmFolderNo"));
    setText("b_BGMStatus", pick(s, "BGMStatus", "bgmStatus"));

    setText("b_BGM_IN_VOL", pick(s, "BGM_IN_VOL", "bgmInVol"));
    setText("b_STO_IN_VOL", pick(s, "STO_IN_VOL", "stoInVol"));
    setText("b_TTS_IN_VOL", pick(s, "TTS_IN_VOL", "ttsInVol"));
    setText("b_FM_IN_VOL", pick(s, "FM_IN_VOL", "fmInVol"));

    setText("b_TTS_Pitch", pick(s, "TTS_Pitch", "ttsPitch"));
    setText("b_TTS_Speed", pick(s, "TTS_Speed", "ttsSpeed"));

    setText("b_PollingCheckTime", pick(s, "PollingCheckTime", "pollingCheckTime"));
    setText("b_MusicMode", pick(s, "MusicMode", "musicMode"));

    setText("b_RadioFrequency", pick(s, "RadioFrequency", "radioFrequency"));
    setText("b_RadioFrequencyRegion", pick(s, "RadioFrequencyRegion", "radioFrequencyRegion"));
  }
};

const SpeakerFormB = {
  fill(s) {
    setVal("bi_serverip", pick(s, "serverip", "serverIp"));
    setVal("bi_TTARegionCode", pick(s, "TTARegionCode", "ttaRegionCode"));
    setVal("bi_PollingCheckTime", pick(s, "PollingCheckTime", "pollingCheckTime"));

    setVal("bi_DMBFrequency1", pick(s, "DMBFrequency1", "dmbFrequency1"));
    setVal("bi_DMBFrequency2", pick(s, "DMBFrequency2", "dmbFrequency2"));

    setVal("bi_BGMFolderNo", pick(s, "BGMFolderNo", "bgmFolderNo"));
    setVal("bi_BGMStatus", pick(s, "BGMStatus", "bgmStatus"));
    setVal("bi_MusicMode", pick(s, "MusicMode", "musicMode"));

    setVal("bi_BGM_IN_VOL", pick(s, "BGM_IN_VOL", "bgmInVol"));
    setVal("bi_STO_IN_VOL", pick(s, "STO_IN_VOL", "stoInVol"));
    setVal("bi_TTS_IN_VOL", pick(s, "TTS_IN_VOL", "ttsInVol"));
    setVal("bi_FM_IN_VOL", pick(s, "FM_IN_VOL", "fmInVol"));

    setVal("bi_TTS_Pitch", pick(s, "TTS_Pitch", "ttsPitch"));
    setVal("bi_TTS_Speed", pick(s, "TTS_Speed", "ttsSpeed"));

    setVal("bi_bgm_vol_ch1", pick(s, "bgm_vol_ch1", "bgmVolCh1"));
    setVal("bi_bgm_vol_ch2", pick(s, "bgm_vol_ch2", "bgmVolCh2"));
    setVal("bi_bgm_vol_ch3", pick(s, "bgm_vol_ch3", "bgmVolCh3"));
    setVal("bi_bgm_vol_ch4", pick(s, "bgm_vol_ch4", "bgmVolCh4"));

    setVal("bi_alert_vol_ch1", pick(s, "alert_vol_ch1", "alertVolCh1"));
    setVal("bi_alert_vol_ch2", pick(s, "alert_vol_ch2", "alertVolCh2"));
    setVal("bi_alert_vol_ch3", pick(s, "alert_vol_ch3", "alertVolCh3"));
    setVal("bi_alert_vol_ch4", pick(s, "alert_vol_ch4", "alertVolCh4"));

    setVal("bi_fm_vol_ch1", pick(s, "fm_vol_ch1", "fmVolCh1"));
    setVal("bi_fm_vol_ch2", pick(s, "fm_vol_ch2", "fmVolCh2"));
    setVal("bi_fm_vol_ch3", pick(s, "fm_vol_ch3", "fmVolCh3"));
    setVal("bi_fm_vol_ch4", pick(s, "fm_vol_ch4", "fmVolCh4"));

    setVal("bi_useCh1", pick(s, "useCh1", "use_ch1"));
    setVal("bi_useCh2", pick(s, "useCh2", "use_ch2"));
    setVal("bi_useCh3", pick(s, "useCh3", "use_ch3"));
    setVal("bi_useCh4", pick(s, "useCh4", "use_ch4"));

    setVal("bi_RadioFrequency", pick(s, "RadioFrequency", "radioFrequency"));
    setVal("bi_RadioFrequencyRegion", pick(s, "RadioFrequencyRegion", "radioFrequencyRegion"));
  }
};

/* =============================================
   설정 조회 API
   - A/B 같은 엔드포인트 쓰면 그대로 사용
   - 만약 B가 다른 엔드포인트면 여기만 바꾸면 됨
============================================= */
const SpeakerSetting = {
  async fetchForA(locationCode, speakerCode) {
    const res = await fetch(`/api/speaker/setting/${locationCode}/${speakerCode}`); // 기존 그대로 :contentReference[oaicite:3]{index=3}
    if (!res.ok) return null;
    return await res.json();
  },

  async fetchForB(speakerKey) {
    // ✅ 너 백엔드에 맞게 엔드포인트 한 줄만 조정하면 됨
    // 예시1) /api/speaker/setting/b/{speakerKey}
    // const res = await fetch(`/api/speaker/setting/b/${speakerKey}`);

    // 예시2) 기존과 동일하게 location/speakerCode로 받는다면 fetchForA를 그대로 써도 됨
    const res = await fetch(`/api/speaker/setting/b/${speakerKey}`);
    if (!res.ok) return null;
    return await res.json();
  }
};

function clearTextByIds(ids) {
    ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "-";
});
}

function hide(elId) {
    document.getElementById(elId)?.classList.add("d-none");
}
function show(elId) {
    document.getElementById(elId)?.classList.remove("d-none");
}

function enableTab(btnId, enable) {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = !enable;
}

function showTab(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (typeof bootstrap === "undefined" || !bootstrap.Tab) return;
    bootstrap.Tab.getOrCreateInstance(btn).show();
}

/* =============================================
    모달 컨트롤러   
============================================= */
const SpeakerSettingModal = {
  init() {
    const modalEl = document.getElementById("speaker_setting_modal");
    if (!modalEl) return;

    modalEl.addEventListener("shown.bs.modal", () => {
      SpeakerList.load();
      setText("speakerTypeBadge", "타입: -");
      setText("speakerTypeHint", "스피커를 선택하세요.");
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      this.resetState();
    });

    this.bindClickList();
    this.bindLoadDetail();
  },

  resetState() {
    // 1) 선택 데이터 제거
    selectedSpeaker = null;
  
    // 2) 리스트 active 제거
    document.querySelectorAll(".speaker-card.active")
      .forEach(c => c.classList.remove("active"));
  
    // 3) ✅ A/B 화면 자체를 숨김 (정보/설정 포함)
    hide("area_type_a");
    hide("area_type_b");
  
    // 4) 타입 라벨/힌트 초기화
    setText("speakerTypeBadge", "타입: -");
    setText("speakerTypeHint", "스피커를 선택하세요.");
  
    // 5) ✅ 설정 탭은 무조건 잠금(숨김은 영역이 이미 숨겨짐)
    enableTab("tab-config-a", false);
    enableTab("tab-config-b", false);
  
    // 6) ✅ 활성 탭이 설정으로 남아있는 걸 방지 (정보탭으로 강제)
    // (버튼이 없으면 자동으로 무시됨)
    showTab("tab-info-a");
    showTab("tab-info-b");
  
    // 7) 상세 텍스트 초기화 (A/B)
    clearTextByIds([
      "detail_name","detail_id","detail_control_ip",
      "bgm_ch1","bgm_ch2","bgm_ch3","bgm_ch4",
      "alert_ch1","alert_ch2","alert_ch3","alert_ch4",
      "fm_ch1","fm_ch2","fm_ch3","fm_ch4",
      "use_ch1","use_ch2","use_ch3","use_ch4",
      "detail_bgm_folder","detail_bgm_status","detail_bgm_input_volume",
      "detail_msg_volume","detail_tts_volume","detail_fm_volume",
      "detail_tts_pitch","detail_tts_speed","detail_polling_interval",
      "detail_sound_mode","detail_frequency","detail_frequency_region",
  
      "b_speakerKey","b_receiveTime","b_serverip",
      "b_bgm_vol_ch1","b_bgm_vol_ch2","b_bgm_vol_ch3","b_bgm_vol_ch4",
      "b_alert_vol_ch1","b_alert_vol_ch2","b_alert_vol_ch3","b_alert_vol_ch4",
      "b_fm_vol_ch1","b_fm_vol_ch2","b_fm_vol_ch3","b_fm_vol_ch4",
      "b_useCh1","b_useCh2","b_useCh3","b_useCh4",
      "b_TTARegionCode","b_DMBFrequency1","b_DMBFrequency2",
      "b_BGMFolderNo","b_BGMStatus",
      "b_BGM_IN_VOL","b_STO_IN_VOL","b_TTS_IN_VOL","b_FM_IN_VOL",
      "b_TTS_Pitch","b_TTS_Speed",
      "b_PollingCheckTime","b_MusicMode",
      "b_RadioFrequency","b_RadioFrequencyRegion"
    ]);
  
    // 8) ✅ 폼도 초기화(설정 화면 값 남는거 방지)
    document.getElementById("speakerSettingForm")?.reset?.();
    document.getElementById("speakerSettingFormB")?.reset?.();
  },
   

  bindClickList() {
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".speaker-card");
      if (!card) return;

      document.querySelectorAll(".speaker-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      const code = card.dataset.speakerCode;
      const location = card.dataset.location;

      const raw = SpeakerList.speakers.find(s =>
        safe(s.speakerCode) === code && safe(s.locationCode) === location
      );

      if (!raw) return;

      selectedSpeaker = {
        speakerCode: safe(raw.speakerCode),
        locationCode: safe(raw.locationCode),
        speakerName: safe(raw.speakerName ?? raw.name),
        conn: safe(raw.connStat),
        id: safe(raw.id),
        url: safe(raw.url),

        // ✅ 추가: manufacturer / speakerKey
        manufacturer: safe(raw.manufacturer),
        speakerKey: raw.speakerKey ?? raw.speakerKeyId ?? raw.key ?? null
      };

      const type = resolveType(selectedSpeaker.manufacturer);
      applyTypeUI(type);

      // A타입 기본정보는 기존 영역에 표시(네 기존 로직 유지) :contentReference[oaicite:4]{index=4}
      if (type === "A") SpeakerDetailA.fillBasicInfo(selectedSpeaker);

      // B타입이면 speakerKey 표시만 먼저
      if (type === "B") {
        setText("b_speakerKey", selectedSpeaker.speakerKey ?? "-");
        setText("b_serverip", selectedSpeaker.url ?? "-");
      }
    });
  },

  bindLoadDetail() {
    document.getElementById("speakerSettingInfo")?.addEventListener("click", async () => {
      if (!selectedSpeaker) {
        alert("스피커를 먼저 선택해주세요.");
        return;
      }

      const type = resolveType(selectedSpeaker.manufacturer);

      // 오프라인 안내는 기존 흐름 유지 가능 :contentReference[oaicite:5]{index=5}

      let setting = null;

      if (type === "A") {
        setting = await SpeakerSetting.fetchForA(selectedSpeaker.locationCode, selectedSpeaker.speakerCode);
        if (!setting) return;

        SpeakerDetailA.fillFromSetting(setting);
        enableTab("tab-config-a", true);
        showTab("tab-config-a");
      } else {
        // B 타입은 speakerKey가 필수
        if (!selectedSpeaker.speakerKey) {
          alert("B 타입 스피커는 speakerKey가 필요합니다. /api/speaker/list 응답에 speakerKey를 포함시켜주세요.");
          return;
        }

        setting = await SpeakerSetting.fetchForB(selectedSpeaker.speakerKey);
        if (!setting) return;

        SpeakerDetailB.fillFromSetting(setting);
        SpeakerFormB.fill(setting);

        enableTab("tab-config-b", true);
        showTab("tab-config-b");
      }
    });
  },

  resetState() {
    selectedSpeaker = null;
    document.querySelectorAll(".speaker-card.active").forEach(c => c.classList.remove("active"));
    applyTypeUI("A"); // 기본은 A로 두되, A 영역도 숨기고 싶으면 applyTypeUI 호출 대신 d-none 처리하면 됨
    setText("speakerTypeBadge", "타입: -");
    setText("speakerTypeHint", "스피커를 선택하세요.");

    // A/B 탭 잠금
    enableTab("tab-config-a", false);
    enableTab("tab-config-b", false);

    // B 폼 reset
    document.getElementById("speakerSettingFormB")?.reset?.();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  SpeakerSettingModal.init();
});
