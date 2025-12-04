package com.edscorp.eds.web.service;

import java.util.List;

import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

import com.edscorp.eds.common.domain.DeviceInfoEntity;
import com.edscorp.eds.web.repository.DeviceInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@EnableAsync
public class DeviceService {
    private final DeviceInfoRepository deviceInfoRepository;

    // --- 장비 리스트 조회 ---
    public List<DeviceInfoEntity> getAlldevices() {
        log.info("getAlldevices : ", deviceInfoRepository.findAll());
        return deviceInfoRepository.findAll();
    }

}
