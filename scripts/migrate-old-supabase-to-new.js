#!/usr/bin/env node
/**
 * Copy data from OLD Supabase project to NEW Supabase project.
 * Set in .env (or env):
 *   OLD_SUPABASE_URL and OLD_SERVICE_ROLE_KEY (or OLD_SUPABASE_ANON_KEY) for source
 *   VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) for target (new project)
 *
 * Run: node scripts/migrate-old-supabase-to-new.js
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

const oldUrl = process.env.OLD_SUPABASE_URL;
const oldKey = process.env.OLD_SERVICE_ROLE_KEY || process.env.OLD_SUPABASE_ANON_KEY;
const newUrl = process.env.VITE_SUPABASE_URL;
const newKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!oldUrl || !oldKey || !newUrl || !newKey) {
  console.error(
    "Set OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY (or OLD_SUPABASE_ANON_KEY), and ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) are set for the new project."
  );
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Inserts into the NEW project will likely fail due to RLS. Add the new project's service_role key from Dashboard → Settings → API to .env as SUPABASE_SERVICE_ROLE_KEY."
  );
}

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

const TABLES_IN_ORDER = [
  "categories",
  "products",
  "product_variants",
  "product_images",
  "profiles",
  "user_roles",
  "addresses",
  "orders",
  "order_items",
  "payment_records",
  "gst_settings",
  "shipping_rules",
  "pincode_serviceability",
  "discounts",
  "collections",
  "collection_products",
];

async function migrateTable(table) {
  const { data, error } = await oldSupabase.from(table).select("*");
  if (error) {
    console.warn(table, "select error (may not exist):", error.message);
    return { skipped: true };
  }
  if (!data || data.length === 0) {
    console.log(table, ": no rows");
    return { count: 0 };
  }
  const conflictCols = table === "collection_products" ? "collection_id,product_id" : "id";
  const { error: insertError } = await newSupabase.from(table).upsert(data, { onConflict: conflictCols, ignoreDuplicates: false });
  if (insertError) {
    console.error(table, "insert error:", insertError.message);
    return { error: insertError.message };
  }
  console.log(table, ":", data.length, "rows");
  return { count: data.length };
}

async function main() {
  console.log("Migrating from", oldUrl, "to", newUrl);
  for (const table of TABLES_IN_ORDER) {
    await migrateTable(table);
  }
  console.log("Done. Storage (product-images bucket) must be copied separately via Dashboard or API.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
