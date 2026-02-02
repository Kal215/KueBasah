"use server";

import prisma from "@/lib/db";
import { auth, signIn, signOut } from "@/auth";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

// ==========================================
// AUTH ACTIONS
// ==========================================

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Username atau password salah" };
        default:
          return { error: "Terjadi kesalahan saat login" };
      }
    }
    throw error;
  }

  // Get user role to redirect appropriately
  const user = await prisma.user.findUnique({
    where: { username },
    select: { role: true },
  });

  if (user?.role === "KITCHEN") {
    redirect("/input-harian");
  } else {
    redirect("/dashboard");
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireOwner() {
  const user = await requireAuth();
  if (user.role !== "OWNER") {
    redirect("/input-harian");
  }
  return user;
}

// ==========================================
// USER MANAGEMENT ACTIONS
// ==========================================

export async function createUserAction(data: {
  username: string;
  password: string;
  role: "OWNER" | "KITCHEN";
}) {
  const passwordHash = await hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      role: data.role,
    },
  });

  return { id: user.id, username: user.username, role: user.role };
}

export async function seedDefaultUsersAction() {
  const existingUsers = await prisma.user.findMany();

  if (existingUsers.length === 0) {
    const ownerPasswordHash = await hash("owner123", 12);
    const kitchenPasswordHash = await hash("kitchen123", 12);

    await prisma.user.createMany({
      data: [
        {
          username: "owner",
          passwordHash: ownerPasswordHash,
          role: "OWNER",
        },
        {
          username: "dapur",
          passwordHash: kitchenPasswordHash,
          role: "KITCHEN",
        },
      ],
    });

    return { created: true, message: "Default users created: owner/owner123, dapur/kitchen123" };
  }

  return { created: false, message: "Users already exist" };
}

// ==========================================
// PRODUCT ACTIONS
// ==========================================

export interface ProductFormData {
  name: string;
  sellingPrice: number;
  costPrice: number;
  shelfLifeHours: number;
  difficulty: number;
}

export async function getProductsAction() {
  return await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getAllProductsAction() {
  return await prisma.product.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getProductByIdAction(id: string) {
  return await prisma.product.findUnique({
    where: { id },
  });
}

export async function createProductAction(data: ProductFormData) {
  await requireOwner();

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sellingPrice: data.sellingPrice,
      costPrice: data.costPrice,
      shelfLifeHours: data.shelfLifeHours,
      difficulty: data.difficulty,
    },
  });

  revalidatePath("/produk");
  revalidatePath("/dashboard");
  return product;
}

export async function updateProductAction(id: string, data: ProductFormData) {
  await requireOwner();

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sellingPrice: data.sellingPrice,
      costPrice: data.costPrice,
      shelfLifeHours: data.shelfLifeHours,
      difficulty: data.difficulty,
    },
  });

  revalidatePath("/produk");
  revalidatePath("/dashboard");
  return product;
}

export async function deleteProductAction(id: string) {
  await requireOwner();

  // Soft delete - just set isActive to false
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/produk");
  revalidatePath("/dashboard");
}

// ==========================================
// DAILY RECAP ACTIONS (Input Harian)
// ==========================================

export interface DailyRecapInput {
  productId: string;
  productionQty: number;
  leftoverQty: number;
}

export async function getDailyRecapAction(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.dailyRecap.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      inputBy: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });
}

export async function saveDailyRecapAction(date: Date, recaps: DailyRecapInput[]) {
  const user = await requireAuth();

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  // Use transaction for bulk upsert
  await prisma.$transaction(
    recaps.map((recap) =>
      prisma.dailyRecap.upsert({
        where: {
          date_productId: {
            date: dateOnly,
            productId: recap.productId,
          },
        },
        update: {
          productionQty: recap.productionQty,
          leftoverQty: recap.leftoverQty,
          soldQty: recap.productionQty - recap.leftoverQty,
          inputByUserId: user.id,
        },
        create: {
          date: dateOnly,
          productId: recap.productId,
          productionQty: recap.productionQty,
          leftoverQty: recap.leftoverQty,
          soldQty: recap.productionQty - recap.leftoverQty,
          inputByUserId: user.id,
        },
      })
    )
  );

  revalidatePath("/input-harian");
  revalidatePath("/dashboard");
}

