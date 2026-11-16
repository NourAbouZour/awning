"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { addStaff, removeStaff, setStaffActive } from "./actions";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

const EMPTY_FORM = { name: "", email: "", password: "" };

export function StaffClient({
  staff,
  storeName,
}: {
  staff: StaffMember[];
  storeName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [error, setError] = React.useState("");
  const [removeTarget, setRemoveTarget] = React.useState<StaffMember | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError("Add their name, 2+ characters.");
    if (!form.email.includes("@")) return setError("Add their email address.");
    if (form.password.length < 8)
      return setError("Use a temporary password of at least 8 characters.");
    startTransition(async () => {
      try {
        const res = await addStaff(form);
        if (res.error) {
          setError(res.error);
          return;
        }
        toast.success(
          `${form.name.trim()} can now log in with ${form.email.trim().toLowerCase()}`,
        );
        setForm(EMPTY_FORM);
        setOpen(false);
        router.refresh();
      } catch {
        setError("Something went wrong, please try again.");
      }
    });
  }

  function toggle(member: StaffMember) {
    startTransition(async () => {
      try {
        const res = await setStaffActive(member.id, !member.active);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(
          member.active
            ? `${member.name} is suspended and can't log in`
            : `${member.name} can log in again`,
        );
        router.refresh();
      } catch {
        toast.error("Something went wrong, please try again.");
      }
    });
  }

  function remove() {
    if (!removeTarget) return;
    const member = removeTarget;
    startTransition(async () => {
      try {
        const res = await removeStaff(member.id);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`${member.name} was removed`);
        setRemoveTarget(null);
        router.refresh();
      } catch {
        toast.error("Something went wrong, please try again.");
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Staff"
        sub="Give your team their own login to help run the shop."
        actions={
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setError("");
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                Add staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={create}>
                <DialogHeader>
                  <DialogTitle>Add a staff member</DialogTitle>
                  <DialogDescription>
                    Share the email and temporary password with them. They log
                    in at /login and land in the {storeName} dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="staff-name">Name</Label>
                    <Input
                      id="staff-name"
                      value={form.name}
                      autoFocus
                      autoComplete="off"
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Maya Haddad"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="staff-email">Email</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      value={form.email}
                      autoComplete="off"
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="maya@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="staff-password">Temporary password</Label>
                    <Input
                      id="staff-password"
                      type="text"
                      value={form.password}
                      autoComplete="new-password"
                      spellCheck={false}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  {error && <p className="text-xs text-danger">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending}>
                    Add staff
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-5 bg-green-wash/60 p-5">
        <h2 className="text-sm font-semibold text-ink">What staff can do</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-body">
          Staff log in at /login with the email and password you set here. They
          can manage products, orders, collections, customers and messages for{" "}
          {storeName}. They can&apos;t change your plan, your staff, or API
          settings.
        </p>
      </Card>

      {staff.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No staff yet"
          description="Add someone who helps you pack orders or answer customers, they get their own login."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Add staff
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-medium text-ink">{m.name}</p>
                    <p className="text-xs text-ink-soft sm:hidden">{m.email}</p>
                  </TableCell>
                  <TableCell className="hidden text-ink-body sm:table-cell">
                    {m.email}
                  </TableCell>
                  <TableCell className="hidden text-ink-soft md:table-cell">
                    {formatDate(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    {m.active ? (
                      <Badge variant="green">Active</Badge>
                    ) : (
                      <Badge variant="amber">Suspended</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${m.name}`}
                          disabled={pending}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggle(m)}>
                          {m.active ? <Pause /> : <Play />}
                          {m.active ? "Suspend" : "Reactivate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          destructive
                          onClick={() => setRemoveTarget(m)}
                        >
                          <Trash2 />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.name}?</DialogTitle>
            <DialogDescription>
              Their login is deleted and they lose access to {storeName} right
              away. Orders and products they worked on stay as they are. To
              pause access for a while instead, suspend them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove} disabled={pending}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
