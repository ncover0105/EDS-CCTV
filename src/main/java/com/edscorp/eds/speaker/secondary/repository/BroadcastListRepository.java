package com.edscorp.eds.speaker.secondary.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.secondary.domain.BroadcastListEntity;

public interface BroadcastListRepository extends JpaRepository<BroadcastListEntity, String> {

}
