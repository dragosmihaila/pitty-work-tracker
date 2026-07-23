import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitty Work Log",
  description: "Work session tracking for equipment rental jobs"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
