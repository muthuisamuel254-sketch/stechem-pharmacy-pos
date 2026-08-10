export type UserRole = "admin" | "manager" | "staff";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin?: string;
  isActive: boolean;
  createdAt: string;
};

export type Medicine = {
  id: string;
  name: string;
  genericName?: string;
  barcode?: string;
  category: string;
  form: "tablet" | "capsule" | "syrup" | "injection" | "cream" | "drops" | "sachet" | "other";
  packSize: number;
  packUnit: "tablet" | "capsule" | "ml" | "g" | "sachet" | "piece";
  sellingPrice: number;
  costPrice: number;
  reorderLevel: number;
  requiresPrescription: boolean;
  description?: string;
  isActive: boolean;
  createdAt: string;
};

export type Batch = {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  supplier?: string;
  receivedAt: string;
};

export type CartItem = {
  medicineId: string;
  batchId: string;
  name: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  packSize: number;
  packUnit: string;
  expiryDate: string;
};

export type Sale = {
  id: string;
  receiptNumber: string;
  items: {
    medicineId: string;
    batchId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    packSize?: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mpesa" | "other";
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  cashierId?: string;
  cashierName?: string;
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: "sale" | "sale_item" | "role" | "medicine" | "batch" | "user" | "settings";
  entityId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: string;
  note?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "audit";
  read: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

export type PharmacySettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
  lowStockThresholdDefault: number;
  whatsappEnabled: boolean;
};

export type ReorderRequest = {
  id: string;
  medicineId: string;
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  suggestedQty: number;
  status: "pending" | "ordered" | "received" | "cancelled";
  createdAt: string;
  createdBy: string;
  notes?: string;
};
