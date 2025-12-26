/**
 * setting_user.js (FULL - final)
 * 정책:
 *  - 등록: ID + PW(필수) + 전화 + (관리자면 권한 선택 가능)
 *  - 수정: ID(readonly) + 전화 + (관리자면 권한 변경 가능)
 *          비밀번호는 수정 불가(모달에서 숨김 + API로 전송 안 함)
 *  - 삭제: DELETE 호출(서버에서 soft delete 권장)
 *  - 행 클릭 시 체크박스 토글
 *
 * 필요 HTML 요소(IDs):
 *  - tbody#userList
 *  - button#btn-register #btn-edit #btn-disable
 *  - modal#userEditModal
 *  - input#editUserId #editUserPw #editUserPhone
 *  - select#editUserRole
 *  - button#saveUserBtn
 *  - (권장) 비번 영역 wrapper: #pwField  (없으면 editUserPw만 숨김)
 *
 * 필요 체크박스:
 *  - input[type=checkbox] name="selectedUserIds" value="{user.id}"
 *
 * 권한 플래그:
 *  - window.IS_MANAGER (settingPage.html에서 th:inline="javascript"로 주입)
 */

(() => {
  const API_BASE = "/api/users";
  const IS_MANAGER = !!window.IS_MANAGER;

  document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("userList");
    if (tbody) bindRowToggle(tbody);

    bindButtons();
    bindSave();

    // 관리자 아니면 권한 select 비활성화(UX)
    const roleSelect = document.getElementById("editUserRole");
    if (roleSelect && !IS_MANAGER) roleSelect.disabled = true;
  });

  /* ------------------------------
   * 1) Row click -> checkbox toggle
   * ------------------------------ */
  function bindRowToggle(tbody) {
    tbody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr");
      if (!tr) return;

      const cb = tr.querySelector('input[type="checkbox"][name="selectedUserIds"]');
      if (!cb) return;

      // checkbox 자체 클릭이면 change에서 처리
      if (e.target === cb) return;

      cb.checked = !cb.checked;
      tr.classList.toggle("table-active", cb.checked);
    });

    tbody.addEventListener("change", (e) => {
      if (!e.target.matches('input[type="checkbox"][name="selectedUserIds"]')) return;
      const tr = e.target.closest("tr");
      if (!tr) return;
      tr.classList.toggle("table-active", e.target.checked);
    });
  }

  /* ------------------------------
   * 2) Buttons
   * ------------------------------ */
  function bindButtons() {
    const btnRegister = document.getElementById("btn-register");
    const btnEdit = document.getElementById("btn-edit");
    const btnDelete = document.getElementById("btn-disable");

    if (btnRegister) btnRegister.addEventListener("click", () => openModal("insert"));
    if (btnEdit) btnEdit.addEventListener("click", onEdit);
    if (btnDelete) btnDelete.addEventListener("click", onDelete);

    // HTML에 onclick="userInsert()" 남아있어도 동작하게
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

    // th:value 누락 등 재발 방지
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

  /* ------------------------------
   * 3) Modal open
   * ------------------------------ */
  function openModal(mode, user) {
    const modalEl = document.getElementById("userEditModal");
    if (!modalEl) {
      alert("userEditModal이 없습니다.");
      return;
    }
    modalEl.dataset.mode = mode;

    const titleEl = modalEl.querySelector(".modal-title");
    if (titleEl) titleEl.textContent = (mode === "insert") ? "사용자 등록" : "사용자 수정";

    const idEl = document.getElementById("editUserId");
    const pwEl = document.getElementById("editUserPw");
    const pwField = document.getElementById("pwField"); // 권장 wrapper
    const phoneEl = document.getElementById("editUserPhone");
    const roleEl = document.getElementById("editUserRole");

    // ID
    if (idEl) {
      idEl.value = user?.id ?? "";
      if (mode === "insert") {
        idEl.removeAttribute("readonly");
        idEl.placeholder = "사용자 ID";
      } else {
        idEl.setAttribute("readonly", "readonly");
      }
    }

    // PW: 등록만 입력 가능 / 수정에서는 숨김
    if (mode === "insert") {
      if (pwField) pwField.classList.remove("d-none");
      if (pwEl) {
        pwEl.value = "";
        pwEl.placeholder = "비밀번호 입력(필수)";
      }
    } else {
      // update
      if (pwField) pwField.classList.add("d-none");
      if (pwEl) {
        pwEl.value = "";
        // wrapper가 없으면 input 자체 숨김
        if (!pwField) pwEl.classList.add("d-none");
      }
    }

    // Phone
    if (phoneEl) phoneEl.value = user?.phnNo ?? "";

    // Role: 관리자만 변경 가능
    if (roleEl) {
      roleEl.value = (user?.userRole ?? "USER");
      roleEl.disabled = !IS_MANAGER;
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  /* ------------------------------
   * 4) Save (insert/update)
   * ------------------------------ */
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
        // ✅ 등록: 비밀번호 필수
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
            userRole: IS_MANAGER ? userRole : "USER" // 관리자 아니면 USER 고정
          })
        });

        location.reload();
        return;
      }

      // ✅ 수정: 비밀번호 전송 X (전화만 수정)
      await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          phnNo
        })
      });

      // ✅ 권한 변경은 관리자만 별도 호출
      if (IS_MANAGER) {
        await fetchJson(`${API_BASE}/${encodeURIComponent(id)}/role`, {
          method: "PUT",
          body: JSON.stringify({ userRole })
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

  /* ------------------------------
   * helpers
   * ------------------------------ */
  function getSelectedIds() {
    return Array.from(document.querySelectorAll('input[name="selectedUserIds"]:checked'))
      .map(cb => cb.value);
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
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
