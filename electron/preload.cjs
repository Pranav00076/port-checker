const { contextBridge, ipcRenderer } = require("electron");

console.log("[preload] running, sandboxed:", process.sandboxed);

contextBridge.exposeInMainWorld("portChecker", {
  checkPort: (port, host) => ipcRenderer.invoke("port:check", { port, host }),
  checkPortInUse: (port, host) =>
    ipcRenderer.invoke("port:check-in-use", { port, host }),
  findPort: (startPort, host) => ipcRenderer.invoke("port:find", { startPort, host }),
});
