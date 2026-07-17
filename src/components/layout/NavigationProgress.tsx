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

// Navigasi client-side biasanya instan — bar hanya muncul jika transisi
// melewati ambang ini, supaya tidak berkedip pada navigasi cepat.
const SHOW_DELAY_MS = 150
// Failsafe: sembunyikan bar jika navigasi tidak pernah menyelesaikan pathname.
const FAILSAFE_MS = 8000

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(false)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  function clearTimers() {
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    if (failsafeRef.current) clearTimeout(failsafeRef.current)
  }

  function startLoading() {
    clearTimers()
    showTimerRef.current = setTimeout(() => setIsLoading(true), SHOW_DELAY_MS)
    failsafeRef.current = setTimeout(() => setIsLoading(false), FAILSAFE_MS)
  }

  function stopLoading() {
    clearTimers()
    setIsLoading(false)
  }

  // Hentikan loading saat pathname berubah (navigasi selesai)
  useEffect(() => {
    stopLoading()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <NavigationContext.Provider value={{ startLoading, stopLoading }}>
      {children}

      {/* Progress bar tipis di tepi atas — tidak memblokir konten */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-progress h-0.5 bg-secondary-100"
        >
          <div className="nav-progress-bar h-full bg-secondary" />
          <span className="sr-only">Memuat halaman…</span>
        </div>
      )}
    </NavigationContext.Provider>
  )
}
