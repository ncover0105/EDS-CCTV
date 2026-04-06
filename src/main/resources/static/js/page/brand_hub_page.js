document.addEventListener("DOMContentLoaded", function () {
    var speakerCountEl = document.getElementById("brandSpeakerCount");
    var speakerListCountEl = document.getElementById("brandSpeakerListCount");
    var speakerListEl = document.getElementById("brandSpeakerList");

    var cctvCountEl = document.getElementById("brandCctvCount");
    var cctvListCountEl = document.getElementById("brandCctvListCount");
    var cctvPickerEl = document.getElementById("brandCctvPicker");

    var emergencyCountEl = document.getElementById("brandEmergencyCount");
    var emergencyListCountEl = document.getElementById("brandEmergencyListCount");
    var emergencyListEl = document.getElementById("brandEmergencyList");
    var broadcastCountEl = document.getElementById("brandBroadcastCount");
    var broadcastListCountEl = document.getElementById("brandBroadcastListCount");
    var broadcastListEl = document.getElementById("brandBroadcastList");

    var nameEl = document.getElementById("brandSelectedCctvName");
    var addressEl = document.getElementById("brandSelectedCctvAddress");
    var codeEl = document.getElementById("brandSelectedCctvCode");
    var portEl = document.getElementById("brandSelectedCctvPort");
    var coordEl = document.getElementById("brandSelectedCctvCoord");
    var statusEl = document.getElementById("brandSelectedCctvStatus");
    var selectedCctv = null;

    function getValue(value, fallback) {
        return value === null || value === undefined || value === "" ? fallback : value;
    }

    function fmtTime(value) {
        if (!value) return "-";
        var date = new Date(value);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    }

    function escapeHtml(value) {
        return String(getValue(value, ""))
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function createEmptyItem(icon, title, subtitle, side) {
        return [
            '<div class="brand-list-item">',
            '  <div class="brand-list-icon"><i class="bi ' + escapeHtml(icon) + '"></i></div>',
            '  <div class="brand-list-main">',
            '    <strong>' + escapeHtml(title) + '</strong>',
            '    <span>' + escapeHtml(subtitle) + '</span>',
            '  </div>',
            '</div>'
        ].join("");
    }

    function createEmergencyItem(item) {
        var dailyTarget = 100;
        var hasItem = !!item;
        var zoneLabel = hasItem ? (getValue(item.boundaryNum, "-") + "번 구역") : "-번 구역";
        var count = hasItem ? Number(getValue(item.count, 0)) : 0;
        var width = count > 0 ? Math.min(100, Math.max(8, Math.round((count / dailyTarget) * 100))) : 0;
        var countText = count + " / " + dailyTarget + "건";

        return [
            '<div class="brand-emergency-item">',
            '  <div class="brand-emergency-main">',
            '    <div class="brand-emergency-head">',
            '      <strong class="brand-emergency-title">' + escapeHtml(zoneLabel) + '</strong>',
            '      <span class="brand-emergency-count">' + escapeHtml(String(count)) + '건</span>',
            '    </div>',
            '    <div class="brand-emergency-bar">',
            '      <div class="brand-emergency-bar-fill" style="width: ' + escapeHtml(String(width)) + '%;"></div>',
            '    </div>',
            '    <div class="brand-emergency-foot">',
            '      <span class="brand-emergency-side-label">오늘 기준</span>',
            '      <span class="brand-emergency-side-value">' + escapeHtml(countText) + '</span>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join("");
    }

    function getCctvButtons() {
        return Array.prototype.slice.call(document.querySelectorAll(".brand-cctv-option"));
    }

    function normalizeCctvForStream(cctv) {
        if (!cctv) return null;

        var rawStatus = String(getValue(cctv.statusCam, "")).toUpperCase();
        var streamStatus = (rawStatus === "01" || rawStatus === "Y" || rawStatus === "1") ? "1" : "0";

        return {
            locationCode: getValue(cctv.locationCode, ""),
            cctvCode: getValue(cctv.cctvCode, ""),
            name: getValue(cctv.name, getValue(cctv.cctvCode, "CCTV")),
            address: getValue(cctv.address, "-"),
            wsPort: getValue(cctv.wsPort, "-"),
            latitude: getValue(cctv.latitude, "-"),
            longitude: getValue(cctv.longitude, "-"),
            statusCam: rawStatus,
            status: streamStatus,
            mountpointId: getValue(cctv.mountpointId, null),
            videoPort: getValue(cctv.videoPort, null),
            rtspUrl: getValue(cctv.rtspUrl, null)
        };
    }

    function renderSelectedCctvPanel(cctv) {
        if (nameEl) nameEl.textContent = cctv ? getValue(cctv.name, "-") : "-";
        if (addressEl) addressEl.textContent = cctv ? getValue(cctv.address, "-") : "-";
        if (codeEl) codeEl.textContent = cctv ? getValue(cctv.cctvCode, "-") : "-";
        if (portEl) portEl.textContent = cctv ? getValue(cctv.wsPort, "-") : "-";
        if (coordEl) coordEl.textContent = cctv ? (getValue(cctv.latitude, "-") + ", " + getValue(cctv.longitude, "-")) : "-";
        if (statusEl) {
            if (!cctv) {
                statusEl.textContent = "-";
            } else {
                statusEl.textContent = (String(getValue(cctv.statusCam, "")).toUpperCase() === "01" || String(getValue(cctv.statusCam, "")).toUpperCase() === "Y")
                    ? "정상"
                    : "확인";
            }
        }
    }

    function connectSelectedCctv(cctv) {
        if (window.CCTVJanus) {
            window.CCTVJanus.destroy();
        }
        if (window.CCTVLayout) {
            window.CCTVLayout.destroy();
        }

        if (!cctv) {
            selectedCctv = null;
            renderSelectedCctvPanel(null);
            return;
        }

        selectedCctv = normalizeCctvForStream(cctv);
        renderSelectedCctvPanel(selectedCctv);

        if (!window.CCTVLayout || !window.CCTVJanus) {
            return;
        }

        window.CCTVLayout.init([selectedCctv]);
        window.CCTVLayout.renderGrid(1);
        window.CCTVJanus.initSignaling([selectedCctv]);
    }

    function applySelectedCctv(button) {
        var buttons = getCctvButtons();
        buttons.forEach(function (item) {
            item.classList.remove("is-active");
        });

        if (!button) return;
        button.classList.add("is-active");

        connectSelectedCctv({
            name: button.getAttribute("data-name"),
            address: button.getAttribute("data-address"),
            cctvCode: button.getAttribute("data-code"),
            wsPort: button.getAttribute("data-port"),
            mountpointId: button.getAttribute("data-mountpoint-id"),
            videoPort: button.getAttribute("data-video-port"),
            rtspUrl: button.getAttribute("data-rtsp-url"),
            latitude: button.getAttribute("data-latitude"),
            longitude: button.getAttribute("data-longitude"),
            statusCam: button.getAttribute("data-status-code"),
            locationCode: button.getAttribute("data-location-code")
        });
    }

    function bindCctvButtons() {
        var buttons = getCctvButtons();
        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                applySelectedCctv(button);
            });
        });

        if (buttons.length) {
            var active = buttons.filter(function (button) {
                return button.classList.contains("is-active");
            })[0] || buttons[0];
            applySelectedCctv(active);
        }
    }

    function renderSpeakers(speakers) {
        var list = Array.isArray(speakers) ? speakers : [];
        var online = list.filter(function (speaker) {
            return Number(getValue(speaker.connectStatus, -1)) === 0;
        }).length;

        if (speakerCountEl) speakerCountEl.textContent = String(list.length);
        if (speakerListCountEl) speakerListCountEl.textContent = list.length + " 대";
        if (!speakerListEl) return;

        if (!list.length) {
            speakerListEl.innerHTML = createEmptyItem("bi-megaphone-fill", "데이터 없음", "스피커 목록", "-");
            return;
        }

        speakerListEl.innerHTML = list.map(function (speaker) {
            var speakerTitle = getValue(speaker.speakerName, "스피커");
            var speakerId = getValue(speaker.speakerId, "-");
            return [
                '<div class="brand-list-item">',
                '  <div class="brand-list-icon"><i class="bi bi-megaphone-fill"></i></div>',
                '  <div class="brand-list-main">',
                '    <strong>' + escapeHtml(speakerTitle) + '</strong>',
                '    <span>' + escapeHtml(speakerId) + '</span>',
                '  </div>',
                '</div>'
            ].join("");
        }).join("");
    }

    function renderCctvs(cctvs) {
        var list = Array.isArray(cctvs) ? cctvs : [];
        var normal = list.filter(function (cctv) {
            var status = String(getValue(cctv.statusCam, "")).toUpperCase();
            return status === "01" || status === "Y";
        }).length;

        if (cctvCountEl) cctvCountEl.textContent = String(list.length);
        if (cctvListCountEl) cctvListCountEl.textContent = list.length + " 채널";
        if (!cctvPickerEl) return;

        if (!list.length) {
            cctvPickerEl.innerHTML = '<button type="button" class="brand-cctv-option is-active">데이터 없음</button>';
            applySelectedCctv(null);
            return;
        }

        cctvPickerEl.innerHTML = list.map(function (cctv, index) {
            var status = String(getValue(cctv.statusCam, "")).toUpperCase();
            var statusText = status === "01" || status === "Y" ? "정상" : "확인";
            var coord = getValue(cctv.latitude, "-") + ", " + getValue(cctv.longitude, "-");
            return [
                '<button type="button" class="brand-cctv-option' + (index === 0 ? ' is-active' : '') + '"',
                ' data-name="' + escapeHtml(getValue(cctv.name, getValue(cctv.cctvCode, "CCTV"))) + '"',
                ' data-address="' + escapeHtml(getValue(cctv.address, "-")) + '"',
                ' data-code="' + escapeHtml(getValue(cctv.cctvCode, "-")) + '"',
                ' data-port="' + escapeHtml(getValue(cctv.wsPort, "-")) + '"',
                ' data-coord="' + escapeHtml(coord) + '"',
                ' data-mountpoint-id="' + escapeHtml(getValue(cctv.mountpointId, "")) + '"',
                ' data-video-port="' + escapeHtml(getValue(cctv.videoPort, "")) + '"',
                ' data-rtsp-url="' + escapeHtml(getValue(cctv.rtspUrl, "")) + '"',
                ' data-latitude="' + escapeHtml(getValue(cctv.latitude, "-")) + '"',
                ' data-longitude="' + escapeHtml(getValue(cctv.longitude, "-")) + '"',
                ' data-status-code="' + escapeHtml(getValue(cctv.statusCam, "")) + '"',
                ' data-location-code="' + escapeHtml(getValue(cctv.locationCode, "")) + '"',
                ' data-status="' + escapeHtml(statusText) + '">',
                escapeHtml(getValue(cctv.name, getValue(cctv.cctvCode, "CCTV"))),
                '</button>'
            ].join("");
        }).join("");

        bindCctvButtons();
    }

    function renderEmergencies(payload) {
        var items = payload && Array.isArray(payload.items) ? payload.items : [];
        var totalCount = payload && payload.totalCount !== undefined ? payload.totalCount : items.length;
        var grouped = {
            "1": { boundaryNum: 1, count: 0 },
            "2": { boundaryNum: 2, count: 0 },
            "3": { boundaryNum: 3, count: 0 },
            "4": { boundaryNum: 4, count: 0 }
        };
        var orderedItems;

        if (emergencyCountEl) emergencyCountEl.textContent = String(totalCount);
        if (emergencyListCountEl) emergencyListCountEl.textContent = totalCount + " 건";
        if (!emergencyListEl) return;

        items.forEach(function (log) {
            var key = String(getValue(log && log.boundaryNum, "-"));
            if (grouped[key]) {
                grouped[key].count += 1;
            }
        });

        orderedItems = ["1", "2", "3", "4"].map(function (key) {
            return grouped[key];
        });

        emergencyListEl.innerHTML = orderedItems.map(function (item) {
            return createEmergencyItem(item);
        }).join("");
    }

    function renderBroadcasts(items) {
        var list = Array.isArray(items) ? items : [];

        if (broadcastCountEl) broadcastCountEl.textContent = String(list.length);
        if (broadcastListCountEl) broadcastListCountEl.textContent = list.length + " 건";
        if (!broadcastListEl) return;

        if (!list.length) {
            broadcastListEl.innerHTML = createEmptyItem("bi-broadcast-pin", "데이터 없음", "방송이력", "-");
            return;
        }

        broadcastListEl.innerHTML = list.slice(0, 6).map(function (item) {
            var commandText = getValue(item.commandCode, "-");
            var statusText = String(getValue(item.status, "")) === "1" ? "성공" : "실패";
            return [
                '<div class="brand-list-item">',
                '  <div class="brand-list-icon"><i class="bi bi-broadcast-pin"></i></div>',
                '  <div class="brand-list-main">',
                '    <strong>' + escapeHtml(getValue(item.deviceId, "방송")) + '</strong>',
                '    <span>' + escapeHtml(commandText + " · " + statusText + " · " + fmtTime(item.createdAt)) + '</span>',
                '  </div>',
                '</div>'
            ].join("");
        }).join("");
    }

    function loadJson(url) {
        return fetch(url, {
            headers: { "Accept": "application/json" }
        }).then(function (response) {
            if (!response.ok) {
                throw new Error(url + " " + response.status);
            }
            return response.json();
        });
    }

    function safeLoad(url, fallback) {
        return loadJson(url).catch(function () {
            return fallback;
        });
    }

    Promise.all([
        safeLoad("/api/btype/query/config/speakers", []),
        safeLoad("/api/cctv/list", []),
        safeLoad("/menu/situation/emergency/search?page=1&size=50", { items: [], totalCount: 0 }),
        safeLoad("/api/spk/web/alert-logs/latest", [])
    ]).then(function (results) {
        renderSpeakers(results[0]);
        renderCctvs(results[1]);
        renderEmergencies(results[2]);
        renderBroadcasts(results[3]);
    }).catch(function () {
        renderSpeakers([]);
        renderCctvs([]);
        renderEmergencies({ items: [], totalCount: 0 });
        renderBroadcasts([]);
    });

    window.addEventListener("beforeunload", function () {
        if (window.CCTVJanus) {
            window.CCTVJanus.destroy();
        }
        if (window.CCTVLayout) {
            window.CCTVLayout.destroy();
        }
    });
});
