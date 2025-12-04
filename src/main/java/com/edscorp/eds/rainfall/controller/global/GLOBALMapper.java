package com.edscorp.eds.rainfall.controller.global;


import org.springframework.stereotype.Repository;

import com.edscorp.eds.rainfall.vo.global.RAINDATALISTVO;
import com.edscorp.eds.rainfall.vo.global.RAINDATAMONTHLISTVO;
import com.edscorp.eds.rainfall.vo.global.RAINDEVICELISTVO;
import com.edscorp.eds.rainfall.vo.global.RAINWATERLEVELVO;
import com.edscorp.eds.rainfall.vo.global.RAINDAYVO;

import java.util.List;
import java.util.Map;

@Repository
public interface GLOBALMapper {
    public List<RAINDATALISTVO> selectRainData(Map<String, Object> map) throws Exception;
    public List<RAINWATERLEVELVO> selectWaterlevelDate(Map<String, Object> map) throws Exception;
    public List<RAINDATAMONTHLISTVO> selectRainMonth(Map<String, Object> map) throws Exception;
    public List<RAINDEVICELISTVO> selectDevice(Map<String, Object> map) throws Exception;
    public List<RAINDAYVO> selectRainDataDay(Map<String, Object> map) throws Exception;
    public List<RAINDAYVO> selectRainDataMon(Map<String, Object> map) throws Exception;
    public List<RAINDAYVO> selectRainDataYear(Map<String, Object> map) throws Exception;
    //public List<RAINDATALISTVO> selectRainDataMon(Map<String, Object> map) throws Exception;
}