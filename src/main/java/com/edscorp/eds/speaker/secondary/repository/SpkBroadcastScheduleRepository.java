package com.edscorp.eds.speaker.secondary.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.secondary.domain.SpkBroadcastSchedule;

public interface SpkBroadcastScheduleRepository extends JpaRepository<SpkBroadcastSchedule, Long> {
    List<SpkBroadcastSchedule> findAllByOrderByScheduleIdDesc();
}
