# VendorBridge — Comprehensive Project Specification & Architectural Guide

> **Target Audience:** AI Models (e.g., Gemini), Developers, and Architects.
> **Purpose:** Full technical and operational blueprint of the VendorBridge Vendor Management & Procurement ERP System.

---

## 1. Executive Summary & Overview

**VendorBridge** is an enterprise-grade, production-ready Procurement & Vendor Management Enterprise Resource Planning (ERP) platform. It digitizes the entire procurement lifecycle—from vendor onboarding and Request For Quotation (RFQ) creation to bidding, multi-tiered approvals, Purchase Order (PO) issuance, Goods Receipt Note (GRN) tracking, and 3-way invoice matching.

Beyond standard CRUD operations, VendorBridge features a **Procurement Intelligence Layer**:
- **Smart Award Engine:** An explainable weighted scoring model (0–100) that evaluates price, delivery time, vendor rating, and reliability with plain-English justifications.
- **Empirical Vendor Performance Scorecards:** Dynamic, automated vendor rating (0–5.0★) based on historical delivery punctuality and fulfillment accuracy.
- **Threshold-Based Delegation of Authority:** Automated routing of financial approvals based on monetary limits (Auto-approve ≤ ₹1L, Buyer sign-off ≤ ₹10L, Admin sign-off > ₹10L).
- **Pro-Rata 3-Way Matching Engine:** Strict verification of Purchase Orders vs. Goods Receipts vs. Invoices to prevent payment for unreceived or mismatched items.
- **Realized Savings Analytics:** Automated calculation of cost savings against budgeted amounts and competing bids.

---

## 2. System Architecture & Technology Stack

### 2.1 Technology Stack
- **Frontend Framework:** Next.js 14 (App Router) with React 18 & TypeScript 5
- **Styling & UI:** Tailwind CSS, PostCSS, Autoprefixer, standard HTML5 semantic layouts
- **Database & ORM:** PostgreSQL, Prisma ORM 5.22
- **Embedded Database (Zero-Setup Dev):** `embedded-postgres` (v18.4) allowing local execution without external DB dependencies
- **Authentication & Security:** HTTP-Only JWT cookies (`jose`), password hashing (`bcryptjs`), Edge Middleware route protection
- **Document & Export Engine:** PDF Generation (`pdfkit`), CSV generation for reporting
- **Email Service:** `nodemailer` with console logging fallback for development

### 2.2 System Architecture Diagram
```
+-----------------------------------------------------------------------+
|                             CLIENT / BROWSER                          |
|    (Next.js 14 React Server Components + Client Interactive UI)       |
+-----------------------------------+-----------------------------------+
                                    |
                            HTTP / REST / Cookies
                                    v
+-----------------------------------------------------------------------+
|                           EDGE MIDDLEWARE                             |
|       (JWT Authentication, Role Validation, Session Guard)            |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                      NEXT.JS 14 APP ROUTER API                        |
|   /api/auth/*  | /api/rfqs/*  | /api/quotations/*  | /api/pos/*       |
|   /api/goods-receipts/* | /api/invoices/* | /api/reports/*            |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                     PROCUREMENT INTELLIGENCE LAYER                    |
|   [Smart Scoring]  [Approval Router]  [3-Way Match]  [Scorecard Engine] |
+-----------------------------------+-----------------------------------+
                                    |
                                Prisma ORM
                                    v
+-----------------------------------------------------------------------+
|                          POSTGRESQL DATABASE                          |
|             (14 Relational Models, Compound Uniques, Enums)           |
+-----------------------------------------------------------------------+
```

---

## 3. Database Schema & Data Models

The Prisma schema (`prisma/schema.prisma`) defines 14 relational models and 10 enums:

### 3.1 Enums
- `Role`: `ADMIN`, `BUYER`, `SELLER`
- `UserStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `VendorStatus`: `PENDING`, `ACTIVE`, `INACTIVE`, `BLACKLISTED`
- `RFQStatus`: `DRAFT`, `OPEN`, `CLOSED`, `AWARDED`, `CANCELLED`
- `QuotationStatus`: `DRAFT`, `SUBMITTED`, `SELECTED`, `REJECTED`
- `ApprovalStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `POStatus`: `ISSUED`, `ACKNOWLEDGED`, `RECEIVED`, `FULFILLED`, `CANCELLED`
- `InvoiceStatus`: `DRAFT`, `SENT`, `PAID`, `CANCELLED`
- `MatchStatus`: `PENDING`, `MATCHED`, `MISMATCH`, `PARTIALLY_MATCHED`
- `GRNStatus`: `PARTIAL`, `COMPLETE`

