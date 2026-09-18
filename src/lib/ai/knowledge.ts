/**
 * VendorBridge Enterprise Knowledge Base & Architectural Blueprint
 * ----------------------------------------------------------------
 * Comprehensive system intelligence provided to the AI Copilot for grounded,
 * domain-accurate assistance across the end-to-end procurement lifecycle.
 */

export const VENDORBRIDGE_KNOWLEDGE = `
# VENDORBRIDGE ERP ENTERPRISE KNOWLEDGE BLUEPRINT

## 1. Executive Overview & End-to-End Procurement Lifecycle
VendorBridge is a comprehensive Vendor Management and Procurement ERP designed to streamline B2B procurement operations with transparency, compliance, and automated workflows.

The complete lifecycle follows this deterministic operational progression:
1. **RFQ Creation**: Buyers create Requests for Quotations (RFQs) specifying item requirements, target quantities, units, GST rates, budget allocations, and submission deadlines.
2. **Vendor Bidding**: Verified vendors submit quotations detailing unit prices, total commercial amounts, committed delivery days, and technical notes.
3. **Smart Scoring & Recommendation**: The Smart Award Engine evaluates competing bids across multiple objective dimensions to recommend optimal award candidates.
4. **Negotiation Sandbox**: Buyers and sellers engage in bilateral negotiations. Staged counter-offers remain tentative drafts until a final mutual agreement is reached.
5. **Atomic Award & Auto-Cancellation**: Accepting a quotation atomically awards the RFQ, generates a formal Purchase Order (PO), creates approval workflows if required by spend thresholds, and automatically cancels competing quotations.
6. **Delegation of Authority (DoA) Approval**: POs exceeding policy thresholds are routed to Buyers or Senior Administrators for formal authorization before execution.
7. **Goods Receipt Note (GRN)**: Storekeepers and warehouse managers record physical deliveries against POs, tracking ordered vs. received quantities and noting partial or complete shipments.
8. **Supplier Invoicing**: Vendors submit digital invoices tied to issued Purchase Orders.
9. **Pro-Rata 3-Way Matching**: The reconciliation engine compares Purchase Orders, cumulative Goods Receipts (GRNs), and Invoices to verify monetary and quantity integrity before releasing payments.
10. **Dynamic Performance Scorecards**: Empirical fulfillment data continuously updates vendor ratings and letter grades (A, B, C, D) based on delivery punctuality and fulfillment accuracy.

---

## 2. Smart Award Engine (100-Point Normalized Scoring Model)
The Smart Award Engine replaces naive "lowest price wins" bidding with an explainable, multi-factor decision matrix. Competing quotations for an RFQ are normalized on a 0–100 point scale using the following formula:

- **Price Competitiveness (45% weight / 45 points max)**:
  Normalized inverse score. The lowest submitted price receives 1.0 (45 pts); higher prices are penalized proportionally based on the range:
  \`NormalizedPrice = (MaxPrice - QuotePrice) / (MaxPrice - MinPrice)\`
- **Delivery Speed (25% weight / 25 points max)**:
  Normalized inverse score. The fastest committed delivery receives 1.0 (25 pts); slower delivery timelines receive proportionally lower points:
  \`NormalizedDelivery = (MaxDays - QuoteDays) / (MaxDays - MinDays)\`
- **Vendor Track Record & Rating (20% weight / 20 points max)**:
  Objective historical star rating (0 to 5.0 stars) normalized to 20 points:
  \`RatingScore = (Rating / 5.0) * 20\`
- **Vendor Reliability & Status Bonus (10% weight / 10 points max)**:
  - ACTIVE verified vendors: 1.0 (10 points)
  - PENDING review vendors: 0.5 (5 points)
  - INACTIVE / BLACKLISTED vendors: 0.2 (2 points)

Total Composite Score = PriceScore + DeliveryScore + RatingScore + ReliabilityScore (0 to 100).
The winner is recommended with clear human-readable explanations (e.g., fastest delivery, lowest price, or superior overall value).

---

## 3. Delegation of Authority (DoA) Spend Limits & Approval Policy
Financial governance enforces strict approval hierarchy based on the total PO value:
- **Tier 1 (≤ ₹1,00,000)**: Auto-Approved instantly upon quotation award. No manual management intervention required.
- **Tier 2 (₹1,00,001 to ₹10,00,000)**: Buyer / Procurement Officer sign-off required. The PO remains locked in PENDING status until an authorized Buyer or Admin reviews and approves it.
- **Tier 3 (> ₹10,00,000)**: High-Value Executive / Admin Sign-off required. Senior leadership review is mandated to mitigate corporate financial risk.

---

## 4. Pro-Rata 3-Way Matching Engine
The 3-Way Matching Engine reconciles three independent procurement records:
1. **Purchase Order (PO)**: Legal agreement defining ordered items, quantities, and agreed unit rates.
2. **Goods Receipts (GRNs)**: Cumulative physical inventory logged and verified by receiving docks.
3. **Vendor Invoice**: Financial claim submitted by the supplier for payment.

### Match Status Definitions:
- **PENDING**: No physical goods receipts have been logged yet for the PO. Invoices cannot be processed for payment until physical delivery is verified.
- **MATCHED**: 100% of ordered quantities have been verified across GRNs and the invoice total strictly matches the PO total within a ₹1.00 rounding tolerance. Ready for immediate payment disbursement.
- **PARTIALLY_MATCHED**: Partial deliveries have been received and verified. The invoice total does not exceed the monetary value of the verified delivered goods (\`InvoiceTotal <= VerifiedDeliveredValue + ₹1.00\`). Payment is authorized for the partial delivered portion.
- **MISMATCH**: Invoiced amounts or quantities exceed the cumulative verified goods receipts, or there is an unauthorized price/rate discrepancy. Invoices flagged as MISMATCH cannot be paid until rectified.

---

## 5. Dynamic Vendor Performance Scorecard
Vendor ratings are computed dynamically from empirical fulfillment data rather than static subjective reviews:
- **Delivery Punctuality (60% weight)**:
  Percentage of completed purchase orders delivered on or before the committed delivery deadline (\`PO Creation Date + Quotation Delivery Days\`).
- **Fulfillment Accuracy (40% weight)**:
  Percentage of ordered items received without defects or short-shipments:
  \`AccuracyRate = (AccurateReceivedItems / TotalOrderedItems) * 100\`

### Composite Objective Score & Letter Grades:
- Star Rating: 0.0 to 5.0 stars (Baseline 4.0 for newly onboarded vendors with no historical orders).
- Letter Grades based on composite score:
  - **Grade A (≥ 75 points)**: Preferred Tier-1 Vendor. Exemplary punctuality and fulfillment accuracy.
  - **Grade B (55–74 points)**: Reliable Vendor. Consistent performance with minor occasional delays.
  - **Grade C (35–54 points)**: Conditional / Under Review. Elevated defect rates or recurring late deliveries.
  - **Grade D (< 35 points)**: High Risk / Probation. Serious fulfillment bottlenecks; potential candidate for vendor blacklisting.

---

## 6. Negotiation Sandbox & Workflow Rules
- **Isolated Negotiation**: Buyers can submit staged counter-offers to suppliers with suggested target prices, reduced delivery windows, and explanatory notes.
- **Draft Status**: Counter-offers remain in negotiation draft status until explicitly accepted or countered by the counterparty.
- **Atomic Award**: When an offer or counter-offer is finalized and accepted, the system atomically:
  1. Marks the chosen Quotation as \`SELECTED\`.
  2. Updates the RFQ status to \`AWARDED\`.
  3. Automatically marks all competing quotations as \`REJECTED\` with notification triggers.
  4. Generates a formal Purchase Order and initiates the DoA approval workflow.

---

## 7. System Troubleshooting & Common Issues
- **Award Locks / Duplicate Award Prevention**: Once an RFQ has status \`AWARDED\`, quotations cannot be awarded a second time. If an award fails, verify if an existing PO or Approval record already exists.
- **Invoice MISMATCH Resolution**:
  1. Verify whether the vendor invoiced for the full PO amount before all goods were delivered.
  2. Check if a GRN is missing or if dock workers have not finished logging the physical receipt.
  3. Ensure GST rates on the invoice match the 18% standard rate configured in the RFQ line items.
- **Unreceived Goods (PENDING Match)**: Remind users that VendorBridge enforces strict receipt-before-payment rules. Invoices cannot match without at least one confirmed Goods Receipt note.
- **GST Verification**: All quotation items include standard GST tax calculations (\`Unit Price * Qty * (1 + GSTRate / 100)\`). Verify that HSN/SAC codes and GSTIN registration are active.

---

## 8. Platform Navigation Quick Reference
- RFQ Management: \`/rfqs\` (Create new RFQ: \`/rfqs/new\`)
- Vendor Directory & Registrations: \`/vendors\`
- Quotations & Bidding: \`/quotations\`
- Purchase Orders: \`/purchase-orders\`
- Goods Receipts (GRN): \`/goods-receipts\` (Create: \`/goods-receipts/new\`)
- Invoices & 3-Way Match: \`/invoices\`
- Approvals Dashboard: \`/approvals\`
- Performance Scorecards: \`/scorecards\`
- Admin Governance: \`/admin/users\`

---

## 9. Authentication, Onboarding & Sign-in Assistance
- **Sign In Troubles / Troubleshooting**:
  - **Account Status (PENDING approval)**: In VendorBridge, newly registered Buyer or Seller accounts initially have status \`PENDING\`. An Administrator must review and approve their account from the Admin Portal (\`/admin/users\`) before they can access the platform. If a user attempts to log in while their status is pending, the system redirects them to \`/pending-approval\`.
  - **Incorrect Password**: Direct the user to the Forgot Password page (\`/forgot-password\`) to reset credentials.
  - **Demo Credentials** (for testing & demonstration):
    - **Procurement Buyer**: \`buyer@vendorbridge.com\` / \`password123\` (also \`buyer2@vendorbridge.com\`, \`buyer3@vendorbridge.com\`)
    - **Verified Seller/Vendor**: \`vendor@acme.com\` / \`password123\` (also \`vendor@techno.com\`, \`vendor@global.com\`, \`vendor@prime.com\`, \`vendor@greenpack.com\`)
    - **System Administrator**: \`admin@vendorbridge.com\` / \`password123\` (access via \`/admin/login\`)
- **New Account Registration**:
  - Buyers and Sellers can register on the Sign Up page (\`/signup\`).
  - When registering as a Seller/Vendor, provide the business name, GST number (15-character GSTIN), contact details, and category.
- **Support & Password Recovery**:
  - Password Reset: \`/forgot-password\`
  - General Login: \`/login\`
  - Admin Login: \`/admin/login\`
`;

