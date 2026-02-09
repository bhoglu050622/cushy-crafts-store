/**
 * Format a number as Indian Rupees
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format price with GST breakdown
 */
export const formatPriceWithGST = (
  amount: number,
  gstRate: number = 18
): { total: string; gst: string; base: string } => {
  const gstAmount = (amount * gstRate) / (100 + gstRate);
  const baseAmount = amount - gstAmount;

  return {
    total: formatPrice(amount),
    gst: formatPrice(Math.round(gstAmount)),
    base: formatPrice(Math.round(baseAmount)),
  };
};

/**
 * Format date in Indian format
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Generate order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LNC-${timestamp}-${random}`;
};

/**
 * Format phone number for display
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};
