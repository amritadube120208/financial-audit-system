import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const syne = localFont({
  src: "../public/fonts/syne-latin.woff2",
  variable: "--font-display",
});

const sora = localFont({
  src: "../public/fonts/sora-latin.woff2",
  variable: "--font-body",
});

const jetbrainsMono = localFont({
  src: "../public/fonts/jetbrains-mono-latin.woff2",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AuditGraph — Explainable Financial Audit & Anomaly Detection",
  description:
    "Multi-engine explainable financial anomaly detection, cycle graph forensics, and auditor copilot for SME accounting ledgers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${sora.variable} ${jetbrainsMono.variable} font-body min-h-screen bg-[#0A0C0E] text-[#EDE7DC] antialiased selection:bg-[#E8913C]/20 selection:text-[#EDE7DC] flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
