// setting_sms.js
// SMS 알림 설정(UserEntity: eventAlertYn / warnAlertYn / alertEnabledYn) 관리
// + 목록 페이지네이션(기본 10개)

(function () {
  const $ = (id) => document.getElementById(id);
  const PAGE_SIZE = 10;

  let modalMode = "insert";
  let smsUsers = [];
  let currentPage = 1;

  const isSmsView = () => {
    try {
      return typeof currentView === "undefined" || currentView === "sms";
    } catch (e) {
      return true;
    }
  };

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

  function readYnFromCell(td) {
    const text = (td?.textContent || "").trim();
    if (text.includes("미사용")) return "N";
    if (text.includes("사용")) return "Y";
    return "N";
  }

  function getUserInfoFromRow(tr) {
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

  function collectInitialSmsRows() {
    const tbody = $("smsUserList");
    if (!tbody) return [];

    const rows = [];
    tbody.querySelectorAll("tr[data-user-id]").forEach((tr) => {
      const info = getUserInfoFromRow(tr);
      if (!info?.id) return;
      rows.push(info);
    });
    return rows;
  }

  function getTotalPages() {
    return Math.max(1, Math.ceil(smsUsers.length / PAGE_SIZE));
  }

  function statusBadge(yn) {
    if (yn === "Y") {
      return `<span class="status-badge status-success"><i class="bi bi-check-circle-fill"></i> 사용</span>`;
    }
    return `<span class="status-badge status-primary"><i class="bi bi-x-circle-fill"></i> 미사용</span>`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderSmsTable() {
    const tbody = $("smsUserList");
    if (!tbody) return;

    const totalPages = getTotalPages();
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = smsUsers.slice(start, start + PAGE_SIZE);

    if (pageRows.length === 0) {
      tbody.innerHTML = `
        <tr class="text-center">
          <td colspan="7" style="height: 60vh;">
            <div class="d-flex align-items-center justify-content-center h-100">
              <span class="text-muted">
                <i class="bi bi-inbox me-2"></i>
                등록된 사용자가 없습니다.
              </span>
            </div>
          </td>
        </tr>
      `;
      renderSmsPagination();
      return;
    }

    tbody.innerHTML = pageRows
      .map((user, idx) => {
        const no = start + idx + 1;
        return `
          <tr data-user-id="${escapeHtml(user.id)}">
            <td class="text-center">
              <input type="checkbox" class="alert-toggle">
            </td>
            <td class="text-center">${no}</td>
            <td>${escapeHtml(user.name || "-")}</td>
            <td>${escapeHtml(user.phnNo || "-")}</td>
            <td class="text-center">${statusBadge(user.eventAlertYn)}</td>
            <td class="text-center">${statusBadge(user.warnAlertYn)}</td>
            <td class="text-center">${statusBadge(user.alertEnabledYn)}</td>
          </tr>
        `;
      })
      .join("");

    renderSmsPagination();
  }

  function renderSmsPagination() {
    const el = $("smsPagination");
    if (!el) return;

    const totalPages = getTotalPages();
    const canPrev = currentPage > 1;
    const canNext = currentPage < totalPages;
    const windowSize = 5;

    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const items = [];
    items.push(pageBtn("«", 1, !canPrev));
    items.push(pageBtn("‹", currentPage - 1, !canPrev));
    for (let p = start; p <= end; p += 1) {
      items.push(pageBtn(String(p), p, false, p === currentPage));
    }
    items.push(pageBtn("›", currentPage + 1, !canNext));
    items.push(pageBtn("»", totalPages, !canNext));

    el.innerHTML = items.join("");
    el.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page || "1");
        if (Number.isNaN(page)) return;
        currentPage = Math.min(Math.max(1, page), getTotalPages());
        renderSmsTable();
      });
    });
  }

  function pageBtn(label, page, disabled, active = false) {
    const itemClass = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;
    return `<li class="${itemClass}"><button type="button" class="page-link" data-page="${page}" ${disabled ? "disabled" : ""}>${label}</button></li>`;
  }

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

    $("modalUserId").value = "";
    $("modalUserName").value = "";
    $("modalUserPhn").value = "";

    $("modalEventAlert").checked = false;
    $("modalWarnAlert").checked = false;
    $("modalAlertEnabled").checked = true;
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

    $("modalUserId").value = userInfo.id;
    $("modalUserName").value = userInfo.name || "-";
    $("modalUserPhn").value = userInfo.phnNo || "-";
    $("modalEventAlert").checked = userInfo.eventAlertYn === "Y";
    $("modalWarnAlert").checked = userInfo.warnAlertYn === "Y";
    $("modalAlertEnabled").checked = userInfo.alertEnabledYn === "Y";
    $("modalUserId").readOnly = true;

    syncChildTogglesByEnabled();
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

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

  window.smsInsert = function smsInsert() {
    openSmsModalEmpty();
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

    openSmsModalWithData(info);
  };

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

  async function onSaveModal() {
    const userId = $("modalUserId")?.value?.trim();
    if (!userId) return alert("사용자 ID를 입력하세요.");

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
    const tbody = $("smsUserList");
    if (!tbody || tbody.dataset.rowBindDone === "Y") return;

    tbody.dataset.rowBindDone = "Y";

    tbody.addEventListener("click", (e) => {
      const checkbox = e.target.closest('input.alert-toggle[type="checkbox"]');
      if (checkbox) {
        const tr = checkbox.closest("tr");
        if (tr) tr.classList.toggle("table-active", checkbox.checked);
        return;
      }

      const tr = e.target.closest("tr[data-user-id]");
      if (!tr) return;
      const cb = tr.querySelector('input.alert-toggle[type="checkbox"]');
      if (!cb) return;

      cb.checked = !cb.checked;
      tr.classList.toggle("table-active", cb.checked);
    });
  }

  function bindSmsEvents() {
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

    smsUsers = collectInitialSmsRows();
    currentPage = 1;
    renderSmsTable();
    bindRowClickSelection();
    bindSmsEvents();
  });
})();
