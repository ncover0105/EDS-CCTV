package com.edscorp.eds.speaker.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.domain.Specification;

import com.edscorp.eds.speaker.domain.SpkWebAlertLogEntity;

public class SpkWebAlertLogSpecs {

    public static Specification<SpkWebAlertLogEntity> deviceIdEq(String deviceId) {
        return (root, query, cb) -> deviceId == null || deviceId.isBlank() ? null
                : cb.equal(root.get("deviceId"), deviceId);
    }

    public static Specification<SpkWebAlertLogEntity> alertModeEq(Integer alertMode) {
        return (root, query, cb) -> alertMode == null ? null : cb.equal(root.get("alertMode"), alertMode);
    }

    public static Specification<SpkWebAlertLogEntity> alertPriorityEq(Integer alertPriority) {
        return (root, query, cb) -> alertPriority == null ? null : cb.equal(root.get("alertPriority"), alertPriority);
    }

    public static Specification<SpkWebAlertLogEntity> createdAtGte(LocalDateTime from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<SpkWebAlertLogEntity> createdAtLt(LocalDateTime toExclusive) {
        return (root, query, cb) -> toExclusive == null ? null : cb.lessThan(root.get("createdAt"), toExclusive);
    }

}
