const BreakingNews = {
    show: function(text) {
        const breakingSection = document.getElementById('breakingNewsSection');
        const breakingText = document.getElementById('breakingText');

        breakingSection.classList.remove("d-none");
        
        if (text && text.trim()) {
            breakingText.textContent = text;
            breakingSection.classList.add("d-block");

            // 애니메이션 재시작
            breakingText.style.animation = 'none';
            breakingText.offsetHeight;
            breakingText.style.animation = 'scroll 20s linear infinite';
        }
    },
    
    hide: function() {
        const breakingSection = document.getElementById('breakingNewsSection');
        breakingSection.classList.add("d-none");
    },
    
    update: function(text) {
        const breakingText = document.getElementById('breakingText');
        if (text && text.trim()) {
            breakingText.textContent = text;
            
            breakingText.style.animation = 'none';
            breakingText.offsetHeight;
            breakingText.style.animation = 'scroll 30s linear infinite';
        }
    },
    
    fetchFromServer: function() {
        // fetch('/api/breaking-news')
        //     .then(response => response.json())
        //     .then(data => {
        //         if (data.hasBreakingNews) {
        //             this.show(data.message);
        //         } else {
        //             this.hide();
        //         }
        //     });
        
        // 데모를 위한 가상 데이터
        this.show('긴급 공지: 시스템 점검이 오늘 밤 12시부터 2시간 동안 진행됩니다. 서비스 이용에 참고 바랍니다.');

        // setTimeout(() => {
        //     this.show('긴급 공지: 시스템 점검이 오늘 밤 12시부터 2시간 동안 진행됩니다. 서비스 이용에 참고 바랍니다.');
        // }, 2000);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    BreakingNews.fetchFromServer();
    
    // setInterval(() => {
    //     BreakingNews.fetchFromServer();
    // }, 300000);
});

window.showBreakingNews = function(text) {
    BreakingNews.show(text);
};

window.hideBreakingNews = function() {
    BreakingNews.hide();
};

window.updateBreakingNews = function(text) {
    BreakingNews.update(text);
};