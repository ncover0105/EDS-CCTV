/* ============================
 * equipment_init.js
 * 초기 설정 및 공통 이벤트
 * ============================ */

const itemsPerPage = 15;
const cardPerPage = 9;
let currentPage = 1;

let selectedSpeakerId = null;
let selectedSpeakers = [];
let selectedBroadcastType = null;
let broadcastInProgress = false;
let audio = null;

const speakerTabCache = { isInitialized: false, speakers: [] };
const broadcastTabCache = { isInitialized: false };

/* ------------------------------
    공통 스타일 삽입
------------------------------ */
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    .badge.online { animation: pulse 2s ease-in-out infinite; }
`;
document.head.appendChild(style);

/* ------------------------------
    Bootstrap 탭 애니메이션
------------------------------ */
document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', function (e) {
        const target = document.querySelector(e.target.getAttribute('href'));
        target.classList.add('animate-fade-in');
        setTimeout(() => target.classList.remove('animate-fade-in'), 600);
    });
});

/* ------------------------------
    버튼 ripple 이펙트
------------------------------ */
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

/* ------------------------------
    상단 네비 탭
------------------------------ */
function switchTab(button, targetId, indicatorId) {
    document.querySelectorAll('.modern-nav-tab')
        .forEach(tab => tab.classList.remove('active'));

    button.classList.add('active');

    document.querySelectorAll('.tab-pane')
        .forEach(content => content.classList.remove('show', 'active'));

    const content = document.getElementById(`${targetId}-content`);
    if (content) content.classList.add('show', 'active');

    const indicator = document.getElementById(`indicator${indicatorId}`);
    if (indicator) {
        const rect = button.getBoundingClientRect();
        const parentRect = button.parentElement.getBoundingClientRect();
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - parentRect.left}px`;
    }

    /* 방송 탭 초기 렌더링 */
    if (targetId === 'broadcast' && !speakerTabCache.isInitialized) {
        renderSpeakerCards();
        speakerTabCache.isInitialized = true;

        renderBroadcastTypes();
    }
}

/* ------------------------------
    페이지 로드 시 초기화
------------------------------ */
window.addEventListener('DOMContentLoaded', () => {
    console.log("currentView:", currentView);

    /* URL view 값 유지 */
    const tabLinks = document.querySelectorAll("#equipmentTabs .nav-link");
    tabLinks.forEach(link => {
        link.addEventListener("click", () => {
            const href = link.getAttribute("href");
            const view = href.includes("speaker") ? "speaker" : "broadcast";

            const url = new URL(window.location);
            url.searchParams.set("view", view);
            window.history.replaceState({}, '', url);
        });
    });

    /* 첫 번째 탭 활성화 */
    const activeTab = document.querySelector(".modern-nav-tab.active");
    if (activeTab) {
        switchTab(activeTab, activeTab.dataset.target, activeTab.dataset.indicator);
    }

    /* 스피커 테이블 렌더링 */
    renderSpeakerTable(currentPage);

    /* 상태 패널 렌더링 */
    // const container = document.getElementById("statusPanelContainer");
    // statusItems.forEach(item => {
    //     const col = document.createElement("div");
    //     col.className = "col-12 col-lg-6";

    //     col.innerHTML = `
    //         <div class="status-item bg-light d-flex align-items-center gap-4 p-4 border-bottom rounded shadow-sm">
    //             <div>
    //                 <div class="text-secondary small mb-2">${item.label}</div>
    //                 <div class="fw-bold" data-field="${item.field}">-</div>
    //             </div>
    //         </div>
    //     `;
    //     container.appendChild(col);
    // });
});

/* ------------------------------
    단축키
------------------------------ */
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') startBroadcast();
    if (e.key === 'Escape') stopBroadcast();
});
