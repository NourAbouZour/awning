/** Next human-facing order number (#1001, #1002, …) given the existing set. */
export function nextOrderNumber(existing: string[]): string {
  let max = 1000;
  for (const n of existing) {
    const digits = parseInt(n.replace(/\D/g, ""), 10);
    if (Number.isFinite(digits) && digits > max) max = digits;
  }
  return `#${max + 1}`;
}
