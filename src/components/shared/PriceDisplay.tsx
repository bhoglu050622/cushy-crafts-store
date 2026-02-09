import { formatPrice, formatPriceWithGST } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  gstRate?: number;
  showGSTBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PriceDisplay = ({
  price,
  compareAtPrice,
  gstRate = 18,
  showGSTBreakdown = false,
  size = "md",
  className,
}: PriceDisplayProps) => {
  const isOnSale = compareAtPrice && compareAtPrice > price;
  const discount = isOnSale
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  const { total, gst, base } = formatPriceWithGST(price, gstRate);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-3">
        <span className={cn("font-medium text-foreground", sizeClasses[size])}>
          {formatPrice(price)}
        </span>
        {isOnSale && (
          <>
            <span
              className={cn(
                "text-foreground/40 line-through",
                size === "lg" ? "text-lg" : "text-sm"
              )}
            >
              {formatPrice(compareAtPrice)}
            </span>
            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5">
              {discount}% OFF
            </span>
          </>
        )}
      </div>

      {showGSTBreakdown && (
        <p className="text-xs text-foreground/50">
          Incl. GST ({gstRate}%: {gst})
        </p>
      )}
    </div>
  );
};

export default PriceDisplay;
