import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forex Journal | Broker research & forex education",
  description: "Explore forex education, broker reviews and practical trading guides. Make research part of your next step.",
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
