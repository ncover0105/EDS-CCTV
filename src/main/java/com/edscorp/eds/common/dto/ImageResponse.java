package com.edscorp.eds.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageResponse {
    private String item;
    private String fileName;

    /**
     * 빈 응답 객체 (null 방지용)
     */
    public static ImageResponse empty() {
        return new ImageResponse("", "");
    }

}
