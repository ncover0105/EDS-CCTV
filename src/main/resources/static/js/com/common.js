var ut = 

(function(){
		var method = {
		//공통 조회 함수
		"retrieve":function(sheetObj,url, condition , callback){
			var param = {
				url:url,
				params:condition,

				method:"POST",
				reqHeader:{"Content-Type":"application/json;charset=UTF-8"}  
			};
			if(typeof callback == "function"){
				param.callback = callback; 
			}
			sheetObj.doSearch(param);
		},
		
		//페이징 조회 함수
		"retrievePaging":function(sheetObj,url, condition , callback){
			var param = {
				url:url,
				param:condition,

				method:"POST",
				reqHeader:{"Content-Type":"application/json;charset=UTF-8"}
			};
			if(typeof callback == "function"){
				param.callback = callback; 
			}
			sheetObj.doSearchPaging(param);
		},
		//공통 저장 함수
		"store":function(sheetObj,url, condition , opt){
			var param = {
				url:url,
				param:condition,
				
				queryMode:0,  //json형태로 데이터 전달
				//quest:true, //저장하시겠습니까? 표시여부
//				quest:true
				quest:false, //저장하시겠습니까? 표시여부
				reqHeader:{"Content-Type":"application/json;charset=UTF-8"}  
			};
			if(typeof opt != "undefined"){
				Object.assign(param,opt);
			}
			if(typeof condition != "string"){
				param.param = JSON.stringify(condition);
			}
			
			sheetObj.doSave(param);
		},
		//엑셀 다운
		"downExcel":function(sheetObj, singleOpt){
			
			//엑셀 다운로드 관련 기본 옵션
			var params = {
				merge : 1,
				sheetDesign : 1
			};
			
			//엑셀 파일명 설정
			if (typeof singleOpt.name === "undefined") {
				params["fileName"] = "EXCEL_DOWNLOADED.xlsx";
			} else {
				params["fileName"] = singleOpt.name + ".xlsx";
			}
			
			//worksheet 이름
			if (typeof singleOpt.sheetname === "undefined") {
				var d = (new Date()).toLocaleString();
				params["sheetName"] = d.substring(0, d.indexOf("일"));
			} else {
				params["sheetName"] = singleOpt.sheetname;
			}			

			//특정 컬럼만 내리는 경우 downrows
			if (typeof singleOpt.cols !== "undefined") {
				params.downRows = singleOpt.cols;
			}
			
			//특정 행만 내리는 경우 downrows
			if (typeof singleOpt.rows !== "undefined") {
				params.downRows = singleOpt.rows;
			}
			
			//excel 내 타이틀 설정
			if (typeof singleOpt.title !== "undefined") {
				params.titleText = singleOpt.title;
				var lr = 1;
				if (typeof params.downCols === "undefined"
						|| params.downCols == "") {
					lr = sheetObj.getLastCol();
				} else {
					lr = params.downCols.split("|").length;
				}
				params.userMerge = "0,0,1," + lr;
			}
			
			sheetObj.down2Excel(params);
		},
		//엑셀 다운
		"loadExcel":function(sheetObj, singleOpt){
			
			var params = $.extend({"mode":"HeaderMatch"}, singleOpt);

        	if(typeof singleOpt.mode !== "undefined"){
        		params["mode"] = singleOpt.mode;
        	}

        	if(typeof singleOpt.sheetname !=="undefined"){
        		params["workSheetName"] = singleOpt.sheetname;
        	}
        	
        	if(typeof singleOpt.columnMapping !=="undefined"){
        		params["columnMapping"] = singleOpt.columnMapping;
        	}
        	
        	if(typeof singleOpt.startRow !== "undefined"){
        		params["startRow"] = singleOpt.startRow; 
        	}

        	if(typeof singleOpt.startCol !== "undefined"){
        		params["startCol"] = singleOpt.startCol; 
        	}
        	
			sheetObj.loadExcel(params);
		},
		//서버 데이터 엑셀 다운로드
		"directDown2Excel":function(sheetObj,param){
			//구분자 변경
			sheetObj.MarkupTagDelimiter = ["┼","╫","╬","╪"],
			sheetObj.directDown2Excel(param);
		},
		
		//form 객체를 json 로 치환
		"serializeObject":function(formObj){
			var obj = {};
			
			try {
				if (formObj.tagName && formObj.tagName.toUpperCase() == "FORM") {
					for(var i=0;i<formObj.elements.length;i++){
				        switch (formObj.elements[i].type) {
				            case undefined:
				            case "button":
				            case "reset":
				            case "submit":
				                break;
				            case "radio":
				            case "checkbox":
				                if (formObj.elements[i].checked == true) {
				                	this.setObject(obj,this.getName(formObj.elements[i]), formObj.elements[i].value);
				                }
				                break;
				            case "select-one": //단일 선택 select
				                var ind = formObj.elements[i].selectedIndex;
				                if (ind >= 0) {
				                	this.setObject(obj,this.getName(formObj.elements[i]) , formObj.elements[i].options[ind].value);
				                } else {
				                	this.setObject(obj,this.getName(formObj.elements[i]) , "");
				                }
				                break;
				            case "select-multiple":
				                var llen = formObj.elements[i].length;
				                var selectedItemNotExist = true;
				                for (var k = 0; k < llen; k++) {
				                    if (formObj.elements[i].options[k].selected) {
				                    	this.setObject(obj,this.getName(formObj.elements[i]) , formObj.elements[i].options[k].value);
				                    	selectedItemNotExist = false;
				                    }
				                }
				                //선택된게 없음
				                if (selectedItemNotExist) {
				                	this.setObject(obj,this.getName(formObj.elements[i]) , "");
				                }
				                break;
				            default:
				            	this.setObject(obj,this.getName(formObj.elements[i]) , formObj.elements[i].value);
				        }						
					}
				}
			} catch (e) {
				alert(e.message);
			} finally {
			}
			return obj;
		},
		
		//elements 의 name이나 id를 얻어옴.
		"getName":function(element){
			return element.name||element.id||"";
		},
		//동일한 이름의 element가 여러개 인경우 배열화 하자
		"setObject":function(obj,name,value){
			if(obj[ name ]){
        		if(typeof(obj[  name ]) == "object"){
        			obj[  name ].push(value);
        		}else{
        			obj[  name ] = [value];
        		}  
        	}else{
        		obj[  name ] = value; 
        	}
		},
		//Chart 조회
		"retrieveChart":function(param){
    		var opt = {};
    		opt.url = param.url;
    		opt.data = param.subparam;
    		opt.callback = function(response){
    			
    			var chartid = param.chart;
    			var chartData = ut.getChartJSON(response);
    			
    			window[chartid].loadSearchData(chartData,{append: true});	
    		}
    		
    		ut.ajax(opt);
		},
		//Chart JSON 구조로 변환
		"getChartJSON":function(map){
			
			var jsonMap = {};
			var gv = 0;
			var useGuidline = false;
			
			var guidelineUnderPointColor = "#FF0000";
			var value = map["value"].split("|");
			
			var seriesname = new Array();
			
			if(map["seriesname"] != undefined){
				seriesname = map["seriesname"].split("|");
			}
			
			var axisLabel = map["axislabel"];
			var hasAxisLabel = false;
			
			if(axisLabel){
				hasAxisLabel = true;
			}
			
			if(map["guidelineValue"] != undefined){
				gv = map["guidelineValue"];
				if(map["guidelineUnderPointColor"] != undefined){
					guidelineUnderPointColor = map["guidelineUnderPointColor"]; 
				}
				
				useGuidline = true;
			}
			
			var rows = new Array();
			var li = map["data"];
			
			for(var i=0; i<li.length; i++){
				var row = {};
				
				var m = li[i];
				if(hasAxisLabel){
					row["axisLabel"] = m[axisLabel];
				}
				
				var series = [];
				
				if(i==0){
					for(var c=0; c<value.length; c++){
						var first = {};
						
						var v = m[value[c]];
						
						if(useGuidline&&v<gv){
							//first.put("pointColor", guidelineUnderPointColor);
							first["pointColor"] = guidelineUnderPointColor;
						}
						
						//first.put("Value",v);
						first["Value"] = v;
						
						if(seriesname != undefined){
							//first.put("seriesName", seriesName[c]);
							first["seriesName"] = seriesname[c];
						}
						series.push(first);
					}
					
				}else{
					for(var c=0; c<value.length; c++){
						var v = m[value[c]];
						if(useGuidline&&v<gv){
							var mp = {};
							mp["value"] = v;
							mp["pointColor"] = guidelineUnderPointColor;
							series.push(mp);
						}else{
							series.push(v);
						}
						
					}
				}
				
				row["series"] = series;
				rows.push(row);
				
			}
			
			var ibchart = {};
			ibchart["data"] = rows;
			jsonMap["ibchart"] = ibchart;
			
			return jsonMap;
		},
        /**
         * ajax 기본 모듈
         * @memberOf   ib.comm#
         * @method     ajax
         * @private
         * @param      {object}     opt                     설정 옵션
         * @param      {string}     [opt.url = '/xxx/xxx.do']     서버 요청 방법
         * @param      {string}     [opt.type = 'POST']     서버 요청 방법
         *
         * | Enum | Description       |
         * |------|-------------------|
         * | GET  | GET 방식          |
         * | POST | POST 방식         |
         *
         * @param      {boolean}    [opt.blockUI = true]    blockUI 사용여부
         * @param      {boolean}    [opt.async = true]      비동기 요청 여부
         * @param      {object}     [opt.data]              전달할 param 객체
         * @param      {function}   [opt.callback]          callback function
         */
        "ajax": function(opt) {
            var blockUI = true,
                paramData = null; 
                headers = {  // 공통으로 가야하는 값에 대한 설정
                    // "Content-Type":"application/json; charset=UTF-8",
                    // "Accept":"application/json, text/javascript, */*; q=0.01"
//                    "X-Requested-With": "XMLHttpRequest"
                	"Content-Type":"application/json;charset=UTF-8"
                };

            // TODO : valid arguments
            if (typeof opt === "undefined") {
                opt = {};
            }

            paramData = opt.data;
            
            $.ajax({
            	
                type: opt.type || 'POST',
                async: (opt.async === false ? false : true),
                processData: false,
                dataType: 'json',
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                url: opt.url,
                headers: headers,
                success: function(response) {  // 서버에서 내려오는 데이타 형식에 맞춰서 수정
                	
                    try {
                        if (typeof opt.callback === "function") {
                            opt.callback(response);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                },
                error: function(data, status, err) {
                	console.log("error",data);
                	  try {
//                          cc.alert(status + " : " + err);
                          if (typeof opt.callback === "function") {
                              opt.callback(status);
                          }
                      } catch (e) {
                          console.error(e);
                      }
                },
                complete: function() {
//                    cc.hideBlockUI();
                }
            });
        }
		
	};
	return method;
})();


//Object.assign polyfill 두개 object 합치기
if (typeof Object.assign !== 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null && nextSource !== undefined) { 
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}
