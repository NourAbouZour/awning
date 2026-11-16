"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bold,
  GripVertical,
  Sparkles,
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
import { generateProductCopy } from "@/app/dashboard/products/ai-actions";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VariantRow {
  id: string;
  name: string;
  price: string;
  stock: string;
  isDefault: boolean;
}

/** Which paid product tools the store's plan includes. */
export interface ProductFormFeatures {
  wholesale: boolean;
  aiSeo: boolean;
  /** Shopfront: a percent-off sale on the product. */
  sales: boolean;
  /** Shopfront: link other products to recommend with this one. */
  upsell: boolean;
  /** The server has AI credentials, so the AI button can work. */
  aiReady: boolean;
}

const NO_COLLECTION = "__none__";

export function ProductForm({
  product,
  categories,
  features = {
    wholesale: false,
    aiSeo: false,
    sales: false,
    upsell: false,
    aiReady: false,
  },
  otherProducts = [],
}: {
  product?: Product;
  categories: Category[];
  features?: ProductFormFeatures;
  /** The store's other products, to pick recommendations from. */
  otherProducts?: { id: string; title: string; image?: string }[];
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
    product ? product.categoryId : (categories[0]?.id ?? "")
  );
  const [wholesalePrice, setWholesalePrice] = React.useState(
    product?.wholesalePrice ? String(product.wholesalePrice) : ""
  );
  const [wholesaleMinQty, setWholesaleMinQty] = React.useState(
    product?.wholesaleMinQty ? String(product.wholesaleMinQty) : ""
  );
  const [seoTitle, setSeoTitle] = React.useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = React.useState(
    product?.seoDescription ?? ""
  );
  const [salePercent, setSalePercent] = React.useState(
    product?.salePercent ? String(product.salePercent) : ""
  );
  const [relatedIds, setRelatedIds] = React.useState<string[]>(
    product?.relatedIds ?? []
  );
  const [relatedQuery, setRelatedQuery] = React.useState("");
  const [aiNotes, setAiNotes] = React.useState("");
  const [writing, setWriting] = React.useState(false);
  const [active, setActive] = React.useState(
    product ? product.status === "active" : true
  );
  const [variantLabel, setVariantLabel] = React.useState(
    product?.variantGroup?.label ?? ""
  );
  const [variants, setVariants] = React.useState<VariantRow[]>(
    () => {
      const vs = product?.variantGroup?.variants ?? [];
      // Older products have no option marked: the first one drives the card.
      const marked = vs.some((v) => v.isDefault);
      return vs.map((v, i) => ({
        id: v.id,
        name: v.name,
        price: v.price ? String(v.price) : "",
        stock: String(v.stock),
        isDefault: marked ? !!v.isDefault : i === 0,
      }));
    }
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

  function writeWithAi() {
    setWriting(true);
    React.startTransition(async () => {
      const res = await generateProductCopy({
        title,
        price,
        notes: aiNotes || description,
        collection: categories.find((c) => c.id === categoryId)?.name,
      });
      setWriting(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.description) setDescription(res.description);
      if (res.seoTitle) setSeoTitle(res.seoTitle);
      if (res.seoDescription) setSeoDescription(res.seoDescription);
      toast.success("Description and SEO written. Read it over before saving.");
    });
  }

  function save() {
    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = "Give the product a name.";
    if (!price || Number(price) <= 0) next.price = "Set a price above zero.";
    if (compareAt && Number(compareAt) <= Number(price))
      next.compareAt = "Compare-at should be higher than the price.";
    if (
      features.sales &&
      salePercent &&
      (Number(salePercent) < 1 || Number(salePercent) > 90)
    )
      next.sale = "A sale is between 1 and 90 percent off.";
    if (
      features.wholesale &&
      wholesalePrice &&
      (Number(wholesalePrice) <= 0 || Number(wholesaleMinQty) < 2)
    )
      next.wholesale = "Set a wholesale price and a minimum of 2 or more.";
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
        isDefault: v.isDefault,
      })),
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      wholesaleMinQty: wholesaleMinQty ? Number(wholesaleMinQty) : null,
      seoTitle,
      seoDescription,
      salePercent: salePercent ? Number(salePercent) : null,
      relatedIds,
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
              placeholder="e.g. Circuit Runner, Ember"
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
            Drag to reorder, the first image is the cover.
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
                Sizes, colors, volumes, each with its own stock and optional
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
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      price: "",
                      stock: "",
                      isDefault: true,
                    },
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
                <div className="grid grid-cols-[2.75rem_1.5fr_1fr_1fr_2.5rem] gap-2 border-b border-line bg-canvas px-3 py-2 text-xs font-medium text-ink-soft">
                  <span title="The price shown on shop cards">Card</span>
                  <span>{variantLabel || "Option"}</span>
                  <span>Price (optional)</span>
                  <span>Stock</span>
                  <span />
                </div>
                {variants.map((v, i) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-[2.75rem_1.5fr_1fr_1fr_2.5rem] items-center gap-2 border-b border-line px-3 py-2 last:border-0"
                  >
                    <label className="flex justify-center">
                      <input
                        type="radio"
                        name="card-variant"
                        className="size-4 accent-[var(--green)]"
                        checked={v.isDefault}
                        aria-label={`Show ${v.name || "this option"}'s price on shop cards`}
                        onChange={() =>
                          setVariants((vs) =>
                            vs.map((x) => ({ ...x, isDefault: x.id === v.id }))
                          )
                        }
                      />
                    </label>
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
                      placeholder={price || "-"}
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
                        setVariants((vs) => {
                          const rest = vs.filter((x) => x.id !== v.id);
                          if (v.isDefault && rest.length)
                            rest[0] = { ...rest[0], isDefault: true };
                          return rest;
                        })
                      }
                    >
                      <Trash2 className="size-3.5 text-ink-soft" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-soft">
                The price of the option ticked under &quot;Card&quot; is the one
                shown on your shop cards. Leave a price blank to use the main
                price.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setVariants((vs) => [
                    ...vs,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      price: "",
                      stock: "",
                      isDefault: vs.length === 0,
                    },
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
              placeholder="Optional, shows as a strikethrough"
              aria-invalid={!!errors.compareAt}
            />
            {errors.compareAt && (
              <p className="text-xs text-danger">{errors.compareAt}</p>
            )}
          </div>
          {features.sales && (
            <div className="space-y-1.5 border-t border-line pt-4">
              <Label htmlFor="sale-percent">Sale</Label>
              <div className="flex items-center overflow-hidden rounded-lg border border-line-strong bg-paper focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
                <input
                  id="sale-percent"
                  type="number"
                  min="1"
                  max="90"
                  step="1"
                  inputMode="numeric"
                  className="h-10 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
                  value={salePercent}
                  onChange={(e) => setSalePercent(e.target.value)}
                  placeholder="No sale"
                  aria-invalid={!!errors.sale}
                />
                <span className="border-l border-line bg-canvas px-3 text-sm text-ink-soft">
                  % off
                </span>
              </div>
              {errors.sale ? (
                <p className="text-xs text-danger">{errors.sale}</p>
              ) : (
                <p className="text-xs text-ink-soft">
                  {salePercent && Number(price) > 0 && Number(salePercent) > 0
                    ? `Shoppers pay ${(
                        Math.round(
                          Number(price) * (100 - Math.min(90, Number(salePercent))),
                        ) / 100
                      ).toFixed(2)} instead of ${Number(price).toFixed(2)}.`
                    : "Takes a percentage off this product. Leave empty for no sale."}{" "}
                  To put a whole collection on sale, edit it in Collections.
                </p>
              )}
            </div>
          )}
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
            <Select
              value={categoryId || NO_COLLECTION}
              onValueChange={(v) => setCategoryId(v === NO_COLLECTION ? "" : v)}
            >
              <SelectTrigger
                aria-label="Collection"
                className={cn(!categoryId && "border-danger text-danger")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COLLECTION}>No collection</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!categoryId && (
              <p className="flex items-start gap-1.5 rounded-lg bg-danger-wash px-2.5 py-2 text-xs text-danger">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                Without a collection this product can&apos;t appear on your
                website. Pick one to show it.
              </p>
            )}
          </div>
        </Card>

        {features.upsell && (
          <Card className="space-y-3 p-5">
            <div>
              <Label>Recommend with this product</Label>
              <p className="mt-0.5 text-xs text-ink-soft">
                Pick up to 8 products to show as &quot;Goes well with&quot; on
                this product&apos;s page and first in the shopper&apos;s bag.
              </p>
            </div>
            {otherProducts.length === 0 ? (
              <p className="text-xs text-ink-soft">
                Add more products first, then link them here.
              </p>
            ) : (
              <>
                {otherProducts.length > 6 && (
                  <Input
                    value={relatedQuery}
                    onChange={(e) => setRelatedQuery(e.target.value)}
                    placeholder="Search your products"
                    className="h-9"
                    aria-label="Search products to recommend"
                  />
                )}
                <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                  {otherProducts
                    .filter(
                      (p) =>
                        !relatedQuery ||
                        p.title
                          .toLowerCase()
                          .includes(relatedQuery.toLowerCase()),
                    )
                    .map((p) => {
                      const checked = relatedIds.includes(p.id);
                      const full = !checked && relatedIds.length >= 8;
                      return (
                        <li key={p.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px]",
                              full && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-[var(--green)]"
                              checked={checked}
                              disabled={full}
                              onChange={() =>
                                setRelatedIds((ids) =>
                                  checked
                                    ? ids.filter((id) => id !== p.id)
                                    : [...ids, p.id],
                                )
                              }
                            />
                            <span className="relative size-7 shrink-0 overflow-hidden rounded border border-line bg-canvas">
                              {p.image && (
                                <Image
                                  src={p.image}
                                  alt=""
                                  fill
                                  sizes="28px"
                                  className="object-cover"
                                />
                              )}
                            </span>
                            <span className="min-w-0 truncate text-ink-body">
                              {p.title}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                </ul>
                <p className="text-xs text-ink-soft">
                  {relatedIds.length === 0
                    ? "Nothing linked yet."
                    : `${relatedIds.length} linked.`}
                </p>
              </>
            )}
          </Card>
        )}

        {features.wholesale && (
          <Card className="space-y-4 p-5">
            <div>
              <Label>Wholesale price</Label>
              <p className="mt-0.5 text-xs text-ink-soft">
                Shoppers who buy at least the minimum quantity pay this price
                per item.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wholesale-price" className="text-xs">
                  Price per item
                </Label>
                <Input
                  id="wholesale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  placeholder="e.g. 12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wholesale-min" className="text-xs">
                  From quantity
                </Label>
                <Input
                  id="wholesale-min"
                  type="number"
                  min="2"
                  step="1"
                  value={wholesaleMinQty}
                  onChange={(e) => setWholesaleMinQty(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
            </div>
            {errors.wholesale && (
              <p className="text-xs text-danger">{errors.wholesale}</p>
            )}
          </Card>
        )}

        {features.aiSeo && (
          <Card className="space-y-4 p-5">
            <div>
              <Label>Search engines (SEO)</Label>
              <p className="mt-0.5 text-xs text-ink-soft">
                How this product shows up on Google. Leave blank to use the
                title and description.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seo-title" className="text-xs">
                SEO title ({seoTitle.length}/70)
              </Label>
              <Input
                id="seo-title"
                maxLength={70}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seo-desc" className="text-xs">
                Meta description ({seoDescription.length}/160)
              </Label>
              <Textarea
                id="seo-desc"
                rows={3}
                maxLength={160}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2 border-t border-line pt-4">
              <Label htmlFor="ai-notes" className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-green" />
                Write with AI
              </Label>
              <Textarea
                id="ai-notes"
                rows={3}
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                placeholder="A few facts: material, size, what it's for, who it's for"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={writeWithAi}
                disabled={writing || !features.aiReady}
              >
                {writing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {writing
                  ? "Writing…"
                  : "Write description and SEO"}
              </Button>
              {!features.aiReady && (
                <p className="text-xs text-ink-soft">
                  AI writing isn&apos;t switched on for Shopleb yet.
                </p>
              )}
            </div>
          </Card>
        )}

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
