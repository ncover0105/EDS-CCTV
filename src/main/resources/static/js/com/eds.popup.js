/*
* 공통팝업
* URL : Controller select ** View Url
* selectUrl : Controller select ** Url
* height : 팝업 높이
* width : 팝업 너비
* title : 팝업 타이틀
* */
var edsPopup = {};

edsPopup.arrPopupInfo = {
	PMGPOPUP:{url:"/SYSTEM_PGM_MGT_POPUP_VIEW", selectUrl:"/SYSTEM_PGM_MGT_POPUP/selectPmgMgtListPopup", height:650, width:1000, title:"프로그램메뉴팝업"},
	AUTHPOPUP:{url:"/SYSTEM_GP_MENU_AUTH_POP_VIEW", selectUrl:"/SYSTEM_GP_MENU_AUTH/selectGpMenuAuthList", height:800, width:1200, title:"그룹별메뉴권한팝업"},
	EMPPOPUP:{url:"/BASE_USER_MGT_LIST_VIEW_POPUP_VIEW", selectUrl:"/BASE_USER_MGT_LIST/selectUserMgtList", height:800, width:950, title:"사용자팝업"},
	MSTPOPUP:{url:"/eds/rain/basma/selectBASMA7001View", selectUrl:"/eds/rain/basma/selectBASMA7001", height:800, width:919, title:"품목분류팝업"},
	ITEMDIVIPOPUP:{url:"/eds/rain/basma/selectBASMA7002View", selectUrl:"/eds/rain/basma/selectBASMA7002", height:800, width:800, title:"품목군팝업"},
	ITEMPOPUP:{url:"/eds/rain/basma/selectBASMA7003View", selectUrl:"/eds/rain/basma/selectBASMA7003", height:800, width:800, title:"품목팝업"},
	ITEMPOPUP2:{url:"/eds/rain/basma/selectBASMA7004View", selectUrl:"/eds/rain/basma/selectBASMA7004", height:800, width:900, title:"품목팝업2"},
	ITEMPOPUP3:{url:"/eds/rain/basma/selectBASMA7005View", selectUrl:"/eds/rain/basma/selectBASMA7005", height:800, width:900, title:"품목팝업3"},
	ITEMPOPUP4:{url:"/eds/rain/basma/selectBASMA7006View", selectUrl:"/eds/rain/basma/selectBASMA7006", height:800, width:900, title:"품목팝업4"},
	BUSIPOPUP:{url:"/eds/rain/basma/selectBASMA1002View", selectUrl:"/eds/rain/basma/selectBASMA1002", height:800, width:800, title:"사업장팝업"},
	CUSTPOPUP:{url:"/eds/rain/basma/selectBASMA4002View", selectUrl:"/eds/rain/basma/selectBASMA4002", height:800, width:800, title:"거래처팝업"},
	DEPAPOPUP:{url:"/eds/rain/basma/selectBASMA2002View", selectUrl:"/eds/rain/basma/selectBASMA2002", height:800, width:800, title:"부서팝업"},
	STORPOPUP:{url:"/eds/rain/basma/selectBASMA8002View", selectUrl:"/eds/rain/basma/selectBASMA8002", height:650, width:800, title:"창고팝업"},
	SUPPPOPUP:{url:"/eds/rain/basma/selectBASMA9002View", selectUrl:"/eds/rain/basma/selectBASMA9002", height:650, width:800, title:"납품처팝업"},
	BADPOPUP:{url:"/eds/rain/quaco/selectQUACO4002View", selectUrl:"/eds/erp/quaco/selectQUACO4002", height:800, width:800, title:"불량코드팝업"},
	EQUIPOPUP:{url:"/eds/erp/quaco/selectQUACO2003View", selectUrl:"/eds/erp/quaco/selectQUACO2003", height:800, width:800, title:"장비팝업"},
	MANPPOPUP:{url:"/eds/erp/proma/selectPROMA5002View", selectUrl:"/eds/erp/proma/selectPROMA5002", height:800, width:1200, title:"공정팝업"},
	PRODMANPPOPUP:{url:"/eds/erp/proma/selectPROMAb001View", selectUrl:"/eds/erp/proma/selectPROMAb001", height:650, width:800, title:"생산설비팝업"},
	SINSUNGINSTPOPUP:{url:"/eds/erp/proma/selectPROMAo003View", selectUrl:"/eds/erp/proma/selectPROMAo000", height:650, width:800, title:"신성팩설비팝업"},
	SINSUNGMOLDPOPUP:{url:"/eds/erp/proma/selectPROMAp002View", selectUrl:"/eds/erp/proma/selectPROMAp000", height:650, width:800, title:"신성팩금형팝업"},
};

