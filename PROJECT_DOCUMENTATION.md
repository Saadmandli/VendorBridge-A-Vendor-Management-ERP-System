# VendorBridge — Enterprise Procurement & Vendor Management ERP System
## Comprehensive Architectural & Technical Documentation

---

## 1. Executive Overview & Objectives

### 1.1 Project Title & Identity
**VendorBridge — Procurement & Vendor Management ERP**  
A full-stack, enterprise-grade cloud Enterprise Resource Planning (ERP) platform architected to modernize and digitize the corporate Source-to-Pay (S2P) procurement lifecycle.

### 1.2 Problem Statement & Industry Context
Traditional procurement workflows in small-to-medium enterprises (SMEs) and mid-market organizations suffer from severe operational friction:
- **Disjointed Communication:** RFQs (Requests for Quotation), bids, and negotiation cycles take place across fragmented email chains and spreadsheets.
- **Biased or Sub-Optimal Supplier Selection:** Procurement officers often rely on manual comparisons or simple "lowest bid wins" heuristics, ignoring historical vendor reliability, quality ratings, delivery timelines, and logistics proximity.
- **Spend Governance Vulnerabilities:** Lack of formal Delegation of Authority (DoA) controls leads to unauthorized or non-compliant spending without appropriate hierarchical managerial sign-offs.
- **Invoice Fraud & Discrepancies:** Absence of an automated 3-Way Reconciliation (Matching) mechanism exposes enterprises to paying for unreceived goods, phantom invoices, and quantity/price miscalculations.
- **Lack of Spend Intelligence:** Purchasing executives lack real-time visibility into realized procurement savings, supplier performance scorecards, and departmental category spend.

### 1.3 Purpose & Target Personas
VendorBridge centralizes supplier interactions into a unified, auditable digital workflow serving four distinct corporate personas:

| Role Identifier | Persona Name | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| `BUYER` | **Procurement Officer** | Creates and publishes RFQs, invites qualified vendors, inspects AI risk alerts, analyzes explainable smart quote recommendations, submits counter-offers, generates Purchase Orders, and records Goods Receipts (GRNs). |
| `SELLER` | **Vendor / Supplier** | Maintains vendor profile and catalog details, views private RFQ invitations, submits multi-item itemized bids, negotiates buyer counter-offers, tracks PO fulfillment, and issues digital invoices. |
| `BUYER` (Manager tier) | **Manager / Approver** | Acts as the spend governance gatekeeper; reviews elevated procurement requests exceeding threshold budgets (₹1,00,000 to ₹10,00,000) and approves or rejects with audit remarks. |
| `ADMIN` | **System Administrator** | Oversees platform health, executes user lifecycle moderation (approving/rejecting pending accounts), resolves highest-tier spend requests (> ₹10,00,000), manages vendor blacklisting, and inspects organization-wide analytics. |

### 1.4 Core Value Proposition & Architectural Philosophy
1. **Explainable AI & Algorithmic Smart Award Engine:** Replaces black-box decision making with a defensible, multi-variable mathematical scoring matrix (Price 45%, Delivery 25%, Rating 20%, Reliability 10%) accompanied by plain-English rationales.
2. **Zero-Cost Statistical Anomaly & Risk Detection:** Real-time supplier fraud, bid deviation (Z-score analysis), and budget overrun detection computed entirely in-process without relying on paid third-party AI APIs.
3. **Automated Delegation of Authority (DoA):** Dynamic spend routing enforcing zero-friction auto-approval for low-value spend while mandating multi-tier approvals for capital-intensive purchases.
4. **Strict 3-Way Match Verification:** Automated ledger control requiring cryptographic reconciliation across Purchase Order (PO), Goods Receipt Note (GRN), and Supplier Invoice before payment clearance.
5. **Zero-Friction Portability:** Built to function with zero external infrastructure overhead via an embedded relational database launcher (`embedded-postgres`), while remaining fully deployable to serverless cloud infrastructure (Neon Serverless PostgreSQL + Vercel).

---

## 2. Complete Technology Stack & Dependencies

### 2.1 Categorized Stack Breakdown

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           VENDORBRIDGE APPLICATION STACK                        │
├────────────────────────────────────────────────────────────────────────────────┤
│ FRONTEND PRESENTATION LAYER                                                    │
│   • Next.js 14 (App Router, Server Components & Client Hydration)              │
│   • React 18.3 (Hooks, Context, Synthetic Event Handlers)                      │
│   • Tailwind CSS 3.4 (Utility-first Design System, Custom Color Palette)       │
│   • Responsive Glassmorphism & High-Contrast ERP Component Architecture        │
├────────────────────────────────────────────────────────────────────────────────┤
│ APPLICATION BACKEND & API GATEWAY                                              │
│   • Node.js 20+ Runtime Environment                                            │
│   • Next.js Route Handlers (Edge & Node.js Native API Endpoints)               │
│   • Edge Middleware (`src/middleware.ts`) with Session Token Route Protection │
│   • JWT Auth Cryptography via `jose` (HS256 Web Crypto API)                    │
│   • Password Hashing via `bcryptjs` (Salt Rounds = 10)                         │
│   • Server-Side Vector PDF Engine via `pdfkit` (PO & Invoice Generation)       │
│   • Transactional Dispatch via `nodemailer` (SMTP Notification Service)        │
├────────────────────────────────────────────────────────────────────────────────┤
│ DATA PERSISTENCE & OBJECT RELATIONAL MAPPING                                   │
│   • Primary Database: PostgreSQL (Relational Engine, ACID Compliance)          │
│   • Schema & Migrations: Prisma ORM 5.22 (`prisma-client-js`)                  │
│   • Zero-Setup Local Dev: `embedded-postgres` (In-process PG 16 binary launcher)│
│   • Cloud Production Target: Neon Serverless PostgreSQL with Connection Pooler │
├────────────────────────────────────────────────────────────────────────────────┤
│ DEVOPS, TOOLING & RUNTIME AUTOMATION                                           │
│   • Language & Static Analysis: TypeScript 5.6 & PostCSS 8                     │
│   • Fast Script Execution: `tsx` (TypeScript Execution Engine)                 │
│   • Local Orchestration: Shell (`run.sh`) & Batch (`run.bat`) automation       │
│   • Containerization: Docker & `docker-compose.yml` (Local PostgreSQL 15)      │
│   • Production Deployment Target: Vercel Serverless Platform                   │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Primary Third-Party Libraries & Packages

