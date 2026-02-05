/**
 * Dieter HQ Design System
 * Central export for all design system utilities
 */

// Design Tokens
export { designTokens } from "./tokens";
export type {
  ColorTheme,
  SpacingKey,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
  Blur,
  Breakpoint,
} from "./tokens";

// Responsive Utilities
export {
  parseBreakpoint,
  matchesBreakpoint,
  getDeviceType,
  isTouchDevice,
  isIOS,
  isAndroid,
  hasSafeArea,
  useBreakpoint,
  useDeviceType,
  useMediaQuery,
  useViewportSize,
  usePrefersReducedMotion,
  useKeyboardOpen,
  useResponsiveValue,
  getResponsiveCSS,
} from "./utils/responsive";

export type { DeviceType } from "./utils/responsive";

// Accessibility Utilities
export {
  getFocusableElements,
  trapFocus,
  useFocusTrap,
  announce,
  useAnnounce,
  generateId,
  useId,
  getContrastRatio,
  meetsContrastRequirement,
  useKeyboardNavigation,
  useScreenReader,
  getAriaLabel,
  createSkipLink,
  getAriaAttributes,
  srOnlyClass,
  focusVisibleClass,
} from "./utils/accessibility";
