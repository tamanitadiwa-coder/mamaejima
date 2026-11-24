# Mama Ejima — Architecture (revised, zero-cost)

**Monthly infrastructure cost: R0.** No Firebase, no Supabase, no paid APIs, no subscriptions, no credit card needed for anything below.

## Overview

```
 Customer's phone (installed PWA)
 ├─ Next.js static app (React + TypeScript + Tailwind)
 ├─ Service worker  → app shell, pages, images cached for offline
 └─ IndexedDB       → basket, checkout progress, cached catalogue
          │  HTTPS
          ▼
 Cloudflare Pages (free)            Cloudflare Tunnel (free)
 serves the static storefront       forwards api.<domain> to your machine
                                              │
                                              ▼
                         Your always-on machine (Windows PC / laptop / Pi)
                         └─ PocketBase (one file, open source, MIT)
                            ├─ SQLite database (pb_data/data.db)
                            ├─ Product images (pb_data/storage)
                            ├─ Customer + admin accounts
                            ├─ pb_hooks: order pricing, stock, WhatsApp message
                            └─ Built-in scheduled backups
          │
          ▼
 WhatsApp (wa.me link, free) — final order confirmation with the store
```

## Services and their limits

| Service | Cost | Card needed | Limits that matter | Fit for a real store |
|---|---|---|---|---|
| **PocketBase** (self-hosted) | Free, open source | No | Only your machine's disk, RAM and upload speed | Yes. SQLite handles a small shop's volume with ease |
| **Cloudflare Pages** (storefront) | Free plan | No | 500 builds/month, 20,000 files/site, 25 MiB per file. Bandwidth and requests unlimited | Yes |
| **Cloudflare Tunnel** (exposes PocketBase) | Free | No | Needs a domain whose DNS is on Cloudflare. No uptime guarantee (SLA) on the free plan | Yes, once you have a domain |
| **WhatsApp wa.me links** | Free | No | Customer must have WhatsApp | Yes |
| **Email for password reset** | Free options exist (e.g. a Gmail account with an app password) | No | Gmail caps daily sending | Fine at small-shop volume. Choose before launch |
| Domain (e.g. mamaejima.co.za) | Annual fee | — | — | Needs your approval before purchase |

### Rejected, and why
- **Firebase / Supabase**: excluded by your requirements.
- **PocketHost**: now paid only.
- **PocketBase Cloud free plan**: 50 MB storage, too small for product photos.
- **Oracle / Google Cloud / Fly.io free tiers**: all need a credit card.

## The honest trade-off of self-hosting

The store's **ordering, accounts and admin** only work while your machine is on and online. Load-shedding or an outage takes them offline. When that happens:
- The storefront stays up on Cloudflare Pages.
- Installed customers can still browse cached products and keep their basket.
- Checkout shows "Ordering is temporarily unavailable" and never pretends an order went through.

Mitigations: a laptop (it has a built-in battery) or a small UPS on the router and PC, PocketBase's daily backups, and a weekly copy of `pb_data/backups` to a free cloud-drive folder.

**Before the domain:** the backend can't be reached publicly. Everything is built and tested locally. For a short demo you can use a temporary TryCloudflare address, but Cloudflare says those are for testing only.

## Data model (PocketBase collections)

| Collection | Who can read | Who can write |
|---|---|---|
| `users` (customers) | The customer themselves | Self-registration. Each customer edits only their own profile |
| `categories`, `products`, `settings` | Public | Admin (superuser) only |
| `addresses` | Owner only | Owner only. Suburb must be in the delivery list |
| `carts` | Owner only | Owner only. One per customer |
| `orders` | Owner only | **Nobody directly.** Created only by `POST /api/mama/orders`. Status changed only by admin |

Admin accounts are PocketBase superusers. Customers can never reach admin routes.

## Custom server routes (`backend/pb_hooks`)

| Route | Access | Purpose |
|---|---|---|
| `POST /api/mama/basket/validate` | Public | Re-prices a basket from the database (read-only) |
| `POST /api/mama/orders` | Signed-in customer | Validates details, Cape Town suburb, open Monday, prices and stock. Reserves stock, creates the reference, builds the WhatsApp message, empties the saved basket. Runs in one transaction. Sending the same `checkoutId` again returns the same order, so a retry never duplicates it |
| `POST /api/mama/admin/orders/{id}/status` | Admin only | Changes status and releases stock on cancel |

Built-in rate limits cover sign-in, record creation and ordering.

## Customer accounts (account required to order)

- **Stay signed in.** The session is stored on the device, so customers don't sign in each time.
- **Data cleared or new phone.** The customer signs in again and the server restores:
  - their saved basket (`carts`)
  - their saved addresses
  - their full order history, with references and live status
- Password reset works once email (SMTP) is set up in PocketBase.

## Offline

- Service worker caches the app shell, pages, brand assets and product images.
- IndexedDB stores the basket, checkout progress and the last catalogue.
- Signing in, syncing the account, re-checking prices and the WhatsApp checkout all require a connection, and the app says so clearly.

## Frontend

- Next.js static export (`output: "export"`), so it needs no server and hosts free on Cloudflare Pages.
- Talks to PocketBase through the official JS SDK.
- Product and category pages use query URLs (`/product?s=slug`), so a new product added in admin needs no rebuild.
- Tailwind CSS for layout utilities, on top of the existing design tokens (ivory, charcoal, earth, bronze; serif headings; flat, no glass).
- Mobile bottom navigation: Home, Shop, Search, Basket, Account.

## Stages

| # | Stage | Status |
|---|---|---|
| 0 | Revised architecture (this document) | ✅ Done |
| 1 | PocketBase backend: schema, access rules, order and stock logic, seed data, tests | ✅ Done — 47/47 tests pass |
| 2 | Frontend migration: static export, PocketBase SDK, IndexedDB, Tailwind, bottom navigation | Next |
| 3 | Customer accounts UI: register, login, logout, reset, profile, addresses, order history | |
| 4 | Basket sync and checkout (account required) and WhatsApp handoff | |
| 5 | Admin dashboard (products and images, categories, orders, delivery dates, settings) | |
| 6 | PWA install flows and offline polish | |
| 7 | Windows hosting kit: PocketBase service, Cloudflare Tunnel, backups, launch checklist | |
