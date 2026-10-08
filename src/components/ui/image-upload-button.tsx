"use client";

import * as React from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Pick an image file from the device, upload it to /api/upload, and hand the
 * resulting URL back via onUploaded. Local-only (saves under public/uploads).
 */
export function ImageUploadButton({
  onUploaded,
  label = "Upload",
  multiple = false,
  className,
}: {
  onUploaded: (url: string) => void;
  label?: string;
  multiple?: boolean;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function uploadOne(file: File): Promise<void> {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    if (!res.ok || !data.url) {
      throw new Error(data.error ?? "Upload failed.");
    }
    onUploaded(data.url);
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        await uploadOne(file);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        {busy ? "Uploading…" : label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple={multiple}
        className="sr-only"
        onChange={onChange}
      />
    </>
  );
}
