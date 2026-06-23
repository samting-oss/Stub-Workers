# Registering Stubs with Conductor

Run these steps once you have a Conductor/Orkes server available.

## Prerequisites

```bash
# Install the Conductor CLI (once)
npm install -g @conductor-oss/conductor-cli

# Verify
conductor --version
```

## Step 1 — Point the CLI at your server

```bash
export CONDUCTOR_SERVER_URL=https://your-server/api    # or http://localhost:8080/api

# For Orkes Cloud / enterprise:
export CONDUCTOR_AUTH_KEY=<your-key>
export CONDUCTOR_AUTH_SECRET=<your-secret>
```

Test connectivity:

```bash
conductor workflow list
```

If you get 401/403, double-check the key/secret above.

## Step 2 — Register input/output schemas

Schemas must be registered **before** task definitions (task defs reference them by name).

### Using the Orkes REST API directly

```bash
BASE="${CONDUCTOR_SERVER_URL%/api}"    # strips trailing /api to get the base URL

for f in schemas/*.json; do
  echo "Registering schema: $f"
  curl -s -X POST "${CONDUCTOR_SERVER_URL}/metadata/schema" \
    -H "Content-Type: application/json" \
    -d @"$f"
  echo ""
done
```

With auth token (Orkes):

```bash
# Obtain a token first if needed (replace with your auth provider flow)
TOKEN=$(curl -s -X POST "${CONDUCTOR_SERVER_URL}/token" \
  -H "Content-Type: application/json" \
  -d "{\"keyId\":\"${CONDUCTOR_AUTH_KEY}\",\"keySecret\":\"${CONDUCTOR_AUTH_SECRET}\"}" \
  | jq -r .token)

for f in schemas/*.json; do
  echo "Registering schema: $f"
  curl -s -X POST "${CONDUCTOR_SERVER_URL}/metadata/schema" \
    -H "Content-Type: application/json" \
    -H "X-Authorization: ${TOKEN}" \
    -d @"$f"
  echo ""
done
```

Verify schemas are registered:

```bash
curl -s "${CONDUCTOR_SERVER_URL}/metadata/schema" | jq '[.[].name]'
# Expected: includes "stub-ok.input", "stub-ok.output", "stub-fail.input", etc.
```

## Step 3 — Register task definitions

```bash
# Register all six task definitions
for f in taskdefs/*.json; do
  echo "Registering task def: $f"
  conductor taskDef create "$f"
done
```

Verify:

```bash
conductor taskDef list
# stub-ok, stub-fail, stub-flaky, stub-compensate, stub-timer-action, stub-csharp
# should all appear
```

## Step 4 — Start the workers

In separate terminals (or process manager):

```bash
# TypeScript (all 5 stubs)
cd ../ts && npm install && npm run start

# C# (stub-csharp)
cd ../csharp && dotnet run
```

## Step 5 — Use in a workflow

Drop any stub into a workflow definition as a `SIMPLE` task. The `name` field must match the stub name:

```json
{
  "name": "stub-ok",
  "taskReferenceName": "echo_step",
  "type": "SIMPLE",
  "inputParameters": {
    "payload": "${workflow.input.myPayload}",
    "latencyMs": 200
  }
}
```

The Orkes designer will show the schema-driven form fields automatically once schemas are registered.
Step-level execution history will surface the typed inputs and outputs as configured in the schemas.

## Stub quick-reference

| Task name | Language | Key inputs | Key outputs |
|---|---|---|---|
| `stub-ok` | TS | `payload`, `latencyMs` | `echoed`, `receivedAt` |
| `stub-fail` | TS | `httpStatus` (400/429/500/503) | `retryable`, `httpStatus` |
| `stub-flaky` | TS | `failUntilAttempt` (N) | `succeededOnAttempt` |
| `stub-compensate` | TS | `correlationId` | `alreadyCompensated` |
| `stub-timer-action` | TS | `timerStartedAt` | `elapsedMs`, `firedAt` |
| `stub-csharp` | C# | `payload`, `latencyMs` | `echoed`, `receivedAt` |
