package com.edscorp.eds.user.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edscorp.eds.user.dto.UserSmsUpdateRequest;
import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserSmsService {
    private final UserRepository userRepository;

    public UserEntity updateSmsSetting(String userId, UserSmsUpdateRequest req) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String enabled = yn(req.getAlertEnabledYn(), user.getAlertEnabledYn());
        String eventYn = yn(req.getEventAlertYn(), user.getEventAlertYn());
        String warnYn = yn(req.getWarnAlertYn(), user.getWarnAlertYn());

        // 정책: enabled가 N이면 하위도 N 강제
        if ("N".equals(enabled)) {
            eventYn = "N";
            warnYn = "N";
        }

        user.setAlertEnabledYn(enabled);
        user.setEventAlertYn(eventYn);
        user.setWarnAlertYn(warnYn);
        user.setUpdDttm(LocalDateTime.now());

        return user;
    }

    public void disableBatch(List<String> userIds) {
        if (userIds == null || userIds.isEmpty())
            return;

        LocalDateTime now = LocalDateTime.now();

        for (String id : userIds) {
            if (id == null || id.isBlank())
                continue;

            UserEntity user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

            user.setAlertEnabledYn("N");
            user.setEventAlertYn("N");
            user.setWarnAlertYn("N");
            user.setUpdDttm(now);
        }
    }

    /** null/공백이면 기존값 유지, 그 외는 Y/N으로 정규화 */
    private String yn(String v, String fallback) {
        if (v == null)
            return fallback;
        String s = v.trim().toUpperCase();
        if (s.isEmpty())
            return fallback;
        if (s.equals("Y") || s.equals("YES") || s.equals("TRUE") || s.equals("1"))
            return "Y";
        if (s.equals("N") || s.equals("NO") || s.equals("FALSE") || s.equals("0"))
            return "N";
        return fallback; // 이상값은 기존 유지
    }
}
