import type { Metadata } from "next";
import { PricingContactForm } from "../pricing/contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Tell the Shopleb team what would make it better: ideas, improvements, questions or problems. A real person reads every message.",
};

export default function ContactPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.3fr] md:px-8">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Contact us
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-body">
            Have an idea that would make Shopleb better, something you wish it
            did, or a question before you start? Write to us. A real person
            reads every message.
          </p>
          <ul className="mt-8 space-y-3 text-ink-body">
            <li className="flex gap-3">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-green" aria-hidden />
              Ideas and improvements you&apos;d like to see
            </li>
            <li className="flex gap-3">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-green" aria-hidden />
              Questions about plans and how Shopleb works
            </li>
            <li className="flex gap-3">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-green" aria-hidden />
              Something that isn&apos;t working the way you expect
            </li>
          </ul>
        </div>
        <PricingContactForm
          subjectPlaceholder="An idea for Shopleb"
          messagePlaceholder="Tell us what's on your mind."
        />
      </div>
    </section>
  );
}
