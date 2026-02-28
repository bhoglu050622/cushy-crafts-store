#!/usr/bin/env node
/**
 * Import products from product_upload_template (1) (1).xlsx into the linked Supabase project.
 * Uses .env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (or SUPABASE_SERVICE_ROLE_KEY for RLS bypass).
 *
 * Run: node scripts/import-products-from-excel.js
 * Optional: EXCEL_PATH=path/to/file.xlsx node scripts/import-products-from-excel.js
 */

import dotenv from "dotenv";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });
const excelPath =
  process.env.EXCEL_PATH ||
  path.join(ROOT, "product_upload_template (1) (1).xlsx");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env");
  process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === "") {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required (bypasses RLS). Get it from Supabase Dashboard → Project → Settings → API → service_role key, then add to .env");
  process.exit(1);
}

if (!fs.existsSync(excelPath)) {
  console.error("Excel file not found:", excelPath);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
  return (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 200);
}

function parseNum(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function parseBool(v) {
  if (v === undefined || v === null || v === "") return true;
  const s = String(v).toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "y";
}

async function main() {
  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames.find((n) => /product/i.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });

  if (!rows.length) {
    console.log("No rows in sheet", sheetName);
    return;
  }

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (catErr) {
    console.error("Failed to fetch categories:", catErr);
    process.exit(1);
  }
  const categoryByKey = new Map();
  for (const c of categories || []) {
    const key = c.name.toLowerCase().trim();
    categoryByKey.set(key, c.id);
    categoryByKey.set((c.slug || "").toLowerCase(), c.id);
  }
  categoryByKey.set("curtain", categoryByKey.get("curtains") || null);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = (r.name || r.Name || "").toString().trim();
    if (!name) {
      skipped++;
      continue;
    }

    const baseSlug = (r.slug || r.Slug || slugify(name)).toString().trim() || slugify(name);
    const slug = rows.length > 1 ? `${baseSlug}-${i}` : baseSlug;
    const categoryName = (r.category || r.Category || "").toString().trim();
    const categoryId = categoryName ? categoryByKey.get(categoryName.toLowerCase()) || null : null;

    const basePrice = parseNum(r.base_price) ?? 0;
    const compareAtPrice = parseNum(r.compare_price ?? r.compare_at_price) ?? null;
    const variantPrice = parseNum(r["Variant Price"] ?? r.variant_price) ?? basePrice;
    const stock = parseNum(r.stock) ?? 0;
    const sku = (r.sku || r.SKU || `IMPORT-${slug}`).toString().trim();
    const color = (r.color || "").toString().trim() || null;
    const size = (r.size || "").toString().trim() || null;

    const productPayload = {
      name,
      slug,
      category_id: categoryId,
      design_name: (r.design_name || r.design_name || "").toString().trim() || null,
      base_price: basePrice,
      compare_at_price: compareAtPrice,
      description: (r.description || "").toString().trim() || null,
      short_description: (r.short_description || "").toString().trim() || null,
      fabric: (r.fabric || "").toString().trim() || null,
      dimensions: (r.dimensions || "").toString().trim() || null,
      care_instructions: (r.care_instructions || "").toString().trim() || null,
      tags: Array.isArray(r.tags) ? r.tags : (r.tags ? String(r.tags).split(/[,;]/).map((t) => t.trim()).filter(Boolean) : null),
      is_featured: parseBool(r.featured ?? r.featured),
      is_active: parseBool(r.active ?? r.active),
    };

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(productPayload)
      .select("id")
      .single();

    if (productError) {
      console.error("Row", i + 1, "product insert error:", productError.message);
      errors++;
      continue;
    }

    const variantPayload = {
      product_id: product.id,
      sku,
      color,
      size,
      price: variantPrice,
      compare_at_price: compareAtPrice,
      stock_quantity: stock,
      is_active: true,
    };
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .insert(variantPayload)
      .select("id")
      .single();

    if (variantError) {
      console.error("Row", i + 1, "variant insert error:", variantError.message);
      errors++;
      continue;
    }

    const imageUrls = [];
    for (let j = 1; j <= 8; j++) {
      const url = (r[`image_${j}`] || r[`image ${j}`] || "").toString().trim();
      if (url && url.startsWith("http")) imageUrls.push(url);
    }
    if (imageUrls.length) {
      const imageRows = imageUrls.map((url, idx) => ({
        product_id: product.id,
        variant_id: variant.id,
        url,
        alt_text: `${name} - image ${idx + 1}`,
        sort_order: idx,
        is_primary: idx === 0,
      }));
      const { error: imgError } = await supabase.from("product_images").insert(imageRows);
      if (imgError) console.error("Row", i + 1, "images insert error:", imgError.message);
    }

    created++;
  }

  console.log("Import done. Created:", created, "Skipped:", skipped, "Errors:", errors);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
