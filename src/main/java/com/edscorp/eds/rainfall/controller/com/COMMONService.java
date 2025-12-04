package com.edscorp.eds.rainfall.controller.com;

import com.edscorp.eds.rainfall.vo.com.COMMCDVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class COMMONService {

	@Autowired
	private COMMONMapper commonMapper;

	public String getSmart1stAvenueToday(Map<String, Object> map) throws Exception
	{
		return commonMapper.getSmart1stAvenueToday(map);
	}

	public List<COMMCDVO> selectCOMMCD(Map<String, Object> map) throws Exception
	{
		List<COMMCDVO> result = commonMapper.selectCOMMCD(map);
		return result;
	}

	public void insertACCLOG (Map<String, Object> map) throws Exception{
		commonMapper.insertACCLOG(map);
	}

	public String getToday(Map<String, Object> map) throws Exception
	{
		return commonMapper.getToday(map);
	}

	public String getFirstday(Map<String, Object> map) throws Exception
	{
		return commonMapper.getFirstday(map);
	}

	public String getLastday(Map<String, Object> map) throws Exception
	{
		return commonMapper.getLastday(map);
	}

	public String getFirstYear(Map<String, Object> map) throws Exception
	{
		return commonMapper.getFirstYear(map);
	}

	public String getLastYear(Map<String, Object> map) throws Exception
	{
		return commonMapper.getLastYear(map);
	}

	public int selectDATEDIFF(Map<String, Object> map) throws Exception
	{
		return commonMapper.selectDATEDIFF(map);
	}
}
