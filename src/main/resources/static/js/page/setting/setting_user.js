/**
 * setting_user.js
 * - 사용자 카드 선택/수정/삭제/등록
 */

(() => {
  const API_BASE = "/api/users";
  const IS_MANAGER = !!window.IS_MANAGER;

  document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("userList");
    if (list) bindCardToggle(list);

    bindButtons();
    bindSave();

    const roleSelect = document.getElementById("editUserRole");
    if (roleSelect && !IS_MANAGER) roleSelect.disabled = true;
  });

  function bindCardToggle(list) {
    const selector = 'input[type="checkbox"][name="selectedUserIds"]';

    function clearOthers(keepCb) {
      list.querySelectorAll(selector).forEach((cb) => {
        if (cb !== keepCb) {
          cb.checked = false;
          cb.closest(".user-manage-card")?.classList.remove("is-selected");
        }
      });
    }

    list.addEventListener("click", (e) => {
      const card = e.target.closest(".user-manage-card");
      if (!card) return;

      const cb = card.querySelector(selector);
      if (!cb) return;

      if (e.target === cb) return;

      const willCheck = !cb.checked;
      if (willCheck) clearOthers(cb);
      cb.checked = willCheck;
      card.classList.toggle("is-selected", cb.checked);
    });

    list.addEventListener("change", (e) => {
      if (!e.target.matches(selector)) return;

      const cb = e.target;
      const card = cb.closest(".user-manage-card");
      if (!card) return;

      if (cb.checked) clearOthers(cb);
      card.classList.toggle("is-selected", cb.checked);
    });
  }

  function bindButtons() {
    const btnRegister = document.getElementById("user_btn_register");
    const btnEdit = document.getElementById("user_btn_edit");
    const btnDelete = document.getElementById("user_btn_disable");

    if (btnRegister) btnRegister.addEventListener("click", () => openModal("insert"));
    if (btnEdit) btnEdit.addEventListener("click", onEdit);
    if (btnDelete) btnDelete.addEventListener("click", onDelete);

    window.userInsert = function () {
      openModal("insert");
    };
  }

  async function onEdit() {
    const ids = getSelectedIds();
    if (ids.length !== 1) {
      alert("수정은 1명만 선택하세요.");
      return;
    }

    const id = ids[0];
    if (!id || id.includes("${")) {
      alert("선택 값이 사용자 ID가 아닙니다. 체크박스 th:value를 user.id로 수정하세요.");
      return;
    }

    try {
      const user = await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`);
      openModal("update", user);
    } catch (err) {
      console.error(err);
      alert("사용자 정보를 불러오지 못했습니다.");
    }
  }

  async function onDelete() {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("삭제(비활성)할 사용자를 선택하세요.");
      return;
    }

    if (!confirm(`선택한 ${ids.length}명을 삭제(비활성) 처리할까요?`)) return;

    try {
      for (const id of ids) {
        await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
      }
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
    modalEl.dataset.mode = mode;

    const titleEl = modalEl.querySelector(".modal-title");
    if (titleEl) titleEl.textContent = mode === "insert" ? "사용자 등록" : "사용자 정보 수정";

    const idEl = document.getElementById("editUserId");
    const pwEl = document.getElementById("editUserPw");
    const nameEl = document.getElementById("editUserName");
    const pwField = document.getElementById("pwField");
    const phoneEl = document.getElementById("editUserPhone");
    const roleEl = document.getElementById("editUserRole");

    if (idEl) {
      idEl.value = user?.id ?? "";
      if (mode === "insert") {
        idEl.removeAttribute("readonly");
        idEl.placeholder = "사용자 ID";
      } else {
        idEl.setAttribute("readonly", "readonly");
      }
    }

    if (mode === "insert") {
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
      roleEl.value = user?.userRole ?? "USER";
      roleEl.disabled = !IS_MANAGER;
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  function bindSave() {
    const saveBtn = document.getElementById("saveUserBtn");
    if (!saveBtn) return;
    saveBtn.addEventListener("click", onSave);
  }

  async function onSave() {
    const modalEl = document.getElementById("userEditModal");
    const mode = modalEl?.dataset.mode || "update";

    const id = (document.getElementById("editUserId")?.value ?? "").trim();
    const pw = document.getElementById("editUserPw")?.value ?? "";
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
            phnNo,
            userRole: IS_MANAGER ? userRole : "USER",
          }),
        });

        location.reload();
        return;
      }

      await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ phnNo }),
      });

      if (IS_MANAGER) {
        await fetchJson(`${API_BASE}/${encodeURIComponent(id)}/role`, {
          method: "PUT",
          body: JSON.stringify({ userRole }),
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

  function getSelectedIds() {
    return Array.from(document.querySelectorAll('input[name="selectedUserIds"]:checked')).map(
      (cb) => cb.value
    );
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
