package com.edscorp.eds.speaker.typeb.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SpeakerRowDto(
        Integer speakerKey,
        String speakerId,
        String speakerName,
        Integer connectStatus,
        LocalDateTime receiveTime,
        String cdmaNumber,
        String locationName,
        BigDecimal speakerLatitude,
        BigDecimal speakerLongitude,
        String saveDivi) {

}
