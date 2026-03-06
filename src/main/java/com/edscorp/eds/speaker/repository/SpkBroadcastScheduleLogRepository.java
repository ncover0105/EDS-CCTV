package com.edscorp.eds.speaker.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.domain.SpkBroadcastScheduleLog;

public interface SpkBroadcastScheduleLogRepository extends JpaRepository<SpkBroadcastScheduleLog, Long> {
}

