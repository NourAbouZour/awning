import { MessageCircle } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "96176075491";
const WHATSAPP_DISPLAY = "+961 76 075 491";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function EmailMarketingPage() {
  return (
    <>
      <PageHeader
        title="Email marketing"
        sub="Reach your customers' inboxes with new drops and restocks."
      />

      <Card className="mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-wash">
          <MessageCircle className="size-7 text-green" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-ink">
          Let&apos;s set up email marketing together
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-body">
          Email campaigns are tailored to your store. To switch them on and plan
          your first send, talk to the developer directly on WhatsApp — you&apos;ll
          get it set up fast.
        </p>
        <div className="mt-6 flex justify-center">
          <Button size="lg" asChild>
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              Message the developer on WhatsApp
            </a>
          </Button>
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Or save the number:{" "}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-green underline-offset-4 hover:underline"
          >
            {WHATSAPP_DISPLAY}
          </a>
        </p>
      </Card>
    </>
  );
}