// ==========================================
// CRITERIA ACTIONS
// ==========================================

export async function getCriteriaAction() {
  return await prisma.criteria.findMany({
    orderBy: { code: "asc" },
  });
}

export async function updateCriteriaWeightAction(id: string, weight: number) {
  await requireOwner();

  await prisma.criteria.update({
    where: { id },
    data: { weight },
  });

  revalidatePath("/kriteria");
  revalidatePath("/dashboard");
}

export async function seedCriteriaAction() {
  const existingCriteria = await prisma.criteria.findMany();

  if (existingCriteria.length === 0) {
    await prisma.criteria.createMany({
      data: [
        {
          code: "C1",
          name: "Margin Keuntungan",
          weight: 0.3,
          type: "BENEFIT",
        },
        {
          code: "C2",
          name: "Volume Penjualan",
          weight: 0.3,
          type: "BENEFIT",
        },
        {
          code: "C3",
          name: "Daya Tahan",
          weight: 0.2,
          type: "BENEFIT",
        },
        {
          code: "C4",
          name: "Tingkat Kesulitan",
          weight: 0.2,
          type: "COST",
        },
      ],
    });
  }
}

// ==========================================
// SMART CALCULATION ACTIONS
// ==========================================

export interface SmartRankingResult {
  rank: number;
  productId: string;
  productName: string;
  margin: number;
  avgSales: number;
  shelfLife: number;
  difficulty: number;
  finalScore: number;
  status: "HIJAU" | "KUNING" | "MERAH";
  recommendation: string;
}

export async function calculateSmartRankingAction(): Promise<SmartRankingResult[]> {
  // Seed criteria if not exists
  await seedCriteriaAction();

  // Get all active products with their daily recaps (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      dailyRecaps: {
        where: {
          date: {
            gte: thirtyDaysAgo,
          },
        },
      },
    },
  });

  if (products.length === 0) {
    return [];
  }

  // Get criteria weights
  const criteria = await prisma.criteria.findMany();
  const weights = new Map(criteria.map((c) => [c.code, { weight: c.weight, type: c.type }]));

  // Calculate raw values for each product
  const productData = products.map((product) => {
    // C1: Margin = Selling Price - Cost Price
    const margin = product.sellingPrice - product.costPrice;

    // C2: Average Sales (last 30 days)
    const totalSales = product.dailyRecaps.reduce(
      (sum, recap) => sum + recap.soldQty,
      0
    );
    const daysWithData = product.dailyRecaps.length || 1;
    const avgSales = totalSales / daysWithData;

    return {
      productId: product.id,
      productName: product.name,
      margin,
      avgSales,
      shelfLife: product.shelfLifeHours,
      difficulty: product.difficulty,
    };
  });

  // Find min/max for normalization
  const margins = productData.map((p) => p.margin);
  const sales = productData.map((p) => p.avgSales);
  const shelfLives = productData.map((p) => p.shelfLife);
  const difficulties = productData.map((p) => p.difficulty);

  const minMax = {
    margin: { min: Math.min(...margins), max: Math.max(...margins) },
    sales: { min: Math.min(...sales), max: Math.max(...sales) },
    shelfLife: { min: Math.min(...shelfLives), max: Math.max(...shelfLives) },
    difficulty: { min: Math.min(...difficulties), max: Math.max(...difficulties) },
  };

  // Helper functions for normalization
  const normalizeBenefit = (val: number, min: number, max: number) =>
    max === min ? 1 : (val - min) / (max - min);
  const normalizeCost = (val: number, min: number, max: number) =>
    max === min ? 1 : (max - val) / (max - min);

  // Calculate final scores
  const scoredProducts = productData.map((product) => {
    const c1Weight = weights.get("C1")?.weight || 0.3;
    const c2Weight = weights.get("C2")?.weight || 0.3;
    const c3Weight = weights.get("C3")?.weight || 0.2;
    const c4Weight = weights.get("C4")?.weight || 0.2;

    // Normalize values
    const normC1 = normalizeBenefit(product.margin, minMax.margin.min, minMax.margin.max);
    const normC2 = normalizeBenefit(product.avgSales, minMax.sales.min, minMax.sales.max);
    const normC3 = normalizeBenefit(product.shelfLife, minMax.shelfLife.min, minMax.shelfLife.max);
    const normC4 = normalizeCost(product.difficulty, minMax.difficulty.min, minMax.difficulty.max);

    // Calculate weighted score
    const finalScore = normC1 * c1Weight + normC2 * c2Weight + normC3 * c3Weight + normC4 * c4Weight;

    return {
      ...product,
      finalScore,
    };
  });

  // Sort by final score (descending) and assign ranks
  const ranked = scoredProducts
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((product, index) => {
      // Determine status and recommendation
      let status: "HIJAU" | "KUNING" | "MERAH";
      let recommendation: string;

      if (product.finalScore >= 0.7) {
        status = "HIJAU";
        recommendation = "Tambah Stok - Prioritas Tinggi";
      } else if (product.finalScore >= 0.4) {
        status = "KUNING";
        recommendation = "Pertahankan Stok";
      } else {
        status = "MERAH";
        recommendation = "Kurangi Produksi";
      }

      return {
        rank: index + 1,
        productId: product.productId,
        productName: product.productName,
        margin: product.margin,
        avgSales: product.avgSales,
        shelfLife: product.shelfLife,
        difficulty: product.difficulty,
        finalScore: Math.round(product.finalScore * 1000) / 1000,
        status,
        recommendation,
      };
    });

  // Save results to database
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction(
    ranked.map((result) =>
      prisma.smartResult.upsert({
        where: {
          date_productId: {
            date: today,
            productId: result.productId,
          },
        },
        update: {
          finalScore: result.finalScore,
          rank: result.rank,
          recommendationNote: result.recommendation,
          marginValue: result.margin,
          avgSalesValue: result.avgSales,
          shelfLifeValue: result.shelfLife,
          difficultyValue: result.difficulty,
        },
        create: {
          date: today,
          productId: result.productId,
          finalScore: result.finalScore,
          rank: result.rank,
          recommendationNote: result.recommendation,
          marginValue: result.margin,
          avgSalesValue: result.avgSales,
          shelfLifeValue: result.shelfLife,
          difficultyValue: result.difficulty,
        },
      })
    )
  );

  return ranked;
}

