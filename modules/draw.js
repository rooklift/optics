"use strict";

const colours = ["#ffcc66ff", "#00ccffff"];
const unit_types = ["worker", "cart"];
const road_colours = ["#222222ff", "#333333ff", "#444444ff", "#555555ff", "#666666ff", "#777777ff", "#777777ff"];

function draw(replay, index, canvas, infodiv, selection) {

	canvas.height = window.innerHeight;
	canvas.width = canvas.height;

	if (!replay) {
		return;
	}

	let width = replay.width();
	let height = replay.height();

	let cell_size = calculate_cell_size(canvas, width, height);

	let ctx = canvas.getContext("2d");
	ctx.fillStyle = "#222222ff";
	ctx.fillRect(0, 0, width * cell_size, height * cell_size);

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `${Math.floor(cell_size / 2.5)}px Arial`;

	// Roads...

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			let cell = replay.get_cell(index, x, y);
			if (cell.road > 0) {
				ctx.fillStyle = road_colours[Math.ceil(cell.road)];
				ctx.fillRect(x * cell_size + cell_size / 4, y * cell_size + cell_size / 4, cell_size / 2, cell_size / 2);
			}
		}
	}

	// Draw crosshairs now so they're below the stuff...

	draw_selection_crosshairs(replay, index, canvas, selection, cell_size);

	// Resources...

	for (let x = 0; x < width; x++) {

		for (let y = 0; y < height; y++) {

			let cell = replay.get_cell(index, x, y);

			if (cell.type === "wood" && cell.amount > 0) {
				ctx.fillStyle = "#64b864ff";
				ctx.fillRect(x * cell_size + 2, y * cell_size + 2, cell_size - 4, cell_size - 4);
			}
			if (cell.type === "coal" && cell.amount > 0) {
				ctx.fillStyle = "#707070ff";
				ctx.fillRect(x * cell_size + 2, y * cell_size + 2, cell_size - 4, cell_size - 4);
			}
			if (cell.type === "uranium" && cell.amount > 0) {
				ctx.fillStyle = "#cc66ccff";
				ctx.fillRect(x * cell_size + 2, y * cell_size + 2, cell_size - 4, cell_size - 4);
			}
		}
	}

	// Houses...

	for (let house of replay.get_houses(index)) {
		ctx.fillStyle = colours[house.team];

		ctx.beginPath();
		ctx.moveTo(house.x * cell_size + cell_size / 2, house.y * cell_size + 2)
		ctx.lineTo(house.x * cell_size + cell_size - 2, house.y * cell_size + cell_size / 3);
		ctx.lineTo(house.x * cell_size + cell_size - 2, house.y * cell_size + cell_size - 2);
		ctx.lineTo(house.x * cell_size + 2, house.y * cell_size + cell_size - 2);
		ctx.lineTo(house.x * cell_size + 2, house.y * cell_size + cell_size / 3);
		ctx.closePath();
		ctx.fill();

		// ctx.fillRect(house.x * cell_size + 1, house.y * cell_size + 1, cell_size - 2, cell_size - 2);
	}

	// Doods...

	let stacks = {};

	for (let unit of replay.get_units(index)) {

		if (stacks[`${unit.x},${unit.y}`]) {
			stacks[`${unit.x},${unit.y}`].push(unit);
		} else {
			stacks[`${unit.x},${unit.y}`] = [unit];
		}

		ctx.fillStyle = colours[unit.team];
		ctx.strokeStyle = "#000000ff";
		let gx = unit.x * cell_size + (cell_size / 2);
		let gy = unit.y * cell_size + (cell_size / 2);
		ctx.beginPath();
		ctx.arc(gx, gy, cell_size / 3, 0, 2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(gx, gy, cell_size / 3, 0, 2 * Math.PI);
		ctx.stroke();
	}

	for (let stack of Object.values(stacks)) {

		let unit = stack[0];
		let gx = unit.x * cell_size + (cell_size / 2);
		let gy = unit.y * cell_size + (cell_size / 2) + 1;
		ctx.fillStyle = "#000000ff";

		if (stack.length === 1) {
			ctx.fillText(unit.id.slice(2).toString(), gx, gy);
		} else {
			ctx.fillText("+", gx, gy);
		}

	}

	// Info...

	draw_info(replay, index, infodiv, selection);
}

function calculate_cell_size(canvas, map_width, map_height) {

	let foo = canvas.width / map_width;
	let bar = canvas.height / map_height;

	return Math.floor(Math.min(foo, bar));
}

