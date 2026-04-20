import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            ZombieCoder
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/chat" className="text-sm text-gray-300 hover:text-white">
              Chat
            </Link>
            <Link href="/admin" className="text-sm text-gray-300 hover:text-white">
              Admin
            </Link>
            <Link
              href={user ? "/chat" : "/get-started"}
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              {user ? "Continue" : "Get Started"}
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-20 pt-36">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-5xl font-light leading-tight tracking-tight md:text-7xl">
            ZombieCoder
            <br />
            <span className="text-gray-400">যেখানে কোড ও কথা বলে</span>
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-lg text-gray-400">
            Build AI powered workflows with real providers, live streaming chat, and editor integrations.
            Create your account and start instantly.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={user ? "/chat" : "/get-started"} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">
              {user ? "Open Chat" : "Create Account"}
            </Link>
            <Link href="/admin" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/10">
              Open Admin
            </Link>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              <p className="text-xs uppercase tracking-widest text-blue-400">Realtime</p>
              <h3 className="mt-2 text-xl font-semibold">Streaming Chat</h3>
              <p className="mt-2 text-sm text-gray-400">SSE based incremental responses with session continuity.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              <p className="text-xs uppercase tracking-widest text-purple-400">Secure</p>
              <h3 className="mt-2 text-xl font-semibold">User Accounts</h3>
              <p className="mt-2 text-sm text-gray-400">Register and login with DB persisted users and httpOnly sessions.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              <p className="text-xs uppercase tracking-widest text-emerald-400">Control</p>
              <h3 className="mt-2 text-xl font-semibold">Admin Console</h3>
              <p className="mt-2 text-sm text-gray-400">Providers, models, MCP tools, and memory operations in one place.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
