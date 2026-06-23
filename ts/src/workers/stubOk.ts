/**
 * stub-ok
 * Returns COMPLETED with the input payload echoed back.
 * Configurable latency via `latencyMs` input (default 0).
 *
 * IMPORTANT: This worker must be idempotent — Conductor may redeliver the
 * same task on retry or timeout. Re-running with the same input is safe.
 */

import type { Task } from "@io-orkes/conductor-javascript";

/** Small helper; avoids importing a sleep library. */
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const stubOkWorker = {
  taskDefName: "stub-ok",

  execute: async (task: Task) => {
    const input = (task.inputData ?? {}) as {
      payload?: Record<string, unknown>;
      latencyMs?: number;
    };
    const { payload = {}, latencyMs = 0 } = input;

    const delayMs = Math.max(0, Number(latencyMs));

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    console.log(`[stub-ok] completed (latency=${delayMs}ms)`);

    return {
      status: "COMPLETED" as const,
      outputData: {
        echoed: payload,
        latencyMs: delayMs,
        receivedAt: new Date().toISOString(),
      },
    };
  },
};
