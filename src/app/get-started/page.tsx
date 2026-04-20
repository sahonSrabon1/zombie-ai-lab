"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "register" | "login";

export default function GetStartedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === "register" && !name)) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Authentication failed");
      }

      setMessage(mode === "register" ? "Account created successfully." : "Login successful.");
      router.push("/chat");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            ZombieCoder
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/chat" className="text-sm text-gray-300 hover:text-white">
              Chat
            </Link>
            <Link href="/admin" className="text-sm text-gray-300 hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 pt-20">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h1 className="text-center text-3xl font-medium">
            {mode === "register" ? "Create Account" : "Log In"}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            {mode === "register" ? "Create your ZombieCoder user dynamically." : "Login with your existing account."}
          </p>

          <div className="mt-6 flex rounded-xl border border-white/10 bg-black/30 p-1">
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2 text-sm ${mode === "register" ? "bg-white text-black" : "text-gray-300"}`}
              type="button"
            >
              Register
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-sm ${mode === "login" ? "bg-white text-black" : "text-gray-300"}`}
              type="button"
            >
              Login
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-2 block text-sm text-gray-300">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-gray-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-400">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "register" ? "Sign Up" : "Log In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
