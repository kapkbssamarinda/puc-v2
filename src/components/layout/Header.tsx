"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Users, BarChart3, BookOpen, Menu, X, LogOut, Lock, LogIn, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/useFocusTrap";
import Swal from "sweetalert2";

const navItems = [
  { href: "/kalkulator", label: "Kalkulator", icon: Calculator, short: "Kalkulator" },
  { href: "/batch", label: "Batch", icon: Users, short: "Batch" },
  { href: "/estimasi", label: "Estimasi Rata-rata", icon: BarChart3, short: "Estimasi" },
  { href: "/panduan", label: "Panduan", icon: BookOpen, short: "Panduan" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const { data: session } = useSession();

  function handleProtectedClick(e: React.MouseEvent) {
    if (!session) {
      e.preventDefault();
      setAlertOpen(true);
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Apakah anda ingin keluar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb", // Tailwind blue-600 (Primary color match roughly)
      cancelButtonColor: "#dc2626", // Tailwind red-600
      confirmButtonText: "Ya, Keluar!",
      cancelButtonText: "Batal",
      reverseButtons: true
    });
    
    if (result.isConfirmed) {
      setMenuOpen(false);
      signOut({ callbackUrl: "/login" });
    }
  };

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
                onClick={handleProtectedClick}
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

            {/* Admin link — hanya tampil untuk role admin */}
            {session?.user?.role === "admin" && (
              <Link
                href="/admin/users"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-secondary text-white"
                    : "text-primary-200 hover:bg-primary-600 hover:text-white"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            {/* Sign-out — tampil hanya saat sudah login */}
            {session && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-primary-600">
                <span className="text-xs text-primary-300 hidden lg:block max-w-[120px] truncate">
                  {session.user?.name ?? session.user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-primary-200 hover:bg-primary-600 hover:text-white transition-colors"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Keluar</span>
                </button>
              </div>
            )}
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
                onClick={(e) => {
                  if (!session) {
                    e.preventDefault();
                    setMenuOpen(false);
                    setAlertOpen(true);
                  } else {
                    setMenuOpen(false);
                  }
                }}
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

            {session && (
              <>
                <div className="px-3 py-1.5 text-xs text-primary-400 border-t border-primary-600 mt-1 pt-2">
                  {session.user?.name ?? session.user?.email}
                </div>
                {session.user?.role === "admin" && (
                  <Link
                    href="/admin/users"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      pathname.startsWith("/admin")
                        ? "bg-secondary text-white"
                        : "text-primary-200 hover:bg-primary-600 hover:text-white"
                    )}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-primary-200 hover:bg-primary-600 hover:text-white transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </>
            )}
          </nav>
        </div>
      )}
      {alertOpen && <LoginRequiredDialog onClose={() => setAlertOpen(false)} />}
    </header>
  );
}

function LoginRequiredDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const trapRef = useFocusTrap(onClose);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-primary-900/45"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
          <Lock className="w-7 h-7 text-accent" />
        </div>

        <div className="text-center">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">Login Diperlukan</h2>
          <p className="text-sm text-gray-500 mt-1">
            Silakan login terlebih dahulu untuk mengakses fitur ini.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full mt-1">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Login Sekarang
          </Link>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
