"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bold,
  GripVertical,
  Italic,
  List,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Card } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  updateProduct,
  type ProductInput,
} from "@/app/dashboard/products/actions";
import { ImageUploadButton } from "@/components/ui/image-upload-button";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VariantRow {
  id: string;
  name: string;
  price: string;
  stock: string;
}

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const isEdit = !!product;

  const [title, setTitle] = React.useState(product?.title ?? "");
  const [description, setDescription] = React.useState(
    product?.description ?? ""
  );
  const [images, setImages] = React.useState<string[]>(product?.images ?? []);
  const [price, setPrice] = React.useState(
    product ? String(product.price) : ""
  );
  const [compareAt, setCompareAt] = React.useState(
    product?.compareAt ? String(product.compareAt) : ""
  );
  const [inventory, setInventory] = React.useState(
    product ? String(product.inventory) : ""
  );
  const [sku, setSku] = React.useState(product?.sku ?? "");
  const [categoryId, setCategoryId] = React.useState(
    product?.categoryId ?? categories[0]?.id ?? ""
  );
  const [active, setActive] = React.useState(
    product ? product.status === "active" : true
  );
  const [variantLabel, setVariantLabel] = React.useState(
    product?.variantGroup?.label ?? ""
  );
  const [variants, setVariants] = React.useState<VariantRow[]>(
    product?.variantGroup?.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price ? String(v.price) : "",
      stock: String(v.stock),
    })) ?? []
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  /* image drag-to-reorder */
  const dragIndex = React.useRef<number | null>(null);

  function onDrop(target: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === target) return;
    setImages((imgs) => {
      const next = [...imgs];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  const [imageUrl, setImageUrl] = React.useState("");

  function addImageByUrl() {
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Paste a full image URL (starting with http).");
      return;
    }
    setImages((imgs) => [...imgs, url]);
    setImageUrl("");
  }

  function save() {
    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = "Give the product a name.";
    if (!price || Number(price) <= 0) next.price = "Set a price above zero.";
    if (compareAt && Number(compareAt) <= Number(price))
      next.compareAt = "Compare-at should be higher than the price.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("A couple of fields need attention");
      return;
    }

    const payload: ProductInput = {
      ...(product ? { id: product.id } : {}),
      title: title.trim(),
      description,
      details: product?.details ?? "",
      price: Number(price),
      compareAt: compareAt ? Number(compareAt) : null,
      inventory: inventory ? Number(inventory) : 0,
      sku,
      categoryId,
      status: active ? "active" : "draft",
      images,
      variantLabel: variants.length ? variantLabel : null,
      variants: variants.map((v) => ({
        name: v.name,
        price: v.price ? Number(v.price) : null,
        stock: v.stock ? Number(v.stock) : 0,
      })),
    };

    setSaving(true);
    React.startTransition(async () => {
      const result = isEdit
        ? await updateProduct(payload)
        : await createProduct(payload);
      // A successful action redirects and never returns; only errors arrive here.
      if (result?.error) {
        setSaving(false);
        toast.error(result.error);
      } else {
        toast.success(
          isEdit ? `"${title}" saved` : `"${title}" added to your catalog`,
        );
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
      {/* main column */}
      <div className="space-y-5">
        <Card className="space-y-5 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Circuit Runner — Ember"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-danger">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <div className="overflow-hidden rounded-lg border border-line-strong focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
              <div
                className="flex items-center gap-0.5 border-b border-line bg-canvas px-2 py-1.5"
                role="toolbar"
                aria-label="Text formatting"
              >
                {[
                  { icon: Bold, label: "Bold" },
                  { icon: Italic, label: "Italic" },
                  { icon: List, label: "Bulleted list" },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    aria-label={t.label}
                    className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                    onClick={() => toast.info("Formatting arrives with the backend")}
                  >
                    <t.icon className="size-3.5" />
                  </button>
                ))}
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is it, who's it for, why is it good?"
                className="min-h-36 rounded-none border-0 focus:ring-0"
              />
            </div>
          </div>
        </Card>

        {/* images */}
        <Card className="p-5">
          <Label>Images</Label>
          <p className="mt-0.5 text-xs text-ink-soft">
            Drag to reorder — the first image is the cover.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {images.map((src, i) => (
              <div
                key={src + i}
                draggable
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className={cn(
                  "group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-canvas active:cursor-grabbing",
                  i === 0 ? "border-green ring-1 ring-green/30" : "border-line"
                )}
              >
                <Image
                  src={src}
                  alt={`Product image ${i + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized={src.startsWith("blob:")}
                />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-green px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Cover
                  </span>
                )}
                <span className="absolute right-1 top-1 rounded bg-black/40 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="size-3.5" />
                </span>
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() =>
                    setImages((imgs) => imgs.filter((_, j) => j !== i))
                  }
                  className="absolute bottom-1 right-1 rounded bg-black/40 p-1 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ImageUploadButton
              multiple
              label="Upload photos"
              onUploaded={(url) => setImages((imgs) => [...imgs, url])}
            />
            <span className="text-xs text-ink-soft">or</span>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImageByUrl();
                }
              }}
              placeholder="Paste an image URL (https://…)"
              className="h-9 min-w-48 flex-1"
              aria-label="Image URL"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImageByUrl}
            >
              <Upload className="size-3.5" />
              Add URL
            </Button>
          </div>
        </Card>

        {/* variants */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>Variants</Label>
              <p className="mt-0.5 text-xs text-ink-soft">
                Sizes, colors, volumes — each with its own stock and optional
                price.
              </p>
            </div>
            {variants.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVariantLabel("Size");
                  setVariants([
                    { id: crypto.randomUUID(), name: "", price: "", stock: "" },
                  ]);
                }}
              >
                <Plus className="size-3.5" />
                Add variants
              </Button>
            )}
          </div>

          {variants.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="max-w-56 space-y-1.5">
                <Label htmlFor="variant-label" className="text-xs">
                  Option name
                </Label>
                <Input
                  id="variant-label"
                  value={variantLabel}
                  onChange={(e) => setVariantLabel(e.target.value)}
                  placeholder="Size"
                  className="h-9"
                />
              </div>
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_2.5rem] gap-2 border-b border-line bg-canvas px-3 py-2 text-xs font-medium text-ink-soft">
                  <span>{variantLabel || "Option"}</span>
                  <span>Price (optional)</span>
                  <span>Stock</span>
                  <span />
                </div>
                {variants.map((v, i) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-[1.5fr_1fr_1fr_2.5rem] items-center gap-2 border-b border-line px-3 py-2 last:border-0"
                  >
                    <Input
                      aria-label={`${variantLabel || "Variant"} ${i + 1} name`}
                      value={v.name}
                      placeholder={variantLabel === "Size" ? "US 9" : "Option"}
                      className="h-8 text-[13px]"
                      onChange={(e) =>
                        setVariants((vs) =>
                          vs.map((x) =>
                            x.id === v.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                    />
                    <Input
                      aria-label={`Variant ${i + 1} price`}
                      value={v.price}
                      type="number"
                      placeholder={price || "—"}
                      className="h-8 text-[13px]"
                      onChange={(e) =>
                        setVariants((vs) =>
                          vs.map((x) =>
                            x.id === v.id ? { ...x, price: e.target.value } : x
                          )
                        )
                      }
                    />
                    <Input
                      aria-label={`Variant ${i + 1} stock`}
                      value={v.stock}
                      type="number"
                      placeholder="0"
                      className="h-8 text-[13px]"
                      onChange={(e) =>
                        setVariants((vs) =>
                          vs.map((x) =>
                            x.id === v.id ? { ...x, stock: e.target.value } : x
                          )
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove variant ${i + 1}`}
                      onClick={() =>
                        setVariants((vs) => vs.filter((x) => x.id !== v.id))
                      }
                    >
                      <Trash2 className="size-3.5 text-ink-soft" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setVariants((vs) => [
                    ...vs,
                    { id: crypto.randomUUID(), name: "", price: "", stock: "" },
                  ])
                }
              >
                <Plus className="size-3.5" />
                Add another
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* side column */}
      <div className="space-y-5">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="active">Visible in store</Label>
              <p className="mt-0.5 text-xs text-ink-soft">
                {active ? "Customers can buy this." : "Saved as a draft."}
              </p>
            </div>
            <Switch id="active" checked={active} onCheckedChange={setActive} />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="48.00"
              aria-invalid={!!errors.price}
            />
            {errors.price && (
              <p className="text-xs text-danger">{errors.price}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compare-at">Compare-at price</Label>
            <Input
              id="compare-at"
              type="number"
              min="0"
              step="0.01"
              value={compareAt}
              onChange={(e) => setCompareAt(e.target.value)}
              placeholder="Optional — shows as a strikethrough"
              aria-invalid={!!errors.compareAt}
            />
            {errors.compareAt && (
              <p className="text-xs text-danger">{errors.compareAt}</p>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="inventory">Inventory</Label>
            <Input
              id="inventory"
              type="number"
              min="0"
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              placeholder="0"
              disabled={variants.length > 0}
            />
            {variants.length > 0 && (
              <p className="text-xs text-ink-soft">
                Tracked per variant while variants exist.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="VLT-XX-000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Collection</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger aria-label="Collection">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="flex gap-2.5">
          <Button className="flex-1" size="lg" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Add product"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/dashboard/products")}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
