# Supabase proxy (Cloudflare Worker)

This Worker forwards all Supabase API traffic through a Cloudflare URL so users on networks that block `*.supabase.co` (e.g. Jio in India) can use your app without VPN or DNS changes.

## Deploy

1. **Install Wrangler** (if needed):
   ```bash
   npm install -g wrangler
   ```
   Or from the repo root: `npx wrangler deploy` (run from this directory).

2. **Log in to Cloudflare**:
   ```bash
   npx wrangler login
   ```

3. **Deploy from this directory**:
   ```bash
   cd supabase-proxy
   npx wrangler deploy
   ```

4. You’ll get a URL like `https://supabase-proxy.<your-subdomain>.workers.dev`. That is your **proxy URL**.

## Use the proxy in your app

In your app’s `.env` (or production env vars), point the Supabase client at the **proxy URL** instead of the direct Supabase URL:

```env
# Before (direct – blocked on Jio):
# VITE_SUPABASE_URL="https://unryliaiqdttpixikrsn.supabase.co"

# After (via proxy – works on Jio):
VITE_SUPABASE_URL="https://supabase-proxy.<your-subdomain>.workers.dev"
VITE_SUPABASE_PUBLISHABLE_KEY="<unchanged – same anon key>"
```

Rebuild/redeploy your frontend so it uses the new `VITE_SUPABASE_URL`. No code changes are required; the Worker forwards REST, Auth, Storage, Edge Functions, and Realtime WebSockets to your Supabase project.

**Auth redirects:** In the [Supabase Dashboard](https://supabase.com/dashboard) go to **Authentication → URL Configuration** and add your proxy URL to **Redirect URLs** (e.g. `https://supabase-proxy.<your-subdomain>.workers.dev/**`) so sign-in and OAuth callbacks work for users on blocked networks.

## Optional: custom domain

In Cloudflare Workers & Pages, add a custom domain (e.g. `api.yourstore.com`) for this Worker so your app can use `https://api.yourstore.com` as `VITE_SUPABASE_URL`.

## Optional: restrict CORS

In `wrangler.toml` or in the Worker’s dashboard (Variables), set:

```toml
[vars]
ALLOWED_ORIGINS = "https://yourstore.com,https://www.yourstore.com"
```

Then only those origins can call the proxy. Leave unset to allow any origin.
