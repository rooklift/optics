"use strict";

const electron = require("electron");
const path = require("path");
const url = require("url");

const alert = require("./modules/alert_main");
const config_io = require("./modules/config_io");
const utils = require("./modules/utils");

config_io.load();
let config = config_io.config;

let menu = menu_build();
let menu_is_set = false;
let win;						// We're supposed to keep global references to every window we make.

if (electron.app.isReady()) {
	startup();
} else {
	electron.app.once("ready", () => {
		startup();
	});
}

// --------------------------------------------------------------------------------------------------------------

const save_dialog = electron.dialog.showSaveDialogSync || electron.dialog.showSaveDialog;
const open_dialog = electron.dialog.showOpenDialogSync || electron.dialog.showOpenDialog;

// --------------------------------------------------------------------------------------------------------------

function startup() {

	let desired_zoomfactor = 1 / electron.screen.getPrimaryDisplay().scaleFactor;

	win = new electron.BrowserWindow({
		width: config.width,
		height: config.height,
		backgroundColor: "#000000",
		resizable: true,
		show: false,
		useContentSize: true,
		webPreferences: {
			backgroundThrottling: false,
			contextIsolation: false,
			nodeIntegration: true,
			spellcheck: false,
			zoomFactor: desired_zoomfactor			// Unreliable, see https://github.com/electron/electron/issues/10572
		}
	});

	win.once("ready-to-show", () => {
		try {
			win.webContents.setZoomFactor(desired_zoomfactor);	// This seems to work, note issue 10572 above.
		} catch (err) {
			win.webContents.zoomFactor = desired_zoomfactor;	// The method above "will be removed" in future.
		}
		win.show();
		win.focus();
	});

	win.once("close", (event) => {					// Note the once...
		event.preventDefault();						// We prevent the close one time only,
		win.webContents.send("call", "quit");		// to let renderer's "quit" method run once. It then sends "terminate" back.
	});

	electron.ipcMain.on("terminate", () => {
		win.close();
	});

	electron.app.on("window-all-closed", () => {
		electron.app.quit();
	});

	electron.ipcMain.on("alert", (event, msg) => {
		alert(msg);
	});

	electron.ipcMain.on("set_title", (event, msg) => {
		win.setTitle(msg);
	});

	electron.ipcMain.once("renderer_ready", () => {

		// Open a file via command line. We must wait until the renderer has properly loaded before we do this.
		// While it might seem like we could do this after "ready-to-show" I'm not 100% sure that the renderer
		// will have fully loaded when that fires.

		let filename = "";

		if (path.basename(process.argv[0]).toLowerCase().includes("electron")) {
			if (process.argv.length > 2) {
				filename = process.argv[process.argv.length - 1];
			}
		} else {
			if (process.argv.length > 1) {
				filename = process.argv[process.argv.length - 1];
			}
		}

		if (filename !== "") {
			win.webContents.send("call", {
				fn: "load_stateful_replay",
				args: [filename]
			});
		}
	});

	electron.Menu.setApplicationMenu(menu);
	menu_is_set = true;

	// Actually load the page last, I guess, so the event handlers above are already set up.
	// Send some possibly useful info as a query.

	let query = {};
	query.user_data_path = electron.app.getPath("userData");
	query.zoomfactor = desired_zoomfactor;

	win.loadFile(
		path.join(__dirname, "renderer.html"),
		{query: query}
	);
}

// --------------------------------------------------------------------------------------------------------------

