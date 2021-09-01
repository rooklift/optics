"use strict";


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


function make_frame(width, height, updates) {

	let frame = {};

	frame.map = [];
	frame.rp = [0, 0];
	frame.units = [];
	frame.houses = [];
	frame.cities = [];

	for (let x = 0; x < width; x++) {
		frame.map.push([]);
		for (let y = 0; y < height; y++) {
			frame.map[x].push({
				x: x,
				y: y,
				type: "",
				amount: 0,
				road: 0
			});
		}
	}

	for (let line of updates) {

		let fields = line.split(" ").filter(z => z !== "");

		if (fields[0] === "rp") {
			let team = parseInt(fields[1], 10);
			let points = parseInt(fields[2], 10);
			frame.rp[team] = points;
		}

		if (fields[0] === "r") {
			let type = fields[1];
			let x = parseInt(fields[2], 10);
			let y = parseInt(fields[3], 10);
			let amount = parseInt(fields[4], 10);
			frame.map[x][y].type = amount > 0 ? type : "";
			frame.map[x][y].amount = amount;
		}

		if (fields[0] === "u") {
			let type = parseInt(fields[1], 10);
			let team = parseInt(fields[2], 10);
			let id = fields[3];
			let x = parseInt(fields[4], 10);
			let y = parseInt(fields[5], 10);
			let cd = parseInt(fields[6], 10);
			let wood = parseInt(fields[7], 10);
			let coal = parseInt(fields[8], 10);
			let uranium = parseInt(fields[9], 10);
			frame.units.push({type, team, id, x, y, cd, wood, coal, uranium});
		}

		if (fields[0] === "c") {
			let team = parseInt(fields[1], 10);
			let id = fields[2];
			let fuel = parseInt(fields[3], 10);
			let upkeep = parseInt(fields[4], 10);
			frame.cities.push({team, id, fuel, upkeep});
		}

		if (fields[0] === "ct") {
			let team = parseInt(fields[1], 10);
			let id = fields[2];
			let x = parseInt(fields[3], 10);
			let y = parseInt(fields[4], 10);
			let cd = parseInt(fields[5], 10);
			frame.houses.push({team, id, x, y, cd});
		}

		if (fields[0] === "ccd") {
			let x = parseInt(fields[1], 10);
			let y = parseInt(fields[2], 10);
			let road = parseFloat(fields[3]);
			frame.map[x][y].road = road;
		}
	}

	return frame;
}

module.exports = {command_is_for_unit, command_is_for_house, make_frame}
