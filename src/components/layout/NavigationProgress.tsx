"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

type NavigationContextType = {
  startLoading: () => void
  stopLoading: () => void
}

const NavigationContext = createContext<NavigationContextType>({
  startLoading: () => {},
  stopLoading: () => {},
})

export function useNavigationLoader() {
  return useContext(NavigationContext)
}

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  function startLoading() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsLoading(true)
    timeoutRef.current = setTimeout(() => setIsLoading(false), 2000)
  }

  function stopLoading() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsLoading(false)
  }

  // Hentikan loading saat pathname berubah (navigasi selesai)
  useEffect(() => {
    stopLoading()
  }, [pathname])

  // Intercept klik pada elemen <a> internal
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Skip jika modifier key ditekan (buka tab baru, dll)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return

      // Skip link eksternal
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) return

      // Skip link download
      if (anchor.hasAttribute("download")) return

      // Skip target="_blank"
      if (anchor.target === "_blank") return

      // Skip hash-only link
      if (href.startsWith("#")) return

      // Parse URL untuk cek pathname
      try {
        const url = new URL(href, window.location.origin)

        // Skip jika link ke halaman yang sama (hanya hash berbeda)
        if (url.pathname === window.location.pathname && url.search === window.location.search) return

        startLoading()
      } catch {
        // Jika URL tidak valid, abaikan
      }
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => document.removeEventListener("click", handleClick, { capture: true })
  }, [])

  return (
    <NavigationContext.Provider value={{ startLoading, stopLoading }}>
      {children}

      {/* Overlay loading — z-[9999] agar di atas Header (z-50) */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200 bg-primary-700/85 ${
          isLoading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isLoading}
      >
        <div className="backdrop-blur-sm absolute inset-0" />
        <div className="relative flex flex-col items-center gap-4 bg-primary rounded-2xl px-10 py-8 shadow-2xl">
          {/* Spinner */}
          <svg
            className="w-12 h-12 animate-spin text-accent"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>

          <span className="text-sm font-medium text-primary-100 tracking-wide">
            Memuat halaman…
          </span>
        </div>
      </div>
    </NavigationContext.Provider>
  )
}
