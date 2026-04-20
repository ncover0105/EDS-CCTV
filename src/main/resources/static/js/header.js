document.addEventListener("DOMContentLoaded", function () {

    startHeaderClock("currentDate");

    const sidebarToggleEl = document.getElementById('sidebarToggle');
    const sidebarToggleHiddenQuery = window.matchMedia('(min-width: 992px)');

    function resetSidebarToggleIcon() {
        const toggleIcon = document.getElementById('toggleIcon');
        if (!toggleIcon) return;

        toggleIcon.classList.remove('fa-bars-staggered');
        toggleIcon.classList.add('fa-bars');
    }

    function closeSidenavAccordion() {
        document.body.classList.remove('sb-sidenav-toggled');
        localStorage.setItem('sb|sidebar-toggle', false);
        resetSidebarToggleIcon();
    }

    function closeWhenSidebarToggleHidden(event) {
        if (event.matches) closeSidenavAccordion();
    }

    if (sidebarToggleHiddenQuery.matches) closeSidenavAccordion();
    if (sidebarToggleHiddenQuery.addEventListener) {
        sidebarToggleHiddenQuery.addEventListener('change', closeWhenSidebarToggleHidden);
    } else if (sidebarToggleHiddenQuery.addListener) {
        sidebarToggleHiddenQuery.addListener(closeWhenSidebarToggleHidden);
    }

    // document.body.classList.add('sb-sidenav-toggled');
    if (sidebarToggleEl) {
        // 사이드바 메뉴 링크 클릭 시 자동 닫기
        document.querySelectorAll('.sb-sidenav-menu-nested a').forEach(link => {
            link.addEventListener('click', () => {
                // 사이드바가 열려있으면 닫기
                if (document.body.classList.contains('sb-sidenav-toggled')) {
                    closeSidenavAccordion();
                }
            });
        });
    
        // 토글 버튼 클릭
        sidebarToggleEl.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
    
            const isToggled = document.body.classList.contains('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', isToggled);
    
            if (document.getElementById('toggleIcon')) {
                document.getElementById('toggleIcon').classList.remove('fa-bars', 'fa-bars-staggered');
                document.getElementById('toggleIcon').classList.add(isToggled ? 'fa-bars-staggered' : 'fa-bars');
            }
        });
        
        // 초기 상태: 항상 닫힌 상태에서 시작
        closeSidenavAccordion();
    }

});

function startHeaderClock(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;

    if (window.__headerClockInterval) {
        clearInterval(window.__headerClockInterval);
    }

    const pad = (n) => String(n).padStart(2, "0");
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

    function render() {
        const now = new Date();
        const y = now.getFullYear();
        const m = pad(now.getMonth() + 1);
        const d = pad(now.getDate());
        const dayName = weekdays[now.getDay()];
        const hh = pad(now.getHours());
        const mm = pad(now.getMinutes());
        const ss = pad(now.getSeconds());

        el.innerHTML = `<span class="clock-date">${y}.${m}.${d} (${dayName})</span><span class="clock-time">${hh} : ${mm} : ${ss}</span>`;
    }

    render();
    window.__headerClockInterval = setInterval(render, 1000);
}
