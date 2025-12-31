// /js/page/situation/situation.common.js
(function () {
    'use strict';

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
})();
