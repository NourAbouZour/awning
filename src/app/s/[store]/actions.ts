"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { nextOrderNumber } from "@/server/order-number";
import { fireOrderWebhook } from "@/server/webhooks";
import { hasFeature, type Plan } from "@/lib/plan";
import { applyDiscount, cleanCode } from "@/lib/discount";
import { formatMoney } from "@/lib/utils";

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
    return { error: "Give us a little more to go on, 10+ characters." };

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

/* ------------------------------------------------------------------ */
/* Checkout                                                             */
/* ------------------------------------------------------------------ */

export interface CheckoutItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CheckoutCustomer {
  name: string;
  /** Required. */
  phone: string;
  /** Optional. */
  email?: string;
  location?: string;
}

export interface CheckoutOptions {
  paymentMethod?: "cash" | "whish";
  discountCode?: string;
  /** Google Maps link from the shopper's "Get my location". */
  locationUrl?: string;
  /** The abandoned-cart row this checkout came from, if any. */
  cartId?: string;
}

export interface PlaceOrderResult {
  error?: string;
  orderNumber?: string;
}

/** A shopper-facing problem (out of stock, bad code) that aborts the order. */
class CheckoutError extends Error {}

const phoneDigits = (p: string) => p.replace(/\D/g, "");

async function storeForCheckout(slug: string) {
  return prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      currency: true,
      user: { select: { plan: true, active: true } },
    },
  });
}

/** Only keep a real https Google Maps link. */
function cleanLocationUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (!/(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.hostname !== "maps.app.goo.gl")
      return null;
    return u.toString().slice(0, 500);
  } catch {
    return null;
  }
}

/** Check a discount code against a subtotal, for the "Apply" button. */
export async function checkDiscount(
  storeSlug: string,
  code: string,
  subtotal: number,
): Promise<{ error?: string; code?: string; amount?: number }> {
  const store = await storeForCheckout(storeSlug);
  if (!store) return { error: "Store not found." };
  if (!hasFeature(store.user.plan as Plan, "discounts"))
    return { error: "This store doesn't take discount codes." };
  const clean = cleanCode(code);
  if (!clean) return { error: "Type a code first." };
  const row = await prisma.discount.findUnique({
    where: { storeId_code: { storeId: store.id, code: clean } },
  });
  if (!row) return { error: "That code doesn't exist." };
  const check = applyDiscount(
    {
      kind: row.kind,
      value: Number(row.value.toString()),
      minTotal: row.minTotal ? Number(row.minTotal.toString()) : null,
      active: row.active,
    },
    subtotal,
    (n) => formatMoney(n, store.currency),
  );
  if (!check.ok) return { error: check.reason };
  return { code: clean, amount: check.amount };
}

