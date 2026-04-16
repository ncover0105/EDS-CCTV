/**
 * setting_user.js
 * - 사용자 카드 선택/수정/삭제/등록
 */

(() => {
  const API_BASE = "/api/users";
  const IS_MANAGER = !!window.IS_MANAGER;

  document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("userList");
    if (list) bindCardActions(list);

    bindButtons();
    bindSave();

    const roleSelect = document.getElementById("editUserRole");
    if (roleSelect && !IS_MANAGER) roleSelect.disabled = true;
  });

  function bindCardActions(list) {
    // 추가 카드 클릭
    const addCard = document.getElementById("user_btn_register");
    if (addCard) {
      if (!IS_MANAGER) addCard.style.display = "none";
      else addCard.addEventListener("click", () => openModal("insert"));
    }

    // 카드 내 액션 버튼 위임
    list.addEventListener("click", async (e) => {
      const editBtn = e.target.closest('[data-action="edit"]');
      const delBtn  = e.target.closest('[data-action="delete"]');

      if (editBtn) {
        e.stopPropagation();
        const id = editBtn.closest(".user-manage-card")?.dataset.userId;
        if (id) await onEditById(id);
        return;
      }

      if (delBtn) {
        e.stopPropagation();
        const id = delBtn.closest(".user-manage-card")?.dataset.userId;
        if (id) await onDeleteById(id);
        return;
      }
    });
  }

  function bindButtons() {
    document.getElementById("editSmsAlertEnabled")?.addEventListener("change", syncEditSmsToggle);

    window.userInsert = function () {
      openModal("insert");
    };
  }

  function syncEditSmsToggle() {
    const enabled = document.getElementById("editSmsAlertEnabled")?.checked;
    const ev = document.getElementById("editSmsEventAlert");
    const wa = document.getElementById("editSmsWarnAlert");
    const optionsEl = document.getElementById("editSmsOptions");
    if (!ev || !wa) return;
    ev.disabled = !enabled;
    wa.disabled = !enabled;
    if (optionsEl) optionsEl.classList.toggle("is-disabled", !enabled);
    if (!enabled) { ev.checked = false; wa.checked = false; }
  }

  async function onEditById(id) {
    try {
      const user = await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`);
      openModal("update", user);
    } catch (err) {
      console.error(err);
      alert("사용자 정보를 불러오지 못했습니다.");
    }
  }

  async function onDeleteById(id) {
    if (!confirm("해당 사용자를 삭제(비활성) 처리할까요?")) return;

    try {
      await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
      location.reload();
    } catch (err) {
      console.error(err);
      alert("삭제(비활성) 처리에 실패했습니다.");
    }
  }

  function openModal(mode, user) {
    const modalEl = document.getElementById("userEditModal");
    if (!modalEl) {
      alert("userEditModal이 없습니다.");
      return;
    }
    const modalMode = mode === "insert" ? "insert" : "update";
    modalEl.dataset.mode = modalMode;

    const titleEl = document.getElementById("userEditModalLabel") || modalEl.querySelector(".cm-title");
    if (titleEl) titleEl.textContent = modalMode === "insert" ? "사용자 추가" : "사용자 정보 수정";

    const saveBtn = document.getElementById("saveUserBtn");
    if (saveBtn) saveBtn.textContent = modalMode === "insert" ? "저장" : "수정";

    const idEl = document.getElementById("editUserId");
    const pwEl = document.getElementById("editUserPw");
    const nameEl = document.getElementById("editUserName");
    const pwField = document.getElementById("pwField");
    const phoneEl = document.getElementById("editUserPhone");
    const roleEl = document.getElementById("editUserRole");

    if (idEl) {
      idEl.value = user?.id ?? "";
      if (modalMode === "insert") {
        idEl.removeAttribute("readonly");
        idEl.placeholder = "사용자 ID";
      } else {
        idEl.setAttribute("readonly", "readonly");
      }
    }

    if (modalMode === "insert") {
      if (pwField) pwField.classList.remove("d-none");
      if (pwEl) {
        pwEl.value = "";
        pwEl.placeholder = "비밀번호 입력(필수)";
      }
    } else {
      if (pwField) pwField.classList.add("d-none");
      if (pwEl) {
        pwEl.value = "";
        if (!pwField) pwEl.classList.add("d-none");
      }
    }

    if (nameEl) nameEl.value = user?.name ?? "";
    if (phoneEl) phoneEl.value = user?.phnNo ?? "";

    if (roleEl) {
      roleEl.value = user?.userRole ?? user?.role ?? "USER";
      roleEl.disabled = !IS_MANAGER;
    }

    // ── SMS 탭 처리 ────────────────────────────────────
    const smsTabBtn = document.getElementById("userTabSmsBtn");
    const smsInsertNotice = document.getElementById("userSmsInsertNotice");
    const smsEditSection = document.getElementById("userSmsEditSection");

    if (modalMode === "insert") {
      if (smsTabBtn) smsTabBtn.disabled = true;
      if (smsInsertNotice) smsInsertNotice.classList.remove("d-none");
      if (smsEditSection) smsEditSection.classList.add("d-none");
    } else {
      if (smsTabBtn) smsTabBtn.disabled = false;
      if (smsInsertNotice) smsInsertNotice.classList.add("d-none");
      if (smsEditSection) smsEditSection.classList.remove("d-none");

      const alertEnabled = document.getElementById("editSmsAlertEnabled");
      const eventAlert   = document.getElementById("editSmsEventAlert");
      const warnAlert    = document.getElementById("editSmsWarnAlert");

      if (alertEnabled) alertEnabled.checked = (user?.alertEnabledYn ?? "Y") === "Y";
      if (eventAlert)   eventAlert.checked   = (user?.eventAlertYn   ?? "N") === "Y";
      if (warnAlert)    warnAlert.checked     = (user?.warnAlertYn    ?? "N") === "Y";
      syncEditSmsToggle();
    }

    // 기본 정보 탭으로 복귀
    const infoTabBtn = document.getElementById("userTabInfoBtn");
    if (infoTabBtn) bootstrap.Tab.getOrCreateInstance(infoTabBtn).show();

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  function bindSave() {
    const saveBtn = document.getElementById("saveUserBtn");
    if (saveBtn) saveBtn.addEventListener("click", onSave);

    document.getElementById("editUserForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      onSave();
    });
  }

  async function onSave() {
    const modalEl = document.getElementById("userEditModal");
    const mode = modalEl?.dataset.mode === "insert" ? "insert" : "update";

    const id = (document.getElementById("editUserId")?.value ?? "").trim();
    const pw = document.getElementById("editUserPw")?.value ?? "";
    const name = (document.getElementById("editUserName")?.value ?? "").trim();
    const phnNo = (document.getElementById("editUserPhone")?.value ?? "").trim();
    const userRole = (document.getElementById("editUserRole")?.value ?? "USER").trim();

    if (!id) return alert("ID는 필수입니다.");

    try {
      if (mode === "insert") {
        if (!pw || !pw.trim()) {
          alert("등록 시 비밀번호는 필수입니다.");
          return;
        }

        await fetchJson(API_BASE, {
          method: "POST",
          body: JSON.stringify({
            id,
            pw,
            name,
            phnNo,
            userRole: IS_MANAGER ? userRole : "USER",
          }),
        });

        location.reload();
        return;
      }

      await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ name, phnNo }),
      });

      if (IS_MANAGER) {
        await fetchJson(`${API_BASE}/${encodeURIComponent(id)}/role`, {
          method: "PUT",
          body: JSON.stringify({ userRole }),
        });
      }

      // SMS 알림 설정 저장
      const alertEnabledEl = document.getElementById("editSmsAlertEnabled");
      if (alertEnabledEl) {
        const alertEnabledYn = alertEnabledEl.checked ? "Y" : "N";
        const eventAlertYn   = document.getElementById("editSmsEventAlert")?.checked ? "Y" : "N";
        const warnAlertYn    = document.getElementById("editSmsWarnAlert")?.checked  ? "Y" : "N";
        await fetchJson(`/api/users/sms/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({
            alertEnabledYn,
            eventAlertYn: alertEnabledYn === "Y" ? eventAlertYn : "N",
            warnAlertYn:  alertEnabledYn === "Y" ? warnAlertYn  : "N",
          }),
        });
      }

      location.reload();
    } catch (err) {
      console.error(err);

      if (String(err?.message || "").includes("HTTP 403")) {
        alert("권한 변경은 관리자만 가능합니다.");
        return;
      }

      alert("저장에 실패했습니다.");
    }
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return res.json();
  }
})();
