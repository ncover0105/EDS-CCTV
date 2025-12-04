package com.edscorp.eds.rainfall.controller.com;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.edscorp.eds.rainfall.vo.com.COMMCDVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class COMMONController {
    // 공통코드
    @Autowired
    private COMMONService commonService;

    @RequestMapping("/eds/rain/com/selectCOMMCD")
    @ResponseBody
    public Map<String, Object> selectCOMMCD(HashMap<String, Object> map) throws Exception{
        Map<String, Object> hashMap = new HashMap<String, Object>();
        try {
            hashMap.put("data", commonService.selectCOMMCD(map));
        }catch(Exception ex) {
            ex.printStackTrace();
        }
        return hashMap;
    }

    @PostMapping("/eds/rain/com/selectCOMMCDENUM")
    @ResponseBody
    public String selectCOMMCDENUM(@RequestParam Map<String, Object> map) throws Exception{
        ObjectMapper commonCode = new ObjectMapper();
        Map<String, Object> hashMap = new HashMap<String, Object>();
        Map<String, Object> hashMap1 = new HashMap<String, Object>();
        Map<String, Object> hashMap2 = new HashMap<String, Object>();
        try {
            List<COMMCDVO> list = commonService.selectCOMMCD(map);
            List<String> commCdNm = new ArrayList<String>();

            for (int i = 0; i < list.size(); i++) {
                if (!commCdNm.contains(list.get(i).getGroupCd())) {
                    commCdNm.add(list.get(i).getGroupCd());
                }
            }

            for (int i = 0; i < commCdNm.size(); i++) {
                String temp = "";
                String dataName="";
                int cnt = 0;
                for (int k = 0; k < list.size(); k++) {
                    if (commCdNm.get(i).contains(list.get(k).getGroupCd())) {
                        if(cnt == 0){
                            temp = "{\""+list.get(k).getCommCd()+"\":\""+list.get(k).getCommCdNm()+"\"}";
                            dataName ="{\""+list.get(k).getCommCd()+"\":\""+list.get(k).getReserveVal1()+"\"}";
                            cnt++;
                        }else{
                            temp += ",{\""+list.get(k).getCommCd()+"\":\""+list.get(k).getCommCdNm()+"\"}";
                            dataName +=",{\""+list.get(k).getCommCd()+"\":\""+list.get(k).getReserveVal1()+"\"}";
                        }
                    }
                }
                hashMap1.put(commCdNm.get(i), "["+temp+"]");
                hashMap2.put(commCdNm.get(i), "["+dataName+"]");
            }
            hashMap.put("commonCode", hashMap1);
            hashMap.put("iconCode", hashMap2);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return commonCode.writerWithDefaultPrettyPrinter().writeValueAsString(hashMap);
    }

    /* 공통 시스템 시간 */
    @PostMapping("/eds/rain/com/getToday")
    @ResponseBody
    public String getToday(@RequestParam Map<String, Object> map) throws Exception{
        return commonService.getToday(map);
    }
    /* 공통 시스템 시간(밀리세컨드) */
    @PostMapping("/eds/rain/com/getSmart1stAvenueToday")
    @ResponseBody
    public String getSmart1stAvenueToday(@RequestParam Map<String, Object> map) throws Exception{
        return commonService.getSmart1stAvenueToday(map);
    }

    /* 공통 달 첫번째날  */
    @PostMapping("/eds/rain/com/getFirstday")
    @ResponseBody
    public String getFirstday(@RequestParam Map<String, Object> map) throws Exception{
        return commonService.getFirstday(map);
    }

    /* 공통 달 마지막날  */
    @PostMapping("/eds/rain/com/getLastday")
    @ResponseBody
    public String getLastday(@RequestParam Map<String, Object> map) throws Exception{
        return commonService.getLastday(map);
    }

    /* 공통 연 첫번째날  */
    @PostMapping("/eds/rain/com/getFirstYear")
    @ResponseBody
    public String getFirstYear(@RequestParam Map<String, Object> map) throws Exception{
        return commonService.getFirstYear(map);
    }

    /* 공통 연 마지막날  */
    @PostMapping("/eds/rain/com/getLastYear")
    @ResponseBody
    public String getLastYear(@RequestParam Map<String, Object> map) throws Exception{
        return commonService.getLastYear(map);
    }
}
