package com.edscorp.eds.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.user.entity.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, String> {

    Optional<UserEntity> findById(String id);

}
