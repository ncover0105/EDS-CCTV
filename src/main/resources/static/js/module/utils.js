// Pagination (modern UX + backward compatible)
//
// 지원 형태
// 1) renderPagination({ containerId, currentPage, totalItems, itemsPerPage, onPageChange })
// 2) renderPagination(containerId, currentPage, totalItems, itemsPerPage, onPageChange)
export function renderPagination(...args) {
    let containerId, currentPage, totalItems, itemsPerPage, onPageChange;
    let emptyTargetTbodyId, emptyRowColspan, emptyRowHtml, emptyRowCount;

    if (typeof args[0] === 'string') {
        [containerId, currentPage, totalItems, itemsPerPage, onPageChange] = args;
    } else {
        const opt = args[0] || {};
        containerId = opt.containerId;
        currentPage = opt.currentPage;
        totalItems = opt.totalItems;
        itemsPerPage = opt.itemsPerPage;
        onPageChange = opt.onPageChange;
        emptyTargetTbodyId = opt.emptyTargetTbodyId;
        emptyRowColspan = opt.emptyRowColspan;
        emptyRowHtml = opt.emptyRowHtml;
        emptyRowCount = opt.emptyRowCount;
    }

    const pagination = document.getElementById(containerId);
    if (!pagination) return;

    const safeTotalItems = Math.max(0, Number(totalItems) || 0);
    const safePerPage = Math.max(1, Number(itemsPerPage) || 10);
    const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePerPage));
    const safeCurrent = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

    pagination.innerHTML = '';
    pagination.classList.add('pagination-modern');

    const isEmpty = safeTotalItems === 0;

    // 0건 tbody filler
    if (isEmpty && emptyTargetTbodyId && emptyRowColspan) {
        const tbody = document.getElementById(emptyTargetTbodyId);
        if (tbody) {
            const col = Number(emptyRowColspan) || 1;
            const msg = (typeof emptyRowHtml === 'string' && emptyRowHtml.trim().length > 0)
                ? emptyRowHtml : `조회된 데이터가 없습니다.`;
            const rows = Math.max(1, Number(emptyRowCount) || 1);

            let html = `<tr><td colspan="${col}" class="text-center text-white-50 py-5">${msg}</td></tr>`;
            for (let i = 1; i < rows; i++) {
                html += `<tr class="table-empty-row"><td colspan="${col}" class="py-3"></td></tr>`;
            }
            tbody.innerHTML = html;
        }
    }

    const go = (p) => { if (typeof onPageChange === 'function') onPageChange(p); };

    const createLi = (html, { disabled = false, active = false, onClick } = {}) => {
        const li = document.createElement('li');
        li.className = 'page-item';
        if (disabled) li.classList.add('disabled');
        if (active) li.classList.add('active');
        li.innerHTML = html;
        const a = li.querySelector('a, button');
        if (a && !disabled && typeof onClick === 'function') {
            a.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
        }
        return li;
    };

    const iconBtn = ({ icon, label, disabled, onClick }) =>
        createLi(
            `<a class="page-link page-btn" href="#" title="${label}">
               <i class="bi ${icon}"></i>
               <span class="d-none d-sm-inline ms-1">${label}</span>
             </a>`,
            { disabled, onClick }
        );

    const numberBtn = ({ page, active, onClick }) =>
        createLi(
            `<a class="page-link page-num" href="#">${page}</a>`,
            { active, onClick }
        );

    // ---- 첫 페이지
    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-double-left',
        label: '처음',
        disabled: isEmpty || safeCurrent === 1,
        onClick: () => go(1),
    }));

    // ---- 이전
    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-left',
        label: '이전',
        disabled: isEmpty || safeCurrent === 1,
        onClick: () => go(safeCurrent - 1),
    }));

    // ---- 페이지 번호: 현재 기준 좌 1개 · 현재 · 우 1개
    if (!isEmpty) {
        const pages = [safeCurrent - 1, safeCurrent, safeCurrent + 1]
            .filter(p => p >= 1 && p <= totalPages);

        pages.forEach(p => {
            pagination.appendChild(numberBtn({
                page: p,
                active: p === safeCurrent,
                onClick: () => go(p),
            }));
        });
    }

    // ---- 다음
    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-right',
        label: '다음',
        disabled: isEmpty || safeCurrent === totalPages,
        onClick: () => go(safeCurrent + 1),
    }));

    // ---- 마지막 페이지
    pagination.appendChild(iconBtn({
        icon: 'bi-chevron-double-right',
        label: '마지막',
        disabled: isEmpty || safeCurrent === totalPages,
        onClick: () => go(totalPages),
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

export function showGlobalAlert(message, type = 'info', duration = 5000) {
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
export const confirm = function (title, msg, onConfirm) {
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
            } catch (_) { }

            throw new Error(errorMsg);
        }

        return res.json();

    } catch (err) {
        console.error("fetchJson error:", err);
        throw err;
    }
}

// ===== Clock / DateTime Utils (module exports) =====
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

// 한국어 포맷: YYYY년 MM월 DD일 HH : mm : ss
export function formatKoreanDateTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}년 ${m}월 ${d}일 ${hh} : ${mm} : ${ss}`;
}

// target별 interval 관리 (중복 실행 방지)
const __clockIntervals = new Map();

/**
 * @param {string|HTMLElement} target - element id or element
 * @param {number} intervalMs
 */
export function startClock(target, intervalMs = 1000) {
    const el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) return;
    const pad = (n) => String(n).padStart(2, "0");

    stopClock(el);

    const render = () => {
        const now = new Date();

        if (el.id === "currentDate") {
            const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
            const y = now.getFullYear();
            const m = pad(now.getMonth() + 1);
            const d = pad(now.getDate());
            const dayName = weekdays[now.getDay()];
            const hh = pad(now.getHours());
            const mm = pad(now.getMinutes());
            const ss = pad(now.getSeconds());

            el.innerHTML = `<span class="clock-date">${y}.${m}.${d} (${dayName})</span><span class="clock-time">${hh} : ${mm} : ${ss}</span>`;
            return;
        }

        el.textContent = formatKoreanDateTime(now);
    };

    render();
    const id = setInterval(render, intervalMs);
    __clockIntervals.set(el, id);
}

/**
 * @param {string|HTMLElement} target - element id or element
 */
export function stopClock(target) {
    const el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) return;

    const id = __clockIntervals.get(el);
    if (id) {
        clearInterval(id);
        __clockIntervals.delete(el);
    }
}

export function convertToReversedHex(value, byteLength) {
    // 숫자를 16진수로 변환한 후, 원하는 바이트 길이에 맞게 앞에 0을 채운다.
    let hexValue = parseInt(value).toString(16).padStart(byteLength * 2, '0'); // 2자리씩 채움 (예: 960 -> 0960, 2400 -> 0960 -> 096000)
    // 두 자리씩 나누어 리버스
    let reversedHex = '';
    for (let i = 0; i < hexValue.length; i += 2) {
        reversedHex = hexValue.substr(i, 2) + reversedHex; // 두 자리씩 리버스
    }
    return reversedHex; // 리버스된 16진수 반환
}
