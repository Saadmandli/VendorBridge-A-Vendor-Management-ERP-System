"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateEmail, validatePassword } from "@/lib/validation";
import { INDIAN_CITIES } from "@/lib/cities";

export default function AdminSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: INDIAN_CITIES[0] as string,
    department: "Procurement Operations",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const passCheck = validatePassword(form.password);
  const emailValid = !form.email || validateEmail(form.email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!validateEmail(form.email)) {
      setErr("Please enter a valid email address (e.g. name@company.com)");
      return;
    }

    if (!passCheck.isValid) {
      setErr(`Strong password required: ${passCheck.errors.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          city: form.city,
          role: "ADMIN",
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {}
      setLoading(false);

      if (!res.ok) {
        setErr(data.error || "Failed to submit admin request");
        return;
      }

      // Admin signups go to pending approval screen
      router.push("/pending-approval");
      router.refresh();
    } catch {
      setLoading(false);
      setErr("Could not reach the server. Is the application running?");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

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
            Admin Access Request
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-white tracking-tight">
            Register New Administrator
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Apply for system administrator credentials
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 sm:rounded-3xl sm:px-10 space-y-5">
          {/* Security Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
            <span className="text-base">⏳</span>
            <div>
              <span className="font-bold block text-amber-300">Approval Required</span>
              Admin requests are sent directly to the current Main Admin for review. You will be placed in pending status until approved.
            </div>
          </div>

          {err && (
            <div className="rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs p-3.5 font-medium leading-relaxed">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Legal Name *
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Anand Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Official Email Address *
              </label>
              <input
                className={`w-full rounded-xl border bg-slate-800/80 px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
                  form.email && !emailValid ? "border-rose-500" : "border-slate-700"
                }`}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="name@vendorbridge.com"
              />
              {form.email && !emailValid && (
                <div className="text-[11px] text-rose-400 mt-1">
                  Please enter a valid corporate email address
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Operating City *
                </label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-emerald-500"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                >
                  {INDIAN_CITIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assigned Role
                </label>
                <div className="w-full rounded-xl border border-emerald-700/60 bg-emerald-950/30 px-3 py-2.5 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>🛡️</span> Main Admin
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Master Password *
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
              />

              {form.password && (
                <div className="mt-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Password Strength:</span>
                    <span
                      className={`font-bold ${
                        passCheck.score >= 4
                          ? "text-emerald-400"
                          : passCheck.score >= 2
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {passCheck.score >= 4
                        ? "🟢 Strong"
                        : passCheck.score >= 2
                        ? "🟡 Medium"
                        : "🔴 Weak"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                    <div className={passCheck.hasMinLen ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                      {passCheck.hasMinLen ? "✓" : "•"} 8+ characters
                    </div>
                    <div className={passCheck.hasUpper ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                      {passCheck.hasUpper ? "✓" : "•"} Uppercase (A-Z)
                    </div>
                    <div className={passCheck.hasLower ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                      {passCheck.hasLower ? "✓" : "•"} Lowercase (a-z)
                    </div>
                    <div className={passCheck.hasNumber ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                      {passCheck.hasNumber ? "✓" : "•"} Number (0-9)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-900/30 transition active:scale-[0.99] disabled:opacity-50"
              disabled={loading || !passCheck.isValid || !emailValid}
            >
              {loading ? "Submitting Application…" : "Submit Admin Request"}
            </button>
          </form>

          <div className="pt-2 text-center flex flex-col gap-2">
            <Link
              href="/admin/login"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              Already have an Admin account? Sign in &rarr;
            </Link>
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-slate-400 transition"
            >
              &larr; Return to Buyer / Seller Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
