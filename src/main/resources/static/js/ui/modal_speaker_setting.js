let selectedSpeaker = null;
const SPEAKER_TYPE = "B";
const DEBUG = false;
const SETTING_REFRESH_WAIT_MS = 15000;
const INFO_BUTTON_DEFAULT_HTML = '<i class="bi bi-arrow-down-circle"></i> 데이터 요청';

function logDebug(...args) {
  if (!DEBUG) return;
  console.debug(...args);
}

function logWarn(...args) {
  if (!DEBUG) return;
  console.warn(...args);
}

const SPEAKER_ACTION_MAP = {
  bi_serverip: "ins_ServerIP",
  bi_speakerid: "ins_speakerid",
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

const SPEAKER_FIELD_DEFS = [
  { readId: "b_serverip", formId: "bi_serverip", keys: ["serverip", "serverIp", "ServerIP", "server_ip"] },
  { formId: "bi_speakerid", keys: ["speakerId", "speaker_id", "id"] },
  { readId: "b_bgm_vol_ch1", formId: "bi_bgm_vol_ch1", keys: ["bgmVolCh1", "BgmVolCh1", "bgm_vol_ch1"] },
  { readId: "b_bgm_vol_ch2", formId: "bi_bgm_vol_ch2", keys: ["bgmVolCh2", "BgmVolCh2", "bgm_vol_ch2"] },
  { readId: "b_bgm_vol_ch3", formId: "bi_bgm_vol_ch3", keys: ["bgmVolCh3", "BgmVolCh3", "bgm_vol_ch3"] },
  { readId: "b_bgm_vol_ch4", formId: "bi_bgm_vol_ch4", keys: ["bgmVolCh4", "BgmVolCh4", "bgm_vol_ch4"] },
  { readId: "b_alert_vol_ch1", formId: "bi_alert_vol_ch1", keys: ["alertVolCh1", "AlertVolCh1", "alert_vol_ch1"] },
  { readId: "b_alert_vol_ch2", formId: "bi_alert_vol_ch2", keys: ["alertVolCh2", "AlertVolCh2", "alert_vol_ch2"] },
  { readId: "b_alert_vol_ch3", formId: "bi_alert_vol_ch3", keys: ["alertVolCh3", "AlertVolCh3", "alert_vol_ch3"] },
  { readId: "b_alert_vol_ch4", formId: "bi_alert_vol_ch4", keys: ["alertVolCh4", "AlertVolCh4", "alert_vol_ch4"] },
  { readId: "b_fm_vol_ch1", formId: "bi_fm_vol_ch1", keys: ["fmVolCh1", "FmVolCh1", "fm_vol_ch1"] },
  { readId: "b_fm_vol_ch2", formId: "bi_fm_vol_ch2", keys: ["fmVolCh2", "FmVolCh2", "fm_vol_ch2"] },
  { readId: "b_fm_vol_ch3", formId: "bi_fm_vol_ch3", keys: ["fmVolCh3", "FmVolCh3", "fm_vol_ch3"] },
  { readId: "b_fm_vol_ch4", formId: "bi_fm_vol_ch4", keys: ["fmVolCh4", "FmVolCh4", "fm_vol_ch4"] },
  {
    readId: "b_useCh1",
    formId: "bi_useCh1",
    keys: ["useCh1", "UseCh1", "use_ch1"],
    readFormatter: useChText,
    formDefault: "1"
  },
  {
    readId: "b_useCh2",
    formId: "bi_useCh2",
    keys: ["useCh2", "UseCh2", "use_ch2"],
    readFormatter: useChText,
    formDefault: "1"
  },
  {
    readId: "b_useCh3",
    formId: "bi_useCh3",
    keys: ["useCh3", "UseCh3", "use_ch3"],
    readFormatter: useChText,
    formDefault: "1"
  },
  {
    readId: "b_useCh4",
    formId: "bi_useCh4",
    keys: ["useCh4", "UseCh4", "use_ch4"],
    readFormatter: useChText,
    formDefault: "1"
  },
  { readId: "b_TTARegionCode", formId: "bi_TTARegionCode", keys: ["TTARegionCode", "ttaRegionCode", "tta_region_code", "tta"] },
  { readId: "b_DMBFrequency1", formId: "bi_DMBFrequency1", keys: ["DMBFrequency1", "dmbFrequency1", "dmb_frequency1"] },
  { readId: "b_DMBFrequency2", formId: "bi_DMBFrequency2", keys: ["DMBFrequency2", "dmbFrequency2", "dmb_frequency2"] },
  { readId: "b_BGMFolderNo", formId: "bi_BGMFolderNo", keys: ["BGMFolderNo", "bgmFolderNo", "bgm_folder_no"] },
  { readId: "b_BGMStatus", formId: "bi_BGMStatus", keys: ["BGMStatus", "bgmStatus", "bgm_status"], readFormatter: bgmStatusText },
  { readId: "b_MusicMode", formId: "bi_MusicMode", keys: ["MusicMode", "musicMode", "music_mode"], readFormatter: musicModeText },
  { readId: "b_BGM_IN_VOL", formId: "bi_BGM_IN_VOL", keys: ["BGM_IN_VOL", "bgmInVol", "bgm_in_vol"] },
  { readId: "b_STO_IN_VOL", formId: "bi_STO_IN_VOL", keys: ["STO_IN_VOL", "stoInVol", "sto_in_vol"] },
  { readId: "b_TTS_IN_VOL", formId: "bi_TTS_IN_VOL", keys: ["TTS_IN_VOL", "ttsInVol", "tts_in_vol"] },
  { readId: "b_FM_IN_VOL", formId: "bi_FM_IN_VOL", keys: ["FM_IN_VOL", "fmInVol", "fm_in_vol"] },
  { readId: "b_TTS_Pitch", formId: "bi_TTS_Pitch", keys: ["TTS_Pitch", "ttsPitch", "tts_pitch"] },
  { readId: "b_TTS_Speed", formId: "bi_TTS_Speed", keys: ["TTS_Speed", "ttsSpeed", "tts_speed"] },
  { readId: "b_PollingCheckTime", formId: "bi_PollingCheckTime", keys: ["PollingCheckTime", "pollingCheckTime", "polling_check_time"] },
  { readId: "b_RadioFrequency", formId: "bi_RadioFrequency", keys: ["RadioFrequency", "radioFrequency", "radio_frequency"] },
  { readId: "b_RadioFrequencyRegion", formId: "bi_RadioFrequencyRegion", keys: ["RadioFrequencyRegion", "radioFrequencyRegion", "radio_frequency_region"] }
];

const SPEAKER_READONLY_CLEAR_IDS = ["b_speakerName", "b_speakerId", ...SPEAKER_FIELD_DEFS.map(({ readId }) => readId)];
const EMPTY_SETTING_KEYS = [...new Set([
  "speakerKey",
  "SpeakerKey",
  ...SPEAKER_FIELD_DEFS.flatMap(({ keys }) => keys)
])];

function convertIpToReversedHex(ip) {
  if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return "";
  return ip
    .split(".")
    .map((v) => parseInt(v, 10).toString(16).padStart(2, "0"))
    .reverse()
    .join("")
    .toUpperCase();
}

function convertToReversedHex(value, byteLength) {
  // 숫자를 16진수로 변환한 후, 원하는 바이트 길이에 맞게 앞에 0을 채운다.
  let hexValue = parseInt(value).toString(16).padStart(byteLength * 2, '0'); // 2자리씩 채움 (예: 960 -> 0960, 2400 -> 0960 -> 096000)
  // 두 자리씩 나누어 리버스
  let reversedHex = '';
  for (let i = 0; i < hexValue.length; i += 2) {
    reversedHex = hexValue.substr(i, 2) + reversedHex; // 두 자리씩 리버스
  }
  return reversedHex; // 리버스된 16진수 반환
}

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

function bgmStatusText(v) {
  if (v === 0 || v === "0") return "ON";
  if (v === 1 || v === "1") return "OFF";
  return "-";
}

function musicModeText(v) {
  if (v === 0 || v === "0") return "BGM";
  if (v === 1 || v === "1") return "FM";
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
  if (!root) return;
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
    if (range.dataset.rangeBound !== "1") {
      range.addEventListener("input", apply);
      range.dataset.rangeBound = "1";
    }
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

  // 모든 pane에서 active/show 제거 후 CSS가 표시 상태를 관리한다.
  modal.querySelectorAll(".sp-tab-pane").forEach(pane => {
    pane.classList.remove("active", "show");
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
}

function hideTypeAreas() {
  hide("area_empty");
  hide("area_type_b");
}

function showTypeArea(type) {
  // hideTypeAreas();
  if (!type) {
    show("area_empty");
    const area = document.getElementById("area_empty");
    if (area) area.style.display = "flex";
    return;
  }

  show("area_type_b");
  const area = document.getElementById("area_type_b");
  if (area) area.style.display = "flex";
}

function requestPassword({ title = "비밀번호 확인", message = "비밀번호를 입력하세요." } = {}) {
  return new Promise((resolve) => {
    if (!window.PasswordModal?.show) {
      notify("비밀번호 입력 모달을 사용할 수 없습니다.", "danger");
      resolve(null);
      return;
    }

    window.PasswordModal.show({
      title,
      message,
      onConfirm: (password) => resolve(password),
      onCancel: () => resolve(null)
    });
  });
}

let autoApprovalCache = null;
async function isAutoApprovalEnabled() {
  if (autoApprovalCache !== null) return autoApprovalCache;
  try {
    const res = await fetch("/api/settings", { headers: { "Accept": "application/json" } });
    if (!res.ok) return false;
    const setting = await res.json();
    autoApprovalCache = !!setting?.autoApproval;
    return autoApprovalCache;
  } catch (_) {
    return false;
  }
}

function requestPasswordWithServerValidation({
  title = "비밀번호 확인",
  message = "비밀번호를 입력하세요.",
  onVerify
} = {}) {
  return new Promise(async (resolve) => {
    if (await isAutoApprovalEnabled()) {
      try {
        const result = typeof onVerify === "function" ? await onVerify("") : null;
        resolve({ ok: true, password: "", result, autoApproved: true });
      } catch (err) {
        resolve({ ok: false, error: err, autoApproved: true });
      }
      return;
    }

    if (!window.PasswordModal?.show) {
      notify("비밀번호 입력 모달을 사용할 수 없습니다.", "danger");
      resolve({ ok: false, cancelled: true });
      return;
    }

    window.PasswordModal.show({
      title,
      message,
      closeOnConfirm: false,
      onConfirm: async (password, modal) => {
        try {
          const result = typeof onVerify === "function" ? await onVerify(password) : null;
          modal.hide();
          resolve({ ok: true, password, result });
        } catch (err) {
          if (isPasswordError(err)) {
            modal.showError(err.message || "비밀번호가 올바르지 않습니다.");
            return;
          }

          modal.hide();
          resolve({ ok: false, error: err });
        }
      },
      onCancel: () => resolve({ ok: false, cancelled: true })
    });
  });
}

function isPasswordError(err) {
  const message = String(err?.message ?? err ?? "").toLowerCase();
  return [
    "password",
    "비밀번호",
    "unauthorized",
    "forbidden",
    "auth",
    "401",
    "403"
  ].some((keyword) => message.includes(keyword));
}

function isEmptySetting(dto) {
  if (!dto) return true;
  if (typeof dto === "object" && !Array.isArray(dto) && Object.keys(dto).length === 0) return true;
  return !EMPTY_SETTING_KEYS.some((k) => dto[k] !== undefined && dto[k] !== null && dto[k] !== "");
}

/* =========================
  API
========================= */
async function postBTypeAction({ speakerIds, action, extraParam = "", password = "" }) {
  const res = await fetch("/api/btype/command/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ speakerIds, action, extraParam, password })
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let msg = "명령 전송 실패";
    try {
      const json = JSON.parse(txt);
      msg = json.message || msg;
    } catch (_) {
      msg = txt || msg;
    }
    throw new Error(msg);
  }

  const data = await res.json().catch(() => null);
  if (!data || !data.ok) {
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
  async list({ force = false } = {}) {
    if (window.SpeakerDataCache?.get) {
      return await window.SpeakerDataCache.get({ force });
    }

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

function applyFieldBindings(dto, mode) {
  SPEAKER_FIELD_DEFS.forEach((field) => {
    const value = pick(dto, ...field.keys);
    if (mode === "read" && field.readId) {
      const rendered = field.readFormatter ? field.readFormatter(value) : value;
      setText(field.readId, rendered);
      return;
    }
    if (mode === "form" && field.formId) {
      setVal(field.formId, value ?? field.formDefault);
    }
  });
}

function clearSpeakerReadOnlyFields() {
  clearTextByIds(SPEAKER_READONLY_CLEAR_IDS);
}

function resetSpeakerForm() {
  const formB = document.getElementById("speakerSettingFormB");
  if (!formB) return;
  formB.reset();
  syncRangeBadges(formB.closest(".modal-content") || document);
}

function populateSelectedSpeakerBasicInfo(speaker = selectedSpeaker) {
  const p = "b_";
  setText(p + "speakerName", speaker?.speakerName ?? "-");
  setText(p + "speakerId", speaker?.speakerId ?? "-");
  setVal("bi_speakerid", speaker?.speakerId ?? "");
}

/* =========================
  리스트 렌더
========================= */
const SpeakerList = {
  speakers: [],
  apply(list) {
    this.speakers = (Array.isArray(list) ? list : []).map((spk) => ({
      ...spk,
      speakerType: SPEAKER_TYPE
    }));
    this.render();
    this.updateCount();
  },
  async load({ force = false, showLoading = false } = {}) {
    const cached = window.SpeakerDataCache?.peek?.();
    if (!force && Array.isArray(cached)) {
      this.apply(cached);
      if (window.SpeakerDataCache?.isFresh?.()) return;
    } else if (showLoading) {
      this.renderLoading();
    }

    try {
      const list = await SpeakerApi.list({ force });
      this.apply(list);
    } catch (err) {
      console.error("스피커 목록 로드 실패:", err);
      if (!this.speakers.length) {
        this.apply([]);
      } else {
        notify("스피커 목록 갱신에 실패했습니다. 기존 목록을 유지합니다.", "warning");
      }
    }
  },
  updateCount() {
    const el = document.getElementById("speakerCount");
    if (el) el.textContent = `총 ${this.speakers.length}개`;
  },
  renderLoading() {
    const container = document.getElementById("speakerOffcanvasList");
    const emptyMsg = document.getElementById("emptySpeakerMessage");
    if (!container) return;
    emptyMsg?.classList.add("d-none");
    container.querySelectorAll(".speaker-item, .sp-item, .sp-list-loading").forEach(el => el.remove());
    container.insertAdjacentHTML("beforeend", `
    <div class="sp-list-loading text-center py-4 text-white-50">
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      스피커 목록을 불러오는 중...
    </div>`);
  },
  render() {
    const container = document.getElementById("speakerOffcanvasList");
    const emptyMsg = document.getElementById("emptySpeakerMessage");
    if (!container) return;
    container.querySelectorAll(".speaker-item, .sp-item, .sp-list-loading").forEach(el => el.remove());

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
    const speakerType = SPEAKER_TYPE;
    const uiTypeKey = speakerType.toLowerCase();
    const name = safe(spk.speakerName ?? spk.name ?? speakerKey);
    const locationName = safe(spk.locationName);
    return `
    <div class="speaker-list-item sp-item sp-type-${uiTypeKey} is-type-${uiTypeKey}"
         data-speaker-key="${String(speakerKey)}"
         data-speaker-id="${String(speakerId)}"
         data-speaker-type="${String(speakerType)}">
      <div class="speaker-list-item-info sp-item-info">
        <div class="d-flex align-items-center gap-2 mb-1">
            <!-- <span class="speaker-type-tag type-${uiTypeKey}">${speakerType}</span> -->
            <div class="speaker-list-item-name sp-item-name">${name}</div>
        </div>
        <div class="speaker-list-item-meta sp-item-sub">${locationName}</div>
      </div>
      <i class="speaker-list-item-arrow bi bi-chevron-right sp-item-arrow"></i>
    </div>`;
  },
};

/* =========================
  SettingView
======================== */
const SettingView = {
  fillReadOnly(dto, selected) {
    setText("b_speakerName", selected?.speakerName ?? "-");
    setText("b_speakerId", pick(dto, "speakerId", "speaker_id", "id") ?? selected?.speakerId ?? "-");
    applyFieldBindings(dto, "read");
  },

  fillForm(dto) {
    applyFieldBindings(dto, "form");
    // DTO에 ID 정보가 없는 경우 선택된 스피커 정보를 활용하여 입력 필드 유지
    if (!pick(dto, "speakerId", "speaker_id", "id")) {
      setVal("bi_speakerid", selectedSpeaker?.speakerId ?? "");
    }
    syncRangeBadges(document.getElementById("speaker_setting_modal"));
  },
};

/* =========================
  모달 컨트롤러
========================= */
const SpeakerSettingModal = {
  AUTO_OPEN_CONFIG_TAB: true,
  requestSeq: 0,

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

    window.SpeakerDataCache?.preload?.();

    modalEl.addEventListener("show.bs.modal", () => {
      this.resetState();
      SpeakerList.load({ showLoading: true });
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      this.resetState();
    });

    this.bindClickList(modalEl);
    this.bindInfoRequest(modalEl);
    this.bindConfigActions(modalEl);

  },

  resetState() {
    this.clearScheduledRefresh();
    selectedSpeaker = null;
    this.requestSeq += 1;
    document.querySelectorAll(".sp-item.active").forEach((c) => c.classList.remove("active", "is-active"));
    showTab("tab-info-b");
    showTypeArea(null);
    clearSpeakerReadOnlyFields();
    resetSpeakerForm();
  },

  resetViewOnlyKeepSelection() {
    this.clearScheduledRefresh();
    this.requestSeq += 1;
    showTab("tab-info-b");
    clearSpeakerReadOnlyFields();
    resetSpeakerForm();
  },

  clearScheduledRefresh() {
    this.setInfoButtonIdle();
  },

  getInfoButton() {
    return document.getElementById("speakerSettingInfo");
  },

  setInfoButtonIdle() {
    const btn = this.getInfoButton();
    if (!btn) return;
    btn.innerHTML = INFO_BUTTON_DEFAULT_HTML;
    btn.disabled = false;
    delete btn.dataset.loading;
  },

  setInfoButtonLoading() {
    const btn = this.getInfoButton();
    if (!btn) return;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> 데이터 갱신 중...';
    btn.disabled = true;
    btn.dataset.loading = "1";
  },

  setInfoButtonRefreshing() {
    const btn = this.getInfoButton();
    if (!btn) return;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> 전체 데이터 갱신 중...';
    btn.disabled = true;
    btn.dataset.loading = "1";
  },

  createRequestToken() {
    this.requestSeq += 1;
    return this.requestSeq;
  },

  isRequestStale(requestToken, speakerKey) {
    return requestToken !== this.requestSeq || selectedSpeaker?.speakerKey !== speakerKey;
  },

  bindClickList(modalEl) {
    modalEl.addEventListener("click", e => {

      const card = e.target.closest(".sp-item");
      if (!card) return;

      if (card.classList.contains("active")) {
        card.classList.remove("active", "is-active");
        selectedSpeaker = null;
        this.resetState();
        return;
      }

      document.querySelectorAll(".sp-item").forEach(c => c.classList.remove("active", "is-active"));
      card.classList.add("active", "is-active");

      const speakerKey = card.dataset.speakerKey;
      const raw = SpeakerList.speakers.find(s => String(s?.speakerKey) === String(speakerKey));
      if (!raw) return;

      selectedSpeaker = {
        speakerKey: raw.speakerKey,
        speakerName: raw.speakerName ?? raw.name ?? `KEY:${speakerKey}`,
        speakerId: raw.speakerId ?? raw.id,
        speakerType: SPEAKER_TYPE,
      };

      this.resetViewOnlyKeepSelection();
      showTypeArea(selectedSpeaker.speakerType);

      // 선택된 기본 정보 즉시 매핑
      populateSelectedSpeakerBasicInfo(selectedSpeaker);

      // DB의 최신 설정 정보 자동 조회하여 표시
      this.loadSpeakerSetting(selectedSpeaker.speakerKey);
    });
  },

  async loadSpeakerSetting(speakerKey) {
    if (!speakerKey) return;
    const requestToken = this.createRequestToken();
    try {
      const dto = await SpeakerApi.getSetting(speakerKey);
      if (this.isRequestStale(requestToken, speakerKey)) return;
      if (dto && !isEmptySetting(dto)) {
        const type = SPEAKER_TYPE;
        showTypeArea(type);
        SettingView.fillReadOnly(dto, selectedSpeaker);
        SettingView.fillForm(dto);
      } else {
        // 정보가 없거나 빈 결과일 경우 초기화 상태 유지
        this.resetViewOnlyKeepSelection();
        // 기본 정보만 다시 채워줌
        populateSelectedSpeakerBasicInfo();
      }
      this.setInfoButtonIdle();
    } catch (err) {
      if (this.isRequestStale(requestToken, speakerKey)) return;
      logWarn("Auto load setting failed:", err);
      this.resetViewOnlyKeepSelection();
      populateSelectedSpeakerBasicInfo();
      this.setInfoButtonIdle();
    }
  },

  bindInfoRequest(modalEl) {
    modalEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("#speakerSettingInfo");
      if (!btn) return;

      if (!selectedSpeaker?.speakerKey) {
        notify("스피커를 먼저 선택해주세요.", "warning");
        return;
      }

      const speakerKey = selectedSpeaker.speakerKey;
      const requestToken = this.createRequestToken();
      const deviceId = selectedSpeaker.speakerId;
      if (btn.dataset.loading === "1") return;
      this.setInfoButtonLoading();

      try {
        let requestErr = null;
        if (deviceId) {
          const verification = await requestPasswordWithServerValidation({
            message: "스피커 설정 데이터를 요청하려면 비밀번호를 입력하세요.",
            onVerify: (password) => postBTypeAction({
              speakerIds: [String(deviceId)],
              action: "getSpeakerSettings",
              extraParam: "",
              password: password
            })
          });

          if (verification.cancelled) {
            return;
          }

          if (verification.ok) {
            logDebug("[B-Type] 전송 성공 응답:", verification.result?.responses);
          } else {
            requestErr = verification.error;
          }
        } else {
          const password = await requestPassword({
            message: "스피커 설정 데이터를 요청하려면 비밀번호를 입력하세요."
          });
          if (password === null) return;
        }

        if (requestErr && isPasswordError(requestErr)) {
          notify(requestErr.message || "비밀번호가 올바르지 않습니다.", "error");
          return;
        }

        if (!requestErr) {
          this.setInfoButtonRefreshing();
        }

        const dto = await pollSpeakerSetting(speakerKey, {
          retries: Math.ceil(SETTING_REFRESH_WAIT_MS / 700),
          intervalMs: 700
        });
        if (this.isRequestStale(requestToken, speakerKey)) return;

        if (isEmptySetting(dto)) {
          this.resetViewOnlyKeepSelection();
          populateSelectedSpeakerBasicInfo();
          notify(requestErr?.message || "조회된 설정 정보가 없습니다. (응답 대기 시간 초과)", "warning");
          return;
        }

        const type = SPEAKER_TYPE;
        selectedSpeaker.speakerType = type; // 최신 타입으로 업데이트

        showTypeArea(type);
        SettingView.fillReadOnly(dto, selectedSpeaker);
        SettingView.fillForm(dto);

        const targetTab = this.AUTO_OPEN_CONFIG_TAB ? "tab-config-b" : "tab-info-b";
        showTab(targetTab);
        if (requestErr) {
          notify("최신 정보를 불러오지 못해 최근 저장된 설정값을 표시합니다.", "warning");
        }
      } catch (err) {
        if (this.isRequestStale(requestToken, speakerKey)) return;
        this.resetViewOnlyKeepSelection();
        notify(`정보 요청 중 오류: ${err.message}`, "danger");
      } finally {
        this.setInfoButtonIdle();
      }
    });
  },

  bindConfigActions(modalEl) {
    modalEl.addEventListener("click", async (e) => {
      const btn = e.target.closest(".sp-sec-send");
      if (!btn || btn.id === "speakerSettingInfo") return;

      if (!selectedSpeaker?.speakerKey) {
        notify("스피커를 먼저 선택해주세요.", "warning");
        return;
      }

      const targetId = btn.dataset.target;
      const section = btn.dataset.section;
      const btnId = btn.id;

      let action = "";
      let extraParam = "";

      // 1. 역할별 분기 처리 (로그 생성 및 설정값 준비)
      if (btnId === "save_bi_serverip") {
        logDebug("[Config] 통제서버 IP 저장");
        action = SPEAKER_ACTION_MAP[targetId];
        const val = document.getElementById(targetId)?.value;
        extraParam = convertIpToReversedHex(val);
        logDebug(` -> IP: ${val} (Converted: ${extraParam})`);
      }
      else if (btnId === "save_bi_speakerid") {
        logDebug("[Config] 스피커 ID 저장");
        action = "ins_speakerid"; // ID 설정 전용 액션 호출
        const val = document.getElementById(targetId)?.value;
        extraParam = convertIpToReversedHex(val);

        logDebug(` -> ID: ${val} (Converted: ${extraParam})`);
      }
      else if (btnId === "save_bi_PollingCheckTime") {
        logDebug("[Config] 폴링 주기 저장");
        action = SPEAKER_ACTION_MAP[targetId];
        const val = document.getElementById(targetId)?.value;
        // 2바이트 리버스 헥사 변환 (예: 30초 -> 001E -> 1E00)
        const byteLength = 2;
        extraParam = convertToReversedHex(val, byteLength);
        logDebug(` -> Polling: ${val} (Converted: ${extraParam})`);
      }
      else if (btnId === "save_bi_BGMFolderNo") {
        logDebug("[Config] BGM 폴더 설정 저장");
        action = SPEAKER_ACTION_MAP[targetId];
        const val = document.getElementById(targetId)?.value;

        if (val === "None") {
          notify("폴더를 선택해주세요.", "warning");
          return;
        }

        // 1바이트 리버스 헥사 변환
        extraParam = convertToReversedHex(val, 1);
        logDebug(` -> BGM Folder: ${val} (Converted: ${extraParam})`);
      }
      else if (btnId === "save_bi_BGMStatus") {
        logDebug("[Config] BGM 상태 설정 저장");
        action = SPEAKER_ACTION_MAP[targetId];
        const val = document.getElementById(targetId)?.value;
        // 1바이트 리버스 헥사 변환
        extraParam = convertToReversedHex(val, 1);
        logDebug(` -> BGM Status: ${val} (Converted: ${extraParam})`);
      }
      else if (section === "channel-use") {
        logDebug("[Config] 채널 사용 여부");
        action = "ins_channels";

        const ch1 = document.getElementById("bi_useCh1")?.value || "3";
        const ch2 = document.getElementById("bi_useCh2")?.value || "3";
        const ch3 = document.getElementById("bi_useCh3")?.value || "3";
        const ch4 = document.getElementById("bi_useCh4")?.value || "3";

        // 각 채널값을 1바이트 헥사로 변환하여 8자리 문자열 생성 (예: 01010101)
        extraParam = [ch1, ch2, ch3, ch4]
          .map(v => convertToReversedHex(v, 1))
          .join("");

        logDebug(` -> Channel Use Combine: ${ch1}, ${ch2}, ${ch3}, ${ch4} (ExtraParam: ${extraParam})`);
      }
      else if (section === "bgm-out-vol") {
        logDebug("[Config] BGM 출력 볼륨");
        action = "insBgmVolume";

        const v1 = document.getElementById("bi_bgm_vol_ch1")?.value || 0;
        const v2 = document.getElementById("bi_bgm_vol_ch2")?.value || 0;
        const v3 = document.getElementById("bi_bgm_vol_ch3")?.value || 0;
        const v4 = document.getElementById("bi_bgm_vol_ch4")?.value || 0;

        // 각 채널 볼륨값을 1바이트 헥사로 변환하여 8자리로 결합 (예: 32323232 -> 50,50,50,50)
        extraParam = [v1, v2, v3, v4]
          .map(v => convertToReversedHex(v, 1))
          .join("");

        logDebug(` -> BGM Output Vol Combine: ${v1}, ${v2}, ${v3}, ${v4} (ExtraParam: ${extraParam})`);
      }
      else if (section === "alert-out-vol") {
        logDebug("[Config] 발령 출력 볼륨");
        action = "insAlertVolume";

        const v1 = document.getElementById("bi_alert_vol_ch1")?.value || 0;
        const v2 = document.getElementById("bi_alert_vol_ch2")?.value || 0;
        const v3 = document.getElementById("bi_alert_vol_ch3")?.value || 0;
        const v4 = document.getElementById("bi_alert_vol_ch4")?.value || 0;

        // 각 채널 볼륨값을 1바이트 헥사로 변환하여 8자리로 결합 (예: 32323232)
        extraParam = [v1, v2, v3, v4]
          .map(v => convertToReversedHex(v, 1))
          .join("");

        logDebug(` -> Alert Output Vol Combine: ${v1}, ${v2}, ${v3}, ${v4} (ExtraParam: ${extraParam})`);
      }
      else if (btnId === "save_bi_BGM_IN_VOL" || btnId === "save_bi_STO_IN_VOL" || btnId === "save_bi_TTS_IN_VOL") {
        logDebug(`[Config] 입력 볼륨(IN_VOL) 저장: ${btnId}`);
        action = SPEAKER_ACTION_MAP[targetId];
        const val = document.getElementById(targetId)?.value || 0;

        // 입력 볼륨은 1바이트 리버스 헥사 변환 (예: 100 -> 64)
        extraParam = convertToReversedHex(val, 1);
        logDebug(` -> Input Vol: ${val} (ExtraParam: ${extraParam})`);
      }
      else if (targetId && (targetId.includes("Pitch") || targetId.includes("Speed"))) {
        logDebug(`[Config] TTS 상세 저장: ${targetId}`);
        action = SPEAKER_ACTION_MAP[targetId];
        const val = document.getElementById(targetId)?.value || 0;

        // 피치/속도도 1바이트 리버스 헥사 변환
        extraParam = convertToReversedHex(val, 1);
        logDebug(` -> TTS Val: ${val} (ExtraParam: ${extraParam})`);
      }
      else if (targetId) {
        logDebug(`[Config] 기타 설정 저장: ${targetId}`);
        action = SPEAKER_ACTION_MAP[targetId];
        extraParam = document.getElementById(targetId)?.value;
        logDebug(` -> Value: ${extraParam}`);
      }

      if (!action) {
        logWarn("No mapped action for this button:", btn);
        return;
      }

      const password = prompt("설정을 변경하려면 비밀번호를 입력하세요.");
      if (password === null) return;

      const deviceId = selectedSpeaker.speakerId;

      try {
        btn.disabled = true;
        await postBTypeAction({
          speakerIds: [String(deviceId)],
          action: action,
          extraParam: String(extraParam),
          password: password
        });
        notify("설정 변경 명령을 전송했습니다.", "success");
      } catch (err) {
        notify(`저장 실패: ${err.message}`, "danger");
      } finally {
        btn.disabled = false;
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  SpeakerSettingModal.init();
});
