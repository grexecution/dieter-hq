"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const GlassModal = DialogPrimitive.Root;

const GlassModalTrigger = DialogPrimitive.Trigger;

const GlassModalPortal = DialogPrimitive.Portal;

const GlassModalClose = DialogPrimitive.Close;

const GlassModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
      className
    )}
    {...props}
  />
));
GlassModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const GlassModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
  }
>(({ className, children, showClose = true, ...props }, ref) => (
  <GlassModalPortal>
    <GlassModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
        "glass-medium-elevated rounded-2xl p-6 shadow-glass",
        "data-[state=open]:animate-scale-in data-[state=closed]:animate-fade-out",
        "max-h-[90vh] overflow-y-auto",
        // Mobile optimizations
        "mx-4 sm:mx-0",
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </GlassModalPortal>
));
GlassModalContent.displayName = DialogPrimitive.Content.displayName;

const GlassModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left pb-4",
      className
    )}
    {...props}
  />
);
GlassModalHeader.displayName = "GlassModalHeader";

const GlassModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 gap-2",
      className
    )}
    {...props}
  />
);
GlassModalFooter.displayName = "GlassModalFooter";

const GlassModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
GlassModalTitle.displayName = DialogPrimitive.Title.displayName;

const GlassModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-foreground-secondary", className)}
    {...props}
  />
));
GlassModalDescription.displayName = DialogPrimitive.Description.displayName;

export {
  GlassModal,
  GlassModalPortal,
  GlassModalOverlay,
  GlassModalTrigger,
  GlassModalClose,
  GlassModalContent,
  GlassModalHeader,
  GlassModalFooter,
  GlassModalTitle,
  GlassModalDescription,
};
