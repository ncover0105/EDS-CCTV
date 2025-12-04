<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title>Google Maps with Custom Markers</title>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDjKf7JFgVPXm30S18NddMvnkajkuK6UuU"></script>
    <script src="https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js"></script>
    <script type="text/javascript" src='/plugins/toastr/toastr.min.js'></script>
    <script type="text/javascript" src='/plugins/toastr/toastrmessage.js'></script>
    <script type="text/javascript" src="/AdminLTE_main/plugins/sweetalert2/sweetalert2.all.min.js"></script>
    <script src="/js/com/d3.js"></script>
    <script type="text/javascript"  src="/AdminLTE_main/plugins/jquery/jquery.min.js"></script>
    <!-- jQuery UI 1.13.0 -->
    <script type="text/javascript" src='/AdminLTE_main/plugins/jquery-ui/jquery-ui.min.js'></script>
    <script type="text/javascript"  src="/AdminLTE_main/plugins/jquery-validation/jquery.validate.min.js"></script>
    <!-- jQuery inputmask -->
    <script type="text/javascript" src='/AdminLTE_main/plugins/inputmask/jquery.inputmask.js'></script>
    <script src="/tui/tui-grid/dist/tui-grid.js"></script>

    <link rel="stylesheet" href="/tui/tui-grid/dist/tui-grid.css" />
    <link rel="stylesheet" href="/css/AdminLTE_main/dist/css/adminlte.min.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap" rel="stylesheet">
    <!-- Font Awesome -->
    <link type="text/css" rel="stylesheet" href="/css/AdminLTE_main/plugins/fontawesome-free/css/all.min.css">
    <script type="text/javascript"  src="/css/AdminLTE_main/plugins/fontawesome-free/js/all.min.js"></script>

    <style>
        * {
            font-family: "Noto Sans KR", sans-serif !important;
            font-optical-sizing: auto !important;
            font-weight: 500 !important;
            font-style: normal !important;
        }
        body {
            margin: 0;
        }
        /* 지도의 크기를 지정 */
        #mapDiv {
            height: 100vh; /* 버튼 추가를 위해 높이 조정 */
            width: 80%;
            position: relative;
        }
        #map {
            height: 100vh; /* 버튼 추가를 위해 높이 조정 */
            width: 100%;
        }
        /* 상단 버튼 배치 */
        #buttons {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1;
        }
        button {
            margin: 5px;
            padding: 10px;
            font-size: 16px;
            cursor: pointer;
        }
        /* 왼쪽 상단에 이미지 배치 */
        #custom-image {
            position: absolute;
            top: 10px;
            left: 10px;
            width: 200px;
            height: 50px;
            z-index: 1;
            background-image: url('/css/gumilogo.png'); /* 이미지 URL 입력 */
            background-size: contain;  /* 이미지를 컨테이너 안에 맞춤 */
            background-repeat: no-repeat;
            background-position: center;
        }
        .mainDataTable
        {
            border-top: 3px solid #003f9e;
            width: 100%;
            font-size: 14px;
            text-align: center;

        }
        /* 테이블 */
        table.mainDataTable th
        {
            font-weight:900 !important;
            border: 1px solid #dee2e6; /* 상단 border */
            padding: 10px;
            font-size: 1rem;


        }
        /* 테이블 헤더와 바디의 셀에만 상하 border를 적용 */
        table.mainDataTable td {
            font-weight:700  !important;
            border: 1px solid #dee2e6; /* 상단 border */
            padding: 5px;
        }

        /* 테이블 셀의 외각 border를 합침 */
        table.mainDataTable {
            border-collapse: collapse;
        }
        table.mainDataTable thead {
            background-color: #f4f5f5;
        }
        /* 첫 번째 컬럼의 우측 border 제거 */
        table.mainDataTable th:first-child,
        table.mainDataTable td:first-child {
            border-left: none;
        }

        /* 마지막 컬럼의 좌측 border 제거 */
        table.mainDataTable th:last-child,
        table.mainDataTable td:last-child {
            border-right: none;
        }
        .fixed-bottoms {
            position: fixed;
            bottom: 0;
            width: 20%;
            padding: 10px;
            background-color: #f8f9fa;
            border-top: 1px solid #dee2e6;
            text-align: center;
        }
        .toptitle {
            padding: 10px;
            background-color: #f8f9fa;
            border-top: 1px solid #dee2e6;
            text-align: center;
        }
        .fixed-bottom a {
            font-size: 10px; /* 예시에 사용된 글자 크기 */
            margin: 0; /* 여백을 제거하여 더 많은 공간을 확보합니다. */
        }
        .jsg
        {
            width: 150px;
            padding: 5px;
            border:2px solid #0067b3;
            background-color: white;
            border-radius: 30px;
            text-align: center;
            color:#0067b3;
            font-weight: 900;
        }
        /* 범례 스타일 */
        #legendtop {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgb(159 159 159 / 50%);
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            font-size: 14px;
            color: #333;
            border-radius: 5px;
            width: auto;
            z-index: 1; /* 지도 위에 표시되도록 z-index 추가 */
        }
        /* 범례 스타일 */
        #legend {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: white;
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            font-size: 14px;
            color: #333;
            border-radius: 5px;
            width: 500px;
            z-index: 1; /* 지도 위에 표시되도록 z-index 추가 */
        }
        .legend-item {
            display: flex;
            padding: 10px;
            align-items: center;
            margin-bottom: 5px;
        }
        .legend-item .progress {
            flex: 1;
            height: 30px;
            margin-left: 10px;
        }
        .progress-bar {
            width: 20px;
            height: 100%;
        }
        .alarmDiv
        {
            font-size: 14px;
            font-weight: 600;
            line-height: 14px;
            text-align: center;
            color: #fff;
            text-shadow: 0 0 2px rgba(0, 0, 0, .4);
        }
        .tablePop{
            width: 100%;
            margin-bottom: unset;
        }
        .tablePop thead th {
            letter-spacing: 1px;
            padding: 5px 5px !important;
            text-align: center;
        }
        .tablePop>tbody>tr>td, .tablePop>tbody>tr>th {
            padding: 5px 5px !important;
            text-align: center;
        }
        .gm-style-iw-chr
        {
            display: none;
        }
        .gm-style-iw gm-style-iw-c
        {
            padding: 15px;
        }
        .gm-style-iw-d
        {
            padding: 5px;
        }
    </style>
