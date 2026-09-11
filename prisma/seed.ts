import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);
const monthAnchor = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, 14);

async function main() {
  console.log("Seeding VendorBridge with full demo dataset…");

  for (const m of ["goodsReceiptItem", "goodsReceipt", "notification", "activityLog", "invoice", "purchaseOrder", "approval", "quotationItem", "quotation", "rFQVendor", "rFQItem", "rFQ", "user", "vendor"]) {
    // @ts-ignore
    await prisma[m].deleteMany();
  }
  const pw = await bcrypt.hash("password123", 10);

  // ---------- Vendors (10) ----------
  const acme = await prisma.vendor.create({ data: { name: "Acme Supplies Pvt Ltd", category: "Office Supplies", subcategory: "Paper & Stationery", gstNumber: "27AABCA1234L1Z5", contactName: "Ravi Kumar", email: "vendor@acme.com", phone: "+91 98200 11111", address: "Plot 12, MIDC, Pune, MH", city: "Pune", status: "ACTIVE", rating: 4.5 } });
  const techno = await prisma.vendor.create({ data: { name: "Techno Hardware Co", category: "IT Hardware & Electronics", subcategory: "Laptops & PCs", gstNumber: "29AAGCT5678P1Z2", contactName: "Sneha Rao", email: "vendor@techno.com", phone: "+91 99000 22222", address: "Koramangala, Bengaluru, KA", city: "Bengaluru", status: "ACTIVE", rating: 4.2 } });
  const global = await prisma.vendor.create({ data: { name: "Global Traders LLP", category: "IT Hardware & Electronics", subcategory: "Laptops & PCs", gstNumber: "07AAFFG9012Q1Z8", contactName: "Amit Sethi", email: "vendor@global.com", phone: "+91 98110 33333", address: "Connaught Place, New Delhi, DL", city: "New Delhi", status: "ACTIVE", rating: 3.9 } });
  const prime = await prisma.vendor.create({ data: { name: "Prime Furnishings", category: "Furniture", subcategory: "Office Desks", gstNumber: "24AACFP3344R1Z9", contactName: "Neha Shah", email: "vendor@prime.com", phone: "+91 99888 44444", address: "Ashram Road, Ahmedabad, GJ", city: "Ahmedabad", status: "ACTIVE", rating: 4.0 } });
  const swift = await prisma.vendor.create({ data: { name: "Swift Logistics", category: "Services", subcategory: "Logistics & Shipping", gstNumber: "33AAECS7788T1Z4", contactName: "Karthik Iyer", email: "vendor@swift.com", phone: "+91 90000 55555", address: "Anna Salai, Chennai, TN", city: "Chennai", status: "PENDING", rating: 3.6 } });
  const green = await prisma.vendor.create({ data: { name: "GreenPack Solutions", category: "Manufacturing & Raw Materials", subcategory: "Packaging Materials", gstNumber: "19AAGCG1122H1Z3", contactName: "Divya Menon", email: "vendor@greenpack.com", phone: "+91 98765 66666", address: "Salt Lake, Kolkata, WB", city: "Kolkata", status: "ACTIVE", rating: 4.3 } });
  const steel = await prisma.vendor.create({ data: { name: "SteelWorks Industries", category: "Construction", subcategory: "Steel & Rebar", gstNumber: "22AAECS4455K1Z1", contactName: "Rajesh Patil", email: "vendor@steelworks.com", phone: "+91 97654 77777", address: "Hinjewadi, Pune, MH", city: "Pune", status: "ACTIVE", rating: 3.8 } });
  const cloud = await prisma.vendor.create({ data: { name: "CloudServe IT Services", category: "Services", subcategory: "IT Services & Consulting", gstNumber: "36AABCC8899M1Z6", contactName: "Ananya Reddy", email: "vendor@cloudserve.com", phone: "+91 96543 88888", address: "HITEC City, Hyderabad, TS", city: "Hyderabad", status: "ACTIVE", rating: 4.6 } });
  const legacy = await prisma.vendor.create({ data: { name: "Legacy Office Mart", category: "Office Supplies", subcategory: "Paper & Stationery", gstNumber: "09AAACL2233P1Z7", contactName: "Vikram Singh", email: "vendor@legacy.com", phone: "+91 95432 99999", address: "Sector 62, Noida, UP", city: "Noida", status: "INACTIVE", rating: 2.9 } });
  const blocked = await prisma.vendor.create({ data: { name: "QuickDeal Traders", category: "Office Supplies", subcategory: "Paper & Stationery", gstNumber: "06AABCD5566R1Z0", contactName: "Mohit Agarwal", email: "vendor@quickdeal.com", phone: "+91 94321 00000", address: "MG Road, Gurugram, HR", city: "Gurugram", status: "BLACKLISTED", isBlacklisted: true, rating: 2.1 } });

  // ---------- Users ----------
  const admin = await prisma.user.create({ data: { name: "Main Admin", email: "admin@vendorbridge.com", passwordHash: pw, role: "ADMIN", status: "APPROVED", city: "Bengaluru" } });
  const officer = await prisma.user.create({ data: { name: "Priya Buyer", email: "buyer@vendorbridge.com", passwordHash: pw, role: "BUYER", status: "APPROVED", city: "Bengaluru" } });
  await prisma.user.create({ data: { name: "Acme Seller", email: "vendor@acme.com", passwordHash: pw, role: "SELLER", status: "APPROVED", city: "Pune", vendorId: acme.id } });
  await prisma.user.create({ data: { name: "Techno Seller", email: "vendor@techno.com", passwordHash: pw, role: "SELLER", status: "APPROVED", city: "Bengaluru", vendorId: techno.id } });
  await prisma.user.create({ data: { name: "Global Seller", email: "vendor@global.com", passwordHash: pw, role: "SELLER", status: "APPROVED", city: "New Delhi", vendorId: global.id } });
  await prisma.user.create({ data: { name: "Prime Seller", email: "vendor@prime.com", passwordHash: pw, role: "SELLER", status: "APPROVED", city: "Ahmedabad", vendorId: prime.id } });
  await prisma.user.create({ data: { name: "GreenPack Seller", email: "vendor@greenpack.com", passwordHash: pw, role: "SELLER", status: "APPROVED", city: "Kolkata", vendorId: green.id } });

  const _logs: any[] = [];
  const _notifs: any[] = [];
  const log = (action: string, entityType: string, message: string, when: Date, userId = officer.id) => {
    _logs.push({ userId, action, entityType, message, createdAt: when });
  };
  const notify = (userId: string, type: string, message: string, when: Date, link?: string, read = false) => {
    _notifs.push({ userId, type, message, link, createdAt: when, read });
  };

  let rfqN = 0, poN = 0, invN = 0, grnN = 0;
  const num = (p: string, n: number) => `${p}-2026-${String(n).padStart(4, "0")}`;

  async function makeRFQ(opts: {
    title: string; category: string; department: string; budget: number; createdAt: Date;
    status?: "DRAFT" | "OPEN" | "CLOSED" | "AWARDED" | "CANCELLED";
    items: { productName: string; quantity: number; unit?: string }[];
    invited: string[];
    quotes?: { vendorId: string; prices: number[]; deliveryDays: number; notes?: string }[];
  }) {
    rfqN++;
    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber: num("RFQ", rfqN), title: opts.title, description: `${opts.title} for the ${opts.department} department.`,
        department: opts.department, category: opts.category, budgetAmount: opts.budget,
        deadline: new Date(opts.createdAt.getTime() + 7 * 24 * 3600 * 1000), status: opts.status || "OPEN",
        createdById: officer.id, createdAt: opts.createdAt,
        items: { create: opts.items.map((i) => ({ productName: i.productName, quantity: i.quantity, unit: i.unit || "pcs" })) },
        invitedVendors: { create: opts.invited.map((v) => ({ vendorId: v })) },
      },
      include: { items: true },
    });
    log("CREATE", "RFQ", `RFQ ${rfq.rfqNumber} "${rfq.title}" created`, opts.createdAt);

    const quotations = [];
    for (const q of opts.quotes || []) {
      const lineData = rfq.items.map((it, idx) => ({ rfqItemId: it.id, unitPrice: q.prices[idx], quantity: it.quantity, amount: q.prices[idx] * it.quantity }));
      const total = lineData.reduce((s, l) => s + l.amount, 0);
      const quote = await prisma.quotation.create({
        data: { rfqId: rfq.id, vendorId: q.vendorId, deliveryDays: q.deliveryDays, notes: q.notes || null, status: "SUBMITTED", totalAmount: total, createdAt: new Date(opts.createdAt.getTime() + 24 * 3600 * 1000), items: { create: lineData } },
        include: { vendor: true },
      });
      quotations.push(quote);
      await notify(officer.id, "QUOTATION", `${quote.vendor.name} submitted a quotation for ${rfq.rfqNumber}`, new Date(opts.createdAt.getTime() + 25 * 3600 * 1000), `/rfqs/${rfq.id}`);
    }
    return { rfq, quotations };
  }

  async function award(rfq: any, quote: any, opts: {
    auto: boolean; tier: string; goods: "complete" | "partial" | "none";
    invoice: boolean; invoiceStatus?: "DRAFT" | "SENT" | "PAID"; poStatus?: "ISSUED" | "ACKNOWLEDGED" | "RECEIVED" | "FULFILLED";
    sent?: boolean; awardedAt: Date;
  }) {
    const others = await prisma.quotation.findMany({ where: { rfqId: rfq.id } });
    const highest = Math.max(...others.map((q) => q.totalAmount));
    await prisma.quotation.update({ where: { id: quote.id }, data: { status: "SELECTED" } });
    await prisma.approval.create({
      data: { rfqId: rfq.id, quotationId: quote.id, status: "APPROVED", autoApproved: opts.auto, tier: opts.tier, approverId: opts.auto ? null : admin.id, decidedAt: opts.awardedAt, remarks: opts.auto ? "Auto-approved: within delegated spend limit" : "Approved — best overall value.", createdAt: new Date(opts.awardedAt.getTime() - 3600 * 1000) },
    });
    await prisma.rFQ.update({ where: { id: rfq.id }, data: { status: "AWARDED" } });
    log(opts.auto ? "AUTO_APPROVE" : "APPROVED", "Approval", `${quote.vendor.name}'s quote on ${rfq.rfqNumber} ${opts.auto ? "auto-approved" : "approved"} (${opts.tier})`, opts.awardedAt, opts.auto ? officer.id : admin.id);

    const subtotal = quote.totalAmount;
    const taxAmount = +(subtotal * 0.18).toFixed(2);
    const savings = +Math.max(0, highest - subtotal).toFixed(2);
    const budgetSaving = +Math.max(0, rfq.budgetAmount - subtotal).toFixed(2);
    poN++;
    let poStatus = opts.poStatus || "ISSUED";
    const po = await prisma.purchaseOrder.create({
      data: { poNumber: num("PO", poN), quotationId: quote.id, vendorId: quote.vendorId, subtotal, taxRate: 18, taxAmount, totalAmount: +(subtotal + taxAmount).toFixed(2), savings, budgetSaving, status: poStatus, createdAt: opts.awardedAt },
      include: { quotation: { include: { items: true } } },
    });
    await log("CREATE", "PurchaseOrder", `PO ${po.poNumber} issued to ${quote.vendor.name} (saved Rs.${savings.toLocaleString("en-IN")})`, opts.awardedAt);

    let grn = null;
    if (opts.goods !== "none") {
      grnN++;
      const items = po.quotation.items.map((it) => ({ rfqItemId: it.rfqItemId, orderedQty: it.quantity, receivedQty: opts.goods === "complete" ? it.quantity : Math.max(1, Math.floor(it.quantity * 0.8)) }));
      const complete = opts.goods === "complete";
      grn = await prisma.goodsReceipt.create({ data: { grnNumber: num("GRN", grnN), purchaseOrderId: po.id, receivedById: officer.id, status: complete ? "COMPLETE" : "PARTIAL", notes: complete ? "All items received in good condition." : "Partial delivery; balance pending.", createdAt: new Date(opts.awardedAt.getTime() + 3 * 24 * 3600 * 1000), items: { create: items } } });
      poStatus = complete ? (opts.poStatus === "FULFILLED" ? "FULFILLED" : "RECEIVED") : "ACKNOWLEDGED";
      await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: poStatus } });
      await log("RECEIVE", "GoodsReceipt", `Goods received (${grn.grnNumber}) for ${po.poNumber} — ${complete ? "complete" : "partial"}`, grn.createdAt);
    }

    if (opts.invoice) {
      invN++;
      const fullyReceived = grn ? opts.goods === "complete" : false;
      const matchStatus = !grn ? "PENDING" : fullyReceived ? "MATCHED" : "PARTIALLY_MATCHED";
      const invStatus = opts.invoiceStatus || (opts.sent ? "SENT" : "DRAFT");
      const invDate = new Date(opts.awardedAt.getTime() + 4 * 24 * 3600 * 1000);
      const inv = await prisma.invoice.create({
        data: { invoiceNumber: num("INV", invN), purchaseOrderId: po.id, subtotal: po.subtotal, taxRate: 18, taxAmount: po.taxAmount, totalAmount: po.totalAmount, status: invStatus, matchStatus: matchStatus as any, sentAt: invStatus === "SENT" || invStatus === "PAID" ? invDate : null, createdAt: invDate },
      });
      await log("CREATE", "Invoice", `Invoice ${inv.invoiceNumber} generated for ${po.poNumber} (match: ${matchStatus})`, inv.createdAt);
      if (invStatus === "SENT" || invStatus === "PAID") {
        await log("EMAIL", "Invoice", `Invoice ${inv.invoiceNumber} emailed to ${quote.vendor.email}`, invDate);
      }
      if (invStatus === "PAID") {
        await log("PAYMENT", "Invoice", `Invoice ${inv.invoiceNumber} marked as paid — Rs.${po.totalAmount.toLocaleString("en-IN")}`, new Date(invDate.getTime() + 2 * 24 * 3600 * 1000));
      }
    }
    return po;
  }

  // ── Historical POs (spread across 6 months for charts) ──

  // RFQ 1: Laptops — fully completed, PAID invoice (5 months ago)
  const r1 = await makeRFQ({ title: "Procurement of 50 Office Laptops", category: "IT Hardware", department: "Operations", budget: 3200000, createdAt: monthAnchor(5),
    items: [{ productName: "Business Laptop (16GB/512GB)", quantity: 50 }, { productName: "Laptop Carry Bag", quantity: 50 }],
    invited: [techno.id, global.id, acme.id],
    quotes: [
      { vendorId: techno.id, prices: [58000, 900], deliveryDays: 10, notes: "3-year onsite warranty included." },
      { vendorId: global.id, prices: [55500, 750], deliveryDays: 7, notes: "Bulk discount applied." },
      { vendorId: acme.id, prices: [60000, 1000], deliveryDays: 14, notes: "Premium models." },
    ] });
  await award(r1.rfq, r1.quotations[1], { auto: false, tier: "Admin sign-off", goods: "complete", invoice: true, invoiceStatus: "PAID", poStatus: "FULFILLED", awardedAt: monthAnchor(5) });

  // RFQ 2: Server rack — PAID (4 months ago)
  const r2 = await makeRFQ({ title: "Data Centre Server Rack Upgrade", category: "IT Hardware", department: "IT", budget: 1500000, createdAt: monthAnchor(4),
    items: [{ productName: "42U Server Rack", quantity: 4 }, { productName: "PDU Power Strip", quantity: 8 }],
    invited: [techno.id, cloud.id],
    quotes: [
      { vendorId: techno.id, prices: [85000, 4500], deliveryDays: 12, notes: "Includes cable management." },
      { vendorId: cloud.id, prices: [92000, 3800], deliveryDays: 8, notes: "Hot-swap PDU included." },
    ] });
  await award(r2.rfq, r2.quotations[0], { auto: false, tier: "Manager approval", goods: "complete", invoice: true, invoiceStatus: "PAID", poStatus: "FULFILLED", awardedAt: monthAnchor(4) });

  // RFQ 3: Office Chairs — partial goods, MISMATCH invoice (3 months ago)
  const r3 = await makeRFQ({ title: "100 Ergonomic Office Chairs", category: "Furniture", department: "Admin", budget: 600000, createdAt: monthAnchor(3),
    items: [{ productName: "Ergonomic Mesh Chair", quantity: 100 }],
    invited: [prime.id, acme.id],
    quotes: [
      { vendorId: prime.id, prices: [4500], deliveryDays: 12, notes: "Adjustable lumbar support." },
      { vendorId: acme.id, prices: [5200], deliveryDays: 9, notes: "Includes assembly." },
    ] });
  await award(r3.rfq, r3.quotations[0], { auto: false, tier: "Manager approval", goods: "partial", invoice: true, invoiceStatus: "SENT", awardedAt: monthAnchor(3) });

  // RFQ 4: Packaging materials — complete, SENT (2 months ago)
  const r4 = await makeRFQ({ title: "Q1 Packaging Material Supply", category: "Packaging", department: "Warehouse", budget: 350000, createdAt: monthAnchor(2),
    items: [{ productName: "Corrugated Box (Large)", quantity: 2000 }, { productName: "Bubble Wrap Roll", quantity: 500 }],
    invited: [green.id, acme.id],
    quotes: [
      { vendorId: green.id, prices: [85, 120], deliveryDays: 6, notes: "Recycled material, eco-certified." },
      { vendorId: acme.id, prices: [95, 140], deliveryDays: 4, notes: "Standard packaging." },
    ] });
  await award(r4.rfq, r4.quotations[0], { auto: true, tier: "Auto-approved", goods: "complete", invoice: true, invoiceStatus: "SENT", poStatus: "RECEIVED", awardedAt: monthAnchor(2) });

  // RFQ 5: Steel sheets — complete, MATCHED (1 month ago)
  const r5 = await makeRFQ({ title: "Industrial Steel Sheet Procurement", category: "Raw Materials", department: "Manufacturing", budget: 900000, createdAt: monthAnchor(1),
    items: [{ productName: "MS Steel Sheet (4mm)", quantity: 200, unit: "sheets" }],
    invited: [steel.id, global.id],
    quotes: [
      { vendorId: steel.id, prices: [3800], deliveryDays: 10, notes: "IS 2062 grade certified." },
      { vendorId: global.id, prices: [4200], deliveryDays: 7, notes: "Includes transport." },
    ] });
  await award(r5.rfq, r5.quotations[0], { auto: false, tier: "Manager approval", goods: "complete", invoice: true, invoiceStatus: "SENT", poStatus: "RECEIVED", awardedAt: monthAnchor(1) });

  // RFQ 6: Printer Cartridges — AUTO-APPROVED, invoice PENDING (no goods yet)
  const r6 = await makeRFQ({ title: "Printer Cartridge Restock", category: "Office Supplies", department: "IT", budget: 80000, createdAt: daysAgo(18),
    items: [{ productName: "Toner Cartridge (Black)", quantity: 100 }],
    invited: [acme.id],
    quotes: [{ vendorId: acme.id, prices: [700], deliveryDays: 4, notes: "Genuine OEM cartridges." }] });
  await award(r6.rfq, r6.quotations[0], { auto: true, tier: "Auto-approved", goods: "none", invoice: true, invoiceStatus: "DRAFT", awardedAt: daysAgo(17) });

  // RFQ 7: Cloud migration — large PO, goods received
  const r7 = await makeRFQ({ title: "Cloud Infrastructure Migration", category: "IT Services", department: "IT", budget: 2500000, createdAt: daysAgo(14),
    items: [{ productName: "Cloud Migration (per server)", quantity: 20 }, { productName: "Data Backup Setup", quantity: 1 }],
    invited: [cloud.id, techno.id],
    quotes: [
      { vendorId: cloud.id, prices: [95000, 250000], deliveryDays: 30, notes: "Includes 6-month support." },
      { vendorId: techno.id, prices: [110000, 280000], deliveryDays: 25, notes: "On-prem hybrid option." },
    ] });
  await award(r7.rfq, r7.quotations[0], { auto: false, tier: "Admin sign-off", goods: "complete", invoice: true, invoiceStatus: "SENT", poStatus: "RECEIVED", awardedAt: daysAgo(12) });

  // RFQ 8: Stationery — OPEN with quotes (Smart Award demo)
  await makeRFQ({ title: "Annual Stationery Supply", category: "Office Supplies", department: "Admin", budget: 200000, createdAt: daysAgo(5),
    items: [{ productName: "A4 Paper (ream)", quantity: 500 }, { productName: "Assorted Pens (box)", quantity: 200 }],
    invited: [acme.id, prime.id, legacy.id],
    quotes: [
      { vendorId: acme.id, prices: [240, 180], deliveryDays: 5, notes: "Eco-friendly paper." },
      { vendorId: prime.id, prices: [255, 165], deliveryDays: 8, notes: "Premium stationery." },
      { vendorId: legacy.id, prices: [220, 200], deliveryDays: 3, notes: "Lowest price, standard quality." },
    ] });

  // RFQ 9: AV Setup — OPEN, selected, PENDING approval
  const r9 = await makeRFQ({ title: "Conference Room AV Setup", category: "IT Hardware", department: "Facilities", budget: 400000, createdAt: daysAgo(4),
    items: [{ productName: "4K Projector", quantity: 2 }, { productName: "Conference Speakerphone", quantity: 4 }],
    invited: [techno.id, swift.id],
    quotes: [
      { vendorId: techno.id, prices: [95000, 12000], deliveryDays: 15, notes: "Installation included." },
      { vendorId: swift.id, prices: [88000, 15000], deliveryDays: 20, notes: "Logistics + setup bundled." },
    ] });
  await prisma.quotation.update({ where: { id: r9.quotations[0].id }, data: { status: "SELECTED" } });
  await prisma.approval.create({ data: { rfqId: r9.rfq.id, quotationId: r9.quotations[0].id, status: "PENDING", tier: "Buyer sign-off", createdAt: daysAgo(2) } });
  log("REQUEST_APPROVAL", "Approval", `Approval requested (Buyer sign-off) for Techno Hardware Co's quote on ${r9.rfq.rfqNumber}`, daysAgo(2));
  notify(admin.id, "APPROVAL", `Approval needed: ${r9.rfq.rfqNumber} — Techno Hardware Co (Rs.2,38,000)`, daysAgo(2), "/approvals");

  // RFQ 10: Security cameras — PENDING Admin approval (large spend)
  const r10 = await makeRFQ({ title: "Office Security Camera System", category: "IT Hardware", department: "Facilities", budget: 1800000, createdAt: daysAgo(3),
    items: [{ productName: "4K IP Camera", quantity: 24 }, { productName: "NVR Recorder (32ch)", quantity: 2 }],
    invited: [techno.id, global.id],
    quotes: [
      { vendorId: techno.id, prices: [18500, 95000], deliveryDays: 14, notes: "Night vision + analytics." },
      { vendorId: global.id, prices: [17200, 88000], deliveryDays: 10, notes: "Bulk install discount." },
    ] });
  await prisma.quotation.update({ where: { id: r10.quotations[1].id }, data: { status: "SELECTED" } });
  await prisma.approval.create({ data: { rfqId: r10.rfq.id, quotationId: r10.quotations[1].id, status: "PENDING", tier: "Admin sign-off", createdAt: daysAgo(1) } });
  log("REQUEST_APPROVAL", "Approval", `Approval requested (Admin sign-off) for Global Traders LLP's quote on ${r10.rfq.rfqNumber}`, daysAgo(1));
  notify(admin.id, "APPROVAL", `Admin sign-off needed: ${r10.rfq.rfqNumber} — Global Traders LLP (Rs.5,88,800)`, daysAgo(1), "/approvals");
  notify(officer.id, "APPROVAL", `Large spend escalated: ${r10.rfq.rfqNumber} awaiting Admin sign-off`, daysAgo(1), "/approvals");

  // RFQ 11: REJECTED approval example
  const r11 = await makeRFQ({ title: "Premium Executive Desks", category: "Furniture", department: "Admin", budget: 450000, createdAt: daysAgo(8),
    items: [{ productName: "Executive Desk (Solid Wood)", quantity: 15 }],
    invited: [prime.id, acme.id],
    quotes: [
      { vendorId: prime.id, prices: [32000], deliveryDays: 18, notes: "Teak finish, 5-year warranty." },
      { vendorId: acme.id, prices: [28000], deliveryDays: 12, notes: "Engineered wood alternative." },
    ] });
  await prisma.quotation.update({ where: { id: r11.quotations[0].id }, data: { status: "SELECTED" } });
  await prisma.approval.create({ data: { rfqId: r11.rfq.id, quotationId: r11.quotations[0].id, status: "REJECTED", tier: "Admin sign-off", approverId: admin.id, decidedAt: daysAgo(6), remarks: "Budget exceeded for Q1 — defer to Q2.", createdAt: daysAgo(7) } });
  await prisma.rFQ.update({ where: { id: r11.rfq.id }, data: { status: "OPEN" } });
  await prisma.quotation.update({ where: { id: r11.quotations[0].id }, data: { status: "SUBMITTED" } });
  log("REJECTED", "Approval", `Prime Furnishings' quote on ${r11.rfq.rfqNumber} rejected — budget exceeded`, daysAgo(6), admin.id);
  notify(officer.id, "APPROVAL", `Quote rejected on ${r11.rfq.rfqNumber}: Budget exceeded for Q1`, daysAgo(6), `/rfqs/${r11.rfq.id}`);

  // RFQ 12: OPEN, awaiting vendor quotes
  await makeRFQ({ title: "Annual AMC for HVAC Systems", category: "Services", department: "Facilities", budget: 500000, createdAt: daysAgo(2),
    items: [{ productName: "HVAC AMC (per unit)", quantity: 12 }],
    invited: [swift.id, cloud.id] });

  // RFQ 13: DRAFT (not yet published)
  await makeRFQ({ title: "Employee Wellness Program Supplies", category: "Office Supplies", department: "HR", budget: 120000, createdAt: daysAgo(1),
    status: "DRAFT", items: [{ productName: "Standing Desk Converter", quantity: 30 }], invited: [prime.id] });

  // RFQ 14: CANCELLED
  const r14 = await makeRFQ({ title: "Legacy Printer Replacement", category: "IT Hardware", department: "IT", budget: 250000, createdAt: daysAgo(20),
    items: [{ productName: "Multifunction Printer", quantity: 5 }],
    invited: [legacy.id, acme.id],
    quotes: [{ vendorId: legacy.id, prices: [48000], deliveryDays: 10, notes: "Refurbished units." }] });
  await prisma.rFQ.update({ where: { id: r14.rfq.id }, data: { status: "CANCELLED" } });
  log("CANCEL", "RFQ", `RFQ ${r14.rfq.rfqNumber} cancelled — requirements changed`, daysAgo(15));

  // ── Extra notifications for the bell icon ──
  notify(officer.id, "PO", "Purchase order PO-2026-0001 fulfilled by Global Traders LLP", daysAgo(10), "/purchase-orders", true);
  notify(officer.id, "PO", "PO-2026-0004 goods received — 3-way match ready", daysAgo(5), "/goods-receipts", false);
  notify(officer.id, "QUOTATION", "GreenPack Solutions submitted quote for RFQ-2026-0004", daysAgo(14), "/rfqs", true);
  notify(officer.id, "APPROVAL", "Auto-approved: Printer Cartridge Restock (RFQ-2026-0006)", daysAgo(17), "/rfqs", true);
  notify(admin.id, "APPROVAL", "Approved PO for Steel Sheet Procurement — Rs.8,96,800", daysAgo(8), "/approvals", true);
  notify(admin.id, "SYSTEM", "Monthly procurement report ready for review", daysAgo(3), "/reports", false);
  notify(officer.id, "INVOICE", "Invoice INV-2026-0001 payment confirmed", daysAgo(9), "/invoices", true);
  notify(officer.id, "INVOICE", "Invoice INV-2026-0003 has a quantity mismatch — review required", daysAgo(4), "/invoices", false);
  notify(admin.id, "RFQ", "New RFQ created: Office Security Camera System", daysAgo(3), "/rfqs", true);

  await prisma.activityLog.createMany({ data: _logs });
  await prisma.notification.createMany({ data: _notifs });

  const counts = {
    vendors: await prisma.vendor.count(), users: await prisma.user.count(), rfqs: await prisma.rFQ.count(),
    quotations: await prisma.quotation.count(), approvals: await prisma.approval.count(),
    purchaseOrders: await prisma.purchaseOrder.count(), goodsReceipts: await prisma.goodsReceipt.count(),
    invoices: await prisma.invoice.count(), activity: await prisma.activityLog.count(), notifications: await prisma.notification.count(),
  };
  console.log("Seed complete:", counts);
  console.log("\nLogins (password: password123):");
  console.log("  Staff:   admin@ / officer@ / manager@  (@vendorbridge.com)");
  console.log("  Vendors: vendor@techno.com / vendor@global.com / vendor@acme.com / vendor@prime.com / vendor@greenpack.com");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
