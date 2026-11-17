// IPC handlers for port checking.
// All port checks happen HERE (never in the browser window) so that
// the renderer never touches Node.js APIs directly. Every handler
// uses the real portslug package.

import { ipcMain } from "electron";
import {
  isPortFree,
  isPortInUse,
  findFreePort,
} from "portslug";

// ---------------------------------------------------------------------------
// Input validation - we check everything ourselves before calling portslug.
// ---------------------------------------------------------------------------

function isValidPort(port) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function isValidHost(host) {
  return (
    typeof host === "string" &&
    host.length > 0 &&
    host.length <= 253 &&
    /^[A-Za-z0-9._-]+$/.test(host)
  );
}

// Wrap a portslug call with validation and friendly error handling.
async function runPortslug(payload, action) {
  const { port, startPort, host = "127.0.0.1" } = payload ?? {};

  if (port !== undefined && !isValidPort(port)) {
    return { ok: false, error: "Invalid port. Expected an integer between 1 and 65535." };
  }
  if (startPort !== undefined && !isValidPort(startPort)) {
    return { ok: false, error: "Invalid starting port. Expected an integer between 1 and 65535." };
  }
  if (!isValidHost(host)) {
    return { ok: false, error: "Invalid host. Use something like 127.0.0.1 or localhost." };
  }

  try {
    return await action();
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// IPC handlers - one per function the renderer is allowed to call.
// ---------------------------------------------------------------------------

export function registerPortHandlers() {
  // portslug.isPortFree(port, host) -> true when the port can be bound.
  ipcMain.handle("port:check", (_event, payload) =>
    runPortslug(payload, async () => {
      const free = await isPortFree(payload.port, payload.host);
      return { ok: true, free };
    })
  );

  // portslug.isPortInUse(port, host) -> true when the port is occupied.
  ipcMain.handle("port:check-in-use", (_event, payload) =>
    runPortslug(payload, async () => {
      const inUse = await isPortInUse(payload.port, payload.host);
      return { ok: true, inUse };
    })
  );

  // portslug.findFreePort(startPort, host) -> first available port.
  ipcMain.handle("port:find", (_event, payload) =>
    runPortslug(payload, async () => {
      const freePort = await findFreePort(payload.startPort, payload.host);
      return { ok: true, freePort };
    })
  );
}
