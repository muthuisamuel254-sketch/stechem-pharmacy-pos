"use client";

import { PharmacyProvider } from "@/context/PharmacyContext";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PharmacyProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="pl-64">
          <div className="min-h-screen p-6">{children}</div>
        </main>
      </div>
    </PharmacyProvider>
  );
}
