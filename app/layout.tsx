import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forex Affiliate CMS",
  description: "Foundation shell for a scalable forex affiliate CMS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
