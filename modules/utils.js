"use strict";

function stringify(msg) {							// Given anything, create a string from it.
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
	if (!s.includes(search)) return s;				// Seems to improve speed overall.
	return s.split(search).join(replace);
}

function command_is_for_unit(s, id) {				// given some command, is it for the unit with this id?
	let fields = s.trim().split(" ").filter(z => z !== "");
	if (["m", "bcity", "p", "t"].includes(fields[0])) {
		return fields[1] === id;
	}
	return false;
}

function command_is_for_house(s, x, y) {			// given some command, is it for the house at [x, y] ?
	let fields = s.trim().split(" ").filter(z => z !== "");
	if (["r", "bw", "bc"].includes(fields[0])) {
		return fields[1] === x.toString() && fields[2] === y.toString();
	}
	return false;
}

function annotation_object_from_command(s, team) {

	// Some of {team, type, text, x1, y1, x2, y2}
	// or null if unable to create a valid object

	if (typeof s !== "string" || typeof team !== "number") {
		return null;
	}

	let fields = s.trim().split(" ").filter(z => z !== "");			// Note that this might break some debug string; we handle those specially though.

	let x1, y1, x2, y2;

	switch (fields[0]) {

		case "dc":
		case "dx":

			x1 = parseInt(fields[1], 10);
			y1 = parseInt(fields[2], 10);

			if (Number.isNaN(x1) || Number.isNaN(y1)) {
				return null;
			}

			return {team, type: fields[0], x1, y1};

		case "dl":

			x1 = parseInt(fields[1], 10);
			y1 = parseInt(fields[2], 10);
			x2 = parseInt(fields[3], 10);
			y2 = parseInt(fields[4], 10);

			if (Number.isNaN(x1) || Number.isNaN(y1) || Number.isNaN(x2) || Number.isNaN(y2)) {
				return null;
			}

			return {team, type: fields[0], x1, y1, x2, y2};

		case "dt":

			return null;		// NOT IMPLEMENTED / TODO ?

		case "dst":

			return {team, type: fields[0], text: s.slice(4)};

		default:

			return null;

	}
}

function safe_string_html(s) {
	if (typeof s !== "string") {
		return undefined;
	}
	s = replace_all(s,  `&`  ,  `&amp;`   );		// This needs to be first of course.
	s = replace_all(s,  `<`  ,  `&lt;`    );
	s = replace_all(s,  `>`  ,  `&gt;`    );
	s = replace_all(s,  `'`  ,  `&apos;`  );
	s = replace_all(s,  `"`  ,  `&quot;`  );
	return s;
}

// ------------------------------------------------------------------------------------------------

module.exports = {stringify, replace_all, command_is_for_unit, command_is_for_house, annotation_object_from_command, safe_string_html};

