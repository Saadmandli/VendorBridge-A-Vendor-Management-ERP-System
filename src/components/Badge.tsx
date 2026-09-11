const MAP: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700", PENDING: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-100 text-slate-600", BLACKLISTED: "bg-rose-100 text-rose-700",
  OPEN: "bg-blue-100 text-blue-700", DRAFT: "bg-slate-100 text-slate-600",
  CLOSED: "bg-slate-200 text-slate-700", AWARDED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700", SUBMITTED: "bg-blue-100 text-blue-700",
  SELECTED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-rose-100 text-rose-700",
  APPROVED: "bg-emerald-100 text-emerald-700", ISSUED: "bg-blue-100 text-blue-700",
  ACKNOWLEDGED: "bg-indigo-100 text-indigo-700", FULFILLED: "bg-emerald-100 text-emerald-700",
  SENT: "bg-blue-100 text-blue-700", PAID: "bg-emerald-100 text-emerald-700",
  MATCHED: "bg-emerald-100 text-emerald-700", PARTIALLY_MATCHED: "bg-amber-100 text-amber-700",
  MISMATCH: "bg-rose-100 text-rose-700", PENDING_SELLER_RESPONSE: "bg-amber-100 text-amber-700",
  PENDING_BUYER_RESPONSE: "bg-indigo-100 text-indigo-700", SEALED: "bg-purple-100 text-purple-700",
};
export default function Badge({ status }: { status: string }) {
  return <span className={`badge ${MAP[status] || "bg-slate-100 text-slate-600"}`}>{status.replace(/_/g, " ")}</span>;
}
