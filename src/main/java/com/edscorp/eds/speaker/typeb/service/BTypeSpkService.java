package com.edscorp.eds.speaker.typeb.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.typeb.domain.SpkAlertDispatch;
import com.edscorp.eds.speaker.typeb.domain.SpkAlertHistory;
import com.edscorp.eds.speaker.typeb.domain.SpkStatus;
import com.edscorp.eds.speaker.typeb.dto.SpkStatusResponse;
import com.edscorp.eds.speaker.typeb.dto.SpkAlertDispatchRequest;
import com.edscorp.eds.speaker.typeb.repository.SpkAlertDispatchRepository;
import com.edscorp.eds.speaker.typeb.repository.SpkAlertHistoryRepository;
import com.edscorp.eds.speaker.typeb.repository.SpkStatusRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BTypeSpkService {

    private final SpkStatusRepository btypeSpkStatusRepository;
    private final SpkAlertDispatchRepository btypeSpkAlertDispatchRepository;
    private final SpkAlertHistoryRepository btypeSpkAlertHistoryRepository;

    // 스피커 상태 조회
    public SpkStatusResponse getBtypeSpkStauts(Integer speakerKey) {
        SpkStatus status = btypeSpkStatusRepository.findById(speakerKey)
                .orElse(null);

        if (status == null) {
            return null;
        }

        String connectionStatus = mapNormalAbnormal(status.getConnectStatus());
        String acStatus = mapNormalAbnormal(status.getAcInput());
        String dcStatus = mapNormalAbnormal(status.getDcInput());
        String batteryStatus = mapNormalAbnormal(status.getBattery());
        String solarStatus = mapNormalAbnormal(status.getSolarInput());
        String lteStatus = mapAntennaStatus(status.getLteStatus());
        String cpuTemp = status.getCpuTemp() != null
                ? status.getCpuTemp() + "℃"
                : "-";
        String mcuVersion = status.getMcuVersion() != null
                ? status.getMcuVersion()
                : "-";

        return new SpkStatusResponse(
                connectionStatus,
                acStatus,
                dcStatus,
                batteryStatus,
                solarStatus,
                lteStatus,
                cpuTemp,
                mcuVersion,
                status.getReceiveTime());
    }

    private String mapNormalAbnormal(Integer value) {
        if (value == null)
            return "-";
        return value == 0 ? "정상" : "이상";
    }

    private String mapAntennaStatus(Integer value) {
        if (value == null)
            return "-";
        if (value == 6)
            return "통화권 이탈";
        if (value >= 0 && value <= 5)
            return "안테나 " + value;
        return "알수없음(" + value + ")";
    }

    // alertKey 기준 이력 조회
    public List<SpkAlertDispatch> getDispatchHistoryByAlertKey(Integer alertKey) {
        return btypeSpkAlertDispatchRepository.findByAlertKeyOrderByDispatchTimeDesc(alertKey);
    }

    public List<SpkAlertDispatch> getDispatchHistoryByDeviceUid(String deviceUid) {
        return btypeSpkAlertDispatchRepository.findByDeviceUidOrderByDispatchTimeDesc(deviceUid);
    }

    public SpkAlertDispatch createDispatch(SpkAlertDispatchRequest req) {
        SpkAlertDispatch entity = SpkAlertDispatch.builder()
                .alertKey(req.getAlertKey())
                .deviceUid(req.getDeviceUid())
                .dispatchType(req.getDispatchType() != null ? req.getDispatchType() : "manual")
                .disasterCode(req.getDisasterCode())
                .ttsMessage(req.getTtsMessage())
                .alertKind(req.getAlertKind())
                .speakerIds(req.getSpeakerIds())
                .dispatchStatus("pending") // 기본 상태
                .dispatchId(req.getDispatchId())
                .dispatchTime(LocalDateTime.now()) // 발령 시간
                .colWay(req.getColWay())
                .memo(req.getMemo())
                .insertTime(LocalDateTime.now())
                .build();

        return btypeSpkAlertDispatchRepository.save(entity);
    }

    public List<SpkAlertHistory> getHistoryBySpeakerKey(Integer speakerKey) {
        return btypeSpkAlertHistoryRepository.findByIdSpeakerKeyOrderByAlertTimeDesc(speakerKey);
    }

    public List<SpkAlertHistory> getHistoryByAlertHistKey(Integer alertHistKey) {
        return btypeSpkAlertHistoryRepository.findByIdAlertHistKey(alertHistKey);
    }
}
