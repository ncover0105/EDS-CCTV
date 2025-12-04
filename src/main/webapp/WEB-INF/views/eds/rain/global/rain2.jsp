<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title id="mainTitle">이디에스</title>
    <link rel="icon" id="mainIcon" type="image/png" href="/css/edsicon.png">
    <link rel="stylesheet" href="/tui/tui-grid/dist/tui-grid.css" />
    <link rel="stylesheet" href="/css/AdminLTE_main/plugins/fontawesome-free/css/all.min.css">
    <link rel="stylesheet" href="/css/AdminLTE_main/dist/css/adminlte.min.css">
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/jquery/jquery.min.js"></script>

    <!-- Bootstrap 4.6.2 -->
    <script type="text/javascript" src='/bootstrap-4.6.2/dist/js/bootstrap.min.js'></script>
    <!-- jQuery UI 1.13.0 -->
    <script type="text/javascript" src='/css/AdminLTE_main/plugins/jquery-ui/jquery-ui.min.js'></script>
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/jquery-validation/jquery.validate.min.js"></script>
    <!-- jQuery inputmask -->

    <script type="text/javascript" src='/css/AdminLTE_main/plugins/inputmask/jquery.inputmask.js'></script>
    <script type="text/javascript" src='/js/com/eds.common.js?curr=<c:out value="${common_include_js_curr}" />'></script>
    <link rel="stylesheet" href="/css/rain_grid.css">
    <!-- fontNoto -->
    <link type="text/css" rel="stylesheet" href="/css/fontNoto.css">
    <!-- <link rel="stylesheet" href="https://unpkg.com/@latte-ui/css@2.0.0-dev.7/dist/latte-ui.css" type="text/css"/> -->


</head>