| Package Name | Version | Ecosystem | Purpose & Architecture Role |
| :--- | :--- | :--- | :--- |
| `next` | `14.2.18` | Core Framework | Hybrid SSR/SSG/ISR framework providing the App Router, file-based routing, server actions, and HTTP API route handling. |
| `react` / `react-dom` | `18.3.1` | UI Library | Component hierarchy rendering, state synchronization, reconciliation, and DOM manipulation. |
| `@prisma/client` | `^5.22.0` | ORM Runtime | Type-safe query builder and database client auto-generated from `prisma/schema.prisma`. |
| `prisma` | `^5.22.0` | Dev Tooling | CLI for database introspection, migrations (`db push`), seed runners, and schema compilation. |
| `jose` | `^5.9.6` | Security | Lightweight, edge-runtime-compatible JSON Web Token (JWT) implementation using Web Crypto API. |
| `bcryptjs` | `^2.4.3` | Security | Pure JavaScript implementation of the Blowfish-based password hashing algorithm. |
| `pdfkit` | `^0.15.1` | Document Engine | Programmatic vector PDF generator generating formal commercial invoices and purchase orders. |
| `nodemailer` | `^6.9.16` | Communication | SMTP client library handling transactional notifications for user activations and invoice alerts. |
| `embedded-postgres` | `18.4.0-beta.17`| Dev Database | Embedded PostgreSQL binaries compiled for Node.js, providing zero-configuration local database execution. |
| `tailwindcss` | `^3.4.15` | CSS Framework | Utility-first CSS framework enabling rapid, consistent enterprise UI theming. |
| `tsx` | `^4.19.2` | Dev Runner | TypeScript execute CLI to run database seed scripts (`prisma/seed.ts`) directly without ahead-of-time compilation. |
| `typescript` | `^5.6.3` | Compiler | Static type checking and interface verification across all application layers. |

---

## 3. High-Level & Detailed Architecture

### 3.1 Component-Level Architecture

The VendorBridge architecture is organized into four distinct operational tiers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER ENVIRONMENT                                │
│   ┌───────────────────────────┐  ┌───────────────────────────┐  ┌────────────────────┐ │
│   │   Procurement Dashboard   │  │   RFQ & Quotation Matrix  │  │  Scorecard & ERP   │ │
│   │   (Buyers & Managers)     │  │   (Interactive Sourcing)  │  │  Analytics Views   │ │
│   └─────────────┬─────────────┘  └─────────────┬─────────────┘  └──────────┬─────────┘ │
└─────────────────┼──────────────────────────────┼───────────────────────────┼───────────┘
                  │ HTTPS / JSON                 │ Fetch API / Multipart     │ PDF Stream
┌─────────────────▼──────────────────────────────▼───────────────────────────▼───────────┐
│                               NEXT.JS EDGE MIDDLEWARE                                  │
│   • Cookie Inspection (`vb_session`)                                                   │
│   • Cryptographic JWT Verification (`jose`)                                            │
│   • Route RBAC Guard & Pending-Approval Redirection Engine                             │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │ Authorized Request
┌─────────────────────────────────────────▼──────────────────────────────────────────────┐
│                               API & CONTROLLER LAYER                                   │
│   ┌───────────────────┐ ┌────────────────────┐ ┌───────────────────┐ ┌───────────────┐ │
│   │ Auth & Users API  │ │ Sourcing & RFQs API│ │ Counter-Offers API│ │ Orders & GRN  │ │
│   └─────────┬─────────┘ └──────────┬─────────┘ └─────────┬─────────┘ └───────┬───────┘ │
└─────────────┼──────────────────────┼─────────────────────┼───────────────────┼─────────┘
              │                      │                     │                   │
┌─────────────▼──────────────────────▼─────────────────────▼───────────────────▼─────────┐
│                          BUSINESS INTELLIGENCE & UTILITY SERVICES                      │
│  ┌───────────────────────┐ ┌──────────────────────────┐ ┌───────────────────────────┐  │
│  │  Smart Award Engine   │ │  Zero-Cost AI Risk Engine│ │  Delegation of Authority  │  │
│  │  (`scoring.ts`)       │ │  (`ai-risk.ts`)          │ │  (`approval-policy.ts`)   │  │
│  └───────────────────────┘ └──────────────────────────┘ └───────────────────────────┘  │
│  ┌───────────────────────┐ ┌──────────────────────────┐ ┌───────────────────────────┐  │
│  │  3-Way Match Auditor  │ │  Vector PDF Synthesizer  │ │  Audit Log & Notifications │  │
│  │  (`match.ts`)         │ │  (`pdf.ts`, `po-pdf.ts`) │ │  (`activity.ts`)          │  │
│  └───────────────────────┘ └──────────────────────────┘ └───────────────────────────┘  │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │ Type-Safe Queries
┌─────────────────────────────────────────▼──────────────────────────────────────────────┐
│                           PRISMA ORM & PERSISTENCE LAYER                               │
│  • Single Instance Client (`lib/prisma.ts`)                                            │
│  • ACID Transactional Boundary Management                                              │
│  • Schema Data Models (User, Vendor, RFQ, Quotation, PO, GRN, Invoice, Approval)       │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │ Connection Pooling (Port 5432 / 5433)
┌─────────────────────────────────────────▼──────────────────────────────────────────────┐
│                              RELATIONAL DATABASE TIER                                  │
│   [Local Development] Embedded PostgreSQL Binary OR Docker PostgreSQL Container       │
│   [Production Cloud]  Neon Serverless PostgreSQL Instance                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 System Topology & Infrastructure Blueprint

