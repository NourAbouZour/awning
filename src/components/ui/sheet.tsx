"use client";

/**
 * Side sheet built on Radix Dialog — used for the cart drawer, mobile
 * filters, and mobile navigation.
 */
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-fade-in",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  "fixed z-50 flex flex-col bg-paper shadow-[0_0_60px_rgb(0_0_0/0.25)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-full max-w-md data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=open]:animate-[slide-in-right_0.35s_cubic-bezier(0.32,0.72,0,1)]",
        left: "inset-y-0 left-0 h-full w-full max-w-md data-[state=closed]:-translate-x-full data-[state=open]:animate-[slide-in-left_0.35s_cubic-bezier(0.32,0.72,0,1)]",
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl data-[state=open]:animate-[slide-in-bottom_0.35s_cubic-bezier(0.32,0.72,0,1)]",
        full: "inset-0 h-full w-full data-[state=open]:animate-fade-in",
      },
    },
    defaultVariants: { side: "right" },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  hideClose?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, hideClose, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-current/70 transition-colors hover:bg-black/5 hover:text-current">
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
