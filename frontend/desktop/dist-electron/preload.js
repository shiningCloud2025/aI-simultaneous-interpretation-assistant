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
	showToolbar: () => electron.ipcRenderer.send("show-toolbar")
});
//#endregion

//# sourceMappingURL=preload.js.map