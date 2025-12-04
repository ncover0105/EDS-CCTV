/*
* 공통 Form set
* target : ID 값
* commCd : 공통코드 값
* head : 전체 추가 유무
* */
var eds = {};

eds.sysma = {
	Select:[
		{ target:"useYn", commCd:"SYS001", head:true },	// 사용여부
		{ target:"authDivi", commCd:"SYS009", head:false },	// 권한구분
	]
};