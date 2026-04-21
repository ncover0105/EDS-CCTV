document.addEventListener("DOMContentLoaded", function () {

    // ── DOM refs ──────────────────────────────────────────
    var elClock          = document.getElementById("opsClock");
    var elShiftEvent     = document.getElementById("opsShiftEventCount");
    var elChipCctvOff    = document.getElementById("opsChipCctvOff");
    var elShiftCctvOff   = document.getElementById("opsShiftCctvOff");
    var elChipSpkOff     = document.getElementById("opsChipSpkOff");
    var elShiftSpkOff    = document.getElementById("opsShiftSpkOff");

    var elSpeakerCount   = document.getElementById("brandSpeakerCount");
    var elSpeakerListCnt = document.getElementById("brandSpeakerListCount");
    var elSpeakerList    = document.getElementById("brandSpeakerList");

    var elCctvCount      = document.getElementById("brandCctvCount");
    var elCctvPicker     = document.getElementById("brandCctvPicker");

    var elEventListCnt   = document.getElementById("brandEmergencyListCount");
    var elEventTotal     = document.getElementById("brandEmergencyCount");
    var elEventFt        = document.getElementById("opsEmergencyFt");
    var elEventList      = document.getElementById("brandEmergencyList");
    var elZoneBars       = document.getElementById("opsZoneBars");
    var elHourlyBars     = document.getElementById("opsHourlyBars");

    var elBcCount        = document.getElementById("brandBroadcastCount");
    var elBcList         = document.getElementById("brandBroadcastList");

    var elCctvHourly     = document.getElementById("opsCctvHourly");
    var elCsSumTotal     = document.getElementById("opsCsSumTotal");
    var elCsSumPeak      = document.getElementById("opsCsSumPeak");
    var elCsSumZone      = document.getElementById("opsCsSumZone");

    // alertCode → 표시명 맵 (API 로드 전 기본값)
    var alertMap = {};

    // 현재 선택된 CCTV
    var selectedCctv = null;

    // ── 유틸 ─────────────────────────────────────────────
    function getValue(v, fb) {
        return (v === null || v === undefined || v === "") ? fb : v;
    }

    function escapeHtml(v) {
        return String(getValue(v, ""))
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // "yyyy-MM-dd HH:mm:ss" → "HH:mm"
    function fmtShortTime(v) {
        if (!v || v === "-") return "--:--";
        var m = v.match(/(\d{2}:\d{2}):/);
        return m ? m[1] : v.substring(0, 5);
    }

    // "yyyy-MM-dd HH:mm:ss" → 시(0~23)
    function extractHour(v) {
        if (!v || v === "-") return null;
        var m = v.match(/\s(\d{2}):/);
        return m ? parseInt(m[1], 10) : null;
    }

    function isCctvOnline(statusCam) {
        var s = String(getValue(statusCam, "")).toUpperCase();
        return s === "01" || s === "Y" || s === "1";
    }

    function isSpeakerOnline(connectStatus) {
        return Number(getValue(connectStatus, -1)) === 0;
    }

    function alertLabel(code) {
        if (!code || code === "-") return "이벤트";
        return alertMap[code] || code;
    }

    function set(el, text) {
        if (el) el.textContent = String(text);
    }

    // ── 시계 ─────────────────────────────────────────────
    function startClock() {
        if (!elClock) return;
        function tick() {
            elClock.textContent = new Date().toLocaleTimeString("ko-KR", {
                hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
            });
        }
        tick();
        setInterval(tick, 1000);
    }

    // ── HTTP ─────────────────────────────────────────────
    function loadJson(url) {
        return fetch(url, { headers: { "Accept": "application/json" } })
            .then(function (r) {
                if (!r.ok) throw new Error(url + " " + r.status);
                return r.json();
            });
    }

    function safeLoad(url, fb) {
        return loadJson(url).catch(function () { return fb; });
    }

    // ── CCTV 스트리밍 ────────────────────────────────────
    function normalizeCctvForStream(cctv) {
        if (!cctv) return null;
        var raw = String(getValue(cctv.statusCam, "")).toUpperCase();
        return {
            locationCode: getValue(cctv.locationCode, ""),
            cctvCode:     getValue(cctv.cctvCode, ""),
            name:         getValue(cctv.name, getValue(cctv.cctvCode, "CCTV")),
            address:      getValue(cctv.address, "-"),
            wsPort:       getValue(cctv.wsPort, "-"),
            latitude:     getValue(cctv.latitude, "-"),
            longitude:    getValue(cctv.longitude, "-"),
            statusCam:    raw,
            status:       isCctvOnline(raw) ? "1" : "0",
            mountpointId: getValue(cctv.mountpointId, null),
            videoPort:    getValue(cctv.videoPort, null),
            rtspUrl:      getValue(cctv.rtspUrl, null)
        };
    }

    function connectStream(cctv) {
        if (window.CCTVJanus)  window.CCTVJanus.destroy();
        if (window.CCTVLayout) window.CCTVLayout.destroy();
        if (!cctv) { selectedCctv = null; return; }
        selectedCctv = normalizeCctvForStream(cctv);
        if (!window.CCTVLayout || !window.CCTVJanus) return;
        window.CCTVLayout.init([selectedCctv]);
        window.CCTVLayout.renderGrid(1);
        window.CCTVJanus.initSignaling([selectedCctv]);
    }

    function getCamTabs() {
        return Array.prototype.slice.call(
            document.querySelectorAll("#brandCctvPicker .ops-cam-tab")
        );
    }

    function applyTab(btn) {
        getCamTabs().forEach(function (t) { t.classList.remove("is-active"); });
        if (!btn) return;
        btn.classList.add("is-active");
        connectStream({
            name:         btn.getAttribute("data-name"),
            address:      btn.getAttribute("data-address"),
            cctvCode:     btn.getAttribute("data-code"),
            wsPort:       btn.getAttribute("data-port"),
            mountpointId: btn.getAttribute("data-mountpoint-id"),
            videoPort:    btn.getAttribute("data-video-port"),
            rtspUrl:      btn.getAttribute("data-rtsp-url"),
            latitude:     btn.getAttribute("data-latitude"),
            longitude:    btn.getAttribute("data-longitude"),
            statusCam:    btn.getAttribute("data-status-code"),
            locationCode: btn.getAttribute("data-location-code")
        });
    }

    function bindCamTabs() {
        var tabs = getCamTabs();
        tabs.forEach(function (btn) {
            btn.addEventListener("click", function () { applyTab(btn); });
        });
        if (tabs.length) {
            var active = tabs.filter(function (t) {
                return t.classList.contains("is-active");
            })[0] || tabs[0];
            applyTab(active);
        }
    }

    // ── 렌더: CCTV 탭 ────────────────────────────────────
    function renderCctvTabs(list) {
        list = Array.isArray(list) ? list : [];
        var online = list.filter(function (c) { return isCctvOnline(c.statusCam); }).length;
        var offline = list.length - online;

        set(elCctvCount, list.length);

        // 헤더 shift chip 업데이트
        if (elShiftCctvOff) set(elShiftCctvOff, offline);
        if (elChipCctvOff) elChipCctvOff.style.display = offline > 0 ? "" : "none";

        if (!elCctvPicker) return;

        if (!list.length) {
            elCctvPicker.innerHTML = '<button type="button" class="ops-cam-tab">데이터 없음</button>';
            connectStream(null);
            return;
        }

        elCctvPicker.innerHTML = list.map(function (c, i) {
            var ok   = isCctvOnline(c.statusCam) ? "1" : "0";
            var name = getValue(c.name, getValue(c.cctvCode, "CCTV"));
            return [
                '<button type="button"',
                ' class="ops-cam-tab' + (i === 0 ? ' is-active' : '') + '"',
                ' data-ok="' + ok + '"',
                ' data-name="' + escapeHtml(name) + '"',
                ' data-address="' + escapeHtml(getValue(c.address, "-")) + '"',
                ' data-code="' + escapeHtml(getValue(c.cctvCode, "")) + '"',
                ' data-port="' + escapeHtml(getValue(c.wsPort, "-")) + '"',
                ' data-mountpoint-id="' + escapeHtml(getValue(c.mountpointId, "")) + '"',
                ' data-video-port="' + escapeHtml(getValue(c.videoPort, "")) + '"',
                ' data-rtsp-url="' + escapeHtml(getValue(c.rtspUrl, "")) + '"',
                ' data-latitude="' + escapeHtml(getValue(c.latitude, "-")) + '"',
                ' data-longitude="' + escapeHtml(getValue(c.longitude, "-")) + '"',
                ' data-status-code="' + escapeHtml(getValue(c.statusCam, "")) + '"',
                ' data-location-code="' + escapeHtml(getValue(c.locationCode, "")) + '"',
                ' title="' + escapeHtml(name) + (ok === "0" ? " (오프라인)" : "") + '">',
                escapeHtml(name),
                '</button>'
            ].join("");
        }).join("");

        bindCamTabs();
    }

    // ── 렌더: 스피커 도트 ────────────────────────────────
    function renderSpeakerDots(list) {
        list = Array.isArray(list) ? list : [];
        var online  = list.filter(function (s) { return isSpeakerOnline(s.connectStatus); }).length;
        var offline = list.length - online;

        set(elSpeakerCount, list.length);
        set(elSpeakerListCnt, list.length + "대");

        if (elShiftSpkOff) set(elShiftSpkOff, offline);
        if (elChipSpkOff)  elChipSpkOff.style.display = offline > 0 ? "" : "none";

        if (!elSpeakerList) return;

        if (!list.length) {
            elSpeakerList.innerHTML = '<span style="font-size:11px;color:#334155;">장비 없음</span>';
            return;
        }

        elSpeakerList.innerHTML = list.map(function (s) {
            var status = isSpeakerOnline(s.connectStatus) ? "on" : "off";
            var label  = String(getValue(s.speakerName, getValue(s.speakerId, "-")));
            var abbr   = label.replace(/[^A-Za-z0-9가-힣]/g, "").substring(0, 2) || "S";
            return [
                '<div class="ops-spk-dot" data-status="' + status + '"',
                ' title="' + escapeHtml(label) + ' (' + (status === "on" ? "온라인" : "오프라인") + ')">',
                escapeHtml(abbr),
                '</div>'
            ].join("");
        }).join("");
    }

    // ── 렌더: 이벤트 타임라인 ───────────────────────────
    function renderEventTimeline(items, totalCount, isFlash) {
        items = Array.isArray(items) ? items : [];
        totalCount = totalCount || items.length;

        set(elEventListCnt, totalCount + "건");
        set(elEventTotal,   totalCount + "건");
        set(elEventFt,      totalCount);
        if (elShiftEvent) set(elShiftEvent, totalCount);

        if (!elEventList) return;

        if (!items.length) {
            elEventList.innerHTML =
                '<div style="padding:12px 0;text-align:center;font-size:11px;color:#334155;">오늘 이벤트 없음</div>';
            return;
        }

        var html = items.slice(0, 60).map(function (item, idx) {
            var time    = fmtShortTime(getValue(item.inpDttm, "-"));
            var zone    = item.boundaryNum ? item.boundaryNum + "구역" : "미지정";
            var type    = alertLabel(getValue(item.alertCode, "-"));
            var camName = getValue(item.cctvName, getValue(item.cctvCode, "-"));
            var isNew   = isFlash && idx === 0 ? " ops-ev--new" : "";
            return [
                '<div class="ops-ev' + isNew + '">',
                '  <div class="ops-ev-t">' + escapeHtml(time) + '</div>',
                '  <div class="ops-ev-info">',
                '    <div class="ops-ev-row">',
                '      <span class="ops-ev-zone">' + escapeHtml(zone) + '</span>',
                '      <span class="ops-ev-type">' + escapeHtml(type) + '</span>',
                '    </div>',
                '    <span class="ops-ev-cam">' + escapeHtml(camName) + '</span>',
                '  </div>',
                '</div>'
            ].join("");
        }).join("");

        elEventList.innerHTML = html;
    }

    // ── 렌더: 구역별 도넛 차트 ──────────────────────────
    function renderZoneBars(items) {
        if (!elZoneBars) return;
        var zoneColors = ["", "#f97316", "#3b82f6", "#22c55e", "#a855f7"];
        var zoneCounts = [0, 0, 0, 0, 0];
        var unassigned = 0;
        items.forEach(function (item) {
            var z = item.boundaryNum != null ? Number(item.boundaryNum) : 0;
            if (z >= 1 && z <= 4) zoneCounts[z]++;
            else unassigned++;
        });

        var total = items.length || 1;
        var segments = [];
        var acc = 0;
        [1, 2, 3, 4].forEach(function (z) {
            var pct = (zoneCounts[z] / total) * 100;
            if (pct > 0) {
                segments.push(zoneColors[z] + " " + acc.toFixed(1) + "% " + (acc + pct).toFixed(1) + "%");
                acc += pct;
            }
        });
        if (unassigned > 0) {
            var upct = (unassigned / total) * 100;
            segments.push("#64748b " + acc.toFixed(1) + "% " + (acc + upct).toFixed(1) + "%");
        }

        var gradient = segments.length > 0
            ? "conic-gradient(" + segments.join(", ") + ")"
            : "conic-gradient(rgba(255,255,255,0.08) 0% 100%)";

        var legendHtml = [1, 2, 3, 4].map(function (z) {
            return [
                '<div class="ops-donut-item">',
                '<span class="ops-donut-dot" style="background:' + zoneColors[z] + '"></span>',
                '<span>' + z + '구역</span>',
                '<strong>' + zoneCounts[z] + '</strong>',
                '</div>'
            ].join("");
        }).join("");
        if (unassigned > 0) {
            legendHtml += [
                '<div class="ops-donut-item">',
                '<span class="ops-donut-dot" style="background:#64748b"></span>',
                '<span>미지정</span>',
                '<strong>' + unassigned + '</strong>',
                '</div>'
            ].join("");
        }

        elZoneBars.innerHTML =
            '<div class="ops-donut-ring" style="background:' + gradient + '"></div>' +
            '<div class="ops-donut-legend">' + legendHtml + '</div>';
    }

    // ── 렌더: CCTV 차트 행 (통계 요약 + 24h 바) ─────────
    function renderCctvStats(items) {
        items = Array.isArray(items) ? items : [];
        if (elCsSumTotal) set(elCsSumTotal, items.length);

        var hours = new Array(24).fill(0);
        items.forEach(function (item) {
            var h = extractHour(getValue(item.inpDttm, null));
            if (h !== null) hours[h]++;
        });

        var max = Math.max.apply(null, hours);
        var peakH = max > 0 ? hours.indexOf(max) : null;
        if (elCsSumPeak) set(elCsSumPeak, peakH !== null ? peakH + "시" : "-");

        var zCounts = [0, 0, 0, 0, 0];
        items.forEach(function (item) {
            var z = item.boundaryNum != null ? Number(item.boundaryNum) : 0;
            if (z >= 1 && z <= 4) zCounts[z]++;
        });
        var topZ = null, topV = 0;
        [1, 2, 3, 4].forEach(function (z) {
            if (zCounts[z] > topV) { topV = zCounts[z]; topZ = z; }
        });
        if (elCsSumZone) set(elCsSumZone, topZ ? topZ + "구역" : "-");

        if (!elCctvHourly) return;
        var nowH = new Date().getHours();
        var BAR_H = 38;
        elCctvHourly.innerHTML = hours.map(function (cnt, h) {
            var px  = max > 0 ? Math.max(1, Math.round((cnt / max) * BAR_H)) : 1;
            var cls = h === nowH ? " is-now" : (cnt === max && max > 0 ? " is-hot" : "");
            return '<div class="ops-cctv-h-bar' + cls + '" style="height:' + px + 'px" title="' + h + "시 " + cnt + '건"></div>';
        }).join("");
    }

    // ── 렌더: 시간대별 스파크라인 ───────────────────────
    function renderHourlyBars(items) {
        if (!elHourlyBars) return;
        var hours = new Array(24).fill(0);
        items.forEach(function (item) {
            var h = extractHour(getValue(item.inpDttm, null));
            if (h !== null) hours[h]++;
        });

        var nowHour = new Date().getHours();
        var max = Math.max.apply(null, hours) || 1;
        var BAR_H = 28; // px

        elHourlyBars.innerHTML = hours.map(function (cnt, h) {
            var px   = Math.max(2, Math.round((cnt / max) * BAR_H));
            var cls  = h === nowHour ? " is-now" : (cnt === max && max > 0 ? " is-hot" : "");
            return '<div class="ops-h-bar' + cls + '" style="height:' + px + 'px" title="' + h + '시 ' + cnt + '건"></div>';
        }).join("");
    }

    // ── 렌더: 방송이력 (footer) ──────────────────────────
    function renderBroadcastFoot(list) {
        list = Array.isArray(list) ? list : [];
        set(elBcCount, list.length);
        if (!elBcList) return;

        if (!list.length) {
            elBcList.innerHTML = '<span class="ops-bc-entry"><i class="bi bi-soundwave"></i><span>방송이력 없음</span></span>';
            return;
        }

        elBcList.innerHTML = list.slice(0, 3).map(function (item) {
            var dev    = getValue(item.deviceId, "-");
            var status = String(getValue(item.status, "")) === "1" ? "✓" : "✗";
            var t      = fmtShortTime(item.createdAt);
            return [
                '<span class="ops-bc-entry">',
                '  <i class="bi bi-broadcast-pin"></i>',
                '  <span>' + escapeHtml(dev) + ' ' + status + ' ' + escapeHtml(t) + '</span>',
                '</span>'
            ].join("");
        }).join("");
    }

    // ── 이벤트 데이터 통합 처리 ──────────────────────────
    function handleEmergencyData(payload, isFlash) {
        var items = payload && Array.isArray(payload.items) ? payload.items : [];
        var total = payload && payload.totalCount !== undefined ? payload.totalCount : items.length;
        renderEventTimeline(items, total, isFlash);
        renderZoneBars(items);
        renderHourlyBars(items);
        renderCctvStats(items);
    }

    // ── SSE 실시간 수신 ──────────────────────────────────
    var refreshTimer = null;

    function scheduleRefresh() {
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () {
            safeLoad("/menu/situation/emergency/search?page=1&size=200",
                     { items: [], totalCount: 0 })
                .then(function (data) { handleEmergencyData(data, true); });
        }, 400);
    }

    function connectSSE() {
        var es = new EventSource("/api/events");
        es.onmessage = function (e) {
            try {
                var data = JSON.parse(e.data);
                if (data.topic === "send/emergency" || data.topic === "cctv/req") {
                    scheduleRefresh();
                }
            } catch (_) {}
        };
        es.onerror = function () {
            es.close();
            setTimeout(connectSSE, 5000);
        };
    }

    // ── 초기 로드 ────────────────────────────────────────
    startClock();
    connectSSE();

    // alertCode 맵 선(先) 로드 (이벤트 표시명에 사용)
    safeLoad("/api/alerts", {}).then(function (m) { alertMap = m || {}; });

    Promise.all([
        safeLoad("/api/btype/query/config/speakers", []),
        safeLoad("/api/cctv/list", []),
        safeLoad("/menu/situation/emergency/search?page=1&size=200",
                 { items: [], totalCount: 0 }),
        safeLoad("/api/spk/web/alert-logs/latest", [])
    ]).then(function (r) {
        renderSpeakerDots(r[0]);
        renderCctvTabs(r[1]);
        handleEmergencyData(r[2], false);
        renderBroadcastFoot(r[3]);
    }).catch(function () {
        renderSpeakerDots([]);
        renderCctvTabs([]);
        handleEmergencyData({ items: [], totalCount: 0 }, false);
        renderBroadcastFoot([]);
    });

    window.addEventListener("beforeunload", function () {
        if (window.CCTVJanus)  window.CCTVJanus.destroy();
        if (window.CCTVLayout) window.CCTVLayout.destroy();
    });
});
