// Pagination (modern UX + backward compatible)
//
// 지원 형태
// 1) renderPagination({ containerId, currentPage, totalItems, itemsPerPage, onPageChange })
// 2) renderPagination(containerId, currentPage, totalItems, itemsPerPage, onPageChange)
export function renderPagination(...args) {
    let containerId, currentPage, totalItems, itemsPerPage, onPageChange;

    // Backward compatibility: positional args
    if (typeof args[0] === 'string') {
        [containerId, currentPage, totalItems, itemsPerPage, onPageChange] = args;
    } else {
        // Object style
        const opt = args[0] || {};
        containerId = opt.containerId;
        currentPage = opt.currentPage;
        totalItems = opt.totalItems;
        itemsPerPage = opt.itemsPerPage;
        onPageChange = opt.onPageChange;
    }

    const pagination = document.getElementById(containerId);
    if (!pagination) return;

    const safeTotalItems = Math.max(0, Number(totalItems) || 0);
    const safePerPage = Math.max(1, Number(itemsPerPage) || 10);
    const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePerPage));
    const safeCurrent = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

    pagination.innerHTML = '';
    pagination.classList.add('pagination-modern'); // 스타일 훅

    // 데이터 0건이면 버튼 비활성 상태로 "1/1"만 표시
    const isEmpty = safeTotalItems === 0;

    // 내부 유틸
    const createLi = (html, { disabled = false, active = false, onClick } = {}) => {
        const li = document.createElement('li');
        li.className = 'page-item';
        if (disabled) li.classList.add('disabled');
        if (active) li.classList.add('active');

        li.innerHTML = html;

        const a = li.querySelector('a,button');
        if (a && !disabled && typeof onClick === 'function') {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                onClick();
            });
        }
        return li;
    };

    const iconBtn = ({ icon, label, disabled, onClick, ariaLabel }) => {
        const html = `
            <a class="page-link page-btn" href="#" aria-label="${ariaLabel || label}">
                <i class="bi ${icon}"></i>
                <span class="d-none d-sm-inline">${label}</span>
            </a>
        `;
        return createLi(html, { disabled, onClick });
    };

    const numberBtn = ({ page, active, disabled, onClick }) => {
        const html = `
            <a class="page-link page-num" href="#" aria-label="page ${page}">
                ${page}
            </a>
        `;
        return createLi(html, { active, disabled, onClick });
    };

    const ellipsis = () => {
        const html = `
            <span class="page-link page-ellipsis" aria-hidden="true">…</span>
        `;
        const li = document.createElement('li');
        li.className = 'page-item disabled';
        li.innerHTML = html;
        return li;
    };

    // 표시할 페이지 번호 계산 (Google 스타일)
    const getPageWindow = (cur, total) => {
        // 1, total은 항상 노출
        // cur 주변으로 2칸씩
        const set = new Set([1, total, cur, cur - 1, cur - 2, cur + 1, cur + 2]);
        const pages = [...set].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
        return pages;
    };

    const go = (p) => {
        if (typeof onPageChange === 'function') onPageChange(p);
    };

    // ---- First / Prev
    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-double-left',
        label: '처음',
        ariaLabel: 'First page',
        disabled: isEmpty || safeCurrent === 1,
        onClick: () => go(1),
    }));

    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-left',
        label: '이전',
        ariaLabel: 'Previous page',
        disabled: isEmpty || safeCurrent === 1,
        onClick: () => go(safeCurrent - 1),
    }));

    // ---- Numbers + Ellipsis
    const pages = getPageWindow(safeCurrent, totalPages);

    let prev = 0;
    pages.forEach((p) => {
        if (prev && p - prev > 1) {
            pagination.appendChild(ellipsis());
        }
        pagination.appendChild(numberBtn({
            page: p,
            active: p === safeCurrent,
            disabled: isEmpty,
            onClick: () => go(p),
        }));
        prev = p;
    });

    // ---- Next / Last
    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-right',
        label: '다음',
        ariaLabel: 'Next page',
        disabled: isEmpty || safeCurrent === totalPages,
        onClick: () => go(safeCurrent + 1),
    }));

    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-double-right',
        label: '마지막',
        ariaLabel: 'Last page',
        disabled: isEmpty || safeCurrent === totalPages,
        onClick: () => go(totalPages),
    }));

    // ---- Info (range)
    const startIdx = isEmpty ? 0 : (safeCurrent - 1) * safePerPage + 1;
    const endIdx = isEmpty ? 0 : Math.min(safeCurrent * safePerPage, safeTotalItems);

    const infoHtml = `
        <span class="page-link page-info">
            <span class="d-none d-md-inline">${startIdx}-${endIdx} / ${safeTotalItems}</span>
            <span class="d-md-none">${safeCurrent}/${totalPages}</span>
        </span>
    `;
    const infoLi = document.createElement('li');
    infoLi.className = 'page-item disabled ms-1';
    infoLi.innerHTML = infoHtml;
    pagination.appendChild(infoLi);
}


export function safeValue(value, isNumber = false, suffix = '', digits = 0) {
    try {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        if (isNumber) {
            const num = Number(value);
            if (isNaN(num)) {
                console.error(`safeValue: 숫자 변환 불가 값=`, value);
                return '-';
            }
            return num.toFixed(digits) + suffix;
        }
        return String(value) + suffix;
    } catch (err) {
        console.error('safeValue 오류:', err, 'value=', value, 'isNumber=', isNumber);
        return '-';
    }
}

