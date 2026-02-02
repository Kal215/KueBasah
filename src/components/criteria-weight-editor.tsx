"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Info, TrendingUp, TrendingDown } from "lucide-react";
import { updateCriteriaWeightAction } from "@/app/actions";

interface Criteria {
  id: string;
  code: string;
  name: string;
  weight: number;
  type: "BENEFIT" | "COST";
}

interface CriteriaWeightEditorProps {
  criteria: Criteria[];
}

export function CriteriaWeightEditor({ criteria }: CriteriaWeightEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      criteria.forEach((c) => {
        initial[c.id] = c.weight;
      });
      return initial;
    }
  );

  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isValidTotal = Math.abs(totalWeight - 1) < 0.001; // Allow small floating point errors

  const handleWeightChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWeights((prev) => ({
      ...prev,
      [id]: Math.min(1, Math.max(0, numValue)),
    }));
  };

  const handleSave = async () => {
    if (!isValidTotal) return;

    setIsLoading(true);

    // Update all weights
    for (const c of criteria) {
      if (weights[c.id] !== c.weight) {
        await updateCriteriaWeightAction(c.id, weights[c.id]);
      }
    }

    setIsLoading(false);
    router.refresh();
  };

  // Get criteria description
  const getCriteriaDescription = (code: string) => {
    const descriptions: Record<string, string> = {
      C1: "Selisih antara Harga Jual dan Harga Pokok Produksi",
      C2: "Rata-rata jumlah penjualan dalam 30 hari terakhir",
      C3: "Berapa lama kue dapat disimpan dalam jam",
      C4: "Tingkat kesulitan pembuatan (1-5)",
    };
    return descriptions[code] || "";
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Tentang Bobot Kriteria</p>
              <p className="text-amber-700 dark:text-amber-300">
                Bobot menentukan seberapa penting kriteria dalam perhitungan SMART. 
                Total bobot harus sama dengan <strong>1.0 (100%)</strong>. 
                Kriteria dengan bobot lebih tinggi akan lebih mempengaruhi hasil rekomendasi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {criteria.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-amber-600">{c.code}</span>
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                </div>
                <Badge variant={c.type === "BENEFIT" ? "default" : "secondary"} className="gap-1">
                  {c.type === "BENEFIT" ? (
                    <>
                      <TrendingUp className="h-3 w-3" />
                      Benefit
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3" />
                      Cost
                    </>
                  )}
                </Badge>
              </div>
              <CardDescription>{getCriteriaDescription(c.code)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={`weight-${c.id}`}>Bobot (0 - 1)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id={`weight-${c.id}`}
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights[c.id]}
                    onChange={(e) => handleWeightChange(c.id, e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    = {(weights[c.id] * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Weight & Save */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium">Total Bobot</p>
                <p className={`text-2xl font-bold ${isValidTotal ? "text-green-600" : "text-red-600"}`}>
                  {totalWeight.toFixed(2)}
                </p>
              </div>
              {!isValidTotal && (
                <p className="text-sm text-red-600">
                  Total bobot harus sama dengan 1.0
                </p>
              )}
              {isValidTotal && (
                <p className="text-sm text-green-600">
                  ✓ Bobot valid
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={isLoading || !isValidTotal}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Bobot
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Penjelasan Tipe Kriteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Benefit (Keuntungan)</p>
                <p className="text-muted-foreground">
                  Semakin tinggi nilai kriteria, semakin baik. 
                  Contoh: Margin tinggi = lebih menguntungkan.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingDown className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cost (Biaya)</p>
                <p className="text-muted-foreground">
                  Semakin rendah nilai kriteria, semakin baik. 
                  Contoh: Kesulitan rendah = lebih efisien.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
