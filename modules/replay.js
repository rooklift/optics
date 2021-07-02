"use strict";

function add_replay_methods(o) {
	Object.assign(o, replay_props);
}

let replay_props = {

	width() {
		return this.stateful[0].map[0].length;
	},

	height() {
		return this.stateful[0].map.length;
	},

	get_cell(i, x, y) {
		return this.stateful[i].map[y][x];
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

};



module.exports = add_replay_methods;
