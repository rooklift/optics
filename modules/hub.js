"use strict";

const fs = require("fs");
const {ipcRenderer} = require("electron");

const {defaults_classified} = require("./config_io");
const new_buffer_line_reader = require("./buffer_line_reader");
const new_frame = require("./frame");

exports.new_hub = function() {

	let hub = Object.create(hub_props);

	hub.frames = [];
	hub.index = 0;

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

	load: function(filepath) {

		if (filepath === __dirname || filepath === ".") {		// Can happen when extra args are passed to main process. Silently return.
			return;
		}
		if (fs.existsSync(filepath) === false) {				// Can happen when extra args are passed to main process. Silently return.
			return;
		}

		let buf = fs.readFileSync(filepath);

		let reader = new_buffer_line_reader(buf);

		let lineno = -1;
		let team = null;
		let width = null;
		let height = null;

		let frames = [];

		while (true) {

			let line = reader.next();

			if (line === "") {
				break;
			}

			lineno++;

			let fields = line.trim().split(" ").filter(z => z !== "");

			if (lineno === 0) {
				team = parseInt(fields[0], 10);
				continue;
			}

			if (lineno === 1) {
				width = parseInt(fields[0], 10);
				height = parseInt(fields[1], 10);
				frames.push(new_frame(width, height));
				continue;
			}

			if (fields[0] === ">") {
				continue;
			}

			if (fields[0] === "D_DONE")	{		// Engine finished sending frame
				frames.push(new_frame(width, height));
				continue;
			}

			frames[frames.length - 1].parse(fields);
		}

		this.frames = frames;
		this.index = 0;

		this.draw();
	},

};
