/*
* 공통 Form set
* target : ID 값
* commCd : 공통코드 값
* head : 전체 추가 유무
* */
eds.basma = {
	Select:[
		{ target:"groupDivi", commCd:"SYS001", head:true },
		{ target:"corpPersDivi", commCd:"COM001", head:true },	// 법인/개인구분
		{ target:"carDivi", commCd:"COM001", head:true },	// 법인/개인구분
		{ target:"empState", commCd:"SYS005", head:true },	// 재직상태 구분
		{ target:"sexCd", commCd:"SYS008", head:false },	// 성별
		{ target:"natiCd", commCd:"SYS006", head:false },	// 국적
		{ target:"foreDiviCd", commCd:"SYS007", head:false },	// 내/외국인
		{ target:"respDivi", commCd:"SYS003", head:false },	// 직책
		{ target:"posiDivi", commCd:"SYS004", head:false },	// 직위
		{ target:"accDivi", commCd:"SYS001", head:false },	// 접속제한
		{ target:"typeCd", commCd:"COM003", head:false },	// 유형
		{ target:"acDiviCd", commCd:"COM004", head:false },	// 계정구분
		{ target:"procDiviCd", commCd:"COM005", head:false },	// 조달구분
		{ target:"taxDivi", commCd:"COM006", head:false },	// 과세구분
		{ target:"vat", commCd:"COM007", head:false },	// 부가세
		{ target:"storDivi", commCd:"COM008", head:false },	// 창고구분
		{ target:"oilType", commCd:"COM034", head:false },	// 유종
		{ target:"insuCorpDivi", commCd:"COM035", head:false },	// 보험사
		{ target:"buyDivi", commCd:"COM036", head:false },	// 차량구매유형
		{ target:"apprDivi", commCd:"COM037", head:false },	// 승인구분
		{ target:"expeDivi", commCd:"COM038", head:false },	// 지출구분
		{ target:"payDivi", commCd:"COM039", head:false },	// 결제수단
		{ target:"projDivi", commCd:"COM029", head:true },
		{ target:"acDiviCd2", commCd:"COM004", head:true },	// 계정구분
		{ target:"useYn", commCd:"SYS001", head:true },	// 사용여부
		{ target:"compDivi", commCd:"COM025", head:true },	// 자/타사구분
		{ target:"procDiviCd2", commCd:"COM005", head:true },	// 조달구분
		{ target:"itemDivi", commCd:"COM023", head:true }, // 제품구분
		{ target:"ad", commCd:"SYS010", head:true }, // 행정구역
		{ target:"month", commCd:"SYS011", head:false }, // 월 구분
		{ target:"clasifyDivi", commCd:"SYS012", head:false }, // 구분
		{ target:"modelDivi", commCd:"SYS013", head:true }, // 모델 구분
	]
};