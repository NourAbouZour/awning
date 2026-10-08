import { PrismaClient, Prisma } from "@prisma/client";
import { stores } from "../src/lib/mock-data";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

// Production-clean seed: the two example storefronts (VOLTA + ODE) and their
// products, plus the platform superadmin. No demo orders/customers/messages.

const DEMO_PASSWORD = "awning123";
const ADMIN_EMAIL = "nourabouzour325@gmail.com";
const ADMIN_PASSWORD = "admin12345";

async function clean() {
  // Child-first delete so re-seeding is idempotent.
  await prisma.campaign.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeTheme.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clean();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  for (const store of stores) {
    const email = `${store.slug}@demo.test`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: `${store.name} Owner`,
        role: "merchant",
        plan: "stall",
        billingPaid: false,
        active: true,
      },
    });

    await prisma.store.create({
      data: {
        id: store.id,
        userId: user.id,
        name: store.name,
        slug: store.slug,
        logoText: store.logoText,
        logoUrl: store.logoUrl ?? null,
        tagline: store.tagline,
        contactEmail: store.contactEmail,
        phone: store.phone,
        address: store.address,
        hours: store.hours,
        currency: store.currency,
        shippingNote: store.shippingNote,
        theme: {
          create: {
            brandColor: store.theme.brandColor,
            fontPairing: store.theme.fontPairing,
            announcement: store.theme.announcement,
            heroImage: store.theme.heroImage,
            heroHeadline: store.theme.heroHeadline,
            heroSub: store.theme.heroSub,
            heroCta: store.theme.heroCta,
            storyImage: store.theme.storyImage,
            storyTitle: store.theme.storyTitle,
            storyBody: store.theme.storyBody,
            footerText: store.theme.footerText,
            instagram: store.theme.socials.instagram ?? null,
            tiktok: store.theme.socials.tiktok ?? null,
            twitter: store.theme.socials.twitter ?? null,
            sections: store.theme.sections as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });

    for (const c of store.categories) {
      await prisma.category.create({
        data: {
          id: c.id,
          storeId: store.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
        },
      });
    }

    for (const p of store.products) {
      await prisma.product.create({
        data: {
          id: p.id,
          storeId: store.id,
          slug: p.slug,
          title: p.title,
          description: p.description,
          details: p.details,
          price: p.price,
          compareAt: p.compareAt ?? null,
          categoryId: p.categoryId,
          images: p.images as unknown as Prisma.InputJsonValue,
          inventory: p.inventory,
          sku: p.sku,
          status: p.status,
          featured: p.featured ?? false,
          variantGroupLabel: p.variantGroup?.label ?? null,
          variants: p.variantGroup
            ? {
                create: p.variantGroup.variants.map((v) => ({
                  name: v.name,
                  price: v.price ?? null,
                  stock: v.stock,
                })),
              }
            : undefined,
        },
      });
    }
  }

  // Platform superadmin (you) — manages plans, billing, and accounts.
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      name: "Platform Admin",
      role: "superadmin",
    },
  });

  const counts = {
    users: await prisma.user.count(),
    stores: await prisma.store.count(),
    products: await prisma.product.count(),
  };
  console.log("Seeded (clean):", counts);
  console.log(`\nExample store logins (password: ${DEMO_PASSWORD}):`);
  for (const s of stores) console.log(`  ${s.slug}@demo.test`);
  console.log(
    `\nSuperadmin login: ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD}) → /admin`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
