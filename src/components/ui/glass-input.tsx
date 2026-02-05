import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const glassInputVariants = cva(
  "flex w-full rounded-lg border-0 bg-transparent text-base transition-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        glass: "glass px-4 py-3",
        "glass-medium": "glass-medium px-4 py-3",
        outline: "border border-input bg-background px-4 py-3",
        filled: "bg-secondary px-4 py-3",
      },
      inputSize: {
        sm: "h-9 px-3 py-2 text-sm rounded-lg",
        base: "h-11 px-4 py-3 text-base rounded-lg",
        lg: "h-12 px-4 py-3 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "glass",
      inputSize: "base",
    },
  }
);

export interface GlassInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof glassInputVariants> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  error?: boolean;
  helperText?: string;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      className,
      variant,
      inputSize,
      type,
      icon,
      iconPosition = "left",
      error,
      helperText,
      ...props
    },
    ref
  ) => {
    const hasIcon = !!icon;

    return (
      <div className="w-full">
        <div className="relative">
          {hasIcon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              glassInputVariants({ variant, inputSize }),
              hasIcon && iconPosition === "left" && "pl-10",
              hasIcon && iconPosition === "right" && "pr-10",
              error && "ring-2 ring-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
          {hasIcon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={cn(
              "mt-1.5 text-sm",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";

export { GlassInput, glassInputVariants };