### 3.2 Data Models Overview
1. **`User`**: System accounts for Admins, Buyers (Procurement Officers), and Sellers (Vendors).
2. **`Vendor`**: Supplier profiles including category, GST number, contact details, rating (0–5★), status, and blacklist flag.
3. **`RFQ`**: Procurement requests containing rfqNumber, budgetAmount, deadline, status, attachment, and author.
4. **`RFQItem`**: Individual line items inside an RFQ (product name, description, quantity, unit, GST rate).
5. **`RFQVendor`**: Junction table mapping invited vendors to specific RFQs.
6. **`Quotation`**: Bids submitted by vendors linked to RFQs (deliveryDays, totalAmount, notes, status).
7. **`QuotationItem`**: Line-item pricing submitted by vendors matching RFQ items.
8. **`CounterOffer`**: Price and delivery date counter-proposals negotiated between buyers and sellers.
9. **`Approval`**: Audit record of approval requests, designated approver, tier, auto-approval flag, and decision timestamps.
10. **`PurchaseOrder`**: Official order generated upon quotation selection and approval (subtotal, tax, savings, budget savings, status).
11. **`GoodsReceipt` (GRN)**: Delivery receipt records logged when goods arrive.
12. **`GoodsReceiptItem`**: Line item level tracking of ordered vs. actual received quantities.
13. **`Invoice`**: Vendor bill tied to a PO (subtotal, tax, total, invoice status, match status).
14. **`ActivityLog` & `Notification`**: System audit trail logs and user notification queue.

---

## 4. Sourcing & Procurement Intelligence Modules

### 4.1 Smart Award Engine (`src/lib/scoring.ts`)
Instead of defaulting to a naive "lowest price wins" model, VendorBridge evaluates competing quotations using a 100-point normalized scoring formula:

$$\text{Score} = (W_P \cdot P_N) + (W_D \cdot D_N) + (W_R \cdot R_N) + (W_S \cdot S_N)$$

- **Price Weight ($W_P = 45$):** Normalized inverse score (cheapest quote scores 1.0).
- **Delivery Speed Weight ($W_D = 25$):** Normalized inverse score (fastest delivery scores 1.0).
- **Vendor Rating Weight ($W_R = 20$):** Historical star rating scaled ($\text{Rating} / 5.0$).
- **Reliability Weight ($W_S = 10$):** Active status bonus (ACTIVE = 1.0, PENDING = 0.5, INACTIVE = 0.2).

**Explainable Reasoning:** The engine outputs human-readable bullet points explaining the decision, e.g.:
- *"Lowest total price among all bids"*
- *"Priced ₹40,000 above the cheapest, but wins on overall value"*
- *"Fastest delivery (3 days)"*
- *"Beats next-best (TechnoCorp) by 8.4 points"*

### 4.2 Dynamic Vendor Performance Scorecard (`src/lib/scorecard.ts`)
Calculates dynamic ratings based on empirical fulfillment data from historical POs and GRNs:
- **On-Time Delivery Rate (60% weight):** Delivered on or before promised delivery date.
- **Zero-Defect Item Accuracy Rate (40% weight):** $\frac{\text{Received Quantity}}{\text{Ordered Quantity}} \times 100$.

Calculates composite performance score (0–100) and assigns a performance Grade:
- **Grade A:** Score $\ge 75$
- **Grade B:** Score $\ge 55$
- **Grade C:** Score $\ge 35$
- **Grade D:** Score $< 35$

### 4.3 Threshold-Based Delegation of Authority (`src/lib/approval-policy.ts`)
Controls company spend by routing approvals according to threshold rules:
- **≤ ₹1,00,000:** Auto-Approved instantly without manual intervention.
- **≤ ₹10,00,000:** Requires Buyer / Procurement Officer approval.
- **> ₹10,00,000:** Requires Admin / Executive sign-off.

### 4.4 Pro-Rata 3-Way Matching Engine (`src/lib/match.ts`)
Protects against overbilling or paying for unreceived items by reconciling 3 data sources:
1. Purchase Order Amount
2. Cumulative Goods Receipt Notes (GRNs)
3. Vendor Invoice

**Matching Rules:**
- **`PENDING`:** No goods received yet.
- **`MATCHED`:** 100% of items delivered AND invoice matches PO total (within ₹1 tolerance).
- **`PARTIALLY_MATCHED`:** Partial delivery verified AND invoice amount $\le$ verified delivered value.
- **`MISMATCH`:** Invoiced amount exceeds verified delivered goods or rate discrepancies exist.

---

## 5. Role-Based Access Control (RBAC) & User Portals

### 5.1 Roles & Capabilities Matrix

| Feature / Action | Admin | Buyer (Procurement Officer) | Seller (Vendor) |
| :--- | :---: | :---: | :---: |
| **Manage Users & Approve Vendor Registrations** | ✅ | ❌ | ❌ |
| **Create & Broadcast RFQs** | ✅ | ✅ | ❌ |
| **View Invited RFQs** | ✅ | ✅ | ✅ (Only invited) |
| **Submit Quotations & Counter-Offers** | ❌ | ❌ | ✅ |
| **Trigger Smart Award Scoring** | ✅ | ✅ | ❌ |
| **Approve / Reject Quotations & Award POs** | ✅ | ✅ | ❌ |
| **Issue Goods Receipt Notes (GRN)** | ✅ | ✅ | ❌ |
| **Generate & Send Invoices** | ❌ | ❌ | ✅ |
| **View Executive Analytics & Export CSV** | ✅ | ✅ | ❌ (Own summary) |

