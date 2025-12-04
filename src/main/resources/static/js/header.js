document.addEventListener("DOMContentLoaded", function () {

    // document.body.classList.add('sb-sidenav-toggled');
    if (sidebarToggle) {
        // 사이드바 메뉴 링크 클릭 시 자동 닫기
        document.querySelectorAll('.sb-sidenav-menu-nested a').forEach(link => {
            link.addEventListener('click', () => {
                // 사이드바가 열려있으면 닫기
                if (document.body.classList.contains('sb-sidenav-toggled')) {
                    document.body.classList.remove('sb-sidenav-toggled');
                    localStorage.setItem('sb|sidebar-toggle', false);
                    
                    // 아이콘 업데이트
                    if (document.getElementById('toggleIcon')) {
                        document.getElementById('toggleIcon').classList.remove('fa-bars-staggered');
                        document.getElementById('toggleIcon').classList.add('fa-bars');
                    }
                }
            });
        });
    
        // 토글 버튼 클릭
        sidebarToggle.addEventListener('click', event => {
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
        document.body.classList.remove('sb-sidenav-toggled');
        if (document.getElementById('toggleIcon')) {
            document.getElementById('toggleIcon').classList.add('fa-bars');
        }
    }

    // setTime();

});