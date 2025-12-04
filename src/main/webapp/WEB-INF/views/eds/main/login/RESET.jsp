<%@ page language="java" contentType="text/html; charset=UTF-8"
		 pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/views/comm/common-include-doctype.jspf"%><%-- DOCTYPE 및 태그라이브러리정의 --%>

<%@ include file="/WEB-INF/views/comm/common-include-url.jspf"%><!-- 공통 Content-Security-Policy -->

<!DOCTYPE html>
<html>
<head>
	<title>Reset</title>
	<meta content="width=device-width,initial-scale=1" name="viewport">

	<%--------------------------------------------------
	웹 상단 아이콘 설정 START
	--------------------------------------------------%>

	<link rel="icon" href="/AdminLTE_main/dist/img/edsLogo_small.png">

	<%--------------------------------------------------
	웹 상단 아이콘 설정 EDN
	--------------------------------------------------%>

	<%--------------------------------------------------
	모바일 전제화면 설정 START
	--------------------------------------------------%>

	<!-- 모바일용웹 -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<!-- 안드로이드 홈화면추가시 상단 주소창 제거 -->
	<meta name="mobile-web-app-capable" content="yes">
	<!-- ios홈화면추가시 상단 주소창 제거 -->
	<meta name="apple-mobile-web-app-capable" content="yes">

	<%--------------------------------------------------
	모바일 전제화면 설정 EDN
	--------------------------------------------------%>

	<!--===============================================================================================-->
	<!-- Bootstrap 4.6.2 -->
	<link type="text/css" rel="stylesheet" href="/bootstrap-4.6.2/dist/css/bootstrap.min.css">

	<%-- Google Font--%>
	<link rel="preconnect" href="https://fonts.gstatic.com">
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap" rel="stylesheet">

	<%-- login css--%>
	<link rel="stylesheet" href="/login/dist/css/login.css">

	<style>
		.typing {
			height: 55px;
			display: flex;
			justify-content: center;
			align-items: flex-end;
			font-size: 1.8rem;
		}

		.text {
			font-size: 2.2rem;
			margin-left: .6rem;
		}

		.text::after {
			content: '';
			margin-left: .4rem;
			border-right: 2px solid #777;
			animation: cursor .9s infinite steps(2);
		}

		#toHome, #toLogin {
			transition-timing-function: ease;
		}

		@keyframes cursor {
			from { border-right: 2px solid #222; }
			to { border-right: 2px solid #777; }
		}

		/* ---------------------------------------- */
		@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");

		* {
			margin: 0;
			padding: 0;
			list-style: none;
			box-sizing: border-box;
			font-family: Pretendard;
		}

		body {
			height: 100vh;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #222;
			color: white;
		}

		iframe {
			height: 100vh;
			width: 100vw;
		}

		button {
			color: #999999;
			background-color: #999999;
		}

		button:hover{
			color: #222222 !important;
		}
	</style>

	<!--===============================================================================================-->
</head>
<body>
<div class="container">
	<div class="row">
		<div class="col-md-12 text-center" id="infoList">
			<div id = "typing" style="display:none;" class='typing'><h1 class="text"></h1></div>
		</div>
	</div>
	<div class="row">
		<div class="col-md-12 text-center" id="loginList" style="display:none;">
			<form style="margin-top: 2%;display: inline-table;"  onSubmit="return false;">
				<!-- input hidden -->
				<input type="hidden" name="empId" id="empId" title="아이디">
				<div class="group">
					<input id="pwd1" name="pwd1" type="password" autocomplete='off' required>
					<span class="highlight"></span>
					<span class="bar"></span>
					<label>현재 비밀번호</label>
				</div>
				<div class="group">
					<input id="pwd2" name="pwd2" type="password" autocomplete='off' required>
					<span class="highlight"></span>
					<span class="bar"></span>
					<label>신규 비밀번호</label>
				</div>
				<div class="group">
					<input id="pwd3" name="pwd3" type="password" autocomplete='off' required>
					<span class="highlight"></span>
					<span class="bar"></span>
					<label>재확인 비밀번호</label>
				</div>
				<button class="btn btn-outline-primary float-left" formaction="#" id="btnSave">비밀번호 저장 <i class="icon-right pull-right"></i></button>
				<button class="btn btn-outline-primary float-right" formaction="#" id="btnNext">다음에 변경 <i class="icon-right pull-right "></i></button>
			</form>
		</div>
	</div>
	<div class="row">
		<div class="col-md-12 text-center" id="buttonList" style="margin-top: 2%">
			<button id = "accLogin" style="display:none;" type="button" class="btn btn-outline-primary">로그인</button>
		</div>
	</div>
</div>
</body>
<!--container-->

<!--===============================================================================================-->


<!-- jQuery 3.6 -->
<script src="https://code.jquery.com/jquery-3.5.1.min.js" crossorigin="anonymous"></script>

<!-- 공통코드 Enum, EnumKeys 관련 모듈 -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<!-- Bootstrap 4.6.2 -->
<script type="text/javascript" src='/bootstrap-4.6.2/dist/js/bootstrap.min.js'></script>

<!-- login js -->
<script src="https://kit.fontawesome.com/a81368914c.js"></script>
<script type="text/javascript" src='/login/dist/js/login.js'></script>
<%@ include file="/WEB-INF/views/comm/common-include-js.jspf"%><%-- 공통 스크립트 정의--%>


<!--===============================================================================================-->

<!--===============================================================================================-->

<!--===============================================================================================-->


<script>

	/**
	 * fadeInOut 동적 처리
	 * @param {$(element)} el 컨트롤할 객체
	 * @param {string} division 1.fadeIn or 2.fadeOut
	 * @param {number} animateDelay animate 시간
	 * @param {number} startDelay setTimeout 시간
	 * @return fadeInOut을 처리해준다.
	 * */
	async function fadeInOut(el, division, animateDelay, startDelay){
		setTimeout(async function() {
			if (division === 'fadeIn') el.fadeIn(animateDelay);
			else if (division === 'fadeOut') el.fadeOut(animateDelay);
		},startDelay);
	}
	/**
	 * typing 동적 처리
	 * @param {$(element)} el 컨트롤할 객체
	 * @param {[list]} letters 문구
	 * @param {number} speedForinput 글자 입력 속도
	 * @param {number} speedForWait 문장 사이 대기 시간
	 * @param {number} speedForStart 초기 커서 시간
	 * @param {number} startDelay setTimeout 시간
	 * @return typing을 처리해준다.
	 * */
	async function typing(el, letters, speedForinput, speedForWait,speedForStart, startDelay){
		setTimeout(function() {
			// 이전 타이핑 제거
			if(el.innerHTML.length > 0){
				el.innerHTML = '';
			}
		},startDelay-200);

		setTimeout(function() {
			// 글자 입력 속도
			let i = 0;

			// 타이핑 효과
			const typing = async () => {
				const letter = letters[i].split("");

				while (letter.length) {
					await wait(speedForinput);
					el.innerHTML += letter.shift();
				}

				// 잠시 대기
				await wait(speedForWait);

				// 지우는 효과
				// remove();
				// 지우는 효과: 무한반복막기
				if (letters[i + 1]) await remove();
			}

			// 글자 지우는 효과
			const remove = async () => {
				const letter = letters[i].split("");

				while (letter.length) {
					await wait(speedForinput);

					letter.pop();
					el.innerHTML = letter.join("");
				}

				// 다음 순서의 글자로 지정, 타이핑 함수 다시 실행
				i = !letters[i+1] ? 0 : i + 1;
				await typing();
			}

			// 딜레이 기능 ( 마이크로초 )
			async function wait(ms) {
				return new Promise(res => setTimeout(res, ms))
			}

			// 초기 실행
			setTimeout(typing, speedForStart);
		},startDelay);
	}
	/**
	 * 오늘 날짜 가져오기
	 * @param {$(element)} el 컨트롤할 객체
	 * @return typing을 처리해준다.
	 * */
	function getToday(param) {
		var today;
		var params = {
			param  : param
		};
		$.ajax({
			url: "/eds/erp/com/getToday",
			type: "POST",
			async: false,
			data: params,
			success: function(result){
				today = result;
			}
		});
		return today;
	}

	/**
	 * 날짜 처리
	 * @param {$(element)} el 컨트롤할 객체
	 * @return typing을 처리해준다.
	 * */
	function calDateRange(val1, val2)
	{
		var FORMAT = "-";

		// FORMAT을 포함한 길이 체크
		if (val1.length != 10 || val2.length != 10)
			return null;

		// FORMAT이 있는지 체크
		if (val1.indexOf(FORMAT) < 0 || val2.indexOf(FORMAT) < 0)
			return null;

		// 년도, 월, 일로 분리
		var start_dt = val1.split(FORMAT);
		var end_dt = val2.split(FORMAT);

		// 월 - 1(자바스크립트는 월이 0부터 시작하기 때문에...)
		// Number()를 이용하여 08, 09월을 10진수로 인식하게 함.
		start_dt[1] = (Number(start_dt[1]) - 1) + "";
		end_dt[1] = (Number(end_dt[1]) - 1) + "";

		var from_dt = new Date(start_dt[0], start_dt[1], start_dt[2]);
		var to_dt = new Date(end_dt[0], end_dt[1], end_dt[2]);

		return (to_dt.getTime() - from_dt.getTime()) / 1000 / 60 / 60 / 24;
	}
</script>

<script>
	$(document).ready(async function () {

		fadeInOut($("#infoList"), 'fadeIn', 1000, 1000);
		fadeInOut($("#typing"), 'fadeIn', 1000, 1000);
		fadeInOut($("#loginList"), 'fadeIn', 1000, 1000);

		document.getElementById('empId').value = '<c:out value="${LoginInfo.empId}"/>';

		if(!document.getElementById('empId').value){
			window.location.href = "/LOGIN_VIEW";
		}

		var pwdUpdDt = '<c:out value="${LoginInfo.pwdUpdDt}"/>';
		var day = calDateRange(pwdUpdDt.substr(0,4)+"-"+pwdUpdDt.substr(4,2)+"-"+pwdUpdDt.substr(6,2), getToday("%Y-%m-%d"));

		if(!pwdUpdDt){// 처음 로그인
			await typing(document.querySelector(".typing .text"),
					[
						"초기 비밀번호를 설정해주세요.",
					], 50, 1000, 500, 1000);
		}else{
			if(day < 90){
				await typing(document.querySelector(".typing .text"),
						[
							"재설정할 비밀번호를 입력해 주세요.",
						], 50, 1000, 500, 1000);
				setTimeout(async function() {
					fadeInOut($("#loginList"), 'fadeIn', 1000, 0);
					$('#pwd1').focus();
				},3000);
			}else{
				await typing(document.querySelector(".typing .text"),
						[
							"비밀번호 변경 후 90일이 경과 되었습니다.",
							"비밀번호를 변경해주세요.",
						], 50, 1000, 500, 1000);
				setTimeout(async function() {
					fadeInOut($("#loginList"), 'fadeIn', 1000, 0);
					$('#pwd1').focus();
				},3000);
			}
		}

		$('#btnSave').click(async function(){

			/**
			 * 비밀번호 변경전 현재 비밀번호 확인*/

			var params = {
				empId  : $('#empId').val(),
				pwd  : $('#pwd1').val()
			};

			var data = edsUtil.getAjax("/LOGIN/checkPASSWORD", params);

			if(data[0].cnt === '1'){
				if (navigator.onLine == false){
					await typing(document.querySelector(".typing .text"), [
						"실패, 네트워크에 연결되어 있지 않습니다.",
					], 50, 1000, 500, 0);
					return;
				}

				if(!$('#pwd1').val()){
					await typing(document.querySelector(".typing .text"), [
						"실패, 현재 비밀번호를 입력해 주세요.",
					], 50, 1000, 500, 0);
					$('#pwd1').focus();
					return;
				}

				if(!$('#pwd2').val()){
					await typing(document.querySelector(".typing .text"), [
						"실패, 신규 비밀번호를 입력해 주세요.",
					], 50, 1000, 500, 0);
					$('#pwd2').focus();
					return;
				}

				if(!$('#pwd3').val()){
					await typing(document.querySelector(".typing .text"), [
						"실패, 재확인 비밀번호를 입력해 주세요.",
					], 50, 1000, 500, 0);
					$('#pwd3').focus();
					return;
				}

				if($('#pwd1').val() == $('#pwd2').val()){
					await typing(document.querySelector(".typing .text"), [
						"실패, 이전 비밀번호와 같습니다.",
					], 50, 1000, 500, 0);
					$('#pwd3').focus();
					return;
				}

				if($('#pwd2').val() != $('#pwd3').val()){
					await typing(document.querySelector(".typing .text"), [
						"실패, 비밀번호가 서로 다릅니다.",
					], 50, 1000, 500, 0);
					$('#pwd3').focus();
					return;
				}

				var pw2 = $("#pwd2").val();
				var pw3 = $("#pwd3").val();

				if(
						pw2.length < 1 || pw2.length > 20 ||
						pw3.length < 1 || pw3.length > 20
				){
					await typing(document.querySelector(".typing .text"), [
						"1자리 ~ 20자리 이내로 입력해 주세요.",
					], 50, 1000, 500, 0);
					return;
				}else if(
						pw2.search(/\s/) != -1 ||
						pw3.search(/\s/) != -1
				){
					await typing(document.querySelector(".typing .text"), [
						"신규 비밀번호는 공백 없이 입력해 주세요.",
					], 50, 1000, 500, 0);
					return;
				}

				var param = {
					empId  : $('#empId').val(),
					pwd  : $('#pwd3').val()
				};

				$.ajax({
					url: "/LOGIN/updatePASSWORD",
					type: "POST",
					data: param,
					async: false,
					success: async function(result){
						if(result.code == "success"){
							fadeInOut($("#infoList"), 'fadeOut', 500, 0);
							fadeInOut($("#loginList"), 'fadeOut', 500, 0);
							fadeInOut($("#infoList"), 'fadeIn', 500, 0);
							await typing(document.querySelector(".typing .text"), [
								"성공, 비밀번호가 변경되었습니다.",
							], 50, 3000, 500, 0);
							setTimeout(async function() {
								window.location.href = "/eds/erp/global/selectCONTENTView";
							},3000);
						}
					}
				});
			}else{
				await typing(document.querySelector(".typing .text"), [
					"실패, 현재 비밀번호가 서로 다릅니다.",
				], 50, 1000, 500, 0);
				$('#pwd1').focus();
				return;
			}
		});

		$('#btnNext').click(function(){
			var param = {
				empId  : $('#empId').val()
			};

			$.ajax({
				url: "/LOGIN/updatePASSWORDNext",
				type: "POST",
				data: param,
				async: false,
				success: function(result){
					if(result.code == "success"){
						window.location.href = "/eds/erp/global/selectCONTENTView";
					}
				}
			});
		});
	});

	function isMobile(){
		var UserAgent = navigator.userAgent;
		if (UserAgent.match(/iPhone|iPod|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || UserAgent.match(/LG|SAMSUNG|Samsung/) != null)
		{
			return true;

		}else{
			return false;
		}
	}
</script>

</body>
</html>