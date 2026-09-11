export function formatCompactNumber(value: number) {
  if (value < 1000) return value.toLocaleString();

  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
