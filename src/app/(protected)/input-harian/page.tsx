import { auth } from "@/auth";
import { getProductsAction, getDailyRecapAction } from "@/app/actions";
import { DailyRecapForm } from "@/components/daily-recap-form";

export const dynamic = "force-dynamic";

export default async function InputHarianPage() {
  const session = await auth();
  
  // Get all active products
  const products = await getProductsAction();
  
  // Get today's recap data (if any)
  const today = new Date();
  const existingRecaps = await getDailyRecapAction(today);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Input Data Harian</h1>
        <p className="text-muted-foreground">
          Catat jumlah produksi pagi dan sisa sore hari ini
        </p>
      </div>

      {/* Daily Recap Form */}
      <DailyRecapForm
        products={products}
        existingRecaps={existingRecaps}
        userName={session?.user?.username || ""}
      />
    </div>
  );
}
