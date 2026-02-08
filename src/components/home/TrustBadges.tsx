import { Truck, ShieldCheck, RotateCcw, CreditCard } from "lucide-react";

const badges = [
  { icon: Truck, label: "Free Shipping", sub: "Orders ₹999+" },
  { icon: ShieldCheck, label: "Quality Assured", sub: "100% Genuine" },
  { icon: RotateCcw, label: "Easy Returns", sub: "7-Day Policy" },
  { icon: CreditCard, label: "Secure Pay", sub: "UPI, Cards, COD" },
];

const TrustBadges = () => {
  return (
    <section className="py-10 md:py-12 border-y border-border/50">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge) => (
            <div key={badge.label} className="text-center">
              <badge.icon className="h-6 w-6 text-foreground/60 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-xs font-medium text-foreground tracking-wide">{badge.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{badge.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
