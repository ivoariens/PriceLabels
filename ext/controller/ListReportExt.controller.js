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
	printInstance: function (oParameters) {
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
	handlePrintSelected: function (oEvent) {
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
							press: function (oSelected) {
								this.printSelected(oSelected);
								this.oDefaultDialog.close();
							}.bind(this)
						})
					}
				}),
				endButton: new sap.m.Button({
					text: "Close",
					press: function () {
						this.oDefaultDialog.close();
					}.bind(this)
				})
			});

			// to get access to the controller's model
			this.getView().addDependent(this.oDefaultDialog);
		}

		this.oDefaultDialog.open();
	},
	printSelected: function (oSelected) {
		this.selectedPrinter = oSelected.getSource().getValue();
		this.oStandardoDataModel.setDeferredGroups(["PrintlabelListBatch"]);
		this.listReportSmartTable.getTable().getSelectedContextPaths().forEach(
			function (context) {

				this.getView().getModel().read(context, {
					success: function (oData) {

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
			success: function (oData, oResponse) {
				if (Array.isArray(oData.__batchResponses)) {
					var errors = oData.__batchResponses.filter(function (msg) {
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
			error: function (oError) {
				sap.m.MessageToast.show("Error");
			}
		});
	},
	handlePrintAll: function (oEvent) {},
	onBeforeRebindTableExtension: function (oEvent) {
		if (this.listReportSmartTable === undefined) {
			var oID = oEvent.getSource().getId();
			this.listReportSmartTable = this.getView().byId(oID);
			this.listReportSmartTable.getTable().setMode("MultiSelect");
		}
		this.getView().getModel("SAPRSPL").getMetadata();
		this.oStandardoDataModel = this.getView().getModel("SAPRSPL");
		this.oStandardoDataModel.attachMetadataLoaded(function () {
			sap.m.MessageToast("Service loaded");
		});
		JsBarcode(".barcode").init();
		setInterval(function () {
			JsBarcode(".barcode").init();
		}, 1000);
	},
	createPrintRequest: function (oParameters) {
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
	barCodeFormatter: function (EAN11) {
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
	handlePrintList: function (oEvent) {
		//this print data model i have created on filtering the data, in similar way or any other method you to get the data required for print in a array like below
		// var getModel = this.listReportSmartTable.getTable().getSelectedContextPaths();
		var getModel = this.listReportSmartTable.getTable().getSelectedItems();
		// the below line will pass the collected print data into the function which we have created for printing the report
		this.printLayoutCreator(getModel);
	},
	printLayoutCreator: function (path) {
		var totcnt;
        
        var borderStyle = "border: 0.1px solid black;";
        var baseStyle = "font-family: calibri; font-size: 11px; text-align: left;" + borderStyle;
        var tableHeader =  baseStyle + "font-weight: bold;";
        var tableContentStyle = baseStyle;

        var tableStartPart = "<table class='table' style='"+borderStyle+" width: 1000px;'>";
		var tableColumnsPart =
			"<tr>" +
			"<th style='"+tableHeader+"'>Brand name</th>" +
			"<th style='"+tableHeader+"'>EAN/UPC</th>" +
			"<th style='"+tableHeader+"'>Material</th>" +
			"<th style='"+tableHeader+"'>Material Description</th>" +
			"<th style='"+tableHeader+"'>Department</th>" +
			"<th style='"+tableHeader+"'>Stock Quantity</th>" +
			"<th style='"+tableHeader+"'>Net Price</th>" +
			"<th style='"+tableHeader+"'>Plant</th>" +
			"<th style='"+tableHeader+"'>Old Price</th>" +
			"<th style='"+tableHeader+"'>Start date of price</th>" +
			"</tr>";

        var tableContentPart = "";
		for (totcnt = 0; totcnt <= path.length - 1; totcnt++) {
			var row = path[totcnt];

            var cells = row.getCells();
			var cell = cells[0];
			cell = cells[2];
			var col03 = cell.getText(); //Brand name
			cell = cells[3];
			var col04 = cell.getText(); // EAN/UPC
			cell = cells[4];
			var col05 = cell.getText(); // Material
			cell = cells[5];
			var col06 = cell.getText(); // Material description
			cell = cells[6];
			var col07 = cell.getText(); // Department
			cell = cells[7];
			var col08 = cell.getText().replace(/ /g,''); // Stock quantity
			cell = cells[8];
			var col09 = cell.getText().replace(/ /g,''); // New price
			cell = cells[9];
			var col10 = cell.getText().replace(/ /g,''); // Plant
			cell = cells[10];
			var col11 = cell.getText().replace(/ /g,''); // Old price
			cell = cells[11];
			var col12 = cell.getText().replace(/ /g,''); // Start date of price
			cell = cells[12];

		    var tableRow =
				"<tr style='"+tableContentStyle+"'>" +
				"<td style='"+tableContentStyle+"'>" + col03 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col04 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col05 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col06 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col07 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col08 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col09 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col10 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col11 + "</td>" +
				"<td style='"+tableContentStyle+"'>" + col12 + "</td>" +
				"</tr>";

			tableContentPart += tableRow;
		}		    

		var tableEndPart = "</table>";
		var ctrlString = "width=500px,height=600px";
		var wind = window.open("", "PrintWindow", ctrlString);
		var tableComplete = tableStartPart + tableColumnsPart + tableContentPart + tableEndPart;

		if (wind !== undefined) {
			wind.document.write(tableComplete);
		}
		// Creating a small time delay so that the layout renders
		setTimeout(function() {
			wind.print();
			wind.close();
		}, 500);
	}
});