#!/usr/bin/env bun
/**
 * Multi-Agent Terminal Test Script
 * Connects to WebSocket server and tests different agents with different questions
 * Shows streaming responses typing in terminal
 * 
 * Usage: bun test-agents.ts
 */

import { WebSocket } from "ws";

// Configuration
const WS_URL = process.env.WS_URL || "ws://localhost:9998/ws";
const NEXTJS_URL = process.env.NEXTJS_URL || "http://localhost:3000";

// Test configuration - will be populated from API
let TEST_AGENTS: Array<{
  id: string;
  name: string;
  questions: string[];
}> = [];

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printBanner() {
  console.clear();
  log("cyan", "╔════════════════════════════════════════════════════════════════╗");
  log("cyan", "║                                                                ║");
  log("cyan", "║     🧟 ZombieCoder Multi-Agent Terminal Test                  ║");
  log("cyan", "║                                                                ║");
  log("cyan", "║     Testing different agents with different questions          ║");
  log("cyan", "║     Shows streaming responses typing in real-time              ║");
  log("cyan", "║                                                                ║");
  log("cyan", "╚════════════════════════════════════════════════════════════════╝");
  console.log();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TestResult {
  agentId: string;
  agentName: string;
  question: string;
  response: string;
  latency: number;
  tokens: number;
  success: boolean;
  error?: string;
}

async function testAgent(
  agent: (typeof TEST_AGENTS)[0],
  question: string
): Promise<TestResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let currentResponse = "";
    let startTime = Date.now();
    let firstChunkTime: number | null = null;
    let tokenCount = 0;
    let sessionId = "";

    const result: TestResult = {
      agentId: agent.id,
      agentName: agent.name,
      question,
      response: "",
      latency: 0,
      tokens: 0,
      success: false,
    };

    ws.on("open", () => {
      log("dim", `[WS] Connected for ${agent.name}`);
    });

    ws.on("message", (data: Buffer) => {
      try {
        const event = JSON.parse(data.toString());

        switch (event.event) {
          case "session.init":
            sessionId = event.sessionId;
            // Send agent selection
            ws.send(
              JSON.stringify({
                type: "agent.select",
                agentId: agent.id,
              })
            );
            break;

          case "agent.selected":
            // Agent selected, now send the question
            delay(500).then(() => {
              ws.send(
                JSON.stringify({
                  type: "chat.start",
                  agentId: agent.id,
                  messages: [{ role: "user", content: question }],
                  stream: true,
                })
              );
              startTime = Date.now();
            });
            break;

          case "message.start":
            process.stdout.write(`\n${colors.yellow}${agent.name}${colors.reset}: `);
            break;

          case "message.chunk":
            if (firstChunkTime === null) {
              firstChunkTime = Date.now() - startTime;
            }
            const chunk = event.payload?.content || "";
            currentResponse += chunk;
            // Type character by character effect
            process.stdout.write(chunk);
            tokenCount += Math.ceil(chunk.length / 4);
            break;

          case "message.end":
            result.response = currentResponse;
            result.latency = Date.now() - startTime;
            result.tokens = tokenCount;
            result.success = true;
            console.log(); // New line after response
            log(
              "dim",
              `   ↳ Latency: ${result.latency}ms | Tokens: ${result.tokens} | Time to first chunk: ${firstChunkTime}ms`
            );
            ws.close();
            break;

          case "error":
            result.error = event.error;
            result.latency = Date.now() - startTime;
            log("red", `   ↳ Error: ${event.error}`);
            ws.close();
            break;

          case "heartbeat.ping":
            // Auto-respond to heartbeat
            ws.send(
              JSON.stringify({
                type: "heartbeat.pong",
                timestamp: new Date().toISOString(),
              })
            );
            break;
        }
      } catch (e) {
        log("red", `Parse error: ${e}`);
      }
    });

    ws.on("error", (err) => {
      result.error = err.message;
      result.latency = Date.now() - startTime;
      log("red", `WebSocket error: ${err.message}`);
      resolve(result);
    });

    ws.on("close", () => {
      resolve(result);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!result.success && !result.error) {
        result.error = "Timeout after 30 seconds";
        result.latency = Date.now() - startTime;
        ws.close();
      }
    }, 30000);
  });
}

async function fetchAgents(): Promise<boolean> {
  try {
    const response = await fetch(`${NEXTJS_URL}/api/agents`);
    if (response.ok) {
      const result = await response.json();
      // API returns { success: true, data: [...] }
      const agents = result.data || result.agents || [];
      
      if (agents.length > 0) {
        // Take first 3 active agents
        const activeAgents = agents
          .filter((a: any) => a.status === "active")
          .slice(0, 3);
        
        if (activeAgents.length === 0) {
          // If no active agents, take first 3 anyway
          activeAgents.push(...agents.slice(0, 3));
        }
        
        TEST_AGENTS = activeAgents.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          questions: getQuestionsForAgent(agent.type, agent.name),
        }));
        
        log("green", `✓ Loaded ${TEST_AGENTS.length} agents from database`);
        for (const agent of TEST_AGENTS) {
          log("dim", `  • ${agent.name} (${agent.id})`);
        }
        return true;
      }
    }
    log("red", "✗ No agents found in database");
    return false;
  } catch (err) {
    log("red", `✗ Failed to fetch agents: ${err}`);
    return false;
  }
}