function draw_info(replay, index, infodiv, selection) {

	let cities = replay.get_cities(index);
	let units = replay.get_units(index);
	let houses = replay.get_houses(index);

	let lines = [];

	lines.push(`<br>Turn ${index} ${is_night(index) ? "(night)" : "(day)"}<br>`);

	for (let team of replay.get_team_ids()) {

		let my_houses = houses.filter(h => h.team === team);

		lines.push(`<span class="team_${team}"><br>Team ${team}</span> - houses: <span class="team_${team}">${my_houses.length}</span>
					research: <span class="team_${team}">${replay.get_research(index, team)}</span><br>`);

		lines.push(`workers: <span class="team_${team}">${units.filter(u => u.team === team && u.type === 0).length}</span>,
					carts: <span class="team_${team}">${units.filter(u => u.team === team && u.type === 1).length}</span><br>`
		);

		for (let city of cities.filter(c => c.team === team)) {
			lines.push(`- city <span class="team_${team}">${city.id}</span>,
						fuel: <span class="team_${team}">${city.fuel}</span>,
						upkeep: <span class="team_${team}">${city.lk}</span><br>`
			);
		}

	}

	let selection_x = null;
	let selection_y = null;

	if (!selection) {
		lines.push(`<br>(no selection)<br>`);
	} else if (typeof selection.x === "number" && typeof selection.y === "number") {
		lines.push(`<br>Selection: cell [${selection.x}, ${selection.y}]<br>`);
		selection_x = selection.x;
		selection_y = selection.y;
	} else if (typeof selection.uid === "string") {
		let unit = replay.get_unit_by_id(index, selection.uid);
		if (!unit) {
			lines.push(`<br>Selection: unit ${selection.uid} (not present)<br>`);
		} else {
			lines.push(`<br>Selection: <span class="team_${unit.team}">${unit_types[unit.type]} ${unit.id}</span>
						at [${unit.x}, ${unit.y}]<br>`
			);
			selection_x = unit.x;
			selection_y = unit.y;
		}
	}

	if (typeof selection_x === "number" && typeof selection_y === "number") {

		let cell = replay.get_cell(index, selection_x, selection_y);
		let house = replay.get_house_at(index, selection_x, selection_y);

		let cell_line = `<br>Cell [${selection_x}, ${selection_y}]`;
		if (house) {
			cell_line += ` - <span class="team_${house.team}">city ${house.id}</span>`;
		} else if (cell.type) {
			cell_line += ` - <span class="${cell.type}">${cell.type}</span> (${cell.amount})`;
		}
		cell_line += "<br>";
		lines.push(cell_line);

		let units = replay.get_units(index).filter(u => u.x === selection_x && u.y === selection_y);

		for (let unit of units) {
			lines.push(`<span class="team_${unit.team}">${unit_types[unit.type]}</span>
			<span class="team_${unit.team}">${unit.id}</span>
			[<span class="wood">${unit.wood}</span>
			<span class="coal">${unit.coal}</span>
			<span class="uranium">${unit.uranium}</span>],
			cd: <span class="team_${unit.team}">${unit.cd}</span>,
			cmd: <span class="team_${unit.team}">${replay.get_orders_for_unit(index, unit.id)}</span><br>`
			);
		}
	}

	infodiv.innerHTML = lines.join("\n");
}

function get_xy_from_selection(replay, index, selection) {

	if (!selection) {
		return [-1, -1];
	}

	if (typeof selection.x === "number" && typeof selection.y === "number") {
		return [selection.x, selection.y];
	}

	if (typeof selection.uid === "string") {
		let unit = replay.get_unit_by_id(index, selection.uid);
		if (unit) {
			return [unit.x, unit.y];
		} else {
			return [-1, -1];
		}
	}

	throw "bad object";
}

function is_night(index) {
	return (index % 40) > 29;
}

function draw_selection_crosshairs(replay, index, canvas, selection, cell_size) {

	let [x, y] = get_xy_from_selection(replay, index, selection);

	if (x < 0 || y < 0) {
		return;
	}

	let gx = x * cell_size + (cell_size / 2);
	let gy = y * cell_size + (cell_size / 2) + 1;

	let ctx = canvas.getContext("2d");

	ctx.setLineDash([2, 5]);

	ctx.lineWidth = 1;
	ctx.strokeStyle = "#cccccc";

	ctx.beginPath();
	ctx.moveTo(gx, gy - cell_size);
	ctx.lineTo(gx, 0);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(gx, gy + cell_size);
	ctx.lineTo(gx, canvas.height);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(gx - cell_size, gy);
	ctx.lineTo(0, gy);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(gx + cell_size, gy);
	ctx.lineTo(canvas.width, gy);
	ctx.stroke();

	ctx.setLineDash([]);
};



module.exports = {draw, calculate_cell_size};
