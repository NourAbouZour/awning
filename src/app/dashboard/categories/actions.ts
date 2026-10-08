"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentStore } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export interface CategoryActionState {
  error?: string;
}

async function uniqueSlug(storeId: string, base: string, excludeId?: string) {
  const root = slugify(base) || "collection";
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.category.findFirst({
      where: { storeId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export async function createCategory(
  name: string,
): Promise<CategoryActionState> {
  const store = await requireCurrentStore();
  if (name.trim().length < 2) return { error: "Give the collection a name." };
  const slug = await uniqueSlug(store.id, name);
  await prisma.category.create({
    data: { storeId: store.id, name: name.trim(), slug, image: "" },
  });
  revalidatePath("/dashboard/categories");
  revalidatePath(`/s/${store.slug}`);
  return {};
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<CategoryActionState> {
  const store = await requireCurrentStore();
  if (name.trim().length < 2) return { error: "Give the collection a name." };
  const owned = await prisma.category.findFirst({
    where: { id, storeId: store.id },
    select: { id: true },
  });
  if (!owned) return { error: "Collection not found." };
  const slug = await uniqueSlug(store.id, name, id);
  await prisma.category.update({
    where: { id },
    data: { name: name.trim(), slug },
  });
  revalidatePath("/dashboard/categories");
  revalidatePath(`/s/${store.slug}`);
  return {};
}

export async function deleteCategory(
  id: string,
): Promise<CategoryActionState> {
  const store = await requireCurrentStore();
  const cat = await prisma.category.findFirst({
    where: { id, storeId: store.id },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!cat) return { error: "Collection not found." };

  if (cat._count.products > 0) {
    // Products require a category (FK is Restrict); move them to another one.
    const fallback = await prisma.category.findFirst({
      where: { storeId: store.id, NOT: { id } },
      select: { id: true },
    });
    if (!fallback) {
      return {
        error:
          "This is your only collection — create another before deleting it.",
      };
    }
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: fallback.id },
    });
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/dashboard/categories");
  revalidatePath(`/s/${store.slug}`);
  return {};
}
