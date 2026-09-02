import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-[1.4]",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        secondary: "bg-white/10 text-white",
        outline: "border border-white/15 text-white/70",
        dark: "bg-white text-black",
        high: "bg-primary text-white",
        medium: "bg-white/10 text-white",
        low: "bg-white/5 text-white/60",
        open: "bg-primary text-white",
        pending: "bg-white/10 text-white",
        resolved: "bg-white text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