// ==========================================
// DASHBOARD STATS ACTIONS
// ==========================================

export async function getDashboardStatsAction() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's daily recaps for profit calculation
  const todayRecaps = await prisma.dailyRecap.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      product: {
        select: {
          sellingPrice: true,
          costPrice: true,
        },
      },
    },
  });

  // Calculate total profit
  const totalProfit = todayRecaps.reduce((sum, recap) => {
    const margin = recap.product.sellingPrice - recap.product.costPrice;
    return sum + margin * recap.soldQty;
  }, 0);

  // Get best seller
  const bestSeller = todayRecaps.length > 0
    ? todayRecaps.reduce((best, current) =>
        current.soldQty > best.soldQty ? current : best
      )
    : null;

  // Get best seller product name
  let bestSellerName = "-";
  let bestSellerQty = 0;
  if (bestSeller) {
    const product = await prisma.product.findUnique({
      where: { id: bestSeller.productId },
      select: { name: true },
    });
    bestSellerName = product?.name || "-";
    bestSellerQty = bestSeller.soldQty;
  }

  return {
    totalProfit,
    bestSellerName,
    bestSellerQty,
  };
}

// ==========================================
// SEED SAMPLE DATA
// ==========================================

export async function seedSampleDataAction() {
  // Seed users
  await seedDefaultUsersAction();

  // Seed criteria
  await seedCriteriaAction();

  // Seed products
  const existingProducts = await prisma.product.findMany();

  if (existingProducts.length === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Kue Lapis",
          sellingPrice: 25000,
          costPrice: 12000,
          shelfLifeHours: 48,
          difficulty: 3,
        },
        {
          name: "Brownies Kukus",
          sellingPrice: 30000,
          costPrice: 15000,
          shelfLifeHours: 72,
          difficulty: 2,
        },
        {
          name: "Bolu Pandan",
          sellingPrice: 20000,
          costPrice: 8000,
          shelfLifeHours: 24,
          difficulty: 2,
        },
        {
          name: "Kue Dadar Gulung",
          sellingPrice: 15000,
          costPrice: 7000,
          shelfLifeHours: 12,
          difficulty: 4,
        },
        {
          name: "Puding Coklat",
          sellingPrice: 18000,
          costPrice: 6000,
          shelfLifeHours: 24,
          difficulty: 1,
        },
      ],
    });
  }

  revalidatePath("/");
  revalidatePath("/produk");
  revalidatePath("/dashboard");

  return { success: true };
}

