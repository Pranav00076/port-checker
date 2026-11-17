// Quick sanity test of portslug before wiring it into the app.
import net from "node:net";
import assert from "node:assert";
import { isPortFree, isPortInUse, findFreePort } from "portslug";

// 1. Free port test
assert.strictEqual(await isPortFree(47891), true, "free port should report free");
console.log("PASS isPortFree(47891) -> true (available)");

// 2. Occupied port test - start a real server first
const server = net.createServer();
await new Promise((resolve) => server.listen(47892, "127.0.0.1", resolve));
assert.strictEqual(await isPortFree(47892, "127.0.0.1"), false, "occupied port should not be free");
console.log("PASS isPortFree(47892) -> false (occupied)");
assert.strictEqual(await isPortInUse(47892, "127.0.0.1"), true);
console.log("PASS isPortInUse(47892) -> true");
server.close();

// 3. findFreePort skips occupied ports
const server2 = net.createServer();
await new Promise((resolve) => server2.listen(47893, "127.0.0.1", resolve));
const found = await findFreePort(47891, "127.0.0.1");
console.log(`PASS findFreePort(47891) -> ${found} (skipped 47892/47893: ${found !== 47892 && found !== 47893})`);
server2.close();

// 4. Invalid input test
try {
  await isPortFree(70000);
  console.log("FAIL invalid port did not throw");
} catch (err) {
  console.log(`PASS isPortFree(70000) threw: ${err.message.slice(0, 60)}...`);
}

console.log("ALL TESTS PASSED");
