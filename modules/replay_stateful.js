"use strict";

const types = require("./types");
const utils = require("./utils");


function fixed_stateful_replay(raw_replay) {
	let ret = {r: raw_replay};
	Object.assign(ret, stateful_replay_props);
	return ret;
}


let stateful_replay_props = {

	// Note all of our "get" methods return completely new objects and so
	// should never be identity-compared with each other.

	version() {
		return this.r.version;
	},

	seed() {
		return this.r.seed;
	},

	width() {
		return this.r.stateful[0].map[0].length;
	},

	height() {
		return this.r.stateful[0].map.length;
	},

	length() {
		return this.r.stateful.length;
	},

	get_cell(i, x, y) {

		let raw_cell = this.r.stateful[i].map[y][x];

		return types.new_cell(
			x,
			y,
			(raw_cell.resource && raw_cell.resource.amount > 0) ? raw_cell.resource.type : "",
			(raw_cell.resource && raw_cell.resource.amount > 0) ? raw_cell.resource.amount : 0,
			raw_cell.road ? raw_cell.road : 0,
		);
	},

	get_units(i) {

		let ret = [];

		for (let team_string of Object.keys(this.r.stateful[i].teamStates)) {

			let team = parseInt(team_string, 10);

			for (let unit_id of Object.keys(this.r.stateful[i].teamStates[team_string].units)) {

				let raw_unit = this.r.stateful[i].teamStates[team_string].units[unit_id];

				ret.push(types.new_unit(
					raw_unit.type,
					team,
					unit_id,
					raw_unit.x,
					raw_unit.y,
					raw_unit.cooldown,
					raw_unit.cargo.wood,
					raw_unit.cargo.coal,
					raw_unit.cargo.uranium,
				));
			}
		}

		return ret;
	},

	get_houses(i) {
		let ret = [];
		for (let raw_city of Object.values(this.r.stateful[i].cities)) {
			for (let raw_house of raw_city.cityCells) {
				ret.push(types.new_house(
					raw_city.team,
					raw_city.id,
					raw_house.x,
					raw_house.y,
					raw_house.cooldown,
				));
			}
		}
		return ret;
	},

	get_cities(i) {
		let ret = [];
		for (let raw_city of Object.values(this.r.stateful[i].cities)) {
			ret.push(types.new_city(
				raw_city.team,
				raw_city.id,
				raw_city.fuel,
				raw_city.lightupkeep,
			));
		}
		return ret;
	},

	get_remaining_resources(i) {
		let ret = types.new_resource_counter();
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
		return this.r.stateful[i].teamStates[team].researchPoints;
	},

	get_team_ids() {
		return Object.keys(this.r.stateful[0].teamStates).map(t => parseInt(t, 10));
	},

	get_bot_name(team) {
		try {
			let fullpath = this.r.teamDetails[team].name;
			fullpath = utils.replace_all(fullpath, "\\", "/");
			if (!fullpath.includes("/")) {
				return fullpath;
			}
			let elements = fullpath.split("/");
			let ret = elements[elements.length - 2];
			if (ret === "" || ret === ".") {
				return fullpath;
			}
			return ret;
		} catch (err) {
			return "Team ??";
		}
	},

	get_all_commands(i) {
		let list = this.r.allCommands[i];
		if (list === undefined) {
			return [];
		}
		return list.map(c => c.command);
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

		// Returns list of {team, type, text, x1, y1, x2, y2} though not all fields are always used.

		let ret = [];
		let raw_list = this.r.allCommands[i];
		if (raw_list === undefined) {
			return ret;
		}
		for (let item of raw_list) {
			let annotation = utils.annotation_object_from_command(item.command, item.agentID);
			if (annotation) {
				ret.push(annotation);
			}
		}
		return ret;
	},
};

// ------------------------------------------------------------------------------------------------

module.exports = fixed_stateful_replay;