// ==========================================
// FINANCIAL REPORT ACTIONS (Laporan)
// ==========================================

export interface FinancialReportParams {
  startDate: Date;
  endDate: Date;
  productId?: string; // Optional filter
}

export interface DailyReportRow {
  id: string;
  date: string;
  productName: string;
  productionQty: number;
  soldQty: number;
  leftoverQty: number;
  leftoverPercentage: number;
  omset: number;
  hpp: number;
  profit: number;
}

export interface FinancialSummary {
  totalOmset: number;
  totalHpp: number;
  totalProfit: number;
  totalProduction: number;
  totalSold: number;
  sellThroughPercentage: number;
}

export interface DailyProfitTrend {
  date: string;
  profit: number;
  omset: number;
  hpp: number;
}

export interface TopProduct {
  productName: string;
  soldQty: number;
  omset: number;
}

export interface FinancialReportResult {
  summary: FinancialSummary;
  details: DailyReportRow[];
  dailyTrend: DailyProfitTrend[];
  topProducts: TopProduct[];
}

export async function getFinancialReportAction(
  params: FinancialReportParams
): Promise<FinancialReportResult> {
  const { startDate, endDate, productId } = params;

  // Query daily recaps with product data
  const recaps = await prisma.dailyRecap.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(productId && { productId }),
    },
    include: {
      product: true,
    },
    orderBy: [
      { date: "asc" },
      { product: { name: "asc" } },
    ],
  });

  // Calculate detailed rows
  const details: DailyReportRow[] = recaps.map((recap) => {
    const omset = recap.soldQty * recap.product.sellingPrice;
    const hpp = recap.productionQty * recap.product.costPrice;
    const profit = omset - hpp;
    const leftoverPercentage = recap.productionQty > 0
      ? (recap.leftoverQty / recap.productionQty) * 100
      : 0;

    return {
      id: recap.id,
      date: recap.date.toISOString().split("T")[0],
      productName: recap.product.name,
      productionQty: recap.productionQty,
      soldQty: recap.soldQty,
      leftoverQty: recap.leftoverQty,
      leftoverPercentage,
      omset,
      hpp,
      profit,
    };
  });

  // Calculate summary
  const summary: FinancialSummary = {
    totalOmset: details.reduce((sum, row) => sum + row.omset, 0),
    totalHpp: details.reduce((sum, row) => sum + row.hpp, 0),
    totalProfit: details.reduce((sum, row) => sum + row.profit, 0),
    totalProduction: details.reduce((sum, row) => sum + row.productionQty, 0),
    totalSold: details.reduce((sum, row) => sum + row.soldQty, 0),
    sellThroughPercentage: 0,
  };
  summary.sellThroughPercentage = summary.totalProduction > 0
    ? (summary.totalSold / summary.totalProduction) * 100
    : 0;

  // Calculate daily profit trend (aggregate by date)
  const dailyMap = new Map<string, DailyProfitTrend>();
  details.forEach((row) => {
    const existing = dailyMap.get(row.date);
    if (existing) {
      existing.profit += row.profit;
      existing.omset += row.omset;
      existing.hpp += row.hpp;
    } else {
      dailyMap.set(row.date, {
        date: row.date,
        profit: row.profit,
        omset: row.omset,
        hpp: row.hpp,
      });
    }
  });
  const dailyTrend = Array.from(dailyMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  // Calculate top 5 products by sold quantity
  const productMap = new Map<string, TopProduct>();
  details.forEach((row) => {
    const existing = productMap.get(row.productName);
    if (existing) {
      existing.soldQty += row.soldQty;
      existing.omset += row.omset;
    } else {
      productMap.set(row.productName, {
        productName: row.productName,
        soldQty: row.soldQty,
        omset: row.omset,
      });
    }
  });
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.soldQty - a.soldQty)
    .slice(0, 5);

  return {
    summary,
    details,
    dailyTrend,
    topProducts,
  };
}

export async function getProductsForFilterAction() {
  return await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
