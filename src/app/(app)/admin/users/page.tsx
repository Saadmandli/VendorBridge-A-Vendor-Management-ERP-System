"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  city?: string | null;
  createdAt: string;
  vendor?: {
    id: string;
    name: string;
    category: string;
    city?: string | null;
    status: string;
  } | null;
};

export default function AdminUsersApprovalPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "BUYER", city: "", vendorName: "", category: "" });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?status=${filterStatus}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterStatus]);

  const handleUpdateStatus = async (userId: string, newStatus: "APPROVED" | "REJECTED") => {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      setCreateLoading(false);
      if (!res.ok) {
        setCreateError(data.error || "Failed to create account");
        return;
      }
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", password: "", role: "BUYER", city: "", vendorName: "", category: "" });
      fetchUsers();
    } catch (e) {
      setCreateLoading(false);
      setCreateError("Server error while creating account");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin User & Vendor Approvals"
        subtitle="Approve or reject newly registered Buyer and Seller accounts or create pre-approved accounts"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary shadow-md shadow-brand-500/20"
          >
            + Create Buyer / Seller
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 w-fit">
        {[
          { key: "PENDING", label: "⏳ Pending Approval" },
          { key: "APPROVED", label: "✅ Approved" },
          { key: "REJECTED", label: "❌ Rejected" },
          { key: "", label: "👥 All Accounts" },
        ].map((st) => (
          <button
            key={st.key}
            onClick={() => setFilterStatus(st.key)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              filterStatus === st.key
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          No {filterStatus.toLowerCase() || "registered"} accounts found.
        </div>
      ) : (
        <div className="card overflow-hidden shadow-sm border border-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="th">Account Name & Email</th>
                  <th className="th">Role</th>
                  <th className="th">City</th>
                  <th className="th">Status</th>
                  <th className="th">Registered Date</th>
                  <th className="th text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="td">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      {u.vendor && (
                        <div className="mt-1 text-xs font-medium text-brand-600 bg-brand-50/80 px-2 py-0.5 rounded w-fit border border-brand-100">
                          Seller Org: {u.vendor.name} ({u.vendor.category})
                        </div>
                      )}
                    </td>
                    <td className="td">
                      <span
                        className={`badge ${
                          u.role === "ADMIN"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold"
                            : u.role === "SELLER"
                            ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                            : "bg-blue-50 text-blue-700 border border-blue-200/80"
                        }`}
                      >
                        {u.role === "ADMIN" ? "🛡️ Main Admin" : u.role}
                      </span>
                    </td>
                    <td className="td font-medium text-slate-800">
                      {u.city || u.vendor?.city || "—"}
                    </td>
                    <td className="td">
                      <span
                        className={`badge ${
                          u.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : u.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                            : "bg-amber-50 text-amber-700 border border-amber-200/80"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="td text-slate-500 text-xs font-medium">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="td text-right">
                      {updatingId === u.id ? (
                        <span className="text-xs text-slate-400 animate-pulse">Updating…</span>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          {u.status !== "APPROVED" && (
                            <button
                              onClick={() => handleUpdateStatus(u.id, "APPROVED")}
                              className="btn-success text-xs py-1.5 px-3"
                            >
                              Approve
                            </button>
                          )}
                          {u.status !== "REJECTED" && (
                            <button
                              onClick={() => handleUpdateStatus(u.id, "REJECTED")}
                              className="btn-ghost text-xs py-1.5 px-3 text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card bg-white p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Admin: Create Approved Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="label">Operating City *</label>
                <select
                  value={createForm.city}
                  onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                  className="input"
                >
                  <option value="">Select City</option>
                  {["Bengaluru", "Mumbai", "Pune", "New Delhi", "Ahmedabad", "Kolkata", "Hyderabad", "Chennai", "Noida", "Gurugram"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="input"
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller / Vendor</option>
                  <option value="ADMIN">Main Admin</option>
                </select>
              </div>

              {createForm.role === "SELLER" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Company</label>
                    <input
                      type="text"
                      value={createForm.vendorName}
                      onChange={(e) => setCreateForm({ ...createForm, vendorName: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. IT Hardware"
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary"
                >
                  {createLoading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
