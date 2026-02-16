import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import textileImage from "@/assets/textile-detail.jpg";

const StorySection = () => {
  return (
    <section className="py-24 md:py-32 bg-secondary/50">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={textileImage}
                alt="Artisanal Indian textiles by Aavis Decor"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative frame */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-accent/20 -z-10 hidden lg:block" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:pl-4"
          >
            <p className="text-[11px] tracking-[0.25em] text-muted-foreground mb-5 uppercase">
              Our Craft
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-6 leading-[1.15]">
              Rooted in tradition,
              <br />
              <span className="italic">designed for today</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
              Every Aavis Decor piece begins with a story — of artisans whose hands have
              perfected their craft over generations, of natural fabrics chosen for their
              beauty and durability, and of designs that bridge the timeless with the contemporary.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
              We work directly with skilled craftspeople across India, ensuring fair practices
              and authentic quality in every stitch.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-3 text-xs tracking-widest uppercase text-foreground font-medium border-b border-foreground/30 pb-1.5 hover:border-foreground transition-colors"
            >
              Discover our story
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
