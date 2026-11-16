"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ACTIVE_STORE_COOKIE, getCurrentUser } from "@/lib/auth";

/** Point the dashboard at another store the owner has. */
export async function switchStore(storeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId: user.id },
    select: { id: true },
  });
  if (store) {
    const jar = await cookies();
    jar.set(ACTIVE_STORE_COOKIE, store.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  redirect("/dashboard");
}
