import { NextRequest } from "next/server";
import { streamText, tool, isStepCount, convertToModelMessages, zodSchema } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { VENDORBRIDGE_KNOWLEDGE } from "@/lib/ai/knowledge";

// Candidate models prioritized by current cloud availability and active quota.
// Starts with gemini-3.5-flash (active) and cascades transparently across models
// to ensure 100% uptime even if a single model hits free-tier rate limits.
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-1.5-flash",
].filter(Boolean) as string[];

const primaryModel = google(MODEL_CANDIDATES[0]);

const resilientGoogleModel = new Proxy(primaryModel, {
  get(target, prop) {
    if (prop === "doStream") {
      return async (options: any) => {
        let lastError: any = null;
        for (const modelName of MODEL_CANDIDATES) {
          try {
            const m = google(modelName);
            return await m.doStream(options);
          } catch (err: any) {
            lastError = err;
            console.warn(`[AI Copilot] Model ${modelName} unavailable (${err.message?.split("\n")[0]}), cascading to next candidate...`);
          }
        }
        throw lastError;
      };
    }
    if (prop === "doGenerate") {
      return async (options: any) => {
        let lastError: any = null;
        for (const modelName of MODEL_CANDIDATES) {
          try {
            const m = google(modelName);
            return await m.doGenerate(options);
          } catch (err: any) {
            lastError = err;
            console.warn(`[AI Copilot] Model ${modelName} unavailable (${err.message?.split("\n")[0]}), cascading to next candidate...`);
          }
        }
        throw lastError;
      };
    }
    return Reflect.get(target, prop);
  },
});

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Google Gemini API key is missing. Please configure GOOGLE_GENERATIVE_AI_API_KEY in your .env or .env.local file to activate the AI Copilot.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const rawMessages = body.messages || [];
    const sessionUser = await getSession();
    const isAuthPage = Boolean(
      body.isAuthPage ||
        body.pathname === "/login" ||
        body.pathname === "/signup" ||
        body.pathname === "/forgot-password" ||
        body.pathname === "/pending-approval" ||
        body.pathname?.startsWith("/admin/login") ||
        body.pathname?.startsWith("/admin/signup")
    );

    // Normalize incoming messages to conform with UI/Model message schema
    const normalizedMessages = rawMessages.map((m: any) => {
      if (!m.parts && m.content) {
        return {
          ...m,
          parts: [{ type: "text", text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
        };
      }
      return m;
    });

    const modelMessages = await convertToModelMessages(normalizedMessages);

    const authContextInstructions = !sessionUser || isAuthPage
      ? `
# CURRENT PAGE / AUTH CONTEXT: UNAUTHENTICATED (LOGIN / SIGN UP / PUBLIC VIEW)
- The user is currently browsing the Login, Sign Up, or public authentication pages.
- ACCESS CONTROL POLICY: You MUST NOT disclose internal platform documents, live RFQs, purchase orders, invoices, vendor scorecards, or internal approvals to unauthenticated users.
- IF THE USER ASKS ABOUT ANY DOCUMENT, INVOICE, RFQ, PURCHASE ORDER, OR QUOTATION:
  Politely inform them: "For security, confidentiality, and enterprise compliance reasons, access to platform documents and internal procurement records is restricted to authenticated users. Once you are signed in to an authorized account, you will have access to your documents."
- YOUR ROLE ON THIS PAGE:
  1. Assist users with login or sign-in difficulties (wrong password, account pending approval, demo accounts).
  2. Explain account activation rules: Newly registered Buyer or Seller accounts initially have status "PENDING" and require an Administrator to approve them at /admin/users before they can log in. If an account is pending, they will be redirected to /pending-approval.
  3. Direct users who forgot their password to /forgot-password.
  4. Provide pre-configured demo test credentials when requested:
     - Buyer: buyer@vendorbridge.com / password123 (also buyer2@vendorbridge.com, buyer3@vendorbridge.com)
     - Seller: vendor@acme.com / password123 (also vendor@techno.com, vendor@global.com, vendor@prime.com, vendor@greenpack.com)
     - Administrator: admin@vendorbridge.com / password123 (via /admin/login)
  5. Help new users understand registration requirements at /signup (business name, category, GSTIN format).
  6. Answer high-level questions about platform features without revealing confidential internal database records.
`
      : `
# CURRENT USER STATUS: AUTHORIZED USER
- Authenticated User: ${sessionUser.name} (${sessionUser.email})
- Role: ${sessionUser.role}
${sessionUser.role === "SELLER" && sessionUser.vendorId ? `- Linked Vendor Organization ID: ${sessionUser.vendorId} (Seller only has access to their own vendor documents).` : "- Full internal procurement document access permitted."}
`;

    const result = streamText({
      model: resilientGoogleModel,
      system: `You are BridgeBot, an expert, enterprise-grade procurement assistant built into the VendorBridge ERP platform.
${authContextInstructions}

# ENTERPRISE BLUEPRINT & SYSTEM INTELLIGENCE:
${VENDORBRIDGE_KNOWLEDGE}

# OPERATIONAL GUIDELINES:
1. Adhere strictly to the Access Control Policy above.
2. For authorized users, use live tools to inspect database records before answering.
3. Keep responses clear, professional, and actionable. Format financial figures in INR (₹) with Indian digit grouping where appropriate (e.g. ₹1,00,000).
4. If an authorized user encounters a 3-way match MISMATCH, clearly explain the breakdown: Ordered vs Cumulative Received vs Invoiced amount.
5. If drafting a counter-offer, remind the user that it remains a draft in the negotiation sandbox until confirmed on the platform.`,
      messages: modelMessages,
      stopWhen: isStepCount(5),
      tools: {
        lookupRFQ: tool({
          description: "Lookup detailed information about a Request for Quotation (RFQ) including budget, items, status, and received bids/quotations.",
          inputSchema: zodSchema(
            z.object({
              identifier: z.string().describe("The RFQ ID (cuid) or RFQ Number (e.g. RFQ-...)"),
            })
          ),
          execute: async ({ identifier }: { identifier: string }) => {
            if (!sessionUser || isAuthPage) {
              return {
                authorized: false,
                message: "Authentication Required: Access to live RFQ documents is restricted to authenticated users. Please sign in or register to view documents.",
              };
            }
            const rfq = await prisma.rFQ.findFirst({
              where: {
                OR: [
                  { id: identifier },
                  { rfqNumber: { equals: identifier, mode: "insensitive" } },
                  { rfqNumber: { contains: identifier, mode: "insensitive" } },
                ],
              },
              include: {
                items: true,
                quotations: {
                  include: {
                    vendor: {
                      select: {
                        id: true,
                        name: true,
                        rating: true,
                        status: true,
                        gstNumber: true,
                      },
                    },
                  },
                },
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            });

            if (!rfq) {
              return { found: false, message: `No RFQ found matching identifier "${identifier}".` };
            }

            return {
              found: true,
              id: rfq.id,
              rfqNumber: rfq.rfqNumber,
              title: rfq.title,
              description: rfq.description,
              status: rfq.status,
              category: rfq.category,
              department: rfq.department,
              budgetAmount: rfq.budgetAmount,
              deadline: rfq.deadline.toISOString(),
              createdAt: rfq.createdAt.toISOString(),
              createdBy: rfq.createdBy?.name || "Unknown",
              items: rfq.items.map((it) => ({
                id: it.id,
                productName: it.productName,
                quantity: it.quantity,
                unit: it.unit,
                gstRate: it.gstRate,
              })),
              quotationsCount: rfq.quotations.length,
              quotations: rfq.quotations.map((q) => ({
                id: q.id,
                vendorName: q.vendor.name,
                vendorStatus: q.vendor.status,
                vendorRating: q.vendor.rating,
                totalAmount: q.totalAmount,
                deliveryDays: q.deliveryDays,
                status: q.status,
              })),
            };
          },
        }),

        diagnose3WayMatch: tool({
          description: "Diagnose and reconcile the 3-Way Match for an invoice against its associated Purchase Order (PO) and Goods Receipt Notes (GRNs). Details exact cause of any MISMATCH.",
          inputSchema: zodSchema(
            z.object({
              invoiceIdentifier: z.string().describe("The Invoice ID (cuid) or Invoice Number (e.g. INV-...)"),
            })
          ),
          execute: async ({ invoiceIdentifier }: { invoiceIdentifier: string }) => {
            if (!sessionUser || isAuthPage) {
              return {
                authorized: false,
                message: "Authentication Required: Access to invoice details and 3-way matching records is restricted to authenticated users. Please sign in to access your documents.",
              };
            }
            const invoice = await prisma.invoice.findFirst({
              where: {
                OR: [
                  { id: invoiceIdentifier },
                  { invoiceNumber: { equals: invoiceIdentifier, mode: "insensitive" } },
                  { invoiceNumber: { contains: invoiceIdentifier, mode: "insensitive" } },
                ],
              },
              include: {
                purchaseOrder: {
                  include: {
                    vendor: true,
                    goodsReceipts: {
                      include: { items: { include: { rfqItem: true } } },
                    },
                    quotation: {
                      include: { items: { include: { rfqItem: true } } },
                    },
                  },
                },
              },
            });

            if (!invoice) {
              return { found: false, message: `Invoice "${invoiceIdentifier}" was not found.` };
            }

            const po = invoice.purchaseOrder;
            if (!po) {
              return { found: true, invoiceNumber: invoice.invoiceNumber, issue: "No Purchase Order linked to this invoice." };
            }

            const cumulativeReceived: Record<string, number> = {};
            for (const grn of po.goodsReceipts || []) {
              for (const item of grn.items) {
                cumulativeReceived[item.rfqItemId] = (cumulativeReceived[item.rfqItemId] || 0) + item.receivedQty;
              }
            }

            let totalOrderedQty = 0;
            let totalReceivedQty = 0;
            let verifiedDeliveredValue = 0;
            const lineComparison: any[] = [];

            const quoteItems = po.quotation?.items || [];
            for (const qItem of quoteItems) {
              totalOrderedQty += qItem.quantity;
              const received = cumulativeReceived[qItem.rfqItemId] || 0;
              totalReceivedQty += received;

              const matchedQty = Math.min(received, qItem.quantity);
              const subtotal = matchedQty * qItem.unitPrice;
              const gstRate = qItem.rfqItem?.gstRate ?? po.taxRate ?? 18;
              const tax = subtotal * (gstRate / 100);
              verifiedDeliveredValue += subtotal + tax;

              lineComparison.push({
                product: qItem.rfqItem?.productName || "Line item",
                orderedQty: qItem.quantity,
                receivedQty: received,
                unitPrice: qItem.unitPrice,
                gstRate,
                isFullyDelivered: received >= qItem.quantity,
                shortfallQty: Math.max(0, qItem.quantity - received),
              });
            }

            const isFullyReceived =
              quoteItems.length > 0 && quoteItems.every((qItem) => (cumulativeReceived[qItem.rfqItemId] || 0) >= qItem.quantity);

            let diagnosticSummary = "";
            let suggestedAction = "";

            if (!po.goodsReceipts || po.goodsReceipts.length === 0 || totalReceivedQty === 0) {
              diagnosticSummary = "No physical goods have been received or logged in the warehouse dock yet. Strict ERP policy blocks invoice payment without verified physical receipt.";
              suggestedAction = "Awaiting warehouse dock to log a Goods Receipt Note (GRN) before 3-way match can proceed.";
            } else if (isFullyReceived) {
              const diff = Math.abs(invoice.totalAmount - po.totalAmount);
              if (diff <= 1.0) {
                diagnosticSummary = "100% of ordered goods are verified received, and invoice total matches PO total within ₹1.00 tolerance.";
                suggestedAction = "Match verified. Safe to proceed with payment release.";
              } else {
                diagnosticSummary = `All items received, but invoice total (₹${invoice.totalAmount.toLocaleString("en-IN")}) differs from PO agreed total (₹${po.totalAmount.toLocaleString("en-IN")}) by ₹${diff.toLocaleString("en-IN")}.`;
                suggestedAction = "Issue a credit note or request a revised invoice from the vendor matching the exact PO contract value.";
              }
            } else {
              if (invoice.totalAmount <= verifiedDeliveredValue + 1.0) {
                diagnosticSummary = `Partial delivery verified. Invoiced amount (₹${invoice.totalAmount.toLocaleString("en-IN")}) does not exceed verified delivered value (₹${verifiedDeliveredValue.toLocaleString("en-IN")}).`;
                suggestedAction = "Partially matched. Payment authorized up to verified delivered value.";
              } else {
                const overbill = invoice.totalAmount - verifiedDeliveredValue;
                diagnosticSummary = `Overbilling detected on partial delivery. Verified delivered goods value is ₹${verifiedDeliveredValue.toLocaleString("en-IN")}, but vendor billed ₹${invoice.totalAmount.toLocaleString("en-IN")} (overbilled by ₹${overbill.toLocaleString("en-IN")}).`;
                suggestedAction = `Hold invoice payment. Vendor must either wait for remaining deliveries or reissue invoice for ₹${verifiedDeliveredValue.toLocaleString("en-IN")}.`;
              }
            }

            return {
              found: true,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              invoiceAmount: invoice.totalAmount,
              poNumber: po.poNumber,
              poAmount: po.totalAmount,
              vendorName: po.vendor?.name,
              currentMatchStatus: invoice.matchStatus,
              totalOrderedQty,
              totalReceivedQty,
              verifiedDeliveredValue: +verifiedDeliveredValue.toFixed(2),
              isFullyReceived,
              grnCount: po.goodsReceipts?.length || 0,
              lines: lineComparison,
              diagnosticSummary,
              suggestedAction,
            };
          },
        }),

        getVendorScorecard: tool({
          description: "Retrieve vendor scorecard including rating, active status, on-time percentage, item accuracy percentage, and grade (A, B, C, D).",
          inputSchema: zodSchema(
            z.object({
              vendorIdentifier: z.string().describe("Vendor ID, exact/partial name, or GST Number"),
            })
          ),
          execute: async ({ vendorIdentifier }: { vendorIdentifier: string }) => {
            if (!sessionUser || isAuthPage) {
              return {
                authorized: false,
                message: "Authentication Required: Access to vendor performance scorecards requires an authorized session. Please sign in first.",
              };
            }
            const vendor = await prisma.vendor.findFirst({
              where: {
                OR: [
                  { id: vendorIdentifier },
                  { name: { contains: vendorIdentifier, mode: "insensitive" } },
                  { gstNumber: { equals: vendorIdentifier, mode: "insensitive" } },
                ],
              },
            });

            if (!vendor) {
              return { found: false, message: `Vendor "${vendorIdentifier}" was not found.` };
            }

            const pos = await prisma.purchaseOrder.findMany({
              where: { vendorId: vendor.id },
              include: {
                goodsReceipts: { include: { items: true } },
                quotation: true,
              },
            });

            let totalOrders = 0;
            let onTimeDeliveries = 0;
            let totalOrderedItems = 0;
            let accurateReceivedItems = 0;
            let totalSpend = 0;

            for (const po of pos) {
              totalSpend += po.totalAmount;
              if (!po.goodsReceipts || po.goodsReceipts.length === 0) continue;
              totalOrders++;

              const promisedDays = po.quotation?.deliveryDays ?? 7;
              const promisedDeliveryDate = new Date(po.createdAt.getTime() + promisedDays * 24 * 60 * 60 * 1000);
              const lastGrnDate = po.goodsReceipts.reduce(
                (latest, g) => (g.createdAt > latest ? g.createdAt : latest),
                po.goodsReceipts[0].createdAt
              );

              if (lastGrnDate <= promisedDeliveryDate) {
                onTimeDeliveries++;
              }

              for (const grn of po.goodsReceipts) {
                for (const it of grn.items) {
                  totalOrderedItems += it.orderedQty;
                  accurateReceivedItems += Math.min(it.receivedQty, it.orderedQty);
                }
              }
            }

            const quotesCount = await prisma.quotation.count({ where: { vendorId: vendor.id } });
            const ordersWon = pos.length;
            const ordersReceived = totalOrders;

            const onTimePercentage = totalOrders > 0 ? +((onTimeDeliveries / totalOrders) * 100).toFixed(1) : 100;
            const accuracyPercentage = totalOrderedItems > 0 ? +((accurateReceivedItems / totalOrderedItems) * 100).toFixed(1) : 100;

            const dynamicRating =
              totalOrders > 0 ? +(((onTimePercentage * 0.6 + accuracyPercentage * 0.4) / 100) * 5.0).toFixed(1) : vendor.rating || 4.0;

            const winRate = quotesCount > 0 ? (ordersWon / quotesCount) * 100 : 0;
            const fulfillmentRate = ordersWon > 0 ? (ordersReceived / ordersWon) * 100 : 0;

            const performance = +(
              (dynamicRating / 5) * 40 +
              (winRate / 100) * 25 +
              (fulfillmentRate / 100) * 25 +
              Math.min(totalSpend / 5000000, 1) * 10
            ).toFixed(1);

            const grade = performance >= 75 ? "A" : performance >= 55 ? "B" : performance >= 35 ? "C" : "D";

            return {
              found: true,
              id: vendor.id,
              name: vendor.name,
              category: vendor.category,
              city: vendor.city,
              status: vendor.status,
              isBlacklisted: vendor.isBlacklisted,
              gstNumber: vendor.gstNumber,
              empiricalRating: dynamicRating,
              grade,
              performanceScore: performance,
              onTimeDeliveryRate: `${onTimePercentage}%`,
              fulfillmentAccuracyRate: `${accuracyPercentage}%`,
              totalOrdersCompleted: totalOrders,
              totalSpend,
              historicalQuotes: quotesCount,
            };
          },
        }),

        getPendingApprovals: tool({
          description: "Retrieve high-value purchase orders and approvals awaiting Buyer or Admin sign-off.",
          inputSchema: zodSchema(
            z.object({
              limit: z.number().optional().describe("Maximum number of records to retrieve (default 10)"),
            })
          ),
          execute: async ({ limit }: { limit?: number }) => {
            if (!sessionUser || isAuthPage) {
              return {
                authorized: false,
                message: "Authentication Required: Access to pending approval queues and spend authorization records is restricted to authenticated users. Please sign in first.",
              };
            }
            const take = limit && limit > 0 ? limit : 10;
            const pendingApprovals = await prisma.approval.findMany({
              where: { status: "PENDING" },
              take,
              orderBy: { createdAt: "desc" },
              include: {
                rfq: { select: { id: true, rfqNumber: true, title: true, budgetAmount: true } },
                quotation: {
                  select: {
                    id: true,
                    totalAmount: true,
                    deliveryDays: true,
                    vendor: { select: { id: true, name: true, rating: true, status: true } },
                  },
                },
                approver: { select: { id: true, name: true, email: true, role: true } },
              },
            });

            return {
              count: pendingApprovals.length,
              approvals: pendingApprovals.map((a) => ({
                id: a.id,
                rfqNumber: a.rfq?.rfqNumber,
                rfqTitle: a.rfq?.title,
                vendorName: a.quotation?.vendor?.name,
                amount: a.quotation?.totalAmount,
                tier: a.tier || (a.quotation?.totalAmount && a.quotation.totalAmount > 1000000 ? "Admin Sign-off" : "Buyer Sign-off"),
                currentStatus: a.status,
                createdAt: a.createdAt.toISOString(),
                assignedApprover: a.approver?.name || "Unassigned / Role Queue",
              })),
            };
          },
        }),

        draftCounterOffer: tool({
          description: "Draft a counter-offer proposal for an active quotation. Validates RFQ status and returns a formatted preview for buyer confirmation.",
          inputSchema: zodSchema(
            z.object({
              quotationId: z.string().describe("The quotation ID to negotiate"),
              proposedAmount: z.number().describe("Proposed counter price in INR"),
              proposedDeliveryDays: z.number().describe("Proposed delivery timeline in days"),
              notes: z.string().describe("Remarks or rationale for the vendor"),
            })
          ),
          execute: async ({
            quotationId,
            proposedAmount,
            proposedDeliveryDays,
            notes,
          }: {
            quotationId: string;
            proposedAmount: number;
            proposedDeliveryDays: number;
            notes: string;
          }) => {
            if (!sessionUser || isAuthPage) {
              return {
                success: false,
                error: "Authentication Required: Drafting negotiation counter-offers requires an active Buyer or Vendor session. Please sign in first.",
              };
            }
            const quotation = await prisma.quotation.findUnique({
              where: { id: quotationId },
              include: {
                rfq: true,
                vendor: true,
              },
            });

            if (!quotation) {
              return { success: false, error: `Quotation "${quotationId}" was not found.` };
            }

            if (quotation.rfq.status === "AWARDED" || quotation.rfq.status === "CANCELLED") {
              return {
                success: false,
                error: `Cannot negotiate on RFQ ${quotation.rfq.rfqNumber} because status is already ${quotation.rfq.status}.`,
              };
            }

            if (quotation.status === "REJECTED") {
              return {
                success: false,
                error: "Cannot submit counter-offer on an already rejected quotation.",
              };
            }

            const priceDelta = quotation.totalAmount - proposedAmount;
            const priceDeltaPct = quotation.totalAmount > 0 ? +((priceDelta / quotation.totalAmount) * 100).toFixed(1) : 0;
            const daysDelta = quotation.deliveryDays - proposedDeliveryDays;

            return {
              success: true,
              status: "DRAFT_PREPARED",
              preview: {
                rfqNumber: quotation.rfq.rfqNumber,
                rfqTitle: quotation.rfq.title,
                vendorName: quotation.vendor.name,
                originalAmount: quotation.totalAmount,
                proposedAmount,
                projectedSavings: priceDelta > 0 ? priceDelta : 0,
                projectedSavingsPercent: `${priceDeltaPct}%`,
                originalDeliveryDays: quotation.deliveryDays,
                proposedDeliveryDays,
                scheduleReductionDays: daysDelta > 0 ? daysDelta : 0,
                notes,
              },
              instructions: "Review the drafted counter-offer. Staged counter-offers remain drafts until finalized and submitted in the quotation negotiation sandbox.",
            };
          },
        }),

        getPlatformNavigation: tool({
          description: "Lookup internal URL routes and instructions for navigating anywhere within VendorBridge ERP.",
          inputSchema: zodSchema(
            z.object({
              destination: z.string().describe("Platform module: rfqs, invoices, vendors, scorecards, approvals, purchase-orders, goods-receipts, admin"),
            })
          ),
          execute: async ({ destination }: { destination: string }) => {
            const clean = destination.toLowerCase().trim();
            const NAV_MAP: Record<string, { route: string; title: string; description: string; actions: string[] }> = {
              rfqs: {
                route: "/rfqs",
                title: "RFQ Management",
                description: "Create, monitor, and award Requests for Quotations.",
                actions: ["View live bids", "Create new RFQ at /rfqs/new", "Open negotiation sandbox"],
              },
              invoices: {
                route: "/invoices",
                title: "Invoices & 3-Way Matching",
                description: "Inspect vendor invoices and run real-time 3-way reconciliation against POs and GRNs.",
                actions: ["Filter by MISMATCH or PENDING status", "Review match breakdown", "Release approved payments"],
              },
              vendors: {
                route: "/vendors",
                title: "Vendor Directory",
                description: "Browse verified vendor list, statuses, categories, and GSTINs.",
                actions: ["Onboard vendors", "Verify GST registration", "Review active/blacklisted statuses"],
              },
              scorecards: {
                route: "/scorecards",
                title: "Vendor Performance Scorecards",
                description: "Empirical fulfillment analytics with on-time delivery rates, item accuracy, and Grades A–D.",
                actions: ["View dynamic ratings", "Compare supplier reliability", "Analyze fulfillment defects"],
              },
              approvals: {
                route: "/approvals",
                title: "Approvals & Delegation of Authority",
                description: "Sign-off dashboard for Buyer and Admin spend tier authorization.",
                actions: ["Review pending high-value POs", "Approve or reject with remarks", "Track audit trails"],
              },
              "purchase-orders": {
                route: "/purchase-orders",
                title: "Purchase Orders",
                description: "Formal procurement contracts issued upon quotation award.",
                actions: ["Download PO PDF", "Track fulfillment status", "View linked invoices and receipts"],
              },
              "goods-receipts": {
                route: "/goods-receipts",
                title: "Goods Receipts (GRN)",
                description: "Warehouse inventory logging of physical dock shipments.",
                actions: ["Log new delivery at /goods-receipts/new", "Verify received vs ordered quantities"],
              },
              admin: {
                route: "/admin/users",
                title: "Admin User Management & Governance",
                description: "System administration, user roles (Admin, Buyer, Seller), and approval thresholds.",
                actions: ["Assign roles", "Manage user activations", "Review system configuration"],
              },
            };

            const match =
              NAV_MAP[clean] ||
              Object.entries(NAV_MAP).find(([k]) => clean.includes(k))?.[1] || {
                route: "/rfqs",
                title: "Procurement Portal",
                description: "Central portal dashboard for managing enterprise procurement workflows.",
                actions: ["Navigate via sidebar links"],
              };

            return match;
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Copilot chat route error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to process chat message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
