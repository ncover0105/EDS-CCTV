package com.edscorp.eds.rainfall.controller.global;

import org.springframework.scheduling.annotation.Scheduled;

import lombok.extern.slf4j.Slf4j;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.nio.file.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.edscorp.eds.common.util.Util;
import com.edscorp.eds.rainfall.vo.global.O2VO;
import com.edscorp.eds.rainfall.vo.global.RAINAWSLISTVO;
import com.edscorp.eds.rainfall.vo.global.RAINFORECASTLISTVO;
import com.edscorp.eds.rainfall.vo.global.RAINSPEACIALLISTVO;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.net.*;
import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.*;
import java.util.zip.GZIPInputStream;
import javax.net.ssl.*;
import org.springframework.web.util.UriComponentsBuilder;

@Controller
public class GLOBALController {

	@Value("${eds.backs.file.path}")
	private String filePath;

	@Value("${eds.backs.colway}")
	private String colWay;
	private final ResourceLoader resourceLoader;
	private String serialKey = "v4DsgmtfRqSA7IJrXzak4g";// 2번째 (봉화)
	// private String serialKey="FcN3xOmqTFGDd8TpqqxRow";//1번째 (청송,달성,구미)
	private String nx = "36"; // 위도
	private String ny = "129"; // 경도
	private String type = "json"; // 조회하고 싶은 type(json, xml 중 고름)

	private Map SepcialReport = new HashMap<>();
	private Map AwsReport = new HashMap<>();
	private Map TodayForecast = new HashMap<>();
	private Map SatelliteImg = new HashMap<>();
	private Map RadarImg = new HashMap<>();

	private final ExecutorService executorService = Executors.newSingleThreadExecutor();

	@Autowired
	GLOBALService globalService;

	@GetMapping("/eds/rain")
	public String redirect() {
		return "redirect:/rain";
	}

	@GetMapping("/eds/name")
	public String redirectName(@RequestParam String name) {
		// URL 인코딩된 name 매개변수를 함께 포함하여 리디렉션 URL을 생성합니다.
		String redirectUrl = UriComponentsBuilder.fromPath("/name")
				.queryParam("name", name)
				.toUriString();
		return "redirect:" + redirectUrl;
	}

	@RequestMapping("/rain")
	public String rainvierw(Model model) throws Exception {
		System.out.println("colWay");
		System.out.println(colWay);
		if (colWay.equals("5"))
			return "/eds/rain/global/rainCs";
		else if (colWay.equals("6")) {
			return "/eds/rain/global/rainGm";
		} else if (colWay.equals("3"))
			return "/eds/rain/global/rainDs";
		else if (colWay.equals("7"))
			return "/eds/rain/global/rainBh";
		else
			return "/eds/rain/global/rainGm";
	}

	@GetMapping("/reservoir")
	public String reservoir() {
		return "/eds/rain/global/reservoir";
	}

	@GetMapping("/name")
	public String rainvierwGET(@RequestParam String name) {

		return "/eds/rain/global/rain3";
	}

	public GLOBALController(ResourceLoader resourceLoader) {
		this.resourceLoader = resourceLoader;
	}

	@GetMapping("/images/sailimg/{filename:.+}")
	public ResponseEntity<Resource> getImage(@PathVariable String filename) {
		return getResourceResponse(filePath + "/static/imgFiles/sailimg/" + filename);
	}

	@GetMapping("/images/radar/{filename:.+}")
	public ResponseEntity<Resource> radarGetImage(@PathVariable String filename) {
		return getResourceResponse(filePath + "/static/imgFiles/radar/" + filename);
	}

	private ResponseEntity<Resource> getResourceResponse(String filePath) {
		File file = new File(filePath);

		// 파일이 존재하는지 확인
		if (!file.exists()) {
			return ResponseEntity.notFound().build(); // 404 Not Found
		}

		Resource resource = resourceLoader.getResource("file:" + file.getAbsolutePath());

		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
				.body(resource);
	}

	@RequestMapping("/rainSelect")
	public String rainSelect(Model model) throws Exception {

		return "/eds/rain/global/rainSelect";
	}

	// @Scheduled(cron = "0 0/2 * * * *")
	// public void run() throws TimeoutException {
	// Future<?> future = executorService.submit(this::executeTask);
	// try {
	// future.get(4, TimeUnit.MINUTES); // 타임아웃 설정 (1분)
	// } catch (TimeoutException e) {
	// e.printStackTrace();
	// System.err.println("Task timed outss.");
	// future.cancel(true); // 타임아웃 시 작업 취소
	// } catch (Exception e) {
	// System.err.println("Task failed: " + e.getMessage());
	// }
	// }

