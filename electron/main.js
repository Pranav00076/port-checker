// PortSlug Port Checker - Electron main process.

import { app, BrowserWindow } from "electron";
import path from "node:path";
import { registerPortHandlers } from "./ipc.js";

// All the port-checking IPC handlers (they use portslug internally).
registerPortHandlers();

function createWindow() {
  const win = new BrowserWindow({
    width: 780,
    height: 760,
    minWidth: 560,
    title: "PortSlug – Port Checker",
    backgroundColor: "#0d0d17",
    webPreferences: {
      // Security: no Node.js in the renderer, isolated context only.
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(import.meta.dirname, "preload.cjs"),
    },
  });

  // During development we load the Vite dev server;
  // in the packaged app we load the built files.
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(import.meta.dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS, re-create the window when the dock icon is clicked.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // Quit even on macOS - this is a simple utility app.
  app.quit();
});
