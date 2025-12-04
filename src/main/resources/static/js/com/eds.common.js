// $(function () {
// 	/** add active class and stay opened when selected */
// 	var url = window.location;
//
// 	// for sidebar menu entirely but not cover treeview
// 	$('ul.nav-sidebar a').filter(function() {
// 	    return this.href == url;
// 	}).addClass('active');
//
// 	// for treeview
// 	$('ul.nav-treeview a').filter(function() {
// 	    return this.href == url;
// 	}).parentsUntil(".nav-sidebar > .nav-treeview").addClass('menu-open').prev('a').addClass('active');
// });
var edsUtil = {
    /*
	* ajax 요청
	* @param
 	* @returns json
	* */
    "getAjax": function (url, param) {
        var data;
        $.ajax({
            url: url,
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify(param),
            success: function (result) {
                // console.log(result.ajax);
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                if (result.result==1) {
                    data = result.data;
                }
                else
                {
                    data = [];
                }
                
            }
        });
        return data;
    },
    "getAjax2": function (url, param) {
        var data;
        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify(param),
            success: function (result) {
                console.log('getAjax2 result first')
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                if (!result.IO.Result === 0) {
                    Swal.fire({
                        icon: 'error',
                        title: '조회실패',
                        text: result.IO.Message,
                    });
                    return false;
                }
                data = result;
            }
        });
        return data;
    },

    "postAjax": function (url, calendar, param) {

        if (param.status === 'd' && !param.carBookCd) { // 저장 하지 않은 데이터를 삭제를 하려 시도할 때,
            return Swal.fire({
                icon: 'error',
                title: '실패',
                text: '등록된 데이터만 삭제할 수 있습니다.',
                footer: ''
            });
        }

        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify(param),
            success: async function (rst) {
                var status = rst.status;
                var note = rst.note;
                var exc = rst.exc;
                if (status === 'success') {
                    // await doAction('gumaeGridEmail','search');
                    Swal.fire({
                        icon: 'success',
                        title: '성공',
                        text: note,
                        footer: exc
                    });
                    if (calendar.hasOwnProperty('container')) { // 캘린더
                        await doAction(calendar.container.id, 'search')
                    } else { // 그리드
                        var idNm = calendar.el.id.slice(0, -3); // div 삭제
                        await doAction(idNm, 'search')
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '실패',
                        text: note,
                        footer: exc
                    })
                }
            },
        });
    },

    /**
     * @param data group by 할 배열
     * @param key group by 할 기준
     * 자바스크립트 배열 그룹바이 함수
     * */
    "groupBy": function (data, key) {
        return data.reduce(function (carry, el) {
            var group = el[key];

            if (carry[group] === undefined) {
                carry[group] = []
            }

            carry[group].push(el)
            return carry
        }, {})
    },


    /*
	* ajax 요청
	* @param
 	* @returns json
	* */
    "Axios": async function (params) {
        var options = {
            method: params.method || 'post',
            url: params.url,
            data: params.data || {},
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }

        try {
            const result = await axios(options);
            return result.data;
        } catch (e) {
            console.log(e);
            return;
        }
    },
    /*
	* 날짜 가져오기
	* @param
 	* @returns String
	* getToday("%Y-%m-%d") -> 2020-11-01
	* getToday("%Y-%m-%d %H:%i:%s") -> 2020-11-01 11:11:11
	* */
    "getToday": function (param) {
        var today;
        var params = {
            param: param
        };

        $.ajax({
            url: "/eds/rain/com/getToday",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            type: "POST",
            async: false,
            data: params,
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                today = result;
            }
        });
        return today;
    },
    /**
     * 이번달 첫째날짜 가져오기
     * @param
     * @returns String
     * getFirstday() -> 2020-11-01
     * */
    "getFirstYear": function () {
        $.ajax({
            url: "/eds/rain/com/getFirstYear",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            type: "POST",
            async: false,
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                firstday = result;
            }
        });
        return firstday;
    },
    /**
     * 이번달 마지막날짜 가져오기
     * @param
     * @returns String
     * getFirstday() -> 2020-11-30
     * */
    "getLastYear": function () {
        $.ajax({
            url: "/eds/rain/com/getLastYear",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            type: "POST",
            async: false,
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                lastday = result;
            }
        });
        return lastday;
    },
    /*
	* 이번달 첫째날짜 가져오기
	* @param
 	* @returns String
	* getFirstday() -> 2020-11-01
	* */
    "getFirstday": function () {
        $.ajax({
            url: "/eds/rain/com/getFirstday",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            type: "POST",
            async: false,
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                firstday = result;
            }
        });
        return firstday;
    },
    /*
	* 이번달 마지막날짜 가져오기
	* @param
 	* @returns String
	* getFirstday() -> 2020-11-30
	* */
    "getLastday": function () {
        $.ajax({
            url: "/eds/rain/com/getLastday",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            type: "POST",
            async: false,
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                lastday = result;
            }
        });
        return lastday;
    },
    /*
	* 금액, 타입, 절삭금액 단위
	* @param
 	* @returns
	* aprice -> 금액
	* stype -> 원단위처리(R:반올림, C:올림, F:버림)
	* n -> 자릿수
	* */
    "priceCutting": function (aprice, stype, n) {
        var remove_price = 0;
        stype = stype ? stype : "R";
        remove_price = aprice / n;

        if (stype == "F") {
            remove_price = Math.floor(remove_price);
        } else if (stype == "R") {
            remove_price = Math.round(remove_price);
        } else if (stype == "C") {
            remove_price = Math.ceil(remove_price);
        }
//    remove_price = remove_price * n;
        return remove_price;
    },
    /*
	* 금액, 타입, 절삭금액 단위
	* @param
 	* @returns
	* aprice -> 금액
	* stype -> 원단위처리(R:반올림, C:올림, F:버림)
	* n -> 자릿수
	* */
    "delChemical": function (num, decimalPoint) {
        var len = 10;
        for (var i = 0; i < decimalPoint; i++) {
            len = len * 10
        }
        return Math.floor(num * len) / len;
    },
    /*
	* 날짜 - 추가
	* @param
 	* @returns String
	* */
    "addMinus": function (param) {
        if (!param) return "";
        var str = '';

        // 공백제거
        param = param.replace(/\s/gi, "");

        try {
            if (param.length == 8) {
                str = param.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            }
        } catch (e) {
            str = param;
            console.log(e);
        }
        return str;
    },
    /*
	* '-' 제거
	* @param
 	* @returns String
	* */
    "removeMinus": function (param) {
        return param.replace(/-/g, "");
    },
    /*
	* 천단위 ',' 추가
	* @param
 	* @returns String
	* */
    "addComma": function (param) {
        /*
		var len, point, str;

		if(!param){
			param = 0;
		}

		param = param + "";
		param = this.removeComma(param).trim();
		point = param.length % 3 ;
		len = param.length;

		str = param.substring(0, point);
		while (point < len) {
			if (str != "") str += ",";
			str += param.substring(point, point + 3);
			point += 3;
		}
		return str; // 양수 값은 옳바르게 콤마가 적용되지만 음수일 경우 -,100,000 현상 발생
		*/
        var str1 = param + ''; //Uncaught TypeError: Cannot read property 'toString' of undefined 처리
        var str2 = str1.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');//천단위 콤마 정규식
        return str2;
    },
    /*
	* 콤마 ',' 제거
	* @param
 	* @returns String
	* */
    "removeComma": function (param) {
        return param.replace(/,/g, "");
    },
    /*
	* 빈값 체크
	* @param
 	* @returns boolean
	* */
    "isNull": function (param) {
        if (new String(param).valueOf() == "undefined") return true;
        if (param == null) return true;
        var v_ChkStr = new String(param);
        if ("x" + param == "xNaN") return true;
        if (v_ChkStr.valueOf() == "undefined") return true;
        if (v_ChkStr.valueOf() == "none") return true;
        if (v_ChkStr == null) return true;
        if (v_ChkStr.toString().length == 0) return true;
        return false;
    },
    /*
	* 배열인지 체크
	* @param
 	* @returns boolean
	* */
    "isArray": function (param) {
        var bResult = false;
        if (param instanceof Array) {
            bResult = true;
        }
        return bResult;
    },
    /*
	* 스트링인지 체크
	* */
    "isString": function (param) {
        var bResult = false;
        if (param instanceof String || typeof param == 'string') {
            bResult = true;
        }
        return bResult;
    },
    /*
	* 숫자인지 체크
	* @param
 	* @returns boolean
	* */
    "isNumber": function (param) {
        var bResult = false;
        if (isNaN(param) == false) {
            bResult = true;
        }
        return bResult;
    },
    /*
	* 객체인지 체크
	* @param
 	* @returns boolean
	* */
    "isObject": function (param) {
        var bResult = false;
        if (typeof param == 'object') {
            bResult = true;
        }
        return bResult;
    },
    /*
	* 주민등록 번호 체크
	* @param
	* @returns boolean
	* */
    "isResiNo": function (value) {
        if (!value) {
            return false;
        }

        value = value.split("-").join("");

        if (value.length != 13) {
            return false;
        }

        var validDay = value.substr(0, 6);
        var validNo = value.substr(6);

        var validDigit = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
        var dayExpression = new RegExp(/^[0-9]{2}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[0-1])$/);
        var noExpression = new RegExp(/^[0-9]{7}$/);
        var foreignExpression = new RegExp(/^[5-8]{1}[0-9]{6}$/);

        if (!dayExpression.test(validDay)) {
            return false;
        }

        if (!noExpression.test(validNo)) {
            return false;
        }

        var sum = 0;
        for (var index = 0; index < 12; index++) {
            sum += parseInt(value.substr(index, 1)) * validDigit[index];
        }
        sum = (11 - (sum % 11)) % 10;

        if (foreignExpression.test(validNo)) {
            sum = (sum + 2) % 10;
        }

        if (sum == value.substr(12, 1)) {
            return true;
        } else {
            return false;
        }
    },
    /*
	* get submit param 가져오기
	* @param
	* @returns String
	* */
    "getParameter": function (param) {
        var returnValue;
        var url = location.href;
        var parameters = (url.slice(url.indexOf('?') + 1, url.length)).split('&');
        for (var i = 0; i < parameters.length; i++) {
            var varName = parameters[i].split('=')[0];
            if (varName.toUpperCase() == param.toUpperCase()) {
                returnValue = parameters[i].split('=')[1];
                if (returnValue == "null" || returnValue == "undefined") {
                    returnValue = '';
                }
                return decodeURIComponent(returnValue);
            }
        }
    },
    /*
	* form setting
	* formObj : querySelector
	* name : 변수 명
	* */
    "setForm": function (formObj, name) {

        var selectOne = eds[name];

        try {
            if (formObj.tagName && formObj.tagName.toUpperCase() == "FORM") {
                for (var i = 0; i < formObj.elements.length; i++) {
                    switch (formObj.elements[i].type) {
                        case undefined:
                        case "button":
                            break;
                        case "reset":
                            break;
                        case "submit":
                            break;
                        case "radio":
                            break;
                        case "checkbox":
                            break;
                        case "select-one": //단일 선택 select
                            if (this.getName(formObj.elements[i]) == "corpCd") {	// 회사코드

                                var corpCd
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_CORP_REG/selectCorpList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,	//동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        corpCd = result.data;
                                    }
                                });

                                for (var k = 0; k < corpCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = corpCd[k].corpCd;
                                    option.text = corpCd[k].corpNm;
                                    formObj.elements[i].add(option);
                                }

                            } else if (this.getName(formObj.elements[i]) == "busiCd") {	// 사업장
                                var busiCd
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_BUSI_REG/selectBusiList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,	//동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        busiCd = result.data;
                                    }
                                });
                                /* 초기값 */
                                var option = document.createElement("option");
                                option.value = '';
                                option.text = '사업장 선택';
                                formObj.elements[i].add(option);
                                for (var k = 0; k < busiCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = busiCd[k].busiCd;
                                    option.text = busiCd[k].busiNm;
                                    formObj.elements[i].add(option);
                                }
                            } else if (this.getName(formObj.elements[i]) == "depaCd") {	// 부서
                                var depaCd
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_DEPA_REG/selectDepaList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,	//동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        depaCd = result.data;
                                    }
                                });

                                /* 초기값 */
                                var option = document.createElement("option");
                                option.value = '';
                                option.text = '부서 전체';
                                formObj.elements[i].add(option);

                                /* 나머지값 */
                                for (var k = 0; k < depaCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = depaCd[k].depaCd;
                                    option.text = depaCd[k].depaNm;
                                    formObj.elements[i].add(option);
                                }

                            } else if (this.getName(formObj.elements[i]) == ("empCd")) {    // 사원

                                var empCd;
                                var param = {};
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_USER_MGT_LIST/selectUserMgtList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,    //동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        empCd = result.data;
                                    }
                                });

                                /* 초기값 */
                                var option = document.createElement("option");
                                option.value = '';
                                option.text = '사원 전체';
                                formObj.elements[i].add(option);

                                /* 나머지값 */
                                for (var k = 0; k < empCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = empCd[k].empCd;
                                    option.text = empCd[k].empNm + ' ' + empCd[k].depaNm;
                                    formObj.elements[i].add(option);
                                }

                            } else if (this.getName(formObj.elements[i]) == ("empCd")) {    // 처리상태: procStat

                                for (var j = 0; j < selectOne.Select.length; j++) {
                                    if (selectOne.Select[j].target === this.getName(formObj.elements[i])) {
                                        if (selectOne.Select[j].head) {
                                            var option = document.createElement("option");
                                            option.value = "";
                                            option.text = "처리상태";
                                            formObj.elements[i].add(option);
                                        }

                                        var commonCode = _commonCode[selectOne.Select[j].commCd];
                                        if (typeof commonCode == "string") {
                                            commonCode = JSON.parse(_commonCode[selectOne.Select[j].commCd]);
                                        }

                                        for (var k = 0; k < commonCode.length; k++) {
                                            var option = document.createElement("option");
                                            option.value = Object.keys(commonCode[k])[0].toString();
                                            option.text = Object.values(commonCode[k])[0].toString();
                                            formObj.elements[i].add(option);
                                        }
                                    }
                                }

                            } else if (this.getName(formObj.elements[i]) == ("empCd")) {    // 위험수준: riskLevel

                                for (var j = 0; j < selectOne.Select.length; j++) {
                                    if (selectOne.Select[j].target === this.getName(formObj.elements[i])) {
                                        if (selectOne.Select[j].head) {
                                            var option = document.createElement("option");
                                            option.value = "";
                                            option.text = "위험수준";
                                            formObj.elements[i].add(option);
                                        }

                                        var commonCode = _commonCode[selectOne.Select[j].commCd];
                                        if (typeof commonCode == "string") {
                                            commonCode = JSON.parse(_commonCode[selectOne.Select[j].commCd]);
                                        }

                                        for (var k = 0; k < commonCode.length; k++) {
                                            var option = document.createElement("option");
                                            option.value = Object.keys(commonCode[k])[0].toString();
                                            option.text = Object.values(commonCode[k])[0].toString();
                                            formObj.elements[i].add(option);
                                        }
                                    }
                                }

                            } else if (this.getName(formObj.elements[i]) == "carCd") {    // 차량
                                var carCd;
                                var param = {};
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_CAR_MGT_LIST/selectCarMgtList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify(param),
                                    dataType: 'json',
                                    async: false,    //동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        carCd = result.data;
                                    }
                                });

                                /* 초기값 */
                                var option = document.createElement("option");
                                option.value = '';
                                option.text = '차량 전체';
                                formObj.elements[i].add(option);

                                /* 나머지값 */
                                for (var k = 0; k < carCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = carCd[k].carCd;
                                    option.text = carCd[k].carNm + ' ' + carCd[k].carNo;
                                    formObj.elements[i].add(option);
                                }

                            } else {
                                for (var j = 0; j < selectOne.Select.length; j++) {
                                    if (selectOne.Select[j].target === this.getName(formObj.elements[i])) {
                                        if (selectOne.Select[j].head) {
                                            var option = document.createElement("option");
                                            option.value = "";
                                            option.text = "전체";
                                            formObj.elements[i].add(option);
                                        }

                                        var commonCode = _commonCode[selectOne.Select[j].commCd];
                                        if (typeof commonCode == "string") {
                                            commonCode = JSON.parse(_commonCode[selectOne.Select[j].commCd]);
                                        }

                                        for (var k = 0; k < commonCode.length; k++) {
                                            var option = document.createElement("option");
                                            option.value = Object.keys(commonCode[k])[0].toString();
                                            option.text = Object.values(commonCode[k])[0].toString();
                                            formObj.elements[i].add(option);
                                        }
                                    }
                                }
                            }
                            break;
                        case "select-multiple":
                            if (this.getName(formObj.elements[i]) == "corpCd") {	// 회사코드

                                var corpCd
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_CORP_REG/selectCorpList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,	//동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        corpCd = result.data;
                                    }
                                });

                                for (var k = 0; k < corpCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = corpCd[k].corpCd;
                                    option.text = corpCd[k].corpNm;
                                    formObj.elements[i].add(option);
                                }

                            } else if (this.getName(formObj.elements[i]) == "busiCd") {	// 사업장
                                var busiCd
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_BUSI_REG/selectBusiList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,	//동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        busiCd = result.data;
                                    }
                                });

                                for (var k = 0; k < busiCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = busiCd[k].busiCd;
                                    option.text = busiCd[k].busiNm;
                                    formObj.elements[i].add(option);
                                }
                            } else if (this.getName(formObj.elements[i]) == "depaCd") {	// 부서
                                var depaCd
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_DEPA_REG/selectDepaList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,	//동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        depaCd = result.data;
                                    }
                                });

                                for (var k = 0; k < depaCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = depaCd[k].depaCd;
                                    option.text = depaCd[k].depaNm;
                                    formObj.elements[i].add(option);
                                }
                            } else if (this.getName(formObj.elements[i]) == ("empCd") || this.getName(formObj.elements[i]) == ("ccUsers") || this.getName(formObj.elements[i]) == ("appUsers")) {	// 부서
                                var empCd
                                $.ajax({
                                    type: "POST",
                                    url: "/BASE_USER_MGT_LIST/selectUserMgtList",
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    data: JSON.stringify({useYn: "01"}),
                                    dataType: 'json',
                                    async: false,	//동기방식으로 전송
                                    contentType: 'application/json;charset=UTF-8',
                                    success: function (result) {
                                        if (!result.sess && typeof result.sess != "undefined") {
                                            alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                            return;
                                        }
                                        empCd = result.data;
                                    }
                                });

                                for (var k = 0; k < empCd.length; k++) {
                                    var option = document.createElement("option");
                                    option.value = empCd[k].empCd;
                                    option.text = empCd[k].empNm;
                                    formObj.elements[i].add(option);
                                }
                            } else {
                                for (var j = 0; j < selectOne.Select.length; j++) {
                                    if (selectOne.Select[j].target === this.getName(formObj.elements[i])) {
                                        if (selectOne.Select[j].head) {
                                            var option = document.createElement("option");
                                            option.value = "";
                                            option.text = "전체";
                                            formObj.elements[i].add(option);
                                        }

                                        var commonCode = _commonCode[selectOne.Select[j].commCd];
                                        if (typeof commonCode == "string") {
                                            commonCode = JSON.parse(_commonCode[selectOne.Select[j].commCd]);
                                        }

                                        for (var k = 0; k < commonCode.length; k++) {
                                            var option = document.createElement("option");
                                            option.value = Object.keys(commonCode[k])[0].toString();
                                            option.text = Object.values(commonCode[k])[0].toString();
                                            formObj.elements[i].add(option);
                                        }
                                    }
                                }
                            }
                            break;
                        case "date":
                            if (this.getName(formObj.elements[i]) == "stDt") {	// 시작일
                                formObj.elements[i].value = this.getFirstday();
                            } else if (this.getName(formObj.elements[i]) == "edDt") {	// 종료일
                                formObj.elements[i].value = this.getLastday();
                            }

                            break;
                        default:
                    }
                }
            }
        } catch (e) {
            alert(e.message);
        } finally {
        }
    },
    /*
	* form setting
	* formObj : querySelector
	* name : 변수 명
	* */

    "setButtonForm": async function (formObj) {
        var params = JSON.parse(sessionStorage.getItem('objmenulist'));
        var objmenu;
        var url = window.location.pathname;

        for (var i = 0; i < params.length; i++) {
            if (params[i].pgmUrl === url) {
                objmenu = params[i];
            }
        }

        try {
            if (formObj.tagName && formObj.tagName.toUpperCase() == "FORM") {
                for (var i = 0; i < formObj.elements.length; i++) {
                    switch (formObj.elements[i].type) {
                        case undefined:
                            break;
                        case "button":
                            if (this.getName(formObj.elements[i]).indexOf("Search") != -1) {	// Search
                                if (objmenu.readAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("Input") != -1) {	// Input
                                if (objmenu.addAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("Save") != -1) {	// Save
                                if (objmenu.updAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("Delete") != -1) {	// Delete
                                if (objmenu.delAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("Excel") != -1) {	// Excel
                                if (objmenu.excelDownAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("Print") != -1) {	// print
                                if (objmenu.printAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("EmailPopup") != -1) {	// emailPopup
                                if (objmenu.emailPopupAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("Finish") != -1) {	// finish
                                if (objmenu.finishAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            if (this.getName(formObj.elements[i]).indexOf("Cancel") != -1) {	// cancel
                                if (objmenu.cancelAuth == 1) {
                                    formObj.elements[i].style.display = "inline";
                                    // formObj.elements[i].disabled = false;
                                } else {
                                    formObj.elements[i].style.display = "none";
                                    // formObj.elements[i].disabled = true;
                                }
                            }
                            break;
                        case "reset":
                            break;
                        case "submit":
                            break;
                        case "radio":
                            break;
                        case "checkbox":
                            break;
                        case "select-one":
                            break;
                        case "select-multiple":
                            break;
                        default:
                    }
                }
            }
        } catch (e) {
            alert(e.message);
        } finally {
        }
    },
    //elements 의 name이나 id를 얻어옴.
    "getName": function (element) {
        return element.name || element.id || "";
    },
    //동일한 이름의 element가 여러개 인경우 배열화 하자
    "setObject": function (obj, name, value) {
        if (obj[name]) {
            if (typeof (obj[name]) == "object") {
                obj[name].push(value);
            } else {
                obj[name] = [value];
            }
        } else {
            obj[name] = value;
        }
    },
    "sample6_execDaumPostcode": function (formObj) {
        new daum.Postcode({
            oncomplete: function (data) {
                // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

                // 각 주소의 노출 규칙에 따라 주소를 조합한다.
                // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
                var addr = ''; // 주소 변수
                var extraAddr = ''; // 참고항목 변수

                //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
                if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                    addr = data.roadAddress;
                } else { // 사용자가 지번 주소를 선택했을 경우(J)
                    addr = data.jibunAddress;
                }

                // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
                if (data.userSelectedType === 'R') {
                    // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                    // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                        extraAddr += data.bname;
                    }
                    // 건물명이 있고, 공동주택일 경우 추가한다.
                    if (data.buildingName !== '' && data.apartment === 'Y') {
                        extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }
                    // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                    if (extraAddr !== '') {
                        extraAddr = ' (' + extraAddr + ')';
                    }
                    // 조합된 참고항목을 해당 필드에 넣는다.
                    // document.getElementById("sample6_extraAddress").value = extraAddr;

                } else {
                    // document.getElementById("sample6_extraAddress").value = '';
                }

                // 우편번호와 주소 정보를 해당 필드에 넣는다.
                // document.getElementById('sample6_postcode').value = data.zonecode;
                // document.getElementById("sample6_address").value = addr;
                // 커서를 상세주소 필드로 이동한다.
                // document.getElementById("sample6_detailAddress").focus();
                var foObj;
                if (formObj.tagName && formObj.tagName.toUpperCase() == "FORM") {
                    for (var i = 0; i < formObj.elements.length; i++) {
                        switch (formObj.elements[i].type) {
                            case "text":
                                if (formObj.elements[i].id == "zipNo") {
                                    formObj.elements[i].value = data.zonecode;
                                } else if (formObj.elements[i].id == "addr") {
                                    formObj.elements[i].value = addr + " " + extraAddr;
                                } else if (formObj.elements[i].id == "addrDetail") {
                                    foObj = formObj.elements[i];
                                }
                                break;
                        }
                    }
                }
                foObj.focus();
            }
        }).open();
    },
    /*
        * form setting
        * formObj : querySelector
        * name : 변수 명
        * */
    "getAuth": function (Auth) {

        var params = JSON.parse(sessionStorage.getItem('objmenulist'));
        var objmenu;
        var url = window.location.pathname;

        for (var i = 0; i < params.length; i++) {
            if (params[i].pgmUrl == url) {
                objmenu = params[i];
            }
        }

        if (Auth == "Search") {
            return objmenu.readAuth;
        } else if (Auth == "Input") {
            return objmenu.addAuth;
        } else if (Auth == "Save") {
            return objmenu.updAuth;
        } else if (Auth == "Delete") {
            return objmenu.delAuth;
        } else if (Auth == "Excel") {
            return objmenu.excelDownAuth;
        } else if (Auth == "Print") {
            return objmenu.printAuth;
        } else if (Auth == "Finish") {
            return objmenu.finishAuth;
        } else if (Auth == "Cancel") {
            return objmenu.cancelAuth;
        } else if (Auth == "EmailPopup") {
            return objmenu.emailPopupAuth;
        }
    },
    /*
	* 그리드 데이터 추가 및 저장
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* */
    "doCUD": async function (url, sheetName, sheetObj) {

        var rowKey = await sheetObj.getFocusedCell();
        sheetObj.finishEditing(rowKey);

        var param = new Array();
        var rows = await sheetObj.getModifiedRows();	//	createdRows:신규, updatedRows, 수정

        if (rows.createdRows.length == 0 &&
            rows.updatedRows.length == 0 &&
            rows.deletedRows.length == 0) {
            Swal.fire({
                icon: 'error',
                title: '실패',
                text: "저장할 내용이 없습니다.",
            });
            return;
        }

        // 유효성 검사
        var validate = await sheetObj.validate();
        for (var i = 0; i < validate.length; i++) {
            if (validate[i].errors.length != 0) {
                for (var r = 0; r < validate[i].errors.length; r++) {
                    if (validate[i].errors[r].errorCode == "REQUIRED") {
                        await sheetObj.focus(validate[i].rowKey, validate[i].errors[r].columnName); // 빈 필수 값 포커스
                        alert('필수값을 입력해 주세요.')
                        return;
                    }
                }
            }
        }

        if (rows.createdRows.length > 0) {
            for (var i = 0; i < rows.createdRows.length; i++) {
                rows.createdRows[i].status = 'C';
                param.push(rows.createdRows[i]);
            }
        }

        if (rows.updatedRows.length > 0) {
            for (var i = 0; i < rows.updatedRows.length; i++) {
                rows.updatedRows[i].status = 'U';
                param.push(rows.updatedRows[i]);
            }
        }

        if (rows.deletedRows.length > 0) {
            for (var i = 0; i < rows.deletedRows.length; i++) {
                rows.deletedRows[i].status = 'D';
                param.push(rows.deletedRows[i]);
            }
        }

        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify({data: param}),
            success: async function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }

                if (result.IO.Result == 0 || result.IO.Result == 1) {
                    Swal.fire({
                        icon: 'success',
                        title: '성공',
                        text: result.IO.Message,
                    });
                    await doAction(sheetName, "search");
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '실패',
                        text: result.IO.Message,
                    });
                }
            }
        });
    },
    /*
	* 그리드 데이터 추가 및 저장
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* */
    "doApply": async function (url, params) {

        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify({data: params}),
            success: async function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }

                if (result.IO.Result == 0 || result.IO.Result == 1) {
                    Swal.fire({
                        icon: 'success',
                        title: '성공',
                        text: result.IO.Message,
                    });
                    console.log(result);
                    await doAction(sheetName, "search");
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '실패',
                        text: result.IO.Message,
                    });
                }
            }
        });
    },

    /*
	* 그리드 데이터 삭제
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* */
    "doDel": function (sheetObj) {
        var data = new Array();
        var rows = sheetObj.getCheckedRows();
        if (rows.length > 0) {
            if (confirm("선택된 내역을 삭제하시겠습니까?")) {
                for (var i = 0; i < rows.length; i++) {
                    sheetObj.removeRow(rows[i].rowKey)
                }
            }
        } else {
            toastrmessage("toast-bottom-center", "warning", "삭제할 내역을 선택해 주세요.", "경고", 1500);
        }
    },

    /*
	* 그리드 데이터 삭제
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* */
    "doDel2": function (url, sheetName, sheetObj) {
        var data = new Array();
        var rows = sheetObj.getCheckedRows();
        if (rows.length > 0) {
            if (confirm("선택된 내역을 삭제하시겠습니까?")) {
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].sStatus == "I") {
                        // sheetObj.removeRow(rows[i].rowKey);
                    } else {
                        sheetObj.removeRow(rows[i].rowKey);
                        rows[i]["sStatus"] = "D";
                        data.push(rows[i]);
                    }
                }
                if (data.length > 0) {
                    $.ajax({
                        url: url,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        dataType: "json",
                        contentType: "application/json; charset=UTF-8",
                        type: "POST",
                        async: false,
                        data: JSON.stringify({data: data}),
                        success: function (result) {
                            if (!result.sess && typeof result.sess != "undefined") {
                                alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                                return;
                            }

                            if (result.IO.Result == 0) {
                                toastrmessage("toast-bottom-center", "success", result.IO.Message, "성공", 1500);
                                // doAction(sheetName, "search");
                            } else {
                                toastrmessage("toast-bottom-center", "error", result.IO.Message, "실패", 1500);
                            }
                        }
                    });
                }
            }
        } else {
            toastrmessage("toast-bottom-center", "warning", "삭제할 내역을 선택해 주세요.", "경고", 1500);
        }
    },
    /*
	* Sheet -> FORM copy
	*  */
    "eds_CopySheet2Form": function (param) {
        var sheetObj,
            formObj,
            rowKey,
            column,
            columns,
            sValue
        ;

        if (param.form == null || typeof param.form != "object" || param.form.tagName != "FORM") {
            alert("eds_CopyForm2Sheet 함수의 form 인자는 FORM 태그가 아닙니다.");
            return "";
        }

        sheetObj = param.sheet;
        formObj = param.form;
        rowKey = param.rowKey;

        for (var i = 0; i < formObj.elements.length; i++) {

            // input check
            if (!formObj.elements[i].hasOwnProperty('value')) formObj.elements[i].value = '';
            else formObj.elements[i].value = '';

            column = this.getName(formObj.elements[i]);
            sValue = sheetObj.getValue(rowKey, column);

            if (sValue || sValue === 0) {
                if (column == "openDt"
                    || column == "clupDt"
                    || column == "stDt"
                    || column == "edDt"
                    || column == "biryrMd"
                    || column == "ecoDt"
                    || column == "rcoDt"
                    || column == "validStDt"
                    || column == "validEdDt") {
                    if (!sValue.includes('-')) {
                        sValue = this.addMinus(sValue);
                    } else {

                    }
                }
                if (column == "supAmt"
                    || column == "vatAmt"
                    || column == "totAmt"
                    || column == "supAmt2"
                    || column == "vatAmt2"
                    || column == "totAmt2"
                    || column == "supAmt3"
                    || column == "vatAmt3"
                    || column == "totAmt3"
                    || column == "supAmt4"
                    || column == "vatAmt4"
                    || column == "totAmt4"
                    || column == "supAmt5"
                    || column == "vatAmt5"
                    || column == "totAmt5"
                    || column == "salTotAmt"
                    || column == "costTotAmt"
                    || column == "profitAmt") {
                    sValue = this.addComma(sValue);
                }

                switch (formObj.elements[i].type) {
                    case undefined:
                    case "button":
                    case "reset":
                    case "submit":
                        break;
                    case "radio":
                        break;
                    case "checkbox":
                        formObj.elements[i].checked = sValue;
                        break;
                    default:
                        formObj.elements[i].value = sValue;
                        break;
                }
            }
        }
    },
    /*
	* FORM -> Sheet copy
	*  */
    "eds_CopyForm2Sheet": function (param) {
        var sheetObj,
            formObj,
            rowKey,
            column,
            sValue
        ;

        if (param.form == null || typeof param.form != "object" || param.form.tagName != "FORM") {
            alert("eds_CopyForm2Sheet 함수의 form 인자는 FORM 태그가 아닙니다.");
            return "";
        }

        sheetObj = param.sheet;
        formObj = param.form;
        rowKey = param.rowKey;

        for (var i = 0; i < formObj.elements.length; i++) {
            column = this.getName(formObj.elements[i]);
            switch (formObj.elements[i].type) {
                case undefined:
                case "button":
                case "reset":
                case "submit":
                    break;
                case "radio":
                    break;
                case "checkbox":
                    sValue = (formObj.elements[i].checked) ? 1 : 0;
                    break;
                default:
                    sValue = formObj.elements[i].value;

            }
            sheetObj.setValue(rowKey, column, sValue);
        }
    },
    /*
	* form Change Event setting
	* formObj :
	* callback : callback 함수
	* */
    "addChangeEvent": function (formObj, callback) {
        $("#" + formObj + " input," + " #" + formObj + " select," + " #" + formObj + " textarea").change(function () {
            callback();
        });
    },
    /*
	* grid Summary Setting
	* sheetObj : sheet obj
	* columnName : column name
	* */
    "gridSummary": function (sheetObj, columnName) {
        var rows = sheetObj.getData()
        var supAmt = 0;
        var tax = 0;
        var totAmt = 0;
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].corpCd != null)
                if (columnName == "supAmt") {
                    supAmt += Number(rows[i].supAmt);
                } else if (columnName == "supAmt2") {
                    supAmt += Number(rows[i].supAmt2);
                } else if (columnName == "tax") {
                    tax += Number(rows[i].tax);
                } else if (columnName == "tax2") {
                    tax += Number(rows[i].tax2);
                } else if (columnName == "totAmt") {
                    totAmt += Number(rows[i].totAmt);
                } else if (columnName == "totAmt2") {
                    totAmt += Number(rows[i].totAmt2);
                } else {
                }
        }
        return edsUtil.addComma(supAmt + tax + totAmt);
    },
    /*set closed row
	* masterSheetObj : master sheet obj
	* subSheetObj : sub sheet obj
	* */
    "setClosedRow": function (masterSheetObj, subSheetObj) {
        if (masterSheetObj) {// 마스터 시트 마감 처리
            var rows = masterSheetObj.getData();
            for (var i = 0; i < rows.length; i++) {
                if (rows[i].deadDivi == 1) {
                    masterSheetObj.disableRow(rows[i].rowKey, false);
                }
            }
        }
        if (subSheetObj) {// 서브 시트 마감 처리
            var row = masterSheetObj.getFocusedCell();
            var rows = subSheetObj.getData();
            for (var i = 0; i < rows.length; i++) {
                if (masterSheetObj.getValue(row.rowKey, "deadDivi") == 1) {
                    subSheetObj.disableRow(rows[i].rowKey, false);
                }
            }
        }
    },
    /*
	* row selection
	* sheetObj: sheet opj
	* */
    "rowSelection": function (sheetObj, targetType) {
        var row = sheetObj.getFocusedCell();
        if (targetType == 'cell') {
            if (sheetObj.getValue(row.rowKey, "corpCd") == null) {
                sheetObj.setSelectionRange({
                    start: [row.rowKey, 0],
                    end: [row.rowKey, sheetObj.getColumns().length]
                });
            } else {
                if (sheetObj.getColumns()[0].name.slice(-2) == "Dt") {
                    sheetObj.setSelectionRange({
                        start: [row.rowKey, 1],
                        end: [row.rowKey, sheetObj.getColumns().length]
                    });
                } else {
                    sheetObj.setSelectionRange({
                        start: [row.rowKey, 0],
                        end: [row.rowKey, sheetObj.getColumns().length]
                    });
                }
            }
        }
    },
    /*
	* apply subTotal css
	* sheetObj: sheet opj
	* url, param
	* */
    "subTotalCss": function (sheetObj) {
        var subData = sheetObj.getData();
        var subCol = sheetObj.getColumns();
        for (var i = 0; i < subData.length; i++) {
            if (subData[i].corpCd == null) {
                for (var j = 0; j < subCol.length; j++) {
                    sheetObj.addCellClassName(i, subCol[j].name, 'subTotal')
                }
            }
        }
    },
    /*
	* "-" add
	* param: phoneno, telno, faxno
	* */
    "addMinusTel": function (param) {
        if (!param) return "";
        var str = '';

        // 공백제거
        param = param.replace(/\s/gi, "");

        try {
            if (param.length == 8) {
                str = param.replace(/[^0-9]/g, "").replace(/(^[0-9]{4})([0-9]+)$/, "$1-$2").replace("--", "-");
            } else {
                str = param.replace(/[^0-9]/g, "").replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3").replace("--", "-");
            }

        } catch (e) {
            str = param;
            console.log(e);
        }
        return str;
    },
    /*
	* Capitalize First Character
	* param: English Character
	* */
    "capitalize": function (param) {
        if (!param) return "";
        return param.replace(/\b[a-z]/, letter => letter.toUpperCase());
    },
    /*
	* Interval Grid Focus(TUI)
	* sheetObj:	sheet object
	* colNm:	columns Name
	* time:		interval time
	* */
    "intervalGridFocus": function (sheetObj, colNm, time) {
        //루프 변수
        let preRowsCnt = 0;
        let preRowKey = 0;
        setInterval(function () {
            if (sheetObj.getRowCount() > 0) {
                doAction(sheetObj.el.id.slice(0, -3), "search");
                var rowCnt = sheetObj.getData().length
                //	초기 preRowsCnt 값 설정
                if (preRowKey == null && preRowsCnt == null) {
                    preRowsCnt = rowCnt;
                }

                if (preRowKey < rowCnt - 1) {
                    preRowKey += 1;
                    sheetObj.focus(preRowKey, colNm);
                } else {
                    sheetObj.focus(0, colNm);
                    preRowKey = 0;
                }
            }
        }, time);
    },
    /*
	* floor 10^-dp
	* param: double data
	* dp : decimal places
	* event(10,2) => 10
	* event(10.1,2) => 10.1
	* event(10.11,2) => 10.11
	* event(10.112342...n,2) => 10.11
	* */
    "decimalHandling": function (param, dp) {
        if (param > 0) {
            var x = 10;
            for (var i = 0; i < dp - 1; i++) {
                x = x * 10
            }
            return Math.floor(param * x) / x;
        } else {
            return param;
        }
    },
    /*
	* get default cust
	* param: Array
	* */
    "getDefaultCust": function () {
        var cust;
        $.ajax({
            url: "/eds/rain/com/getDefaultCust",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            type: "POST",
            async: false,
            data: JSON.stringify({data: ''}),
            contentType: 'application/json',
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                cust = result;
            }
        });
        return cust;
    },

    /*
	* 영업장 코드 값 가져오기
	* @param
 	* @returns String
	* getFirstday() -> 2020-11-30
	* */
    "getTradCd": function (param) {
        $.ajax({
            url: "/eds/rain/com/getTradCd",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify(param),
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                tradCd = result;
            }
        });
        return tradCd;
    },

    /*
	* 특수문자 제거
	* @param
	* @returns ""
	* */
    "regExp": function regExp(param) {
        var reg = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
        //특수문자 검증
        if (reg.test(param)) {
            //특수문자 제거후 리턴
            return param.replace(reg, "");
        } else {
            //특수문자가 없으므로 본래 문자 리턴
            return param;
        }
    },

    /*
	* json to excel download
	* @param : String fileName
	* @param : String sheetName
	* @param : JSON excelData
	* */
    "json2excel": function json2excel(fileName, sheetName, excelData) {

        function s2ab(s) {
            var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
            var view = new Uint8Array(buf);  //create uint8array as viewer
            for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
            return buf;
        }

        var excelHandler = {
            getExcelFileName: function () {
                // return 'aoa-test.xlsx';
                return fileName + '.xlsx';
            },
            getSheetName: function () {
                // return 'AOA Test Sheet';
                return sheetName;
            },
            getExcelData: function () {
                // return [['이름' , '나이', '부서'],['도사원' , '21', '인사팀'],['김부장' , '27', '비서실'],['엄전무' , '45', '기획실']];
                return excelData;
            },
            getWorksheet: function () {
                return XLSX.utils.json_to_sheet(this.getExcelData());
            }
        }

        // step 1. workbook 생성
        var wb = XLSX.utils.book_new();

        // step 2. 시트 만들기
        var newWorksheet = excelHandler.getWorksheet();

        // step 3. workbook에 새로만든 워크시트에 이름을 주고 붙인다.
        XLSX.utils.book_append_sheet(wb, newWorksheet, excelHandler.getSheetName());

        // step 4. 엑셀 파일 만들기
        var wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});

        // step 5. 엑셀 파일 내보내기
        saveAs(new Blob([s2ab(wbout)], {type: "application/octet-stream"}), excelHandler.getExcelFileName());
    },

    /**
     * replace all
     * @param : String str
     * @param : String before
     * @param : String after
     * */
    "replaceAll": function replaceAll(str, before, after) {
        return str.split(before).join(after);
    },

    /**
     * replace all
     * @param : String str
     * @param : String before
     * @param : String after
     * */
    "choHangul": function choHangul(str) {/* 초성추출 */
        var cho = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
        var result = "";
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i) - 44032;
            if (code > -1 && code < 11172) result += cho[Math.floor(code / 588)];
        }
        return result;
    },

    /**
     * 몬트락 창고 값 가져오기
     * @param
     * @returns String
     * getFirstday() -> 2020-11-30
     * */
    "getStorCdNm": function (corpCd, busiCd) {

        var storCdNm;
        var param = {
            corpCd: corpCd,
            busiCd: busiCd
        };

        $.ajax({
            url: "/eds/erp/com/getStorCdNm",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify(param),
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                custCdNm = result;
            }
        });
        return custCdNm;
    },

    /**
     * 기준일자 포함하여 일자 더하기
     * @param
     *    string dt = '2000-01-01'
     *    int num = '39'
     * @returns String
     * getFirstday('39') -> '2000-02-08'
     * */
    "addFormatDate": function (dt, num) {
        var toDt = new Date(dt);
        var addDate = new Date(toDt);
        addDate.setDate(toDt.getDate() + parseInt(num));
        return addDate.toISOString().slice(0, 10);
    },

    /**
     * 기준일자 포함하여 일자 빼기
     * @param
     *    string dt = '1999.11.24'
     *    int num = '39'
     * @returns String
     * getFirstday('39') -> '2000-01-01'
     * */
    "minusFormatDate": function (dt, num) {
        var toDt = new Date(dt);
        var minusDate = new Date(toDt);
        minusDate.setDate(toDt.getDate() - parseInt(num));
        return minusDate.toISOString().slice(0, 10);
    },

    /**
     * 기준일자 포함하여 일자 빼기
     * @param
     *    obj = [{},{},{}...]
     * */
    "cloneObj": function (obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * 객체 중 특정 Key의 최댓값인 Row 반환
     * @param
     *    arr = [{},{},{}...]
     *    prop = object Key of maximum value desired by user
     * */
    "getMaxObject": function (arr, prop) {
        var max;
        for (var i = 0; i < arr.length; i++) {
            if (!max || parseInt(arr[i][prop]) > parseInt(max[prop]))
                max = arr[i];
        }
        return max;
    },

    /**
     * 행에 색깔 입히기
     * @param
     *    sheet = tui-gridSheet
     * */
    "setColorForApplyYn": function (sheet, applyYn, color) {

        var data = sheet.getFilteredData();// 소계 css 적용할 data
        var dataLen = data.length;
        var colNm = sheet.getColumns();// 소계 css 적용할 columns name
        for (var i = 0; i < dataLen; i++) {
            if (data[i].applyYn == applyYn) {
                for (var j = 0; j < colNm.length; j++) {
                    sheet.addCellClassName(data[i].rowKey, colNm[j].name, color)
                }
            }
        }
    },

    /**
     * 행에 색깔 입히기
     * sheet = tui-gridSheet
     * @param sheet
     * */
    "setColorForSelectedRow": async function (sheet) {
        sheet.on('focusChange', async ev => {
            if (ev.rowKey !== ev.prevRowKey) {
                sheet.removeRowClassName(ev.prevRowKey, 'selected')
                sheet.addRowClassName(ev.rowKey, 'selected')
            }
        });
    },

    /**
     * 사업자등록번호, 법인등록번호 포멧 추가
     * @param num = corperation number
     * @param type = num length
     * */
    "corpNoFormatter": function (num, type) {
        var formatNum = '';
        try {
            if (num.length == 10) {
                if (type == 0) {
                    formatNum = num.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-*****');
                } else {
                    formatNum = num.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
                }
            }
        } catch (e) {
            formatNum = num;
            console.log(e);
        }
        return formatNum;
    },

    /**
     * 전화번호 포멧 추가
     * @param no = telephone number
     * */
    "telNoFormatter": function (no) {
        var formatNo = '';
        try {
            if (no.length) {
                formatNo = no.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3").replace("--", "-");
            } else {

            }
        } catch (e) {
            formatNo = no;
            console.log(e);
        }
        return formatNo;
    },

    /**
     * 로딩 마스크 열기
     * @param git = /.../.../image path
     * */
    "LoadingWithMask": function () {
        if ($('#mask') && $('#loadingImg')) {
            $('#mask').hide();
            $('#loadingImg').hide();
        }
        //화면의 높이와 너비를 구합니다.
        // var maskHeight = $(document).height();
        var maskHeight = window.document.body.clientHeight;
        var maskWidth = window.document.body.clientWidth;

        //화면에 출력할 마스크를 설정해줍니다.
        var mask = "<div id='mask' style='position:absolute; z-index:9000; background-color:#000000; display:none; left:0; top:0;'></div>";
        var loadingImg = '';

        loadingImg += "<div id='loadingImg'>";
        loadingImg += " <img id='loadingImgObj' src='" + '/AdminLTE_main/dist/img/loadingMask.gif' + "' style='position: absolute;\n" +
            "    z-index: 10000;\n" +
            "    bottom: 50%;\n" +
            "    left: 43%;'/>";
        loadingImg += "</div>";

        //화면에 레이어 추가
        $('body')
            .append(mask)
            .append(loadingImg)

        //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채움.
        $('#mask').css({
            'width': maskWidth
            , 'height': maskHeight
            , 'opacity': '0.3'
        });

        //마스크, 로딩중 이미지 표시
        $('#mask, #loadingImg').fadeIn(500);
    },

    /**
     * 로딩 마스크 닫기
     * */
    "closeLoadingWithMask": function () {
        $('#mask, #loadingImg').fadeOut(500);
        $('#mask, #loadingImg').empty();
    },

    /**
     * 밀리세컨드 날짜 가져오기
     * @param
     * @returns String
     **/
    "getSmart1stAvenueToday": function () {
        var today;
        $.ajax({
            url: "/eds/erp/com/getSmart1stAvenueToday",
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            type: "POST",
            async: false,
            success: function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                today = result;
            }
        });
        return today;
    },

    /**
     * showMapPopup2Modal: tui grid에 FocusedCell에 원하는 주소를 제공
     * @param {sting} sheet 리턴값 적용될 tui grid sheet
     * @return kakap map에서 제공되는 주소 정제하여 반환
     * */
    "showMapPopup": function (sheet) {
        const kakaoMap = !!document.getElementById('showMapPopup');
        var row = sheet.getFocusedCell();

        if (row.rowKey === null) {
            return toastrmessage("toast-bottom-center", "warning", "거래처를 선택 후 지도를 사용하세요.", "경고", 1500);
        }

        if (!kakaoMap) {
            /* file modification check */
            const kakaoMapCss = !!document.querySelector("link[href='/map/css/map.css']")
            const kakaoMapJs = !!document.querySelector("script[src='/map/js/map.js']")

            if (!kakaoMapCss) {
                /* add kakao css */
                const mapCss = document.createElement('link');
                mapCss.setAttribute("id", "kakaoMap-css");
                mapCss.setAttribute("rel", "stylesheet");
                mapCss.setAttribute("type", "text/css");
                mapCss.setAttribute("href", "/map/css/map.css");
                mapCss.setAttribute("media", "screen,print ");
                document.getElementsByTagName('head')[0].appendChild(mapCss);
            }

            /* kakao dialog */
            const popup = document.createElement("div");
            popup.setAttribute("id", "showMapPopup");
            popup.setAttribute("name", "showMapPopup");
            popup.setAttribute("style", "width: 100%;" +
                "height: 100%;" +
                "display: block;" +
                "position: absolute;" +
                "z-index: 3000;" +
                "padding: 6% 5% 0% 7%;");

            const map_wrap = document.createElement("div");
            map_wrap.setAttribute("class", "map_wrap");

            const map = document.createElement("div");
            map.setAttribute("id", "map");
            map.setAttribute("style", "width:100%;" +
                "height:100%;" +
                "position:absolute;" +
                "overflow:hidden;");

            const map_wrap2 = document.createElement("div");
            map_wrap2.setAttribute("class", "bg_white");
            map_wrap2.setAttribute("id", "menu_wrap");

            const option = document.createElement("div");
            option.setAttribute("class", "option");

            const div = document.createElement("div");

            const form = document.createElement("form");
            form.setAttribute("onsubmit", "searchPlaces(); return false;");
            form.innerText = "키워드 : "

            const keyword = document.createElement("input");
            keyword.setAttribute("type", "text");
            keyword.setAttribute("value", "이디에스 대구공장");
            keyword.setAttribute("id", "keyword");
            keyword.setAttribute("size", "15");
            keyword.style.zIndex = "3001";

            const submit = document.createElement("button");
            submit.setAttribute("type", "submit");
            submit.setAttribute("type", "submit");
            submit.innerText = "검색하기"

            const hr = document.createElement("hr");

            const placesList = document.createElement("ul");
            placesList.setAttribute("id", "placesList");

            const pagination = document.createElement("div");
            pagination.setAttribute("id", "pagination");

            /* 닫기 */
            const closeButton = document.createElement("button");
            closeButton.textContent = "닫기";

            form.appendChild(keyword);
            form.appendChild(submit);
            div.appendChild(form);
            option.appendChild(div);
            map_wrap2.appendChild(option);
            map_wrap2.appendChild(hr);
            map_wrap2.appendChild(placesList);
            map_wrap2.appendChild(pagination);
            map_wrap.appendChild(map);
            map_wrap.appendChild(map_wrap2);
            popup.appendChild(closeButton);
            popup.appendChild(map_wrap);

            document.getElementById('searchForm').appendChild(popup);

            if (!kakaoMapJs) {
                /* add kakao javascript */
                const mapScript = document.createElement('script');
                mapScript.setAttribute("src", "/map/js/map.js");
                mapScript.setAttribute("id", "kakaoMap-js");
                document.getElementsByTagName('head')[0].appendChild(mapScript);
            }
        } else {
            const popup = document.getElementById("showMapPopup");
            popup.style.display = "block";
        }

        /* 이벤트 리스너 세팅 */
        var placesListEl = document.getElementById('placesList');
        var popupEl = document.getElementById('showMapPopup');
        placesListEl.addEventListener("dblclick", function (ev) {
            var nodeName = ev.target.nodeName;
            var className = ev.target.className;

            var list, name, sinAdress, guAdress, tel;

            if (nodeName === "SPAN") {
                if (className.includes('markerbg')) {
                    list = ev.target.nextElementSibling;
                } else {
                    list = ev.target.parentNode;
                }
            } else if (nodeName === "H5") {
                list = ev.target.parentNode;
            } else if (nodeName === "DIV") {
                list = ev.target;
            }
            name = (!!list.childNodes[1] === false ? '' : list.childNodes[1].innerText);
            sinAdress = (!!list.childNodes[3] === false ? '' : list.childNodes[3].innerText);
            guAdress = (!!list.childNodes[5] === false ? '' : list.childNodes[5].innerText);
            tel = (!!list.childNodes[7] === false ? '' : list.childNodes[7].innerText);

            popupEl.style.display = "block";

            /* grid 적용
			*  name: 집 이름
			*  sinAdress: 신 주소
			*  guAdress" 구 주소
			*  tel: 전화번호
			*  */

            sheet.setValue(row.rowKey, 'addr', sinAdress);

            popupEl.style.display = "none";
            document.getElementById('btnInputPopEv').click();
        }, {once: true});

        var closeButtonEl = document.getElementById('closeButton');

        closeButtonEl.addEventListener("click", function () {
            popupEl.style.display = "none";
        }, {once: true});
    },

    /**
     * showMapPopup2Modal: modal 창위에 있는 input[type="text"]에 원하는 주소를 제공
     * @param {sting} id 리턴값 적용될 input 아이디
     * @param {sting} modal kakao map이 적용될 modal 아이디
     * @return kakap map에서 제공되는 주소 정제하여 반환
     * */
    "showMapPopup2Modal": function (id, modal) {
        const kakaoMap = !!document.getElementById('showMapPopup');

        if (!kakaoMap) {
            /* file modification check */
            const kakaoMapCss = !!document.querySelector("link[href='/map/css/map.css']")
            const kakaoMapJs = !!document.querySelector("script[src='/map/js/map.js']")

            if (!kakaoMapCss) {
                /* add kakao css */
                const mapCss = document.createElement('link');
                mapCss.setAttribute("id", "kakaoMap-css");
                mapCss.setAttribute("rel", "stylesheet");
                mapCss.setAttribute("type", "text/css");
                mapCss.setAttribute("href", "/map/css/map.css");
                mapCss.setAttribute("media", "screen,print ");
                document.getElementsByTagName('head')[0].appendChild(mapCss);
            }

            /* kakao dialog */
            const popup = document.createElement("div");
            popup.setAttribute("id", "showMapPopup");
            popup.setAttribute("name", "showMapPopup");
            popup.setAttribute("style", "width: 100%;" +
                "height: 100%;" +
                "display: block;" +
                "position: absolute;" +
                "z-index: 3000;" +
                "padding: 6% 5% 0% 7%;");

            const map_wrap = document.createElement("div");
            map_wrap.setAttribute("class", "map_wrap");

            const map = document.createElement("div");
            map.setAttribute("id", "map");
            map.setAttribute("style", "width:100%;height:100%;position:absolute;overflow:hidden;");

            const map_wrap2 = document.createElement("div");
            map_wrap2.setAttribute("class", "bg_white");
            map_wrap2.setAttribute("id", "menu_wrap");

            const option = document.createElement("div");
            option.setAttribute("class", "option");

            const div = document.createElement("div");

            const form = document.createElement("form");
            form.setAttribute("onsubmit", "searchPlaces(); return false;");
            form.innerText = "키워드 : "

            const keyword = document.createElement("input");
            keyword.setAttribute("type", "text");
            keyword.setAttribute("value", "이디에스 대구공장");
            keyword.setAttribute("id", "keyword");
            keyword.setAttribute("size", "15");
            keyword.style.zIndex = "3001";

            const submit = document.createElement("button");
            submit.setAttribute("type", "submit");
            submit.innerText = "검색하기"

            const hr = document.createElement("hr");

            const placesList = document.createElement("ul");
            placesList.setAttribute("id", "placesList");

            const pagination = document.createElement("div");
            pagination.setAttribute("id", "pagination");

            /* 닫기 */
            const closeButton = document.createElement("button");
            closeButton.setAttribute("id", "closeButton");
            closeButton.setAttribute("class", "btn btn-sm btn-default");
            closeButton.style.right = "5%";
            closeButton.style.position = "absolute";
            closeButton.style.zIndex = "3000";
            closeButton.textContent = "닫기";

            form.appendChild(keyword);
            form.appendChild(submit);
            div.appendChild(form);
            option.appendChild(div);
            map_wrap2.appendChild(option);
            map_wrap2.appendChild(hr);
            map_wrap2.appendChild(placesList);
            map_wrap2.appendChild(pagination);
            map_wrap.appendChild(map);
            map_wrap.appendChild(map_wrap2);
            popup.appendChild(closeButton);
            popup.appendChild(map_wrap);

            /** kakao 지도 중앙화
             * insertAdjacentHTML(position, text)
             * @param {string} position
             * "beforebegin"
             * 요소 이전에 위치합니다. 오직 요소가 DOM 트리에 있고 부모 요소를 가지고 있을 때만 유효합니다.
             *
             * "afterbegin"
             * 요소 바로 안에서 처음 자식 이전에 위치합니다.
             *
             * "beforeend"
             * 요소 바로 안에서 마지막 자식 이후에 위치합니다.
             *
             * "afterend"
             * 요소 이후에 위치합니다. 오직 요소가 DOM 트리에 있고 부모 요소를 가지고 있을 때만 유효합니다.
             *
             * @param {string} text HTML 혹은 XML로 파싱되고 트리에 삽입되는 문자열입니다.
             * @return 없음 (undefined).
             * */
            document.getElementById(modal).insertAdjacentHTML('afterbegin', popup.outerHTML);

            if (!kakaoMapJs) {
                /* add kakao javascript */
                const mapScript = document.createElement('script');
                mapScript.setAttribute("src", "/map/js/map.js");
                mapScript.setAttribute("id", "kakaoMap-js");
                document.getElementsByTagName('head')[0].appendChild(mapScript);
            }
        } else {
            const popup = document.getElementById("showMapPopup");
            popup.style.display = "block";
        }

        /* 이벤트 리스너 세팅 */
        var placesListEl = document.getElementById('placesList');
        var popupEl = document.getElementById('showMapPopup');
        placesListEl.addEventListener("dblclick", function (ev) {
            var nodeName = ev.target.nodeName;
            var className = ev.target.className;

            var list, name, sinAdress, guAdress, tel;

            if (nodeName === "SPAN") {
                if (className.includes('markerbg')) {
                    list = ev.target.nextElementSibling;
                } else {
                    list = ev.target.parentNode;
                }
            } else if (nodeName === "H5") {
                list = ev.target.parentNode;
            } else if (nodeName === "DIV") {
                list = ev.target;
            }
            name = (!!list.childNodes[1] === false ? '' : list.childNodes[1].innerText);
            sinAdress = (!!list.childNodes[3] === false ? '' : list.childNodes[3].innerText);
            guAdress = (!!list.childNodes[5] === false ? '' : list.childNodes[5].innerText);
            tel = (!!list.childNodes[7] === false ? '' : list.childNodes[7].innerText);

            popupEl.style.display = "block";

            /* input에 적용
			*  name: 집 이름
			*  sinAdress: 신 주소
			*  guAdress" 구 주소
			*  tel: 전화번호
			*  */
            document.getElementById(id).value = sinAdress;

            popupEl.style.display = "none";
        }, {once: true});

        var closeButtonEl = document.getElementById('closeButton');

        closeButtonEl.addEventListener("click", function () {
            popupEl.style.display = "none";
        }, {once: true});
    },

    "closeDialog": function () {
        const popup = document.querySelector("dialog[id=showMapPopup]");
        popup.close();
    },

    "toast": function (params) {
        Swal.fire({
            position: params.position || 'top-end', // 'top', 'top-start', 'top-end', 'center', 'center-start', 'center-end', 'bottom', 'bottom-start', 'bottom-end'
            title: params.title || null,
            text: params.text || null,
            icon: params.icon || 'success', // 'success', 'error', 'warning', 'info', 'question'
            showConfirmButton: params.showConfirmButton || false,
            timer: params.timer || 2000, // ms
            width: params.width || 500,
            toast: false,
        })
    },
    "confirmwin": async function (param) {
        await Swal.fire({
            title: params.title || null,
            text: params.text || null,
            icon: params.icon || 'warning',
            width: 500,
            position: params.position || 'center',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: params.confirmText || null,
            cancelButtonText: '취소',
            reverseButtons: false, // 버튼 순서 거꾸로

        }).then((result) => {
            if (result.isConfirmed) {
                params.doing();
            }
        })
    },

    "num2han": async function (num) {
        num = parseInt((num + '').replace(/[^0-9]/g, ''), 10) + ''; // 숫자/문자/돈 을 숫자만 있는 문자열로 변환
        if (num == '0')
            return '영';
        var number = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
        var unit = ['', '만', '억', '조'];
        var smallUnit = ['천', '백', '십', ''];
        var result = []; //변환된 값을 저장할 배열
        var unitCnt = Math.ceil(num.length / 4); //단위 갯수. 숫자 10000은 일단위와 만단위 2개이다.
        num = num.padStart(unitCnt * 4, '0') //4자리 값이 되도록 0을 채운다
        var regexp = /[\w\W]{4}/g; //4자리 단위로 숫자 분리
        var array = num.match(regexp);
        //낮은 자릿수에서 높은 자릿수 순으로 값을 만든다(그래야 자릿수 계산이 편하다)
        for (var i = array.length - 1, unitCnt = 0; i >= 0; i--, unitCnt++) {
            var hanValue = _makeHan(array[i]); //한글로 변환된 숫자
            if (hanValue == '') //값이 없을땐 해당 단위의 값이 모두 0이란 뜻.
                continue;
            result.unshift(hanValue + unit[unitCnt]); //unshift는 항상 배열의 앞에 넣는다.
        }

        //여기로 들어오는 값은 무조건 네자리이다. 1234 -> 일천이백삼십사
        function _makeHan(text) {
            var str = '';
            for (var i = 0; i < text.length; i++) {
                var num = text[i];
                if (num == '0') //0은 읽지 않는다
                    continue;
                str += number[num] + smallUnit[i];
            }
            return str;
        }

        return result.join('');
    },
    // 이미지 업로드 ajax
    'beforeUploadImageFile': async function (blob, callback, divi) {

        data = new FormData()
        data.append('file', blob)
        data.append('divi', divi)
        $.ajax({
            data: data,
            type: 'POST',
            url: '/EMAIL_MGT/beforeUploadImageFile',
            contentType: false,
            async: false,
            enctype: 'multipart/form-data',
            processData: false,
            success: async function (data) {
                callback(JSON.parse(data).url, 'image alt attribute');
            },
        })
    },

    // 이미지 삭제 ajax
    'deleteSummernoteImageFile': async function (imageName) {
        data = new FormData()
        data.append('file', imageName)
        $.ajax({
            data: data,
            type: 'POST',
            url: 'deleteSummernoteImageFile',
            contentType: false,
            enctype: 'multipart/form-data',
            processData: false,
        })
    },

    // 이미지 삭제 ajax
    'resetFileForm': async function (elFileForm) {
        var orgParent = elFileForm.parentNode;
        var orgNext = elFileForm.nextSibling;

        var tmp = document.createElement('form');
        tmp.appendChild(elFileForm);

        tmp.reset();

        orgParent.insertBefore(elFileForm, orgNext);
    },
    /*
	* data-> FORM copy
	*  */
    'eds_dataToForm': async function (param) {
        var formObj,
            column,
            columns,
            sValue
        ;
        if (param.data == null || param.data == 'undefined' || param.data.length <= 0) {
            alert("검색된 데이터가 없습니다.");
            return "";
        }
        if (param.form == null || typeof param.form != "object" || param.form.tagName != "FORM") {
            alert("eds_CopyForm2Sheet 함수의 form 인자는 FORM 태그가 아닙니다.");
            return "";
        }
        formObj = param.form;
        for (var i = 0; i < formObj.elements.length; i++) {


            column = this.getName(formObj.elements[i]);
            sValue = param.data[column];
            if (sValue || sValue === 0) {
                if (column == "telNo" || column == "phnNo" || column == "faxNo") {
                    sValue = sValue.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3").replace("--", "-");
                } else if (column == "openDt" || column == "clupDt" || column == "stDt" || column == "edDt" || column == "biryrMd" || column == "ecoDt" || column == "rcoDt" || column == "validStDt" || column == "validEdDt" || column == "cntDt" || column == "costDt") {
                    if (!sValue.includes('-')) {
                        sValue = this.addMinus(sValue);
                    } else {

                    }
                }
                if (column == "supAmt"
                    || column == "vatAmt"
                    || column == "totAmt"
                    || column == "supAmt2"
                    || column == "vatAmt2"
                    || column == "totAmt2"
                    || column == "supAmt3"
                    || column == "vatAmt3"
                    || column == "totAmt3"
                    || column == "supAmt4"
                    || column == "vatAmt4"
                    || column == "totAmt4"
                    || column == "supAmt5"
                    || column == "vatAmt5"
                    || column == "totAmt5"
                    || column == "salTotAmt"
                    || column == "costTotAmt"
                    || column == "profitAmt") {
                    let vals = edsUtil.addComma(sValue);
                    sValue = vals

                }

                switch (formObj.elements[i].type) {
                    case undefined:
                    case "button":
                    case "reset":
                    case "submit":
                        break;
                    case "radio":
                        break;
                    case "select-multiple": {
                        var value = sValue.split(',');
                        $("#" + column).val(value).trigger('change');
                    }
                        break;
                    case "select-one": {
                        if (formObj.id === 'updateForm') {
                            $("#" + column + 'Update').val(sValue).trigger('change');
                        } else if (formObj.id === 'updateFormND') {
                            $("#" + column + 'NDUpdate').val(sValue).trigger('change');
                        } else
                            $("#" + column).val(sValue).trigger('change');
                    }
                        break;
                    case "checkbox":
                        formObj.elements[i].checked = sValue;
                        break;
                    default:

                        formObj.elements[i].value = sValue;
                        break;
                }
            }
        }
        $(".select2").trigger('change');
    },
    /*
	* FORM-> data copy
	*  */
    'eds_FormToData': async function (param) {
        var formObj,
            column,
            columns,
            sValue
        ;
        if (param.form == null || typeof param.form != "object" || param.form.tagName != "FORM") {
            alert("eds_CopyForm2Sheet 함수의 form 인자는 FORM 태그가 아닙니다.");
            return "";
        }
        formObj = param.form;
        for (var i = 0; i < formObj.elements.length; i++) {
            column = this.getName(formObj.elements[i]);
            sValue = param.data[column];
            switch (formObj.elements[i].type) {
                case undefined:
                case "select-multiple": {
                    var value = $("#" + column).val().toString();
                    param.data[column] = value;
                }
                    break;
                case "number": {
                    if (sValue == '' || sValue == 'undefined') {
                        param.data[column] = null;

                    }
                }
                    break;
                case "text": {
                    if (sValue == '' || sValue == 'undefined') {
                        param.data[column] = null;

                    }
                }
                    break;
                case "select-one": {
                    var value = $("#" + column).val();
                    param.data[column] = value;
                }
                    break;
            }
            if (sValue || sValue === 0) {
                if (column == "telNo" || column == "phnNo" || column == "faxNo") {
                    param.data[column] = sValue.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3").replace("--", "-");
                } else if (column == "cntDt" || column == "openDt" || column == "clupDt" || column == "stDt" || column == "edDt" || column == "biryrMd" || column == "ecoDt" || column == "rcoDt" || column == "validStDt" || column == "validEdDt" || column == "costDt") {
                    if (sValue.includes('-')) {
                        param.data[column] = this.removeMinus(sValue);
                    } else {

                    }
                }
                if (column == "supAmt"
                    || column == "vatAmt"
                    || column == "totAmt"
                    || column == "supAmt2"
                    || column == "vatAmt2"
                    || column == "totAmt2"
                    || column == "supAmt3"
                    || column == "vatAmt3"
                    || column == "totAmt3"
                    || column == "supAmt4"
                    || column == "vatAmt4"
                    || column == "totAmt4"
                    || column == "supAmt5"
                    || column == "vatAmt5"
                    || column == "totAmt5"
                    || column == "salTotAmt"
                    || column == "costTotAmt"
                    || column == "profitAmt") {
                    let vals = sValue.replace(/,/g, "");
                    param.data[column] = vals;

                }

            }
        }
    },
    /*
	* 그리드 데이터 추가 및 저장
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* */
    "edmsDoCUD": async function (url, datas, itemData, parentData) {

        // 유효성 검사
        let saveResult;
        datas.itemData = itemData;
        datas.parentData = parentData;
        var param = [datas];
        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify({data: param}),
            success: async function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }
                if (result.IO.Result == 0 || result.IO.Result == 1) {
                    Swal.fire({
                        icon: 'success',
                        title: '성공',
                        text: result.IO.Message,
                    });
                    saveResult = true;
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '실패',
                        text: result.IO.Message,
                    });
                    saveResult = false;
                }
            }
        });
        return saveResult;
    },
    /*
	* 그리드 데이터 추가 및 저장
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* */
    "groupDoCUD": async function (url, sheetName, sheetObj) {

        var rowKey = await sheetObj.getFocusedCell();
        sheetObj.finishEditing(rowKey);

        var param = new Array();
        var rows = await sheetObj.getModifiedRows();	//	createdRows:신규, updatedRows, 수정

        if (rows.createdRows.length == 0 &&
            rows.updatedRows.length == 0 &&
            rows.deletedRows.length == 0) {
            Swal.fire({
                icon: 'error',
                title: '실패',
                text: "저장할 내용이 없습니다.",
            });
            return;
        }

        // 유효성 검사
        var validate = await sheetObj.validate();
        for (var i = 0; i < validate.length; i++) {
            if (validate[i].errors.length != 0) {
                for (var r = 0; r < validate[i].errors.length; r++) {
                    if (validate[i].errors[r].errorCode == "REQUIRED") {
                        await sheetObj.focus(validate[i].rowKey, validate[i].errors[r].columnName); // 빈 필수 값 포커스
                        alert('필수값을 입력해 주세요.')
                        return;
                    }
                }
            }
        }

        if (rows.createdRows.length > 0) {
            for (var i = 0; i < rows.createdRows.length; i++) {
                rows.createdRows[i].status = 'C';
                param.push(rows.createdRows[i]);
            }
        }
        if (rows.updatedRows.length > 0) {
            for (var i = 0; i < rows.updatedRows.length; i++) {
                rows.updatedRows[i].status = 'U';
                param.push(rows.updatedRows[i]);
            }
        }
        if (rows.deletedRows.length > 0) {
            for (var i = 0; i < rows.deletedRows.length; i++) {
                rows.deletedRows[i].status = 'D';
                param.push(rows.deletedRows[i]);
            }
        }

        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify({data: param}),
            success: async function (result) {
                if (!result.sess && typeof result.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }

                if (result.IO.Result == 0 || result.IO.Result == 1) {
                    Swal.fire({
                        icon: 'success',
                        title: '성공',
                        text: result.IO.Message,
                    });
                    await doAction(sheetName, "search");
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '실패',
                        text: result.IO.Message,
                    });
                }
            }
        });
    },
    /*
	* 그리드 데이터 추가 및 저장
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* */
    "doDeadline": async function (url, sheetName, sheetObj, divi) {

        var rows = sheetObj.getCheckedRows();
        var rowsLen = rows.length;
        for (let i = 0; i < rowsLen; i++) {
            rows[i].deadDivi = divi
        }

        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify({data: rows}),
            success: function (result) {
                doAction(sheetName, "search");
            }
        });
    },
    /*
	* sheetData2Maldal
	* sheetObj : sheet obj
	* */
    "sheetData2Maldal": async function (sheetObj) {
        const focusedCell = sheetObj.getFocusedCell();
        const colName = focusedCell.columnName;
        const rowKey = focusedCell.rowKey;
        const getValue = sheetObj.getValue(rowKey, colName);

        /* 공통단 모달 버튼 생성*/
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('class', 'btn btn-primary');
        button.setAttribute('data-toggle', 'modal');
        button.setAttribute('data-target', '#commonTarget');
        button.setAttribute('id', 'commonTargetButton');

        /* 공통단 모달 생성*/
        const modalFormTextArea = document.createElement('textarea');
        modalFormTextArea.setAttribute('id', 'modalFormTextArea')
        modalFormTextArea.setAttribute('rows', '6')
        modalFormTextArea.setAttribute('style', 'width:100%;')
        modalFormTextArea.value = getValue;
        // modalFormTextArea.readOnly = true;

        const modalFormRow = document.createElement('div');
        modalFormRow.setAttribute('class', 'form-row');
        modalFormRow.appendChild(modalFormTextArea);

        const modalForm = document.createElement('from');
        modalForm.appendChild(modalFormRow);

        const modalWrap = document.createElement('div');
        modalWrap.setAttribute('class', 'col-md-12');
        modalWrap.setAttribute('style', 'height: 100%;');
        modalWrap.appendChild(modalForm);

        const modalBody = document.createElement('div');
        modalBody.setAttribute('class', 'modal-body')
        modalBody.appendChild(modalWrap);

        const modalContent = document.createElement('div');
        modalContent.setAttribute('class', 'modal-content');
        modalContent.appendChild(modalBody);

        const modalSize = document.createElement('div');
        modalSize.setAttribute('class', 'modal-dialog modal-dialog-centered modal-xl');
        modalSize.setAttribute('role', 'document');
        modalSize.appendChild(modalContent);

        const modalOutter = document.createElement('div');
        modalOutter.setAttribute('class', 'modal fade show');
        modalOutter.setAttribute('id', 'commonTarget');
        modalOutter.setAttribute('tabindex', '-1');
        modalOutter.setAttribute('style', 'z-index:2000');
        modalOutter.setAttribute('role', 'dialog');
        modalOutter.setAttribute('aria-hidden', 'true');
        modalOutter.appendChild(modalSize);

        document.body.prepend(button);
        document.body.prepend(modalOutter);

        var commonTargetButton = document.getElementById('commonTargetButton');
        commonTargetButton.click();
        commonTargetButton.remove();

        $('#commonTarget').on('hidden.bs.modal',
            async function (ev) {
                document.getElementById('commonTarget').remove();
            });
        $('#commonTarget').on('hide.bs.modal',
            async function (ev) {
                var modalFormTextAreaValue = document.getElementById('modalFormTextArea').value;
                sheetObj.setValue(rowKey, colName, modalFormTextAreaValue);
            });

        /*$('#commonTarget').on('shown.bs.modal',
			async function (ev){
				await alert('열후');
			});
		$('#commonTarget').on('show.bs.modal',
			async function (ev){
				await alert('열전');
			});*/
    },
    /*
	* fileDownLoad
	* sheetObj : sheet obj
	* needs: saveRoot
	* */
    "fileDownLoad": async function (sheetObj) {
        const menu1 = window.parent.document.querySelectorAll('.nav-sidebar>.nav-item>.nav-link.active')[0].children[1].innerText;
        const menu2 = window.parent.document.querySelectorAll('.nav-treeview>.nav-item>.nav-link.active')[0].children[0].innerText;
        const menu = menu1 + ' > ' + menu2;
        const row = sheetObj.getRow(sheetObj.getFocusedCell().rowKey);
        // var params = row.saveRoot.replaceAll("/","'").replaceAll("\\","'")
        var params = row.origNm + ':' + row.ext + ':' + row.saveRoot.replaceAll("/", "'").replaceAll("\\", "'") + ':' + menu;

        try {
            const a = document.createElement("a");
            const url = '/fileDownLoad/' + encodeURIComponent(params);

            a.setAttribute('href', url);
            a.setAttribute('download', row.origNm + '.' + row.ext);
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url)
            a.remove();
        }catch (e) {
            console.log(e)
        }
    },
    /*
	* form validation
    * form : dataForm
    * */
    "FormValidationEvent": async function (form) {
        form.validate({
            submitHandler: function () {
            }, rules: {   // 정책 정하기
                projNm: {
                    required: true   // 필수입력항목
                }
                , projPur: {
                    required: true   // 필수입력항목
                }
                , stDt: {
                    required: true   // 필수입력항목
                }
                , edDt: {
                    required: true   // 필수입력항목
                }
            }, messages: {   // 정책 위반시 메세지
                projNm: {
                    required: '프로젝트명을 입력하십시오.'   // 필수입력항목
                }
                , projPur: {
                    required: '프로젝트목적 입력하십시오.'   // 필수입력항목
                }
                , stDt: {
                    required: '시작날짜를 선택하십시오.'   // 필수입력항목
                }
                , edDt: {
                    required: '완료날짜를 선택하십시오.'   // 필수입력항목
                }
            }

        });
        $.extend($.validator.messages, {
            required: "필수 항목입니다."    // required 속성의 공동 메세지
        });

        // 패스워드 정규직
        $.validator.addMethod("pw_regexp", function (value, element) {
            return this.optional(element) || /^.*(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/.test(value);
        });
    },
    /*
	* moveToNextOrPrevRange
	* calendar : calendar instance
	* offset : -1(.prev()), 1(.next())
	* needs: saveRoot
	* */
    "moveToNextOrPrevOrTodayRange": async function (calendar, offset) {

        // 달력 프론트 세팅
        if (offset === -1) { // -1 년, 월, 일
            calendar.prev();
        } else if (offset === 1) { // +1 년, 월, 일
            calendar.next();
        } else if (offset === 0) { // 현재 달력으로 세팅
            calendar.today();
        }
        // 클릭 대비 달력 년월 세팅
        document.getElementById('topCalendar').innerText = moment(calendar.getDate().d.d).format('YYYY-MM');
        await doAction(calendar.container.id, 'search');
    },
    /**
     * checkValidationForForm
     * @param {string} form : -1(.prev()), 1(.next())
     * @param {[list]} validationList : saveRoot
     * */
    "checkValidationForForm": async function (form, validationList) {

        var condition = document.querySelectorAll('form[id="' + form + '"] input, form[id="' + form + '"] select, form[id="' + form + '"] textarea');
        var conditionList = validationList;
        var ajaxCondition = 0;

        for (let i = 0, conditionLength = condition.length; i < conditionLength; i++) {
            for (let j = 0, conditionListLength = conditionList.length; j < conditionListLength; j++) {
                if (condition[i].id === conditionList[j]) {
                    if (condition[i].value.length < 1) {
                        condition[i].scrollIntoView();
                        condition[i].focus();
                        condition[i].classList.add('is-invalid')
                        Swal.fire({
                            icon: 'error',
                            title: '실패',
                            text: condition[i].getAttribute('title') + '(을)를 입력하세요.',
                            footer: ''
                        });
                        return 1;
                    } else {
                        condition[i].classList.remove('is-invalid')
                    }
                }
            }
        }

        return 0;
    },

    /*
	* 그리드 데이터 추가 및 저장
	* url : 요청 url
	* sheetName : sheet name
	* sheetObj : sheet obj
	* form : inpute Datas
	* */
    "modalCUD": async function (url, sheetName, sheetObj, form) {

        sheetObj.finishEditing();

        var formData = {};
        var els = document.querySelectorAll('form[id="' + form + '"] input, form[id="' + form + '"] textarea, form[id="' + form + '"] select');
        for (let i = 0, length = els.length; i < length; i++) {
            formData[els[i].id] = els[i].value;
        }

        var param = new Array();
        var rows = await sheetObj.getModifiedRows();	//	createdRows:신규, updatedRows, 수정

        // 유효성 검사
        var validate = await sheetObj.validate();
        for (var i = 0; i < validate.length; i++) {
            if (validate[i].errors.length != 0) {
                for (var r = 0; r < validate[i].errors.length; r++) {
                    if (validate[i].errors[r].errorCode == "REQUIRED") {
                        await sheetObj.focus(validate[i].rowKey, validate[i].errors[r].columnName); // 빈 필수 값 포커스
                        alert('필수값을 입력해 주세요.')
                        return;
                    }
                }
            }
        }

        if (rows.createdRows.length > 0) {
            for (var i = 0; i < rows.createdRows.length; i++) {
                rows.createdRows[i].status = 'C';
                param.push(rows.createdRows[i]);
            }
        }
        if (rows.updatedRows.length > 0) {
            for (var i = 0; i < rows.updatedRows.length; i++) {
                rows.updatedRows[i].status = 'U';
                param.push(rows.updatedRows[i]);
            }
        }
        if (rows.deletedRows.length > 0) {
            for (var i = 0; i < rows.deletedRows.length; i++) {
                rows.deletedRows[i].status = 'D';
                param.push(rows.deletedRows[i]);
            }
        }

        formData['rows'] = param;

        $.ajax({
            url: url,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "POST",
            async: false,
            data: JSON.stringify({formData}),
            success: async function (rst) {
                var status = rst.status;
                var note = rst.note;
                if (!rst.sess && typeof rst.sess != "undefined") {
                    alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
                    return;
                }

                if (status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: '성공',
                        text: note,
                    });
                    await doAction(sheetName, "search");
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '실패',
                        text: note,
                    })
                }
            }
        });
    },

    /*
	* applyColorToSheet
	* sheetObj : sheet obj
	* */
    "applyColorDataToSheet": async function (sheetObj,color,colorCd) {
        const focusedCell = sheetObj.getFocusedCell();
        const colName = focusedCell.columnName;
        const rowKey = focusedCell.rowKey;
        const getValue = sheetObj.getValue(rowKey, colName);

        /* 공통단 모달 버튼 생성*/
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('class', 'btn btn-primary');
        button.setAttribute('data-toggle', 'modal');
        button.setAttribute('data-target', '#commonTarget');
        button.setAttribute('id', 'commonTargetButton');

        /* 공통단 모달 생성*/
        const colorPickerToSheet = document.createElement('input');
        colorPickerToSheet.type = 'color';
        colorPickerToSheet.id = 'colorPickerToSheet';
        colorPickerToSheet.style.width = '100%';
        colorPickerToSheet.value = getValue;

        const modalFormRow = document.createElement('div');
        modalFormRow.setAttribute('class', 'form-row');
        modalFormRow.appendChild(colorPickerToSheet);

        const modalForm = document.createElement('from');
        modalForm.appendChild(modalFormRow);

        const modalWrap = document.createElement('div');
        modalWrap.setAttribute('class', 'col-md-12');
        modalWrap.setAttribute('style', 'height: 100%;');
        modalWrap.appendChild(modalForm);

        const modalBody = document.createElement('div');
        modalBody.setAttribute('class', 'modal-body')
        modalBody.appendChild(modalWrap);

        const modalHeaderCloseButton = document.createElement('button');
        modalHeaderCloseButton.setAttribute('type', 'button')
        modalHeaderCloseButton.setAttribute('class', 'close')
        modalHeaderCloseButton.setAttribute('data-dismiss', 'modal')
        modalHeaderCloseButton.setAttribute('aria-label', 'Close')

        const modalHeaderCloseButtonText = document.createElement('span');
        modalHeaderCloseButtonText.setAttribute('aria-hidden', 'true')
        modalHeaderCloseButtonText.innerText = '×'
        modalHeaderCloseButton.appendChild(modalHeaderCloseButtonText);

        const modalHeader = document.createElement('div');
        modalHeader.setAttribute('class', 'modal-header bg-dark font-color')

        const modalHeaderText = document.createElement('h4');
        modalHeaderText.setAttribute('class', 'modal-title')
        modalHeaderText.innerText = '색깔코드'

        modalHeader.appendChild(modalHeaderText);
        modalHeader.appendChild(modalHeaderCloseButton);

        const modalContent = document.createElement('div');
        modalContent.setAttribute('class', 'modal-content');
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);

        const modalSize = document.createElement('div');
        modalSize.setAttribute('class', 'modal-dialog modal-dialog-center modal-sm');
        modalSize.setAttribute('role', 'document');
        modalSize.appendChild(modalContent);

        const modalOutter = document.createElement('div');
        modalOutter.setAttribute('class', 'modal fade show');
        modalOutter.setAttribute('id', 'commonTarget');
        modalOutter.setAttribute('tabindex', '-1');
        modalOutter.setAttribute('style', 'z-index:2000');
        modalOutter.setAttribute('role', 'dialog');
        modalOutter.setAttribute('aria-hidden', 'true');
        modalOutter.appendChild(modalSize);

        document.body.prepend(button);
        document.body.prepend(modalOutter);

        var commonTargetButton = document.getElementById('commonTargetButton');
        commonTargetButton.click();
        commonTargetButton.remove();

        $('#commonTarget').on('hidden.bs.modal',
            async function (ev) {
                document.getElementById('commonTarget').remove();
            });
        $('#commonTarget').on('hide.bs.modal',
            async function (ev) {
                // set Data to sheetObj
                var colorPickerToSheetValue = document.getElementById('colorPickerToSheet').value;
                sheetObj.setValue(rowKey, colName, colorPickerToSheetValue);

                // get Color to sheetObj
                var el = sheetObj.getElement(rowKey,color).children[0];
                el.value = colorPickerToSheetValue;
            });

        /*$('#commonTarget').on('shown.bs.modal',
			async function (ev){
				await alert('열후');
			});
		$('#commonTarget').on('show.bs.modal',
			async function (ev){
				await alert('열전');
			});*/
    },
    /*
	* applyColorToSheet
	* sheetObj : sheet obj
	* */
    "applyColorToSheet": async function (sheetObj,color,colorCd) {
        const data = sheetObj.getFilteredData();

        for (let i = 0, dataLen = data.length; i < dataLen; i++) {
            var el = sheetObj.getElement(data[i].rowKey,color).children[0];
            el.value = sheetObj.getValue(data[i].rowKey,colorCd);
        }
    },
    /*
	* applyColorToSheet
	* sheetObj : sheet obj
	* */
    "formatNumberHtmlInputForInteger": async function (inputElement) {
        // 입력값이 비어있으면 0으로 설정
        if (inputElement.value === '') {
            inputElement.value = '0';
            return;
        }
        // 입력값이 '0'으로 시작하는 경우 (예: '01') 0를 제거
        if (inputElement.value.match(/^0\d/)) {
            inputElement.value = inputElement.value.replace(/^0+/, '');
        }
        // 숫자만 남기고 모든 비숫자 문자 제거
        const numericValue = inputElement.value.replace(/\D/g, '');

        // 정규식을 사용하여 천 단위 콤마 추가
        inputElement.value = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    /*
	* applyColorToSheet
	* sheetObj : sheet obj
	* */
    "formatNumberHtmlInputForDouble": async function (inputElement) {
        // 입력값이 비어있으면 0으로 설정
        if (inputElement.value === '') {
            inputElement.value = '0';
            return;
        }
        // 입력값이 '0'으로 시작하는 경우 (예: '01') 0를 제거
        if (inputElement.value.match(/^0\d/)) {
            inputElement.value = inputElement.value.replace(/^0+/, '');
        }
        // 입력값에서 숫자와 소수점만 남기고 모든 다른 문자 제거
        const rawValue = inputElement.value.replace(/[^\d.]/g, '');

        // 소수점 앞의 숫자 부분만 추출
        const parts = rawValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // 소수점 이하가 있으면 다시 합침
        inputElement.value = parts.join('.');
    },

    /**
     * 로딩 마스크 ver2
     * @param git = /.../.../image path
     * */
    "toggleLoadingScreen": async function (on) {
        const el = document.querySelectorAll('div[id="loadingScreen"]');
        const elLength = el.length;
        if(elLength === 0){
            if (on==='on') {
                const loadingScreen = document.createElement('div');
                loadingScreen.setAttribute('id','loadingScreen');
                loadingScreen.setAttribute('style','position: fixed;top: 0;left: 0;width: 100%;height: 100%;background: rgba(0, 0, 0, 0.5);'+ /* 반투명 검은색 배경 */'display: none;justify-content: center;align-items: center;z-index: 3000;'+ /* 다른 요소보다 앞에 위치 */'pointer-events: all;'/* 클릭 이벤트 방지 */);
                const loadingImg = document.createElement('img');
                loadingImg.setAttribute('id','loadingImg');
                loadingImg.setAttribute('src', '/img/loading/Jumping_through_balls.gif')
                loadingScreen.appendChild(loadingImg);
                document.body.appendChild(loadingScreen);
                loadingScreen.style.display = 'flex'; // 로딩 화면 표시
            } else {
            }
        }else{
            if (on==='on') {
                el[0].style.display = 'flex'; // 로딩 화면 표시
            } else {
                el[0].style.display = 'none'; // 로딩 화면 숨김
            }
        }
    },
}