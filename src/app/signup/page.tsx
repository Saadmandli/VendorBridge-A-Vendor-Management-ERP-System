"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES_TAXONOMY, CATEGORY_NAMES } from "@/lib/categories";
import { validateEmail, validatePassword } from "@/lib/validation";
import { INDIAN_CITIES } from "@/lib/cities";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BUYER",
    city: INDIAN_CITIES[0],
    vendorName: "",
    category: "Furniture",
    subcategory: "Office Desks",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "category") {
        const subList = CATEGORIES_TAXONOMY[v] || [];
        next.subcategory = subList[0] || "";
      }
      return next;
    });
  };

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
        body: JSON.stringify(form),
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      setLoading(false);
      if (!res.ok) {
        setErr(data.error || "Signup failed");
        return;
      }
      if (data.status === "PENDING") {
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

  const subcategories = CATEGORIES_TAXONOMY[form.category] || [];

  return (
    <div className="h-screen w-full grid lg:grid-cols-2 bg-slate-50 overflow-hidden">
      {/* Branded Left Side Panel — Fixed Height Container (No Jumpiness) */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-800 via-brand-700 to-indigo-900 text-white p-12 h-full">
        <div>
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-lg">⚡</span>
            <span>VendorBridge</span>
          </div>
          <div className="text-brand-200 text-sm mt-1 font-medium">Enterprise B2B Procurement ERP</div>
        </div>

        <div className="space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-100">
            ✨ Commercial Procurement Architecture
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Streamline your B2B supply chain end to end.
          </h1>
          <p className="text-brand-100 text-base leading-relaxed">
            Join thousands of verified buyers and specialized sellers. Issue RFQs, negotiate counter-offers, analyze AI risk signals, and approve purchase orders instantly.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-brand-200">Category-Scoped Privacy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Zero-Cost</div>
              <div className="text-xs text-brand-200">AI Anomaly Detection</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-brand-200 text-xs border-t border-white/10 pt-4">
          <span>© {new Date().getFullYear()} VendorBridge ERP</span>
          <span>Security Verified SSL/TLS</span>
        </div>
      </div>

      {/* Light Theme Signup Form Panel — Scrollable & Height Fixed */}
      <div className="h-full overflow-y-auto flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white p-8 shadow-xl border border-slate-200/80 rounded-3xl space-y-6 my-auto">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1">Select your account role and operating city</p>
          </div>

          {err && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 font-medium">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                placeholder="e.g. Vikram Verma"
              />
            </div>

            <div>
              <label className="label">Email Address *</label>
              <input
                className={`input ${form.email && !emailValid ? "border-rose-500 focus:ring-rose-500/20" : ""}`}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                placeholder="name@company.com"
              />
              {form.email && !emailValid && (
                <div className="text-[11px] text-rose-600 mt-1">Please enter a valid email format (e.g. name@company.com)</div>
              )}
            </div>

            <div>
              <label className="label">Strong Password *</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                placeholder="••••••••"
              />

              {/* Password Strength Meter & Checklist */}
              {form.password && (
                <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Password Strength:</span>
                    <span
                      className={`font-bold ${
                        passCheck.score >= 4
                          ? "text-emerald-600"
                          : passCheck.score >= 2
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      {passCheck.score >= 4 ? "🟢 Strong" : passCheck.score >= 2 ? "🟡 Medium" : "🔴 Weak"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-all ${passCheck.score >= 1 ? "bg-rose-500" : "bg-transparent"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all ${passCheck.score >= 2 ? "bg-amber-500" : "bg-transparent"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all ${passCheck.score >= 3 ? "bg-indigo-500" : "bg-transparent"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all ${passCheck.score >= 4 ? "bg-emerald-500" : "bg-transparent"}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                    <div className={passCheck.hasMinLen ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      {passCheck.hasMinLen ? "✓" : "•"} 8+ characters
                    </div>
                    <div className={passCheck.hasUpper ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      {passCheck.hasUpper ? "✓" : "•"} Uppercase (A-Z)
                    </div>
                    <div className={passCheck.hasLower ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      {passCheck.hasLower ? "✓" : "•"} Lowercase (a-z)
                    </div>
                    <div className={passCheck.hasNumber ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      {passCheck.hasNumber ? "✓" : "•"} Number (0-9)
                    </div>
                    <div className={passCheck.hasSpecial ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                      {passCheck.hasSpecial ? "✓" : "•"} Special (!@#$)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Operating City *</label>
                <select
                  className="input"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                >
                  {INDIAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Account Role *</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller / Vendor</option>
                </select>
              </div>
            </div>

            {form.role === "SELLER" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="label">Company Name</label>
                  <input
                    className="input bg-white"
                    value={form.vendorName}
                    onChange={(e) => set("vendorName", e.target.value)}
                    placeholder="Seller organization name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category *</label>
                    <select
                      className="input bg-white"
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                    >
                      {CATEGORY_NAMES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Subcategory *</label>
                    <select
                      className="input bg-white"
                      value={form.subcategory}
                      onChange={(e) => set("subcategory", e.target.value)}
                    >
                      {subcategories.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn-primary w-full py-3 text-base shadow-md shadow-brand-500/20"
              disabled={loading || !passCheck.isValid || !emailValid}
            >
              {loading ? "Creating account…" : "Create Secured Account"}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
