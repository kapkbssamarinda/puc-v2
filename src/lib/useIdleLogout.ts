"use client"

import { useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"

const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const CHECK_INTERVAL_MS = 15_000
const ACTIVITY_WRITE_THROTTLE_MS = 5_000
const STORAGE_KEY = "puc:lastActivityAt"
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "wheel"] as const

/**
 * Auto-logout setelah tidak ada aktivitas selama IDLE_TIMEOUT_MS.
 * Aman multi-tab: staleness selalu dicek dari localStorage (dibagi antar tab
 * dari origin yang sama), bukan timer in-memory per tab, jadi aktivitas di
 * satu tab mencegah tab lain yang idle melakukan logout keliru.
 */
export function useIdleLogout() {
  const { status } = useSession()
  const lastWriteRef = useRef(0)

  useEffect(() => {
    if (status !== "authenticated") return

    let intervalId: ReturnType<typeof setInterval> | null = null

    function isStale(): boolean {
      const stored = Number(localStorage.getItem(STORAGE_KEY))
      if (!stored) return false
      return Date.now() - stored >= IDLE_TIMEOUT_MS
    }

    function logout() {
      if (intervalId) clearInterval(intervalId)
      signOut({ callbackUrl: "/login?error=idle" })
    }

    function checkNow() {
      if (isStale()) logout()
    }

    function markActivity() {
      const now = Date.now()
      if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return
      lastWriteRef.current = now
      localStorage.setItem(STORAGE_KEY, String(now))
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") checkNow()
    }

    // Login baru di browser ini: mulai hitung dari sekarang. Kalau timestamp
    // sudah ada dan sudah basi, langsung logout tanpa memasang listener —
    // sekadar membuka/refresh tab tidak boleh mereset jam idle.
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } else if (isStale()) {
      logout()
      return
    }

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }))
    document.addEventListener("visibilitychange", onVisibilityChange)
    intervalId = setInterval(checkNow, CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, markActivity))
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (intervalId) clearInterval(intervalId)
    }
  }, [status])
}
