import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indian BBS Generator",
  description: "Bar Bending Schedule generator for Indian RCC construction practice",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
