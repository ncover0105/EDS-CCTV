/*
* 공통팝업
* URL : Controller select ** View Url
* selectUrl : Controller select ** Url
* height : 팝업 높이
* width : 팝업 너비
* title : 팝업 타이틀
* */
var edsIframe;
var edsIframeArrPopup;

edsIframeArrPopup = {
	AUTHPOPUP:{name:"권한팝업", width:'1300px', height:'700px', url:"/SYSTEM_GP_MENU_AUTH_POP_VIEW"},
	SUBMITUSERPOPUP:{name:"사용자팝업", width:'75%', height:'75%', url:"/BASE_USER_MGT_LIST_POP_DUAL_VIEW"},
	BUSIPOPUP:{name:"사업장팝업", width:'70%', height:'85%', url:"/BASE_BUSI_REG_POP_VIEW"},
	USERPOPUP:{name:"사용자팝업", width:'85%', height:'85%', url:"/BASE_USER_MGT_LIST_POP_VIEW"},
	CUSTPOPUP:{name:"거래처팝업", width:'85%', height:'85%', url:"/BASE_CUST_REG_POPUP_VIEW"},
	DEPAPOPUP:{name:"부서팝업", width:'85%', height:'85%', url:"/BASE_DEPA_REG_POP_VIEW"},
	ITEMPOPUP:{name:"품목팝업", width:'85%', height:'85%', url:"/BASE_ITEM_REG_POP_VIEW"},
	ACCOUNTPOPUP:{name:"계정과목팝업", width:'85%', height:'85%', url:"/BASE_ACCOUNT_REG_POP_VIEW"},
	EMAILADRESSPOPUP:{name:"이메일주소팝업", width:'700px', height:'700px', url:"/BASE_USER_EMAIL_LIST_POP_VIEW"},
	CARPOPUP:{name:"자동차팝업", width:'700px', height:'700px', url:"/BASE_CAR_MGT_LIST_POP_VIEW"},
	CARUSEPOPUP:{name:"자동차사용팝업", width:'700px', height:'700px', url:"/BASE_CAR_MGT_USE_LIST_POP_VIEW"},
	ESTPOPUP:{name:"견적서팝업", width:'85%', height:'85%', url:"/YEONGEOB_EST_MGT_POP_VIEW"},
	PROJPOPUP:{name:"프로젝트팝업", width:'85%', height:'85%', url:"/PROJECT_MGT_POP_VIEW"},
	PROJEDMSPOPUP:{name:"프로젝트팝업", width:'85%', height:'85%', url:"/PROJECT_EDMS_MGT_POP_VIEW"},
	RECPOPUP:{name:"미수채권팝업", width:'75%', height:'85%', url:"/YEONGEOB_REC_MGT_POP_VIEW"},
	EDMSDOCPOPUP:{name:"문서팝업", width:'85%', height:'100%', url:"/EDMS_EST_REPORT_VIEW"},
	EDMSTEMPPOPUP:{name:"임시문서팝업", width:'85%', height:'100%', url:"/EDMS_EST_REPORT_TEMP_VIEW"},
	EDMSCONFPOPUP:{name:"문서확인팝업", width:'85%', height:'100%', url:"/EDMS_EST_REPORT_CONF_VIEW"},
	SITEPOPUP:{name:"사이트팝업", width:'85%', height:'92.5%', url:"/SITE_POP_VIEW"},
};

edsIframe = {

	"arrPopupSetting": function (obj) {
		const arr = [];
		for (var field in obj) {
			if (obj.hasOwnProperty(field) == true) {
				arr.push(field + "=" + obj[field]);
			}
		}
		return arr.join("&");
	},

	"obj2QueryStringEnc": function (obj) {
		const arr = [];
		for (var field in obj) {
			if (obj.hasOwnProperty(field) == true) {
				arr.push(field + "=" + obj[field]);
			}
		}
		return encodeURI(arr.join("&"));
	},

	"openPopup": async function (popupId, param) {
		edmsUrl=param.url;
		const width = edsIframeArrPopup[popupId].width;
		const height = edsIframeArrPopup[popupId].height;
		const url = edsIframeArrPopup[popupId].url;
		if((document.getElementById('iframe_'+param.name))){return;};
		const popup = document.createElement('div');
		popup.setAttribute('id', 'iframe_'+param.name);
		popup.setAttribute('style',
			'position:fixed;' +
			'z-index:999999;' +
			'width:100vw;' +
			'top:0;'+
			'height:100vh;'+
			'background-color: rgba(0, 0, 0, .5);'
		);

		const iframe = document.createElement('iframe');
		iframe.setAttribute('name', 'iframe_'+param.name);
		iframe.setAttribute('width', width);
		iframe.setAttribute('height', height);
		iframe.setAttribute('style',
			'position:absolute;' +
			'top:50%;' +
			'left:50%;' +
			'transform: translate(-50%, -50%);'
		);

		popup.appendChild(iframe);
		document.body.children[0].prepend(popup);

		const form = document.createElement('form');
		form.setAttribute('target', 'iframe_'+param.name);
		form.setAttribute('method', "post");
		form.setAttribute('action', url + "?" + this.obj2QueryStringEnc(param));
		form.setAttribute('style', "display=none");
		document.body.children[0].appendChild(form);
		var formAction = document.querySelector('form[target="'+'iframe_'+param.name+'"]');
		formAction.submit();
		formAction.remove();
		
	},
	"openPopupEdms": async function (popupId, param) {
		const width = edsIframeArrPopup[popupId].width;
		const height = edsIframeArrPopup[popupId].height;
		const url = param.url;

		const popup = document.createElement('div');
		popup.setAttribute('id', 'iframe_'+param.name);
		popup.setAttribute('style',
			'position:fixed;' +
			'z-index:999999;' +
			'width:100vw;' +
			'top:0;'+
			'height:100vh;'+
			'background-color: rgba(0, 0, 0, .5);'
		);

		const iframe = document.createElement('iframe');
		iframe.setAttribute('name', 'iframe_'+param.name);
		iframe.setAttribute('width', width);
		iframe.setAttribute('height', height);
		iframe.setAttribute('style',
			'position:absolute;' +
			'top:50%;' +
			'left:50%;' +
			'transform: translate(-50%, -50%);'
		);

		popup.appendChild(iframe);
		document.body.children[0].prepend(popup);

		const form = document.createElement('form');
		form.setAttribute('target', 'iframe_'+param.name);
		form.setAttribute('method', "post");
		form.setAttribute('action', url + "?" + this.obj2QueryStringEnc(param));
		form.setAttribute('style', "display=none");
		document.body.children[0].appendChild(form);

		var formAction = document.querySelector('form[target="'+'iframe_'+param.name+'"]');
		formAction.submit();
		formAction.remove();
		
	},

	"setParams": async function () {
		const searchParams = new URLSearchParams(decodeURI(location.search));
		for (const [key, value] of searchParams) {
			if(document.getElementById(key))
			document.getElementById(key).value = value;
		}
		
	},

	"closePopup": async function (param) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		// 적용 닫기]
		if (param !== undefined) await parent.popupHandler(param.name, 'close', param);
		parent.document.getElementById('iframe_'+param.name).remove();
	},

};