	private void executeTask() {
		try {
			// 호스트 이름 검증 우회
			SSLUtils.disableHostnameVerification();
			// SSL 인증서 검증 우회를 위한 SSL 소켓 팩토리 설정
			TrustManager[] trustAllCerts = new TrustManager[] {
					new X509TrustManager() {
						public java.security.cert.X509Certificate[] getAcceptedIssuers() {
							return null;
						}

						public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {
						}

						public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {
						}
					}
			};
			SSLContext sc = SSLContext.getInstance("SSL");
			sc.init(null, trustAllCerts, new java.security.SecureRandom());
			HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

			// 각 API 호출에 대해 인터럽트가 발생했는지 체크
			SepcialReport = getSepcialReportApi();

			// 인터럽트 체크
			if (Thread.currentThread().isInterrupted()) {
				System.err.println("Task interrupted during getSepcialReportApi");
				return;
			}

			AwsReport = getAwsReportApi();

			// 인터럽트 체크
			if (Thread.currentThread().isInterrupted()) {
				System.err.println("Task interrupted during getAwsReportApi");
				return;
			}

			TodayForecast = getTodayForecastApi();

			// 인터럽트 체크
			if (Thread.currentThread().isInterrupted()) {
				System.err.println("Task interrupted during getTodayForecastApi");
				return;
			}

			SatelliteImg = getSatelliteImgApi();

			// 인터럽트 체크
			if (Thread.currentThread().isInterrupted()) {
				System.err.println("Task interrupted during getSatelliteImgApi");
				return;
			}

			RadarImg = getRadarImgApi();

			// 인터럽트 체크
			if (Thread.currentThread().isInterrupted()) {
				System.err.println("Task interrupted during getRadarImgApi");
				return;
			}

			System.out.println("Hello eds End!");
		} catch (Exception e) {
			e.printStackTrace();
			System.err.println("error eds End!");
		}
	}

	// 인터럽트 상태를 주기적으로 확인하는 메소드

	@RequestMapping("/RAIN_MAIN/selectRainData")
	@ResponseBody
	public Map selectRainData(@RequestBody HashMap<String, Object> map) throws Exception {
		Map mp = new HashMap<>();
		try {
			map.put("colWay", colWay);
			List li = globalService.selectRainData(map);
			mp.put("result", 1);
			mp.put("data", li);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp.put("result", 0);
			mp.put("data", null);
			mp.put("message", ex.getMessage());
		}
		return mp;
	}

