package com.edscorp.exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    /*
     * Developer Custom Exception: 정의된 RestApiException 에러 클래스에 대한 예외 처리
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiErrorResponse> handleCustomException(CustomException ex) {
        ErrorCode errorCode = ex.getErrorCode();

        ApiErrorResponse response = ApiErrorResponse.builder()
            .status(errorCode.getHttpStatus().value())
            .code(errorCode.name())
            .message(errorCode.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception ", ex);

        ApiErrorResponse response = ApiErrorResponse.builder()
            .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus().value())
            .code(ErrorCode.INTERNAL_SERVER_ERROR.name())
            .message(ErrorCode.INTERNAL_SERVER_ERROR.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }


}
