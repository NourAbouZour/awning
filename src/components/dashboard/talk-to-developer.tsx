import { MessageCircle } from "lucide-react";
import { Card } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "96176075491";
const WHATSAPP_DISPLAY = "+961 76 075 491";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

/**
 * A reusable "talk to the developer" card with a WhatsApp call-to-action.
 * Used for features that are set up for the merchant by hand (email
 * marketing, custom domains, etc.).
 */
export function TalkToDeveloper({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-wash">
        <MessageCircle className="size-7 text-green" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-body">
        {description}
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
  );
}
