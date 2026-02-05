/**
 * Dieter HQ Design System
 * Central export for all design system utilities
 */

// Design Tokens
export {
  designTokens,
  spacing,
  fontSize,
  fontSizeFlat,
  lineHeight,
  fontWeight,
  colors,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  fontFamily,
} from "./tokens";

export type {
  ColorTheme,
  SpacingKey,
  FontSizeKey,
  FontWeightKey,
  BorderRadiusKey,
  ShadowKey,
  ZIndexKey,
  BreakpointKey,
} from "./tokens";

// Component Patterns
export {
  // Buttons
  buttonBase,
  buttonStyles,
  buttonSizes,
  // Cards
  cardStyles,
  cardPadding,
  // Inputs
  inputBase,
  inputStyles,
  inputSizes,
  // Typography
  headingStyles,
  textStyles,
  // Badges
  badgeBase,
  badgeStyles,
  // Dividers
  dividerStyles,
  // Overlays
  overlayStyles,
  // Layout
  containerStyles,
  stackStyles,
  // Focus
  focusStyles,
  // Scrollbars
  scrollbarStyles,
  // Utilities
  utilityPatterns,
  // Helpers
  cx,
} from "./components";

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
