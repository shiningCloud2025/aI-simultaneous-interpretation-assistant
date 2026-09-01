let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	getModels: () => electron.ipcRenderer.invoke("get-models"),
	setModel: (type, model) => electron.ipcRenderer.invoke("set-model", {
		type,
		model
	}),
	onModelChanged: (callback) => {
		electron.ipcRenderer.on("model-changed", (_event, data) => callback(data));
	},
	hideToolbar: () => electron.ipcRenderer.send("hide-toolbar"),
	showToolbar: () => electron.ipcRenderer.send("show-toolbar"),
	setWindowMode: (mode) => electron.ipcRenderer.send("set-window-mode", mode),
	onAppModeChanged: (callback) => {
		electron.ipcRenderer.on("app-mode-changed", (_event, mode) => callback(mode));
	},
	openPlatformExternal: (url) => electron.ipcRenderer.send("open-platform-external", url),
	toggleFullscreen: () => electron.ipcRenderer.send("toggle-fullscreen"),
	updateTrayModels: (payload) => electron.ipcRenderer.send("update-tray-models", payload),
	startResize: (edge) => {
		electron.ipcRenderer.send("start-resize", edge);
		const onUp = () => {
			electron.ipcRenderer.send("resize-end");
			document.removeEventListener("mouseup", onUp);
		};
		document.addEventListener("mouseup", onUp);
	}
});
//#endregion

//# sourceMappingURL=preload.js.map