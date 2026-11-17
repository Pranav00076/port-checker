# PortSlug – Port Checker

A small, beginner-friendly Electron desktop app that checks which TCP ports
are available on your machine. All port checks are powered by the
[portslug](https://www.npmjs.com/package/portslug) npm package.

## How it works

```text
React app (src/)          Electron main process (electron/)
─────────────────         ──────────────────────────────────
window.portChecker  ──IPC──▶  portslug.isPortFree()
  .checkPort()               portslug.isPortInUse()
  .checkPortInUse()          portslug.findFreePort()
  .findPort()
```

- The renderer (React) never touches Node.js or TCP directly.
- `nodeIntegration: false` and `contextIsolation: true` are enforced.
- The preload script exposes only three narrow functions; every real
  port check runs in the Electron main process using **portslug**.

## Getting started

```bash
npm install        # install dependencies (including portslug)
npm run dev        # start Vite + Electron for development
```

## Building

```bash
npm run build      # build the renderer into dist/
npm run dist       # build + package a desktop installer (electron-builder)
```

`npm run dist` produces:

- **macOS**: a `.dmg` in the `release/` folder
- **Windows**: an `.exe` installer (NSIS)
- **Linux**: an `.AppImage`

## Checks you can do in the app

1. **Check Port** – is one port free or already in use?
2. **Find Available Port** – find the first free port starting from a number.
3. **Check a port range** – list up to 25 ports with their status.

## Verifying the setup

Two quick test scripts are included:

```bash
node scripts/test-portslug.mjs          # tests portslug directly in Node
npx electron scripts/electron-ipc-test.js  # tests the full IPC chain in Electron
```

Both should print `PASS` lines for free ports, occupied ports, and
invalid input.
