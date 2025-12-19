const itemsPerPage = 15;
const resultItemsPerPage = 5;
let currentPage = 1;
const alertNames = ['홍수', '태풍', '산불', '지진', '화재'];
const regions = ['중부', '남부', '동부', '서부', '북부', '도심'];
let specialData;
let broadcastData = [];
let filteredResultData = [];
const resultData = [];
const situationData = Array.from({length: 32}, (_, i) => ({
    id: i + 1,
    content: `상황 ${i + 1}`,
    datetime: `2025-07-11 10:10${i.toString().padStart(2, '0')}:00`,
    status: i % 3 === 0 ? 'COMPLETE' : 'PENDING',
    location: regions[i % 5] || ''
}));

const renderMap = {
    'situation-page': renderSituationTable,
    'broadcast-page': renderBroadcastCards,  // 변경: 테이블 → 카드
    'special-page': renderSpecialTable
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
    return status ? 'status-success' : 'status-primary';
}

function getResultBadgeClass(result) {
    return result ? 'status-success' : 'status-error';
}

document.addEventListener('DOMContentLoaded', function() {
    broadcastData = generateRandomBroadcastData(20);
    specialData = generateRandomSpecialData();
    
    const view = document.body.dataset.view || 'none';
    renderView(view, currentPage);
    
    if (window.App?.utils?.fillDateTimeInputs) {
        App.utils.fillDateTimeInputs();
    }
    
    if (currentView === 'broadcast') {
        bindBroadcastEventsOnce();
        applyBroadcastFilters(true);
    }
});

// ==================== SITUATION (기존 유지) ====================
function renderSituationTable(page) {
    const tbody = document.getElementById('situationList');
    if (!tbody) {
        console.error('situationList tbody not found');
        return;
    }

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

    const emptyRowsHTML = App.utils.getEmptyRowsHTML(itemsPerPage, currentPageData.length, 5);
    
    tbody.innerHTML = rowsHTML + emptyRowsHTML;
    document.getElementById('situationCount').innerText = `${situationData.length}건`;
    
    renderSituationPagination();
}

