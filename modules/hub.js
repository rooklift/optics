"use strict";

const fs = require("fs");
const path = require("path");
const {ipcRenderer} = require("electron");

const {defaults_classified} = require("./config_io");
const new_buffer_line_reader = require("./buffer_line_reader");
const add_replay_methods = require("./replay");
const draw = require("./draw");

exports.new_hub = function() {

	let hub = Object.create(hub_props);

	hub.replay = null;
	hub.index = 0;
	hub.canvas = document.getElementById("canvas");
	hub.infodiv = document.getElementById("info");

	hub.resize_time = null;

	return hub;
};

let hub_props = {

	set: function(key, value) {

		config[key] = value;

		// Add any followup actions needed for individual keys...

	},

	quit: function() {

		config.width = Math.floor(window.innerWidth * zoomfactor);
		config.height = Math.floor(window.innerHeight * zoomfactor);

		save_config();									// As long as we use the sync save, this will complete before we
		ipcRenderer.send("terminate");					// send "terminate". Not sure about results if that wasn't so.
	},

	load_stateful_replay(filepath) {

		if (filepath === __dirname || filepath === ".") {		// Can happen when extra args are passed to main process. Silently return.
			return;
		}
		if (fs.existsSync(filepath) === false) {				// Can happen when extra args are passed to main process. Silently return.
			return;
		}

		let o;

		try {
			let buf = fs.readFileSync(filepath);
			o = JSON.parse(buf);
		} catch(err) {
			alert(err);
			return;
		}

		if (!o || typeof o !== "object" || o === null) {
			alert("This does not appear to be a stateful replay.");
			return;
		}

		ipcRenderer.send("set_title", path.basename(filepath));
		this.index = 0;
		this.replay = o;
		add_replay_methods(this.replay);

		this.draw();

	},

	draw() {
		draw(this.replay, this.index, this.canvas, this.infodiv);
	},

	backward(n) {
		this.index -= n;
		if (this.index < 0) {
			this.index = 0;
		}
		this.draw();
	},

	forward(n) {
		this.index += n;

		if (this.replay) {
			if (this.index >= this.replay.stateful.length) {
				this.index = this.replay.stateful.length - 1;
			}
		}
		this.draw();
	},

	resize_checker() {
		if (this.resize_time && performance.now() - this.resize_time > 200) {
			this.resize_time = null;
			this.draw();
		}
		setTimeout(this.resize_checker.bind(this), 50);
	},

};
