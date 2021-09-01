"use strict";

function fixed_kaggle_replay(raw_replay) {

	let ret = {
		r: raw_replay,
		frames: []
	};

	Object.assign(ret, kaggle_replay_props);

	for (let step of ret.r.steps) {
		ret.frames.push(make_frame(ret.width(), ret.height(), step[0].observation.updates));
	}

	return ret;
}

let kaggle_replay_props = {

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
		return this.frames.length;
	},

	get_cell(i, x, y) {

	},

	get_units(i) {

	},

	get_houses(i) {

	},

	get_cities(i) {

	},

	get_remaining_resources(i) {

	},

	get_research(i, team) {

	},

	get_team_ids() {
		return [0, 1];		// I guess.
	},

	get_bot_name(team) {
		return this.r.info.TeamNames[team];
	},

	get_orders_for_unit(i, id) {

	},

	get_direction_for_unit(i, id) {

	},

	get_orders_for_house(i, x, y) {

	},

	get_units_at(i, x, y) {

	},

	get_house_at(i, x, y) {

	},

	get_unit_by_id(i, id) {

	},
};



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
			let team = parseInt(fields[1], 10);
			let points = parseInt(fields[2], 10);
			frame.rp[team] = points;
		}

		if (fields[0] === "r") {
			let type = fields[1];
			let x = parseInt(fields[2], 10);
			let y = parseInt(fields[3], 10);
			let amount = parseInt(fields[4], 10);
			frame.map[x][y].type = amount > 0 ? type : "";
			frame.map[x][y].amount = amount;
		}

		if (fields[0] === "u") {
			let type = ["worker", "cart"][parseInt(fields[1], 10)];
			let team = parseInt(fields[2], 10);
			let id = fields[3];
			let x = parseInt(fields[4], 10);
			let y = parseInt(fields[5], 10);
			let cd = parseInt(fields[6], 10);
			let wood = parseInt(fields[7], 10);
			let coal = parseInt(fields[8], 10);
			let uranium = parseInt(fields[9], 10);
			frame.units.push({type, team, id, x, y, cd, wood, coal, uranium});
		}

		if (fields[0] === "c") {
			let team = parseInt(fields[1], 10);
			let id = fields[2];
			let fuel = parseInt(fields[3], 10);
			let upkeep = parseInt(fields[4], 10);
			frame.cities.push({team, id, fuel, upkeep});
		}

		if (fields[0] === "ct") {
			let team = parseInt(fields[1], 10);
			let id = fields[2];
			let x = parseInt(fields[3], 10);
			let y = parseInt(fields[4], 10);
			let cd = parseInt(fields[5], 10);
			frame.houses.push({team, id, x, y, cd});
		}

		if (fields[0] === "ccd") {
			let x = parseInt(fields[1], 10);
			let y = parseInt(fields[2], 10);
			let road = parseFloat(fields[3]);
			frame.map[x][y].road = road;
		}
	}

	return frame;
}

// ------------------------------------------------------------------------------------------------

module.exports = fixed_kaggle_replay;
