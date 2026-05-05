# Ahmad Collection

Premium SaaS-level eCommerce web app for **Ahmad Collection** — a Bangladesh-based natural products store.

> সুলভ মূল্যে, বিশ্বস্ততার সঙ্গে — Trusted quality at honest prices.

Built with React 19 + Vite + TypeScript + TailwindCSS + Firebase (Auth, Firestore, Storage).

## Features

- Real Firebase Auth (Email/Password + Google) — no demo logins
- Firestore-backed catalog, categories, banners, coupons, reviews
- Bangladesh payment options: bKash personal, Nagad personal, Cash on Delivery
- Configurable delivery charges (inside/outside Dhaka, free-delivery threshold)
- Order status flow: pending → confirmed → on_the_way → delivered, plus cancelled / returned
- Customer-side order actions: cancel (when pending/confirmed), mark received, request return
- Image upload to Firebase Storage (or paste URL)
- Admin Settings panel for full site configuration:
  - Delivery charges, payment numbers, admin SMS phone, admin email
  - SMS / Email webhook URLs (Zapier, Make, n8n, custom backend)
  - Meta Pixel ID, Google Analytics 4 ID
  - SEO defaults, branding, social links
- Notification queue (Firestore `notifications/`) with client-side webhook fan-out
- SEO: dynamic meta tags, JSON-LD product schema, sitemap, robots.txt
- Meta Pixel + GA4 with PageView, ViewContent, AddToCart, InitiateCheckout, Purchase events
- Bilingual (English/Bengali) UI

## Setup

```bash
nvm use 22
npm install
npm run dev
```

Build / lint:

```bash
npm run build
npm run lint
```

## Firebase configuration

Default config points at the production project `ahmad-collection-c6b0c`.
For a different project, set `VITE_FIREBASE_*` environment variables.

### Required Firebase setup steps

1. **Enable Auth providers** — Firebase Console → Authentication → Sign-in method:
   enable Email/Password and Google.
2. **Deploy security rules**:
   ```bash
   npx firebase deploy --only firestore:rules,storage:rules
   ```
3. **Create your admin user** — sign up via the site once, then promote yourself
   in Firestore Console:

   ```
   Collection: users
   Document: <your-uid>
   Set field: role = "admin"
   ```

   After this, refresh the app — you can now access `/admin`.

4. **Default site settings** — visit `/admin/settings` and configure:
   - bKash / Nagad personal numbers
   - Inside / outside Dhaka delivery charges
   - Admin SMS phone + email
   - SMS / Email webhook URLs (Zapier / Make / n8n)
   - Meta Pixel ID + GA4 ID

### SMS / Email integrations

The app does not bundle a server. Order notifications are queued to Firestore
(`notifications/`) and fanned out client-side. Three options:

#### Option A — EmailJS (recommended for email, zero-config)

1. Sign up at https://www.emailjs.com (free 200 emails/month).
2. Create an **Email Service** (Gmail / Outlook / SMTP).
3. Create an **Email Template** with these variables in the body:
   `{{to_email}}`, `{{subject}}`, `{{message}}`, `{{html}}`,
   `{{from_name}}`, `{{reply_to}}`.
4. Copy the Service ID, Template ID, and Public Key (Account → API keys).
5. Paste them into `/admin/settings → EmailJS` and click **Send test email**.

Once configured, every new order automatically sends an email to your
`adminEmail` — no Zapier or backend required.

#### Option B — Webhook (Zapier / Make / n8n)

- Configure SMS / Email webhook URLs in `/admin/settings → Notification webhooks`.
- Click **Test SMS webhook** / **Test Email webhook** to verify.
- Build a scenario in Zapier / Make / n8n that listens to the webhook and
  forwards `payload.sms` → BD SMS gateway and `payload.email` → email service.

#### Option C — Both (belt-and-suspenders)

Configure both EmailJS and webhooks; both fire on every order.

This setup keeps the codebase fully static-deployable (Vercel) without a
backend, while still giving you admin SMS + email alerts.

### Hero banners / slides

Edit slides at `/admin/banners`. You can upload images, set CTA buttons,
re-order, hide/show. Slides are stored in Firestore `banners/`.

## Deployment

This repo deploys to Vercel automatically (https://ahmad-collection.vercel.app/).

For Firebase Hosting:

```bash
npm run build
npx firebase deploy --only hosting
```
