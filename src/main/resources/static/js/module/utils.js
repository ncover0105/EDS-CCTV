// Pagination
export function renderPagination({ 
    containerId, 
    currentPage, 
    totalItems, 
    itemsPerPage, 
    onPageChange 
}) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById(containerId);
    pagination.innerHTML = '';

    console.log(`[Pagination] containerId: ${containerId}`);
    console.log(`[Pagination] currentPage: ${currentPage}`);
    console.log(`[Pagination] totalItems: ${totalItems}`);
    console.log(`[Pagination] itemsPerPage: ${itemsPerPage}`);
    console.log(`[Pagination] totalPages: ${totalPages}`);

    const createPageItem = ({ disabled, onClick, iconClass, label, isLeft }) => {
        const li = document.createElement('li');
        li.classList.add('page-item');
        if (disabled) li.classList.add('disabled');

        const icon = `<i class="bi ${iconClass}"></i>`;
        const text = `<small class="fw-semibold d-none d-sm-inline">${label}</small>`;
        const inner = isLeft
            ? `${icon}${text}`
            : `${text}${icon}`;

        li.innerHTML = `<a class="page-link d-flex align-items-center rounded-3 gap-1" href="#">${inner}</a>`;
        if (!disabled && typeof onClick === 'function') {
            li.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                onClick();
            });
        }
        return li;
    };

    // 이전 버튼
    pagination.appendChild(createPageItem({
        disabled: currentPage === 1,
        onClick: () => onPageChange(currentPage - 1),
        iconClass: 'bi-chevron-left',
        label: '이전',
        isLeft: true
    }));

    // 현재 페이지 표시
    const infoLi = document.createElement('li');
    infoLi.classList.add('page-item', 'disabled', 'd-flex', 'align-items-center');
    infoLi.innerHTML = `
        <small class="page-link fw-semibold bg-transparent border-0">
            ${currentPage} / ${totalPages}
        </small>`;
    pagination.appendChild(infoLi);

    // 다음 버튼
    pagination.appendChild(createPageItem({
        disabled: currentPage === totalPages,
        onClick: () => onPageChange(currentPage + 1),
        iconClass: 'bi-chevron-right',
        label: '다음',
        isLeft: false
    }));
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
