package com.edscorp.eds.rainfall.controller.com;

import com.edscorp.eds.rainfall.vo.com.COMMCDVO;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface COMMONMapper {

	public String getSmart1stAvenueToday(Map<String, Object> map) throws Exception;
	public List<COMMCDVO> selectCOMMCD(Map<String, Object> map) throws Exception;

	public void insertACCLOG(Map<String, Object> map) throws Exception;

	public String getToday(Map<String, Object> map) throws Exception;

	public String getFirstday(Map<String, Object> map) throws Exception;

	public String getLastday(Map<String, Object> map) throws Exception;

	public String getFirstYear(Map<String, Object> map) throws Exception;

	public String getLastYear(Map<String, Object> map) throws Exception;

	public int selectDATEDIFF(Map<String, Object> map) throws Exception;
}
