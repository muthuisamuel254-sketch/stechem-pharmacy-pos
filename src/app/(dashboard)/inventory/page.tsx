"use client";

import { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, daysUntilExpiry } from "@/lib/utils";
import { Search, Plus } from "lucide-react";

export default function InventoryPage() {
  const { medicines, settings, getStockForMedicine, getBatchesForMedicine, addMedicine, addBatch } = usePharmacy();
  const [search, setSearch] = useState("");
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [medForm, setMedForm] = useState({ name: "", genericName: "", category: "Pain Relief", unit: "tablet", sellingPrice: "", costPrice: "", reorderLevel: "50", requiresPrescription: false });
  const [batchForm, setBatchForm] = useState({ batchNumber: "", expiryDate: "", quantity: "", costPrice: "", supplier: "" });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = medicines.filter((m) => m.isActive);
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q) || m.genericName?.toLowerCase().includes(q) || m.barcode?.includes(q) || m.category.toLowerCase().includes(q));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [medicines, search]);

  const handleAddMedicine = () => {
    if (!medForm.name || !medForm.sellingPrice) return;
    addMedicine({ name: medForm.name, genericName: medForm.genericName || undefined, category: medForm.category, unit: medForm.unit, sellingPrice: Number(medForm.sellingPrice), costPrice: Number(medForm.costPrice) || 0, reorderLevel: Number(medForm.reorderLevel) || 0, requiresPrescription: medForm.requiresPrescription });
    setMedForm({ name: "", genericName: "", category: "Pain Relief", unit: "tablet", sellingPrice: "", costPrice: "", reorderLevel: "50", requiresPrescription: false });
    setShowAddMed(false);
  };

  const handleAddBatch = (medicineId: string) => {
    if (!batchForm.batchNumber || !batchForm.expiryDate || !batchForm.quantity) return;
    addBatch({ medicineId, batchNumber: batchForm.batchNumber, expiryDate: batchForm.expiryDate, quantity: Number(batchForm.quantity), costPrice: Number(batchForm.costPrice) || 0, supplier: batchForm.supplier || undefined });
    setBatchForm({ batchNumber: "", expiryDate: "", quantity: "", costPrice: "", supplier: "" });
    setShowAddBatch(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500">Manage medicines, batches and stock levels</p>
        </div>
        <Button onClick={() => setShowAddMed(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Medicine</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search medicines..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Medicine</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((med) => {
                  const stock = getStockForMedicine(med.id);
                  const medBatches = getBatchesForMedicine(med.id);
                  const isLow = stock <= med.reorderLevel;
                  const isExpanded = expanded === med.id;
                  return (
                    <>
                      <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{med.name}</p>
                            {med.genericName && <p className="text-xs text-slate-500">{med.genericName}</p>}
                            {med.requiresPrescription && <Badge variant="outline" className="mt-1 text-[10px]">Prescription</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{med.category}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(med.sellingPrice, settings.currency)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={stock === 0 ? "text-red-600 font-medium" : isLow ? "text-amber-600 font-medium" : "text-slate-900"}>
                            {stock} {med.unit}{stock !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {stock === 0 ? <Badge variant="destructive">Out of stock</Badge> : isLow ? <Badge variant="warning">Low stock</Badge> : <Badge variant="success">In stock</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setExpanded(isExpanded ? null : med.id)}>{isExpanded ? "Hide" : "Batches"}</Button>
                            <Button variant="secondary" size="sm" onClick={() => setShowAddBatch(med.id)}>+ Batch</Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${med.id}-batches`}>
                          <td colSpan={6} className="bg-slate-50 px-4 py-3">
                            {medBatches.length === 0 ? <p className="text-sm text-slate-500">No active batches</p> : (
                              <div className="space-y-2">
                                {medBatches.map((b) => {
                                  const days = daysUntilExpiry(b.expiryDate);
                                  return (
                                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                      <div>
                                        <span className="font-medium">{b.batchNumber}</span>
                                        <span className="text-slate-500 mx-2">•</span>
                                        <span className="text-slate-600">Qty: {b.quantity}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-slate-600">Exp: {formatDate(b.expiryDate)}</span>
                                        <Badge variant={days <= 30 ? "destructive" : days <= 90 ? "warning" : "secondary"}>{days}d</Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="py-12 text-center text-slate-500">No medicines found</p>}
        </CardContent>
      </Card>

      {showAddMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Add New Medicine</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="text-sm text-slate-600">Name *</label><Input value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" /></div>
              <div><label className="text-sm text-slate-600">Generic name</label><Input value={medForm.genericName} onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Category</label><Input value={medForm.category} onChange={(e) => setMedForm({ ...medForm, category: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Unit</label><Input value={medForm.unit} onChange={(e) => setMedForm({ ...medForm, unit: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Selling price *</label><Input type="number" value={medForm.sellingPrice} onChange={(e) => setMedForm({ ...medForm, sellingPrice: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Cost price</label><Input type="number" value={medForm.costPrice} onChange={(e) => setMedForm({ ...medForm, costPrice: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Reorder level</label><Input type="number" value={medForm.reorderLevel} onChange={(e) => setMedForm({ ...medForm, reorderLevel: e.target.value })} /></div>
              <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                <input type="checkbox" id="rx" checked={medForm.requiresPrescription} onChange={(e) => setMedForm({ ...medForm, requiresPrescription: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                <label htmlFor="rx" className="text-sm text-slate-700">Requires prescription</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddMed(false)}>Cancel</Button>
              <Button onClick={handleAddMedicine}>Save Medicine</Button>
            </div>
          </div>
        </div>
      )}

      {showAddBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-1">Add Stock Batch</h2>
            <p className="text-sm text-slate-500 mb-4">{medicines.find((m) => m.id === showAddBatch)?.name}</p>
            <div className="space-y-3">
              <div><label className="text-sm text-slate-600">Batch number *</label><Input value={batchForm.batchNumber} onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Expiry date *</label><Input type="date" value={batchForm.expiryDate} onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Quantity *</label><Input type="number" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Cost price</label><Input type="number" value={batchForm.costPrice} onChange={(e) => setBatchForm({ ...batchForm, costPrice: e.target.value })} /></div>
              <div><label className="text-sm text-slate-600">Supplier</label><Input value={batchForm.supplier} onChange={(e) => setBatchForm({ ...batchForm, supplier: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddBatch(null)}>Cancel</Button>
              <Button onClick={() => handleAddBatch(showAddBatch)}>Add Batch</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
