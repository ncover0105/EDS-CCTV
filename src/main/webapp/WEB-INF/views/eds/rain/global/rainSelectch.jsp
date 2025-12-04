<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title id="mainTitle">이디에스</title>
    <link rel="icon" id="mainIcon" type="image/png" href="/css/edsicon.png">
    <link rel="stylesheet" href="/tui/tui-grid/dist/tui-grid.css"/>
    <link rel="stylesheet" href="/tui/tui-date-picker/dist/tui-date-picker.css"/>
    <%--    <link rel="stylesheet" href="/tui/tui-pagination/dist/tui-pagination.css"/>--%>
    <%--    <script src="/tui/tui-pagination/dist/tui-pagination.js"></script>--%>
    <script type="text/javascript" src='/plugins/toastr/toastr.min.js'></script>
    <script type="text/javascript" src='/plugins/toastr/toastrmessage.js'></script>
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/sweetalert2/sweetalert2.all.min.js"></script>
    <link rel="stylesheet" href="/css/AdminLTE_main/plugins/fontawesome-free/css/all.min.css">
    <link rel="stylesheet" href="/css/AdminLTE_main/dist/css/adminlte.min.css">
    <link rel="stylesheet" href="/css/AdminLTE_main/plugins/select2/css/select2.min.css">
    <link rel="stylesheet" href="/css/AdminLTE_main/plugins/select2-bootstrap4-theme/select2-bootstrap4.min.css">
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/jquery/jquery.min.js"></script>

    <!-- jQuery UI 1.13.0 -->
    <script type="text/javascript" src='/css/AdminLTE_main/plugins/jquery-ui/jquery-ui.min.js'></script>
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/jquery-validation/jquery.validate.min.js"></script>
    <!-- jQuery inputmask -->
    <script type="text/javascript" src='/css/AdminLTE_main/plugins/inputmask/jquery.inputmask.js'></script>
    <script src="/tui/xlsx/dist/xlsx.full.min.js"></script>
    <script src="/tui/tui-grid/dist/tui-grid.js"></script>
    <script src="/tui/tui-date-picker/dist/tui-date-picker.js"></script>
    <script type="text/javascript"
            src='/js/com/eds.common.js?curr=<c:out value="${common_include_js_curr}" />'></script>
    <!-- fontNoto -->
    <link type="text/css" rel="stylesheet" href="/css/fontNoto.css">
    <!-- <link rel="stylesheet" href="https://unpkg.com/@latte-ui/css@2.0.0-dev.7/dist/latte-ui.css" type="text/css"/> -->
    <!-- Bootstrap 4.6.2 -->
    <script type="text/javascript" src='/bootstrap-4.6.2/dist/js/bootstrap.min.js'></script>
    <link rel="stylesheet" href="/css/rainSelect.css">
    <link rel="stylesheet" href="/css/rain_grid_select.css">
    <script type="text/javascript" src="/css/AdminLTE_main/plugins/select2/js/select2.full.min.js"></script>
    <style>
        .tui-datepicker {
            position: absolute;
            z-index: 100; /* 적절한 z-index 값을 설정하세요 */
        }
        .bodersum
        {
            width: 100%;
            border-bottom: 1px solid white;
            padding: 5px 0px
        }
        .tui-grid-summary-area .tui-grid-cell {
            padding: 0px;
        }
    </style>
