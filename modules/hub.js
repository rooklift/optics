"use strict";

const fs = require("fs");
const path = require("path");
const {ipcRenderer} = require("electron");

const {defaults_classified} = require("./config_io");
const new_buffer_line_reader = require("./buffer_line_reader");
const add_replay_methods = require("./replay");

const colours = ["#ffcc66ff", "#00ccffff"];

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

		this.canvas.height = window.innerHeight;
		this.canvas.width = window.innerWidth - 300;

		if (!this.replay) {
			return;
		}

		let height = this.replay.height();
		let width = this.replay.width();

		let ctx = this.canvas.getContext("2d");

		let foo = canvas.width / width;					// I couldn't think
		let bar = canvas.height / height;				// of a good name.

		let cell_size = Math.floor(Math.min(foo, bar));

		ctx.fillStyle = "#333333ff";
		ctx.fillRect(0, 0, width * cell_size, height * cell_size);

		// Resources...

		for (let x = 0; x < width; x++) {

			for (let y = 0; y < height; y++) {

				let cell = this.replay.get_cell(this.index, x, y);

				if (cell.resource) {
					if (cell.resource.type === "wood" && cell.resource.amount > 0) {
						ctx.fillStyle = "#33aa33ff";
						ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
					}
					if (cell.resource.type === "coal" && cell.resource.amount > 0) {
						ctx.fillStyle = "#999999ff";
						ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
					}
					if (cell.resource.type === "uranium" && cell.resource.amount > 0) {
						ctx.fillStyle = "#66ccccff";
						ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
					}
				}
			}
		}

		this.infodiv.innerHTML = `Turn ${this.index}`;
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
