import type { Metadata } from "next";
import { Toaster } from "sonner";
import { allFontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Awning — Put up your shop",
    template: "%s · Awning",
  },
  description:
    "Awning gives anyone a beautiful online store in minutes. Add products, pick your look, and start selling.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${allFontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
