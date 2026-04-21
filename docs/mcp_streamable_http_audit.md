# MCP Streamable HTTP (JSON + SSE) & Audit — ZombieCoder

## Scope

This document describes the current state of ZombieCoder’s MCP-facing transports and the WebSocket gateway test harness, with an emphasis on *auditability* and *transport behavior*.

It covers:

- `/mcp` endpoint behavior (JSON-RPC 2.0)
- Streamable HTTP negotiation via `Accept: text/event-stream` (SSE)
- `/sse` alias/proxy to `/mcp`
- Self-probe/monitor endpoint (`/api/mcp/monitor`)
- WebSocket gateway (mini-service `stock-server`) and its audit UI pages

## Endpoints (Current)

### Next.js MCP endpoint

- **URL**: `http://localhost:3000/mcp`
- **Methods**:
  - `POST` JSON-RPC requests (`initialize`, `tools/list`, `tools/call`, etc.)
  - `GET` compatibility probing (responds, used by some clients for discovery/health)
- **Transport negotiation**:
  - Default: `application/json`
  - If request `Accept` includes `text/event-stream`, the route emits SSE formatted output.

### Next.js SSE alias

- **URL**: `http://localhost:3000/sse`
- **Purpose**: Alias/proxy to `/mcp` for clients that assume a separate `/sse` path.
- **Behavior**: Forwards method/body and preserves relevant headers (notably `Accept`).

### MCP monitor probe

- **URL**: `http://localhost:3000/api/mcp/monitor`
- **Purpose**: Server-side, SDK-free probe that calls local `/mcp` over JSON-RPC and returns:
  - initialize latency
  - tools list
  - resources list

This enables *self-verification* without relying on external editors.

### WebSocket gateway (mini-service)

- **Service path**: `mini-services/stock-server`
- **WS URL**: `ws://localhost:9998/ws`
- **HTTP test UI**:
  - `http://localhost:9998/test`
  - `http://localhost:9998/mcp-audit`

The WS gateway is designed for long-lived connections with heartbeat and standard events.

## JSON-RPC Methods (MCP)

The `/mcp` route implements a minimal MCP-compatible JSON-RPC surface:

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list` (stub/compat)
- `prompts/list` (stub/compat)
- `ping`
- `logging/setLevel` (compat)

Note: MCP best practice is to return **HTTP 200** even for JSON-RPC errors, to avoid client noise and allow protocol-level error handling.

## Streamable HTTP via SSE

### What’s supported now

- POST-driven SSE responses when the client sends `Accept: text/event-stream`.
- Keep-alive comments can be used by infrastructure to keep the connection open.

### What is *not* implemented yet (explicitly)

- A GET-driven, long-lived SSE session ledger (server-minted `sessionId` persisted and tied to auth).
- Tool-call permission enforcement / deny-by-default policy.

Those are the next hardening steps if the endpoint is to be exposed via a public tunnel.

## Audit model (Current vs Required)

### Current

- Transport-level observability exists (SSE, `/sse` alias, monitor probe).
- WS gateway emits/records standard events and has basic heartbeat.

### Required (Hardening Plan)

To prevent “tool = weapon” risks, the server needs a **Policy Enforcement Point** before executing any tool:

- deny-by-default tool execution
- auth-bound sessions (subject + fingerprint + expiry)
- per-tool/per-agent permission gates
- structured audit logging per `tools/call`:
  - client identity
  - sessionId
  - tool name
  - validated input snapshot
  - execution time
  - result hash/summary + error

## How to test

### MCP JSON (non-SSE)

- Send JSON-RPC via `POST /mcp` with `Content-Type: application/json`.
- Use `initialize` then `tools/list`.

### MCP SSE

- Repeat, but add header: `Accept: text/event-stream`.
- Verify response is SSE formatted.

### Monitor

- `GET /api/mcp/monitor` returns probe results.

### WS gateway

- Open `http://localhost:9998/mcp-audit`
- Connect WS and observe `session.init`, `client.register`, heartbeat events.

## Implementation references

- Next.js MCP route: `src/app/mcp/route.ts`
- SSE alias route: `src/app/sse/route.ts`
- MCP monitor service: `src/services/mcpClientMonitor.ts`
- MCP monitor API: `src/app/api/mcp/monitor/route.ts`
- WS gateway: `mini-services/stock-server/index.ts`

