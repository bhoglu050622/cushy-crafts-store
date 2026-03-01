# Firebase setup (cushy-crafts-store)

## Quick: Import 12 products into Firestore (after web app config is in .env)

1. **Get a service account key** (one-time):
   - Open [Firebase Console → Project settings → Service accounts](https://console.firebase.google.com/project/aavisdecor-20861/settings/serviceaccounts/adminsdk).
   - Click **Generate new private key** → save the JSON file as `service-account.json` in this project root. Do not commit it.
2. **Run the import** (uses existing `products.json` and `public/product-images/`):

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
npm run import:firestore
```

This creates 12 products, their variants, and product images in Firestore so the app and hero show real data.

---

## 0. Create project (required once)

The CLI cannot create a project until the Google account has **accepted the Terms of Service**.

1. Go to [Firebase Console](https://console.firebase.google.com) and sign in.
2. If prompted, accept the **Google Cloud / Firebase Terms of Service**.
3. Click **Add project** (or **Create a project**). Choose a **Project ID** (e.g. `cushy-crafts-store` or `cushy-crafts-aavis`). Complete the wizard.
4. In your terminal, link the project and deploy everything:

```bash
firebase use YOUR_PROJECT_ID
npm run deploy:firebase
```

(`YOUR_PROJECT_ID` is the value you chose in step 3, e.g. `cushy-crafts-aavis`.)

## 1. Enable services in the project

In [Firebase Console](https://console.firebase.google.com) → your project:

1. **Authentication** → Sign-in method → enable **Email/Password**.
2. **Firestore Database** → Create database (production mode; rules are deployed from `firestore.rules`).
3. **Storage** → Get started; rules are deployed from `storage.rules`.
4. **Cloud Functions** are deployed via `npm run deploy:firebase` (no need to enable in console first).

## 2. Get config and env

1. Project settings → General → Your apps → Add web app (or use existing).
2. Copy the config object and set in `.env`:

```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

## 2b. Production deploy (Hostinger / aavisdecor.com)

For the **live site** to load categories and products from Firestore (and to avoid `auth/invalid-api-key`):

1. **Build must have Firebase config**  
   Vite loads `.env.production` when you run `npm run build`. Ensure the build runs from the repo root so `.env.production` exists, or set the same six `VITE_FIREBASE_*` variables in your host’s build environment (e.g. Hostinger dashboard) so the built bundle gets valid config.

2. **Firebase authorized domains**  
   In [Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/aavisdecor-20861/authentication/settings), add:
   - `aavisdecor.com`
   - `www.aavisdecor.com`  
   Otherwise auth and Firestore may be blocked on the live site.

## 3. Deploy rules and functions

```bash
# Login (once)
npx firebase login

# Link project (if not already)
npx firebase use your-project-id

# Deploy Firestore rules and indexes
npx firebase deploy --only firestore

# Deploy Storage rules
npx firebase deploy --only storage

# Deploy Cloud Functions (validateDiscount, createOrder, bulkOperations)
cd functions && npm install && cd .. && npx firebase deploy --only functions
```

Or from repo root:

```bash
npm run deploy:firebase
```

(Add `--only firestore,storage,functions` to deploy only those.)

## 4. Admin role (custom claims)

Admin checks use `request.auth.token.role == 'admin'`. Set this via a one-off script or Admin SDK (e.g. in a secured Cloud Function or local Node script with a service account key). Example (run once, with Firebase Admin SDK):

```js
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'your-project-id' });
await admin.auth().setCustomUserClaims('USER_UID_HERE', { role: 'admin' });
```

## 5. Data migration / product import

### Option A: Import from Excel (with service account)

1. In Firebase Console → Project settings → **Service accounts** → **Generate new private key**. Save the JSON file (e.g. `service-account.json`) in the project root and **do not commit it**.
2. Set the env and run the import (downloads images to `public/product-images/` and writes to Firestore):

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
SAVE_IMAGES=1 npm run import:products-excel
```

### Option B: Use saved images + products.json (no Firestore write yet)

If you already ran a dry run and have `public/product-images/` and `products.json`:

1. To push those products into Firestore, add a **service account key** (see Option A step 1).
2. Then run:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
node scripts/import-from-products-json.js
```

To (re)generate `products.json` and download images from the Excel **without** writing to Firestore:

```bash
DRY_RUN=1 SAVE_IMAGES=1 node scripts/import-products-from-excel.js
```

- Seed categories, gst_settings, shipping_rules, pincode_serviceability as needed.
- Existing Supabase users need to sign up again unless you import Auth users (e.g. Firebase Auth import with hashes).
