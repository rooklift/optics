"use strict";

const colours = ["#ffcc66ff", "#00ccffff"];
const unit_types = ["worker", "cart"];

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

	for (let unit of replay.get_units(index)) {
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

	lines.push(`<br>Turn ${index}<br>`);

	for (let team of replay.get_team_ids()) {

		let my_houses = houses.filter(h => h.team === team);

		lines.push(`<span class="team_${team}"><br>Team ${team}</span>, houses: <span class="team_${team}">${my_houses.length}</span><br>`);
		lines.push(`Research: <span class="team_${team}">${replay.get_research(index, team)}</span><br>`);

		lines.push(`Workers: <span class="team_${team}">${units.filter(u => u.team === team && u.type === 0).length}</span>,
					Carts: <span class="team_${team}">${units.filter(u => u.team === team && u.type === 1).length}</span><br>`
		);

		for (let city of cities.filter(c => c.team === team)) {
			lines.push(`City <span class="team_${team}">${city.id}</span>,
						Fuel: <span class="team_${team}">${city.fuel}</span>,
						Upkeep: <span class="team_${team}">${city.lk}</span><br>`
			);
		}

	}

	lines.push(`<br>Selection: [${selection ? selection[0].toString() + ", " + selection[1].toString() : "none"}]<br>`);

	if (selection) {

		let cell = replay.get_cell(index, selection[0], selection[1]);

		let house = replay.get_houses(index).filter(h => h.x === selection[0] && h.y === selection[1])[0];

		if (house) {
			lines.push(`House of city <span class="team_${house.team}">${house.id}</span><br>`);
		} else if (cell.type) {
			lines.push(`Resource: <span class="${cell.type}">${cell.type}</span> (${cell.amount})<br>`);
		} else {
			lines.push(`No resource<br>`);
		}

		let units = replay.get_units(index).filter(u => u.x === selection[0] && u.y === selection[1]);

		for (let unit of units) {
			lines.push(`Unit <span class="team_${unit.team}">${unit.id}</span> (${unit_types[unit.type]})<br>`);
		}
	}

	infodiv.innerHTML = lines.join("\n");
}



module.exports = {draw, calculate_cell_size, draw_info};
