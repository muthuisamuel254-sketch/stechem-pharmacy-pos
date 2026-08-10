export type Medicine = {
  id: string;
  name: string;
  genericName?: string;
  barcode?: string;
  category: string;
  unit: string;
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
  unit: string;
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
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile" | "other";
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  cashier?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
};

export type PharmacySettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
};
