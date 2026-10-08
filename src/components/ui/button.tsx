import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-green text-white hover:bg-green-deep shadow-[0_1px_2px_rgb(0_0_0/0.12)]",
        dark: "bg-ink text-white hover:bg-ink/85",
        outline:
          "border border-line-strong bg-paper text-ink-body hover:bg-canvas hover:border-ink/30",
        ghost: "text-ink-body hover:bg-ink/5",
        danger: "bg-danger text-white hover:bg-danger/90",
        /* storefront: follows the merchant's brand color automatically */
        brand:
          "bg-sf-brand text-sf-on-brand hover:bg-sf-brand-hover shadow-[0_1px_2px_rgb(0_0_0/0.12)]",
        "brand-outline":
          "border border-sf-ink/20 text-sf-ink hover:border-sf-ink hover:bg-sf-ink/5",
      },
      size: {
        sm: "h-8 px-3 text-[13px] rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-[15px] rounded-lg",
        xl: "h-14 px-8 text-base rounded-xl",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
