# New Supabase project setup

Use this guide to create a **new** Supabase project and move your app (schema, Edge Functions, storage, and config) to it. After this, point the app and the proxy at the new project.

---

## 1. Create the new project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Choose your **organization**, set a **name** (e.g. `cushy-crafts`), and a **database password** (save it).
4. Pick a **region** (e.g. Singapore `ap-southeast-1` if you want to use the proxy for India).
5. Click **Create new project** and wait until it’s ready.

---

## 2. Get project details

In the new project:

1. Go to **Project Settings** (gear) → **API**.
2. Copy and keep:
   - **Project URL** (e.g. `https://xxxxxxxx.supabase.co`)
   - **Project ID** (the `xxxxxxxx` part)
   - **anon public** key (under "Project API keys")

---

## 3. Update repo config and env

From the **project root** run (replace with your values):

```bash
node scripts/setup-new-supabase.js
```

When prompted, enter:

- **Project ID** (e.g. `abcdefghijklmnop`)
- **Project URL** (e.g. `https://abcdefghijklmnop.supabase.co`)
- **Anon key** (the long JWT)

This updates:

- `.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- `supabase/config.toml` → `project_id`
- `supabase-proxy/wrangler.toml` → `SUPABASE_URL` (so the proxy points at the new project)

If you prefer to edit by hand, set those same values in those files.

---

## 4. Apply database schema and storage

In the project root:

```bash
npx supabase link --project-ref YOUR_NEW_PROJECT_ID
npx supabase db push
```

- `link` connects the CLI to your new project (use the **Project ID** from step 2).
- `db push` runs all migrations (tables, RLS, triggers, seed data, `product-images` bucket and policies).

---

## 5. Deploy Edge Functions

Still in the project root:

```bash
npx supabase functions deploy
```

This deploys `create-order`, `validate-discount`, and `bulk-operations` to the new project. The project’s own URL and keys are available to the functions automatically.

---

## 6. Redeploy the proxy (if you use it)

If you use the Supabase proxy for Jio/India:

```bash
npm run deploy:supabase-proxy
```

The proxy is already configured to use the new Supabase URL from step 3. After deploy, set in `.env`:

```env
VITE_SUPABASE_URL="https://supabase-proxy.<your-subdomain>.workers.dev"
```

Then in [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration) (replace `_` with your **new** project ID), add this redirect URL:

`https://supabase-proxy.<your-subdomain>.workers.dev/**`

---

## 7. Regenerate TypeScript types (optional)

To refresh `src/integrations/supabase/types.ts` from the new project:

```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

---

## 8. Data migration (if you had data in the old project)

The steps above give you a **new empty** database with the same schema and functions. They do **not** copy data from the old project.

To move data:

1. In the **old** project: **Database** → use the SQL editor or `pg_dump` to export data (e.g. by table).
2. In the **new** project: run the same inserts or use **Table Editor** / SQL to import.
3. For **Storage** (e.g. product images): re-upload files or use Supabase Storage API to copy objects from the old bucket to the new one.

---

## Checklist

- [ ] New project created in Supabase Dashboard  
- [ ] Project URL, Project ID, and anon key copied  
- [ ] `node scripts/setup-new-supabase.js` run (or `.env`, `config.toml`, proxy updated by hand)  
- [ ] `supabase link` and `supabase db push` run  
- [ ] `supabase functions deploy` run  
- [ ] Proxy redeployed and `.env` + Auth redirect URL updated (if using proxy)  
- [ ] App rebuilt/redeployed and tested (login, products, checkout, admin)
