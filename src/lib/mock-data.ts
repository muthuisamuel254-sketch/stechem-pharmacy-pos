import type { Medicine, Batch, Sale, PharmacySettings, User, AuditLog, Notification } from "@/types";

export const defaultSettings: PharmacySettings = {
  name: "Stechem Pharmacy",
  address: "Moi Avenue, Nairobi, Kenya",
  phone: "+254 712 345 678",
  email: "info@stechempharmacy.co.ke",
  taxRate: 16,
  currency: "KES",
  receiptFooter: "Thank you for choosing Stechem Pharmacy. Get well soon! For queries call +254 712 345 678",
  lowStockThresholdDefault: 20,
  whatsappEnabled: true,
};

export const sampleUsers: User[] = [
  {
    id: "user-admin",
    name: "System Admin",
    email: "admin@stechempharmacy.co.ke",
    role: "admin",
    pin: "0000",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "user-manager",
    name: "Jane Wanjiku",
    email: "manager@stechempharmacy.co.ke",
    role: "manager",
    pin: "1234",
    isActive: true,
    createdAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "user-staff1",
    name: "Peter Otieno",
    email: "peter@stechempharmacy.co.ke",
    role: "staff",
    pin: "5678",
    isActive: true,
    createdAt: "2025-03-01T00:00:00Z",
  },
];

export const sampleMedicines: Medicine[] = [
  { id: "med-001", name: "Paracetamol 500mg", genericName: "Paracetamol", barcode: "6001234567890", category: "Pain Relief", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 50, costPrice: 25, reorderLevel: 30, requiresPrescription: false, isActive: true, createdAt: "2025-01-10T00:00:00Z" },
  { id: "med-002", name: "Amoxicillin 250mg", genericName: "Amoxicillin", barcode: "6001234567891", category: "Antibiotics", form: "capsule", packSize: 10, packUnit: "capsule", sellingPrice: 250, costPrice: 120, reorderLevel: 20, requiresPrescription: true, isActive: true, createdAt: "2025-01-10T00:00:00Z" },
  { id: "med-003", name: "Ibuprofen 400mg", genericName: "Ibuprofen", barcode: "6001234567892", category: "Pain Relief", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 150, costPrice: 70, reorderLevel: 25, requiresPrescription: false, isActive: true, createdAt: "2025-01-12T00:00:00Z" },
  { id: "med-004", name: "Cetirizine 10mg", genericName: "Cetirizine", barcode: "6001234567893", category: "Allergy", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 200, costPrice: 90, reorderLevel: 15, requiresPrescription: false, isActive: true, createdAt: "2025-02-01T00:00:00Z" },
  { id: "med-005", name: "ORS Sachet", genericName: "Oral Rehydration Salts", barcode: "6001234567894", category: "Gastrointestinal", form: "sachet", packSize: 1, packUnit: "sachet", sellingPrice: 30, costPrice: 15, reorderLevel: 50, requiresPrescription: false, isActive: true, createdAt: "2025-02-05T00:00:00Z" },
  { id: "med-006", name: "Metformin 500mg", genericName: "Metformin", barcode: "6001234567895", category: "Diabetes", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 120, costPrice: 50, reorderLevel: 40, requiresPrescription: true, isActive: true, createdAt: "2025-02-10T00:00:00Z" },
  { id: "med-007", name: "Omeprazole 20mg", genericName: "Omeprazole", barcode: "6001234567896", category: "Gastrointestinal", form: "capsule", packSize: 10, packUnit: "capsule", sellingPrice: 350, costPrice: 180, reorderLevel: 15, requiresPrescription: false, isActive: true, createdAt: "2025-03-01T00:00:00Z" },
  { id: "med-008", name: "Vitamin C 1000mg", genericName: "Ascorbic Acid", barcode: "6001234567897", category: "Vitamins", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 100, costPrice: 40, reorderLevel: 30, requiresPrescription: false, isActive: true, createdAt: "2025-03-05T00:00:00Z" },
  { id: "med-009", name: "Cough Syrup 100ml", genericName: "Dextromethorphan", barcode: "6001234567898", category: "Respiratory", form: "syrup", packSize: 100, packUnit: "ml", sellingPrice: 180, costPrice: 90, reorderLevel: 15, requiresPrescription: false, isActive: true, createdAt: "2025-03-10T00:00:00Z" },
  { id: "med-010", name: "Amlodipine 5mg", genericName: "Amlodipine", barcode: "6001234567899", category: "Cardiovascular", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 180, costPrice: 80, reorderLevel: 20, requiresPrescription: true, isActive: true, createdAt: "2025-03-15T00:00:00Z" },
  { id: "med-011", name: "Artemether/Lumefantrine 20/120", genericName: "AL", barcode: "6001234567900", category: "Antimalarial", form: "tablet", packSize: 24, packUnit: "tablet", sellingPrice: 120, costPrice: 60, reorderLevel: 40, requiresPrescription: false, isActive: true, createdAt: "2025-04-01T00:00:00Z" },
  { id: "med-012", name: "Azithromycin 500mg", genericName: "Azithromycin", barcode: "6001234567901", category: "Antibiotics", form: "tablet", packSize: 3, packUnit: "tablet", sellingPrice: 350, costPrice: 180, reorderLevel: 20, requiresPrescription: true, isActive: true, createdAt: "2025-04-05T00:00:00Z" },
  { id: "med-013", name: "Diclofenac 50mg", genericName: "Diclofenac", barcode: "6001234567902", category: "Pain Relief", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 80, costPrice: 35, reorderLevel: 25, requiresPrescription: false, isActive: true, createdAt: "2025-04-10T00:00:00Z" },
  { id: "med-014", name: "Losartan 50mg", genericName: "Losartan", barcode: "6001234567903", category: "Cardiovascular", form: "tablet", packSize: 10, packUnit: "tablet", sellingPrice: 220, costPrice: 100, reorderLevel: 20, requiresPrescription: true, isActive: true, createdAt: "2025-04-15T00:00:00Z" },
  { id: "med-015", name: "Salbutamol Inhaler 100mcg", genericName: "Salbutamol", barcode: "6001234567904", category: "Respiratory", form: "other", packSize: 1, packUnit: "piece", sellingPrice: 450, costPrice: 250, reorderLevel: 10, requiresPrescription: true, isActive: true, createdAt: "2025-05-01T00:00:00Z" },
];