<style>
    /* 움직이는 텍스트 */
    .animated-title {font-size:3rem; font-weight:300; position: relative; width: 100%;max-width:100%; height: inherit; overflow-x: hidden; overflow-y: hidden; }
    .animated-title .track {position: absolute; white-space: nowrap;will-change: transform;animation: marquee 40s linear infinite; }
    @keyframes marquee {
        from { transform: translateX(100%); }
        to { transform: translateX(-100%); }
    }
    @media (hover: hover) and (min-width: 700px){
        .animated-title .content {-webkit-transform: translateY(calc(100% - 5rem)); transform: translateY(calc(100% - 5rem));}
    }
    #container {
        width: 100%;
        min-height: 600px;
        display: flex;
        justify-content: center;
        align-items: center;
        /* float: left; */
        /* margin: 15px 35px; */

    }    /* 호버 시 앞으로 올라가는 애니메이션과 크기 확대 효과 */
    .animstate {
        transition: transform 0.3s ease, z-index 0.3s ease, transform-origin 0.3s ease, width 0.3s ease, height 0.3s ease;
    }

    .animstate-:hover {
        transform: scale(3); /* 크기 확대 */
        transform-origin: center; /* 변환 중심을 요소 중앙으로 설정 */
        z-index: 1000; /* 다른 요소 위에 나타나도록 z-index 설정 */
    }

    .animstate:hover .error {
        visibility: visible; /* 이미지가 보이도록 설정 */
    }

    .animstate:hover h3 {
        animation: moveUp 0.3s ease; /* 앞으로 올라가는 애니메이션 적용 */
    }
    #states path {
        fill: #f6f8fd;
        stroke: #b6bace;
        stroke-width: 1.5px;
        box-shadow: 5px 5px black;
        transition: transform 0.3s ease; /* 호버 시에 애니메이션 효과를 주기 위한 transition */
        position: relative; /* 요소의 위치를 조정하기 위해 position을 설정합니다. */
        z-index: 1;
    }
    #states2 path {
        fill: #f6f8fd;
        stroke: none;
        stroke-width: 1.5px;
    }

    #states path:hover {
        fill: #b6bace;
        transform: translateY(-5px); /* 요소를 위로 5px만큼 이동시키는 효과 */
        z-index: 2; /* 호버 시에 요소가 다른 요소 위에 올라오도록 z-index 값을 증가시킵니다. */
    }

    #states .active {
        fill: #b6bace;
    }

    #states .activeDetail {
        fill: #b6bace;
    }

    #states path {
        cursor: pointer;
    }

    #states text {
        cursor: pointer;
        font-size: 12px;
        fill: #161616;;
    }
    .card
    {
        /*border-radius: 15px;*/
        /*background: linear-gradient(145deg, #1e2a47, #3a4c75);*/
        /*box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.2), -10px -10px 30px rgba(255, 255, 255, 0.1);*/
        border: 1px solid #3d4250;
        border-radius: 0.25rem;
        box-shadow: 0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2);
        background-color:  #393f4f;
    }
    .card:hover
    {
        box-shadow: 0 0 5px rgba(60,140,187, 0.5), 0 1px 15px rgba(0,0,0,.2);
    }

    .icontime
    {
        font-size: 1.2rem !important;
        font-weight: 700;
    }
    .time
    {
        font-weight: 600;
        font-size: 2rem !important;
        letter-spacing: -.5px;
        height: 60px;
        line-height: calc(46px + 3.5rem);
        text-align: center;
        text-shadow: 2px 2px 5px rgb(0 0 0 / 50%);

    }
    .blue
    {
        color: blue !important;;
    }
    .green
    {
        color: #a0ffad;
    }
    .red
    {
        color: red !important;
    }
    .yellow
    {
        color: #fff9c7;
    }
    .data-box-map-mini {
        position: absolute;
        background-color: #fff;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        -ms-flex-direction: column;
        flex-direction: column;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        -ms-flex-line-pack: center;
        align-content: center;
        width: 60px;
        height: 41px;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        padding: 2px;
        border-radius: 8px;
        gap: 2px;
        border: 1.5px solid #b8bccf;
        -webkit-box-shadow: 0 1px 4px rgba(0,13,57,.4);
        box-shadow: 0 1px 4px rgba(0,13,57,.4);
        overflow: hidden;

    }
    .data-box-map-mini p .value {
        font-size: 14px;
        font-weight: 500;
    }

    .data-box-map-mini p {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: center;
        -ms-flex-pack: center;
        justify-content: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        width: 52px;
        height: 18px;
        background-color: #f5f5f5;
        -webkit-box-shadow: inset 0 1px 3px rgba(0,0,0,.05);
        box-shadow: inset 0 1px 3px rgba(0,0,0,.05);
        border-radius: 0 0 5px 5px;
        font-size: 12px !important;
        font-family: PTD, sans-serif !important;
        font-weight: 900;
        color: #141414;
        letter-spacing: -.3px;
    }.data-box-map-mini h4 {
         width: 56px;
         height: 15px;
         text-align: center;
         font-size: 12px !important;
         font-family: PTD, sans-serif !important;
         font-weight: 900;
         color: #141414;
         letter-spacing: -.3px;

     }

    .data-box-cmm {
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        background: #fff;
        border: 1px solid #b6bace;
        border-radius: 8px;
        -webkit-box-shadow: 0 1px 5px rgba(18,32,61,.2);
        box-shadow: 0 1px 5px rgba(18,32,61,.2);
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }
    .data-box-cmm {
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        background: #fff;
        border: 1px solid #b6bace;
        border-radius: 8px;
        -webkit-box-shadow: 0 1px 5px rgba(18,32,61,.2);
        box-shadow: 0 1px 5px rgba(18,32,61,.2);
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }
    .tit-set {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
        -ms-flex-pack: justify;
        justify-content: space-between;
        -webkit-box-align: start;
        -ms-flex-align: start;
        align-items: flex-start;
         font-size: 18px;
        font-family: PTD, sans-serif !important;
        color: #141414;
        letter-spacing: -.3px;
    }
    .value_boxes {
        /* display: -webkit-box; */
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
        -ms-flex-pack: justify;
        justify-content: space-between;
        margin: 0;
        padding: 0;
        outline: 0 !important;
    }

    .value-box2 {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
        -ms-flex-pack: justify;
        justify-content: space-between;
        -ms-flex-line-pack: justify;
        align-content: space-between;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        width: 118px;
        height: 66px;
        padding: 8px;
        color: #161616;
        background: #f5f5f5;
        border: 1px solid rgba(184, 188, 207, .5);
        border-radius: 8px;
        margin: 3px 0;
    }
    .value-box2 h5 {
        font-size: 24px;
        font-weight: 600;
    }
    .rainbox {
        width: 100%;
        border-radius: 15px;
        background: linear-gradient(145deg, #1e2a47, #3a4c75);
        box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.2), -10px -10px 30px rgba(255, 255, 255, 0.1);
        padding : 1.25rem;;
        color: white;
        text-align: center;
        position: relative;
        margin-bottom: 1rem;
    }
    .rainboxbig {
        height: calc(100% - 1rem);
        width: 100%;
        border-radius: 15px;
        background: linear-gradient(145deg, #1e2a47, #3a4c75);
        box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.2), -10px -10px 30px rgba(255, 255, 255, 0.1);
        padding : 1.25rem;;
        color: white;
        text-align: center;
        position: relative;
        margin-bottom: 1rem;
    }

    .title {
        font-size: 2.5vw;
        font-weight: bold;
        letter-spacing: 12px;
        margin-bottom: 20px;
        height: 3.75vw;
        overflow: hidden;
        }

    .rainfall {
        font-size: 3.75vw;
        height: calc(100% - 5vw);
        font-weight: bold;
        letter-spacing: 5px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center; /* 수직 중앙 정렬 */
        justify-content: center; /* 수평 중앙 정렬 */
        padding: 2rem 1rem;
    }
    .rainfallbig {
        font-size: 5vw;
        height: calc(100% - 5vw);
        font-weight: bold;
        letter-spacing: 5px;
        background-color: rgba(255, 255, 255, 0.1);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .rainfall span {
        color: #4fe1d1; /* 미래적인 느낌을 주는 색 */
    }
    .rainfallbig span
    {
        color: #4fe1d1; /* 미래적인 느낌을 주는 색 */
    }
    .imgbox {
        display: flex;
        align-items: center; /* 수직 중앙 정렬 */
    }

    .imgbox img {
        height: 4rem;
        max-height: 100%; /* 이미지가 div 높이에 맞춰지도록 설정 */
        max-width: 100%; /* div 너비에 맞춰 이미지 크기 조정 */
    }
    .maintitle
    {
        letter-spacing:12px;
        font-size: 3.5rem;
        text-shadow: 2px 2px 5px rgb(0 0 0 / 50%);
        font-weight: bold;
        margin-left: 12px;
    }
</style>
<body style=" display: flex; height: 100vh; background-color: #262c3a; color: white;">
<div class="col-lg-12 col-12 p-0" style="width: 100%;">
    <section class="content-header" style="padding: 10px 0.5rem;" >
        <div class="container-fluid">
            <div class="row">
<%--                <div class="col-xl-3 col-1" >--%>
<%--                    <!-- <img src="/css/cese.png" style="height: 81px; float: left;" alt="로고"> -->--%>
<%--                </div>--%>
                <div class="col-xl-8 col-12 text-left" >
                    <div class="imgbox">
                        <img id="mainLogo" src="/css/edslogo.png" alt="로고">
                        <span class="maintitle"  onclick="toggleFullScreen()" id="mainSpan"> 달성군 기상현황판</span>
                    </div>
                </div>
                <div class="col-xl-4 col-12" >
                    <h1 class="time float-right" name="viewDateTime" id="viewDateTime"></h1>
                </div>
            </div>
        </div>
    </section>
    <section >
        <div class="container-fluid" >
            <div class="row h-100" >
                <div class="col-xl-4 col-12 " style="text-align: center;">
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/images/radar.png"  name = 'raderImg' id="raderImg" alt="이미지 수신중" style="width: 100%; min-width:290px; height: 417px;" >
                    </div>
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/images/Satellite.png"  name = 'raderImg2' id="raderImg2" alt="이미지 수신중"style="width: 100%; min-width:290px; height: 420px;">

                    </div>
                </div>

                <div class="col-xl-8" >
                    <div class="row">
                        <div class="col-xl-4 col-12" >
                            <div class="rainboxbig">
                                <div class="title">오늘강우량</div>
                                <div class="rainfallbig">
                                    <span id="tdrainfall">0.0</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-8 col-12">
                            <div class="row">
                                <div class="col-xl-6 col-12">
                                    <div class="rainbox">
                                        <div class="title">시간강우량</div>
                                        <div class="rainfall">
                                            <span id="hdrainfall">0.0</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-6 col-12 ">
                                    <div class="rainbox" >
                                        <div class="title">어제강우량</div>
                                        <div class="rainfall">
                                            <span id="ydrainfall">0.0</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-xl-6 col-12">
                                    <div class="rainbox">
                                        <div class="title">월간강우량</div>
                                        <div class="rainfall">
                                            <span id="mtrainfall">0.0</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-6 col-12">
                                    <div class="rainbox">
                                        <div class="title">연간강우량</div>
                                        <div class="rainfall">
                                            <span id="yerainfall">0.0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div class="col-12 card p-0" style="width: 100%; text-align: center;">
                        <div class="card-header border-0 pb-0">
                            <h3 class="card-title text-bold">시간별 예보</h3>
                        </div>
                        <div class="card-body pr-2 pl-2 pt-2"style="width: 100%;">
                            <div class="row" style="padding: 0 2rem; font-size: 1.5rem;">
                                <div class="col-lg-4 text-left border-bottom">
                                    <span class="info-box-icon"><i class="fa-solid fa-temperature-high"></i>&nbsp&nbsp현재 온도&nbsp&nbsp:&nbsp&nbsp<strong id='TA' style="">0</strong><span class="text-sm">°C</span></span>
                                </div>
                                <div class="col-lg-4 text-left border-bottom">
                                    <span class="info-box-icon"><i class="fa-solid fa-droplet"></i>&nbsp&nbsp현재 습도&nbsp&nbsp:&nbsp&nbsp<strong id='HM' style="">0</strong><span class="text-sm">%</span></span>
                                </div>
                                <div class="col-lg-4 text-left border-bottom">
                                    <span class="info-box-icon"><i class="fa-solid fa-wind"></i>&nbsp&nbsp현재 바람&nbsp&nbsp:&nbsp&nbsp<strong id='WS1' style="">0</strong><span class="text-sm">m/s</span></span>
                                </div>
                                <div class="wi-icons wi-icons-new w-100" style="font-size: 1rem;">
                                    <div class="wi-icon border-right"><div class="icontime" id="objTime0">06:00</div><img id="forecast0" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky0">맑은날씨</div><div id="tmp0">1도</div></div>
                                    <div class="wi-icon border-right"><div class="icontime" id="objTime1">09:00</div><img id="forecast1" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky1">맑은날씨</div><div id="tmp1">1도</div></div>
                                    <div class="wi-icon border-right"><div class="icontime" id="objTime2">12:00</div><img id="forecast2" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky2">맑은날씨</div><div id="tmp2">1도</div></div>
                                    <div class="wi-icon border-right"><div class="icontime" id="objTime3">15:00</div><img id="forecast3" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky3">맑은날씨</div><div id="tmp3">1도</div></div>
                                    <div class="wi-icon border-right"><div class="icontime" id="objTime4">18:00</div><img id="forecast4" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky4">맑은날씨</div><div id="tmp4">1도</div></div>
                                    <div class="wi-icon border-right"><div class="icontime" id="objTime5">21:00</div><img id="forecast5" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky5">맑은날씨</div><div id="tmp5">1도</div></div>
                                    <div class="wi-icon border-right"><div class="icontime" id="objTime6">00:00</div><img id="forecast6" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky6">맑은날씨</div><div id="tmp6">1도</div></div>
                                    <div class="wi-icon">             <div class="icontime" id="objTime7">03:00</div><img id="forecast7" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky7">맑은날씨</div><div id="tmp7">1도</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
<%--                    <div class="card p-0" style="width: 100%; text-align: center;">--%>
<%--                   <!-- <div class="card p-0" style="width: 100%; text-align: center;height: calc(100% - 624px - 2rem);">--%>
                </div>
                <div class="col-lg-12">
                    <div class=" mb-0" style="background-color: #191a19; !important; color: #f03e3e; height: 4rem;border-radius: 15px ">
                        <div class="animated-title">
                            <div class="track">
                                <div class="content"  style="min-width: 100vw;" id="spacArea"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- <div class="row" style="height: 10%;">
                <div class="col-lg-12">
                    <div class="card mb-0" style="background-color: #191a19; color: #f03e3e; height: 4rem; ">
                        <div class="animated-title">
                            <div class="track">
                              <div class="content" id="spacArea"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> -->
        </div>

    </section>

</div>


</body>
<script>
    var rainGrid;
    var rainGrid2;

    const colWayArray={'1':'대구광역시','2':'달성군','3':'달성군','4':'군위군','5':'청송읍','6':'구미시'}
    const colWayIconArray = {
        '1': '/css/edsicon.png',
        '2': '/css/dsicon.png',
        '3': '/css/dsicon.png',
        '4': '/css/edsicon.png',
        '5': '/css/csicon.ico',
        '6': '/css/gumiicon.png'
    };
    const colWayLogoArray = {
        '1': '/css/edslogo.png',
        '2': '/css/dssymbol.png',
        '3': '/css/dssymbol.png',
        '4': '/css/edslogo.png',
        '5': '/css/cslogo.png',
        '6': '/css/gumilogo.png'
    };
    const urlParams = new URLSearchParams(window.location.search);
    const param12 = urlParams.get('name');
    if(param12){console.log(param12)}
    else{console.log('없어')}
    const mtrainfall = document.getElementById("mtrainfall");
    const yerainfall = document.getElementById("yerainfall");
    const ydrainfall = document.getElementById("ydrainfall");
    const hdrainfall = document.getElementById("hdrainfall");
    const tdrainfall = document.getElementById("tdrainfall");
    window.onload = async function() {
        let deviceData=await selectDevice();
        //await drawMap('#container',deviceData);
        //await selectDevice();
        resetData();
        resetTime();
    };
    var week=new Array('일','월','화','수','목','금','토');
    function initTime()
    {
        var dateInfo = new Date();
        var hour = modifyNumber(dateInfo.getHours());
        var min = modifyNumber(dateInfo.getMinutes());
        var sec = modifyNumber(dateInfo.getSeconds());
        var year = dateInfo.getFullYear();
        var month = dateInfo.getMonth()+1; //monthIndex를 반환해주기 때문에 1을 더해준다.
        var date = dateInfo.getDate();
        var today = new Date().getDay();
        var todayLabel = week[today];


        document.getElementById("viewDateTime").innerHTML = year + "년 " + month + "월 " + date + "일  ("+todayLabel+")  "+hour + ":" + min;
    }
    function modifyNumber(time){
        if(parseInt(time)<10){
            return "0"+ time;
        }
        else
            return time;
    }
    function toStringByFormatting(source) {

        const nowDate=new Date(source);
        const returnDate = nowDate.getFullYear()+(nowDate.getMonth()+1).toString().padStart(2,'0')+(nowDate.getDate()).toString().padStart(2,'0')
        return returnDate;
    }
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            }
        }
    }
    async function createEl(param)
    {
        let el='';
        if(param12)
        {
            el=`<div class="data-box-cmm box-wl-01-02 rain-all"><div class="tit-set"><h3 class="fontDefalt m-0 p-0" style="color: #141414;">`+param.name+`</h3><div class="last-upate mb08"><span class="date">`+param.pastDate+`</span></div></div><div class="value_boxes"><div class="value-box2"><h5 style="font-size: 24px !important;  font-weight: 600;">1h</h5><span class="value-set"><span class="value-bs">`+param.r_abs_hour+`</span><span class="unit">mm</span></span></div><div class="value-box2"><h5 style="font-size: 24px; font-weight: 600;">어제</h5><span class="value-set"><span class="value-bs">`+param.r_abs_yesterday+`</span><span class="unit">mm</span></span></div><div class="value-box2" style="position: relative;"><h5 style="font-size: 24px; font-weight: 600; margin-top: -3px;">일강우</h5><span style="position: absolute; bottom: 3px; font-size: 16px;">(0 - 24시)</span><span class="value-set"><span class="value-bs">`+param.r_abs_today+`</span><span class="unit">mm</span></span></div></div><div class="tit-set"><div>[mm/1hr]</div><div class="last-upate-pre"><span id="" class="date">강우 기준</span></div></div><div class="value_boxes"><div class="value-box2" style="position: relative;"><h5 style="font-size: 24px; font-weight: 600; margin-top: -3px;">주간강우</h5><span style="position: absolute; bottom: 3px; font-size: 16px;">('오늘부터 7일전')</span><span class="value-set"><span class="value-bs">`+param.r_abs_week+`</span><span class="unit">mm</span></span></div><div class="value-box2" style="position: relative;"><h5 style="font-size: 24px; font-weight: 600; margin-top: -3px;">월간강우</h5><span style="position: absolute; bottom: 3px; font-size: 16px;">(1달)</span><span class="value-set"><span class="value-bs">`+param.r_abs_month+`</span><span class="unit">mm</span></span></div><div class="value-box2" style="position: relative;"><h5 style="font-size: 24px; font-weight: 600; margin-top: -3px;">연강우</h5><span style="position: absolute; bottom: 3px; font-size: 16px;">(1년)</span><span class="value-set"><span class="value-bs">`+param.r_abs_year+`</span><span class="unit">mm</span></span></div></div></div>`
        }
        else
        {
            el=`<div class="data-box-cmm box-wl-01-02 rain"><div class="tit-set"><h3 class="fontDefalt m-0 p-0" style="color: #141414;">`+param.name+`</h3><div class="last-upate mb08"><span class="date">`+param.pastDate+`</span></div></div><div class="value_boxes"><div class="value-box2"><h5 style="font-size: 24px !important;  font-weight: 600;">1h</h5><span class="value-set"><span class="value-bs">`+param.r_abs_hour+`</span><span class="unit">mm</span></span></div><div class="value-box2" style="position: relative;"><h5 style="font-size: 24px; font-weight: 600; margin-top: -3px;">일강우</h5><span style="position: absolute; bottom: 3px; font-size: 16px;">(0 - 24시)</span><span class="value-set"><span class="value-bs">`+param.r_abs_today+`</span><span class="unit">mm</span></span></div></div><div class="tit-set"><div>[mm/1hr]</div><div class="last-upate-pre"><span id="" class="date">강우 기준</span></div></div><div class="value_boxes"><div class="value-box2"><h5 style="font-size: 24px; font-weight: 600;">어제</h5><span class="value-set"><span class="value-bs">`+param.r_abs_yesterday+`</span><span class="unit">mm</span></span></div><div class="value-box2" style="position: relative;"><h5 style="font-size: 24px; font-weight: 600; margin-top: -3px;">연강우</h5><span style="position: absolute; bottom: 3px; font-size: 16px;">(1년)</span><span class="value-set"><span class="value-bs">`+param.r_abs_year+`</span><span class="unit">mm</span></span></div></div></div>`
        }
        return el;
    }
    async function initRainData(param)
    {
        for(const datas of param)
        {
                if(param12)
                {

                    if(datas.name.includes(param12))
                    {
                        mtrainfall.innerHTML = datas.r_abs_month;
                        yerainfall.innerHTML = datas.r_abs_year;
                        ydrainfall.innerHTML = datas.r_abs_yesterday;
                        hdrainfall.innerHTML = datas.r_abs_hour;
                        tdrainfall.innerHTML = datas.r_abs_today;
                        document.getElementById("mainSpan").innerHTML=' '+datas.name+'기상상황판';
                    }
                }
                else
                {
                    el+=await createEl(datas)
                }

        }

    }
    async function initAPI()
    {


        let raderImg2= document.getElementById('raderImg2');
        var param = {};
        let rainData=await edsUtil.getAjax("/RAIN_MAIN/getSatelliteImg", param);

        if(Object.keys(rainData).length>0)
        {
            var url2=`/imgFiles/sailimg/Satellite.png?`+tmpDate.getTime()
            //var url2=`https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/imageList?sDate=`+date+`0000&eDate=`+date+`2359&authKey=tnvu9MccTDe77vTHHAw3BA`
            raderImg2.src=url2;
        }
        else
        {
            console.log('데이터없음')
        }

    }

    function getNearestFiveMinuteDate(date) {
        const now = date || new Date();

        // 분 단위를 5로 반올림
        const minutes = Math.floor(now.getMinutes() / 5) * 5;

        // 새로운 Date 객체 생성
        now.setMinutes(minutes);
        now.setSeconds(0); // 초를 0으로 설정

        // 포맷에 맞는 문자열로 변환 (예: YYYYMMDDHHmm)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');

        return {
            dateString: year + month + day + hours + mins,
            dateObject: now
        };
    }
    function updateImageWithCacheAndAttempts() {
        let currentDate = new Date();
        let { dateString } = getNearestFiveMinuteDate(currentDate);
        let attempts = 0;
        const maxAttempts = 20;
        const imgElement = document.getElementById('raderImg');

        // 마지막으로 성공한 이미지 URL을 로컬 스토리지에서 가져옴
        const lastValidImage = localStorage.getItem('lastValidImage');

        function setImageSource(dateString) {
            const imageUrl = 'http://www.kma.go.kr/repositary/image/rdr/img/RDR_CMP_WRC_' + dateString + '.png';
            console.log("Trying image:", imageUrl);
            imgElement.src = imageUrl;
        }

        function handleError() {
            attempts++;
            if (attempts < maxAttempts) {
                currentDate.setMinutes(currentDate.getMinutes() - 5);
                console.log(dateString)
                const { dateString: newDateString } = getNearestFiveMinuteDate(currentDate);
                setImageSource(newDateString);
            } else {
                console.log("Max attempts reached. Using last valid image.");
                if (lastValidImage) {
                    imgElement.src = lastValidImage; // 마지막 성공한 이미지 사용
                }
                imgElement.onerror = null;  // 더 이상 onerror 호출되지 않음
            }
        }

        // 이미지가 성공적으로 로드되면, 로컬 스토리지에 최신 이미지만 저장
        imgElement.onload = function() {
            localStorage.setItem('lastValidImage', imgElement.src);  // 이전 데이터를 덮어씀
        };
        imgElement.onerror = handleError;
        setImageSource(dateString);
    }

    async function selectDevice()
    {
        var param = {};
        param.rainDate=edsUtil.getToday('%Y%m');
        let rainDevice=await edsUtil.getAjax("/RAIN_MAIN/selectDevice", param);
        console.log(rainDevice);
        if(rainDevice.length>0)
        {
            document.getElementById("mainTitle").innerHTML=colWayArray[rainDevice[0].colWay];
            document.getElementById("mainIcon").href=colWayIconArray[rainDevice[0].colWay];
            document.getElementById("mainLogo").src=colWayLogoArray[rainDevice[0].colWay];

        }
        return rainDevice;
    }

    async function selectRainData()
    {
        var param = {};
        param.rainDate=await edsUtil.getToday('%Y%m%d%H%i%s');
        param.columnName="H"+param.rainDate.substr(8,2);
        let rainData= edsUtil.getAjax("/RAIN_MAIN/selectRainData", param);

        // let el='';
        // let innetId =document.getElementById('innerDom');
        // for(const datas of rainData)
        // {
        //
        //     if(param12)
        //     {
        //
        //         if(datas.name.includes(param12))
        //         {
        //             el+=await createEl(datas);
        //         }
        //     }
        //     else
        //     {
        //         el+=await createEl(datas)
        //     }
        //
        //
        // }
        // innetId.innerHTML=el;
        initRainData(rainData);
        //initDataSvg();//이미지 데이터 인풋
        initAPI();
        updateImageWithCacheAndAttempts();
        callJsonApi();
        callAwsApi();
        callForecastApi();
    }
    function maxminValue(rowKey,value,maxValue,minValue) {
        let returnValue='';
        if(maxValue==0 && minValue==0)
        {
            return toFixmm(value);
        }
        if(value==maxValue)
            rainGrid.addCellClassName( rowKey , 'r_abs_today' , 'red' );

        else if(Number(value)==Number(minValue))
            rainGrid.addCellClassName( rowKey , 'r_abs_today' , 'blue' );

        else
            returnValue=toFixmm(value);

        return toFixmm(value);

    }
    function resetTime()
    {
        initTime();
        setTimeout(resetTime, 1000);
    }
    const interval = 120000; // 60초
    function resetData()
    {
        selectRainData();
        setTimeout(resetData, interval);
    }
    // 코드 실행 시작 시간을 기록합니다.
    const startTime = edsUtil.getToday('%Y%m');
    function callJsonApi() {  // Text API 호출 함수
        const url="/RAIN_MAIN/getSepcialReport";
        $.ajax({
            method:"POST",
            url:url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json; charset=UTF-8",
            //async: false,	//동기방식으로 전송
            success: function(result) {
                let specArea=document.getElementById("spacArea");
                if(result.data.length>0)
                {
                    let spacData=result.data;//특보데이터
                    let spacString='';
                    for(const data of spacData)
                    {
                        data.tm_FC = data.tm_FC.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5');
                        spacString+=data.tm_FC+` [`+data.wrn+`특보] `+data.cmd;
                    }
                    specArea.innerHTML=spacString;

                }
                else
                {
                    specArea.innerHTML="기상특보 없음";
                    //
                    // if(result.o2Data.length>0)
                    // {
                    //     specArea.innerHTML="기상특보 없음";
                    // }
                    // //환경정보
                    // if(result.o2Data.length>0)
                    // {
                    //     let o2data=result.o2Data;
                    //     let pm25=o2data[0].pm25Value;
                    //     let pm25Grade=o2grade(o2data[0].pm25Grade);
                    //     let pm10=o2data[0].pm10Value;
                    //     let pm10Grade=o2grade(o2data[0].pm10Grade);
                    //     let o3=o2data[0].o3Value;
                    //     let o3Grade=o2grade(o2data[0].o3Grade);
                    //     let o2string = "<div style='color:white;'>"+o2data[0].dataTime+`[대기정보] `+`초미세먼지(PM-2.5) : `+ pm25 +`<span class="text-sm">㎍/㎥</span> (`+pm25Grade+`) 미세먼지(PM-10) : `+ pm10 +`<span class="text-sm">㎍/㎥</span> (`+pm10Grade+`) 오존(O3) : `+ o3 +`<span class="text-sm">ppm</span> (`+o3Grade+")</div>";
                    //     specArea.innerHTML=o2string;
                    // }

                }

            }
        });
    }
    function o2grade(num)
    {
        if(num=='1'){return '<span class="blue">좋음</span>'}
        else if(num=='2'){return '<span class="green">보통</span>'}
        else if(num=='3'){return '<span class="yellow">나쁨</span>'}
        else if(num=='4'){return '<span class="red">매우나쁨</span>'}
        else { return '정보없음'}
    }
    function callAwsApi() {  // Text API 호출 함수
        $.ajax({
            method:"POST",
            url:'/RAIN_MAIN/getAwsReport',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json; charset=UTF-8",
            //async: false,	//동기방식으로 전송
            success: function(result) {
                let WS1=document.getElementById("WS1");
                let TA=document.getElementById("TA");
                let HM=document.getElementById("HM");
                if(result.data.length>0)
                {

                    let awsData=result.data;//데이터
                    WS1.innerHTML=awsData[0].ws1//풍속
                    TA.innerHTML=awsData[0].ta//기온
                    HM.innerHTML=awsData[0].hm//습도
                }
                else
                {
                    //환경정보
                    console.log('특보없음');

                }

            }
        });
    }
    function callForecastApi() {// Text API 호출 함수
        $.ajax({
            method:"POST",
            url:"/RAIN_MAIN/getTodayForecast",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json; charset=UTF-8",
            //async: false,	//동기방식으로 전송
            success: function(result) {
                if(result.result==1)
                {
                    let data=result.data;
                    const startTime = edsUtil.getToday('%Y-%m-%d %H:')+"00";
                    let currentDate = new Date(startTime);
                    currentDate.setHours(currentDate.getHours() + 1);
                // 날짜 및 시간 형식 설정
                    var year = currentDate.getFullYear();
                    var month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
                    var day = ('0' + currentDate.getDate()).slice(-2);
                    var hours = ('0' + currentDate.getHours()).slice(-2);
                    var minutes = ('0' + currentDate.getMinutes()).slice(-2);

                    var result = year + month + day + hours+ minutes;

                    let src='/css/weather-icons-dev/production/fill/svg/';
                    for(var i=0; i<8; i++)
                    {
                        year = currentDate.getFullYear();
                        month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
                        day = ('0' + currentDate.getDate()).slice(-2);
                        hours = ('0' + currentDate.getHours()).slice(-2);
                        minutes = ('0' + currentDate.getMinutes()).slice(-2);
                        result = year + month + day + hours+ minutes;
                        let id=`forecast`+i;
                        let obj=data[result];
                        let doc=document.getElementById(id);
                        let sky=`sky`+i;
                        let objTime=`objTime`+i;
                        let tmp=`tmp`+i;
                        const skynum=obj.skynum +"-" +obj.ptynum;

                        let skysvg='clear-day.svg'
                        switch (skynum) {
                            case '2-0':
                                skysvg='partly-cloudy-day';
                                break;
                            case '2-1':
                                skysvg='partly-cloudy-day-rain';
                                break;
                            case '2-2':
                                skysvg='partly-cloudy-day-sleet';
                                break;
                            case '2-3':
                                skysvg='partly-cloudy-day-sleet';
                                break;
                            case '2-4':
                                skysvg='partly-cloudy-day-snow';
                                break;
                            case '3-0':
                                skysvg='cloudy';
                                break;
                            case '3-1':
                                skysvg='rain';
                                break;
                            case '3-2':
                                skysvg='sleet';
                                break;
                            case '3-3':
                                skysvg='sleet';
                                break;
                            case '3-4':
                                skysvg='snow';
                                break;
                            case '4-0':
                                skysvg='overcast';
                                break;
                            case '4-1':
                                skysvg='overcast-rain';
                                break;
                            case '4-2':
                                skysvg='overcast-sleet';
                                break;
                            case '4-3':
                                skysvg='overcast-sleet';
                                break;
                            case '4-4':
                                skysvg='overcast-snow';
                                break;
                            default:
                                skysvg='clear-day';
                                break;
                        }

                        document.getElementById(id).src=src+skysvg+".svg";
                        document.getElementById(sky).innerHTML = obj.sky+" "+obj.pty;
                        document.getElementById(tmp).innerHTML = obj.tmp+" °C";
                        document.getElementById(objTime).innerHTML=  obj.forecastTime.substring(0, 2) + ':' + obj.forecastTime.substring(2, 4);

                        currentDate.setHours(currentDate.getHours() + 3);
                    }
                    // for (const [key, value] of Object.entries(data)) {
                    //
                    //     let forecast = value.forecastTime.toString().substr(0,2);
                    //     let id=`forecast`+forecast;
                    //     if(document.getElementById(id))
                    //     {
                    //         let sky=`sky`+forecast;
                    //         let pty=`pty`+forecast;
                    //         let tmp=`tmp`+forecast;
                    //         const skynum=value.skynum +"-" +value.ptynum;
                    //
                    //         let skysvg='clear-day.svg'
                    //         switch (skynum) {
                    //             case '2-0':
                    //                 skysvg='partly-cloudy-day';
                    //                 break;
                    //             case '2-1':
                    //                 skysvg='partly-cloudy-day-rain';
                    //                 break;
                    //             case '2-2':
                    //                 skysvg='partly-cloudy-day-sleet';
                    //                 break;
                    //             case '2-3':
                    //                 skysvg='partly-cloudy-day-sleet';
                    //                 break;
                    //             case '2-4':
                    //                 skysvg='partly-cloudy-day-snow';
                    //                 break;
                    //             case '3-0':
                    //                 skysvg='cloudy';
                    //                 break;
                    //             case '3-1':
                    //                 skysvg='rain';
                    //                 break;
                    //             case '3-2':
                    //                 skysvg='sleet';
                    //                 break;
                    //             case '3-3':
                    //                 skysvg='sleet';
                    //                 break;
                    //             case '3-4':
                    //                 skysvg='snow';
                    //                 break;
                    //             case '4-0':
                    //                 skysvg='overcast';
                    //                 break;
                    //             case '4-1':
                    //                 skysvg='overcast-rain';
                    //                 break;
                    //             case '4-2':
                    //                 skysvg='overcast-sleet';
                    //                 break;
                    //             case '4-3':
                    //                 skysvg='overcast-sleet';
                    //                 break;
                    //             case '4-4':
                    //                 skysvg='overcast-snow';
                    //                 break;
                    //             default:
                    //                 skysvg='clear-day';
                    //                 break;
                    //         }
                    //
                    //         document.getElementById(id).src=src+skysvg+".svg";
                    //         document.getElementById(sky).innerHTML = value.sky+" "+value.pty;
                    //         document.getElementById(tmp).innerHTML = value.tmp+" °C";
                    //     }
                    //
                    // }

                }
                else
                {

                }

            }
        });
    }
    function toFixmm(num)
    {
        const result = num / 10;
        const formattedResult = result.toFixed(1);
        return formattedResult;
    }
    function toFixmmAvg(num)
    {
        const result = num * 100;
        const formattedResult =  Math.trunc(result);
        const formatted=formattedResult/100
        return formatted;
    }

</script>
</html>