package com.edscorp.eds.cctv.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class CameraCache {
    private List<Map<String, Object>> cameras = new ArrayList<>();

    public List<Map<String, Object>> getCameras() {
        return cameras;
    }

    public void setCameras(List<Map<String, Object>> cameras) {
        this.cameras = cameras;
    }
}
