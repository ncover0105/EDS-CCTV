// setting_sms.js
// SMS 알림 설정(UserEntity: eventAlertYn / warnAlertYn / alertEnabledYn) 관리
// - 등록: 모달 빈값(사용자ID 직접 입력) + 저장(PATCH)
// - 수정: 선택 1명 → 모달에 선택 데이터 채움 + 저장(PATCH)
// - 삭제: 선택 N명 → 미사용 처리(배치) alertEnabledYn=N, event/warn=N
// API:
//   PATCH /api/users/sms/{id}
//   POST  /api/users/sms/disable-batch

(function () {
  const $ = (id) => document.getElementById(id);

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

  // 화면의 badge 텍스트 기반으로 Y/N 읽기
  function readYnFromCell(td) {
    const text = (td?.textContent || "").trim();
    // "미사용" 포함이면 N, 그 외 "사용"이면 Y
    if (text.includes("미사용")) return "N";
    if (text.includes("사용")) return "Y";
    return "N";
  }

  function getUserInfoFromRow(tr) {
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

  // ===== Modal =====
  let modalMode = "insert"; // "insert" | "edit"

  function syncChildTogglesByEnabled() {
    const enabled = $("modalAlertEnabled")?.checked;

    const ev = $("modalEventAlert");
    const wa = $("modalWarnAlert");
    if (!ev || !wa) return;

    ev.disabled = !enabled;
    wa.disabled = !enabled;

    if (!enabled) {
      ev.checked = false;
      wa.checked = false;
    }
  }

  function openSmsModalEmpty() {
    const modalEl = $("smsEditModal");
    if (!modalEl) {
      alert("smsEditModal이 없습니다.");
      return;
    }

    modalMode = "insert";

    const titleEl = $("smsEditModalLabel");
    if (titleEl) titleEl.textContent = "SMS 알림 등록";

    // ✅ 등록: 전부 비움
    $("modalUserId").value = "";
    $("modalUserName").value = "";
    $("modalUserPhn").value = "";

    $("modalEventAlert").checked = false;
    $("modalWarnAlert").checked = false;
    $("modalAlertEnabled").checked = true; // 기본은 사용

    // 등록에서는 ID를 입력해야 하므로 활성화
    $("modalUserId").readOnly = false;

    syncChildTogglesByEnabled();
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  function openSmsModalWithData(userInfo) {
    const modalEl = $("smsEditModal");
    if (!modalEl) {
      alert("smsEditModal이 없습니다.");
      return;
    }

    modalMode = "edit";

    const titleEl = $("smsEditModalLabel");
    if (titleEl) titleEl.textContent = "SMS 알림 수정";

    // ✅ 수정: 선택 데이터 채움
    $("modalUserId").value = userInfo.id;
    $("modalUserName").value = userInfo.name || "-";
    $("modalUserPhn").value = userInfo.phnNo || "-";

    $("modalEventAlert").checked = userInfo.eventAlertYn === "Y";
    $("modalWarnAlert").checked = userInfo.warnAlertYn === "Y";
    $("modalAlertEnabled").checked = userInfo.alertEnabledYn === "Y";

    // 수정에서는 ID 변경 못하게
    $("modalUserId").readOnly = true;

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

  // ===== Actions =====
  // 등록: 선택 없이 빈 모달
  window.smsInsert = function smsInsert() {
    openSmsModalEmpty();
  };

  // 수정: 선택 1명 → 값 채워서 모달
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

    openSmsModalWithData(info);
  };

  // 삭제(미사용): 선택 N명
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
    if (!userId) return alert("사용자 ID를 입력하세요.");

    // (등록 모드에서) 이름/전화는 참고용 표시일 수도 있어서 서버로는 안 보냄
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

  function bindRowClickSelection() {
    const tbody = document.getElementById("smsUserList");
    if (!tbody) return;
  
    tbody.querySelectorAll("tr").forEach((tr) => {
      const checkbox = tr.querySelector('input.alert-toggle[type="checkbox"]');
      if (!checkbox) return;
  
      // ✅ row 클릭 시 체크박스 토글
      tr.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked;
        tr.classList.toggle("table-active", checkbox.checked);
      });
  
      // ✅ 체크박스 직접 클릭 시 row 클릭 이벤트 중복 방지
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation(); // row 클릭 이벤트 막기
        tr.classList.toggle("table-active", checkbox.checked);
      });
    });
  }  

  // ===== Bind =====
  function bindSmsEvents() {
    // 버튼 id는 충돌 방지를 위해 SMS 전용을 권장
    // (둘 중 존재하는 걸 잡도록)
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
    bindRowClickSelection();
  });
})();
