

# Production-Ready eCommerce Upgrade Plan

## Gap Analysis: Current State vs Requirements

The existing codebase has a solid foundation but several critical gaps need to be addressed for a production-ready, Shopify-grade store:

| Requirement | Current State | Status |
|---|---|---|
| Server-side pagination (10k+ SKUs) | Loads ALL products at once | MISSING |
| Atomic inventory decrement | No inventory logic at checkout | MISSING |
| Discounts / Coupon codes | No table or logic | MISSING |
| Collections (manual + rule-based) | Only categories exist | MISSING |
| Bulk CSV import | No implementation | MISSING |
| Bulk price/inventory/tag update | No implementation | MISSING |
| Razorpay integration | Scaffolded but no edge functions | MISSING |
| Order tracking (AWB / Shiprocket) | No tracking_number field on orders | MISSING |
| Fabric/dimensions/care fields | Not on products table | MISSING |
| Availability filter | No filter for in-stock | MISSING |
| Fabric filter | No fabric field | MISSING |
| Product status (active/draft) | Exists (is_active) | OK |
| Admin order CSV export | Not implemented | MISSING |
| Price manipulation prevention | No server-side price check | MISSING |
| Storage bucket for images | No bucket created | MISSING |
| Admin variant management UI | Not in product form | MISSING |
| SKU search in admin | Client-side only | PARTIAL |

---

## Implementation Phases

### Phase 1: Schema Upgrades (Database Migration)

Add missing columns and tables to support all requirements.

**Products table -- add columns:**
- `fabric` (text, nullable) -- e.g., "Cotton", "Silk Blend"
- `dimensions` (text, nullable) -- e.g., "16x16 inches"
- `care_instructions` (text, nullable)
- `status` (text, default 'active') -- 'active' or 'draft', replaces is_active for clarity

**Orders table -- add columns:**
- `tracking_number` (text, nullable) -- AWB number
- `tracking_url` (text, nullable) -- Shiprocket/courier link
- `fulfillment_status` (text, default 'unfulfilled') -- unfulfilled, fulfilled, partially_fulfilled

**New table: `discounts`**
- `id` (uuid, PK)
- `code` (text, unique, indexed)
- `type` ('percentage' or 'fixed')
- `value` (numeric)
- `min_cart_value` (numeric, nullable)
- `expires_at` (timestamptz, nullable)
- `is_active` (boolean, default true)
- `usage_count` (integer, default 0)
- `max_uses` (integer, nullable)
- `created_at`, `updated_at`
- RLS: Admin full access, public read for validation

**New table: `collections`**
- `id` (uuid, PK)
- `title` (text)
- `slug` (text, unique)
- `description` (text, nullable)
- `image_url` (text, nullable)
- `type` ('manual' or 'automatic')
- `rules` (jsonb, nullable) -- for automatic: tag-based rules
- `is_active` (boolean, default true)
- `sort_order` (integer, default 0)
- `created_at`, `updated_at`
- RLS: Admin manage, public read active

**New table: `collection_products`** (join table for manual collections)
- `collection_id` (uuid, FK)
- `product_id` (uuid, FK)
- `sort_order` (integer, default 0)
- PK: (collection_id, product_id)

**Add orders.discount_code and orders.discount_amount columns.**

**Database function: `decrement_inventory`**
- Atomically decrements stock using `UPDATE ... SET stock_quantity = stock_quantity - $qty WHERE stock_quantity >= $qty`
- Returns success/failure to prevent overselling

**Database indexes:**
- `idx_product_variants_sku` on `product_variants(sku)`
- `idx_products_slug` on `products(slug)`
- `idx_products_category_id` on `products(category_id)`
- `idx_products_tags` GIN index on `products(tags)`
- `idx_discounts_code` on `discounts(code)`

---

### Phase 2: Server-Side Pagination and Filters

Rewrite `useProducts` hook to support cursor/offset pagination with server-side filtering.

**Updated `useProducts` hook:**
- Accept params: `page`, `pageSize` (default 20), `categorySlug`, `colors[]`, `sizes[]`, `fabric`, `priceMin`, `priceMax`, `inStockOnly`, `sortBy`
- Use Supabase `.range(from, to)` for pagination
- Return `{ products, totalCount, totalPages, currentPage }`
- Filters applied via `.eq()`, `.in()`, `.gte()`, `.lte()` on the query
- For color/size filters: use a database function or filtered variant join

**Updated Category page:**
- Add "Fabric" and "In Stock" filter options
- Pagination controls (Previous / Next / page numbers)
- URL-synced filter state via query params

---

### Phase 3: Atomic Inventory and Checkout Security

**Edge function: `create-order`**
- Receives cart items, shipping address, payment method, discount code
- Server-side price verification (fetches actual prices from DB)
- Calls `decrement_inventory` for each item atomically
- If any item fails (oversold), rolls back and returns error
- Creates order + order_items
- Returns order ID

**Edge function: `validate-discount`**
- Validates coupon code, checks expiry, min cart value, usage limits
- Returns discount amount

