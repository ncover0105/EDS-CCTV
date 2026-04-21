window.SSE_MQTT = (function () {

    let evt = null;
    let retryCount = 0;
    let emergencyRepeatTimer = null;
    let emergencySettingsPromise = null;
    // [perf] 알림 버튼 이벤트 리스너를 AbortController로 관리.
    //        cloneNode+replaceChild 대신 abort()로 이전 리스너만 제거하고 재등록.
    let _btnAbortController = null;

    const DEFAULT_EMERGENCY_SETTINGS = {
        riskMode: 0,
        riskSec: 60
    };

    // [fix] 지수 백오프 상한. 서버 장애 시 모든 클라이언트가 동시에 재연결하는
    //       Thundering herd를 방지. 1s → 2s → 4s → ... → 최대 MAX_RETRY_DELAY.
    const MAX_RETRY_DELAY_MS = 30_000;

    function connect() {
        evt = new EventSource("/api/events");

        evt.onopen = () => {
            retryCount = 0;
            console.log("[SSE] MQTT 연결 성공");
        };

        evt.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                routeMQTT(data.topic, data.message);
            } catch (err) {
                console.error("[SSE] MQTT message handling failed:", err, e.data);
            }
        };

        evt.onerror = () => {
            evt.close();

            // [fix] 고정 3초 재연결 → 지수 백오프 적용.
            //       retryCount는 onopen 성공 시 0으로 초기화됨.
            const delay = Math.min(1000 * 2 ** retryCount, MAX_RETRY_DELAY_MS);
            retryCount++;
            setTimeout(connect, delay);
        };
    }

    async function getEmergencySettings() {
        if (emergencySettingsPromise) return emergencySettingsPromise;

        emergencySettingsPromise = fetch("/api/settings", {
            headers: { "Accept": "application/json" }
        })
            .then(res => {
                if (!res.ok) throw new Error(`Settings API error: ${res.status}`);
                return res.json();
            })
            .then(setting => normalizeEmergencySettings(setting))
            .catch(err => {
                console.warn("[MQTT] 긴급 알림 설정을 불러오지 못해 기본값을 사용합니다.", err);
                return { ...DEFAULT_EMERGENCY_SETTINGS };
            })
            .finally(() => {
                emergencySettingsPromise = null;
            });

        return emergencySettingsPromise;
    }

    function normalizeEmergencySettings(setting) {
        const riskMode = Number(setting?.riskMode);
        const riskSec = Number(setting?.riskSec);

        return {
            riskMode: riskMode === 1 ? 1 : 0,
            riskSec: Number.isFinite(riskSec) ? Math.min(Math.max(riskSec, 1), 3600) : DEFAULT_EMERGENCY_SETTINGS.riskSec
        };
    }

    function clearEmergencyRepeatTimer() {
        if (!emergencyRepeatTimer) return;
        clearInterval(emergencyRepeatTimer);
        emergencyRepeatTimer = null;
    }

    function routeMQTT(topic, message) {

        switch (topic) {
            case "send/emergency":
                console.log("[MQTT] 긴급 알림 수신:", message);
                handleEmergency(message).catch(err => {
                    console.error("[MQTT] 긴급 알림 처리 실패:", err, message);
                });

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
        const overlay = document.getElementById("emergencyOverlay");
        if (!overlay) return;

        // [perf] classList 조작 + offsetWidth(강제 동기 레이아웃)를 rAF 내부로 이동.
        //        이벤트 핸들러 실행 흐름과 분리해 메인 스레드 블로킹 최소화.
        requestAnimationFrame(() => {
            overlay.classList.remove("active");
            void overlay.offsetWidth;
            overlay.classList.add("active");
        });
    }

    // 위험구역 출입 알림
    async function handleEmergency(msg) {
        const data = JSON.parse(msg);
        const camName = getCameraNameByCode(data.cctvCode);
        const settings = await getEmergencySettings();
        const intervalMs = settings.riskSec * 1000;

        clearEmergencyRepeatTimer();
        triggerEmergencyScreenEffect();

        // 긴급 알림 표시
        showEmergencyToastr(camName, data.log, data.boundaryNum, {
            autoHideMs: settings.riskMode === 0 ? intervalMs : 0,
            onHide: clearEmergencyRepeatTimer
        });

        if (settings.riskMode === 1) {
            emergencyRepeatTimer = setInterval(() => {
                triggerEmergencyScreenEffect();
                showEmergencyToastr(camName, data.log, data.boundaryNum, {
                    autoHideMs: 0,
                    onHide: clearEmergencyRepeatTimer
                });
            }, intervalMs);
        }

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

    function showEmergencyToastr(camName, msg, boundaryNum, options = {}) {
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
            box.__timer = null;
            if (typeof options.onHide === "function") options.onHide();
        };

        title.innerText = camName;
        message.innerText = msg;
        if (timeEl) timeEl.innerText = new Date().toLocaleTimeString("ko-KR");

        box.onclick = null;
        box.setAttribute("aria-hidden", "false");
        box.classList.add("is-visible");

        clearTimeout(box.__timer);
        box.__timer = null;
        if (options.autoHideMs > 0) {
            box.__timer = setTimeout(() => hideNotification(), options.autoHideMs);
        }

        // [perf] cloneNode+replaceChild(DOM 교체) → AbortController로 교체.
        //        이전 리스너를 abort()로 제거하고 동일 DOM 노드에 재등록해 DOM mutation 없음.
        if (_btnAbortController) _btnAbortController.abort();
        _btnAbortController = new AbortController();
        const { signal } = _btnAbortController;

        const closeBtn = document.getElementById("emergencyNotificationClose");
        const broadcastBtn = document.getElementById("emergencyNotificationBroadcast");
        if (closeBtn) closeBtn.addEventListener("click", () => hideNotification(), { signal });
        if (broadcastBtn) broadcastBtn.addEventListener("click", () => {
            window.openBroadcastModal(camName, boundaryNum);
            hideNotification();
        }, { signal });
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
