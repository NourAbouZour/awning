"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  assertFeature,
  hashPassword,
  isStoreOwner,
  requireCurrentStore,
} from "@/lib/auth";

export interface StaffActionState {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Feature + owner checks shared by every staff action. Returns the store. */
async function ownerStore() {
  await assertFeature("staff");
  if (!(await isStoreOwner())) {
    throw new Error("Only the store owner can manage staff.");
  }
  return requireCurrentStore();
}

export async function addStaff(input: {
  name: string;
  email: string;
  password: string;
}): Promise<StaffActionState> {
  const store = await ownerStore();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (name.length < 2) return { error: "Add their name, 2+ characters." };
  if (!EMAIL_RE.test(email))
    return { error: "That doesn't look like an email address." };
  if (password.length < 8)
    return { error: "Use a temporary password of at least 8 characters." };

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { error: "That email already has a Shopleb account. Use another one." };
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "staff",
        staffStoreId: store.id,
      },
    });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code?: string }).code
        : undefined;
    if (code === "P2002") {
      return { error: "That email already has a Shopleb account. Use another one." };
    }
    throw e;
  }

  revalidatePath("/dashboard/staff");
  return {};
}

export async function setStaffActive(
  id: string,
  active: boolean,
): Promise<StaffActionState> {
  const store = await ownerStore();
  const { count } = await prisma.user.updateMany({
    where: { id, role: "staff", staffStoreId: store.id },
    data: { active },
  });
  if (count === 0) return { error: "Staff member not found." };
  revalidatePath("/dashboard/staff");
  return {};
}

export async function removeStaff(id: string): Promise<StaffActionState> {
  const store = await ownerStore();
  // deleteMany so the role and store checks are part of the delete itself.
  const { count } = await prisma.user.deleteMany({
    where: { id, role: "staff", staffStoreId: store.id },
  });
  if (count === 0) return { error: "Staff member not found." };
  revalidatePath("/dashboard/staff");
  return {};
}
