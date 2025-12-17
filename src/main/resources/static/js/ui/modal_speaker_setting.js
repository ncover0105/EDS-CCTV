/* ==========================================================
 * modal_speaker_setting.js (SpeakerSettingDTO 기준)
 * - 조회(Read-only) / 정보 요청 후 "설정 정보" 갱신 + "설정 변경" 탭 활성화만
 * ========================================================== */

let selectedSpeaker = null;

function safe(v, fb = "-") {
  return v !== undefined && v !== null && v !== "" ? v : fb;
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = safe(v, "-");
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = (value === undefined || value === null) ? "" : String(value);
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return null;
}

function useChText(v) {
  if (v === 1 || v === "1") return "사용";
  if (v === 2 || v === "2") return "미사용";
  if (v === 3 || v === "3") return "없음";
  return "-";
}

function hide(id) {
  document.getElementById(id)?.classList.add("d-none");
}
function show(id) {
  document.getElementById(id)?.classList.remove("d-none");
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
function clearTextByIds(ids) {
  ids.forEach((id) => setText(id, "-"));
}

function syncRangeBadges(root = document) {
  root.querySelectorAll('input[type="range"][data-sync-value]').forEach((range) => {
    const badgeId = range.getAttribute("data-sync-value");
    const badge = document.getElementById(badgeId);
    const apply = () => { if (badge) badge.textContent = range.value; };
    range.addEventListener("input", apply);
    apply();
  });
}

// 모달 열릴 때마다 동기화(동적 DOM 대비)
document.addEventListener("shown.bs.modal", (e) => {
  if (e.target?.id === "speaker_setting_modal") {
    syncRangeBadges(e.target);
  }
});

/* =========================
  API
========================= */
const SpeakerApi = {
  async list() {
    const res = await fetch("/api/btype/query/config/list");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
  },

  async getSetting(speakerKey) {
    // 컨트롤러 경로에 맞춰 통일 (너가 만든 조회 전용 컨트롤러 기준)
    const res = await fetch(`/api/speaker/setting/${speakerKey}`);
    if (!res.ok) return null; // 404 포함: 데이터 없음 처리
    return await res.json();
  }
};

/* =========================
  리스트 렌더
========================= */
const SpeakerList = {
  speakers: [],

  async load() {
    this.speakers = await SpeakerApi.list();
    this.render();
    this.updateCount();
  },

  updateCount() {
    const el = document.getElementById("speakerCount");
    if (el) el.textContent = `총 ${this.speakers.length}개`;
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

    this.speakers.forEach((spk) => {
      container.insertAdjacentHTML("beforeend", this.createCard(spk));
    });
  },

  createCard(spk) {
    const speakerKey = spk?.speakerKey ?? "";
    const name = safe(spk.speakerName ?? spk.name ?? speakerKey);

    return `
      <div class="speaker-card overflow-hidden h-auto min-h-0 mb-2"
           data-speaker-key="${String(speakerKey)}"
           style="cursor:pointer;">
        <div class="d-flex align-items-center">
          <div class="flex-grow-1">
            <div class="fw-semibold text-white">
              ${name}
              <span class="badge bg-secondary ms-2">KEY:${safe(speakerKey)}</span>
            </div>
            <div class="small text-light opacity-75">${safe(spk.description)}</div>
          </div>
        </div>
      </div>
    `;
  }
};

/* =========================
  SpeakerSettingDTO → 화면 바인딩
  (HTML id에 맞춰서 채움)
========================= */
const SettingView = {
  fillReadOnly(dto, selected) {
    // 기본정보 (HTML에 존재) :contentReference[oaicite:3]{index=3}
    setText("b_speakerName", selected?.speakerName ?? "-");
    setText("b_speakerId", pick(dto, "speakerKey", "SpeakerKey") ?? selected?.speakerKey ?? "-");
    setText("b_serverip", pick(dto, "serverip", "serverIp", "ServerIP", "server_ip"));

    // 채널 볼륨/사용 (여긴 기존대로 두되 키 후보만 확장)
    setText("b_bgm_vol_ch1", pick(dto, "bgmVolCh1", "BgmVolCh1", "bgm_vol_ch1"));
    setText("b_bgm_vol_ch2", pick(dto, "bgmVolCh2", "BgmVolCh2", "bgm_vol_ch2"));
    setText("b_bgm_vol_ch3", pick(dto, "bgmVolCh3", "BgmVolCh3", "bgm_vol_ch3"));
    setText("b_bgm_vol_ch4", pick(dto, "bgmVolCh4", "BgmVolCh4", "bgm_vol_ch4"));

    setText("b_alert_vol_ch1", pick(dto, "alertVolCh1", "AlertVolCh1", "alert_vol_ch1"));
    setText("b_alert_vol_ch2", pick(dto, "alertVolCh2", "AlertVolCh2", "alert_vol_ch2"));
    setText("b_alert_vol_ch3", pick(dto, "alertVolCh3", "AlertVolCh3", "alert_vol_ch3"));
    setText("b_alert_vol_ch4", pick(dto, "alertVolCh4", "AlertVolCh4", "alert_vol_ch4"));

    setText("b_fm_vol_ch1", pick(dto, "fmVolCh1", "FmVolCh1", "fm_vol_ch1"));
    setText("b_fm_vol_ch2", pick(dto, "fmVolCh2", "FmVolCh2", "fm_vol_ch2"));
    setText("b_fm_vol_ch3", pick(dto, "fmVolCh3", "FmVolCh3", "fm_vol_ch3"));
    setText("b_fm_vol_ch4", pick(dto, "fmVolCh4", "FmVolCh4", "fm_vol_ch4"));

    setText("b_useCh1", pick(dto, "useCh1", "UseCh1", "use_ch1"));
    setText("b_useCh2", pick(dto, "useCh2", "UseCh2", "use_ch2"));
    setText("b_useCh3", pick(dto, "useCh3", "UseCh3", "use_ch3"));
    setText("b_useCh4", pick(dto, "useCh4", "UseCh4", "use_ch4"));

    // ✅ 기타 설정정보 (HTML id 존재) :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5} :contentReference[oaicite:6]{index=6}
    setText("b_TTARegionCode", pick(dto, "TTARegionCode", "ttaRegionCode", "tta_region_code"));
    setText("b_DMBFrequency1", pick(dto, "DMBFrequency1", "dmbFrequency1", "dmb_frequency1"));
    setText("b_DMBFrequency2", pick(dto, "DMBFrequency2", "dmbFrequency2", "dmb_frequency2"));

    setText("b_BGMFolderNo", pick(dto, "BGMFolderNo", "bgmFolderNo", "bgm_folder_no"));
    setText("b_BGMStatus", pick(dto, "BGMStatus", "bgmStatus", "bgm_status"));
    setText("b_MusicMode", pick(dto, "MusicMode", "musicMode", "music_mode"));

    setText("b_BGM_IN_VOL", pick(dto, "BGM_IN_VOL", "bgmInVol", "bgm_in_vol"));
    setText("b_STO_IN_VOL", pick(dto, "STO_IN_VOL", "stoInVol", "sto_in_vol"));
    setText("b_TTS_IN_VOL", pick(dto, "TTS_IN_VOL", "ttsInVol", "tts_in_vol"));
    setText("b_FM_IN_VOL", pick(dto, "FM_IN_VOL", "fmInVol", "fm_in_vol"));

    setText("b_TTS_Pitch", pick(dto, "TTS_Pitch", "ttsPitch", "tts_pitch"));
    setText("b_TTS_Speed", pick(dto, "TTS_Speed", "ttsSpeed", "tts_speed"));

    setText("b_PollingCheckTime", pick(dto, "PollingCheckTime", "pollingCheckTime", "polling_check_time"));
    setText("b_RadioFrequency", pick(dto, "RadioFrequency", "radioFrequency", "radio_frequency"));
    setText("b_RadioFrequencyRegion", pick(dto, "RadioFrequencyRegion", "radioFrequencyRegion", "radio_frequency_region"));
  },

  fillForm(s) {
    // 서버/지역/폴링
    setVal("bi_serverip", pick(s, "serverip", "serverIp", "ServerIP", "server_ip"));
    setVal("bi_TTARegionCode", pick(s, "TTARegionCode", "ttaRegionCode", "tta_region_code"));
    setVal("bi_PollingCheckTime", pick(s, "PollingCheckTime", "pollingCheckTime", "polling_check_time"));

    // DMB
    setVal("bi_DMBFrequency1", pick(s, "DMBFrequency1", "dmbFrequency1", "dmb_frequency1"));
    setVal("bi_DMBFrequency2", pick(s, "DMBFrequency2", "dmbFrequency2", "dmb_frequency2"));

    // BGM / 모드
    setVal("bi_BGMFolderNo", pick(s, "BGMFolderNo", "bgmFolderNo", "bgm_folder_no"));
    setVal("bi_BGMStatus", pick(s, "BGMStatus", "bgmStatus", "bgm_status"));
    setVal("bi_MusicMode", pick(s, "MusicMode", "musicMode", "music_mode"));

    // 입력 볼륨 (HTML id 존재) :contentReference[oaicite:3]{index=3}
    setVal("bi_BGM_IN_VOL", pick(s, "BGM_IN_VOL", "bgmInVol", "bgm_in_vol"));
    setVal("bi_STO_IN_VOL", pick(s, "STO_IN_VOL", "stoInVol", "sto_in_vol"));
    setVal("bi_TTS_IN_VOL", pick(s, "TTS_IN_VOL", "ttsInVol", "tts_in_vol"));
    setVal("bi_FM_IN_VOL", pick(s, "FM_IN_VOL", "fmInVol", "fm_in_vol"));

    // TTS
    setVal("bi_TTS_Pitch", pick(s, "TTS_Pitch", "ttsPitch", "tts_pitch"));
    setVal("bi_TTS_Speed", pick(s, "TTS_Speed", "ttsSpeed", "tts_speed"));

    // 출력 볼륨(채널별) (HTML id 존재) :contentReference[oaicite:4]{index=4}
    setVal("bi_bgm_vol_ch1", pick(s, "bgmVolCh1", "bgm_vol_ch1", "bgmVolCH1"));
    setVal("bi_bgm_vol_ch2", pick(s, "bgmVolCh2", "bgm_vol_ch2", "bgmVolCH2"));
    setVal("bi_bgm_vol_ch3", pick(s, "bgmVolCh3", "bgm_vol_ch3", "bgmVolCH3"));
    setVal("bi_bgm_vol_ch4", pick(s, "bgmVolCh4", "bgm_vol_ch4", "bgmVolCH4"));

    setVal("bi_alert_vol_ch1", pick(s, "alertVolCh1", "alert_vol_ch1", "alertVolCH1"));
    setVal("bi_alert_vol_ch2", pick(s, "alertVolCh2", "alert_vol_ch2", "alertVolCH2"));
    setVal("bi_alert_vol_ch3", pick(s, "alertVolCh3", "alert_vol_ch3", "alertVolCH3"));
    setVal("bi_alert_vol_ch4", pick(s, "alertVolCh4", "alert_vol_ch4", "alertVolCH4"));

    setVal("bi_fm_vol_ch1", pick(s, "fmVolCh1", "fm_vol_ch1", "fmVolCH1"));
    setVal("bi_fm_vol_ch2", pick(s, "fmVolCh2", "fm_vol_ch2", "fmVolCH2"));
    setVal("bi_fm_vol_ch3", pick(s, "fmVolCh3", "fm_vol_ch3", "fmVolCH3"));
    setVal("bi_fm_vol_ch4", pick(s, "fmVolCh4", "fm_vol_ch4", "fmVolCH4"));

    // 채널 사용
    setText("b_useCh1", useChText(pick(s, "useCh1")));
    setText("b_useCh2", useChText(pick(s, "useCh2")));
    setText("b_useCh3", useChText(pick(s, "useCh3")));
    setText("b_useCh4", useChText(pick(s, "useCh4")));

    // 라디오
    setVal("bi_RadioFrequency", pick(s, "RadioFrequency", "radioFrequency", "radio_frequency"));
    setVal("bi_RadioFrequencyRegion", pick(s, "RadioFrequencyRegion", "radioFrequencyRegion", "radio_frequency_region"));
    syncRangeBadges(document.getElementById("speaker_setting_modal"));

  }
};


/* =========================
  모달 컨트롤러
========================= */
const SpeakerSettingModal = {
  init() {
    const modalEl = document.getElementById("speaker_setting_modal");
    if (!modalEl) return;

    hide("area_type_o");
    show("area_type_e");

    modalEl.addEventListener("shown.bs.modal", () => {
      this.resetState();
      SpeakerList.load();
      setText("speakerTypeBadge", "설정: tb_spk_setting");
      setText("speakerTypeHint", "스피커를 선택 후 [정보 요청]을 누르세요.");
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      this.resetState();
    });

    this.bindClickList(modalEl);
    this.bindInfoRequest(modalEl);
  },

  resetState() {
    // 선택 초기화
    selectedSpeaker = null;

    // 카드 active 제거
    document.querySelectorAll(".speaker-card.active").forEach((c) => c.classList.remove("active"));

    // 설정 변경 탭 잠금 + 정보탭 표시
    enableTab("tab-config-o", false);
    showTab("tab-info-o");

    // 화면 값 초기화(존재하는 id들만 reset)
    clearTextByIds([
      "b_speakerName","b_speakerId","b_serverip",
      "b_bgm_vol_ch1","b_bgm_vol_ch2","b_bgm_vol_ch3","b_bgm_vol_ch4",
      "b_alert_vol_ch1","b_alert_vol_ch2","b_alert_vol_ch3","b_alert_vol_ch4",
      "b_fm_vol_ch1","b_fm_vol_ch2","b_fm_vol_ch3","b_fm_vol_ch4",
      "b_useCh1","b_useCh2","b_useCh3","b_useCh4",
      "b_TTARegionCode","b_DMBFrequency1","b_DMBFrequency2",
      "b_BGMFolderNo","b_BGMStatus","b_MusicMode",
      "b_BGM_IN_VOL","b_STO_IN_VOL","b_TTS_IN_VOL","b_FM_IN_VOL",
      "b_TTS_Pitch","b_TTS_Speed",
      "b_PollingCheckTime","b_RadioFrequency","b_RadioFrequencyRegion"
    ]);

    // 폼 초기화
    document.getElementById("speakerSettingFormB")?.reset?.();

    hide("area_type_o");
    show("area_type_e");
  },

  bindClickList(modalEl) {
    modalEl.addEventListener("click", (e) => {
      const card = e.target.closest(".speaker-card");
      if (!card) return;
  
      console.log("[speaker-card] clicked"); // ✅ 선택 확인용
  
      document.querySelectorAll(".speaker-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
  
      const speakerKey = card.dataset.speakerKey;
  
      const raw = SpeakerList.speakers.find((s) => String(s?.speakerKey) === String(speakerKey));
      if (!raw) return;
  
      selectedSpeaker = {
        speakerKey: raw.speakerKey,
        speakerName: raw.speakerName ?? raw.name,
        speakerId: raw.speakerId ?? raw.id
      };
  
      setText("b_speakerName", selectedSpeaker.speakerName ?? "-");
      setText("b_speakerId", selectedSpeaker.speakerKey ?? "-");
    });
  },

  bindInfoRequest(modalEl) {
    modalEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("#speakerSettingInfo");
      if (!btn) return;
  
      console.log("[speakerSettingInfo] clicked"); // 클릭 확인용

      console.log("speakerKey =", selectedSpeaker?.speakerKey);

      const dto = await SpeakerApi.getSetting(selectedSpeaker.speakerKey);
      console.log("setting dto =", dto);

      if (btn.dataset.loading === "1") return;
      btn.dataset.loading = "1";
      btn.disabled = true;
  
      try {
        if (!selectedSpeaker?.speakerKey) {
          alert("스피커를 먼저 선택해주세요.");
          return;
        }
  
        const dto = await SpeakerApi.getSetting(selectedSpeaker.speakerKey);
  
        if (!dto) {
          alert("조회된 설정 정보가 없습니다.");
          enableTab("tab-config-o", false);
          showTab("tab-info-o");
          return;
        }
  
        SettingView.fillReadOnly(dto, selectedSpeaker);
        SettingView.fillForm(dto);
  
        // ✅ 탭 활성화만
        enableTab("tab-config-o", true);
        showTab("tab-info-o");
  
      } catch (err) {
        console.error("speakerSettingInfo error:", err);
        alert("정보 요청 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.");
      } finally {
        btn.dataset.loading = "0";
        btn.disabled = false;
      }
    });
  }
  
};

document.addEventListener("DOMContentLoaded", () => {
  SpeakerSettingModal.init();
});
