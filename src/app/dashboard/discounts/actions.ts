"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertFeature, requireCurrentStore } from "@/lib/auth";

export interface DiscountActionState {
  error?: string;
}

export interface DiscountInput {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minTotal: number | null;
}

const CODE_PATTERN = /^[A-Z0-9-]{3,24}$/;
const MAX_MONEY = 99_999_999.99;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function createDiscount(
  input: DiscountInput,
): Promise<DiscountActionState> {
  await assertFeature("discounts");
  const store = await requireCurrentStore();

  const code = String(input.code ?? "").trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    return {
      error: "Use 3 to 24 letters, numbers or dashes, like SUMMER-10.",
    };
  }

  const kind = input.kind === "fixed" ? "fixed" : "percent";
  const value = Number(input.value);
  if (!Number.isFinite(value)) return { error: "Enter how much the code takes off." };
  if (kind === "percent" && (value < 1 || value > 100)) {
    return { error: "A percentage has to be between 1 and 100." };
  }
  if (kind === "fixed" && (value <= 0 || value > MAX_MONEY)) {
    return { error: "The amount off has to be more than 0." };
  }

  let minTotal: number | null = null;
  if (input.minTotal !== null && input.minTotal !== undefined) {
    const m = Number(input.minTotal);
    if (!Number.isFinite(m) || m < 0 || m > MAX_MONEY) {
      return { error: "The minimum order has to be 0 or more." };
    }
    minTotal = m > 0 ? round2(m) : null;
  }

  const clash = await prisma.discount.findFirst({
    where: { storeId: store.id, code },
    select: { id: true },
  });
  if (clash) return { error: `You already have a code called ${code}.` };

  try {
    await prisma.discount.create({
      data: {
        storeId: store.id,
        code,
        kind,
        value: round2(value),
        minTotal,
      },
    });
  } catch {
    return { error: `You already have a code called ${code}.` };
  }

  revalidatePath("/dashboard/discounts");
  return {};
}

export async function setDiscountActive(
  id: string,
  active: boolean,
): Promise<DiscountActionState> {
  await assertFeature("discounts");
  const store = await requireCurrentStore();
  const { count } = await prisma.discount.updateMany({
    where: { id, storeId: store.id },
    data: { active: !!active },
  });
  if (count === 0) return { error: "Code not found." };
  revalidatePath("/dashboard/discounts");
  return {};
}

export async function deleteDiscount(id: string): Promise<DiscountActionState> {
  await assertFeature("discounts");
  const store = await requireCurrentStore();
  const { count } = await prisma.discount.deleteMany({
    where: { id, storeId: store.id },
  });
  if (count === 0) return { error: "Code not found." };
  revalidatePath("/dashboard/discounts");
  return {};
}
