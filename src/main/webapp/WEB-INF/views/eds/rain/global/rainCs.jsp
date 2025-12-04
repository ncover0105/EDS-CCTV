<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title id="mainTitle">이디에스</title>
    <link rel="icon" id="mainIcon" type="image/png" href="/css/edsicon.png">
    <link rel="stylesheet" href="/tui/tui-grid/dist/tui-grid.css"/>
    <!-- jQuery inputmask -->
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/jquery/jquery.min.js"></script>
    <script type="text/javascript" src='/css/AdminLTE_main/plugins/inputmask/jquery.inputmask.js'></script>
    <script type="text/javascript" src='/plugins/toastr/toastr.min.js'></script>
    <script type="text/javascript" src='/plugins/toastr/toastrmessage.js'></script>
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/sweetalert2/sweetalert2.all.min.js"></script>
    <script src="/js/com/d3.js"></script>
    <link rel="stylesheet" href="/css/AdminLTE_main/plugins/fontawesome-free/css/all.min.css">
    <link rel="stylesheet" href="/css/AdminLTE_main/dist/css/adminlte.min.css">

    <!-- Bootstrap 4.6.2 -->
    <script type="text/javascript" src='/bootstrap-4.6.2/dist/js/bootstrap.min.js'></script>
    <!-- jQuery UI 1.13.0 -->
    <script type="text/javascript" src='/css/AdminLTE_main/plugins/jquery-ui/jquery-ui.min.js'></script>
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/jquery-validation/jquery.validate.min.js"></script>

    <script src="/tui/tui-grid/dist/tui-grid.js"></script>
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
        width: 800px;
        min-height: 700px;
        /* float: left; */
        /* margin: 15px 35px; */

    }
    #states path {
        fill: #f6f8fd;
        stroke: #052563;
        stroke-width: 1.5px;
        box-shadow: 10px 10px black;
    }

    #states path:hover {
        fill: #b6bace;
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
    .dropdown-menu
    {
        padding: 10px;!important;
    }
    .card
    {
        border: 1px solid #3d4250;
        border-radius: 1rem;
        box-shadow: 0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2);
        background-color:  #393f4f;
    }
    .tess-body
    {
        border: 1px solid #b6bace;
        border-radius: 0.25rem;
        box-shadow: 0 1px 5px rgba(18,32,61,.2);
        background-color: #052563;
        color: white;
    }
    .card:hover
    {
        box-shadow: 0 0 5px rgba(60,140,187, 0.5), 0 1px 15px rgba(0,0,0,.2);
    }
    .tui-grid-cell-selected
    {
        background-color: #052563 !important;
        color: white;
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
    .fontDefalt
    {
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
        font-size: 12px;
        font-family: PTD, sans-serif !important;
        color: #141414;
        letter-spacing: -.3px;
        margin-bottom: 0.3rem;
    }
    .tit-set >h3
    {
        display: block;
        font-size: 1.2rem;
        margin-block-start: 1em;
        margin-block-end: 1em;
        margin-inline-start: 0px;
        margin-inline-end: 0px;
        font-weight: bold;
        unicode-bidi: isolate;
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

    .value_boxes .value-box2:first-child {
        width: 105px;
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
        height: 42px;
        padding: 8px;
        color: #161616;
        background: #f5f5f5;
        border: 1px solid rgba(184, 188, 207, .5);
        border-radius: 8px;
        margin: 3px 0;
    }
    .value-box2 h5 {
        font-size: 14px;
        font-weight: 600;
    }
    .info {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-wrap: wrap;
        flex-wrap: wrap;
        padding: 0;
        gap: 8px;
        padding-left: 8px;
    }
    .info>div.rain {
        width: 32.5%;
    }
    .info>div.rain-all {
        width: 50%;
    }
    .box-wl-01-02 {
        width: 100%;
        height: calc(50%);
        padding: 7px;
    }
    .value_boxes .value-box2:last-child {
        width: 135px;
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
    }
    .box-wl-02 {
        width: 100%;
        height: auto;
        padding: 12px;
        position: relative;
        overflow: hidden;
     }
    .box-wl-02 span, .box-wl-wind span {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
        -ms-flex-pack: justify;
        justify-content: space-between;
    }
    .last-upate :before {
        content: "";
        background-image: url(/imgFiles/test.svg);
        background-size: 12px 12px;
        width: 12px;
        height: 12px;
        margin: 4px 2px 0 0;
        vertical-align: middle;
    }.box-wl-02 .value-box, .box-wl-wind .value-box {
         display: -webkit-box;
         display: -ms-flexbox;
         display: flex;
         -webkit-box-pack: end;
         -ms-flex-pack: end;
         justify-content: flex-end;
         -webkit-box-align: center;
         -ms-flex-align: center;
         align-items: center;
         width: 135px;
         height: auto;
     }
    .value-box {
        -ms-flex-line-pack: justify;
        align-content: space-between;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        width: 114px;
        height: 44px;
        padding: 8px;
        color: #161616;
        background: #f5f5f5;
        border: 1px solid rgba(184, 188, 207, .5);
        border-radius: 8px;
        font-size: 2rem;
    }
    .box-wl-01 span, .value-box {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
        -ms-flex-pack: justify;
        justify-content: space-between;
    }
    .info-tbl, .info-tbl>table {
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
    }
    .info-tbl {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        -webkit-box-pack: center;
        -ms-flex-pack: center;
        justify-content: center;
        width: 100%;
        height: auto;
        border: 1px solid #d4d6df;
        border-radius: 8px;
        overflow: hidden;
        color: #141414;
        text-align: center;
    }
    .info-tbl>table {
        width: 100%;
        table-layout: fixed;
    }
    .info-tbl, .info-tbl>table {
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
    }
    .info-tbl>table>thead {
        border-bottom: .5px solid #d4d6df;
        background-color: #f5f5f5;
    }
    table {
        width: 100%;
        border-spacing: 0;
        border-collapse: collapse;
    }

    .box-wl-02 .info-tbl table thead tr .lv-01:before {
        background: #052563;
    }
    .box-wl-02 .info-tbl table thead tr .lv-02:before {
        background: #ffc319;
    }
    .box-wl-02 .info-tbl table thead tr .lv-03:before {
        background: #ff6b00;
    }
    .box-wl-02 .info-tbl table thead tr .lv-04:before {
        background: #ed0c0c;
    }
    .info-tbl>table>thead>tr th:before {
        width: 10px;
        height: 10px;
        background: #fff;
        margin: -2.5px 4px 0 0;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        content: "";
        display: inline-block;
        vertical-align: middle;
        border-radius: 100%;
        border: .1px solid #9e9e9e;
    }.info-tbl>table>thead>tr th {
         gap: 4px;
         -webkit-box-align: center;
         -ms-flex-align: center;
         align-items: center;
         -webkit-box-pack: center;
         -ms-flex-pack: center;
         justify-content: center;
         text-align: center;
     }
    .tbFont
    {
        font-size: 1.4rem;
    }

</style>
<body style=" display: flex; height: 100vh; background-color: #262c3a; color: white;">
<div class="col-lg-12 col-12 p-0" style="width: 100%;">
    <section class="content-header navbar navbar-expand-lg" style="padding: 10px 0.5rem;">
        <div class="container-fluid">
            <ul class="navbar-nav">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarScrollingDropdown" role="button"
                       data-toggle="dropdown" aria-expanded="false" style="color: white;">
                        <i class="fa-solid fa-bars"></i>
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="navbarScrollingDropdown">
                        <li class="rainMenuNav">기상메뉴</li>
                        <li><a class="dropdown-item" href="/rain"><i class="fa-solid fa-table-columns"></i> 기상종합상환판</a>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="/rainSelect"><i class="fa-solid fa-database"></i> 관측정보 조회</a>
                        </li>
                        <%--                        <li><a class="dropdown-item" href="#">Another action</a></li>--%>
                        <%--                        <li><hr class="dropdown-divider"></li>--%>
                        <%--                        <li><a class="dropdown-item" href="#">Something else here</a></li>--%>
                    </ul>
                </li>

            </ul>
            <ul class="navbar-nav ml-auto w-100">
                <div class="row w-100">
                    <div class="col-xl-3 col-1">
                    </div>
                    <div class="col-xl-6 col-11 text-center">
                        <span style="font-size: 3.5rem; font-weight: bold;" onclick="toggleFullScreen()"><img
                                id="mainLogo" src="/css/edslogo.png" style="height: 4.5rem; margin-top: -10px;"
                                alt="로고"> 기상종합상황판</span>
                    </div>
                    <div class="col-xl-3 col-12">
                        <h1 class="info-box-text time float-right" name="viewDateTime" id="viewDateTime"></h1>
                    </div>
                </div>
            </ul>
        </div>
    </section>
    <section >
        <div class="container-fluid" >
            <div class="row" >
                <div class="col-xl-4 col-12 " style="text-align: center;">
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/images/radar.png"  name = 'raderImg' id="raderImg" alt="이미지 수신중" style="width: 100%; min-width:290px; height: 417px;" >
                    </div>
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/images/Satellite.png"  name = 'raderImg2' id="raderImg2" alt="이미지 수신중"style="width: 100%; min-width:290px; height: 420px;">

                    </div>
                </div>
                <div class="col-xl-8 col-12">
                    <div class="card p-0" style="width: 100%;">
                        <div class="cardbody p-0"style="height: 614px;" id="rainGrid">
                            <!-- 그리드 영역 -->
                            <!-- 시트가 될 DIV 객체 -->
                            <div id="rainGridDIV" style="height: 100%; border-radius: 1rem; overflow: hidden;"></div>
                        </div>
                    </div>
                    <div class="card p-0" style="width: 100%;" hidden="">
                        <div class="cardbody p-0"style="height: 224px;" id="rainGridSw">
                            <!-- 그리드 영역 -->
                            <!-- 시트가 될 DIV 객체 -->
                            <div id="rainGridSwDIV" style="height: 100%; border-radius: 1rem; overflow: hidden;"></div>
                        </div>
                    </div>
                    <div class="row info" id="innerDom" style="height: calc(100% - 614px - 2rem);">
                        <%--                        <div style="width:30%;height:100%">--%>
                        <%--                            <div class="data-box-cmm box-wl-02 box-wl-02-selected"><div class="tit-set"><h3 class="m-0">신성교 |<a style="font-size: 0.8rem">수위계</a></h3><div class="last-upate mb08"><span class="date">05-02 02:19:00</span></div></div><span class="tbFont"><div class="value-box"><span class="value-set"><span class="value">0.28</span><span class="unit">m</span></span></div><div class="info-tbl"><table><thead><tr><th class="lv-01">관심</th><th class="lv-02">주의</th><th class="lv-03">경계</th><th class="lv-04">위험</th></tr></thead><tbody><tr><td class="">0.68</td><td class="">2.79</td><td class="">3.29</td><td class="">3.37</td></tr></tbody></table></div></span></div>--%>
                        <%--                            <div class="data-box-cmm box-wl-02 box-wl-02-selected"><div class="tit-set"><h3 class="m-0">청송교 |<a style="font-size: 0.8rem">수위계</a></h3><div class="last-upate mb08"><span class="date">05-02 02:19:00</span></div></div><span class="tbFont"><div class="value-box"><span class="value-set"><span class="value">0.28</span><span class="unit">m</span></span></div><div class="info-tbl"><table><thead><tr><th class="lv-01">관심</th><th class="lv-02">주의</th><th class="lv-03">경계</th><th class="lv-04">위험</th></tr></thead><tbody><tr><td class="">0.68</td><td class="">2.79</td><td class="">3.29</td><td class="">3.37</td></tr></tbody></table></div></span></div>--%>
                        <%--                        </div>--%>
                        <div style="width:30%;height:100%">
                            <div class="data-box-cmm box-wl-02 box-wl-02-selected"id="청송교"><div class="tit-set"><h3 class="m-0">청송교 |<a style="font-size: 0.8rem"> 수위계(cm)</a></h3><div class="last-upate mb08"><span class="date" name="swDate">05-02 02:19:00</span></div></div><span class="tbFont"><div class="info-tbl"><table><thead style="font-size: 1rem;"><tr><th class="lv-01">현 재</th><th class="lv-02">경 계</th><th class="lv-04">위 험</th></tr></thead><tbody style="font-size: 1.8rem;"><tr><td class="" name="swHour">0</td><td class="" name="swToday">370</td><td class="">500</td></tr></tbody></table></div></span></div>
                            <div class="data-box-cmm box-wl-02 box-wl-02-selected"id="신성교"><div class="tit-set"><h3 class="m-0">신성교 |<a style="font-size: 0.8rem"> 수위계(cm)</a></h3><div class="last-upate mb08"><span class="date" name="swDate">05-02 02:19:00</span></div></div><span class="tbFont"><div class="info-tbl"><table><thead style="font-size: 1rem;"><tr><th class="lv-01">현 재</th><th class="lv-02">경 계</th><th class="lv-04">위 험</th></tr></thead><tbody style="font-size: 1.8rem;"><tr><td class="" name="swHour">0</td><td class="" name="swToday">420</td><td class="">560</td></tr></tbody></table></div></span></div>
                        </div>

                        <div class="card p-0" style="width: calc(70% - 1rem); text-align: center;height: 100%;    margin-bottom: 0 !important;">
                            <!-- <div class="card p-0" style="width: 100%; text-align: center;height: calc(35% - 1rem);"> -->
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
                                        <div class="wi-icon"><div class="icontime" id="objTime0">06:00</div><img id="forecast0" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky0">맑은날씨</div><div id="tmp0">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime1">09:00</div><img id="forecast1" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky1">맑은날씨</div><div id="tmp1">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime2">12:00</div><img id="forecast2" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky2">맑은날씨</div><div id="tmp2">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime3">15:00</div><img id="forecast3" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky3">맑은날씨</div><div id="tmp3">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime4">18:00</div><img id="forecast4" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky4">맑은날씨</div><div id="tmp4">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime5">21:00</div><img id="forecast5" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky5">맑은날씨</div><div id="tmp5">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime6">00:00</div><img id="forecast6" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky6">맑은날씨</div><div id="tmp6">1도</div></div>
                                        <div class="wi-icon">             <div class="icontime" id="objTime7">03:00</div><img id="forecast7" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky7">맑은날씨</div><div id="tmp7">1도</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-12">
                    <div class="card mb-0" style="background-color: #191a19; color: #f03e3e; height: 4rem; ">
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
    var rainGridSw;
    const colWayArray = {'1': '대구광역시', '2': '달성군', '3': '군위군', '4': '문경시', '5': '청송읍', '6': '구미시'}
    const colWayIconArray = {
        '1': '/css/edsicon.png',
        '2': '/css/edsicon.png',
        '3': '/css/edsicon.png',
        '4': '/css/edsicon.png',
        '5': '/css/csicon.ico',
        '6': '/css/gumiicon.png'
    };
    const colWayLogoArray = {
        '1': '/css/edslogo.png',
        '2': '/css/edslogo.png',
        '3': '/css/edsLogo.png',
        '4': '/css/edslogo.png',
        '5': '/css/cslogo.png',
        '6': '/css/gumilogo.png'
    };
    window.onload = async function() {
        await loadData()
        //await drawMap('#container');
        await selectDevice();
        resetData();
        resetTime();
    };
    async function loadData()
    {
        rainGrid = new tui.Grid({
            el: document.getElementById('rainGridDIV'),
            scrollX: false,
            scrollY: false,
            editingEvent: 'click',
            bodyHeight: 'fitToParent',
            rowHeight:56,
            minRowHeight:56,
            header: {
                height: 112,
                minRowHeight: 112,
                complexColumns: [
                    {
                        header: '강우량(mm)',
                        name: 'rainfall',
                        childNames: ['r_abs_hour','r_abs_today','r_abs_yesterday','r_abs_month','r_abs_year']
                    },
                    {
                        header: '최대시우량(mm)',
                        name: 'rainfallmax',
                        childNames: ['rainMaxTime','rainMax']
                    },

                ],
            },
            columns:[],
            columnOptions: {
                resizable: true,
                /*frozenCount: 1,
                frozenBorderWidth: 2,*/ // 컬럼 고정 옵션
            },
            summary: {
                height: 56,
                position: 'bottom', // or 'top'

                columnContent: {
                    name: { template: function(valueMap) { return "<div class='text-center' style='word-spacing:3.5rem'>평 균</div>"}},
                    r_abs_hour: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_today: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_yesterday: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_month: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_year: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                }
            }
        });

        rainGrid.setColumns([
            { header:'지 역',			name:'name',		    minWidth:60, 	align:'center' ,defaultValue: 0,formatter: function (value){return `<a href="javascript:void(0);" style="word-spacing:0.5rem">`+value.value+`</a>`;}},
            { header:'시 우 량',			name:'r_abs_hour',	    minWidth:60, 	align:'right',	defaultValue: 0,formatter: function(value) {return Number(value.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });}},
            { header:'금 일',			name:'r_abs_today',	    minWidth:60, 	align:'right',	defaultValue: 0,formatter: function(value) {return Number(value.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });}},
            { header:'전 일',			name:'r_abs_yesterday',	minWidth:60,	align:'right',	defaultValue: 0,formatter: function(value) {return Number(value.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });}},
            { header:'월 간',			name:'r_abs_month',		minWidth:60,	align:'right',	defaultValue: 0,formatter: function(value) {return Number(value.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });}},
            { header:'연 간',		    name:'r_abs_year',		minWidth:60,	align:'right',	defaultValue: 0,formatter: function(value) {return Number(value.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });}},
            { header:'시 간 대',			name:'rainMaxTime',		minWidth:60,	align:'right',	defaultValue: 0,formatter: function (value){return value.value?value.value+"시":"0시";}},
            { header:'시 우 량',		    name:'rainMax',		minWidth:60,	align:'right',	defaultValue: 0,formatter: function(value) {return Number(value.value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });}},
            // hidden(숨김)
        ]);
        rainGridSw = new tui.Grid({
            el: document.getElementById('rainGridSwDIV'),
            scrollX: false,
            scrollY: false,
            editingEvent: 'click',
            bodyHeight: 'fitToParent',
            rowHeight:50,
            minRowHeight:50,
            header: {
                height: 100,
                minRowHeight: 100,
                complexColumns: [
                    {
                        header: '수위(cm)',
                        name: 'rainfall',
                        childNames: ['r_abs_hour','r_abs_today','r_abs_yesterday','r_abs_month','r_abs_year']
                    },

                ],
            },
            columns:[],
            columnOptions: {
                resizable: true,
                /*frozenCount: 1,
                frozenBorderWidth: 2,*/ // 컬럼 고정 옵션
            },
            summary: {
                height: 50,
                position: 'bottom', // or 'top'

                columnContent: {
                    name: { template: function(valueMap) { return "<div class='text-center' style='word-spacing:3.5rem'>평 균</div>"}},
                    r_abs_hour: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_today: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_yesterday: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_month: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                    r_abs_year: { template: function(valueMap) { return (toFixmmAvg(valueMap.filtered.avg)).toString();}},
                }
            }
        });

        rainGridSw.setColumns([
            { header:'지 역',			name:'name',		    minWidth:60, 	align:'center' ,defaultValue: 0,formatter: function (value){return `<a href="javascript:void(0);" style="word-spacing:0.5rem">`+value.value+`</a>`;}},
            { header:'시 간',			name:'r_abs_hour',	    minWidth:60, 	align:'right',	defaultValue: 0},
            { header:'금 일',			name:'r_abs_today',	    minWidth:60, 	align:'right',	defaultValue: 0},
            // hidden(숨김)
        ]);
        //initData(gridData);
        tui.Grid.setLanguage('ko');
        tui.Grid.applyTheme('striped',{
            selection: {
                background: '#4daaf9',
                border: '#4daaf9',
            },
            scrollbar: {
                background: '#f5f5f5',
                thumb: '#d9d9d9',
                active: '#c1c1c1'
            },
            row: {
                hover: {
                    background: '#e4edf4'
                },
            },
            area: {
                header: {
                    border: '#6d6766',
                },
                summary: {
                    border: '#cfd1d6',
                },
            },
            cell: {
                normal: {
                    background: '#f4f4f4',
                    border: '#cfd1d6',
                    showVerticalBorder: true,
                    /*showHorizontalBorder: false,*/
                },
                header: {
                    background: '#6d6766',
                    border: '#cfd1d6',
                    /*showVerticalBorder: true*/
                },
                rowHeader: {
                    background: '#fff',
                    border: '#cfd1d6',
                    showVerticalBorder: true
                },
                summary: {
                    background: '#dedcd3',
                    border: '#cfcdc7',
                    showVerticalBorder: true,
                },
                selectedHeader: {
                    background: '#dbe9f5',
                },
                selectedRowHeader: {
                    background: '#dbe9f5',
                },
                editable: {
                    background: '#fff'
                },
                selectedHeader: {
                    background: '#6d6766'
                },
                focused: {
                    border: '#6eafb6',
                },
                disabled: {
                    background: 'none',
                    text: '#b0b0b0'
                },
                required: {
                    background: '#fffdeb',
                },
                invalid: {
                    background: '#ffe5e5',
                },
            },
        });
    }
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
    async function initAPI()
    {
        var param = {};
        let rainData1=await edsUtil.getAjax("/RAIN_MAIN/getRadarImg", param);
        var tmpDate = new Date();
        console.log("rainData1")
        console.log(rainData1)
        if(Object.keys(rainData1).length>0)
        {
            const filename = rainData1.radarName; // 가져올 이미지 파일 이름
            console.log(filename)

            const imageUrl = `/images/radar/`+filename; // API 엔드포인트
            console.log(imageUrl)
            const imgElement = document.getElementById('raderImg');

            fetch(imageUrl)
                .then(response => {
                    if (!response.ok) {
                        // 404 에러가 발생했을 경우, 이전 이미지 유지
                        console.error('Image not found:', response.status);
                        return; // 아무것도 하지 않음
                    }
                    return response.blob(); // Blob 형태로 응답을 변환
                })
                .then(blob => {
                    if (blob) {
                        const url = URL.createObjectURL(blob); // Blob을 URL로 변환
                        imgElement.src = url; // 이미지 소스 업데이트
                    }
                })
                .catch(error => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        }
        else
        {
            console.log('데이터없음')
        }

        var param = {};
        let rainData=await edsUtil.getAjax("/RAIN_MAIN/getSatelliteImg", param);
        console.log(rainData)
        if(Object.keys(rainData).length>0)
        {
            const filename = rainData.sateName; // 가져올 이미지 파일 이름

            const imageUrl = `/images/sailimg/`+filename; // API 엔드포인트

            const imgElement = document.getElementById('raderImg2');

            fetch(imageUrl)
                .then(response => {
                    if (!response.ok) {
                        // 404 에러가 발생했을 경우, 이전 이미지 유지
                        console.error('Image not found:', response.status);
                        return; // 아무것도 하지 않음
                    }
                    return response.blob(); // Blob 형태로 응답을 변환
                })
                .then(blob => {
                    if (blob) {
                        const url = URL.createObjectURL(blob); // Blob을 URL로 변환
                        imgElement.src = url; // 이미지 소스 업데이트
                    }
                })
                .catch(error => {
                    console.error('There has been a problem with your fetch operation:', error);
                });

        }
        else
        {
            console.log('데이터없음')
        }
    }
    // async function initAPI()
    // {
    //
    //     let raderImg1= document.getElementById('raderImg');
    //     var param = {};
    //     let rainData1=await edsUtil.getAjax("/RAIN_MAIN/getRadarImg", param);
    //
    //     var tmpDate = new Date();
    //     if(Object.keys(rainData1).length>0)
    //     {
    //         raderImg1.src="";
    //         var url1=`/images/radar.png?`+tmpDate.getTime()
    //         //var url2=`https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/imageList?sDate=`+date+`0000&eDate=`+date+`2359&authKey=tnvu9MccTDe77vTHHAw3BA`
    //         raderImg1.src=url1;
    //     }
    //     else
    //     {
    //         console.log('데이터없음')
    //     }
    //
    //     let raderImg2= document.getElementById('raderImg2');
    //     var param = {};
    //     let rainData=await edsUtil.getAjax("/RAIN_MAIN/getSatelliteImg", param);
    //
    //     if(Object.keys(rainData).length>0)
    //     {
    //         var url2=`/images/Satellite.png?`+tmpDate.getTime()
    //         //var url2=`https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/imageList?sDate=`+date+`0000&eDate=`+date+`2359&authKey=tnvu9MccTDe77vTHHAw3BA`
    //         raderImg2.src=url2;
    //     }
    //     else
    //     {
    //         console.log('데이터없음')
    //     }
    //
    // }
    async function selectDevice() {
        rainGrid.refreshLayout(); // 데이터 초기화
        rainGrid.finishEditing(); // 데이터 마감
        rainGrid.clear(); // 데이터 초기화
        var param = {};
        param.rainDate = edsUtil.getToday('%Y%m');
        let rainDevice = await edsUtil.getAjax("/RAIN_MAIN/selectDevice", param);
        if (rainDevice.length > 0) {
            document.getElementById("mainTitle").innerHTML = colWayArray[rainDevice[0].colWay];
            document.getElementById("mainIcon").href = colWayIconArray[rainDevice[0].colWay];
            document.getElementById("mainLogo").src = colWayLogoArray[rainDevice[0].colWay];
        }
        rainGrid.resetData(rainDevice);
        return rainDevice;
    }

    async function selectRainData() {
        var param = {};
        param.rainDate = await edsUtil.getToday('%Y%m%d%H%i%s');
        param.columnName = "H" + param.rainDate.substr(8, 2);
        let rainData = edsUtil.getAjax("/RAIN_MAIN/selectRainData", param);
        console.log(rainData)
        let gridData = rainGrid.getData();
        let maxValue = 0;
        let minValue = 0;
        let maxTimeValue = 0;
        let minTimeValue = 0;

        if ((rainData.length > 0)) {
            maxValue = rainData[0].r_abs_today;
            minValue = rainData[0].r_abs_today;
            maxTimeValue = rainData[0].rainMax;
            minTimeValue = rainData[0].rainMax;
        }
        for (const gridRow of gridData)
        {
            for (const datas of rainData) {
                if(datas.uid==gridRow.uid)
                {
                    if (Number(datas.r_abs_today) >= Number(maxValue)) maxValue = datas.r_abs_today;
                    if (Number(datas.r_abs_today) < Number(minValue)) minValue = datas.r_abs_today;
                    if (Number(datas.rainMax) >= Number(maxTimeValue)) maxTimeValue = datas.rainMax;
                    if (Number(datas.rainMax) < Number(minTimeValue)) minTimeValue = datas.rainMax;
                }
            }
        }
        for(const gridRow of gridData)
        {
            let rowKey= gridRow.rowKey;
            for(const datas of rainData)
            {
                if(datas.uid==gridRow.uid)
                {
                    rainGrid.setValue(rowKey,'r_abs_hour',(datas.r_abs_hour));
                    rainGrid.setValue(rowKey,'r_abs_today',maxminValue(rowKey,datas.r_abs_today,maxValue,minValue));
                    rainGrid.setValue(rowKey,'r_abs_yesterday',(datas.r_abs_yesterday));
                    rainGrid.setValue(rowKey,'r_abs_year',(datas.r_abs_year));
                    rainGrid.setValue(rowKey,'r_abs_month',(datas.r_abs_month));
                    //rainGrid.setValue(rowKey,'rainMax',maxminTimeValue(rowKey,datas.rainMax,maxTimeValue,minTimeValue));
                    rainGrid.setValue(rowKey,'rainMax',(datas.rainMax));
                    rainGrid.setValue(rowKey,'rainMaxTime',(datas.rainMaxTime));
                }


            }
        }

        //initDataSvg();//이미지 데이터 인풋
        initAPI();
        selectWaterLvData();
        callJsonApi(url);
        callAwsApi();
        callForecastApi();
    }
    async function selectWaterLvData() {
        var param = {};
        let waterLvData = edsUtil.getAjax("/WATERLV_MAIN/selectWaterLvData", param);


        for(const waterLv of waterLvData)
        {
            const name=waterLv.name;
            const element = document.getElementById(name);
            console.log(waterLv)
            if(waterLv.name==='신성교'||waterLv.name==='청송교')
            {
                const swHourElement = element.querySelector('[name="swHour"]');
                const swDateElement = element.querySelector('[name="swDate"]');
                console.log(waterLv.eventtime)
                const date=formatDateTime(waterLv.eventTime)
                console.log()
                swHourElement.innerHTML=Math.round(Number(waterLv.waterLv) * 100);
                swDateElement.innerHTML=date;

            }
        }
    }
    function maxminValue(rowKey,value,maxValue,minValue) {
        let returnValue='';
        rainGrid.removeCellClassName(rowKey , 'r_abs_today' , 'red')
        rainGrid.removeCellClassName(rowKey , 'r_abs_today' , 'blue' );
        if(maxValue==0 && minValue==0)
        {
            return (value);
        }
        if(value==maxValue) {
            rainGrid.addCellClassName(rowKey, 'r_abs_today', 'red');
        }
        else if(Number(value)==Number(minValue))
            rainGrid.addCellClassName( rowKey , 'r_abs_today' , 'blue' );

        else
            returnValue=(value);

        return (value);

    }
    function maxminTimeValue(rowKey,value,maxValue,minValue) {
        let returnValue='';
        rainGrid.removeCellClassName(rowKey , 'rainMax' , 'red')
        rainGrid.removeCellClassName(rowKey , 'rainMax' , 'blue' );
        if(maxValue==0 && minValue==0)
        {
            return (value);
        }
        if(value==maxValue) {
            rainGrid.addCellClassName(rowKey, 'rainMax', 'red');
        }
        else if(Number(value)==Number(minValue))
            rainGrid.addCellClassName( rowKey , 'rainMax' , 'blue' );

        else
            returnValue=(value);

        return (value);

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
    const url="/RAIN_MAIN/getSepcialReport";
    function callJsonApi(url) {  // Text API 호출 함수
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
                    console.log(result)
                    for(const data of spacData)
                    {
                        let spacName=data.wrn+data.lvl;
                        data.tm_FC = data.tm_FC.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5');
                        spacString+=data.tm_FC+` [`+spacName+`] `+data.cmd;
                    }
                    specArea.innerHTML=spacString;
                }
                else
                {
                    specArea.innerHTML="기상특보 없음";

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
                        console.log(skynum)
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
                                skysvg='partly-cloudy-day-snow';
                                break;
                            case '2-4':
                                skysvg='partly-cloudy-day-rain';
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
                                skysvg='snow';
                                break;
                            case '3-4':
                                skysvg='rain';
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
                                skysvg='overcast-snow';
                                break;
                            case '4-4':
                                skysvg='overcast-rain';
                                break;
                            default:
                                skysvg='clear-day';
                                break;
                        }

                        document.getElementById(id).src=src+skysvg+".svg";
                        document.getElementById(sky).innerHTML = obj.sky+"<br>"+obj.pty;
                        document.getElementById(tmp).innerHTML = obj.tmp+" °C";
                        document.getElementById(objTime).innerHTML=  obj.forecastTime.substring(0, 2) + ':' + obj.forecastTime.substring(2, 4);

                        currentDate.setHours(currentDate.getHours() + 3);
                    }

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
        const formattedResult = num.toFixed(1);
        return Number(formattedResult).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
       // return Number(formattedResult).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    function formatDateTime(inputDateTime) {
        // 입력된 문자열에서 연도, 월, 일, 시간, 분 추출
        var year = inputDateTime.substring(0, 4);
        var month = inputDateTime.substring(4, 6);
        var day = inputDateTime.substring(6, 8);
        var hour = inputDateTime.substring(8, 10);
        var minute = inputDateTime.substring(10, 12);

        // 원하는 포맷으로 날짜와 시간 조합
        var formattedDateTime = month + "-" + day + " " + hour + ":" + minute + ":00";

        return formattedDateTime;
    }

</script>
</html>