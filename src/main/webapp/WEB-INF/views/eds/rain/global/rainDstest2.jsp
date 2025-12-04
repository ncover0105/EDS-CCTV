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
    var rainGridSw;
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
            //await drawMap('#container');
            selectDevice().then(function() {
                resetData();
                resetTime();
            });
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
                            childNames: ['r_abs_hour', 'r_abs_today', 'r_abs_yesterday', 'r_abs_month', 'r_abs_year']
                        }
                    ]
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
                        r_abs_year: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }}
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

            rainGridSw = new tui.Grid({
                el: document.getElementById('rainGridSwDIV'),
                scrollX: false,
                scrollY: false,
                editingEvent: 'click',
                bodyHeight: 'fitToParent',
                rowHeight: 50,
                minRowHeight: 50,
                header: {
                    height: 100,
                    minRowHeight: 100,
                    complexColumns: [
                        {
                            header: '수위(cm)',
                            name: 'rainfall',
                            childNames: ['r_abs_hour', 'r_abs_today', 'r_abs_yesterday', 'r_abs_month', 'r_abs_year']
                        }
                    ]
                },
                columns: [],
                columnOptions: {
                    resizable: true
                },
                summary: {
                    height: 50,
                    position: 'bottom',
                    columnContent: {
                        name: { template: function(valueMap) { return "<div class='text-center' style='word-spacing:3.5rem'>평 균</div>"; }},
                        r_abs_hour: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_today: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_yesterday: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_month: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }},
                        r_abs_year: { template: function(valueMap) { return toFixmmAvg(valueMap.filtered.avg).toString(); }}
                    }
                }
            });

            rainGridSw.setColumns([
                { header: '지 역', name: 'name', minWidth: 60, align: 'center', defaultValue: 0, formatter: function(value) { return '<a href="javascript:void(0);" style="word-spacing:0.5rem">' + value.value + '</a>'; }},
                { header: '시 간', name: 'r_abs_hour', minWidth: 60, align: 'right', defaultValue: 0 },
                { header: '금 일', name: 'r_abs_today', minWidth: 60, align: 'right', defaultValue: 0 }
            ]);

            tui.Grid.setLanguage('ko');
            tui.Grid.applyTheme('striped', {
                selection: {
                    background: '#4daaf9',
                    border: '#4daaf9'
                },
                scrollbar: {
                    background: '#f5f5f5',
                    thumb: '#d9d9d9',
                    active: '#c1c1c1'
                },
                row: {
                    hover: {
                        background: '#e4edf4'
                    }
                },
                area: {
                    header: {
                        border: '#3655b5'
                    },
                    summary: {
                        border: '#3655b5'
                    }
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
                        background: '#dbe9f5'
                    },
                    selectedRowHeader: {
                        background: '#dbe9f5'
                    },
                    editable: {
                        background: '#fff'
                    },
                    focused: {
                        border: '#6eafb6'
                    },
                    disabled: {
                        background: 'none',
                        text: '#b0b0b0'
                    },
                    required: {
                        background: '#fffdeb'
                    },
                    invalid: {
                        background: '#ffe5e5'
                    }
                }
            });

            resolve();
        });
    }

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

    function modifyNumber(time) {
        if (parseInt(time) < 10) {
            return "0" + time;
        } else {
            return time;
        }
    }

    function toStringByFormatting(source) {
        var nowDate = new Date(source);
        var returnDate = nowDate.getFullYear() + (nowDate.getMonth() + 1).toString().padStart(2, '0') + nowDate.getDate().toString().padStart(2, '0') +
            nowDate.getHours().toString().padStart(2, '0') + nowDate.getMinutes().toString().padStart(2, '0') +
            nowDate.getSeconds().toString().padStart(2, '0');
        return returnDate;
    }

    function toFixmmAvg(value) {
        if (value < 10) {
            return parseFloat(value).toFixed(1);
        } else {
            return parseFloat(value).toFixed(1);
        }
    }

    function resetTime() {
        initTime();
        setInterval(initTime, 1000);
    }

    function resetData() {
        var device = document.getElementById("deviceSelect");
        var selectedDevice = device.value;

        if (selectedDevice === '0') {
            return;
        }

        var stationData = rainGrid.getData();
        var deviceInfo = getDeviceData(selectedDevice);

        rainGrid.setData(deviceInfo);
        rainGridSw.setData(deviceInfo);
    }

    function selectDevice() {
        return new Promise(function(resolve, reject) {
            var deviceSelect = document.getElementById("deviceSelect");
            var selectedDevice = deviceSelect.value;

            if (selectedDevice === '0') {
                resolve();
            } else {
                var data = getDeviceData(selectedDevice);
                rainGrid.setData(data);
                rainGridSw.setData(data);
                resolve();
            }
        });
    }

    function getDeviceData(deviceId) {
        // This is a mock function. Replace it with actual data fetching logic.
        var mockData = [
            { name: '지역1', r_abs_hour: 12, r_abs_today: 24, r_abs_yesterday: 30, r_abs_month: 100, r_abs_year: 500 },
            { name: '지역2', r_abs_hour: 8, r_abs_today: 15, r_abs_yesterday: 20, r_abs_month: 80, r_abs_year: 400 }
        ];
        return mockData;
    }
</script>
</html>