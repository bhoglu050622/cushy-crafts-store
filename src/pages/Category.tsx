import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import StoreLayout from "@/components/layout/StoreLayout";
import ProductGrid from "@/components/products/ProductGrid";
import ProductFilters, { FilterState } from "@/components/products/ProductFilters";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { ChevronRight } from "lucide-react";

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: products = [], isLoading } = useProducts(slug);
  const { data: categories = [] } = useCategories();
  
  const category = categories.find((c) => c.slug === slug);

  // Extract available filter options from products
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.color) colors.add(v.color);
      });
    });
    return Array.from(colors);
  }, [products]);

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.size) sizes.add(v.size);
      });
    });
    return Array.from(sizes);
  }, [products]);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.max(...products.map((p) => 
      Math.max(p.basePrice, ...p.variants.map((v) => v.price))
    ));
  }, [products]);

  const [filters, setFilters] = useState<FilterState>({
    colors: [],
    sizes: [],
    priceRange: [0, maxPrice],
    sortBy: "newest",
  });

  // Apply filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => v.color && filters.colors.includes(v.color))
      );
    }

    // Size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => v.size && filters.sizes.includes(v.size))
      );
    }

    // Price filter
    filtered = filtered.filter((p) => {
      const minPrice = Math.min(p.basePrice, ...p.variants.map((v) => v.price));
      return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
    });

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const aPrice = Math.min(a.basePrice, ...a.variants.map((v) => v.price));
          const bPrice = Math.min(b.basePrice, ...b.variants.map((v) => v.price));
          return aPrice - bPrice;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const aPrice = Math.min(a.basePrice, ...a.variants.map((v) => v.price));
          const bPrice = Math.min(b.basePrice, ...b.variants.map((v) => v.price));
          return bPrice - aPrice;
        });
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  }, [products, filters]);

  return (
    <StoreLayout>
      <div className="pt-32 pb-20">
        {/* Breadcrumb */}
        <div className="container mb-8">
          <nav className="flex items-center gap-2 text-xs text-foreground/50">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{category?.name || slug}</span>
          </nav>
        </div>

        {/* Header */}
        <div className="container mb-10">
          <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-3">
            {category?.name || slug}
          </h1>
          {category?.description && (
            <p className="text-foreground/60 max-w-2xl">{category.description}</p>
          )}
        </div>

        {/* Content */}
        <div className="container">
          <div className="flex gap-10">
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableColors={availableColors}
              availableSizes={availableSizes}
              maxPrice={maxPrice}
              totalProducts={filteredProducts.length}
            />
            
            <div className="flex-1">
              <ProductGrid products={filteredProducts} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Category;
