#!/usr/bin/env node
/**
 * Verify Firestore inventory after import: counts and sample SKUs.
 * Requires: GOOGLE_APPLICATION_CREDENTIALS and VITE_FIREBASE_PROJECT_ID.
 *
 * Run: node scripts/verify-inventory.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

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

const SAMPLE_SKUS = ["Sigma_Blue_5FT", "Sigma_Blue_7FT", "Sigma_Blue_9FT"];

async function main() {
  const db = await getFirestore();

  const [productsSnap, variantsSnap, imagesSnap] = await Promise.all([
    db.collection("products").count().get(),
    db.collection("product_variants").count().get(),
    db.collection("product_images").count().get(),
  ]);

  const productCount = productsSnap.data().count;
  const variantCount = variantsSnap.data().count;
  const imageCount = imagesSnap.data().count;

  console.log("--- Firestore inventory ---");
  console.log("products:       ", productCount);
  console.log("product_variants:", variantCount);
  console.log("product_images: ", imageCount);

  const expectMin = 328;
  if (productCount < expectMin) {
    console.warn(`Warning: expected at least ${expectMin} products, got ${productCount}`);
  } else {
    console.log(`OK: at least ${expectMin} products`);
  }

  for (const sku of SAMPLE_SKUS) {
    const snap = await db.collection("product_variants").where("sku", "==", sku).limit(1).get();
    if (snap.empty) {
      console.warn(`SKU not found: ${sku}`);
    } else {
      const v = snap.docs[0].data();
      const productSnap = await db.collection("products").doc(v.product_id).get();
      const slug = productSnap.exists ? productSnap.data().slug : "(missing)";
      console.log(`SKU ${sku} -> product_id ${v.product_id}, slug: ${slug}`);
    }
  }

  console.log("--- done ---");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
