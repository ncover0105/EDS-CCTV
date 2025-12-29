package com.edscorp.eds.user.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmsDisableBatchRequest {
    private List<String> userIds;
}
