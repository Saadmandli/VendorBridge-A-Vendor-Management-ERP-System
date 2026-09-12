"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.status === "APPROVED") {
            router.push("/dashboard");
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(user?.role === "ADMIN" ? "/admin/login" : "/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const isRejected = user?.status === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            VB
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            VendorBridge
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          {isRejected ? "Account Access Rejected" : "Awaiting Main Admin Approval"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          {isRejected
            ? "Your account request was declined by Main Admin."
            : "Your account has been registered and is pending review by Main Admin."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-10">
          <div className="space-y-6">
            <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Account Name</span>
                <span className="text-white font-medium">{user?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Role</span>
                <span className="text-indigo-400 font-semibold">{user?.role || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">City</span>
                <span className="text-slate-200">{user?.city || "Not Specified"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isRejected
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {user?.status || "PENDING"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Main Admin will verify your information. Once approved, you will be able to access the full VendorBridge portal.
            </p>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2.5 px-4 border border-indigo-500/30 rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Check Approval Status
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 focus:outline-none transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
