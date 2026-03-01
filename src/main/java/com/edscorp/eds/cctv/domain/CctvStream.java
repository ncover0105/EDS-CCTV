package com.edscorp.eds.cctv.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class CctvStream {

    @Column
    private String rtspUrl;

    @Column
    private Integer mountpointId;

    @Column
    private Integer videoPort;

    public boolean isValid() {
        return rtspUrl != null && !rtspUrl.isBlank()
                && mountpointId != null
                && videoPort != null;
    }
}
