import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  {
    name: "Pillow Covers",
    slug: "pillow-covers",
    description: "Add a pop of color & comfort",
  },
  {
    name: "Table Cloths",
    slug: "table-cloths",
    description: "Elegant designs for every occasion",
  },
  {
    name: "Curtains",
    slug: "curtains",
    description: "Transform your windows, transform your space",
  },
];

const CategoryShowcase = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] tracking-widest text-muted-foreground mb-4">EXPLORE</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground">
            Shop by Category
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <Link
                to={`/category/${cat.slug}`}
                className="group block"
              >
                {/* Image placeholder */}
                <div className="aspect-[4/5] bg-muted mb-5 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-20">🎨</span>
                  </div>
                </div>
                
                <h3 className="font-display text-xl md:text-2xl text-foreground mb-1 group-hover:text-accent transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {cat.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