function renderSituationPagination() {
    App.utils.renderPagination(
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

// ==================== BROADCAST (페이지네이션 → 카드 리스트로 변경) ====================
function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatDateTime(dt) {
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
}

function parseInputDateTime(v) {
    // datetime-local: YYYY-MM-DDTHH:mm -> Date
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

function isSameYmd(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

function generateRandomBroadcastData(count) {
    const types = ['REAL', 'TEST'];
    const priorities = ['NONE', 'CAUTION', 'WARNING', 'DANGER'];
    const codes = ['ACL', 'CFW', 'RWT', 'HTW', 'SNO', 'DNG'];
    const locations = ['1층', '2층', '3층', '옥상', '지하'];
    const disasters = ['홍수', '태풍', '산불', '지진', '화재', '가스누출'];
    const speakerNames = ['001', '002', '003', '004', '005'];
    const senderNames = ['관리자', '시스템', '자동', '운영팀', '긴급'];

    const now = new Date();
    return Array.from({length: count}, (_, i) => {
        const dt = new Date(now.getTime() - Math.floor(Math.random() * 1000 * 60 * 60 * 48) * 1000);
        const disaster = disasters[Math.floor(Math.random() * disasters.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const isReal = Math.random() > 0.35; // 65%
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const speakerName = speakerNames[Math.floor(Math.random() * speakerNames.length)];
        const code = codes[Math.floor(Math.random() * codes.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const senderName = senderNames[Math.floor(Math.random() * senderNames.length)];
        
        const message = priority === 'DANGER' ? `${disaster} 위험 상황 발생. 즉시 대피하세요.` :
                       priority === 'WARNING' ? `${disaster} 경고. 주의 필요.` :
                       priority === 'CAUTION' ? `${disaster} 주의 상황입니다.` :
                       `${disaster} 상황 보고`;

        return {
            selected: false,
            no: i + 1,
            dt,
            time: formatDateTime(dt),
            title: `${disaster} ${type}`,
            isReal,
            priority,
            speakerName,
            code,
            location,
            message,
            senderName,
            volume: Math.floor(Math.random() * 30) + 70
        };
    });
}

function getPriorityBadge(priority) {
    switch (priority) {
        case 'DANGER': return 'cls danger text';
        case 'WARNING': return 'cls warning text';
        case 'CAUTION': return 'cls info text';
        default: return 'cls success text';
    }
}

function updateBroadcastStats(list) {
    const totalEl = document.getElementById('broadcast_stat_total');
    const todayEl = document.getElementById('broadcast_stat_today');
    const realEl = document.getElementById('broadcast_stat_real');
    const testEl = document.getElementById('broadcast_stat_test');
    
    if (!totalEl || !todayEl || !realEl || !testEl) return;
    
    const today = new Date();
    const total = list.length;
    const todayCount = list.filter(x => isSameYmd(x.dt, today)).length;
    const realCount = list.filter(x => x.isReal).length;
    const testCount = list.filter(x => !x.isReal).length;
    
    totalEl.textContent = total;
    todayEl.textContent = todayCount;
    realEl.textContent = realCount;
    testEl.textContent = testCount;
    
    document.getElementById('broadcastCount').textContent = `총 ${total}건`;
}

// ==================== 핵심 변경: 카드 리스트 렌더링 ====================
let broadcastFiltered = [];

function renderBroadcastCards() {  // 변경: renderBroadcastTable → renderBroadcastCards
    const container = document.getElementById('broadcastCardList');
    if (!container) {
        console.error('broadcastCardList not found');
        return;
    }

    container.innerHTML = '';

    if (broadcastFiltered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-secondary">
                <i class="bi bi-broadcast display-1 opacity-50 mb-3"></i>
                <h5 class="mb-1">발령 내역이 없습니다</h5>
                <p class="mb-0 small">검색 조건을 변경하여 확인해보세요</p>
            </div>
        `;
        updateBroadcastStats([]);
        return;
    }

    broadcastFiltered.forEach((item, index) => {
        const card = createBroadcastCard(item, index);
        container.appendChild(card);
    });

    updateBroadcastStats(broadcastFiltered);
}

function createBroadcastCard(item, index) {
    const card = document.createElement('div');
    card.className = 'fade-in mb-3';
    card.style.cssText = `
        animation-delay: ${index * 0.05}s;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        transition: all 0.3s ease;
        overflow: hidden;
        background: white;
    `;
    card.dataset.id = item.no;
    card.onmouseenter = () => card.style.cssText += 'border-color:rgba(13,110,253,0.2);box-shadow:0 8px 25px rgba(0,0,0,0.12);transform:translateY(-2px);';
    card.onmouseleave = () => card.style.cssText = card.style.cssText.replace(/border-color:.*?;|box-shadow:.*?;|transform:.*?;/g, '');
    
    const priorityBadgeClass = getPriorityBadgeClass(item.priority);
    const modeText = item.isReal ? '실제' : '실험';
    
    card.innerHTML = `
        <div style="
            padding: 1.25rem;
            background: white;
        ">
            <!-- 헤더 -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
                gap: 0.75rem;
            ">
                <div style="
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #212529;
                    line-height: 1.3;
                ">
                    <i class="bi bi-megaphone" style="color: #0d6efd; margin-right: 0.5rem;"></i>
                    ${item.speakerName}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <span style="
                        padding: 0.4rem 0.75rem;
                        border-radius: 6px;
                        font-size: 0.8rem;
                        font-weight: 500;
                        background: ${item.isReal ? '#fee2e2' : '#dbeafe'};
                        color: ${item.isReal ? '#dc2626' : '#2563eb'};
                        border: 1px solid ${item.isReal ? '#fecaca' : '#bfdbfe'};
                    ">${modeText}</span>
                    <span style="
                        padding: 0.4rem 0.75rem;
                        border-radius: 6px;
                        font-size: 0.8rem;
                        font-weight: 500;
                        background: ${priorityBadgeClass.bg};
                        color: ${priorityBadgeClass.color};
                        border: 1px solid ${priorityBadgeClass.border};
                    ">${item.priority}</span>
                </div>
            </div>
            
            <!-- 메타 정보 -->
            <div style="
                display: flex;
                gap: 1.25rem;
                flex-wrap: wrap;
                margin-bottom: 1rem;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: #6b7280;
                    font-size: 0.85rem;
                ">
                    <i class="bi bi-clock" style="color: #6b7280;"></i>
                    <span>${item.time}</span>
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: #6b7280;
                    font-size: 0.85rem;
                ">
                    <i class="bi bi-volume-up" style="color: #6b7280;"></i>
                    <span>${item.volume}%</span>
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: #6b7280;
                    font-size: 0.85rem;
                ">
                    <i class="bi bi-exclamation-triangle" style="color: #f59e0b;"></i>
                    <span>${item.code}</span>
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    color: #6b7280;
                    font-size: 0.85rem;
                ">
                    <i class="bi bi-geo-alt" style="color: #6b7280;"></i>
                    <span>${item.location}</span>
                </div>
            </div>
            
            <!-- 메시지 -->
            <div style="
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #0d6efd;
                margin-bottom: 1rem;
                min-height: 60px;
                color: #495057;
                font-size: 0.9rem;
                line-height: 1.6;
            ">
                ${item.message}
            </div>
            
            <!-- 버튼 -->
            <div style="
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            ">
                <button type="button" class="btn btn-outline-primary btn-sm px-3 py-1" data-action="detail" style="
                    border-radius: 6px;
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                ">
                    <i class="bi bi-eye me-1"></i>상세
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm px-3 py-1" data-action="reissue" style="
                    border-radius: 6px;
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                ">
                    <i class="bi bi-arrow-repeat me-1"></i>재발령
                </button>
            </div>
        </div>
    `;

    // 버튼 이벤트 (기존 유지)
    card.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = parseInt(card.dataset.id, 10);
            const targetItem = broadcastFiltered.find(x => x.no === id);
            if (action === 'detail') {
                alert(`${targetItem.title}\n\n발령자: ${targetItem.senderName}\n시간: ${targetItem.time}\n스피커: ${targetItem.speakerName}\n위치: ${targetItem.location}\n\n메시지:\n${targetItem.message}`);
            } else if (action === 'reissue') {
                alert(`${targetItem.title} 재발령`);
            }
        });
    });

    return card;
}

function getPriorityBadgeClass(priority) {
    const classes = {
        'NONE': { bg: '#d1fae5', color: '#059669', border: '#a7f3d0' },
        'CAUTION': { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
        'WARNING': { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
        'DANGER': { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
    };
    return classes[priority] || { bg: '#e5e7eb', color: '#6b7280', border: '#d1d5db' };
}


function getPriorityColor(priority) {
    const colors = {
        'NONE': 'light', 
        'CAUTION': 'warning', 
        'WARNING': 'danger', 
        'DANGER': 'dark'
    };
    return colors[priority] || 'secondary';
}

function applyBroadcastFilters(resetPage = true) {
    const startEl = document.getElementById('broadcastStartDateTime');
    const endEl = document.getElementById('broadcastEndDateTime');
    const modeEl = document.getElementById('broadcastModeFilter');
    const priorityEl = document.getElementById('broadcastPriorityFilter');
    const speakerEl = document.getElementById('broadcastSpeakerSearch');
    const messageEl = document.getElementById('broadcastMessageSearch');

    const startDt = parseInputDateTime(startEl?.value);
    const endDt = parseInputDateTime(endEl?.value);
    const mode = modeEl?.value;
    const priority = priorityEl?.value;
    const speakerQ = speakerEl?.value?.trim().toLowerCase();
    const messageQ = messageEl?.value?.trim().toLowerCase();

    broadcastFiltered = broadcastData.filter(item => {
        if (startDt && item.dt < startDt) return false;
        if (endDt && item.dt > endDt) return false;
        if (mode === 'REAL' && !item.isReal) return false;
        if (mode === 'TEST' && item.isReal) return false;
        if (priority && item.priority !== priority) return false;
        if (speakerQ && !item.speakerName.toLowerCase().includes(speakerQ)) return false;
        if (messageQ && !item.message.toLowerCase().includes(messageQ)) return false;
        return true;
    });

    if (resetPage) currentPage = 1;
    renderBroadcastCards();  // 변경: renderBroadcastTable → renderBroadcastCards
}

function bindBroadcastEventsOnce() {
    const searchBtn = document.getElementById('broadcastSearchBtn');
    if (searchBtn?.dataset.bound === '1') return;

    const resetBtn = document.getElementById('broadcastResetBtn');
    const startEl = document.getElementById('broadcastStartDateTime');
    const endEl = document.getElementById('broadcastEndDateTime');
    const modeEl = document.getElementById('broadcastModeFilter');
    const priorityEl = document.getElementById('broadcastPriorityFilter');
    const speakerEl = document.getElementById('broadcastSpeakerSearch');
    const messageEl = document.getElementById('broadcastMessageSearch');

    if (searchBtn) {
        searchBtn.dataset.bound = '1';
        searchBtn.addEventListener('click', () => applyBroadcastFilters(true));
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (startEl) startEl.value = '';
            if (endEl) endEl.value = '';
            if (modeEl) modeEl.value = '';
            if (priorityEl) priorityEl.value = '';
            if (speakerEl) speakerEl.value = '';
            if (messageEl) messageEl.value = '';
            applyBroadcastFilters(true);
        });
    }

    const liveApply = () => applyBroadcastFilters(true);
    [startEl, endEl, modeEl, priorityEl].forEach(el => {
        if (el) el.addEventListener('change', liveApply);
    });
    
    [speakerEl, messageEl].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                clearTimeout(el.t);
                el.t = setTimeout(liveApply, 200);
            });
        }
    });
}

// ==================== SPECIAL (기존 유지) ====================
function generateRandomSpecialData() {
    const length = Math.floor(Math.random() * 30) + 10;
    return Array.from({length}, (_, i) => {
        const alert = alertNames[Math.floor(Math.random() * alertNames.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const hour = String(8 + (i % 12)).padStart(2, '0');
        const min = String(10 + i).padStart(2, '0');
        let status = '';
        if (i % 3 === 0) status = 'COMPLETE';
        else if (i % 3 === 1) status = 'PENDING';
        else status = 'CANCEL';

        return {
            no: i + 1,
            name: alert + (i + 1),
            time: `2025-07-16 ${hour}:${min}:00`,
            region,
            status,
            result: status === 'COMPLETE' ? '성공' : '실패'
        };
    });
}

function renderSpecialTable(page) {
    currentPage = page;
    const tbody = document.getElementById('specialList');
    if (!tbody) {
        console.error('specialList tbody not found');
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const currentPageData = specialData.slice(start, start + itemsPerPage);
    
    const rowsHTML = currentPageData.map(item => {
        const badgeClass = item.status ? 'status-success' : 'status-primary';
        return `
            <tr>
                <td>${item.no}</td>
                <td>${item.name}</td>
                <td>${item.time}</td>
                <td>${item.region}</td>
                <td><span class="status-badge ${badgeClass}">${item.status}</span></td>
                <td>${item.result}</td>
            </tr>
        `;
    }).join('');

    const emptyRowsHTML = App.utils.getEmptyRowsHTML(itemsPerPage, currentPageData.length, 6);
    tbody.innerHTML = rowsHTML + emptyRowsHTML;
    document.getElementById('specialCount').innerText = `${specialData.length}건`;
    
    renderSpecialPagination(page);
}

function renderSpecialPagination(page) {
    App.utils.renderPagination(
        'specialPagination', 
        currentPage, 
        specialData.length, 
        itemsPerPage,
        (newPage) => {
            currentPage = newPage;
            renderSpecialTable(currentPage);
        }
    );
}

function refreshData() {
    specialData = generateRandomSpecialData();
    renderSpecialTable(currentPage);
}
