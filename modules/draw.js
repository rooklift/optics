"use strict";

const colours = ["#ffcc66ff", "#00ccffff"];

function draw(replay, index, canvas, infodiv) {

	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth - 300;

	if (!replay) {
		return;
	}

	let height = replay.height();
	let width = replay.width();

	let ctx = canvas.getContext("2d");

	let foo = canvas.width / width;					// I couldn't think
	let bar = canvas.height / height;				// of a good name.

	let cell_size = Math.floor(Math.min(foo, bar));

	ctx.fillStyle = "#333333ff";
	ctx.fillRect(0, 0, width * cell_size, height * cell_size);

	// Resources...

	for (let x = 0; x < width; x++) {

		for (let y = 0; y < height; y++) {

			let cell = replay.get_cell(index, x, y);

			if (cell.resource) {
				if (cell.resource.type === "wood" && cell.resource.amount > 0) {
					ctx.fillStyle = "#33aa33ff";
					ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
				}
				if (cell.resource.type === "coal" && cell.resource.amount > 0) {
					ctx.fillStyle = "#999999ff";
					ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
				}
				if (cell.resource.type === "uranium" && cell.resource.amount > 0) {
					ctx.fillStyle = "#66ccccff";
					ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 2, cell_size - 2);
				}
			}
		}
	}

	// Houses...

	for (let house of replay.get_houses(index)) {
		ctx.fillStyle = colours[house.team];
		ctx.fillRect(house.x * cell_size + 1, house.y * cell_size + 1, cell_size - 2, cell_size - 2);
	}

	// Doods...

	for (let unit of replay.get_units(index)) {
		ctx.fillStyle = colours[unit.team];
		ctx.strokeStyle = "#000000ff";
		let gx = unit.x * cell_size + (cell_size / 2);
		let gy = unit.y * cell_size + (cell_size / 2);
		ctx.beginPath();
		ctx.arc(gx, gy, cell_size / 2 - 2, 0, 2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(gx, gy, cell_size / 2 - 2, 0, 2 * Math.PI);
		ctx.stroke();
	}

	// Info...

	draw_info(replay, index, infodiv);
}

function draw_info(replay, index, infodiv) {

	let cities = replay.get_cities(index);
	let units = replay.get_units(index);

	let lines = [];

	lines.push(`<p>Turn ${index}</p>`);

	for (let team of replay.get_team_ids()) {

		lines.push(`<p class="team_${team}">Team ${team}</p>`);

		lines.push(`<ul>`);
		for (let city of cities.filter(c => c.team === team)) {
			lines.push(`<li>
				<span class="team_${team}">City ${city.id}</span>,
				fuel: <span class="team_${team}">${city.fuel}</span>,
				upkeep: <span class="team_${team}">${city.lk}</span>
				</li>`
			);
		}
		lines.push(`</ul>`);

	}

	infodiv.innerHTML = lines.join("\n");
}


module.exports = draw;
