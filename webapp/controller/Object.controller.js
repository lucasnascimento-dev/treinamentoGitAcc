sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, History, formatter, MessageBox) {
    "use strict";

    return BaseController.extend("sap.ui5.odata.projectodata3.controller.Object", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
                });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");
        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line fiori-custom/sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        onEdit: function () {
            this.getView().byId("btnCreate").setVisible(false);
            this.getView().byId("btnEdit").setVisible(false);
            this.getView().byId("btnDelete").setVisible(true);
            this.getView().byId("btnSave").setVisible(true);
        },

        onCreate: function () {
            var oCreate = {};
            oCreate.ID = parseInt(this.getView().byId("inId").getValue());
            oCreate.Name = this.getView().byId("inName").getValue();

            var oI18n = this.getView().getModel("i18n").getResourceBundle();
            var msgSuc = oI18n.getText("msgSuc");
            var msgError = oI18n.getText("msgError");
            var msgOb = oI18n.getText("msgOb");

            if (!oCreate.ID) {
                MessageBox.error(msgOb);
                return;
            }

            var that = this; //questão da sincronicidade da função create

            this.getModel().create("/Categories", oCreate, {
                success: function () {
                    MessageBox.success(msgSuc);
                    that.getView().byId("inName").setValue("");
                    that.getView().byId("inId").setValue("");
                }, error: function () {
                    MessageBox.error(msgError);
                }
            });

        },

        onSave: function () {
            var oUpdate = {};
            
            oUpdate.ID = parseInt(this.getView().byId("inId").getValue());
            oUpdate.Name = this.getView().byId("inName").getValue();

            var oI18n = this.getView().getModel("i18n").getResourceBundle();
            var msgSuc = oI18n.getText("msgSuc");
            var msgError = oI18n.getText("msgError");

            var sObjectPath =  this.getModel().createKey("/Categories", {
                ID: oUpdate.ID
            });
            
            var that = this;
            this.getModel().update( sObjectPath, oUpdate, {
                success: function () {
                    MessageBox.success(msgSuc);
                }, error: function () {
                    MessageBox.error(msgError);
                }
            });
        },

        onDelete: function () {
            var oUpdate = {};
            
            oUpdate.ID = parseInt(this.getView().byId("inId").getValue());

            var oI18n = this.getView().getModel("i18n").getResourceBundle();
            var msgSuc = oI18n.getText("msgSuc");
            var msgError = oI18n.getText("msgError");

            var sObjectPath =  this.getModel().createKey("/Categories", {
                ID: oUpdate.ID
            });
            
            this.getModel().remove( sObjectPath, {
                success: function () {
                    MessageBox.success(msgSuc, {
                        onClose: function() {
                            window.history.back();
                        }
                    });
                }, error: function () {
                    MessageBox.error(msgError);
                }
            });
        },


        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched : function (oEvent) {
            var sObjectId =  oEvent.getParameter("arguments").objectId;
            var oViewModel = this.getModel("objectView")
            this.getModel().setUseBatch(false);

            if (sObjectId === "new") {
                this.getView().byId("inId").setValue("");
                this.getView().byId("inName").setValue("");

                this.getView().byId("inId").setEditable(true);
                this.getView().byId("inName").setEditable(true);

                this.getView().byId("btnCreate").setVisible(true);
                this.getView().byId("btnEdit").setVisible(false);
                this.getView().byId("btnDelete").setVisible(false);
                this.getView().byId("btnSave").setVisible(false);

                oViewModel.setProperty("/busy", false)
            } else {

                this.getView().byId("inId").setEditable(false);
                this.getView().byId("inName").setEditable(true);

                this.getView().byId("btnCreate").setVisible(false);
                this.getView().byId("btnEdit").setVisible(true);
                this.getView().byId("btnDelete").setVisible(false);
                this.getView().byId("btnSave").setVisible(false);
                this._bindView("/Categories" + sObjectId);   
            }

        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView : function (sObjectPath) {
            var oViewModel = this.getModel("objectView");

            this.getView().bindElement({
                path: sObjectPath,
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },

        _onBindingChange : function () {
            var oView = this.getView(),
                oViewModel = this.getModel("objectView"),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }

            var oResourceBundle = this.getResourceBundle(),
                oObject = oView.getBindingContext().getObject(),
                sObjectId = oObject.Name,
                sObjectName = oObject.Categories;

                oViewModel.setProperty("/busy", false);
                oViewModel.setProperty("/shareSendEmailSubject",
                    oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
                oViewModel.setProperty("/shareSendEmailMessage",
                    oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        }
    });

});
