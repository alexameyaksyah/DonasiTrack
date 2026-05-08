import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const heading = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Donasi Track",
  description: "Platform tracking donasi dan logistik bantuan bencana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
