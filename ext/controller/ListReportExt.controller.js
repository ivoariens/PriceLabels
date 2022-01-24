/**
 *@Author : Youssef BOUIGUA
 *@Description : ListReport extension controller
 */
//sap.ui.require("ZSD.MATPRICECHGzsd_matpricechg/lib/JsBarcode");

//sap.ui.require("ZSD.MATPRICECHGzsd_matpricechg/ext/model/formatter");

sap.ui.controller("ZSD.MATPRICECHGzsd_matpricechg.ext.controller.ListReportExt", {
	//onInit: function(oEvent){
	//sap.ui.getCore().loadLibrary("JsBarcode", "lib/JsBarcode");
	//},
	oStandardoDataModel: null,
	requestIndex: 0,
	listReportSmartTable: undefined,
	printInstance: function(oParameters) {
		return {
			sGlobalTradeItemNumber: oParameters.sGlobalTradeItemNumber,
			sLabelTypeID: oParameters.sLabelTypeID,
			sPrinterID: oParameters.sPrinterID,
			sStoreID: oParameters.sStoreID,
			NumberOfCopies: oParameters.NumberOfCopies,
			sSalesPrice: oParameters.sSalesPrice,
			sSalesPriceCurrency: oParameters.sSalesPriceCurrency,
			sSalesPriceQuantity: oParameters.sSalesPriceQuantity,
			sSalesQuantityUnitCode: oParameters.sSalesQuantityUnitCode,
			sProductID: oParameters.sProductID
		};

	},
	handlePrintSelected: function(oEvent) {
		var plantsPath = this.listReportSmartTable.getTable().getSelectedContextPaths()[0] + "/toPrinters";
		console.log(plantsPath);

		if (!this.oDefaultDialog) {
			this.oDefaultDialog = new sap.m.Dialog({
				title: "Available Printers",
				content: new sap.m.List({
					items: {
						path: plantsPath,
						template: new sap.m.DisplayListItem({
							value: "{Printer}",
							type: "Active",
							press: function(oSelected) {
								this.printSelected(oSelected);
								this.oDefaultDialog.close();
							}.bind(this)
						})
					}
				}),
				endButton: new sap.m.Button({
					text: "Close",
					press: function() {
						this.oDefaultDialog.close();
					}.bind(this)
				})
			});

			// to get access to the controller's model
			this.getView().addDependent(this.oDefaultDialog);
		}

		this.oDefaultDialog.open();
	},
	printSelected: function(oSelected) {
		this.selectedPrinter = oSelected.getSource().getValue();
		this.oStandardoDataModel.setDeferredGroups(["PrintlabelListBatch"]);
		this.listReportSmartTable.getTable().getSelectedContextPaths().forEach(
			function(context) {

				this.getView().getModel().read(context, {
					success: function(oData) {

						var oParameters = {};
						var currentPrice = this.getView().getModel().getProperty(context);

						oParameters.sPrinterID = this.selectedPrinter;
						oParameters.sStoreID = currentPrice.Plant;
						oParameters.NumberOfCopies = parseInt(currentPrice.StockQuantity, 10).toString();
						oParameters.sLabelTypeID = currentPrice.PDFFormname;
						oParameters.sGlobalTradeItemNumber = currentPrice.EAN11;
						oParameters.sSalesPrice = currentPrice.NewPrice.replace(/\s/g, "");
						if (oParameters.sSalesPrice === undefined || oParameters.sSalesPrice === "") {
							return;
						}
						oParameters.sSalesPriceCurrency = currentPrice.PriceCurrency || "EUR";
						oParameters.sSalesPriceQuantity = "1";
						oParameters.sSalesQuantityUnitCode = currentPrice.UnitOfMeasure || "PC";
						oParameters.sProductID = currentPrice.Matnr;
						this.createPrintRequest({
							sGlobalTradeItemNumber: oParameters.sGlobalTradeItemNumber,
							sLabelTypeID: oParameters.sLabelTypeID,
							sPrinterID: oParameters.sPrinterID,
							sStoreID: oParameters.sStoreID,
							NumberOfCopies: oParameters.NumberOfCopies,
							sSalesPrice: oParameters.sSalesPrice,
							sSalesPriceCurrency: oParameters.sSalesPriceCurrency,
							sSalesPriceQuantity: oParameters.sSalesPriceQuantity,
							sSalesQuantityUnitCode: oParameters.sSalesQuantityUnitCode,
							sProductID: oParameters.sProductID
						});

					}.bind(this)
				});

			}.bind(this));
		//Submitting the function import batch call
		this.oStandardoDataModel.submitChanges({
			batchGroupId: "PrintlabelListBatch", //Same as the batch group id used previously
			success: function(oData, oResponse) {
				if (Array.isArray(oData.__batchResponses)) {
					var errors = oData.__batchResponses.filter(function(msg) {
						var responseObject = msg.hasOwnProperty("response") ? JSON.parse(msg.response.body) : JSON.parse(msg.__changeResponses[0].body);
						if (responseObject.hasOwnProperty("error")) {
							return true;
						}
					});
					if (Array.isArray(errors) && errors.length > 0) {
						sap.m.MessageBox.error(JSON.parse(errors[0].response.body).error.message.value);
					} else {
						sap.m.MessageToast.show("Prices printed successfully");
					}
				}
			}.bind(this),
			error: function(oError) {
				sap.m.MessageToast.show("Error");
			}
		});
	},
	handlePrintAll: function(oEvent) {},
	onBeforeRebindTableExtension: function(oEvent) {
		if (this.listReportSmartTable === undefined) {
			var oID = oEvent.getSource().getId();
			this.listReportSmartTable = this.getView().byId(oID);
			this.listReportSmartTable.getTable().setMode("MultiSelect");
		}
		this.getView().getModel("SAPRSPL").getMetadata();
		this.oStandardoDataModel = this.getView().getModel("SAPRSPL");
		this.oStandardoDataModel.attachMetadataLoaded(function() {
			sap.m.MessageToast("Service loaded");
		});
		JsBarcode(".barcode").init();
		setInterval(function() {
			JsBarcode(".barcode").init();
		}, 1000);
	},
	createPrintRequest: function(oParameters) {
		var oServiceParameter = {};
		oServiceParameter.groupId = "PrintlabelListBatch";

		//oServiceParameter.sResourcePath = oStandardoDataModel.getResourcePath();
		oServiceParameter.method = "POST";
		oServiceParameter.batchGroupId = "PrintlabelListBatch";
		oServiceParameter.changeSetId = this.requestIndex++;

		oServiceParameter.urlParameters = {
			GlobalTradeItemNumber: oParameters.sGlobalTradeItemNumber,
			LabelTypeID: oParameters.sLabelTypeID,
			PrinterID: oParameters.sPrinterID,
			StoreID: oParameters.sStoreID,
			NumberOfCopies: oParameters.NumberOfCopies,
			SalesPrice: oParameters.sSalesPrice,
			SalesPriceCurrency: oParameters.sSalesPriceCurrency,
			SalesPriceQuantity: oParameters.sSalesPriceQuantity,
			SalesQuantityUnitCode: oParameters.sSalesQuantityUnitCode,
			ProductID: oParameters.sProductID
		};

		// oServiceParameter.success = function(oData,context){
		// 	debugger;
		// };

		// oServiceParameter.error = function(oError){
		// 	debugger;
		// };				
		this.oStandardoDataModel.callFunction("/PrintLabelList", oServiceParameter);

		// try {
		// 	return oStandardoDataModel.callFunction("/PrintLabelList",oServiceParameter);
		// } catch (oErr) {
		// 	throw {
		// 		name: oErr.name,
		// 		message: oErr.message
		// 	};
		// }
	},
	barCodeFormatter: function(EAN11) {
		if (EAN11 === null || EAN11 === undefined || EAN11 === "") {
			return "";
		}
		var html = '<svg class="barcode"' +
			'jsbarcode-format="EAN13"' +
			'jsbarcode-value="' + EAN11 +
			'"jsbarcode-textmargin="0"' +
			'jsbarcode-fontoptions="bold">' +
			'</svg>';
		return html;
	},
	handlePrintList: function(oEvent) {
		//this print data model i have created on filtering the data, in similar way or any other method you to get the data required for print in a array like below
		// var getModel = this.listReportSmartTable.getTable().getSelectedContextPaths();
		var getModel = this.listReportSmartTable.getTable().getSelectedItems();
		// the below line will pass the collected print data into the function which we have created for printing the report
		this.printLayoutCreator(getModel);
	},
	printLayoutCreator: function(path) {
		var pageno = 0;
		var totcnt;
		var Table22 =
			"<tr>" +
			"<th style='text-align: left;font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; text-align: left;width: 10%;'>EAN/UPC</th>" +
			"<th style='text-align: left;width:10%; font-size: 11px; font-family: calibri;  text-align: left; '>Material</th>" +
			"<th style='text-align: left;font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; text-align: left;width: 10%;'>Material Description</th>" +
			"<th style='text-align: left;width:10%; font-size: 11px; font-family: calibri;  text-align: left; '>Department</th>" +
			"<th style='text-align: left; font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; text-align: left;width: 10%;'>Stock Quantity</th>" +
			"<th style='text-align: left;width:10%; font-size: 11px; font-family: calibri;  text-align: left; '>Net Price</th>" +
			"<th style='text-align: left;font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; text-align: left;width: 10%;'>Plant</th>" +
			"<th style='text-align: left;width:10%; font-size: 11px; font-family: calibri;  text-align: left; '>Old Price</th>" +
			"<th style='text-align: left;font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; text-align: left;width: 10%;'>Start date of price</th>" +
			"</tr></table><hr>";

		for (totcnt = 0; totcnt <= path.length - 1; totcnt++) {
			var totalPages = path.length;
			var pageno = pageno + 1;
			var test = "";
			// The below If loop is created for adjusting the layout as per the landscape layout adjustments as per the pages that is been aksed to print	 

			if (path.length === 1) {
				var tabless =
					"<br><body><div  style='box-sizing: content-box; width: 1000px; height: 680px; border: 0px solid black;' class='table-responsive'>";

			} else {
				if (totcnt === 0) {
					var tabless =
						"<br><body><div  style='box-sizing: content-box; width: 1000px; height: 711px; border: 0px solid black;' class='table-responsive'>";
				} else if (totcnt === path.length - 1) {
					var tabless =
						"<div  style='box-sizing: content-box; width: 1000px; height: 690px; border: 0px solid black;' class='table-responsive'>";
				} else {
					var tabless =
						"<div  style='box-sizing: content-box; width: 1000px; height: 710; border: 0px solid black;' class='table-responsive'>";
				}
			}

			var Table2 =
				"<div class='table-responsive' style='height:100px;    width: 1000px;'><table class='table' style='border-collapse: collapse; width: 1000px;'>";
			var Table2WithHeader = Table2 + Table22;
			var innerData = path[totcnt].InnerTableArray; // i have a another array data set inside a row in my data
			var cnt;
			// for (cnt = 0; cnt < innerData.length; cnt++) {
			var row = path[totcnt];

			var cells = row.getCells();
			var cell = cells[0];
			var col01 = cell.getContent();
			var cell = cells[1];
			var col02 = cell.getText();
			cell = cells[2];
			var col03 = cell.getText();
			cell = cells[3];
			var col04 = cell.getText();
			cell = cells[4];
			var col05 = cell.getText();
			cell = cells[5];
			var col06 = cell.getText();
			cell = cells[6];
			var col07 = cell.getText();
			cell = cells[7];
			var col08 = cell.getText();
			cell = cells[8];
			var col09 = cell.getText();
			cell = cells[9];
			var col10 = cell.getText();
			// cell = cells[10];
			// var col11 = cell.getText();

			// Blob
			var TempURL = URL.createObjectURL(new Blob([col01], {
				type: 'image/svg+xml'
			}));
			TempURL = TempURL + ".svg";

			// var len = TempURL.length;
			// TempURL = TempURL.substr(5, len);

			// barcode vanaf website
			// TempURL = "https://barcode.tec-it.com/barcode.ashx?data=" +
			//           col02 + 
			//           "&code=EAN13&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&codepage=Default&qunit=Mm&quiet=0&hidehrt=False";

			col01 = '<img src="' + TempURL + '" width=100%></img>';
			// col01 = '<img src="' + col01 + '" width=100%></img>';

			var table3 =
				"<table class='table' style='border-collapse: collapse; width: 1000px;'><tr style='height: 100px'><td style='text-align: left; font-size: 11px; font-family: calibri; width: 10%;'>" +
				col02 +
				"</td><td style='text-align: left;width:10%; font-size: 11px; font-family: calibri;   '>" + col03 +
				"</td>" +
				"<td style='text-align: left;font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; width: 10%;'>" +
				col04 +
				"</td><td style='text-align: left;width:10%; font-size: 11px; font-family: calibri;   '>" + col05 +
				"</td>" +
				"<td style='text-align: left; font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; width: 10%;'>" +
				col06 +
				"</td><td style='text-align: left;width:10%; font-size: 11px; font-family: calibri;   '>" + col07 +
				"</td>" +
				"<td style='text-align: left;font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; width: 10%;'>" +
				col08 +
				"</td><td style='text-align: left;width:10%; font-size: 11px; font-family: calibri;   '>" + col09 +
				"</td>" +
				"<td style='text-align: left; font-size: 11px;font-size: 11px;font-size: 11px;font-family: calibri; width: 10%;'>" +
				col10 +
				// "</td><td style='text-align: left;width:10%; font-size: 11px; font-family: calibri;   '>" + col11 +
				"</td>" +
				"</tr>";

			if (totcnt === 0) {
				Table2 = Table2WithHeader;
			}
			Table2 = Table2 + table3;
			Table2 = Table2 + "</table></div>";

			var ctrlString = "width=500px,height=600px";
			var wind = window.open("", "PrintWindow", ctrlString);
			test = test + tabless + Table2 + "<hr>";
			// test = test + tabless + Table1 +
			// 	Table2 + "<hr>" + Table4;
			if (wind !== undefined) {
				wind.document.write(test);
			}
			// Creating a small time delay so that the layout renders
			if (totcnt === path.length - 1) {
				setTimeout(function() {
					wind.print();
					wind.close();

				}, 500);
			}
		}
	}
});