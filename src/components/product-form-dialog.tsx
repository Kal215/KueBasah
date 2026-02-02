"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { createProductAction, updateProductAction, ProductFormData } from "@/app/actions";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  shelfLifeHours: number;
  difficulty: number;
}

interface ProductFormDialogProps {
  mode: "create" | "edit";
  product?: Product;
}

export function ProductFormDialog({ mode, product }: ProductFormDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || "",
    sellingPrice: product?.sellingPrice || 0,
    costPrice: product?.costPrice || 0,
    shelfLifeHours: product?.shelfLifeHours || 24,
    difficulty: product?.difficulty || 3,
  });

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === "create") {
      await createProductAction(formData);
    } else if (product) {
      await updateProductAction(product.id, formData);
    }

    setIsLoading(false);
    setIsOpen(false);
    router.refresh();

    // Reset form for create mode
    if (mode === "create") {
      setFormData({
        name: "",
        sellingPrice: 0,
        costPrice: 0,
        shelfLifeHours: 24,
        difficulty: 3,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        ) : (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Produk Baru" : "Edit Produk"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Masukkan informasi produk kue baru"
              : "Perbarui informasi produk kue"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kue</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Contoh: Kue Lapis"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Harga Jual (Rp)</Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                value={formData.sellingPrice || ""}
                onChange={(e) => handleChange("sellingPrice", parseInt(e.target.value) || 0)}
                placeholder="25000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">HPP (Rp)</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                value={formData.costPrice || ""}
                onChange={(e) => handleChange("costPrice", parseInt(e.target.value) || 0)}
                placeholder="12000"
                required
              />
            </div>
          </div>

          {/* Margin Preview */}
          {formData.sellingPrice > 0 && formData.costPrice > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-400">
                <span className="font-medium">Margin: </span>
                Rp {(formData.sellingPrice - formData.costPrice).toLocaleString("id-ID")}
                <span className="ml-2 text-xs">
                  ({((formData.sellingPrice - formData.costPrice) / formData.sellingPrice * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shelfLifeHours">Daya Tahan (Jam)</Label>
              <Input
                id="shelfLifeHours"
                type="number"
                min="1"
                value={formData.shelfLifeHours || ""}
                onChange={(e) => handleChange("shelfLifeHours", parseInt(e.target.value) || 24)}
                placeholder="24"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Tingkat Kesulitan (1-5)</Label>
              <Input
                id="difficulty"
                type="number"
                min="1"
                max="5"
                value={formData.difficulty || ""}
                onChange={(e) => handleChange("difficulty", Math.min(5, Math.max(1, parseInt(e.target.value) || 3)))}
                placeholder="3"
                required
              />
              <p className="text-xs text-muted-foreground">
                1 = Sangat Mudah, 5 = Sangat Sulit
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : mode === "create" ? (
                "Tambah Produk"
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
