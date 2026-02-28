# Data migration, Excel import, and proxy

## Next steps (done)

- **Proxy URL:** `https://supabase-proxy.amanbhogal-work.workers.dev` – already set in `.env` and in Supabase Redirect URLs.
- **Production (Hostinger):** Use the same vars as [.env.production.example](.env.production.example). Build with `npm run build` and deploy the `dist` folder to www.aavisdecor.com.
- **Supabase Auth:** Redirect URLs should include `https://www.aavisdecor.com/**` and `https://supabase-proxy.amanbhogal-work.workers.dev/**`.
- **CORS:** The proxy now allows `www.aavisdecor.com`, `aavisdecor.com`, and localhost. Run `npm run deploy:supabase-proxy` once to push the updated Worker config (then you can close the subdomain prompt with Ctrl+C if it appears again).

---

## 1. Migrate old Supabase data to the new project

If you had data in the **old** project (`unryliaiqdttpixikrsn`) and want it in the **new** project:

1. In the **old** project dashboard: **Settings → API** → copy **Project URL** and **service_role** key (keep it secret).
2. In `.env` add (use the **new** project URL and keys for the app; add these only for the migration):
   ```env
   OLD_SUPABASE_URL="https://unryliaiqdttpixikrsn.supabase.co"
   OLD_SERVICE_ROLE_KEY="<old-project-service-role-key>"
   ```
   For the **new** project, either use the anon key in `VITE_SUPABASE_PUBLISHABLE_KEY` or add:
   ```env
   SUPABASE_SERVICE_ROLE_KEY="<new-project-service-role-key>"
   ```
   (Service role bypasses RLS and is needed for bulk insert.)

3. Ensure the **new** project already has the schema (run `npx supabase db push` if you haven’t).
4. Run:
   ```bash
   npm run migrate:old-to-new
   ```
   This copies tables (categories, products, variants, images, orders, users, etc.) from old to new. **Storage** (e.g. files in `product-images`) is not copied; copy those manually via the dashboard or Storage API if needed.

---

## 2. Import products from Excel

To load products (and assets/descriptions) from `product_upload_template (1) (1).xlsx` into the **new** Supabase project:

1. Ensure the new project has schema and categories (run `npx supabase db push` if needed).
2. **Required for import:** In the **new** project dashboard go to **Settings → API**, copy the **service_role** key (secret), and add to `.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY="<paste-service-role-key-here>"
   ```
   The script needs this to bypass RLS when inserting products. Do not commit this key or use it in the frontend.
3. Run:
   ```bash
   npm run import:products-excel
   ```
   Or with a custom file:
   ```bash
   EXCEL_PATH=path/to/your.xlsx node scripts/import-products-from-excel.js
   ```

The script reads the **Products** sheet and creates:

- **products** (name, slug, category, design_name, base_price, description, short_description, fabric, dimensions, care_instructions, tags, featured, active, etc.)
- **product_variants** (sku, color, size, price, stock)
- **product_images** (image_1 … image_8 – Asset links/URLs from the sheet)

Category is matched by name/slug (e.g. "Curtain" → Curtains). Rows without a name are skipped.

---

## 3. Proxy (Jio / India)

To make the site work on networks that block Supabase (e.g. Jio):

1. Deploy the Cloudflare Worker **from your machine** (deploy requires interactive Cloudflare login):
   ```bash
   npm run deploy:supabase-proxy
   ```
   Log in to Cloudflare if prompted. Copy the **Published** URL (e.g. `https://supabase-proxy.xxxx.workers.dev`). See [.env.production.example](.env.production.example) for the exact env and Auth redirect.

2. In **production** (or for India), set in your app env:
   ```env
   VITE_SUPABASE_URL="https://supabase-proxy.<your-subdomain>.workers.dev"
   ```
   Keep `VITE_SUPABASE_PUBLISHABLE_KEY` as the **new** project’s anon key. Rebuild/redeploy the frontend.

3. In the **new** Supabase project: **Authentication → URL Configuration** → **Redirect URLs** → add:
   ```text
   https://supabase-proxy.<your-subdomain>.workers.dev/**
   ```

The proxy is already configured to use your new project URL in `supabase-proxy/wrangler.toml` (updated by `node scripts/setup-new-supabase.js` or by hand).
