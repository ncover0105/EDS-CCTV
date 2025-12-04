package com.edscorp.eds.speaker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.edscorp.eds.speaker.domain.ScheduleSpeaker;

@Repository
public interface ScheduleSpeakerRepository extends JpaRepository<ScheduleSpeaker, Long> {
    List<ScheduleSpeaker> findByScheduleScheduleId(Long scheduleId);

    void deleteBySchedule_ScheduleId(Long scheduleId);
}
