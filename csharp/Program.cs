/**
 * stub-csharp worker host.
 * Reads CONDUCTOR_SERVER_URL (required), CONDUCTOR_AUTH_KEY and
 * CONDUCTOR_AUTH_SECRET (optional, for Orkes Cloud / enterprise) from
 * environment variables, then starts polling for "stub-csharp" tasks.
 *
 * Usage:
 *   export CONDUCTOR_SERVER_URL=http://localhost:8080/api
 *   dotnet run
 */
using Conductor.Client;
using Conductor.Client.Authentication;
using Conductor.Client.Extensions;   // WorkflowTaskHost
using Microsoft.Extensions.Hosting;  // IHost.RunAsync()
using Microsoft.Extensions.Logging;
using StubCsharp;

var serverUrl =
    Environment.GetEnvironmentVariable("CONDUCTOR_SERVER_URL")
    ?? "http://localhost:8080/api";

var authKey = Environment.GetEnvironmentVariable("CONDUCTOR_AUTH_KEY");
var authSecret = Environment.GetEnvironmentVariable("CONDUCTOR_AUTH_SECRET");

Console.WriteLine($"[stub-csharp] Connecting to Conductor at {serverUrl}");

// Build the client configuration from environment.
var configuration = new Configuration { BasePath = serverUrl };
if (!string.IsNullOrEmpty(authKey) && !string.IsNullOrEmpty(authSecret))
{
    configuration.AuthenticationSettings = new OrkesAuthenticationSettings(authKey, authSecret);
    Console.WriteLine("[stub-csharp] Auth enabled (key/secret from env)");
}
else
{
    Console.WriteLine("[stub-csharp] No auth configured (unauthenticated mode)");
}

// Start the worker host. The SDK polls for "stub-csharp" tasks automatically.
var host = WorkflowTaskHost.CreateWorkerHost(
    configuration,
    LogLevel.Information,
    new StubOkWorker()
);

Console.WriteLine("[stub-csharp] Polling for tasks. Press Ctrl-C to stop.");

// RunAsync = StartAsync + WaitForShutdownAsync
await host.RunAsync();
