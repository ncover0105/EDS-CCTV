package com.edscorp.eds.cctv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;

import com.edscorp.eds.cctv.domain.CctvEntity;

public interface CctvRepository extends JpaRepository<CctvEntity, String> {

    /**
     * cctvCode로 CCTV 조회
     */
    Optional<CctvEntity> findByCctvCode(String cctvCode);

    /**
     * statusCam로 CCTV 조회
     */
    List<CctvEntity> findByStatusCam(String status);

    // List<CctvEntity> findByPortStatusAndVideoPortIsNotNull(String portStatus);

    // @Query("SELECT c FROM CctvEntity c WHERE c.videoPort BETWEEN :startPort AND
    // :endPort")
    // List<CctvEntity> findByPortRange(@Param("startPort") int startPort,
    // @Param("endPort") int endPort);
}
