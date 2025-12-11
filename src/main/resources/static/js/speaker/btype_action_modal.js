// 온품 스피커 컨트롤

// 로그 출력 함수
function appendBtypeLog(...args) {
    const area = document.getElementById('speakerTestLogArea');
    const time = new Date().toLocaleTimeString();

    const msg = args.map(arg => {
        if (typeof arg === 'string') {
            return arg;
        }
        if (arg instanceof Error) {
            return arg.message;
        }
        try {
            return JSON.stringify(arg);
        } catch (e) {
            return String(arg);
        }
    }).join(' ');

    const text = `[${time}] ${msg}`;

    if (area) {
        area.textContent += text + '\n';
        area.scrollTop = area.scrollHeight;
    } else {
        console.log(text);
    }
}


// extraParam 입력값을 정규화하여 16진수 문자열로 변환
// 예) "50" -> "32", "32,1,255" -> "2001ff"
function normalizeBtypeExtraParam(raw) {
    if (!raw) return '';

    // 콤마/공백 기준으로 토큰 분리
    const tokens = raw
        .split(/[,\s]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

    if (tokens.length === 0) return '';

    const hexParts = [];

    for (const token of tokens) {
        let value = null;

        // 0x.. 형식이면 16진수로 파싱
        if (/^0x[0-9a-f]+$/i.test(token)) {
            value = parseInt(token, 16);
        }
        // 순수 16진수(길이 1~2)로 보이면 그대로 허용 (예: "32", "0a", "f")
        else if (/^[0-9a-f]+$/i.test(token) && token.length <= 2) {
            // 이미 16진수라고 보고 패딩만
            value = parseInt(token, 16);
        }
        // 숫자만 있으면 10진수로 보고 16진수 변환 (예: "50")
        else if (/^\d+$/.test(token)) {
            value = parseInt(token, 10);
        }

        if (value === null || Number.isNaN(value)) {
            throw new Error(`잘못된 extraParam 값입니다: "${token}" (10진수 또는 16진수 형식이어야 합니다)`);
        }
        if (value < 0 || value > 255) {
            throw new Error(`extraParam 값 범위 초과: "${token}" (0~255만 허용)`);
        }

        // 1바이트 16진수(두 자리)로 맞추기
        const hex = value.toString(16).padStart(2, '0');
        hexParts.push(hex);
    }

    // 서버 쪽 switch(case)에서 그냥 이어붙여 쓰니까 구분자 없이 붙여서 전달
    return hexParts.join('');
}

// IP 주소를 16진수 문자열로 변환
function ipToHex(raw) {
    if (!raw) {
        throw new Error('IP 주소가 비어있습니다.');
    }

    const ip = raw.trim();

    // "192.168.1.10" 형식인지 체크
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        throw new Error(`IP 형식이 올바르지 않습니다: "${raw}" (예: 192.168.1.10)`);
    }

    const parts = ip.split('.');
    const hexParts = parts.map(p => {
        const num = parseInt(p, 10);
        if (Number.isNaN(num) || num < 0 || num > 255) {
            throw new Error(`IP 각 옥텟은 0~255 사이여야 합니다: "${p}"`);
        }
        return num.toString(16).padStart(2, '0');
    });

    return hexParts.join('');
}

// 스피커 목록에서 선택된 ID 가져오기
function getSelectedSpeakerIdsForBtype() {
    const checked = document.querySelectorAll('#speaker-table-body input[type="checkbox"]:checked');
    const ids = [];

    checked.forEach(chk => {
        const row = chk.closest('tr');
        if (!row) return;
        const cells = row.cells;
        if (!cells || cells.length < 2) return;

        // 기존 코드처럼 "뒤에서 두 번째 셀"을 ID 셀로 사용
        const idCell = cells[cells.length - 2];
        if (!idCell) return;

        const idText = idCell.textContent.trim();
        if (idText.length > 0) {
            ids.push(idText);
        }
    });

    return ids;
}

