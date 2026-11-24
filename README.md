# Mama Ejima

Zimbabwean groceries in Cape Town, delivered on Mondays. An installable shopping app (PWA) with WhatsApp checkout. It runs at R0/month on free, open-source tools.

- **Frontend:** Next.js + React + TypeScript. Static export for Cloudflare Pages.
- **Backend:** PocketBase (SQLite), self-hosted, reached through Cloudflare Tunnel.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design, costs and limits.

## Status

| Stage | |
|---|---|
| 0. Architecture | ✅ |
| 1. PocketBase backend (schema, access rules, orders, stock, 47 tests) | ✅ |
| 2. Frontend connected to PocketBase, IndexedDB, Tailwind, bottom navigation, GitHub Pages deploy | ✅ |
| 3. Customer accounts UI | Next |
| 4–7. Checkout, admin, PWA/offline, hosting kit | Planned |

## Run the backend

See [backend/README.md](backend/README.md).

## Never commit

`backend/pb_data/` (your live database and uploads), `.env.local`, or the `pocketbase` binary. All of these are already in `.gitignore`.

## Live storefront (GitHub Pages)

Every push to `main` builds the storefront and publishes it to https://tamanitadiwa-coder.github.io/mamaejima/.

**One-time setup:**
1. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Once PocketBase is reachable online, go to **Settings → Secrets and variables → Actions → Variables** and add a variable named `PB_URL` (for example `https://api.yourdomain.co.za`). Then re-run the workflow.

Until `PB_URL` is set, the site shows its design and a "being set up" message instead of products.
