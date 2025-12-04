package com.edscorp.eds.rainfall.controller.global;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSession;
public class SSLUtils {
    public static void disableHostnameVerification() {
        // 호스트 이름 검증 우회를 위한 HostnameVerifier 설정
        HttpsURLConnection.setDefaultHostnameVerifier(new javax.net.ssl.HostnameVerifier() {
            public boolean verify(String hostname, SSLSession sslSession) {
                return true;
            }
        });
    }
}
