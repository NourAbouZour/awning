import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  // Only signed-in merchants may upload.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WebP, or GIF image." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is larger than 5 MB." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}.${ext}`;

  // On Vercel (and any host with Blob configured) the filesystem is
  // read-only, so persist to Vercel Blob. A connected Blob store exposes
  // BLOB_STORE_ID and authenticates via the runtime's Vercel OIDC token;
  // outside Vercel a BLOB_READ_WRITE_TOKEN is used instead. The SDK resolves
  // whichever is available, so we don't pass a token explicitly. With neither
  // present (plain local dev) we fall back to writing under public/uploads.
  const blobConfigured = Boolean(
    process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN,
  );
  if (blobConfigured) {
    try {
      const blob = await put(`products/${name}`, bytes, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url });
    } catch (err) {
      console.error("[upload] Vercel Blob put failed:", err);
      return NextResponse.json(
        { error: "Could not store the image. Please try again." },
        { status: 502 },
      );
    }
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    // Served via the /api/uploads route so files uploaded at runtime are
    // available under `next start` (which only maps public/ at boot).
    return NextResponse.json({ url: `/api/uploads/${name}` });
  } catch (err) {
    console.error("[upload] local write failed:", err);
    return NextResponse.json(
      { error: "Could not store the image. Please try again." },
      { status: 500 },
    );
  }
}
