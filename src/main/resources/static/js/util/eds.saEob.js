/*
* 공통 Form set
* target : ID 값
* commCd : 공통코드 값
* head : 전체 추가 유무
* */
eds.salma = {
	Select:[
		{ target:"groupDivi", commCd:"SYS001", head:true },
		{ target:"useYn", commCd:"SYS001", head:true },	// 사용여부
		{ target:"acDiviCd", commCd:"COM004", head:false },	// 계정구분
		{ target:"procDiviCd", commCd:"COM005", head:false },	// 조달구분
		{ target:"taxDivi", commCd:"COM006", head:false },	// 과세구분
		{ target:"vat", commCd:"COM007", head:false },	// 부가세
		{ target:"storDivi", commCd:"COM008", head:false },	// 창고구분
		{ target:"saleCloseDivi", commCd:"COM010", head:false }, // 매출마감구분
		{ target:"coltDivi", commCd:"COM012", head:false }, // 수금구분
		{ target:"retuDivi", commCd:"COM022", head:false }, // 반품구분
		{ target:"inveDispDivi", commCd:"COM019", head:false }, // 폐기유형
	]
};