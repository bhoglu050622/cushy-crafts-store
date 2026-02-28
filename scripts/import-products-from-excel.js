#!/usr/bin/env node
/**
 * Import products from product_upload_template (1) (1).xlsx into Firestore.
 * Uses .env: VITE_FIREBASE_PROJECT_ID (and GOOGLE_APPLICATION_CREDENTIALS for service account if needed).
 *
 * Run: node scripts/import-products-from-excel.js
 * Optional: EXCEL_PATH=path/to/file.xlsx node scripts/import-products-from-excel.js
 */

import dotenv from "dotenv";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

const excelPath =
  process.env.EXCEL_PATH ||
  path.join(ROOT, "product_upload_template (1) (1).xlsx");

async function getFirestore() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    console.error("Set VITE_FIREBASE_PROJECT_ID or GCLOUD_PROJECT in .env");
    process.exit(1);
  }
  const { initializeApp, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (!getApps().length) {
    initializeApp({ projectId });
  }
  return getFirestore();
}

if (!fs.existsSync(excelPath)) {
  console.error("Excel file not found:", excelPath);
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
  return isNaN(n) ? null : n;
}

function parseBool(v) {
  if (v === undefined || v === null || v === "") return true;
  const s = String(v).toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "y";
}

async function main() {
  const db = await getFirestore();

  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames.find((n) => /product/i.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });

  if (!rows.length) {
    console.log("No rows in sheet", sheetName);
    return;
  }

  const categoriesSnap = await db.collection("categories").get();
  const categoryByKey = new Map();
  categoriesSnap.docs.forEach((d) => {
    const c = d.data();
    const key = (c.name || "").toLowerCase().trim();
    categoryByKey.set(key, d.id);
    categoryByKey.set((c.slug || "").toLowerCase(), d.id);
  });
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

    const now = new Date().toISOString();
    const productPayload = {
      name,
      slug,
      category_id: categoryId,
      design_name: (r.design_name || "").toString().trim() || null,
      base_price: basePrice,
      compare_at_price: compareAtPrice,
      description: (r.description || "").toString().trim() || null,
      short_description: (r.short_description || "").toString().trim() || null,
      fabric: (r.fabric || "").toString().trim() || null,
      dimensions: (r.dimensions || "").toString().trim() || null,
      care_instructions: (r.care_instructions || "").toString().trim() || null,
      tags: Array.isArray(r.tags) ? r.tags : (r.tags ? String(r.tags).split(/[,;]/).map((t) => t.trim()).filter(Boolean) : null),
      is_featured: parseBool(r.featured),
      is_active: parseBool(r.active),
      created_at: now,
      updated_at: now,
    };

    const productRef = await db.collection("products").add(productPayload);

    const variantPayload = {
      product_id: productRef.id,
      sku,
      color,
      size,
      price: variantPrice,
      compare_at_price: compareAtPrice,
      stock_quantity: stock,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    const variantRef = await db.collection("product_variants").add(variantPayload);

    const imageUrls = [];
    for (let j = 1; j <= 8; j++) {
      const url = (r[`image_${j}`] || r[`image ${j}`] || "").toString().trim();
      if (url && url.startsWith("http")) imageUrls.push(url);
    }
    if (imageUrls.length) {
      const batch = db.batch();
      imageUrls.forEach((url, idx) => {
        const imgRef = db.collection("product_images").doc();
        batch.set(imgRef, {
          product_id: productRef.id,
          variant_id: variantRef.id,
          url,
          alt_text: `${name} - image ${idx + 1}`,
          sort_order: idx,
          is_primary: idx === 0,
        });
      });
      await batch.commit();
    }

    created++;
  }

  console.log("Import done. Created:", created, "Skipped:", skipped, "Errors:", errors);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
