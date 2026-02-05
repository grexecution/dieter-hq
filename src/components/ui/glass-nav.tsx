"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassNavProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Position of the navigation bar
   * - top: Fixed to top with backdrop blur
   * - bottom: Fixed to bottom (iOS tab bar style)
   * - static: Normal flow
   */
  position?: "top" | "bottom" | "static";
  /**
   * Whether the nav should blur content behind it
   */
  blur?: boolean;
  /**
   * Safe area padding for notched devices
   */
  safeArea?: boolean;
}

const GlassNav = React.forwardRef<HTMLElement, GlassNavProps>(
  (
    {
      className,
      position = "static",
      blur = true,
      safeArea = true,
      children,
      ...props
    },
    ref
  ) => {
    const positionStyles = {
      top: "fixed top-0 left-0 right-0 z-50",
      bottom: "fixed bottom-0 left-0 right-0 z-50",
      static: "relative",
    };

    const safeAreaStyles = {
      top: safeArea ? "pt-safe" : "",
      bottom: safeArea ? "pb-safe" : "",
      static: "",
    };

    return (
      <nav
        ref={ref}
        className={cn(
          "w-full transition-smooth",
          blur ? "glass-medium" : "bg-background/95",
          positionStyles[position],
          safeAreaStyles[position],
          position !== "static" && "backdrop-blur-xl",
          position === "bottom" && "border-t border-border/50",
          position === "top" && "border-b border-border/50",
          className
        )}
        {...props}
      >
        <div className="safe-padding">
          {children}
        </div>
      </nav>
    );
  }
);
GlassNav.displayName = "GlassNav";

interface GlassNavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
  href?: string;
}

const GlassNavItem = React.forwardRef<HTMLAnchorElement, GlassNavItemProps>(
  ({ className, active, icon, label, href, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-smooth hover-press",
          "text-sm font-medium min-w-[60px] md:min-w-[80px]",
          active
            ? "text-primary bg-primary/10"
            : "text-foreground-secondary hover:text-foreground hover:bg-accent/50",
          className
        )}
        {...props}
      >
        {icon && (
          <span className="text-xl md:text-2xl">{icon}</span>
        )}
        {label && (
          <span className="text-xs md:text-sm">{label}</span>
        )}
        {children}
      </a>
    );
  }
);
GlassNavItem.displayName = "GlassNavItem";

const GlassNavGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-around gap-2 px-2 py-2",
      className
    )}
    {...props}
  />
));
GlassNavGroup.displayName = "GlassNavGroup";

export { GlassNav, GlassNavItem, GlassNavGroup };
