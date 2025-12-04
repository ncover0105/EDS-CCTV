package com.edscorp.exception;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiErrorResponse {
    private final int status;
    private final String code;
    private final String message;
    private final LocalDateTime timestamp;
}
