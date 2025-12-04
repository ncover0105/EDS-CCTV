package com.edscorp.eds.web.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.common.domain.SystemSetting;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {

}
