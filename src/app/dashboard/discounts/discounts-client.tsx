"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, TicketPercent, Trash2 } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createDiscount,
  deleteDiscount,
  setDiscountActive,
} from "@/app/dashboard/discounts/actions";
import { formatMoney } from "@/lib/utils";

export interface DiscountRow {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minTotal: number | null;
  active: boolean;
  uses: number;
}

const CODE_PATTERN = /^[A-Z0-9-]{3,24}$/;

function cleanCode(raw: string) {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

function describeValue(d: Pick<DiscountRow, "kind" | "value">, currency: string) {
  return d.kind === "percent"
    ? `${d.value}% off`
    : `${formatMoney(d.value, currency)} off`;
}

export function DiscountsClient({
  discounts,
  currency,
}: {
  discounts: DiscountRow[];
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [kind, setKind] = React.useState<"percent" | "fixed">("percent");
  const [value, setValue] = React.useState("");
  const [minTotal, setMinTotal] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  // Optimistic switch state while the server catches up.
  const [activeOverride, setActiveOverride] = React.useState<
    Record<string, boolean>
  >({});

  function reset() {
    setCode("");
    setKind("percent");
    setValue("");
    setMinTotal("");
    setError("");
  }

  function validate(): string | null {
    if (!CODE_PATTERN.test(code)) {
      return "Use 3 to 24 letters, numbers or dashes, like SUMMER-10.";
    }
    const v = Number(value);
    if (!value.trim() || !Number.isFinite(v)) {
      return "Enter how much the code takes off.";
    }
    if (kind === "percent" && (v < 1 || v > 100)) {
      return "A percentage has to be between 1 and 100.";
    }
    if (kind === "fixed" && v <= 0) {
      return "The amount off has to be more than 0.";
    }
    if (minTotal.trim()) {
      const m = Number(minTotal);
      if (!Number.isFinite(m) || m < 0) {
        return "The minimum order has to be 0 or more.";
      }
    }
    return null;
  }

  function create() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    startTransition(async () => {
      const res = await createDiscount({
        code,
        kind,
        value: Number(value),
        minTotal: minTotal.trim() ? Number(minTotal) : null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(`${code} is live, customers can use it at checkout`);
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  function toggle(d: DiscountRow, active: boolean) {
    setActiveOverride((o) => ({ ...o, [d.id]: active }));
    startTransition(async () => {
      const res = await setDiscountActive(d.id, active);
      if (res.error) {
        setActiveOverride((o) => ({ ...o, [d.id]: !active }));
        toast.error(res.error);
        return;
      }
      toast.success(active ? `${d.code} is on` : `${d.code} is paused`);
      router.refresh();
    });
  }

  function remove(d: DiscountRow) {
    startTransition(async () => {
      const res = await deleteDiscount(d.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${d.code} deleted`);
      router.refresh();
    });
  }

  const preview =
    value.trim() && Number.isFinite(Number(value)) && Number(value) > 0
      ? describeValue({ kind, value: Number(value) }, currency)
      : null;

  return (
    <>
      <PageHeader
        title="Discount codes"
        sub="Customers type a code at checkout and the discount comes off their order."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            New code
          </Button>
        }
      />

      {discounts.length === 0 ? (
        <EmptyState
          icon={<TicketPercent />}
          title="No discount codes yet"
          description="Make a code like WELCOME-10, share it on Instagram or WhatsApp, and shoppers type it at checkout to save."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New code
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Minimum order
                </TableHead>
                <TableHead className="hidden sm:table-cell text-right">
                  Uses
                </TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Delete</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((d) => {
                const active = activeOverride[d.id] ?? d.active;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <span className="font-mono text-[13px] font-semibold tracking-wide text-ink">
                        {d.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-ink-body">
                      {describeValue(d, currency)}
                    </TableCell>
                    <TableCell className="hidden text-ink-soft sm:table-cell">
                      {d.minTotal ? formatMoney(d.minTotal, currency) : "None"}
                    </TableCell>
                    <TableCell className="hidden text-right text-ink-body sm:table-cell">
                      {d.uses}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={active}
                        onCheckedChange={(v) => toggle(d, v)}
                        aria-label={
                          active ? `Pause ${d.code}` : `Turn on ${d.code}`
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${d.code}`}
                        disabled={pending}
                        onClick={() => remove(d)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New discount code</DialogTitle>
            <DialogDescription>
              Share the code with your customers. They type it at checkout and
              the discount comes off right away.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="discount-code">Code</Label>
              <Input
                id="discount-code"
                value={code}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="font-mono uppercase tracking-wide"
                onChange={(e) => {
                  setCode(cleanCode(e.target.value));
                  setError("");
                }}
                placeholder="e.g. SUMMER-10"
                aria-invalid={!!error}
              />
              <p className="text-xs text-ink-soft">
                Letters, numbers and dashes, 3 to 24 characters.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="discount-kind">Type</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => {
                    setKind(v as "percent" | "fixed");
                    setError("");
                  }}
                >
                  <SelectTrigger id="discount-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage off</SelectItem>
                    <SelectItem value="fixed">Fixed amount off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount-value">
                  {kind === "percent" ? "Percent off" : `Amount off (${currency})`}
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  inputMode="decimal"
                  min={kind === "percent" ? 1 : 0}
                  max={kind === "percent" ? 100 : undefined}
                  step={kind === "percent" ? 1 : 0.01}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError("");
                  }}
                  placeholder={kind === "percent" ? "10" : "5"}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount-min">
                Minimum order total{" "}
                <span className="font-normal text-ink-soft">(optional)</span>
              </Label>
              <Input
                id="discount-min"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={minTotal}
                onChange={(e) => {
                  setMinTotal(e.target.value);
                  setError("");
                }}
                placeholder="Leave empty for any order"
                onKeyDown={(e) => e.key === "Enter" && create()}
              />
            </div>
            {preview && code && (
              <p className="rounded-lg bg-green-wash px-3 py-2 text-xs text-green">
                {code} gives {preview}
                {minTotal.trim() && Number(minTotal) > 0
                  ? ` on orders of ${formatMoney(Number(minTotal), currency)} or more.`
                  : " on any order."}
              </p>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={pending}>
              Create code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
