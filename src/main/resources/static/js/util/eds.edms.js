/*
* 공통 Form set
* target : ID 값
* commCd : 공통코드 값
* head : 전체 추가 유무
* */
eds.edms = {
	Select:[
		{ target:"docDivi", commCd:"COM027", head:true },
		{ target:"deadDivi", commCd:"COM028", head:true },
		{ target:"useYn", commCd:"SYS001", head:true },	// 사용여부
		{ target:"respDivi", commCd:"SYS003", head:false },	// 직책
		{ target:"posiDivi", commCd:"SYS004", head:false },	// 직위
		{ target:"projDivi", commCd:"COM029", head:true },
	]
};