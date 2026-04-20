MCP + Editor Socket Integration Plan
This plan makes MCP usable from any editor via a copy-paste config, fixes provider/model default + mismatch errors without fake responses, introduces ChatGPT-style conversations within sessions, and adds an Editor connections page to prove real socket + agent behavior.

1) Universal MCP config (c:\Users\sahon\api/.mcp/mcp_config.json)
Update the file to be editor-agnostic and copy-paste friendly.
Include two server entries:
HTTP MCP (Next.js http://localhost:3000/api/mcp/*) for tools + logs.
WebSocket stock-server (ws://localhost:9998/) for editor session + streaming chat.
Add clear placeholders and env vars (no hardcoded secrets):
UAS_API_KEY for MCP tool execution.
STOCK_SERVER_BASE_URL (default http://localhost:9998).
STOCK_DEFAULT_MODEL (default gemma2:2b).
Provide “snippets” blocks for:
VSCode/Windsurf/Cursor-like MCP settings.
“Universal” section: URLs + headers + example register payload.
2) Provider/model default + mismatch handling (no fake responses)
Implement a strict but safe fallback rule:
Agent model > request model > DB provider default model > env global default.
If provider is missing/unavailable and no env fallback exists: return a real error (no demo/mocked text).
Fix mismatch scenario you mentioned (Ollama default but Gemini response path causing error) by:
Ensuring the chosen provider for each request is explicit (agent/provider binding),
Validating model existence for that provider (where possible) and falling back only to configured defaults.
Produce proof logs in UI + server logs showing which provider/model was used.
3) ChatGPT-style data model: Session vs Conversation vs Messages
Define:
Editor Session: long-lived binding for a connected editor client (WS connection identity).
Conversation (thread): what ChatGPT shows in the sidebar; one conversation contains many messages.
Messages: each user input appends to the active conversation.
Update API + UI so that:
Sending multiple prompts does not create a new session each time.
A new conversation is created only when user clicks “New chat / New conversation”.
Add evidence:
DB records show 1 conversation with N messages, not N sessions.
4) Streaming UX: typing/thinking effect + speed
Ensure streaming endpoint is used end-to-end and chunk updates render smoothly.
Add a visible “Thinking…” state immediately on send.
Add “typing effect” by updating the last assistant message as chunks arrive.
Improve perceived speed by:
Avoiding buffering the full response before rendering,
Ensuring chunk events flush to UI immediately.
5) New “Editors” page (proof-based observability)
Add a dedicated page in dashboard:
List connected editor clients (clientId, sessionId, lastPing, connected duration).
For each client: a Create Session button that creates/attaches a conversation context and stores it locally (browser localStorage for admin UI; server-side mapping for WS clients).
Show:
which agent is attached,
which tools are allowed,
last message timestamps,
last tool execution.
This page is used to prove:
editor client is connected,
session exists,
streaming responses are real,
tool execution is tied to agent/tool permissions.
6) Agent tools permission UI + enforcement
In Agents dashboard:
Add a UI to assign allowed tools to an agent (checkbox list from MCP tools registry).
Enforce on execution:
WS mcp_execute requests must validate the agent’s allowed tools.
7) Memory stores: Agent vs Individual
Investigate why Individual memory is not being stored.
Fix so that:
Agent memory persists per agent.
Individual memory persists per user/editor session/conversation (as configured).
Add a small proof view:
“last N memories created” with agentId/sessionId/conversationId.
Proof / Demo checklist (what you’ll be able to show)
MCP config copied into an editor works (tools list + execute).
Stock-server shows a real connected client in Editors page.
Creating a session attaches a conversation; multiple prompts append to the same conversation.
Streaming shows thinking + typing; no fake/demo responses.
If provider/model missing: readable error with provider/model context.
Open items to confirm before implementation
Conversation sidebar needed now, or later? (ChatGPT style usually needs a conversation list.)
Should “Create Session” be stored only in admin browser localStorage, or also persisted in DB?
