const itemsPerPage = 15;
const resultItemsPerPage = 5;

let currentPage = 1;

const alertNames = ['태풍 경보', '호우 주의보', '강풍 경보', '폭염 경보', '한파 주의보'];
const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산'];

let specialData = [];
let broadcastData = [];
let filteredResultData = [];
const resultData = [];

const situationData = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    content: `상황 내용 예시 ${i + 1}`,
    datetime: `2025-07-11 10:${(10 + i).toString().padStart(2, '0')}:00`,
    status: (i % 3 === 0) ? '미승인' : '승인',
    location: `지역 ${((i % 5) + 1)}`
}));

const renderMap = {
    situation: (page) => renderSituationTable(page),
    broadcast: (page) => {
        renderBroadcastTable(page);
        // renderResultTable(page);
    },
    special: (page) => {
        renderSpecialTable(page);
    }
};

function renderView(currentView, currentPage) {
    const renderFunc = renderMap[currentView];
    if (renderFunc) {
        renderFunc(currentPage);
    } else {
        refreshData();
    }
}

function getBadgeClass(status) {
    return status === '승인' ? 'status-success' : 'status-primary';
}

function getResultBadgeClass(result) {
    return result === '성공' ? 'status-success' : 'status-error';
}

// 초기 랜덤 데이터 생성 및 렌더링
document.addEventListener('DOMContentLoaded', function () {
    broadcastData = generateRandomBroadcastData(20);
    specialData = generateRandomSpecialData();

    renderView(currentView, currentPage);

    App.utils.fillDateTimeInputs(); // 시간 입력 렌더링
});

