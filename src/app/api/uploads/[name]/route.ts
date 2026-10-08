import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const NAME_RE = /^[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif)$/;
const TYPE_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  // Reject anything that isn't a plain uploaded filename (no path traversal).
  if (!NAME_RE.test(name)) {
    return new Response("Not found", { status: 404 });
  }
  const ext = name.split(".").pop() as string;
  const file = path.join(process.cwd(), "public", "uploads", name);
  try {
    const bytes = await readFile(file);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": TYPE_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
