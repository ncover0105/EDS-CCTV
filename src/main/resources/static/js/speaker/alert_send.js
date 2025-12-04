export async function sendAlert(deviceId, commandCode, alertParams) {

    const req = {
        deviceId,
        commandCode,
        manufacturerType: alertParams.manufacturerType,
        alertMode: alertParams.alertMode,
        disasterCode: alertParams.disasterCode,
        alertKind: alertParams.alertKind,
        alertRange: alertParams.alertRange,
        alertPriority: alertParams.alertPriority,
        ttsMessage: alertParams.ttsMessage
    };

    // 1. 서버에서 규칙 계산
    const built = await util.postJsonData('/api/alert/build', req);

    // 2. 최종 방송 전송
    return await util.postJsonData('/api/sendSpeak', {
        id: deviceId,
        commandCode: built.commandCode,
        argument: built.argumentJson,
        speakerKey: '1'
    });
}
