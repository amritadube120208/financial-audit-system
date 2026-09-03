import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { AuditCopilotSheet } from "../components/copilot/AuditCopilotSheet";

export const metadata: Metadata = {
  title: "AuditGraph — Financial Anomaly Triage for SME Audits",
  description:
    "Turn 100,000+ general ledger transactions into a prioritized audit queue with multi-engine explainable evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
          <AuditCopilotSheet />
        </Providers>
      </body>
    </html>
  );
}
