

# 🛍️ Indian eCommerce Platform — Full Plan

## Overview
A modern, scalable Indian eCommerce website for **Pillow Covers, Table Cloths, and Curtains** — built with React + Supabase backend, Razorpay payments, GST invoicing, and Indian-focused UX. Inspired by lifencolors.in but with premium UI/UX.

---

## Phase 1: Foundation & Database Schema

### Database Design (Supabase)
- **Categories** table (Pillow Covers, Table Cloths, Curtains)
- **Products** table with SEO fields, descriptions, design names
- **Product Variants** table (color, size, SKU, price, stock quantity, images)
- **Product Images** table with Supabase Storage for optimized images
- **Users / Profiles** table for customer data
- **User Roles** table (Admin / Staff / Customer) with secure role-based access
- **Addresses** table with Indian fields (State, City, Pincode)
- **Orders** & **Order Items** tables with status lifecycle
- **Payment Records** table (Razorpay integration)
- **GST Settings** table (configurable rates per category/product)
- **Shipping Rules** table (flat rate, free threshold, COD rules)
- **Pincode Serviceability** table for delivery validation

### Authentication
- Email/password signup & login
- Role-based access control (Admin, Staff, Customer)
- Protected admin routes

---

## Phase 2: Storefront (Customer-Facing UI)

### Homepage
- Hero banner with featured collections
- Category showcase (Pillow Covers, Table Cloths, Curtains)
- Trending/new arrivals section
- Trust badges, ₹ currency display throughout

### Product Listing Pages
- Grid view with product cards (image, name, price in ₹)
- Fast filtering: by category, color, design, size, price range
- Sort by: price, popularity, newest
- Pagination / infinite scroll for 10k+ SKUs

### Product Detail Page
- High-res image gallery with zoom
- Color & size variant selector
- Stock availability indicator
- Add to cart with quantity selector
- Related products section

### Cart & Wishlist
- Persistent cart (synced with Supabase for logged-in users, localStorage for guests)
- Quantity adjustment, variant display
- Estimated shipping & COD fee preview

### Checkout Flow
- Guest checkout supported
- Indian address form (Name, Phone, Address, City, State, Pincode)
- Pincode validation for delivery availability
- Shipping method selection with calculated charges
- Payment method selection (Razorpay: UPI, Cards, Net Banking, Wallets, COD)
- Order summary with GST breakdown
- Optional GSTIN input for business customers

---

## Phase 3: Razorpay Payment Integration

### Edge Function for Razorpay
- Create Razorpay order via edge function (secure API key handling)
- Frontend Razorpay checkout modal integration
- Webhook edge function for payment verification
- Payment status tracking: Pending → Paid → Failed → Refunded

### COD Support
- COD availability rules (minimum cart value, pincode-based)
- Optional COD fee added at checkout
- COD orders marked as "Pending Payment"

### Refunds
- Full and partial refund support via admin panel
- Razorpay refund API integration through edge function

---

## Phase 4: GST & Invoicing

### GST Logic
- Admin-configurable GST rates per product/category
- CGST/SGST (intra-state) vs IGST (inter-state) auto-calculation based on shipping address
- GST-inclusive and exclusive pricing support

### Invoice Generation
- Auto-generated GST-compliant invoices on order confirmation
- Downloadable PDF invoices (generated via edge function)
- Invoice number sequencing
- Customer GSTIN on invoice if provided

---

## Phase 5: Admin Dashboard

### Product Management
- Add/edit/delete products and variants
- Bulk product upload via CSV/Excel (parsed in edge function)
- Image upload with optimization
- SKU management

### Inventory Management
- Real-time stock levels per variant
- Low-stock alerts (configurable threshold)
- Stock adjustment logs

### Order Management
- Order list with status filters
- Status updates: Confirmed → Shipped → Delivered → Returned
- Order details with payment info, shipping address, items
- Refund processing

### Customer Management
- Customer list with order history
- Address book management

### Settings
- GST rate configuration
- Shipping rules (flat rate, free shipping threshold, COD fees)
- Pincode serviceability management
- Store information & invoice settings

---

## Phase 6: Performance & Polish

### Performance Optimization
- Image lazy loading throughout
- Supabase query optimization with proper indexes
- Component code splitting
- Optimistic UI updates for cart operations
- Efficient pagination for large product catalogs

### Mobile-First Design
- Fully responsive across all breakpoints
- Touch-friendly filters and navigation
- Mobile-optimized checkout flow
- Bottom navigation bar on mobile

### Indian UX Details
- ₹ currency formatting throughout
- Indian phone number format (+91)
- State/Pincode auto-suggestions
- Hindi-friendly typography considerations

---

## Technical Architecture Summary
- **Frontend**: React + Vite + Tailwind CSS + TypeScript
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **Payments**: Razorpay via Supabase Edge Functions
- **Images**: Supabase Storage with optimization
- **PDF Invoices**: Generated via Edge Functions
- **Deployment**: Static build exportable to Hostinger

