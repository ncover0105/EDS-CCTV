package com.edscorp.eds.speaker.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.HashMap;

public record ScheduleDetailDTO(
        Long scheduleId,
        String scheduleName,
        LocalTime startTime,
        LocalTime endTime,
        String playType,
        String folderName,
        Boolean repeatEnabled,
        Boolean sun, Boolean mon, Boolean tue, Boolean wed, Boolean thu, Boolean fri, Boolean sat,
        String speakerCode,
        String speakerName,
        String installAddress,
        String phone,
        String connStat,
        LocalDateTime recvTime,
        LocalDateTime createdAt) {
    public Long getScheduleId() {
        return scheduleId;
    }

    public String getScheduleName() {
        return scheduleName;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getPlayType() {
        return playType;
    }

    public String getFolderName() {
        return folderName;
    }

    public Boolean getRepeatEnabled() {
        return repeatEnabled;
    }

    public Boolean getSun() {
        return sun;
    }

    public Boolean getMon() {
        return mon;
    }

    public Boolean getTue() {
        return tue;
    }

    public Boolean getWed() {
        return wed;
    }

    public Boolean getThu() {
        return thu;
    }

    public Boolean getFri() {
        return fri;
    }

    public Boolean getSat() {
        return sat;
    }

    public String getSpeakerCode() {
        return speakerCode;
    }

    public String getSpeakerName() {
        return speakerName;
    }

    public String getInstallAddress() {
        return installAddress;
    }

    public String getPhone() {
        return phone;
    }

    public String getConnStat() {
        return connStat;
    }

    public LocalDateTime getRecvTime() {
        return recvTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Map<String, Boolean> getWeekSchedule() {
        Map<String, Boolean> weekSchedule = new HashMap<>();
        weekSchedule.put("sun", sun != null && sun);
        weekSchedule.put("mon", mon != null && mon);
        weekSchedule.put("tue", tue != null && tue);
        weekSchedule.put("wed", wed != null && wed);
        weekSchedule.put("thu", thu != null && thu);
        weekSchedule.put("fri", fri != null && fri);
        weekSchedule.put("sat", sat != null && sat);
        return weekSchedule;
    }
}
