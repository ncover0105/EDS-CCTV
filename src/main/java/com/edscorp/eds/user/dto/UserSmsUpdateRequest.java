package com.edscorp.eds.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmsUpdateRequest {
    private String eventAlertYn;
    private String warnAlertYn;
    private String alertEnabledYn;
}
