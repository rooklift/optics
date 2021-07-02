"use strict";

const {ipcRenderer} = require("electron");
const querystring = require("querystring");

const config_io = require("./config_io");
const stringify = require("./stringify");

config_io.load();
config_io.create_if_needed();

// ------------------------------------------------------------------------------------------------
// Globals, only want a few...

global.alert = (msg) => {
	ipcRenderer.send("alert", stringify(msg));
};

global.zoomfactor = parseFloat(querystring.parse(global.location.search)["zoomfactor"]);
global.config = config_io.config;
global.save_config = config_io.save;
global.hub = require("./hub").new_hub();

// ------------------------------------------------------------------------------------------------
// Menu handlers...

ipcRenderer.on("set", (event, msg) => {
	hub.set(msg.key, msg.value);
});

ipcRenderer.on("toggle", (event, msg) => {
	hub.set(msg, !config[msg]);
});

ipcRenderer.on("call", (event, msg) => {
	let fn;
	if (typeof msg === "string") {																		// msg is function name
		fn = hub[msg].bind(hub);
	} else if (typeof msg === "object" && typeof msg.fn === "string" && Array.isArray(msg.args)) {		// msg is object with fn and args
		fn = hub[msg.fn].bind(hub, ...msg.args);
	} else {
		console.log("Bad call, msg was...");
		console.log(msg);
	}
	fn();
});

// ------------------------------------------------------------------------------------------------

window.addEventListener("error", (event) => {
	alert("An uncaught exception happened in the renderer process. See the dev console for details. The app might now be in a bad state.");
}, {once: true});