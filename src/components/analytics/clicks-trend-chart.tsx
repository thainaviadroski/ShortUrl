"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { formatCompactNumber } from "@/lib/format";

type DailyPoint = { date: string; count: number };
type MonthlyPoint = { month: string; count: number };

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatMonthLabel(month: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{payload[0].value.toLocaleString()} clicks</div>
    </div>
  );
}

export function ClicksTrendChart({
  daily,
  monthly,
}: {
  daily: DailyPoint[];
  monthly: MonthlyPoint[];
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");

  const dailyData = useMemo(
    () => daily.map((point) => ({ label: formatDayLabel(point.date), count: point.count })),
    [daily]
  );

  const monthlyData = useMemo(
    () => monthly.map((point) => ({ label: formatMonthLabel(point.month), count: point.count })),
    [monthly]
  );

  const data = view === "daily" ? dailyData : monthlyData;
  const hasData = data.some((point) => point.count > 0);

  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Clicks over time</h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="xs"
            variant={view === "daily" ? "secondary" : "ghost"}
            aria-pressed={view === "daily"}
            onClick={() => setView("daily")}
          >
            Per day
          </Button>
          <Button
            type="button"
            size="xs"
            variant={view === "monthly" ? "secondary" : "ghost"}
            aria-pressed={view === "monthly"}
            onClick={() => setView("monthly")}
          >
            Per month
          </Button>
        </div>
      </div>

      {!hasData ? (
        <p className="py-16 text-center text-xs text-muted-foreground">No clicks recorded yet.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {view === "daily" ? (
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  minTickGap={24}
                />
                <YAxis
                  width={36}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  allowDecimals={false}
                  tickFormatter={formatCompactNumber}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  content={<ChartTooltip />}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  fill="var(--foreground)"
                  fillOpacity={0.1}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--foreground)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%">
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  width={36}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  allowDecimals={false}
                  tickFormatter={formatCompactNumber}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={<ChartTooltip />}
                />
                <Bar dataKey="count" fill="var(--foreground)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
