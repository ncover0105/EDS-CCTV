package com.edscorp.eds.common.config;

import java.sql.Connection;
import javax.sql.DataSource;
// Spring Boot 3.x에서는 jakarta.persistence 사용, 2.x에서는 javax.persistence 사용
import jakarta.persistence.EntityManagerFactory;
// import javax.persistence.EntityManagerFactory; // Spring Boot 2.x인 경우
import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.DefaultTransactionStatus;

// @Configuration
@Slf4j
public class DatabaseConfig {

    // 데이터베이스 연결 상태를 저장할 프로퍼티
    private static boolean databaseConnectionAvailable = false;

    // 데이터베이스 연결 상태 확인 메서드
    public static boolean isDatabaseAvailable() {
        return databaseConnectionAvailable;
    }

    @Bean
    public DataSource dataSource(DataSourceProperties properties) {
        try {
            DataSource dataSource = properties.initializeDataSourceBuilder().build();

            // 데이터베이스 연결 테스트
            try (Connection conn = dataSource.getConnection()) {
                databaseConnectionAvailable = true;
                log.info("데이터베이스 연결 성공");
            }

            return dataSource;
        } catch (Exception e) {
            log.error("데이터베이스 연결 실패: {}", e.getMessage());
            databaseConnectionAvailable = false;

            // 테스트용 더미 데이터소스 반환 (실제로는 사용되지 않음)
            return new EmbeddedDatabaseBuilder()
                    .setType(EmbeddedDatabaseType.H2)
                    .build();
        }
    }

    @Bean
    @ConditionalOnProperty(name = "spring.datasource.enabled", havingValue = "true", matchIfMissing = true)
    public JpaTransactionManager transactionManager(EntityManagerFactory emf) {
        if (!databaseConnectionAvailable) {
            log.warn("데이터베이스 연결 불가: 트랜잭션 관리자 비활성화");
            return new NoOpTransactionManager();
        }
        return new JpaTransactionManager(emf);
    }

    // 더미 트랜잭션 매니저 (DB 연결 실패 시 사용)
    public static class NoOpTransactionManager extends JpaTransactionManager {
        private static final long serialVersionUID = 1L;

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
            log.debug("DB없이 실행 중: 트랜잭션 시작 무시");
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
            log.debug("DB없이 실행 중: 커밋 무시");
        }

        @Override
        protected Object doSuspend(Object transaction) {
            return null;
        }

        @Override
        protected void doResume(Object transaction, Object suspendedResources) {
            // 아무 작업도 하지 않음
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
            log.debug("DB없이 실행 중: 롤백 무시");
        }
    }

}
