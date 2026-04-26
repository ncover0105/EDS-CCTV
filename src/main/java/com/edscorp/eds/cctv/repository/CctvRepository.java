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

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Transactional
        @Query("""
                        update CctvEntity c
                           set c.name = :name,
                               c.address = :address,
                               c.id = :id,
                               c.password = :password,
                               c.type = :type,
                               c.wsPort = :wsPort,
                               c.latitude = :latitude,
                               c.longitude = :longitude,
                               c.rtspUrl = :rtspUrl,
                               c.mountpointId = :mountpointId,
                               c.videoPort = :videoPort,
                               c.lowStream.rtspUrl = :lowRtspUrl,
                               c.lowStream.mountpointId = :lowMountpointId,
                               c.lowStream.videoPort = :lowVideoPort,
                               c.highStream.rtspUrl = :highRtspUrl,
                               c.highStream.mountpointId = :highMountpointId,
                               c.highStream.videoPort = :highVideoPort
                         where c.locationCode = :locationCode
                           and c.cctvCode = :cctvCode
                        """)
        int updateCctvConfig(
                        @Param("locationCode") String locationCode,
                        @Param("cctvCode") String cctvCode,
                        @Param("name") String name,
                        @Param("address") String address,
                        @Param("id") String id,
                        @Param("password") String password,
                        @Param("type") String type,
                        @Param("wsPort") String wsPort,
                        @Param("latitude") String latitude,
                        @Param("longitude") String longitude,
                        @Param("rtspUrl") String rtspUrl,
                        @Param("mountpointId") Integer mountpointId,
                        @Param("videoPort") Integer videoPort,
                        @Param("lowRtspUrl") String lowRtspUrl,
                        @Param("lowMountpointId") Integer lowMountpointId,
                        @Param("lowVideoPort") Integer lowVideoPort,
                        @Param("highRtspUrl") String highRtspUrl,
                        @Param("highMountpointId") Integer highMountpointId,
                        @Param("highVideoPort") Integer highVideoPort);

}
