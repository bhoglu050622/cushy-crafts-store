#!/usr/bin/env node
/**
 * Import products from product_upload_template (1) (1) (1).xlsx into Firestore.
 * Uses .env: VITE_FIREBASE_PROJECT_ID (and GOOGLE_APPLICATION_CREDENTIALS for service account if needed).
 *
 * Run: node scripts/import-products-from-excel.js
 * Optional: EXCEL_PATH=path/to/file.xlsx node scripts/import-products-from-excel.js
 * Optional: SAVE_IMAGES=1 to download image URLs and save under public/product-images/ (use in-app URLs).
 * Optional: DRY_RUN=1 to only download images and write products.json (no Firestore writes; no service account needed).
 */

import dotenv from "dotenv";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

const excelPath =
  process.env.EXCEL_PATH ||
  path.join(ROOT, "product_upload_template (1) (1) (1).xlsx");
const SAVE_IMAGES = process.env.SAVE_IMAGES === "1" || process.env.SAVE_IMAGES === "true";
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const PRODUCT_IMAGES_DIR = path.join(ROOT, "public", "product-images");

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

/** Convert Google Drive share link to direct download URL. */
function toDirectImageUrl(url) {
  const u = String(url).trim();
  const driveMatch = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  return u;
}

function downloadToFile(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const client = u.protocol === "https:" ? https : http;
    client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        resolve(buf);
      });
    }).on("error", reject);
  });
}

async function ensureProductImagesDir() {
  if (!fs.existsSync(PRODUCT_IMAGES_DIR)) {
    fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
  }
}

