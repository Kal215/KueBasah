import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProductsAction } from "@/app/actions";
import { ProductTable } from "@/components/product-table";
import { ProductFormDialog } from "@/components/product-form-dialog";

export const dynamic = "force-dynamic";

export default async function ProdukPage() {
  const session = await auth();

  // Ensure only OWNER can access
  if (session?.user?.role === "KITCHEN") {
    redirect("/input-harian");
  }

  // Get all products
  const products = await getProductsAction();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Produk</h1>
          <p className="text-muted-foreground">
            Kelola data produk kue dan informasi harga
          </p>
        </div>
        <ProductFormDialog mode="create" />
      </div>

      {/* Products Table */}
      <ProductTable products={products} />
    </div>
  );
}
