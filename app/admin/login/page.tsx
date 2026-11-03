"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError((err as Error)?.message || "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
            PDF<span className="text-slate-800">Store.</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-indigo-600">
              Home
            </Link>
            <Link href="/#products" className="hover:text-indigo-600">
              Products
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Admin Sign In</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with an admin account created in Supabase Auth.</p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-semibold">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-700 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">No public signup page is provided. Create the admin user in Supabase Dashboard.</p>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-7 text-center text-sm text-slate-500">
        Copyright PDFStore. All rights reserved.
      </footer>
    </main>
  );
}