```mermaid
graph TD
    subgraph Users ["Client Personas"]
        PO["Procurement Officer (Buyer)"]
        VN["Vendor (Seller)"]
        MGR["Approving Manager"]
        ADM["System Administrator"]
    end

    subgraph Security ["Edge Gateway & Security"]
        MW["Next.js Edge Middleware<br/>(JWT Token & Route RBAC Guard)"]
        AUTH_SVC["Auth Service<br/>(jose + bcryptjs)"]
    end

    subgraph Backend ["Next.js App Server (Node.js)"]
        API_RFQ["RFQ Controller"]
        API_QUOTE["Quotation & Negotiation"]
        API_AWARD["Smart Award Engine"]
        API_RISK["AI Risk Engine"]
        API_PO["PO & GRN Service"]
        API_INV["3-Way Match & Invoice Service"]
        PDF_GEN["PDFKit Vector Generator"]
        MAIL_SVC["Nodemailer SMTP Engine"]
    end

    subgraph Persistence ["Persistence Tier"]
        PRISMA["Prisma ORM Client"]
        PG[("PostgreSQL Database<br/>(Local Embedded / Neon Cloud)")]
    end

    PO -->|HTTPS / Session Cookie| MW
    VN -->|HTTPS / Session Cookie| MW
    MGR -->|HTTPS / Session Cookie| MW
    ADM -->|HTTPS / Session Cookie| MW

    MW -->|Verified Session| API_RFQ
    MW -->|Verified Session| API_QUOTE
    MW -->|Verified Session| API_PO
    MW -->|Verified Session| API_INV

    API_QUOTE --> API_AWARD
    API_QUOTE --> API_RISK
    API_PO --> PDF_GEN
    API_INV --> PDF_GEN
    API_INV --> MAIL_SVC

    API_RFQ --> PRISMA
    API_QUOTE --> PRISMA
    API_PO --> PRISMA
    API_INV --> PRISMA
    AUTH_SVC --> PRISMA

    PRISMA --> PG
```

### 3.3 End-to-End Data Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Procurement Officer
    actor Vendor as Qualified Vendor
    actor Approver as Manager / Admin
    participant App as Next.js Core API
    participant Engine as Smart Award & Risk Engine
    participant DB as PostgreSQL (Prisma)
    participant PDF as PDFKit Engine

    %% Step 1: RFQ Creation
    Buyer->>App: POST /api/rfqs (Title, Line Items, Budget, Deadline, Vendor Invitations)
    App->>DB: Persist RFQ, RFQItems, and RFQVendor associations
    DB-->>App: RFQ Record Created (Status: OPEN)
    App-->>Buyer: RFQ Broadcast Confirmation

    %% Step 2: Bidding
    Vendor->>App: POST /api/quotations (RFQ ID, Unit Prices, Delivery Days)
    App->>DB: Persist Quotation & QuotationItems
    DB-->>App: Quotation Stored (Status: SUBMITTED)

    %% Step 3: Evaluation
    Buyer->>App: GET /api/rfqs/[id]/recommendation
    App->>DB: Fetch all submitted quotes for RFQ
    DB-->>App: Return Quote dataset with Vendor ratings & history
    App->>Engine: scoreQuotations() & analyzeQuoteRisk()
    Engine-->>App: Weighted Scores, Explanations & Risk Badges
    App-->>Buyer: Return Defensible Winning Recommendation

    %% Step 4: Approval Routing
    Buyer->>App: POST /api/approvals (quotationId, rfqId)
    App->>Engine: resolveTier(Total Amount)
    alt Spend <= 1,00,000
        Engine-->>App: Auto-Approved Tier
        App->>DB: Create Approval (Status: APPROVED, autoApproved: true)
    else Spend > 1,00,000
        Engine-->>App: Escalated Approval Required (BUYER or ADMIN tier)
        App->>DB: Create Approval (Status: PENDING)
        Approver->>App: PATCH /api/approvals (status: APPROVED, remarks)
        App->>DB: Update Approval (Status: APPROVED)
    end

    %% Step 5: Purchase Order & Savings
    Buyer->>App: POST /api/purchase-orders (quotationId)
    App->>DB: Calculate Budget Saving & Competitor Saving
    App->>DB: Persist PurchaseOrder (Status: ISSUED)
    App->>DB: Mark RFQ as AWARDED & Quotation as SELECTED

    %% Step 6: Fulfillment & GRN
    Buyer->>App: POST /api/goods-receipts (purchaseOrderId, received quantities)
    App->>DB: Persist GoodsReceipt & GoodsReceiptItems

    %% Step 7: Invoicing & 3-Way Match
    Vendor->>App: POST /api/invoices (purchaseOrderId)
    App->>DB: Persist Invoice (Status: SENT)
    App->>Engine: reconcileMatch(purchaseOrderId)
    Engine->>DB: Compare (PO Total == Invoice Total) AND (Received Qty == Ordered Qty)
    alt Perfectly Matched
        DB-->>App: Status: MATCHED
    else Discrepancy Found
        DB-->>App: Status: MISMATCH
    end
    App-->>Vendor: Invoice Issued with Match Verification Badge

    %% Step 8: Document Generation
    Buyer->>App: GET /api/purchase-orders/[id]/pdf
    App->>PDF: Generate Vector PO Document
    PDF-->>Buyer: Stream application/pdf Buffer
