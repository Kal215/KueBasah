"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Cake,
  LayoutDashboard,
  Package,
  Settings,
  ClipboardList,
  LogOut,
  User,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AppNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = session?.user?.role;
  const username = session?.user?.username;

  // Navigation items based on role
  const ownerNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/laporan", label: "Laporan", icon: FileBarChart },
    { href: "/produk", label: "Master Produk", icon: Package },
    { href: "/kriteria", label: "Bobot Kriteria", icon: Settings },
  ];

  const kitchenNavItems = [
    { href: "/input-harian", label: "Input Harian", icon: ClipboardList },
  ];

  const navItems = userRole === "KITCHEN" ? kitchenNavItems : ownerNavItems;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href={userRole === "KITCHEN" ? "/input-harian" : "/dashboard"} className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <Cake className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:inline">Nay&apos;s Cake</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive && "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {username}
              <span className="ml-1 text-xs">
                ({userRole === "KITCHEN" ? "Dapur" : "Owner"})
              </span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
