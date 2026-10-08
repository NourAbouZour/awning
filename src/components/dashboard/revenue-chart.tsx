"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/utils";

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

/** 30-day revenue, single series — no legend needed, the card title names it. */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const revenueSeries = data;
  return (
    <div className="h-64 w-full" role="img" aria-label="Revenue for the last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={revenueSeries}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#114b32" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#114b32" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e6e4dc"
            strokeDasharray="0"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            interval={6}
            tick={{ fill: "#6b7268", fontSize: 11 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fill: "#6b7268", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: "#d4d1c6", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as {
                revenue: number;
                orders: number;
              };
              return (
                <div className="rounded-lg border border-line bg-paper px-3 py-2 shadow-md">
                  <p className="text-xs font-medium text-ink">{label}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {formatMoney(d.revenue)} ·{" "}
                    {d.orders === 1 ? "1 order" : `${d.orders} orders`}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#114b32"
            strokeWidth={2}
            fill="url(#rev-fill)"
            activeDot={{ r: 4, fill: "#114b32", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
