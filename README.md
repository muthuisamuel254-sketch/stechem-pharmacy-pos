# Stechem Pharmacy POS

Kenya pharmacy POS with **multi-device cloud sync**, M-Pesa STK, WhatsApp OTP, biometrics.

## Multi-device shared backend

1. Free Redis at [upstash.com](https://upstash.com) → Create database
2. Copy **REST URL** + **REST TOKEN**
3. Vercel → Settings → Environment Variables:

```
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

4. Redeploy — all phones/tills share the same data.

Without these vars the app runs in **local-only** mode (per browser).

## Run

```bash
npm install
npm run dev
```

## Optional env

```
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
```
