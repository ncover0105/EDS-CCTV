package com.edscorp.eds.speaker.secondary.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkConfigUpsertRequest {
    private String speakerId;

    private String speakerName;
    private Integer orderGroupAutokey;
    private String type;
    private String cdmaNumber;
    private String description;

    private String locationCode;
    private String locationName;

    private String speakerAdr;
    private BigDecimal speakerLatitude;
    private BigDecimal speakerLongitude;
}
