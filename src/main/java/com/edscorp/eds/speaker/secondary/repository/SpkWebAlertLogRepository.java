package com.edscorp.eds.speaker.secondary.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.edscorp.eds.speaker.secondary.domain.SpkWebAlertLogEntity;

public interface SpkWebAlertLogRepository
                extends JpaRepository<SpkWebAlertLogEntity, Long>, JpaSpecificationExecutor<SpkWebAlertLogEntity> {
        List<SpkWebAlertLogEntity> findTop3ByOrderByCreatedAtDesc();

}
