window.SSE_MQTT = (function () {

    let evt = null;
    let retryCount = 0;

    function connect() {
        console.log("[SSE] MQTT 이벤트 스트림 연결 시도...");

        evt = new EventSource("/api/events");

        evt.onopen = () => {
            retryCount = 0;
            console.log("[SSE] MQTT 연결 성공");
        };

        evt.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                console.log("[SSE] MQTT 메시지 수신:", data.topic, data.message);
                routeMQTT(data.topic, data.message);
            } catch (err) {
                console.error("[SSE] JSON 파싱 오류:", err, e.data);
            }
        };

        evt.onerror = () => {
            console.error("[SSE] MQTT 연결 오류 -> 연결 종료");
            evt.close();

            retryCount++;
            console.log(`⏳ [SSE] 재연결 시도 (${retryCount})...`);

            setTimeout(connect, 3000);
        };
    }

    function routeMQTT(topic, message) {
        console.log("➡️ [MQTT] Topic:", topic, "Message:", message);

        switch (topic) {
            case "send/emergency":
                handleEmergency(message);
                break;

            case "cctv/req":
                App.utils.showToast("CCTV 요청 감지", "알림");
                break;

            case "cctv/resetIP":
                App.utils.showToast("CCTV IP 초기화됨", "알림");
                break;

            default:
                console.warn("⚠️ [MQTT] 처리되지 않은 메시지:", topic);
        }
    }

    function handleEmergency(msg) {
        const data = JSON.parse(msg);
        const camName = getCameraNameByCode(data.cctvCode);

        // 긴급 알림 표시
        showEmergencyToastr(camName, data.log, data.boundaryNum);

        // 로그 추가
        if (window.Logs) {
            Logs.add({
                inpDttm: data.receptionDttm,
                log: data.log,
                cctvCode: data.cctvCode,
                boundaryNum: data.boundaryNum
            });
        }
    }

    function showEmergencyToastr(camName, msg, boundaryNum) {
        const box = document.querySelector(".notification");

        document.getElementById("notification-title").innerText =
            `${camName}\n위험구역 출입 발생`;

        document.getElementById("notification-message").innerText = msg;

        box.classList.add("show");

        box.onclick = () => {
            openConfirmModal(
                "위험구역 출입",
                `${camName} 카메라\n${boundaryNum}번 구역에 발령을 송출할까요?`,
                () => {
                    if (window.Speakers) {
                        Speakers.sendBroadcast(boundaryNum);
                    }
                }
            );
            box.classList.remove("show");
        };
    }

    // Confirm Modal Helper
    function openConfirmModal(title, message, onConfirm) {
        const modalEl = document.getElementById("confirm_modal");
        document.getElementById("confirmModalLabel").innerText = title;
        document.getElementById("confirmModalMessage").innerText = message;

        const confirmBtn = document.getElementById("confirmModalConfirmBtn");
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

        newBtn.addEventListener("click", () => {
            if (onConfirm) onConfirm();
            bootstrap.Modal.getInstance(modalEl).hide();
        });

        new bootstrap.Modal(modalEl).show();
    }

    return { connect };

})();
