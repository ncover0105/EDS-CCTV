package com.edscorp.eds.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.common.domain.UserLoginLogEntity;

public interface UserLoginLogRepository extends JpaRepository<UserLoginLogEntity, Long> {

}
