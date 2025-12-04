/*
* 공통팝업
* URL : Controller select ** View Url
* */
var edsEdms;

edsEdms ={
	"insertSubmit": async function (itemGrid,itemForm,parentData,dropzeneRemoveFile) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		// 적용 닫기]insertSubmit
		//빈값체크//
		if(document.getElementById("submitDivi"))
		{
			let sumbitDivi= document.getElementById("submitDivi").value;
			if(sumbitDivi=='04')
			{
				parentData.submitCd=null;
			}
		}
		
		const validate=itemForm.checkValidity();
		if(!validate) return document.getElementById("submitbtn").click();
		if(itemGrid)//그리드있을시
		{
			if(!(await this.validateCheck(itemGrid))) return false;
		}
		//상신시 결재자선택
		if(parentData.submitDivi=='01' && parentData.submitApprover.length<=0) return Swal.fire({icon: 'error',title: '실패',text: '결재자를 선택하세요.'});

		//저장로직
		var datas= ut.serializeObject(itemForm); //조회조건
		var param={};
		param.data=datas;
		param.form=itemForm;
		param.select=select;
		await edsUtil.eds_FormToData(param);//param에 폼데이터 입력
		datas.status='C';
		const itemData= itemGrid?itemGrid.getData():[];;
		datas.itemData=itemData;
		datas.parentData=parentData;
		var newFiles=dropzone.getAcceptedFiles();
		var formData = new FormData();
		const params=[datas];
		for (let index in newFiles) {
			formData.append('file', newFiles[index]);
		}
		if(typeof(insfile) != 'undefined')//insert 파일저장용
        {
            for (let index in insfile) {
                formData.append('file', insfile[index]);
            }
        }

		formData.append("data",JSON.stringify(params));
		let url="";
		if(parentData.docDivi=='03')
		{
			url="/EDMS_EXPENSE_REPORT/cudExpenseList"
		}
		else if(parentData.docDivi=='02'|| parentData.docDivi=='01'||parentData.docDivi=='05'||parentData.docDivi=='11')
		{
			url="/EDMS_EST_REPORT/cudEstList"
		}
		else
		{
			url="/EDMS_EDIT_REPORT/cudEditList"
			var dummy = document.createElement("div");
			dummy.innerHTML = datas.editerArea;
			var imagesFiles = Array.from(dummy.querySelectorAll("img"));
			for (let index of imagesFiles) {
				const response = await fetch(index.src);
				const data = await response.blob();
				// const ext = url.split(".").pop(); // url 구조에 맞게 수정할 것
				// const filename = url.split("/").pop(); // url 구조에 맞게 수정할 것
				// const metadata = { type: `image/${ext}` };
				// var bstr = atob(index.src.split(",")[1]);
				// console.log(bstr)
				// var n = bstr.length;
				// console.log(n)
				// var u8arr = new Uint8Array(n);
				// while(n--) {
				// 	u8arr[n] = bstr.charCodeAt(n);
				// }
				var file = new File([data], "temp.png", {type:"mime"});
				formData.append('tempImage', file);
			}
		}
		 await $.ajax({
				url: url,
				type: "POST",
				data: formData,
                async:false,
				enctype: 'multipart/form-data',
				processData: false,
				contentType: false,
				cache: false,
				success: async function (result) {
					if (!result.sess && typeof result.sess != "undefined") {
						alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
						return;
					}
					if (result.IO.Result == 0 || result.IO.Result == 1) {
						await Swal.fire({
							icon: 'success',
							title: '성공',
							text: result.IO.Message,
						});
						await edsEdms.removeSubmitFile(dropzeneRemoveFile);
						dropzeneRemoveFile=null;//dropzone reset
						if(typeof btnEvent === 'function')btnEvent('close');
						//await doAction(sheetName, "search");
					} else {
						await Swal.fire({
							icon: 'error',
							title: '실패',
							text: result.IO.Message,
						});
					}
				},
				error: function () {
					toastrmessage("toast-bottom-center"
							, "warning"
							, "파일이 없습니다.", "잘못된 저장", 1500);
				}
			});
			
	},
	"deleteSubmitList": async function (param) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		// 적용 닫기]selectEst
		//빈값체크//
		return await new Promise(async (resolve, reject) => { Swal.fire({
			title: "문서를 삭제하시겠습니까?",
			showCancelButton: true,
			confirmButtonText: "네",
			cancelButtonText: `아니오`,
		}). then(async (result) => {
		if (result.isConfirmed) {
				await $.ajax({
					url: "/EDMS_SUBMIT_LIST/deleteSubmitList",
					headers: {
						'X-Requested-With': 'XMLHttpRequest'
					},
					dataType: "json",
					contentType: "application/json; charset=UTF-8",
					type: "POST",
					async: false,
					data: JSON.stringify({data:param}),
					success: function(result){
						// console.log(result.ajax);
						if (!result.sess && typeof result.sess != "undefined") {
							alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
							returnfalse;
						}
						if (result.IO.Result == 0 || result.IO.Result == 1) {
							Swal.fire({
								icon: 'success',
								title: '성공',
								text: "문서가 삭제되었습니다.",
							});
							resolve(true);
						} else {
							Swal.fire({
								icon: 'error',
								title: '실패',
								text: result.IO.Message,
							});
							resolve(false);
						}
					}
				});
			}
			else
			{
				resolve(false);
			}
		});
	});
		
	},
	"approveSubmit": async function (param) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		// 적용 닫기]selectEst
		//빈값체크//
		
		await $.ajax({
			url: "/EDMS_SUBMIT_LIST/approveSubmitList",
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify({data:param}),
			success:async function(result){
				// console.log(result.ajax);
				if (!result.sess && typeof result.sess != "undefined") {
					alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
					returnfalse;
				}
				if (result.IO.Result == 0 || result.IO.Result == 1) {
					await Swal.fire({
						icon: 'success',
						title: '성공',
						text: "문서가 승인되었습니다.",
					});
					if(typeof btnEvent === 'function')btnEvent('close');
					return true;
				} else {
					await Swal.fire({
						icon: 'error',
						title: '실패',
						text: result.IO.Message,
					});
					return false;
				}
			}
		});
	},
	"ccConfirmSubmit": async function (param) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		return await new Promise(async (resolve, reject) => {
		$.ajax({
			url: "/EDMS_SUBMIT_LIST/ccConfirmList",
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify({data:param}),
			success: function(result){
				// console.log(result.ajax);
				if (!result.sess && typeof result.sess != "undefined") {
					alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
					resolve(false);
				}
				if (result.IO.Result == 0 || result.IO.Result == 1) {
					Swal.fire({
						icon: 'success',
						title: '성공',
						text: "문서가 확인되었습니다.",
					});
					resolve(true);
				} else {
					Swal.fire({
						icon: 'error',
						title: '실패',
						text: result.IO.Message,
					});
					resolve(false);
				}
			}
		});
		});
	},
	"approveConfirmSubmit": async function (param) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		let paramList=[param];
		await $.ajax({
			url: "/EDMS_SUBMIT_LIST/approveConfirmList",
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify({data:paramList}),
			success:async function(result){
				// console.log(result.ajax);
				if (!result.sess && typeof result.sess != "undefined") {
					alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
					return;
				}
				if (result.IO.Result == 0 || result.IO.Result == 1) {
					await Swal.fire({
						icon: 'success',
						title: '성공',
						text: "문서가 반려되었습니다.",
					});
					if(typeof btnEvent === 'function')btnEvent('close');
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
	"declineSubmit": async function (param) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		let paramList=[param];
		await $.ajax({
			url: "/EDMS_SUBMIT_LIST/declineList",
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify({data:paramList}),
			success: async function(result){
				// console.log(result.ajax);
				if (!result.sess && typeof result.sess != "undefined") {
					alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
					return;
				}
				if (result.IO.Result == 0 || result.IO.Result == 1) {
					await Swal.fire({
						icon: 'success',
						title: '성공',
						text: "문서가 반려되었습니다.",
					});
					if(typeof btnEvent === 'function')btnEvent('close');
				} else {
					await Swal.fire({
						icon: 'error',
						title: '실패',
						text: result.IO.Message,
					});
				}
			}
		});
	},
	"canncelSubmit": async function (param) {
		/**
		 * 필수값: popupHandler함수 호출한 name이 자식 iframe에 데이터가 있어야함*/
		$.ajax({
			url: "/EDMS_SUBMIT_LIST/cancelList",
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify({data:param}),
			success: function(result){
				// console.log(result.ajax);
				if (!result.sess && typeof result.sess != "undefined") {
					alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
					return;
				}
				if (result.IO.Result == 0 || result.IO.Result == 1) {
					Swal.fire({
						icon: 'success',
						title: '성공',
						text: "상신내역이 취소되었습니다. 취소한 문서는 임시문서 함에 저장되었습니다.",
					});
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
	"messageSubmit": async function (param) {
		let paramList=[param];
		await $.ajax({
			url: "/EDMS_SUBMIT_LIST/cudMessageList",
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify({data:paramList}),
			success: function(result){
				// console.log(result.ajax);
				if (!result.sess && typeof result.sess != "undefined") {
					alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
					return;
				}
				if (result.IO.Result == 0 || result.IO.Result == 1) {
					Swal.fire({
						icon: 'success',
						title: '성공',
						text: "성공적으로 저장되었습니다. ",
					});
					return true;
				} else {
					Swal.fire({
						icon: 'error',
						title: '실패',
						text: result.IO.Message,
					});
					return false;
				}
			}
		});
		
	},
    "removeSubmitFile": async function (removFile) {
		/**
		 * 필수값:dropzeneRemoveFile 삭제정보저장*/
		// 적용 닫기
		//빈값체크
        console.log(removFile);
        var paramData=[];
		var removeData=removFile;
		for(const files of removeData)
		{
			let data={};
			data.saveRoot=files.saveRoot;
			data.seq=files.seq;
			data.submitCd=document.getElementById("submitCd").value;
			data.corpCd=document.getElementById("corpCd").value;
			data.busiCd=document.getElementById("busiCd").value;
			paramData.push(data);
		}
		if(paramData.length>0)
		await $.ajax({
			url: "/EDMS_SUBMIT_LIST/EdmsfileDelete",
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify(paramData),
			success: function(result){
				// console.log(result.ajax);
				if (!result.sess && typeof result.sess != "undefined") {
					alert("세션이 종료되었습니다. 다시 로그인 해주세요.");
					return;
				}
				if (result.IO.Result == 0 || result.IO.Result == 1) {
					Swal.fire({
						icon: 'success',
						title: '성공',
						text: "성공적으로 저장되었습니다. ",
					});
					return true;
				} else {
					Swal.fire({
						icon: 'error',
						title: '실패',
						text: result.IO.Message,
					});
					return false;
				}
			}
		}); 
	},
    "selectSubmit": async function (itemForm) {
		/**
		 * 필수값: */
		// 적용 닫기]
		//빈값체크
		const searchParam= ut.serializeObject(itemForm); //조회조건
		let url="";
		if(searchParam.docDivi=='03')
		{
			url="/EDMS_EXPENSE_REPORT/selectExpenseList"
		}
		else if (searchParam.docDivi=='01' || searchParam.docDivi=='02'||searchParam.docDivi=='05'||searchParam.docDivi=='11')
		{
			url="/EDMS_EST_REPORT/selectEstList"
		}
		else
		{
			url="/EDMS_EDIT_REPORT/selectEditList"
		}
		const data=await edsUtil.getAjax(url, searchParam);
		
		if(data.length>0)
		{
			let param={};
			param.data=data[0];
			param.form=itemForm;
			await edsUtil.eds_dataToForm(param);
			return true;
		}
		else
		{
			return false;
		}

	},
	"selectEdmsDoc": async function (param,itemForm) {
		/**
		 * 필수값: */
		// 적용 닫기]
		//빈값체크
		const data=await edsUtil.getAjax("/EDMS_EST_REPORT/selectEstList", param);
		param.data=data[0];
		param.form=itemForm;
		await edsUtil.eds_dataToForm(param);
	},
    "selectSubmitFileList": async function (itemForm) {
		/**
		 * 필수값:dropzeneRemoveFile 삭제정보저장*/
		// 적용 닫기]
		//빈값체크
		var param = ut.serializeObject(itemForm); //조회조건
		var test =edsUtil.getAjax("/EDMS_SUBMIT_LIST/selectEdmsFileList", param); // 데이터 set
		for(file of test)
		{	
			const corpCd = file.corpCd;//회사코드               
    		const saveNm = file.saveNm;//저장명
    		const ext = file.ext;//확장자
    		const params = corpCd+","+saveNm+","+ext;            
			let mockFile = { name: file.origNm+"."+file.ext, size: file.size ,seq:file.seq,saveRoot:file.saveRoot};
			console.log(ext.indexOf("xls"))
			let url="/EDMS_SUBMIT_LIST/Edmsfileload/"+params;
			if (ext == "pdf") {
				url= "/img/fileImage/pdfimg.jpg";
			} else if (ext.indexOf("doc") != -1) {
				url= "/img/fileImage/wordimg.jpg";
			} else if (ext.indexOf("xls") != -1) {
				console.log('12321');
				url= "/img/fileImage/exclimg.jpg";
			}else if (ext.indexOf("hwp") != -1) {
				console.log(';etet')
				url= "/img/fileImage/hwpimg.jpg";
			}
			dropzone.displayExistingFile(mockFile, url);
		}
	},
	"addReadOnly": async function (itemForm) {
		/**
		 * 필수값:dropzeneRemoveFile 삭제정보저장*/
		// 적용 닫기]
		//빈값체크
		var param = ut.serializeObject(itemForm); //조회조건
		var test =edsUtil.getAjax("/EDMS_SUBMIT_LIST/selectEdmsFileList", param); // 데이터 set
		for(file of test)
		{	
			const corpCd = file.corpCd;//회사코드               
    		const saveNm = file.saveNm;//저장명
    		const ext = file.ext;;//확장자
    		const params = corpCd+","+saveNm+","+ext;            
			let mockFile = { name: file.origNm+"."+file.ext, size: file.size ,seq:file.seq,saveRoot:file.saveRoot};
			dropzone.displayExistingFile(mockFile, "/EDMS_SUBMIT_LIST/Edmsfileload/"+params);
		}
	},
	"validateCheck": async function (grid) {
		// 유효성 검사
		var validate = await grid.validate();
		for(var i=0; i<validate.length; i++) {
			if(validate[i].errors.length != 0) {
				for (var r = 0; r < validate[i].errors.length; r++) {
					if (validate[i].errors[r].errorCode == "REQUIRED") {
						await grid.focus(validate[i].rowKey,validate[i].errors[r].columnName); // 빈 필수 값 포커스
						alert('필수값을 입력해 주세요.')
						return false;
					}
				}
			}
		}
		return true;
	},
	"selectMessageData": async function ()
	{
		let param = await ut.serializeObject(document.querySelector("#edmsGridItemForm")); //조회조건
		let messageData = edsUtil.getAjax("/EDMS_SUBMIT_LIST/selectEdmsMessageList", param); // 데이터 set
		let messagebox=document.getElementById('messageBox');
		let tempMessage=''
		for(const data of messageData)
		{
			let roots = data.corpCd+":"+data.approverCd;
			let el=`
			<div class="card-comment">
				<img class="img-circle img-sm" src="`+"/BASE_USER_MGT_LIST/selectUserFaceImageEdms/" + roots+`" alt="User Image">
				<div class="comment-text">
			  		<span class="username">
					`+data.empNm+`
					<span class="text-muted float-right">`+data.inpDttm+` 											
				  		<button type="button" class="btn btn-tool" data-card-widget="remove" seq="`+data.seq+`" corpCd="`+data.corpCd+`"approverCd="`+data.approverCd+`" onclick="edsEdms.removeMessage(this)" >
							<i class="fas fa-times"></i>
				  		</button>
					</span>
			  		</span>
					`+data.message+`
				</div>
		  	</div>`
			  tempMessage+=el;

		}
		messagebox.innerHTML=tempMessage;
	},
	"initMessage": async function (message)
	{
		let param={};
		param.status="C"
		param.message=message.value;
		param.submitCd=document.getElementById('submitCd').value
		param.inpId =document.getElementById('inpId').value
		param.submitNm=document.getElementById('submitNm').value;
		let check=await edsEdms.messageSubmit(param);
		await this.selectMessageData();
		message.value='';

	},
	"removeMessage": async function (btn)
	{
		let param={};
		param.status="D"
		param.corpCd=btn.getAttribute ('corpCd');
		param.submitCd=document.getElementById('submitCd').value
		param.seq=btn.getAttribute ('seq');
		param.approverCd=btn.getAttribute ('approverCd');
		let check=await edsEdms.messageSubmit(param);
		await this.selectMessageData();
	},
	"slideEvent": async function ()
	{
		/* 슬라이드 이벤트*/
		const slider = document.querySelector(".wrapper");
    	const preventClick = (e) => {
    	  e.preventDefault();
    	  e.stopImmediatePropagation();
    	}
    	let isDown = false;
    	var isDragged = false;
    	let startX;
    	let scrollLeft;
    	slider.addEventListener("mousedown", e => {
    	  isDown = true;
    	  slider.classList.add("active");
    	  startX = e.pageX - slider.offsetLeft;
    	  scrollLeft = slider.scrollLeft;
    	});
    	slider.addEventListener("mouseleave", () => {
    	  isDown = false;
    	  slider.classList.remove("active");
    	});
    	slider.addEventListener("mouseup", e => {
    	  isDown = false;
    	  const elements = document.getElementsByClassName("test");
    	  if(isDragged){
    	      for(let i = 0; i<elements.length; i++){
    	            elements[i].addEventListener("click", preventClick);
    	      }
    	  }else{
    	      for(let i = 0; i<elements.length; i++){
    	            elements[i].removeEventListener("click", preventClick);
    	      }
    	  }
    	  slider.classList.remove("active");
    	  isDragged = false;
    	});
    	slider.addEventListener("mousemove", e => {
    	  if (!isDown) return;
    	  isDragged =  true;
    	  e.preventDefault();
    	  const x = e.pageX - slider.offsetLeft;
    	  const walk = (x - startX) * 1;
    	  slider.scrollLeft = scrollLeft - walk;
    	});
	}

};