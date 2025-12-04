// import { renderPagination, safeValue } from '/js/module/utils.js';
import * as Utils from './module/utils.js';

window.App = {
    utils: Utils,
    ws: {}
};

// =====================
// WebSocket 연결 관리
// =====================

(function initWebSocketModule() {
    let socket;

    function connect() {
        if (socket && socket.readyState === WebSocket.OPEN) return;

        socket = new WebSocket("ws://localhost:8080/ws/chat");

        socket.onopen = () => {
            console.log("✅ WebSocket 연결됨");
            App.ws.sendMessage({ type: "ping" });
        };

        socket.onmessage = (event) => {
            console.log("📨 서버 응답:", event.data);
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
            console.log("⚠️ WebSocket 연결 종료, 3초 후 재연결");
            // setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
            console.error("❌ WebSocket 오류:", err);
        };
    }

    function sendMessage(obj) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(obj));
        } else {
            console.warn("⚠️ WebSocket 아직 연결되지 않음");
        }
    }

    App.ws = { connect, sendMessage };
    document.addEventListener("DOMContentLoaded", connect);
})();