import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Welcome to Aavis Decor!", description: "You'll hear from us soon with curated updates." });
    setEmail("");
  };

  return (
    <section className="py-24 md:py-32 bg-foreground text-background">
      <div className="container max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-[11px] tracking-[0.25em] text-background/40 mb-5 uppercase">
            Stay Inspired
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-background mb-4">
            Join our world
          </h2>
          <p className="text-sm text-background/50 mb-10 max-w-md mx-auto leading-relaxed">
            Be the first to discover new collections, artisan stories, and exclusive offers curated just for you.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="h-12 bg-transparent border-background/20 text-background placeholder:text-background/30 focus:border-background/50 flex-1"
            />
            <Button
              type="submit"
              className="h-12 px-8 bg-background text-foreground hover:bg-background/90 text-xs tracking-widest font-medium"
            >
              SUBSCRIBE
            </Button>
          </form>

          <p className="text-[10px] text-background/25 mt-5">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
