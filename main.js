"use strict";

const electron = require("electron");
const path = require("path");
const url = require("url");

const alert = require("./modules/alert_main");
const config_io = require("./modules/config_io");
const stringify = require("./modules/stringify");

config_io.load();
let config = config_io.config;

let menu = menu_build();
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

	win.once("close", function(event) {				// Note the once...
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

	// Actually load the page last, I guess, so the event handlers above are already set up.
	// Send some possibly useful info as a query.

	let query = {};
	query.user_data_path = electron.app.getPath("userData");
	query.zoomfactor = desired_zoomfactor;

	win.loadFile(
		path.join(__dirname, "renderer.html"),
		{query: query}
	);

	electron.Menu.setApplicationMenu(menu);
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
					label: "Open log...",
					accelerator: "CommandOrControl+O",
					click: () => {
						let files = open_dialog();
						if (Array.isArray(files) && files.length > 0) {
							win.webContents.send("call", {
								fn: "load",
								args: [files[0]]
							});
						}
					}
				},
				{
					type: "separator",
				},
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
					label: "Start",
					accelerator: "Home",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [-999999]
						});
					}
				},
				{
					label: "End",
					accelerator: "End",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [999999]
						});
					}
				},
				{
					label: "Quit",
					accelerator: "CommandOrControl+Q",
					role: "quit"
				},
			]
		},
	];

	return electron.Menu.buildFromTemplate(template);
}

