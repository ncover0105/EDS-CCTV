package com.edscorp.eds.speaker.typeb.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpkDisasterUpsertReq {
    private String dstCode;
    private String dstName;
    private String dstStoreMsg;
    private String dstUseFlag; // "Use" / "Unuse"
}
