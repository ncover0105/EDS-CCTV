window.SSE_MQTT = (function () {

    let evt = null;
    let retryCount = 0;

    function connect() {
        // console.log("[SSE] MQTT 이벤트 스트림 연결 시도...");

        evt = new EventSource("/api/events");

        evt.onopen = () => {
            retryCount = 0;
            console.log("[SSE] MQTT 연결 성공");
        };

        evt.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                // console.log("[SSE] MQTT 메시지 수신:", data.topic, data.message);
                routeMQTT(data.topic, data.message);
            } catch (err) {
                // console.error("[SSE] JSON 파싱 오류:", err, e.data);
            }
        };

        evt.onerror = () => {
            // console.error("[SSE] MQTT 연결 오류 -> 연결 종료");
            evt.close();

            retryCount++;
            // console.log(`⏳ [SSE] 재연결 시도 (${retryCount})...`);

            setTimeout(connect, 3000);
        };
    }

    function routeMQTT(topic, message) {
        // console.log("➡️ [MQTT] Topic:", topic, "Message:", message);

        switch (topic) {
            case "send/emergency":
                handleEmergency(message);

                break;

            case "cctv/req":

                break;

            case "cctv/resetIP":

                break;

            default:
                console.warn("⚠️ [MQTT] 처리되지 않은 메시지:", topic);
        }
    }

    window.triggerEmergencyScreenEffect = function () {
        let overlay = document.getElementById("emergencyOverlay");
        if (!overlay) return;

        overlay.classList.remove("active");
        void overlay.offsetWidth;
        overlay.classList.add("active");

        // clearTimeout(overlay.__timer);
        //     overlay.__timer = setTimeout(() => {
        //     overlay.classList.remove("active");
        // }, 2300);

        // const overlay = document.getElementById('overlay3');
        // const ripple = document.getElementById('ripple');

        // // 재트리거 안정화
        // overlay.classList.remove('active');
        // ripple.classList.remove('active');
        // void overlay.offsetWidth;

        // overlay.classList.add('active');
        // ripple.classList.add('active');

        // setTimeout(() => {
        //     overlay.classList.remove('active');
        //     ripple.classList.remove('active');
        // }, 1100);
    }

    // 위험구역 출입 알림
    function handleEmergency(msg) {
        const data = JSON.parse(msg);
        const camName = getCameraNameByCode(data.cctvCode);

        triggerEmergencyScreenEffect();

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
        const box = document.getElementById("emergencyNotification");
        const title = document.getElementById("emergencyNotificationTitle");
        const message = document.getElementById("emergencyNotificationMessage");
        const timeEl = document.getElementById("emergencyNotificationTime");
        const overlay = document.getElementById("emergencyOverlay");
        if (!box || !title || !message) return;

        const hideNotification = () => {
            box.classList.remove("is-visible");
            box.setAttribute("aria-hidden", "true");
            overlay?.classList.remove("active", "is-animating");
            clearTimeout(box.__timer);
        };

        title.innerText = camName;
        message.innerText = msg;
        if (timeEl) timeEl.innerText = new Date().toLocaleTimeString("ko-KR");

        box.onclick = null;
        box.setAttribute("aria-hidden", "false");
        box.classList.add("is-visible");

        clearTimeout(box.__timer);

        const bindBtn = (id, handler) => {
            const el = document.getElementById(id);
            if (!el) return;
            const next = el.cloneNode(true);
            el.parentNode.replaceChild(next, el);
            next.addEventListener("click", handler);
        };

        bindBtn("emergencyNotificationClose", () => hideNotification());
        bindBtn("emergencyNotificationBroadcast", () => {
            window.openBroadcastModal(camName, boundaryNum);
            hideNotification();
        });
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

    return { connect, showEmergencyToastr };

})();
