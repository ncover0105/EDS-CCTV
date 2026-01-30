package com.edscorp.eds.tts.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.edscorp.eds.tts.domain.TtsList;

public interface TtsListRepository extends JpaRepository<TtsList, Long> {
    // Page<TtsList> findByTtsUseFlag(String ttsUseFlag, Pageable pageable);

    // @Query("""
    // select t from TtsList t
    // where lower(t.ttsName) like lower(concat('%', :q, '%'))
    // or lower(t.ttsMsg) like lower(concat('%', :q, '%'))
    // """)
    // Page<TtsList> searchByKeyword(@Param("q") String q, Pageable pageable);

    // @Query("""
    // select t from TtsList t
    // where t.ttsUseFlag = :useFlag
    // and (
    // lower(t.ttsName) like lower(concat('%', :q, '%'))
    // or lower(t.ttsMsg) like lower(concat('%', :q, '%'))
    // )
    // """)
    // Page<TtsList> searchByUseFlagAndKeyword(
    // @Param("useFlag") String useFlag,
    // @Param("q") String q,
    // Pageable pageable);
}
