"use client";

import { usePharmacy } from "@/context/PharmacyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SalesPage() {
  const { sales, settings } = usePharmacy();

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-slate-500">
            {sales.length} sale{sales.length !== 1 ? "s" : ""} • Total{" "}
            {formatCurrency(totalRevenue, settings.currency)}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <p className="py-16 text-center text-slate-500">
              No sales recorded yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Receipt</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(sale.createdAt)}{" "}
                        <span className="text-slate-400">
                          {new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {sale.customerName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {sale.items.map((i) => i.name).join(", ").slice(0, 40)}
                        {sale.items.map((i) => i.name).join(", ").length > 40
                          ? "…"
                          : ""}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize">
                          {sale.paymentMethod}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(sale.total, settings.currency)}
                      </td>
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
