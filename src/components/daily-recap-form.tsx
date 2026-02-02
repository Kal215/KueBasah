"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, Save, Loader2, Package, CheckCircle } from "lucide-react";
import { saveDailyRecapAction, DailyRecapInput } from "@/app/actions";

interface Product {
  id: string;
  name: string;
}

interface ExistingRecap {
  productId: string;
  productionQty: number;
  leftoverQty: number;
}

interface DailyRecapFormProps {
  products: Product[];
  existingRecaps: ExistingRecap[];
  userName: string;
}

export function DailyRecapForm({ products, existingRecaps, userName }: DailyRecapFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Create a map of existing recaps for easy lookup
  const existingRecapMap = new Map(
    existingRecaps.map((recap) => [recap.productId, recap])
  );

  // Initialize form state with existing data or empty values
  const [recapData, setRecapData] = useState<Record<string, { productionQty: number; leftoverQty: number }>>(
    () => {
      const initial: Record<string, { productionQty: number; leftoverQty: number }> = {};
      products.forEach((product) => {
        const existing = existingRecapMap.get(product.id);
        initial[product.id] = {
          productionQty: existing?.productionQty || 0,
          leftoverQty: existing?.leftoverQty || 0,
        };
      });
      return initial;
    }
  );

  const handleInputChange = (productId: string, field: "productionQty" | "leftoverQty", value: string) => {
    const numValue = parseInt(value) || 0;
    setRecapData((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: numValue,
      },
    }));
    setIsSaved(false);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    const recaps: DailyRecapInput[] = products.map((product) => ({
      productId: product.id,
      productionQty: recapData[product.id].productionQty,
      leftoverQty: recapData[product.id].leftoverQty,
    }));

    await saveDailyRecapAction(new Date(), recaps);
    
    setIsLoading(false);
    setIsSaved(true);
    router.refresh();
  };

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Date Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Tanggal Input</CardTitle>
                <CardDescription>{formattedDate}</CardDescription>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              Input oleh: <span className="font-medium">{userName}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Data Produksi</CardTitle>
          <CardDescription>
            Masukkan jumlah produksi pagi dan sisa sore untuk setiap produk.
            Terjual = Produksi - Sisa (dihitung otomatis).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Belum Ada Produk</h3>
              <p className="mt-2 text-muted-foreground">
                Hubungi Owner untuk menambahkan data produk terlebih dahulu.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Nama Kue</TableHead>
                      <TableHead className="w-40 text-center">Produksi Pagi</TableHead>
                      <TableHead className="w-40 text-center">Sisa Sore</TableHead>
                      <TableHead className="w-32 text-center">Terjual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => {
                      const production = recapData[product.id]?.productionQty || 0;
                      const leftover = recapData[product.id]?.leftoverQty || 0;
                      const sold = Math.max(0, production - leftover);

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={production || ""}
                              onChange={(e) =>
                                handleInputChange(product.id, "productionQty", e.target.value)
                              }
                              placeholder="0"
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={production}
                              value={leftover || ""}
                              onChange={(e) =>
                                handleInputChange(product.id, "leftoverQty", e.target.value)
                              }
                              placeholder="0"
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center w-16 h-10 rounded-md bg-green-100 text-green-700 font-semibold">
                              {sold}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex items-center justify-between">
                {isSaved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Data berhasil disimpan!</span>
                  </div>
                )}
                {!isSaved && <div />}
                <Button onClick={handleSubmit} disabled={isLoading} className="min-w-32">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Data
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">i</span>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Petunjuk Pengisian:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li><strong>Produksi Pagi:</strong> Jumlah kue yang diproduksi di awal hari</li>
                <li><strong>Sisa Sore:</strong> Jumlah kue yang tidak terjual di akhir hari</li>
                <li>Data dapat diperbarui selama hari yang sama</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
