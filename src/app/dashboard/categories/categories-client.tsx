"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadButton } from "@/components/ui/image-upload-button";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/dashboard/categories/actions";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";

export function CategoriesClient({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [editTarget, setEditTarget] = React.useState<Category | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editImage, setEditImage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function create() {
    if (name.trim().length < 2) {
      setError("Give the collection a name.");
      return;
    }
    startTransition(async () => {
      const res = await createCategory(name);
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(
        `"${name.trim()}" created, assign products from the product form`,
      );
      setName("");
      setError("");
      setOpen(false);
      router.refresh();
    });
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditImage(cat.image ?? "");
  }

  function doSaveEdit() {
    if (!editTarget) return;
    startTransition(async () => {
      const res = await updateCategory(editTarget.id, {
        name: editName,
        image: editImage,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Collection updated");
      setEditTarget(null);
      router.refresh();
    });
  }

  function remove(cat: Category) {
    startTransition(async () => {
      const res = await deleteCategory(cat.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`"${cat.name}" deleted. Its products moved to another collection.`);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Collections"
        sub="Group products so customers can browse by type."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                New collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New collection</DialogTitle>
                <DialogDescription>
                  Name it the way a customer would look for it, “Sneakers”, not
                  “SKU group A”.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={name}
                  autoFocus
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. New arrivals"
                  aria-invalid={!!error}
                  onKeyDown={(e) => e.key === "Enter" && create()}
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                {name.trim() && (
                  <p className="text-xs text-ink-soft">
                    Will live at /shop?collection={slugify(name)}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={create} disabled={pending}>
                  Create collection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderOpen />}
          title="No collections yet"
          description="Collections keep a growing catalog browsable, customers filter by them in your shop."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New collection
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id} className="group overflow-hidden">
              <div className="relative aspect-[16/8] bg-canvas">
                {c.image ? (
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 320px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-soft">
                    <FolderOpen className="size-6" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{c.name}</h2>
                  <p className="text-xs text-ink-soft">
                    {counts[c.id] ?? 0}{" "}
                    {(counts[c.id] ?? 0) === 1 ? "product" : "products"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${c.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(c)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onClick={() => remove(c)}>
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
            <DialogDescription>
              Rename it and set a cover image, the image shows on your
              storefront&apos;s collections section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cover image</Label>
              {editImage ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editImage}
                    alt=""
                    className="h-20 w-32 rounded-md border border-line object-cover"
                  />
                  <div className="flex flex-col gap-2">
                    <ImageUploadButton
                      label="Replace"
                      onUploaded={(url) => setEditImage(url)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditImage("")}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <ImageUploadButton
                    label="Upload image"
                    onUploaded={(url) => setEditImage(url)}
                  />
                  <span className="text-xs text-ink-soft">or</span>
                  <Input
                    placeholder="Paste an image URL"
                    className="min-w-40 flex-1"
                    onChange={(e) => setEditImage(e.target.value.trim())}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={doSaveEdit} disabled={pending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
