package com.edscorp.eds.speaker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastLogItemDto {
    private String timestamp;
    private String message;
    private String level;
}