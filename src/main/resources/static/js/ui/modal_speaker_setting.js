/* ==========================================================
 * modal_speaker_setting.js (SpeakerSettingDTO 기준) - FINAL
 * - 정보 요청 전: A/B 영역 모두 숨김
 * - 정보 요청 성공 시: 타입 판별 후 해당 영역만 표시
 * - 데이터 없음/오류: 초기화 + 알림
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
  root
    .querySelectorAll('input[type="range"][data-sync-value]')
    .forEach((range) => {
      const badgeId = range.getAttribute("data-sync-value");
      const badge = document.getElementById(badgeId);
      const apply = () => {
        if (badge) badge.textContent = range.value;
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
function hideTypeAreas() {
  hide("area_type_e");
  hide("area_type_o");
}

function showTypeArea(type) {
  if (type === "A") {
    show("area_type_e");
    hide("area_type_o");
  } else if (type === "B") {
    show("area_type_o");
    hide("area_type_e");
  } else {
    hideTypeAreas();
  }
}

/**
 * 타입 판별 (DTO 키 기반)
 * - B 타입(tb_spk_setting) 특징 키들이 있으면 B로 판단
 * - 아니면 A로 fallback
 */
function detectSpeakerType(dto, rawFromList) {
  // 리스트에서 타입이 내려오는 경우(있으면 최우선)
  const listType = rawFromList?.speakerType ?? rawFromList?.type ?? rawFromList?.spkType;
  if (listType === "A" || listType === "B") return listType;

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
  // App.utils.showGlobalAlert 있으면 사용, 없으면 alert fallback
  try {
    if (window.App?.utils?.showGlobalAlert) {
      window.App.utils.showGlobalAlert(message, type);
      return;
    }
  } catch (_) {}
  alert(message);
}

/** dto가 null/{} 이거나 핵심키가 하나도 없으면 "데이터 없음" 처리 */
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
const SpeakerApi = {
  async list() {
    const res = await fetch("/api/btype/query/config/list");
    if (!res.ok) return [];
    return (await res.json()) ?? [];
  },

  async getSetting(speakerKey) {
    const res = await fetch(`/api/spk/${speakerKey}/setting`);
    if (!res.ok) return null; // 404 포함
    return await res.json();
  },
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
  },
};

