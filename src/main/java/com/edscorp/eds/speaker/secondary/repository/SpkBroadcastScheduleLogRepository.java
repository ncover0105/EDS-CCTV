package com.edscorp.eds.speaker.secondary.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.secondary.domain.SpkBroadcastScheduleLog;

public interface SpkBroadcastScheduleLogRepository extends JpaRepository<SpkBroadcastScheduleLog, Long> {
}

