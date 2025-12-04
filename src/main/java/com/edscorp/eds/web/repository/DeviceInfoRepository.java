package com.edscorp.eds.web.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.common.domain.DeviceInfoEntity;

public interface DeviceInfoRepository extends JpaRepository<DeviceInfoEntity, String> {

}
