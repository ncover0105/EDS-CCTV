<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title id="mainTitle">이디에스</title>
    <link rel="icon" id="mainIcon" type="image/png" href="/css/edsicon.png">
    <link rel="stylesheet" href="/tui/tui-grid/dist/tui-grid.css"/>
    <script type="text/javascript" src='/plugins/toastr/toastr.min.js'></script>
    <script type="text/javascript" src='/plugins/toastr/toastrmessage.js'></script>
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/sweetalert2/sweetalert2.all.min.js"></script>
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
    <script type="text/javascript" src='/js/com/eds.common.js?curr=<c:out value="${common_include_js_curr}" />'></script>
    <link rel="stylesheet" href="/css/rain_grid.css">
    <!-- fontNoto -->
    <link type="text/css" rel="stylesheet" href="/css/fontNoto.css">
    <link type="text/css" rel="stylesheet" href="/css/rainGumi.css">
    <!-- <link rel="stylesheet" href="https://unpkg.com/@latte-ui/css@2.0.0-dev.7/dist/latte-ui.css" type="text/css"/> -->

<style>
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
</style>
</head>


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
    <section>
        <div class="container-fluid">
            <div class="row">
                <div class="col-xl-3 col-12" style="text-align: center;">
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/imgFiles/sailimg/radar.png" name='raderImg' id="raderImg"
                             alt="이미지 수신중" style="width: 100%; min-width:290px; height: 417px;">
                    </div>
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/imgFiles/sailimg/Satellite.png" name='raderImg2' id="raderImg2"
                             alt="이미지 수신중" style="width: 100%; min-width:290px; height: 417px;">

                    </div>
                </div>
                <div class="col-xl-9 col-12">
                    <div class="row">
                        <%--                        <div class="col-sm-5 pl-2" >--%>
                        <%--                            <div class="card" id="container" ondragstart="return false" style="min-width: 500px;">--%>

                        <%--                            </div>--%>
                        <%--                        </div>--%>
                        <div class="col-sm-12" id="comRow" style="display:block;">
                            <div class="row info mb-3" id="innerDom">
                            </div>
                        </div>
                    </div>
                    <div class="card p-0" style="width: 100%;" hidden="">
                        <div class="cardbody p-0" style="height: 614px;" id="rainGrid">
                            <!-- 그리드 영역 -->
                            <!-- 시트가 될 DIV 객체 -->
                            <div id="rainGridDIV" style="height: 100%; border-radius: 1rem; overflow: hidden;"></div>
                        </div>
                    </div>
                    <div class="card p-0" style="width: 100%; text-align: center;height: calc(100% - 645px - 2rem);">
                        <!-- <div class="card p-0" style="width: 100%; text-align: center;height: calc(35% - 1rem);"> -->
                        <div class="card-header border-0 pb-0">
                            <h3 class="card-title text-bold">시간별 예보</h3>
                        </div>
                        <div class="card-body p-2" style="width: 100%;">
                            <div class="row" style="padding: 0 2rem; font-size: 1.5rem;">
                                <%--                                <div class="col-lg-4 text-left border-bottom">--%>
                                <%--                                    <span class="info-box-icon"><i class="fa-solid fa-temperature-high"></i>&nbsp&nbsp현재 온도&nbsp&nbsp:&nbsp&nbsp<strong id='TA' style="">0</strong><span class="text-sm">°C</span></span>--%>
                                <%--                                </div>--%>
                                <%--                                <div class="col-lg-4 text-left border-bottom">--%>
                                <%--                                    <span class="info-box-icon"><i class="fa-solid fa-droplet"></i>&nbsp&nbsp현재 습도&nbsp&nbsp:&nbsp&nbsp<strong id='HM' style="">0</strong><span class="text-sm">%</span></span>--%>
                                <%--                                </div>--%>
                                <%--                                <div class="col-lg-4 text-left border-bottom">--%>
                                <%--                                    <span class="info-box-icon"><i class="fa-solid fa-wind"></i>&nbsp&nbsp현재 바람&nbsp&nbsp:&nbsp&nbsp<strong id='WS1' style="">0</strong><span class="text-sm">m/s</span></span>--%>
                                <%--                                </div>--%>
                                <div class="wi-icons wi-icons-new w-100" style="font-size: 1rem;">
                                    <div class="wi-icon ">
                                        <div class="icontime" id="objTime0">06:00</div>
                                        <img id="forecast0"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky0">맑은날씨</div>
                                        <div id="tmp0">1도</div>
                                    </div>
                                    <div class="wi-icon ">
                                        <div class="icontime" id="objTime1">09:00</div>
                                        <img id="forecast1"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky1">맑은날씨</div>
                                        <div id="tmp1">1도</div>
                                    </div>
                                    <div class="wi-icon ">
                                        <div class="icontime" id="objTime2">12:00</div>
                                        <img id="forecast2"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky2">맑은날씨</div>
                                        <div id="tmp2">1도</div>
                                    </div>
                                    <div class="wi-icon ">
                                        <div class="icontime" id="objTime3">15:00</div>
                                        <img id="forecast3"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky3">맑은날씨</div>
                                        <div id="tmp3">1도</div>
                                    </div>
                                    <div class="wi-icon ">
                                        <div class="icontime" id="objTime4">18:00</div>
                                        <img id="forecast4"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky4">맑은날씨</div>
                                        <div id="tmp4">1도</div>
                                    </div>
                                    <div class="wi-icon ">
                                        <div class="icontime" id="objTime5">21:00</div>
                                        <img id="forecast5"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky5">맑은날씨</div>
                                        <div id="tmp5">1도</div>
                                    </div>
                                    <div class="wi-icon ">
                                        <div class="icontime" id="objTime6">00:00</div>
                                        <img id="forecast6"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky6">맑은날씨</div>
                                        <div id="tmp6">1도</div>
                                    </div>
                                    <div class="wi-icon">
                                        <div class="icontime" id="objTime7">03:00</div>
                                        <img id="forecast7"
                                             src="/css/weather-icons-dev/production/fill/svg/clear-day.svg" alt="">
                                        <div id="sky7">맑은날씨</div>
                                        <div id="tmp7">1도</div>
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
                                <div class="content" style="min-width: 100vw;" id="spacArea"></div>
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
    console.log("colWayLogoArray")
    console.log(colWayLogoArray)
    const urlParams = new URLSearchParams(window.location.search);

    window.onload = async function () {
        await loadData()
        let deviceData = await selectDevice();
        //await drawMap('#container',deviceData);
        //await selectDevice();
        resetData();
        resetTime();
    };

    async function loadData() {
        rainGrid = new tui.Grid({
            el: document.getElementById('rainGridDIV'),
            scrollX: false,
            scrollY: false,
            editingEvent: 'click',
            bodyHeight: 'fitToParent',
            rowHeight: 56,
            minRowHeight: 56,
            header: {
                height: 112,
                minRowHeight: 100,
                complexColumns: [
                    {
                        header: '강우량(mm)',
                        name: 'rainfall',
                        childNames: ['r_abs_hour', 'r_abs_today', 'r_abs_yesterday', 'r_abs_month', 'r_abs_year']
                    },

                ],
            },
            columns: [],
            columnOptions: {
                resizable: true,
                /*frozenCount: 1,
                frozenBorderWidth: 2,*/ // 컬럼 고정 옵션
            },
            summary: {
                height: 56,
                position: 'bottom', // or 'top'

                columnContent: {
                    name: {
                        template: function (valueMap) {
                            return "<div class='text-center' style='word-spacing:3.5rem'>평 균</div>"
                        }
                    },
                    r_abs_hour: {
                        template: function (valueMap) {
                            return (toFixmmAvg(valueMap.filtered.avg)).toString();
                        }
                    },
                    r_abs_today: {
                        template: function (valueMap) {
                            return (toFixmmAvg(valueMap.filtered.avg)).toString();
                        }
                    },
                    r_abs_yesterday: {
                        template: function (valueMap) {
                            return (toFixmmAvg(valueMap.filtered.avg)).toString();
                        }
                    },
                    r_abs_month: {
                        template: function (valueMap) {
                            return (toFixmmAvg(valueMap.filtered.avg)).toString();
                        }
                    },
                    r_abs_year: {
                        template: function (valueMap) {
                            return (toFixmmAvg(valueMap.filtered.avg)).toString();
                        }
                    },
                }
            }
        });

        rainGrid.setColumns([
            {
                header: '지 역',
                name: 'name',
                minWidth: 60,
                align: 'center',
                defaultValue: 0,
                formatter: function (value) {
                    return `<a href="javascript:void(0);" style="word-spacing:0.5rem">` + value.value + `</a>`;
                }
            },
            {header: '시 간', name: 'r_abs_hour', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '금 일', name: 'r_abs_today', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '전 일', name: 'r_abs_yesterday', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '월 간', name: 'r_abs_month', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '연 간', name: 'r_abs_year', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '주 간', name: 'r_abs_week', minWidth: 60, align: 'right', defaultValue: 0},
            // hidden(숨김)
        ]);

        //initData(gridData);
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

    var week = new Array('일', '월', '화', '수', '목', '금', '토');

    function initTime() {
        var dateInfo = new Date();
        var hour = modifyNumber(dateInfo.getHours());
        var min = modifyNumber(dateInfo.getMinutes());
        var sec = modifyNumber(dateInfo.getSeconds());
        var year = dateInfo.getFullYear();
        var month = dateInfo.getMonth() + 1; //monthIndex를 반환해주기 때문에 1을 더해준다.
        var date = dateInfo.getDate();
        var today = new Date().getDay();
        var todayLabel = week[today];


        document.getElementById("viewDateTime").innerHTML = year + "년 " + month + "월 " + date + "일  (" + todayLabel + ")  " + hour + ":" + min;
    }

    function modifyNumber(time) {
        if (parseInt(time) < 10) {
            return "0" + time;
        } else
            return time;
    }

    function toStringByFormatting(source) {

        const nowDate = new Date(source);
        const returnDate = nowDate.getFullYear() + (nowDate.getMonth() + 1).toString().padStart(2, '0') + (nowDate.getDate()).toString().padStart(2, '0')
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


    async function createEl(param) {

        let el = '';
        if (param12) {
            el = `
            <div class="data-box-cmm box-wl-01-02 rain">
                <div class="tit-set"><h5 class="fontDefalt m-0 p-0" style="color: #141414;">` + param.name + `</h5>
                    <div class="last-upate mb08"><span class="date"></span></div>
                </div>
                <div class="value_boxes">
                    <div class="col-md-6">
                        <div class="value-box2" style="height: 102px;"><h5
                                style="font-size: 2rem; font-weight: 600; margin-top: -3px;">1H</h5><span
                                class="value-set" style="position: absolute;bottom: 20px;right: 10px;font-size: 2.0rem"><span class="value-bs" >`+param.r_abs_hour+`</span><span class="unit">mm</span></span></div>
                    </div>
                    <div class="col-md-6">
                        <div class="value-box2" style="height: 102px;"><h5
                                style="font-size: 2rem; font-weight: 600; margin-top: -3px;">일강우</h5><span
                                class="value-set" style="position: absolute;bottom: 20px;right: 10px;font-size: 2.0rem"><span class="value-bs">`+param.r_abs_today +`</span></span></div>
                    </div>
                </div></div>`}
        else {
            el= `
            <div class="data-box-cmm box-wl-01-02 rain">
                <div class="tit-set"><h5 class="fontDefalt m-0 p-0" style="color: #141414;">` + param.name + `</h5>
                    <div class="last-upate mb08"><span class="date"></span></div>
                </div>
                <div class="value_boxes">
                    <div class="col-md-6">
                        <div class="value-box2" style="height: 102px;"><h5
                                style="font-size: 2rem; font-weight: 600; margin-top: -3px;">1H</h5><span
                                class="value-set" style="position: absolute;bottom: 20px;right: 10px;font-size: 2.0rem"><span class="value-bs" >`+param.r_abs_hour+`</span><span class="unit">mm</span></span></div>
                    </div>
                    <div class="col-md-6">
                        <div class="value-box2" style="height: 102px;"><h5
                                style="font-size: 2rem; font-weight: 600; margin-top: -3px;">일강우</h5><span
                                class="value-set" style="position: absolute;bottom: 20px;right: 10px;font-size: 2.0rem"><span class="value-bs">`+param.r_abs_today +`</span></span></div>
                    </div>
                </div></div>`
        }
        return el;
    }

    async function initAPI() {

        let raderImg1 = document.getElementById('raderImg');
        var param = {};
        let rainData1 = await edsUtil.getAjax("/RAIN_MAIN/getRadarImg", param);
        var tmpDate = new Date();
        if (Object.keys(rainData1).length > 0) {
            var url1 = `/imgFiles/sailimg/radar.png?` + tmpDate.getTime()
            //var url2=`https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/imageList?sDate=`+date+`0000&eDate=`+date+`2359&authKey=tnvu9MccTDe77vTHHAw3BA`
            raderImg1.src = url1;
        } else {
            console.log('데이터없음')
        }
        // let date = await edsUtil.getToday('%Y%m%d');
        // var url = 'http://apis.data.go.kr/1360000/RadarImgInfoService/getCmpImg'; /*URL*/
        // var queryParams = '?' + encodeURIComponent('serviceKey') + '='+'mCSQcbq5lCKQ1eSmMnFBImkISicxFLMMBBO0XUVNKQAqZnI6H%2BuyeX9BUTpRaw2jd8fmIrbuPMMGlUYrvSYhig%3D%3D'; /*Service Key*/
        // queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /**/
        // queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /**/
        // queryParams += '&' + encodeURIComponent('dataType') + '=' + encodeURIComponent('json'); /**/
        // queryParams += '&' + encodeURIComponent('data') + '=' + encodeURIComponent('CMP_WRC'); /**/
        // queryParams += '&' + encodeURIComponent('time') + '=' + encodeURIComponent(date); /**/
        // let raderImg1= document.getElementById('raderImg');
        // const urlParam=url + queryParams;

        // $.ajax({
        // 	method:"GET",
        // 	url:urlParam,
        //     dataType: "json",
        // 	//async: false,	//동기방식으로 전송
        // 	success: function(result) {
        //         let body=result.response.body;
        // 		if(body)
        // 		{
        // 			const news =result.response.body.items.item[0];
        //             var slice=news['rdr-img-file'].slice(1, -1);
        // 			var arr = slice.split(',');
        // 			var str =arr.pop();
        //             console.log(str);
        // 			raderImg1.src="https://apihub.kma.go.kr/api/typ04/url/rdr_cmp_file.php?tm=202107151200&data=bin&cmp=cpp&authKey=mVSXGkO4Qa6UlxpDuNGu0Q";
        // 			//saveImgFile(str.trim());
        // 		}
        // 		else
        // 		{
        //             console.log('레이더이미지가없습니다.');

        // 		}

        // 	}
        // });

        let raderImg2 = document.getElementById('raderImg2');
        var param = {};
        let rainData = await edsUtil.getAjax("/RAIN_MAIN/getSatelliteImg", param);

        if (Object.keys(rainData).length > 0) {
            var url2 = `/imgFiles/sailimg/Satellite.png?` + tmpDate.getTime()
            //var url2=`https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/imageList?sDate=`+date+`0000&eDate=`+date+`2359&authKey=tnvu9MccTDe77vTHHAw3BA`
            raderImg2.src = url2;
        } else {
            console.log('데이터없음')
        }

    }


    async function selectDevice() {
        rainGrid.refreshLayout(); // 데이터 초기화
        rainGrid.finishEditing(); // 데이터 마감
        rainGrid.clear(); // 데이터 초기화
        var param = {};
        param.rainDate = edsUtil.getToday('%Y%m');
        let rainDevice = await edsUtil.getAjax("/RAIN_MAIN/selectDevice", param);
        console.log(rainDevice)
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
        let gridData = rainGrid.getData();
        let maxValue = 0;
        let minValue = 0;

        if ((rainData.length > 0)) {
            maxValue = rainData[0].r_abs_today;
            minValue = rainData[0].r_abs_today;
        }
        let el = '';
        let innetId = document.getElementById('innerDom');
        let dayAvgSum = 0;
        let monAvgSum = 0;
        for(const datas of rainData)
        {
            if (Number(datas.r_abs_today) >= Number(maxValue)) {
                maxValue = datas.r_abs_today;
            }

            if (Number(datas.r_abs_today) < Number(minValue))
                minValue = datas.r_abs_today;
        }
        for (const datas of rainData) {
            dayAvgSum += Number(datas.r_acc_now_51);
            monAvgSum += Number(datas.r_abs_month);
            datas.pastDate = '';
            if (Number(datas.r_abs_today) == Number(maxValue))
                datas.r_abs_today=`<span class="red">`+datas.r_abs_today+`<span class="unit">mm</span></span>`

            else if (Number(datas.r_abs_today) == Number(minValue))
                datas.r_abs_today=`<span class="blue">`+datas.r_abs_today+`<span class="unit">mm</span></span>`
            else
                datas.r_abs_today=`<span>`+datas.r_abs_today+`<span class="unit">mm</span></span>`
            if (param12) {
                if (datas.name.includes(param12)) {
                    el += await createEl(datas);
                }
            } else {
                el += await createEl(datas)
            }
        }
        let dayAvg = (dayAvgSum / rainData.length).toFixed(1)
        let monAvg = (monAvgSum / rainData.length).toFixed(1)
        console.log(dayAvgSum);
        console.log(monAvgSum);
        let avgel =
            `
            <div class="data-box-cmm box-wl-01-02 rain">
                <div class="tit-set"><h5 class="fontDefalt m-0 p-0" style="color: #141414;">평균</h5>
                    <div class="last-upate mb08"><span class="date"></span></div>
                </div>
                <div class="value_boxes">
                    <div class="col-md-6">
                        <div class="value-box2" style="height: 102px;"><h5
                                style="font-size: 2rem; font-weight: 600; margin-top: -3px;">일평균</h5><span
                                class="value-set" style="position: absolute;bottom: 20px;right: 10px;font-size: 2.0rem"><span class="value-bs" >`+dayAvg+`</span><span class="unit">mm</span></span></div>
                    </div>
                    <div class="col-md-6">
                        <div class="value-box2" style="height: 102px;"><h5
                                style="font-size: 2rem; font-weight: 600; margin-top: -3px;">월평균</h5><span
                                class="value-set" style="position: absolute;bottom: 20px;right: 10px;font-size: 2.0rem"><span class="value-bs">`+monAvg+`</span><span class="unit">mm</span></span></div>
                    </div>
                </div>
            </div>`
        el += avgel;
        innetId.innerHTML = el;
        // for(const gridRow of gridData)
        // {
        //     let rowKey= gridRow.rowKey;
        //     for(const datas of rainData)
        //     {
        //
        //         if(datas.uid==gridRow.uid)
        //         {
        //             rainGrid.setValue(rowKey,'r_abs_hour',toFixmm(datas.r_abs_hour));
        //             rainGrid.setValue(rowKey,'r_abs_today',maxminValue(rowKey,datas.r_abs_today,maxValue,minValue));
        //             let dataLabel=document.getElementById(datas.name);
        //             if(dataLabel){dataLabel.innerHTML=maxminValue(rowKey,datas.r_abs_today,maxValue,minValue)};
        //             rainGrid.setValue(rowKey,'r_abs_yesterday',toFixmm(datas.r_abs_yesterday));
        //             rainGrid.setValue(rowKey,'r_abs_year',toFixmm(datas.r_abs_year));
        //             rainGrid.setValue(rowKey,'r_abs_month',toFixmm(datas.r_abs_month));
        //         }
        //
        //
        //     }
        // }

        //initDataSvg();//이미지 데이터 인풋
        initAPI();
        callJsonApi(url);
        //callAwsApi();
        callForecastApi();
    }

    function maxminValue(rowKey, value, maxValue, minValue) {
        let returnValue = '';
        if (maxValue == 0 && minValue == 0) {
            return toFixmm(value);
        }
        if (value == maxValue)
            rainGrid.addCellClassName(rowKey, 'r_abs_today', 'red');

        else if (Number(value) == Number(minValue))
            rainGrid.addCellClassName(rowKey, 'r_abs_today', 'blue');

        else
            returnValue = toFixmm(value);

        return toFixmm(value);

    }

    function resetTime() {
        initTime();
        setTimeout(resetTime, 1000);
    }

    const interval = 120000; // 60초
    function resetData() {
        selectRainData();
        setTimeout(resetData, interval);
    }

    // 코드 실행 시작 시간을 기록합니다.
    const startTime = edsUtil.getToday('%Y%m');
    const url = "/RAIN_MAIN/getSepcialReport";

    function callJsonApi(url) {  // Text API 호출 함수
        $.ajax({
            method: "POST",
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json; charset=UTF-8",
            //async: false,	//동기방식으로 전송
            success: function (result) {
                let specArea = document.getElementById("spacArea");
                if (result.data.length > 0) {
                    let spacData = result.data;//특보데이터
                    let spacString = '';
                    for (const data of spacData) {
                        let spacName=data.wrn+data.lvl;
                        data.tm_FC = data.tm_FC.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5');
                        spacString+=data.tm_FC+` [`+spacName+`] `+data.cmd;
                    }
                    specArea.innerHTML = spacString;

                } else {
                    specArea.innerHTML = "기상특보 없음";
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

    function o2grade(num) {
        if (num == '1') {
            return '<span class="blue">좋음</span>'
        } else if (num == '2') {
            return '<span class="green">보통</span>'
        } else if (num == '3') {
            return '<span class="yellow">나쁨</span>'
        } else if (num == '4') {
            return '<span class="red">매우나쁨</span>'
        } else {
            return '정보없음'
        }
    }

    function callAwsApi() {  // Text API 호출 함수
        $.ajax({
            method: "POST",
            url: '/RAIN_MAIN/getAwsReport',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json; charset=UTF-8",
            //async: false,	//동기방식으로 전송
            success: function (result) {
                let WS1 = document.getElementById("WS1");
                let TA = document.getElementById("TA");
                let HM = document.getElementById("HM");
                if (result.data.length > 0) {

                    let awsData = result.data;//데이터
                    WS1.innerHTML = awsData[0].ws1//풍속
                    TA.innerHTML = awsData[0].ta//기온
                    HM.innerHTML = awsData[0].hm//습도
                } else {
                    //환경정보
                    console.log('특보없음');

                }

            }
        });
    }

    function callForecastApi() {// Text API 호출 함수
        $.ajax({
            method: "POST",
            url: "/RAIN_MAIN/getTodayForecast",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            contentType: "application/json; charset=UTF-8",
            //async: false,	//동기방식으로 전송
            success: function (result) {
                if (result.result == 1) {
                    let data = result.data;
                    const startTime = edsUtil.getToday('%Y-%m-%d %H:') + "00";
                    let currentDate = new Date(startTime);
                    currentDate.setHours(currentDate.getHours() + 1);
                    // 날짜 및 시간 형식 설정
                    var year = currentDate.getFullYear();
                    var month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
                    var day = ('0' + currentDate.getDate()).slice(-2);
                    var hours = ('0' + currentDate.getHours()).slice(-2);
                    var minutes = ('0' + currentDate.getMinutes()).slice(-2);

                    var result = year + month + day + hours + minutes;

                    let src = '/css/weather-icons-dev/production/fill/svg/';
                    for (var i = 0; i < 8; i++) {
                        year = currentDate.getFullYear();
                        month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
                        day = ('0' + currentDate.getDate()).slice(-2);
                        hours = ('0' + currentDate.getHours()).slice(-2);
                        minutes = ('0' + currentDate.getMinutes()).slice(-2);
                        result = year + month + day + hours + minutes;
                        let id = `forecast` + i;
                        let obj = data[result];
                        let doc = document.getElementById(id);
                        let sky = `sky` + i;
                        let objTime = `objTime` + i;
                        let tmp = `tmp` + i;
                        const skynum = obj.skynum + "-" + obj.ptynum;

                        let skysvg = 'clear-day.svg'
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

                        document.getElementById(id).src = src + skysvg + ".svg";
                        document.getElementById(sky).innerHTML = obj.sky + " " + obj.pty;
                        document.getElementById(tmp).innerHTML = obj.tmp + " °C";
                        document.getElementById(objTime).innerHTML = obj.forecastTime.substring(0, 2) + ':' + obj.forecastTime.substring(2, 4);

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

                } else {

                }

            }
        });
    }

    function toFixmm(num) {
        const result = num / 10;
        const formattedResult = result.toFixed(1);
        return formattedResult;
    }

    function toFixmmAvg(num) {
        const result = num * 100;
        const formattedResult = Math.trunc(result);
        const formatted = formattedResult / 100
        return formatted;
    }

    //지도 그리기
    async function drawMap(target, param) {
        return new Promise(function (resolve, reject) {
            var width = 600; //지도의 넓이
            var height = 614; //지도의 높이
            var initialScale = 75000; //확대시킬 값
            var initialX = width / 2; //초기 위치값 X
            var initialY = height / 2; //초기 위치값 Y
            var labels;

            var projection = d3.geo
                .mercator()
                .center([128.353848329072653, 36.211795306300239])
                .scale(initialScale)
                .translate([initialX, initialY]);
            var path = d3.geo.path().projection(projection);

            // 그림자 효과를 가진 필터 생성
            var svg = d3.select(target)
                .append('svg')
                .attr('width', width + 'px')
                .attr('height', height + 'px')
                .attr('id', 'map')
                .attr('class', 'map ml-auto mr-auto')
                .attr('fill', 'none')
                .attr('viewBox', '0 0 ' + width + ' ' + height) // viewBox 설정
                .attr('preserveAspectRatio', 'xMidYMid meet'); // 중앙 정렬


            var states2 = svg.append('g')
                .attr('id', 'states2');

            states2.append('rect')
                .attr('class', 'background')
                .attr('width', width + 'px')
                .attr('height', height + 'px');

            var states = svg.append('g')
                .attr('id', 'states');

            states.append('rect')
                .attr('class', 'background')
                .attr('width', width + 'px')
                .attr('height', height + 'px');
            var defs = svg.append("defs");
            var filter = defs.append("filter")
                .attr("id", "drop-shadow")
                .attr("height", "150%");
            filter.append("feGaussianBlur")
                .attr("in", "SourceAlpha")
                .attr("stdDeviation", 5)
                .attr("result", "blur");

            filter.append("feOffset")
                .attr("dx", 10)
                .attr("dy", 10)
                .attr("result", "offsetBlur");

            var feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode")
                .attr("in", "offsetBlur");
            feMerge.append("feMergeNode")
                .attr("in", "SourceGraphic")
                .attr("opacity", 0.5);  // 그림자의 투명도를 조절

            d3.json('/js/com/gumi.geojson', function (json) {
                // 바깥쪽 경계를 정의하기 위해 'evenodd' 규칙을 사용하는 clipping path 추가
                svg.append("defs")
                    .append("clipPath")
                    .attr("id", "clip")
                    .append("path")
                    .datum(json)
                    .attr("d", path)
                    .style("filter", "url(#drop-shadow)")
                    .attr("fill-rule", "evenodd");
                states2
                    .selectAll('path') //지역 설정
                    .data(json.features)
                    .attr('stroke', 'black')
                    .attr('fill', 'none')
                    .attr('class', 'specific-area')
                    .enter().append('path')
                    .attr('d', path)
                    .style("filter", "url(#drop-shadow)");
                states
                    .selectAll('path') //지역 설정
                    .data(json.features)
                    .enter()
                    .append('path')
                    .attr('d', path)
                    .attr('class', 'animstate')
                    .attr('id', function (d) {
                        return 'path-' + d.properties.adm_cd;
                    });


                // 각 지역에 div 형태의 요소를 추가합니다.
                states
                    .selectAll('.custom-div')
                    .data(json.features)
                    .enter()
                    .append('foreignObject') // foreignObject를 사용하여 HTML 요소를 추가합니다.
                    .attr('x', function (d) {
                        return path.centroid(d)[0] - 50; // x 좌표 조정
                    })
                    .attr('y', function (d) {
                        return path.centroid(d)[1] - 50; // y 좌표 조정
                    })
                    .attr('width', 60)
                    .attr('height', 41)
                    .html(function (d) {
                        console.log(d)
                        for (const data of param) {
                            if (data.name == d.properties.name) {
                                return '<div class="data-box-map-mini"><h4 class="m-0 p-0">' + d.properties.name + '</h4><p><span id="' + d.properties.name + '" class="value">0.0</span></p></div>';
                                break;
                            }

                        }
                        // 각 지역에 대한 div의 내용을 HTML 형식으로 반환합니다.
                        return '';
                    })


                resolve();
            });


            //텍스트 위치 조절 - 하드코딩으로 위치 조절을 했습니다.
            function translateTolabel(d) {
                var arr = path.centroid(d);
                if (d.properties.name == '진보면') {
                    //진보면 위치
                    arr[1] += 30;
                    arr[0] += 30;
                } else if (d.properties.name == '파천면' || d.properties.name == '안덕면') {
                    //진보면 위치
                    arr[1] += 30;
                    arr[0] -= 15;
                } else {
                    //조금 내리기
                    arr[1] += 30;
                }
                return 'translate(' + arr + ')';

            }

            function translateTolabel2(d) {
                var arr = path.centroid(d);
                if (d.properties.name == '진보면') {
                    //진보면 위치
                    arr[0] += 30;
                } else if (d.properties.name == '파천면' || d.properties.name == '안덕면') {
                    //진보면 위치
                    arr[0] -= 15;
                }

                return 'translate(' + arr + ')';

            }

            //텍스트 위치 조절 - 하드코딩으로 위치 조절을 했습니다.
            function xtrans(d) {
                var arr = path.centroid(d);
                if (d.properties.code == 31) {
                    //서울 경기도 이름 겹쳐서 경기도 내리기
                    arr[1] +=
                        d3.event && d3.event.scale
                            ? d3.event.scale / height + 20
                            : initialScale / height + 20;
                } else if (d.properties.code == 34) {
                    //충남은 조금 더 내리기
                    arr[1] +=
                        d3.event && d3.event.scale
                            ? d3.event.scale / height + 10
                            : initialScale / height + 10;
                } else {
                    console.log(arr)
                }
                return arr[0];

            }

            function ytrans(d) {
                var arr = path.centroid(d);
                if (d.properties.code == 31) {
                    //서울 경기도 이름 겹쳐서 경기도 내리기
                    arr[1] +=
                        d3.event && d3.event.scale
                            ? d3.event.scale / height + 20
                            : initialScale / height + 20;
                } else if (d.properties.code == 34) {
                    //충남은 조금 더 내리기
                    arr[1] +=
                        d3.event && d3.event.scale
                            ? d3.event.scale / height + 10
                            : initialScale / height + 10;
                } else {
                    arr[1] +=
                        d3.event && d3.event.scale
                            ? d3.event.scale / height - 10
                            : initialScale / height - 100;
                    console.log(arr)

                }
                return arr[1];

            }

            function zoom() {

                projection.translate(d3.event.translate).scale(d3.event.scale);
                states.selectAll('path').attr('d', path);
                labels.attr('transform', translateTolabel);
            }
        });
    }

    function CrawlerReq() {
        $.ajax({
            method: "POST",
            url: '/crawl',
            type: "POST",
            contentType: "application/json; charset=UTF-8",
            async: false,
            data: JSON.stringify({url: 'https://www.cs.go.kr/specialty/00003173/00006749.web'}),
            //async: false,	//동기방식으로 전송
            success: function (result) {
                console.log(result)

            }
        });
    }
</script>
</html>