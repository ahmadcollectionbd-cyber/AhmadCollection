---
name: testing-storefront
description: Live end-to-end testing for the Ahmad Collection eCommerce storefront. Use when verifying hero-slider, navbar/logo, admin login, language toggle, dark mode, cart, or any home/shop UI change on the live Firebase Hosting deploy.
---

# Testing — Ahmad Collection storefront

## Live URLs

- **Production (Firebase Hosting, public, no SSO):** https://ahmad-collection-c6b0c.web.app
- **Vercel preview (SSO-gated unless disabled):** https://ahmad-collection.vercel.app — only useful if the user has explicitly disabled "Vercel Authentication" in https://vercel.com/ahmadcollectionbd-cybers-projects/ahmad-collection/settings/security. Default to the Firebase URL.
- **GitHub repo:** https://github.com/ahmadcollectionbd-cyber/AhmadCollection (production branch is `baseline`, not `main`).

## Demo credentials

- **Admin login:** `ahmadcollection.bd@gmail.com` + any password ≥ 6 chars (e.g. `AdminPass123`). The Login page short-circuits this email to `loginAsAdmin()` regardless of the password — no real Firebase Auth round-trip.
- **Customer login:** any other email + any 6+ char password lands on `/account` as a regular user.
- **Guest checkout:** "Continue as Guest" link on `/login`.

## Hero slider — DOM selectors and expected heights

The slider uses Swiper. Key facts:

- Active slide root: `.swiper-slide-active > div`
- Pagination dots: bottom-center of the slider, around y≈342 on a 768-tall viewport
- 4 banners are mapped to fixed slide IDs: `b-1` mustard, `b-3` khejur gur, `b-4` mango, `b-5` dates+attar
- Per-breakpoint slide height (PR-3, fixed `h-[…]` classes — NOT aspect-ratio):
  - `width < 640` → 440 px (mobile, stacked layout)
  - `640 ≤ width < 768` → 340 px (sm)
  - `768 ≤ width < 1024` → 360 px (md)
  - `width ≥ 1024` → 380 px (lg)
- The "Shop by Category" heading should be visible above the fold without scrolling on a 768-tall window.

**Console snippet to assert all of the above in one shot:**

```js
JSON.stringify({
  w: window.innerWidth,
  h: document.querySelector('.swiper-slide-active > div')?.getBoundingClientRect().height,
  navLogo: document.querySelector('header img[alt*="Ahmad"]')?.src.split('/').pop(),
  faviconHref: document.querySelector('link[rel="icon"][type="image/x-icon"]')?.href.split('/').pop(),
  title: document.title,
})
// Expected at lg: {"w":1045,"h":380,"navLogo":"logo.png","faviconHref":"favicon.ico","title":"Ahmad Collection — Premium Natural Products in Bangladesh"}
```

## Regression smoke checklist

Always run after any home/shop/auth change (takes ~90 seconds end-to-end):

1. Hard-refresh the home page (`Ctrl+Shift+R`) to bypass Hosting CDN cache.
2. Cycle all 4 slides via pagination dots; confirm each shows distinct photo + Bengali title + seal.
3. Click `EN / বাং` toggle (top-right of navbar) → navbar items become Bengali (`হোম / শপ / অর্ডার ট্র্যাক`).
4. Click sun/moon icon → background becomes slate-950, hero stays readable.
5. Open any product, click `Add` → cart badge increments, `/cart` lists the item with the right price.
6. `/login` with the admin email → `/admin` dashboard renders with sidebar + KPI cards.

## Firebase deploy gotchas

The project is `ahmad-collection-c6b0c`. Deployment uses a service-account JSON stored at `~/.firebase-credentials/sa.json` (chmod 600, NEVER commit it).

Deploy command:

```bash
GOOGLE_APPLICATION_CREDENTIALS=~/.firebase-credentials/sa.json \
  firebase deploy --only hosting --project ahmad-collection-c6b0c
```

**Rules deploy fails with 403 by default.** The bundled service account does NOT have the `roles/serviceusage.serviceUsageAdmin` IAM role, so `firebase deploy --only firestore:rules,storage` cannot enable the Firestore / Cloud Storage APIs the first time. Workaround: ask the user to enable both APIs once in the Firebase console:

- Firestore: https://console.firebase.google.com/project/ahmad-collection-c6b0c/firestore ("Create database", Native mode, asia-south1)
- Storage:  https://console.firebase.google.com/project/ahmad-collection-c6b0c/storage ("Get started")

After the user does that, the same deploy command will succeed for `firestore:rules` and `storage`.

## Recording tips

This app is GUI-heavy — always record a walkthrough when testing UI changes. Before recording, maximise Chrome:

```bash
sudo apt-get install -y wmctrl 2>/dev/null
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```

Do NOT use `xdotool key super+Up` — it half-tiles instead of maximising on the Devin desktop's window manager.

Annotate the recording with one `setup` (live URL), one `test_start` per assertion group, and one consolidated `assertion` per group.

## Devin Secrets Needed

- `FIREBASE_SERVICE_ACCOUNT_JSON` — the user-provided `firebase-adminsdk-*.json` for project `ahmad-collection-c6b0c`. Stored in-session at `~/.firebase-credentials/sa.json` (chmod 600). Used only for `firebase deploy`. Do NOT commit it.

## Out of scope for this skill

- Real Firebase Auth flows (email/password sign-up, Google OAuth) — the demo admin path is a localStorage shim, not a real auth round-trip.
- Real bKash / Nagad payment integration — checkout currently records the order in Firestore but doesn't talk to a payment gateway.
