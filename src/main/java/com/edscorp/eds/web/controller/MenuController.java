package com.edscorp.eds.web.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.edscorp.eds.cctv.service.CctvManagementService;
import com.edscorp.eds.mqtt.dto.EmergencyLogRowDTO;
import com.edscorp.eds.mqtt.service.EmergencyService;
import com.edscorp.eds.speaker.domain.SpeakerStatusEntity;
import com.edscorp.eds.speaker.service.SpeakerService;
import com.edscorp.eds.speaker.typeb.domain.SpkDisaster;
import com.edscorp.eds.speaker.typeb.service.SpkConfigService;
import com.edscorp.eds.speaker.typeb.service.SpkDisasterService;
import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@RequestMapping(value = "/menu")
@Slf4j
public class MenuController {

    private final CctvManagementService cctvManagementService;
    private final UserService userService;
    private final SpeakerService speakerService;
    private final SpkDisasterService spkDisasterService;
    private final SpkConfigService spkConfigService;
    private final EmergencyService emergencyService;

    @GetMapping("/dashboard")
    public String showMainPage(Model model) {
        model.addAttribute("title", "SafeSystem");
        model.addAttribute("currentPage", "dashboard");
        return "page/dashboard";
    }

    @GetMapping("/equipment2")
    public String showEquipmentPage2(Model model) {
        model.addAttribute("title", "SafeSystem");
        model.addAttribute("currentPage", "equipment2");
        return "page/menu/equipment/equipmentPage2";
    }

    @GetMapping("/equipment")
    public String showEquipmentPage(
            @RequestParam(value = "view", required = false, defaultValue = "speaker") String view, Model model) {
        model.addAttribute("title", "SafeSystem");
        model.addAttribute("currentPage", "equipment");
        model.addAttribute("view", view);
        model.addAttribute("currentMenu", "speaker");
        // model.addAttribute("deviceList", menuService.getAlldevices());

        // model.addAttribute("speakerList", spkConfigService.getList());
        model.addAttribute("broadcastList", speakerService.getBroadcastList());

        // switch (view) {
        // case "speaker":

        // break;

        // case "cctv":
        // model.addAttribute("cctvList", cctvService.getAllCCTVList());
        // return "page/menu/cctvListPage";
        // }
        // if(view.equals("speaker")) {

        // } else {
        // model.addAttribute("cctvList", cctvService.getAllCCTVList());
        // }
        return "page/menu/equipmentPage";
    }

    @GetMapping("/cctv")
    public String showCctvPage(@RequestParam(value = "view", required = false, defaultValue = "cctv") String view,
            Model model) {
        model.addAttribute("title", "SafeSystem");
        model.addAttribute("currentPage", "cctv");
        model.addAttribute("cctvList", cctvManagementService.getAllCCTVList());
        return "page/menu/cctvListPage";
    }

    @GetMapping("/speaker/detail")
    @ResponseBody
    public List<SpeakerStatusEntity> getBySpeakerCode(
            @RequestParam("locationCode") String locationCode,
            @RequestParam("speakerCode") String speakerCode) {
        log.info("Controller - locationCode: {}", locationCode);
        log.info("Controller - speakerCode: {}", speakerCode);
        return speakerService.getDetailsByCode(locationCode, speakerCode);
    }

    @GetMapping("/situation")
    public String showHistoryPage(
            @RequestParam(value = "view", required = false, defaultValue = "situation") String view, Model model) {
        model.addAttribute("title", "SafeSystem");
        model.addAttribute("currentPage", "situation");
        model.addAttribute("view", view);
        model.addAttribute("currentMenu", "situation");
        switch (view) {
            case "situation":
                break;
            case "broadcast":
                break;
            case "special":
                break;
        }
        return "page/menu/situationPage";
    }

    @GetMapping("/situation/emergency/search")
    @ResponseBody
    public Map<String, Object> searchEmergency(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "15") int size,
            @RequestParam(name = "boundaryNum", required = false) Integer boundaryNum,
            @RequestParam(name = "from", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime to) {
        Page<EmergencyLogRowDTO> result = emergencyService.search(boundaryNum, from, to, page, size);

        return Map.of(
                "page", page,
                "pageSize", size,
                "totalCount", result.getTotalElements(),
                "items", result.getContent());
    }

    @GetMapping("/settings")
    public String showSettingPage(@RequestParam(value = "view", required = false, defaultValue = "user") String view,
            Model model) {
        model.addAttribute("title", "SafeSystem");
        model.addAttribute("currentPage", "settings");
        model.addAttribute("view", view);
        model.addAttribute("currentMenu", "user");
        List<UserEntity> userList = userService.getAllUsers();

        switch (view) {
            case "user":
                model.addAttribute("userList", userList);
                model.addAttribute("userCount", userList.size());
                break;
            case "ment":
                List<SpkDisaster> disasterList = spkDisasterService.getAllDisasters();

                model.addAttribute("disasterList", disasterList);
                model.addAttribute("disasterCount", disasterList.size());
                break;
            case "sms":
                model.addAttribute("userList", userList);
                model.addAttribute("userCount", userList.size());

                break;
            case "schedule":
                log.info("BGM/스케줄 관리 화면 진입");
                // 스케줄 데이터는 setting_schedule.js 에서 /api/btype/schedule/list 로 로드
                break;
            case "set":
                break;
        }
        return "page/menu/settingPage";
    }

}
