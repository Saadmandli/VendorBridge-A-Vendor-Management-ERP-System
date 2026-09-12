import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking and upserting 3 Demo Buyers and 3 Demo Sellers...");
  const pw = await bcrypt.hash("password123", 10);

  // 1. Vendors for 3 Demo Sellers
  const techno = await prisma.vendor.upsert({
    where: { email: "vendor@techno.com" },
    update: {
      name: "Techno Hardware Co",
      category: "IT Hardware & Electronics",
      subcategory: "Laptops & PCs",
      city: "Bengaluru",
      status: "ACTIVE",
      rating: 4.8,
    },
    create: {
      name: "Techno Hardware Co",
      category: "IT Hardware & Electronics",
      subcategory: "Laptops & PCs",
      gstNumber: "29AAGCT5678P1Z2",
      contactName: "Sneha Rao",
      email: "vendor@techno.com",
      phone: "+91 99000 22222",
      address: "Koramangala, Bengaluru, KA",
      city: "Bengaluru",
      status: "ACTIVE",
      rating: 4.8,
    },
  });

  const prime = await prisma.vendor.upsert({
    where: { email: "vendor@prime.com" },
    update: {
      name: "Prime Furnishings & Ergonomics",
      category: "Furniture",
      subcategory: "Office Desks",
      city: "Ahmedabad",
      status: "ACTIVE",
      rating: 4.6,
    },
    create: {
      name: "Prime Furnishings & Ergonomics",
      category: "Furniture",
      subcategory: "Office Desks",
      gstNumber: "24AACFP3344R1Z9",
      contactName: "Neha Shah",
      email: "vendor@prime.com",
      phone: "+91 99888 44444",
      address: "Ashram Road, Ahmedabad, GJ",
      city: "Ahmedabad",
      status: "ACTIVE",
      rating: 4.6,
    },
  });

  const acme = await prisma.vendor.upsert({
    where: { email: "vendor@acme.com" },
    update: {
      name: "Acme Supplies Pvt Ltd",
      category: "Office Supplies",
      subcategory: "Paper & Stationery",
      city: "Pune",
      status: "ACTIVE",
      rating: 4.7,
    },
    create: {
      name: "Acme Supplies Pvt Ltd",
      category: "Office Supplies",
      subcategory: "Paper & Stationery",
      gstNumber: "27AABCA1234L1Z5",
      contactName: "Ravi Kumar",
      email: "vendor@acme.com",
      phone: "+91 98200 11111",
      address: "Plot 12, MIDC, Pune, MH",
      city: "Pune",
      status: "ACTIVE",
      rating: 4.7,
    },
  });

  // 2. Upsert 3 Demo Buyers
  const buyers = [
    {
      name: "Priya Sharma (IT Lead)",
      email: "buyer@vendorbridge.com",
      city: "Bengaluru",
    },
    {
      name: "Rajesh Patel (Ops Manager)",
      email: "buyer2@vendorbridge.com",
      city: "Mumbai",
    },
    {
      name: "Ananya Sen (Procurement Specialist)",
      email: "buyer3@vendorbridge.com",
      city: "New Delhi",
    },
  ];

  for (const b of buyers) {
    await prisma.user.upsert({
      where: { email: b.email },
      update: {
        name: b.name,
        role: "BUYER",
        status: "APPROVED",
        city: b.city,
      },
      create: {
        name: b.name,
        email: b.email,
        passwordHash: pw,
        role: "BUYER",
        status: "APPROVED",
        city: b.city,
      },
    });
    console.log(`✓ Buyer ready: ${b.name} (${b.email})`);
  }

  // 3. Upsert 3 Demo Sellers
  const sellers = [
    {
      name: "Sneha Rao (Techno Hardware)",
      email: "vendor@techno.com",
      city: "Bengaluru",
      vendorId: techno.id,
    },
    {
      name: "Neha Shah (Prime Furnishings)",
      email: "vendor@prime.com",
      city: "Ahmedabad",
      vendorId: prime.id,
    },
    {
      name: "Ravi Kumar (Acme Supplies)",
      email: "vendor@acme.com",
      city: "Pune",
      vendorId: acme.id,
    },
  ];

  for (const s of sellers) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        role: "SELLER",
        status: "APPROVED",
        city: s.city,
        vendorId: s.vendorId,
      },
      create: {
        name: s.name,
        email: s.email,
        passwordHash: pw,
        role: "SELLER",
        status: "APPROVED",
        city: s.city,
        vendorId: s.vendorId,
      },
    });
    console.log(`✓ Seller ready: ${s.name} (${s.email})`);
  }

  console.log("\nAll 3 Demo Buyers and 3 Demo Sellers successfully synced!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
