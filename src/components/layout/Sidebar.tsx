"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Pill,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Shield,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/components/theme/ThemeProvider";
import { usePharmacy } from "@/context/PharmacyContext";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "staff"] },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart, roles: ["admin", "manager", "staff"] },
  { href: "/inventory", label: "Inventory", icon: Package, roles: ["admin", "manager"] },
  { href: "/sales", label: "Sales History", icon: Receipt, roles: ["admin", "manager", "staff"] },
  { href: "/audit", label: "Audit Log", icon: Shield, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { currentUser, logout, notifications } = usePharmacy();

  const role = currentUser?.role || "staff";
  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const cycleTheme = () => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] no-print">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--sidebar-border)] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
          <Pill className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">Stechem Pharmacy</p>
          <p className="text-xs text-muted-foreground">POS System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-teal-600 dark:text-teal-400" : "")} />
              {item.label}
              {item.href === "/audit" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-4 space-y-3">
        <button
          onClick={cycleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-5 w-5" />
          <span className="capitalize">{theme} mode</span>
          <span className="ml-auto text-[10px] uppercase tracking-wide opacity-60">{resolvedTheme}</span>
        </button>

        <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
            {(currentUser?.name || "AD").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{currentUser?.name || "Guest"}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{currentUser?.role || "not logged in"}</p>
          </div>
          {currentUser && (
            <button onClick={logout} className="text-muted-foreground hover:text-red-500" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