async function main() {
  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames.find((n) => /product/i.test(n)) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });

  if (!rows.length) {
    console.log("No rows in sheet", sheetName);
    return;
  }

  if (DRY_RUN) {
    if (SAVE_IMAGES) await ensureProductImagesDir();
    const outProducts = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = (r.name || r.Name || "").toString().trim();
      if (!name) continue;
      const baseSlug = (r.slug || r.Slug || slugify(name)).toString().trim() || slugify(name);
      const slug = rows.length > 1 ? `${baseSlug}-${i}` : baseSlug;
      const imageUrls = [];
      for (let j = 1; j <= 8; j++) {
        const url = (r[`image_${j}`] || r[`image ${j}`] || "").toString().trim();
        if (url && url.startsWith("http")) imageUrls.push(toDirectImageUrl(url));
      }
      const imageRecords = [];
      for (let idx = 0; idx < imageUrls.length; idx++) {
        const url = imageUrls[idx];
        let urlToStore = url;
        if (SAVE_IMAGES) {
          try {
            const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").substring(0, 80);
            const ext = (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) || [])[1] || "jpg";
            const filename = `${safeSlug}-${idx}.${ext}`;
            const filepath = path.join(PRODUCT_IMAGES_DIR, filename);
            const buf = await downloadToFile(url);
            fs.writeFileSync(filepath, buf);
            urlToStore = `/product-images/${filename}`;
          } catch (err) {
            console.warn("Could not save image", url, err.message);
          }
        }
        imageRecords.push({ url: urlToStore, alt_text: `${name} - image ${idx + 1}`, sort_order: idx, is_primary: idx === 0 });
      }
      outProducts.push({
        name,
        slug,
        category: (r.category || r.Category || "").toString().trim(),
        design_name: (r.design_name || "").toString().trim() || null,
        base_price: parseNum(r.base_price) ?? 0,
        compare_at_price: parseNum(r.compare_price ?? r.compare_at_price) ?? null,
        description: (r.description || "").toString().trim() || null,
        short_description: (r.short_description || "").toString().trim() || null,
        fabric: (r.fabric || "").toString().trim() || null,
        dimensions: (r.dimensions || "").toString().trim() || null,
        care_instructions: (r.care_instructions || "").toString().trim() || null,
        tags: r.tags ? String(r.tags).split(/[,;]/).map((t) => t.trim()).filter(Boolean) : null,
        is_featured: i < 4 || parseBool(r.featured),
        is_active: parseBool(r.active),
        sku: (r.sku || r.SKU || `IMPORT-${slug}`).toString().trim(),
        color: (r.color || "").toString().trim() || null,
        size: (r.size || "").toString().trim() || null,
        variant_price: parseNum(r["Variant Price"] ?? r.variant_price) ?? parseNum(r.base_price) ?? 0,
        stock: parseNum(r.stock) ?? 0,
        images: imageRecords,
      });
    }
    const outPath = path.join(ROOT, "products.json");
    fs.writeFileSync(outPath, JSON.stringify(outProducts, null, 2));
    console.log("DRY_RUN: Saved", outProducts.length, "product records to", outPath);
    if (SAVE_IMAGES) console.log("Images saved under public/product-images/");
    return;
  }

  const db = await getFirestore();

  // Seed default categories if none exist
  const categoriesSnap = await db.collection("categories").get();
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
  }

  const catSnap = await db.collection("categories").get();
  const categoryByKey = new Map();
  catSnap.docs.forEach((d) => {
    const c = d.data();
    const key = (c.name || "").toLowerCase().trim();
    categoryByKey.set(key, d.id);
    categoryByKey.set((c.slug || "").toLowerCase(), d.id);
  });
  categoryByKey.set("curtain", categoryByKey.get("curtains") || null);
  categoryByKey.set("tablecloth", categoryByKey.get("table linens") || categoryByKey.get("table-linens") || null);

  let created = 0;
  let updated = 0;
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
    const productPayloadBase = {
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
      is_featured: i < 4 || parseBool(r.featured),
      is_active: parseBool(r.active),
      updated_at: now,
    };

    // Upsert product by slug to avoid duplicates
    const existingProductSnap = await db.collection("products").where("slug", "==", slug).limit(1).get();
    let productRef;
    if (!existingProductSnap.empty) {
      productRef = existingProductSnap.docs[0].ref;
      await productRef.update(productPayloadBase);
      updated++;
    } else {
      const productPayload = {
        ...productPayloadBase,
        created_at: now,
      };
      productRef = await db.collection("products").add(productPayload);
      created++;
    }

    const variantPayloadBase = {
      product_id: productRef.id,
      sku,
      color,
      size,
      price: variantPrice,
      compare_at_price: compareAtPrice,
      stock_quantity: stock,
      is_active: true,
      updated_at: now,
    };

    // Upsert variant by SKU to avoid duplicates
    const existingVariantSnap = await db.collection("product_variants").where("sku", "==", sku).limit(1).get();
    let variantRef;
    if (!existingVariantSnap.empty) {
      variantRef = existingVariantSnap.docs[0].ref;
      await variantRef.update(variantPayloadBase);
    } else {
      const variantPayload = {
        ...variantPayloadBase,
        created_at: now,
      };
      variantRef = await db.collection("product_variants").add(variantPayload);
    }

    const imageUrls = [];
    for (let j = 1; j <= 8; j++) {
      const url = (r[`image_${j}`] || r[`image ${j}`] || "").toString().trim();
      if (url && url.startsWith("http")) imageUrls.push(toDirectImageUrl(url));
    }

    if (SAVE_IMAGES && imageUrls.length) {
      await ensureProductImagesDir();
    }

    const finalImageRecords = [];
    for (let idx = 0; idx < imageUrls.length; idx++) {
      const url = imageUrls[idx];
      let urlToStore = url;
      if (SAVE_IMAGES) {
        try {
          const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").substring(0, 80);
          const ext = (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) || [])[1] || "jpg";
          const filename = `${safeSlug}-${idx}.${ext}`;
          const filepath = path.join(PRODUCT_IMAGES_DIR, filename);
          const buf = await downloadToFile(url);
          fs.writeFileSync(filepath, buf);
          urlToStore = `/product-images/${filename}`;
        } catch (err) {
          console.warn("Could not save image", url, err.message);
        }
      }
      finalImageRecords.push({
        url: urlToStore,
        alt_text: `${name} - image ${idx + 1}`,
        sort_order: idx,
        is_primary: idx === 0,
      });
    }

    if (finalImageRecords.length) {
      const batch = db.batch();
      finalImageRecords.forEach((rec) => {
        const imgRef = db.collection("product_images").doc();
        batch.set(imgRef, {
          product_id: productRef.id,
          variant_id: variantRef.id,
          url: rec.url,
          alt_text: rec.alt_text,
          sort_order: rec.sort_order,
          is_primary: rec.is_primary,
        });
      });
      await batch.commit();
    }
  }

  console.log("Import done. Created products:", created, "Updated products:", updated, "Skipped rows:", skipped, "Errors:", errors);
  if (SAVE_IMAGES) console.log("Images saved under public/product-images/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
