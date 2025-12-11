package com.edscorp.eds.speaker.typeb.domain;

import java.io.Serializable;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SpkTestResultId implements Serializable {
    private Integer speakerInfoAutokey;
    private LocalDateTime testTime;
}
