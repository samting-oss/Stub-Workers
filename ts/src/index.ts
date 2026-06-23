/**
 * Entry point for all TypeScript stub workers.
 * Registers stub-ok, stub-fail, stub-flaky, stub-compensate, and
 * stub-timer-action with a single TaskManager and starts polling.
 */
import { TaskManager } from "@io-orkes/conductor-javascript";
import { createClient } from "./client";
import { stubOkWorker } from "./workers/stubOk";
import { stubFailWorker } from "./workers/stubFail";
import { stubFlakyWorker } from "./workers/stubFlaky";
import { stubCompensateWorker } from "./workers/stubCompensate";
import { stubTimerActionWorker } from "./workers/stubTimerAction";

async function main() {
  const client = await createClient();

  const serverUrl =
    process.env.CONDUCTOR_SERVER_URL ?? "http://localhost:8080/api";

  console.log(`Connecting to Conductor at ${serverUrl}`);

  const manager = new TaskManager(client, [
    stubOkWorker,
    stubFailWorker,
    stubFlakyWorker,
    stubCompensateWorker,
    stubTimerActionWorker,
  ]);

  manager.startPolling();

  console.log(
    "Polling for: stub-ok, stub-fail, stub-flaky, stub-compensate, stub-timer-action"
  );
  console.log("Press Ctrl-C to stop.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
