var speakerControll = {
/**
 * 발령 데이터를 생성하고 서버로 전송하는 함수 (화면단)
 * @param {string} deviceId - 대상 디바이스 ID (IP 형태)
 * @param {string} commandCode - 명령어 코드 (예: '41')
 * @param {object} alertParams - 발령에 필요한 인자들 (JSON 형식)
 *  - alertMode: 발령 모드 (10진수)
 *  - disasterCode: 재난 코드 (10진수)
 *  - alertKind: 발령 종류 (10진수)
 *  - alertRange: 발령 범위 (10진수)
 *  - alertPriority: 발령 우선순위 (10진수)
 *  - ttsMessage: TTS 메시지 (문자열)
 */
sendAlert : async function(deviceId, commandCode, alertParams,disasterDataMap) {
    try {
        // 필수 필드 확인
        const requiredFields = ['alertMode', 'disasterCode', 'alertKind', 'alertRange', 'alertPriority', 'ttsMessage'];
        const missingFields = requiredFields.filter(field => !(field in alertParams));

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        // alertKind에 따른 동작 처리
        let alertPriority = parseInt(alertParams.alertPriority, 10); // 기본 alertPriority
        let alertStoCd='000';//기본
        let alertSirenCd='000';// 기본
        let alertTTSmessage =alertParams.ttsMessage;
        let alertKind=parseInt(alertParams.alertKind, 10)//기본값

        if (alertParams.alertKind === 1) {
            // alertKind가 1이면 아무 작업도 하지 않음
        } else if (alertParams.alertKind === 2 || alertParams.alertKind === 3) {
            // disasterDataMap에서 dst_priority 가져오기
            console.log("disasterDataMap")
            console.log(disasterDataMap)
            const disasterData = disasterDataMap[alertParams.disasterCode];
            if (!disasterData) {
                throw new Error(`Invalid disasterCode: ${alertParams.disasterCode}`);
            }

            // dst_priority 설정
            if (typeof disasterData.dst_priority !== 'undefined') {
                alertPriority = disasterData.dst_priority;
            } else {
                throw new Error(`dst_priority not found for disasterCode: ${alertParams.disasterCode}`);
            }

            // ttsMessage 설정
            if (disasterData.dst_siren_code && disasterData.dst_sto_cd) {
                const { dst_siren_code, dst_sto_cd, dst_sto_msg } = disasterData;
                if (dst_sto_cd === '000') {
                    alertTTSmessage = dst_sto_msg || ''; // dst_sto_msg 값 사용 (없으면 빈 문자열)
                    alertKind=1;

                } else {
                    alertTTSmessage = `${dst_siren_code}${dst_sto_cd}${dst_siren_code}`;
                }
            } else {
                throw new Error(`Incomplete disasterData fields for disasterCode: ${alertParams.disasterCode}`);
            }
            console.log("alertTTSmessage")
            console.log(alertTTSmessage)
            alertStoCd = disasterData.dst_sto_cd; // dst_priority 값을 설정
            alertSirenCd =disasterData.dst_siren_code;
        } else {
            // 예상치 못한 alertKind 값 처리
            throw new Error(`Unsupported alertKind: ${alertParams.alertKind}`);
        }

        // argument JSON 생성
        const argumentJson = {
            alertMode: parseInt(alertParams.alertMode, 10),
            resultMedia: 1, // 고정값
            disasterCode: alertParams.disasterCode,
            alertKind: alertKind,
            alertRange: parseInt(alertParams.alertRange, 10),
            alertPriority: alertPriority, // 업데이트된 alertPriority 사용
            ttsMessage: alertTTSmessage,
            alertStoCd:alertStoCd,
            alertSirenCd:alertSirenCd,
        };

        // 서버로 전송할 데이터 생성
        const jsonData = {
            id: deviceId,
            commandCode: commandCode,
            argument: JSON.stringify(argumentJson), // argument를 JSON 문자열로 변환
            speakerKey: '1' // 필요 시 매개변수로 확장 가능
        };
        let data = await util.postJsonData('/equipment02/api/sendSpeak', jsonData);
        console.log('Generated JSON Data:', jsonData);

    } catch (error) {
        console.error('Error in sendAlert:', error.message);
        throw error;
    }
},

/**
 * 재난 코드를 서버에서 조회하여 DisasterCode 드롭다운을 동적으로 구성하는 함수
 * @param {HTMLElement} selectEl - 재난 코드 <select> 요소
 * @description
 * - 서버의 `/equipment02/api/disasterList` API를 호출하여 재난 코드 데이터를 가져옵니다.
 * - API 응답 데이터(`dst_sto_cd`, `dst_name`)를 기반으로 <select> 요소에 옵션을 추가합니다.
 * - 기본적으로 첫 번째 항목을 선택 상태로 설정합니다.
 * @example
 * const selectElement = document.getElementById('DisasterCode');
 * populateDisasterCode(selectElement);
 * @throws {Error} API 호출 실패 시 오류 메시지를 콘솔에 출력
 */


populateDisasterCode :async function (selectEl) {
    try {
        let disasterDataMap={};
        const jsonData = {}; // 빈 데이터로 요청
        const data = await util.postJsonData('/equipment02/api/readDisasterList', jsonData);
        const arr = data.data; // API로부터 받은 데이터 배열
        selectEl.innerHTML = ''; // 기존 옵션 초기화

        if (arr.length === 0) {
            console.warn('No data received from the server');
            return;
        }

        console.log(data)
        // 데이터 객체 생성 및 옵션 추가
        arr.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = item.dst_cd; // value로 'dst_sto_cd' 저장
            option.textContent = item.dst_name; // 화면에 표시할 이름
            // disasterDataMap에 데이터 저장
            disasterDataMap[item.dst_cd] = {
                dst_sto_cd: item.dst_sto_cd,
                dst_sto_msg: item.dst_sto_msg,
                dst_priority: item.dst_priority,
                dst_siren_code:item.dst_siren_code
            };

            selectEl.appendChild(option);

            // 첫 번째 항목을 기본 선택값으로 설정
            if (index === 0) {
                selectEl.value = item.dst_cd; // 첫 번째 옵션의 dst_sto_cd로 기본값 설정
            }
        });

        console.log('DisasterCode options populated successfully');

        // 첫 번째 데이터 선택 시 기본 데이터 출력
        const firstValue = arr[0].dst_cd;
        const firstData = disasterDataMap[firstValue];
        return disasterDataMap;
    } catch (error) {
        console.error('Error populating DisasterCode options:', error);
        return {};

    }
},
/**
 * 선택된 스피커들에 대해 명령을 실행하고 서버로 전송하는 함수
 * @param {string} action - 실행할 액션 (예: 'time', 'status', 'reset')
 * @param {Array} speakerIds - 선택된 스피커들의 ID 리스트
 */