export function getEmptyRowsHTML(itemsPerPage, size, colCount) {
    const emptyRows = itemsPerPage - size;
    let rows = '';
    for (let i = 0; i < emptyRows; i++) {
        let tds = '';
        for (let j = 0; j < colCount; j++) {
            tds += `<td>&nbsp;</td>`;
        }
        rows += `<tr>${tds}</tr>`;
    }
    return rows;
}

let globalAlertTimeouts = {
    hideTimeout: null,
    dNoneTimeout: null
};

export function showGlobalAlert(message, type = 'info', duration = 2000) {
    const alertEl = document.getElementById("globalAlert");
    const alertText = document.getElementById("globalAlertText");
    const alertIcon = document.getElementById("globalAlertIcon");

    if (!alertEl || !alertText || !alertIcon) {
        console.warn("[showGlobalAlert] 필수 DOM 요소가 없습니다.");
        return;
    }

    // 이전 타이머 클리어 (연속 호출 대비)
    if (globalAlertTimeouts.hideTimeout) clearTimeout(globalAlertTimeouts.hideTimeout);
    if (globalAlertTimeouts.dNoneTimeout) clearTimeout(globalAlertTimeouts.dNoneTimeout);

    // 메시지 및 아이콘 설정
    alertText.textContent = message;

    const iconMap = {
        info: "/images/icons.svg#info-fill",
        success: "/images/icons.svg#check-circle-fill",
        warning: "/images/icons.svg#exclamation-triangle-fill",
        danger: "/images/icons.svg#exclamation-triangle-fill"
    };

    const iconHref = iconMap[type] || iconMap.info;

    const useEl = document.createElementNS("http://www.w3.org/2000/svg", "use");
    useEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", iconHref);

    alertIcon.innerHTML = '';
    alertIcon.setAttribute("fill", "currentColor");
    alertIcon.appendChild(useEl);

    // 클래스 설정 및 표시
    alertEl.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertEl.classList.remove("d-none");

    // 사라지는 처리 예약
    globalAlertTimeouts.hideTimeout = setTimeout(() => {
        alertEl.classList.remove("show");
    }, duration);

    globalAlertTimeouts.dNoneTimeout = setTimeout(() => {
        alertEl.classList.add("d-none");
    }, duration + 300); // fade out 애니메이션 시간
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return '방금';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    return `${hours}시간 전`;
}

export function showToast(message, title = '알림') {
    const toastContainer = document.getElementById('globalToastContainer');
    const createdAt = new Date();

    if (!toastContainer) {
        console.error('toast container가 없습니다.');
        return;
    }

    const toast = document.createElement('div');
    // toast.className = 'toast align-items-center text-bg-primary border-0';
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('data-bs-autohide', 'false');  // 자동 닫힘 비활성화
    // toast.setAttribute('data-bs-delay', '5000'); // 5초 후 자동 닫힘

    const timeId = `time-${Date.now()}`;

    toast.innerHTML = `
        <div class="toast-header">
            <div style="width: 20px; height: 20px; background-color: #BE3D2A; border-radius: 0.375rem;" class="me-2"></div>
            <strong class="me-auto">${title}</strong>
            <small id="${timeId}">${timeAgo(createdAt)}</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    const intervalId = setInterval(() => {
        const timeEl = document.getElementById(timeId);
        if (timeEl) {
            timeEl.innerText = timeAgo(createdAt);
        } else {
            clearInterval(intervalId);
        }
    }, 1000);

    toast.addEventListener('hidden.bs.toast', () => {
        clearInterval(intervalId);
        toast.remove();
    });
}

/**
 * POST JSON 데이터를 전송하고 응답을 JSON으로 파싱합니다.
 * @param {string} url - API 엔드포인트 경로
 * @param {object} data - 요청할 JSON 페이로드
 * @returns {Promise<any>} - 파싱된 JSON 응답
 */
export async function postJsonData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return await response.json();
}

export function getNowDateTime() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

export function getTodayRange() {
    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());

    start.setMinutes(start.getMinutes() - start.getTimezoneOffset());

    return {
        start: start.toISOString().slice(0, 16),
        end: end.toISOString().slice(0, 16)
    };
}

export function fillDateTimeInputs(startId = "startDateTime", endId = "endDateTime") {
    const now = getNowDateTime();

    const startInput = document.getElementById(startId);
    const endInput = document.getElementById(endId);

    if (startInput && !startInput.value) startInput.value = now;
    if (endInput && !endInput.value) endInput.value = now;
}

export const toast = showToast;
export const alert = showGlobalAlert;
export const confirm = function(title, msg, onConfirm) {
    const modal = document.getElementById("confirm_modal");

    document.getElementById("confirmModalLabel").innerText = title;
    document.getElementById("confirmModalMessage").innerText = msg;

    const btn = document.getElementById("confirmModalConfirmBtn");
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", () => {
        if (onConfirm) onConfirm();
        bootstrap.Modal.getInstance(modal).hide();
    });

    new bootstrap.Modal(modal).show();
};

export async function fetchJson(url, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : null
    };

    try {
        const res = await fetch(url, config);

        if (!res.ok) {
            let errorMsg = `HTTP ${res.status}`;

            // 서버가 JSON 오류 메시지 보내면 출력
            try {
                const errorJson = await res.json();
                errorMsg = errorJson.message || JSON.stringify(errorJson);
            } catch (_) {}

            throw new Error(errorMsg);
        }

        return res.json();

    } catch (err) {
        console.error("fetchJson error:", err);
        throw err;
    }
}


export function formatDateTime(date = new Date()) {
    const pad = n => n.toString().padStart(2, "0");

    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
