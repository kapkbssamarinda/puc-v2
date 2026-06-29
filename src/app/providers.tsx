"use client"

import { SessionProvider } from "next-auth/react"
import { NavigationProgressProvider } from "@/components/layout/NavigationProgress"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavigationProgressProvider>{children}</NavigationProgressProvider>
    </SessionProvider>
  )
}
