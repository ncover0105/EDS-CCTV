package com.edscorp.eds.speaker.secondary.typeb.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.edscorp.eds.speaker.secondary.domain.SpkBroadcastSchedule;
import com.edscorp.eds.speaker.secondary.repository.SpkBroadcastScheduleRepository;
import com.edscorp.eds.speaker.secondary.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.secondary.typeb.dto.ScheduleSaveRequest;
import com.edscorp.eds.speaker.secondary.typeb.dto.SpkBroadcastScheduleViewDto;
import com.edscorp.eds.speaker.secondary.typeb.repository.SpkConfigRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SpkBroadcastScheduleService {

    private final SpkBroadcastScheduleRepository scheduleRepo;
    private final SpkConfigRepository spkConfigRepo;
    private final ObjectMapper objectMapper;

    public List<SpkBroadcastScheduleViewDto> listSchedules() {
        List<SpkBroadcastSchedule> schedules = scheduleRepo.findAllByOrderByScheduleIdDesc();

        // 1) schedule_ids 전체에서 speakerKey 모으기
        Set<Integer> allKeys = new HashSet<>();
        Map<Long, List<Integer>> scheduleKeyMap = new HashMap<>();

        for (SpkBroadcastSchedule sc : schedules) {
            List<Integer> keys = parseSpeakerKeys(sc.getSpeakerIds());
            scheduleKeyMap.put(sc.getScheduleId(), keys);
            allKeys.addAll(keys);
        }

        // 2) 스피커 상세 일괄 조회(1번 쿼리)
        Map<Integer, SpkConfig> spkMap = spkConfigRepo.findBySpeakerKeyIn(allKeys).stream()
                .collect(Collectors.toMap(SpkConfig::getSpeakerKey, s -> s, (a, b) -> a));

        // 3) DTO 변환 (schedule 1건 + speakers[] 포함)
        return schedules.stream().map(sc -> {
            List<Integer> keys = scheduleKeyMap.getOrDefault(sc.getScheduleId(), List.of());

            List<SpkBroadcastScheduleViewDto.SpkConfigDto> speakers = keys.stream()
                    .map(spkMap::get)
                    .filter(Objects::nonNull)
                    .map(this::toSpkDto)
                    .toList();

            return toScheduleDto(sc, speakers);
        }).toList();
    }

    private List<Integer> parseSpeakerKeys(String speakerIdsJson) {
        if (!StringUtils.hasText(speakerIdsJson))
            return List.of();
        try {
            // JSON 배열이 ["10","11"] 형태일 수도 있으니 String으로 먼저 읽고 Integer로 변환
            List<String> raw = objectMapper.readValue(speakerIdsJson, new TypeReference<List<String>>() {
            });
            return raw.stream()
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .map(s -> {
                        try {
                            return Integer.parseInt(s);
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
        } catch (Exception e) {
            // JSON이 깨진 경우: 안전하게 빈 목록
            return List.of();
        }
    }

    private SpkBroadcastScheduleViewDto toScheduleDto(
            SpkBroadcastSchedule sc,
            List<SpkBroadcastScheduleViewDto.SpkConfigDto> speakers) {
        return SpkBroadcastScheduleViewDto.builder()
                .scheduleId(sc.getScheduleId())
                .scheduleName(sc.getScheduleName())
                .enabledYn(sc.getEnabledYn())
                .startTime(sc.getStartTime())
                .endTime(sc.getEndTime())
                .repeatEnabled(sc.getRepeatEnabled())
                .mon(sc.getMon())
                .tue(sc.getTue())
                .wed(sc.getWed())
                .thu(sc.getThu())
                .fri(sc.getFri())
                .sat(sc.getSat())
                .sun(sc.getSun())
                .bcMode(sc.getBcMode())
                .bcAlertType(sc.getBcAlertType())
                .bcBroadcastType(sc.getBcBroadcastType())
                .bcPriority(sc.getBcPriority())
                .bcScope(sc.getBcScope())
                .disasterCode(sc.getDisasterCode())
                .ttsMessage(sc.getTtsMessage())
                .speakerIds(sc.getSpeakerIds())
                .createdAt(sc.getCreatedAt())
                .updatedAt(sc.getUpdatedAt())
                .speakers(speakers)
                .build();
    }

    private SpkBroadcastScheduleViewDto.SpkConfigDto toSpkDto(SpkConfig sp) {
        return SpkBroadcastScheduleViewDto.SpkConfigDto.builder()
                .speakerKey(sp.getSpeakerKey())
                .speakerId(sp.getSpeakerId())
                .speakerName(sp.getSpeakerName())
                .locationCode(sp.getLocationCode())
                .locationName(sp.getLocationName())
                .speakerAdr(sp.getSpeakerAdr())
                .speakerLatitude(sp.getSpeakerLatitude() != null ? sp.getSpeakerLatitude().toPlainString() : null)
                .speakerLongitude(sp.getSpeakerLongitude() != null ? sp.getSpeakerLongitude().toPlainString() : null)
                .build();
    }

    public SpkBroadcastSchedule saveSchedule(ScheduleSaveRequest req) {
        SpkBroadcastSchedule sc = new SpkBroadcastSchedule();
        applyRequest(sc, req);
        sc.setCreatedAt(LocalDateTime.now());
        sc.setUpdatedAt(LocalDateTime.now());
        return scheduleRepo.save(sc);
    }

    public SpkBroadcastSchedule updateSchedule(Long id, ScheduleSaveRequest req) {
        SpkBroadcastSchedule sc = scheduleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("schedule not found: " + id));
        applyRequest(sc, req);
        sc.setUpdatedAt(LocalDateTime.now());
        return scheduleRepo.save(sc);
    }

    public void deleteSchedule(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("schedule id is required");
        }
        if (!scheduleRepo.existsById(id)) {
            throw new IllegalArgumentException("schedule not found: " + id);
        }
        scheduleRepo.deleteById(id);
    }

    private void applyRequest(SpkBroadcastSchedule sc, ScheduleSaveRequest req) {
        sc.setScheduleName(req.getScheduleName());
        sc.setEnabledYn(req.getEnabledYn());
        sc.setRepeatEnabled(req.getRepeatEnabled());

        sc.setMon(req.getMon());
        sc.setTue(req.getTue());
        sc.setWed(req.getWed());
        sc.setThu(req.getThu());
        sc.setFri(req.getFri());
        sc.setSat(req.getSat());
        sc.setSun(req.getSun());

        sc.setBcMode(req.getBcMode());
        sc.setBcAlertType(req.getBcAlertType());
        sc.setBcBroadcastType(req.getBcBroadcastType());
        sc.setBcPriority(req.getBcPriority());
        sc.setBcScope(req.getBcScope());
        sc.setDisasterCode(req.getDisasterCode());
        sc.setTtsMessage(req.getTtsMessage());

        // "HH:mm:ss" 또는 "HH:mm" 모두 대응
        sc.setStartTime(parseLocalTime(req.getStartTime()));
        sc.setEndTime(parseLocalTime(req.getEndTime()));

        // speakerIds(List<String>) -> JSON 문자열 저장
        try {
            sc.setSpeakerIds(objectMapper.writeValueAsString(req.getSpeakerIds()));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid speakerIds", e);
        }
    }

    private LocalTime parseLocalTime(String v) {
        if (!StringUtils.hasText(v))
            return null;
        String s = v.trim();
        if (s.length() == 5)
            s = s + ":00";
        return LocalTime.parse(s);
    }
}
