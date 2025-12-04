package com.edscorp.eds.mqtt.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.edscorp.eds.mqtt.domain.AlertListEntity;

@Repository
public interface AlertListRepository extends JpaRepository<AlertListEntity, String> {

    // @Query("SELECT a FROM EmergencyEntity a WHERE a.alertCode = :alertCode AND
    // DATE(a.inpDttm) = CURRENT_DATE")
    // List<EmergencyEntity> findTodayLogsByAlertCode(@Param("alertCode") String
    // alertCode);

}
