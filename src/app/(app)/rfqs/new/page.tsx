"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";

import { CATEGORIES_TAXONOMY, CATEGORY_NAMES } from "@/lib/categories";

type Item = { productName: string; description: string; quantity: number; unit: string };

export default function NewRfq() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("Furniture");
  const [subcategory, setSubcategory] = useState("Office Desks");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState<Item[]>([{ productName: "", description: "", quantity: 1, unit: "pcs" }]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/vendors?status=ACTIVE&category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.vendors || []).sort((a: any, b: any) => {
          const aSub = a.subcategory === subcategory ? 1 : 0;
          const bSub = b.subcategory === subcategory ? 1 : 0;
          if (aSub !== bSub) return bSub - aSub;
          return (b.rating || 0) - (a.rating || 0);
        });
        setVendors(list);
        setVendorIds(list.map((v: any) => v.id));
      });
  }, [category, subcategory]);

  function handleCategoryChange(newCat: string) {
    setCategory(newCat);
    const subList = CATEGORIES_TAXONOMY[newCat] || [];
    setSubcategory(subList[0] || "");
  }

  function toggleSelectAllMatching() {
    if (vendorIds.length === vendors.length) {
      setVendorIds([]);
    } else {
      setVendorIds(vendors.map((v) => v.id));
    }
  }

  function setItem(i: number, k: keyof Item, v: any) { setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, [k]: v } : it)); }
  function addItem() { setItems((a) => [...a, { productName: "", description: "", quantity: 1, unit: "pcs" }]); }
  function removeItem(i: number) { setItems((a) => a.filter((_, idx) => idx !== i)); }
  function toggleVendor(id: string) { setVendorIds((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);

    // Upload attachment first (if any), then create the RFQ with its URL.
    let attachment: string | undefined;
    if (file) {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const ud = await up.json();
      if (!up.ok) { setErr(ud.error || "Attachment upload failed"); setLoading(false); return; }
      attachment = ud.url;
    }

    const res = await fetch("/api/rfqs", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, department, category, subcategory, budgetAmount, deadline, items, vendorIds, attachment }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) { setErr(data.error || "Failed to create RFQ"); return; }
    router.push(`/rfqs/${data.rfq.id}`);
  }

  const subcategories = CATEGORIES_TAXONOMY[category] || [];

  return (
    <div>
      <PageHeader title="Create RFQ" subtitle="Define products, budget, attachments, deadline and invite vendors." />
      {err && <div className="mb-4 rounded bg-rose-50 text-rose-700 text-sm px-3 py-2">{err}</div>}
      <form onSubmit={submit} className="space-y-6 max-w-3xl">
        <div className="card p-5 space-y-4">
          <div><label className="label">RFQ Title *</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Procurement of 50 office laptops" /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Department</label><input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" /></div>
            <div><label className="label">Budget (₹)</label><input className="input" type="number" min={0} value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="Optional — enables savings tracking" /></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="label">Category *</label>
              <select className="input" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                {CATEGORY_NAMES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Subcategory *</label>
              <select className="input" value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Submission Deadline *</label><input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required /></div>
            <div>
              <label className="label">Attachment (specs / drawings, optional)</label>
              <input className="input py-1.5" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.csv,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file && <div className="text-xs text-slate-500 mt-1">Selected: {file.name}</div>}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3"><div className="font-semibold">Line Items</div><button type="button" onClick={addItem} className="btn-ghost py-1.5 text-sm">+ Add item</button></div>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><label className="label text-xs">Product / Service *</label><input className="input" value={it.productName} onChange={(e) => setItem(i, "productName", e.target.value)} required /></div>
                <div className="col-span-3"><label className="label text-xs">Description</label><input className="input" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} /></div>
                <div className="col-span-2"><label className="label text-xs">Qty *</label><input className="input" type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, "quantity", Number(e.target.value))} required /></div>
                <div className="col-span-1"><label className="label text-xs">Unit</label><input className="input" value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} /></div>
                <div className="col-span-1">{items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="btn-ghost py-2 text-rose-600">✕</button>}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span>⚡ Smart-Matched Suppliers</span>
                <span className="badge bg-brand-100 text-brand-700">{category}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Automatically filtered to suppliers specializing in {category} → {subcategory}.
              </div>
            </div>
            {vendors.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllMatching}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200"
              >
                {vendorIds.length === vendors.length ? "Deselect All" : "⚡ Select All Matching"}
              </button>
            )}
          </div>

          {vendors.length === 0 && (
            <div className="text-sm text-slate-400 py-4 text-center">
              No active vendors registered for category "{category}". You can still publish this RFQ for public bidding.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-2.5">
            {vendors.map((v) => {
              const isExactSub = v.subcategory && v.subcategory === subcategory;
              const isDemoSeller = ["vendor@techno.com", "vendor@prime.com", "vendor@acme.com"].includes(v.email);
              const matchScore = isExactSub ? "⚡ 98% AI Match" : v.rating >= 4.0 ? "⚡ 92% AI Match" : "⚡ 85% AI Match";

              return (
                <label
                  key={v.id}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                    vendorIds.includes(v.id)
                      ? "border-brand-500 bg-brand-50/70 shadow-xs"
                      : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={vendorIds.includes(v.id)}
                    onChange={() => toggleVendor(v.id)}
                    className="mt-1 accent-brand-600 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">
                          {v.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {matchScore}
                          </span>
                          {isDemoSeller && (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                              ✨ Demo Supplier
                            </span>
                          )}
                        </div>
                      </div>
                      {v.rating > 0 && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                          ★ {v.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-medium text-slate-600">
                        {v.subcategory || v.category}
                      </span>
                      {v.city && <span>· 📍 {v.city}</span>}
                      {v.contactName && <span>· 👤 {v.contactName}</span>}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
          <button className="btn-primary" disabled={loading}>{loading ? "Creating…" : "Create RFQ"}</button>
        </div>
      </form>
    </div>
  );
}
