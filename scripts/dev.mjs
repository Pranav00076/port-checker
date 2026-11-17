// Development helper: starts the Vite dev server, waits for it to be ready,
// then launches Electron pointing at it. Press Ctrl+C (or close the app
// window) to stop everything.

import { spawn } from "node:child_process";

const DEV_SERVER_URL = "http://localhost:5173";

function start(name, command, args, env = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  child.on("exit", (code) => {
    if (code !== 0) console.error(`${name} exited with code ${code}`);
  });
  return child;
}

// 1. Start Vite.
const vite = start("vite", "npx", ["vite"]);

// 2. Wait until the dev server answers, then launch Electron.
async function waitUntilReady() {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(DEV_SERVER_URL);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  return false;
}

const ready = await waitUntilReady();
if (!ready) {
  console.error("Vite dev server did not start in time.");
  vite.kill();
  process.exit(1);
}

const electron = start("electron", "npx", ["electron", "electron/main.js"], {
  VITE_DEV_SERVER_URL: DEV_SERVER_URL,
});

// 3. When Electron closes, stop Vite too.
electron.on("exit", () => {
  vite.kill();
  process.exit(0);
});

// Stop both processes on Ctrl+C.
process.on("SIGINT", () => {
  vite.kill();
  electron.kill();
  process.exit(0);
});
