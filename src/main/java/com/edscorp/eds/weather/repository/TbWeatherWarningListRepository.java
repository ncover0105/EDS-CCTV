package com.edscorp.eds.weather.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.edscorp.eds.weather.dto.TbWeatherWarningList;
import com.edscorp.eds.weather.dto.TbWeatherWarningListKey;

public interface TbWeatherWarningListRepository extends JpaRepository<TbWeatherWarningList, TbWeatherWarningListKey> {
    @Query(value = """
            SELECT *
            FROM tb_weather_warning_list
            WHERE (:stn IS NULL OR STN = :stn)
                AND (:wrn IS NULL OR WRN = :wrn)
                AND (:lvl IS NULL OR LVL = :lvl)
                AND (:cmd IS NULL OR CMD = :cmd)
                AND (:regId IS NULL OR REG_ID = :regId)
                AND (
                    :start IS NULL OR STR_TO_DATE(TM_IN, '%Y%m%d%H%i') >= :start
                )
                AND (
                    :end IS NULL OR STR_TO_DATE(TM_IN, '%Y%m%d%H%i') <= :end
                )
            ORDER BY TM_IN DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<TbWeatherWarningList> search(
            @Param("stn") String stn,
            @Param("wrn") String wrn,
            @Param("lvl") String lvl,
            @Param("cmd") String cmd,
            @Param("regId") String regId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("limit") int limit);

    boolean existsByIdStnAndIdRegIdAndIdWrnAndTmFcAndTmEfAndLvlAndCmd(
            String stn,
            String regId,
            String wrn,
            String tmFc,
            String tmEf,
            String lvl,
            String cmd);

    boolean existsByIdStnAndIdRegIdAndIdWrnAndTmFcAndTmEfAndLvlAndCmdAndCreatedAtBetween(
            String stn,
            String regId,
            String wrn,
            String tmFc,
            String tmEf,
            String lvl,
            String cmd,
            LocalDateTime start,
            LocalDateTime end);
}
