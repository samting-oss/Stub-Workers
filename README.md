# Roadpost POC — Conductor Stub Workers

Six drop-in stub workers for Conductor/Orkes POC kickoff. They exercise the platform's core behaviours
(happy path, retry, non-retryable failure, flaky/backoff, compensation, and timer) without any real
business logic.

## Stubs at a glance

| Name | Language | Behaviour |
|---|---|---|
| `stub-ok` | TypeScript | Returns 200 with the input payload echoed back. Configurable latency. |
| `stub-fail` | TypeScript | Returns a configurable HTTP status (500, 503, 429, 400) → FAILED (retryable) or FAILED_WITH_TERMINAL_ERROR (non-retryable). |
| `stub-flaky` | TypeScript | Fails the first N calls (driven by Conductor's own `retryCount`) then succeeds. |
| `stub-compensate` | TypeScript | Logs a compensation step for a correlation ID. Idempotent. |
| `stub-timer-action` | TypeScript | Logs elapsed time since a timer started. |
| `stub-csharp` | C# / .NET 9 | .NET SDK equivalent of stub-ok. Proves the .NET SDK end-to-end. |

## Requirements

- **Node.js** ≥ 20 (`node --version`)
- **.NET** 9 (`dotnet --version`)
- A Conductor/Orkes server (local or remote) for live polling — see [conductor/REGISTER.md](conductor/REGISTER.md)

## TypeScript workers (`ts/`)

```bash
cd ts
cp .env.example .env          # fill in CONDUCTOR_SERVER_URL (+ auth key/secret for Orkes)
npm install
npm run start                 # polls all 5 task types until Ctrl-C
```

Type-check only (no server needed):

```bash
npm run typecheck
```

### Configuration

Edit `.env`:

```
CONDUCTOR_SERVER_URL=http://localhost:8080/api
CONDUCTOR_AUTH_KEY=           # leave blank for unauthenticated local server
CONDUCTOR_AUTH_SECRET=
```

## C# worker (`csharp/`)

```bash
cd csharp
# Set env vars before running (or add to a .env file loaded by your shell):
#   CONDUCTOR_SERVER_URL=http://localhost:8080/api
#   CONDUCTOR_AUTH_KEY=...
#   CONDUCTOR_AUTH_SECRET=...
dotnet run
```

Build only (no server needed):

```bash
dotnet build
```

## Register with Conductor

Task definitions and schemas live in `conductor/`. Follow [conductor/REGISTER.md](conductor/REGISTER.md)
to register them once a server is available.

## Project layout

```
roadpost-poc/
├── ts/                         TypeScript workers (5 stubs)
│   ├── src/
│   │   ├── client.ts           Conductor client from env vars
│   │   ├── workers/            One file per stub
│   │   └── index.ts            TaskManager entry point
│   ├── package.json
│   └── tsconfig.json
├── csharp/                     C# worker (stub-csharp)
│   ├── StubCsharp.csproj
│   ├── Program.cs
│   └── StubOkWorker.cs
└── conductor/
    ├── taskdefs/               Task definitions (6 JSON files)
    ├── schemas/                Input/output JSON Schemas (12 JSON files)
    └── REGISTER.md             Registration commands
```
