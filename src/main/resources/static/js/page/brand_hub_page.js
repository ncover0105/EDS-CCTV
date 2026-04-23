/**
 * brand_hub_page.js
 * 지도 중심 상황 인지 UI - 페이지 컨트롤러
 *
 * 아키텍처:
 *   State       - 단일 진실 공급원 (상태 저장소)
 *   CctvPopup   - 지도 위 CCTV 미니 팝업 (스트리밍 포함)
 *   EventMarkers - 이벤트 발생 위치 마커 (OL Vector Layer)
 *   MapBridge   - map.js 클릭 훅 연결 + CCTV 포커스
 *   Panel       - 우측 패널 렌더링
 *   DataLoader  - REST API 조회 + SSE 실시간 갱신
 */
(function () {
    'use strict';

    // ── 유틸 ──────────────────────────────────────────────────────────
    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function val(v, fb) {
        return (v === null || v === undefined || v === '') ? fb : v;
    }

    function fmtTime(v) {
        if (!v || v === '-') return '--:--';
        var m = v.match(/(\d{2}:\d{2}):/);
        return m ? m[1] : v.substring(0, 5);
    }

    function isCctvOnline(statusCam) {
        var s = String(val(statusCam, '')).toUpperCase();
        return s === '01' || s === 'Y' || s === '1';
    }

    function getCctvStatusValue(cctv) {
        return String(val(cctv?.statusProc, val(cctv?.statusCam, ''))).trim();
    }

    function isCctvOperational(cctv) {
        return isCctvOnline(getCctvStatusValue(cctv));
    }

    function getCctvStatusLabel(cctv) {
        return isCctvOperational(cctv) ? '정상' : '신호없음';
    }

    function getPopupCctvState(cctv, mode) {
        var isOnline = isCctvOperational(cctv);
        if (mode === 'error') return isOnline ? 'disconnected' : 'offline';
        return isOnline ? 'connecting' : 'offline';
    }

    function isSpeakerOnline(connectStatus) {
        return Number(val(connectStatus, -1)) === 0;
    }

    function safeLoad(url, fb) {
        return fetch(url, { headers: { Accept: 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error(url + ' ' + r.status);
                return r.json();
            })
            .catch(function () { return fb; });
    }

    // ── 상태 ──────────────────────────────────────────────────────────
    var State = {
        olMap: null,
        cctvMap: {},        // cctvCode → full CCTV API object
        speakerList: [],
        events: [],
        eventTotal: 0,
        alertMap: {},
        popup: {
            open: false,
            cctv: null,
            coordinate: null,   // OL coordinate [x, y]
            janusKey: null,
            eventCtx: null
        }
    };

    // 오프라인 감지 시각 추적 (cctvCode → timestamp)
    var _offlineStartMap = {};
    var ENTRY_ALERT_CODE = '003';

    // ── UI 헬퍼 ──────────────────────────────────────────────────────
    function syncUrgentBtn(eventCount) {
        var btn = document.querySelector('.hub-btn--urgent');
        if (!btn) return;
        btn.classList.toggle('has-event', eventCount > 0);
    }

    function renderOfflineDuration(key) {
        var since = _offlineStartMap[key];
        if (!since) return 'OFF';
        var min = Math.floor((Date.now() - since) / 60000);
        if (min < 1)  return 'OFF';
        if (min < 60) return min + '분';
        return Math.floor(min / 60) + 'h+';
    }

    function isEntryEvent(ev) {
        return String(val(ev && ev.alertCode, '')).trim() === ENTRY_ALERT_CODE;
    }

    function isSameEventZone(currentPopup, cctv, eventCtx) {
        if (!currentPopup || !currentPopup.open || !currentPopup.cctv || !eventCtx) return false;
        if (String(val(currentPopup.cctv.cctvCode, '')) !== String(val(cctv && cctv.cctvCode, ''))) return false;
        return String(val(currentPopup.eventCtx && currentPopup.eventCtx.boundaryNum, ''))
            === String(val(eventCtx.boundaryNum, ''));
    }

    // ── CCTV 미니 팝업 ────────────────────────────────────────────────
    var CctvPopup = {
        el: null,
        videoEl: null,
        loadingEl: null,
        errorEl: null,
        _repositionRaf: null,

        init: function () {
            var self = this;
            this.el        = document.getElementById('cctvMiniPopup');
            this.videoEl   = document.getElementById('cctvPopupVideo');
            this.loadingEl = document.getElementById('cctvPopupLoading');
            this.errorEl   = document.getElementById('cctvPopupError');

            document.getElementById('cctvPopupClose')
                .addEventListener('click', function () { self.close(); });

            // 지도 이동/줌 시 팝업 위치 재계산
            State.olMap.on('postrender', function () { self.reposition(); });
        },

        open: function (cctv, coordinate, eventCtx) {
            if (!this.el) return;

            if (isSameEventZone(State.popup, cctv, eventCtx)) {
                State.popup.coordinate = coordinate;
                State.popup.eventCtx = eventCtx;
                this._renderEventInfo(eventCtx);
                this.reposition();
                State.olMap.getView().animate({ center: coordinate, duration: 220 });
                return;
            }

            // 기존 스트림 정리
            this._cleanup();

            var name   = val(cctv.name, val(cctv.cctvCode, 'CCTV'));
            var online = isCctvOperational(cctv);
            var key    = 'popup-' + val(cctv.cctvCode, 'unknown');

            State.popup.open       = true;
            State.popup.cctv       = cctv;
            State.popup.coordinate = coordinate;
            State.popup.janusKey   = key;
            State.popup.eventCtx   = eventCtx || null;

            // 헤더
            document.getElementById('cctvPopupName').textContent = name;
            var dot = document.getElementById('cctvPopupDot');
            dot.className = 'cctv-mini-popup-status-dot ' + (online ? 'is-online' : 'is-offline');
            document.getElementById('cctvPopupStatus').textContent = getCctvStatusLabel(cctv);

            // 정보 행
            document.getElementById('cctvPopupAddress').textContent = val(cctv.address, '-');

            this._renderEventInfo(eventCtx);

            this.el.style.display = '';
            this.showLoading(cctv);
            this.reposition();

            // 해당 위치로 지도 이동
            State.olMap.getView().animate({ center: coordinate, duration: 220 });

            if (!online) {
                return;
            }

            // 스트리밍 연결
            this._connectStream(cctv, key);
        },

        close: function () {
            this._cleanup();
            if (this.el) this.el.style.display = 'none';
        },

        _cleanup: function () {
            if (!State.popup.open) return;
            if (State.popup.janusKey && window.CCTVJanus) {
                window.CCTVJanus.disconnectSingle(State.popup.janusKey);
            }
            if (this.videoEl) this.videoEl.srcObject = null;
            State.popup.open       = false;
            State.popup.cctv       = null;
            State.popup.coordinate = null;
            State.popup.janusKey   = null;
            State.popup.eventCtx   = null;
        },

        _renderEventInfo: function (eventCtx) {
            var evRow  = document.getElementById('cctvPopupEventRow');
            var evType = document.getElementById('cctvPopupEventType');
            if (!evRow || !evType) return;
            if (eventCtx) {
                evType.textContent = State.alertMap[eventCtx.alertCode] || val(eventCtx.alertCode, '이벤트');
                evRow.style.display = '';
            } else {
                evRow.style.display = 'none';
            }
        },

        reposition: function () {
            if (!State.popup.open || !State.popup.coordinate || !this.el) return;
            if (this.el.style.display === 'none') return;
            var pixel = State.olMap.getPixelFromCoordinate(State.popup.coordinate);
            if (!pixel) return;

            var mapSize   = State.olMap.getSize() || [0, 0];
            var popupH    = this.el.offsetHeight || 300;
            var popupW    = this.el.offsetWidth || 360;
            var aboveRoom = pixel[1];
            var rightRoom = mapSize[0] - pixel[0];

            // 위 공간 부족 시 아래 배치
            if (aboveRoom < popupH + 24) {
                this.el.classList.add('is-below');
            } else {
                this.el.classList.remove('is-below');
            }

            // 우측 공간 부족 시 좌로 정렬, 좌측 공간 부족 시 우로 정렬
            var xOffset = '';
            if (pixel[0] < popupW / 2) {
                xOffset = 'translate(0%, ' + (this.el.classList.contains('is-below') ? '18px' : 'calc(-100% - 18px)') + ')';
                this.el.style.transform = xOffset.replace('translate(0%', 'translate(0%');
            } else if (rightRoom < popupW / 2) {
                this.el.style.transform = this.el.classList.contains('is-below')
                    ? 'translate(-100%, 18px)'
                    : 'translate(-100%, calc(-100% - 18px))';
            } else {
                this.el.style.transform = '';  // CSS 기본값 사용
            }

            this.el.style.left = pixel[0] + 'px';
            this.el.style.top  = pixel[1] + 'px';
        },

        showLoading: function (cctv) {
            var isOnline = isCctvOperational(cctv);
            var badgeEl = document.getElementById('cctvPopupLoadingBadge');
            var dotEl = document.getElementById('cctvPopupLoadingDot');
            var stateEl = document.getElementById('cctvPopupLoadingState');
            var textEl = document.getElementById('cctvPopupLoadingText');

            if (this.videoEl)   this.videoEl.style.display   = 'none';
            if (this.loadingEl) this.loadingEl.style.display = '';
            if (this.errorEl)   this.errorEl.style.display   = 'none';

            if (badgeEl) {
                badgeEl.className = 'badge ' + (isOnline
                    ? 'ok-bg text-success border border-success border-opacity-25'
                    : 'danger-bg text-danger border border-danger border-opacity-25');
            }
            if (dotEl) {
                dotEl.className = 'status-dot ' + (isOnline ? 'ok' : 'bad');
            }
            if (stateEl) {
                stateEl.textContent = getCctvStatusLabel(cctv);
            }
            if (textEl) {
                textEl.textContent = isOnline ? '영상 연결 중...' : '신호 상태를 확인해주세요.';
            }
        },

        showVideo: function () {
            if (this.videoEl)   this.videoEl.style.display   = 'block';
            if (this.loadingEl) this.loadingEl.style.display = 'none';
            if (this.errorEl)   this.errorEl.style.display   = 'none';
        },

        showError: function (cctv) {
            if (this.videoEl)   this.videoEl.style.display   = 'none';
            if (this.loadingEl) this.loadingEl.style.display = 'none';
            if (this.errorEl)   this.errorEl.style.display   = '';
        },

        _connectStream: function (cctv, key) {
            var self = this;
            var mpId = val(cctv.mountpointId, null);

            // mountpointId가 없으면 스트리밍 불가
            if (!mpId) {
                console.warn('[BrandHub] mountpointId 없음 - cctv:', cctv.cctvCode);
                this.showError(cctv);
                return;
            }
            if (!window.CCTVJanus) {
                console.warn('[BrandHub] CCTVJanus 미로드');
                this.showError(cctv);
                return;
            }
            console.log('[BrandHub] 스트리밍 시도 - key:', key, '/ mountpointId:', mpId);

            var camData = {
                name:         val(cctv.name, val(cctv.cctvCode, 'CCTV')),
                cctvCode:     val(cctv.cctvCode, ''),
                mountpointId: val(cctv.mountpointId, null),
                rtspUrl:      val(cctv.rtspUrl, null),
                statusCam:    val(cctv.statusCam, ''),
                address:      val(cctv.address, '-')
            };

            window.CCTVJanus.connectSingle(camData, {
                key: key,
                skipPrepareReconnect: true,
                onStream: function (stream) {
                    if (State.popup.janusKey !== key) return;
                    self.videoEl.srcObject = stream;
                    self.videoEl.play().catch(function () {});
                    self.showVideo();
                },
                onOff: function () {
                    if (State.popup.janusKey !== key) return;
                    self.showError(cctv);
                },
                onCleanup: function () {
                    if (State.popup.janusKey !== key) return;
                    self.showError(cctv);
                }
            });
        }
    };

    // ── 이벤트 마커 레이어 ────────────────────────────────────────────
    var EventMarkers = {
        layer: null,
        _pulseTimer: null,
        _styleCache: {},
        _suspendPulse: false,

        init: function () {
            this.layer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                zIndex: 50
            });
            State.olMap.addLayer(this.layer);
            this._bindMapMotion();
            this._startPulse();
        },

        update: function (events) {
            if (!this.layer) return;
            var source = this.layer.getSource();
            source.clear();

            var plotted = {};
            var renderItems = Array.isArray(events) ? events.filter(isEntryEvent).slice(0, 40) : [];

            renderItems.forEach(function (ev, idx) {
                var cctv = State.cctvMap[ev.cctvCode];
                if (!cctv) return;

                var lat = Number(cctv.latitude);
                var lng = Number(cctv.longitude);
                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

                // 같은 CCTV에 이벤트가 여러 건이면 하나만 표시 (가장 최신 = 먼저)
                var locKey = cctv.cctvCode;
                if (plotted[locKey]) return;
                plotted[locKey] = true;

                var coordinate = ol.proj.fromLonLat([lng, lat]);
                var feature = new ol.Feature({
                    geometry: new ol.geom.Point(coordinate),
                    eventData: ev
                });
                feature.setStyle(function () {
                    return EventMarkers._style();
                });
                source.addFeature(feature);
            });
        },

        _startPulse: function () {
            if (this._pulseTimer) return;
            this._pulseTimer = window.setInterval(function () {
                if (EventMarkers.layer && !EventMarkers._suspendPulse) {
                    EventMarkers.layer.changed();
                }
            }, 90);
        },

        _bindMapMotion: function () {
            if (!State.olMap || this._motionBound) return;
            this._motionBound = true;

            State.olMap.on('movestart', function () {
                EventMarkers._suspendPulse = true;
            });

            State.olMap.on('moveend', function () {
                window.setTimeout(function () {
                    EventMarkers._suspendPulse = false;
                    if (EventMarkers.layer) {
                        EventMarkers.layer.changed();
                    }
                }, 120);
            });
        },

        _style: function () {
            var progress = (Date.now() % 1200) / 1200;
            var phaseKey = Math.round(progress * 24);
            if (this._styleCache[phaseKey]) return this._styleCache[phaseKey];

            var outerRadius = 6 + (progress * 7.5);
            var outerOpacity = 0.44 * (1 - progress);
            var innerProgress = (progress + 0.45) % 1;
            var innerRadius = 4.6 + (innerProgress * 5.2);
            var innerOpacity = 0.28 * (1 - innerProgress);
            var style = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent([
                        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 -8 48 56">',
                        '<circle cx="34" cy="3" r="' + outerRadius + '" fill="none" stroke="rgba(239,68,68,' + outerOpacity + ')" stroke-width="2.2"/>',
                        '<circle cx="34" cy="3" r="' + innerRadius + '" fill="none" stroke="rgba(251,113,133,' + innerOpacity + ')" stroke-width="1.5"/>',
                        '<circle cx="34" cy="3" r="4.2" fill="rgba(239,68,68,0.96)" stroke="rgba(255,255,255,0.78)" stroke-width="1.15"/>',
                        '</svg>'
                    ].join('')),
                    // 기본 CCTV 마커 우상단 위치에 링 파동형 출입 알림을 겹쳐 배치
                    anchor: [16 / 48, 49 / 56],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    scale: 1
                })
            });
            this._styleCache[phaseKey] = style;
            return style;
        },

        clear: function () {
            if (this.layer) this.layer.getSource().clear();
        }
    };

    // ── 지도 브릿지 ──────────────────────────────────────────────────
    var MapBridge = {
        init: function () {
            // map.js 클릭 훅 등록
            window.onHubMapClick = function (data, coordinate, feature) {
                if (!data) {
                    CctvPopup.close();
                    return;
                }

                // 장치 마커 클릭
                if (data.type === 'cctv') {
                    EventMarkers.clear();
                    // 키를 String으로 통일하여 조회
                    var cctv = State.cctvMap[String(data.id)];
                    if (!cctv) {
                        console.warn('[BrandHub] cctvMap에서 찾지 못함 - id:', data.id, '/ cctvMap keys:', Object.keys(State.cctvMap).slice(0, 5));
                        // map.js gpsData 기반 최소 정보로 팝업 표시 (스트리밍 불가)
                        cctv = {
                            cctvCode:  data.id,
                            name:      data.name,
                            statusCam: data.status === 'online' ? '1' : '0',
                            statusProc: data.status === 'online' ? '1' : '0'
                        };
                    }
                    CctvPopup.open(cctv, coordinate, null);
                } else if (data.type === 'speaker') {
                    EventMarkers.clear();
                    // 스피커는 map.js 기본 팝업 위임
                    if (window.showMapPopup) window.showMapPopup(data, coordinate);
                }
            };

            EventMarkers.init();
        },

        // cctvCode 기반으로 지도 포커스 + 팝업 오픈
        focusCctv: function (cctvCode, eventCtx) {
            var cctv = State.cctvMap[cctvCode];
            if (!cctv) return;

            var lat = Number(val(cctv.latitude, null));
            var lng = Number(val(cctv.longitude, null));
            if (isNaN(lat) || isNaN(lng)) return;

            var coordinate = ol.proj.fromLonLat([lng, lat]);
            var currentZoom = State.olMap.getView().getZoom() || 16;

            State.olMap.getView().animate({
                center: coordinate,
                zoom: Math.max(currentZoom, 16),
                duration: 220
            });

            CctvPopup.open(cctv, coordinate, eventCtx);
        }
    };

    // ── 우측 패널 렌더링 ──────────────────────────────────────────────
    var Panel = {
        renderEvents: function (items, total, flash) {
            var cntEl   = document.getElementById('hubEventCount');
            var shiftEl = document.getElementById('opsShiftEventCount');
            if (cntEl)   cntEl.textContent   = total + '건';
            if (shiftEl) shiftEl.textContent = total;

            syncUrgentBtn(total);

            var el = document.getElementById('hubEventList');
            if (!el) return;

            var wasAtTop    = el.scrollTop < 40;
            var savedScroll = el.scrollTop;

            if (!items.length) {
                el.innerHTML = '<div class="hub-empty">오늘 이벤트 없음</div>';
                return;
            }

            el.innerHTML = items.slice(0, 50).map(function (item, idx) {
                var time    = fmtTime(val(item.inpDttm, '-'));
                var zone    = item.boundaryNum ? item.boundaryNum + '구역' : '-';
                var type    = State.alertMap[item.alertCode] || val(item.alertCode, '이벤트');
                var cam     = val(item.cctvName, val(item.cctvCode, '-'));
                var code    = esc(val(item.cctvCode, ''));
                var camName = esc(val(item.cctvName, val(item.cctvCode, '')));

                return [
                    '<div class="hub-ev hub-tl-item" data-cctv-code="' + code + '" data-ev-idx="' + idx + '" data-cam-name="' + camName + '" tabindex="0" role="button">',
                    '  <div class="hub-tl-track">',
                    '    <div class="hub-tl-dot"></div>',
                    '    <div class="hub-tl-line"></div>',
                    '  </div>',
                    '  <div class="hub-tl-content">',
                    '    <div class="hub-tl-meta">',
                    '      <span class="hub-ev-t">' + esc(time) + '</span>',
                    '      <span class="hub-ev-type">' + esc(type) + '</span>',
                    '      <div class="hub-ev-quick">',
                    '        <button type="button" class="hub-ev-q-btn" data-action="broadcast" title="방송 발령">',
                    '          <i class="bi bi-broadcast-pin"></i>',
                    '        </button>',
                    '      </div>',
                    '    </div>',
                    '    <div class="hub-tl-main">',
                    '      <span class="hub-ev-zone">' + esc(zone) + '</span>',
                    '      <span class="hub-ev-cam">' + esc(cam) + '</span>',
                    '    </div>',
                    '  </div>',
                    '</div>'
                ].join('');
            }).join('');

            // 스크롤 위치 복원 (운영자가 스크롤 내린 중이었다면 유지)
            if (!wasAtTop) {
                el.scrollTop = savedScroll;
            }
        },

        renderEquipment: function (cctvList, speakers) {
            var metaEl = document.getElementById('hubEquipMeta');
            var cctvOnline = cctvList.filter(function (c) { return isCctvOperational(c); }).length;
            var spkOnline  = speakers.filter(function (s) { return isSpeakerOnline(s.connectStatus); }).length;
            var cctvOff = cctvList.length - cctvOnline;
            var spkOff  = speakers.length - spkOnline;

            if (metaEl) metaEl.textContent = 'CCTV ' + cctvList.length + ' · 스피커 ' + speakers.length;

            // 오프라인 감지 시각 추적
            var now = Date.now();
            cctvList.forEach(function (c) {
                var key = 'cctv_' + c.cctvCode;
                if (!isCctvOperational(c)) {
                    if (!_offlineStartMap[key]) _offlineStartMap[key] = now;
                } else {
                    delete _offlineStartMap[key];
                }
            });

            // 하단 푸터 카운트
            var elFtCctv = document.getElementById('brandCctvCount');
            var elFtSpk  = document.getElementById('brandSpeakerCount');
            var elChipCctvOff = document.getElementById('opsChipCctvOff');
            var elShiftCctvOff = document.getElementById('opsShiftCctvOff');
            var elChipSpkOff  = document.getElementById('opsChipSpkOff');
            var elShiftSpkOff = document.getElementById('opsShiftSpkOff');
            if (elFtCctv) elFtCctv.textContent = cctvList.length;
            if (elFtSpk)  elFtSpk.textContent  = speakers.length;
            if (elShiftCctvOff) elShiftCctvOff.textContent = cctvOff;
            if (elChipCctvOff)  elChipCctvOff.style.display = cctvOff > 0 ? '' : 'none';
            if (elShiftSpkOff)  elShiftSpkOff.textContent = spkOff;
            if (elChipSpkOff)   elChipSpkOff.style.display = spkOff > 0 ? '' : 'none';

            var el = document.getElementById('hubEquipBody');
            if (!el) return;

            var cctvRows = cctvList.map(function (c) {
                var online  = isCctvOperational(c);
                var code    = esc(val(c.cctvCode, ''));
                var name    = esc(val(c.name, val(c.cctvCode, 'CCTV')));
                var icon    = online ? 'bi-camera-video-fill' : 'bi-camera-video-off-fill';
                var cls     = online ? 'is-on' : 'is-off';
                var badgeTxt = online ? 'ON' : renderOfflineDuration('cctv_' + c.cctvCode);
                var offTitle = (!online && _offlineStartMap['cctv_' + c.cctvCode])
                    ? ' title="오프라인: ' + new Date(_offlineStartMap['cctv_' + c.cctvCode]).toLocaleTimeString('ko-KR') + '"'
                    : '';
                return [
                    '<button type="button" class="hub-dev-item" data-cctv-code="' + code + '">',
                    '  <i class="bi ' + icon + ' hub-dev-icon ' + cls + '"></i>',
                    '  <span class="hub-dev-name">' + name + '</span>',
                    '  <span class="hub-dev-badge ' + cls + '"' + offTitle + '>' + badgeTxt + '</span>',
                    '</button>'
                ].join('');
            }).join('');

            var spkRows = speakers.map(function (s) {
                var online = isSpeakerOnline(s.connectStatus);
                var name   = esc(val(s.speakerName, val(s.speakerId, '스피커')));
                var icon   = online ? 'bi-megaphone-fill' : 'bi-megaphone';
                var cls    = online ? 'is-on' : 'is-off';
                return [
                    '<div class="hub-dev-item">',
                    '  <i class="bi ' + icon + ' hub-dev-icon ' + cls + '"></i>',
                    '  <span class="hub-dev-name">' + name + '</span>',
                    '  <span class="hub-dev-badge ' + cls + '">' + (online ? 'ON' : 'OFF') + '</span>',
                    '</div>'
                ].join('');
            }).join('');

            el.innerHTML = cctvRows + spkRows;

            el.querySelectorAll('.hub-dev-item[data-cctv-code]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    MapBridge.focusCctv(btn.getAttribute('data-cctv-code'), null);
                });
            });
        },

        renderBroadcast: function (list) {
            list = Array.isArray(list) ? list : [];
            var cntEl = document.getElementById('hubBcCount');
            var ftCnt = document.getElementById('brandBroadcastCount');
            if (cntEl) cntEl.textContent = list.length + '건';
            if (ftCnt) ftCnt.textContent = list.length;

            var el = document.getElementById('hubBcList');
            if (!el) return;

            if (!list.length) {
                el.innerHTML = '<div class="hub-empty">방송이력 없음</div>';
                return;
            }

            el.innerHTML = list.slice(0, 5).map(function (item) {
                var deviceId = String(val(item.deviceId, '-'));
                var speaker = (State.speakerList || []).find(function (s) {
                    return String(val(s.speakerId, '')) === deviceId
                        || String(val(s.speakerKey, '')) === deviceId;
                });
                var dev = esc(val(speaker?.speakerName, deviceId));
                var ok  = String(val(item.status, '')) === '1';
                var t   = esc(fmtTime(item.createdAt));
                return [
                    '<div class="hub-bc-item">',
                    '  <i class="bi bi-broadcast-pin hub-bc-icon"></i>',
                    '  <span class="hub-bc-name">' + dev + '</span>',
                    '  <span class="hub-bc-status ' + (ok ? 'is-ok' : 'is-fail') + '">' + (ok ? '✓' : '✗') + '</span>',
                    '  <span class="hub-bc-time">' + t + '</span>',
                    '</div>'
                ].join('');
            }).join('');
        }
    };

    // ── 데이터 로드 ──────────────────────────────────────────────────
    function loadAll() {
        safeLoad('/api/alerts', {}).then(function (m) { State.alertMap = m || {}; });

        Promise.all([
            safeLoad('/api/cctv/list', []),
            safeLoad('/api/btype/query/config/speakers', []),
            safeLoad('/menu/situation/emergency/search?page=1&size=200', { items: [], totalCount: 0 }),
            safeLoad('/api/spk/web/alert-logs/latest', [])
        ]).then(function (r) {
            var cctvList      = Array.isArray(r[0]) ? r[0] : [];
            var speakers      = Array.isArray(r[1]) ? r[1] : [];
            var emergencyData = r[2] || {};
            var broadcastList = Array.isArray(r[3]) ? r[3] : [];

            // cctvCode 인덱스 생성 (키를 String으로 통일 - map.js와 타입 일치)
            cctvList.forEach(function (c) {
                if (c.cctvCode != null) State.cctvMap[String(c.cctvCode)] = c;
            });
            State.speakerList = speakers;

            var items = Array.isArray(emergencyData.items) ? emergencyData.items.filter(isEntryEvent) : [];
            var total = items.length;
            State.events      = items;
            State.eventTotal  = total;

            Panel.renderEvents(items, total, false);
            Panel.renderEquipment(cctvList, speakers);
            Panel.renderBroadcast(broadcastList);

            // 기본 상태는 장치 마커만 표시
            if (State.olMap) EventMarkers.update([]);
        });
    }

    var _refreshTimer = null;
    function refreshEmergency(flash) {
        safeLoad('/menu/situation/emergency/search?page=1&size=200', { items: [], totalCount: 0 })
            .then(function (data) {
                var items = Array.isArray(data.items) ? data.items.filter(isEntryEvent) : [];
                var total = items.length;
                State.events     = items;
                State.eventTotal = total;
                Panel.renderEvents(items, total, flash);
                if (State.olMap) {
                    if (flash && items.length) {
                        EventMarkers.update(items);
                    } else {
                        EventMarkers.update([]);
                    }
                }
            });
    }

    // ── SSE 실시간 수신 ──────────────────────────────────────────────
    function connectSSE() {
        var es = new EventSource('/api/events');
        es.onmessage = function (e) {
            try {
                var data = JSON.parse(e.data);
                if (data.topic === 'send/emergency') {
                    clearTimeout(_refreshTimer);
                    _refreshTimer = setTimeout(function () { refreshEmergency(true); }, 400);
                } else if (data.topic === 'cctv/req') {
                    clearTimeout(_refreshTimer);
                    _refreshTimer = setTimeout(function () { loadAll(); }, 400);
                }
            } catch (_) { /* 무시 */ }
        };
        es.onerror = function () {
            es.close();
            setTimeout(connectSSE, 5000);
        };
    }

    function bindMapActions() {
        var refreshBtn = document.getElementById('hubRefreshMapBtn');
        if (!refreshBtn || refreshBtn.dataset.bound === '1') return;

        refreshBtn.dataset.bound = '1';
        refreshBtn.addEventListener('click', function () {
            loadAll();
            if (window.loadMapData) {
                window.loadMapData();
            } else if (window.refreshMap) {
                window.refreshMap();
            }
        });
    }

    // ── 지도 준비 대기 ────────────────────────────────────────────────
    function onMapReady(map) {
        if (State.olMap) return; // 중복 실행 방지
        State.olMap = map;
        CctvPopup.init();
        MapBridge.init();
        EventMarkers.update([]);
    }

    // ── 초기화 ───────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        bindMapActions();
        connectSSE();
        loadAll();

        // 이벤트 리스트 위임: 방송 버튼 / 카메라 포커스
        var evList = document.getElementById('hubEventList');
        if (evList) {
            evList.addEventListener('click', function (e) {
                // 빠른 방송 버튼
                var qBtn = e.target.closest('[data-action="broadcast"]');
                if (qBtn) {
                    e.stopPropagation();
                    var evEl = qBtn.closest('.hub-ev');
                    if (evEl) {
                        window._broadcastHintCamera = evEl.dataset.camName || '';
                        var modalTrigger = document.querySelector('[data-bs-target="#speaker_broadcast_modal"]');
                        if (modalTrigger) modalTrigger.click();
                    }
                    return;
                }
                // 카메라 포커스
                var evDiv = e.target.closest('.hub-ev[data-cctv-code]');
                if (evDiv) {
                    var code = evDiv.getAttribute('data-cctv-code');
                    var idx  = parseInt(evDiv.getAttribute('data-ev-idx'), 10);
                    MapBridge.focusCctv(code, State.events[idx] || null);
                }
            });
        }

        // 오프라인 칩 클릭 → 장비 목록 해당 항목 하이라이트
        // isCctv=true 이면 data-cctv-code 있는 항목(CCTV)만, false면 스피커만 강조
        function bindChipHighlight(chipId, isCctv) {
            var chip = document.getElementById(chipId);
            if (!chip) return;
            chip.addEventListener('click', function () {
                var equip = document.getElementById('hubEquipBody');
                if (!equip) return;
                var allItems = equip.querySelectorAll('.hub-dev-item');
                var firstOff = null;
                allItems.forEach(function (item) {
                    var badge      = item.querySelector('.hub-dev-badge');
                    var isCctvItem = !!item.getAttribute('data-cctv-code');
                    var isOff      = badge && badge.classList.contains('is-off');
                    var matches    = isOff && (isCctv ? isCctvItem : !isCctvItem);
                    item.style.opacity = matches ? '1' : '0.35';
                    if (matches && !firstOff) firstOff = item;
                });
                if (firstOff) firstOff.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setTimeout(function () {
                    allItems.forEach(function (i) { i.style.opacity = ''; });
                }, 2000);
            });
        }
        bindChipHighlight('opsChipCctvOff', true);
        bindChipHighlight('opsChipSpkOff',  false);

        // map.js가 지도를 초기화한 뒤 발행하는 커스텀 이벤트 수신
        document.addEventListener('olmapready', function (e) {
            onMapReady(e.detail.map);
        });

        // 이미 초기화됐을 경우 (로드 순서 역전 방어)
        if (window._olMapRef) {
            onMapReady(window._olMapRef);
        } else {
            // 지도 로드 트리거 (map.js의 loadMapData 호출)
            if (window.loadMapData) window.loadMapData();
        }
    });

    window.addEventListener('beforeunload', function () {
        if (window.CCTVJanus) window.CCTVJanus.destroy();
    });

})();
