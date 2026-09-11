import NextLink from "next/link";

type RankedBarListItem = {
  label: string;
  value: number;
  href?: string;
};

export function RankedBarList({
  title,
  items,
  emptyLabel = "No data yet",
}: {
  title: string;
  items: RankedBarListItem[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>

      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              {item.href ? (
                <NextLink
                  href={item.href}
                  title={item.label}
                  className="w-28 shrink-0 truncate text-xs text-foreground hover:underline sm:w-36"
                >
                  {item.label}
                </NextLink>
              ) : (
                <span
                  title={item.label}
                  className="w-28 shrink-0 truncate text-xs text-foreground sm:w-36"
                >
                  {item.label}
                </span>
              )}
              <span className="relative h-1.5 min-w-0 flex-1 bg-muted">
                <span
                  className="absolute inset-y-0 left-0 rounded-r-sm bg-foreground"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {item.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
