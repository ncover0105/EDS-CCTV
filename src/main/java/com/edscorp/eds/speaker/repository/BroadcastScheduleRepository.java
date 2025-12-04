package com.edscorp.eds.speaker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edscorp.eds.speaker.domain.BroadcastScheduleEntity;
import com.edscorp.eds.speaker.dto.ScheduleDetailDTO;

@Repository
public interface BroadcastScheduleRepository extends JpaRepository<BroadcastScheduleEntity, Long> {
    @Query("""
                SELECT new com.edscorp.eds.speaker.dto.ScheduleDetailDTO(
                    bs.scheduleId,
                    bs.scheduleName,
                    bs.startTime,
                    bs.endTime,
                    bs.playType,
                    bs.folderName,
                    bs.repeatEnabled,
                    bs.sun, bs.mon, bs.tue, bs.wed, bs.thu, bs.fri, bs.sat,
                    sl.speakerCode,
                    sl.speakerName,
                    sl.speakerAdr,
                    sl.phone,
                    sl.connStat,
                    sl.recvTime,
                    ss.createdAt
                )
                FROM BroadcastScheduleEntity bs
                LEFT JOIN bs.scheduleSpeakers ss
                LEFT JOIN ss.speaker sl
                ORDER BY bs.scheduleId
            """)
    List<ScheduleDetailDTO> findAllSchedulesWithSpeakers();

    // 특정 스케줄 조회
    @Query("""
                SELECT new com.edscorp.eds.speaker.dto.ScheduleDetailDTO(
                    bs.scheduleId,
                    bs.scheduleName,
                    bs.startTime,
                    bs.endTime,
                    bs.playType,
                    bs.folderName,
                    bs.repeatEnabled,
                    bs.sun, bs.mon, bs.tue, bs.wed, bs.thu, bs.fri, bs.sat,
                    sl.speakerCode,
                    sl.speakerName,
                    sl.speakerAdr,
                    sl.phone,
                    sl.connStat,
                    sl.recvTime,
                    ss.createdAt
                )
                FROM BroadcastScheduleEntity bs
                LEFT JOIN bs.scheduleSpeakers ss
                LEFT JOIN ss.speaker sl
                WHERE bs.scheduleId = :scheduleId
                ORDER BY bs.scheduleId
            """)
    List<ScheduleDetailDTO> findScheduleWithSpeakers(@Param("scheduleId") Long scheduleId);
}
