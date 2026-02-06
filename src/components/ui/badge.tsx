import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-transparent bg-indigo-600 text-white dark:bg-indigo-500",
        secondary: "border-transparent bg-zinc-100/80 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300",
        destructive: "border-transparent bg-red-600 text-white dark:bg-red-500",
        outline: "border-zinc-200/80 text-zinc-700 dark:border-zinc-700/80 dark:text-zinc-300",
        success: "border-transparent bg-emerald-600 text-white dark:bg-emerald-500",
        warning: "border-transparent bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
