# Mama Ejima backend (PocketBase)

PocketBase v0.40.6, a single open-source program with a built-in SQLite database.

## Run locally (Windows)

1. Download `pocketbase_0.40.6_windows_amd64.zip` from https://github.com/pocketbase/pocketbase/releases and put `pocketbase.exe` in this folder.
2. In PowerShell, from this folder:
   ```powershell
   .\pocketbase.exe migrate up
   .\pocketbase.exe superuser upsert you@example.com "a-strong-password"
   .\pocketbase.exe serve --http 127.0.0.1:8090
   ```
3. Admin dashboard (built into PocketBase): http://127.0.0.1:8090/_/

`migrate up` creates every collection, its access rules and the **placeholder** catalogue. Prices are samples only.

## Before taking orders

In the PocketBase dashboard, open **settings → store**:

- **WhatsApp number** — digits only, e.g. `27821234567`. Ordering stays closed until this is set.
- **Delivery fee** — currently a R50 placeholder. Values are in cents, so `5000` means R50.
- **Order cutoff** — 36 hours before Monday 00:00, which is Saturday 12:00.

Then go to **Settings → Mail settings** and add SMTP details so password-reset emails can be sent.

## Tests

With the server running:

```bash
node tests/backend.test.mjs
```

There are 47 checks, covering pricing, Monday-only delivery, suburbs, stock, duplicate retries, privacy between customers, carts, addresses and admin-only actions.

## Files

- `pb_migrations/` — schema, access rules and seed data
- `pb_hooks/main.pb.js` — custom routes and validation hooks
- `pb_hooks/mama.js` — business rules. These mirror `src/lib/*.ts` in the frontend, but the server copy is the one that decides
- `pb_data/` — your live database, uploads and backups. **Back this up. Never commit it.**
