"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  Medicine, Batch, Sale, CartItem, PharmacySettings, User,
  AuditLog, Notification, ReorderRequest
} from "@/types";
import {
  sampleMedicines, sampleBatches, sampleSales, defaultSettings,
  sampleUsers, sampleAuditLogs, sampleNotifications
} from "@/lib/mock-data";
import { generateId, generateReceiptNumber } from "@/lib/utils";

type PharmacyContextType = {
  currentUser: User | null;
  login: (pin: string) => { ok: boolean; needs2FA?: boolean; userId?: string; maskedPhone?: string; error?: string };
  loginWithBiometric: () => Promise<{ ok: boolean; needs2FA?: boolean; userId?: string; maskedPhone?: string; error?: string }>;
  registerBiometric: () => Promise<{ ok: boolean; error?: string }>;
  removeBiometric: () => void;
  hasBiometricOnDevice: (userId?: string) => boolean;
  sendLoginOtp: (userId: string) => Promise<{ ok: boolean; maskedPhone?: string; phone?: string; error?: string; demoCode?: string; autoSent?: boolean; channel?: string }>;
  verify2FA: (userId: string, code: string) => boolean;
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
  updateUser: (id: string, updates: Partial<Pick<User, "name" | "role" | "pin" | "isActive" | "email" | "phone" | "twoFactorEnabled">>) => void;
  updateSettings: (updates: Partial<PharmacySettings>) => void;
  cloudSync: { enabled: boolean; status: "local" | "synced" | "syncing" | "error"; message?: string };
  pushToCloud: () => Promise<void>;
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
  const [users, setUsers] = useState<User[]>(sampleUsers);
  const [settings, setSettings] = useState<PharmacySettings>(defaultSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(sampleAuditLogs);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [reorderRequests, setReorderRequests] = useState<ReorderRequest[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const pendingOtps = React.useRef<Record<string, { code: string; expiresAt: number }>>({});
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"local" | "synced" | "syncing" | "error">("local");
  const [cloudMessage, setCloudMessage] = useState<string | undefined>();
  const skipNextCloudPush = React.useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sync", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.cloud) {
          setCloudEnabled(true);
          if (json.data) {
            const data = json.data;
            if (data.medicines) setMedicines(data.medicines);
            if (data.batches) setBatches(data.batches);
            if (data.sales) setSales(data.sales);
            if (data.auditLogs) setAuditLogs(data.auditLogs);
            if (data.notifications) setNotifications(data.notifications);
            if (data.reorderRequests) setReorderRequests(data.reorderRequests);
            if (data.users) setUsers(data.users);
            if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
            skipNextCloudPush.current = true;
            setCloudStatus("synced");
            setCloudMessage("Loaded shared data (all devices)");
            setHydrated(true);
            return;
          }
          setCloudMessage("Cloud ready — waiting for first save from any device");
        } else if (!cancelled) {
          setCloudEnabled(false);
          setCloudMessage(json.message || "Local-only mode");
        }
      } catch {
        if (!cancelled) {
          setCloudEnabled(false);
          setCloudMessage("Cloud unreachable — using this device only");
        }
      }
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
          if (data.users) setUsers(data.users);
          if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
          if (data.currentUserId) {
            const list = data.users || sampleUsers;
            const u = list.find((x: { id: string }) => x.id === data.currentUserId);
            if (u) setCurrentUser(u);
          }
        }
      } catch (e) {
        console.error("Failed to load local data", e);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const buildSnapshot = useCallback(() => ({
    version: 1,
    updatedAt: new Date().toISOString(),
    medicines, batches, sales, users, settings, auditLogs, notifications, reorderRequests,
  }), [medicines, batches, sales, users, settings, auditLogs, notifications, reorderRequests]);

  const pushToCloud = useCallback(async () => {
    if (!cloudEnabled) return;
    setCloudStatus("syncing");
    try {
      const res = await fetch("/api/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSnapshot()),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Sync failed");
      setCloudStatus("synced");
      setCloudMessage(`Synced ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      setCloudStatus("error");
      setCloudMessage(e instanceof Error ? e.message : "Sync error");
    }
  }, [cloudEnabled, buildSnapshot]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        medicines, batches, sales, auditLogs, notifications, reorderRequests, users, settings,
        currentUserId: currentUser?.id || null,
      }));
    } catch (e) {
      console.error("Failed to save data", e);
    }
    if (!cloudEnabled) return;
    if (skipNextCloudPush.current) { skipNextCloudPush.current = false; return; }
    const t = setTimeout(() => { void pushToCloud(); }, 800);
    return () => clearTimeout(t);
  }, [medicines, batches, sales, auditLogs, notifications, reorderRequests, users, settings, currentUser, hydrated, cloudEnabled, pushToCloud]);

  const maskPhone = (phone?: string) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4) return "****";
    return "*** *** " + digits.slice(-3);
  };

  const login = (pin: string) => {
    const user = users.find((u) => u.pin === pin && u.isActive);
    if (!user) return { ok: false as const };
    if (user.twoFactorEnabled) {
      if (!user.phone) return { ok: false as const, error: "2FA is on but no phone number is set for this user" };
      return { ok: true as const, needs2FA: true, userId: user.id, maskedPhone: maskPhone(user.phone) };
    }
    setCurrentUser(user);
    return { ok: true as const, needs2FA: false };
  };

  const sendLoginOtp = async (userId: string) => {
    const user = users.find((u) => u.id === userId && u.isActive);
    if (!user) return { ok: false as const, error: "User not found" };
    if (!user.phone) return { ok: false as const, error: "No phone number on account" };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pendingOtps.current[userId] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };
    let autoSent = false;
    let channel: string | undefined;
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user.phone, code, name: user.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.sent) { autoSent = true; channel = data.channel; }
    } catch { /* ignore */ }
    return { ok: true as const, maskedPhone: maskPhone(user.phone), phone: user.phone, demoCode: code, autoSent, channel };
  };

  const verify2FA = (userId: string, code: string) => {
    const user = users.find((u) => u.id === userId && u.isActive);
    if (!user) return false;
    const pending = pendingOtps.current[userId];
    if (!pending) return false;
    if (Date.now() > pending.expiresAt) { delete pendingOtps.current[userId]; return false; }
    if (code.replace(/\D/g, "") !== pending.code) return false;
    delete pendingOtps.current[userId];
    setCurrentUser(user);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const loginWithBiometric = async () => {
    const { authenticateBiometric } = await import("@/lib/webauthn");
    const result = await authenticateBiometric();
    if (!result.ok) return { ok: false as const, error: result.error };
    const user = users.find((u) => u.id === result.userId && u.isActive);
    if (!user) return { ok: false as const, error: "User not found or inactive" };
    if (user.twoFactorEnabled) {
      if (!user.phone) return { ok: false as const, error: "2FA is on but no phone number is set" };
      return { ok: true as const, needs2FA: true, userId: user.id, maskedPhone: maskPhone(user.phone) };
    }
    setCurrentUser(user);
    return { ok: true as const, needs2FA: false };
  };

  const registerBiometric = async () => {
    if (!currentUser) return { ok: false as const, error: "Not logged in" };
    const { registerBiometric: reg } = await import("@/lib/webauthn");
    const result = await reg(currentUser.id, currentUser.email || currentUser.id, currentUser.name);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const };
  };

  const removeBiometric = () => {
    if (!currentUser) return;
    import("@/lib/webauthn").then(({ removeBiometricForUser }) => removeBiometricForUser(currentUser.id));
  };

  const hasBiometricOnDevice = (userId?: string) => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem("stechem-webauthn-creds");
      if (!raw) return false;
      const list = JSON.parse(raw) as { userId: string }[];
      return userId ? list.some((c) => c.userId === userId) : list.length > 0;
    } catch { return false; }
  };

  const canManageInventory = () => currentUser?.role === "admin" || currentUser?.role === "manager";
  const canManageUsers = () => currentUser?.role === "admin";
  const canViewAudit = () => currentUser?.role === "admin";
  const canEditSales = () => currentUser?.role === "admin" || currentUser?.role === "manager";

  const addAuditLog = useCallback((log: Omit<AuditLog, "id" | "timestamp">) => {
    const entry: AuditLog = { ...log, id: generateId("audit-"), timestamp: new Date().toISOString() };
    setAuditLogs((prev) => [entry, ...prev].slice(0, 500));
  }, []);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const getStockForMedicine = useCallback(
    (medicineId: string) => batches.filter((b) => b.medicineId === medicineId).reduce((sum, b) => sum + b.quantity, 0),
    [batches]
  );

  const getBatchesForMedicine = useCallback(
    (medicineId: string) =>
      batches.filter((b) => b.medicineId === medicineId && b.quantity > 0).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    [batches]
  );

  const getExpiringSoon = useCallback((days = 90) => {
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
  }, [batches, medicines]);

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
  };

  const addMedicine = (med: Omit<Medicine, "id" | "createdAt" | "isActive">) => {
    setMedicines((prev) => [...prev, { ...med, id: generateId("med-"), isActive: true, createdAt: new Date().toISOString() }]);
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const addBatch = (batch: Omit<Batch, "id" | "receivedAt">) => {
    setBatches((prev) => [...prev, { ...batch, id: generateId("batch-"), receivedAt: new Date().toISOString() }]);
  };

  const adjustStock = (batchId: string, delta: number) => {
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, quantity: Math.max(0, b.quantity + delta) } : b)));
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

  const removeFromCart = (medicineId: string, batchId: string) => {
    setCart((prev) => prev.filter((c) => !(c.medicineId === medicineId && c.batchId === batchId)));
  };

  const updateCartQty = (medicineId: string, batchId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(medicineId, batchId); return; }
    setCart((prev) => prev.map((c) => (c.medicineId === medicineId && c.batchId === batchId ? { ...c, quantity } : c)));
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
      subtotal, discount, tax, total,
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
        return cartItem ? { ...b, quantity: b.quantity - cartItem.quantity } : b;
      })
    );
    setSales((prev) => [sale, ...prev]);
    clearCart();
    return sale;
  };

  const updateUser = (id: string, updates: Partial<Pick<User, "name" | "role" | "pin" | "isActive" | "email" | "phone" | "twoFactorEnabled">>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const updateSettings = (updates: Partial<PharmacySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const importData = (data: {
    medicines: Medicine[];
    batches: Batch[];
    sales: Sale[];
    auditLogs?: AuditLog[];
    reorderRequests?: ReorderRequest[];
  }) => {
    try {
      if (!Array.isArray(data.medicines) || !Array.isArray(data.batches)) return { ok: false as const, error: "Invalid data structure" };
      setMedicines(data.medicines);
      setBatches(data.batches);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      if (Array.isArray(data.reorderRequests)) setReorderRequests(data.reorderRequests);
      clearCart();
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Import failed" };
    }
  };

  return (
    <PharmacyContext.Provider
      value={{
        currentUser, login, loginWithBiometric, registerBiometric, removeBiometric, hasBiometricOnDevice, sendLoginOtp, verify2FA, logout,
        medicines, batches, sales, users, settings, cart, auditLogs, notifications, reorderRequests,
        addMedicine, updateMedicine, addBatch, adjustStock,
        addToCart, updateCartQty, removeFromCart, clearCart, completeSale,
        getStockForMedicine, getBatchesForMedicine, getExpiringSoon, getLowStock,
        todaySalesTotal, todaySalesCount,
        addAuditLog, markNotificationRead, createReorderRequest,
        canManageInventory, canManageUsers, canViewAudit, canEditSales, updateUser, updateSettings, importData,
        cloudSync: { enabled: cloudEnabled, status: cloudStatus, message: cloudMessage }, pushToCloud,
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
