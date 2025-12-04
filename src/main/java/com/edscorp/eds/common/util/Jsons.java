package com.edscorp.eds.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

// public class Jsons {
//     private static final ObjectMapper om = new ObjectMapper();
//     public static String toJson(Object obj) {
//         try {
//             return om.writeValueAsString(obj);
//         } catch (JsonProcessingException e) {
//             return "{}}";
//         }
//     }
// }

public class Jsons {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static String toString(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }

    public static JsonNode parse(String json) {
        try {
            return mapper.readTree(json);
        } catch (Exception e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }
}