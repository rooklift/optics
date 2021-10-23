"use strict";

// The purpose of this file is mostly to document our data structures and ensure
// the same structures are produced when multiple functions want to make them.

exports.new_cell = function(x, y, type, amount, road) {
	return {x, y, type, amount, road};
};

// The order of arguments in new_unit/house/city matches the update order of
// the raw wire protocol (also used in Kaggle replay format). By contrast,
// new_cell is different since no single line of the wire protocol gives all
// the required info.

exports.new_unit = function(type, team, id, x, y, cd, wood, coal, uranium) {
	return {type, team, id, x, y, cd, wood, coal, uranium};
};

exports.new_house = function(team, id, x, y, cd) {
	return {team, id, x, y, cd};
};

exports.new_city = function(team, id, fuel, upkeep) {
	return {team, id, fuel, upkeep};
};

exports.new_resource_counter = function() {
	return {wood: 0, coal: 0, uranium: 0};
};

exports.new_annotation = function(team, type, text, x1, y1, x2, y2) {
	return {team, type, text, x1, y1, x2, y2};
};
