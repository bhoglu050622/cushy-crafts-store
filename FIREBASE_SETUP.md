# Firebase setup (cushy-crafts-store)

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Add a project (e.g. "cushy-crafts-store" or "Avais Decor").
3. Enable **Authentication** → Sign-in method → **Email/Password**.
4. Create **Firestore Database** (start in production mode; rules are in `firestore.rules`).
5. Create **Storage** bucket; rules are in `storage.rules`.
6. (Optional) Enable **Cloud Functions** and deploy the `functions/` folder.

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

## 5. Data migration

- Seed categories, gst_settings, shipping_rules, pincode_serviceability, and optionally products via the Firestore import script: `npm run import:products-excel` (see script and .xlsx template).
- Existing Supabase users need to sign up again unless you import Auth users (e.g. Firebase Auth import with hashes).
