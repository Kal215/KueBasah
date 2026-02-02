"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { ProductFormDialog } from "@/components/product-form-dialog";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  shelfLifeHours: number;
  difficulty: number;
}

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate margin
  const calculateMargin = (selling: number, cost: number) => {
    return selling - cost;
  };

  // Get difficulty label
  const getDifficultyLabel = (level: number) => {
    const labels = ["", "Sangat Mudah", "Mudah", "Sedang", "Sulit", "Sangat Sulit"];
    return labels[level] || "Unknown";
  };

  const handleDelete = async (id: string) => {
    await deleteProductAction(id);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Produk</CardTitle>
        <CardDescription>
          Semua produk aktif yang tersedia untuk produksi
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Belum Ada Produk</h3>
            <p className="mt-2 text-muted-foreground">
              Klik tombol &quot;Tambah Produk&quot; untuk menambahkan produk baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Kue</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">HPP</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-center">Daya Tahan</TableHead>
                  <TableHead className="text-center">Kesulitan</TableHead>
                  <TableHead className="text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.costPrice)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatCurrency(calculateMargin(product.sellingPrice, product.costPrice))}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.shelfLifeHours} jam
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">
                        {getDifficultyLabel(product.difficulty)} ({product.difficulty})
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <ProductFormDialog mode="edit" product={product} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus produk &quot;{product.name}&quot;?
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
