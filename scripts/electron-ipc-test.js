// Automated IPC test: launches a hidden Electron window, loads the built
// renderer, and calls the three preload functions through IPC to confirm
// they reach portslug in the main process. Logs results and quits.

import { app, BrowserWindow } from "electron";
import net from "node:net";
import path from "node:path";
import { registerPortHandlers } from "../electron/ipc.js";

// Never hang: quit after 20 seconds no matter what.
setTimeout(() => {
  console.log("TIMEOUT - quitting");
  app.quit();
}, 20000).unref();

// The test registers the same IPC handlers the real app uses.
registerPortHandlers();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(import.meta.dirname, "..", "electron", "preload.cjs"),
    },
  });

  win.webContents.on("did-fail-load", (_e, code, desc) => {
    console.error("did-fail-load:", code, desc);
  });
  win.webContents.on("preload-error", (_e, p, err) => {
    console.error("preload-error:", p, err.message);
  });
  win.webContents.on("did-finish-load", () => console.log("renderer loaded"));

  await win.loadFile(path.join(import.meta.dirname, "..", "dist", "index.html"));
  console.log("loadFile resolved");

  // Start a real server on 47902 so the port is genuinely occupied.
  const server = net.createServer();
  await new Promise((resolve) => server.listen(47902, "127.0.0.1", resolve));

  const results = await win.webContents.executeJavaScript(`
    (async () => {
      const pc = window.portChecker;
      if (!pc) return { fatal: "window.portChecker is missing" };
      const out = {};

      out.free = await pc.checkPort(47901, "127.0.0.1");
      out.invalid = await pc.checkPort(70000, "127.0.0.1");
      out.badHost = await pc.checkPort(3000, "bad host!");
      out.find = await pc.findPort(47901, "127.0.0.1");
      out.inUse = await pc.checkPortInUse(47901, "127.0.0.1");
      // Port 47902 is genuinely occupied by the server started above.
      out.occupied = await pc.checkPortInUse(47902, "127.0.0.1");

      return out;
    })()
  `);

  console.log("RESULTS " + JSON.stringify(results));
  server.close();
  app.quit();
});