// --- 상황발생이력 ---
function renderSituationTable(page) {
    const tbody = document.getElementById('situationList');
    if (!tbody) {
        console.error('situationList tbody 요소가 없습니다.');
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const currentPageData = situationData;
    // const currentPageData = situationData.slice(start, start + itemsPerPage);

    // 전체 HTML 문자열 생성
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
            </tr>`;
    }).join('');

    // 빈 행 추가
    const emptyRowsHTML = App.utils.getEmptyRowsHTML(itemsPerPage, currentPageData.length, 5);

    // DOM 조작 1회로 줄임
    tbody.innerHTML = rowsHTML + emptyRowsHTML;

    // 총 개수 표시
    // document.getElementById('situationCount').innerText = `총 ${situationData.length}개`;
    document.getElementById('situationCount').innerText = `총 ${situationData.length}건 | 상황 발생 목록`;

    // renderSituationPagination();
}

function renderSituationPagination() {
    App.utils.renderPagination({
        containerId: 'situationPagination',
        currentPage,
        totalItems: situationData.length,
        itemsPerPage,
        onPageChange: (newPage) => {
            currentPage = newPage;
            renderSituationTable(currentPage);
            renderSituationPagination();
        }
    });
}

// --- 발령이력 ---
function generateRandomBroadcastData(count) {
    const types = ['경보', '주의보', '속보', '안내', '점검'];
    const modes = ['긴급 모드', '일반 모드', '자동 모드'];
    const medias = ['DMB', 'SMS', 'TV', '라디오'];
    const targets = ['전국', '서울특별시', '부산광역시', '강원도', '제주도'];
    const disasters = ['태풍', '호우', '지진', '산불', '한파', '폭염', '홍수'];
    const senderNames = ['홍길동', '김철수', '이영희', '박민수', '정다은'];
    const senderIds = ['admin01', 'manager02', 'operator03', 'system04', 'user05'];

    const now = new Date();

    return Array.from({ length: count }, (_, i) => {
        const time = new Date(now.getTime() - Math.random() * 1e7)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);

        const disaster = disasters[Math.floor(Math.random() * disasters.length)];
        const senderIndex = Math.floor(Math.random() * senderNames.length);

        return {
            selected: false, // 선택 체크박스 용
            no: i + 1, // 번호
            time: time, // 발령 시간
            type: types[Math.floor(Math.random() * types.length)], // 종류
            mode: modes[Math.floor(Math.random() * modes.length)], // 모드
            media: medias[Math.floor(Math.random() * medias.length)], // 매체
            target: targets[Math.floor(Math.random() * targets.length)], // 대상
            disaster: disaster, // 재난명
            ment: `${disaster} 관련 문안이 발송되었습니다.`, // 문안
            senderId: senderIds[senderIndex], // 발령자 ID
            senderName: senderNames[senderIndex], // 발령자 이름
        };
    });
}

function generateRandomResultData(count) {
    const mediaTypes = ['DMB', 'SMS', 'TV'];
    const results = ['성공', '실패'];

    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        equipment: `장비-${i + 1}`,
        media: mediaTypes[Math.floor(Math.random() * mediaTypes.length)],
        elapsed: `${Math.floor(Math.random() * 5) + 1}분 경과`,
        result: results[Math.floor(Math.random() * results.length)],
    }));
}

function renderBroadcastTable(page) {
    const listContainer = document.getElementById('broadcastList');
    const countEl = document.getElementById('broadcastCount');

    if (!listContainer) {
        console.error('broadcastList 요소가 없습니다.');
        return;
    }

    const start = (page - 1) * resultItemsPerPage;
    // const currentPageData = broadcastData.slice(start, start + resultItemsPerPage);
    // <div class="col-12 col-md-6">
    //     <div class="broadcast-card card ${item.selected ? 'active-card' : ''}" data-id="${item.no}">
    //     <div class="card-body">
    //         <div class="card-header-line d-flex justify-content-between align-items-center mb-2">
    //             <h6 class="mb-0 fw-semibold text-truncate">${item.disaster}</h6>
    //             <input type="checkbox" class="form-check-input broadcast-checkbox" data-id="${item.no}" ${item.selected ? 'checked' : ''}>
    //         </div>
    //         <div class="broadcast-info small">
    //         <div><span class="fw-semibold text-muted">발령 시간:</span> ${item.time}</div>
    //         <div><span class="fw-semibold text-muted">종류:</span> ${item.type}</div>
    //         <div><span class="fw-semibold text-muted">모드:</span> ${item.mode}</div>
    //         <div><span class="fw-semibold text-muted">대상:</span> ${item.target}</div>
    //         <div><span class="fw-semibold text-muted">문안:</span> ${item.ment}</div>
    //         <div><span class="fw-semibold text-muted">발령자:</span> ${item.senderName}</div>
    //         </div>
    //     </div>
    //     </div>
    // </div>
    // ✅ 카드 형태로 렌더링
    const cardsHTML = broadcastData.map(item => `
    <div class="col-12 col-md-6 text-wrap">
        <div class="broadcast-card card ${item.selected ? 'active-card' : ''}" data-id="${item.no}">
            <div class="card-body">
                <div class="card-header-line d-flex justify-content-between align-items-center mb-3">
                    <span class="status-badge status-info">${item.type}</span>
                    <input type="checkbox" class="form-check-input broadcast-checkbox" data-id="${item.no}" ${item.selected ? 'checked' : ''}>
                </div>
                <h6 class="mb-0 fw-semibold text-truncate mb-2">${item.disaster}</h6>
                <small class="text-muted mb-2">${item.ment}</small>
                <div class="broadcast-info small">
                    <div><span class="fw-semibold text-muted">발령 시간:</span> ${item.time}</div>
                    <div><span class="fw-semibold text-muted">모드:</span> ${item.mode}</div>
                    <div><span class="fw-semibold text-muted">대상:</span> ${item.target}</div>
                    <div><span class="fw-semibold text-muted">발령자:</span> ${item.senderName}</div>
                </div>
            </div>
        </div>
    </div>
    `).join('');

    listContainer.innerHTML = cardsHTML;
    countEl.innerText = `총 ${broadcastData.length}개`;
    renderBroadcastPagination();

    // ✅ 행 선택 로직 유지
    document.querySelectorAll('.broadcast-card').forEach(card => {
        const id = parseInt(card.dataset.id);
        const checkbox = card.querySelector('.broadcast-checkbox');
    
        const selectCard = () => {
            const item = broadcastData.find(d => d.no === id);
    
            // ✅ 이미 선택된 상태라면 -> 해제
            if (item && item.selected) {
                card.classList.remove('active-card');
                checkbox.checked = false;
                item.selected = false;
            } 
            // ✅ 선택되지 않은 상태라면 -> 다른 것 전부 해제 후 선택
            else {
                document.querySelectorAll('.broadcast-card').forEach(c => {
                    c.classList.remove('active-card');
                    c.querySelector('.broadcast-checkbox').checked = false;
                });
                broadcastData.forEach(d => d.selected = false);
    
                card.classList.add('active-card');
                checkbox.checked = true;
                if (item) item.selected = true;
            }
    
            updateSelectedResults();
        };
    
        card.addEventListener('click', (e) => {
            selectCard();
        });
    
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCard();
        });
    });
}

// function renderBroadcastTable(page) {
//     const tbody = document.getElementById('broadcastList');
//     const countEl = document.getElementById('broadcastCount');

//     if (!tbody) {
//         console.error('broadcastList tbody 요소가 없습니다.');
//         return;
//     }

//     const start = (page - 1) * resultItemsPerPage;
//     const currentPageData = broadcastData.slice(start, start + resultItemsPerPage);
// //     <tr class="broadcast-row ${item.selected ? 'table-active' : ''}" data-id="${item.no}">
// //     <td class="text-center">
// //         <input type="checkbox" class="form-check-input broadcast-checkbox" data-id="${item.no}" ${item.selected ? 'checked' : ''}>
// //     </td>
// //     <td>${item.no}</td>
// //     <td>${item.time}</td>
// //     <td>${item.type}</td>
// //     <td>${item.mode}</td>
// //     <td>${item.media}</td>
// //     <td>${item.target}</td>
// //     <td>${item.disaster}</td>
// //     <td>${item.ment}</td>
// //     <td>${item.senderId}</td>
// //     <td>${item.senderName}</td>
// // </tr>
//     const rowsHTML = currentPageData.map(item => `
//         <tr class="broadcast-row ${item.selected ? 'table-active' : ''}" data-id="${item.no}">
//             <td class="text-center">
//                 <input type="checkbox" class="form-check-input broadcast-checkbox" data-id="${item.no}" ${item.selected ? 'checked' : ''}>
//             </td>
//             <td>${item.time}</td>
//             <td>${item.type}</td>
//             <td>${item.mode}</td>
//             <td>${item.media}</td>
//             <td>${item.target}</td>
//             <td>${item.disaster}</td>
//             <td>${item.ment}</td>
//             <td>${item.senderId}</td>
//             <td>${item.senderName}</td>
//         </tr>
//     `).join('');

//     const emptyRowsHTML = App.utils.getEmptyRowsHTML(resultItemsPerPage, currentPageData.length, 11);
//     tbody.innerHTML = rowsHTML + emptyRowsHTML;

//     countEl.innerText = `총 ${broadcastData.length}개`;
//     renderBroadcastPagination();

//     // ✅ 행 + 체크박스 모두 선택 가능하도록 통합 이벤트
//     document.querySelectorAll('.broadcast-row').forEach(row => {
//         const id = parseInt(row.dataset.id);
//         const checkbox = row.querySelector('.broadcast-checkbox');

//         // 하나의 통합 핸들러 (행/체크박스 공용)
//         const selectRow = () => {
//             // 모두 초기화
//             document.querySelectorAll('.broadcast-row').forEach(r => {
//                 r.classList.remove('table-active');
//                 r.querySelector('.broadcast-checkbox').checked = false;
//             });
//             broadcastData.forEach(d => d.selected = false);

//             // 현재 행만 선택
//             row.classList.add('table-active');
//             checkbox.checked = true;
//             const item = broadcastData.find(d => d.no === id);
//             if (item) item.selected = true;

//             updateSelectedResults();
//         };

//         // 행 클릭 시
//         row.addEventListener('click', (e) => {
//             // 클릭한 곳이 체크박스더라도 같은 처리 실행
//             selectRow();
//         });

//         // 체크박스 직접 클릭 시
//         checkbox.addEventListener('click', (e) => {
//             e.stopPropagation(); // 클릭 버블링 방지
//             selectRow();
//         });
//     });
// }

function renderBroadcastPagination() {
    App.utils.renderPagination({
        containerId: 'broadcastPagination',
        currentPage: currentPage,
        totalItems: broadcastData.length,
        itemsPerPage: resultItemsPerPage,
        onPageChange: (newPage) => {
            currentPage = newPage;
            renderBroadcastTable(currentPage);
            renderBroadcastPagination();
        }
    });
}

function updateSelectedResults() {
    const selectedItems = broadcastData.filter(item => item.selected);
    const detailContainer = document.getElementById('broadcastDetail');
    const detailList = document.getElementById('detailList');
    const noResultMessage = document.getElementById('noResultMessage');
    const resultCardsContainer = document.getElementById('resultCardsContainer');

    // 초기화
    resultCardsContainer.innerHTML = '';
    detailList.innerHTML = '';

    if (selectedItems.length === 0) {
        detailContainer.classList.add('d-none');
        resultCardsContainer.classList.add('d-none');
        noResultMessage.classList.remove('d-none');
        return;
    }

    // ✅ 상단 발령 상세 카드
    const selected = selectedItems[0];
    detailContainer.classList.remove('d-none');
    noResultMessage.classList.add('d-none');
    detailList.innerHTML = `
    <div class="detail-info-grid">
        <div class="detail-info-item">
            <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            <div>
                <div class="info-label">재난명</div>
                <div class="info-value">${selected.disaster}</div>
            </div>
        </div>
        
        <div class="detail-info-item">
            <i class="bi bi-clock-fill text-primary"></i>
            <div>
                <div class="info-label">발령 시간</div>
                <div class="info-value">${selected.time}</div>
            </div>
        </div>
        
        <div class="detail-info-item">
            <i class="bi bi-tag-fill text-primary"></i>
            <div>
                <div class="info-label">종류</div>
                <div class="info-value">${selected.type}</div>
            </div>
        </div>
        
        <div class="detail-info-item">
            <i class="bi bi-gear-fill text-primary"></i>
            <div>
                <div class="info-label">모드</div>
                <div class="info-value">${selected.mode}</div>
            </div>
        </div>
        
        <div class="detail-info-item">
            <i class="bi bi-people-fill text-primary"></i>
            <div>
                <div class="info-label">대상</div>
                <div class="info-value">${selected.target}</div>
            </div>
        </div>
        
        <div class="detail-info-item">
            <i class="bi bi-person-fill text-primary"></i>
            <div>
                <div class="info-label">발령자</div>
                <div class="info-value">${selected.senderName}</div>
            </div>
        </div>

        <div class="detail-info-item full-width">
            <i class="bi bi-chat-text-fill text-primary"></i>
            <div>
                <div class="info-label">문안</div>
                <div class="info-value">${selected.ment}</div>
            </div>
        </div>

    </div>
`;


    // ✅ 결과 데이터 생성 (샘플)
    const newResults = Array.from({ length: 10 }).map((_, idx) => ({
        id: `${selected.no}-${idx + 1}`,
        time: new Date().toLocaleString(),
        result: Math.random() > 0.3 ? '성공' : '실패',
        name: selected.senderName,
        deviceType: selected.media || 'LTE',
        authId: 'AUTH-' + selected.senderId,
        lteNumber: `010-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}`,
        manufacturer: ['삼성전자','LG전자','한화테크윈'][Math.floor(Math.random()*3)]
    }));

    // ✅ 결과 카드 렌더링
    renderResultCards(newResults);
}

function renderResultCards(results) {
    const container = document.getElementById('resultCardsContainer');
    container.classList.remove('d-none');
    container.innerHTML = results.map(res => {
        const badgeClass = res.result === '성공' ? 'status-success' : 'status-error';
        const iconClass = res.result === '성공' ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
        
        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card result-card shadow-sm h-100">
                    <div class="card-body p-3 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap">
                            <div class="flex-grow-1 pe-2 text-truncate">
                                <h6 class="fw-bold mb-1 text-dark text-truncate">${res.name}</h6>
                                <small class="text-muted">${res.time}</small>
                            </div>
                            <span class="status-badge ${badgeClass} d-flex align-items-center gap-1 flex-shrink-0">
                                <i class="bi ${iconClass}"></i> ${res.result}
                            </span>
                        </div>

                        <div class="row g-2 small text-wrap">
                            <div class="col-6 d-flex align-items-start">
                                <div class="text-truncate">
                                    <div class="text-muted small">단말</div>
                                    <div class="fw-semibold">${res.deviceType}</div>
                                </div>
                            </div>

                            <div class="col-6 d-flex align-items-start">
                                <div class="text-truncate">
                                    <div class="text-muted small">제조사</div>
                                    <div class="fw-semibold">${res.manufacturer}</div>
                                </div>
                            </div>

                            <div class="col-6 d-flex align-items-start">
                                <div class="text-truncate">
                                    <div class="text-muted small">LTE</div>
                                    <div class="text-truncate fw-semibold">${res.lteNumber}</div>
                                </div>
                            </div>

                            <div class="col-6 d-flex align-items-start">
                                <div class="text-truncate">
                                    <div class="text-muted small">인증 ID</div>
                                    <div class="text-truncate fw-semibold">${res.authId}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// function renderResultTable(page) {
//     const tbody = document.getElementById('resultList');
//     if (!tbody) {
//         console.error('resultList tbody 요소가 없습니다.');
//         return;
//     }
//     if (resultData.length === 0) {
//         document.getElementById('noDataMessage').style.display = 'flex';
//       } else {
//         document.getElementById('noDataMessage').style.display = 'none';
//       }
//     const start = (page - 1) * 4;
//     const currentPageData = resultData.slice(start, start + 4);

//     const rowsHTML = currentPageData.map((item, idx) => {
//         const badgeClass = item.result === '성공' ? 'status-success' : 'status-error';
//         return `
//         <tr>
//             <td>${item.id}</td>
//             <td>${item.time}</td>
//             <td>
//                 <div class="d-flex justify-content-center align-items-center">
//                     <span class="status-badge ${badgeClass}">${item.result}</span>
//                 </div>
//             </td>
//             <td>${item.name}</td>
//             <td>${item.deviceType}</td>
//             <td>${item.authId}</td>
//             <td>${item.lteNumber}</td>
//             <td>${item.manufacturer}</td>
//         </tr>`;
//     }).join('');

//     const emptyRowsHTML = App.utils.getEmptyRowsHTML(4, currentPageData.length, 5);
//     tbody.innerHTML = rowsHTML + emptyRowsHTML;

//     document.getElementById('resultCount').innerText = `총 ${resultData.length}개`;
//     renderResultPagination();
// }

// // 선택 발령 결과 테이블
// function renderResultPagination() {
//     App.utils.renderPagination({
//         containerId: 'resultListPagination',
//         currentPage: currentPage,
//         totalItems: resultData.length,
//         itemsPerPage: 4,
//         onPageChange: (newPage) => {
//             currentPage = newPage;
//             renderResultTable(currentPage);
//             renderResultPagination();
//         }
//     });
// }

// --- 특보이력 ---
function generateRandomSpecialData() {
    const length = Math.floor(Math.random() * 30) + 10;
    return Array.from({ length }, (_, i) => {
        const alert = alertNames[Math.floor(Math.random() * alertNames.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const hour = String(8 + (i % 12)).padStart(2, '0');
        const min = String(10 + i).padStart(2, '0');

        let status = '';
        if (i % 3 === 0) status = '승인';
        else if (i % 3 === 1) status = '대기';
        else status = '미승인';

        return {
            no: i + 1,
            name: `${alert} ${i + 1}`,
            time: `2025-07-16 ${hour}:${min}:00`,
            region: region,
            status: status,
            result: (status === '승인') ? '발령' : '미발령'
        };
    });
}

function renderSpecialTable(page = currentPage) {
    const tbody = document.getElementById('specialList');
    if (!tbody) {
        console.error('specialList tbody 요소가 없습니다.');
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const currentPageData = specialData;

    const rowsHTML = currentPageData.map(item => {
        const badgeClass = item.status === '승인' ? 'status-success' : 'status-primary';
        return `
        <tr>
            <td>${item.no}</td>
            <td>${item.name}</td>
            <td>${item.time}</td>
            <td>${item.region}</td>
            <td><span class="status-badge ${badgeClass}">${item.status}</span></td>
            <td>${item.result}</td>
        </tr>`;
    }).join('');

    const emptyRowsHTML = App.utils.getEmptyRowsHTML(itemsPerPage, currentPageData.length, 6);
    tbody.innerHTML = rowsHTML + emptyRowsHTML;
    document.getElementById('specialCount').innerText = `총 ${specialData.length}건 | 특보이력을 관리하세요`;
    // document.getElementById('specialCount').innerText = `총 ${specialData.length}개`;
    // renderSpecialPagination(page);
}

function renderSpecialPagination() {
    App.utils.renderPagination({
        containerId: 'specialPagination',
        currentPage: currentPage,
        totalItems: specialData.length,
        itemsPerPage: itemsPerPage,
        onPageChange: (newPage) => {
            currentPage = newPage;
            renderSpecialTable(currentPage);
            renderSpecialPagination();
        }
    });
}

function refreshData() {
    specialData = generateRandomSpecialData();
    renderSpecialTable(currentPage);
}