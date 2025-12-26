package com.edscorp.eds.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
    private String id;
    private String pw;
    private String pwConfirm;
    private String name;
    private String email;
    private String phnNo;
}
