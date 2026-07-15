import { BrowserWindow, Menu, Tray, app, globalShortcut, ipcMain, nativeImage, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";
//#region electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var mainWindow = null;
var tray = null;
var isDev = !app.isPackaged;
var currentModels = {
	asr: "Whisper Large v3",
	translation: "GPT-4o",
	correction: "Claude 3.5 Sonnet"
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
	const winWidth = 700;
	mainWindow = new BrowserWindow({
		width: winWidth,
		height: 160,
		x: Math.max(0, Math.round((screenWidth - winWidth) / 2)),
		y: 60,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		resizable: true,
		minWidth: 400,
		minHeight: 54,
		maxWidth: 800,
		maxHeight: 400,
		skipTaskbar: false,
		hasShadow: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (isDev) mainWindow.loadURL("http://localhost:5173");
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
	tray.setToolTip("AI同声转译助手");
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
			label: "AI同声转译助手",
			enabled: false
		},
		{ type: "separator" },
		{
			label: "显示/隐藏工具栏",
			click: () => {
				if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
			}
		},
		{ type: "separator" },
		{
			label: "ASR 模型",
			submenu: [
				{
					label: "Whisper Large v3",
					type: "radio",
					checked: currentModels.asr === "Whisper Large v3",
					click: () => switchModel("asr", "Whisper Large v3")
				},
				{
					label: "Whisper Medium",
					type: "radio",
					checked: currentModels.asr === "Whisper Medium",
					click: () => switchModel("asr", "Whisper Medium")
				},
				{
					label: "FunASR Paraformer",
					type: "radio",
					checked: currentModels.asr === "FunASR Paraformer",
					click: () => switchModel("asr", "FunASR Paraformer")
				},
				{
					label: "SenseVoice",
					type: "radio",
					checked: currentModels.asr === "SenseVoice",
					click: () => switchModel("asr", "SenseVoice")
				}
			]
		},
		{
			label: "翻译模型",
			submenu: [
				{
					label: "GPT-4o",
					type: "radio",
					checked: currentModels.translation === "GPT-4o",
					click: () => switchModel("translation", "GPT-4o")
				},
				{
					label: "GPT-4o-mini",
					type: "radio",
					checked: currentModels.translation === "GPT-4o-mini",
					click: () => switchModel("translation", "GPT-4o-mini")
				},
				{
					label: "Claude 3.5 Sonnet",
					type: "radio",
					checked: currentModels.translation === "Claude 3.5 Sonnet",
					click: () => switchModel("translation", "Claude 3.5 Sonnet")
				},
				{
					label: "DeepSeek V3",
					type: "radio",
					checked: currentModels.translation === "DeepSeek V3",
					click: () => switchModel("translation", "DeepSeek V3")
				}
			]
		},
		{
			label: "纠错模型",
			submenu: [
				{
					label: "Claude 3.5 Sonnet",
					type: "radio",
					checked: currentModels.correction === "Claude 3.5 Sonnet",
					click: () => switchModel("correction", "Claude 3.5 Sonnet")
				},
				{
					label: "GPT-4o",
					type: "radio",
					checked: currentModels.correction === "GPT-4o",
					click: () => switchModel("correction", "GPT-4o")
				},
				{
					label: "关闭纠错",
					type: "radio",
					checked: currentModels.correction === "关闭纠错",
					click: () => switchModel("correction", "关闭纠错")
				}
			]
		},
		{ type: "separator" },
		{
			label: "退出 TransFlow",
			click: () => app.quit()
		}
	]);
	tray?.setContextMenu(ctx);
}
function switchModel(type, model) {
	currentModels[type] = model;
	updateTrayMenu();
	if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("model-changed", {
		type,
		model,
		all: currentModels
	});
}
ipcMain.handle("get-models", () => currentModels);
ipcMain.handle("set-model", (_e, { type, model }) => {
	currentModels[type] = model;
	updateTrayMenu();
	return currentModels;
});
ipcMain.on("hide-toolbar", () => mainWindow?.hide());
ipcMain.on("show-toolbar", () => {
	mainWindow?.show();
	mainWindow?.focus();
});
app.whenReady().then(() => {
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