```

---

## 4. Directory & File Structure

Below is an annotated ASCII map of the entire workspace repository:

```
VendorBridge-A-Vendor-Management-ERP-System/
├── .gitignore                      # Git exclusion rules (.localdb, node_modules, .next, .env)
├── DEPLOY.md                       # Comprehensive deployment guide (Neon, Vercel, Supabase)
├── docker-compose.yml              # Local containerized PostgreSQL 15 service definition
├── GUIDE.md                        # High-level business concepts, roles, and functional walkthrough
├── next.config.js                  # Next.js configuration (strict mode, experimental flags)
├── package.json                    # Project dependencies, scripts, and engine specifications
├── package-lock.json               # Deterministic dependency lockfile
├── postcss.config.js               # PostCSS plugin registration (Tailwind CSS, Autoprefixer)
├── PRESENTATION_CHEAT_SHEET.md     # Quick reference card for semester defense & project demos
├── README.md                       # Repository overview, quickstart instructions, and feature list
├── run.bat                         # Windows automated zero-setup bootstrap script
├── run.sh                          # POSIX (macOS/Linux) automated zero-setup bootstrap script
├── sample-invoice.pdf              # Sample exported PDF invoice artifact
├── sample-purchase-order.pdf       # Sample exported PDF purchase order artifact
├── START_HERE.md                   # Step-by-step beginner walkthrough for setting up and running
├── tailwind.config.ts              # Custom styling configuration (colors, font-stacks, plugins)
├── TEAMMATE_SETUP.md               # Quick setup guidelines for collaborative team members
├── tsconfig.json                   # TypeScript compiler options and alias resolution (`@/*`)
├── vendorbridge-ss.png             # UI screenshot showcasing the dashboard view
├── vercel.json                     # Vercel serverless deployment build and routing overrides
├── VIDEO_SCRIPT.md                 # 4-minute presentation video voiceover script with cues
│
├── prisma/
│   ├── schema.prisma               # Complete Prisma schema definitions, enums, models & relations
│   └── seed.ts                     # TypeScript database seeder script populating demo ERP data
│
├── public/                         # Static assets served at web root
│   ├── uploads/                    # Target directory for uploaded RFQ attachments & documents
│   └── [icons, images, static]    # Global web branding and favicon assets
│
├── scripts/
│   ├── dev-local.mjs               # Node.js launcher managing embedded-postgres and dev server
│   ├── reseed.mjs                  # Script executing database teardown and fresh seed
│   ├── seed-neon.mjs               # Cloud database seeder specifically tuned for Neon Postgres
│   └── smoke-test.mjs              # Comprehensive automated end-to-end API and route test suite
│
└── src/
    ├── middleware.ts               # Edge HTTP middleware verifying JWT cookies & handling RBAC
    │
    ├── app/                        # Next.js 14 App Router Directory
    │   ├── layout.tsx              # Root HTML wrapper importing Inter font & global stylesheet
    │   ├── page.tsx                # Root redirect router (forwards authenticated users to dashboard)
    │   ├── globals.css             # Tailwind directives and custom component styles
    │   ├── login/                  # Authentication login page with one-click demo login buttons
    │   ├── signup/                 # Registration portal allowing role and city selection
    │   ├── forgot-password/        # Password reset initiation page
    │   ├── pending-approval/       # Holding quarantine view for unverified buyer/seller accounts
    │   │
    │   ├── (app)/                  # Authenticated Application Shell (App Group)
    │   │   ├── layout.tsx          # Main layout providing Persistent Sidebar, Header & Notification Bell
    │   │   ├── dashboard/          # Main KPI dashboard (spend, savings, active RFQs, quick actions)
    │   │   ├── vendors/            # Supplier directory, search, category filters, and registration
    │   │   ├── rfqs/               # RFQ management (create RFQ, detail view, smart award matrix)
    │   │   ├── approvals/          # Spend governance approval queue and action portal
    │   │   ├── purchase-orders/    # Purchase order tracking, status management, and PDF generator
    │   │   ├── goods-receipts/     # GRN inspection, receipt logging, and order fulfillment audit
    │   │   ├── invoices/           # Digital invoice manager with 3-way match validation status
    │   │   ├── reports/            # Procurement intelligence, realized savings analytics & CSV export
    │   │   ├── activity/           # Enterprise system-wide audit log and chronological action history
    │   │   └── admin/              # Administrator portal for user moderation and role assignment
    │   │
    │   └── api/                    # Serverless HTTP REST Route Handlers
    │       ├── auth/               # Login, signup, logout, and password recovery endpoints
    │       ├── me/                 # Current session profile and authorization inspection
    │       ├── admin/users/        # User approval, status modification, and role elevation
    │       ├── rfqs/               # RFQ creation, query, attachment upload, and recommendation
    │       ├── quotations/         # Quotation submission and line-item bid registry
    │       ├── counter-offers/     # Buyer-seller price/timeline counter-offer negotiation
    │       ├── approvals/          # Spend approval processing and decision dispatch
    │       ├── purchase-orders/    # PO creation, status mutation, and vector PDF streaming
    │       ├── goods-receipts/     # GRN creation, quantity verification, and match triggering
    │       ├── invoices/           # Invoice issuance, 3-way match reconciliation, and PDF streaming
    │       ├── dashboard/          # Aggregated dashboard metrics and KPI calculations
    │       ├── reports/            # Analytics data aggregation and CSV spreadsheet export
    │       ├── scorecard/          # Quantitative vendor performance scorecard calculations
    │       ├── activity/           # Chronological audit log query endpoint
    │       ├── notifications/      # Real-time in-app notification polling and read-state mutation
    │       ├── upload/             # Multipart file upload handler for RFQ documents
    │       └── vendors/            # Vendor registration, profile update, and directory queries
    │
    ├── components/                 # Reusable UI Component Library
    │   ├── Badge.tsx               # Versatile status badge component (color-coded for ERP states)
    │   ├── NotificationBell.tsx    # Interactive header bell with dropdown for real-time alerts
    │   ├── PageHeader.tsx          # Standardized view title header with breadcrumbs and action buttons
    │   └── Sidebar.tsx             # Collapsible, role-aware navigation sidebar
    │
    └── lib/                        # Core Domain Logic, Services & Utilities
        ├── activity.ts             # System audit logger and user notification dispatcher
        ├── ai-risk.ts              # Statistical anomaly and supplier risk assessment engine
        ├── approval-policy.ts      # Multi-tier Delegation of Authority spend threshold rules
        ├── auth.ts                 # Cryptographic token signing, cookie generation, and bcrypt utilities
        ├── categories.ts           # Taxonomy of procurement categories and subcategories
        ├── cities.ts               # Indian commercial hub city registry for logistics proximity scoring
        ├── csv.ts                  # CSV transformation and formatting utilities for data export
        ├── email.ts                # Nodemailer SMTP configuration and email template generator
        ├── invoice-data.ts         # Invoice data structures and formatting utilities
        ├── match.ts                # 3-Way Match reconciliation algorithm (PO + GRN + Invoice)
        ├── pdf.ts                  # PDFKit vector invoice generator with tabular layouts
        ├── po-pdf.ts               # PDFKit vector purchase order generator
        ├── prisma.ts               # Global Prisma client singleton instance
        ├── rbac.ts                 # Role-Based Access Control and authentication error handling
        ├── scorecard.ts            # Mathematical vendor grading algorithm (Grades A through D)
        ├── scoring.ts              # Explainable Smart Award multi-factor scoring engine
        ├── utils.ts                # Formatting utilities (currency in INR, date strings, formatting)
        └── validation.ts           # Input schema validation rules and error sanitization
```

---

## 5. End-to-End Workflow & Execution Lifecycles

### 5.1 Authentication & Session Lifecycle
1. **Credentials Validation:** When a user submits credentials via `/api/auth/login`, the handler retrieves the corresponding record from the `User` table using `prisma.user.findUnique`.
2. **Password Verification:** The plaintext password is mathematically verified against the stored `passwordHash` using `bcrypt.compare`.
3. **Account Status Verification:** If the user's status is `PENDING` or `REJECTED`, they are quarantined and redirected to `/pending-approval` by the edge middleware.
4. **JWT Issuance:** Upon successful validation, a JSON Web Token is signed using `jose.SignJWT` with the following claims:
   - `id`: User unique cuid
   - `email`: User email address
   - `role`: Role enum (`BUYER`, `SELLER`, `ADMIN`)
   - `status`: Account approval status
   - `vendorId`: Associated supplier record ID (if role is `SELLER`)
5. **Cookie Injection:** The token is serialized into an HTTP-Only, SameSite cookie named `vb_session` with a 7-day expiration lifespan.
6. **Edge Interception:** On every downstream request, `src/middleware.ts` intercepts the request, runs `jwtVerify`, and extracts claims without incurring database query overhead.

### 5.2 RFQ (Request for Quotation) Lifecycle
```
[DRAFT] ──> [OPEN] ──> [CLOSED / EVALUATION] ──> [AWARDED]
              │
              └──> [CANCELLED]
