"use strict";

const fs = require("fs");
const path = require("path");
const {ipcRenderer} = require("electron");

const {defaults_classified} = require("./config_io");
const new_buffer_line_reader = require("./buffer_line_reader");
const new_frame = require("./frame");

const colours = ["#ffcc66ff", "#00ccffff"];

exports.new_hub = function() {

	let hub = Object.create(hub_props);

	hub.frames = [];
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

			if (fields[0] === "D_DONE")	{					// Engine finished sending frame
				frames.push(new_frame(width, height));
				continue;
			}

			frames[frames.length - 1].parse(fields);
		}

		this.frames = frames.slice(0, frames.length - 1);	// Delete last frame which wasn't used
		this.index = 0;

		ipcRenderer.send("set_title", path.basename(filepath));

		this.draw();
	},

	draw() {

		this.canvas.height = window.innerHeight;
		this.canvas.width = window.innerWidth - 300;

		let frame = this.frames[this.index];

		if (frame === undefined) {
			return;
		}

		let ctx = this.canvas.getContext("2d");

		let foo = canvas.width / frame.width;				// I couldn't think
		let bar = canvas.height / frame.height;				// of a good name.

		let cell_size = Math.floor(Math.min(foo, bar));

		ctx.fillStyle = "#333333ff";
		ctx.fillRect(0, 0, frame.width * cell_size, frame.height * cell_size);

		// Resources...

		for (let x = 0; x < frame.width; x++) {
			for (let y = 0; y < frame.height; y++) {
				if (frame.map[x][y].type === "wood") {
					ctx.fillStyle = "#33aa33ff";
					ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
				}
				if (frame.map[x][y].type === "coal") {
					ctx.fillStyle = "#999999ff";
					ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
				}
				if (frame.map[x][y].type === "uranium") {
					ctx.fillStyle = "#66ccccff";
					ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
				}
			}
		}

		// Houses...

		for (let house of frame.houses) {
			ctx.fillStyle = colours[house.team];
			ctx.fillRect(house.x * cell_size + 1, house.y * cell_size + 1, cell_size - 2, cell_size - 2);
		}

		// Doods...

		for (let unit of frame.units) {
			ctx.fillStyle = colours[unit.team];
			ctx.strokeStyle = "#000000ff";
			let gx = unit.x * cell_size + (cell_size / 2);
			let gy = unit.y * cell_size + (cell_size / 2);
			ctx.beginPath();
			ctx.arc(gx, gy, cell_size / 2 - 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(gx, gy, cell_size / 2 - 2, 0, 2 * Math.PI);
			ctx.stroke();
		}

		this.infodiv.innerHTML = `Turn ${this.index}`;
	},

	forward(n) {
		this.index += n;
		if (this.index >= this.frames.length) {
			this.index = this.frames.length - 1;
		}
		this.draw();
	},

	backward(n) {
		this.index -= n;
		if (this.index < 0) {
			this.index = 0;
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
