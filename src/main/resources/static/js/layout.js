// import { renderPagination, safeValue } from '/js/module/utils.js';
import * as Utils from './module/utils.js';

window.App = {
    utils: Utils,
    ws: {}
};

window.notify = Utils.notify;

function createJsonCache({ url, ttl = 60000, normalize = value => value }) {
    let data = null;
    let loadedAt = 0;
    let loading = null;

    function isFresh() {
        return data !== null && Date.now() - loadedAt < ttl;
    }

    async function get({ force = false } = {}) {
        if (!force && isFresh()) return data;
        if (loading) return loading;

        loading = fetch(url, { headers: { Accept: "application/json" } })
            .then(async response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const json = await response.json().catch(() => null);
                data = normalize(json);
                loadedAt = Date.now();
                return data;
            })
            .catch(error => {
                if (data !== null) return data;
                throw error;
            })
            .finally(() => {
                loading = null;
            });

        return loading;
    }

    return {
        get,
        peek: () => data,
        has: () => data !== null,
        isFresh,
        invalidate: () => { loadedAt = 0; },
        clear: () => {
            data = null;
            loadedAt = 0;
            loading = null;
        },
        preload: () => get().catch(() => null)
    };
}

window.SpeakerDataCache = createJsonCache({
    url: "/api/btype/query/config/list",
    ttl: 30000,
    normalize: value => Array.isArray(value) ? value : []
});

window.DisasterDataCache = createJsonCache({
    url: "/api/disaster",
    ttl: 300000,
    normalize: value => Array.isArray(value) ? value : []
});

window.TtsDataCache = createJsonCache({
    url: "/api/tts?page=0&size=200",
    ttl: 120000,
    normalize: value => Array.isArray(value) ? value : (value?.content ?? [])
});

window.addEventListener("DOMContentLoaded", () => {
    window.SpeakerDataCache.preload();
    window.DisasterDataCache.preload();
    window.TtsDataCache.preload();
});

// =====================
// WebSocket 연결 관리
// =====================

(function initWebSocketModule() {
    let socket;
    const wsEnabled = false;

    function connect() {
        if (!wsEnabled) return;
        if (socket && socket.readyState === WebSocket.OPEN) return;

        socket = new WebSocket("ws://localhost:8080/ws/chat");

        socket.onopen = () => {
            // console.log("WebSocket 연결");
            App.ws.sendMessage({ type: "ping" });
        };

        socket.onmessage = (event) => {
            // console.log("서버 응답:", event.data);
            let msg = {};
            try {
                msg = JSON.parse(event.data);
            } catch (e) {
                msg = { type: "raw", data: event.data };
            }

            // CustomEvent로 전역에 알림
            document.dispatchEvent(new CustomEvent("ws-message", { detail: msg }));
        };

        socket.onclose = () => {
            // console.log("WebSocket 연결 종료, 3초 후 재연결");
            // setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
            // console.error("WebSocket 오류:", err);
        };
    }

    function sendMessage(obj) {
        if (!wsEnabled) return;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(obj));
        } else {
            // console.warn("WebSocket 아직 연결되지 않음");
        }
    }

    App.ws = { connect, sendMessage };
    document.addEventListener("DOMContentLoaded", connect);
})();
