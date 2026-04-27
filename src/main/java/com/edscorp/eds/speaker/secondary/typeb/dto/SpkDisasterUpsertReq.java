package com.edscorp.eds.speaker.secondary.typeb.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpkDisasterUpsertReq {
    private String dstCode;
    private String dstName;
    private Integer dstPriority;
    private String dstSirenCode;
    private String dstStoCode;
    private String dstStoreMsg;
    private String dstUseFlag; // "Use" / "Unuse"
}
