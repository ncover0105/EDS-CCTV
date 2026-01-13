/* ================================
* equipment_init.js
* - 탭 전환 시 각 페이지 초기화 함수 호출
* ================================ */

/* 탭별 1회 초기화 캐시 */
window.speakerTabCache = window.speakerTabCache || { isInitialized: false };
window.broadcastTabCache = window.broadcastTabCache || { isInitialized: false };

/* ------------------------------
    Ripple Effect
------------------------------ */
document.querySelectorAll('.ripple').forEach(btn => {
btn.addEventListener('click', function (e) {
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
// 탭 버튼 active 처리
document.querySelectorAll('.modern-nav-tab')
    .forEach(tab => tab.classList.remove('active'));
button.classList.add('active');

// 컨텐츠 show/active 처리
document.querySelectorAll('.tab-pane')
    .forEach(content => content.classList.remove('show', 'active'));

const content = document.getElementById(`${targetId}-content`);
if (content) content.classList.add('show', 'active');

// 인디케이터 이동
const indicator = document.getElementById(`indicator${indicatorId}`);
if (indicator) {
    const rect = button.getBoundingClientRect();
    const parentRect = button.parentElement.getBoundingClientRect();
    indicator.style.width = `${rect.width}px`;
    indicator.style.left = `${rect.left - parentRect.left}px`;
}

// URL view 파라미터 유지
try {
    const url = new URL(window.location);
    url.searchParams.set("view", targetId);
    window.history.replaceState({}, '', url);
} catch (e) {}

// ✅ 탭별 초기화 호출
if (targetId === 'speaker') {
    // 스피커 탭은 목록/상세 UI가 있으므로 탭 진입 시 보장 초기화
    if (typeof window.initSpeakerPage === 'function') {
    window.initSpeakerPage();
    } else if (typeof window.renderSpeakerTable === 'function') {
    // fallback
    window.renderSpeakerTable();
    if (typeof window.resetDetail === 'function') window.resetDetail();
    }
}

if (targetId === 'broadcast') {
    // 방송 탭은 최초 1회만 초기화(원하면 매 진입마다로 변경 가능)
    if (!window.broadcastTabCache.isInitialized) {
    if (typeof window.initBroadcastPage === 'function') {
        window.initBroadcastPage();
    } else {
        // fallback
        if (typeof window.renderSpeakerCards === 'function') window.renderSpeakerCards();
        if (typeof window.renderBroadcastTypes === 'function') window.renderBroadcastTypes();
    }
    window.broadcastTabCache.isInitialized = true;
    }
}
}

/* ------------------------------
    페이지 로드 시 초기화
------------------------------ */
window.addEventListener('DOMContentLoaded', () => {
console.log("currentView:", currentView);

// ✅ 처음 진입 시 view에 맞는 탭 활성화
const targetView = (currentView === 'broadcast') ? 'broadcast' : 'speaker';
const firstTab = document.querySelector(`.modern-nav-tab[data-target="${targetView}"]`)
                || document.querySelector(".modern-nav-tab.active");

if (firstTab) {
    switchTab(firstTab, firstTab.dataset.target, firstTab.dataset.indicator);
} else {
    // 그래도 최소 스피커 테이블은 렌더
    if (typeof window.initSpeakerPage === 'function') window.initSpeakerPage();
}
});

function refreshActiveTabIndicator() {
    const active = document.querySelector('.modern-nav-tab.active');
    if (!active) return;

    const targetId = active.dataset.target;
    const indicatorId = active.dataset.indicator;
    const indicator = document.getElementById(`indicator${indicatorId}`);
    if (!indicator) return;

    const rect = active.getBoundingClientRect();
    const parentRect = active.parentElement.getBoundingClientRect();
    indicator.style.width = `${rect.width}px`;
    indicator.style.left = `${rect.left - parentRect.left}px`;
}

// 리사이즈/줌/폰트 로딩 대응
window.addEventListener("resize", refreshActiveTabIndicator);
window.addEventListener("orientationchange", refreshActiveTabIndicator);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshActiveTabIndicator();
});


/* ------------------------------
    단축키
------------------------------ */
document.addEventListener('keydown', e => {
if (e.ctrlKey && e.key === 'Enter') {
    if (typeof window.startBroadcast === 'function') window.startBroadcast();
}
if (e.key === 'Escape') {
    if (typeof window.stopBroadcast === 'function') window.stopBroadcast();
}
});

/* 전역 공개 (HTML inline onclick 등 대비) */
window.switchTab = switchTab;