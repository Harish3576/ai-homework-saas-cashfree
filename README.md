# AI Homework Helper (SaaS starter) + Cashfree

Ready-to-run Next.js 14 + Prisma + Cashfree checkout.

## 1) Setup

```bash
npm install
cp .env.example .env
```

Set `AUTH_SECRET` to a long random string.

## 2) Database (SQLite default)

```bash
npx prisma migrate dev --name init
```

## 3) AI Key (choose one)
Set **one** key in `.env`:

- `GROQ_API_KEY` (recommended) OR
- `OPENAI_API_KEY`

## 4) Cashfree Setup (TEST first)

In `.env` set:

- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_ENV=TEST`
- `APP_BASE_URL=http://localhost:3000`

Cashfree web checkout needs **domain whitelisting** for production. See Cashfree web checkout docs.

## 5) Run

```bash
npm run dev
```

Open: http://localhost:3000

Go to **/pricing** and click Buy Pro/Premium.

### How plan activation works
- We create a Cashfree order server-side (`/pg/orders`) and open hosted checkout using Cashfree JS SDK.
- Cashfree redirects back to:
  `/billing/return?order_id=...`
- Also Cashfree sends server webhook to:
  `/api/cashfree/webhook`
- On payment success, we upgrade the user plan for **30 days** and extend if already active.

### Webhook (Important)
In Cashfree dashboard:
- Set webhook URL: `https://YOUR_DOMAIN.com/api/cashfree/webhook`
- Enable events:
  - PAYMENT_SUCCESS_WEBHOOK
  - PAYMENT_FAILED_WEBHOOK
  - PAYMENT_USER_DROPPED_WEBHOOK

Webhook signature is verified using:
Base64Encode(HMACSHA256(timestamp + rawBody, CASHFREE_SECRET_KEY))

Docs: Cashfree webhook signature verification.

## Deploy (Vercel)
- Add all env vars in Vercel project settings.
- Set `APP_BASE_URL` to your live domain (https).
- Ensure webhook URL is publicly reachable (https).
"# ai-homework-saas-cashfree" 
