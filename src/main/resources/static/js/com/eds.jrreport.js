var jr = {
	/*
	* JasperReports Popup
	* @param
	* */
	"open":function (param, jrxml){
		var $form = $("<form></form>");
		var url = "/eds/rain/api/print/"+jrxml;
		var wid = "1280";
		var hit = "800";

		window.open("", "reportPopup", "width=" + wid + ", height=" + hit + ", top=150,left=150, scrollbars=yes,resizable=yes");

		$form.attr("action", url);
		$form.attr("method", "post");
		$form.attr("target", "reportPopup");
		$form.appendTo('body');

		$form.append("<input type='hidden' value='" + JSON.stringify({data:param}) + "' name='param' id='param'>");
		$form.submit();
	},
	/*
	* JasperReports Barcode Print
	* @param
	* */
	"BarcodePrint":function (param) {
		var data;
		$.ajax({
			url: "/eds/rain/api/barcodePrint",
			dataType: "json",
			contentType: "application/json; charset=UTF-8",
			type: "POST",
			async: false,
			data: JSON.stringify(param),
			success: function(result){
				data = result;
			}
		});
		return data.data;
	}
};

