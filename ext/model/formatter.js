sap.ui.define([], function () {
	"use strict";
	return {
		barCodeFormatter: function (EAN11) {
			return "&lt;svg class=&quot;barcode&quot;jsbarcode-format=&quot;upc&quot;jsbarcode-value=&quot;"+
			EAN11 +
			"&quot;jsbarcode-textmargin=&quot;0&quot;jsbarcode-fontoptions=&quot;bold&quot;&gt;&lt;/svg&gt;";
		}
	};
});