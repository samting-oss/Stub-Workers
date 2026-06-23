/**
 * stub-flaky
 * Fails the first N calls then succeeds. N is provided via the `failUntilAttempt`
 * input parameter. Uses Conductor's own `retryCount` field (0-based) so the
 * worker is fully stateless — no shared state, no external store needed.
 *
 * Behaviour:
 *   retryCount < failUntilAttempt → FAILED  (Conductor retries with backoff)
 *   retryCount >= failUntilAttempt → COMPLETED
 *
 * Example with failUntilAttempt=2:
 *   attempt 1 (retryCount=0) → FAILED
 *   attempt 2 (retryCount=1) → FAILED
 *   attempt 3 (retryCount=2) → COMPLETED  (succeededOnAttempt=3)
 *
 * IMPORTANT: This worker must be idempotent — Conductor may redeliver the
 * same task on retry or timeout. Re-running with the same input is safe.
 */

import type { Task } from "@io-orkes/conductor-javascript";

export const stubFlakyWorker = {
  taskDefName: "stub-flaky",

  execute: async (task: Task) => {
    const { failUntilAttempt = 1 } = (task.inputData ?? {}) as {
      failUntilAttempt?: number;
    };

    const retryCount = task.retryCount ?? 0;
    const threshold = Math.max(0, Number(failUntilAttempt));

    console.log(
      `[stub-flaky] retryCount=${retryCount} failUntilAttempt=${threshold}`
    );

    if (retryCount < threshold) {
      return {
        status: "FAILED" as const,
        outputData: { retryCount, failUntilAttempt: threshold },
        reasonForIncompletion: `Intentional flaky failure (attempt ${retryCount + 1} of ${threshold + 1})`,
      };
    }

    return {
      status: "COMPLETED" as const,
      outputData: {
        succeededOnAttempt: retryCount + 1,
        failUntilAttempt: threshold,
      },
    };
  },
};
