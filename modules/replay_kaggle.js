"use strict";

const {command_is_for_unit, command_is_for_house, make_frame} = require("./replay_utils");


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

	// Note all of our "get" methods return completely new objects and so
	// should never be identity-compared with each other.

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
		return actions0.concat(actions1);
	},

	get_orders_for_unit(i, id) {
		let list = this.get_all_commands(i);
		list = list.filter(c => command_is_for_unit(c, id));
		return list.join(", ");
	},

	get_direction_for_unit(i, id) {
		let list = this.get_all_commands(i);
		list = list.filter(c => command_is_for_unit(c, id));
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
		list = list.filter(c => command_is_for_house(c, x, y));
		return list.join(", ");
	},

	get_units_at(i, x, y) {
		return this.get_units(i).filter(u => u.x === x && u.y === y);
	},

	get_house_at(i, x, y) {
		return this.get_houses(i).filter(h => h.x === x && h.y === y)[0];
	},

	get_unit_by_id(i, id) {
		return this.get_units(i).filter(u => u.id === id)[0];
	},
};

// ------------------------------------------------------------------------------------------------

module.exports = fixed_kaggle_replay;
