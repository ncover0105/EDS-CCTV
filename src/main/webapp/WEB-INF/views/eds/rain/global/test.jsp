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

    </head>

    <style>
        /* 움직이는 텍스트 */
        .animated-title {font-size:3rem; font-weight:300; position: relative; width: 100%;max-width:100%; height: inherit; overflow-x: hidden; overflow-y: hidden; }
        .animated-title .track {position: absolute; white-space: nowrap;will-change: transform;animation: marquee 40s linear infinite; }
        @keyframes marquee {
          from { transform: translateX(200%); }
          to { transform: translateX(-50%); }
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
            transition: transform 0.3s ease; /* 호버 시에 애니메이션 효과를 주기 위한 transition */
        }

        #states path:hover {
            fill: #b6bace;
            transform: translateY(-5px); /* 요소를 위로 5px만큼 이동시키는 효과 */
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
            border: 1px solid #b6bace;
            border-radius: 0.25rem;
            box-shadow: 0 1px 5px rgba(18,32,61,.2);
        }
        .tess-body
        {
            border: 1px solid #b6bace;
            border-radius: 2rem;
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
        .time
        {
            background: #ffecb3;
            border-radius: 232px;
            font-weight: 600;
            font-size: 18px !important;
            letter-spacing: -.5px;
            color: #052563;
            border: 0.5px solid rgba(255,107,0,.16);
            width: 224px;
            height: 28px;
            line-height: 28px;
            text-align: center;
        }
        
    </style>
    <body style="background-color: #f8f8fa; height: 100vh;  display: flex; align-items: center;">
        <div class="m-auto">
            <section class="content-header">
                <div class="container-fluid">
                  <div class="text-center">
                    <h1 style="margin-left: 100px;" onclick="initDataSvg()"><img src="/login/img/cslogo.png" style="width: 3rem;" alt="로고">&nbsp청송군 강수량 현황
                        <ol class="breadcrumb float-sm-right">
                            <li class="mb-0 p-1 breadcrumb-item">                      
                                <h1 class="info-box-text time" name="viewDateTime" id="viewDateTime">2024/01/02 16:01</h1>
                            </li>
                        </ol>
                    </h1>
                  </div>
                </div>
              </section>
            <section>
                <div class="container-fluid" style="background-color: #f8f8fa;">
                    <div class='card mb-2'style="width: 100%;">
                        <div class="card-body pb-1"> 
                            <div class="row" style="flex-wrap: nowrap;">
                                <div class="card">
                                    <div class="card-body p-0"style="height: auto;width: 400px;" id="rainGrid">
                                        <!-- 그리드 영역 -->
                                        <!-- 시트가 될 DIV 객체 -->
                                        <div id="rainGridDIV" style="width:100%; height:100%;"></div>
                                    </div>
                                </div>
                                
                                <div class="ml-2" id="container" ondragstart="return false" style="min-width: 600px;">
                                </div>
                                
                                <div class="card p-2  ml-2" style="height: 100%;">
                                    <img src="/login/img/RDR_CMP_WRC_202401021600.png"  name = 'raderImg' id="raderImg" alt="test" style="height: 400px;">
                                    <div>
                                        <div class="info-box shadow-none tess-body  mt-2">
                                            <span class="info-box-icon" style="width:150px;font-size:2rem;"><i class="fa-solid fa-wind"></i>&nbsp&nbsp바람</span>
                            
                                            <div class="info-box-content " style="text-align: right;">
                                                <h1 class="info-box-text"><strong id='WS1' style="color: #ffecb3;">0</strong><span class="text-sm">m/s</span></h1>
                                            </div>
                                            <!-- /.info-box-content -->
                                        </div>
                                        <div class="info-box shadow-none tess-body">
                                            <span class="info-box-icon" style="width:150px"><i class="fa-solid fa-temperature-high"></i>&nbsp&nbsp온도</span>
                            
                                            <div class="info-box-content" style="text-align: right;">
                                                <h1 class="info-box-text"><strong id='TA' style="color: #ffecb3;">0</strong><span class="text-sm">°C</span></h1>
                                            </div>
                                            <!-- /.info-box-content -->
                                        </div>
                                        <div class="info-box shadow-none tess-body">
                                            <span class="info-box-icon" style="width:150px"><i class="fa-solid fa-droplet"></i>&nbsp&nbsp습도</span>
                            
                                            <div class="info-box-content" style="text-align: right;">
                                            <h1 class="info-box-text"><strong id='HM' style="color: #ffecb3;">0</strong><span class="text-sm">%</span></h1>
                                            </div>
                                            <!-- /.info-box-content -->
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="card mb-0" style="background-color: #191a19; color: #f03e3e; height: 4rem; ">
                                <div class="animated-title">
                                    <div class="track">
                                      <div class="content" id="spacArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    </body>
    <script>
	    var rainGrid;
        window.onload = async function() {
            await loadData()
            await drawMap('#container');
            await selectDevice();
            resetData();
        };
        async function loadData()
        {  
            rainGrid = new tui.Grid({
				el: document.getElementById('rainGridDIV'),
				scrollX: false,
				scrollY: false,
				editingEvent: 'click',
				bodyHeight: 'fitToParent',
				rowHeight:40,
				minRowHeight:40,
				header: {
					height: 80,
					minRowHeight: 80,
					complexColumns: [
						{
							header: '강우량현황(mm)',
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
					height: 60,
					position: 'bottom', // or 'top'
					align:'left',
					columnContent: {
                        name: { template: function(valueMap) { return "합계";}},
						r_abs_hour: { template: function(valueMap) { return (valueMap.filtered.sum).toString();}},
						r_abs_today: { template: function(valueMap) { return (valueMap.filtered.sum).toString();}},
						r_abs_yesterday: { template: function(valueMap) { return (valueMap.filtered.sum).toString();}},
						r_abs_month: { template: function(valueMap) { return (valueMap.filtered.sum).toString();}},
						r_abs_year: { template: function(valueMap) { return (valueMap.filtered.sum).toString();}},
					}
				}
			});

			rainGrid.setColumns([
				{ header:'지역',			name:'name',		    minWidth:80, 	align:'center' ,defaultValue: 0},
				{ header:'시간',			name:'r_abs_hour',	    minWidth:60, 	align:'right',	defaultValue: 0},
				{ header:'금일',			name:'r_abs_today',	    minWidth:60, 	align:'right',	defaultValue: 0},
				{ header:'전일',			name:'r_abs_yesterday',	minWidth:60,	align:'right',	defaultValue: 0},
				{ header:'월간',			name:'r_abs_month',		minWidth:60,	align:'right',	defaultValue: 0},
				{ header:'년간',		    name:'r_abs_year',		minWidth:60,	align:'right',	defaultValue: 0},
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
        function initDataSvg()
        {
            let tempData= rainGrid.getData();
            for(const data of tempData)
            {
                document.getElementById(data.name).innerHTML = data.r_abs_today;
                if(data.r_abs_today>0)
                {
                    document.getElementById(data.name+"_c").style ="fill:green;";
                    document.getElementById(data.name).style ="fill:white;"
                }
                if(data.r_abs_today>=100)
                {
                    document.getElementById(data.name+"_c").style ="fill:red;";
                    document.getElementById(data.name).style ="fill:white;"
                }
            }
        }
        function initTime()
        {
            const startTime = edsUtil.getToday('%Y/%m/%d %H:%i');
            document.getElementById('viewDateTime').innerHTML = startTime;
        }
        function toStringByFormatting(source) {

        const nowDate=new Date(source);
        const returnDate = nowDate.getFullYear()+(nowDate.getMonth()+1).toString().padStart(2,'0')+(nowDate.getDate()).toString().padStart(2,'0')
        return returnDate;
        }
        
        async function initAPI()
        {
            let date = await edsUtil.getToday('%Y%m%d');
            var url = 'http://apis.data.go.kr/1360000/RadarImgInfoService/getCmpImg'; /*URL*/
	        var queryParams = '?' + encodeURIComponent('serviceKey') + '='+'mCSQcbq5lCKQ1eSmMnFBImkISicxFLMMBBO0XUVNKQAqZnI6H%2BuyeX9BUTpRaw2jd8fmIrbuPMMGlUYrvSYhig%3D%3D'; /*Service Key*/
	        queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /**/
	        queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /**/
	        queryParams += '&' + encodeURIComponent('dataType') + '=' + encodeURIComponent('json'); /**/
	        queryParams += '&' + encodeURIComponent('data') + '=' + encodeURIComponent('CMP_WRC'); /**/
	        queryParams += '&' + encodeURIComponent('time') + '=' + encodeURIComponent(date); /**/
            let raderImg1= document.getElementById('raderImg');
	        const urlParam=url + queryParams;
	        $.ajax({
				method:"GET",
				url:urlParam,
				//async: false,	//동기방식으로 전송
				success: function(result) {
                    let body=result.response.body;
					if(body)
					{
						const news =result.response.body.items.item[0];
						var arr = news['rdr-img-file'].split(',');
						var str =arr.pop();
						str = str.slice(0, -1);
						raderImg1.src=str;
						//saveImgFile(str.trim());
					}
					else
					{
                        console.log('레이더이미지가없습니다.');

					}

				}
			});
        }

        //지도 그리기
        async function drawMap(target) {
            return new Promise(function(resolve, reject) {
            var width = 800; //지도의 넓이
            var height = 700; //지도의 높이
            var initialScale = 69000; //확대시킬 값
            var initialX = width/2; //초기 위치값 X
            var initialY = height/2; //초기 위치값 Y
            var labels;

            var projection = d3.geo
                .mercator()
                .center([129.05, 36.365])
                .scale(initialScale)
                .translate([initialX, initialY]);   
            var path = d3.geo.path().projection(projection);
            // 그림자 효과를 가진 필터 생성

            var svg = d3
                .select(target)
                .append('svg')
                .attr('width', width + 'px')
                .attr('height', height + 'px')
                .attr('id', 'map')
                .attr('class', 'map ml-auto mr-auto')
                .attr("fill","white");

            var states = svg
                .append('g')
                .attr('id', 'states')

            states
                .append('rect')
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
                .attr("dx", 5)
                .attr("dy", 5)
                .attr("result", "offsetBlur");
                
            var feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode")
            .attr("in", "offsetBlur");
            feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic")
            .attr("opacity", 0.5);  // 그림자의 투명도를 조절

            d3.json('/js/com/chungsong.geojson',  function(json) {
            // 바깥쪽 경계를 정의하기 위해 'evenodd' 규칙을 사용하는 clipping path 추가
            svg.append("defs")
                .append("clipPath")
                .attr("id", "clip")
                .append("path")
                .datum(json)
                .attr("d", path)
                .attr("fill-rule", "evenodd");


                states
                    .selectAll('path') //지역 설정
                    .data(json.features)
                    .enter()
                    .append('path')
                    .attr('d', path)
                    .style("filter", "url(#drop-shadow)")
                    .attr('id', function(d) {
                        return 'path-' + d.properties.adm_cd;
                    });

                // labels = states
                // .selectAll('text')
                // .data(json.features) //라벨표시
                // .enter()
                // .append('image')
                // .attr('transform', translateTolabel)
                // .attr('xlink:href','/login/img/ELOGO.png')
                // .attr('id', function(d) {
                //  return 'label-' + d.properties.name_eng;})  
                    
                // .attr('dy', '.35em')
                // labels = states
                // .selectAll('image')
                // .data(json.features) //라벨표시
                // .enter()
                // .append('image')
                // .style('width','20px')
                // .attr('transform', translateTolabel)
                // .attr('xlink:href','/login/img/ELOGO.png')
                // .attr('id', function(d) {
                // return 'label-' + d.properties.adm_cd;
                // })
                states
                .selectAll('circle')
                .data(json.features) //라벨표시
                .enter()
                .append("circle")
                .attr('cx', function(d) {
                    let xpoint=path.centroid(d)[0];
                    if (d.properties.name == '진보면') {
                    //진보면 위치
                    xpoint +=30;
                    }
                    else if (d.properties.name == '파천면'||d.properties.name == '안덕면') {
                    //진보면 위치
                    xpoint -=15;
                    }
                    return xpoint;
                })
                .attr('id', function(d) {return d.properties.name+"_c";})
                .attr('cy', function(d) { return path.centroid(d)[1];})
                .attr('r', function(d) {return 20;})
                .attr("width", 30)
                .attr("height", 30)
                .style("fill", "lightblue")
                .style("stroke", "black")
                    
                states
                .selectAll('g')
                .data(json.features) //면이름 라벨표시
                .enter()
                .append('text')
                .attr('transform', translateTolabel)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr('style','font-weight: bold;')
                .text(function(d) {return d.properties.name;})
                
                states
                    .selectAll('g')
                    .data(json.features) //수치 라벨표시
                    .enter()
                    .append('text')
                    .attr('transform', translateTolabel2)
                    .attr("text-anchor", "middle")
                    .attr("alignment-baseline", "middle")
                    .attr("style","font-weight: bold")
                    .text(function(d) {
                        return "12312312"
                    })
                    .attr('id', function(d) {
                        return d.properties.name;
                    })
                    .attr('name', function(d) {
                        return d.properties.name;
                    });
                    resolve();
            });

            

            //텍스트 위치 조절 - 하드코딩으로 위치 조절을 했습니다.
            function translateTolabel(d) {
                var arr = path.centroid(d);
                if (d.properties.name == '진보면') {
                        //진보면 위치
                        arr[1] +=30;
                        arr[0] +=30;
                }
                else if (d.properties.name == '파천면'||d.properties.name == '안덕면') {
                        //진보면 위치
                        arr[1] +=30;
                        arr[0] -=15;
                }
                else
                {
                        //조금 내리기
                        arr[1] +=30;
                }
                return 'translate(' + arr + ')';
                
            }
            function translateTolabel2(d) {
                var arr = path.centroid(d);
                if (d.properties.name == '진보면') {
                        //진보면 위치
                        arr[0] +=30;
                }
                else if (d.properties.name == '파천면'||d.properties.name == '안덕면') {
                        //진보면 위치
                        arr[0] -=15;
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
                }
                else
                {
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
                }
                else
                {
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
            param.rainDate=edsUtil.getToday('%Y%m');
            let rainData=await edsUtil.getAjax("/RAIN_MAIN/selectRainData", param);
            let gridData=rainGrid.getData();
            for(const gridRow of gridData)
            {
                let rowKey= gridRow.rowKey;
                for(const datas of rainData)
                {
                    if(datas.uid==gridRow.uid)
                    {
                        rainGrid.setValue(rowKey,'r_abs_hour',toFixmm(datas.r_abs_hour));
                        rainGrid.setValue(rowKey,'r_abs_today',toFixmm(datas.r_abs_today));
                        rainGrid.setValue(rowKey,'r_abs_yesterday',toFixmm(datas.r_abs_yesterday));
                        rainGrid.setValue(rowKey,'r_abs_year',toFixmm(datas.r_abs_year));
                        rainGrid.setValue(rowKey,'r_abs_month',toFixmm(datas.r_abs_month));
                    }
                    
                    
                }
            }
            initDataSvg();//이미지 데이터 인풋
            initTime();
            initAPI();
            callJsonApi(url);
            callAwsApi();
        }
        function resetData() {
            selectRainData();
            setTimeout(resetData, interval);
        }
        const interval = 30000; // 30초
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
                    let spacString=specArea.innerHTML;
					if(result.data.length>0)
					{
                        let spacData=result.data;//특보데이터
                        let specArea=document.getElementById("spacArea");
                        let spacString='';
                        for(const data of spacData)
                        {
                            data.tm_FC = data.tm_FC.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1/$2/$3 $4:$5');
                            spacString+=data.tm_FC+` [`+data.wrn+`특보]`+data.cmd;
                        }
                        specArea.innerHTML=spacString;
                        
					}
					else
					{
                        //환경정보
                        console.log('특보없음');

					}

				}
			});
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
                        
                        let awsData=result.data;//특보데이터
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
        function toFixmm(num)
        {
            const result = num / 10;
            const formattedResult = result.toFixed(1);
            return formattedResult;
        }
        
    </script>
</html>