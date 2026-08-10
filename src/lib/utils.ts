import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateId(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function generateReceiptNumber(prefix = "STCH") {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${y}${m}${d}-${rand}`;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function shareReceiptToWhatsApp(
  sale: {
    receiptNumber: string;
    total: number;
    items: { name: string; quantity: number; subtotal: number }[];
    customerPhone?: string;
    customerName?: string;
  },
  pharmacyName: string,
  currency = "KES"
) {
  const phone = (sale.customerPhone || "").replace(/\D/g, "");
  const formattedPhone = phone.startsWith("0")
    ? "254" + phone.slice(1)
    : phone.startsWith("254")
      ? phone
      : "254" + phone;

  let message = `*${pharmacyName}*\nReceipt: ${sale.receiptNumber}\n\n`;
  sale.items.forEach((item) => {
    message += `• ${item.name} x${item.quantity} = ${currency} ${item.subtotal}\n`;
  });
  message += `\n*Total: ${currency} ${sale.total}*\nThank you!`;

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

export function printReceipt() {
  window.print();
}
