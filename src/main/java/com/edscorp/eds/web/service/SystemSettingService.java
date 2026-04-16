package com.edscorp.eds.web.service;

import java.time.LocalDateTime;
import java.util.Objects;

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
            SystemSetting s = new SystemSetting();
            s.setId(1L);
            s.setAutoApproval(false);
            s.setMode(0);
            s.setMedia("cable");
            s.setType("tts");
            s.setMapApiKey("");
            s.setRiskMode(0);
            s.setRiskSec(60);
            s.setRiskAutoBcast(false);
            s.setUpdatedAt(LocalDateTime.now());
            return systemSettingRepository.save(s);
        });
    }

    public SystemSetting updateSetting(SystemSetting input) {
        SystemSetting current = getSetting();

        boolean unchanged = current.isAutoApproval() == input.isAutoApproval()
                && current.getMode() == input.getMode()
                && Objects.equals(current.getMedia(), input.getMedia())
                && Objects.equals(current.getType(), input.getType())
                && Objects.equals(current.getMapApiKey(), input.getMapApiKey())
                && current.getRiskMode() == input.getRiskMode()
                && current.getRiskSec() == input.getRiskSec()
                && current.isRiskAutoBcast() == input.isRiskAutoBcast();

        if (unchanged) {
            return current;
        }

        input.setId(1L);
        input.setUpdatedAt(LocalDateTime.now());
        return systemSettingRepository.save(input);
    }
}
