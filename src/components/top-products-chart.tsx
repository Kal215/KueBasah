"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TopProductData {
  productName: string;
  soldQty: number;
  omset: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
}

const COLORS = ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TopProductData;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{data.productName}</p>
        <p className="text-sm text-muted-foreground">
          Terjual: <span className="font-medium text-foreground">{data.soldQty} pcs</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Omset: <span className="font-medium text-foreground">{formatCurrency(data.omset)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Tidak ada data untuk ditampilkan
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          type="category"
          dataKey="productName"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="soldQty" name="Terjual" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
