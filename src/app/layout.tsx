import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dieter HQ",
  description: "Homebase for Greg + Dieter.",
  applicationName: "Dieter HQ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dieter HQ",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-dvh bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
