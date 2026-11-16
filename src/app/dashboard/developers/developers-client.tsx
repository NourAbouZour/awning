"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateApiKey,
  revokeApiKey,
  saveWebhookUrl,
  sendTestWebhook,
} from "@/app/dashboard/developers/actions";

const BASE_URL = "https://shopleb.com/api/v1";

function useCopy() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const copy = React.useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.error("Couldn't copy, select the text and copy it by hand.");
    }
  }, []);
  return { copied, copy };
}

function CodeBlock({
  id,
  code,
  copied,
  onCopy,
}: {
  id: string;
  code: string;
  copied: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-line bg-canvas p-3 pr-12 font-mono text-xs leading-relaxed text-ink-body">
        {code}
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1.5"
        aria-label="Copy code"
        onClick={() => onCopy(id, code)}
      >
        {copied === id ? (
          <Check className="size-4 text-ok" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
    </div>
  );
}

export function DevelopersClient({
  storeSlug,
  apiKey: initialKey,
  webhookUrl: initialWebhook,
}: {
  storeSlug: string;
  apiKey: string | null;
  webhookUrl: string;
}) {
  const router = useRouter();
  const [apiKey, setApiKey] = React.useState(initialKey);
  const [revealed, setRevealed] = React.useState(false);
  const [confirm, setConfirm] = React.useState<"regenerate" | "revoke" | null>(
    null,
  );
  const [savedWebhook, setSavedWebhook] = React.useState(initialWebhook);
  const [webhook, setWebhook] = React.useState(initialWebhook);
  const [webhookError, setWebhookError] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [testing, startTest] = React.useTransition();
  const { copied, copy } = useCopy();

  const webhookDirty = webhook.trim() !== savedWebhook;

  function makeKey() {
    startTransition(async () => {
      const res = await generateApiKey();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setApiKey(res.apiKey ?? null);
      setRevealed(true);
      setConfirm(null);
      toast.success(
        apiKey
          ? "New key ready. The old one has stopped working."
          : "API key ready. Keep it somewhere safe.",
      );
      router.refresh();
    });
  }

  function revoke() {
    startTransition(async () => {
      const res = await revokeApiKey();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setApiKey(null);
      setRevealed(false);
      setConfirm(null);
      toast.success("API key revoked. Apps using it can no longer connect.");
      router.refresh();
    });
  }

  function saveWebhook() {
    const value = webhook.trim();
    if (value && !value.startsWith("https://")) {
      setWebhookError("The webhook URL must start with https://");
      return;
    }
    startTransition(async () => {
      const res = await saveWebhookUrl(value);
      if (res.error) {
        setWebhookError(res.error);
        return;
      }
      setSavedWebhook(value);
      setWebhook(value);
      setWebhookError("");
      toast.success(value ? "Webhook URL saved" : "Webhooks turned off");
      router.refresh();
    });
  }

  function sendTest() {
    startTest(async () => {
      const res = await sendTestWebhook();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Test sent");
    });
  }

  const masked = apiKey ? `${apiKey.slice(0, 12)}${"•".repeat(24)}` : "";

  const curl = `curl ${BASE_URL}/orders?status=pending&limit=10 \\
  -H "Authorization: Bearer ${revealed && apiKey ? apiKey : "<your API key>"}"`;

  const payload = `{
  "event": "order.created",
  "store": "${storeSlug}",
  "order": {
    "id": "clx...",
    "number": "#1042",
    "status": "pending",
    "customer": { "name": "...", "email": "...", "phone": "..." },
    "shippingAddress": "...",
    "paymentMethod": "cash",
    "total": 48.5,
    "createdAt": "2026-01-15T10:24:00.000Z",
    "items": [{ "title": "...", "variant": "M", "quantity": 1, "price": 48.5 }]
  }
}`;

  const verify = `import { createHmac, timingSafeEqual } from "node:crypto";

// rawBody: the request body exactly as received, before JSON.parse
const expected = createHmac("sha256", process.env.SHOPLEB_API_KEY)
  .update(rawBody)
  .digest("hex");
const received = req.headers["x-shopleb-signature"] ?? "";
const valid =
  received.length === expected.length &&
  timingSafeEqual(Buffer.from(received), Buffer.from(expected));`;

  return (
    <>
      <PageHeader
        title="API & webhooks"
        sub="Connect your store to other apps with a read-only API and order webhooks."
      />

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-wash">
              <KeyRound className="size-4 text-green" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-ink">API key</h2>
              <p className="mt-0.5 text-sm text-ink-soft">
                Lets your own tools read your products and orders. Treat it
                like a password and never put it in a public website.
              </p>

              {apiKey ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      readOnly
                      value={revealed ? apiKey : masked}
                      aria-label="API key"
                      className="min-w-0 flex-1 font-mono text-[13px]"
                      onFocus={(e) => revealed && e.currentTarget.select()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={revealed ? "Hide key" : "Show key"}
                      onClick={() => setRevealed((r) => !r)}
                    >
                      {revealed ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copy("key", apiKey)}
                    >
                      {copied === "key" ? (
                        <Check className="size-4 text-ok" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      {copied === "key" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => setConfirm("regenerate")}
                    >
                      <RefreshCw className="size-4" />
                      Regenerate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setConfirm("revoke")}
                      className="text-danger hover:bg-danger/5"
                    >
                      <Trash2 className="size-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <Button onClick={makeKey} disabled={pending}>
                    <KeyRound className="size-4" />
                    Generate API key
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-wash">
              <Webhook className="size-4 text-green" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-ink">Order webhook</h2>
              <p className="mt-0.5 text-sm text-ink-soft">
                We send a POST request to this address whenever an order is
                placed or its status changes. Leave it empty to turn webhooks
                off.
              </p>
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="webhook-url"
                    type="url"
                    inputMode="url"
                    value={webhook}
                    placeholder="https://example.com/shopleb-webhook"
                    className="min-w-0 flex-1"
                    aria-invalid={!!webhookError}
                    onChange={(e) => {
                      setWebhook(e.target.value);
                      setWebhookError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && saveWebhook()}
                  />
                  <Button
                    onClick={saveWebhook}
                    disabled={pending || !webhookDirty}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={sendTest}
                    disabled={testing || !savedWebhook || webhookDirty}
                  >
                    <Send className="size-4" />
                    {testing ? "Sending..." : "Send test"}
                  </Button>
                </div>
                {webhookError && (
                  <p className="text-xs text-danger">{webhookError}</p>
                )}
                {!apiKey && savedWebhook && (
                  <p className="text-xs text-ink-soft">
                    Generate an API key to have webhook requests signed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">How to use the API</h2>
          <div className="mt-4 space-y-5 text-sm text-ink-body">
            <div className="space-y-1.5">
              <p className="font-medium text-ink">Base URL</p>
              <CodeBlock
                id="base"
                code={BASE_URL}
                copied={copied}
                onCopy={copy}
              />
            </div>

            <div className="space-y-1.5">
              <p className="font-medium text-ink">Authentication</p>
              <p className="text-ink-soft">
                Send your key in the Authorization header on every request. A
                missing or wrong key gets a 401.
              </p>
              <CodeBlock
                id="auth"
                code="Authorization: Bearer <your API key>"
                copied={copied}
                onCopy={copy}
              />
            </div>

            <div className="space-y-1.5">
              <p className="font-medium text-ink">Endpoints</p>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {[
                  ["GET /products", "All your products with prices, stock, images and variants."],
                  ["GET /orders", "Newest orders first. Optional ?status=pending|paid|fulfilled|shipped|cancelled and ?limit= (default 50, max 200)."],
                  ["GET /orders/1042", "One order by its number, without the #."],
                ].map(([path, about]) => (
                  <li key={path} className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:gap-4">
                    <code className="shrink-0 font-mono text-xs text-ink sm:w-36">
                      {path}
                    </code>
                    <span className="text-xs text-ink-soft">{about}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <p className="font-medium text-ink">Example</p>
              <CodeBlock id="curl" code={curl} copied={copied} onCopy={copy} />
            </div>

            <div className="space-y-1.5">
              <p className="font-medium text-ink">Webhook requests</p>
              <p className="text-ink-soft">
                Each call is a JSON POST. The{" "}
                <code className="font-mono text-xs">X-Shopleb-Event</code>{" "}
                header says what happened:{" "}
                <code className="font-mono text-xs">order.created</code>,{" "}
                <code className="font-mono text-xs">order.updated</code> or{" "}
                <code className="font-mono text-xs">ping</code> for a test. We
                wait up to 5 seconds for your endpoint to answer.
              </p>
              <CodeBlock
                id="payload"
                code={payload}
                copied={copied}
                onCopy={copy}
              />
            </div>

            <div className="space-y-1.5">
              <p className="font-medium text-ink">Checking the signature</p>
              <p className="text-ink-soft">
                When you have an API key, every webhook carries an{" "}
                <code className="font-mono text-xs">X-Shopleb-Signature</code>{" "}
                header: the hex HMAC-SHA256 of the raw request body, using your
                API key as the secret. Compare it
                to your own to be sure the request came from us.
              </p>
              <CodeBlock
                id="verify"
                code={verify}
                copied={copied}
                onCopy={copy}
              />
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "revoke" ? "Revoke API key?" : "Regenerate API key?"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "revoke"
                ? "Any app using this key stops working right away, and webhooks are no longer signed."
                : "You get a fresh key and the current one stops working right away. Update any app that uses it."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm === "revoke" ? "danger" : "primary"}
              disabled={pending}
              onClick={confirm === "revoke" ? revoke : makeKey}
            >
              {confirm === "revoke" ? "Revoke key" : "Regenerate key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
