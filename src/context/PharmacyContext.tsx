"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  Medicine, Batch, Sale, CartItem, PharmacySettings, User, UserRole,
  AuditLog, Notification, ReorderRequest
} from "@/types";
import {
  sampleMedicines, sampleBatches, sampleSales, defaultSettings,
  sampleUsers, sampleAuditLogs, sampleNotifications
} from "@/lib/mock-data";
import { generateId, generateReceiptNumber } from "@/lib/utils";

type PharmacyContextType = {
  currentUser: User | null;
  login: (pin: string) => boolean;
  logout: () => void;
  medicines: Medicine[];
  batches: Batch[];
  sales: Sale[];
  users: User[];
  settings: PharmacySettings;
  cart: CartItem[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  reorderRequests: ReorderRequest[];
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
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  markNotificationRead: (id: string) => void;
  createReorderRequest: (medicineId: string, suggestedQty?: number) => void;
  canManageInventory: () => boolean;
  canManageUsers: () => boolean;
  canViewAudit: () => boolean;
  canEditSales: () => boolean;
  importData: (data: {
    medicines: Medicine[];
    batches: Batch[];
    sales: Sale[];
    auditLogs?: AuditLog[];
    reorderRequests?: ReorderRequest[];
  }) => { ok: boolean; error?: string };
};

const PharmacyContext = createContext<PharmacyContextType | null>(null);
const STORAGE_KEY = "stechem-pharmacy-pos-v2";

export function PharmacyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>(sampleMedicines);
  const [batches, setBatches] = useState<Batch[]>(sampleBatches);
  const [sales, setSales] = useState<Sale[]>(sampleSales);
  const [users] = useState<User[]>(sampleUsers);
  const [settings] = useState<PharmacySettings>(defaultSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(sampleAuditLogs);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [reorderRequests, setReorderRequests] = useState<ReorderRequest[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.medicines) setMedicines(data.medicines);
        if (data.batches) setBatches(data.batches);
        if (data.sales) setSales(data.sales);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.notifications) setNotifications(data.notifications);
        if (data.reorderRequests) setReorderRequests(data.reorderRequests);
        if (data.currentUserId) {
          const u = sampleUsers.find((x) => x.id === data.currentUserId);
          if (u) setCurrentUser(u);
        }
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
        JSON.stringify({
          medicines, batches, sales, auditLogs, notifications, reorderRequests,
          currentUserId: currentUser?.id || null,
        })
      );
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, [medicines, batches, sales, auditLogs, notifications, reorderRequests, currentUser, hydrated]);

  const login = (pin: string) => {
    const user = users.find((u) => u.pin === pin && u.isActive);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const canManageInventory = () => currentUser?.role === "admin" || currentUser?.role === "manager";
  const canManageUsers = () => currentUser?.role === "admin";
  const canViewAudit = () => currentUser?.role === "admin";
  const canEditSales = () => currentUser?.role === "admin" || currentUser?.role === "manager";

  const addAuditLog = useCallback((log: Omit<AuditLog, "id" | "timestamp">) => {
    const entry: AuditLog = {
      ...log,
      id: generateId("audit-"),
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev].slice(0, 500));
    if (["sale.updated", "role.changed", "medicine.updated"].includes(log.action)) {
      const notif: Notification = {
        id: generateId("notif-"),
        title: `Audit: ${log.action}`,
        message: `${log.userName} (${log.userRole}) performed ${log.action}`,
        type: "audit",
        read: false,
        createdAt: new Date().toISOString(),
        relatedEntityType: log.entityType,
        relatedEntityId: log.entityId,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 100));
    }
  }, []);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const getStockForMedicine = useCallback(
    (medicineId: string) =>
      batches.filter((b) => b.medicineId === medicineId).reduce((sum, b) => sum + b.quantity, 0),
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
      .map((m) => ({ ...m, stock: getStockForMedicine(m.id) }))
      .filter((m) => m.stock <= m.reorderLevel)
      .sort((a, b) => a.stock - b.stock);
  }, [medicines, getStockForMedicine]);

  const todaySalesTotal = useCallback(() => {
    const today = new Date().toDateString();
    return sales.filter((s) => new Date(s.createdAt).toDateString() === today).reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const todaySalesCount = useCallback(() => {
    const today = new Date().toDateString();
    return sales.filter((s) => new Date(s.createdAt).toDateString() === today).length;
  }, [sales]);

  const createReorderRequest = (medicineId: string, suggestedQty?: number) => {
    const med = medicines.find((m) => m.id === medicineId);
    if (!med) return;
    const stock = getStockForMedicine(medicineId);
    const req: ReorderRequest = {
      id: generateId("reorder-"),
      medicineId,
      medicineName: med.name,
      currentStock: stock,
      reorderLevel: med.reorderLevel,
      suggestedQty: suggestedQty || Math.max(med.reorderLevel * 2 - stock, med.reorderLevel),
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || "System",
    };
    setReorderRequests((prev) => [req, ...prev]);
    const notif: Notification = {
      id: generateId("notif-"),
      title: "Reorder Request Created",
      message: `${med.name} is low (${stock} packs). Suggested order: ${req.suggestedQty}`,
      type: "warning",
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const addMedicine = (med: Omit<Medicine, "id" | "createdAt" | "isActive">) => {
    const newMed: Medicine = { ...med, id: generateId("med-"), isActive: true, createdAt: new Date().toISOString() };
    setMedicines((prev) => [...prev, newMed]);
    if (currentUser) {
      addAuditLog({
        action: "medicine.created",
        entityType: "medicine",
        entityId: newMed.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        after: newMed as unknown as Record<string, unknown>,
      });
    }
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    const before = medicines.find((m) => m.id === id);
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    if (currentUser && before) {
      addAuditLog({
        action: "medicine.updated",
        entityType: "medicine",
        entityId: id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        before: before as unknown as Record<string, unknown>,
        after: { ...before, ...updates } as unknown as Record<string, unknown>,
      });
    }
  };

  const addBatch = (batch: Omit<Batch, "id" | "receivedAt">) => {
    const newBatch: Batch = { ...batch, id: generateId("batch-"), receivedAt: new Date().toISOString() };
    setBatches((prev) => [...prev, newBatch]);
  };

  const adjustStock = (batchId: string, delta: number) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, quantity: Math.max(0, b.quantity + delta) } : b))
    );
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.medicineId === item.medicineId && c.batchId === item.batchId);
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
      prev.map((c) => (c.medicineId === medicineId && c.batchId === batchId ? { ...c, quantity } : c))
    );
  };

  const removeFromCart = (medicineId: string, batchId: string) => {
    setCart((prev) => prev.filter((c) => !(c.medicineId === medicineId && c.batchId === batchId)));
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
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
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
        packSize: item.packSize,
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
      cashierId: currentUser?.id,
      cashierName: currentUser?.name || "Staff",
    };

    setBatches((prev) =>
      prev.map((b) => {
        const cartItem = cart.find((c) => c.batchId === b.id);
        if (cartItem) return { ...b, quantity: b.quantity - cartItem.quantity };
        return b;
      })
    );
    setSales((prev) => [sale, ...prev]);
    clearCart();

    if (currentUser) {
      addAuditLog({
        action: "sale.created",
        entityType: "sale",
        entityId: sale.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        after: { receiptNumber: sale.receiptNumber, total: sale.total } as unknown as Record<string, unknown>,
      });
    }
    return sale;
  };

  const importData = (data: {
    medicines: Medicine[];
    batches: Batch[];
    sales: Sale[];
    auditLogs?: AuditLog[];
    reorderRequests?: ReorderRequest[];
  }): { ok: boolean; error?: string } => {
    try {
      if (!Array.isArray(data.medicines) || !Array.isArray(data.batches)) {
        return { ok: false, error: "Invalid data structure" };
      }
      setMedicines(data.medicines);
      setBatches(data.batches);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      if (Array.isArray(data.reorderRequests)) setReorderRequests(data.reorderRequests);
      clearCart();
      if (currentUser) {
        addAuditLog({
          action: "data.imported",
          entityType: "settings",
          entityId: "import",
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          after: {
            medicines: data.medicines.length,
            batches: data.batches.length,
            sales: (data.sales || []).length,
          } as unknown as Record<string, unknown>,
        });
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Import failed" };
    }
  };

  return (
    <PharmacyContext.Provider
      value={{
        currentUser, login, logout,
        medicines, batches, sales, users, settings, cart, auditLogs, notifications, reorderRequests,
        addMedicine, updateMedicine, addBatch, adjustStock,
        addToCart, updateCartQty, removeFromCart, clearCart, completeSale,
        getStockForMedicine, getBatchesForMedicine, getExpiringSoon, getLowStock,
        todaySalesTotal, todaySalesCount,
        addAuditLog, markNotificationRead, createReorderRequest,
        canManageInventory, canManageUsers, canViewAudit, canEditSales, importData,
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
