import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Mock data - will be replaced with Supabase data
const mockProducts = [
  { id: "1", name: "Tropical Leaf Pillow Cover", price: 499, comparePrice: 799, category: "Pillow Covers" },
  { id: "2", name: "Moroccan Pattern Table Cloth", price: 899, comparePrice: 1299, category: "Table Cloths" },
  { id: "3", name: "Sheer Linen Curtain", price: 1499, comparePrice: 2199, category: "Curtains" },
  { id: "4", name: "Geometric Velvet Pillow Cover", price: 599, comparePrice: 999, category: "Pillow Covers" },
  { id: "5", name: "Floral Block Print Table Cloth", price: 749, comparePrice: null, category: "Table Cloths" },
  { id: "6", name: "Blackout Velvet Curtain", price: 1999, comparePrice: 2999, category: "Curtains" },
  { id: "7", name: "Boho Tassel Pillow Cover", price: 449, comparePrice: 699, category: "Pillow Covers" },
  { id: "8", name: "Jacquard Silk Table Cloth", price: 1199, comparePrice: 1799, category: "Table Cloths" },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

const FeaturedProducts = () => {
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
          {mockProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link to={`/product/${product.id}`} className="group block">
                {/* Image */}
                <div className="aspect-square bg-muted mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl opacity-20">🎨</span>
                  </div>
                  
                  {/* Quick add button */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-full bg-foreground/90 text-background text-[10px] tracking-widest py-2.5 hover:bg-foreground transition-colors">
                      QUICK ADD
                    </button>
                  </div>

                  {/* Discount badge */}
                  {product.comparePrice && (
                    <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] tracking-wide px-2 py-1">
                      SALE
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground tracking-wide mb-1">{product.category}</p>
                  <h3 className="text-sm text-foreground mb-2 leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{formatPrice(product.price)}</span>
                    {product.comparePrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.comparePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-14"
        >
          <Link
            to="/collections"
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
