using System.Threading;
using Conductor.Client.Interfaces;
using Conductor.Client.Models;
using Conductor.Client.Worker;
// Alias to avoid ambiguity with System.Threading.Tasks.Task
using ConductorTask = Conductor.Client.Models.Task;

namespace StubCsharp;

/// <summary>
/// stub-csharp — C# equivalent of stub-ok.
/// Proves the .NET SDK end-to-end without porting a real C# worker.
///
/// Reads <c>payload</c> (object) and <c>latencyMs</c> (int, default 0) from
/// task input, sleeps for the configured latency, then returns COMPLETED with
/// the payload echoed back alongside a <c>receivedAt</c> timestamp.
///
/// IMPORTANT: This worker must be idempotent — Conductor may redeliver the
/// same task on retry or timeout. Re-running with the same input is safe.
/// </summary>
public class StubOkWorker : IWorkflowTask
{
    public string TaskType => "stub-csharp";

    // Default worker settings (poll interval, concurrency, etc.)
    public WorkflowTaskExecutorConfiguration WorkerSettings { get; } = new();

    /// <summary>Preferred async execution path.</summary>
    public async System.Threading.Tasks.Task<TaskResult> Execute(
        ConductorTask task,
        CancellationToken token = default)
    {
        var inputData = task.InputData ?? new Dictionary<string, object>();

        var latencyMs = inputData.TryGetValue("latencyMs", out var rawLatency)
            ? Convert.ToInt32(rawLatency)
            : 0;

        var payload = inputData.TryGetValue("payload", out var rawPayload)
            ? rawPayload
            : (object)new Dictionary<string, object>();

        if (latencyMs > 0)
        {
            await System.Threading.Tasks.Task.Delay(latencyMs, token);
        }

        Console.WriteLine($"[stub-csharp] completed (latency={latencyMs}ms)");

        return new TaskResult
        {
            TaskId = task.TaskId,
            WorkflowInstanceId = task.WorkflowInstanceId,
            Status = TaskResult.StatusEnum.COMPLETED,
            OutputData = new Dictionary<string, object>
            {
                ["echoed"] = payload,
                ["latencyMs"] = latencyMs,
                ["receivedAt"] = DateTime.UtcNow.ToString("o"),
            },
        };
    }

    /// <summary>Obsolete sync path required by the interface; delegates to async.</summary>
#pragma warning disable CS0618
    public TaskResult Execute(ConductorTask task) =>
        Execute(task, CancellationToken.None).GetAwaiter().GetResult();
#pragma warning restore CS0618
}
