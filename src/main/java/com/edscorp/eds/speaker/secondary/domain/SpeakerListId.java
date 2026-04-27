package com.edscorp.eds.speaker.secondary.domain;

import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
public class SpeakerListId implements Serializable {
    private String locationCode;
    private String speakerCode;
}
