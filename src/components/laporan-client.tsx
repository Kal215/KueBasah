"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarIcon, Download, TrendingUp, DollarSign, Percent, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ProfitTrendChart } from "@/components/profit-trend-chart";
import { TopProductsChart } from "@/components/top-products-chart";
import {
  getFinancialReportAction,
  getProductsForFilterAction,
  type FinancialReportResult,
  type DailyReportRow,
} from "@/app/actions";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface ProductFilter {
  id: string;
  name: string;
}

// Currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Date formatter
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Format date range for display
const formatDateRange = (from: Date | undefined, to: Date | undefined) => {
  if (!from) return "Pilih tanggal";
  if (!to) return formatDate(from.toISOString());
  return `${formatDate(from.toISOString())} - ${formatDate(to.toISOString())}`;
};

export default function LaporanClient() {
  // Get first and last day of current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // State
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  });
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [products, setProducts] = useState<ProductFilter[]>([]);
  const [report, setReport] = useState<FinancialReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Load products for filter
  useEffect(() => {
    const loadProducts = async () => {
      const productList = await getProductsForFilterAction();
      setProducts(productList);
    };
    loadProducts();
  }, []);

  // Load report data
  const loadReport = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;

    setLoading(true);
    try {
      const result = await getFinancialReportAction({
        startDate: dateRange.from,
        endDate: dateRange.to,
        productId: selectedProduct === "all" ? undefined : selectedProduct,
      });
      setReport(result);
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, selectedProduct]);

  // Load report when filters change
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Export to Excel
  const handleExport = () => {
    if (!report?.details || report.details.length === 0) return;

    const exportData = report.details.map((row) => ({
      Tanggal: formatDate(row.date),
      "Nama Kue": row.productName,
      Produksi: row.productionQty,
      Terjual: row.soldQty,
      Sisa: row.leftoverQty,
      "% Sisa": `${row.leftoverPercentage.toFixed(1)}%`,
      Omset: row.omset,
      HPP: row.hpp,
      Profit: row.profit,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

    // Generate filename with date range
    const fromStr = dateRange.from?.toISOString().split("T")[0] || "";
    const toStr = dateRange.to?.toISOString().split("T")[0] || "";
    const filename = `laporan-penjualan_${fromStr}_${toStr}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
          <p className="text-muted-foreground">
            Analisis performa keuangan dan riwayat penjualan
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={!report?.details || report.details.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
          <CardDescription>Pilih rentang tanggal dan produk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range Picker */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Rentang Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange(dateRange.from, dateRange.to)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range && typeof range === "object" && "from" in range) {
                        setDateRange(range);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Product Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Produk</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Produk</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {report && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Omset</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(report.summary.totalOmset)}
              </div>
              <p className="text-xs text-muted-foreground">Pendapatan kotor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total HPP</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(report.summary.totalHpp)}
              </div>
              <p className="text-xs text-muted-foreground">Biaya produksi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bersih</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  report.summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {formatCurrency(report.summary.totalProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Laba/Rugi bersih</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% Terjual</CardTitle>
              <Percent className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {report.summary.sellThroughPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {report.summary.totalSold} / {report.summary.totalProduction} pcs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {report && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tren Keuntungan Harian</CardTitle>
              <CardDescription>Profit, omset, dan HPP per hari</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitTrendChart data={report.dailyTrend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produk Terlaris</CardTitle>
              <CardDescription>Berdasarkan jumlah terjual</CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductsChart data={report.topProducts} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Penjualan</CardTitle>
          <CardDescription>
            Data penjualan harian per produk
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : !report?.details || report.details.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Tidak ada data untuk periode yang dipilih
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama Kue</TableHead>
                    <TableHead className="text-right">Produksi</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead className="text-right">Omset</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.details.map((row: DailyReportRow) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell className="text-right">{row.productionQty}</TableCell>
                      <TableCell className="text-right">{row.soldQty}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            row.leftoverPercentage > 20 && "text-red-600 font-medium"
                          )}
                        >
                          {row.leftoverQty}
                          {row.leftoverPercentage > 20 && (
                            <span className="text-xs ml-1">
                              ({row.leftoverPercentage.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.omset)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          row.profit >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {formatCurrency(row.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
