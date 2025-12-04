//전역 변수
var _commonCode;
var _iconCode;
//브라우져의 session storage를 읽어 공통코드 정보가 있는지 확인
function checkStorage(){
    return !!sessionStorage.getItem('commonCode');
}

//서버에서 공통 코드(json)을 받아와 storage에 세팅
function setStorage(param){
    $.ajax({
        url: '/eds/rain/com/selectCOMMCDENUM',
        type: "POST",
        data: param,
        async: false,
        success: function(result){
            let datas=JSON.parse(result);
            sessionStorage.setItem('commonCode',JSON.stringify(datas.commonCode));
            sessionStorage.setItem('iconCode',JSON.stringify(datas.iconCode));
        }
    });

    // fetchCommonCode('/eds/erp/com/selectCOMMCDENUM',param)
    // .then(function(response){
    //     var commonData = response.data;
    //     if(commonData){
    //         sessionStorage.setItem('commonCode',JSON.stringify(commonData) );
    //     }
    // })
    // .catch(function(error){
    //
    // })
}

//공통 코드에서 지정한 cName에 핻당하는 코드를 추출하여 key를 리턴
function setEnumKeys(cName){

    var commonCode = _commonCode[cName];
    if(typeof commonCode == "string"){
        commonCode = JSON.parse(_commonCode[cName])
    }

    return "|" + commonCode.map(function(item){
        return Object.getOwnPropertyNames(item)[0];
    }).join("|");
    // return "|" + _commonCode[cName].map(function(item){
    //     return Object.getOwnPropertyNames(item)[0];
    // }).join("|");
}

//공통 코드에서 지정한 cName에 핻당하는 코드를 추출하여 value를 리턴
function setEnum(cName){

    var commonCode = _commonCode[cName];
    if(typeof commonCode == "string"){
        commonCode = JSON.parse(_commonCode[cName])
    }

    return "|" + commonCode.map(function(item){
        return item[ Object.getOwnPropertyNames(item)[0]];
    }).join("|");

    // return "|" + _commonCode.map(function(item){
    //     return item[ Object.getOwnPropertyNames(item)[0]];
    // }).join("|");
}

function setCommCode(cName){
    var commonCode = _commonCode[cName];
    if(typeof commonCode == "string"){
        commonCode = JSON.parse(_commonCode[cName])
    }
    var array = new Array();
    for(i=0; i<commonCode.length; i++){
        var obj = new Object();
        obj.text = Object.values(commonCode[i]).toString();
        obj.value = Object.keys(commonCode[i]).toString();
        array.push(obj);
    }
    return array;
}
function getIconCode(cName){
    var iconCode = _iconCode[cName];

    if(typeof iconCode == "string"){
        iconCode = JSON.parse(_iconCode[cName])
    }   
    var obj = new Object();
    for(const data of iconCode){
        Object.assign(obj,data)
    }
    return obj;
}
function getCommCode(cName){
    var commonCode = _commonCode[cName];

    if(typeof commonCode == "string"){
        commonCode = JSON.parse(_commonCode[cName])
    }   
    var obj = new Object();
    for(const data of commonCode){
        Object.assign(obj,data)
    }
    return obj;
}

//IIFE  sessionStorage에서 공통 코드 내용을 얻어 전역변수에 세팅
(function(){
    if( checkStorage() && !(_commonCode) ){
        try{
            var str = sessionStorage.getItem('commonCode');
            _commonCode = JSON.parse(str);
            var iconStr = sessionStorage.getItem('iconCode');
            _iconCode = JSON.parse(iconStr);
        }catch(exception){
            console.log(exception);
        }
    }
})();
