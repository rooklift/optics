"use strict";

function add_replay_methods(o) {
	Object.assign(o, replay_props);
}

let replay_props = {

	get_cell(i, x, y) {
		return this.stateful[i].map[y][x];
	},

	width() {
		return this.stateful[0].map[0].length;
	},

	height() {
		return this.stateful[0].map.length;
	},

};



module.exports = add_replay_methods;
