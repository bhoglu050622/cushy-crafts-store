# Supabase proxy setup (Jio / India)

Follow these steps once to deploy the proxy and point your app at it.

## 1. Deploy the Worker

From the project root, run:

```bash
npm run deploy:supabase-proxy
```

If Wrangler asks you to log in, complete the browser sign-in. When deploy finishes, copy the **Published** URL (e.g. `https://supabase-proxy.<your-subdomain>.workers.dev`).

## 2. Use the proxy in the app

In your `.env` file, set `VITE_SUPABASE_URL` to the Worker URL you copied:

```env
VITE_SUPABASE_URL="https://supabase-proxy.<your-subdomain>.workers.dev"
```

Keep `VITE_SUPABASE_PUBLISHABLE_KEY` and other vars unchanged. Restart dev (`npm run dev`) or rebuild and redeploy your frontend.

## 3. Add redirect URL in Supabase Auth

1. Open your project’s **URL Configuration** in the Supabase Dashboard:
   - **Direct link:** [Authentication → URL Configuration](https://supabase.com/dashboard/project/unryliaiqdttpixikrsn/auth/url-configuration)
2. Under **Redirect URLs**, click **Add URL**.
3. Add your Worker URL with a wildcard so all auth callbacks are allowed:
   - `https://supabase-proxy.<your-subdomain>.workers.dev/**`
   (Replace `<your-subdomain>` with the subdomain from your Published URL.)
4. Save.

After this, sign-in and OAuth will work for users on Jio and other networks that block `*.supabase.co`.