edsPopup.util = {
	"string":{
		/**
		 * 가변인자를 받아 %1~%n까지의 문자를 치환
		 * @param
		 * @returns
		 */
		"replace":function(){
			var sResult = arguments[0];
			var len = arguments.length;
			for(var i=1; i<len; i++){
				sResult = sResult.replace("%" + (i), arguments[i]);
			}
			return sResult;
		},
		"replaceAll":function(src, org, dest){
			return src.split(org).join(dest);
		},
		/**
		 * 스트링을 Date객체로 변환
		 * @param
		 * @returns
		 */
		"toDate":function(strDate, plusDay){
			var yyyy = Number(strDate.substring(0, 4));
			var mm = Number(strDate.substring(4, 6)) - 1;
			var dd = Number(strDate.substring(6, 8)) + (plusDay||0);
			return new Date(yyyy, mm, dd);
		}
	},
	"objToQueryStringEnc":function(obj){
		var arrQueryStr = [];
		for(var field in obj){
			if(obj.hasOwnProperty(field) == true){
				arrQueryStr.push(field + "=" + obj[field]);
			}
		}
		return arrQueryStr.join("&");
	},
	/**
	 * window popup 출력
	 * layout popup과 동일하게 동작하는 window 팝업
	 * @param
	 * 1.url : 팝업 url
	 * 2.id : 팝업 id
	 * 3.params : 팝업 params
	 * 3.height : 팝업의 높이
	 * 4.width : 팝업의 넓이
	 * 5.title : 윈도우 타이틀
	 * 6.fnOnClose : 팝업 닫힐때 호출될 콜백함수
	 * @returns
	 */
	"openWinPop":function (url, id, params, height, width, title, fnOnClose, scrollable) {
		var top = (screen.height-height) / 2;
		var left = (screen.width-width) / 2;
		var scroll = scrollable === false ? "no" : "yes";
		var style = "height=%1, width=%2, top=%3, left=%4, location=no, resizable=yes, menubar=no, toolbar=no, scrollbars=5%";

		window.popupArguments = {};

		if(params != null){
			if(params.method || params.method == "POST"){
				window.popupArguments = params;
			}else{
				url += "?" + this.objToQueryStringEnc(params);
			}
		}

		//팝업 닫을때 호출될 콜백함수
		if(fnOnClose != null){
			window.onPopupClose = fnOnClose;
		}

		//form id로 넘어온경우 form 전송의 타겟을 팝업으로 지정
		if(document[url] != null){
			window.open("", id,  this.string.replace(style, height, width, top, left, scroll));
			document[url].target = id;
			document[url].submit();
		}else{
			window.open(url, id, this.string.replace(style, height, width, top, left, scroll));
		}
	},
	/**
	 * 통합 popup 출력
	 * @param
	 * 1.url : 팝업 url
	 * 2.params : 팝업에 전달될 param
	 * 3.height : 팝업의 높이
	 * 4.width : 팝업의 넓이
	 * 5.title
	 * 6.fnOnClose : 팝업이 close될때 호출될 콜백 함수
	 * 7.scrollable : 스크롤 가능 여부 설정
	 * @returns
	 */
	"open":function (url, params, height, width, title, fnOnClose, scrollable) {
		this.openWinPop(
			url
			,url.substring(url.lastIndexOf("/") + 1, url.length).replace("select", "").replace("View", "")
			,params
			,height
			,width
			,"이디에스"
			,fnOnClose
			,scrollable
		);
	},
	/**
	 * 코드입력시 조회하여 한건인경우 바로 세팅, 두건 이상인 경우 팝업 출력
	 * @param
	 * 1.sPopupId : edsPopup.arrPopupInfo에 등록된 팝업 ID, string으로 넘겨야 함
	 * 2.params : 코드명을 조회할 param
	 * 3.callback : 조회후 호출될 콜백함수
	 * 4.bDirectPop : 팝업을 바로 호출할지 여부
	 * 5.bWithParam : 팝업으로 파라미터를 넘길지 여부
	 * @returns
	 */
	"openPopup":function (sPopupId, params, callback, bDirectPop, bWithParam) {
		
		popupInfo = edsPopup.arrPopupInfo[sPopupId];

		if(bDirectPop){// 팝업 바로 출력
			this.open(
				popupInfo.url,
				bWithParam === true ? params : {},
				popupInfo.height,
				popupInfo.width,
				popupInfo.title,
				callback,
				true
			);
		}else{// 조회후 1건 이상일경우 팝업 출력

			var jsonStr = $.ajax({
				type: "POST",
				url:popupInfo.selectUrl,
				data:JSON.stringify(params),
				dataType: 'json',
				async: false,	//동기방식으로 전송
				contentType: 'application/json;charset=UTF-8',
			}).responseText;

			var data = JSON.parse(jsonStr);
			var codeList = data.data;

			//한건만 조회된경우 콜백함수 바로 호출
			var resultCnt = codeList == null ? 0 : codeList.length;
			if(resultCnt == 1 && typeof callback == "function"){
				callback(codeList[0]);
			}else{
				this.open(
					popupInfo.url,
					bWithParam === true ? params:{},
					popupInfo.height,
					popupInfo.width,
					popupInfo.title,
					callback,
					true
				);
			}
		}
	},
	"edsClosePopup":function (vlu) {
		try{
			opener.returnValue = vlu;
			if(opener.onPopupClose != null){
				opener.onPopupClose();
			}
			window.close();
		}catch(e){
			window.close();
		}
	}
};