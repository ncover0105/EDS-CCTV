// setting_sms.js
// SMS 알림 설정(UserEntity: eventAlertYn / warnAlertYn / alertEnabledYn) 관리
// - 등록: 선택 1명 → 모달 오픈(기본 alertEnabledYn=Y)
// - 수정: 선택 1명 → 모달 오픈(현재 값 로드)
// - 삭제: 선택 N명 → 미사용 처리(배치) alertEnabledYn=N, event/warn=N
// API:
//   PATCH /api/users/sms/{id}
//   POST  /api/users/sms/disable-batch

(function () {
  // ===== DOM helpers =====
  const $ = (id) => document.getElementById(id);

  // settingPage.html에 currentView가 있으면 sms 뷰에서만 동작
  const isSmsView = () => {
    try {
      return typeof currentView === "undefined" || currentView === "sms";
    } catch (e) {
      return true;
    }
  };

  // ===== Selection =====
  function getSelectedSmsUserIds() {
    const tbody = $("smsUserList");
    if (!tbody) return [];

    const checks = tbody.querySelectorAll('input.alert-toggle[type="checkbox"]:checked');
    const ids = [];
    checks.forEach((chk) => {
      const tr = chk.closest("tr");
      const userId = tr?.dataset?.userId;
      if (userId) ids.push(userId);
    });
    return ids;
  }

  function getRowByUserId(userId) {
    const tbody = $("smsUserList");
    if (!tbody) return null;
    return tbody.querySelector(`tr[data-user-id="${CSS.escape(userId)}"]`);
  }

  // ===== Table parsing (현재 화면값 → Y/N) =====
  function readYnFromCell(td) {
    const text = (td?.textContent || "").trim();
    // 배지 텍스트가 "사용"/"미사용" 형태라면 이 방식이 가장 단순
    return text.includes("사용") && !text.includes("미사용") ? "Y" : (text.includes("미사용") ? "N" : (text.includes("사용") ? "Y" : "N"));
  }

  function getUserInfoFromRow(tr) {
    // 컬럼 예상:
    // [0] checkbox, [1] no, [2] name, [3] phnNo, [4] event, [5] warn, [6] enabled
    const tds = tr ? tr.querySelectorAll("td") : null;
    if (!tds || tds.length < 7) return null;

    const id = tr.dataset.userId;
    const name = (tds[2]?.textContent || "").trim();
    const phnNo = (tds[3]?.textContent || "").trim();

    const eventAlertYn = readYnFromCell(tds[4]);
    const warnAlertYn = readYnFromCell(tds[5]);
    const alertEnabledYn = readYnFromCell(tds[6]);

    return { id, name, phnNo, eventAlertYn, warnAlertYn, alertEnabledYn };
  }

  // ===== Modal helpers =====
  function syncChildTogglesByEnabled() {
    const enabled = $("modalAlertEnabled")?.checked;

    const ev = $("modalEventAlert");
    const wa = $("modalWarnAlert");
    if (!ev || !wa) return;

    ev.disabled = !enabled;
    wa.disabled = !enabled;

    // 정책: 전체 알림이 OFF면 하위 2개도 OFF로 강제
    if (!enabled) {
      ev.checked = false;
      wa.checked = false;
    }
  }

  function openSmsModal(userInfo, mode) {
    const modalEl = $("smsEditModal");
    if (!modalEl) {
      alert("smsEditModal이 없습니다.");
      return;
    }

    const titleEl = $("smsEditModalLabel");
    if (titleEl) titleEl.textContent = (mode === "insert") ? "SMS 알림 등록" : "SMS 알림 수정";

    $("modalUserId").value = userInfo.id;
    $("modalUserName").value = userInfo.name || "-";
    $("modalUserPhn").value = userInfo.phnNo || "-";

    $("modalEventAlert").checked = userInfo.eventAlertYn === "Y";
    $("modalWarnAlert").checked = userInfo.warnAlertYn === "Y";
    $("modalAlertEnabled").checked = userInfo.alertEnabledYn === "Y";

    syncChildTogglesByEnabled();

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  // ===== API =====
  async function apiUpdateSmsSetting(userId, payload) {
    const res = await fetch(`/api/users/sms/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    // controller가 Entity를 리턴할 수도 / Void일 수도 있으니 유연하게 처리
    return res.text().catch(() => "");
  }

  async function apiDisableSmsBatch(userIds) {
    const res = await fetch(`/api/users/sms/disable-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text().catch(() => "");
  }

  function reloadPage() {
    location.reload();
  }

  // ===== Actions (등록/수정/삭제) =====
  window.smsInsert = function smsInsert() {
    const selected = getSelectedSmsUserIds();
    if (selected.length !== 1) {
      alert("등록은 1명만 선택하세요.");
      return;
    }

    const tr = getRowByUserId(selected[0]);
    const info = getUserInfoFromRow(tr);
    if (!info) {
      alert("선택된 사용자를 찾을 수 없습니다.");
      return;
    }

    // 등록 의미: 기본 enabled=Y로 켜고 시작(필요하면 정책 변경)
    info.alertEnabledYn = "Y";
    openSmsModal(info, "insert");
  };

  window.smsUpdate = function smsUpdate() {
    const selected = getSelectedSmsUserIds();
    if (selected.length !== 1) {
      alert("수정은 1명만 선택하세요.");
      return;
    }

    const tr = getRowByUserId(selected[0]);
    const info = getUserInfoFromRow(tr);
    if (!info) {
      alert("선택된 사용자를 찾을 수 없습니다.");
      return;
    }

    openSmsModal(info, "edit");
  };

  // 삭제 의미: 알림 미사용(soft)
  window.smsDelete = async function smsDelete() {
    const selected = getSelectedSmsUserIds();
    if (selected.length === 0) {
      alert("삭제(미사용)할 사용자를 선택하세요.");
      return;
    }

    if (!confirm(`선택한 ${selected.length}명에 대해 SMS 알림을 미사용 처리할까요?`)) return;

    try {
      await apiDisableSmsBatch(selected);
      reloadPage();
    } catch (e) {
      console.error(e);
      alert("삭제(미사용) 처리 중 오류가 발생했습니다.\n" + (e?.message ?? ""));
    }
  };

  // ===== Modal save =====
  async function onSaveModal() {
    const userId = $("modalUserId")?.value?.trim();
    if (!userId) return alert("사용자 ID가 없습니다.");

    const alertEnabledYn = $("modalAlertEnabled").checked ? "Y" : "N";
    const eventAlertYn = $("modalEventAlert").checked ? "Y" : "N";
    const warnAlertYn = $("modalWarnAlert").checked ? "Y" : "N";

    const payload = {
      alertEnabledYn,
      eventAlertYn: alertEnabledYn === "Y" ? eventAlertYn : "N",
      warnAlertYn: alertEnabledYn === "Y" ? warnAlertYn : "N",
    };

    try {
      await apiUpdateSmsSetting(userId, payload);

      const modalEl = $("smsEditModal");
      bootstrap.Modal.getInstance(modalEl)?.hide();
      reloadPage();
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.\n" + (e?.message ?? ""));
    }
  }

  // ===== Bind events =====
  function bindSmsEvents() {
    // (추천) SMS 버튼 id는 충돌 방지를 위해 sms_btn_* 사용
    // 만약 네 HTML이 id="btn-edit" 같은 공용 id라면 꼭 분리해줘야 함.
    const btnAdd = $("sms_btn_register") || $("sms-btn-register");
    const btnEdit = $("sms_btn_edit") || $("sms-btn-edit");
    const btnDel = $("sms_btn_disable") || $("sms-btn-disable");

    if (btnAdd) btnAdd.addEventListener("click", window.smsInsert);
    if (btnEdit) btnEdit.addEventListener("click", window.smsUpdate);
    if (btnDel) btnDel.addEventListener("click", window.smsDelete);

    $("modalAlertEnabled")?.addEventListener("change", syncChildTogglesByEnabled);
    $("modalSaveBtn")?.addEventListener("click", onSaveModal);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!isSmsView()) return;
    bindSmsEvents();
  });
})();
