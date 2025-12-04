package com.edscorp.eds.speaker.dto;

import java.time.LocalDateTime;

public interface ScheduleDTO {
    Long getScheduleId();

    String getScheduleName();

    String getStartTime();

    String getEndTime();

    String getPlayType();

    String getFolderName();

    Boolean getRepeatEnabled();

    Boolean getSun();

    Boolean getMon();

    Boolean getTue();

    Boolean getWed();

    Boolean getThu();

    Boolean getFri();

    Boolean getSat();

    String getSpeakerCode();

    String getSpeakerName();

    String getInstallAddress();

    String getPhone();

    String getConnStat();

    LocalDateTime getRecvTime();

    LocalDateTime getCreatedAt();
}
