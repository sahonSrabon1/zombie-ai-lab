#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
API_KEY="${UAS_API_KEY:-}"

hdr=(-H "Content-Type: application/json")
if [[ -n "${API_KEY}" ]]; then
  hdr+=(-H "X-API-Key: ${API_KEY}")
fi

echo "[1/4] GET ${BASE_URL}/api/health"
curl -sS "${BASE_URL}/api/health" | head -c 300 || true
echo

echo "[2/4] GET ${BASE_URL}/api/mcp/tools"
tools_json="$(curl -sS "${BASE_URL}/api/mcp/tools" || true)"
echo "${tools_json}" | head -c 500
echo

try_execute() {
  local tool_name="$1"
  local input_json="$2"
  echo
  echo "POST /api/mcp/execute { toolName: \"${tool_name}\" }"
  local out
  out="$(curl -sS "${hdr[@]}" -X POST "${BASE_URL}/api/mcp/execute" -d "{\"toolName\":\"${tool_name}\",\"input\":${input_json}}" || true)"
  echo "${out}" | head -c 800
  echo
  if echo "${out}" | grep -Eq "\"success\"[[:space:]]*:[[:space:]]*true" ; then
    return 0
  fi
  return 1
}

echo "[3/4] Execute a read-only tool (system_info)"
try_execute "system_info" "{\"sections\":[\"os\",\"runtime\"]}" || true

echo "[4/4] Execute legacy/canonical tool-name fallbacks"
try_execute "read_file" "{\"path\":\"package.json\"}" \
  || try_execute "file_read" "{\"path\":\"package.json\"}" \
  || true

try_execute "search_code" "{\"query\":\"mcpService\"}" || true

try_execute "run_command" "{\"command\":\"pwd\"}" \
  || try_execute "shell_execute" "{\"command\":\"pwd\"}" \
  || true

echo
echo "Done. If /api/mcp/execute returns tool output above, MCP HTTP is working."
