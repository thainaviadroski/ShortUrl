export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border border-border p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-2xl font-semibold" title={typeof value === "string" ? value : undefined}>
        {value}
      </span>
      {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
