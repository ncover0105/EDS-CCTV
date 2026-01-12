package com.edscorp.eds.speaker.typeb.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.edscorp.eds.speaker.typeb.domain.SpkConfig;
import com.edscorp.eds.speaker.typeb.dto.SpeakerRowDto;

public interface SpkConfigRepository extends JpaRepository<SpkConfig, Integer> {

    // speakerId 기준 조회
    SpkConfig findBySpeakerId(String speakerId);

    // 지역 코드 기준 조회
    List<SpkConfig> findByLocationCode(String locationCode);

    // 삭제 여부 기반 조회 (00 미삭제 / 01 삭제)
    List<SpkConfig> findBySaveDivi(String saveDivi);

    @Query("""
                select new com.edscorp.eds.speaker.typeb.dto.SpeakerRowDto(
                    c.speakerKey,
                    c.speakerId,
                    c.speakerName,
                    s.connectStatus,
                    s.receiveTime,
                    c.cdmaNumber,
                    c.locationName,
                    c.speakerLatitude,
                    c.speakerLongitude,
                    c.saveDivi
                )
                from SpkConfig c
                left join SpkStatus s
                    on s.speakerKey = c.speakerKey
                order by c.speakerKey desc
            """)
    List<SpeakerRowDto> findSpeakerRows();

    List<SpkConfig> findBySpeakerKeyIn(Collection<Integer> ids);
}
