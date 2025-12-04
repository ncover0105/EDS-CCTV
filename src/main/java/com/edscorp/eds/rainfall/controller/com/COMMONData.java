package com.edscorp.eds.rainfall.controller.com;

import com.edscorp.eds.rainfall.vo.com.COMMCDVO;
//import com.springboot.myapp.util.SessionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class COMMONData {
    private Map<String, String> commCdNmMap = new HashMap<>();

    @Autowired
    private COMMONMapper commonMapper;

    public void init() throws Exception {
        Map<String, Object> params = new HashMap<>();
        //params.put("corpCd", SessionUtil.getUser().getCorpCd()); // 실제 corpCd 값을 설정
        loadCOMMCDVO(params);
    }

    private void loadCOMMCDVO(Map<String, Object> params) throws Exception {
        List<COMMCDVO> COMMCDVOList = commonMapper.selectCOMMCD(params);
        for (COMMCDVO info : COMMCDVOList) {
            String key = generateKey(info.getGroupCd(), info.getCommCd());
            commCdNmMap.put(key, info.getCommCdNm());
        }
    }

    private String generateKey(String groupCd, String commCd) {
        return groupCd + "#" + commCd;
    }

    public String getCommCdNm(String groupCd, String commCd) {
        String key = generateKey(groupCd, commCd);
        return commCdNmMap.get(key);
    }
}