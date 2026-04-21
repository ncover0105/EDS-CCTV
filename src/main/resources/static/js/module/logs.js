/* ============================================================
    Logs 모듈 (출입기록 패널)
    - scripts.js 기존 코드와 동일한 동작을 모듈화
============================================================ */
window.Logs = (function () {

    // 내부 상태
    let logs = [];
    let logContainer = null;
    let emptyMessage = null;
    let emptyMessageTitle = null;
    let emptyMessageDesc = null;
    let currentDateKey = null;
    let midnightReloadTimer = null;

    const EMPTY_MESSAGE_COPY = {
        empty: {
            title: "아직 수신된 출입기록이 없습니다",
            desc: "새로운 출입 이벤트가 발생하면 표시됩니다."
        },
        error: {
            title: "출입기록을 불러오지 못했습니다",
            desc: "잠시 후 다시 시도해 주세요."
        }
    };

    function getTodayKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function clearMidnightReloadTimer() {
        if (!midnightReloadTimer) return;
        clearTimeout(midnightReloadTimer);
        midnightReloadTimer = null;
    }

    function scheduleMidnightReload() {
        clearMidnightReloadTimer();

        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0);

        midnightReloadTimer = setTimeout(async () => {
            await reloadIfDateChanged();
            scheduleMidnightReload();
        }, Math.max(nextMidnight.getTime() - now.getTime(), 1000));
    }

    async function reloadIfDateChanged() {
        const todayKey = getTodayKey();
        if (currentDateKey === todayKey) return;
        await load();
    }

    function handleVisibilityChange() {
        if (document.visibilityState !== "visible") return;
        reloadIfDateChanged().catch(err => {
            console.error("날짜 변경 후 로그 재조회 오류:", err);
        });
    }

    /* -----------------------------------------
        초기화
    ----------------------------------------- */
    function init() {
        logContainer = document.getElementById("logContainer");
        emptyMessage = document.getElementById("emptyLogMessage");
        emptyMessageTitle = emptyMessage?.querySelector("strong") || null;
        emptyMessageDesc = emptyMessage?.querySelector("p") || null;

        if (!logContainer || !emptyMessage) {
            console.warn("Logs.init(): 요소를 찾을 수 없습니다.");
            return;
        }

        load();
        scheduleMidnightReload();
        document.addEventListener("visibilitychange", handleVisibilityChange);
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

            currentDateKey = getTodayKey();

            render("default");
        } catch (err) {
            console.error("로그 불러오기 오류:", err);
            logs = [];
            render("error");
        }
    }

    /* -----------------------------------------
        단일 로그 아이템 DOM 생성
    ----------------------------------------- */
    function createLogItem(log) {
        const item = document.createElement("div");
        item.className = `log-item log-boundary-${Number(log.boundaryNum)}`;
        item.dataset.boundary = log.boundaryNum;

        item.innerHTML = `
            <div class="tl-meta">
                <span class="tl-cam">[${escapeHtml(log.cameraName)}]</span>
                <span class="tl-time">${escapeHtml(formatDisplayTime(log.inpDttm))}</span>
            </div>
            <div class="tl-msg">${escapeHtml(log.log)}</div>
        `;

        item.onclick = () => {
            if (typeof window.openBroadcastModal === "function") {
                window.openBroadcastModal(log.cameraName, log.boundaryNum);
            }
        };

        return item;
    }

    /* -----------------------------------------
        화면 렌더링 (초기 로드 / 에러 상태용 전체 렌더)
    ----------------------------------------- */
    function render(state = "default") {
        if (!logContainer) return;

        const logBody = logContainer.parentElement;

        logContainer.innerHTML = "";

        if (logs.length === 0) {
            if (logBody) {
                logBody.classList.add("is-empty");
            }
            logContainer.classList.add("d-none");
            setEmptyMessageCopy(state === "error" ? "error" : "empty");
            emptyMessage.classList.remove("d-none");
            updateLogCount(0);

            return;
        }

        if (logBody) {
            logBody.classList.remove("is-empty");
        }
        emptyMessage.classList.add("d-none");
        logContainer.classList.remove("d-none");

        // [perf] DocumentFragment으로 일괄 삽입 — 개별 appendChild 대비 reflow 1회로 감소
        const fragment = document.createDocumentFragment();
        logs.slice(0, 50).forEach(log => fragment.appendChild(createLogItem(log)));
        logContainer.appendChild(fragment);

        updateLogCount(logs.length);
    }

    function setEmptyMessageCopy(type = "empty") {
        const copy = EMPTY_MESSAGE_COPY[type] || EMPTY_MESSAGE_COPY.empty;
        if (emptyMessageTitle) emptyMessageTitle.textContent = copy.title;
        if (emptyMessageDesc) emptyMessageDesc.textContent = copy.desc;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatDisplayTime(value) {
        if (!value) return "";

        const str = String(value).trim();
        const match = str.match(/(\d{2}):(\d{2})(?::\d{2})?$/);
        if (match) return `${match[1]}:${match[2]}`;

        const normalized = str.replace(" ", "T");
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) return str;

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }


    function updateLogCount(count) {
        const logCount = document.getElementById("logCount");
        logCount.textContent = `${count}건`;
    }


    /* -----------------------------------------
        새로운 로그 추가 (SSE / WebSocket)
    ----------------------------------------- */
    function add(log) {
        const newLog = {
            ...log,
            cameraName: getCameraNameByCode(log.cctvCode)
        };
        logs.unshift(newLog);

        // [perf] 첫 항목 추가 시에만 empty→non-empty 전환을 위해 전체 렌더 사용
        if (logs.length === 1) {
            render("default");
            return;
        }

        // [perf] 이후 추가는 신규 항목 1개만 prepend — 기존 50개 DOM 파괴+재생성 방지
        logContainer.prepend(createLogItem(newLog));

        // 표시 상한(50개) 초과 시 마지막 DOM 노드와 배열 항목 동시 제거
        if (logs.length > 50) {
            logs.pop();
            const last = logContainer.lastElementChild;
            if (last) last.remove();
        }

        updateLogCount(logs.length);
    }

    /* ----------------------------------------- */
    return { init, add, reload: load, reloadIfDateChanged };

})();
