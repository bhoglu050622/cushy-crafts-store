import { Truck, ShieldCheck, RotateCcw, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  { icon: Truck, label: "Free Shipping", sub: "On orders above ₹999" },
  { icon: ShieldCheck, label: "Artisan Quality", sub: "Handcrafted with care" },
  { icon: RotateCcw, label: "Easy Returns", sub: "7-day hassle-free" },
  { icon: CreditCard, label: "Secure Checkout", sub: "UPI, Cards & COD" },
];

const TrustBadges = () => {
  return (
    <section className="py-14 md:py-16 bg-foreground text-background">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-background/15 mb-4 group-hover:border-background/30 transition-colors">
                <badge.icon className="h-5 w-5 text-background/70" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium tracking-wider uppercase text-background/90">{badge.label}</p>
              <p className="text-[11px] text-background/45 mt-1">{badge.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
