package com.edscorp.eds.speaker.secondary.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpeakerSettingDTO {
    private Integer speakerKey;
    private LocalDateTime receiveTime;

    private Integer bgmVolCh1;
    private Integer bgmVolCh2;
    private Integer bgmVolCh3;
    private Integer bgmVolCh4;

    private Integer alertVolCh1;
    private Integer alertVolCh2;
    private Integer alertVolCh3;
    private Integer alertVolCh4;

    private Integer fmVolCh1;
    private Integer fmVolCh2;
    private Integer fmVolCh3;
    private Integer fmVolCh4;

    private Integer useCh1;
    private Integer useCh2;
    private Integer useCh3;
    private Integer useCh4;

    private String ttaRegionCode;
    private String dmbFrequency1;
    private String dmbFrequency2;

    private String serverip;

    private Integer bgmFolderNo;
    private Integer bgmStatus;

    private Integer bgmInVol;
    private Integer stoInVol;
    private Integer ttsInVol;
    private Integer fmInVol;

    private Integer ttsPitch;
    private Integer ttsSpeed;

    private Integer pollingCheckTime;

    private Integer musicMode;

    private Integer radioFrequency;
    private Integer radioFrequencyRegion;
}
