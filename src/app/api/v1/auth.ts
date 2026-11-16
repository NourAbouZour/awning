import { prisma } from "@/lib/db";
import { hasFeature, type Plan } from "@/lib/plan";

// Shared by the read-only REST routes under /api/v1. Not a route itself.

export interface ApiStore {
  id: string;
  slug: string;
  currency: string;
}

type AuthResult = { store: ApiStore } | { response: Response };

function error(status: number, message: string) {
  return Response.json(
    { error: message },
    {
      status,
      headers:
        status === 401 ? { "WWW-Authenticate": 'Bearer realm="shopleb"' } : {},
    },
  );
}

/** Resolve `Authorization: Bearer <key>` to a store whose plan includes the API. */
export async function authenticate(request: Request): Promise<AuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) {
    return {
      response: error(401, "Missing API key. Send Authorization: Bearer <key>."),
    };
  }

  const store = await prisma.store.findUnique({
    where: { apiKey: match[1] },
    select: {
      id: true,
      slug: true,
      currency: true,
      user: { select: { plan: true } },
    },
  });
  if (!store) return { response: error(401, "Invalid API key.") };

  if (!hasFeature(store.user.plan as Plan, "api")) {
    return {
      response: error(403, "API access is part of the Arcade plan."),
    };
  }

  return { store: { id: store.id, slug: store.slug, currency: store.currency } };
}