```
1. **Creation:** A Procurement Officer navigates to `/rfqs/new`, defines title, department, target category, budget limit, submission deadline, and attaches technical specifications.
2. **Line Items Specification:** The buyer enters itemized rows (e.g., "Dell XPS 15", Quantity: 50, Unit: "units").
3. **Supplier Invitation:** The buyer selects specific registered vendors from the directory or broadcasts to all suppliers registered in the matching category.
4. **Broadcast & Notification:** The server records the `RFQ`, `RFQItem`, and `RFQVendor` associations in a single Prisma transaction, dispatching notifications to each invited supplier.

### 5.3 Quotation Submission & Counter-Offer Negotiation Lifecycle
1. **Supplier Bid Submission:** When an invited vendor accesses `/rfqs/[id]`, they enter unit prices for each requested line item and specify their delivery fulfillment timeline (e.g., 14 days).
2. **Quotation Totaling:** The server verifies that all required items are priced, computes the sum of line items (`unitPrice * quantity`), and marks the quote as `SUBMITTED`.
3. **Interactive Counter-Offer Negotiation:**
   - A Buyer can propose a counter-offer via `POST /api/counter-offers` (e.g., requesting a lower target price of ₹25,00,000 or faster delivery in 10 days).
   - An in-app alert is routed directly to the supplier account.
   - The Vendor can review the counter-offer and either **ACCEPT** or **DECLINE**.
   - If accepted, the quotation's `totalAmount` and `deliveryDays` mutate automatically, and the counter-offer status transitions to `ACCEPTED`.

### 5.4 Smart Award & Algorithmic Scoring Engine
Rather than relying strictly on the lowest bidder, VendorBridge executes an explainable, multi-factor scoring algorithm (`src/lib/scoring.ts`):

$$\text{Composite Score} = (S_{\text{price}} \times 0.45) + (S_{\text{delivery}} \times 0.25) + (S_{\text{rating}} \times 0.20) + (S_{\text{reliability}} \times 0.10)$$

Where:
- **Normalized Lower-is-Better Metric:**
  $$S_{\text{normalized}}(v) = \begin{cases} 1.0 & \text{if } \max = \min \\ \frac{\max - v}{\max - \min} & \text{otherwise} \end{cases}$$
- **Price Score ($S_{\text{price}}$):** Evaluates total quote amount against all competing bids.
- **Delivery Score ($S_{\text{delivery}}$):** Evaluates fulfillment timeline against all competing bids.
- **Rating Score ($S_{\text{rating}}$):** Evaluates vendor historical rating normalized to a 0.0–1.0 scale ($\frac{\text{Rating}}{5.0}$).
- **Reliability Score ($S_{\text{reliability}}$):** Vendor status weighting (Active = 1.0, Pending = 0.5, Other = 0.2).

#### Natural-Language Rationale Generator:
The engine analyzes the scored results and automatically produces human-readable explanations:
- *"Lowest total price among all bids"*
- *"Priced ₹40,000 above cheapest, but wins on superior delivery speed and vendor reliability"*
- *"Beats next-best bidder (Global Tech Solutions) by 8.4 composite points"*

### 5.5 Zero-Cost AI Risk & Anomaly Detection
Simultaneously, `src/lib/ai-risk.ts` analyzes every bid against market and historical baselines:
1. **Budget Deviation:** If bid exceeds the RFQ budget by $> 25\%$, risk score increases by $+35$ (Flag: Red Warning). If bid is $< 55\%$ of budget, risk increases by $+25$ (Flag: Potential Quality Compromise).
2. **Competitor Z-Score Deviation:** Bids priced $> 20\%$ above competitor averages incur $+20$ risk points.
3. **Vendor Quality Degradation:** Historical ratings below 3.0 stars trigger $+30$ risk points.
4. **Logistics Risk Assessment:** The system cross-references the buyer's operational city against the vendor's registered city (from `src/lib/cities.ts`). Local suppliers receive risk discounts, while cross-country shipments generate logistics informational alerts.

### 5.6 Delegation of Authority (DoA) Approval Flow
Spend controls are strictly enforced before an award can be formalized into a Purchase Order:

```
Total Spend Value
       │
       ├─── ≤ ₹1,00,000  ─────────> [Tier 1: Auto-Approved] (Instant clearance)
       │
       ├─── ₹1,00,001 – ₹10,00,000 ─> [Tier 2: Manager Sign-off] (Requires BUYER / Manager approval)
       │
       └─── > ₹10,00,000 ─────────> [Tier 3: Executive Admin Sign-off] (Mandatory ADMIN sign-off)