---

## 6. End-to-End Procurement Workflow Lifecycle

```
[Buyer] Creates RFQ with Line Items & Budget
       │
       ▼
[Vendors] Receive Invitation & Submit Quotations / Counter-Offers
       │
       ▼
[Smart Award Engine] Scores Bids & Recommends Winner with Explanations
       │
       ▼
[Buyer] Selects Winning Quotation
       │
       ▼
[Approval Policy] Checks Spend Threshold:
       ├── ≤ ₹1L  ──> Auto-Approved
       └── > ₹1L  ──> Escalated to Approver Queue (Manager / Admin)
       │
       ▼
[Purchase Order] Issued & Realized Savings Logged (vs Budget & vs Highest Bid)
       │
       ▼
[Buyer / Warehouse] Logs Goods Receipt Note (GRN) upon physical arrival
       │
       ▼
[Vendor] Issues Invoice against Purchase Order
       │
       ▼
[3-Way Match Engine] Reconciles PO + GRN + Invoice ──> Live Status Badge (✓ Matched)
       │
       ▼
[PDF Engine] Generates downloadable PO & Invoice PDFs + Financial Reporting
```

---

## 7. Directory Structure & Key Files

```
src/
├── middleware.ts                   # Edge JWT guard & role authorization
├── app/                            # Next.js App Router routes
│   ├── (app)/                      # Authenticated Layout & Portal pages
│   │   ├── dashboard/              # Key metrics, active RFQs, savings summary
│   │   ├── vendors/                # Vendor directory, registration approval, scorecards
│   │   ├── rfqs/                   # RFQ list, creation form
│   │   ├── rfqs/[id]/              # Smart Award banner, bid comparison, selection
│   │   ├── approvals/              # Manager/Admin approval queue
│   │   ├── purchase-orders/        # PO management, GRN logging, PDF download
│   │   ├── goods-receipts/         # Goods receipts log & line item verification
│   │   ├── invoices/               # Invoice dashboard, 3-way match badges
│   │   ├── reports/                # Procurement analytics, savings charts, CSV export
│   │   └── activity/               # System audit log trail
│   ├── api/                        # 24 REST API route handlers
│   ├── login/ signup/              # Auth pages with 1-click demo login buttons
│   └── pending-approval/           # Pending vendor/user status splash page
├── lib/                            # Procurement Core Engines & Utilities
│   ├── scoring.ts                  # ⭐ Smart Award Engine algorithm
│   ├── scorecard.ts                # ⭐ Dynamic Vendor Performance & Scorecard engine
│   ├── approval-policy.ts          # ⭐ Delegation of Authority spend routing
│   ├── match.ts                    # ⭐ Enterprise 3-Way Match engine
│   ├── pdf.ts & po-pdf.ts          # Invoice & PO PDF generators (pdfkit)
│   ├── csv.ts                      # Analytics CSV exporter
│   ├── auth.ts & rbac.ts           # JWT session handling & RBAC checks
│   ├── email.ts                    # Nodemailer wrapper
│   └── prisma.ts                   # Prisma client singleton
prisma/
├── schema.prisma                  # Complete relational database model
└── seed.ts                        # Seed script generating demo users, vendors, RFQs & bids
```

---

## 8. Quick Start & Execution Commands

### 8.1 Easiest (Zero DB Setup - Embedded Postgres)
```bash
npm install
npm run dev:local    # Starts embedded PostgreSQL + seeds database + launches dev server
```

### 8.2 Standard PostgreSQL Setup
```bash
npm install
cp .env.example .env.local
npm run db:push      # Push Prisma schema to database
npm run db:seed      # Populate demo data
npm run dev          # Launch Next.js dev server on http://localhost:3000
```

### 8.3 Production Build & Verification
```bash
npm run build        # Executes prisma generate && next build
npm run start        # Launches production server
```

### 8.4 Default Demo Accounts (Password: `password123`)
- **Admin Account:** `admin@vendorbridge.com`
- **Procurement Officer (Buyer):** `officer@vendorbridge.com`
- **Manager / Approver:** `manager@vendorbridge.com`
- **Vendor (Seller):** `vendor@techno.com` / `vendor@global.com`

---

## 9. Summary & Unique Selling Proposition (USP)

VendorBridge provides a complete, modern enterprise procurement experience. By replacing traditional spreadsheets and manual email approvals with **Smart Award Scoring**, **Automated Governance**, **Empirical Vendor Grading**, and **Automated 3-Way Invoice Matching**, VendorBridge enables organizations to eliminate rogue spend, accelerate procurement cycles, and guarantee delivery accuracy.