</head>
<body>
<div  style="display: flex">
    <div id="mapDiv">
        <div id="map">

        </div>
        <div id="legendtop">
            <div style=" border-radius: 5px; padding: 5px 10px;font-size: 0.8rem;color: white;  ">
                <span>
                    <i class="fa-solid fa-volume-high"></i>
                    수위 자료는 5분 단위로 계측됩니다.(지점별로 계측시간이 상이할 수 있습니다.)
                </span>
            </div>
        </div>
        <div id="legend">
            <div style="background-color: #003f9e; border-radius: 5px 5px 0 0; padding: 5px 10px;font-size: 1rem;color: white;  ">
                <span>
                    <i class="fa-solid fa-arrow-up-from-water-pump"></i>
                    수위레벨
                </span>
            </div>
            <div class="legend-item">
                <span>저수율(%) </span>
                <div class="progress">
                    <div class="progress-bar bg-primary" style="width: 50%">50%</div>
                    <div class="progress-bar bg-warning" style="width: 20%">50%~70%</div>
                    <div class="progress-bar bg-danger" style="width: 30%">70% 이상</div>
                </div>
            </div>
        </div>
    </div>
<%--    <div id="buttons">--%>
<%--        <button id="redButton">빨간색</button>--%>
<%--        <button id="blueButton">파란색</button>--%>
<%--    </div>--%>
    <div id="custom-image">

    </div>
    <div class="" style="width: 20%;" id="rightTb">
        <div  class="toptitle">
            <div class="input-group"style="font-size: 12px !important;">
                <input type="search" class="form-control form-control-sm" placeholder="저수지 검색" style="border-radius: 5px 0 0 5px">
                <div class="input-group-append">
                    <button class="btn btn-sm btn-default m-0" style="border-radius: 0px 5px 5px 0">
                        검색
                    </button>
                </div>
                <button class="ml-1 btn btn-sm btn-default m-0" style="background-color: gray; color: white style="border-radius: 5px 5px 5px 5">
                    관리자 화면
                </button>
            </div>
        </div>
        <div class="mt-2">
            <div class="card-header border-0 pb-0">
                <h3 class="card-title jsg">저수지 현황</h3>
                <%--                <div class="card-tools">--%>
                <%--                    <ul class="pagination pagination-sm float-right">--%>
                <%--                        <li class="page-item"><a class="page-link" href="#">«</a></li>--%>
                <%--                        <li class="page-item"><a class="page-link" href="#">1</a></li>--%>
                <%--                        <li class="page-item"><a class="page-link" href="#">2</a></li>--%>
                <%--                        <li class="page-item"><a class="page-link" href="#">3</a></li>--%>
                <%--                        <li class="page-item"><a class="page-link" href="#">»</a></li>--%>
                <%--                    </ul>--%>
                <%--                </div>--%>
            </div>

            <div class="card-body border-0" style="padding: 1rem">
                <table class=" mainDataTable">
                    <thead>
                        <tr>
                            <th style="width: 10px"></th>
                            <th>지역</th>
                            <th>수위</th>
                            <th>저수율</th>
                            <th style="width: 40px"></th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>1.</td>
                        <td>동송저수지</td>
                        <td>16.5m</td>
                        <td>
                            <div class="progress progress-xs">
                                <div class="progress-bar progress-bar bg-warning" style="width: 55%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-warning">55%</span></td>
                    </tr>
                    <tr>
                        <td>2.</td>
                        <td>주아 저수지</td>
                        <td>31.5m</td>
                        <td>
                            <div class="progress progress-xs">
                                <div class="progress-bar bg-danger" style="width: 82.2%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-danger">82.2%</span></td>
                    </tr>
                    <tr>
                        <td>3.</td>
                        <td>영동 저수지</td>
                        <td>10.5m</td>
                        <td>
                            <div class="progress progress-xs progress-striped active">
                                <div class="progress-bar bg-primary" style="width: 30%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-primary">30%</span></td>
                    </tr>
                    <tr>
                        <td>4.</td>
                        <td>저수지</td>
                        <td>14.2m</td>
                        <td>
                            <div class="progress progress-xs progress-striped active">
                                <div class="progress-bar bg-primary" style="width: 21%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-primary">21%</span></td>
                    </tr>
                    <tr>
                        <td>5.</td>
                        <td>저수지</td>
                        <td>11.6m</td>
                        <td>
                            <div class="progress progress-xs progress-striped active">
                                <div class="progress-bar bg-primary" style="width: 24%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-primary">24%</span></td>
                    </tr>
                    <tr>
                        <td>6.</td>
                        <td>저수지</td>
                        <td>10.2m</td>
                        <td>
                            <div class="progress progress-xs progress-striped active">
                                <div class="progress-bar bg-primary" style="width: 43%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-primary">43%</span></td>
                    </tr>
                    <tr>
                        <td>7.</td>
                        <td>저수지</td>
                        <td>12.5m</td>
                        <td>
                            <div class="progress progress-xs progress-striped active">
                                <div class="progress-bar bg-primary" style="width: 33%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-primary">33%</span></td>
                    </tr>
                    <tr>
                        <td>8.</td>
                        <td>저수지</td>
                        <td>11.5m</td>
                        <td>
                            <div class="progress progress-xs progress-striped active">
                                <div class="progress-bar bg-primary" style="width: 31%"></div>
                            </div>
                        </td>
                        <td><span class="badge bg-primary">31%</span></td>
                    </tr>
                    </tbody>
                </table>

            </div>

        </div>
        <div class="fixed-bottoms">
            <a>2024년 06월 11일 12시 20분</a>
            <!-- 여기에 날씨 정보 표시 -->
        </div>
    </div>
