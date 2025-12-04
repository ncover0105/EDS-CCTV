package com.edscorp.eds.rainfall.controller.global;


import com.edscorp.eds.rainfall.vo.global.RAINDATALISTVO;
import com.edscorp.eds.rainfall.vo.global.RAINWATERLEVELVO;
import com.edscorp.eds.rainfall.vo.global.RAINDEVICELISTVO;
import com.edscorp.eds.rainfall.vo.global.RAINDAYVO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class GLOBALService {
    
    @Autowired
    private GLOBALMapper globalMapper;

    public List<RAINDATALISTVO> selectRainData(Map<String, Object> map) throws Exception {
        List<RAINDATALISTVO> result = globalMapper.selectRainData(map);
        return result;
    }
    public List<RAINWATERLEVELVO> selectWaterlevelDate(Map<String, Object> map) throws Exception {
        List<RAINWATERLEVELVO> result = globalMapper.selectWaterlevelDate(map);
        return result;
    }
    public List<RAINDAYVO> selectRainDataDay(Map<String, Object> map) throws Exception {
        List<RAINDAYVO> result = globalMapper.selectRainDataDay(map);
        return result;
    }
    public List<RAINDAYVO> selectRainDataMon(Map<String, Object> map) throws Exception {
        List<RAINDAYVO> result = globalMapper.selectRainDataMon(map);
        return result;
    }
    public List<RAINDAYVO> selectRainDataYear(Map<String, Object> map) throws Exception {
        List<RAINDAYVO> result = globalMapper.selectRainDataYear(map);
        return result;
    }
    public List<RAINDEVICELISTVO> selectDevice(Map<String, Object> map) throws Exception {
        List<RAINDEVICELISTVO> result = globalMapper.selectDevice(map);
        return result;
    }

}
