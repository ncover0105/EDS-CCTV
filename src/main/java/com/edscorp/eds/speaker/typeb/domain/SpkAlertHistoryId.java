package com.edscorp.eds.speaker.typeb.domain;

import java.io.Serializable;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class SpkAlertHistoryId implements Serializable {
    private Integer alertHistKey; // AUTO_INCREMENT
    private Integer speakerKey; // 스피커 키
}
