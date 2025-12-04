package com.edscorp.eds.mqtt.repository;

import org.springframework.data.repository.CrudRepository;

import com.edscorp.eds.mqtt.domain.StatusLogEntity;

public interface StatusLogRepository extends CrudRepository<StatusLogEntity, Integer> {

}
