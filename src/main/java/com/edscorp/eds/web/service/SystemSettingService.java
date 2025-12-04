package com.edscorp.eds.web.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.edscorp.eds.common.domain.SystemSetting;
import com.edscorp.eds.web.repository.SystemSettingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    public SystemSetting getSetting() {
        return systemSettingRepository.findById(1L).orElseGet(() -> {
            SystemSetting systemSetting = new SystemSetting();
            systemSetting.setId(1L);
            systemSetting.setAutoApproval(false);
            systemSetting.setMode(0);
            systemSetting.setMedia("cable");
            systemSetting.setType("tts");
            systemSetting.setMapApiKey("");
            systemSetting.setUpdatedAt(LocalDateTime.now());
            return systemSettingRepository.save(systemSetting);
        });
    }

    public SystemSetting updateSetting(SystemSetting input) {
        input.setId(1L); // ID 고정
        input.setUpdatedAt(LocalDateTime.now());
        return systemSettingRepository.save(input);
    }
}
