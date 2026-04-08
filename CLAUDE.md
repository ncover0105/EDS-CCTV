# CLAUDE.md

## 기본 응답 규칙
- 항상 한국어로 답변한다.
- 설명, 분석, 계획, 요약, 리뷰 코멘트는 모두 한국어로 작성한다.
- 코드 블록 내부 식별자, 라이브러리명, 함수명, 클래스명은 원문을 유지한다.
- 에러 메시지, 로그, HTTP 응답 원문은 원문을 유지하고, 해설만 한국어로 작성한다.
- 사용자가 영어 답변을 명시적으로 요청한 경우에만 영어로 답한다.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Build the project
./gradlew build

# Build without tests
./gradlew build -x test

# Run the application
./gradlew bootRun

# Run tests
./gradlew test

# Run a single test class
./gradlew test --tests "com.edscorp.eds.ClassName"

# Clean build
./gradlew clean build
```

## Architecture Overview

This is a **Spring Boot 3.4.1 monolithic web application** (Java 17) for CCTV surveillance and emergency broadcasting. It uses server-side rendering via Thymeleaf templates and AdminLTE 3.2.0 as the UI framework.

### Module Structure (`src/main/java/com/edscorp/eds/`)

| Module | Package | Purpose |
|--------|---------|---------|
| CCTV | `cctv/` | Camera stream management via Janus WebRTC gateway and GStreamer |
| MQTT | `mqtt/` | IoT device communication, emergency alerts, boundary/power status |
| Speaker | `speaker/` | Two-type broadcast system (Type A generic, Type B daemon-based) |
| TTS | `tts/` | Text-to-speech message management |
| User | `user/` | Authentication, session management, SMS |
| Weather | `weather/` | Korea Meteorological Administration API + Air Korea API |
| Web | `web/` | Core web controllers (main, login, home) |
| Common | `common/` | SecurityConfig, WebSocketConfig, MqttConfig, utilities |

### Key Architectural Points

**CCTV Streaming Pipeline:** RTSP camera → GStreamer (Node.js control server) → Janus Gateway (WebRTC SFU) → Browser via WebSocket/JSMPEG

**Speaker Types:**
- **Type A:** Generic speakers managed via SFTP file transfer (`SpeakerSftpService`)
- **Type B:** Daemon-controlled speakers with direct command protocol (`BTypeCommandService`, `BTypeSpkService`)

**Real-time Communication:**
- WebSocket for UI live updates (`WebSocketConfig`)
- MQTT (Eclipse Paho, broker at `localhost:1883`) for device-to-server messaging — topics: `cctv/req`, `cctv/setBoundary`, `send/powerStatus`, `send/emergency`
- Janus WebSocket for WebRTC signaling

**Database:** MariaDB at `edscorp.iptime.org:3131` accessed via both JPA/Hibernate and MyBatis.

**External Integrations:**
- Janus Media Server (WebRTC gateway)
- GStreamer via Node.js API server
- FFmpeg/FFprobe for video processing
- Korea Meteorological Administration weather API
- Air Korea air quality API

### Frontend Stack

Templates are in `src/main/resources/templates/`:
- `layout/` — base layouts
- `page/` — full page views
- `fragments/` — reusable components and modals (including `modal/` subdirectory)
- `error/` — 401, 404, 500 pages

Static assets in `src/main/resources/static/` + external path `C:/data/app/static/`:
- `js/module/`, `js/page/`, `js/speaker/`, `js/util/` — organized JS modules
- `audio/` — alert and broadcast sound files

**Libraries used client-side:** jQuery 3.6.4, Bootstrap 4.6.2, DataTables, Chart.js, SweetAlert2, Select2, FullCalendar, Toastr, JSMPEG (for video streaming in browser).

### Security

Spring Security with custom handlers. `SecurityAutoConfiguration` is excluded from auto-config. Passwords use BCrypt. AES256 and SHA256 utilities are in `common/`.

### Scheduled Tasks

The main class (`EdsApplication`) enables `@EnableAsync`, `@EnableScheduling`, and `@EnableCaching`. `CctvProcWatchdog` is the primary scheduled component monitoring stream health.
