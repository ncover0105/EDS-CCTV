package com.edscorp.eds.web.controller;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.edscorp.eds.cctv.service.CctvService;
import com.edscorp.eds.speaker.domain.BroadcastListEntity;
import com.edscorp.eds.speaker.domain.SpeakerStatusEntity;
import com.edscorp.eds.speaker.dto.ScheduleDetailDTO;
import com.edscorp.eds.speaker.service.BroadcastScheduleService;
import com.edscorp.eds.speaker.service.SpeakerService;
import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@RequestMapping(value = "/menu")
@Slf4j
public class MenuController {

    private final CctvService cctvService;
    private final UserService userService;
    private final SpeakerService speakerService;
    private final BroadcastScheduleService broadcastScheduleService;

    @GetMapping("/dashboard")
    public String showMainPage(Model model) {
        model.addAttribute("title", "EDS-DashBoard");
        model.addAttribute("currentPage", "dashboard");
        return "page/dashboard";
    }

    @GetMapping("/equipment")
    public String showEquipmentPage(
            @RequestParam(value = "view", required = false, defaultValue = "speaker") String view, Model model) {
        model.addAttribute("title", "EDS");
        model.addAttribute("currentPage", "equipment");
        model.addAttribute("view", view);
        model.addAttribute("currentMenu", "speaker");
        // model.addAttribute("deviceList", menuService.getAlldevices());

        model.addAttribute("speakerList", speakerService.getSpeakerList());
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
        model.addAttribute("title", "EDS");
        model.addAttribute("currentPage", "cctv");
        model.addAttribute("cctvList", cctvService.getAllCCTVList());
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
        model.addAttribute("title", "EDS");
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

    @GetMapping("/settings")
    public String showSettingPage(@RequestParam(value = "view", required = false, defaultValue = "user") String view,
            Model model) {
        model.addAttribute("title", "EDS");
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
                List<BroadcastListEntity> broadcastList = speakerService.getBroadcastList();
                model.addAttribute("broadcastList", broadcastList);
                model.addAttribute("broadcastCount", broadcastList.size());
                break;
            case "sms":
                model.addAttribute("userList", userList);
                model.addAttribute("userCount", userList.size());

                break;
            case "bgm":
                log.info("BGM/스케줄 관리 화면 진입");
                List<ScheduleDetailDTO> scheduleList = broadcastScheduleService.getAllScheduleSpeakers();
                log.info("스케줄 조회 - 총 {} 개", scheduleList.size());
                if (scheduleList.isEmpty()) {
                    log.warn("등록된 스케줄이 없습니다.");
                } else {
                    log.info("========== 스케줄 상세 정보 ==========");
                    scheduleList.forEach(schedule -> {
                        log.info("┌─ 스케줄 ID: {}", schedule.getScheduleId());
                        log.info("├─ 스케줄명: {}", schedule.getScheduleName());
                        log.info("├─ 재생타입: {}", schedule.getPlayType());
                        log.info("├─ 폴더명: {}", schedule.getFolderName());
                        log.info("├─ 시작시간: {}", schedule.getStartTime());
                        log.info("├─ 종료시간: {}", schedule.getEndTime());
                        log.info("├─ 반복설정: {}", schedule.getRepeatEnabled());

                        // 주간 반복 일정
                        Map<String, Boolean> weekSchedule = schedule.getWeekSchedule();
                        log.info("├─ 주간반복: Sun:{}, Mon:{}, Tue:{}, Wed:{}, Thu:{}, Fri:{}, Sat:{}",
                                weekSchedule.get("sun"), weekSchedule.get("mon"), weekSchedule.get("tue"),
                                weekSchedule.get("wed"), weekSchedule.get("thu"), weekSchedule.get("fri"),
                                weekSchedule.get("sat"));

                        // 스피커 정보
                        log.info("├─ 스피커코드: {}", schedule.getSpeakerCode());
                        log.info("├─ 스피커명: {}", schedule.getSpeakerName());
                        log.info("├─ 설치주소: {}", schedule.getInstallAddress());
                        log.info("├─ 연락처: {}", schedule.getPhone());
                        log.info("├─ 연결상태: {}", schedule.getConnStat());
                        log.info("└─ 수신시간: {}", schedule.getRecvTime());
                        log.info("└─ 생성시간: {}", schedule.getCreatedAt());

                        log.info(""); // 빈 줄로 스케줄 간 구분
                    });
                    log.info("====================================");
                }
                model.addAttribute("scheduleList", scheduleList);
                break;
            case "setting":
                break;
        }
        return "page/menu/settingPage";
    }

}
