# Stechem Pharmacy POS

Point of Sale and Inventory management system for **Stechem Pharmacy**.

## Features (MVP)

- **Dashboard** – Today's sales, low stock alerts, expiring medicines, recent transactions
- **Point of Sale** – Fast search, cart, FEFO batch selection, tax, discounts, multiple payment methods, receipt
- **Inventory** – Medicines + batches with expiry tracking, reorder levels, add stock
- **Sales History** – Full list of past sales with receipt numbers

Data is stored in the browser (`localStorage`) so it works offline and persists between sessions.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Lucide icons
- Local state + localStorage

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Go to https://vercel.com/new
2. Import this repository
3. Click Deploy

Or use the button below after connecting the repo.

## Branding

- Pharmacy name: **Stechem Pharmacy**
- Primary colour: Teal
- Currency default: KES
- Tax rate default: 16%

Change settings in `src/lib/mock-data.ts`.
