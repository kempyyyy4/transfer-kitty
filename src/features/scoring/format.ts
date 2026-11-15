/** A fee as players see it: "£0", "£500k", "£8m", "£412.5m". */
export function formatFee(feeGbp: number): string {
  if (feeGbp >= 1_000_000) return `£${trimDecimal(feeGbp / 1_000_000)}m`;
  if (feeGbp >= 1_000) return `£${trimDecimal(feeGbp / 1_000)}k`;
  return `£${feeGbp}`;
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}
