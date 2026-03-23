// /js/page/situation/situation.common.js
(function () {
    'use strict';

    function initSidebarToggle() {
        const sidebar = document.getElementById('sitSidebar');
        const overlay = document.getElementById('sitOverlay');
        const toggleBtn = document.getElementById('sitSidebarToggle');
        const collapseBtn = document.getElementById('sitSidebarCollapse');

        function openMobile() {
            if (sidebar) sidebar.classList.add('is-open');
            if (overlay) overlay.classList.add('is-active');
            document.body.classList.add('sit-no-scroll');
        }

        function closeMobile() {
            if (sidebar) sidebar.classList.remove('is-open');
            if (overlay) overlay.classList.remove('is-active');
            document.body.classList.remove('sit-no-scroll');
        }

        function toggleMobile(e) {
            if (e) e.preventDefault();
            if (sidebar && sidebar.classList.contains('is-open')) {
                closeMobile();
            } else {
                openMobile();
            }
        }

        if (toggleBtn) toggleBtn.addEventListener('click', toggleMobile);
        if (overlay) overlay.addEventListener('click', closeMobile);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMobile();
        });
        if (collapseBtn) {
            const handleCollapse = (e) => {
                e.preventDefault();
                if (sidebar) sidebar.classList.toggle('is-collapsed');
            };
            collapseBtn.addEventListener('click', handleCollapse);
            collapseBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCollapse(e);
            });
        }
    }

    function initViewNavigation() {
        const sidebar = document.getElementById('sitSidebar');
        const buttons = document.querySelectorAll('.sit-nav-item[data-view], .sit-tab-item[data-view]');

        function navigateToView(view) {
            if (!view) return;
            const url = new URL(window.location.href);
            url.searchParams.set('view', view);
            if (sidebar && sidebar.classList.contains('is-collapsed')) {
                url.searchParams.set('sidebar', 'collapsed');
            } else {
                url.searchParams.delete('sidebar');
            }
            window.location.href = url.toString();
        }

        buttons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToView(button.dataset.view);
            });
        });
    }

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    function formatDateTime(dt) {
        if (!(dt instanceof Date) || isNaN(dt.getTime())) return '-';
        return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ` +
                `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
    }

    function parseInputDateTime(v) {
    if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }

    // LocalDateTime 파라미터: YYYY-MM-DDTHH:mm:ss
    function toLocalDateTimeParam(d) {
        if (!d) return null;
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T` +
                `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    }

    function isSameYmd(a, b) {
        if (!(a instanceof Date) || !(b instanceof Date)) return false;
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    function escapeHtml(s) {
        return String(s ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    // 전역(App.utils) 의존을 최소화하기 위한 안전 래퍼
    function safeRenderPagination(containerId, page, totalCount, pageSize, onChange) {
        if (!window.App?.utils?.renderPagination) return;
        window.App.utils.renderPagination(containerId, page, totalCount, pageSize, onChange);
    }

    function safeGetEmptyRowsHTML(itemsPerPage, currentLen, colCount) {
        if (!window.App?.utils?.getEmptyRowsHTML) return '';
        return window.App.utils.getEmptyRowsHTML(itemsPerPage, currentLen, colCount);
    }

    // 공통 네임스페이스로 제공
    window.SituationCommon = {
        pad2,
        formatDateTime,
        parseInputDateTime,
        toLocalDateTimeParam,
        isSameYmd,
        escapeHtml,
        safeRenderPagination,
        safeGetEmptyRowsHTML,
    };

    document.addEventListener('DOMContentLoaded', () => {
        initSidebarToggle();
        initViewNavigation();
    });
})();
