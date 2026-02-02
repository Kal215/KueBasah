import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCriteriaAction } from "@/app/actions";
import { CriteriaWeightEditor } from "@/components/criteria-weight-editor";

export const dynamic = "force-dynamic";

export default async function KriteriaPage() {
  const session = await auth();

  // Ensure only OWNER can access
  if (session?.user?.role === "KITCHEN") {
    redirect("/input-harian");
  }

  // Get all criteria
  const criteria = await getCriteriaAction();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bobot Kriteria SMART</h1>
        <p className="text-muted-foreground">
          Atur bobot untuk setiap kriteria dalam perhitungan metode SMART
        </p>
      </div>

      {/* Criteria Editor */}
      <CriteriaWeightEditor criteria={criteria} />
    </div>
  );
}
