document.addEventListener("DOMContentLoaded", function () {

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

    // setTime();

});
