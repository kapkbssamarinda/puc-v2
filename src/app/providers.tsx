"use client"

import { SessionProvider } from "next-auth/react"
import { NavigationProgressProvider } from "@/components/layout/NavigationProgress"
import { useIdleLogout } from "@/lib/useIdleLogout"

function IdleLogoutWatcher() {
  useIdleLogout()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <IdleLogoutWatcher />
      <NavigationProgressProvider>{children}</NavigationProgressProvider>
    </SessionProvider>
  )
}
