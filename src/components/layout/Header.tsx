"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Users, BarChart3, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/kalkulator", label: "Kalkulator", icon: Calculator, short: "Kalkulator" },
  { href: "/batch", label: "Batch", icon: Users, short: "Batch" },
  { href: "/estimasi", label: "Estimasi Rata-rata", icon: BarChart3, short: "Estimasi" },
  { href: "/panduan", label: "Panduan", icon: BookOpen, short: "Panduan" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-primary-900" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm sm:text-base text-white group-hover:text-accent transition-colors">
                PUC Kalkulator
              </div>
              <div className="text-xs text-primary-200 hidden sm:block">
                Imbalan Pasca Kerja · SAK EP / PSAK 24
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-secondary text-white"
                    : "text-primary-200 hover:bg-primary-600 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-600 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-primary-600 bg-primary-800">
          <nav className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-secondary text-white"
                    : "text-primary-200 hover:bg-primary-600 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
