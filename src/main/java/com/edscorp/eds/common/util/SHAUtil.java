package com.edscorp.eds.common.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 단방향 암호화 알고리즘인 SHA 암호화를 지원하는 클래스
 */
public class SHAUtil {

    // SHA-256 암호화
    public String sha256Encode(String data) throws Exception {
        String retVal = "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(data.getBytes("UTF-8"));

            StringBuffer sb = new StringBuffer();

            for (byte b : md.digest())
                sb.append(Integer.toHexString(0xff & b));

            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            System.out.println("shaEncode Error:" + e.toString());
        }
        return retVal;
    }

    // SHA-512 암호화
    public String sha512Encode(String data) throws Exception {
        String retVal = "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            md.update(data.getBytes("UTF-8"));

            StringBuffer sb = new StringBuffer();

            for (byte b : md.digest())
                sb.append(Integer.toHexString(0xff & b));

            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            System.out.println("shaEncode Error:" + e.toString());
        }
        return retVal;
    }
}
