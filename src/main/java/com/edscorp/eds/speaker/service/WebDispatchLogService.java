package com.edscorp.eds.speaker.service;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import com.edscorp.eds.speaker.domain.TbWebSpkDispatchLog;
import com.edscorp.eds.speaker.dto.WebDispatchLogRequest;
import com.edscorp.eds.speaker.dto.WebSpkDispatchLogRow;
import com.edscorp.eds.speaker.repository.TbWebSpkDispatchLogRepository;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class WebDispatchLogService {
    private final TbWebSpkDispatchLogRepository repo;

    @Transactional
    public Long writeLog(WebDispatchLogRequest req, String userId, String ip, String ua) {
        String speakerId = req.getSpeakerId();
        String speakerIdsJson = null;

        if (req.getSpeakerIds() != null && !req.getSpeakerIds().isEmpty()) {
            // JSON 라이브러리 안 쓰고 아주 단순하게 문자열로 저장 (필요하면 Jackson으로 바꿔도 됨)
            speakerIdsJson = req.getSpeakerIds().stream()
                    .filter(Objects::nonNull)
                    .map(s -> s.replace("\"", ""))
                    .map(s -> "\"" + s + "\"")
                    .reduce((a, b) -> a + "," + b)
                    .map(s -> "[" + s + "]")
                    .orElse("[]");

            if (speakerId == null && req.getSpeakerIds().size() == 1) {
                speakerId = req.getSpeakerIds().get(0);
            }
        }

        TbWebSpkDispatchLog saved = repo.save(
                TbWebSpkDispatchLog.builder()
                        .dispatchType(nvl(req.getDispatchType(), "manual"))
                        .mode(req.getMode())
                        .alertType(req.getAlertType())
                        .broadcastType(req.getBroadcastType())
                        .priority(req.getPriority())
                        .scope(req.getScope())
                        .disasterCode(req.getDisasterCode())
                        .ttsMessage(req.getTts())
                        .commandCode(req.getCommandCode())
                        .speakerId(speakerId)
                        .speakerIds(speakerIdsJson)
                        .requestUserId(userId)
                        .requestIp(ip)
                        .requestUa(ua)
                        .memo(req.getMemo())
                        .build());

        return saved.getLogKey();
    }

    public Page<WebSpkDispatchLogRow> search(
            LocalDateTime start,
            LocalDateTime end,
            String mode,
            String priority,
            String speakerQ,
            String messageQ,
            int page,
            int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dispatchTime"));
        return repo.search(start, end, mode, priority, speakerQ, messageQ, pr)
                .map(l -> new WebSpkDispatchLogRow(
                        l.getLogKey(),
                        l.getDispatchTime(),
                        l.getMode(),
                        l.getPriority(),
                        l.getDisasterCode(),
                        l.getTtsMessage(),
                        l.getSpeakerId(),
                        l.getRequestUserId()));
    }

    private String nvl(String v, String fb) {
        return (v == null || v.isBlank()) ? fb : v;
    }
}
