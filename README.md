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
| 2. Frontend connected to PocketBase, IndexedDB, Tailwind, bottom navigation | In progress — the frontend does not build yet |
| 3–7. Accounts UI, checkout, admin, PWA/offline, hosting kit | Planned |

## Run the backend

See [backend/README.md](backend/README.md).

## Never commit

`backend/pb_data/` (your live database and uploads), `.env.local`, or the `pocketbase` binary. All of these are already in `.gitignore`.
