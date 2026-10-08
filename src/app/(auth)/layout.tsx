import Link from "next/link";
import { AwningLogo } from "@/components/awning-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[1fr_1fr]">
      {/* form side */}
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" aria-label="Awning home" className="w-fit">
          <AwningLogo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-green lg:block">
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
          <div
            className="h-full w-full"
            style={{
              background:
                "repeating-linear-gradient(90deg, #fff 0 40px, transparent 40px 80px)",
            }}
          />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12">
          <div />
          <blockquote className="max-w-md">
            <p className="font-display text-3xl font-semibold leading-snug text-white">
              “I built my store during my lunch break and sold two prints
              before dinner.”
            </p>
            <footer className="mt-6 text-white/75">
              Renata Silva — Silva Prints, Miami
            </footer>
          </blockquote>
          <div className="flex items-center gap-6 text-sm text-white/70">
            <span>2,400 shops opened this month</span>
            <span aria-hidden>·</span>
            <span>Your first month is free</span>
          </div>
        </div>
      </div>
    </div>
  );
}
