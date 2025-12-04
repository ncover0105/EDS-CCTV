package com.edscorp.eds.cctv.stream;
// package com.edscorp.eds.service;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Component;

// import lombok.extern.slf4j.Slf4j;

// import java.io.*;
// import java.util.Map;
// import java.util.concurrent.*;

// @Slf4j
// @Component
// public class GstProcessManager {

// //gstreamer.base-path:/usr/bin/gst-launch-1.0
// @Value("${gstreamer.base-path}")
// private String gstBasePath;

// @Value("${janus.host:}")
// private String janusHost;

// private final Map<String, Process> runningProcesses = new
// ConcurrentHashMap<>();

// // public boolean start(String key,
// // String rtspUrl,
// // int port,
// // int latency,
// // boolean dropOnLatency,
// // int queueSize) {
// public boolean start(String key, String rtspUrl, int port) {
// try {
// stop(key);
// // String pipeline = String.format(
// // "%s -v rtspsrc location=\"%s\" protocols=tcp latency=100 ! " +
// // "rtph264depay ! h264parse ! rtph264pay config-interval=1 pt=96 ! " +
// // "queue ! udpsink host=%s port=%d",
// // gstBasePath, rtspUrl, janusHost, port);

// String protocols = "udp";
// // String drop = dropOnLatency ? "drop-on-latency=true" :
// "drop-on-latency=false";

// // String[] cmd = {
// // "wsl", // WSL 실행
// // "-d", "Ubuntu-24.04", // 명시적 배포판 지정
// // "--exec", // 이후 명령을 WSL 내에서 직접 실행
// // "/usr/bin/gst-launch-1.0",// 실행할 바이너리
// // "-v",
// // "rtspsrc", "location=\"" + rtspUrl + "\"", "protocols=tcp", "latency=100",
// // "!", "rtph264depay", "!", "h264parse", "config-interval=1", "!",
// "rtph264pay", "config-interval=1", "pt=96",
// // "!", "queue", "!",
// // "udpsink", "host=" + janusHost, "port=" + port
// // };
// long ssrc = computeSsrcFromKey(key);
// String[] cmd = {
// "wsl", "-d", "Ubuntu-24.04", "--exec",
// "/usr/bin/gst-launch-1.0", "-v",

// // 1) RTSP 수신 (TCP로 안정성 확보)
// "rtspsrc",
// "location=" + rtspUrl,
// "protocols=tcp",
// "latency=60",
// "!",

// // 2) H.264 추출 후 RTP 패킷화
// "rtph264depay", "!",
// "h264parse", "config-interval=1", "!",
// "rtph264pay",
// "pt=96",
// "mtu=1200",
// "config-interval=1",
// "ssrc=" + ssrc,
// "!",

// // 3) UDP 전송
// "queue", "!",
// "udpsink",
// "host=" + janusHost,
// "port=" + port,
// "sync=false",
// "async=false",
// "qos=false",
// // "buffer-size=524288"
// };

// // String[] cmd = {
// // "wsl", "-d", "Ubuntu-24.04", "--exec",
// // gstBasePath,
// // "-v",
// // "rtspsrc", "location=" + rtspUrl, "protocols=" + protocols,
// // "latency=" + latency, drop, "!",
// // "rtph264depay", "!",
// // "h264parse", "!",
// // "rtph264pay", "config-interval=1", "pt=96", "!",
// // "queue", "max-size-buffers=" + queueSize, "leaky=downstream", "!",
// // "udpsink", "host=" + janusHost, "port=" + port,
// // "sync=false", "async=false", "qos=false"
// // };

// log.info("[{}] GStreamer cmd: {}", key, String.join(" ", cmd));
// // log.info("pipeline : {}", pipeline);
// // ProcessBuilder pb = new ProcessBuilder("wsl", "bash", "-lc", pipeline);
// ProcessBuilder pb = new ProcessBuilder(cmd);
// pb.redirectErrorStream(true);
// Process p = pb.start();
// runningProcesses.put(key, p);

// // 로그 모니터링 쓰레드
// new Thread(() -> {
// try (BufferedReader reader = new BufferedReader(
// new InputStreamReader(p.getInputStream()))) {
// String line;
// while ((line = reader.readLine()) != null) {
// log.debug("[GStreamer:{}] {}", key, line);
// }
// } catch (IOException e) {
// log.error("[{}] GStreamer 출력 읽기 오류", key, e);
// }
// }, "gst-logger-" + key).start();
// // log.info("[{}] GStreamer 시작: RTSP={} → UDP:{}, latency={},
// dropOnLatency={}, queueSize={}",
// // key, rtspUrl, port, latency, dropOnLatency, queueSize);
// return true;
// } catch (IOException e) {
// log.error("GStreamer 시작 오류: {}", e.getMessage());
// return false;
// }
// }

// public void stop(String key) {
// Process p = runningProcesses.remove(key);
// if (p != null && p.isAlive()) {
// p.destroyForcibly();
// log.info("GStreamer 중지: {}", key);
// }
// }

// /**
// * 카메라 식별 키를 해싱하여 32비트 유니크 SSRC 생성
// */
// private long computeSsrcFromKey(String key) {
// // Java String hashCode는 32비트 정수. 음수일 수 있으므로 unsigned 처리
// int hash = key.hashCode();
// // 상위 8비트에 고정 마커(0xA0) 삽입 → 충돌 범위 축소
// long ssrc = ((hash & 0x00FFFFFF) | 0xA0000000L) & 0xFFFFFFFFL;
// return ssrc;
// }
// }