export const sampleBatches: Batch[] = [
  { id: "batch-001", medicineId: "med-001", batchNumber: "PCM-2025-A1", expiryDate: "2027-06-30", quantity: 45, costPrice: 25, supplier: "MedSupply Kenya", receivedAt: "2025-11-01T00:00:00Z" },
  { id: "batch-002", medicineId: "med-001", batchNumber: "PCM-2026-B2", expiryDate: "2026-09-15", quantity: 8, costPrice: 24, supplier: "PharmaDistributors", receivedAt: "2026-01-20T00:00:00Z" },
  { id: "batch-003", medicineId: "med-002", batchNumber: "AMX-2025-X1", expiryDate: "2026-12-31", quantity: 12, costPrice: 120, supplier: "MedSupply Kenya", receivedAt: "2025-10-15T00:00:00Z" },
  { id: "batch-004", medicineId: "med-003", batchNumber: "IBU-2025-C3", expiryDate: "2027-03-20", quantity: 20, costPrice: 70, supplier: "PharmaDistributors", receivedAt: "2025-12-01T00:00:00Z" },
  { id: "batch-005", medicineId: "med-004", batchNumber: "CET-2026-D1", expiryDate: "2026-08-20", quantity: 5, costPrice: 90, supplier: "MedSupply Kenya", receivedAt: "2026-02-10T00:00:00Z" },
  { id: "batch-006", medicineId: "med-005", batchNumber: "ORS-2026-E1", expiryDate: "2027-01-15", quantity: 90, costPrice: 15, supplier: "Local Wholesaler", receivedAt: "2026-01-05T00:00:00Z" },
  { id: "batch-007", medicineId: "med-006", batchNumber: "MET-2025-F2", expiryDate: "2026-11-30", quantity: 30, costPrice: 50, supplier: "MedSupply Kenya", receivedAt: "2025-09-20T00:00:00Z" },
  { id: "batch-008", medicineId: "med-007", batchNumber: "OME-2026-G1", expiryDate: "2027-05-10", quantity: 8, costPrice: 180, supplier: "PharmaDistributors", receivedAt: "2026-03-01T00:00:00Z" },
  { id: "batch-009", medicineId: "med-008", batchNumber: "VTC-2026-H1", expiryDate: "2026-10-05", quantity: 15, costPrice: 40, supplier: "Local Wholesaler", receivedAt: "2026-02-15T00:00:00Z" },
  { id: "batch-010", medicineId: "med-009", batchNumber: "CSY-2026-I1", expiryDate: "2026-07-30", quantity: 6, costPrice: 90, supplier: "MedSupply Kenya", receivedAt: "2026-01-25T00:00:00Z" },
  { id: "batch-011", medicineId: "med-010", batchNumber: "AML-2025-J1", expiryDate: "2027-02-28", quantity: 14, costPrice: 80, supplier: "PharmaDistributors", receivedAt: "2025-11-10T00:00:00Z" },
  { id: "batch-012", medicineId: "med-011", batchNumber: "AL-2026-K1", expiryDate: "2027-04-30", quantity: 50, costPrice: 60, supplier: "MedSupply Kenya", receivedAt: "2026-02-01T00:00:00Z" },
  { id: "batch-013", medicineId: "med-012", batchNumber: "AZI-2026-L1", expiryDate: "2027-01-15", quantity: 10, costPrice: 180, supplier: "PharmaDistributors", receivedAt: "2026-03-10T00:00:00Z" },
  { id: "batch-014", medicineId: "med-013", batchNumber: "DIC-2026-M1", expiryDate: "2027-06-01", quantity: 25, costPrice: 35, supplier: "Local Wholesaler", receivedAt: "2026-01-15T00:00:00Z" },
  { id: "batch-015", medicineId: "med-014", batchNumber: "LOS-2026-N1", expiryDate: "2027-03-20", quantity: 18, costPrice: 100, supplier: "MedSupply Kenya", receivedAt: "2026-02-20T00:00:00Z" },
];

export const sampleSales: Sale[] = [
  {
    id: "sale-001",
    receiptNumber: "STCH-260810-1001",
    items: [
      { medicineId: "med-001", batchId: "batch-001", name: "Paracetamol 500mg", quantity: 2, unitPrice: 50, subtotal: 100, packSize: 10 },
      { medicineId: "med-004", batchId: "batch-005", name: "Cetirizine 10mg", quantity: 1, unitPrice: 200, subtotal: 200, packSize: 10 },
    ],
    subtotal: 300,
    discount: 0,
    tax: 48,
    total: 348,
    paymentMethod: "cash",
    customerName: "John Kamau",
    customerPhone: "0712345678",
    createdAt: new Date().toISOString(),
    cashierId: "user-staff1",
    cashierName: "Peter Otieno",
  },
];

export const sampleAuditLogs: AuditLog[] = [];
export const sampleNotifications: Notification[] = [];
