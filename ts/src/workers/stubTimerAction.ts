/**
 * stub-timer-action
 * Tiny activity invoked after a timer fires. Computes and logs the elapsed
 * time since the timer started.
 *
 * Input `timerStartedAt` may be:
 *   - An ISO 8601 string  (e.g. "2026-06-22T14:00:00.000Z")
 *   - An epoch-ms number  (e.g. 1750600000000)
 *
 * IMPORTANT: This worker must be idempotent — Conductor may redeliver the
 * same task on retry or timeout. Re-running with the same input is safe.
 */

import type { Task } from "@io-orkes/conductor-javascript";

export const stubTimerActionWorker = {
  taskDefName: "stub-timer-action",

  execute: async (task: Task) => {
    const { timerStartedAt } = (task.inputData ?? {}) as {
      timerStartedAt?: string | number;
    };

    const firedAt = new Date().toISOString();

    if (timerStartedAt === undefined || timerStartedAt === null) {
      console.warn("[stub-timer-action] timerStartedAt not provided");
      return {
        status: "COMPLETED" as const,
        outputData: { firedAt, elapsedMs: null, warning: "timerStartedAt not provided" },
      };
    }

    const startMs =
      typeof timerStartedAt === "number"
        ? timerStartedAt
        : new Date(timerStartedAt as string).getTime();

    if (isNaN(startMs)) {
      return {
        status: "FAILED_WITH_TERMINAL_ERROR" as const,
        outputData: { firedAt, timerStartedAt },
        reasonForIncompletion: `Cannot parse timerStartedAt: ${timerStartedAt}`,
      };
    }

    const elapsedMs = Date.now() - startMs;

    console.log(
      `[stub-timer-action] elapsed=${elapsedMs}ms firedAt=${firedAt}`
    );

    return {
      status: "COMPLETED" as const,
      outputData: { elapsedMs, firedAt },
    };
  },
};
