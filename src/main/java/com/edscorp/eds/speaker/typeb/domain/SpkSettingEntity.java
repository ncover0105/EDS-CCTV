package com.edscorp.eds.speaker.typeb.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpkSettingEntity {

    @Id
    @Column(name = "speakerKey")
    private Integer speakerKey; // PK: 스피커 ID

    @Column(name = "ReceiveTime")
    private LocalDateTime receiveTime; // 설정정보 수신시간

    @Column(name = "bgm_vol_ch1")
    private Integer bgmVolCh1;
    @Column(name = "bgm_vol_ch2")
    private Integer bgmVolCh2;
    @Column(name = "bgm_vol_ch3")
    private Integer bgmVolCh3;
    @Column(name = "bgm_vol_ch4")
    private Integer bgmVolCh4;

    @Column(name = "alert_vol_ch1")
    private Integer alertVolCh1;
    @Column(name = "alert_vol_ch2")
    private Integer alertVolCh2;
    @Column(name = "alert_vol_ch3")
    private Integer alertVolCh3;
    @Column(name = "alert_vol_ch4")
    private Integer alertVolCh4;

    @Column(name = "fm_vol_ch1")
    private Integer fmVolCh1;
    @Column(name = "fm_vol_ch2")
    private Integer fmVolCh2;
    @Column(name = "fm_vol_ch3")
    private Integer fmVolCh3;
    @Column(name = "fm_vol_ch4")
    private Integer fmVolCh4;

    @Column(name = "useCh1")
    private Integer useCh1;
    @Column(name = "useCh2")
    private Integer useCh2;
    @Column(name = "useCh3")
    private Integer useCh3;
    @Column(name = "useCh4")
    private Integer useCh4;

    @Column(name = "TTARegionCode", length = 10)
    private String ttaRegionCode;

    @Column(name = "DMBFrequency1", length = 7)
    private String dmbFrequency1;

    @Column(name = "DMBFrequency2", length = 7)
    private String dmbFrequency2;

    @Column(name = "serverip", length = 15)
    private String serverIp;

    @Column(name = "BGMFolderNo")
    private Integer bgmFolderNo;

    @Column(name = "BGMStatus")
    private Integer bgmStatus;

    @Column(name = "BGM_IN_VOL")
    private Integer bgmInVol;

    @Column(name = "STO_IN_VOL")
    private Integer stoInVol;

    @Column(name = "TTS_IN_VOL")
    private Integer ttsInVol;

    @Column(name = "FM_IN_VOL")
    private Integer fmInVol;

    @Column(name = "TTS_Pitch")
    private Integer ttsPitch;

    @Column(name = "TTS_Speed")
    private Integer ttsSpeed;

    @Column(name = "PollingCheckTime")
    private Integer pollingCheckTime;

    @Column(name = "MusicMode")
    private Integer musicMode;

    @Column(name = "RadioFrequency")
    private Integer radioFrequency;

    @Column(name = "RadioFrequencyRegion")
    private Integer radioFrequencyRegion;

}
