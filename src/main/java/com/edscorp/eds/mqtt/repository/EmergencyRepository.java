package com.edscorp.eds.mqtt.repository;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.edscorp.eds.mqtt.domain.EmergencyEntity;

public interface EmergencyRepository extends JpaRepository<EmergencyEntity, Integer> {
    @Query("SELECT a FROM EmergencyEntity a WHERE a.alertCode = :alertCode AND a.inpDttm >= :start AND a.inpDttm < :end")
    List<EmergencyEntity> findTodayLogsByAlertCode(
            @Param("alertCode") String alertCode,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    boolean existsByInpDttm(Date inpDttm);

    boolean existsByCctvCodeAndAlertCodeAndBoundaryNumAndInpDttm(
            String cctvCode,
            String alertCode,
            Integer boundaryNum,
            Date inpDttm);
}
