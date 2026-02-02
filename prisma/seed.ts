import prisma from "../src/lib/db";
import { hash } from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create Users
  console.log("Creating users...");
  const ownerPasswordHash = await hash("owner123", 12);
  const kitchenPasswordHash = await hash("kitchen123", 12);

  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      username: "owner",
      passwordHash: ownerPasswordHash,
      role: "OWNER",
    },
  });

  const kitchen = await prisma.user.upsert({
    where: { username: "dapur" },
    update: {},
    create: {
      username: "dapur",
      passwordHash: kitchenPasswordHash,
      role: "KITCHEN",
    },
  });

  console.log(`  ✓ Created user: ${owner.username} (OWNER)`);
  console.log(`  ✓ Created user: ${kitchen.username} (KITCHEN)`);

  // Create Criteria
  console.log("\nCreating criteria...");
  const criteriaData = [
    { code: "C1", name: "Margin Keuntungan", weight: 0.3, type: "BENEFIT" as const },
    { code: "C2", name: "Volume Penjualan", weight: 0.3, type: "BENEFIT" as const },
    { code: "C3", name: "Daya Tahan", weight: 0.2, type: "BENEFIT" as const },
    { code: "C4", name: "Tingkat Kesulitan", weight: 0.2, type: "COST" as const },
  ];

  for (const c of criteriaData) {
    await prisma.criteria.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    console.log(`  ✓ Created criteria: ${c.code} - ${c.name}`);
  }

  // Create Products
  console.log("\nCreating products...");
  const productsData = [
    { name: "Kue Lapis", sellingPrice: 25000, costPrice: 12000, shelfLifeHours: 48, difficulty: 3 },
    { name: "Brownies Kukus", sellingPrice: 30000, costPrice: 15000, shelfLifeHours: 72, difficulty: 2 },
    { name: "Bolu Pandan", sellingPrice: 20000, costPrice: 8000, shelfLifeHours: 24, difficulty: 2 },
    { name: "Kue Dadar Gulung", sellingPrice: 15000, costPrice: 7000, shelfLifeHours: 12, difficulty: 4 },
    { name: "Puding Coklat", sellingPrice: 18000, costPrice: 6000, shelfLifeHours: 24, difficulty: 1 },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: `seed-${p.name.toLowerCase().replace(/\s/g, "-")}` },
      update: p,
      create: {
        ...p,
        id: `seed-${p.name.toLowerCase().replace(/\s/g, "-")}`,
      },
    });
    console.log(`  ✓ Created product: ${p.name}`);
  }

  console.log("\n✅ Seeding completed!");
  console.log("\n📝 Login credentials:");
  console.log("  Owner: owner / owner123");
  console.log("  Kitchen: dapur / kitchen123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
