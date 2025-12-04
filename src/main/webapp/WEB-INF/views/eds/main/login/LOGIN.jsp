<%@ page language="java" contentType="text/html; charset=UTF-8"
		 pageEncoding="UTF-8"%>


<!DOCTYPE html>
<html>
<head>
	<title>Login</title>
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
		<div class="col-md-12 text-center" id="infoList" style="padding: 0;">
			<div id = "typing" style="display:none;" class='typing'><h1 class="text"></h1></div>
		</div>
	</div>
	<div class="row">
		<div class="col-md-12 text-center" id="loginList" style="display:none;">
			<form class="d-flex justify-content-center" style="margin-top: 2%">
				<div class="row">
					<div class="col-sm">
						<div class="group">
							<input id="id" name="id" type="text" autocomplete='off' required>
							<span class="highlight"></span>
							<span class="bar"></span>
							<label>아이디</label>
						</div>
					</div>
					<div class="col-sm">
						<div class="group">
							<input id="pwd" name="pwd" type="password" autocomplete='off' required>
							<span class="highlight"></span>
							<span class="bar"></span>
							<label>비밀번호</label>
						</div>
					</div>
				</div>
			</form>
		</div>
	</div>
	<div class="row" hidden>
		<div class="col-md-12 text-center" id="buttonList" style="margin-top: 2%">
			<button id = "accLogin"  type="button" class="btn btn-outline-primary">로그인</button>
		</div>
	</div>
</div>
</body>
<!--container-->

<!--===============================================================================================-->


<!-- jQuery 3.6 -->
<script src="http://code.jquery.com/jquery-3.5.1.min.js" crossorigin="anonymous"></script>

<!-- 공통코드 Enum, EnumKeys 관련 모듈 -->
<script src="http://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<!-- Bootstrap 4.6.2 -->
<script type="text/javascript" src='/bootstrap-4.6.2/dist/js/bootstrap.min.js'></script>

<!-- login js -->
<script src="http://kit.fontawesome.com/a81368914c.js"></script>
<script type="text/javascript" src='/login/dist/js/login.js'></script>


<!--===============================================================================================-->

<!--===============================================================================================-->

<!--===============================================================================================-->


<script>

	$(document).ready(async function () {

		/****************************************
		 * 에니메이션 세팅 START
		 ****************************************/
		fadeInOut($("#infoList"), 'fadeIn', 1000, 1000);
		fadeInOut($("#typing"), 'fadeIn', 1000, 1000);
		await typing(document.querySelector(".typing .text"),
				[
					"로그인 정보를 입력해 주세요.",
				], 50, 1000, 500, 1000);
		fadeInOut($("#loginList"), 'fadeIn', 1000, 1000);
		setTimeout(()=>{
			$('#id').focus();
		},1400)

		/****************************************
		 * 에니메이션 세팅 END
		 ****************************************/
	});

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
</script>

<script>
	$(document).ready(function () {
		/*
		* server session check
		* */
		$.ajax({
			url : "/LOGIN/selectSESSCheck",
			type: "POST",
			async: false,
			success: function(result){
				if(result){// 세션이 있는경우
					if(isMobile()) {// 모바일
						window.location.href = "/eds/erp/global/selectCONTENTView";
					} else {// PC
						window.location.href = "/eds/erp/global/selectCONTENTView";
					}
					return;
				}else {

				}
			}
		});

		$('#pwd, #id').keydown(function (e) {
			if (e.keyCode == 13) {
				logincheck();
			}
		});

		$('#accLogin').click(function () {
			logincheck();
		});

		$('#id').focus();

	});

	async function logincheck() {

		fadeInOut($("#infoList"), 'fadeOut', 1000, 0);
		fadeInOut($("#loginList"), 'fadeOut', 1000, 0);

		if (navigator.onLine == false) {
			fadeInOut($("#infoList"), 'fadeIn', 1000, 0);
			await typing(document.querySelector(".typing .text"), [
				"네트워크에 연결되어 있지 않습니다.",
			], 50, 1000, 500, 1000);
			fadeInOut($("#loginList"), 'fadeIn', 1000, 1000);
			setTimeout(()=>{
				$('#id').focus();
			},1400)
			return;
		}

		if (!$('#id').val()) {
			fadeInOut($("#infoList"), 'fadeIn', 1000, 0);
			await typing(document.querySelector(".typing .text"), [
				"아이디를 입력해 주세요.",
			], 50, 1000, 500, 1000);
			fadeInOut($("#loginList"), 'fadeIn', 1000, 1000);
			setTimeout(()=>{
				$('#id').focus();
			},1400)
			return;
		}

		if (!$('#pwd').val()) {
			fadeInOut($("#infoList"), 'fadeIn', 1000, 0);
			await typing(document.querySelector(".typing .text"), [
				"비밀번호를 입력해 주세요.",
			], 50, 1000, 500, 1000);
			fadeInOut($("#loginList"), 'fadeIn', 1000, 1000);
			setTimeout(()=>{
				$('#pwd').focus();
			},1400)
			return;
		}

		var param = {
			id: $('#id').val(),
			pwd: $('#pwd').val()
		};

		$.ajax({
			url: "/LOGIN/selectLOGINCheck",
			type: "POST",
			data: param,
			async: false,
			success: async function (result) {
				if (result.code == "fail") {
					fadeInOut($("#infoList"), 'fadeIn', 1000, 1000);
					await typing(document.querySelector(".typing .text"), [
						"실패, 접속 정보를 확인해 주세요.",
					], 50, 1000, 500, 1000);
					fadeInOut($("#loginList"), 'fadeIn', 1000, 4000);
					setTimeout(async ev =>{
						$('#id').focus();
					},4500)
				} else if (result.code == "success") {
					/** 사용자 정보 세션 추가
					 * */
					sessionStorage.setItem('userId', $('#id').val());
					fadeInOut($("#infoList"), 'fadeIn', 1000, 1000);
					await typing(document.querySelector(".typing .text"), [
						"사내프로그램에 오신것을 환영합니다.",
					], 50, 1000, 500, 1000);
					setTimeout(async ev =>{
						if(isMobile()) {// 모바일
							window.location.href = "/eds/erp/global/selectCONTENTView";
						} else {// PC
							window.location.href = "/eds/erp/global/selectCONTENTView";
						}
					},3000)

				} else if (result.code == "reset") {
					window.location.href = "/LOGIN/RESET";
				} else if(result.code == "fail_acc") {
					fadeInOut($("#infoList"), 'fadeIn', 1000, 1000);
					await typing(document.querySelector(".typing .text"), [
						"실패, 접속이 제한된 계정입니다.",
					], 50, 1000, 500, 1000);
					fadeInOut($("#loginList"), 'fadeIn', 1000, 4000);
					setTimeout(async ev =>{
						$('#id').focus();
					},4500)
				}
			}
		});
	}

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