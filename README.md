# Stechem Pharmacy POS

Kenya pharmacy Point of Sale & inventory system with **Upstash Redis** as the multi-device backend.

## Backend: Upstash Redis

All devices share one live dataset (medicines, batches, sales, users, settings, audit, notifications).

### 1. Create free database

1. Go to [console.upstash.com](https://console.upstash.com)
2. **Create Database** (any region close to Kenya / EU is fine)
3. Open the database → **REST API**
4. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2. Add on Vercel

Project → **Settings → Environment Variables** (Production + Preview):

```
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxxx...
```

Redeploy. After that, every phone/till using the same URL shares the same data.

Without these two variables the app still runs in **local-only** mode (each browser keeps its own data).

### How it works

| Layer | Role |
|--------|------|
| `src/lib/cloud-store.ts` | Upstash REST GET/SET of full pharmacy snapshot |
| `GET/PUT /api/sync` | Load / save shared data |
| `PharmacyContext` | On load: cloud first → localStorage fallback. On change: debounced push to Upstash |

Key in Redis: `stechem:pharmacy:v1`

## Local development

```bash
npm install
npm run dev
```

Optional: put the same two Upstash vars in `.env.local` to test multi-device against real Redis.

## Optional integrations

```
# WhatsApp Cloud API (auto OTP)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_OTP_TEMPLATE=stechem_login_otp

# M-Pesa Daraja STK
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=https://your-app.vercel.app/api/mpesa/callback
```

## Features

- Fast POS (cash / M-Pesa), barcode, FEFO batches
- Inventory with expiry & pack sizes
- Roles: Admin / Manager / Staff
- 2FA (mobile OTP via WhatsApp), WebAuthn biometrics
- Reports, shifts, suppliers, stock-take, prescriptions
- PWA, dark/light theme, KES + 16% VAT
