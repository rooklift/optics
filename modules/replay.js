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

		// FIXME / TODO

		let ret = [];
		return ret;
	},

	get_houses(i) {

		// FIXME / TODO

		let ret = [];

		for (let city of Object.values(this.stateful[i].cities)) {
			for (let house of city.cityCells) {
				ret.push({x: house.x, y: house.y, id: city.id, team: 0});			// FIXME
			}
		}
		return ret;
	},

};



module.exports = add_replay_methods;
