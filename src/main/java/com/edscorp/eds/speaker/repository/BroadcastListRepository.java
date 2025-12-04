package com.edscorp.eds.speaker.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.edscorp.eds.speaker.domain.BroadcastListEntity;

public interface BroadcastListRepository extends JpaRepository<BroadcastListEntity, String> {

}
