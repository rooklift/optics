"use strict";

const utils = require("./utils");


function fixed_kaggle_replay(raw_replay) {
	let ret = {r: raw_replay, frames: []};
	Object.assign(ret, kaggle_replay_props);
	for (let step of ret.r.steps) {
		ret.frames.push(make_frame(ret.width(), ret.height(), step[0].observation.updates));
	}
	return ret;
}

let kaggle_replay_props = {

	// Note all of our "get" methods return completely new objects and so
	// should never be identity-compared with each other.

	version() {
		return this.r.version;
	},

	seed() {
		return this.r.configuration.seed;
	},

	width() {
		return this.r.steps[0][0].observation.width;
	},

	height() {
		return this.r.steps[0][0].observation.height;
	},

	length() {
		return this.r.steps.length;
	},

	get_cell(i, x, y) {
		return Object.assign({}, this.frames[i].map[x][y]);
	},

	get_units(i) {
		return this.frames[i].units.map(unit => Object.assign({}, unit));
	},

	get_houses(i) {
		return this.frames[i].houses.map(house => Object.assign({}, house));
	},

	get_cities(i) {
		return this.frames[i].cities.map(city => Object.assign({}, city));
	},

	get_remaining_resources(i) {
		let ret = {wood: 0, coal: 0, uranium: 0};
		for (let x = 0; x < this.width(); x++) {
			for (let y = 0; y < this.height(); y++) {
				let cell = this.get_cell(i, x, y);
				if (cell.type) {
					ret[cell.type] += cell.amount;
				}
			}
		}
		return ret;
	},

	get_research(i, team) {
		return this.frames[i].rp[team];
	},

	get_team_ids() {
		return [0, 1];		// I guess.
	},

	get_bot_name(team) {
		return this.r.info.TeamNames[team];
	},

	get_all_commands(i) {
		if (i + 1 >= this.length()) {
			return [];
		}
		let actions0 = this.r.steps[i + 1][0].action;
		let actions1 = this.r.steps[i + 1][1].action;
		if (!actions0) actions0 = [];
		if (!actions1) actions1 = [];
		return actions0.concat(actions1);
	},

	get_orders_for_unit(i, id) {
		let list = this.get_all_commands(i);
		list = list.filter(c => utils.command_is_for_unit(c, id));
		return list.join(", ");
	},

	get_direction_for_unit(i, id) {
		let list = this.get_all_commands(i);
		list = list.filter(c => utils.command_is_for_unit(c, id));
		if (list.length === 1) {
			let c = list[0].trim();
			if (c.startsWith("m ")) {
				return c[c.length - 1];
			}
		}
		return "";
	},

	get_orders_for_house(i, x, y) {
		let list = this.get_all_commands(i);
		list = list.filter(c => utils.command_is_for_house(c, x, y));
		return list.join(", ");
	},

	get_units_at(i, x, y) {
		return this.get_units(i).filter(u => u.x === x && u.y === y);
	},

	get_house_at(i, x, y) {
		return this.get_houses(i).find(h => h.x === x && h.y === y);
	},

	get_unit_by_id(i, id) {
		return this.get_units(i).find(u => u.id === id);
	},

	get_city_by_id(i, id) {
		return this.get_cities(i).find(c => c.id === id);
	},

	get_annotations(i) {
		return [];				// Not implemented.
	}
};

// ------------------------------------------------------------------------------------------------

function make_frame(width, height, updates) {

	let frame = {};

	frame.map = [];
	frame.rp = [0, 0];
	frame.units = [];
	frame.houses = [];
	frame.cities = [];

	for (let x = 0; x < width; x++) {
		frame.map.push([]);
		for (let y = 0; y < height; y++) {
			frame.map[x].push({
				x: x,
				y: y,
				type: "",
				amount: 0,
				road: 0
			});
		}
	}

	for (let line of updates) {

		let fields = line.split(" ").filter(z => z !== "");

		if (fields[0] === "rp") {
			let team = parseFloat(fields[1]);
			let points = parseFloat(fields[2]);
			frame.rp[team] = points;
		}

		if (fields[0] === "r") {
			let type = fields[1];
			let x = parseFloat(fields[2]);
			let y = parseFloat(fields[3]);
			let amount = parseFloat(fields[4]);
			frame.map[x][y].type = amount > 0 ? type : "";
			frame.map[x][y].amount = amount;
		}

		if (fields[0] === "u") {
			let type = parseFloat(fields[1]);
			let team = parseFloat(fields[2]);
			let id = fields[3];
			let x = parseFloat(fields[4]);
			let y = parseFloat(fields[5]);
			let cd = parseFloat(fields[6]);
			let wood = parseFloat(fields[7]);
			let coal = parseFloat(fields[8]);
			let uranium = parseFloat(fields[9]);
			frame.units.push({type, team, id, x, y, cd, wood, coal, uranium});
		}

		if (fields[0] === "c") {
			let team = parseFloat(fields[1]);
			let id = fields[2];
			let fuel = parseFloat(fields[3]);
			let upkeep = parseFloat(fields[4]);
			frame.cities.push({team, id, fuel, upkeep});
		}

		if (fields[0] === "ct") {
			let team = parseFloat(fields[1]);
			let id = fields[2];
			let x = parseFloat(fields[3]);
			let y = parseFloat(fields[4]);
			let cd = parseFloat(fields[5]);
			frame.houses.push({team, id, x, y, cd});
		}

		if (fields[0] === "ccd") {
			let x = parseFloat(fields[1]);
			let y = parseFloat(fields[2]);
			let road = parseFloat(fields[3]);
			frame.map[x][y].road = road;
		}
	}

	return frame;
}

// ------------------------------------------------------------------------------------------------

module.exports = fixed_kaggle_replay;