/* =========================
  B 타입 SettingView (네 파일 그대로)
========================= */
const SettingView = {
  fillReadOnly(dto, selected) {
    setText("b_speakerName", selected?.speakerName ?? "-");
    setText("b_speakerId", pick(dto, "speakerKey", "SpeakerKey") ?? selected?.speakerKey ?? "-");
    setText("b_serverip", pick(dto, "serverip", "serverIp", "ServerIP", "server_ip"));

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

    setText("b_useCh1", useChText(pick(dto, "useCh1", "UseCh1", "use_ch1")));
    setText("b_useCh2", useChText(pick(dto, "useCh2", "UseCh2", "use_ch2")));
    setText("b_useCh3", useChText(pick(dto, "useCh3", "UseCh3", "use_ch3")));
    setText("b_useCh4", useChText(pick(dto, "useCh4", "UseCh4", "use_ch4")));

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
  },

  fillForm(dto) {
    setVal("bi_serverip", pick(dto, "serverip", "serverIp", "ServerIP", "server_ip"));
    setVal("bi_TTARegionCode", pick(dto, "TTARegionCode", "ttaRegionCode", "tta_region_code", "tta"));
    setVal("bi_PollingCheckTime", pick(dto, "PollingCheckTime", "pollingCheckTime", "polling_check_time"));

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

    setVal("bi_bgm_vol_ch1", pick(dto, "bgmVolCh1", "bgm_vol_ch1", "bgmVolCH1"));
    setVal("bi_bgm_vol_ch2", pick(dto, "bgmVolCh2", "bgm_vol_ch2", "bgmVolCH2"));
    setVal("bi_bgm_vol_ch3", pick(dto, "bgmVolCh3", "bgm_vol_ch3", "bgmVolCH3"));
    setVal("bi_bgm_vol_ch4", pick(dto, "bgmVolCh4", "bgm_vol_ch4", "bgmVolCH4"));

    setVal("bi_alert_vol_ch1", pick(dto, "alertVolCh1", "alert_vol_ch1", "alertVolCH1"));
    setVal("bi_alert_vol_ch2", pick(dto, "alertVolCh2", "alert_vol_ch2", "alertVolCH2"));
    setVal("bi_alert_vol_ch3", pick(dto, "alertVolCh3", "alert_vol_ch3", "alertVolCH3"));
    setVal("bi_alert_vol_ch4", pick(dto, "alertVolCh4", "alert_vol_ch4", "alertVolCH4"));

    setVal("bi_fm_vol_ch1", pick(dto, "fmVolCh1", "fm_vol_ch1", "fmVolCH1"));
    setVal("bi_fm_vol_ch2", pick(dto, "fmVolCh2", "fm_vol_ch2", "fmVolCH2"));
    setVal("bi_fm_vol_ch3", pick(dto, "fmVolCh3", "fm_vol_ch3", "fmVolCH3"));
    setVal("bi_fm_vol_ch4", pick(dto, "fmVolCh4", "fm_vol_ch4", "fmVolCH4"));

    setVal("bi_useCh1", pick(dto, "useCh1", "UseCh1", "use_ch1") ?? "1");
    setVal("bi_useCh2", pick(dto, "useCh2", "UseCh2", "use_ch2") ?? "1");
    setVal("bi_useCh3", pick(dto, "useCh3", "UseCh3", "use_ch3") ?? "1");
    setVal("bi_useCh4", pick(dto, "useCh4", "UseCh4", "use_ch4") ?? "1");

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

    // ✅ 처음엔 A/B 둘 다 숨김
    hideTypeAreas();

    modalEl.addEventListener("shown.bs.modal", () => {
      this.resetState();
      SpeakerList.load();

      setText("speakerTypeBadge", "스피커");
      setText("speakerTypeHint", "스피커 선택 후 설정 정보를 조회할 수 있습니다.");
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      this.resetState();
    });

    this.bindClickList(modalEl);
    this.bindInfoRequest(modalEl);
  },

  // 모달 전체 초기화(선택까지 초기화)
  resetState() {
    selectedSpeaker = null;

    document.querySelectorAll(".speaker-card.active").forEach((c) => c.classList.remove("active"));

    // 탭 잠금
    enableTab("tab-config-o", false);
    enableTab("tab-config-e", false);

    // A/B 영역 숨김
    hideTypeAreas();

    // (B) 화면 값 초기화 (필요한 id들)
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

    document.getElementById("speakerSettingFormB")?.reset?.();
  },

  // 선택은 유지하고 “조회 화면만” 초기화 (조회 실패/데이터 없음에서 사용)
  resetViewOnlyKeepSelection() {
    // 탭 잠금 + 영역 숨김
    enableTab("tab-config-o", false);
    enableTab("tab-config-e", false);
    hideTypeAreas();

    // 값 초기화
    clearTextByIds([
      "b_serverip",
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

    document.getElementById("speakerSettingFormB")?.reset?.();
  },

  bindClickList(modalEl) {
    modalEl.addEventListener("click", (e) => {
      const card = e.target.closest(".speaker-card");
      if (!card) return;

      document.querySelectorAll(".speaker-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      const speakerKey = card.dataset.speakerKey;
      const raw = SpeakerList.speakers.find((s) => String(s?.speakerKey) === String(speakerKey));
      if (!raw) return;

      selectedSpeaker = {
        speakerKey: raw.speakerKey,
        speakerName: raw.speakerName ?? raw.name ?? `KEY:${speakerKey}`,
        speakerId: raw.speakerId ?? raw.id,
      };

      // 기본정보 일부 표기(선택 표시)
      setText("b_speakerName", selectedSpeaker.speakerName ?? "-");
      setText("b_speakerId", selectedSpeaker.speakerKey ?? "-");

      // 배지/힌트
      setText("speakerTypeBadge", `${selectedSpeaker.speakerName}`);
      setText("speakerTypeHint", "선택된 스피커의 설정 정보를 조회할 수 있습니다.");

      // ✅ 정보 요청 전이므로 A/B 영역은 숨김 유지 + 탭 잠금
      this.resetViewOnlyKeepSelection();
      // 선택 기본정보는 유지
      setText("b_speakerName", selectedSpeaker.speakerName ?? "-");
      setText("b_speakerId", selectedSpeaker.speakerKey ?? "-");
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

      if (btn.dataset.loading === "1") return;
      btn.dataset.loading = "1";
      btn.disabled = true;

      try {
        // 조회
        const dto = await SpeakerApi.getSetting(selectedSpeaker.speakerKey);
        console.log("setting dto =", dto);

        // 데이터 없음/조회불가
        if (isEmptySetting(dto)) {
          this.resetViewOnlyKeepSelection();
          setText("b_speakerName", selectedSpeaker.speakerName ?? "-");
          setText("b_speakerId", selectedSpeaker.speakerKey ?? "-");
          setText("speakerTypeHint", "설정 정보를 불러올 수 없습니다.");
          showGlobalAlert("조회된 설정 정보가 없습니다.", "warning");
          return;
        }

        // 타입 판별
        const raw = SpeakerList.speakers.find(
          (s) => String(s?.speakerKey) === String(selectedSpeaker.speakerKey)
        );
        const type = detectSpeakerType(dto, raw);

        // 타입 영역 표시
        showTypeArea(type);

        // 배지/힌트 업데이트
        setText("speakerTypeBadge", `타입: ${type} · ${selectedSpeaker.speakerName}`);
        setText("speakerTypeHint", "설정 정보가 업데이트되었습니다.");

        // 타입별 바인딩/탭 활성화
        if (type === "B") {
          SettingView.fillReadOnly(dto, selectedSpeaker);
          SettingView.fillForm(dto);

          enableTab("tab-config-o", true);
          if (this.AUTO_OPEN_CONFIG_TAB) showTab("tab-config-o");
          else showTab("tab-info-o");
        } else {
          // A 타입: A 바인딩이 있으면 호출 (없어도 영역 표시/탭 활성화는 동작)
          if (window.SettingViewA?.fillReadOnly) window.SettingViewA.fillReadOnly(dto, selectedSpeaker);
          if (window.SettingViewA?.fillForm) window.SettingViewA.fillForm(dto);

          enableTab("tab-config-e", true);
          if (this.AUTO_OPEN_CONFIG_TAB) showTab("tab-config-e");
          else showTab("tab-info-e");
        }

      } catch (err) {
        console.error("speakerSettingInfo error:", err);

        this.resetViewOnlyKeepSelection();
        setText("b_speakerName", selectedSpeaker.speakerName ?? "-");
        setText("b_speakerId", selectedSpeaker.speakerKey ?? "-");
        setText("speakerTypeHint", "설정 정보를 불러올 수 없습니다.");

        showGlobalAlert("정보 요청 중 오류가 발생했습니다.", "danger");
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
