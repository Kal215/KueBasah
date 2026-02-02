import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LaporanClient from "@/components/laporan-client";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  const session = await auth();

  // Strict RBAC: Only OWNER can access this page
  if (session?.user?.role === "KITCHEN") {
    redirect("/input-harian");
  }

  return <LaporanClient />;
}
