import type { Metadata } from "next";
import "./globals.css";
import CopilotWidget from "@/components/CopilotWidget";

export const metadata: Metadata = {
  title: "VendorBridge — Procurement & Vendor Management ERP",
  description: "Digitize procurement: vendors, RFQs, quotations, approvals, purchase orders and invoices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CopilotWidget />
      </body>
    </html>
  );
}