function getQuestionsForAgent(type: string, name: string): string[] {
  const questionsByType: Record<string, string[]> = {
    assistant: [
      `হ্যালো ${name}, তুমি কে?`,
      "Bangladesh এর রাজধানী কী?",
    ],
    coder: [
      "Write a Python function to reverse a string",
      "What is the difference between async and await?",
    ],
    researcher: [
      "What are the latest trends in AI?",
      "Explain machine learning in simple terms",
    ],
    custom: [
      "তুমি কীভাবে কাজ করো?",
      "তোমার ক্ষমতা কী কী?",
    ],
    chatbot: [
      "তুমি কে?",
      "আমাকে একটি গল্প বলো",
    ],
  };
  
  return questionsByType[type] || questionsByType.custom;
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${NEXTJS_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      log("green", `✓ Main app is healthy: ${data.status || "ok"}`);
      return true;
    }
  } catch {
    log("red", `✗ Main app is not responding at ${NEXTJS_URL}`);
  }
  return false;
}

async function checkWebSocketServer(): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    
    ws.on("open", () => {
      log("green", `✓ WebSocket server is running at ${WS_URL}`);
      ws.close();
      resolve(true);
    });
    
    ws.on("error", () => {
      log("red", `✗ WebSocket server not available at ${WS_URL}`);
      log("yellow", `  Start with: cd websocket && bun index.ts`);
      resolve(false);
    });
    
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        resolve(false);
      }
    }, 5000);
  });
}

async function runTests() {
  printBanner();

  // Health checks
  log("blue", "🔍 Checking server health...\n");
  
  const mainAppHealthy = await checkServerHealth();
  const wsHealthy = await checkWebSocketServer();
  
  if (!mainAppHealthy || !wsHealthy) {
    log("red", "\n❌ Server health check failed!");
    log("yellow", "Please ensure:");
    log("yellow", "  1. Main app is running: bun run dev");
    log("yellow", "  2. WebSocket server is running: cd websocket && bun index.ts");
    process.exit(1);
  }

  // Fetch agents
  console.log();
  log("blue", "🔍 Loading agents from database...\n");
  const agentsLoaded = await fetchAgents();
  
  if (!agentsLoaded || TEST_AGENTS.length === 0) {
    log("red", "❌ No agents available for testing!");
    log("yellow", "Please create agents in the admin panel first.");
    process.exit(1);
  }

  console.log();
  log("green", "✅ All servers are healthy!");
  log("cyan", "\n🚀 Starting multi-agent tests...\n");
  log("white", `Testing ${TEST_AGENTS.length} agents with ${TEST_AGENTS.reduce((sum, a) => sum + a.questions.length, 0)} questions\n`);
  await delay(1000);

  const allResults: TestResult[] = [];

  for (const agent of TEST_AGENTS) {
    log("magenta", `\n${"═".repeat(60)}`);
    log("magenta", `🤖 Testing Agent: ${agent.name} (${agent.id})`);
    log("magenta", `${"═".repeat(60)}`);

    for (const question of agent.questions) {
      log("blue", `\n❓ Question: ${question}`);
      log("dim", "   Thinking...\n");

      const result = await testAgent(agent, question);
      allResults.push(result);

      if (result.success) {
        log("green", "   ✓ Response complete");
      } else {
        log("red", `   ✗ Failed: ${result.error}`);
      }

      // Small delay between questions
      await delay(1000);
    }
  }

  // Print summary
  printSummary(allResults);
}

function printSummary(results: TestResult[]) {
  console.log();
  log("cyan", "╔════════════════════════════════════════════════════════════════╗");
  log("cyan", "║                      TEST SUMMARY                               ║");
  log("cyan", "╚════════════════════════════════════════════════════════════════╝");
  console.log();

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalLatency = results.reduce((sum, r) => sum + r.latency, 0);
  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);

  log("white", `Total Tests: ${results.length}`);
  log("green", `Successful: ${successful.length}`);
  log("red", `Failed: ${failed.length}`);
  log("yellow", `Avg Latency: ${Math.round(totalLatency / results.length)}ms`);
  log("blue", `Total Tokens: ${totalTokens}`);
  console.log();

  if (failed.length > 0) {
    log("red", "Failed Tests:");
    failed.forEach((f) => {
      log("red", `  • ${f.agentName}: ${f.question.slice(0, 50)}...`);
      log("dim", `    Error: ${f.error}`);
    });
    console.log();
  }

  // Agent-wise breakdown
  log("cyan", "Agent-wise Performance:");
  for (const agent of TEST_AGENTS) {
    const agentResults = results.filter((r) => r.agentId === agent.id);
    const avgLatency = Math.round(
      agentResults.reduce((sum, r) => sum + r.latency, 0) / agentResults.length
    );
    const totalAgentTokens = agentResults.reduce((sum, r) => sum + r.tokens, 0);

    log(
      "white",
      `  • ${agent.name}: ${avgLatency}ms avg latency, ${totalAgentTokens} tokens`
    );
  }

  console.log();
  log(
    successful.length === results.length ? "green" : "yellow",
    successful.length === results.length
      ? "✅ All tests passed!"
      : `⚠️ ${failed.length} test(s) failed`
  );
}

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log();
  log("yellow", "\n⚠️ Tests interrupted by user");
  process.exit(0);
});

// Run
runTests().catch((err) => {
  log("red", `Fatal error: ${err}`);
  process.exit(1);
});
