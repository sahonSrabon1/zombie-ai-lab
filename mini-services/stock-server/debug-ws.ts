import { WebSocket } from "ws";

const ws = new WebSocket("ws://localhost:9997/ws");

ws.on("open", () => {
  console.log("[✓] Connected");
  ws.send(JSON.stringify({ type: "agent.select", agentId: "test" }));
});

ws.on("message", (data) => {
  console.log("[←] Received:", data.toString());
});

ws.on("error", (err) => {
  console.log("[✗] Error:", err.message);
});

ws.on("close", (code, reason) => {
  console.log("[✗] Closed:", code, reason);
});

setTimeout(() => ws.close(), 5000);
