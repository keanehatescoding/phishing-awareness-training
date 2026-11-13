import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phishing Awareness Training",
  description: "Security awareness and phishing simulation platform for Kenyan organizations",
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
