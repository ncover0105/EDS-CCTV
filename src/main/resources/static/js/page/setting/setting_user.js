/**
 * setting_user.js
 * - 사용자 목록 테이블 페이지네이션(기본 10개)
 * - 행 선택/수정/삭제/등록
 */

(() => {
  const API_BASE = "/api/users";
  const IS_MANAGER = !!window.IS_MANAGER;
  const PAGESIZE = 10;

  let userRows = [];
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("userList");
    if (tbody) {
      userRows = collectInitialRows(tbody);
      renderUserTable();
      bindRowToggle(tbody);
    }

    bindButtons();
    bindSave();

    const roleSelect = document.getElementById("editUserRole");
    if (roleSelect && !IS_MANAGER) roleSelect.disabled = true;
  });

  function collectInitialRows(tbody) {
    const rows = [];
    tbody.querySelectorAll("tr[data-user-id]").forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      const checkbox = tr.querySelector('input[name="selectedUserIds"]');
      const id = checkbox?.value || tr.dataset.userId || "";
      if (!id || tds.length < 6) return;

      const roleText = (tds[5]?.textContent || "").trim();
      const role = roleText.includes("관리자") ? "MANAGER" : "USER";

      rows.push({
        id,
        name: (tds[3]?.textContent || "").trim() || "-",
        phnNo: (tds[4]?.textContent || "").trim() || "-",
        role,
      });
    });
    return rows;
  }

  function renderUserTable() {
    const tbody = document.getElementById('userList');
    if (!tbody) return;

    const totalPages = Math.max(1, Math.ceil(userRows.length / PAGESIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGESIZE;
    const pageRows = userRows.slice(start, start + PAGESIZE);

    if (pageRows.length === 0) {
      tbody.innerHTML = `
            <tr class="text-center">
                <td colspan="6" style="height:60vh;">
                    <div class="d-flex align-items-center justify-content-center h-100">
                        <span class="text-muted"><i class="bi bi-inbox me-2"></i>등록된 사용자가 없습니다.</span>
                    </div>
                </td>
            </tr>`;

      window.App.utils.renderPagination({
        containerId: 'userPagination',
        currentPage: currentPage,
        totalItems: userRows.length,
        itemsPerPage: PAGESIZE,
        onPageChange: (p) => { currentPage = p; renderUserTable(); },
      });
      return;
    }

    tbody.innerHTML = pageRows.map((user, idx) => {
      const no = start + idx + 1;
      const roleBadge = user.role === 'MANAGER'
        ? `<span class="status-badge status-danger"><i class="bi bi-shield-check"></i>관리자</span>`
        : `<span class="status-badge status-info"><i class="bi bi-person"></i>사용자</span>`;
      return `
            <tr data-user-id="${escapeHtml(user.id)}">
                <td><input type="checkbox" name="selectedUserIds" value="${escapeHtml(user.id)}"></td>
                <td>${no}</td>
                <td>${escapeHtml(user.id)}</td>
                <td>${escapeHtml(user.name) || '-'}</td>
                <td>${escapeHtml(user.phnNo) || '-'}</td>
                <td>${roleBadge}</td>
            </tr>`;
    }).join('');

    window.App.utils.renderPagination({
      containerId: 'userPagination',
      currentPage: currentPage,
      totalItems: userRows.length,
      itemsPerPage: PAGESIZE,
      onPageChange: (p) => { currentPage = p; renderUserTable(); },
    });
  }

  function bindRowToggle(tbody) {
    const selector = 'input[type="checkbox"][name="selectedUserIds"]';

    function clearOthers(keepCb) {
      tbody.querySelectorAll(selector).forEach((cb) => {
        if (cb !== keepCb) {
          cb.checked = false;
          const tr = cb.closest("tr");
          if (tr) tr.classList.remove("table-active");
        }
      });
    }

    tbody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr");
      if (!tr) return;

      const cb = tr.querySelector(selector);
      if (!cb) return;

      if (e.target === cb) return;

      const willCheck = !cb.checked;
      if (willCheck) clearOthers(cb);
      cb.checked = willCheck;
      tr.classList.toggle("table-active", cb.checked);
    });

    tbody.addEventListener("change", (e) => {
      if (!e.target.matches(selector)) return;

      const cb = e.target;
      const tr = cb.closest("tr");
      if (!tr) return;

      if (cb.checked) clearOthers(cb);
      tr.classList.toggle("table-active", cb.checked);
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

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
