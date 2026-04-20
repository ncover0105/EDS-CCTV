package com.edscorp.eds.cctv.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.cctv.domain.CctvEntity;
import com.edscorp.eds.cctv.domain.CctvId;

public interface CctvRepository extends JpaRepository<CctvEntity, CctvId> {

        Optional<CctvEntity> findByLocationCodeAndCctvCode(String locationCode, String cctvCode);

        // (주의) cctvCode 단독은 복수일 수 있으니 List가 안전
        List<CctvEntity> findAllByCctvCode(String cctvCode);

        List<CctvEntity> findAllByCctvCodeIn(Collection<String> cctvCodes);

        List<CctvEntity> findByStatusCam(String status);

        boolean existsByLocationCodeAndCctvCode(String locationCode, String cctvCode);

        @Modifying
        @Transactional
        @Query("delete from CctvEntity c where c.locationCode = :locationCode and c.cctvCode = :cctvCode")
        void deleteByLocationCodeAndCctvCode(@Param("locationCode") String locationCode,
                        @Param("cctvCode") String cctvCode);

        @Modifying
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        @Query("update CctvEntity c set c.statusProc = :statusProc where c.locationCode = :locationCode and c.cctvCode = :cctvCode")
        int updateStatusProc(@Param("locationCode") String locationCode,
                        @Param("cctvCode") String cctvCode,
                        @Param("statusProc") String statusProc);

}
