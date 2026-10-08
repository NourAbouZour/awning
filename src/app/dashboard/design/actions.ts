"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCurrentStore } from "@/lib/auth";
import type { HomeSection } from "@/lib/types";

export interface DesignInput {
  logoUrl?: string | null;
  theme: {
    brandColor: string;
    fontPairing: string;
    announcement: string;
    heroImage: string;
    heroHeadline: string;
    heroSub: string;
    heroCta: string;
    storyImage: string;
    storyTitle: string;
    storyBody: string;
    footerText: string;
    socials: { instagram?: string; tiktok?: string; twitter?: string };
    sections: HomeSection[];
  };
}

export async function saveDesign(input: DesignInput): Promise<{ error?: string }> {
  const store = await requireCurrentStore();
  const t = input.theme;

  const logoUrl =
    input.logoUrl && !input.logoUrl.startsWith("blob:") ? input.logoUrl : null;

  await prisma.$transaction([
    prisma.store.update({
      where: { id: store.id },
      data: { logoUrl },
    }),
    prisma.storeTheme.update({
      where: { storeId: store.id },
      data: {
        brandColor: t.brandColor,
        fontPairing: t.fontPairing,
        announcement: t.announcement,
        heroImage: t.heroImage.startsWith("blob:") ? "" : t.heroImage,
        heroHeadline: t.heroHeadline,
        heroSub: t.heroSub,
        heroCta: t.heroCta,
        storyImage: t.storyImage.startsWith("blob:") ? "" : t.storyImage,
        storyTitle: t.storyTitle,
        storyBody: t.storyBody,
        footerText: t.footerText,
        instagram: t.socials.instagram || null,
        tiktok: t.socials.tiktok || null,
        twitter: t.socials.twitter || null,
        sections: t.sections as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/dashboard/design");
  revalidatePath(`/s/${store.slug}`);
  return {};
}