export async function placeOrder(
  storeSlug: string,
  items: CheckoutItem[],
  customer: CheckoutCustomer,
  shippingAddress: string,
  options: CheckoutOptions = {},
): Promise<PlaceOrderResult> {
  if (!items.length) return { error: "Your bag is empty." };
  if (customer.name.trim().length < 2) return { error: "Enter your name." };
  if (phoneDigits(customer.phone ?? "").length < 7)
    return { error: "Enter your phone number so the store can reach you." };
  const email = (customer.email ?? "").trim().toLowerCase();
  if (email && !EMAIL_RE.test(email))
    return { error: "That email doesn't look right. You can also leave it empty." };
  if (shippingAddress.trim().length < 6)
    return { error: "Enter a delivery address." };

  const phone = customer.phone.trim().slice(0, 40);
  const paymentMethod = options.paymentMethod === "whish" ? "whish" : "cash";
  const locationUrl = cleanLocationUrl(options.locationUrl);

  const store = await storeForCheckout(storeSlug);
  if (!store || !store.user.active) return { error: "Store not found." };
  const plan = store.user.plan as Plan;
  const wholesaleOn = hasFeature(plan, "wholesale");

  const runOrder = () =>
    prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: items.map((i) => i.productId) },
          storeId: store.id,
          status: "active",
          categoryId: { not: null },
        },
        include: { variants: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      const lineData: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let subtotal = new Prisma.Decimal(0);

      for (const item of items) {
        const product = byId.get(item.productId);
        if (!product) {
          throw new CheckoutError(
            "Something in your bag is no longer available. Remove it and try again.",
          );
        }
        const variant = item.variantId
          ? product.variants.find((v) => v.id === item.variantId)
          : undefined;
        if (product.variants.length && !variant) {
          throw new CheckoutError(`Pick an option for ${product.title}.`);
        }
        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const label = variant ? `${product.title} (${variant.name})` : product.title;

        // Take the stock only if there is enough of it (safe under races).
        if (variant) {
          const res = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          });
          if (res.count === 0) {
            throw new CheckoutError(
              variant.stock > 0
                ? `Only ${variant.stock} left of ${label}. Lower the amount and try again.`
                : `${label} just sold out.`,
            );
          }
          const left = await tx.productVariant.aggregate({
            where: { productId: product.id },
            _sum: { stock: true },
          });
          await tx.product.update({
            where: { id: product.id },
            data: { inventory: left._sum.stock ?? 0 },
          });
        } else {
          const res = await tx.product.updateMany({
            where: { id: product.id, inventory: { gte: qty } },
            data: { inventory: { decrement: qty } },
          });
          if (res.count === 0) {
            throw new CheckoutError(
              product.inventory > 0
                ? `Only ${product.inventory} left of ${label}. Lower the amount and try again.`
                : `${label} just sold out.`,
            );
          }
        }

        let unit = variant?.price != null ? variant.price : product.price;
        if (
          wholesaleOn &&
          product.wholesalePrice &&
          product.wholesaleMinQty &&
          qty >= product.wholesaleMinQty &&
          product.wholesalePrice.lessThan(unit)
        ) {
          unit = product.wholesalePrice;
        }
        subtotal = subtotal.add(new Prisma.Decimal(unit).mul(qty));

        lineData.push({
          product: { connect: { id: product.id } },
          title: product.title,
          image: Array.isArray(product.images)
            ? String((product.images as string[])[0] ?? "")
            : "",
          variant: variant?.name ?? null,
          quantity: qty,
          price: new Prisma.Decimal(unit),
        });
      }

      // Discount code (Shopfront and up), checked again on the server.
      let discountCode: string | null = null;
      let discountAmount = new Prisma.Decimal(0);
      if (options.discountCode && hasFeature(plan, "discounts")) {
        const code = cleanCode(options.discountCode);
        const row = await tx.discount.findUnique({
          where: { storeId_code: { storeId: store.id, code } },
        });
        if (!row) throw new CheckoutError("That discount code doesn't exist.");
        const check = applyDiscount(
          {
            kind: row.kind,
            value: Number(row.value.toString()),
            minTotal: row.minTotal ? Number(row.minTotal.toString()) : null,
            active: row.active,
          },
          Number(subtotal.toString()),
          (n) => formatMoney(n, store.currency),
        );
        if (!check.ok) throw new CheckoutError(check.reason);
        discountCode = code;
        discountAmount = new Prisma.Decimal(check.amount);
        await tx.discount.update({
          where: { id: row.id },
          data: { uses: { increment: 1 } },
        });
      }

      // Customers are matched by email when given, otherwise by phone.
      const name = customer.name.trim();
      const location = customer.location?.trim() || "";
      let dbCustomer = email
        ? await tx.customer.findUnique({
            where: { storeId_email: { storeId: store.id, email } },
          })
        : await tx.customer.findFirst({
            where: { storeId: store.id, phone },
          });
      if (dbCustomer) {
        if (!dbCustomer.phone) {
          dbCustomer = await tx.customer.update({
            where: { id: dbCustomer.id },
            data: { phone },
          });
        }
      } else {
        dbCustomer = await tx.customer.create({
          data: {
            storeId: store.id,
            name,
            email: email || null,
            phone,
            location,
          },
        });
      }

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
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          locationUrl,
          paymentMethod,
          discountCode,
          discountAmount: discountCode ? discountAmount : null,
          total: subtotal.sub(discountAmount),
          // Nobody has paid yet: the store confirms payment (cash or Whish).
          status: "pending",
          shippingAddress: shippingAddress.trim(),
          items: { create: lineData },
        },
      });

      if (options.cartId) {
        await tx.abandonedCart.updateMany({
          where: { id: options.cartId, storeId: store.id },
          data: { recovered: true },
        });
      }

      return number;
    });

  // Retry on the rare order-number collision; translate any failure into a
  // friendly message so the checkout UI never hangs on a rejected promise.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const orderNumber = await runOrder();
      revalidatePath(`/s/${store.slug}`, "layout");
      after(() => fireOrderWebhook(store.id, "order.created", orderNumber));
      return { orderNumber };
    } catch (e) {
      if (e instanceof CheckoutError) return { error: e.message };
      const code =
        e && typeof e === "object" && "code" in e
          ? (e as { code?: string }).code
          : undefined;
      if (code === "P2002" && attempt < 4) continue; // number race, retry
      console.error("placeOrder failed", e);
      return { error: "Something went wrong placing your order. Please try again." };
    }
  }
  return { error: "Couldn't place your order, please try again." };
}

