import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  gstRate: number;
  categoryId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  designName: string | null;
  tags: string[] | null;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId: string | null;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
  category: Category | null;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;

      return data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.image_url,
        isActive: cat.is_active ?? true,
        sortOrder: cat.sort_order ?? 0,
      })) as Category[];
    },
  });
};

export const useProducts = (categorySlug?: string) => {
  return useQuery({
    queryKey: ["products", categorySlug],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          categories!products_category_id_fkey (
            id, name, slug, description, image_url, is_active, sort_order
          ),
          product_variants (
            id, product_id, sku, color, size, price, compare_at_price, stock_quantity, is_active
          ),
          product_images (
            id, product_id, variant_id, url, alt_text, is_primary, sort_order
          )
        `)
        .eq("is_active", true);

      if (categorySlug) {
        query = query.eq("categories.slug", categorySlug);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      return data
        .filter((p) => !categorySlug || p.categories)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          shortDescription: p.short_description,
          basePrice: Number(p.base_price),
          compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
          gstRate: Number(p.gst_rate ?? 18),
          categoryId: p.category_id,
          isActive: p.is_active ?? true,
          isFeatured: p.is_featured ?? false,
          designName: p.design_name,
          tags: p.tags,
          createdAt: p.created_at ?? "",
          category: p.categories
            ? {
                id: p.categories.id,
                name: p.categories.name,
                slug: p.categories.slug,
                description: p.categories.description,
                imageUrl: p.categories.image_url,
                isActive: p.categories.is_active ?? true,
                sortOrder: p.categories.sort_order ?? 0,
              }
            : null,
          variants: (p.product_variants || []).map((v: any) => ({
            id: v.id,
            productId: v.product_id,
            sku: v.sku,
            color: v.color,
            size: v.size,
            price: Number(v.price),
            compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
            stockQuantity: v.stock_quantity ?? 0,
            isActive: v.is_active ?? true,
          })),
          images: (p.product_images || [])
            .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((img: any) => ({
              id: img.id,
              productId: img.product_id,
              variantId: img.variant_id,
              url: img.url,
              altText: img.alt_text,
              isPrimary: img.is_primary ?? false,
              sortOrder: img.sort_order ?? 0,
            })),
        })) as ProductWithDetails[];
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories!products_category_id_fkey (
            id, name, slug, description, image_url, is_active, sort_order
          ),
          product_variants (
            id, product_id, sku, color, size, price, compare_at_price, stock_quantity, is_active
          ),
          product_images (
            id, product_id, variant_id, url, alt_text, is_primary, sort_order
          )
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.short_description,
        basePrice: Number(data.base_price),
        compareAtPrice: data.compare_at_price ? Number(data.compare_at_price) : null,
        gstRate: Number(data.gst_rate ?? 18),
        categoryId: data.category_id,
        isActive: data.is_active ?? true,
        isFeatured: data.is_featured ?? false,
        designName: data.design_name,
        tags: data.tags,
        createdAt: data.created_at ?? "",
        category: data.categories
          ? {
              id: data.categories.id,
              name: data.categories.name,
              slug: data.categories.slug,
              description: data.categories.description,
              imageUrl: data.categories.image_url,
              isActive: data.categories.is_active ?? true,
              sortOrder: data.categories.sort_order ?? 0,
            }
          : null,
        variants: (data.product_variants || []).map((v: any) => ({
          id: v.id,
          productId: v.product_id,
          sku: v.sku,
          color: v.color,
          size: v.size,
          price: Number(v.price),
          compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
          stockQuantity: v.stock_quantity ?? 0,
          isActive: v.is_active ?? true,
        })),
        images: (data.product_images || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((img: any) => ({
            id: img.id,
            productId: img.product_id,
            variantId: img.variant_id,
            url: img.url,
            altText: img.alt_text,
            isPrimary: img.is_primary ?? false,
            sortOrder: img.sort_order ?? 0,
          })),
      } as ProductWithDetails;
    },
    enabled: !!slug,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (
            id, product_id, sku, color, size, price, compare_at_price, stock_quantity, is_active
          ),
          product_images (
            id, product_id, variant_id, url, alt_text, is_primary, sort_order
          )
        `)
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);

      if (error) throw error;

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.short_description,
        basePrice: Number(p.base_price),
        compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
        gstRate: Number(p.gst_rate ?? 18),
        categoryId: p.category_id,
        isActive: p.is_active ?? true,
        isFeatured: p.is_featured ?? false,
        designName: p.design_name,
        tags: p.tags,
        createdAt: p.created_at ?? "",
        category: null,
        variants: (p.product_variants || []).map((v: any) => ({
          id: v.id,
          productId: v.product_id,
          sku: v.sku,
          color: v.color,
          size: v.size,
          price: Number(v.price),
          compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
          stockQuantity: v.stock_quantity ?? 0,
          isActive: v.is_active ?? true,
        })),
        images: (p.product_images || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((img: any) => ({
            id: img.id,
            productId: img.product_id,
            variantId: img.variant_id,
            url: img.url,
            altText: img.alt_text,
            isPrimary: img.is_primary ?? false,
            sortOrder: img.sort_order ?? 0,
          })),
      })) as ProductWithDetails[];
    },
  });
};
