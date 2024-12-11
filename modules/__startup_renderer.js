"use strict";

const {ipcRenderer, webUtils} = require("electron");		// webUtils might not actually exist, depending on version. Don't use it directly.
const querystring = require("querystring");

const config_io = require("./config_io");
const utils = require("./utils");

const get_path_for_file = (webUtils && webUtils.getPathForFile) ? webUtils.getPathForFile : file => file.path;

config_io.load();
config_io.create_if_needed();

// ------------------------------------------------------------------------------------------------
// Globals, only want a few...

global.alert = (msg) => {
	ipcRenderer.send("alert", utils.stringify(msg));
};

global.zoomfactor = parseFloat(querystring.parse(global.location.search).zoomfactor);
global.config = config_io.config;
global.save_config = config_io.save;
global.hub = require("./hub").new_hub();

// ------------------------------------------------------------------------------------------------
// Things that spin in a loop...

hub.resize_checker();

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

window.addEventListener("resize", (event) => {
	hub.resize_time = performance.now();
});

document.addEventListener("wheel", (event) => {
	if (event.deltaY) {
		if (event.deltaY < 0) hub.backward(1);
		if (event.deltaY > 0) hub.forward(1);
	}
});

window.addEventListener("dragenter", (event) => {		// Necessary to prevent brief flashes of "not allowed" icon.
	event.preventDefault();
});

window.addEventListener("dragover", (event) => {		// Necessary to prevent always having the "not allowed" icon.
	event.preventDefault();
});

window.addEventListener("drop", (event) => {
	event.preventDefault();
	let files = [];
	if (event.dataTransfer && event.dataTransfer.files) {
		for (let file of event.dataTransfer.files) {
			if (get_path_for_file(file)) {
				hub.load_stateful_replay(get_path_for_file(file));
				break;
			}
		}
	}
});

document.getElementById("canvas").addEventListener("mousedown", (event) => {
	event.preventDefault();
	hub.click(event);
});



ipcRenderer.send("renderer_ready", null);
