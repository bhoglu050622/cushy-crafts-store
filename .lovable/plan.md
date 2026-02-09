
# Complete Indian eCommerce Store Implementation

## Current State
- Database schema complete (13 tables with RLS policies)
- 3 categories seeded (Pillow Covers, Table Cloths, Curtains)
- Homepage with mock data and lifencolors.in-inspired design
- No authentication, no product pages, no cart, no admin panel

## Implementation Scope

### 1. Authentication System
Create complete auth flow for customers and admin access:
- `/auth` page with login/signup tabs
- Email/password authentication with validation
- Session management with auth state context
- Protected routes for admin and user areas
- Profile management page

### 2. Product Catalog Pages

**Category Page (`/category/:slug`)**
- Dynamic product grid from database
- Filtering: color, size, price range, design
- Sorting: price (low/high), newest, popularity
- Pagination (20 products per page)
- Mobile-friendly filter drawer

**Product Detail Page (`/product/:slug`)**
- Image gallery with zoom/lightbox
- Variant selector (color/size dropdowns)
- Stock availability indicator
- Price display with GST breakdown
- Add to cart with quantity
- Related products section
- Product specifications accordion

### 3. Shopping Cart System
- Cart context with localStorage persistence
- Guest cart synced to database on login
- `/cart` page with:
  - Product list with images and variants
  - Quantity adjustment
  - Remove item functionality
  - Subtotal, shipping estimate, GST preview
  - Pincode checker for delivery availability

### 4. Checkout Flow

**Checkout Page (`/checkout`)**
- Step 1: Shipping address form (Indian format)
- Step 2: Payment method selection
- Step 3: Order review with GST breakdown
- Pincode validation for serviceability
- Guest checkout support
- Optional GSTIN input for B2B

### 5. Razorpay Payment Integration

**Edge Functions**
- `create-razorpay-order`: Generate payment order
- `verify-payment`: Webhook for payment verification
- `process-refund`: Admin refund processing

**Frontend Integration**
- Razorpay checkout modal
- Payment status handling
- COD option with fee calculation

### 6. Order Management

**Customer Side**
- `/account/orders` - Order history
- Order detail page with status timeline
- Invoice download

**Order Flow**
- Order number generation
- Status lifecycle: Pending -> Confirmed -> Shipped -> Delivered
- Email notifications (future enhancement)

### 7. Admin Dashboard (`/admin/*`)

**Dashboard Home**
- Sales overview cards
- Recent orders
- Low stock alerts
- Quick stats (revenue, orders, customers)

**Product Management**
- Product list with search/filter
- Add/Edit product form with variants
- Image upload to storage
- Bulk CSV import (edge function)
- SKU management

**Order Management**
- Order list with status filters
- Order detail with actions (update status, refund)
- Print invoice/packing slip

**Customer Management**
- Customer list with order history
- Address management

**Settings**
- GST configuration
- Shipping rules
- Pincode serviceability
- Store information

### 8. Additional Pages

**Static Pages**
- `/about` - About the brand
- `/contact` - Contact form
- `/shipping-policy` - Shipping info
- `/returns` - Returns policy
- `/privacy` - Privacy policy
- `/terms` - Terms of service

**User Account Pages**
- `/account` - Profile dashboard
- `/account/addresses` - Saved addresses
- `/account/orders` - Order history
- `/wishlist` - Saved products

### 9. Sample Data Seeding
- 20-30 sample products across categories
- Multiple variants per product
- Sample images (placeholder URLs)
- Sample pincodes for testing

## File Structure

```text
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── AuthGuard.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   ├── checkout/
│   │   ├── AddressForm.tsx
│   │   ├── PaymentMethods.tsx
│   │   └── OrderSummary.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── VariantSelector.tsx
│   │   └── ImageGallery.tsx
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── ProductForm.tsx
│   │   ├── OrderTable.tsx
│   │   └── StatsCards.tsx
│   └── shared/
│       ├── PincodeChecker.tsx
│       ├── PriceDisplay.tsx
│       └── LoadingSpinner.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── useOrders.ts
├── pages/
│   ├── Auth.tsx
│   ├── Category.tsx
│   ├── Product.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── OrderConfirmation.tsx
│   ├── Account.tsx
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Orders.tsx
│   │   └── Settings.tsx
│   └── static/
│       ├── About.tsx
│       └── Contact.tsx
└── lib/
    ├── formatters.ts
    ├── validators.ts
    └── razorpay.ts

supabase/
└── functions/
    ├── create-razorpay-order/
    ├── verify-payment/
    └── generate-invoice/
```

## Technical Implementation

### Storage Bucket
- Create `product-images` bucket for product photos
- RLS policies for admin upload, public read

### Edge Functions
- Razorpay order creation with secret key
- Payment verification webhook
- PDF invoice generation

### Performance
- React Query for data caching
- Optimistic updates for cart
- Image lazy loading
- Pagination for product lists

## Implementation Order
1. Authentication system and context
2. Sample product data seeding
3. Product listing and detail pages
4. Cart system with context
5. Checkout flow with address form
6. Razorpay integration
7. Order confirmation and history
8. Admin dashboard
9. Static pages and polish

## Required Secrets
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret

---

This plan delivers a complete, production-ready Indian eCommerce store with authentication, full product catalog, cart, Razorpay payments, GST invoicing, and admin CMS - all matching the premium lifencolors.in aesthetic.
