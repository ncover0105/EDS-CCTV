package com.edscorp.eds.speaker.secondary.typeb.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.edscorp.eds.speaker.secondary.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.secondary.typeb.dto.SpeakerRowDto;

public interface SpkConfigRepository extends JpaRepository<SpkConfig, Integer> {

    // speakerId 기준 조회
    SpkConfig findBySpeakerId(String speakerId);

    // 지역 코드 기준 조회
    List<SpkConfig> findByLocationCode(String locationCode);

    // 삭제 여부 기반 조회 (00 미삭제 / 01 삭제)
    List<SpkConfig> findBySaveDivi(String saveDivi);

    @Query("""
                select new com.edscorp.eds.speaker.secondary.typeb.dto.SpeakerRowDto(
                    c.speakerKey,
                    c.speakerId,
                    c.speakerName,
                    s.connectStatus,
                    s.receiveTime,
                    c.cdmaNumber,
                    c.locationName,
                    c.speakerLatitude,
                    c.speakerLongitude,
                    c.description,
                    c.saveDivi
                )
                from SpkConfig c
                left join SpkStatus s
                    on s.speakerKey = c.speakerKey
                order by c.speakerKey desc
            """)
    List<SpeakerRowDto> findSpeakerRows();

    @Query("""
                select new com.edscorp.eds.speaker.secondary.typeb.dto.SpeakerRowDto(
                    c.speakerKey,
                    c.speakerId,
                    c.speakerName,
                    s.connectStatus,
                    s.receiveTime,
                    c.cdmaNumber,
                    c.locationName,
                    c.speakerLatitude,
                    c.speakerLongitude,
                    c.description,
                    c.saveDivi
                )
                from SpkConfig c
                left join SpkStatus s
                    on s.speakerKey = c.speakerKey
                where c.saveDivi = :saveDivi
                order by c.speakerKey desc
            """)
    List<SpeakerRowDto> findSpeakerRowsBySaveDivi(@Param("saveDivi") String saveDivi);

    List<SpkConfig> findBySpeakerKeyIn(Collection<Integer> ids);

    List<SpkConfig> findBySaveDiviOrderBySpeakerKeyDesc(String saveDivi);

    Optional<SpkConfig> findBySpeakerKeyAndSaveDivi(Integer speakerKey, String saveDivi);

    boolean existsBySpeakerIdAndSaveDivi(String speakerId, String saveDivi);
}
