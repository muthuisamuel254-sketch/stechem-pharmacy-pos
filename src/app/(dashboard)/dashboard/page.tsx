"use client";

import { usePharmacy } from "@/context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, daysUntilExpiry } from "@/lib/utils";
import { TrendingUp, ShoppingBag, AlertTriangle, Package, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const {
    medicines,
    sales,
    settings,
    getLowStock,
    getExpiringSoon,
    todaySalesTotal,
    todaySalesCount,
    getStockForMedicine,
  } = usePharmacy();

  const lowStock = getLowStock();
  const expiring = getExpiringSoon(90);
  const totalProducts = medicines.filter((m) => m.isActive).length;
  const totalStockValue = medicines.reduce((sum, m) => {
    const stock = getStockForMedicine(m.id);
    return sum + stock * m.costPrice;
  }, 0);

  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Welcome to {settings.name} • {formatDate(new Date().toISOString())}
          </p>
        </div>
        <Link href="/pos">
          <Button size="lg" className="gap-2">
            <ShoppingBag className="h-5 w-5" />
            New Sale
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Today&apos;s Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(todaySalesTotal(), settings.currency)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {todaySalesCount()} transaction{todaySalesCount() !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Products</CardTitle>
            <Package className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalProducts}</div>
            <p className="text-xs text-slate-500 mt-1">Active medicines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{lowStock.length}</div>
            <p className="text-xs text-slate-500 mt-1">Items below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalStockValue, settings.currency)}
            </div>
            <p className="text-xs text-slate-500 mt-1">At cost price</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            <Link href="/inventory">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">All stock levels are healthy</p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Reorder at {item.reorderLevel} {item.unit}s</p>
                    </div>
                    <Badge variant={item.stock === 0 ? "destructive" : "warning"}>{item.stock} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Expiring Soon (90 days)</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {expiring.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No items expiring soon</p>
            ) : (
              <div className="space-y-3">
                {expiring.slice(0, 6).map((item) => {
                  const days = daysUntilExpiry(item.expiryDate);
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.medicineName}</p>
                        <p className="text-xs text-slate-500">Batch {item.batchNumber} • Qty {item.quantity}</p>
                      </div>
                      <Badge variant={days <= 30 ? "destructive" : "warning"}>{days}d left</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Sales</CardTitle>
          <Link href="/sales">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No sales yet today</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 font-medium">Receipt</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Items</th>
                    <th className="pb-3 font-medium">Payment</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-900">{sale.receiptNumber}</td>
                      <td className="py-3 text-slate-600">{sale.customerName || "—"}</td>
                      <td className="py-3 text-slate-600">{sale.items.length} item{sale.items.length !== 1 ? "s" : ""}</td>
                      <td className="py-3 capitalize text-slate-600">{sale.paymentMethod}</td>
                      <td className="py-3 text-right font-medium text-slate-900">{formatCurrency(sale.total, settings.currency)}</td>
                      <td className="py-3 text-right text-slate-500">{new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
