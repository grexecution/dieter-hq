import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Theme colors - used for status bar
const THEME_COLOR_LIGHT = "#172D6C"; // Dark blue for light mode
const THEME_COLOR_DARK = "#0a1628";  // Darker blue for dark mode

export const viewport: Viewport = {
  // iOS safe area support
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Theme color for status bar (with dark mode support)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ],
};

export const metadata: Metadata = {
  title: "Dieter HQ",
  description: "Homebase for Greg + Dieter.",
  applicationName: "Dieter HQ",
  
  // iOS PWA settings
  appleWebApp: {
    capable: true,
    // "black-translucent" = status bar overlays content with transparent background
    // Content color shows through, needs safe-area padding
    statusBarStyle: "black-translucent",
    title: "Dieter HQ",
    startupImage: [
      // iPhone SE, 6s, 7, 8
      {
        url: "/splash/apple-splash-750-1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone X, XS, 11 Pro, 12 mini, 13 mini
      {
        url: "/splash/apple-splash-1125-2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone XR, 11
      {
        url: "/splash/apple-splash-828-1792.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone XS Max, 11 Pro Max
      {
        url: "/splash/apple-splash-1242-2688.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 12, 12 Pro, 13, 13 Pro, 14
      {
        url: "/splash/apple-splash-1170-2532.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
      {
        url: "/splash/apple-splash-1284-2778.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro
      {
        url: "/splash/apple-splash-1179-2556.png",
        media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro Max, 15 Plus, 15 Pro Max
      {
        url: "/splash/apple-splash-1290-2796.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  
  // Favicons and touch icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  manifest: "/manifest.webmanifest",
  
  // Disable phone number detection
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* iOS-specific meta tags for best PWA experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#172D6C" />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {/* Safe area padding for notch/dynamic island */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