**Update Checkout.tsx:**
- Call `create-order` edge function instead of direct Supabase insert
- Add discount code input field
- Show discount breakdown in order summary

---

### Phase 4: Razorpay Integration

**Edge function: `create-razorpay-order`**
- Creates Razorpay order with verified amount from DB
- Stores `razorpay_order_id` in payment_records
- Returns order_id + razorpay credentials to frontend

**Edge function: `verify-razorpay-payment`**
- Verifies signature using HMAC SHA256
- Updates payment_records and order status
- Only decrements inventory after payment verification (for prepaid)

**Frontend:**
- Load Razorpay checkout.js script
- Open payment modal on "Pay Now"
- Handle success/failure callbacks
- Redirect to order confirmation

**Required secrets:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

---

### Phase 5: Admin Dashboard Upgrades

**Product Management:**
- Inline variant management (add/edit/delete variants per product)
- Category selector dropdown
- Tags input (comma-separated, stored as array)
- Fabric, dimensions, care instructions fields
- Image upload to storage bucket
- SKU search across variants
- Product status toggle (active/draft)

**Bulk Operations (Edge function: `bulk-operations`):**
- CSV import: Parse CSV, validate, upsert products + variants
- Bulk price update: Select products, set new price/percentage change
- Bulk inventory update: Update stock quantities
- Bulk tag update: Add/remove tags from selected products

**Order Management:**
- Filters: payment status, fulfillment status, COD vs prepaid
- Add tracking number + URL per order
- Update fulfillment status
- CSV export of filtered orders

**Collections Management (new admin page):**
- Create manual collections (select products)
- Create automatic collections (define tag rules)
- Preview matching products for automatic rules

**Discounts Management (new admin page):**
- CRUD for coupon codes
- Set type (percentage/fixed), value, min cart, expiry
- Enable/disable toggle
- Usage statistics

**Customers page (new admin page):**
- List all customers (from profiles + user_roles)
- View order history per customer

---

### Phase 6: Storefront Enhancements

**Product Detail Page:**
- Show fabric, dimensions, care instructions in accordion
- Availability badge

**Collection pages (`/collections/:slug`):**
- Reuse category page layout
- Support both manual and automatic collections

**Order tracking page:**
- Show tracking number and link
- Status timeline visualization

**Storage bucket:**
- Create `product-images` bucket
- Public read access, admin upload via RLS

---

### Phase 7: Edge Functions Summary

| Function | Purpose |
|---|---|
| `create-order` | Secure order creation with inventory decrement |
| `validate-discount` | Coupon code validation |
| `create-razorpay-order` | Razorpay payment initiation |
| `verify-razorpay-payment` | Payment webhook verification |
| `bulk-operations` | CSV import, bulk price/inventory/tag updates |

---

## Technical Details

### File Changes Summary

**New files:**
- `supabase/functions/create-order/index.ts`
- `supabase/functions/validate-discount/index.ts`
- `supabase/functions/create-razorpay-order/index.ts`
- `supabase/functions/verify-razorpay-payment/index.ts`
- `supabase/functions/bulk-operations/index.ts`
- `src/pages/admin/Collections.tsx`
- `src/pages/admin/Discounts.tsx`
- `src/pages/admin/Customers.tsx`
- `src/pages/Collections.tsx` (storefront collection page)
- `src/components/admin/VariantManager.tsx`
- `src/components/admin/BulkOperations.tsx`
- `src/components/admin/DiscountForm.tsx`
- `src/components/checkout/DiscountInput.tsx`
- `src/lib/razorpay.ts`

**Modified files:**
- `src/hooks/useProducts.ts` -- server-side pagination + filters
- `src/pages/Category.tsx` -- pagination UI + new filters
- `src/pages/Product.tsx` -- fabric/dimensions/care display
- `src/pages/Checkout.tsx` -- edge function order creation + Razorpay + discounts
- `src/pages/admin/Products.tsx` -- variant management, bulk ops, image upload
- `src/pages/admin/Orders.tsx` -- tracking, filters, CSV export
- `src/pages/admin/Settings.tsx` -- no major changes
- `src/pages/admin/Dashboard.tsx` -- enhanced stats
- `src/pages/admin/AdminLayout.tsx` -- add Collections, Discounts, Customers nav links
- `src/pages/account/Orders.tsx` -- tracking info display
- `src/App.tsx` -- add new routes
- `src/components/products/ProductFilters.tsx` -- fabric + availability filters

### Performance Optimizations
- Server-side pagination prevents loading 10k+ products
- Database indexes on SKU, slug, tags, category_id
- React Query caching with stale-while-revalidate
- Lazy loading images with native `loading="lazy"`
- Atomic inventory operations prevent race conditions

### Security Measures
- Server-side price verification in `create-order` edge function
- Razorpay signature verification via HMAC
- RLS policies on all new tables
- Input validation with Zod on all forms
- Admin-only access enforced via `has_role()` function

