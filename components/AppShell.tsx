"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileSpreadsheet, FileUp, Home, ReceiptText, ShieldAlert } from "lucide-react";
import clsx from "clsx";

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/invoices", label: "Παραστατικά", icon: ReceiptText },
  { href: "/invoices/upload", label: "Upload PDF", icon: FileUp },
  { href: "/reports/vies", label: "Φ5/VIES", icon: FileSpreadsheet },
  { href: "/reports/vat", label: "Έλεγχος ΦΠΑ", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-600 text-sm font-bold text-white">MR</div>
          <div>
            <div className="text-sm font-semibold leading-tight">MobileRepairs</div>
            <div className="text-xs text-slate-500">myDATA Helper</div>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-normal text-slate-950">MobileRepairs myDATA Helper</h1>
              <p className="text-sm text-slate-500">Παραστατικά εξόδων, χαρακτηρισμοί myDATA, Φ5/VIES και έλεγχος ΦΠΑ.</p>
            </div>
            <div className="flex max-w-3xl items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Η εφαρμογή παράγει προτάσεις χαρακτηρισμών και reports. Ο χρήστης πρέπει να ελέγξει τα στοιχεία πριν από
                οποιαδήποτε υποβολή στην ΑΑΔΕ.
              </span>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navigation.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                    active ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
