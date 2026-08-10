"use client";

import { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Banknote,
  Smartphone,
  CheckCircle2,
  X,
  Printer,
} from "lucide-react";
import type { Sale } from "@/types";

export default function POSPage() {
  const {
    medicines,
    settings,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    completeSale,
    getStockForMedicine,
    getBatchesForMedicine,
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
    if (!q) return medicines.filter((m) => m.isActive).slice(0, 30);
    return medicines
      .filter(
        (m) =>
          m.isActive &&
          (m.name.toLowerCase().includes(q) ||
            m.genericName?.toLowerCase().includes(q) ||
            m.barcode?.includes(q) ||
            m.category.toLowerCase().includes(q))
      )
      .slice(0, 40);
  }, [medicines, search]);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round((taxable * settings.taxRate) / 100);
  const total = taxable + tax;

  const handleAdd = (medicineId: string, qty = 1) => {
    const batches = getBatchesForMedicine(medicineId);
    if (batches.length === 0) {
      alert("No stock available");
      return;
    }
    const batch = batches[0];
    const med = medicines.find((m) => m.id === medicineId)!;
    const stock = getStockForMedicine(medicineId);
    if (qty > stock) {
      alert(`Only ${stock} pack(s) in stock`);
      return;
    }
    addToCart({
      medicineId,
      batchId: batch.id,
      name: med.name,
      batchNumber: batch.batchNumber,
      quantity: qty,
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
        <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
        <p className="text-muted-foreground">Search medicines and complete sales</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              const isTabletBox = med.packUnit === "tablet" || med.packUnit === "capsule";
              return (
                <div
                  key={med.id}
                  className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition ${
                    stock === 0 ? "opacity-50" : "hover:border-teal-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{med.name}</p>
                      {med.genericName && (
                        <p className="text-xs text-muted-foreground truncate">{med.genericName}</p>
                      )}
                      {isTabletBox && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Box of {med.packSize} {med.packUnit}s
                        </p>
                      )}
                    </div>
                    {med.requiresPrescription && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Rx
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(med.sellingPrice, settings.currency)}
                      <span className="text-xs font-normal text-muted-foreground"> /pack</span>
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        stock === 0
                          ? "text-red-500"
                          : stock <= med.reorderLevel
                            ? "text-amber-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stock} pack{stock !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={stock === 0}
                      onClick={() => handleAdd(med.id, 1)}
                      className="flex-1 rounded-md bg-teal-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-40"
                    >
                      {isTabletBox ? `Full box (${med.packSize} tabs)` : "Add pack"}
                    </button>
                    {isTabletBox && stock >= 2 && (
                      <button
                        type="button"
                        onClick={() => handleAdd(med.id, 2)}
                        className="rounded-md border border-teal-600 px-2 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
                      >
                        +2 boxes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No medicines found</p>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingCart className="h-5 w-5" /> Cart ({cart.length})
                </CardTitle>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Cart is empty. Search and add medicines.
                </p>
              ) : (
                <>
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={`${item.medicineId}-${item.batchId}`}
                        className="rounded-lg border border-[var(--border)] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Batch {item.batchNumber}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.medicineId, item.batchId)}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateCartQty(item.medicineId, item.batchId, item.quantity - 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] hover:bg-muted"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateCartQty(item.medicineId, item.batchId, item.quantity + 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] hover:bg-muted"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold">
                            {formatCurrency(item.unitPrice * item.quantity, settings.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Input
                    placeholder="Customer name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone for WhatsApp receipt (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">Discount</label>
                    <Input
                      type="number"
                      min={0}
                      value={discount || ""}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1 border-t border-[var(--border)] pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal, settings.currency)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount</span>
                        <span>-{formatCurrency(discount, settings.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT ({settings.taxRate}%)</span>
                      <span>{formatCurrency(tax, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-foreground pt-1">
                      <span>Total</span>
                      <span>{formatCurrency(total, settings.currency)}</span>
                    </div>
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
                            : "border-[var(--border)] text-muted-foreground hover:bg-muted"
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
          <div className="print-receipt w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 no-print">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Sale Completed</span>
              </div>
              <button onClick={() => setShowReceipt(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{settings.name}</p>
                <p className="text-muted-foreground">{settings.address}</p>
                <p className="text-muted-foreground">{settings.phone}</p>
              </div>
              <div className="border-y border-dashed border-[var(--border)] py-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt</span>
                  <span className="font-medium">{lastSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date(lastSale.createdAt).toLocaleString()}</span>
                </div>
                {lastSale.customerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span>{lastSale.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize">
                    {lastSale.paymentMethod === "mpesa" ? "M-Pesa" : lastSale.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {lastSale.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal, settings.currency)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] pt-3 space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastSale.subtotal, settings.currency)}</span>
                </div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>-{formatCurrency(lastSale.discount, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT</span>
                  <span>{formatCurrency(lastSale.tax, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(lastSale.total, settings.currency)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground pt-2">{settings.receiptFooter}</p>
            </div>
            <div className="border-t border-[var(--border)] p-4 flex gap-2 no-print">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print receipt
              </Button>
              <Button className="flex-1" onClick={() => setShowReceipt(false)}>
                New Sale
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
