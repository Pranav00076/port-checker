import { useState } from "react";

// These functions are exposed by the Electron preload script.
// Every real port check happens in the Electron main process using portslug.
const portChecker = window.portChecker;

const MAX_RANGE = 25; // keep the range checker small and fast

// Simple client-side validation so beginners get instant feedback.
// The same checks are repeated (safely) in the Electron main process.
function isValidPort(value) {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

function isValidHost(host) {
  return typeof host === "string" && /^[A-Za-z0-9._-]+$/.test(host);
}

function parsePort(text) {
  const port = Number(text);
  return isValidPort(port) ? port : null;
}

export default function App() {
  // --- Single port check ---
  const [port, setPort] = useState("3000");
  const [host, setHost] = useState("127.0.0.1");
  const [result, setResult] = useState(null); // null | "loading" | {kind, ...}

  // --- Find available port ---
  const [findResult, setFindResult] = useState(null); // null | "loading" | {kind, ...}

  // --- Range check (optional extra) ---
  const [rangeStart, setRangeStart] = useState("3000");
  const [rangeEnd, setRangeEnd] = useState("3005");
  const [rangeRows, setRangeRows] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  async function handleCheckPort() {
    const parsed = parsePort(port);
    if (!parsed) {
      setResult({ kind: "error", message: "Port must be a number between 1 and 65535." });
      return;
    }
    if (!isValidHost(host)) {
      setResult({ kind: "error", message: "Host can only contain letters, numbers, dots, dashes and underscores." });
      return;
    }

    setResult("loading");
    try {
      // portslug.isPortFree() runs in the Electron main process.
      const free = await portChecker.checkPort(parsed, host);
      setResult({
        kind: free ? "free" : "busy",
        port: parsed,
        host,
      });
    } catch (error) {
      setResult({ kind: "error", message: error.message });
    }
  }

  async function handleCheckInUse() {
    const parsed = parsePort(port);
    if (!parsed) {
      setResult({ kind: "error", message: "Port must be a number between 1 and 65535." });
      return;
    }
    if (!isValidHost(host)) {
      setResult({ kind: "error", message: "Host can only contain letters, numbers, dots, dashes and underscores." });
      return;
    }

    setResult("loading");
    try {
      // portslug.isPortInUse() runs in the Electron main process.
      const inUse = await portChecker.checkPortInUse(parsed, host);
      setResult({
        kind: inUse ? "busy" : "free",
        port: parsed,
        host,
      });
    } catch (error) {
      setResult({ kind: "error", message: error.message });
    }
  }

  async function handleFindPort() {
    const parsed = parsePort(port);
    if (!parsed) {
      setFindResult({ kind: "error", message: "Port must be a number between 1 and 65535." });
      return;
    }
    if (!isValidHost(host)) {
      setFindResult({ kind: "error", message: "Host can only contain letters, numbers, dots, dashes and underscores." });
      return;
    }

    setFindResult("loading");
    try {
      // portslug.findFreePort() runs in the Electron main process.
      const freePort = await portChecker.findPort(parsed, host);
      setFindResult({ kind: "found", port: freePort, host });
    } catch (error) {
      setFindResult({ kind: "error", message: error.message });
    }
  }

  async function handleRangeCheck() {
    const start = parsePort(rangeStart);
    const end = parsePort(rangeEnd);
    if (!start || !end) {
      setRangeRows({ kind: "error", message: "Both ports must be numbers between 1 and 65535." });
      return;
    }
    if (start > end) {
      setRangeRows({ kind: "error", message: "Starting port must be smaller than or equal to the ending port." });
      return;
    }
    if (end - start + 1 > MAX_RANGE) {
      setRangeRows({ kind: "error", message: `Please check ${MAX_RANGE} ports at a time or less.` });
      return;
    }
    if (!isValidHost(host)) {
      setRangeRows({ kind: "error", message: "Host can only contain letters, numbers, dots, dashes and underscores." });
      return;
    }

    setRangeLoading(true);
    try {
      // One checkPort call per port - each one is a portslug.isPortFree() check.
      const checks = [];
      for (let p = start; p <= end; p++) {
        checks.push(
          portChecker.checkPort(p, host).then(
            (free) => ({ port: p, free }),
            (error) => ({ port: p, error: error.message })
          )
        );
      }
      const rows = await Promise.all(checks);
      setRangeRows({ kind: "ok", rows });
    } catch (error) {
      setRangeRows({ kind: "error", message: error.message });
    } finally {
      setRangeLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <img src="/portsluglogo.png" alt="portslug logo" className="logo" />
        <div>
          <h1 className="title">Port Checker</h1>
          <p className="subtitle">Check which TCP ports are available on your machine.</p>
        </div>
      </header>

      {/* ---- Port checking ---- */}
      <section className="card">
        <h2 className="card-title">Check a port</h2>
        <div className="row">
          <label className="field">
            <span>Port number</span>
            <input
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="3000"
              inputMode="numeric"
            />
          </label>
          <label className="field">
            <span>Host</span>
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="127.0.0.1" />
          </label>
        </div>
        <div className="row buttons">
          <button className="btn primary" onClick={handleCheckPort}>
            Check Port
          </button>
          <button className="btn secondary" onClick={handleFindPort}>
            Find Available Port
          </button>
        </div>

        {result === "loading" && <p className="status">Checking…</p>}
        {result && result !== "loading" && (
          <div className={`result ${result.kind}`}>
            {result.kind === "free" && (
              <>
                <span className="dot" />
                <div>
                  <strong>Port is Available</strong>
                  <p>
                    Port {result.port} on {result.host} is free to use.
                  </p>
                </div>
              </>
            )}
            {result.kind === "busy" && (
              <>
                <span className="dot" />
                <div>
                  <strong>Port is Already in Use</strong>
                  <p>
                    Port {result.port} on {result.host} is currently occupied.
                  </p>
                </div>
              </>
            )}
            {result.kind === "error" && (
              <div>
                <strong>Something went wrong</strong>
                <p>{result.message}</p>
              </div>
            )}
          </div>
        )}

        {findResult === "loading" && <p className="status">Searching for a free port…</p>}
        {findResult && findResult !== "loading" && (
          <div className={`result ${findResult.kind === "found" ? "free" : "error"}`}>
            {findResult.kind === "found" ? (
              <>
                <span className="dot" />
                <div>
                  <strong>Found a free port: {findResult.port}</strong>
                  <p>Starting the search from port {port} on {findResult.host}.</p>
                </div>
              </>
            ) : (
              <div>
                <strong>Could not find a port</strong>
                <p>{findResult.message}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---- Optional range check ---- */}
      <section className="card">
        <h2 className="card-title">Check a port range</h2>
        <p className="hint">Checks up to {MAX_RANGE} ports, one by one, using portslug.</p>
        <div className="row">
          <label className="field">
            <span>Starting port</span>
            <input
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="field">
            <span>Ending port</span>
            <input
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              inputMode="numeric"
            />
          </label>
        </div>
        <button className="btn primary" onClick={handleRangeCheck} disabled={rangeLoading}>
          {rangeLoading ? "Checking…" : "Check Range"}
        </button>

        {rangeRows && rangeRows.kind === "error" && (
          <div className="result error">
            <div>
              <strong>Could not check the range</strong>
              <p>{rangeRows.message}</p>
            </div>
          </div>
        )}

        {rangeRows && rangeRows.kind === "ok" && (
          <table className="range-table">
            <thead>
              <tr>
                <th>Port</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rangeRows.rows.map((row) => (
                <tr key={row.port}>
                  <td>{row.port}</td>
                  <td className={row.free ? "free-text" : "busy-text"}>
                    {row.free ? "Available" : "In Use"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="footer">
        Powered by <span className="brand">portslug</span> – tiny Node.js dev utilities.
      </footer>
    </div>
  );
}
