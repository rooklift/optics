"use strict";

function stringify(msg) {		// Given anything, create a string from it.
	try {
		if (msg instanceof Error) {
			msg = msg.toString();
		}
		if (typeof msg === "object") {
			msg = JSON.stringify(msg);
		}
		if (typeof msg === "undefined") {
			msg = "undefined";
		}
		msg = msg.toString().trim();
		return msg;
	} catch (err) {
		return "stringify() failed";
	}
}

function replace_all(s, search, replace) {
	if (!s.includes(search)) return s;			// Seems to improve speed overall.
	return s.split(search).join(replace);
}

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

// ------------------------------------------------------------------------------------------------

module.exports = {stringify, replace_all, command_is_for_unit, command_is_for_house};

