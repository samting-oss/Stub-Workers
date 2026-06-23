/**
 * stub-compensate
 * Logs that a compensation step ran for a given correlation ID.
 * Idempotent: a second invocation with the same correlationId returns
 * COMPLETED with alreadyCompensated=true and does not re-log.
 *
 * NOTE: The seen-IDs set is in-process memory. For production, replace it
 * with a durable store (Redis, DB, etc.) to survive worker restarts.
 *
 * IMPORTANT: This worker must be idempotent — Conductor may redeliver the
 * same task on retry or timeout. Re-running with the same input is safe.
 */

import type { Task } from "@io-orkes/conductor-javascript";

/** In-memory idempotency set — swap for a durable store in production. */
const compensated = new Set<string>();

export const stubCompensateWorker = {
  taskDefName: "stub-compensate",

  execute: async (task: Task) => {
    const { correlationId = "" } = (task.inputData ?? {}) as {
      correlationId?: string;
    };

    const id = String(correlationId);
    const alreadyCompensated = compensated.has(id);

    if (!alreadyCompensated) {
      compensated.add(id);
      console.log(`[stub-compensate] compensation ran for correlationId=${id}`);
    } else {
      console.log(
        `[stub-compensate] already compensated for correlationId=${id}, skipping`
      );
    }

    return {
      status: "COMPLETED" as const,
      outputData: {
        compensated: true,
        correlationId: id,
        alreadyCompensated,
        compensatedAt: new Date().toISOString(),
      },
    };
  },
};
