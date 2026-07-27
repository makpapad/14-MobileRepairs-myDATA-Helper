import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "MobileRepairs myDATA Helper",
  description: "Internal helper for invoice review, myDATA classification suggestions, VIES and VAT reports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="el">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