function getSpeakerIdsFromInput() {
    const input = document.getElementById('testSpeakerIds');
    if (!input) return [];

    // 입력된 값
    const raw = input.value.trim();
    if (!raw) return [];

    // 콤마 기준 분리 + 공백 제거
    return raw
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1) speakerControll.sendAlert 래핑 (발령 데이터 로그)
    if (window.speakerControll && typeof speakerControll.sendAlert === 'function') {
        const originalSendAlert = speakerControll.sendAlert.bind(speakerControll);

        speakerControll.sendAlert = async function (deviceId, commandCode, alertParams, disasterDataMap) {
            appendBtypeLog('sendAlert 호출', {
                deviceId,
                commandCode,
                alertParams,
            });

            try {
                const result = await originalSendAlert(deviceId, commandCode, alertParams, disasterDataMap);
                appendBtypeLog('sendAlert 성공', { deviceId, commandCode });
                return result;
            } catch (e) {
                appendBtypeLog('sendAlert 에러', { deviceId, error: e?.message || String(e) });
                throw e;
            }
        };
    } else {
        console.warn('speakerControll.sendAlert 를 찾지 못했습니다.');
    }

    // 2) speakerControll.handleSpeakerAction 래핑 (B타입 제어 데이터 로그)
    if (window.speakerControll && typeof speakerControll.handleSpeakerAction === 'function') {
        const originalHandleSpeakerAction = speakerControll.handleSpeakerAction.bind(speakerControll);

        speakerControll.handleSpeakerAction = async function (action, speakerIds, ...extraParam) {
            appendBtypeLog('handleSpeakerAction 호출', {
                action,
                speakerIds,
                extraParam
            });

            try {
                const result = await originalHandleSpeakerAction(action, speakerIds, ...extraParam);
                appendBtypeLog('handleSpeakerAction 성공', {
                    action,
                    speakerIds
                });
                return result;
            } catch (e) {
                appendBtypeLog('handleSpeakerAction 에러', {
                    action,
                    error: e?.message || String(e)
                });
                throw e;
            }
        };
    } else {
        console.warn('speakerControll.handleSpeakerAction 를 찾지 못했습니다.');
    }

    // 3) 모달 안 B타입 실행 버튼 → 실제 handleSpeakerAction 호출 + 로그
    const btypeBtn = document.getElementById('btypeActionSendBtn');
    if (btypeBtn) {
        btypeBtn.addEventListener('click', async () => {
            const actionSelect = document.getElementById('btypeActionSelect');
            const extraInput = document.getElementById('btypeExtraParamInput');
    
            const action = actionSelect ? actionSelect.value.trim() : '';
            const extraParam = extraInput ? extraInput.value.trim() : '';
    
            const speakerIds = getSpeakerIdsFromInput(); // 10.10.10.10
    
            if (!speakerIds || speakerIds.length === 0) {
                alert('스피커 ID를 입력하세요. (예: SPK001,SPK002)');
                appendBtypeLog('⚠ B타입 액션 실행 실패 - 스피커 ID 미입력');
                return;
            }

            let extraParamHex = "";

            try {
                if (action === "ins_ServerIP") {
                    // ★ IP 전용 처리
                    extraParamHex = ipToHex(extraParam);
                } else {
                    // ★ 나머지 액션은 일반 extraParam 처리
                    extraParamHex = normalizeBtypeExtraParam(extraParam);
                }
            } catch (e) {
                alert(e.message);
                appendBtypeLog(`⚠ extraParam 변환 실패: ${e.message}`);
                return;
            }
    
            // 서버로 보낼 payload (BTypeActionRequest와 맞게)
            const payload = {
                action: action,
                speakerIds: speakerIds,
                extraParam: extraParamHex
            };
    
            // 프론트 로그에 전송 데이터 찍기
            appendBtypeLog('/api/btype/control 전송:', payload);
    
            try {
                const res = await fetch('/api/btype/control', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
    
                if (!res.ok) {
                    const text = await res.text();
                    appendBtypeLog(`서버 오류: ${res.status} ${text}`);
                    alert('서버 처리 중 오류가 발생했습니다.');
                    return;
                }
    
                appendBtypeLog('서버 처리 완료 (B-Type control command sent)');
            } catch (e) {
                console.error(e);
                appendBtypeLog('통신 오류: ' + e.message);
            }
        });
    }

    // 3) 모달 안 B타입 실행 버튼 → 실제 handleSpeakerAction 호출 + 로그
    // const btypeBtn = document.getElementById('btypeActionSendBtn');
    // if (btypeBtn) {
    //     btypeBtn.addEventListener('click', async () => {
    //         const actionSelect = document.getElementById('btypeActionSelect');
    //         const extraInput = document.getElementById('btypeExtraParamInput');

    //         const action = actionSelect ? actionSelect.value.trim() : '';
    //         const extraParam = extraInput ? extraInput.value.trim() : '';

    //         const speakerIds = getSelectedSpeakerIdsForBtype();

    //         if (!speakerIds || speakerIds.length === 0) {
    //             alert('스피커 목록에서 하나 이상 선택하세요.');
    //             appendBtypeLog('⚠ B타입 액션 실행 실패 - 선택된 스피커 없음');
    //             return;
    //         }

    //         appendBtypeLog('UI: B타입 액션 실행 버튼 클릭', {
    //             action,
    //             extraParam,
    //             speakerIds
    //         });

    //         try {
    //             if (window.speakerControll && typeof speakerControll.handleSpeakerAction === 'function') {
    //                 await speakerControll.handleSpeakerAction(action, speakerIds, extraParam);
    //             } else {
    //                 appendBtypeLog('⚠ speakerControll.handleSpeakerAction 없음 - 실제 전송은 수행되지 않음');
    //             }
    //         } catch (e) {
    //             // 래핑된 함수에서 이미 에러 로그 찍으니까 여기선 조용히 둠
    //             console.error(e);
    //         }
    //     });
    // }

    // 4) 수동발령/ BGM 버튼 클릭 로그 (실제 동작은 기존 alert01.js / speakerControll 가 처리)
    const alertBtn = document.getElementById('alert_btn');
    if (alertBtn) {
        alertBtn.addEventListener('click', async () => {
            const alertModeEl = document.getElementById('alertMode'); // 10진수값 
            const disasterCodeEl = document.getElementById('DisasterCode'); // 10진수값
            const alertKindEl = document.getElementById('alertKind'); // 10진수값
            const alertRangeEl = document.getElementById('alertRange'); // 10진수값
            const alertPriorityEl = document.getElementById('alertPriority'); // 10진수값
            const ttsMessageEl = document.getElementById('TTSMessage'); // 메시지 그대로 전송
    
            const alertModeVal = alertModeEl ? alertModeEl.value : null;
            const disasterCodeVal = disasterCodeEl ? disasterCodeEl.value : null;
            const alertKindVal = alertKindEl ? alertKindEl.value : null;
            const alertRangeVal = alertRangeEl ? alertRangeEl.value : null;
            const alertPriorityVal = alertPriorityEl ? alertPriorityEl.value : null;
            const ttsMessageVal = ttsMessageEl ? ttsMessageEl.value.trim() : null;
    
            // 기본 로그
            appendBtypeLog('UI: 수동발령 버튼 클릭', {
                alertMode: alertModeVal,
                disasterCode: disasterCodeVal,
                alertKind: alertKindVal,
                alertRange: alertRangeVal,
                alertPriority: alertPriorityVal,
                ttsMessage: ttsMessageVal
            });
    
            // 필수값 예외 처리 (백엔드에서 IllegalArgumentException 나기 전에 프론트에서 막기)
            if (
                alertModeVal === null ||
                disasterCodeVal === null ||
                alertKindVal === null ||
                alertRangeVal === null ||
                alertPriorityVal === null
            ) {
                alert('필수 발령 항목이 누락되었습니다.');
                appendBtypeLog('⚠ 수동발령 실패 - 필수 선택값 누락');
                return;
            }
    
            // alertKind가 1(TTS)인데 TTS 메시지 비었으면 막기
            if (alertKindVal === '1' && !ttsMessageVal) {
                alert('TTS 방송인 경우 TTS 메시지를 입력해야 합니다.');
                appendBtypeLog('⚠ 수동발령 실패 - TTS 메시지 미입력');
                return;
            }
    
            // 대상 스피커 ID들 (여기선 testSpeakerIds 입력 사용)
            const speakerIds = getSpeakerIdsFromInput();
            if (!speakerIds || speakerIds.length === 0) {
                alert('발령 대상 스피커 ID를 입력하세요. (예: SPK001,SPK002)');
                appendBtypeLog('⚠ 수동발령 실패 - 스피커 ID 미입력');
                return;
            }
    
            // 백엔드 BTypeAlertRequest 와 매핑되는 공통 payload (deviceId만 매번 바꿔줌)
            const basePayload = {
                alertMode: parseInt(alertModeVal, 10),
                disasterCode: disasterCodeVal,         // DB에서 dstCd로 쓰는 값. 기존 코드도 그대로 사용.
                alertKind: parseInt(alertKindVal, 10),
                alertRange: parseInt(alertRangeVal, 10),
                alertPriority: parseInt(alertPriorityVal, 10),
                ttsMessage: ttsMessageVal || '',       // null 방지
                commandCode: '41'                      // 기존 JS에서도 고정으로 쓰던 코드
                // deviceId 는 아래 loop에서 채움
            };
    
            appendBtypeLog('수동발령 basePayload 준비', basePayload);
    
            // 선택된 스피커마다 한 번씩 발령 호출
            for (const deviceId of speakerIds) {
                const payload = {
                    ...basePayload,
                    deviceId: deviceId
                };
    
                appendBtypeLog('/api/btype/alert 전송', payload);
    
                try {
                    const res = await fetch('/api/btype/alert', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
    
                    const text = await res.text(); // 성공/실패 상관없이 본문은 일단 로그용으로 읽기
    
                    if (!res.ok) {
                        appendBtypeLog(`수동발령 실패 - deviceId=${deviceId}, status=${res.status}, body=${text}`);
    
                        // 가능하면 서버에서 내려준 메시지 파싱
                        try {
                            const json = JSON.parse(text);
                            if (json.error) {
                                alert(`스피커(${deviceId}) 발령 실패: ${json.error}`);
                            } else {
                                alert(`스피커(${deviceId}) 발령 실패 (status=${res.status})`);
                            }
                        } catch {
                            alert(`스피커(${deviceId}) 발령 실패 (status=${res.status})`);
                        }
                    } else {
                        appendBtypeLog(`수동발령 성공 - deviceId=${deviceId}, response=${text}`);
                    }
                } catch (e) {
                    console.error(e);
                    appendBtypeLog(`수동발령 통신 오류 - deviceId=${deviceId}, message=${e.message}`);
                    alert(`스피커(${deviceId}) 발령 중 통신 오류가 발생했습니다.`);
                }
            }
        });
    }

    // ---------------------------
    // BGM ON / OFF 버튼
    // ---------------------------
    const bgmOnBtn = document.getElementById('bgm_on_btn');
    if (bgmOnBtn) {
        bgmOnBtn.addEventListener('click', async () => {
    
            const speakerIds = getSpeakerIdsFromInput();
            if (speakerIds.length === 0) {
                alert('스피커 ID를 입력하세요. (예: SPK001,SPK002)');
                appendBtypeLog('BGM ON 실패: 스피커 ID 미입력');
                return;
            }
    
            appendBtypeLog(`BGM ON 요청: speakers=[${speakerIds.join(',')}]`);
    
            const payload = {
                action: "insBGMStatus",
                speakerIds: speakerIds,
                extraParam: "01"   // ON
            };
    
            try {
                const res = await fetch('/api/btype/control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
    
                appendBtypeLog(`BGM ON 응답: HTTP ${res.status} (${res.ok ? '성공' : '실패'})`);
            } catch (e) {
                console.error(e);
                appendBtypeLog(`BGM ON 오류: ${e.message || e}`);
            }
        });
    }
    
    const bgmOffBtn = document.getElementById('bgm_off_btn');
    if (bgmOffBtn) {
        bgmOffBtn.addEventListener('click', async () => {
            const speakerIds = getSpeakerIdsFromInput();

            if (speakerIds.length === 0) {
                alert('스피커 ID를 입력하세요. (예: SPK001,SPK002)');
                appendBtypeLog('BGM OFF 실패: 스피커 ID 미입력');
                return;
            }

            appendBtypeLog(`BGM OFF 요청: speakers=[${speakerIds.join(',')}]`);

            for (const id of speakerIds) {
                const payload = {
                    id: id,
                    commandCode: '47',
                    argument: '0700',   // OFF
                    speakerKey: '1'
                };

                try {
                    const res = await fetch('/api/btype/control', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    appendBtypeLog(
                        `BGM OFF 응답: id=${id}, HTTP ${res.status} (${res.ok ? '성공' : '실패'})`
                    );
                } catch (e) {
                    console.error(e);
                    appendBtypeLog(`BGM OFF 오류: id=${id}, ${e.message || e}`);
                }
            }
        });
    }

    const clearLogBtn = document.getElementById('clearLogBtn');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            const area = document.getElementById('speakerTestLogArea');
            if (area) {
                area.textContent = '';  // 로그 전부 비우기
            }
        });
    }

});
