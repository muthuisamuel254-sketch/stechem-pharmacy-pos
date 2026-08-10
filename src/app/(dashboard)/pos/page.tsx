"use client";

import { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Minus, Trash2, ShoppingCart, Banknote, Smartphone, CheckCircle2, X } from "lucide-react";
import type { Sale } from "@/types";

export default function POSPage() {
  const {
    medicines, settings, cart, addToCart, updateCartQty, removeFromCart, clearCart, completeSale,
    getStockForMedicine, getBatchesForMedicine,
  } = usePharmacy();

  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Sale["paymentMethod"]>("cash");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return medicines.filter((m) => m.isActive).slice(0, 12);
    return medicines
      .filter((m) => m.isActive && (m.name.toLowerCase().includes(q) || m.genericName?.toLowerCase().includes(q) || m.barcode?.includes(q) || m.category.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [medicines, search]);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round((taxable * settings.taxRate) / 100);
  const total = taxable + tax;

  const handleAdd = (medicineId: string) => {
    const batches = getBatchesForMedicine(medicineId);
    if (batches.length === 0) { alert("No stock available"); return; }
    const batch = batches[0];
    const med = medicines.find((m) => m.id === medicineId)!;
    addToCart({
      medicineId,
      batchId: batch.id,
      name: med.name,
      batchNumber: batch.batchNumber,
      quantity: 1,
      unitPrice: med.sellingPrice,
      packSize: med.packSize,
      packUnit: med.packUnit,
      expiryDate: batch.expiryDate,
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const sale = completeSale({
      paymentMethod,
      discount,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    });
    if (sale) {
      setLastSale(sale);
      setShowReceipt(true);
      setDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Point of Sale</h1>
        <p className="text-slate-500">Search medicines and complete sales</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, generic, barcode or category..."
              className="pl-10 h-12 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((med) => {
              const stock = getStockForMedicine(med.id);
              return (
                <button
                  key={med.id}
                  onClick={() => handleAdd(med.id)}
                  disabled={stock === 0}
                  className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-left transition hover:border-teal-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-700">{med.name}</p>
                      {med.genericName && <p className="text-xs text-slate-500 truncate">{med.genericName}</p>}
                    </div>
                    {med.requiresPrescription && <Badge variant="outline" className="shrink-0 text-[10px]">Rx</Badge>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-teal-700">{formatCurrency(med.sellingPrice, settings.currency)}</span>
                    <span className={`text-xs font-medium ${stock === 0 ? "text-red-600" : stock <= med.reorderLevel ? "text-amber-600" : "text-slate-500"}`}>
                      {stock} {med.packUnit}{stock !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && <p className="text-center text-slate-500 py-12">No medicines found</p>}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><ShoppingCart className="h-5 w-5" /> Cart ({cart.length})</CardTitle>
                {cart.length > 0 && <Button variant="ghost" size="sm" onClick={clearCart}>Clear</Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">Cart is empty. Search and add medicines.</p>
              ) : (
                <>
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={`${item.medicineId}-${item.batchId}`} className="rounded-lg border border-slate-100 dark:border-slate-700 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                            <p className="text-xs text-slate-500">Batch {item.batchNumber}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.medicineId, item.batchId)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCartQty(item.medicineId, item.batchId, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"><Minus className="h-3 w-3" /></button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.medicineId, item.batchId, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"><Plus className="h-3 w-3" /></button>
                          </div>
                          <span className="text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity, settings.currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Input placeholder="Customer name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Input placeholder="Phone for WhatsApp receipt (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 whitespace-nowrap">Discount</label>
                    <Input type="number" min={0} value={discount || ""} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="h-9" />
                  </div>
                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-700 pt-3 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>{formatCurrency(subtotal, settings.currency)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span>-{formatCurrency(discount, settings.currency)}</span></div>}
                    <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>VAT ({settings.taxRate}%)</span><span>{formatCurrency(tax, settings.currency)}</span></div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-100 pt-1"><span>Total</span><span>{formatCurrency(total, settings.currency)}</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: "cash" as const, label: "Cash", icon: Banknote },
                      { id: "mpesa" as const, label: "M-Pesa", icon: Smartphone },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition ${
                          paymentMethod === m.id
                            ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                            : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <m.icon className="h-4 w-4" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <Button size="lg" className="w-full h-12 text-base" onClick={handleCheckout}>
                    Complete Sale • {formatCurrency(total, settings.currency)}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-5 py-4">
              <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">Sale Completed</span></div>
              <button onClick={() => setShowReceipt(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{settings.name}</p>
                <p className="text-slate-500">{settings.address}</p>
                <p className="text-slate-500">{settings.phone}</p>
              </div>
              <div className="border-y border-dashed border-slate-200 dark:border-slate-600 py-3 space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Receipt</span><span className="font-medium">{lastSale.receiptNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{new Date(lastSale.createdAt).toLocaleString()}</span></div>
                {lastSale.customerName && <div className="flex justify-between"><span className="text-slate-500">Customer</span><span>{lastSale.customerName}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="capitalize">{lastSale.paymentMethod === "mpesa" ? "M-Pesa" : lastSale.paymentMethod}</span></div>
              </div>
              <div className="space-y-2">
                {lastSale.items.map((item, i) => (
                  <div key={i} className="flex justify-between"><span>{item.name} × {item.quantity}</span><span>{formatCurrency(item.subtotal, settings.currency)}</span></div>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-600 pt-3 space-y-1">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(lastSale.subtotal, settings.currency)}</span></div>
                {lastSale.discount > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span>-{formatCurrency(lastSale.discount, settings.currency)}</span></div>}
                <div className="flex justify-between text-slate-600"><span>VAT</span><span>{formatCurrency(lastSale.tax, settings.currency)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatCurrency(lastSale.total, settings.currency)}</span></div>
              </div>
              <p className="text-center text-xs text-slate-500 pt-2">{settings.receiptFooter}</p>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 p-4 flex gap-2">
              <Button className="flex-1" onClick={() => setShowReceipt(false)}>New Sale</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
