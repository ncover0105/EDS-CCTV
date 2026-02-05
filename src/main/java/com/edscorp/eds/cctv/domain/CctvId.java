package com.edscorp.eds.cctv.domain;

import java.io.Serializable;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode
@NoArgsConstructor
public class CctvId implements Serializable {

    private String locationCode;
    private String cctvCode;
}