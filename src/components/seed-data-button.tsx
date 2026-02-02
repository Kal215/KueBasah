"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { seedSampleDataAction } from "@/app/actions";

export function SeedDataButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    setIsLoading(true);
    await seedSampleDataAction();
    router.refresh();
    setIsLoading(false);
  };

  return (
    <Button onClick={handleSeed} disabled={isLoading} variant="outline">
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Memproses..." : "Refresh Data"}
    </Button>
  );
}
