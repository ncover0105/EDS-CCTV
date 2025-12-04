// btype_action_modal.js

// 로그 출력 함수
function appendBtypeLog(line) {
    const area = document.getElementById('speakerTestLogArea');
    const time = new Date().toLocaleTimeString();
    const text = `[${time}] ${line}`;

    if (area) {
        area.textContent += text + '\n';   // 항상 1줄 + \n
        area.scrollTop = area.scrollHeight;
    } else {
        console.log(text);
    }
}

// 스피커 목록에서 선택된 ID 가져오기 (alert01.js와 동일한 방식)
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

    const value = input.value.trim();
    if (!value) return [];

    return value
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

            const speakerIds = getSelectedSpeakerIdsForBtype();

            if (!speakerIds || speakerIds.length === 0) {
                alert('스피커 목록에서 하나 이상 선택하세요.');
                appendBtypeLog('⚠ B타입 액션 실행 실패 - 선택된 스피커 없음');
                return;
            }

            appendBtypeLog('UI: B타입 액션 실행 버튼 클릭', {
                action,
                extraParam,
                speakerIds
            });

            try {
                if (window.speakerControll && typeof speakerControll.handleSpeakerAction === 'function') {
                    await speakerControll.handleSpeakerAction(action, speakerIds, extraParam);
                } else {
                    appendBtypeLog('⚠ speakerControll.handleSpeakerAction 없음 - 실제 전송은 수행되지 않음');
                }
            } catch (e) {
                // 래핑된 함수에서 이미 에러 로그 찍으니까 여기선 조용히 둠
                console.error(e);
            }
        });
    }

    // 4) 수동발령/ BGM 버튼 클릭 로그 (실제 동작은 기존 alert01.js / speakerControll 가 처리)
    const alertBtn = document.getElementById('alert_btn');
    if (alertBtn) {
        alertBtn.addEventListener('click', () => {
            const alertMode = document.getElementById('alertMode')?.value;
            const disasterCode = document.getElementById('DisasterCode')?.value;
            const alertKind = document.getElementById('alertKind')?.value;
            const alertRange = document.getElementById('alertRange')?.value;
            const alertPriority = document.getElementById('alertPriority')?.value;
            const ttsMessage = document.getElementById('TTSMessage')?.value;

            appendBtypeLog('UI: 수동발령 버튼 클릭', {
                alertMode,
                disasterCode,
                alertKind,
                alertRange,
                alertPriority,
                ttsMessage
            });
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
