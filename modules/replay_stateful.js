"use strict";

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

		let cell = this.r.stateful[i].map[y][x];

		let ret = {
			x: x,
			y: y,
			type: (cell.resource && cell.resource.amount > 0) ? cell.resource.type : "",
			amount: (cell.resource && cell.resource.amount > 0) ? cell.resource.amount : 0,
			road: cell.road ? cell.road : 0,
		};

		return ret;
	},

	get_units(i) {

		let ret = [];

		for (let team_string of Object.keys(this.r.stateful[i].teamStates)) {

			let team = parseInt(team_string, 10);

			for (let unit_id of Object.keys(this.r.stateful[i].teamStates[team_string].units)) {

				let unit = this.r.stateful[i].teamStates[team_string].units[unit_id];

				ret.push({
					type: unit.type,
					team: team,
					id: unit_id,
					x: unit.x,
					y: unit.y,
					cd: unit.cooldown,
					wood: unit.cargo.wood,
					coal: unit.cargo.coal,
					uranium: unit.cargo.uranium,
				});
			}
		}

		return ret;
	},

	get_houses(i) {
		let ret = [];
		for (let city of Object.values(this.r.stateful[i].cities)) {
			for (let house of city.cityCells) {
				ret.push({
					team: city.team,
					id: city.id,
					x: house.x,
					y: house.y,
					cd: house.cooldown,
				});
			}
		}
		return ret;
	},

	get_cities(i) {
		let ret = [];
		for (let city of Object.values(this.r.stateful[i].cities)) {
			ret.push({
				team: city.team,
				id: city.id,
				fuel: city.fuel,
				upkeep: city.lightupkeep,
			});
		}
		return ret;
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
