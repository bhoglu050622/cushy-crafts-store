#!/usr/bin/env node
/**
 * Import products from products.json (from DRY_RUN of import-products-from-excel.js) into Firestore.
 * Requires: VITE_FIREBASE_PROJECT_ID in .env and GOOGLE_APPLICATION_CREDENTIALS pointing to a service account key.
 *
 * Run: node scripts/import-from-products-json.js
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

const productsPath = path.join(ROOT, "products.json");

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

if (!fs.existsSync(productsPath)) {
  console.error("products.json not found. Run: DRY_RUN=1 SAVE_IMAGES=1 node scripts/import-products-from-excel.js");
  process.exit(1);
}

async function main() {
  const db = await getFirestore();
  const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

  let categoriesSnap = await db.collection("categories").get();
  if (categoriesSnap.empty) {
    const defaults = [
      { name: "Pillow Covers", slug: "pillow-covers", sort_order: 0 },
      { name: "Curtains", slug: "curtains", sort_order: 1 },
      { name: "Table Linens", slug: "table-linens", sort_order: 2 },
      { name: "Home Textiles", slug: "home-textiles", sort_order: 3 },
    ];
    const now = new Date().toISOString();
    for (const c of defaults) {
      await db.collection("categories").add({
        ...c,
        description: null,
        image_url: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }
    console.log("Seeded", defaults.length, "categories.");
    categoriesSnap = await db.collection("categories").get();
  }

  const categoryByKey = new Map();
  categoriesSnap.docs.forEach((d) => {
    const c = d.data();
    categoryByKey.set((c.name || "").toLowerCase().trim(), d.id);
    categoryByKey.set((c.slug || "").toLowerCase(), d.id);
  });
  categoryByKey.set("curtain", categoryByKey.get("curtains") || null);

  let created = 0;
  for (const p of products) {
    const categoryId = p.category ? categoryByKey.get(p.category.toLowerCase()) || null : null;
    const now = new Date().toISOString();

    const productRef = await db.collection("products").add({
      name: p.name,
      slug: p.slug,
      category_id: categoryId,
      design_name: p.design_name,
      base_price: p.base_price,
      compare_at_price: p.compare_at_price ?? null,
      description: p.description ?? null,
      short_description: p.short_description ?? null,
      fabric: p.fabric ?? null,
      dimensions: p.dimensions ?? null,
      care_instructions: p.care_instructions ?? null,
      tags: p.tags,
      is_featured: p.is_featured ?? false,
      is_active: p.is_active !== false,
      created_at: now,
      updated_at: now,
    });

    await db.collection("product_variants").add({
      product_id: productRef.id,
      sku: p.sku || `IMPORT-${p.slug}`,
      color: p.color ?? null,
      size: p.size ?? null,
      price: p.variant_price ?? p.base_price,
      compare_at_price: p.compare_at_price ?? null,
      stock_quantity: p.stock ?? 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    if (p.images && p.images.length) {
      const batch = db.batch();
      p.images.forEach((img, idx) => {
        const imgRef = db.collection("product_images").doc();
        batch.set(imgRef, {
          product_id: productRef.id,
          variant_id: null,
          url: img.url,
          alt_text: img.alt_text || `${p.name} - image ${idx + 1}`,
          sort_order: img.sort_order ?? idx,
          is_primary: img.is_primary ?? idx === 0,
        });
      });
      await batch.commit();
    }
    created++;
  }

  console.log("Import done. Created:", created, "products.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
