package com.edscorp.eds.speaker.repository;

import java.time.LocalDateTime;

import org.apache.ibatis.annotations.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.edscorp.eds.speaker.domain.TbWebSpkDispatchLog;

public interface TbWebSpkDispatchLogRepository extends JpaRepository<TbWebSpkDispatchLog, Long> {

    @Query("""
                SELECT l
                FROM TbWebSpkDispatchLog l
                WHERE (:start IS NULL OR l.dispatchTime >= :start)
                AND (:end IS NULL OR l.dispatchTime <= :end)
                AND (:mode IS NULL OR :mode = '' OR l.mode = :mode)
                AND (:priority IS NULL OR :priority = '' OR l.priority = :priority)
                AND (:speakerQ IS NULL OR :speakerQ = '' OR l.speakerId LIKE CONCAT('%', :speakerQ, '%'))
                AND (:messageQ IS NULL OR :messageQ = '' OR l.ttsMessage LIKE CONCAT('%', :messageQ, '%'))
                ORDER BY l.dispatchTime DESC
            """)
    Page<TbWebSpkDispatchLog> search(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("mode") String mode,
            @Param("priority") String priority,
            @Param("speakerQ") String speakerQ,
            @Param("messageQ") String messageQ,
            Pageable pageable);

}