</head>
<body style="display: flex; height: 100vh; background-color: #262c3a;">
<div class="col-lg-12 col-12 p-0" style="width: 100%;">
    <section class="content-header navbar navbar-expand-lg" style="padding: 10px 0.5rem;">
        <div class="container-fluid">

            <ul class="navbar-nav">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarScrollingDropdown" role="button"
                       data-toggle="dropdown" aria-expanded="false" style="color: white;">
                        <i class="fa-solid fa-bars"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-left" aria-labelledby="navbarScrollingDropdown">
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
            <ul class="navbar-nav">
                <span onclick="toggleFullScreen()"><img id="mainLogo" src="/css/edslogo.png" style="height: 50px;"
                                                        alt="로고"> </span>
            </ul>

        </div>
    </section>
    <section>
        <div class="main"><!---->
            <section class="main data-search-wrap" style="padding: 0px; width: auto;"><h2 class="tit-box">데이터 조회</h2>
                <div class="data-select-box map-defalut">
                    <div>
                        <p class="select-tit">기상관측정보</p>
                        <select class="select selectBox" name="s" id="s">
                            <option value="01">강우데이터</option>
                            <%--                            <option value="02">적설데이터</option>--%>
                            <%--                            <option value="03">수위데이터</option>--%>
                            <%--                            <option value="04">예경보발령내역</option>--%>
                            <%--                            <option value="05">침수위</option>--%>
                        </select>
                    </div>
                    <div><p class="select-tit">데이터 선택</p>
                        <select class="selectBox data-select mr08" name="dateDivi" id="dateDivi">
                            <option value="date">일간</option>
                            <option value="month">월간</option>
                            <option value="year">연간</option>
                        </select>
                    </div>
                    <div style="padding: 1px"><p class="select-tit">날짜 선택</p>
                        <div class="selectBox">
                            <div class="data-start">
                                <label for="stDt" style="display: none;">시작날짜</label>
                                <div class="mx-datepicker" aria-label="시작일 선택">
                                    <div class="mx-input-wrapper ">
                                        <div class="mx-input-wrapper tui-datepicker-input tui-datetime-input tui-has-focus" style="border:none;    height: auto;">
                                            <input type="text" id="stDt" aria-label="Date-Time" class="mx-input" style="font-size: 16px">
                                            <span class="tui-ico-date"></span>
                                        </div>
                                        <div id="wrapper" style="margin-top: -1px;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <%--                    <div>--%>
                    <%--                        <div class="data-calender">--%>
                    <%--                            <p class="select-tit">시작날짜</p>--%>
                    <%--                            <p class="select-tit">종료날짜</p>--%>
                    <%--                        </div>--%>
                    <%--                        <div class="data-calender">--%>
                    <%--                            <div class="selectBox">--%>
                    <%--                                <div class="data-start">--%>
                    <%--                                    <label for="stDt" style="display: none;">시작날짜</label>--%>
                    <%--                                    <div class="mx-datepicker" aria-label="시작일 선택">--%>
                    <%--                                        <div class="mx-input-wrapper">--%>
                    <%--                                            <input type="date" class="form-control" name="stDt" id="stDt" title="끝">--%>
                    <%--                                        </div>--%>
                    <%--                                    </div>--%>
                    <%--                                </div>--%>
                    <%--                                <div class="data-end"><label for="edDt" style="display: none;">종료날짜</label>--%>
                    <%--                                    <div class="mx-datepicker" aria-label="종료일 선택">--%>
                    <%--                                        <div class="mx-input-wrapper">--%>
                    <%--                                            <input type="date" class="form-control" name="edDt" id="" title="끝">--%>
                    <%--                                        </div>--%>
                    <%--                                    </div>--%>
                    <%--                                </div>--%>
                    <%--                            </div>--%>
                    <%--                        </div>--%>
                    <%--                    </div><!---->--%>
                    <div class="data-btn" style="display: flex;">
                        <div class="search-btn" id="searchBtn">검색하기</div><!----><!---->
                        <div class="download-btn" id="export-excel">
                            엑셀 다운로드
                        </div>
                    </div>
                </div>
                <div class="map-defalut data-table-box">
                    <div class="tempTextArea2">
                        <div class="card m-0">
                            <div class="card-body">
                                <div class="table-top m-0"><p class="select-conditions" id="rainDateInfo">
                                </p>
                                    <p class="select-date" id="rainDay"></p></div>
                                <div style="height: 460px">
                                    <div id="rainGridDIV" style="height: 100% ;border-radius: 8px; overflow: hidden"></div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div><!---->
            </section>
        </div>
    </section>

</div>


