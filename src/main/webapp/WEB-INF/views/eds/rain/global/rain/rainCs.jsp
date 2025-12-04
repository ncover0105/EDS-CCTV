<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title>청송군</title>
    <link rel="stylesheet" href="/tui/tui-grid/dist/tui-grid.css" />
    <script type="text/javascript" src='/plugins/toastr/toastr.min.js'></script>
    <script type="text/javascript" src='/plugins/toastr/toastrmessage.js'></script>
    <script type="text/javascript" src="/AdminLTE_main/plugins/sweetalert2/sweetalert2.all.min.js"></script>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="/js/com/d3.js"></script>
    <link rel="stylesheet" href="/css/AdminLTE_main/plugins/fontawesome-free/css/all.min.css">
    <link rel="stylesheet" href="/css/AdminLTE_main/dist/css/adminlte.min.css">
    <script src="https://code.jquery.com/jquery-3.5.1.min.js" crossorigin="anonymous"></script>
    <!-- jQuery UI 1.13.0 -->
    <script type="text/javascript" src='/AdminLTE_main/plugins/jquery-ui/jquery-ui.min.js'></script>
    <script type="text/javascript"  src="/AdminLTE_main/plugins/jquery-validation/jquery.validate.min.js"></script>
    <!-- jQuery inputmask -->
    <script type="text/javascript" src='/AdminLTE_main/plugins/inputmask/jquery.inputmask.js'></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
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
        color: #48a6ff;
    }
    .green
    {
        color: #a0ffad;
    }
    .red
    {
        /* color: #ff6363; */
    }
    .yellow
    {
        /* color: #fff9c7; */
    }

</style>
<body style=" display: flex; height: 100vh; background-color: #262c3a; color: white;">
<div class="col-lg-12 col-12 p-0" style="width: 100%;">
    <section class="content-header" style="padding: 10px 0.5rem;" >
        <div class="container-fluid">
            <div class="row">
                <div class="col-xl-3 col-1" >
                    <!-- <img src="/css/cese.png" style="height: 81px; float: left;" alt="로고"> -->
                </div>
                <div class="col-xl-6 col-11 text-center" >
                    <span style="font-size: 3.5rem; font-weight: bold;" onclick="toggleFullScreen()"><img src="/css/cslogo.png" style="height: 4.5rem; margin-top: -10px;" alt="로고"> 기상종합상황판</span>
                </div>
                <div class="col-xl-3 col-6" >
                    <h1 class="info-box-text time float-right" name="viewDateTime" id="viewDateTime"></h1>
                </div>
            </div>
    </section>
    <section >
        <div class="container-fluid" >
            <div class="row" >
                <div class="col-xl-4 col-12 " style="text-align: center;">
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/imgFiles/sailimg/radar.png"  name = 'raderImg' id="raderImg" alt="이미지 수신중" style="width: 100%; min-width:290px; height: 417px;" >
                    </div>
                    <div class="card" style="padding: 0.5rem;">
                        <img class="m-auto" src="/imgFiles/sailimg/Satellite.png"  name = 'raderImg2' id="raderImg2" alt="이미지 수신중"style="width: 100%; min-width:290px; height: 417px;">

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
                    <div class="card p-0" style="width: 100%; text-align: center;height: calc(100% - 624px - 2rem);">
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
                minRowHeight: 100,
                complexColumns: [
                    {
                        header: '강우량(mm)',
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
            { header:'시 간',			name:'r_abs_hour',	    minWidth:60, 	align:'right',	defaultValue: 0},
            { header:'금 일',			name:'r_abs_today',	    minWidth:60, 	align:'right',	defaultValue: 0},
            { header:'전 일',			name:'r_abs_yesterday',	minWidth:60,	align:'right',	defaultValue: 0},
            { header:'월 간',			name:'r_abs_month',		minWidth:60,	align:'right',	defaultValue: 0},
            { header:'연 간',		    name:'r_abs_year',		minWidth:60,	align:'right',	defaultValue: 0},
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

        let raderImg1= document.getElementById('raderImg');
        var param = {};
        let rainData1=await edsUtil.getAjax("/RAIN_MAIN/getRadarImg", param);
        var tmpDate = new Date();
        if(Object.keys(rainData1).length>0)
        {
            var url1=`/imgFiles/sailimg/radar.png?`+tmpDate.getTime()
            //var url2=`https://apihub.kma.go.kr/api/typ05/api/GK2A/LE1B/VI004/KO/imageList?sDate=`+date+`0000&eDate=`+date+`2359&authKey=tnvu9MccTDe77vTHHAw3BA`
            raderImg1.src=url1;
        }
        else
        {
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
    async function selectDevice()
    {
        rainGrid.refreshLayout(); // 데이터 초기화
        rainGrid.finishEditing(); // 데이터 마감
        rainGrid.clear(); // 데이터 초기화
        var param = {};
        param.rainDate=edsUtil.getToday('%Y%m');
        let rainDevice=await edsUtil.getAjax("/RAIN_MAIN/selectDevice", param);
        rainGrid.resetData(rainDevice);
    }

    async function selectRainData()
    {
        var param = {};
        param.rainDate=await edsUtil.getToday('%Y%m%d%H%i%s');
        param.columnName="H"+param.rainDate.substr(8,2);
        let rainData= edsUtil.getAjax("/RAIN_MAIN/selectRainData", param);
        let gridData=rainGrid.getData();
        let maxValue=0;
        let minValue=0;

        if((rainData.length>0))
        {
            maxValue=rainData[0].r_abs_today;
            minValue=rainData[0].r_abs_today;
        }

        for(const datas of rainData)
        {
            if(Number(datas.r_abs_today)>=Number(maxValue))
            {
                maxValue=datas.r_abs_today;
            }

            if(Number(datas.r_abs_today)<Number(minValue))
                minValue=datas.r_abs_today;

        }
        for(const gridRow of gridData)
        {
            let rowKey= gridRow.rowKey;
            for(const datas of rainData)
            {
                if(datas.uid==gridRow.uid)
                {
                    rainGrid.setValue(rowKey,'r_abs_hour',toFixmm(datas.r_abs_hour));
                    rainGrid.setValue(rowKey,'r_abs_today',maxminValue(datas.r_abs_today,maxValue,minValue));
                    rainGrid.setValue(rowKey,'r_abs_yesterday',toFixmm(datas.r_abs_yesterday));
                    rainGrid.setValue(rowKey,'r_abs_year',toFixmm(datas.r_abs_year));
                    rainGrid.setValue(rowKey,'r_abs_month',toFixmm(datas.r_abs_month));
                }


            }
        }

        //initDataSvg();//이미지 데이터 인풋
        initAPI();
        callJsonApi(url);
        callAwsApi();
        callForecastApi();
    }
    function maxminValue(value,maxValue,minValue) {
        let returnValue='';
        if(maxValue==0 && minValue==0)
        {
            return toFixmm(value);
        }
        if(value==maxValue)
            returnValue='<a href="javascript:void(0);" style="color:red"><b>'+toFixmm(value)+'</b></a>';
        else if(Number(value)==Number(minValue))
            returnValue='<a href="javascript:void(0);" style="color:blue"><b>'+toFixmm(value)+'</b></a>';
        else
            returnValue=toFixmm(value);

        return returnValue;

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