	@RequestMapping("/WATERLV_MAIN/selectWaterLvData")
	@ResponseBody
	public Map selectWaterlevelDate(@RequestBody HashMap<String, Object> map) throws Exception {
		Map mp = new HashMap<>();
		try {
			map.put("colWay", colWay);
			List li = globalService.selectWaterlevelDate(map);
			mp.put("result", 1);
			mp.put("data", li);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp.put("result", 0);
			mp.put("data", null);
			mp.put("message", ex.getMessage());
		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/selectRainDataDay")
	@ResponseBody
	public Map selectRainDataDay(@RequestBody HashMap<String, Object> map) throws Exception {
		Map mp = new HashMap<>();
		try {
			map.put("colWay", colWay);
			map.put("stDt", Util.removeMinusChar((String) map.get("stDt")));
			map.put("edDt", Util.removeMinusChar((String) map.get("edDt")));
			List li = globalService.selectRainDataDay(map);
			mp.put("result", 1);
			mp.put("data", li);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp.put("result", 0);
			mp.put("data", null);
			mp.put("message", ex.getMessage());
		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/selectRainDataMon")
	@ResponseBody
	public Map selectRainDataMon(@RequestBody HashMap<String, Object> map) throws Exception {
		Map mp = new HashMap<>();
		try {
			map.put("colWay", colWay);
			map.put("stDt", Util.removeMinusChar((String) map.get("stDt")));
			List li = globalService.selectRainDataMon(map);
			mp.put("result", 1);
			mp.put("data", li);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp.put("result", 0);
			mp.put("data", null);
			mp.put("message", ex.getMessage());
		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/selectRainDataYear")
	@ResponseBody
	public Map selectRainDataYear(@RequestBody HashMap<String, Object> map) throws Exception {
		Map mp = new HashMap<>();
		try {
			map.put("colWay", colWay);
			map.put("stDt", Util.removeMinusChar((String) map.get("stDt")));
			List li = globalService.selectRainDataYear(map);
			mp.put("result", 1);
			mp.put("data", li);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp.put("result", 0);
			mp.put("data", null);
			mp.put("message", ex.getMessage());
		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/selectDevice")
	@ResponseBody
	public Map selectDevice(@RequestBody HashMap<String, Object> map) throws Exception {
		Map mp = new HashMap<>();
		try {
			map.put("colWay", colWay);
			List li = globalService.selectDevice(map);
			mp.put("result", 1);
			mp.put("data", li);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp.put("result", 0);
			mp.put("data", null);
			mp.put("message", ex.getMessage());
		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/getSepcialReport")
	@ResponseBody
	public Map getSepcialReport() throws Exception {
		Map mp = new HashMap<>();
		mp = SepcialReport;
		return mp;
	}

	public Map getSepcialReportApi() throws Exception {
		Map mp = new HashMap<>();
		try {
			// API URL을 만듭니다.
			System.out.println("sdasdasdqqd");
			URL url = new URL(
					"https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php?fe=f&tm=&disp=0&help=0&authKey="
							+ serialKey);
			// HttpURLConnection 객체를 만들어 API를 호출합니다.
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			// 요청 방식을 GET으로 설정합니다.
			con.setRequestMethod("GET");
			// 요청 헤더를 설정합니다. 여기서는 Content-Type을 application/json으로 설정합니다.
			con.setRequestProperty("Content-Type", "application/json;");

			// API의 응답을 읽기 위한 BufferedReader를 생성합니다.
			BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream(), "euc-kr"));
			String inputLine;
			StringBuffer response = new StringBuffer();
			String colWayName = "대구";
			if (colWay.equals("5"))
				colWayName = "청송";
			else if (colWay.equals("6"))
				colWayName = "구미";
			else if (colWay.equals("3"))
				colWayName = "대구";
			else if (colWay.equals("7"))
				colWayName = "봉화";

			// 응답을 한 줄씩 읽어들이면서 StringBuffer에 추가합니다.
			List<RAINSPEACIALLISTVO> spacData = new ArrayList<>();
			while ((inputLine = in.readLine()) != null) {
				response.append(inputLine);

				if (inputLine.contains(colWayName))// 특보
				{
					RAINSPEACIALLISTVO row = new RAINSPEACIALLISTVO();
					String[] saveData = inputLine.split(",");
					row.setREG_UP(saveData[0].trim());
					row.setREG_UP_KO(saveData[1].trim());
					row.setREG_ID(saveData[2].trim());
					row.setREG_KO(saveData[3].trim());
					row.setTM_FC(saveData[4].trim());
					row.setTM_EF(saveData[5].trim());
					row.setWRN(saveData[6].trim());
					if (saveData[7] != null) {//
						String trimmedData = saveData[7].trim();
						if (!trimmedData.isEmpty() && !trimmedData.contains("보")) {
							row.setLVL(trimmedData + "보");
						} else {
							row.setLVL(trimmedData);
						}
					}
					row.setCMD(saveData[8].trim());
					row.setED_TM(saveData[9].trim());
					spacData.add(row);
				}
			}
			String result2 = response.toString();
			System.out.println("result2--------------");
			System.out.println(result2);
			System.out.println("spacData--------------");
			System.out.println(spacData);
			// BufferedReader를 닫습니다.
			in.close();
			con.disconnect();

			List<O2VO> o2Data = new ArrayList<>();

			mp.put("result", 1);
			mp.put("data", spacData);
			mp.put("o2Data", o2Data);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp = SepcialReport;
			System.out.println("여긴가?");

		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/getAwsReport")
	@ResponseBody
	public Map getAwsReport() throws Exception {
		Map mp = new HashMap<>();
		mp = AwsReport;
		return mp;
	}

	public Map getAwsReportApi() throws Exception {// 온도 습도 바람등 날씨정보
		Map mp = new HashMap<>();
		try {
			// API URL을 만듭니다.
			// stn=276 청송, stn=279 구미, stn=143 대구
			String colWayName = "143";
			if (colWay.equals("5"))
				colWayName = "276";
			else if (colWay.equals("6"))
				colWayName = "279";
			else if (colWay.equals("3"))
				colWayName = "143";
			else if (colWay.equals("7"))
				colWayName = "271";
			// URL url = new
			// URL("https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min?&stn="+colWayName+"&disp=1&help=0&authKey="+serialKey);
			URL url = new URL("https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min?&stn=" + colWayName
					+ "&disp=1&help=0&authKey=" + serialKey);
			// HttpURLConnection 객체를 만들어 API를 호출합니다.
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			// 요청 방식을 GET으로 설정합니다.
			con.setRequestMethod("GET");
			// 요청 헤더를 설정합니다. 여기서는 Content-Type을 application/json으로 설정합니다.
			con.setRequestProperty("Content-Type", "application/json");

			// API의 응답을 읽기 위한 BufferedReader를 생성합니다.
			BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
			String inputLine;
			StringBuffer response = new StringBuffer();

			// 응답을 한 줄씩 읽어들이면서 StringBuffer에 추가합니다.
			List<RAINAWSLISTVO> spacData = new ArrayList<>();
			while ((inputLine = in.readLine()) != null) {
				response.append(inputLine);

				if (!inputLine.contains("#")) {
					RAINAWSLISTVO row = new RAINAWSLISTVO();
					String[] saveData = inputLine.split(",");
					row.setWS1(saveData[3].trim());
					row.setTA(saveData[8].trim());
					row.setHM(saveData[14].trim());
					spacData.add(row);
				}
			}
			// BufferedReader를 닫습니다.
			in.close();
			con.disconnect();
			mp.put("result", 1);
			mp.put("data", spacData);
			mp.put("message", "조회완료");
		} catch (Exception ex) {
			ex.printStackTrace();
			mp = AwsReport;

		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/getTodayForecast")
	@ResponseBody
	public Map getTodayForecast() throws Exception {
		Map mp = new HashMap<>();
		mp = TodayForecast;
		return mp;
	}

	public Map getTodayForecastApi() throws Exception {// 예보
		DateTimeFormatter format = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
		// 현재 날짜/시간
		String baseTime = "0500"; // 조회하고싶은 시간
		LocalDateTime now = LocalDateTime.now();
		String bDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
		String bsData = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
		// String bDate = "20240202";
		// String bsData = "202402020100";
		String compareData = bDate + "0500";
		LocalDateTime baseLocalDate = LocalDateTime.parse(bsData, format);
		LocalDateTime compareLocalDate = LocalDateTime.parse(compareData, format);
		if (!baseLocalDate.isAfter(compareLocalDate)) {
			System.out.println(true);
			now = now.minusDays(1);
			baseTime = "2350";

		} else {
			baseTime = "0500";
		}
		System.out.println(baseTime);
		LocalDateTime tomorrowDay = now.plusDays(2);

		// 2021-06-17T06:43:21.419878100
		// 포맷팅
		String baseDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
		String startDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + baseTime;
		String tomorrow = tomorrowDay.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + baseTime;
		System.out.println(startDate);
		System.out.println(tomorrow);
		LocalDateTime startLocalDate = LocalDateTime.parse(startDate, format);
		LocalDateTime endLocalDate = LocalDateTime.parse(tomorrow, format);
		// String formatedNow = now.format(DateTimeFormatter.ofPattern("HHmm"));
		String colWayName = "대구";
		String ny = "103";
		String nx = "96";
		if (colWay.equals("5")) {
			ny = "103";
			nx = "96";
		} else if (colWay.equals("6")) {
			ny = "96";
			nx = "84";
		} else if (colWay.equals("7")) {
			ny = "113";
			nx = "91";
		}
		Map mp = new HashMap<>();
		try {
			// API URL을 만듭니다.
			URL url = new URL(
					"https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getVilageFcst?pageNo=1&numOfRows=1000&dataType=JSON&base_date="
							+ baseDate + "&base_time=" + baseTime + "&nx=" + nx + "&ny=" + ny + "&authKey="
							+ serialKey);
			System.out.println("Weather API : " + url);
			// HttpURLConnection 객체를 만들어 API를 호출합니다.
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			// 요청 방식을 GET으로 설정합니다.
			con.setRequestMethod("GET");
			// 요청 헤더를 설정합니다. 여기서는 Content-Type을 application/json으로 설정합니다.
			con.setRequestProperty("Content-Type", "application/json");

			// API의 응답을 읽기 위한 BufferedReader를 생성합니다.
			BufferedReader in = new BufferedReader(
					new InputStreamReader(con.getInputStream()));
			String inputLine;
			StringBuffer line = new StringBuffer();

			// 응답을 한 줄씩 읽어들이면서 StringBuffer에 추가합니다.
			while ((inputLine = in.readLine()) != null) {
				line.append(inputLine);
			}
			// BufferedReader를 닫습니다.
			in.close();
			con.disconnect();
			String result = line.toString();

			// response 키를 가지고 데이터를 파싱
			JSONObject jsonObj_1 = new JSONObject(result);
			String response = jsonObj_1.get("response").toString();

			// response 로 부터 body 찾기
			JSONObject jsonObj_2 = new JSONObject(response);
			String body = jsonObj_2.get("body").toString();

			// body 로 부터 items 찾기
			JSONObject jsonObj_3 = new JSONObject(body);
			String items = jsonObj_3.get("items").toString();
			;
			// items로 부터 itemlist 를 받기
			JSONObject jsonObj_4 = new JSONObject(items);
			JSONArray jsonArray = jsonObj_4.getJSONArray("item");
			// 반환리스트
			List spacData = new ArrayList();
			Map<String, Object> data = new HashMap<>();
			for (int i = 0; i < jsonArray.length(); i++) {
				JSONObject jsonObj_5 = jsonArray.getJSONObject(i);
				String fcstValue = jsonObj_5.getString("fcstValue");
				String category = jsonObj_5.getString("category");
				String datetime = jsonObj_5.get("fcstDate").toString() + jsonObj_5.get("fcstTime").toString();

				LocalDateTime localdate = LocalDateTime.parse(datetime, format);

				if ((localdate.isAfter(startLocalDate)) && (localdate.isBefore(endLocalDate))) {
					// System.out.println(localdate);
					// System.out.println(startLocalDate);
					// System.out.println(endLocalDate);
					// System.out.println("start");
					// System.out.println(localdate.isAfter( startLocalDate ));
					// System.out.println("end");
					// System.out.println(localdate.isBefore( endLocalDate ));
					// System.out.println("test");
					RAINFORECASTLISTVO rows;
					if (data.containsKey(datetime)) {
						rows = (RAINFORECASTLISTVO) data.get(datetime);
					} else {
						rows = new RAINFORECASTLISTVO();
						rows.setToDay(baseDate.toString());
						rows.setForecastDate(jsonObj_5.get("fcstDate").toString());
						rows.setForecastTime(jsonObj_5.get("fcstTime").toString());
					}
					if (category.equals("SKY")) {
						String weather = "맑음";
						if (fcstValue.equals("1")) {
							weather = "맑음";
						} else if (fcstValue.equals("2")) {
							weather = "구름조금";
						} else if (fcstValue.equals("3")) {
							weather = "구름많음";
						} else if (fcstValue.equals("4")) {
							weather = "흐림";
						}
						rows.setSKY(weather);
						rows.setSKYNUM(fcstValue);
					}
					if (category.equals("PTY")) {
						String rain = "";
						if (fcstValue.equals("1")) {
							rain = "비";
						} else if (fcstValue.equals("2")) {
							rain = "비/눈";
						} else if (fcstValue.equals("3")) {
							rain = "눈";
						} else if (fcstValue.equals("4")) {
							rain = "소나기";
						}
						rows.setPTY(rain);
						rows.setPTYNUM(fcstValue);
					}

					if (category.equals("TMP")) {
						rows.setTMP(fcstValue);
					}

					data.put(datetime, rows);
				}
			}
			mp.put("result", 1);
			mp.put("data", data);
			mp.put("message", "조회완료");
			// mp.put("result", 1);
			// mp.put("data", spacData);
			// mp.put("message", "조회완료");
			// 응답을 JSON 형식으로 파싱합니다.
			// JSONObject jsonResponse = new JSONObject(response.toString());
			// System.out.println(jsonResponse.toString());
			// // 필요한 데이터를 추출하여 활용합니다.
			// String specificData = jsonResponse.getString("key"); // 필요한 데이터의 key를 사용하여 값을
			// 가져옵니다.
			// 응답을 출력합니다.
		} catch (Exception ex) {
			ex.printStackTrace();
			mp = TodayForecast;

		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/getSatelliteImg")
	@ResponseBody
	public Map getSatelliteImg() throws Exception {
		Map mp = new HashMap<>();
		mp = SatelliteImg;
		return mp;
	}

	public Map getSatelliteImgApi() throws Exception {
		// 현재 날짜/시간
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime previousDay = now.minusDays(1);

		// 2021-06-17T06:43:21.419878100
		// 포맷팅
		String toDay = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
		String yesDay = previousDay.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
		// String formatedNow = now.format(DateTimeFormatter.ofPattern("HHmm"));

		String baseTime = "0500"; // 조회하고싶은 시간

		Map mp = new HashMap<>();
		try {
			// API URL을 만듭니다.
			URL url = new URL("https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI005/FD/imageList?sDate=" + yesDay
					+ "0000&eDate=" + toDay + "2359&authKey=" + serialKey);
			System.out.println(url);
			// HttpURLConnection 객체를 만들어 API를 호출합니다.
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			// 요청 방식을 GET으로 설정합니다.
			con.setRequestMethod("GET");
			// 요청 헤더를 설정합니다. 여기서는 Content-Type을 application/json으로 설정합니다.
			con.setRequestProperty("Content-Type", "application/json");

			// API의 응답을 읽기 위한 BufferedReader를 생성합니다.
			BufferedReader in = new BufferedReader(
					new InputStreamReader(con.getInputStream()));
			String inputLine;
			StringBuffer line = new StringBuffer();

			// 응답을 한 줄씩 읽어들이면서 StringBuffer에 추가합니다.
			while ((inputLine = in.readLine()) != null) {
				line.append(inputLine);
			}
			// BufferedReader를 닫습니다.
			in.close();
			con.disconnect();
			String result = line.toString();
			JSONObject jsonObj_4 = new JSONObject(result);
			JSONArray jsonArray = jsonObj_4.getJSONArray("list");
			Map<String, Object> data = new HashMap<>();
			int num = jsonArray.length();
			// 반환리스트
			if (num > 0) {
				JSONObject jsonObj_5 = jsonArray.getJSONObject(num - 1);
				String imgDate = jsonObj_5.get("item").toString();
				String imgURL = "https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/image?date=" + imgDate
						+ "&authKey=" + serialKey;
				System.out.println(imgURL);

				String path = filePath + "/static/imgFiles/sailimg/Satellite" + imgDate + ".png";
				String temppath = filePath + "/static/imgFiles/temp/Satellite" + imgDate + ".png";
				downloadImage(imgURL, path);
				data.put("item", jsonObj_5.get("item").toString());
				data.put("sateName", "Satellite" + imgDate + ".png");
				// 폴더 내의 다른 파일들 삭제 (방금 저장한 파일 제외)
				File folder = new File(filePath + "/static/imgFiles/sailimg");
				File[] files = folder.listFiles();

				for (File file : files) {
					// 방금 저장한 파일은 삭제하지 않음
					if (!file.getName().equals("Satellite" + imgDate + ".png")) {
						file.delete();
					}
				}
				mp.put("result", 1);
				mp.put("data", data);
				mp.put("message", "조회완료");
			} else {
				mp = SatelliteImg;
			}

		} catch (Exception ex) {
			ex.printStackTrace();
			mp = SatelliteImg;

		}
		return mp;
	}

	@RequestMapping("/RAIN_MAIN/getRadarImg")
	@ResponseBody
	public Map getRadarImg() throws Exception {
		System.out.println("getRadarImg>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		Map mp = new HashMap<>();
		mp = RadarImg;
		return mp;
	}

	public Map getRadarImgApi() throws Exception {
		// 현재 날짜/시간
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime previousDay = now.minusDays(1);

		// 2021-06-17T06:43:21.419878100
		// 포맷팅
		String toDay = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
		String yesDay = previousDay.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
		// String formatedNow = now.format(DateTimeFormatter.ofPattern("HHmm"));

		String baseTime = "0500"; // 조회하고싶은 시간

		Map mp = new HashMap<>();
		try {
			// API URL을 만듭니다.

			// URL url = new
			// URL("http://apis.data.go.kr/1360000/RadarImgInfoService/getCmpImg?serviceKey=mCSQcbq5lCKQ1eSmMnFBImkISicxFLMMBBO0XUVNKQAqZnI6H%2BuyeX9BUTpRaw2jd8fmIrbuPMMGlUYrvSYhig%3D%3D&pageNo=1&numOfRows=10&dataType=json&data=CMP_WRC&time="+toDay);
			URL url = new URL("https://apihub.kma.go.kr/api/typ01/url/rdr_cmp_file_list.php?rdr=HSR&cmp=HSR&tm=" + toDay
					+ "&authKey=" + serialKey);
			System.out.println(url);
			// HttpURLConnection 객체를 만들어 API를 호출합니다.
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			// 요청 방식을 GET으로 설정합니다.
			con.setRequestMethod("GET");
			// 요청 헤더를 설정합니다. 여기서는 Content-Type을 application/json으로 설정합니다.
			con.setRequestProperty("Content-Type", "application/json");

			// API의 응답을 읽기 위한 BufferedReader를 생성합니다.
			BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
			String inputLine;
			StringBuffer line = new StringBuffer();
			List<String> listA = new ArrayList<String>();
			// 응답을 한 줄씩 읽어들이면서 StringBuffer에 추가합니다.
			while ((inputLine = in.readLine()) != null) {
				if (!inputLine.contains("#")) {
					line.append(inputLine);
					listA.add(inputLine);
				}
			}
			// BufferedReader를 닫습니다.
			in.close();
			con.disconnect();
			String result = line.toString();

			// 반환리스트
			List spacData = new ArrayList();
			Map<String, Object> data = new HashMap<>();

			// kmi
			int num = listA.size();
			// go
			// int num=elements.length;

			// 반환리스트
			if (num > 0) {
				// api kmi
				String radaString = listA.get(num - 1);
				String imgDate = radaString.substring(16, 28);
				String imgURL = "https://apihub.kma.go.kr/api/typ04/url/rdr_cmp_file.php?tm=" + imgDate
						+ "&data=img&cmp=cmc&authKey=" + serialKey;
				// String
				// imgURL="https://apihub.kma.go.kr/api/typ03/cgi/rdr/nph-rdr_sfc_pty_img?tm="+imgDate+"&cmp=SFC&qcd=PTY&obs=HSR&color=C4&aws=0&acc=&map=HR&grid=2&legend=1&size=600&itv=5&zoom_level=0&zoom_x=0000000&zoom_y=0000000&gov=&authKey="+serialKey;

				String path = filePath + "static/imgFiles/radar/radar" + imgDate + ".png";
				String temppath = filePath + "/static/imgFiles/temp/radar" + imgDate + ".png";
				downloadImage(imgURL, path);
				data.put("item", imgDate);
				data.put("radarName", "radar" + imgDate + ".png");
				// 폴더 내의 다른 파일들 삭제 (방금 저장한 파일 제외)
				File folder = new File(filePath + "/static/imgFiles/radar");
				File[] files = folder.listFiles();

				for (File file : files) {
					// 방금 저장한 파일은 삭제하지 않음
					if (!file.getName().equals("radar" + imgDate + ".png")) {
						file.delete();
					}
				}
				// data.put("item",imgURL);
				mp.put("result", 1);
				mp.put("data", data);
				mp.put("message", "조회완료");
			} else {
				mp = RadarImg;
			}
		} catch (Exception ex) {
			ex.printStackTrace();
			mp = RadarImg;

		}
		return mp;
	}

	private void waitForFile(String filePath) {
		File file = new File(filePath);
		int maxRetries = 10; // 최대 재시도 횟수
		int retryCount = 0;
		long waitTime = 500; // 대기 시간 (밀리초)

		while (retryCount < maxRetries) {
			if (file.exists() && file.length() > 0) {
				System.out.println("파일이 정상적으로 생성되었습니다: " + filePath);
				return;
			}
			try {
				Thread.sleep(waitTime); // 대기
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				e.printStackTrace();
			}
			retryCount++;
		}

		System.out.println("파일 생성에 실패했습니다: " + filePath);
	}

	public void downloadImage(String imageUrl, String destinationPath) throws Exception {
		try {
			URL url = new URL(imageUrl);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("GET");
			con.setRequestProperty("Content-Type", "application/json");

			// 응답 체크 및 이미지 다운로드
			try (BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()))) {
				StringBuilder response = new StringBuilder();
				String inputLine;

				// 응답 데이터 확인
				while ((inputLine = in.readLine()) != null) {
					if (!inputLine.contains("#")) {
						response.append(inputLine);
					}
				}
				if (response.length() == 0) {
					throw new IllegalStateException("응답 데이터가 없습니다. 이미지가 없습니다.");
				}

				// 이미지 다운로드 및 바이너리 데이터 출력
				try (InputStream inputStream = url.openStream();
						ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
						FileOutputStream outputStream = new FileOutputStream(destinationPath)) {

					byte[] buffer = new byte[1024];
					int bytesRead;

					// 바이트 데이터를 읽어오고 동시에 ByteArrayOutputStream에 저장
					while ((bytesRead = inputStream.read(buffer)) != -1) {
						byteArrayOutputStream.write(buffer, 0, bytesRead); // 데이터를 ByteArrayOutputStream에 저장
						outputStream.write(buffer, 0, bytesRead); // 데이터를 파일로 저장
					}

					// 바이너리 데이터 출력 (16진수 형식으로 변환하여 출력)
					byte[] binaryData = byteArrayOutputStream.toByteArray();

					System.out.println("이미지가 다운로드되어 " + destinationPath + "에 저장되었습니다.");
				}
			} finally {
				con.disconnect(); // 연결 닫기
			}
		} catch (Exception e) {
			System.err.println("API 호출 중 오류 발생: " + e.getMessage());
			throw e;
		}
	}

	// public void downloadImage(String imageUrl, String destinationPath, String
	// temppath) {
	// try {
	// URL url = new URL(imageUrl);
	// HttpURLConnection con = (HttpURLConnection) url.openConnection();
	// con.setRequestMethod("GET");
	// con.setRequestProperty("Content-Type", "application/json");
	//
	// int responseCode = con.getResponseCode();
	// if (responseCode == HttpURLConnection.HTTP_OK) {
	// try (InputStream inputStream = con.getInputStream()) {
	// Path destination = Paths.get(temppath);
	// File tempFile = new File(temppath);
	// Files.createDirectories(destination.getParent()); // 디렉터리 생성
	//
	// try (FileOutputStream outputStream = new
	// FileOutputStream(destination.toFile())) {
	// byte[] buffer = new byte[1024];
	// int bytesRead;
	// while ((bytesRead = inputStream.read(buffer)) != -1) {
	// outputStream.write(buffer, 0, bytesRead);
	// }
	// }
	// // 파일이 정상적으로 생성될 때까지 확인
	// waitForFile(temppath);
	//
	// File finalFile = new File(destinationPath);
	// Files.move(tempFile.toPath(), finalFile.toPath(),
	// StandardCopyOption.REPLACE_EXISTING);
	// Files.readAllBytes(finalFile.toPath()); // 파일을 읽어 파일 시스템이 최신 상태를 반영하도록 합니다.
	// System.out.println("이미지가 다운로드되어 " + destinationPath + "에 저장되었습니다.");
	// }
	// } else {
	// System.out.println("이미지를 불러오지 못했습니다. 응답 코드: " + responseCode);
	// }
	// con.disconnect();
	// } catch (IOException e) {
	// e.printStackTrace();
	// }
	// }

	// public void downloadImage(String imageUrl, String destinationPath) {
	// try
	// {
	//
	// URL url2 = new URL(imageUrl);
	// System.out.println(url2);
	// // HttpURLConnection 객체를 만들어 API를 호출합니다.
	// HttpURLConnection con2 = (HttpURLConnection) url2.openConnection();
	//
	// // 요청 방식을 GET으로 설정합니다.
	// con2.setRequestMethod("GET");
	// // 요청 헤더를 설정합니다. 여기서는 Content-Type을 application/json으로 설정합니다.
	// con2.setRequestProperty("Content-Type", "application/json");
	//
	// // API의 응답을 읽기 위한 BufferedReader를 생성합니다.
	// BufferedReader in2 = new BufferedReader(new
	// InputStreamReader(con2.getInputStream()));
	// String inputLine2;
	// StringBuffer line2 = new StringBuffer();
	// List<String> listA2 = new ArrayList<String>();
	// // 응답을 한 줄씩 읽어들이면서 StringBuffer에 추가합니다.
	// while ((inputLine2 = in2.readLine()) != null) {
	// if(!inputLine2.contains("#"))
	// {
	// line2.append(inputLine2);
	// listA2.add(inputLine2);
	// }
	// }
	// // BufferedReader를 닫습니다.
	// in2.close();
	// con2.disconnect();
	// String result2= line2.toString();
	// int num2=listA2.size();
	// if(num2>0)
	// {
	// try {
	// // 이미지 URL 열기
	// URL url = new URL(imageUrl);
	// URLConnection conn = url.openConnection();
	// InputStream inputStream = conn.getInputStream();
	// // 이미지를 저장할 파일 경로 설정
	// Path destination = Paths.get(destinationPath);
	// try (FileOutputStream outputStream = new
	// FileOutputStream(destination.toFile())) {
	// byte[] buffer = new byte[1024];
	// int bytesRead;
	// while ((bytesRead = inputStream.read(buffer)) != -1) {
	// outputStream.write(buffer, 0, bytesRead);
	// }
	// }
	// System.out.println("이미지가 다운로드되어 " + destinationPath + "에 저장되었습니다.");
	// } catch (IOException e) {
	// e.printStackTrace();
	// }
	// }
	// else
	// {System.out.println("이미지가없습니다.");}
	//
	// }
	// catch (Exception ex) {
	// ex.printStackTrace();
	//
	// }
	//
	// }

	public void downloadImageGz(String imageUrl, String destinationPath) {
		try {
			// 이미지 URL 열기
			URL url = new URL(imageUrl);
			URLConnection conn = url.openConnection();
			InputStream inputStream = conn.getInputStream();

			// 이미지를 저장할 파일 경로 설정
			Path destination = Paths.get(destinationPath);
			try (
					GZIPInputStream gzipInputStream = new GZIPInputStream(inputStream);
					FileOutputStream fileOutputStream = new FileOutputStream(destination.toFile())) {

				// 압축 해제된 데이터를 이미지 파일로 저장
				byte[] buffer = new byte[1024];
				int bytesRead;
				while ((bytesRead = gzipInputStream.read(buffer)) != -1) {
					// PNG 파일 시그니처 확인 (89 50 4E 47)
					if (!(buffer[0] == (byte) 0x89 && buffer[1] == (byte) 0x50 && buffer[2] == (byte) 0x4E
							&& buffer[3] == (byte) 0x47))
						break;
					fileOutputStream.write(buffer, 0, bytesRead);
				}
			}
			// 이미지를 파일로 저장

			System.out.println("이미지가 다운로드되어 " + destinationPath + "에 저장되었습니다.");
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public static boolean isImage(InputStream inputStream) {
		try {

			// 이미지 파일의 시그니처를 확인하여 이미지 파일인지 여부를 판별
			byte[] signature = new byte[4];
			int bytesRead = inputStream.read(signature, 0, 4); // 처음 4바이트 읽음
			if (bytesRead != 4)
				return false; // 파일이 너무 짧음

			// JPEG 파일 시그니처 확인 (FF D8)
			if (signature[0] == (byte) 0xFF && signature[1] == (byte) 0xD8)
				return true;

			// PNG 파일 시그니처 확인 (89 50 4E 47)
			if (signature[0] == (byte) 0x89 && signature[1] == (byte) 0x50 && signature[2] == (byte) 0x4E
					&& signature[3] == (byte) 0x47)
				return true;

			// GIF 파일 시그니처 확인 (47 49 46 38)
			if (signature[0] == (byte) 0x47 && signature[1] == (byte) 0x49 && signature[2] == (byte) 0x46
					&& signature[3] == (byte) 0x38)
				return true;

			// BMP 파일 시그니처 확인 (42 4D)
			if (signature[0] == (byte) 0x42 && signature[1] == (byte) 0x4D)
				return true;

			// TIFF 파일 시그니처 확인 (49 49 2A 00 or 4D 4D 00 2A)
			if ((signature[0] == (byte) 0x49 && signature[1] == (byte) 0x49 && signature[2] == (byte) 0x2A
					&& signature[3] == (byte) 0x00) ||
					(signature[0] == (byte) 0x4D && signature[1] == (byte) 0x4D && signature[2] == (byte) 0x00
							&& signature[3] == (byte) 0x2A))
				return true;

			// WebP 파일 시그니처 확인 (52 49 46 46)
			if (signature[0] == (byte) 0x52 && signature[1] == (byte) 0x49 && signature[2] == (byte) 0x46
					&& signature[3] == (byte) 0x46)
				return true;

			// 시그니처가 일치하지 않으면 InputStream을 처음 위치로 되돌림
			inputStream.reset();
			return false; // 이미지 파일이 아님
		} catch (IOException e) {
			e.printStackTrace();
			return false; // 예외 발생 시 이미지 파일이 아님
		} finally {
			try {
				// InputStream을 닫음
				inputStream.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

}