</body>
<script>
    var rainGrid;
    var rainColDay
    var rainColMon
    var datepicker = new tui.DatePicker('#wrapper', {
        date: new Date(),
        input: {
            element: '#stDt',
            format: 'yyyy-MM-dd'
        },
        type: 'date',
        language: 'ko'
    });
    datepicker.on('change', function() {
        let selectedType = datepicker.getType();
        let selectedDate = datepicker.getDate();
        if (selectedType === 'month') {
            document.getElementById('stDt').value = selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2);
        } else if (selectedType === 'date') {
            var formattedDate = selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDate.getDate()).slice(-2);
            document.getElementById('stDt').value = formattedDate;
        }
        else if (selectedType === 'year') {
            document.getElementById('stDt').value = selectedDate.getFullYear();
        }
    });

    document.getElementById('dateDivi').addEventListener('change', function() {
        const selectedType = this.value;
        datepicker.setType(selectedType);
        var selectedDate = datepicker.getDate();
        if (selectedType === 'month') {
            document.getElementById('stDt').value = selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2);
        } else if (selectedType === 'date') {
            var formattedDate = selectedDate.getFullYear() + '-' + ('0' + (selectedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + selectedDate.getDate()).slice(-2);
            document.getElementById('stDt').value = formattedDate;
        }
        else if (selectedType === 'year') {
            document.getElementById('stDt').value = selectedDate.getFullYear();
        }
    });
    document.getElementById('searchBtn').addEventListener('click', function() {
        let inputType=datepicker.getType();
        if (inputType === 'month') {
            selectRainDateMon();
        } else if (inputType === 'date') {
            selectRainDateDay();
        }
        else if (inputType === 'year') {
            selectRainDateYear();
        }
    });
    const colWayArray = {'1': '대구광역시', '2': '달성군', '3': '군위군', '4': '문경시', '5': '청송읍', '6': '구미시'}
    const colWayIconArray = {
        '1': '/css/edsicon.png',
        '2': '/css/edsicon.png',
        '3': '/css/dsicon.png',
        '4': '/css/edsicon.png',
        '5': '/css/csicon.ico',
        '6': '/css/gumiicon.png'
    };
    const colWayLogoArray = {
        '1': '/css/edslogo.png',
        '2': '/css/edslogo.png',
        '3': '/css/dslogo.png',
        '4': '/css/edslogo.png',
        '5': '/css/cslogo.png',
        '6': '/css/gumilogo.png'
    };
    const urlParams = new URLSearchParams(window.location.search);
    const param12 = urlParams.get('name');

    window.onload = async function () {
        select = $('.select2').select2();
        await loadData()
        let deviceData = await selectDevice();
        //await selectDevice();
        //selectRainDateDay();
    };

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

    async function loadData() {
        rainGrid = new tui.Grid({
            el: document.getElementById('rainGridDIV'),
            scrollX: false,
            scrollY: false,
            editingEvent: 'click',
            bodyHeight: 'fitToParent',
            rowHeight: 30,
            minRowHeight: 30,
            header: {
                height: 30,
                minRowHeight: 30,
            },
            columns: [],
            columnOptions: {
                resizable: true,
                /*frozenCount: 1,
                frozenBorderWidth: 2,*/ // 컬럼 고정 옵션
            },

        });
        rainColDay = [
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
            {header: '0시', name: 'h00', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '1시', name: 'h01', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '2시', name: 'h02', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '3시', name: 'h03', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '4시', name: 'h04', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '5시', name: 'h05', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '6시', name: 'h06', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '7시', name: 'h07', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '8시', name: 'h08', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '9시', name: 'h09', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '10시', name: 'h10', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '11시', name: 'h11', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '12시', name: 'h12', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '13시', name: 'h13', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '14시', name: 'h14', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '15시', name: 'h15', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '16시', name: 'h16', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '17시', name: 'h17', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '18시', name: 'h18', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '19시', name: 'h19', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '20시', name: 'h20', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '21시', name: 'h21', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '22시', name: 'h22', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '23시', name: 'h23', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '합계', name: 'daySum', minWidth: 60, align: 'right', defaultValue: 0},
            // hidden(숨김)
            {header: 'UID', name: 'UID', minWidth: 60, align: 'right', defaultValue: 0, hidden: true},
        ]
        rainColMon = [
            {header: '시 간', name: 'r_abs_hour', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '시 간', name: 'r_abs_hour', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '금 일', name: 'r_abs_today', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '전 일', name: 'r_abs_yesterday', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '월 간', name: 'r_abs_month', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '연 간', name: 'r_abs_year', minWidth: 60, align: 'right', defaultValue: 0},
            {header: '주 간', name: 'r_abs_week', minWidth: 60, align: 'right', defaultValue: 0},
            // hidden(숨김)
        ]

        rainGrid.setColumns(rainColDay);

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

        var exportExcelButton = document.getElementById('export-excel');
        exportExcelButton.addEventListener('click', function() {
            const selecteddate = document.getElementById('stDt').value
            rainGrid.export('xls', { includeHeader: true,fileName:selecteddate});
        });

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
        // rainGrid.resetData(rainDevice);
        return rainDevice;
    }
    async function selectRainDateDay() {
        var selectDay=document.getElementById('stDt').value
        document.getElementById('rainDateInfo').innerHTML='강우 | 일간데이터 |';
        document.getElementById('rainDay').innerHTML=selectDay;
        rainGrid.setColumns(rainColDay);
        rainGrid.refreshLayout(); // 데이터 초기화
        rainGrid.finishEditing(); // 데이터 마감
        rainGrid.clear(); // 데이터 초기화
        var param = {};
        param.stDt = selectDay;
        var max={name:'최고'};
        var min={name:'최저'};
        var avg={name:'평균'};


        let reqData = edsUtil.getAjax("/RAIN_MAIN/selectRainDataDay", param); // 데이터 set
        /* grid summary 적용*/
        for (let col = 0; col <= 23; col++) {
            let html = '';

            var data1=truncateToFixed1(getMax(reqData,'h'+col.toString().padStart(2,'0')));
            var data2=truncateToFixed1(getMin(reqData,'h'+col.toString().padStart(2,'0')));
            var data3='_';
            var sum=0;
            var check=false;
            for (const value of reqData) {
                if(isFinite(value['h'+col.toString().padStart(2,'0')])){
                    sum+= Number(value['h'+col.toString().padStart(2,'0')]);
                    check=true;
                }
            }
            if (!check) {
                data3 = '_'; // 유효한 숫자가 하나도 없는 경우 '_'
            } else if (sum === 0) {
                data3 = '0'; // 합이 0인 경우 '0'
            } else {
                data3 = sum; // 그 외의 경우 합산 결과를 표시
            }
            data3=(Number(data3)/reqData.length);
            data3=truncateToFixed1(data3)
            //html += `<div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data1+`</div></div><div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data2+`</div></div><div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data3+`</div></div>`;
            max['h'+col.toString().padStart(2,'0')]=data1;
            min['h'+col.toString().padStart(2,'0')]=data2;
            avg['h'+col.toString().padStart(2,'0')]=data3;

            //rainGrid.setSummaryColumnContent('h'+col.toString().padStart(2,'0'),html);
        }
        if(reqData.length>0) {
            max.daySum = truncateToFixed1(getMax(reqData, 'daySum'));
            min.daySum = truncateToFixed1(getMin(reqData, 'daySum'));
            avg.daySum = truncateToFixed1(getAverage(reqData, 'daySum'));
            reqData.push(max);
            reqData.push(min);
            reqData.push(avg);
        }
        rainGrid.resetData(reqData);

    }
    async function selectRainDateMon() {
        var selectDay=document.getElementById('stDt').value
        document.getElementById('rainDateInfo').innerHTML='강우 | 월간데이터 |';
        document.getElementById('rainDay').innerHTML=selectDay;
        var rainMon=[];
        const selectedMonth = document.getElementById('stDt').value;
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = getDaysInMonth(year, month);
        var max={name:'최고'};
        var min={name:'최저'};
        var avg={name:'평균'};

        for(var i=1; i<=daysInMonth; i++)
        {

            if(i==1){
                var name={header: '지역', name: 'name', minWidth: 70, align: 'center', defaultValue: 0};
                var uid={header: '', name: 'uid', minWidth: 70, align: 'right', defaultValue: 0,hidden:true};
                rainMon.push(name)
            }
            var header=i+'일';
            var name='day'+i;
            var colum={header: header, name:name, minWidth: 45, align: 'right', defaultValue: 0};
            rainMon.push(colum)
            if(i==daysInMonth){
                var sum={header: '합 계', name: 'totalSum', minWidth: 70, align: 'right', defaultValue: 0};
                rainMon.push(sum)
            }

        }

        rainGrid.setColumns(rainMon)
        rainGrid.refreshLayout(); // 데이터 초기화
        rainGrid.finishEditing(); // 데이터 마감
        rainGrid.clear(); // 데이터 초기화
        var param = {};
        param.stDt = document.getElementById('stDt').value;

        let reqData = edsUtil.getAjax("/RAIN_MAIN/selectRainDataMon", param); // 데이터 set
        for (let col = 1; col <= daysInMonth; col++) {
            let html = '';
            var data1=truncateToFixed1(getMax(reqData,'day'+col));
            var data2=truncateToFixed1(getMin(reqData,'day'+col));
            var data3='_';
            var sum=0;
            var check=false;
            for (const value of reqData) {
                if(isFinite(value['day'+col])){
                    sum+= Number(value['day'+col]);
                    check=true;
                }
            }
            if (!check) {
                data3 = '_'; // 유효한 숫자가 하나도 없는 경우 '_'
            } else if (sum === 0) {
                data3 = '0'; // 합이 0인 경우 '0'
            } else {
                data3 = sum; // 그 외의 경우 합산 결과를 표시
            }
            data3=(Number(data3)/reqData.length);
            data3=truncateToFixed1(data3)
            //html += `<div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data1+`</div></div><div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data2+`</div></div><div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data3+`</div></div>`;
            //rainGrid.setSummaryColumnContent('day'+col,html);
            max['day'+col]=data1;
            min['day'+col]=data2;
            avg['day'+col]=data3;
        }
        if(reqData.length>0) {
            max.totalSum = truncateToFixed1(getMax(reqData, 'totalSum'));
            min.totalSum = truncateToFixed1(getMin(reqData, 'totalSum'));
            avg.totalSum = truncateToFixed1(getAverage(reqData, 'totalSum'));
            reqData.push(max);
            reqData.push(min);
            reqData.push(avg);
        }
        rainGrid.resetData(reqData);
    }
    async function selectRainDateYear() {
        var selectDay=document.getElementById('stDt').value
        document.getElementById('rainDateInfo').innerHTML='강우 | 연간데이터 |';
        document.getElementById('rainDay').innerHTML=selectDay;
        var rainYear=[];
        var max={name:'최고'};
        var min={name:'최저'};
        var avg={name:'평균'};
        for(var i=1; i<=12; i++)
        {

            if(i==1){
                var name={header: '지역', name: 'name', minWidth: 70, align: 'center', defaultValue: 0};
                var uid={header: '', name: 'uid', minWidth: 70, align: 'right', defaultValue: 0,hidden:true};
                rainYear.push(name)
            }
            var header=i+'월';
            var name='mon'+i;
            var colum={header: header, name:name, minWidth: 45, align: 'right', defaultValue: 0};
            rainYear.push(colum)
            if(i==12){
                var sum={header: '합 계', name: 'totalSum', minWidth: 70, align: 'right', defaultValue: 0};
                rainYear.push(sum)
            }

        }
        rainGrid.setColumns(rainYear)
        rainGrid.refreshLayout(); // 데이터 초기화
        rainGrid.finishEditing(); // 데이터 마감
        rainGrid.clear(); // 데이터 초기화
        var param = {};
        param.stDt = document.getElementById('stDt').value;
        let reqData = edsUtil.getAjax("/RAIN_MAIN/selectRainDataYear", param); // 데이터 set
        for (let col = 1; col <= 12; col++) {
            let html = '';
            var data1=truncateToFixed1(getMax(reqData,'mon'+col));
            var data2=truncateToFixed1(getMin(reqData,'mon'+col));
            var data3='_';
            var sum=0;
            var check=false;
            for (const value of reqData) {
                if(isFinite(value['mon'+col])){
                    sum+= Number(value['mon'+col]);
                    check=true;
                }
            }
            if (!check) {
                data3 = '_'; // 유효한 숫자가 하나도 없는 경우 '_'
            } else if (sum === 0) {
                data3 = '0'; // 합이 0인 경우 '0'
            } else {
                data3 = sum; // 그 외의 경우 합산 결과를 표시
            }
            data3=(Number(data3)/reqData.length);
            data3=truncateToFixed1(data3)
            //html += `<div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data1+`</div></div><div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data2+`</div></div><div class="bodersum" style="font-weight: bold"><div style="padding-right: 5px">`+data3+`</div></div>`;
            //rainGrid.setSummaryColumnContent('mon'+col,html);
            max['mon'+col]=data1;
            min['mon'+col]=data2;
            avg['mon'+col]=data3;
        }
        if(reqData.length>0) {
            max.totalSum = truncateToFixed1(getMax(reqData, 'totalSum'));
            min.totalSum = truncateToFixed1(getMin(reqData, 'totalSum'));
            avg.totalSum = truncateToFixed1(getAverage(reqData, 'totalSum'));
            reqData.push(max);
            reqData.push(min);
            reqData.push(avg);
        }
        rainGrid.resetData(reqData);
    }
    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }
    function groupDataByDate(data) {
        const groupedData = {};
        data.forEach(item => {
            const date = item.raindate;
            if (!groupedData[date]) {
                groupedData[date] = [];
            }
            groupedData[date].push(item);
        });
        return groupedData;
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
        for (const gridRow of gridData) {
            for (const datas of rainData) {
                if (datas.uid == gridRow.uid) {
                    if (Number(datas.r_abs_today) >= Number(maxValue)) maxValue = datas.r_abs_today;
                    if (Number(datas.r_abs_today) < Number(minValue)) minValue = datas.r_abs_today;
                }
            }
        }
        for (const gridRow of gridData) {
            let rowKey = gridRow.rowKey;
            for (const datas of rainData) {
                if (datas.uid == gridRow.uid) {
                    rainGrid.setValue(rowKey, 'r_abs_hour', toFixmm(datas.r_abs_hour));
                    rainGrid.setValue(rowKey, 'r_abs_today', maxminValue(rowKey, datas.r_abs_today, maxValue, minValue));
                    rainGrid.setValue(rowKey, 'r_abs_yesterday', toFixmm(datas.r_abs_yesterday));
                    rainGrid.setValue(rowKey, 'r_abs_year', toFixmm(datas.r_abs_year));
                    rainGrid.setValue(rowKey, 'r_abs_month', toFixmm(datas.r_abs_month));
                }


            }
        }
    }

    const interval = 120000; // 60초
    function resetData() {
        selectRainData();
        setTimeout(resetData, interval);
    }

    function maxminValue(rowKey, value, maxValue, minValue) {
        let returnValue = '';
        rainGrid.removeCellClassName(rowKey, 'r_abs_today', 'red')
        rainGrid.removeCellClassName(rowKey, 'r_abs_today', 'blue');
        if (maxValue == 0 && minValue == 0) {
            return toFixmm(value);
        }
        if (value == maxValue) {
            rainGrid.addCellClassName(rowKey, 'r_abs_today', 'red');
        } else if (Number(value) == Number(minValue))
            rainGrid.addCellClassName(rowKey, 'r_abs_today', 'blue');

        else
            returnValue = toFixmm(value);

        return toFixmm(value);

    }
    function getMin(arr,data) {
        // 배열이 유효한지 검사
        if (!Array.isArray(arr) || arr.length === 0) {
            return '-';
        }

        // day1의 유효한 숫자 값만 필터링
        const day1Values = arr
            .map(item => item[data])    //
            .filter(value => isFinite(value)); // 유효한 숫자인 값만 남김

        // 필터링 후 유효한 숫자 요소가 없는 경우
        if (day1Values.length === 0) {
            return '-';
        }

        // 최솟값 구하기
        const min = Math.min(...day1Values);
        return min;
    }
    function getMax(arr,data) {
        // 배열이 유효한지 검사
        if (!Array.isArray(arr) || arr.length === 0) {
            return '-';
        }
        // day1의 유효한 숫자 값만 필터링
        const day1Values = arr
            .map(item => item[data])
            .filter(value => isFinite(value));

        if (day1Values.length === 0) {
            return '-';
        }

        // 최댓값 구하기
        const max = Math.max(...day1Values);
        return max;
    }

    function truncateToFixed1(num) {
        if (!isFinite(num)) {
            return '-';
        }
        // 매우 작은 값 처리
        if (num < 1e-10 && num > -1e-10) {
            num = 0;
        }
        const str = num.toString();
        const decimalIndex = str.indexOf('.');
        if (decimalIndex === -1) {
            return str + '.0'; // 소수점이 없는 경우
        }
        return str.substring(0, decimalIndex + 2);
    }
    function getAverage(arr, data) {
        // 배열이 유효한지 검사
        if (!Array.isArray(arr) || arr.length === 0) {
            return '-';
        }

        // data에 해당하는 값들을 추출하여 유효한 숫자 값들만 필터링
        const values = arr
            .map(item => Number(item[data]))
            .filter(value => isFinite(value));
        if (values.length === 0) {
            return '-';
        }

        // 평균값 계산
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / arr.length;

        return avg; // 평균값은 소수점 한 자리까지 표시
    }
</script>
</html>