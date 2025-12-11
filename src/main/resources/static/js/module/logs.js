/* ============================================================
    Logs 모듈 (출입기록 패널)
    - scripts.js 기존 코드와 동일한 동작을 모듈화
============================================================ */
window.Logs = (function () {

    // 내부 상태
    let logs = [];
    let logContainer = null;
    let emptyMessage = null;

    /* -----------------------------------------
        초기화
    ----------------------------------------- */
    function init() {
        logContainer = document.getElementById("logContainer");
        emptyMessage = document.getElementById("emptyLogMessage");

        if (!logContainer || !emptyMessage) {
            console.warn("Logs.init(): 요소를 찾을 수 없습니다.");
            return;
        }

        load();
    }

    /* -----------------------------------------
        서버에서 로그 불러오기
    ----------------------------------------- */
    async function load() {
        try {
            const data = await App.utils.fetchJson("/api/log");

            // 최신순으로 정렬
            logs = data.reverse().map(log => ({
                ...log,
                cameraName: getCameraNameByCode(log.cctvCode)
            }));

            render();
        } catch (err) {
            console.error("로그 불러오기 오류:", err);
        }
    }

    /* -----------------------------------------
        화면 렌더링
    ----------------------------------------- */
    function render() {
        if (!logContainer) return;

        logContainer.innerHTML = "";

        if (logs.length === 0) {
            logContainer.classList.add("d-none");
            emptyMessage.classList.remove("d-none");
            updateLogCount(0);

            return;
        }

        emptyMessage.classList.add("d-none");
        logContainer.classList.remove("d-none");

        logs.slice(0, 50).forEach(log => {
            const item = document.createElement("div");
            item.className = "log-item";
            item.dataset.boundary = log.boundaryNum;

            item.innerHTML = `
                <div class="d-flex justify-content-between">
                    <strong class="mb-2">[${log.cameraName}]</strong>
                    <small class="text-muted" style="opacity: 0.7;">${log.inpDttm}</small>
                </div>
                <div style="font-size: 0.75rem; opacity: 0.7;">${log.log}</div>
            `;

            // item.innerHTML = `
            //     <strong style="color: #FF0000;">[${log.cameraName}]</strong>
            //     <div>${log.log}</div>
            //     <div class="log-time text-muted">${log.inpDttm}</div>
            // `;

            // item.onclick = () => {
            //     App.utils.confirm(
            //         "발령",
            //         `${log.boundaryNum}번 구역에 발령을 송출할까요?`,
            //         () => Speakers.playLocal(`in_${log.boundaryNum}`)
            //     );
            // };

            item.onclick = () => {
                const modalEl = document.getElementById("broadcast_modal");
                if (!modalEl) return;
            
                // 모달 열기
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            
                // boundaryNum 전달 (옵션)
                if (window.BroadcastModal?.setBoundary) {
                    window.BroadcastModal.setBoundary(log.boundaryNum);
                }
            };
            

            logContainer.appendChild(item);
        });

        updateLogCount(logs.length);
    }

    
    function updateLogCount(count) {
        const logCount = document.getElementById("logCount");
        logCount.textContent = `${count}건`;
    }


    /* -----------------------------------------
        새로운 로그 추가 (SSE / WebSocket)
    ----------------------------------------- */
    function add(log) {
        logs.unshift({
            ...log,
            cameraName: getCameraNameByCode(log.cctvCode)
        });

        render();
    }

    /* ----------------------------------------- */
    return { init, add };

})();
