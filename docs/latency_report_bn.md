# ZombieCoder Agentic Hub — Chat Latency Forensic Report (BN)

## Scope
এই রিপোর্টের লক্ষ্য:
- একই মডেল (Ollama `llama3.2:1b`) ডিফল্ট বনাম persona/agent প্রম্পট দিয়ে কেন আচরণ/ল্যাটেন্সি বদলায় তা **টার্মিনাল-প্রুফ** দিয়ে দেখানো।
- TTFC (Time-to-First-Chunk) এবং providerMs আলাদা করে বোঝানো।

## Key Principle (No Mahabharat)
- তোমার সিস্টেম “মডেল বানাচ্ছে” না।
- সিস্টেম কাজ: **prompt+settings assemble করা** + **provider কে কল করা** + **stream forward করা**।
- Persona দিলে পরিবর্তন হয় কারণ prompt/settings বদলায়।

## What was changed in code (to make proof measurable)
- `src/app/api/chat/stream/route.ts`
  - Streaming timing telemetry যুক্ত করা হয়েছে:
    - `streamRequestId`
    - `ttfcFromProviderStartMs` (প্রথম assistant token আসা পর্যন্ত)
    - `ttfcFromRequestStartMs`
    - `providerMs`, `chunkCount`, `systemPromptLength`
  - Client disconnect/timeout হলে `Controller is already closed` crash আটকাতে abort-guard যুক্ত করা হয়েছে।
- `src/providers/OllamaProvider.ts`
  - Consumer (`onChunk`) বন্ধ হয়ে গেলে আর JSON parse failure হিসেবে false-warning না দেখিয়ে stream cancel করা হয়েছে।
- `.env`
  - invalid junk text/command remove করে `NEXT_DISABLE_TURBOPACK=1` কে proper env var করা হয়েছে।

## Why curl TTFB can look “fast” while user sees “slow”
- SSE stream শুরুতেই আমরা `event: session` পাঠাই।
- তাই curl-এর `time_starttransfer` ≈ session event পর্যন্ত সময় (সবসময় দ্রুত)।
- User-perceived latency = **প্রথম `event: chunk` (assistant token)** — এটিই TTFC।

## Terminal Proof (Observed Logs)
নিচের লাইনগুলো dev server টার্মিনাল (bun) থেকে নেয়া:

### Case-1: Provider finished but produced 0 chunks (client disconnected before first token)
```
[chat-stream-api] chat.stream timing: provider {
  "streamRequestId":"1776769247705-0hl1rx",
  "providerMs":94034,
  "chunkCount":0,
  "hadFirstChunk":false,
  "ttfcFromProviderStartMs":null,
  "effectiveMaxTokens":64,
  "effectiveTemperature":0.2,
  "systemPromptLength":4722
}
```
Interpretation:
- Ollama কল ~94s চলেছে।
- কিন্তু client-side timeout/disconnect এর আগে কোনো assistant token আসেনি → chunkCount 0।

### Case-2: TTFC itself is ~70s (real root cause)
```
[chat-stream-api] chat.stream timing: first_chunk {
  "streamRequestId":"1776769271351-lhzpgy",
  "ttfcFromProviderStartMs":70512,
  "ttfcFromRequestStartMs":70588,
  "effectiveMaxTokens":64,
  "effectiveTemperature":0.2,
  "systemPromptLength":4722
}

[chat-stream-api] chat.stream timing: provider {
  "streamRequestId":"1776769271351-lhzpgy",
  "providerMs":72497,
  "chunkCount":15,
  "ttfcFromProviderStartMs":70512,
  "systemPromptLength":4722
}

POST /api/chat/stream 200 in 73s
```
Interpretation:
- **প্রথম assistant token আসতে ~70s** লাগছে।
- SSE/Next.js transport bottleneck না; provider-side compute stall/queue/root cause।

## Conclusion
- “Persona দিলে মিনিট-লেভেল স্লো” = **prompt/settings change + provider load/queue**।
- Curl TTFB fast হলেও TTFC slow হতে পারে কারণ session event আগে আসে।
- সিস্টেম কোনো জাদু করছে না; prompt এবং settings-এ পরিবর্তনই observable latency/behavior change।

## Immediate Remediation Options
- Hard-cap `maxTokens` server-side (agent overrides থাকলেও) → মিনিট-লেভেল total time clamp হবে।
- Persona prompt কে anti-loop rules দিয়ে sanitize (self-intro spam বন্ধ)।
- Provider call কে request abort সিগন্যালের সাথে cancel (queue কমবে, TTFC improve হতে পারে)।

---
## Signature
Observed + instrumented by: **Cascade (senior pair programmer)**

Verified surface:
- এই রিপোর Next.js API (`/api/chat/stream`) + provider integration (Ollama) + server logs
- TTFC/providerMs/systemPromptLength measurements **এই সার্ভার প্রসেসের ভিতরে**

Not claimed / out of scope:
- Editor vendor-এর cloud quota/rate-limit, device fingerprinting, বা account-based usage ledger সম্পর্কে কোনো ownership/identity claim করা হয়নি
- Editor কোন ডোমেইনে কল করছে (telemetry/gateway) — এই রিপোর্টে network-level proof অন্তর্ভুক্ত নয়

Date: 2026-04-21 (UTC+06)
