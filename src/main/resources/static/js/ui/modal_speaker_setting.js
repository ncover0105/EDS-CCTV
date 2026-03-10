let selectedSpeaker = null;

const SPEAKER_ACTION_MAP = {
  bi_serverip: "ins_ServerIP",
  bi_TTARegionCode: "insSpeakerSettings",
  bi_PollingCheckTime: "ins_PollingCheckTime",

  bi_BGMFolderNo: "ins_BGMFolderNo",
  bi_BGMStatus: "insBGMStatus",
  bi_MusicMode: "insAudioMode",

  bi_BGM_IN_VOL: "ins_BGM_IN_VOL",
  bi_STO_IN_VOL: "ins_STO_IN_VOL",
  bi_TTS_IN_VOL: "ins_TTS_IN_VOL",

  bi_TTS_Pitch: "ins_TTS_Pitch",
  bi_TTS_Speed: "ins_TTS_Speed"
};

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

function clearTextByIds(ids) {
  ids.forEach((id) => setText(id, "-"));
}

function syncRangeBadges(root = document) {
  root.querySelectorAll('input[type="range"][data-sync-value]').forEach((range) => {
    const badgeId = range.getAttribute("data-sync-value");
    const badge = document.getElementById(badgeId);
    const apply = () => {
      if (badge) badge.textContent = range.value;
      // sp-range 그래디언트 CSS 변수 업데이트
      if (range.classList.contains("sp-range")) {
        const pct = (range.value - range.min) / (range.max - range.min) * 100;
        range.style.setProperty("--p", pct + "%");
      }
    };
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
  타입 영역 컨트롤
========================= */
function showTab(btnId) {

  const modal = document.getElementById("speaker_setting_modal");

  if (!modal) {
    return;
  }

  // 모든 탭 버튼 active 제거
  modal.querySelectorAll(".sp-tab").forEach(tab => {
    tab.classList.remove("active");
    tab.setAttribute("aria-selected", "false");
  });

  // 모든 pane에서 active, show, display 제거
  modal.querySelectorAll(".sp-tab-pane").forEach(pane => {
    pane.classList.remove("active", "show");
    pane.style.display = "none";  // CSS 우선순위 무시!
  });

  // 클릭한 탭 버튼 활성화
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.add("active");
  btn.setAttribute("aria-selected", "true");

  // 해당 pane 완전 활성화
  const paneId = btnId.replace("tab-", "pane-");
  const pane = document.getElementById(paneId);
  if (!pane) {
    return;
  }

  pane.classList.add("active", "show");
  pane.style.setProperty("display", "flex", "important");

}

function hideTypeAreas() {
  hide("area_empty");
  hide("area_type_a");
  hide("area_type_b");
}

function showTypeArea(type) {
  const areaKey = toUiTypeKey(type);
  hideTypeAreas();
  if (areaKey === "b") {
    show("area_type_b");
    const area = document.getElementById("area_type_b");
    if (area) area.style.display = "flex";
  } else if (areaKey === "a") {
    show("area_type_a");
    const area = document.getElementById("area_type_a");
    if (area) area.style.display = "flex";
  } else {
    show("area_empty");
    const area = document.getElementById("area_empty");
    if (area) area.style.display = "flex";
  }
}

/**
 * 타입 판별 (DTO 키 기반)
 * - B 타입 특징 키들이 있으면 B로 판단
 * - 아니면 A로 fallback
 */
function normalizeSpeakerType(type) {
  if (type === "B" || type === "A") return type;
  if (type === "O") return "B";
  if (type === "E") return "A";
  return "B"; // 기본값 B
}

function toUiTypeKey(type) {
  const t = normalizeSpeakerType(type);
  return t.toLowerCase();
}

function detectSpeakerType(dto, rawFromList) {
  const listTypeRaw = rawFromList?.speakerType ?? rawFromList?.type ?? rawFromList?.spkType;
  const listType = normalizeSpeakerType(listTypeRaw);
  if (listType) return listType;

  // DTO 특징점으로 판별
  const hasAnyBKey =
    dto &&
    (
      dto.bgmInVol !== undefined ||
      dto.stoInVol !== undefined ||
      dto.fmInVol !== undefined ||
      dto.bgmVolCh1 !== undefined ||
      dto.alertVolCh1 !== undefined ||
      dto.radioFrequency !== undefined ||
      dto.radioFrequencyRegion !== undefined ||
      dto.pollingCheckTime !== undefined ||
      dto.serverip !== undefined
    );

  return hasAnyBKey ? "B" : "A";
}

function showGlobalAlert(message, type = "warning") {
  try {
    if (window.App?.utils?.showGlobalAlert) {
      window.App.utils.showGlobalAlert(message, type);
      return;
    }
  } catch (_) { }
  alert(message);
}

function isEmptySetting(dto) {
  if (!dto) return true;
  if (typeof dto === "object" && !Array.isArray(dto) && Object.keys(dto).length === 0) return true;

  const mustHaveAny = [
    "speakerKey", "serverip",
    "bgmInVol", "stoInVol", "fmInVol",
    "bgmVolCh1", "alertVolCh1", "fmVolCh1",
    "pollingCheckTime", "radioFrequency"
  ];
  return !mustHaveAny.some((k) => dto[k] !== undefined && dto[k] !== null);
}

/* =========================
  API
========================= */
async function postBTypeAction({ speakerIds, action, extraParam = "" }) {
  const res = await fetch("/api/btype/command/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ speakerIds, action, extraParam })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || "명령 전송 실패");
  }
  return data;
}

async function pollSpeakerSetting(speakerKey, {
  retries = 6,
  intervalMs = 800,
} = {}) {
  for (let i = 0; i < retries; i++) {
    let dto = null;
    try {
      dto = await SpeakerApi.getSetting(speakerKey);
    } catch (_) {
      dto = null;
    }
    if (!isEmptySetting(dto)) return dto;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return null;
}

const SpeakerApi = {
  async list() {
    const res = await fetch("/api/btype/query/config/list");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
  },
  async getSetting(speakerKey) {
    try {
      const res = await fetch(`/api/spk/${speakerKey}/setting`);
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }
};

function getSelectedSpeakerId() {
  const el = document.querySelector(".sp-item.active");
  return el ? el.dataset.speakerId : null;
}

/* =========================
  리스트 렌더
========================= */
const SpeakerList = {
  speakers: [],
  async load() {
    const list = await SpeakerApi.list();
    this.speakers = (Array.isArray(list) ? list : []).map((spk) => ({
      ...spk,
      speakerType: normalizeSpeakerType(spk?.speakerType ?? spk?.type ?? spk?.spkType)
    }));
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
    container.querySelectorAll(".speaker-item, .sp-item").forEach(el => el.remove());

    if (!Array.isArray(this.speakers) || this.speakers.length === 0) {
      emptyMsg?.classList.remove("d-none");
      return;
    }
    emptyMsg?.classList.add("d-none");
    this.speakers.forEach(spk => {
      container.insertAdjacentHTML("beforeend", this.createCard(spk));
    });
  },
  createCard(spk) {
    const speakerKey = spk?.speakerKey ?? "";
    const speakerId = spk?.speakerId ?? "";
    const speakerType = normalizeSpeakerType(spk?.speakerType ?? spk?.type ?? spk?.spkType) ?? "B";
    const uiTypeKey = toUiTypeKey(speakerType);
    const name = safe(spk.speakerName ?? spk.name ?? speakerKey);
    const subId = safe(spk.speakerId);
    return `
    <div class="sp-item sp-type-${uiTypeKey}"
         data-speaker-key="${String(speakerKey)}"
         data-speaker-id="${String(speakerId)}"
         data-speaker-type="${String(speakerType)}">
      <div class="sp-status"></div>
      <div class="sp-item-info">
        <div class="sp-item-name">${name}</div>
        <div class="sp-item-sub">${subId}</div>
      </div>
      <i class="bi bi-chevron-right sp-item-arrow"></i>
    </div>`;
  },
};

/* =========================
  SettingView (B & A 병합)
======================== */
const SettingView = {
  fillReadOnly(dto, selected, type = "B") {
    const p = type === "B" ? "b_" : "a_";
    setText(p + "speakerName", selected?.speakerName ?? "-");
    setText(p + "speakerId", pick(dto, "speakerKey", "SpeakerKey") ?? selected?.speakerKey ?? "-");
    setText(p + "serverip", pick(dto, "serverip", "serverIp", "ServerIP", "server_ip"));

    setText(p + "bgm_vol_ch1", pick(dto, "bgmVolCh1", "BgmVolCh1", "bgm_vol_ch1"));
    setText(p + "bgm_vol_ch2", pick(dto, "bgmVolCh2", "BgmVolCh2", "bgm_vol_ch2"));
    setText(p + "bgm_vol_ch3", pick(dto, "bgmVolCh3", "BgmVolCh3", "bgm_vol_ch3"));
    setText(p + "bgm_vol_ch4", pick(dto, "bgmVolCh4", "BgmVolCh4", "bgm_vol_ch4"));

    setText(p + "alert_vol_ch1", pick(dto, "alertVolCh1", "AlertVolCh1", "alert_vol_ch1"));
    setText(p + "alert_vol_ch2", pick(dto, "alertVolCh2", "AlertVolCh2", "alert_vol_ch2"));
    setText(p + "alert_vol_ch3", pick(dto, "alertVolCh3", "AlertVolCh3", "alert_vol_ch3"));
    setText(p + "alert_vol_ch4", pick(dto, "alertVolCh4", "AlertVolCh4", "alert_vol_ch4"));

    setText(p + "fm_vol_ch1", pick(dto, "fmVolCh1", "FmVolCh1", "fm_vol_ch1"));
    setText(p + "fm_vol_ch2", pick(dto, "fmVolCh2", "FmVolCh2", "fm_vol_ch2"));
    setText(p + "fm_vol_ch3", pick(dto, "fmVolCh3", "FmVolCh3", "fm_vol_ch3"));
    setText(p + "fm_vol_ch4", pick(dto, "fmVolCh4", "FmVolCh4", "fm_vol_ch4"));

    setText(p + "useCh1", useChText(pick(dto, "useCh1", "UseCh1", "use_ch1")));
    setText(p + "useCh2", useChText(pick(dto, "useCh2", "UseCh2", "use_ch2")));
    setText(p + "useCh3", useChText(pick(dto, "useCh3", "UseCh3", "use_ch3")));
    setText(p + "useCh4", useChText(pick(dto, "useCh4", "UseCh4", "use_ch4")));

    if (type === "B") {
      setText("b_TTARegionCode", pick(dto, "TTARegionCode", "ttaRegionCode", "tta_region_code", "tta"));
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
    }
  },

  fillForm(dto, type = "B") {
    const pi = type === "B" ? "bi_" : "ai_";
    setVal(pi + "serverip", pick(dto, "serverip", "serverIp", "ServerIP", "server_ip"));
    setVal(pi + "PollingCheckTime", pick(dto, "PollingCheckTime", "pollingCheckTime", "polling_check_time"));
    setVal(pi + "useCh1", pick(dto, "useCh1", "UseCh1", "use_ch1") ?? "1");
    setVal(pi + "useCh2", pick(dto, "useCh2", "UseCh2", "use_ch2") ?? "1");
    setVal(pi + "useCh3", pick(dto, "useCh3", "UseCh3", "use_ch3") ?? "1");
    setVal(pi + "useCh4", pick(dto, "useCh4", "UseCh4", "use_ch4") ?? "1");

    if (type === "B") {
      setVal("bi_TTARegionCode", pick(dto, "TTARegionCode", "ttaRegionCode", "tta_region_code", "tta"));
      setVal("bi_DMBFrequency1", pick(dto, "DMBFrequency1", "dmbFrequency1", "dmb_frequency1"));
      setVal("bi_DMBFrequency2", pick(dto, "DMBFrequency2", "dmbFrequency2", "dmb_frequency2"));
      setVal("bi_BGMFolderNo", pick(dto, "BGMFolderNo", "bgmFolderNo", "bgm_folder_no"));
      setVal("bi_BGMStatus", pick(dto, "BGMStatus", "bgmStatus", "bgm_status"));
      setVal("bi_MusicMode", pick(dto, "MusicMode", "musicMode", "music_mode"));
      setVal("bi_RadioFrequency", pick(dto, "RadioFrequency", "radioFrequency", "radio_frequency"));
      setVal("bi_RadioFrequencyRegion", pick(dto, "RadioFrequencyRegion", "radioFrequencyRegion", "radio_frequency_region"));
      setVal("bi_BGM_IN_VOL", pick(dto, "BGM_IN_VOL", "bgmInVol", "bgm_in_vol"));
      setVal("bi_STO_IN_VOL", pick(dto, "STO_IN_VOL", "stoInVol", "sto_in_vol"));
      setVal("bi_TTS_IN_VOL", pick(dto, "TTS_IN_VOL", "ttsInVol", "tts_in_vol"));
      setVal("bi_FM_IN_VOL", pick(dto, "FM_IN_VOL", "fmInVol", "fm_in_vol"));
      setVal("bi_TTS_Pitch", pick(dto, "TTS_Pitch", "ttsPitch", "tts_pitch"));
      setVal("bi_TTS_Speed", pick(dto, "TTS_Speed", "ttsSpeed", "tts_speed"));
      setVal("bi_bgm_vol_ch1", pick(dto, "bgmVolCh1", "bgm_vol_ch1"));
      setVal("bi_bgm_vol_ch2", pick(dto, "bgmVolCh2", "bgm_vol_ch2"));
      setVal("bi_bgm_vol_ch3", pick(dto, "bgmVolCh3", "bgm_vol_ch3"));
      setVal("bi_bgm_vol_ch4", pick(dto, "bgmVolCh4", "bgm_vol_ch4"));
      setVal("bi_alert_vol_ch1", pick(dto, "alertVolCh1", "alert_vol_ch1"));
      setVal("bi_alert_vol_ch2", pick(dto, "alertVolCh2", "alert_vol_ch2"));
      setVal("bi_alert_vol_ch3", pick(dto, "alertVolCh3", "alert_vol_ch3"));
      setVal("bi_alert_vol_ch4", pick(dto, "alertVolCh4", "alert_vol_ch4"));
      setVal("bi_fm_vol_ch1", pick(dto, "fmVolCh1", "fm_vol_ch1"));
      setVal("bi_fm_vol_ch2", pick(dto, "fmVolCh2", "fm_vol_ch2"));
      setVal("bi_fm_vol_ch3", pick(dto, "fmVolCh3", "fm_vol_ch3"));
      setVal("bi_fm_vol_ch4", pick(dto, "fmVolCh4", "fm_vol_ch4"));
    }
    syncRangeBadges(document.getElementById("speaker_setting_modal"));
  },
};

/* =========================
  모달 컨트롤러
========================= */
const SpeakerSettingModal = {
  AUTO_OPEN_CONFIG_TAB: true,

  init() {
    const modalEl = document.getElementById("speaker_setting_modal");
    if (!modalEl) return;

    modalEl.addEventListener("click", (e) => {
      const tab = e.target.closest(".sp-tab");
      if (tab?.id?.startsWith("tab-")) {
        e.stopPropagation();
        showTab(tab.id);
        return;
      }
    }, true);

    modalEl.addEventListener("shown.bs.modal", () => {
      this.resetState();
      SpeakerList.load();
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      this.resetState();
    });

    this.bindClickList(modalEl);
    this.bindInfoRequest(modalEl);

  },

  resetState() {
    selectedSpeaker = null;
    document.querySelectorAll(".sp-item.active").forEach((c) => c.classList.remove("active"));
    showTab("tab-info-b");
    showTypeArea(null);

    const allIds = [
      "b_speakerName", "b_speakerId", "b_serverip",
      "b_bgm_vol_ch1", "b_bgm_vol_ch2", "b_bgm_vol_ch3", "b_bgm_vol_ch4",
      "b_alert_vol_ch1", "b_alert_vol_ch2", "b_alert_vol_ch3", "b_alert_vol_ch4",
      "b_fm_vol_ch1", "b_fm_vol_ch2", "b_fm_vol_ch3", "b_fm_vol_ch4",
      "b_useCh1", "b_useCh2", "b_useCh3", "b_useCh4",
      "b_TTARegionCode", "b_DMBFrequency1", "b_DMBFrequency2",
      "b_BGMFolderNo", "b_BGMStatus", "b_MusicMode",
      "b_BGM_IN_VOL", "b_STO_IN_VOL", "b_TTS_IN_VOL", "b_FM_IN_VOL",
      "b_TTS_Pitch", "b_TTS_Speed",
      "b_PollingCheckTime", "b_RadioFrequency", "b_RadioFrequencyRegion",
      "a_speakerName", "a_speakerId", "a_serverip",
      "a_bgm_vol_ch1", "a_bgm_vol_ch2", "a_bgm_vol_ch3", "a_bgm_vol_ch4",
      "a_alert_vol_ch1", "a_alert_vol_ch2", "a_alert_vol_ch3", "a_alert_vol_ch4",
      "a_fm_vol_ch1", "a_fm_vol_ch2", "a_fm_vol_ch3", "a_fm_vol_ch4",
      "a_useCh1", "a_useCh2", "a_useCh3", "a_useCh4"
    ];
    clearTextByIds(allIds);
    document.getElementById("speakerSettingFormB")?.reset?.();
    document.getElementById("speakerSettingFormA")?.reset?.();
  },

  resetViewOnlyKeepSelection() {
    const type = selectedSpeaker?.speakerType ?? "B";
    showTab(`tab-info-${toUiTypeKey(type)}`);

    const allIds = [
      "b_speakerName", "b_speakerId", "b_serverip",
      "b_bgm_vol_ch1", "b_bgm_vol_ch2", "b_bgm_vol_ch3", "b_bgm_vol_ch4",
      "b_alert_vol_ch1", "b_alert_vol_ch2", "b_alert_vol_ch3", "b_alert_vol_ch4",
      "b_fm_vol_ch1", "b_fm_vol_ch2", "b_fm_vol_ch3", "b_fm_vol_ch4",
      "b_useCh1", "b_useCh2", "b_useCh3", "b_useCh4",
      "b_TTARegionCode", "b_DMBFrequency1", "b_DMBFrequency2",
      "b_BGMFolderNo", "b_BGMStatus", "b_MusicMode",
      "b_BGM_IN_VOL", "b_STO_IN_VOL", "b_TTS_IN_VOL", "b_FM_IN_VOL",
      "b_TTS_Pitch", "b_TTS_Speed",
      "b_PollingCheckTime", "b_RadioFrequency", "b_RadioFrequencyRegion",
      "a_speakerName", "a_speakerId", "a_serverip",
      "a_bgm_vol_ch1", "a_bgm_vol_ch2", "a_bgm_vol_ch3", "a_bgm_vol_ch4",
      "a_alert_vol_ch1", "a_alert_vol_ch2", "a_alert_vol_ch3", "a_alert_vol_ch4",
      "a_fm_vol_ch1", "a_fm_vol_ch2", "a_fm_vol_ch3", "a_fm_vol_ch4",
      "a_useCh1", "a_useCh2", "a_useCh3", "a_useCh4"
    ];
    clearTextByIds(allIds);
    document.getElementById("speakerSettingFormB")?.reset?.();
    document.getElementById("speakerSettingFormA")?.reset?.();
  },

  bindClickList(modalEl) {
    modalEl.addEventListener("click", e => {

      const card = e.target.closest(".sp-item");
      if (!card) return;

      if (card.classList.contains("active")) {
        card.classList.remove("active");
        selectedSpeaker = null;
        this.resetState();
        return;
      }

      document.querySelectorAll(".sp-item").forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      const speakerKey = card.dataset.speakerKey;
      const raw = SpeakerList.speakers.find(s => String(s?.speakerKey) === String(speakerKey));
      if (!raw) return;

      selectedSpeaker = {
        speakerKey: raw.speakerKey,
        speakerName: raw.speakerName ?? raw.name ?? `KEY:${speakerKey}`,
        speakerId: raw.speakerId ?? raw.id,
        speakerType: normalizeSpeakerType(raw.speakerType ?? raw.type ?? raw.spkType),
      };

      this.resetViewOnlyKeepSelection();
      showTypeArea(selectedSpeaker.speakerType);

      // 선택된 기본 정보 즉시 매핑
      const p = selectedSpeaker.speakerType === "B" ? "b_" : "a_";
      setText(p + "speakerName", selectedSpeaker.speakerName);
      setText(p + "speakerId", selectedSpeaker.speakerKey);
    });
  },

  bindInfoRequest(modalEl) {
    modalEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("#speakerSettingInfo");
      if (!btn) return;

      if (!selectedSpeaker?.speakerKey) {
        showGlobalAlert("스피커를 먼저 선택해주세요.", "warning");
        return;
      }

      const deviceId = selectedSpeaker.speakerId;
      if (btn.dataset.loading === "1") return;
      btn.dataset.loading = "1";
      btn.disabled = true;

      try {
        let requestErr = null;
        if (deviceId) {
          try {
            await postBTypeAction({
              speakerIds: [String(deviceId)],
              action: "getSpeakerSettings",
              extraParam: ""
            });
          } catch (err) {
            requestErr = err;
          }
        }

        const dto = await pollSpeakerSetting(selectedSpeaker.speakerKey, {
          retries: 8,
          intervalMs: 700
        });

        if (isEmptySetting(dto)) {
          this.resetViewOnlyKeepSelection();
          const p = selectedSpeaker.speakerType === "B" ? "b_" : "a_";
          setText(p + "speakerName", selectedSpeaker.speakerName);
          setText(p + "speakerId", selectedSpeaker.speakerKey);
          showGlobalAlert("조회된 설정 정보가 없습니다. (응답 대기 시간 초과)", "warning");
          return;
        }

        const raw = SpeakerList.speakers.find(s => String(s?.speakerKey) === String(selectedSpeaker.speakerKey));
        const type = detectSpeakerType(dto, raw);
        selectedSpeaker.speakerType = type; // 최신 타입으로 업데이트

        showTypeArea(type);
        SettingView.fillReadOnly(dto, selectedSpeaker, type);
        SettingView.fillForm(dto, type);

        const uiTypeKey = toUiTypeKey(type);
        const targetTab = this.AUTO_OPEN_CONFIG_TAB ? `tab-config-${uiTypeKey}` : `tab-info-${uiTypeKey}`;
        showTab(targetTab);

        if (requestErr) {
          showGlobalAlert(`데이터 요청은 실패, 이전 데이터를 불러옵니다.`, "warning");
        }
      } catch (err) {
        this.resetViewOnlyKeepSelection();
        showGlobalAlert(`정보 요청 중 오류: ${err.message}`, "danger");
      } finally {
        btn.dataset.loading = "0";
        btn.disabled = false;
      }
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  SpeakerSettingModal.init();
});