```

1. **Submission:** Upon selecting a quotation, an `Approval` record is initialized.
2. **Threshold Evaluation:** `resolveTier(amount)` evaluates the total amount:
   - If Tier 1, `autoApproved` is set to `true`, status becomes `APPROVED`, and PO generation is unlocked immediately.
   - If Tier 2 or 3, status remains `PENDING`. Designated approvers receive notifications and must explicitly record an `APPROVED` or `REJECTED` decision with justification notes.

### 5.7 Purchase Order & Realized Savings Computation
1. **PO Generation:** Once approved, a Purchase Order is initialized with an enterprise serial number (e.g., `PO-2026-0001`).
2. **Tax Computation:** Standard GST of 18% is computed on subtotal:
   $$\text{Tax Amount} = \text{Subtotal} \times 0.18, \quad \text{Total Amount} = \text{Subtotal} + \text{Tax Amount}$$
3. **Dual-Vector Savings Computation:**
   - **Savings vs. Competitor:**
     $$\text{Savings}_{\text{competitor}} = \max(\text{Competing Quotes}) - \text{Awarded Total}$$
   - **Savings vs. Budget:**
     $$\text{Savings}_{\text{budget}} = \text{RFQ Budget} - \text{Awarded Total}$$
4. **Dashboard Metrics Propagation:** Savings values are stored directly on the `PurchaseOrder` record and dynamically aggregated across executive analytics reports.

### 5.8 Goods Receipt Note (GRN) & 3-Way Match Verification
```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│     Purchase Order     │      │   Goods Receipt (GRN)  │      │     Vendor Invoice     │
│   Total: ₹11,80,000    │ <==> │  Ordered Qty: 50 pcs   │ <==> │   Total: ₹11,80,000    │
│   Ordered Qty: 50 pcs  │      │  Received Qty: 50 pcs  │      │   Status: MATCHED ✓    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```
1. **Goods Receipt Recording:** When physical shipments arrive at warehouse facilities, the receiving officer navigates to `/purchase-orders/[id]` and clicks **Receive Goods**.
2. **Quantity Verification:** The officer records received quantities per line item. If all line items match ordered quantities, the `GRNStatus` is marked `COMPLETE`.
3. **3-Way Reconciliation (`reconcileMatch`):**
   - The invoice verification service evaluates:
     1. Does an approved Purchase Order exist?
     2. Does a Goods Receipt exist where `receivedQty === orderedQty` for all items?
     3. Does `Invoice.totalAmount === PurchaseOrder.totalAmount`?
   - **Outcome States:**
     - `MATCHED`: Quantities and monetary totals align perfectly. Safe for payment release.
     - `MISMATCH`: Monetary totals differ or received goods are defective/incomplete. Payment locked.
     - `PENDING`: Invoice submitted before warehouse GRN intake has occurred.

---

## 6. API & Interface Specifications

### 6.1 Authentication & Profile Endpoints

#### `POST /api/auth/login`
- **Access Control:** Public
- **Request Body:**
  ```json
  {
    "email": "officer@vendorbridge.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "user": {
      "id": "cuid...",
      "name": "Procurement Officer",
      "email": "officer@vendorbridge.com",
      "role": "BUYER",
      "status": "APPROVED"
    }
  }
  ```
- **Side Effect:** Sets HTTP-only `vb_session` cookie.

#### `POST /api/auth/signup`
- **Access Control:** Public
- **Request Body:**
  ```json
  {
    "name": "Acme Industrial Supplies",
    "email": "vendor@acme.com",
    "password": "SecurePassword123!",
    "role": "SELLER",
    "category": "Industrial Tools",
    "city": "Mumbai",
    "gstNumber": "27AAAAA0000A1Z5"
  }
  ```
- **Success Response (201 Created):** Creates `User` and linked `Vendor` record in `PENDING` verification state.

#### `POST /api/auth/logout`
- **Access Control:** Authenticated
- **Success Response (200 OK):** Clears `vb_session` cookie.

#### `GET /api/me`
- **Access Control:** Authenticated
- **Success Response (200 OK):** Returns current session user metadata and role scopes.

---

### 6.2 RFQs & Smart Sourcing Endpoints

#### `GET /api/rfqs`
- **Access Control:** Authenticated (`BUYER`, `SELLER`, `ADMIN`)
- **Query Parameters:** `status`, `category`, `search`
- **Behavior:** Buyers see all RFQs; Sellers receive filtered views restricted to open requests they are invited to.

#### `POST /api/rfqs`
- **Access Control:** `BUYER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "title": "Procurement of 50 High-End Developer Laptops",
    "description": "32GB RAM, 1TB NVMe SSD, 15-inch display",
    "department": "Engineering",
    "category": "IT Hardware",
    "subcategory": "Laptops",
    "budgetAmount": 3500000,
    "deadline": "2026-10-15T18:30:00.000Z",
    "attachment": "/uploads/laptop-specs.pdf",
    "invitedVendorIds": ["vendor_cuid_1", "vendor_cuid_2"],
    "items": [
      {
        "productName": "Developer Laptop Workstation",
        "description": "i7/32GB/1TB SSD",
        "quantity": 50,
        "unit": "units"
      }
    ]
  }
  ```
- **Success Response (201 Created):** Returns created RFQ object with generated sequential serial `RFQ-2026-XXXX`.

#### `GET /api/rfqs/[id]/recommendation`
- **Access Control:** `BUYER`, `ADMIN`
- **Success Response (200 OK):**
  ```json
  {
    "scored": [
      {
        "quotationId": "quote_1",
        "vendorName": "TechnoWorld Systems",
        "vendorRating": 4.8,
        "totalAmount": 2800000,
        "deliveryDays": 7,
        "score": 92.4,
        "breakdown": { "price": 45.0, "delivery": 25.0, "rating": 19.2, "reliability": 10.0 },
        "isLowestPrice": true,
        "isFastest": true,
        "rank": 1
      }
    ],
    "winner": { "quotationId": "quote_1", "vendorName": "TechnoWorld Systems", "score": 92.4 },
    "reasons": [
      "Lowest total price among all bids",
      "Fastest delivery (7 days)",
      "Strong vendor rating (★ 4.8)"
    ]
  }
  ```

---

### 6.3 Quotations & Counter-Offers

#### `POST /api/quotations`
- **Access Control:** `SELLER`
- **Request Body:**
  ```json
  {
    "rfqId": "rfq_cuid_123",
    "deliveryDays": 10,
    "notes": "Includes 3-year enterprise onsite warranty",
    "items": [
      {
        "rfqItemId": "item_cuid_abc",
        "unitPrice": 56000,
        "quantity": 50
      }
    ]
  }
  ```
- **Success Response (201 Created):** Returns submitted Quotation with computed total amount ₹28,00,000.

#### `POST /api/counter-offers`
- **Access Control:** Authenticated
- **Actions:**
  - `action: "CREATE"`: Buyer proposes target price and fulfillment timeline.
  - `action: "ACCEPT"`: Seller accepts counter-offer; quote amounts auto-update.
  - `action: "DECLINE"`: Seller rejects counter-offer.

---

### 6.4 Spend Approvals

#### `GET /api/approvals`
- **Access Control:** `BUYER`, `ADMIN`
- **Response:** List of pending, approved, and rejected spend sign-offs with DoA tier metadata.

#### `POST /api/approvals`
- **Access Control:** `BUYER`
- **Request Body:** `{ "quotationId": "quote_123", "rfqId": "rfq_456" }`
- **Behavior:** Executes `resolveTier()`; either auto-approves or escalates to managerial review.

#### `PATCH /api/approvals`
- **Access Control:** `BUYER` (Manager) or `ADMIN`
- **Request Body:** `{ "id": "approval_cuid", "status": "APPROVED", "remarks": "Budget validated against Q4 OPEX" }`

---

### 6.5 Purchase Orders & Invoicing

#### `POST /api/purchase-orders`
- **Access Control:** `BUYER`, `ADMIN`
- **Request Body:** `{ "quotationId": "quote_123" }`
- **Behavior:** Generates `PurchaseOrder`, computes GST and realized savings vs. budget and competing quotes.

#### `GET /api/purchase-orders/[id]/pdf`
- **Access Control:** Authenticated
- **Behavior:** Generates and streams dynamic vector PDF binary (`Content-Type: application/pdf`).

#### `POST /api/goods-receipts`
- **Access Control:** `BUYER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "purchaseOrderId": "po_cuid_123",
    "notes": "Shipment inspected at Dock B; all cartons intact.",
    "items": [
      { "rfqItemId": "item_123", "receivedQty": 50 }
    ]
  }
  ```
- **Behavior:** Records GRN and triggers `reconcileMatch` on linked invoice.

#### `POST /api/invoices`
- **Access Control:** `SELLER`
- **Request Body:** `{ "purchaseOrderId": "po_cuid_123" }`
- **Behavior:** Creates digital invoice and evaluates initial 3-way match status.

---

### 6.6 Analytics, Reports & Utilities

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/dashboard` | `GET` | Authenticated | Aggregates active RFQ counts, pending approvals, total spend, and recent transactions. |
| `/api/reports` | `GET` | `BUYER`, `ADMIN` | Returns monthly spend trends, category distributions, and total realized savings. |
| `/api/reports/export` | `GET` | `BUYER`, `ADMIN` | Generates a downloadable CSV spreadsheet containing procurement line items and savings. |
| `/api/scorecard` | `GET` | Authenticated | Computes win rate, fulfillment rate, and grades (A–D) across all suppliers. |
| `/api/activity` | `GET` | Authenticated | Fetches chronological audit trail of all organizational procurement actions. |
| `/api/notifications` | `GET` / `PATCH` | Authenticated | Fetches in-app alerts or marks notification items as read. |
| `/api/upload` | `POST` | `BUYER`, `ADMIN` | Handles multipart file upload (up to 10MB) for technical RFQ attachments. |

