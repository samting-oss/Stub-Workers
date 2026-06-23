/**
 * stub-fail
 * Returns a configurable failure outcome to test retry and non-retryable
 * task classification.
 *
 * httpStatus → Conductor outcome mapping:
 *   400 → FAILED_WITH_TERMINAL_ERROR  (non-retryable; intended to trigger compensation)
 *   429 → FAILED                      (retryable — rate-limited)
 *   500 → FAILED                      (retryable — internal server error)
 *   503 → FAILED                      (retryable — service unavailable)
 *
 * IMPORTANT: This worker must be idempotent — Conductor may redeliver the
 * same task on retry or timeout. Re-running with the same input is safe.
 */

import type { Task } from "@io-orkes/conductor-javascript";

type RetryableStatus = 429 | 500 | 503;
type TerminalStatus = 400;
type SupportedStatus = RetryableStatus | TerminalStatus;

const RETRYABLE_STATUSES = new Set<SupportedStatus>([429, 500, 503]);

export const stubFailWorker = {
  taskDefName: "stub-fail",

  execute: async (task: Task) => {
    const { httpStatus = 500, correlationId = "" } = (task.inputData ?? {}) as {
      httpStatus?: number;
      correlationId?: string;
    };

    const status = Number(httpStatus) as SupportedStatus;
    const retryable = RETRYABLE_STATUSES.has(status);

    console.log(
      `[stub-fail] httpStatus=${status} retryable=${retryable} correlationId=${correlationId}`
    );

    const outputData = {
      httpStatus: status,
      retryable,
      correlationId: correlationId || null,
    };

    if (!retryable) {
      // 400 → terminal failure; no retry, expected to trigger compensation
      return {
        status: "FAILED_WITH_TERMINAL_ERROR" as const,
        outputData,
        reasonForIncompletion: `Non-retryable failure: HTTP ${status}`,
      };
    }

    // 429 / 500 / 503 → retryable failure
    return {
      status: "FAILED" as const,
      outputData,
      reasonForIncompletion: `Retryable failure: HTTP ${status}`,
    };
  },
};