function menu_build() {
	const template = [
		{
			label: "App",
			submenu: [
				{
					label: "About",
					click: () => {
						alert(`${electron.app.getName()} (${electron.app.getVersion()}) in Electron (${process.versions.electron})`);
					}
				},
				{
					role: "toggledevtools"
				},
				{
					label: `Show ${config_io.filename}`,
					click: () => {
						electron.shell.showItemInFolder(config_io.filepath);
					}
				},
				{
					type: "separator",
				},
				{
					label: "Open stateful replay...",
					accelerator: "CommandOrControl+O",
					click: () => {
						let files = open_dialog();
						if (Array.isArray(files) && files.length > 0) {
							win.webContents.send("call", {
								fn: "load_stateful_replay",
								args: [files[0]]
							});
						}
					}
				},
				{
					type: "separator",
				},
				{
					label: "Quit",
					accelerator: "CommandOrControl+Q",
					role: "quit"
				},
			]
		},
		{
			label: "View",
			submenu: [
				{
					label: "Backward",
					accelerator: "Up",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [1]
						});
					}
				},
				{
					label: "Forward",
					accelerator: "Down",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [1]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Backward 10",
					accelerator: "PageUp",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [10]
						});
					}
				},
				{
					label: "Forward 10",
					accelerator: "PageDown",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [10]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Go to start",
					accelerator: "Home",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [999999]
						});
					}
				},
				{
					label: "Go to end",
					accelerator: "End",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [999999]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Autoplay",
					accelerator: "Space",
					click: () => {
						win.webContents.send("call", {
							fn: "toggle_autoplay",
							args: [250]
						});
					}
				},
				{
					label: "Autoplay (fast)",
					accelerator: "F",
					click: () => {
						win.webContents.send("call", {
							fn: "toggle_autoplay",
							args: [50]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Direction triangles",
					type: "checkbox",
					checked: config.unit_triangles,
					accelerator: "CommandOrControl+T",
					click: () => {
						win.webContents.send("toggle", "unit_triangles");
					}
				},
				{
					label: "Condensed city info",
					type: "checkbox",
					checked: config.condensed_city_info,
					click: () => {
						win.webContents.send("toggle", "condensed_city_info");
					}
				},
				{
					label: "Draw debug sidetexts",
					accelerator: "CommandOrControl+D",
					type: "checkbox",
					checked: config.sidetexts,
					click: () => {
						win.webContents.send("toggle", "sidetexts");
					}
				},
				{
					label: "Info font",
					submenu: [
						{
							label: "32",
							type: "checkbox",
							checked: config.info_font_size === 32,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 32
								});
								set_checks("View", "Info font", "32");
							}
						},
						{
							label: "30",
							type: "checkbox",
							checked: config.info_font_size === 30,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 30
								});
								set_checks("View", "Info font", "30");
							}
						},
						{
							label: "28",
							type: "checkbox",
							checked: config.info_font_size === 28,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 28
								});
								set_checks("View", "Info font", "28");
							}
						},
						{
							label: "26",
							type: "checkbox",
							checked: config.info_font_size === 26,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 26
								});
								set_checks("View", "Info font", "26");
							}
						},
						{
							label: "24",
							type: "checkbox",
							checked: config.info_font_size === 24,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 24
								});
								set_checks("View", "Info font", "24");
							}
						},
						{
							label: "22",
							type: "checkbox",
							checked: config.info_font_size === 22,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 22
								});
								set_checks("View", "Info font", "22");
							}
						},
						{
							label: "20",
							type: "checkbox",
							checked: config.info_font_size === 20,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 20
								});
								set_checks("View", "Info font", "20");
							}
						},
						{
							label: "18",
							type: "checkbox",
							checked: config.info_font_size === 18,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 18
								});
								set_checks("View", "Info font", "18");
							}
						},
						{
							label: "16",
							type: "checkbox",
							checked: config.info_font_size === 16,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 16
								});
								set_checks("View", "Info font", "16");
							}
						},
						{
							label: "14",
							type: "checkbox",
							checked: config.info_font_size === 14,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 14
								});
								set_checks("View", "Info font", "14");
							}
						},
						{
							label: "12",
							type: "checkbox",
							checked: config.info_font_size === 12,
							click: () => {
								win.webContents.send("set", {
									key: "info_font_size",
									value: 12
								});
								set_checks("View", "Info font", "12");
							}
						},
					]
				},
				{
					type: "separator",
				},
				{
					label: "Escape",
					accelerator: "Escape",
					click: () => {
						win.webContents.send("call", "escape");
					}
				},
			]
		}
	];

	return electron.Menu.buildFromTemplate(template);
}

// --------------------------------------------------------------------------------------------------------------

function get_submenu_items(menupath) {

	// If the path is to a submenu, this returns a list of all items in the submenu.
	// If the path is to a specific menu item, it just returns that item.

	let o = menu.items;
	for (let p of menupath) {
		p = utils.stringify(p);
		for (let item of o) {
			if (item.label === p) {
				if (item.submenu) {
					o = item.submenu.items;
					break;
				} else {
					return item;		// No submenu so this must be the end.
				}
			}
		}
	}
	return o;
}

function set_checks(...menupath) {

	if (!menu_is_set) {
		return;
	}

	// Since I don't know precisely how the menu works behind the scenes,
	// give a little time for the original click to go through first.

	setTimeout(() => {
		let items = get_submenu_items(menupath.slice(0, -1));
		for (let n = 0; n < items.length; n++) {
			if (items[n].checked !== undefined) {
				items[n].checked = items[n].label === utils.stringify(menupath[menupath.length - 1]);
			}
		}
	}, 50);
}

function set_one_check(state, ...menupath) {

	state = state ? true : false;

	if (!menu_is_set) {
		return;
	}

	let item = get_submenu_items(menupath);
	if (item.checked !== undefined) {
		item.checked = state;
	}
}
