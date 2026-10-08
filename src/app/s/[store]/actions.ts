"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { nextOrderNumber } from "@/server/order-number";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  body: string;
}

export async function submitContactMessage(
  storeSlug: string,
  input: ContactInput,
): Promise<{ error?: string }> {
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!store) return { error: "Store not found." };

  if (input.name.trim().length < 2) return { error: "Tell us your name." };
  if (!EMAIL_RE.test(input.email))
    return { error: "That doesn't look like an email address." };
  if (!input.subject.trim()) return { error: "Add a subject." };
  if (input.body.trim().length < 10)
    return { error: "Give us a little more to go on — 10+ characters." };

  await prisma.contactMessage.create({
    data: {
      storeId: store.id,
      name: input.name.trim(),
      email: input.email.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
    },
  });
  return {};
}

export async function subscribe(
  storeSlug: string,
  email: string,
): Promise<{ error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean))
    return { error: "That doesn't look like an email address." };
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!store) return { error: "Store not found." };
  await prisma.subscriber.upsert({
    where: { storeId_email: { storeId: store.id, email: clean } },
    create: { storeId: store.id, email: clean },
    update: {},
  });
  return {};
}

export interface CheckoutItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CheckoutCustomer {
  name: string;
  email: string;
  location?: string;
}

export interface PlaceOrderResult {
  error?: string;
  orderNumber?: string;
}

export async function placeOrder(
  storeSlug: string,
  items: CheckoutItem[],
  customer: CheckoutCustomer,
  shippingAddress: string,
): Promise<PlaceOrderResult> {
  if (!items.length) return { error: "Your bag is empty." };
  if (customer.name.trim().length < 2) return { error: "Enter your name." };
  if (!EMAIL_RE.test(customer.email)) return { error: "Enter a valid email." };
  if (shippingAddress.trim().length < 6)
    return { error: "Enter a shipping address." };

  const email = customer.email.trim().toLowerCase();

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!store) return { error: "Store not found." };

  const runOrder = () =>
    prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, storeId: store.id },
      include: { variants: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lineData: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    let total = new Prisma.Decimal(0);

    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product) continue;
      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : undefined;
      const unit =
        variant?.price != null ? variant.price : product.price;
      const qty = Math.max(1, item.quantity | 0);
      total = total.add(new Prisma.Decimal(unit).mul(qty));

      lineData.push({
        product: { connect: { id: product.id } },
        title: product.title,
        image: Array.isArray(product.images) ? String((product.images as string[])[0] ?? "") : "",
        variant: variant?.name ?? null,
        quantity: qty,
        price: new Prisma.Decimal(unit),
      });

      // Decrement stock, clamped at 0.
      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: Math.max(0, variant.stock - qty) },
        });
      } else {
        await tx.product.update({
          where: { id: product.id },
          data: { inventory: Math.max(0, product.inventory - qty) },
        });
      }
    }

    if (lineData.length === 0) throw new Error("No valid items in the order.");

    const dbCustomer = await tx.customer.upsert({
      where: {
        storeId_email: { storeId: store.id, email },
      },
      create: {
        storeId: store.id,
        name: customer.name.trim(),
        email,
        location: customer.location?.trim() || "",
      },
      update: {},
    });

    const existing = await tx.order.findMany({
      where: { storeId: store.id },
      select: { number: true },
    });
    const number = nextOrderNumber(existing.map((o) => o.number));

    await tx.order.create({
      data: {
        storeId: store.id,
        number,
        customerId: dbCustomer.id,
        customerName: customer.name.trim(),
        customerEmail: email,
        total,
        status: "paid",
        shippingAddress: shippingAddress.trim(),
        items: { create: lineData },
      },
    });

      return number;
    });

  // Retry on the rare order-number collision; translate any failure into a
  // friendly message so the checkout UI never hangs on a rejected promise.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const orderNumber = await runOrder();
      return { orderNumber };
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e
          ? (e as { code?: string }).code
          : undefined;
      if (code === "P2002" && attempt < 4) continue; // number race — retry
      return { error: "Something went wrong placing your order. Please try again." };
    }
  }
  return { error: "Couldn't place your order — please try again." };
}
