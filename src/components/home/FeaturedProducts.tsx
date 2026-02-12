import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFeaturedProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedProducts = () => {
  const { data: products = [], isLoading } = useFeaturedProducts();

  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] tracking-widest text-muted-foreground mb-4">THE COLLECTIVE CHOICE</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground">
            Best Sellers
          </h2>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-14"
        >
          <Link
            to="/category/pillow-covers"
            className="inline-block border border-foreground text-foreground px-10 py-3.5 text-xs tracking-widest font-medium hover:bg-foreground hover:text-background transition-colors"
          >
            VIEW ALL
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
