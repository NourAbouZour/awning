"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import { assertFeature, requireCurrentStore } from "@/lib/auth";

const ProductCopy = z.object({
  description: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
});

export interface ProductCopyInput {
  title: string;
  price: string;
  notes: string;
  collection?: string;
}

export interface ProductCopyResult {
  error?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

/** True when the server has Claude credentials, so the AI button can show. */
export async function aiConfigured(): Promise<boolean> {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Arcade: write a product description plus an SEO title and meta description
 * with Claude. Needs ANTHROPIC_API_KEY on the server.
 */
export async function generateProductCopy(
  input: ProductCopyInput,
): Promise<ProductCopyResult> {
  await assertFeature("aiSeo");
  const store = await requireCurrentStore();

  if (input.title.trim().length < 2) {
    return { error: "Give the product a name first." };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "AI writing isn't switched on yet. Ask us on WhatsApp to turn it on.",
    };
  }

  const client = new Anthropic();
  const facts = [
    `Store: ${store.name}`,
    `Product: ${input.title.trim()}`,
    input.price ? `Price: ${input.price} ${store.currency}` : "",
    input.collection ? `Collection: ${input.collection}` : "",
    input.notes.trim() ? `Owner's notes:\n${input.notes.trim().slice(0, 2000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: {
        effort: "low",
        format: zodOutputFormat(ProductCopy),
      },
      system:
        "You write product copy for small online shops, many of them in Lebanon. Write in clear, warm, plain English. Use only facts given by the shop owner; never invent materials, sizes, certifications or claims. Do not use em dashes.",
      messages: [
        {
          role: "user",
          content: `${facts}

Write:
- description: 2 short paragraphs (60 to 120 words in total) for the product page.
- seoTitle: under 60 characters, product name first, then the store name.
- seoDescription: under 155 characters, a search result summary that makes people want to click.`,
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { error: "Couldn't write copy for this product. Try adding a few notes." };
    }
    const out = response.parsed_output;
    return {
      description: out.description.trim(),
      seoTitle: out.seoTitle.trim().slice(0, 70),
      seoDescription: out.seoDescription.trim().slice(0, 160),
    };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return { error: "The AI writer is busy. Try again in a minute." };
    }
    if (e instanceof Anthropic.APIError) {
      console.error("generateProductCopy failed", e.status, e.message);
      return { error: "The AI writer isn't available right now." };
    }
    throw e;
  }
}
