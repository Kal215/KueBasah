import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { calculateSmartRankingAction, getDashboardStatsAction, seedSampleDataAction } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, DollarSign, Award, Package } from "lucide-react";
import { SeedDataButton } from "@/components/seed-data-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  // Ensure only OWNER can access
  if (session?.user?.role === "KITCHEN") {
    redirect("/input-harian");
  }

  // Get SMART ranking results
  const rankings = await calculateSmartRankingAction();

  // Get dashboard stats
  const stats = await getDashboardStatsAction();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge variant
  const getStatusBadge = (status: "HIJAU" | "KUNING" | "MERAH") => {
    switch (status) {
      case "HIJAU":
        return <Badge className="bg-green-500 hover:bg-green-600">Prioritas</Badge>;
      case "KUNING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Normal</Badge>;
      case "MERAH":
        return <Badge className="bg-red-500 hover:bg-red-600">Rendah</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Rekomendasi Produksi Besok - Metode SMART
          </p>
        </div>
        <SeedDataButton />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankings.length}</div>
            <p className="text-xs text-muted-foreground">Produk aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keuntungan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Total profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestSellerName}</div>
            <p className="text-xs text-muted-foreground">
              {stats.bestSellerQty > 0 ? `${stats.bestSellerQty} terjual` : "Belum ada data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rekomendasi Tinggi</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rankings.filter((r) => r.status === "HIJAU").length}
            </div>
            <p className="text-xs text-muted-foreground">Produk prioritas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prioritas Produksi Besok</CardTitle>
          <CardDescription>
            Hasil perhitungan metode SMART berdasarkan data 30 hari terakhir.
            Semakin tinggi skor, semakin direkomendasikan untuk diproduksi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Belum Ada Data Produk</h3>
              <p className="mt-2 text-muted-foreground">
                Klik tombol &quot;Tambah Data Sampel&quot; untuk menambahkan produk contoh.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Nama Kue</TableHead>
                    <TableHead className="text-right">Skor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Saran</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Avg. Jual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold">
                          #{item.rank}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {item.finalScore.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.recommendation}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.margin)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.avgSales.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Keterangan Kriteria SMART</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div>
              <span className="font-semibold">C1 - Margin:</span>
              <p className="text-muted-foreground">Harga Jual - HPP (Benefit)</p>
            </div>
            <div>
              <span className="font-semibold">C2 - Volume:</span>
              <p className="text-muted-foreground">Rata-rata penjualan 30 hari (Benefit)</p>
            </div>
            <div>
              <span className="font-semibold">C3 - Daya Tahan:</span>
              <p className="text-muted-foreground">Masa simpan dalam jam (Benefit)</p>
            </div>
            <div>
              <span className="font-semibold">C4 - Kesulitan:</span>
              <p className="text-muted-foreground">Tingkat kesulitan 1-5 (Cost)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
