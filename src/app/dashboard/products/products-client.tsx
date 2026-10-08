"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  CheckCircle2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteProduct,
  deleteProducts,
  duplicateProduct,
  setProductsStatus,
} from "@/app/dashboard/products/actions";
import { limitReached, productLimit, type Plan } from "@/lib/plan";
import type { Category, Product } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function ProductsClient({
  products,
  categories,
  plan,
}: {
  products: Product[];
  categories: Category[];
  plan: Plan;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "active" | "draft">("all");
  const [category, setCategory] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const atLimit = limitReached(products.length, plan);
  const cap = productLimit(plan);
  const countLabel = Number.isFinite(cap)
    ? `${products.length} / ${cap} products used on the free plan`
    : `${products.length} ${products.length === 1 ? "product" : "products"} in your catalog`;

  const filtered = products.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (category !== "all" && p.categoryId !== category) return false;
    if (query && !p.title.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  const allSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(
    action: () => Promise<void | { error?: string }>,
    message: string,
  ) {
    startTransition(async () => {
      const res = await action();
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(message);
      setSelected(new Set());
      router.refresh();
    });
  }

  function bulkSetStatus(next: "active" | "draft") {
    const ids = [...selected];
    run(
      () => setProductsStatus(ids, next),
      `${ids.length} ${ids.length === 1 ? "product" : "products"} set to ${next}`,
    );
  }

  function bulkDelete() {
    const ids = [...selected];
    run(
      () => deleteProducts(ids),
      `${ids.length} ${ids.length === 1 ? "product" : "products"} deleted`,
    );
  }

  function deleteOne(id: string, title: string) {
    run(() => deleteProduct(id), `"${title}" deleted`);
  }

  function duplicate(id: string, title: string) {
    run(() => duplicateProduct(id), `"${title}" duplicated as draft`);
  }

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="Products"
        sub={countLabel}
        actions={
          atLimit ? (
            <Button size="sm" variant="outline" asChild>
              <Link href="/pricing">Upgrade to add more</Link>
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href="/dashboard/products/new">
                <Plus className="size-4" />
                Add product
              </Link>
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="h-9 pl-9"
              aria-label="Search products"
            />
          </div>
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-44" aria-label="Filter by collection">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-green-wash/50 px-4 py-2.5">
            <span className="text-[13px] font-medium text-ink">
              {selected.size} selected
            </span>
            <span className="h-4 w-px bg-line-strong" aria-hidden />
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => bulkSetStatus("active")}
            >
              <CheckCircle2 className="size-3.5" />
              Set active
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => bulkSetStatus("draft")}
            >
              <Archive className="size-3.5" />
              Set draft
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-danger hover:bg-danger-wash"
              onClick={bulkDelete}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Package />}
              title={
                query || status !== "all" ? "Nothing matches" : "No products yet"
              }
              description={
                query || status !== "all"
                  ? "Try a different search or clear the filters."
                  : "Your shelf is empty. Add your first product and it'll show up in your storefront immediately."
              }
              action={
                <Button asChild>
                  <Link href="/dashboard/products/new">
                    <Plus className="size-4" />
                    Add product
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all products"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Collection</TableHead>
                <TableHead className="hidden sm:table-cell">Inventory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  data-state={selected.has(p.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                      aria-label={`Select ${p.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/products/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas">
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </span>
                      <span>
                        <span className="block font-medium text-ink hover:underline">
                          {p.title}
                        </span>
                        <span className="block text-xs text-ink-soft">
                          {p.sku}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-ink-soft md:table-cell">
                    {categoryName(p.categoryId)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {p.inventory === 0 ? (
                      <span className="text-[13px] font-medium text-danger">
                        Out of stock
                      </span>
                    ) : p.inventory <= 10 ? (
                      <span className="text-[13px] font-medium text-warn">
                        {p.inventory} left
                      </span>
                    ) : (
                      <span className="text-[13px] text-ink-body">
                        {p.inventory} in stock
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "green" : "outline"}>
                      {p.status === "active" ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-ink">
                      {formatMoney(p.price)}
                    </span>
                    {p.compareAt && (
                      <span className="ml-1.5 text-xs text-ink-soft line-through">
                        {formatMoney(p.compareAt)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${p.title}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/products/${p.id}`)
                          }
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate(p.id, p.title)}>
                          <Package />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          destructive
                          onClick={() => deleteOne(p.id, p.title)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="border-t border-line px-4 py-3 text-xs text-ink-soft">
          Showing {filtered.length} of {products.length} products
        </div>
      </Card>
    </>
  );
}
