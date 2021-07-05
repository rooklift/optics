"use strict";

function add_replay_methods(o) {
	Object.assign(o, replay_props);
}

let replay_props = {

	// Note all of our "get" methods return completely new objects and so
	// should never be identity-compared with each other.

	width() {
		return this.stateful[0].map[0].length;
	},

	height() {
		return this.stateful[0].map.length;
	},

	get_cell(i, x, y) {

		let cell = this.stateful[i].map[y][x];

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

		for (let team_string of Object.keys(this.stateful[i].teamStates)) {

			let team = parseInt(team_string, 10);

			for (let unit_id of Object.keys(this.stateful[i].teamStates[team_string].units)) {

				let unit = this.stateful[i].teamStates[team_string].units[unit_id];

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
		for (let city of Object.values(this.stateful[i].cities)) {
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
		for (let city of Object.values(this.stateful[i].cities)) {
			ret.push({
				team: city.team,
				id: city.id,
				fuel: city.fuel,
				upkeep: city.lightupkeep,
			});
		}
		return ret;
	},

	get_research(i, team) {
		return this.stateful[i].teamStates[team].researchPoints;
	},

	get_team_ids() {
		return Object.keys(this.stateful[0].teamStates).map(t => parseInt(t, 10));
	},

	get_bot_name(team) {
		try {
			let fullpath = this.teamDetails[team].name;
			let sep = null;
			if (fullpath.includes("\\")) {
				sep = "\\";
			} else if (fullpath.includes("/")) {
				sep = "/";
			}
			if (sep) {
				let elements = fullpath.split(sep);
				return elements[elements.length - 2];
			} else {
				return fullpath;
			}
		} catch (err) {
			return "Team ??";
		}
	},

	get_orders_for_unit(i, id) {
		let list = this.allCommands[i];
		if (list === undefined) {
			return "";
		}
		list = list.filter(c => command_is_for_unit(c.command, id)).map(c => c.command);
		return list.join(", ");
	},

	get_direction_for_unit(i, id) {
		let list = this.allCommands[i];
		if (list === undefined) {
			return "";
		}
		list = list.filter(c => command_is_for_unit(c.command, id)).map(c => c.command);
		if (list.length === 1) {
			let c = list[0].trim();
			if (c.startsWith("m ")) {
				return c[c.length - 1];
			}
		}
		return "";
	},

	get_orders_for_house(i, x, y) {
		let list = this.allCommands[i];
		if (list === undefined) {
			return "";
		}
		list = list.filter(c => command_is_for_house(c.command, x, y)).map(c => c.command);
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

function command_is_for_unit(s, id) {		// given some command, is it for the unit with this id?

	let fields = s.trim().split(" ").filter(z => z !== "");

	if (["m", "bcity", "p", "t"].includes(fields[0])) {
		return fields[1] === id;
	}

	return false;
}

function command_is_for_house(s, x, y) {	// given some command, is it for the house at [x, y] ?

	let fields = s.trim().split(" ").filter(z => z !== "");

	if (["r", "bw", "bc"].includes(fields[0])) {
		return fields[1] === x.toString() && fields[2] === y.toString();
	}

	return false;
}



module.exports = add_replay_methods;
