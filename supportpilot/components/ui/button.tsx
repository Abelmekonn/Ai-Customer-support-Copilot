import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[14px] font-medium leading-[1.3] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary",
  {
    variants: {
      variant: {
        default: "bg-primary text-white active:bg-primary-deep",
        cream: "bg-[#1c1c1c] text-white border border-[#2a2a2a]",
        dark: "bg-white text-black active:bg-zinc-200",
        outline: "bg-transparent text-white border border-white/20",
        onCream: "bg-white/10 text-white border border-white/15",
        secondary: "bg-transparent text-white border border-white/20",
        ghost: "bg-transparent text-white",
        link: "bg-transparent text-primary p-0 h-auto rounded-none",
        sidebar: "justify-start text-white/70 hover:bg-white/8 hover:text-white",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 py-2",
        lg: "h-12 px-6 py-3",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
