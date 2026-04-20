#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${1:-db/custom.db}"

if [[ ! -f "${DB_PATH}" ]]; then
  echo "DB not found: ${DB_PATH}" >&2
  exit 1
fi

echo "DB: ${DB_PATH}"
echo

echo "== MCP tools =="
sqlite3 "${DB_PATH}" "select name, category, enabled, requiredAuth from McpTool order by name;"
echo

echo "== MCP tool executions (latest 20) =="
sqlite3 "${DB_PATH}" "
select
  ToolExecutionLog.createdAt,
  McpTool.name,
  ToolExecutionLog.status,
  ifnull(ToolExecutionLog.executionMs, -1) as executionMs,
  substr(ifnull(ToolExecutionLog.errorMessage,''), 1, 120) as error
from ToolExecutionLog
join McpTool on ToolExecutionLog.toolId = McpTool.id
order by ToolExecutionLog.createdAt desc
limit 20;
"
echo

echo "== Editor clients (latest 10) =="
sqlite3 "${DB_PATH}" "
select
  clientId,
  sessionId,
  datetime(connectedAt/1000, 'unixepoch', 'localtime') as connectedAtLocal,
  case when disconnectedAt is null then '' else datetime(disconnectedAt/1000, 'unixepoch', 'localtime') end as disconnectedAtLocal,
  datetime(lastPingAt/1000, 'unixepoch', 'localtime') as lastPingAtLocal,
  ifnull(ipAddress, ''),
  substr(ifnull(userAgent,''), 1, 60) as userAgentPrefix
from EditorClientConnection
order by updatedAt desc
limit 10;
"
echo

echo "Done."