---

### 6.7 Relational Data Model (Prisma Schema Map)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│     User     │ 1     * │     RFQ      │ 1     * │     RFQItem      │
│──────────────│─────────│──────────────│─────────│──────────────────│
│ id (cuid)    │         │ id (cuid)    │         │ id (cuid)        │
│ email        │         │ rfqNumber    │         │ productName      │
│ role         │         │ budgetAmount │         │ quantity         │
│ status       │         │ deadline     │         │ unit             │
└──────┬───────┘         └──────┬───────┘         └────────┬─────────┘
       │ 1                      │ 1                        │ 1
       │                        │                          │
       │ *                      │ *                        │ *
┌──────┴───────┐         ┌──────┴───────┐         ┌────────┴─────────┐
│    Vendor    │ 1     * │  Quotation   │ 1     * │  QuotationItem   │
│──────────────│─────────│──────────────│─────────│──────────────────│
│ id (cuid)    │         │ id (cuid)    │         │ id (cuid)        │
│ name         │         │ totalAmount  │         │ unitPrice        │
│ rating       │         │ deliveryDays │         │ quantity         │
│ city         │         │ status       │         │ amount           │
└──────┬───────┘         └──────┬───────┘         └──────────────────┘
       │ 1                      │ 1
       │                        │
       │ *                      │ 1
┌──────┴────────────────────────┴───────┐         ┌──────────────────┐
│             PurchaseOrder             │ 1     1 │   GoodsReceipt   │
│───────────────────────────────────────│─────────│──────────────────│
│ id (cuid)                             │         │ id (cuid)        │
│ poNumber                              │         │ grnNumber        │
│ totalAmount, savings, budgetSaving    │         │ status (COMPLETE)│
└──────────────────┬────────────────────┘         └──────────────────┘
                   │ 1
                   │ 
                   │ 1
          ┌────────┴────────┐
          │     Invoice     │
          │─────────────────│
          │ id (cuid)       │
          │ invoiceNumber   │
          │ totalAmount     │
          │ matchStatus     │
          └─────────────────┘
```

---

## 7. Setup, Configuration & Environment Variables

### 7.1 Prerequisites & System Requirements
- **Node.js:** v18.17.0 or higher (v20+ recommended)
- **Package Manager:** npm (v9+ or v10+)
- **Operating System:** Windows 10/11, macOS (Intel/Apple Silicon), or Linux (Ubuntu 20.04+)
- **Optional:** Docker Desktop (if choosing containerized PostgreSQL over the embedded engine)

### 7.2 Environment Variables (`.env`)

Create a `.env` file in the root workspace directory with the following configuration keys:

```env
# ==============================================================================
# VENDORBRIDGE ENVIRONMENT CONFIGURATION
# ==============================================================================

# Database Connection String
# For embedded local development, this is automatically managed on port 5433.
# For local Docker / standard PostgreSQL:
DATABASE_URL="postgresql://vendorbridge:vendorbridge@localhost:5432/vendorbridge?schema=public"

# Cryptographic Secret for JWT Session Signing (Minimum 32 random characters)
JWT_SECRET="super-secret-vendorbridge-jwt-key-change-this-in-production-12345"

# Canonical Public Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Transactional Email Configuration (Optional - for real email dispatch)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notifications@vendorbridge.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="VendorBridge Procurement <notifications@vendorbridge.com>"
```

### 7.3 Step-by-Step Local Setup

#### Method A: The Zero-Setup Launcher (Recommended for Windows / Mac / Linux)
VendorBridge includes an embedded PostgreSQL engine (`embedded-postgres`), eliminating the need to install PostgreSQL or Docker manually:

- **Windows Users:**  
  Double-click **`run.bat`** in the project root.
- **macOS / Linux Users:**  
  ```bash
  chmod +x run.sh
  ./run.sh
  ```
- **Universal CLI Command:**  
  ```bash
  npm install
  npm run dev:local
  ```
*What this does under the hood:*
1. Downloads and unpacks a dedicated PostgreSQL binary in `.localdb/`.
2. Starts the database on port `5433`.
3. Runs `prisma db push` to synchronize schema tables.
4. Executes `scripts/dev-local.mjs` to auto-seed demo accounts and RFQ data.
5. Boots Next.js dev server at `http://localhost:3000`.

