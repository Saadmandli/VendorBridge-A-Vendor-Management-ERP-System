"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateEmail } from "@/lib/validation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = !email || validateEmail(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!validateEmail(email)) {
      setErr("Please enter a valid email address (e.g. name@company.com)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {}
      setLoading(false);

      if (!res.ok) {
        setErr(data.error || "Login failed. Please check your credentials.");
        return;
      }

      if (data.role !== "ADMIN") {
        setErr("Access Denied: This portal is reserved for System Administrators only.");
        return;
      }

      if (data.status === "PENDING" || data.status === "REJECTED") {
        router.push("/pending-approval");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setLoading(false);
      setErr("Could not reach the authentication server. Is the app running?");
    }
  }

  function quickDemo() {
    setEmail("admin@vendorbridge.com");
    setPassword("password123");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
            🛡️
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            VendorBridge
          </span>
        </div>

        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Main Admin Portal
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-white tracking-tight">
            Administrator Sign In
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Restricted access. Authorized procurement personnel only.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 sm:rounded-3xl sm:px-10">
          {err && (
            <div className="mb-5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs p-3.5 font-medium leading-relaxed">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email Address
              </label>
              <input
                className={`w-full rounded-xl border bg-slate-800/80 px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
                  email && !emailValid ? "border-rose-500" : "border-slate-700"
                }`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@vendorbridge.com"
              />
              {email && !emailValid && (
                <div className="text-[11px] text-rose-400 mt-1">
                  Invalid email format (e.g. name@company.com)
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                >
                  Forgot?
                </Link>
              </div>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-900/30 transition active:scale-[0.99] disabled:opacity-50"
              disabled={loading || !emailValid}
            >
              {loading ? "Authenticating…" : "Sign In to Admin Console"}
            </button>
          </form>

          {/* Demo Admin Auto-fill Section */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Demo Administrator</span>
              <span className="text-[10px] text-emerald-400 font-mono">password123</span>
            </div>
            <button
              type="button"
              onClick={quickDemo}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/70 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition"
            >
              <span>⚡</span> Quick Load Demo Admin (admin@vendorbridge.com)
            </button>
          </div>

          {/* New Admin Sign Up Request Banner */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="rounded-2xl bg-emerald-950/30 border border-emerald-800/40 p-3.5 text-center">
              <div className="text-xs font-semibold text-slate-200">
                Need an Administrator Account?
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-2.5">
                Submit an admin access request. Requires approval by the current Main Admin.
              </p>
              <Link
                href="/admin/signup"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-900/50 border border-emerald-700/50 px-3.5 py-1.5 rounded-lg transition hover:bg-emerald-900/80"
              >
                Request Admin Sign Up &rarr;
              </Link>
            </div>
          </div>

          {/* Back to main login */}
          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-slate-200 font-medium transition"
            >
              &larr; Back to Buyer & Seller Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
