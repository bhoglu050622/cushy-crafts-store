#!/usr/bin/env node
/**
 * Backfill max_variant_price on all products.
 * For each product, computes max(variant.price) and updates the product.
 *
 * Usage:
 *   node scripts/backfill-max-variant-price.js --dry-run
 *   node scripts/backfill-max-variant-price.js --apply
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");
const dryRun = args.has("--dry-run") || !shouldApply;

async function getDb() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (!projectId) throw new Error("Missing VITE_FIREBASE_PROJECT_ID or GCLOUD_PROJECT");

  const credentialPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(ROOT, "service-account.json");

  if (credentialPath && fs.existsSync(credentialPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;
  }

  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");

  if (!getApps().length) {
    if (fs.existsSync(credentialPath)) {
      const sa = JSON.parse(fs.readFileSync(credentialPath, "utf8"));
      initializeApp({ credential: cert(sa), projectId });
    } else {
      initializeApp({ projectId });
    }
  }

  return getFirestore();
}

async function main() {
  const db = await getDb();

  const productsSnap = await db.collection("products").get();
  const variantsSnap = await db.collection("product_variants").get();

  const maxPriceByProduct = new Map();
  variantsSnap.docs.forEach((d) => {
    const v = d.data();
    const pid = v.product_id;
    if (!pid) return;
    const price = Number(v.price) || 0;
    const current = maxPriceByProduct.get(pid) ?? 0;
    maxPriceByProduct.set(pid, Math.max(current, price));
  });

  let updated = 0;
  let skipped = 0;

  for (const doc of productsSnap.docs) {
    const pid = doc.id;
    const data = doc.data();
    const maxPrice = maxPriceByProduct.get(pid) ?? Number(data.base_price) ?? 0;
    const basePrice = Number(data.base_price) ?? 0;
    const currentMax = data.max_variant_price;

    if (currentMax != null && Number(currentMax) === maxPrice) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[DRY-RUN] Would update ${pid}: max_variant_price=${maxPrice} (base_price=${basePrice})`);
      updated += 1;
      continue;
    }

    await db.collection("products").doc(pid).update({
      max_variant_price: maxPrice,
      updated_at: new Date().toISOString(),
    });
    updated += 1;
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
