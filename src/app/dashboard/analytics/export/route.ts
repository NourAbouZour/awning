import type { NextRequest } from "next/server";
import { currentHasFeature, getCurrentStore } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseRange, rangeWindow } from "../range";

/** Quote a CSV field when it holds a comma, quote or line break. */
function csvField(value: string | number): string {
  let s = String(value);
  // Stop spreadsheet apps from running a cell as a formula. Plain numbers
  // such as "+961 3 123 456" are left alone.
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** The orders in the picked window as a CSV download. Analytics plan only. */
export async function GET(request: NextRequest) {
  const store = await getCurrentStore();
  if (!store || !(await currentHasFeature("analytics"))) {
    return new Response("Forbidden", { status: 403 });
  }

  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const { start } = rangeWindow(range);

  const orders = await prisma.order.findMany({
    where: { storeId: store.id, createdAt: { gte: start } },
    orderBy: { createdAt: "desc" },
    select: {
      number: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      status: true,
      paymentMethod: true,
      discountCode: true,
      discountAmount: true,
      total: true,
    },
  });

  const header = [
    "Order number",
    "Date",
    "Customer",
    "Phone",
    "Email",
    "Status",
    "Payment",
    "Discount code",
    "Discount amount",
    "Total",
  ];
  const lines = [header.map(csvField).join(",")];
  for (const o of orders) {
    lines.push(
      [
        o.number,
        o.createdAt.toISOString(),
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        o.status,
        o.paymentMethod,
        o.discountCode ?? "",
        o.discountAmount ? Number(o.discountAmount.toString()).toFixed(2) : "",
        Number(o.total.toString()).toFixed(2),
      ]
        .map(csvField)
        .join(","),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens accented and Arabic names correctly.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${store.slug}-orders-${range}d-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
