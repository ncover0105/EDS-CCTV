package com.edscorp.eds.speaker.typeb.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.typeb.domain.SpkAlertDispatch;

public interface SpkAlertDispatchRepository extends JpaRepository<SpkAlertDispatch, Integer> {

    // alert_key 기준으로 발령 이력 조회
    List<SpkAlertDispatch> findByAlertKeyOrderByDispatchTimeDesc(Integer alertKey);

    // 장비 기준 이력
    List<SpkAlertDispatch> findByDeviceUidOrderByDispatchTimeDesc(String deviceUid);

    // 상태 + 기간 검색 예시
    List<SpkAlertDispatch> findByDispatchStatusAndDispatchTimeBetween(
            String dispatchStatus,
            LocalDateTime from,
            LocalDateTime to);
}
