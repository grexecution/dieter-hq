import DesignSystemShowcase from "@/components/examples/design-system-showcase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System | Dieter HQ",
  description: "iOS-inspired design system with frosted glass aesthetics",
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
