import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://marketgb.com"),
  title: {
    default: "MarketGB | Global market insights and broker research",
    template: "%s | MarketGB",
  },
  description: "Independent broker comparisons, practical forex education and global market insights for better-informed decisions.",
  applicationName: "MarketGB",
  icons: {
    icon: [
      { url: "/brand/marketgb/marketgb-icon-16-v1.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/marketgb/marketgb-icon-32-v1.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/marketgb/marketgb-icon-48-v1.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/brand/marketgb/marketgb-icon-180-v1.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName: "MarketGB",
    title: "MarketGB | Global market insights and broker research",
    description: "Independent broker comparisons and practical market education for better-informed decisions.",
    images: [{ url: "/brand/marketgb/open-graph-1200x630.png", width: 1200, height: 630, alt: "MarketGB — Insights for a brighter tomorrow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketGB | Global market insights and broker research",
    description: "Independent broker comparisons and practical market education for better-informed decisions.",
    images: ["/brand/marketgb/open-graph-1200x630.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
