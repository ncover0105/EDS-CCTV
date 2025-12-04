package com.edscorp.eds.speaker.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

import org.springframework.integration.sftp.session.DefaultSftpSessionFactory;
import org.springframework.integration.sftp.session.SftpRemoteFileTemplate;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SpeakerSftpService {

    public boolean sendAudioFile(String host, int port, String user, String password,
            File audioFile, String remoteDir) {
        boolean success = false;

        DefaultSftpSessionFactory factory = new DefaultSftpSessionFactory(true);
        factory.setHost(host);
        factory.setPort(port);
        factory.setUser(user);
        factory.setPassword(password);
        factory.setAllowUnknownKeys(true);

        SftpRemoteFileTemplate template = new SftpRemoteFileTemplate(factory);

        try {
            template.execute(session -> {
                try (InputStream inputStream = new FileInputStream(audioFile)) {
                    String remotePath = remoteDir + "/" + audioFile.getName();
                    session.write(inputStream, remotePath);

                    // 업로드 검증
                    if (session.exists(remotePath)) {
                        log.info("✅ SFTP 전송 성공: {} → {}", host, remotePath);
                    } else {
                        throw new RuntimeException("업로드 검증 실패 - 서버에 파일이 존재하지 않습니다.");
                    }
                }
                return null;
            });

            success = true;

        } catch (Exception e) {
            log.error("❌ 스피커({}) 파일 전송 실패: {}", host, e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("➡️ 상세 원인: {}", e.getCause().toString());
            }
            success = false;
        } finally {
            // 세션 종료
            try {
                factory.destroy();
            } catch (Exception e) {
                log.warn("⚠️ SFTP 세션 종료 중 예외 발생: {}", e.getMessage());
            }
        }

        return success;
    }
}