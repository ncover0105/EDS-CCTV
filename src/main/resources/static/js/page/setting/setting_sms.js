// setting_sms.js
// SMS 알림 설정(UserEntity: eventAlertYn / warnAlertYn / alertEnabledYn) 관리
// + 목록 페이지네이션(기본 10개)

(function () {
  const $ = (id) => document.getElementById(id);
  const PAGESIZE = 1000; // 스크롤용 확대

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
    return Array.from(document.querySelectorAll('.sms-select-toggle[type="checkbox"]:checked'))
      .map((chk) => chk.closest("[data-user-id]")?.dataset?.userId)
      .filter(Boolean);
  }

  function clearSmsSelection() {
    document.querySelectorAll('.sms-select-toggle[type="checkbox"]:checked')
      .forEach((chk) => {
        chk.checked = false;
      });
    syncSelectedSmsStyles();
  }

  function selectOnlySmsCheckbox(targetCheckbox) {
    document.querySelectorAll('.sms-select-toggle[type="checkbox"]').forEach((chk) => {
      chk.checked = chk === targetCheckbox;
    });
    syncSelectedSmsStyles();
  }

  function getRowByUserId(userId) {
    return document.querySelector(`[data-user-id="${CSS.escape(userId)}"]`);
  }

  function getSmsUserById(userId) {
    return smsUsers.find((user) => String(user.id) === String(userId)) || null;
  }

  function syncSmsResponsiveView() {
    const cardBoard = $("smsCardBoard");
    if (!cardBoard) return;
    cardBoard.hidden = !window.matchMedia("(max-width: 768px)").matches;
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

  function syncSelectedSmsStyles() {
    document.querySelectorAll("[data-user-id]").forEach((item) => {
      const checked = !!item.querySelector('.sms-select-toggle[type="checkbox"]:checked');
      item.classList.toggle("is-selected", checked);
      if (item.tagName === "TR") {
        item.classList.toggle("table-active", checked);
      }
    });
  }

  function smsCardHtml(user, no) {
    return `
      <article class="sms-user-card" data-user-id="${escapeHtml(user.id)}">
        <div class="sms-user-card-head">
          <label class="sms-card-check">
            <input type="checkbox" class="sms-select-toggle" aria-label="선택">
            <span>선택</span>
          </label>
          <span class="sms-card-no">${no}</span>
        </div>
        <div class="sms-user-card-body">
          <div class="sms-user-card-main">
            <strong class="sms-user-card-name">${escapeHtml(user.name) || "-"}</strong>
            <span class="sms-user-card-phone">${escapeHtml(user.phnNo) || "-"}</span>
          </div>
          <dl class="sms-user-card-meta">
            <div class="sms-user-card-meta-row">
              <dt>상황 발생</dt>
              <dd>${statusBadge(user.eventAlertYn)}</dd>
            </div>
            <div class="sms-user-card-meta-row">
              <dt>경보 발령</dt>
              <dd>${statusBadge(user.warnAlertYn)}</dd>
            </div>
            <div class="sms-user-card-meta-row">
              <dt>알림 사용</dt>
              <dd>${statusBadge(user.alertEnabledYn)}</dd>
            </div>
          </dl>
        </div>
      </article>`;
  }

  function renderSmsTable() {
    const tbody = document.getElementById('smsUserList');
    const cardBoard = $("smsCardBoard");
    if (!tbody) return;
    syncSmsResponsiveView();

    const totalPages = Math.max(1, Math.ceil(smsUsers.length / PAGESIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGESIZE;
    const pageRows = smsUsers.slice(start, start + PAGESIZE);

    if (pageRows.length === 0) {
      tbody.innerHTML = `
            <tr class="text-center">
                <td colspan="7" style="height:60vh;">
                    <div class="d-flex align-items-center justify-content-center h-100">
                        <span class="text-muted"><i class="bi bi-inbox me-2"></i>등록된 SMS 수신자가 없습니다.</span>
                    </div>
                </td>
            </tr>`;
      if (cardBoard) {
        cardBoard.innerHTML = `
          <div class="sms-empty-state">
            <span class="text-muted"><i class="bi bi-inbox me-2"></i>등록된 SMS 수신자가 없습니다.</span>
          </div>`;
      }

      /*
      window.App.utils.renderPagination({
        containerId: 'smsPagination',
        currentPage: currentPage,
        totalItems: smsUsers.length,
        itemsPerPage: PAGESIZE,
        onPageChange: (p) => { currentPage = p; renderSmsTable(); },
      });
      */
      return;
    }

    tbody.innerHTML = pageRows.map((user, idx) => {
      const no = start + idx + 1;
      return `
            <tr data-user-id="${escapeHtml(user.id)}">
                <td class="text-center"><input type="checkbox" class="alert-toggle sms-select-toggle"></td>
                <td class="text-center">${no}</td>
                <td>${escapeHtml(user.name) || '-'}</td>
                <td>${escapeHtml(user.phnNo) || '-'}</td>
                <td class="text-center">${statusBadge(user.eventAlertYn)}</td>
                <td class="text-center">${statusBadge(user.warnAlertYn)}</td>
                <td class="text-center">${statusBadge(user.alertEnabledYn)}</td>
            </tr>`;
    }).join('');

    if (cardBoard) {
      cardBoard.innerHTML = pageRows.map((user, idx) => smsCardHtml(user, start + idx + 1)).join("");
    }

    syncSelectedSmsStyles();

    /*
    window.App.utils.renderPagination({
      containerId: 'smsPagination',
      currentPage: currentPage,
      totalItems: smsUsers.length,
      itemsPerPage: PAGESIZE,
      onPageChange: (p) => { currentPage = p; renderSmsTable(); },
    });
    */
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

    const info = getSmsUserById(selected[0]);
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
        if (checkbox.checked) {
          selectOnlySmsCheckbox(checkbox);
        } else {
          clearSmsSelection();
        }
        return;
      }

      const tr = e.target.closest("tr[data-user-id]");
      if (!tr) return;
      const cb = tr.querySelector('.sms-select-toggle[type="checkbox"]');
      if (!cb) return;

      if (cb.checked) {
        clearSmsSelection();
      } else {
        cb.checked = true;
        selectOnlySmsCheckbox(cb);
      }
    });
  }

  function bindSmsCardSelection() {
    const cardBoard = $("smsCardBoard");
    if (!cardBoard || cardBoard.dataset.rowBindDone === "Y") return;

    cardBoard.dataset.rowBindDone = "Y";
    cardBoard.addEventListener("click", (e) => {
      const checkbox = e.target.closest('.sms-select-toggle[type="checkbox"]');
      if (checkbox) {
        if (checkbox.checked) {
          selectOnlySmsCheckbox(checkbox);
        } else {
          clearSmsSelection();
        }
        return;
      }

      const card = e.target.closest(".sms-user-card[data-user-id]");
      if (!card) return;
      const cb = card.querySelector('.sms-select-toggle[type="checkbox"]');
      if (!cb) return;

      if (cb.checked) {
        clearSmsSelection();
      } else {
        cb.checked = true;
        selectOnlySmsCheckbox(cb);
      }
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
    bindSmsCardSelection();
    bindSmsEvents();
    syncSmsResponsiveView();
    window.addEventListener("resize", syncSmsResponsiveView);
  });
})();
