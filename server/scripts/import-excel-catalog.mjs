#!/usr/bin/env node
/**
 * Import catalog rows from the repo Excel template into PostgreSQL (same columns as
 * scripts/import-products-from-excel.js for Firestore).
 *
 * Prerequisite: DATABASE_URL, schema migrated (npm run db:migrate).
 * Default file (repo root): product_upload_template (1) (1) (2).xlsx
 *
 *   cd server && node scripts/import-excel-catalog.mjs
 *   EXCEL_PATH=/path/to/file.xlsx node scripts/import-excel-catalog.mjs
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import postgres from "postgres";
import { nanoid } from "nanoid";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(REPO_ROOT, ".env") });
dotenv.config({ path: path.join(SERVER_ROOT, ".env") });

const excelPath =
  process.env.EXCEL_PATH ||
  path.join(REPO_ROOT, "product_upload_template (1) (1) (2).xlsx");

if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL (e.g. in repo .env or server/.env)");
  process.exit(1);
}

if (!fs.existsSync(excelPath)) {
  console.error("Excel not found:", excelPath);
  process.exit(1);
}

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
  return Number.isNaN(n) ? null : n;
}

function parseBool(v) {
  if (v === undefined || v === null || v === "") return true;
  const s = String(v).toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "y";
}

function toDirectImageUrl(url) {
  const u = String(url).trim();
  const driveMatch = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  return u;
}

async function ensureDefaultCategories(sql, now) {
  const rows = await sql`SELECT id, name, slug FROM categories`;
  if (rows.length > 0) return rows;
  const defaults = [
    { name: "Pillow Covers", slug: "pillow-covers", sort_order: 0 },
    { name: "Curtains", slug: "curtains", sort_order: 1 },
    { name: "Table Linens", slug: "table-linens", sort_order: 2 },
    { name: "Home Textiles", slug: "home-textiles", sort_order: 3 },
  ];
  for (const c of defaults) {
    const id = nanoid();
    await sql`
      INSERT INTO categories (id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at)
      VALUES (${id}, ${c.name}, ${c.slug}, ${null}, ${null}, ${true}, ${c.sort_order}, ${now}, ${now})
    `;
  }
  return await sql`SELECT id, name, slug FROM categories`;
}

function categoryMapFromRows(catRows) {
  const m = new Map();
  for (const r of catRows) {
    m.set(String(r.name || "").toLowerCase().trim(), r.id);
    m.set(String(r.slug || "").toLowerCase(), r.id);
  }
  m.set("curtain", m.get("curtains") || null);
  m.set("tablecloth", m.get("table linens") || m.get("table-linens") || null);
  return m;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const now = new Date().toISOString();

  try {
    const wb = XLSX.readFile(excelPath);
    const sheetName =
      wb.SheetNames.find((n) => /product/i.test(n)) || wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
    if (!rows.length) {
      console.log("No rows in sheet:", sheetName);
      return;
    }

    const catRows = await ensureDefaultCategories(sql, now);
    const categoryByKey = categoryMapFromRows(catRows);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = (r.name || r.Name || "").toString().trim();
      if (!name) {
        skipped++;
        continue;
      }

      const baseSlug =
        (r.slug || r.Slug || slugify(name)).toString().trim() || slugify(name);
      const slug = rows.length > 1 ? `${baseSlug}-${i}` : baseSlug;
      const categoryName = (r.category || r.Category || "").toString().trim();
      const categoryId = categoryName
        ? categoryByKey.get(categoryName.toLowerCase()) || null
        : null;

      const basePrice = parseNum(r.base_price) ?? 0;
      const compareAtPrice = parseNum(r.compare_price ?? r.compare_at_price) ?? null;
      const variantPrice =
        parseNum(r["Variant Price"] ?? r.variant_price) ?? basePrice;
      const stock = parseNum(r.stock) ?? 0;
      const sku = (r.sku || r.SKU || `IMPORT-${slug}`).toString().trim();
      const color = (r.color || "").toString().trim() || null;
      const size = (r.size || "").toString().trim() || null;

      const tagsRaw = r.tags
        ? String(r.tags)
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const tagsSql = tagsRaw.length ? sql.array(tagsRaw) : null;

      const gstRate = parseNum(r.gst_rate ?? r.GST);

      let productRows = await sql`
        SELECT id FROM products WHERE slug = ${slug} LIMIT 1
      `;
      let productId;

      if (productRows.length) {
        productId = productRows[0].id;
        await sql`
          UPDATE products SET
            category_id = ${categoryId},
            name = ${name},
            description = ${(r.description || "").toString().trim() || null},
            short_description = ${(r.short_description || "").toString().trim() || null},
            design_name = ${(r.design_name || "").toString().trim() || null},
            base_price = ${String(basePrice)},
            compare_at_price = ${compareAtPrice != null ? String(compareAtPrice) : null},
            gst_rate = ${gstRate != null ? String(gstRate) : null},
            fabric = ${(r.fabric || "").toString().trim() || null},
            dimensions = ${(r.dimensions || "").toString().trim() || null},
            care_instructions = ${(r.care_instructions || "").toString().trim() || null},
            tags = ${tagsSql},
            is_featured = ${i < 4 || parseBool(r.featured)},
            is_active = ${parseBool(r.active)},
            updated_at = ${now}
          WHERE id = ${productId}
        `;
        updated++;
      } else {
        productId = nanoid();
        await sql`
          INSERT INTO products (
            id, category_id, name, slug, description, short_description, design_name,
            base_price, compare_at_price, gst_rate, fabric, dimensions, care_instructions,
            tags, is_featured, is_active, created_at, updated_at
          ) VALUES (
            ${productId},
            ${categoryId},
            ${name},
            ${slug},
            ${(r.description || "").toString().trim() || null},
            ${(r.short_description || "").toString().trim() || null},
            ${(r.design_name || "").toString().trim() || null},
            ${String(basePrice)},
            ${compareAtPrice != null ? String(compareAtPrice) : null},
            ${gstRate != null ? String(gstRate) : null},
            ${(r.fabric || "").toString().trim() || null},
            ${(r.dimensions || "").toString().trim() || null},
            ${(r.care_instructions || "").toString().trim() || null},
            ${tagsSql},
            ${i < 4 || parseBool(r.featured)},
            ${parseBool(r.active)},
            ${now},
            ${now}
          )
        `;
        created++;
      }

      const variantRows = await sql`
        SELECT id, product_id FROM product_variants WHERE sku = ${sku} LIMIT 1
      `;
      let variantId;
      if (variantRows.length) {
        variantId = variantRows[0].id;
        await sql`
          UPDATE product_variants SET
            product_id = ${productId},
            color = ${color},
            size = ${size},
            price = ${String(variantPrice)},
            compare_at_price = ${compareAtPrice != null ? String(compareAtPrice) : null},
            stock_quantity = ${stock},
            is_active = ${true},
            updated_at = ${now}
          WHERE id = ${variantId}
        `;
      } else {
        variantId = nanoid();
        await sql`
          INSERT INTO product_variants (
            id, product_id, sku, color, size, price, compare_at_price, stock_quantity, is_active, created_at, updated_at
          ) VALUES (
            ${variantId},
            ${productId},
            ${sku},
            ${color},
            ${size},
            ${String(variantPrice)},
            ${compareAtPrice != null ? String(compareAtPrice) : null},
            ${stock},
            ${true},
            ${now},
            ${now}
          )
        `;
      }

      const imageUrls = [];
      for (let j = 1; j <= 8; j++) {
        const url = (r[`image_${j}`] || r[`image ${j}`] || "").toString().trim();
        if (url && url.startsWith("http")) imageUrls.push(toDirectImageUrl(url));
      }

      await sql`DELETE FROM product_images WHERE product_id = ${productId}`;

      for (let idx = 0; idx < imageUrls.length; idx++) {
        const imgId = nanoid();
        await sql`
          INSERT INTO product_images (id, product_id, variant_id, url, alt_text, sort_order, is_primary, created_at)
          VALUES (
            ${imgId},
            ${productId},
            ${variantId},
            ${imageUrls[idx]},
            ${`${name} - image ${idx + 1}`},
            ${idx},
            ${idx === 0},
            ${now}
          )
        `;
      }

      const maxP = await sql`
        SELECT MAX(price::numeric) AS m FROM product_variants WHERE product_id = ${productId}
      `;
      const maxVal = maxP[0]?.m;
      if (maxVal != null) {
        await sql`
          UPDATE products SET max_variant_price = ${String(maxVal)} WHERE id = ${productId}
        `;
      }
    }

    console.log(
      "Postgres catalog import done. Created:",
      created,
      "Updated:",
      updated,
      "Skipped:",
      skipped,
      "— sheet:",
      sheetName
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
