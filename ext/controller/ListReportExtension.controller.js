sap.ui.define([
'jquery.sap.global',
'sap/m/MessageToast',
'ZSD.MATPRICECHGzsd_matpricechg/ext/model/formatter',
'sap/ui/core/mvc/Controller',
'sap/ui/model/json/JSONModel'
], function(jQuery, MessageToast, Formatter, Controller, JSONModel) {
"use strict";
	var PageController = Controller.extend("ZSD.MATPRICECHGzsd_matpricechg.ext.controller.ListReportExt", {
		formatter: Formatter,
		onInit: function(oEvent){
			sap.ui.getCore().loadLibrary("JsBarcode", "/webapp/lib/JsBarcode");
		},
		oStandardoDataModel:null,
		requestIndex:0,
		listReportSmartTable: undefined,
		printInstance: function(oParameters){
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

			
			if (!this.oDefaultDialog) {
				this.oDefaultDialog = new sap.m.Dialog({
					title: "Available Printers",
					content: new sap.m.List({
						items: {
							path: plantsPath,
							template: new sap.m.DisplayListItem({
								value: "{Printer}",
								type: "Active",
								press: function (oSelected){
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
		printSelected: function(oSelected) {
			this.selectedPrinter = oSelected.getSource().getValue();
			this.oStandardoDataModel.setDeferredGroups(["PrintlabelListBatch"]);
			this.listReportSmartTable.getTable().getSelectedContextPaths().forEach(
				function(context){
					
					this.getView().getModel().read(context,{
					success:function(oData){
						
					var oParameters = {};
					var currentPrice = this.getView().getModel().getProperty(context);

					oParameters.sPrinterID = this.selectedPrinter;
					oParameters.sStoreID = currentPrice.Plant;
					oParameters.NumberOfCopies = parseInt(currentPrice.StockQuantity,10).toString();
					oParameters.sLabelTypeID = currentPrice.PDFFormname;
					oParameters.sGlobalTradeItemNumber = currentPrice.EAN11;
					oParameters.sSalesPrice = currentPrice.NewPrice.replace(/\s/g, "");
					if(oParameters.sSalesPrice === undefined || oParameters.sSalesPrice === ""){
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



					}.bind(this)});
					
					

				}.bind(this));
			//Submitting the function import batch call
			this.oStandardoDataModel.submitChanges({
				batchGroupId: "PrintlabelListBatch", //Same as the batch group id used previously
				success: function (oData,oResponse) {
					var errors = oData.__batchResponses.filter(function(msg){
						var responseObject = msg.hasOwnProperty("response")?JSON.parse(msg.response.body):JSON.parse(msg.__changeResponses[0].body);
						if(responseObject.hasOwnProperty("error")){
							return true;
						}
					});
					if( Array.isArray(errors) && errors.length > 0 ){
						sap.m.MessageBox.error( JSON.parse(errors[0].response.body).error.message.value );
					}else{
						sap.m.MessageToast.show("Prices printed successfully");
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("Error");
				}
			});
		},
		handlePrintAll: function(oEvent) {
			debugger;
		},
        onBeforeRebindTableExtension: function(oEvent) {
            if(this.listReportSmartTable === undefined){
            	var oID = oEvent.getSource().getId();
            	this.listReportSmartTable = this.getView().byId(oID);
				this.listReportSmartTable.getTable().setMode("MultiSelect");
            }
            this.getView().getModel("SAPRSPL").getMetadata();
            this.oStandardoDataModel = this.getView().getModel("SAPRSPL");
            this.oStandardoDataModel.attachMetadataLoaded(function(){ sap.m.MessageToast("Service loaded"); } );
            JsBarcode(".barcode").init();
        },
		createPrintRequest: function(oParameters) {
			var oServiceParameter = {};
			oServiceParameter.groupId = "PrintlabelListBatch";

			//oServiceParameter.sResourcePath = oStandardoDataModel.getResourcePath();
			oServiceParameter.method = "POST";
			oServiceParameter.batchGroupId = "PrintlabelListBatch";
			oServiceParameter.changeSetId =  this.requestIndex++;
			
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
			this.oStandardoDataModel.callFunction("/PrintLabelList",oServiceParameter);	
				
			// try {
			// 	return oStandardoDataModel.callFunction("/PrintLabelList",oServiceParameter);
			// } catch (oErr) {
			// 	throw {
			// 		name: oErr.name,
			// 		message: oErr.message
			// 	};
			// }
		}
		
		
		
		
		
	});
	
	return PageController;
});