/* ------------------------------------------------------------------ */
/* Abandoned carts (Shopfront and up)                                   */
/* ------------------------------------------------------------------ */

export interface CheckoutDraft {
  name: string;
  phone: string;
  email?: string;
  items: CheckoutItem[];
}

/**
 * Remember a checkout the shopper has started, so the owner can follow up if
 * it's never placed. Returns the row id to update on later calls.
 */
export async function saveCheckoutDraft(
  storeSlug: string,
  draftId: string | null,
  draft: CheckoutDraft,
): Promise<{ id?: string }> {
  if (phoneDigits(draft.phone).length < 7 && !EMAIL_RE.test(draft.email ?? ""))
    return {};
  if (!draft.items.length) return {};
  const store = await storeForCheckout(storeSlug);
  if (!store || !hasFeature(store.user.plan as Plan, "abandonedCart")) return {};

  const products = await prisma.product.findMany({
    where: { id: { in: draft.items.map((i) => i.productId) }, storeId: store.id },
    include: { variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  const items = draft.items.flatMap((i) => {
    const p = byId.get(i.productId);
    if (!p) return [];
    const v = p.variants.find((x) => x.id === i.variantId);
    const price = Number((v?.price ?? p.price).toString());
    const quantity = Math.max(1, Math.floor(Number(i.quantity) || 1));
    subtotal += price * quantity;
    return [
      {
        productId: p.id,
        ...(v ? { variantId: v.id, variant: v.name } : {}),
        title: p.title,
        quantity,
        price,
      },
    ];
  });
  if (!items.length) return {};

  const data = {
    name: draft.name.trim().slice(0, 120),
    phone: draft.phone.trim().slice(0, 40),
    email: (draft.email ?? "").trim().toLowerCase().slice(0, 200),
    items: items as unknown as Prisma.InputJsonValue,
    subtotal: new Prisma.Decimal(Math.round(subtotal * 100) / 100),
  };

  if (draftId) {
    const res = await prisma.abandonedCart.updateMany({
      where: { id: draftId, storeId: store.id, recovered: false },
      data,
    });
    if (res.count) return { id: draftId };
  }
  const row = await prisma.abandonedCart.create({
    data: { storeId: store.id, ...data },
    select: { id: true },
  });
  return { id: row.id };
}

/* ------------------------------------------------------------------ */
/* Order tracking                                                       */
/* ------------------------------------------------------------------ */

export interface TrackedOrder {
  number: string;
  status: "pending" | "paid" | "fulfilled" | "shipped" | "cancelled";
  placedAt: string;
  itemCount: number;
  total: number;
  paymentMethod: string;
}

/**
 * Look up an order's progress by its number. Shows the stage only, never the
 * customer's name, phone or address.
 */
export async function trackOrder(
  storeSlug: string,
  rawNumber: string,
): Promise<{ error?: string; order?: TrackedOrder }> {
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return { error: "Type your order number, for example 1001." };
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!store) return { error: "Store not found." };
  const order = await prisma.order.findFirst({
    where: { storeId: store.id, number: `#${digits}` },
    select: {
      number: true,
      status: true,
      createdAt: true,
      total: true,
      paymentMethod: true,
      items: { select: { quantity: true } },
    },
  });
  if (!order)
    return {
      error: `We couldn't find order #${digits}. Check the number on your confirmation.`,
    };
  return {
    order: {
      number: order.number,
      status: order.status,
      placedAt: order.createdAt.toISOString(),
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      total: Number(order.total.toString()),
      paymentMethod: order.paymentMethod,
    },
  };
}
