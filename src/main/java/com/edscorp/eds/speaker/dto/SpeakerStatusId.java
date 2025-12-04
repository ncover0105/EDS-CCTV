package com.edscorp.eds.speaker.dto;

import java.io.Serializable;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class SpeakerStatusId implements Serializable {

    private String locationCode;
    private String speakerCode;

}