package com.edscorp.eds.weather.dto;

import java.io.Serializable;

import jakarta.persistence.Column;
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
public class TbWeatherWarningListKey implements Serializable {
    @Column(name = "STN", length = 3, nullable = false)
    private String stn;

    @Column(name = "REG_ID", length = 8, nullable = false)
    private String regId;

    @Column(name = "TM_IN", length = 12, nullable = false)
    private String tmIn;

    @Column(name = "WRN", length = 10, nullable = false)
    private String wrn;
}
