"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Medicine, Batch, Sale, CartItem, PharmacySettings } from "@/types";
import {
  sampleMedicines,
  sampleBatches,
  sampleSales,
  defaultSettings,
} from "@/lib/mock-data";
import { generateId, generateReceiptNumber } from "@/lib/utils";

type PharmacyContextType = {
  medicines: Medicine[];
  batches: Batch[];
  sales: Sale[];
  settings: PharmacySettings;
  cart: CartItem[];
  addMedicine: (med: Omit<Medicine, "id" | "createdAt" | "isActive">) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  addBatch: (batch: Omit<Batch, "id" | "receivedAt">) => void;
  adjustStock: (batchId: string, delta: number) => void;
  addToCart: (item: CartItem) => void;
  updateCartQty: (medicineId: string, batchId: string, quantity: number) => void;
  removeFromCart: (medicineId: string, batchId: string) => void;
  clearCart: () => void;
  completeSale: (params: {
    paymentMethod: Sale["paymentMethod"];
    discount?: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) => Sale | null;
  getStockForMedicine: (medicineId: string) => number;
  getBatchesForMedicine: (medicineId: string) => Batch[];
  getExpiringSoon: (days?: number) => (Batch & { medicineName: string })[];
  getLowStock: () => (Medicine & { stock: number })[];
  todaySalesTotal: () => number;
  todaySalesCount: () => number;
};

const PharmacyContext = createContext<PharmacyContextType | null>(null);

const STORAGE_KEY = "stechem-pharmacy-pos-v1";

export function PharmacyProvider({ children }: { children: React.ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>(sampleMedicines);
  const [batches, setBatches] = useState<Batch[]>(sampleBatches);
  const [sales, setSales] = useState<Sale[]>(sampleSales);
  const [settings] = useState<PharmacySettings>(defaultSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.medicines) setMedicines(data.medicines);
        if (data.batches) setBatches(data.batches);
        if (data.sales) setSales(data.sales);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ medicines, batches, sales })
      );
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, [medicines, batches, sales, hydrated]);

  const getStockForMedicine = useCallback(
    (medicineId: string) =>
      batches
        .filter((b) => b.medicineId === medicineId)
        .reduce((sum, b) => sum + b.quantity, 0),
    [batches]
  );

  const getBatchesForMedicine = useCallback(
    (medicineId: string) =>
      batches
        .filter((b) => b.medicineId === medicineId && b.quantity > 0)
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    [batches]
  );

  const getExpiringSoon = useCallback(
    (days = 90) => {
      const now = new Date();
      const limit = new Date();
      limit.setDate(limit.getDate() + days);
      return batches
        .filter((b) => {
          const exp = new Date(b.expiryDate);
          return exp >= now && exp <= limit && b.quantity > 0;
        })
        .map((b) => {
          const med = medicines.find((m) => m.id === b.medicineId);
          return { ...b, medicineName: med?.name || "Unknown" };
        })
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    },
    [batches, medicines]
  );

  const getLowStock = useCallback(() => {
    return medicines
      .filter((m) => m.isActive)
      .map((m) => ({
        ...m,
        stock: getStockForMedicine(m.id),
      }))
      .filter((m) => m.stock <= m.reorderLevel)
      .sort((a, b) => a.stock - b.stock);
  }, [medicines, getStockForMedicine]);

  const todaySalesTotal = useCallback(() => {
    const today = new Date().toDateString();
    return sales
      .filter((s) => new Date(s.createdAt).toDateString() === today)
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const todaySalesCount = useCallback(() => {
    const today = new Date().toDateString();
    return sales.filter((s) => new Date(s.createdAt).toDateString() === today)
      .length;
  }, [sales]);

  const addMedicine = (med: Omit<Medicine, "id" | "createdAt" | "isActive">) => {
    const newMed: Medicine = {
      ...med,
      id: generateId("med-"),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setMedicines((prev) => [...prev, newMed]);
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const addBatch = (batch: Omit<Batch, "id" | "receivedAt">) => {
    const newBatch: Batch = {
      ...batch,
      id: generateId("batch-"),
      receivedAt: new Date().toISOString(),
    };
    setBatches((prev) => [...prev, newBatch]);
  };

  const adjustStock = (batchId: string, delta: number) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? { ...b, quantity: Math.max(0, b.quantity + delta) }
          : b
      )
    );
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.medicineId === item.medicineId && c.batchId === item.batchId
      );
      if (existing) {
        return prev.map((c) =>
          c.medicineId === item.medicineId && c.batchId === item.batchId
            ? { ...c, quantity: c.quantity + item.quantity }
            : c
        );
      }
      return [...prev, item];
    });
  };

  const updateCartQty = (medicineId: string, batchId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId, batchId);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.medicineId === medicineId && c.batchId === batchId
          ? { ...c, quantity }
          : c
      )
    );
  };

  const removeFromCart = (medicineId: string, batchId: string) => {
    setCart((prev) =>
      prev.filter(
        (c) => !(c.medicineId === medicineId && c.batchId === batchId)
      )
    );
  };

  const clearCart = () => setCart([]);

  const completeSale = (params: {
    paymentMethod: Sale["paymentMethod"];
    discount?: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }): Sale | null => {
    if (cart.length === 0) return null;

    for (const item of cart) {
      const batch = batches.find((b) => b.id === item.batchId);
      if (!batch || batch.quantity < item.quantity) {
        alert(`Insufficient stock for ${item.name}`);
        return null;
      }
    }

    const subtotal = cart.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const discount = params.discount || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round((taxable * settings.taxRate) / 100);
    const total = taxable + tax;

    const sale: Sale = {
      id: generateId("sale-"),
      receiptNumber: generateReceiptNumber(),
      items: cart.map((item) => ({
        medicineId: item.medicineId,
        batchId: item.batchId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      })),
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: params.paymentMethod,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      cashier: "Admin",
    };

    setBatches((prev) =>
      prev.map((b) => {
        const cartItem = cart.find((c) => c.batchId === b.id);
        if (cartItem) {
          return { ...b, quantity: b.quantity - cartItem.quantity };
        }
        return b;
      })
    );

    setSales((prev) => [sale, ...prev]);
    clearCart();
    return sale;
  };

  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        batches,
        sales,
        settings,
        cart,
        addMedicine,
        updateMedicine,
        addBatch,
        adjustStock,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        completeSale,
        getStockForMedicine,
        getBatchesForMedicine,
        getExpiringSoon,
        getLowStock,
        todaySalesTotal,
        todaySalesCount,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error("usePharmacy must be used within PharmacyProvider");
  return ctx;
}
