<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE8,IE=EmulateIE11"/>
    <title id="mainTitle">이디에스</title>
    <link rel="icon" id="mainIcon" type="image/png" href="/css/edsicon.png">
    <link rel="stylesheet" href="/tui/tui-grid/dist/tui-grid.css"/>
    <script type="text/javascript" src='/plugins/toastr/toastr.min.js'></script>
    <script type="text/javascript" src='/plugins/toastr/toastrmessage.js'></script>
    <script src="/js/com/d3.js"></script>
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
    <script src="/tui/tui-grid/dist/tui-grid.js"></script>
    <link rel="stylesheet" href="/css/rain_grid_ds.css">
    <!-- fontNoto -->
    <link type="text/css" rel="stylesheet" href="/css/fontNoto.css">
    <!-- <link rel="stylesheet" href="https://unpkg.com/@latte-ui/css@2.0.0-dev.7/dist/latte-ui.css" type="text/css"/> -->
</head>

<style>
    /* 움직이는 텍스트 */
    .animated-title {font-size:2rem; font-weight:300; position: relative; width: 100%;max-width:100%; height: inherit; overflow-x: hidden; overflow-y: hidden; }
    .animated-title .track {position: absolute; white-space: nowrap;will-change: transform;animation: marquee 40s linear infinite; }
    @keyframes marquee {
        from { transform: translateX(100%); }
        to { transform: translateX(-100%); }
    }
    @media (hover: hover) and (min-width: 700px){
        .animated-title .content {-webkit-transform: translateY(calc(100% - 3rem)); transform: translateY(calc(100% - 3rem));}
    }
    #states path {
        fill: #f6f8fd;
        stroke: #ffffff;
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
        border:1px solid #e2e2e2;;
        border-radius: 5px;
        box-shadow: 0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2);

    }
    .card:hover
    {
        box-shadow: 0 0 5px rgba(60,140,187, 0.5), 0 1px 15px rgba(0,0,0,.2);
    }
    .tui-grid-cell-selected
    {
        background-color: #ffffff !important;
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
        font-size: 1.5rem !important;
        letter-spacing: -.5px;
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

    .value_boxes .value-box2:first-child {
        width: 105px;
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
        margin-right: 10px;
        gap: 8px;
        margin-left: 0px;
    }
    .info>div.rain {
        width: 32.5%;
    }
    .info>div.rain-all {
        width: 50%;
    }
    .value_boxes .value-box2:last-child {
        width: 135px;
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
        margin: 2px 2px 0 0;
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
    .box-wl-01 span, .value-box {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
        -ms-flex-pack: justify;
        justify-content: space-between;
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
    .headerWicon
    {
        /* position: relative; */
        display: flex;
        padding: 12px 12px;
        align-items: center;
        flex-flow: column;
        justify-content: start;
        background: hsla(var(--gray-0));
        border-radius: 6px;
        box-shadow: var(--shadow-2);
        flex-direction: row;
        font-size: 1rem;
        height: 60px;
        float: right;
        width: fit-content;
    }
</style>
<body style=" display: flex; height: 100vh; color: #333;">
<div class="col-lg-12 p-0" style="width: 100%;">
    <section class="content-header col-lg-10 col-12" style="margin: auto;padding: 10px;">
        <div style="text-align: center">
            <div style="height: 60px" onclick="toggleFullScreen()">
                <img id="mainLogo" src="" style="height: 51px;float: left; margin-right: 10px" alt="로고">

                <img src="/css/dalsung_slogan_.png" style="height: 35px;float: left; margin-top: 5px" alt="로고">
                <span style="font-size: 2.5rem; font-weight: bold;"></span>
                <div class="headerWicon" style="background: #d7d7d7; border: 1px solid #edeef1;"><img id="forecast0" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" style="height: 60px" alt=""><div class="icontime mr-2" id="sky0">맑은날씨</div><div class="icontime"  style="color: #ff1744" id="tmp0">1도</div></div>

            </div>
        </div>
    </section>
    <div  class=" navbar navbar-expand" style="border-top: 1px solid #cdcdcd;border-bottom: 1px solid #cdcdcd;">
        <ul class="navbar-nav">
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarScrollingDropdown" role="button"
                   data-toggle="dropdown" aria-expanded="false" style="color: #333;">
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
                </ul>
            </li>
        </ul>
        <ul class="navbar-nav ml-auto">
            <li class="nav-item">
                <h1 class="info-box-text time float-right" name="viewDateTime" id="viewDateTime"></h1>
            </li>
        </ul>
    </div>
    <section >
        <div class="container-fluid" style="background-color: #f4f6f9;padding-top: 7.5px">

            <div class="row col-lg-10 col-12"  style="margin: auto" >
                <div class="col-lg-12" style="margin-bottom: 7.5px">
                    <div class="card mb-0" style="background-color: #191a19; color: #f03e3e; height: 4rem; ">
                        <div class="animated-title">
                            <div class="track">
                                <div class="content"  style="min-width: 100vw;" id="spacArea"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-4 col-12 " style="text-align: center;">
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/images/radar.png"  name = 'raderImg' id="raderImg" alt="이미지 수신중" style="width: 100%; min-width:290px; height: 350px;" >
                    </div>
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/images/Satellite.png"  name = 'raderImg2' id="raderImg2" alt="이미지 수신중"style="width: 100%; min-width:290px; height: 350px;">

                    </div>
                </div>
                <div class="col-xl-8 col-12">
                    <div class="row info" id="innerDom" style=" width: 100%">
                        <div class="card p-" style="width: 100%; text-align: center;height: 100%; margin-bottom: 0 !important;">
                            <!-- <div class="card p-0" style="width: 100%; text-align: center;height: calc(35% - 1rem);"> -->
                            <div class="card-header border-0 pb-0" >
                                <h3 class="card-title text-bold">기상정보</h3>
                            </div>
                            <div class="card-body pr-2 pl-2 pt-2"style="width: 100%;">

                                <div class="row" style="padding: 0 2rem; font-size: 1rem;">
                                    <div class="col-lg-4 text-left border-bottom">
                                        <span class="info-box-icon"><i class="fa-solid fa-temperature-high"style="color:#ff0000b3; font-size: 1rem"></i>&nbsp&nbsp현재 온도&nbsp&nbsp:&nbsp&nbsp<strong id='TA' style="">0</strong><span class="text-sm">°C</span></span>
                                    </div>
                                    <div class="col-lg-4 text-left border-bottom">
                                        <span class="info-box-icon"><i class="fa-solid fa-droplet" style="color: #5ac8ffb3; font-size: 1rem"></i>&nbsp&nbsp현재 습도&nbsp&nbsp:&nbsp&nbsp<strong id='HM' style="">0</strong><span class="text-sm">%</span></span>
                                    </div>
                                    <div class="col-lg-4 text-left border-bottom">
                                        <span class="info-box-icon"><i class="fa-solid fa-wind"style="color: #001cf1b3;font-size: 1rem"></i>&nbsp&nbsp현재 바람&nbsp&nbsp:&nbsp&nbsp<strong id='WS1' style="">0</strong><span class="text-sm">m/s</span></span>
                                    </div>
                                    <div class="wi-icons wi-icons-new w-100 display-none" style="font-size: 1rem;display: none;">

                                        <div class="wi-icon"><div class="icontime" id="objTime1">09:00</div><img id="forecast1" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky1">맑은날씨</div><div id="tmp1">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime2">12:00</div><img id="forecast2" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky2">맑은날씨</div><div id="tmp2">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime3">15:00</div><img id="forecast3" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky3">맑은날씨</div><div id="tmp3">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime4">18:00</div><img id="forecast4" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky4">맑은날씨</div><div id="tmp4">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime5">21:00</div><img id="forecast5" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky5">맑은날씨</div><div id="tmp5">1도</div></div>
                                        <div class="wi-icon"><div class="icontime" id="objTime6">00:00</div><img id="forecast6" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky6">맑은날씨</div><div id="tmp6">1도</div></div>
                                        <div class="wi-icon">             <div class="icontime" id="objTime7">03:00</div><img id="forecast7" src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt=""><div id="sky7">맑은날씨</div><div id="tmp7">1도</div></div>
                                    </div>
                                </div>
                                <div class=" p-0" style="width: 100%;">
                                    <div class=" p-0"style="height: 663px;" id="rainGrid">
                                        <!-- 그리드 영역 -->
                                        <!-- 시트가 될 DIV 객체 -->
                                        <div id="rainGridDIV" style="height: 100%; border-radius: 5px; border:1px solid #e2e2e2;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card p-0" style="width: 100%;" hidden="">
                        <div class="cardbody p-0"style="height: 224px;" id="rainGridSw">
                            <!-- 그리드 영역 -->
                            <!-- 시트가 될 DIV 객체 -->
                            <div id="rainGridSwDIV" style="height: 100%; border-radius: 1rem;"></div>
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
    var colWayArray = {'1': '대구광역시', '2': '군위군', '3': '달성군', '4': '문경시', '5': '청송읍', '6': '구미시'};
    var colWayIconArray = {
        '1': '/css/edsicon.png',
        '2': '/css/edsicon.png',
        '3': '/css/dsicon.png',
        '4': '/css/edsicon.png',
        '5': '/css/csicon.ico',
        '6': '/css/gumiicon.png'
    };
    var colWayLogoArray = {
        '1': '/css/edslogo.png',
        '2': '/css/edslogo.png',
        '3': '/css/logo_header.png',
        '4': '/css/edslogo.png',
        '5': '/css/cslogo.png',
        '6': '/css/gumilogo.png'
    };

    window.onload = function() {
        loadData().then(function() {
            //drawMap('#container');
            return selectDevice();
        }).then(function() {
            resetData();
            resetTime();
        }).catch(function(err) {
            console.error('Error:', err);
        });
    };

    function loadData() {
        return new Promise(function(resolve, reject) {
            rainGrid = new tui.Grid({
                el: document.getElementById('rainGridDIV'),
                scrollX: false,
                scrollY: false,
                editingEvent: 'click',
                bodyHeight: 'fitToParent',
                rowHeight: 30,
                minRowHeight: 30,
                header: {
                    height: 65,
                    minRowHeight: 65,
                    complexColumns: [
                        {
                            header: '강우량(mm)',
                            name: 'rainfall',
                            childNames: ['r_abs_hour','r_abs_today','r_abs_yesterday','r_abs_month','r_abs_year']
                        }
                    ],
                },
                columns: [],
                columnOptions: {
                    resizable: true
                },
                summary: {
                    height: 30,
                    position: 'bottom',
                    columnContent: {
                        name: { template: function(valueMap) { return "<div class='text-center' style='word-spacing:3.5rem'>평 균</div>"; }},
                        r_abs_hour: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_today: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_yesterday: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_month: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_year: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                    }
                }
            });

            rainGrid.setColumns([
                { header: '지 역', name: 'name', minWidth: 60, align: 'center', defaultValue: 0, formatter: function(value) { return '<a href="javascript:void(0);" style="word-spacing:0.5rem">' + value.value + '</a>'; }},
                { header: '시 우 량', name: 'r_abs_hour', minWidth: 60, align: 'right', defaultValue: 0 },
                { header: '금 일', name: 'r_abs_today', minWidth: 60, align: 'right', defaultValue: 0 },
                { header: '전 일', name: 'r_abs_yesterday', minWidth: 60, align: 'right', defaultValue: 0 },
                { header: '월 간', name: 'r_abs_month', minWidth: 60, align: 'right', defaultValue: 0 },
                { header: '연 간', name: 'r_abs_year', minWidth: 60, align: 'right', defaultValue: 0 }
            ]);

            tui.Grid.setLanguage('ko');
            tui.Grid.applyTheme('striped', {
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
                        border: '#3655b5',
                    },
                    summary: {
                        border: '#3655b5',
                    },
                },
                cell: {
                    normal: {
                        background: '#f4f4f4',
                        border: '#cfd1d6',
                        showVerticalBorder: true,
                        showHorizontalBorder: true
                    },
                    header: {
                        background: '#fff',
                        border: '#cfd1d6'
                    },
                    rowHeader: {
                        background: '#fff',
                        border: '#cfd1d6',
                        showVerticalBorder: true
                    },
                    summary: {
                        background: '#fff',
                        border: '#cfcdc7',
                        showVerticalBorder: true
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
                    }
                }
            });

            resolve();
        });
    }
    var week=new Array('일','월','화','수','목','금','토');

    function initTime() {
        var dateInfo = new Date();
        var hour = modifyNumber(dateInfo.getHours());
        var min = modifyNumber(dateInfo.getMinutes());
        var sec = modifyNumber(dateInfo.getSeconds());
        var year = dateInfo.getFullYear();
        var month = dateInfo.getMonth() + 1;
        var date = dateInfo.getDate();
        var today = new Date().getDay();
        var todayLabel = week[today];

        document.getElementById("viewDateTime").innerHTML = year + "년 " + month + "월 " + date + "일  (" + todayLabel + ")  " + hour + ":" + min;
    }
    function modifyNumber(time){
        if(parseInt(time)<10){
            return "0"+ time;
        }
        else
            return time;
    }
    function toStringByFormatting(source) {

        let nowDate=new Date(source);
        let returnDate = nowDate.getFullYear()+(nowDate.getMonth()+1).toString().padStart(2,'0')+(nowDate.getDate()).toString().padStart(2,'0')
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

    function initAPI() {
        var raderImg1 = document.getElementById('raderImg');
        var param = {};
        getAjax("/RAIN_MAIN/getRadarImg", param).then(function(rainData1) {
            var tmpDate = new Date();
            if (Object.keys(rainData1).length > 0) {
                var url1 = '/images/radar.png?' + tmpDate.getTime();
                raderImg1.src = url1;
            } else {
                console.log('데이터없음');
            }

            var raderImg2 = document.getElementById('raderImg2');
            getAjax("/RAIN_MAIN/getSatelliteImg", param).then(function(rainData) {
                if (Object.keys(rainData).length > 0) {
                    var url2 = '/images/Satellite.png?' + tmpDate.getTime();
                    raderImg2.src = url2;
                } else {
                    console.log('데이터없음');
                }
            });
        }).catch(function(err) {
            console.error('Error:', err);
        });
    }
    function selectDevice() {
        return new Promise(function(resolve, reject) {
            rainGrid.refreshLayout();
            rainGrid.finishEditing();
            rainGrid.clear();
            var param = {};
            param.rainDate = getToday('%Y%m');
            getAjax("/RAIN_MAIN/selectDevice", param).then(function(rainData) {
                if (Object.keys(rainData).length > 0) {
                    document.getElementById("mainTitle").innerHTML = colWayArray[rainData[0].colWay];
                    document.getElementById("mainIcon").href = colWayIconArray[rainData[0].colWay];
                    document.getElementById("mainLogo").src = colWayLogoArray[rainData[0].colWay];
                    rainGrid.resetData(rainData);
                } else {
                    console.log('데이터없음');
                }
                resolve();
            }).catch(function(err) {
                console.error('Error:', err);
                reject(err);
            });
        });
    }

    function selectRainData() {
        var param = {};
        param.rainDate =  getToday('%Y%m%d%H%i%s');
        param.columnName = "H" + param.rainDate.substr(8, 2);
        getAjax("/RAIN_MAIN/selectRainData", param).then(function(rainData) {
            let gridData = rainGrid.getData();
            let maxValue = 0;
            let minValue = 0;

            if ((rainData.length > 0)) {
                maxValue = rainData[0].r_abs_today;
                minValue = rainData[0].r_abs_today;
            }
            gridData.forEach(function(gridRow)
            {
                rainData.forEach(function(datas) {
                    if(datas.uid==gridRow.uid)
                    {
                        if (Number(datas.r_abs_today) >= Number(maxValue)) maxValue = datas.r_abs_today;
                        if (Number(datas.r_abs_today) < Number(minValue)) minValue = datas.r_abs_today;
                    }
                });
            });
            gridData.forEach(function(gridRow)
            {
                let rowKey= gridRow.rowKey;
                rainData.forEach(function(datas)
                {
                    if(datas.uid==gridRow.uid)
                    {
                        rainGrid.setValue(rowKey,'r_abs_hour',(datas.r_abs_hour));
                        rainGrid.setValue(rowKey,'r_abs_today',maxminValue(rowKey,datas.r_abs_today,maxValue,minValue));
                        rainGrid.setValue(rowKey,'r_abs_yesterday',(datas.r_abs_yesterday));
                        rainGrid.setValue(rowKey,'r_abs_year',(datas.r_abs_year));
                        rainGrid.setValue(rowKey,'r_abs_month',(datas.r_abs_month));
                    }


                });
            });
        }).catch(function(err) {
            console.error('Error:', err);
        });


        //initDataSvg();//이미지 데이터 인풋
        initAPI();
        callJsonApi(url);
        callAwsApi();
        callForecastApi();
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
    function toFixmmAvg(num)
    {
        const result = num * 100;
        const formattedResult =  Math.floor(result);
        const formatted=formattedResult/100
        return formatted;
    }
    function resetTime()
    {
        initTime();
        setTimeout(resetTime, 1000);
    }
    let interval = 120000; // 60초
    function resetData()
    {

        selectRainData();
        setTimeout(resetData, interval);

    }
    // 코드 실행 시작 시간을 기록합니다.
    let startTime = getToday('%Y%m');
    let url="/RAIN_MAIN/getSepcialReport";
    function callJsonApi(url) {  // Text API 호출 함수
        $.ajax({
            method:"POST",
            url:url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json; charset=UTF-8",
            //: false,	//동기방식으로 전송
            success: function(result) {
                let specArea=document.getElementById("spacArea");
                if(result.data.length>0)
                {
                    let spacData=result.data;//특보데이터
                    let spacString='';
                    console.log(result)
                    spacData.forEach(function(data)
                    {
                        let spacName=data.wrn+data.lvl;
                        data.tm_FC = data.tm_FC.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5');
                        spacString+=data.tm_FC+' ['+spacName+'] '+data.cmd+"&nbsp&nbsp;&nbsp;&nbsp;&nbsp;";
                    });
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
            //: false,	//동기방식으로 전송
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
            async:false,
            contentType: "application/json; charset=UTF-8",
            //: false,	//동기방식으로 전송
            success: function(result) {
                if(result.result==1)
                {
                    let data=result.data;
                    let startTime = getToday('%Y-%m-%d %H:')+"00";
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
                        let id='forecast'+i;
                        let obj=data[result];
                        let doc=document.getElementById(id);
                        let sky='sky'+i;
                        let objTime='objTime'+i;
                        let tmp='tmp'+i;
                        let skynum=obj.skynum +"-" +obj.ptynum;
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
                        // document.getElementById(objTime).innerHTML=  obj.forecastTime.substring(0, 2) + ':' + obj.forecastTime.substring(2, 4);

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
        let result = num / 10;
        let formattedResult = result.toFixed(1);
        return formattedResult;
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
    function CrawlerReq()
    {
        let currentDate = new Date();
        let currentDay = currentDate.getDate();
        let currentMonth = currentDate.getMonth() + 1; // 월은 0부터 시작하므로 1을 더해줍니다.
        let currentYear = currentDate.getFullYear();
        let formattedCurrentDate = currentYear + '-' + (currentMonth < 10 ? '0' + currentMonth : currentMonth) + '-' + (currentDay < 10 ? '0' + currentDay : currentDay);
        let formattedNowDate = (currentMonth < 10 ? '0' + currentMonth : currentMonth) + '-' + (currentDay < 10 ? '0' + currentDay : currentDay) + ' ' + (currentDate.getHours() < 10 ? '0' + currentDate.getHours() : currentDate.getHours()) + ':' + (currentDate.getMinutes() < 10 ? '0' + currentDate.getMinutes() : currentDate.getMinutes()+":00");
        $.ajax({
            method:"POST",
            url:'/crawl',
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            data: JSON.stringify({ url: 'https://www.cs.go.kr/specialty/00003173/00006749.web' }),
            //: false,	//동기방식으로 전송
            success: function (result) {
                result.forEach(function(item)
                {
                    let location = item['지역'];
                    let element = document.getElementById(location);
                    if (element) {
                        console.log(element);
                        let swDateElement = element.querySelector('[name="swDate"]');
                        let swHourElement = element.querySelector('[name="swHour"]');
                        if(swDateElement)
                        {
                            swDateElement.innerHTML=formattedNowDate;
                        }
                        if (swHourElement) {
                            if(location=="신성교")//임시 실제설치시는 삭제ㄷ
                            {
                                //swHourElement.innerHTML=21.6;
                            }
                            else
                            {
                                swHourElement.innerHTML = item['시간'];
                            }

                        }
                        // 데이터의 날짜와 현재 날짜를 비교하여 일치하는 경우 콘솔에 알림을 출력합니다.
                        if (item[formattedCurrentDate]) {
                            let swTodayElement = element.querySelector('[name="swToday"]');

                            if(location=="신성교")//임시 실제설치시는 삭제
                            {
                                //swTodayElement.innerHTML=21.6;
                            }
                            else
                            {
                                //swTodayElement.innerHTML = item[formattedCurrentDate];
                            }
                        }
                    }
                });
            },
            error: function (xhr, status, error) {
                console.log("실패");
            }
        });
    }
    function getToday(param) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                url: "/eds/erp/com/getToday",
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                type: "POST",
                data: { param: param },
                success: function(result) {
                    if (!result.sess && typeof result.sess !== "undefined") {
                        alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                        reject(new Error("Session expired"));
                        return;
                    }
                    resolve(result);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("AJAX error:", textStatus, errorThrown);
                    reject(new Error("AJAX request failed"));
                }
            });
        });
    }
    function getAjax(url, param) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                url: url,
                dataType: "json",
                contentType: "application/json; charset=UTF-8",
                type: "POST",
                data: JSON.stringify(param),
                success: function(result) {
                    if (!result.sess && typeof result.sess !== "undefined") {
                        alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                        reject(new Error("Session expired"));
                        return;
                    }
                    if (result.result === 1) {
                        resolve(result.data);
                    } else {
                        resolve([]);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("AJAX error:", textStatus, errorThrown);
                    reject(new Error("AJAX request failed"));
                }
            });
        });
    }

</script>
</html>