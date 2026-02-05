"use client";

import * as React from "react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import {
  GlassNav,
  GlassNavGroup,
  GlassNavItem,
} from "@/components/ui/glass-nav";
import {
  GlassModal,
  GlassModalTrigger,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalFooter,
} from "@/components/ui/glass-modal";
import {
  Home,
  Search,
  Settings,
  Bell,
  User,
  Mail,
  Heart,
  Star,
  Zap,
} from "lucide-react";

/**
 * Design System Showcase
 * 
 * This component demonstrates all the glass UI components
 * in the Dieter HQ design system.
 */
export default function DesignSystemShowcase() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <GlassNav position="top">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold">Dieter HQ Design System</h1>
          <GlassButton
            variant="glass"
            size="icon"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? "🌞" : "🌙"}
          </GlassButton>
        </div>
      </GlassNav>

      {/* Main Content */}
      <main className="safe-padding pt-24 pb-32">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4 py-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              iOS-Inspired Design System
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Featuring frosted glass aesthetics, smooth animations, and
              mobile-first responsive design.
            </p>
          </section>

          {/* Buttons Section */}
          <section className="space-y-6">
            <h3 className="text-2xl font-semibold">Buttons</h3>
            <GlassCard variant="medium" padding="lg">
              <div className="space-y-6">
                {/* Glass Variants */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Glass Variants
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <GlassButton variant="glass">Glass</GlassButton>
                    <GlassButton variant="glass-primary">
                      Glass Primary
                    </GlassButton>
                    <GlassButton variant="glass-secondary">
                      Glass Secondary
                    </GlassButton>
                    <GlassButton variant="glass-destructive">
                      Glass Destructive
                    </GlassButton>
                  </div>
                </div>

                {/* Solid Variants */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Solid Variants
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <GlassButton variant="primary">Primary</GlassButton>
                    <GlassButton variant="secondary">Secondary</GlassButton>
                    <GlassButton variant="destructive">
                      Destructive
                    </GlassButton>
                    <GlassButton variant="outline">Outline</GlassButton>
                    <GlassButton variant="ghost">Ghost</GlassButton>
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Sizes
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <GlassButton variant="primary" size="sm">
                      Small
                    </GlassButton>
                    <GlassButton variant="primary" size="base">
                      Base
                    </GlassButton>
                    <GlassButton variant="primary" size="lg">
                      Large
                    </GlassButton>
                    <GlassButton variant="primary" size="xl">
                      Extra Large
                    </GlassButton>
                  </div>
                </div>

                {/* Icon Buttons */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Icon Buttons
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <GlassButton variant="glass" size="icon">
                      <Heart className="h-5 w-5" />
                    </GlassButton>
                    <GlassButton variant="glass-primary" size="icon">
                      <Star className="h-5 w-5" />
                    </GlassButton>
                    <GlassButton variant="primary" size="icon">
                      <Zap className="h-5 w-5" />
                    </GlassButton>
                  </div>
                </div>

                {/* Loading State */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Loading State
                  </h4>
                  <GlassButton variant="primary" loading>
                    Loading...
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </section>

          {/* Inputs Section */}
          <section className="space-y-6">
            <h3 className="text-2xl font-semibold">Inputs</h3>
            <GlassCard variant="medium" padding="lg">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Glass Inputs
                  </h4>
                  <div className="space-y-3">
                    <GlassInput
                      variant="glass"
                      placeholder="Glass input"
                      icon={<Search className="h-4 w-4" />}
                      iconPosition="left"
                    />
                    <GlassInput
                      variant="glass-medium"
                      placeholder="Glass medium input"
                      icon={<Mail className="h-4 w-4" />}
                      iconPosition="right"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Other Variants
                  </h4>
                  <div className="space-y-3">
                    <GlassInput variant="outline" placeholder="Outline input" />
                    <GlassInput variant="filled" placeholder="Filled input" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    Sizes
                  </h4>
                  <div className="space-y-3">
                    <GlassInput
                      inputSize="sm"
                      placeholder="Small input"
                      variant="glass"
                    />
                    <GlassInput
                      inputSize="base"
                      placeholder="Base input"
                      variant="glass"
                    />
                    <GlassInput
                      inputSize="lg"
                      placeholder="Large input"
                      variant="glass"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground-secondary">
                    States
                  </h4>
                  <div className="space-y-3">
                    <GlassInput
                      variant="glass"
                      placeholder="Normal state"
                      helperText="This is a helper text"
                    />
                    <GlassInput
                      variant="glass"
                      placeholder="Error state"
                      error
                      helperText="This field is required"
                    />
                    <GlassInput
                      variant="glass"
                      placeholder="Disabled state"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </section>

          {/* Cards Section */}
          <section className="space-y-6">
            <h3 className="text-2xl font-semibold">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Subtle Card */}
              <GlassCard variant="subtle" elevated>
                <GlassCardHeader>
                  <GlassCardTitle>Subtle Glass</GlassCardTitle>
                  <GlassCardDescription>
                    Light, minimal blur effect
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-foreground-secondary">
                    Perfect for background elements that need a hint of glass.
                  </p>
                </GlassCardContent>
                <GlassCardFooter>
                  <GlassButton variant="glass" size="sm">
                    Learn More
                  </GlassButton>
                </GlassCardFooter>
              </GlassCard>

              {/* Medium Card */}
              <GlassCard variant="medium" elevated>
                <GlassCardHeader>
                  <GlassCardTitle>Medium Glass</GlassCardTitle>
                  <GlassCardDescription>
                    Balanced blur and transparency
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-foreground-secondary">
                    The default choice for most card components.
                  </p>
                </GlassCardContent>
                <GlassCardFooter>
                  <GlassButton variant="glass-primary" size="sm">
                    Learn More
                  </GlassButton>
                </GlassCardFooter>
              </GlassCard>

              {/* Strong Card */}
              <GlassCard variant="strong" elevated>
                <GlassCardHeader>
                  <GlassCardTitle>Strong Glass</GlassCardTitle>
                  <GlassCardDescription>
                    Heavy blur for prominence
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-foreground-secondary">
                    Use for important content that needs to stand out.
                  </p>
                </GlassCardContent>
                <GlassCardFooter>
                  <GlassButton variant="primary" size="sm">
                    Learn More
                  </GlassButton>
                </GlassCardFooter>
              </GlassCard>

              {/* Interactive Card */}
              <GlassCard variant="medium" elevated interactive>
                <GlassCardHeader>
                  <GlassCardTitle>Interactive Card</GlassCardTitle>
                  <GlassCardDescription>
                    Hover to see the effect
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-foreground-secondary">
                    Cards can be interactive with hover effects.
                  </p>
                </GlassCardContent>
              </GlassCard>

              {/* No Padding Card */}
              <GlassCard variant="medium" elevated padding="none">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold">Image Card</h4>
                  <p className="text-sm text-foreground-secondary">
                    Cards with custom padding for images.
                  </p>
                </div>
              </GlassCard>
            </div>
          </section>

          {/* Modal Section */}
          <section className="space-y-6">
            <h3 className="text-2xl font-semibold">Modal</h3>
            <GlassCard variant="medium" padding="lg">
              <div className="text-center space-y-4">
                <p className="text-foreground-secondary">
                  Click the button to see the glass modal in action
                </p>
                <GlassModal>
                  <GlassModalTrigger asChild>
                    <GlassButton variant="primary" size="lg">
                      Open Modal
                    </GlassButton>
                  </GlassModalTrigger>
                  <GlassModalContent>
                    <GlassModalHeader>
                      <GlassModalTitle>Glass Modal</GlassModalTitle>
                      <GlassModalDescription>
                        This modal features frosted glass backdrop and smooth
                        animations.
                      </GlassModalDescription>
                    </GlassModalHeader>
                    <div className="py-6">
                      <p className="text-sm text-foreground-secondary">
                        Modal content goes here. The background blurs
                        automatically, creating a beautiful depth effect.
                      </p>
                    </div>
                    <GlassModalFooter>
                      <GlassButton variant="glass">Cancel</GlassButton>
                      <GlassButton variant="primary">Confirm</GlassButton>
                    </GlassModalFooter>
                  </GlassModalContent>
                </GlassModal>
              </div>
            </GlassCard>
          </section>

          {/* Design Tokens Info */}
          <section className="space-y-6">
            <h3 className="text-2xl font-semibold">Design Tokens</h3>
            <GlassCard variant="medium" padding="lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary" />
                  <p className="text-sm font-medium">Primary</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 mx-auto rounded-full bg-secondary" />
                  <p className="text-sm font-medium">Secondary</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 mx-auto rounded-full bg-success" />
                  <p className="text-sm font-medium">Success</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 mx-auto rounded-full bg-destructive" />
                  <p className="text-sm font-medium">Destructive</p>
                </div>
              </div>
            </GlassCard>
          </section>
        </div>
      </main>

      {/* Bottom Navigation */}
      <GlassNav position="bottom">
        <GlassNavGroup>
          <GlassNavItem active icon={<Home />} label="Home" href="#" />
          <GlassNavItem icon={<Search />} label="Search" href="#" />
          <GlassNavItem icon={<Bell />} label="Notifications" href="#" />
          <GlassNavItem icon={<User />} label="Profile" href="#" />
          <GlassNavItem icon={<Settings />} label="Settings" href="#" />
        </GlassNavGroup>
      </GlassNav>
    </div>
  );
}
