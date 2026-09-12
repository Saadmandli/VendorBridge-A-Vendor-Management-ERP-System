"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateEmail } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoTab, setDemoTab] = useState<"BUYER" | "SELLER">("BUYER");

  const DEMO_BUYERS = [
    {
      id: "b1",
      name: "Priya Sharma",
      email: "buyer@vendorbridge.com",
      city: "Bengaluru",
      badge: "Lead Buyer",
    },
    {
      id: "b2",
      name: "Rajesh Patel",
      email: "buyer2@vendorbridge.com",
      city: "Mumbai",
      badge: "Ops Manager",
    },
    {
      id: "b3",
      name: "Ananya Sen",
      email: "buyer3@vendorbridge.com",
      city: "New Delhi",
      badge: "Procurement Lead",
    },
  ];

  const DEMO_SELLERS = [
    {
      id: "s1",
      name: "Techno Hardware Co",
      email: "vendor@techno.com",
      city: "Bengaluru",
      rating: "★ 4.8",
      badge: "Top AI Match",
    },
    {
      id: "s2",
      name: "Prime Furnishings",
      email: "vendor@prime.com",
      city: "Ahmedabad",
      rating: "★ 4.6",
      badge: "Top AI Match",
    },
    {
      id: "s3",
      name: "Acme Supplies Pvt Ltd",
      email: "vendor@acme.com",
      city: "Pune",
      rating: "★ 4.7",
      badge: "Top AI Match",
    },
  ];

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
      try { data = await res.json(); } catch {}
      setLoading(false);
      if (!res.ok) {
        setErr(data.error || "Login failed. Please try again.");
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
      setErr("Could not reach the server. Is the app running?");
    }
  }

  function quick(e: string) {
    setEmail(e);
    setPassword("password123");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-brand-700 text-white p-12">
        <div>
          <div className="text-2xl font-bold">VendorBridge</div>
          <div className="text-brand-200 text-sm mt-1">Procurement & Vendor Management ERP</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">Digitize your procurement, end to end.</h1>
          <p className="text-brand-100">
            Buyers, Sellers, RFQs, quotations, approvals, purchase orders and invoices — one centralized platform with role-based workflows.
          </p>
        </div>
        <div className="text-brand-200 text-xs">© {new Date().getFullYear()} VendorBridge</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Welcome back. Enter your credentials.</p>
          {err && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 font-medium">{err}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                className={`input ${email && !emailValid ? "border-rose-500 focus:ring-rose-500/20" : ""}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
              {email && !emailValid && (
                <div className="text-[11px] text-rose-600 mt-1">Invalid email format (e.g. name@company.com)</div>
              )}
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <button className="btn-primary w-full shadow-md" disabled={loading || !emailValid}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-sm text-slate-500 mt-6 text-center">
            No account?{" "}
            <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
          <div className="mt-8 border-t pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Demo Accounts (Pass: password123)
              </p>
              <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDemoTab("BUYER")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    demoTab === "BUYER"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Buyers (3)
                </button>
                <button
                  type="button"
                  onClick={() => setDemoTab("SELLER")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    demoTab === "SELLER"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sellers (3)
                </button>
              </div>
            </div>

            {/* Buyer List */}
            {demoTab === "BUYER" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                {DEMO_BUYERS.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => quick(b.email)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between group ${
                      email === b.email
                        ? "border-indigo-400 bg-indigo-50/70 shadow-xs"
                        : "border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {b.name}
                        </span>
                        <span className="text-[10px] font-medium bg-indigo-100/70 text-indigo-700 px-1.5 py-0.2 rounded">
                          {b.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <span>{b.email}</span>
                        <span>·</span>
                        <span>📍 {b.city}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        quick(b.email);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white border border-indigo-200 group-hover:border-transparent transition"
                    >
                      {email === b.email ? "✓ Selected" : "Use"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Seller List */}
            {demoTab === "SELLER" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                {DEMO_SELLERS.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => quick(s.email)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between group ${
                      email === s.email
                        ? "border-emerald-400 bg-emerald-50/70 shadow-xs"
                        : "border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {s.name}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600">
                          {s.rating}
                        </span>
                        <span className="text-[10px] font-medium bg-emerald-100/70 text-emerald-800 px-1.5 py-0.2 rounded">
                          {s.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <span>{s.email}</span>
                        <span>·</span>
                        <span>📍 {s.city}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        quick(s.email);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white border border-emerald-200 group-hover:border-transparent transition"
                    >
                      {email === s.email ? "✓ Selected" : "Use"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Go to Dedicated Admin Login Page */}
            <div className="mt-3">
              <Link
                href="/admin/login"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-500 group-hover:scale-105 transition-all">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-950 transition-colors">
                    Go here for admin login
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Portal &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
