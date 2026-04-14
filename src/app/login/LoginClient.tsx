"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wind } from "lucide-react";

export function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Login failed");
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
            <Wind className="w-6 h-6 text-[hsl(var(--primary-foreground))]" />
          </div>
          <div>
            <p className="font-display font-bold text-lg leading-tight">AQInsights</p>
            <p className="text-sm text-muted-foreground">Log in to continue</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--input))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              autoComplete="username"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--input))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              autoComplete="current-password"
            />
          </div>

          <button
            disabled={loading || !username.trim() || !password}
            className="w-full py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-4">
          New here?{" "}
          <Link href="/signup" className="text-[hsl(var(--primary))] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

