// /js/page/situation/situation_view.js
(function () {
    'use strict';

    const itemsPerPage = 15;
    let currentPage = 1;

    const regions = ['중부', '남부', '동부', '서부', '북부', '도심'];

    // (예시) 기존 더미 데이터 유지
    const situationData = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    content: `상황 ${i + 1}`,
    datetime: `2025-07-11 10:10${i.toString().padStart(2, '0')}:00`,
    status: i % 3 === 0 ? 'COMPLETE' : 'PENDING',
    location: regions[i % 5] || ''
    }));

    function getBadgeClass(status) {
    return status ? 'status-success' : 'status-primary';
    }

    function renderSituationTable(page) {
    const tbody = document.getElementById('situationList');
    if (!tbody) return;

    const start = (page - 1) * itemsPerPage;
    const currentPageData = situationData.slice(start, start + itemsPerPage);

    const rowsHTML = currentPageData.map((item, index) => {
        const badgeClass = getBadgeClass(item.status);
        return `
        <tr>
            <td>${start + index + 1}</td>
            <td>${item.content}</td>
            <td>${item.datetime}</td>
            <td class="py-1">
            <span class="status-badge ${badgeClass}">${item.status}</span>
            </td>
            <td>${item.location}</td>
        </tr>
        `;
    }).join('');

    const emptyRowsHTML = window.SituationCommon.safeGetEmptyRowsHTML(
        itemsPerPage, currentPageData.length, 5
    );

    tbody.innerHTML = rowsHTML + emptyRowsHTML;

    const countEl = document.getElementById('situationCount');
    if (countEl) countEl.innerText = `총 ${situationData.length}건 | 상황 발생 이력을 관리하세요`;

    renderSituationPagination();
    }

    function renderSituationPagination() {
    window.SituationCommon.safeRenderPagination(
        'situationPagination',
        currentPage,
        situationData.length,
        itemsPerPage,
        (newPage) => {
        currentPage = newPage;
        renderSituationTable(currentPage);
        }
    );
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (window.currentView && window.currentView !== 'situation') return;

        renderSituationTable(currentPage);

        if (window.App?.utils?.fillDateTimeInputs) {
            window.App.utils.fillDateTimeInputs();
        }
    });
})();
