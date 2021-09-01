"use strict";

function fixed_kaggle_replay(raw_replay) {
	let ret = {r: raw_replay};
	Object.assign(ret, kaggle_replay_props);
	return ret;
}

let kaggle_replay_props = {

	seed() {
		return this.r.configuration.seed;
	},

	width() {

	},

	height() {

	},

	length() {

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



module.exports = fixed_kaggle_replay;
