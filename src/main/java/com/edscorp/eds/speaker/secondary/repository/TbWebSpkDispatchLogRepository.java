package com.edscorp.eds.speaker.secondary.repository;

import java.time.LocalDateTime;

import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.edscorp.eds.speaker.secondary.domain.TbWebSpkDispatchLog;
import com.edscorp.eds.speaker.secondary.dto.WebSpkDispatchLogRow;

public interface TbWebSpkDispatchLogRepository extends JpaRepository<TbWebSpkDispatchLog, Long> {

    @Query("""
            SELECT l
            FROM TbWebSpkDispatchLog l
            WHERE (:start IS NULL OR l.dispatchTime >= :start)
              AND (:end IS NULL OR l.dispatchTime <= :end)
              AND (:mode IS NULL OR :mode = '' OR l.mode = :mode)
              AND (:priority IS NULL OR :priority = '' OR l.priority = :priority)
              AND (
                   :speakerQ IS NULL OR :speakerQ = ''
                   OR l.speakerId LIKE CONCAT('%', :speakerQ, '%')
                   OR l.speakerIds LIKE CONCAT('%', :speakerQ, '%')
              )
              AND (
                   :messageQ IS NULL OR :messageQ = ''
                   OR l.ttsMessage LIKE CONCAT('%', :messageQ, '%')
                   OR l.memo LIKE CONCAT('%', :messageQ, '%')
              )
            """)
    Page<TbWebSpkDispatchLog> search(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("mode") String mode,
            @Param("priority") String priority,
            @Param("speakerQ") String speakerQ,
            @Param("messageQ") String messageQ,
            Pageable pageable);

    @Query("""
            SELECT new com.edscorp.eds.speaker.secondary.dto.WebSpkDispatchLogRow(
                l.logKey,
                l.dispatchTime,

                l.dispatchType,
                l.broadcastType,
                l.mode,
                l.priority,

                l.scope,
                l.commandCode,

                l.disasterCode,
                d.dstName,
                d.dstPriority,
                d.dstStoreMsg,

                l.ttsMessage,
                l.memo,

                l.speakerId,
                l.speakerIds,

                l.requestUserId,
                l.requestIp
            )
            FROM TbWebSpkDispatchLog l
            LEFT JOIN com.edscorp.eds.speaker.secondary.typeb.domain.SpkDisaster d
              ON l.disasterCode = d.dstCode
            WHERE (:start IS NULL OR l.dispatchTime >= :start)
              AND (:end IS NULL OR l.dispatchTime <= :end)
              AND (:mode IS NULL OR :mode = '' OR l.mode = :mode)
              AND (:priority IS NULL OR :priority = '' OR l.priority = :priority)
              AND (
                   :speakerQ IS NULL OR :speakerQ = ''
                   OR l.speakerId LIKE CONCAT('%', :speakerQ, '%')
                   OR l.speakerIds LIKE CONCAT('%', :speakerQ, '%')
              )
              AND (
                   :messageQ IS NULL OR :messageQ = ''
                   OR l.ttsMessage LIKE CONCAT('%', :messageQ, '%')
                   OR l.memo LIKE CONCAT('%', :messageQ, '%')
                   OR d.dstStoreMsg LIKE CONCAT('%', :messageQ, '%')
              )
            """)
    Page<WebSpkDispatchLogRow> searchWithDisaster(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("mode") String mode,
            @Param("priority") String priority,
            @Param("speakerQ") String speakerQ,
            @Param("messageQ") String messageQ,
            Pageable pageable);
}
