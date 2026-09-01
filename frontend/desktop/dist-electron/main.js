import { BrowserWindow, Menu, Tray, app, globalShortcut, ipcMain, nativeImage, screen, session, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";
//#region electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var mainWindow = null;
var tray = null;
var isDev = !app.isPackaged;
var devUrl = {}.DEV_URL || "http://localhost:5174";
var platformUrl = {}.PLATFORM_URL || "http://www.easyapplyresume.com/";
var secureOrigins = [
	"http://www.easyapplyresume.com",
	"http://easyapplyresume.com",
	"http://120.48.177.183"
].join(",");
app.commandLine.appendSwitch("unsafely-treat-insecure-origin-as-secure", secureOrigins);
/**
* 托盘里展示的模型来自后端（用户在平台端配置的 BYOK 模型偏好），
* 不再使用写死的示例模型。渲染进程登录后通过 update-tray-models 推送真实列表。
*/
var currentModels = {
	asr: "",
	llm: ""
};
/** 托盘菜单可用的模型选项（真实数据，未登录时为空） */
var trayModelOptions = {
	asr: {
		current: "",
		options: []
	},
	llm: {
		current: "",
		options: []
	}
};
function createTrayIconPNG() {
	const w = 16, h = 16;
	const sig = Buffer.from([
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	]);
	const ihdrData = Buffer.alloc(13);
	ihdrData.writeUInt32BE(w, 0);
	ihdrData.writeUInt32BE(h, 4);
	ihdrData[8] = 8;
	ihdrData[9] = 6;
	const ihdr = makeChunk("IHDR", ihdrData);
	const raw = Buffer.alloc(h * 65);
	for (let y = 0; y < h; y++) {
		const off = y * 65;
		raw[off] = 0;
		for (let x = 0; x < w; x++) {
			const p = off + 1 + x * 4;
			if (x < 2 && y < 2 || x > 13 && y < 2 || x < 2 && y > 13 || x > 13 && y > 13) {
				raw[p] = 0;
				raw[p + 1] = 0;
				raw[p + 2] = 0;
				raw[p + 3] = 0;
			} else {
				raw[p] = 44;
				raw[p + 1] = 44;
				raw[p + 2] = 44;
				raw[p + 3] = 255;
			}
		}
	}
	const idat = makeChunk("IDAT", deflateSync(raw));
	const iend = makeChunk("IEND", Buffer.alloc(0));
	return Buffer.concat([
		sig,
		ihdr,
		idat,
		iend
	]);
}
function makeChunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const tb = Buffer.from(type);
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])));
	return Buffer.concat([
		len,
		tb,
		data,
		crcBuf
	]);
}
function crc32(buf) {
	let c = 4294967295;
	for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
var crcTable = /* @__PURE__ */ new Uint32Array(256);
for (let i = 0; i < 256; i++) {
	let c = i;
	for (let j = 0; j < 8; j++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
	crcTable[i] = c;
}
function createToolbarWindow() {
	const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
	const winWidth = 900;
	mainWindow = new BrowserWindow({
		width: winWidth,
		height: 160,
		x: Math.max(0, Math.round((screenWidth - winWidth) / 2)),
		y: 60,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		resizable: true,
		thickFrame: false,
		minWidth: 400,
		minHeight: 54,
		skipTaskbar: false,
		hasShadow: true,
		vibrancy: "under-window",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (isDev) mainWindow.loadURL(devUrl);
	else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}
function createTray() {
	const png = createTrayIconPNG();
	tray = new Tray(nativeImage.createFromBuffer(png, {
		width: 18,
		height: 18
	}));
	updateTrayMenu();
	tray.setToolTip("智语同航");
	tray.on("double-click", () => {
		if (mainWindow) {
			mainWindow.show();
			mainWindow.focus();
		}
	});
}
function updateTrayMenu() {
	const ctx = Menu.buildFromTemplate([
		{
			label: "智语同航",
			enabled: false
		},
		{ type: "separator" },
		{
			label: "显示/隐藏工具栏",
			click: () => {
				if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
			}
		},
		{
			label: "进入平台模式",
			click: () => switchWindowMode("platform")
		},
		{
			label: "浏览器打开平台",
			click: () => shell.openExternal(platformUrl)
		},
		{ type: "separator" },
		buildModelSubmenu("ASR 模型", "asr"),
		buildModelSubmenu("翻译模型", "llm"),
		{
			label: `纠错模型：${currentModels.llm || "随翻译"}`,
			enabled: false
		},
		{ type: "separator" },
		{
			label: "退出智语同航",
			click: () => app.quit()
		}
	]);
	tray?.setContextMenu(ctx);
}
function switchWindowMode(mode) {
	if (!mainWindow || mainWindow.isDestroyed()) return;
	mainWindow.show();
	mainWindow.focus();
	if (mode === "platform") {
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;
		const winWidth = Math.min(1280, Math.max(960, Math.round(width * .78)));
		const winHeight = Math.min(860, Math.max(640, Math.round(height * .78)));
		mainWindow.setAlwaysOnTop(false);
		mainWindow.setMinimumSize(960, 640);
		mainWindow.setBounds({
			x: Math.max(0, Math.round((width - winWidth) / 2)),
			y: Math.max(0, Math.round((height - winHeight) / 2)),
			width: winWidth,
			height: winHeight
		});
	} else {
		const { width } = screen.getPrimaryDisplay().workAreaSize;
		const winWidth = 900;
		mainWindow.setAlwaysOnTop(true);
		mainWindow.setMinimumSize(400, 54);
		mainWindow.setBounds({
			x: Math.max(0, Math.round((width - winWidth) / 2)),
			y: 60,
			width: winWidth,
			height: 160
		});
	}
	mainWindow.webContents.send("app-mode-changed", mode);
}
/**
* 构建模型单选子菜单。未登录/未配置时给出引导项，点击后进入平台模式配置。
*/
function buildModelSubmenu(label, type) {
	const { current, options } = trayModelOptions[type];
	if (!options.length) return {
		label: `${label}（未登录，请先登录）`,
		enabled: false
	};
	return {
		label,
		submenu: options.map((model) => ({
			label: model,
			type: "radio",
			checked: current === model,
			click: () => switchModel(type, model)
		}))
	};
}
function switchModel(type, model) {
	currentModels[type] = model;
	if (type === "asr") trayModelOptions.asr.current = model;
	if (type === "llm") trayModelOptions.llm.current = model;
	updateTrayMenu();
	if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("model-changed", {
		type,
		model,
		all: currentModels
	});
}
ipcMain.handle("get-models", () => currentModels);
ipcMain.handle("set-model", (_e, { type, model }) => {
	switchModel(type, model);
	return currentModels;
});
ipcMain.on("update-tray-models", (_e, payload) => {
	trayModelOptions = payload;
	currentModels.asr = payload.asr.current;
	currentModels.llm = payload.llm.current;
	updateTrayMenu();
});
ipcMain.on("hide-toolbar", () => mainWindow?.hide());
ipcMain.on("show-toolbar", () => {
	mainWindow?.show();
	mainWindow?.focus();
});
ipcMain.on("set-window-mode", (_e, mode) => switchWindowMode(mode));
ipcMain.on("open-platform-external", (_e, url) => {
	shell.openExternal(url || platformUrl);
});
ipcMain.on("toggle-fullscreen", () => {
	if (!mainWindow) return;
	const isFullScreen = mainWindow.isFullScreen();
	mainWindow.setFullScreen(!isFullScreen);
});
ipcMain.on("start-resize", (_e, edge) => {
	const win = BrowserWindow.fromWebContents(_e.sender);
	if (!win) return;
	const bounds = win.getBounds();
	const startPoint = screen.getCursorScreenPoint();
	const MAX_W = 4e3;
	const MAX_H = 4e3;
	const MIN_W = 400;
	const MIN_H = 54;
	const interval = setInterval(() => {
		const now = screen.getCursorScreenPoint();
		const dx = now.x - startPoint.x;
		const dy = now.y - startPoint.y;
		let x = bounds.x, y = bounds.y, w = bounds.width, h = bounds.height;
		if (edge.includes("right")) w = Math.max(MIN_W, Math.min(MAX_W, bounds.width + dx));
		if (edge.includes("left")) {
			w = Math.max(MIN_W, Math.min(MAX_W, bounds.width - dx));
			x = bounds.x + dx;
		}
		if (edge.includes("bottom")) h = Math.max(MIN_H, Math.min(MAX_H, bounds.height + dy));
		if (edge.includes("top")) {
			h = Math.max(MIN_H, Math.min(MAX_H, bounds.height - dy));
			y = bounds.y + dy;
		}
		if (x < 0) x = 0;
		if (y < 0) y = 0;
		if (edge.includes("left") && bounds.x + bounds.width !== x + w) w = Math.max(MIN_W, bounds.x + bounds.width - x);
		win.setBounds({
			x,
			y,
			width: w,
			height: h
		});
	}, 16);
	ipcMain.once("resize-end", () => clearInterval(interval));
});
app.whenReady().then(() => {
	session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
		callback([
			"media",
			"display-capture",
			"fullscreen"
		].includes(permission));
	});
	createToolbarWindow();
	createTray();
	globalShortcut.register("CommandOrControl+Shift+T", () => {
		if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
	});
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createToolbarWindow();
	});
});
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => tray?.destroy());
//#endregion

//# sourceMappingURL=main.js.map