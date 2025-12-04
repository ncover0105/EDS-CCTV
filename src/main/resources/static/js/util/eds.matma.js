
/*
* 공통 Form set
* target : ID 값
* commCd : 공통코드 값
* head : 전체 추가 유무
* */
eds.matma = {
    Select:[
        { target:"groupDivi", commCd:"SYS001", head:true },
        { target:"acDiviCd", commCd:"COM004", head:false },	// 계정구분
        { target:"inveAdjuDivi", commCd:"COM017", head:true }, // 재고조정구분
        { target:"inveRcntDivi", commCd:"COM018", head:true }, // 재고실사구분
        { target:"inveDispDivi", commCd:"COM019", head:true }, // 재고폐기구분
    ]
};