</div>

<script>
    let markers = []; // 마커 배열을 전역 변수로 이동

    window.onload = async function() {
        await initMap();

        document.getElementById('redButton').addEventListener('click', function() {
            console.log("???")
            changeMarkerColors('#FF0000');
        });

        document.getElementById('blueButton').addEventListener('click', function() {
            changeMarkerColors('#0000FF');
        });
    }

    async function initMap() {
        const { Map, InfoWindow } = await google.maps.importLibrary("maps");

        // 지도 옵션 설정 (구미시 중심, 위성 지도, 기본 UI 비활성화)
        var mapOptions = {
            center: { lat: 36.119485, lng: 128.344579 }, // 구미시 중심 좌표
            zoom: 12,
            mapTypeId: 'satellite',  // 위성 이미지로 설정
            disableDefaultUI: true,  // 기본 UI 비활성화
        };

        // 지도를 표시할 div 요소를 지정하고 지도를 생성
        var map = new Map(document.getElementById('map'), mapOptions);

        // 커스텀 마커 데이터
        var markersData = [
            { position: { lat: 36.2808, lng: 128.2830 }, name: '주아 저수지', info: '경상북도 구미시 옥성면 주아리 산144-1', radius: '500m', color: '#dc3545' },
            { position: { lat: 36.3011, lng: 128.324579 }, name: '구미 저수지', info: '경상북도 구미시 옥성면', radius: '1km', color: '#ffc107' },
            { position: { lat: 36.3150, lng: 128.334579 }, name: '옥동 저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.3350, lng: 128.314579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.3850, lng: 128.214579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.4150, lng: 128.122579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.2780, lng: 128.319579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.1450, lng: 128.295079 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.3750, lng: 128.321579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.4450, lng: 128.294579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.3450, lng: 128.294579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.3745, lng: 128.294579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },
            { position: { lat: 36.4450, lng: 128.294579 }, name: '저수지', info: '경상북도 구미시 옥성면', radius: '750m', color: '#007bff' },


            // 필요한 만큼 더 추가
        ];

        // 마커 배열 생성
        markers = markersData.map(function(data) {
            var svgString = `
            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <!-- 외부 원 (테두리) -->
                <circle cx="15" cy="15" r="9" fill="none" stroke="#fff" stroke-width="2" />
                <!-- 내부 원 (배경) -->
                <circle cx="15" cy="15" r="8" fill="`+data.color+`" />
                <!-- 텍스트 -->
                <text x="15" y="21" font-size="12" font-family="Arial" fill="#fff" text-anchor="middle">${data.name}</text>
            </svg>
            `;

            var customIcon = {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString),
            };

            var marker = new google.maps.Marker({
                position: data.position,
                map: map,
                icon: customIcon, // 커스텀 아이콘 사용
                // icon: {
                //     url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                //         <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                //           <circle cx="15" cy="15" r="15" fill="#052563" />
                //           <text x="15" y="20" font-size="12" font-family="Arial" fill="white" text-anchor="middle">`+data.name+`</text>
                //         </svg>
                //     `),
                //     scaledSize: new google.maps.Size(30, 30)
                // },
            });

            // 정보 윈도우 생성
            // var infoWindowContent = `
            //     <div style="text-align: center;">
            //         <h5 style="font-weight: 700;border-bottom: 1px solid grey">`+data.name+`</h5>
            //         <p>`+data.info+`</p>
            //     </div>
            //  <table class="tablePop table-sm table-hover">
            //       <thead>
            //         <tr class="table-secondary">
            //           <th scope="col">수위</th>
            //           <th scope="col">현재 (m)</th>
            //           <th scope="col">만수위 (m)</th>
            //         </tr>
            //       </thead>
            //       <tbody>
            //         <tr>
            //           <td></td>
            //           <td style="color: red;">31.5</td>
            //           <td>27.82</td>
            //         </tr>
            //       </tbody>
            //     </table>
            //     <table class="tablePop table-sm table-hover">
            //       <thead>
            //         <tr class="table-secondary">
            //           <th scope="col">강우량</th>
            //           <th scope="col">1H (mm)</th>
            //           <th scope="col">1D (mm)</th>
            //         </tr>
            //       </thead>
            //       <tbody>
            //         <tr>
            //           <td></td>
            //           <td>23</td>
            //           <td>512</td>
            //         </tr>
            //       </tbody>
            //     </table>
            //     <table class="tablePop   table-sm table-hover">
            //       <thead>
            //         <tr class="table-secondary">
            //           <th scope="col">구분</th>
            //           <th scope="col">최저</th>
            //           <th scope="col">최고</th>
            //         </tr>
            //       </thead>
            //       <tbody>
            //         <tr>
            //           <td>지중침하계</td>
            //           <td>0</td>
            //           <td>0</td>
            //         </tr>
            //         <tr>
            //           <td>토양수분계</td>
            //           <td>0</td>
            //           <td>0</td>
            //         </tr>
            //       </tbody>
            //     </table>
            // `;
            // var infoWindow = new InfoWindow({
            //     content: infoWindowContent,
            //     closeButton: false // x 표시 없애기
            // });
            // 마커에 대한 정보 표시 카드 생성
            var cardContent = `
                <div class="cardInfo">
                    <div style="">
                        <span>`+data.name+`</span>
                    </div>
                    <p>`+data.info+`</p>
                </div>
            `;
            infoWindow = new google.maps.InfoWindow({
                content: cardContent,
                closeButton: false // x 표시 없애기
            });

            // 카드를 마커 옆에 표시
            infoWindow.open(map, marker);
            // 마커 클릭 시 정보 윈도우 표시
            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.open(map, marker);
            });

            return marker;
        });


    }

    function changeMarkerColors(color) {
        console.log(markers)
        markers.forEach(function(marker) {
            let name=marker.getLabel();
            marker.setIcon({
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="15" cy="15" r="15" fill="`+color+`" />
                      <text x="15" y="20" font-size="12" font-family="Arial" fill="white" text-anchor="middle">`+name+`</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(30, 30)
            });
            console.log("sdasdsad")
        });
    }
</script>
</body>
</html>
