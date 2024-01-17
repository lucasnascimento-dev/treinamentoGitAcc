/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"sap/ui5/odata/projectodata3/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});