#### Method B: Containerized Docker PostgreSQL Setup
```bash
# 1. Install NPM dependencies
npm install

# 2. Launch PostgreSQL container
docker compose up -d

# 3. Apply schema migrations
npm run db:push

# 4. Populate demo records
npm run db:seed

# 5. Start development server
npm run dev
```

### 7.4 Default Demo Accounts (Pre-Seeded)

All accounts share the default password: **`password123`**

| Role / Persona | Email Address | Description & Intended Demo Workflow |
| :--- | :--- | :--- |
| **System Administrator** | `admin@vendorbridge.com` | Full governance; moderates pending users, signs off large spend (> ₹10L). |
| **Procurement Officer** | `officer@vendorbridge.com` | Buyer persona; drafts RFQs, compares quotes, generates POs and GRNs. |
| **Manager / Approver** | `manager@vendorbridge.com` | Evaluates pending spend sign-offs between ₹1,00,000 and ₹10,00,000. |
| **Vendor 1 (TechnoWorld)**| `vendor@techno.com` | High-rating supplier (★ 4.8); responds to IT and hardware tenders. |
| **Vendor 2 (Global Corp)**| `vendor@global.com` | Competitor supplier; submits competing bids for price comparison. |

---

## 8. Testing, Build & Deployment

### 8.1 Automated Smoke Test Suite
VendorBridge features an end-to-end programmatic smoke testing script (`scripts/smoke-test.mjs`) that validates the entire stack without external testing dependencies:

```bash
# Run against local running server
node scripts/smoke-test.mjs

# Run against remote staging/production instance
BASE_URL="https://your-production-domain.com" node scripts/smoke-test.mjs
```

**Test Assertions Verified by the Suite:**
- Public route availability (`/login`, `/signup`, `/forgot-password`).
- Authentication handshake and cookie establishment for Admin, Buyer, and Seller.
- Edge RBAC protection: Verifies that Sellers cannot access restricted administrative routes.
- API integrity checks across `/api/rfqs`, `/api/purchase-orders`, `/api/invoices`, `/api/reports`, and `/api/scorecard`.
- Execution of the Smart Award scoring function and verification of returned rank structures.

### 8.2 Production Build Execution
To validate static typing and generate an optimized production bundle:

```bash
# 1. Generate Prisma client & compile Next.js application
npm run build

# 2. Start optimized production server
npm run start
```

### 8.3 Production Cloud Deployment (Vercel + Neon)
1. **Database:** Deploy a serverless PostgreSQL database using [Neon](https://neon.tech).
2. **Environment Secrets:** In your Vercel project settings, configure:
   - `DATABASE_URL`: Connection string provided by Neon (with `?sslmode=require`).
   - `JWT_SECRET`: High-entropy random cryptographic key.
   - `NEXT_PUBLIC_APP_URL`: Your Vercel canonical deployment domain.
3. **Database Seeding on Cloud:**
   ```bash
   DATABASE_URL="your-neon-url" node scripts/seed-neon.mjs
   ```
4. **Deploy:** Push your repository to GitHub; Vercel automatically runs `npm run build` (`prisma generate && next build`) and provisions the serverless lambdas.

---

## 9. Current Status, Edge Cases & Roadmap

### 9.1 Academic Defense & Semester Viva Preparation

#### Frequently Asked Examiner Questions & Strategic Architectural Answers:

**Q1: "Why not simply award tenders to the vendor with the lowest price?"**  
*Defense:*  
> In real-world enterprise procurement, selecting the cheapest bid often leads to project failure due to delayed delivery timelines, substandard build quality, or untrustworthy suppliers. VendorBridge implements an explainable multi-factor scoring algorithm (Price 45%, Delivery 25%, Rating 20%, Reliability 10%). This guarantees that the enterprise balances cost reduction with delivery speed and historical reliability, while generating plain-English justifications for audit compliance.

**Q2: "How does VendorBridge prevent invoice fraud and overbilling?"**  
*Defense:*  
> VendorBridge enforces an automated 3-Way Match rule. An invoice cannot transition to `MATCHED` status unless: (1) An approved Purchase Order exists, (2) A physical Goods Receipt Note (GRN) confirms that warehouse staff received 100% of the ordered quantities, and (3) The invoice monetary total exactly equals the PO authorized amount. If any metric deviates, the invoice is flagged as `MISMATCH` and payment is frozen.

**Q3: "How does the system ensure data privacy between competing suppliers?"**  
*Defense:*  
> Data privacy is strictly enforced at the database query level inside Prisma queries and verified by session claims in `src/middleware.ts`. A vendor can only view RFQs they have been explicitly invited to (`invitedVendors` relation) and can never query or view competitor quotation line items or bids.

---

### 9.2 Known Limitations & Edge Cases

| Scenario / Edge Case | System Behavior & Mitigation |
| :--- | :--- |
| **Embedded Database Lock on Windows** | If a previous process terminates abnormally, `postmaster.pid` may remain locked. `dev-local.mjs` includes an automatic self-healing routine that detects orphaned PIDs, kills them via `taskkill`, and deletes stale PID files before booting. |
| **Serverless Ephemeral File Uploads** | File attachments uploaded via `/api/upload` write to the local filesystem (`/public/uploads`). In ephemeral serverless environments (like AWS Lambda or Vercel), local disk writes do not persist across restarts. (See Roadmap for AWS S3 / Cloudinary migration). |
| **Partial Goods Delivery (Split Shipments)** | When a supplier delivers 30 out of 50 ordered units, the GRN logs a `PARTIAL` receipt. The 3-way match holds the invoice in `MISMATCH` until the remaining 20 units are verified on a subsequent GRN. |

---

### 9.3 Future Technical Roadmap

1. **Cloud Object Storage Integration:** Transition file attachment uploads from local disk storage to Amazon S3 or Cloudflare R2 presigned URLs.
2. **Payment Gateway Integration:** Incorporate Razorpay / Stripe webhooks to trigger automated escrow disbursements once an invoice reaches `MATCHED` status.
3. **AI Optical Character Recognition (OCR):** Ingest scanned paper vendor invoices and supplier PDF quotes, parsing line items automatically using computer vision.
4. **Multi-Tenant Enterprise Isolation:** Introduce multi-tenant organizational schemas allowing multiple independent companies to run isolated procurement instances on a shared infrastructure cluster.
5. **Real-Time WebSocket Notifications:** Upgrade notification polling to server-sent events (SSE) or WebSockets for instantaneous buyer-seller live bidding updates.

---

*Documentation compiled and maintained for the VendorBridge Enterprise ERP Project.*