handleSpeakerAction: async function (action, speakerIds,...extraParam) {
    try {
        // 선택된 스피커 ID 리스트가 비어 있으면 경고 메시지
        if (speakerIds.length === 0) {
            alert('선택된 ㄴㄴ스피커가 없습니다.');
            return;
        }

        // 각 버튼의 action에 맞는 commandCode와 argument 설정
        let commandCode = '';
        let argument = '';

        switch (action) {
            case 'time': // 시간 설정
                commandCode = '4f'; // 예시 commandCode (시간 설정용)
                argument = '00000000'
                break;
            case 'status': // 상태 요청
                commandCode = '43'; // 예시 commandCode (상태 요청용)
                argument = ''
                break;

            case 'reset': // 스피커 리셋
                commandCode = '4d'; // 예시 commandCode (스피커 리셋용)
                argument = '01'
                break;
            case 'getSpeakerSettings': // 스피커 설정값 요청 전체
                console.log("d???????????????")
                commandCode = '45';
                argument = '00';
                break;

            case 'getVolume': // 스피커 볼륨값 요청
                commandCode = '45';
                argument = '01';
                break;

            case 'getSpeakerUsage': // 스피커 사용 설정 요청
                commandCode = '45';
                argument = '02';
                break;

            case 'getSpeakerIP': // 스피커 IP 설정 요청
                commandCode = '45';
                argument = '04';
                break;

            case 'getSpeakerID': // 스피커 ID 설정 요청
                commandCode = '45';
                argument = '05';
                break;

            case 'getBGMFolder': // BGM 폴더 설정 요청
                commandCode = '45';
                argument = '06';
                break;

            case 'getBGMStatus': // BGM 상태 요청
                commandCode = '45';
                argument = '07';
                break;

            case 'getInputVolume': // 입력 볼륨 요청
                commandCode = '45';
                argument = '08';
                break;

            case 'getTTSSpeed': // TTS 속도 및 스피치 요청
                commandCode = '45';
                argument = '09';
                break;

            case 'getPollingTime': // 폴링 시간 요청
                commandCode = '45';
                argument = '0a';
                break;

            case 'getAudioMode': // 음원 모드 설정 요청
                commandCode = '45';
                argument = '0b';
                break;

            case 'getFMSettings': // FM 설정 요청
                commandCode = '45';
                argument = '0c';
                break;
            case 'insSpeakerSettings': // 스피커 설정값 요청 전체
                commandCode = '46';
                argument = '00';
                break;

            case 'insBgmVolume': // 스피커 볼륨값 요청
                commandCode = '46';
                argument = '0100'+extraParam;
                break;
            case 'insAlertVolume': // 스피커 볼륨값 요청
                commandCode = '46';
                argument = '0101'+extraParam;

                break;

            case 'ins_channels': // 스피커 사용 설정 요청
                commandCode = '46';
                argument = '02'+extraParam;
                break;

            case 'ins_ServerIP': // 스피커 IP 설정 요청
                commandCode = '46';
                argument = '04'+extraParam;
                break;

            case 'ins_speakerid': // 스피커 ID 설정 요청
                commandCode = '46';
                argument = '05'+extraParam;
                break;

            case 'ins_BGMFolderNo': // BGM 폴더 설정 요청
                commandCode = '46';
                argument = '06'+extraParam;
                console.log("argument")
                console.log(argument)
                break;

            case 'insBGMStatus': // BGM 상태 입력
                commandCode = '46';
                argument = '07'+extraParam;
                break;

            case 'ins_BGM_IN_VOL': // 입력 볼륨 요청
                commandCode = '46';
                argument = '0800'+extraParam;
                break;
            case 'ins_STO_IN_VOL': // 입력 볼륨 요청
                commandCode = '46';
                argument = '0801'+extraParam;
                break;
            case 'ins_TTS_IN_VOL': // 입력 볼륨 요청
                commandCode = '46';
                argument = '0802'+extraParam;
                break;
            case 'ins_TTS_Pitch': // TTS 속도 및 스피치 요청
                commandCode = '46';
                argument = '0900'+extraParam;
                break;
            case 'ins_TTS_Speed': // TTS 속도 및 스피치 요청
                commandCode = '46';
                argument = '0901'+extraParam;
                break;

            case 'ins_PollingCheckTime': // 폴링 시간 요청
                commandCode = '46';
                argument = '0a'+extraParam;
                break;

            case 'insAudioMode': // 음원 모드 설정 요청
                commandCode = '46';
                argument = '0b'+extraParam;
                break;

            case 'insFMSettings': // FM 설정 요청
                commandCode = '46';
                argument = '0c'+extraParam;
                break;


            default:
                throw new Error('지원되지 않는 작업입니다.'); // 잘못된 action 처리
        }

        // 선택된 각 스피커에 대해 서버로 명령 전송
        for (const speakerId of speakerIds) {
            // 서버로 전송할 데이터 구성
            const jsonData = {
                id: speakerId, // 선택된 스피커의 ID
                commandCode: commandCode, // 설정된 commandCode
                argument: argument, // 설정된 argument
                speakerKey: '1' // 고정된 speakerKey (필요 시 동적으로 설정 가능)
            };

            // 서버에 데이터 전송 (util.postJsonData는 서버와의 데이터 전송 함수)
            const data = await util.postJsonData('/equipment02/api/sendSpeak', jsonData);
            console.log('전송된 데이터:', data); // 서버로 전송된 데이터 확인
        }

        alert('명령이 성공적으로 전송되었습니다.'); // 성공 메시지

    } catch (error) {
        console.error('오류 발생:', error.message); // 에러 메시지 출력
        alert('오류가 발생했습니다: ' + error.message); // 에러 발생 시 사용자에게 알림
    }
}
}
