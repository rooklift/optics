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

		let c = this.stateful[i].map[y][x];

		let ret = {x, y};
		ret.road = c.road ? c.road : 0;
		ret.type = (c.resource && c.resource.amount > 0) ? c.resource.type : "";
		ret.amount = (c.resource && c.resource.amount > 0) ? c.resource.amount : 0;
		return ret;
	},

	get_units(i) {

		let ret = [];

		for (let team_string of Object.keys(this.stateful[i].teamStates)) {

			let team = parseInt(team_string, 10);

			for (let unit_id of Object.keys(this.stateful[i].teamStates[team_string].units)) {

				let foo = this.stateful[i].teamStates[team_string].units[unit_id];

				ret.push({
					team: team,
					id: unit_id,
					type: foo.type,
					cd: foo.cooldown,
					x: foo.x,
					y: foo.y,
					wood: foo.cargo.wood,
					coal: foo.cargo.coal,
					uranium: foo.cargo.uranium
				});
			}
		}

		return ret;
	},

	get_houses(i) {
		let ret = [];
		for (let city of Object.values(this.stateful[i].cities)) {
			for (let house of city.cityCells) {
				ret.push({x: house.x, y: house.y, id: city.id, team: city.team});
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
				lk: city.lightupkeep
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

	get_orders_for_unit(i, id) {
		let list = this.allCommands[i];
		if (list === undefined) {			// e.g. for very last turn.
			return "";
		}
		list = list.filter(c => c.command.split(" ").includes(id)).map(c => c.command);
		return list.join(", ");
	},

	get_units_at(i, x, y) {
		return this.get_units(i).filter(u => u.x === x && u.y === y);
	},

	get_unit_by_id(i, id) {
		return this.get_units(i).filter(u => u.id === id)[0];
	},

};



module.exports = add_replay_methods;
