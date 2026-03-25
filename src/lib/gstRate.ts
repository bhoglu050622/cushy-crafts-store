/** Cushion covers (pillow) and table linen: 5% GST inclusive (overrides DB if still set to 18). */
const GST_5_CATEGORY_SLUGS = new Set(["pillow-covers", "table-linens"]);

export function resolveProductGstRate(
  gstRateRaw: unknown,
  categorySlug: string | null | undefined
): number {
  if (categorySlug && GST_5_CATEGORY_SLUGS.has(categorySlug)) return 5;
  const n =
    gstRateRaw !== undefined && gstRateRaw !== null && gstRateRaw !== ""
      ? Number(gstRateRaw)
      : NaN;
  if (Number.isFinite(n)) return n;
  return 18;
}
