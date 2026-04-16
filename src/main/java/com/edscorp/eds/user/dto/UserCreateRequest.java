package com.edscorp.eds.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserCreateRequest {
    private String id;
    private String pw;
    private String name;
    private String phnNo;
    private String userRole;
}
