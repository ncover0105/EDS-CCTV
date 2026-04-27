package com.edscorp.eds.speaker.secondary.typeb.service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.edscorp.eds.speaker.secondary.domain.SpkBroadcastSchedule;
import com.edscorp.eds.speaker.secondary.domain.SpkBroadcastScheduleLog;
import com.edscorp.eds.speaker.secondary.repository.SpkBroadcastScheduleLogRepository;
import com.edscorp.eds.speaker.secondary.repository.SpkBroadcastScheduleRepository;
import com.edscorp.eds.speaker.secondary.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.secondary.typeb.dto.BTypeAlertRequest;
import com.edscorp.eds.speaker.secondary.typeb.repository.SpkConfigRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class SpkBroadcastScheduleRunner {

    private final SpkBroadcastScheduleRepository scheduleRepo;
    private final SpkBroadcastScheduleLogRepository scheduleLogRepo;
    private final SpkConfigRepository spkConfigRepo;
    private final BTypeCommandService bTypeCommandService;
    private final ObjectMapper objectMapper;

    // scheduleId -> 마지막 실행 minute
    private final Map<Long, LocalDateTime> lastTriggeredMinute = new ConcurrentHashMap<>();

    @Scheduled(fixedDelayString = "${eds.spk.schedule.poll-ms:30000}")
    public void run() {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        List<SpkBroadcastSchedule> schedules = scheduleRepo.findAll();

        for (SpkBroadcastSchedule schedule : schedules) {
            if (!isEnabled(schedule)) {
                continue;
            }
            if (!isDueMinute(schedule, now)) {
                continue;
            }
            if (!isDayMatched(schedule, now.getDayOfWeek())) {
                continue;
            }
            if (!markTriggered(schedule.getScheduleId(), now)) {
                continue;
            }

            executeSchedule(schedule);
        }

        compactRunHistory(now.minusDays(2));
    }

    private boolean isEnabled(SpkBroadcastSchedule schedule) {
        return isYes(schedule.getEnabledYn());
    }

    private boolean isDueMinute(SpkBroadcastSchedule schedule, LocalDateTime now) {
        LocalTime startTime = schedule.getStartTime();
        if (startTime == null) {
            return false;
        }
        return startTime.getHour() == now.getHour() && startTime.getMinute() == now.getMinute();
    }

    private boolean isDayMatched(SpkBroadcastSchedule schedule, DayOfWeek day) {
        if (!isYes(schedule.getRepeatEnabled())) {
            return true;
        }

        return switch (day) {
            case MONDAY -> isYes(schedule.getMon());
            case TUESDAY -> isYes(schedule.getTue());
            case WEDNESDAY -> isYes(schedule.getWed());
            case THURSDAY -> isYes(schedule.getThu());
            case FRIDAY -> isYes(schedule.getFri());
            case SATURDAY -> isYes(schedule.getSat());
            case SUNDAY -> isYes(schedule.getSun());
        };
    }

    private boolean markTriggered(Long scheduleId, LocalDateTime nowMinute) {
        if (scheduleId == null) {
            return false;
        }
        LocalDateTime prev = lastTriggeredMinute.put(scheduleId, nowMinute);
        return !nowMinute.equals(prev);
    }

    private void compactRunHistory(LocalDateTime threshold) {
        lastTriggeredMinute.entrySet().removeIf(e -> e.getValue().isBefore(threshold));
    }

    private void executeSchedule(SpkBroadcastSchedule schedule) {
        List<Integer> speakerKeys = parseSpeakerKeys(schedule.getSpeakerIds());
        if (speakerKeys.isEmpty()) {
            log.warn("[SCH] scheduleId={} speakerIds is empty", schedule.getScheduleId());
            return;
        }

        List<SpkConfig> speakers = spkConfigRepo.findBySpeakerKeyIn(speakerKeys);
        saveDispatchLog(schedule, speakerKeys.size());

        int success = 0;
        int fail = 0;

        for (SpkConfig speaker : speakers) {
            if (speaker == null || !StringUtils.hasText(speaker.getSpeakerId())) {
                continue;
            }
            if ("01".equals(speaker.getSaveDivi())) {
                continue;
            }

            BTypeAlertRequest req = buildAlertRequest(schedule, speaker.getSpeakerId());
            try {
                bTypeCommandService.sendAlert(req, "127.0.0.1", "scheduler");
                success++;
            } catch (Exception e) {
                fail++;
                log.error("[SCH] scheduleId={} deviceId={} send failed: {}",
                        schedule.getScheduleId(), speaker.getSpeakerId(), e.getMessage(), e);
            }
        }

        log.info("[SCH] scheduleId={} done success={} fail={}", schedule.getScheduleId(), success, fail);

        // 1회성 스케줄은 1번 실행 후 자동 비활성화
        if (!isYes(schedule.getRepeatEnabled()) && success > 0) {
            schedule.setEnabledYn("N");
            schedule.setUpdatedAt(LocalDateTime.now());
            scheduleRepo.save(schedule);
        }
    }

    private void saveDispatchLog(SpkBroadcastSchedule schedule, int targetCount) {
        try {
            SpkBroadcastScheduleLog logEntity = SpkBroadcastScheduleLog.builder()
                    .scheduleId(schedule.getScheduleId())
                    .dispatchedAt(LocalDateTime.now())
                    .targetCount(Math.max(targetCount, 0))
                    .requestedBy(null) // 스케줄 실행
                    .memo("스케줄실행")
                    .bcMode(nvl(schedule.getBcMode()))
                    .bcAlertType(nvl(schedule.getBcAlertType()))
                    .bcBroadcastType(nvl(schedule.getBcBroadcastType()))
                    .bcPriority(nvl(schedule.getBcPriority()))
                    .bcScope(nvl(schedule.getBcScope()))
                    .disasterCode(nvl(schedule.getDisasterCode()))
                    .ttsMessage(schedule.getTtsMessage())
                    .build();
            scheduleLogRepo.save(logEntity);
        } catch (Exception e) {
            log.error("[SCH] scheduleId={} dispatch-log save failed: {}", schedule.getScheduleId(), e.getMessage(), e);
        }
    }

    private BTypeAlertRequest buildAlertRequest(SpkBroadcastSchedule schedule, String speakerId) {
        BTypeAlertRequest req = new BTypeAlertRequest();
        req.setDeviceId(speakerId);
        req.setAlertMode(parseInt(schedule.getBcMode(), 1));
        req.setAlertKind(parseInt(schedule.getBcBroadcastType(), 1));
        req.setAlertRange(parseInt(schedule.getBcScope(), 3));
        req.setAlertPriority(parseInt(schedule.getBcPriority(), 0));
        req.setTtsMessage(schedule.getTtsMessage());

        // 프론트 bc_send와 동일 규칙: TTS(1)면 CFW 사용
        if (req.getAlertKind() != null && req.getAlertKind() == 1) {
            req.setDisasterCode("CFW");
        } else {
            req.setDisasterCode(StringUtils.hasText(schedule.getDisasterCode()) ? schedule.getDisasterCode() : "CFW");
        }

        return req;
    }

    private List<Integer> parseSpeakerKeys(String speakerIdsJson) {
        if (!StringUtils.hasText(speakerIdsJson)) {
            return List.of();
        }
        try {
            List<String> raw = objectMapper.readValue(speakerIdsJson, new TypeReference<List<String>>() {
            });
            List<Integer> keys = new ArrayList<>();
            for (String s : raw) {
                if (!StringUtils.hasText(s)) {
                    continue;
                }
                try {
                    keys.add(Integer.parseInt(s.trim()));
                } catch (NumberFormatException ignore) {
                }
            }
            return keys.stream().distinct().toList();
        } catch (Exception e) {
            log.warn("[SCH] invalid speakerIds json: {}", speakerIdsJson);
            return List.of();
        }
    }

    private Integer parseInt(String v, int fallback) {
        if (!StringUtils.hasText(v)) {
            return fallback;
        }
        try {
            return Integer.parseInt(v.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private boolean isYes(String v) {
        if (!StringUtils.hasText(v)) {
            return false;
        }
        String s = v.trim();
        return "Y".equalsIgnoreCase(s) || "1".equals(s) || "true".equalsIgnoreCase(s);
    }

    private String nvl(String v) {
        return v == null ? "" : v;
    }
}
