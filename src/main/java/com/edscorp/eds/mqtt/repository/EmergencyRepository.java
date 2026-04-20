package com.edscorp.eds.mqtt.repository;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.edscorp.eds.mqtt.domain.EmergencyEntity;

public interface EmergencyRepository extends JpaRepository<EmergencyEntity, Integer> {
        @Query("SELECT a FROM EmergencyEntity a WHERE a.alertCode = :alertCode AND a.inpDttm >= :start AND a.inpDttm < :end")
        List<EmergencyEntity> findTodayLogsByAlertCode(
                        @Param("alertCode") String alertCode,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        boolean existsByInpDttm(Date inpDttm);

        boolean existsByCctvCodeAndAlertCodeAndBoundaryNumAndInpDttm(
                        String cctvCode,
                        String alertCode,
                        Integer boundaryNum,
                        Date inpDttm);

        Page<EmergencyEntity> findByInpDttmBetween(Date start, Date end, Pageable pageable);

        Page<EmergencyEntity> findByBoundaryNumAndInpDttmBetween(Integer boundaryNum, Date start, Date end,
                        Pageable pageable);

        List<EmergencyEntity> findByInpDttmBetweenOrderByInpDttmAsc(Date start, Date end);

        List<EmergencyEntity> findByCctvCodeAndInpDttmBetweenOrderByInpDttmAsc(String cctvCode, Date start, Date end);

        @Query(value = """
                        SELECT DATE(inp_dttm) AS day, COUNT(*) AS cnt
                        FROM tb_emergency_log
                        WHERE inp_dttm BETWEEN :start AND :end
                          AND (:cctvCode IS NULL OR cctvCode = :cctvCode)
                        GROUP BY day ORDER BY day
                        """, nativeQuery = true)
        List<Object[]> countByDay(@Param("start") Date start, @Param("end") Date end,
                        @Param("cctvCode") String cctvCode);

        @Query(value = """
                        SELECT YEARWEEK(inp_dttm, 1) AS week, COUNT(*) AS cnt
                        FROM tb_emergency_log
                        WHERE inp_dttm BETWEEN :start AND :end
                          AND (:cctvCode IS NULL OR cctvCode = :cctvCode)
                        GROUP BY week ORDER BY week
                        """, nativeQuery = true)
        List<Object[]> countByWeek(@Param("start") Date start, @Param("end") Date end,
                        @Param("cctvCode") String cctvCode);

        @Query(value = """
                        SELECT DATE_FORMAT(inp_dttm, '%y.%m') AS month, COUNT(*) AS cnt
                        FROM tb_emergency_log
                        WHERE inp_dttm BETWEEN :start AND :end
                          AND (:cctvCode IS NULL OR cctvCode = :cctvCode)
                        GROUP BY month ORDER BY month
                        """, nativeQuery = true)
        List<Object[]> countByMonth(@Param("start") Date start, @Param("end") Date end,
                        @Param("cctvCode") String cctvCode);

        @Query(value = """
                        SELECT COALESCE(boundaryNum, 0) AS zone, COUNT(*) AS cnt
                        FROM tb_emergency_log
                        WHERE inp_dttm BETWEEN :start AND :end
                          AND (:cctvCode IS NULL OR cctvCode = :cctvCode)
                        GROUP BY zone ORDER BY zone
                        """, nativeQuery = true)
        List<Object[]> countByZone(@Param("start") Date start, @Param("end") Date end,
                        @Param("cctvCode") String cctvCode);

        @Query(value = """
                        SELECT cctvCode, COUNT(*) AS cnt
                        FROM tb_emergency_log
                        WHERE inp_dttm BETWEEN :start AND :end
                          AND cctvCode IS NOT NULL AND cctvCode != ''
                          AND (:cctvCode IS NULL OR cctvCode = :cctvCode)
                        GROUP BY cctvCode ORDER BY cnt DESC
                        """, nativeQuery = true)
        List<Object[]> countByCctv(@Param("start") Date start, @Param("end") Date end,
                        @Param("cctvCode") String cctvCode);
}
